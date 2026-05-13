export const ECNBA_SECURITY_POLICY = {
  platformName: "ECNBA Election Platform",
  password: {
    minLength: 12,
    maxLength: 64,
    pbkdf2Iterations: 310000,
    saltBytes: 16,
    recommendation: "Use a passphrase of at least four unrelated words.",
  },
  signIn: {
    maxAttempts: 5,
    lockMinutes: 15,
  },
  mfa: {
    issuer: "ECNBA Election Platform",
    secretBytes: 20,
    digits: 6,
    periodSeconds: 30,
    algorithm: "SHA1",
    driftWindowSteps: 1,
    maxAttempts: 5,
  },
  session: {
    idleMinutes: 15,
    absoluteHours: 8,
    reauthMoments: [
      "ballot casting",
      "profile changes",
      "recovery code regeneration",
    ],
  },
  recovery: {
    codeCount: 10,
    segmentLength: 4,
    segments: 3,
  },
} as const;

export const SECURITY_HIGHLIGHTS = [
  {
    title: "Password policy",
    value: "12-64 characters",
    description:
      "Long passphrases are encouraged, while weak short credentials are rejected.",
  },
  {
    title: "Authenticator app MFA",
    value: "6 digits / 30s",
    description:
      "App-based TOTP is mandatory before any election action becomes available.",
  },
  {
    title: "Access throttling",
    value: "5 attempts",
    description:
      "Too many failed password or MFA checks cause a 15 minute cooling period.",
  },
  {
    title: "Session control",
    value: "15 min idle, 8h max",
    description:
      "Election access expires quickly to reduce exposure on shared or unattended devices.",
  },
] as const;

export const PLATFORM_PRINCIPLES = [
  "Use ECNBA member ID or verified email for sign-in.",
  "Require authenticator enrollment during registration.",
  "Issue 10 one-time recovery codes after successful MFA setup.",
  "Re-authenticate before ballot casting and other high-assurance actions.",
] as const;
