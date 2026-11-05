# BitChord addon auth: implementation brief for an AI coding assistant

> **To the AI reading this:** you are updating a BitChord addon server so that it
> only answers the official BitChord Android app. Everything you need is in this
> file, including the complete verifier source code. Follow the steps in order,
> and don't skip the acceptance checks at the end. If the human hasn't told you
> the public hostname(s) of their addon, **ask them**: it's the one value you
> can't infer from the code, and getting it wrong breaks every request.

Source: https://bitchord.kushagrasingh.in/docs#addon-auth (protocol version 1)

---

## 1. Why this is required

- From BitChord 1.9.1, the app only uses addons whose `manifest.json`
  declares `"bitchordAuth": true`. Any other addon (including one with no
  manifest) shows on the user's Sources screen as **"This addon is out of date,
  so BitChord can't use it. Ask its developer to update it by following the
  latest BitChord addon docs."** BitChord doesn't search, stream or download
  from it until it's updated.
- The flag alone makes the addon usable again, but it doesn't protect it. The
  point of addon auth is that the server **verifies** every request, so forks of
  BitChord, other apps, scripts, `curl` and browsers get `401`.
- BitChord is open source, so a User-Agent, client name or API key can be copied
  into a fork. What a fork can't copy is BitChord's release signing key. The
  phone's secure hardware proves (via Google-signed Android key attestation)
  that the request comes from the release-signed app on an untampered phone.

## 2. How it works (what you are verifying)

1. The app creates a key inside the phone's secure hardware (TEE/StrongBox).
2. BitChord's auth service (`https://bitchord-auth.kushagrasingh.in`) checks Google-signed proof that the
   key belongs to the official, release-signed BitChord on a phone with a
   verified, locked OS. It issues a 1-hour Ed25519 JWT bound to that key.
3. Every request to an addon carries two headers:
   - `X-BitChord-Token: <JWT>`
   - `X-BitChord-Proof: v1.<unix-ms>.<base64url signature>`, a fresh ECDSA
     signature by the hardware key over the addon's hostname, the time and a
     hash of the token.
4. The addon checks both **offline**, in under a millisecond. It downloads
   BitChord's public keys (`https://bitchord-auth.kushagrasingh.in/.well-known/jwks.json`) about once an
   hour and never calls the auth service per request.

A token copied off a phone is useless without the hardware key, and a proof is
bound to one hostname, so one addon can't replay what it receives to another.

## 3. Tasks

Do all of these.

### Task 1: declare the flag in `manifest.json`

```json
{
  "id": "com.example.myaddon",
  "name": "My Addon",
  "version": "1.2.0",
  "resources": ["search", "stream"],
  "bitchordAuth": true
}
```

- `true`, `1`, `"true"` and `"1"` are all accepted. `false` or a missing key
  means the addon is out of date.
- **`/manifest.json` must stay public** (no auth check). BitChord reads it
  without credentials to learn that it needs to authenticate. If the addon
  serves the manifest under a path prefix (e.g. `/<token>/manifest.json`), the
  rule is the same: any path ending in `/manifest.json` stays public.

### Task 2: add the verifier file to the project

Pick by stack. Copy the file **verbatim** from section 6 of this brief (or
download it from the URLs below). Don't rewrite it and don't add dependencies.

| Stack | File | Needs |
|---|---|---|
| Node 20+, Express, Fastify, Koa, Hono, Next.js, Cloudflare Workers, Deno, Bun, Vercel/Netlify edge | `bitchord-addon-auth.mjs` | nothing (WebCrypto only) |
| Python 3.9+ (FastAPI, Flask, Django, Starlette, anything) | `bitchord_addon_auth.py` | `pip install cryptography` |
| Anything else (Go, Rust, PHP, Java…) | port it using the protocol in section 5 | an Ed25519 + ECDSA P-256 library |

Downloads: https://bitchord.kushagrasingh.in/addon-auth/bitchord-addon-auth.mjs and
https://bitchord.kushagrasingh.in/addon-auth/bitchord_addon_auth.py

For TypeScript projects, import the `.mjs` as is; if the project forbids JS,
add `// @ts-nocheck` handling or a `.d.ts` shim rather than rewriting the logic.

### Task 3: protect every route except the manifest

Create **one** verifier instance per process, at module scope, and run it
before every route except `manifest.json`: search, stream, catalogue, lyrics,
anything else the addon exposes.

