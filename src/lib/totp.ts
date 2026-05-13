import { base32Decode, base32Encode, normalizeBase32 } from "./base32";
import { counterToBytes, hmacSha1, randomBytes } from "./crypto";
import { ECNBA_SECURITY_POLICY } from "./securityPolicy";

function getCounter(timestamp: number): number {
  return Math.floor(timestamp / 1000 / ECNBA_SECURITY_POLICY.mfa.periodSeconds);
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(ECNBA_SECURITY_POLICY.mfa.secretBytes));
}

export function createOtpAuthUrl(secret: string, accountLabel: string): string {
  const label = encodeURIComponent(`${ECNBA_SECURITY_POLICY.mfa.issuer}:${accountLabel}`);
  const params = new URLSearchParams({
    secret: normalizeBase32(secret),
    issuer: ECNBA_SECURITY_POLICY.mfa.issuer,
    algorithm: ECNBA_SECURITY_POLICY.mfa.algorithm,
    digits: String(ECNBA_SECURITY_POLICY.mfa.digits),
    period: String(ECNBA_SECURITY_POLICY.mfa.periodSeconds),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}

export async function generateTotpToken(
  secret: string,
  timestamp = Date.now(),
): Promise<string> {
  const counter = getCounter(timestamp);
  const keyBytes = base32Decode(secret);
  const message = counterToBytes(counter);
  const hmac = await hmacSha1(keyBytes, message);
  const offset = hmac[hmac.length - 1] & 15;
  const binary =
    ((hmac[offset] & 127) << 24) |
    ((hmac[offset + 1] & 255) << 16) |
    ((hmac[offset + 2] & 255) << 8) |
    (hmac[offset + 3] & 255);
  const code = binary % 10 ** ECNBA_SECURITY_POLICY.mfa.digits;
  return code.toString().padStart(ECNBA_SECURITY_POLICY.mfa.digits, "0");
}

export async function verifyTotpToken(
  secret: string,
  token: string,
  timestamp = Date.now(),
): Promise<boolean> {
  const normalized = token.replace(/\D/g, "");

  if (normalized.length !== ECNBA_SECURITY_POLICY.mfa.digits) {
    return false;
  }

  for (
    let offset = -ECNBA_SECURITY_POLICY.mfa.driftWindowSteps;
    offset <= ECNBA_SECURITY_POLICY.mfa.driftWindowSteps;
    offset += 1
  ) {
    const candidate = await generateTotpToken(
      secret,
      timestamp + offset * ECNBA_SECURITY_POLICY.mfa.periodSeconds * 1000,
    );

    if (candidate === normalized) {
      return true;
    }
  }

  return false;
}

export function getTotpSecondsRemaining(timestamp = Date.now()): number {
  const elapsed = Math.floor(timestamp / 1000) % ECNBA_SECURITY_POLICY.mfa.periodSeconds;
  return ECNBA_SECURITY_POLICY.mfa.periodSeconds - elapsed;
}
