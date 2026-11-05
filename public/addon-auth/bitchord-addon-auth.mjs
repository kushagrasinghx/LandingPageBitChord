// BitChord addon auth — request verifier for addon servers.
//
// Accepts a request only when it comes from the official BitChord app (signed
// with BitChord's release key, on a device with an untampered OS). Forks,
// other apps, scripts and browsers are refused.
//
// Zero dependencies. Uses only WebCrypto, so the same file runs on Node 20+,
// Cloudflare Workers, Deno, Bun and Vercel/Netlify edge functions.
//
//   import { createBitChordAuth } from './bitchord-addon-auth.mjs';
//   const auth = createBitChordAuth({ hosts: ['myaddon.example.com'] });
//
//   // Express:                    app.use(['/search', '/stream'], auth.express());
//   // Workers / Hono / Deno / Bun: const denied = await auth.guard(request); if (denied) return denied;
//   // Anything else:              const r = await auth.verify({ token, proof }); if (!r.ok) ...
//
// Protocol version 1. Full guide: "Addon auth" in the BitChord addon docs.

export const BITCHORD_AUTH_ISSUER = 'https://bitchord-auth.kushagrasingh.in';
export const BITCHORD_AUTH_AUDIENCE = 'bitchord-addons';
export const TOKEN_HEADER = 'x-bitchord-token';
export const PROOF_HEADER = 'x-bitchord-proof';
const PROOF_CONTEXT = 'bitchord-addon-proof/v1';

const subtle = globalThis.crypto?.subtle;
const enc = new TextEncoder();