`hosts` must list the **public hostname(s) users put in the addon URL**:
lowercase, no scheme, no port, no path. The app signs each request for the host
in the URL the user pasted. The verifier ignores the `Host` header and only
trusts the hostnames you configure, so a wrong `hosts` value makes every request fail with `invalid_proof`.

| User pastes | `hosts` |
|---|---|
| `https://myaddon.example.com/manifest.json` | `['myaddon.example.com']` |
| `https://myaddon.example.com:8443/abc123/manifest.json` | `['myaddon.example.com']` |
| Custom domain and `*.workers.dev` / `*.onrender.com` / `*.vercel.app` both in use | list every one |

Read hosts from configuration (e.g. env `BITCHORD_HOSTS="a.example.com,b.example.com"`)
when the addon is deployed under more than one name.

**Express**

```js
import express from 'express';
import { createBitChordAuth } from './bitchord-addon-auth.mjs';

const app = express();
const bitchord = createBitChordAuth({ hosts: ['myaddon.example.com'] });

app.get('/manifest.json', (req, res) => res.json(manifest)); // stays public
app.use(bitchord.express());                                  // everything below needs BitChord

app.get('/search', async (req, res) => { /* ... */ });
app.get('/stream/:id', async (req, res) => { /* ... */ });
```

`req.bitchord` holds the claims on success. Register the manifest route
**before** `app.use(bitchord.express())`.

**Cloudflare Workers / Deno / Bun / any Fetch-API handler**

```js
import { createBitChordAuth } from './bitchord-addon-auth.mjs';

// Module scope, so the key cache is shared between requests.
const bitchord = createBitChordAuth({ hosts: ['myaddon.example.com', 'myaddon.me.workers.dev'] });

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/manifest.json')) return Response.json(manifest);

    const denied = await bitchord.guard(request); // a 401/503 Response, or null
    if (denied) return denied;

    // ... /search and /stream handling
  },
};
```

**Hono**

```js
app.use('*', async (c, next) =>
  c.req.path.endsWith('/manifest.json') ? next() : (await bitchord.guard(c.req.raw)) ?? next());
```

**Next.js (App Router route handlers)**

```js
// lib/bitchord.js
import { createBitChordAuth } from './bitchord-addon-auth.mjs';
export const bitchord = createBitChordAuth({ hosts: ['myaddon.example.com'] });

// app/search/route.js
import { bitchord } from '@/lib/bitchord';
export async function GET(request) {
  const denied = await bitchord.guard(request);
  if (denied) return denied;
  // ...
}
```

**Fastify**

```js
fastify.addHook('onRequest', async (req, reply) => {
  if (req.url.split('?')[0].endsWith('/manifest.json')) return;
  const result = await bitchord.verifyRequest(req.raw);
  if (!result.ok) {
    const r = bitchord.rejection(result);
    return reply.code(r.status).headers(r.headers).send(r.body);
  }
  req.bitchord = result.claims;
});
```

**FastAPI**

```python
from fastapi import Depends, FastAPI, Request
from fastapi.responses import Response
from bitchord_addon_auth import BitChordAuth

app = FastAPI()
bitchord = BitChordAuth(hosts=["myaddon.example.com"])

class Denied(Exception):
    def __init__(self, result): self.result = result

@app.exception_handler(Denied)
async def denied(_, exc: Denied):
    return Response(exc.result.body, status_code=exc.result.status, headers=exc.result.headers)

def require_bitchord(request: Request):
    result = bitchord.verify_headers(request.headers)
    if not result.ok:
        raise Denied(result)
    return result.claims

@app.get("/manifest.json")
def get_manifest(): return MANIFEST            # stays public

@app.get("/search")
def search(q: str, claims=Depends(require_bitchord)): ...

@app.get("/stream/{track_id}")
def stream(track_id: str, claims=Depends(require_bitchord)): ...
```

`verify_headers` makes a blocking request about once an hour to refresh keys,
which is fine in FastAPI's sync (`def`) dependencies (they run in a thread pool).
In an `async def` route, call it via `await run_in_threadpool(...)`.

**Flask**

```python
from flask import Flask, request, Response, g
from bitchord_addon_auth import BitChordAuth

app = Flask(__name__)
bitchord = BitChordAuth(hosts=["myaddon.example.com"])

@app.before_request
def require_bitchord():
    if request.path.endswith("/manifest.json"):
        return None
    result = bitchord.verify_headers(request.headers)
    if not result.ok:
        return Response(result.body, status=result.status, headers=result.headers)
    g.bitchord = result.claims
```

