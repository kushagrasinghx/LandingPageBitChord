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