function b64urlDecode(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlEncode(bytes) {
  let bin = '';
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const decodeJson = (s) => JSON.parse(new TextDecoder().decode(b64urlDecode(s)));

const normHost = (h) => String(h).trim().toLowerCase().replace(/^\[|\]$/g, '').replace(/:\d+$/, '').replace(/\.$/, '');

const fail = (status, error, message) => ({ ok: false, status, error, message });

/**
 * @param {object}   options
 * @param {string[]} options.hosts  REQUIRED. Hostname(s) BitChord users reach your addon at, exactly as in the
 *                                  addon URL they paste (no scheme, no port), e.g. ['myaddon.example.com'].
 * @param {number}   [options.maxProofAgeSeconds=120]
 * @param {number}   [options.clockSkewSeconds=60]
 */
export function createBitChordAuth(options = {}) {
  if (!subtle) throw new Error('bitchord-addon-auth needs WebCrypto (globalThis.crypto.subtle)');
  const hosts = [...new Set((options.hosts ?? []).map(normHost).filter(Boolean))];
  if (hosts.length === 0) {
    throw new Error('bitchord-addon-auth: `hosts` is required, e.g. createBitChordAuth({ hosts: ["myaddon.example.com"] })');
  }
  const issuer = options.issuer ?? BITCHORD_AUTH_ISSUER;
  const jwksUrl = options.jwksUrl ?? `${issuer}/.well-known/jwks.json`;
  const maxProofAgeMs = (options.maxProofAgeSeconds ?? 120) * 1000;
  const skewS = options.clockSkewSeconds ?? 60;
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  const now = options.now ?? (() => Date.now());

  // ── Signing keys (JWKS), cached for an hour; refetched early for an unknown kid at most every 5 min.
  let keys = new Map();
  let keysAt = 0;
  let lastForced = 0;
  let loading = null;

  async function loadKeys() {
    const res = await fetchImpl(jwksUrl, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`JWKS HTTP ${res.status}`);
    const { keys: list } = await res.json();
    const next = new Map();
    for (const jwk of list ?? []) {
      if (jwk.kty !== 'OKP' || jwk.crv !== 'Ed25519' || !jwk.kid || !jwk.x) continue;
      next.set(jwk.kid, await subtle.importKey('jwk', { kty: 'OKP', crv: 'Ed25519', x: jwk.x }, { name: 'Ed25519' }, false, ['verify']));
    }
    keys = next;
    keysAt = now();
  }

  async function keyFor(kid) {
    const stale = now() - keysAt > 60 * 60 * 1000;
    const unknown = !keys.has(kid) && now() - lastForced > 5 * 60 * 1000;
    if (stale || unknown) {
      if (unknown) lastForced = now();
      loading ??= loadKeys().finally(() => (loading = null));
      try {
        await loading;
      } catch (e) {
        if (keys.size === 0) throw e; // never loaded: cannot verify anything
      }
    }
    return keys.get(kid);
  }

  // ── Device keys from the token's cnf claim, cached by value.
  const deviceKeys = new Map();
  async function deviceKey(jwk) {
    const id = `${jwk.x}.${jwk.y}`;
    let key = deviceKeys.get(id);
    if (!key) {
      key = await subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      if (deviceKeys.size > 10_000) deviceKeys.clear();
      deviceKeys.set(id, key);
    }
    return key;
  }

  /**
   * @returns {Promise<{ok:true, claims:{sub:string, ver:number, exp:number, sl:string}} | {ok:false, status:number, error:string, message:string}>}
   *   `claims.sub` is a per-install key id, stable for the token's lifetime: use it for rate limiting.
   */
  async function verify({ token, proof }) {
    if (!token || !proof) return fail(401, 'missing', 'This addon only works in the official BitChord app');
    try {
      const parts = String(token).split('.');
      if (parts.length !== 3) return fail(401, 'invalid_token', 'Malformed token');
      const header = decodeJson(parts[0]);
      const claims = decodeJson(parts[1]);
      if (header.alg !== 'EdDSA' || typeof header.kid !== 'string') return fail(401, 'invalid_token', 'Unsupported token');

      let signingKey;
      try {
        signingKey = await keyFor(header.kid);
      } catch {
        return fail(503, 'unavailable', 'Could not load BitChord signing keys; try again shortly');
      }
      if (!signingKey) return fail(401, 'invalid_token', 'Token signed by an unknown key');
      const signedOk = await subtle.verify({ name: 'Ed25519' }, signingKey, b64urlDecode(parts[2]), enc.encode(`${parts[0]}.${parts[1]}`));
      if (!signedOk) return fail(401, 'invalid_token', 'Token signature is invalid');

      const t = Math.floor(now() / 1000);
      const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
      if (claims.iss !== issuer || !aud.includes(BITCHORD_AUTH_AUDIENCE)) return fail(401, 'invalid_token', 'Token is not for BitChord addons');
      if (typeof claims.exp !== 'number' || claims.exp + skewS < t) return fail(401, 'expired', 'Token expired');
      if (typeof claims.iat !== 'number' || claims.iat - skewS > t) return fail(401, 'invalid_token', 'Token issued in the future');
      const jwk = claims.cnf?.jwk;
      if (jwk?.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.x || !jwk.y) return fail(401, 'invalid_token', 'Token is not bound to a device key');

      const m = /^v1\.(\d{10,16})\.([A-Za-z0-9_-]{86})$/.exec(String(proof));
      if (!m) return fail(401, 'invalid_proof', 'Malformed proof');
      const ts = Number(m[1]);
      if (Math.abs(now() - ts) > maxProofAgeMs) return fail(401, 'stale_proof', 'Proof is too old; check the device clock');

      const ath = b64urlEncode(await subtle.digest('SHA-256', enc.encode(token)));
      const key = await deviceKey(jwk);
      const signature = b64urlDecode(m[2]);
      for (const host of hosts) {
        const message = enc.encode(`${PROOF_CONTEXT}\n${host}\n${m[1]}\n${ath}`);
        if (await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, signature, message)) {
          return { ok: true, claims: { sub: claims.sub, ver: claims.ver, exp: claims.exp, sl: claims.sl } };
        }
      }
      return fail(401, 'invalid_proof', 'Proof signature is invalid for this addon');
    } catch {
      return fail(401, 'invalid_token', 'Malformed credentials');
    }
  }

  const headerOf = (headers, name) =>
    typeof headers?.get === 'function' ? headers.get(name) : [headers?.[name]].flat()[0];

  /** Verifies a Fetch API Request, a Node IncomingMessage, or anything with `headers`. */
  function verifyRequest(req) {
    return verify({ token: headerOf(req.headers, TOKEN_HEADER), proof: headerOf(req.headers, PROOF_HEADER) });
  }

  /** Headers + JSON body to send back with a failed result. BitChord reads these to refresh or explain. */
  function rejection(result) {
    const description = String(result.message).replace(/["\\]/g, '');
    return {
      status: result.status,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
        'www-authenticate': `BitChord realm="${BITCHORD_AUTH_AUDIENCE}", error="${result.error}", error_description="${description}"`,
      },
      body: JSON.stringify({ error: 'bitchord_auth', code: result.error, message: result.message }),
    };
  }

  /** Express / Connect middleware. On success sets `req.bitchord = claims`. */
  function express() {
    return async (req, res, next) => {
      const result = await verifyRequest(req);
      if (result.ok) {
        req.bitchord = result.claims;
        return next();
      }
      const r = rejection(result);
      res.status(r.status).set(r.headers).send(r.body);
    };
  }

  /** For Fetch-style handlers: returns a 401/503 Response to send, or null when the request is allowed. */
  async function guard(request) {
    const result = await verifyRequest(request);
    if (result.ok) return null;
    const r = rejection(result);
    return new Response(r.body, { status: r.status, headers: r.headers });
  }

  return { verify, verifyRequest, rejection, express, guard };
}