**Django** (middleware)

```python
from django.http import HttpResponse
from bitchord_addon_auth import BitChordAuth

bitchord = BitChordAuth(hosts=["myaddon.example.com"])

class BitChordAuthMiddleware:
    def __init__(self, get_response): self.get_response = get_response
    def __call__(self, request):
        if request.path.endswith("/manifest.json"):
            return self.get_response(request)
        result = bitchord.verify_headers(request.headers)
        if not result.ok:
            response = HttpResponse(result.body, status=result.status)
            for k, v in result.headers.items(): response[k] = v
            return response
        request.bitchord = result.claims
        return self.get_response(request)
```

Always send rejections with the helpers (`express()`, `guard()`,
`rejection()`, `result.headers` / `result.body`). BitChord reads the
`WWW-Authenticate: BitChord …` header to decide whether to refresh its token,
retry, or show an error. A plain `401` without it is treated as a generic failure.

### Task 4: make media URLs short-lived

Auth protects the JSON endpoints. The audio URL returned by `/stream` is then
fetched by the player **without** the BitChord headers. A permanent media URL
can be shared and used anywhere.

- Return signed URLs that expire. Use **15–30 minutes**, never less than 5:
  BitChord caches a stream answer for 5 minutes, and a long track that is
  paused and resumed fetches the URL again.
- If audio comes from a storage provider (S3, R2, GCS, B2…), use its pre-signed
  URL feature with that expiry.
- If the addon proxies audio itself, put an HMAC signature in the query string
  and check it on the media route:

```js
import crypto from 'node:crypto';
const MEDIA_SECRET = process.env.MEDIA_SECRET; // long random string, server-side only

export function signedMediaUrl(id, ttlSeconds = 1800) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = crypto.createHmac('sha256', MEDIA_SECRET).update(`${id}.${exp}`).digest('base64url');
  return `https://myaddon.example.com/media/${encodeURIComponent(id)}?exp=${exp}&sig=${sig}`;
}

export function mediaAllowed(id, exp, sig) {
  if (!/^\d+$/.test(String(exp)) || Number(exp) < Date.now() / 1000) return false;
  const want = crypto.createHmac('sha256', MEDIA_SECRET).update(`${id}.${exp}`).digest();
  const got = Buffer.from(String(sig ?? ''), 'base64url');
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}
```

- **Don't** require the `X-BitChord-*` headers on the media route itself. The
  player doesn't send them, and playback would fail.

### Task 5: roll out without breaking users

1. Deploy with the flag **and** the verifier in **log-only** mode: verify, log
   failures, but still serve the request.
   ```js
   const result = await bitchord.verifyRequest(req);
   if (!result.ok) console.log('bitchord-auth would refuse:', result.error);
   // ...serve the request anyway
   ```
2. After a few days, check the logs. `invalid_proof` should be near zero; if
   it isn't, `hosts` is wrong. `missing` is expected: it's every client that
   isn't BitChord.
3. Switch to blocking (Task 3 as written).

Leave a comment or config switch (e.g. env `BITCHORD_AUTH_MODE=log|enforce`) so
the human can choose; default to `enforce` once they confirm.

## 4. Acceptance checks

Run these against the deployed addon (replace the host):

```bash
# Manifest: public, declares the flag
curl -s https://myaddon.example.com/manifest.json | grep -o '"bitchordAuth": *[^,}]*'

# Without BitChord: refused with the BitChord challenge
curl -si 'https://myaddon.example.com/search?q=test' | head -5
# HTTP/1.1 401
# www-authenticate: BitChord realm="bitchord-addons", error="missing", ...

# Same for stream and every other route
curl -si https://myaddon.example.com/stream/anything | head -1   # 401

# Forged headers are refused too
curl -si -H 'X-BitChord-Token: x.y.z' -H 'X-BitChord-Proof: v1.0.x' \
  'https://myaddon.example.com/search?q=test' | head -1           # 401

# Media URLs: work without BitChord headers, and expire
```

Then the human adds the addon in the official BitChord app (Settings →
Sources → Add an addon) and plays a track. The row must not say "out of date",
and search and playback must work. In the app's logs a refusal shows as
`didn't accept BitChord's verification (<code>)`.

Checklist:

- [ ] `manifest.json` declares `"bitchordAuth": true` and needs no credentials
- [ ] Every other route runs the verifier (one instance, module scope)
- [ ] `hosts` lists every public hostname of the addon, no scheme/port/path
- [ ] Rejections are sent with the helper (status + `WWW-Authenticate` + JSON body)
- [ ] Media URLs are signed and expire in 15–30 minutes; the media route doesn't require BitChord headers
- [ ] No other auth scheme (API key, User-Agent check) is needed or relied on any more
- [ ] The verifier file is unmodified

## 5. Reference

### Error codes

Every refusal is `401` (or `503`) with
`WWW-Authenticate: BitChord realm="bitchord-addons", error="<code>"` and a JSON
body `{"error":"bitchord_auth","code":"<code>","message":"..."}`.

| Code | Status | Meaning | What BitChord does |
|---|---|---|---|
| `missing` | 401 | No credentials: a fork, script, browser, or BitChord before its first authenticated request | Attaches credentials and retries |
| `expired` | 401 | Token past its expiry | Gets a new token, retries once |
| `invalid_token` | 401 | Token malformed, tampered with, or not signed by BitChord | Gets a new token, retries once |
| `invalid_proof` | 401 | Signature doesn't match: wrong `hosts`, or a token used without its hardware key | Shows an error |
| `stale_proof` | 401 | Proof older than 2 minutes: **the addon server's** clock is wrong (the app corrects its own) | Shows an error |
| `unavailable` | 503 | The addon couldn't download BitChord's public keys on first use | Treated as a temporary outage |

### Claims on success

| Field | Meaning |
|---|---|
| `sub` | Random id of this install's hardware key. Changes when the token refreshes (about hourly). Use it with the IP for rate limiting. Not a user identity. |
| `ver` | BitChord's version code, e.g. `37`. Use it to require a minimum app version. |
| `exp` | Token expiry, Unix seconds. |
| `sl` | `tee` or `strongbox`: where the key is held. |

No account, email, device id or IMEI is ever sent.

### Protocol (for porting to another language)

Request headers (sent only to addons that opt in, only over HTTPS):

```
X-BitChord-Token: <JWT>
X-BitChord-Proof: v1.<unix-ms>.<base64url signature, 64 bytes>
```

Token: a compact JWT signed with Ed25519 (`alg: EdDSA`, header `kid`).

- Public keys: `https://bitchord-auth.kushagrasingh.in/.well-known/jwks.json` (OKP / Ed25519). Cache for 1
  hour; refetch early on an unknown `kid`, at most every 5 minutes. If keys were
  never loaded, answer `503 unavailable`.
- Required claims: `iss` = `https://bitchord-auth.kushagrasingh.in`, `aud` contains `bitchord-addons`,
  `exp` in the future and `iat` not in the future (allow 60 s of skew).
- `cnf.jwk`: the device public key `{ "kty": "EC", "crv": "P-256", "x": …, "y": … }`.

Proof: an ECDSA P-256 / SHA-256 signature by the `cnf.jwk` key, in raw
`r || s` form (64 bytes, as in JOSE/WebCrypto, **not** DER), over these UTF-8 bytes:

```
bitchord-addon-proof/v1\n<host>\n<unix-ms>\n<base64url(SHA-256(token))>
```

- `<host>` is one of the addon's **configured** hostnames, never taken from the request.
- `<unix-ms>` must be within ±120 s of the server clock.
- base64url without padding; `\n` is a single line feed.
- Accept if the signature verifies for any configured host.

Verification order: parse token → check `alg`/`kid` → load key → verify Ed25519
signature over `header.payload` → check `iss`, `aud`, `exp`, `iat` → check
`cnf.jwk` → parse proof (`^v1\.(\d{10,16})\.([A-Za-z0-9_-]{86})$`) → check
time window → verify ECDSA for each host. Any failure is a refusal with the
code from the table above. The reference implementations below are
authoritative.

### Things that are true and worth telling the human

- Only the official BitChord **Android** app can authenticate. BitChord
  desktop/web can't prove they're genuine, so once the addon blocks, those
  clients can't use it.
- Phones with an unlocked bootloader or a modified OS (rooted, custom ROM),
  emulators, and phones without hardware-backed key storage are refused by
  BitChord's auth service and so never get a token.
- No registration, account or API key is needed. Any addon can verify BitChord
  tokens; the flag and the verifier are the whole integration.

## 6. Verifier source code (copy verbatim)

### `bitchord-addon-auth.mjs`

```js
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
```

### `bitchord_addon_auth.py`

```python
"""BitChord addon auth: request verifier for Python addon servers.

Accepts a request only when it comes from the official BitChord app (signed
with BitChord's release key, on a device with an untampered OS). Forks, other
apps, scripts and browsers are refused.

Needs one package:  pip install cryptography
Python 3.9+.

    from bitchord_addon_auth import BitChordAuth
    auth = BitChordAuth(hosts=["myaddon.example.com"])

    result = auth.verify_headers(request.headers)
    if not result.ok:
        return Response(result.body, status=result.status, headers=result.headers)

Protocol version 1. Full guide: "Addon auth" in the BitChord addon docs.
"""

import base64
import hashlib
import json
import re
import threading
import time
import urllib.request
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, Iterable, Mapping, Optional

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature

BITCHORD_AUTH_ISSUER = "https://bitchord-auth.kushagrasingh.in"
BITCHORD_AUTH_AUDIENCE = "bitchord-addons"
TOKEN_HEADER = "X-BitChord-Token"
PROOF_HEADER = "X-BitChord-Proof"
_PROOF_CONTEXT = "bitchord-addon-proof/v1"
_PROOF_RE = re.compile(r"^v1\.(\d{10,16})\.([A-Za-z0-9_-]{86})$")


def _b64d(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _b64e(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def _norm_host(h: str) -> str:
    h = h.strip().lower().strip("[]").rstrip(".")
    return re.sub(r":\d+$", "", h)


@dataclass
class Result:
    ok: bool
    status: int = 200
    error: str = ""
    message: str = ""
    claims: Dict[str, Any] = field(default_factory=dict)

    @property
    def headers(self) -> Dict[str, str]:
        """Headers to send with a rejection. BitChord reads WWW-Authenticate to refresh or explain."""
        if self.ok:
            return {}
        desc = self.message.replace('"', "").replace("\\", "")
        return {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
            "WWW-Authenticate": f'BitChord realm="{BITCHORD_AUTH_AUDIENCE}", error="{self.error}", error_description="{desc}"',
        }

    @property
    def body(self) -> str:
        return json.dumps({"error": "bitchord_auth", "code": self.error, "message": self.message})


def _fail(status: int, error: str, message: str) -> Result:
    return Result(ok=False, status=status, error=error, message=message)


def _default_get_json(url: str) -> Any:
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "bitchord-addon-auth-py/1"})
    with urllib.request.urlopen(req, timeout=10) as res:
        return json.loads(res.read())


class BitChordAuth:
    """Thread-safe; create one per process and reuse it."""

    def __init__(
        self,
        hosts: Iterable[str],
        issuer: str = BITCHORD_AUTH_ISSUER,
        jwks_url: Optional[str] = None,
        max_proof_age_seconds: int = 120,
        clock_skew_seconds: int = 60,
        get_json: Callable[[str], Any] = _default_get_json,
        now: Callable[[], float] = time.time,
    ):
        self.hosts = sorted({_norm_host(h) for h in hosts if h and h.strip()})
        if not self.hosts:
            raise ValueError('BitChordAuth: hosts is required, e.g. BitChordAuth(hosts=["myaddon.example.com"])')
        self.issuer = issuer
        self.jwks_url = jwks_url or f"{issuer}/.well-known/jwks.json"
        self.max_proof_age_ms = max_proof_age_seconds * 1000
        self.skew = clock_skew_seconds
        self._get_json = get_json
        self._now = now
        self._lock = threading.Lock()
        self._keys: Dict[str, Ed25519PublicKey] = {}
        self._keys_at = 0.0
        self._last_forced = 0.0
        self._device_keys: Dict[str, ec.EllipticCurvePublicKey] = {}

    # ── Signing keys (JWKS): cached an hour; refetched early for an unknown kid at most every 5 min.
    def _key_for(self, kid: str) -> Optional[Ed25519PublicKey]:
        now = self._now()
        stale = now - self._keys_at > 3600
        unknown = kid not in self._keys and now - self._last_forced > 300
        if stale or unknown:
            with self._lock:
                if unknown:
                    self._last_forced = now
                try:
                    doc = self._get_json(self.jwks_url)
                    keys = {}
                    for jwk in doc.get("keys", []):
                        if jwk.get("kty") == "OKP" and jwk.get("crv") == "Ed25519" and jwk.get("kid") and jwk.get("x"):
                            keys[jwk["kid"]] = Ed25519PublicKey.from_public_bytes(_b64d(jwk["x"]))
                    self._keys, self._keys_at = keys, now
                except Exception:
                    if not self._keys:
                        raise
        return self._keys.get(kid)

    def _device_key(self, jwk: Mapping[str, str]) -> ec.EllipticCurvePublicKey:
        cache_id = f"{jwk['x']}.{jwk['y']}"
        key = self._device_keys.get(cache_id)
        if key is None:
            x = int.from_bytes(_b64d(jwk["x"]), "big")
            y = int.from_bytes(_b64d(jwk["y"]), "big")
            key = ec.EllipticCurvePublicNumbers(x, y, ec.SECP256R1()).public_key()
            if len(self._device_keys) > 10_000:
                self._device_keys.clear()
            self._device_keys[cache_id] = key
        return key

    def verify(self, token: Optional[str], proof: Optional[str]) -> Result:
        """`result.claims["sub"]` is a per-install key id, stable for the token's lifetime: use it for rate limiting."""
        if not token or not proof:
            return _fail(401, "missing", "This addon only works in the official BitChord app")
        try:
            parts = token.split(".")
            if len(parts) != 3:
                return _fail(401, "invalid_token", "Malformed token")
            header = json.loads(_b64d(parts[0]))
            claims = json.loads(_b64d(parts[1]))
            if header.get("alg") != "EdDSA" or not isinstance(header.get("kid"), str):
                return _fail(401, "invalid_token", "Unsupported token")

            try:
                signing_key = self._key_for(header["kid"])
            except Exception:
                return _fail(503, "unavailable", "Could not load BitChord signing keys; try again shortly")
            if signing_key is None:
                return _fail(401, "invalid_token", "Token signed by an unknown key")
            try:
                signing_key.verify(_b64d(parts[2]), f"{parts[0]}.{parts[1]}".encode())
            except InvalidSignature:
                return _fail(401, "invalid_token", "Token signature is invalid")

            t = int(self._now())
            aud = claims.get("aud")
            auds = aud if isinstance(aud, list) else [aud]
            if claims.get("iss") != self.issuer or BITCHORD_AUTH_AUDIENCE not in auds:
                return _fail(401, "invalid_token", "Token is not for BitChord addons")
            if not isinstance(claims.get("exp"), (int, float)) or claims["exp"] + self.skew < t:
                return _fail(401, "expired", "Token expired")
            if not isinstance(claims.get("iat"), (int, float)) or claims["iat"] - self.skew > t:
                return _fail(401, "invalid_token", "Token issued in the future")
            jwk = (claims.get("cnf") or {}).get("jwk") or {}
            if jwk.get("kty") != "EC" or jwk.get("crv") != "P-256" or not jwk.get("x") or not jwk.get("y"):
                return _fail(401, "invalid_token", "Token is not bound to a device key")

            m = _PROOF_RE.match(proof)
            if not m:
                return _fail(401, "invalid_proof", "Malformed proof")
            ts = int(m.group(1))
            if abs(self._now() * 1000 - ts) > self.max_proof_age_ms:
                return _fail(401, "stale_proof", "Proof is too old; check the device clock")

            raw = _b64d(m.group(2))
            der = encode_dss_signature(int.from_bytes(raw[:32], "big"), int.from_bytes(raw[32:], "big"))
            ath = _b64e(hashlib.sha256(token.encode()).digest())
            key = self._device_key(jwk)
            for host in self.hosts:
                message = f"{_PROOF_CONTEXT}\n{host}\n{m.group(1)}\n{ath}".encode()
                try:
                    key.verify(der, message, ec.ECDSA(hashes.SHA256()))
                    return Result(ok=True, claims={k: claims.get(k) for k in ("sub", "ver", "exp", "sl")})
                except InvalidSignature:
                    continue
            return _fail(401, "invalid_proof", "Proof signature is invalid for this addon")
        except Exception:
            return _fail(401, "invalid_token", "Malformed credentials")

    def verify_headers(self, headers: Mapping[str, str]) -> Result:
        """Works with Flask/Starlette/Django header objects (case-insensitive) and plain dicts."""
        def get(name: str) -> Optional[str]:
            value = headers.get(name)
            if value is None:
                value = headers.get(name.lower())
            return value

        return self.verify(get(TOKEN_HEADER), get(PROOF_HEADER))
```
