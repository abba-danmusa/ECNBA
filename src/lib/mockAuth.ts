import { formatBase32 } from "./base32";
import { fromBase64Url, pbkdf2Hash, randomBytes, toBase64Url } from "./crypto";
import { ECNBA_SECURITY_POLICY } from "./securityPolicy";
import { createOtpAuthUrl, generateTotpSecret, verifyTotpToken } from "./totp";

const STORAGE_KEY = "ecnba-election-auth:v1";
const INVALID_MESSAGE = "We couldn't verify those election credentials.";
const LOCKED_MESSAGE = "Too many attempts were detected. Try again after the cooldown ends.";

type StoredRecoveryCode = {
  hash: string;
  salt: string;
  usedAt: string | null;
};

type AuthRole = "voter" | "chairman" | "observer";

type StoredAccount = {
  id: string;
  fullName: string;
  memberId: string;
  branch: string;
  email: string;
  phone: string;
  passwordHash: string;
  passwordSalt: string;
  mfaSecret: string;
  recoveryCodes: StoredRecoveryCode[];
  createdAt: string;
  lockedUntil: string | null;
  failedPasswordAttempts: number;
  failedMfaAttempts: number;
  lastAuthenticatedAt: string | null;
  role: AuthRole;
};

export type RegistrationInput = {
  fullName: string;
  memberId: string;
  branch: string;
  email: string;
  phone: string;
  password: string;
};

export type PendingEnrollment = {
  secret: string;
  formattedSecret: string;
  otpauthUrl: string;
  recoveryCodes: string[];
};

export type SignInChallenge = {
  accountId: string;
  displayName: string;
  memberId: string;
  branch: string;
  email: string;
  role: AuthRole;
};

export type AuthSession = {
  displayName: string;
  memberId: string;
  branch: string;
  email: string;
  issuedAt: string;
  idleExpiresAt: string;
  sessionExpiresAt: string;
  assurance: "Password + authenticator app";
  role: AuthRole;
};

class AuthError extends Error {
  constructor(
    readonly code: "INVALID" | "LOCKED" | "DUPLICATE",
    message: string,
  ) {
    super(message);
  }
}

function readAccounts(): StoredAccount[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as StoredAccount[];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredAccount[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeMemberId(value: string): string {
  return value.trim().toUpperCase();
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

function normalizeRecoveryCode(value: string): string {
  return value.replace(/[\s-]+/g, "").toUpperCase();
}

function isLocked(account: StoredAccount): boolean {
  return Boolean(account.lockedUntil && new Date(account.lockedUntil).getTime() > Date.now());
}

function ensureAccountNotLocked(account: StoredAccount): void {
  if (isLocked(account)) {
    throw new AuthError("LOCKED", LOCKED_MESSAGE);
  }
}

function findAccountByIdentifier(
  accounts: StoredAccount[],
  identifier: string,
): StoredAccount | undefined {
  const normalizedEmail = normalizeEmail(identifier);
  const normalizedMemberId = normalizeMemberId(identifier);
  return accounts.find(
    (account) =>
      account.email === normalizedEmail || account.memberId === normalizedMemberId,
  );
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return pbkdf2Hash(
    password,
    fromBase64Url(salt),
    ECNBA_SECURITY_POLICY.password.pbkdf2Iterations,
  );
}

async function hashRecoveryCode(code: string, salt: string): Promise<string> {
  return pbkdf2Hash(
    normalizeRecoveryCode(code),
    fromBase64Url(salt),
    ECNBA_SECURITY_POLICY.password.pbkdf2Iterations,
  );
}

function generateRecoveryCodes(): string[] {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const codes: string[] = [];

  while (codes.length < ECNBA_SECURITY_POLICY.recovery.codeCount) {
    const bytes = randomBytes(
      ECNBA_SECURITY_POLICY.recovery.segmentLength *
        ECNBA_SECURITY_POLICY.recovery.segments,
    );

    const characters = Array.from(bytes, (value) => alphabet[value % alphabet.length]);
    const parts = [];

    for (let index = 0; index < characters.length; index += ECNBA_SECURITY_POLICY.recovery.segmentLength) {
      parts.push(
        characters.slice(index, index + ECNBA_SECURITY_POLICY.recovery.segmentLength).join(""),
      );
    }

    const code = parts.join("-");

    if (!codes.includes(code)) {
      codes.push(code);
    }
  }

  return codes;
}

function createSession(account: StoredAccount): AuthSession {
  const issuedAt = new Date();
  const idleExpiresAt = new Date(
    issuedAt.getTime() + ECNBA_SECURITY_POLICY.session.idleMinutes * 60_000,
  );
  const sessionExpiresAt = new Date(
    issuedAt.getTime() + ECNBA_SECURITY_POLICY.session.absoluteHours * 60 * 60_000,
  );

  return {
    displayName: account.fullName,
    memberId: account.memberId,
    branch: account.branch,
    email: account.email,
    issuedAt: issuedAt.toISOString(),
    idleExpiresAt: idleExpiresAt.toISOString(),
    sessionExpiresAt: sessionExpiresAt.toISOString(),
    assurance: "Password + authenticator app",
    role: account.role,
  };
}

function registerFailedPasswordAttempt(account: StoredAccount): void {
  account.failedPasswordAttempts += 1;

  if (account.failedPasswordAttempts >= ECNBA_SECURITY_POLICY.signIn.maxAttempts) {
    account.failedPasswordAttempts = 0;
    account.failedMfaAttempts = 0;
    account.lockedUntil = new Date(
      Date.now() + ECNBA_SECURITY_POLICY.signIn.lockMinutes * 60_000,
    ).toISOString();
  }
}

function registerFailedMfaAttempt(account: StoredAccount): void {
  account.failedMfaAttempts += 1;

  if (account.failedMfaAttempts >= ECNBA_SECURITY_POLICY.mfa.maxAttempts) {
    account.failedPasswordAttempts = 0;
    account.failedMfaAttempts = 0;
    account.lockedUntil = new Date(
      Date.now() + ECNBA_SECURITY_POLICY.signIn.lockMinutes * 60_000,
    ).toISOString();
  }
}

function resetAuthCounters(account: StoredAccount): void {
  account.failedPasswordAttempts = 0;
  account.failedMfaAttempts = 0;
  account.lockedUntil = null;
}

export function getRegistrationCount(): number {
  return readAccounts().length;
}

export function getInvalidMessage(): string {
  return INVALID_MESSAGE;
}

export function getLockMessage(): string {
  return LOCKED_MESSAGE;
}

export async function beginRegistration(
  input: RegistrationInput,
): Promise<PendingEnrollment> {
  const accounts = readAccounts();
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedMemberId = normalizeMemberId(input.memberId);

  if (
    accounts.some(
      (account) =>
        account.email === normalizedEmail || account.memberId === normalizedMemberId,
    )
  ) {
    throw new AuthError(
      "DUPLICATE",
      "We could not create this election credential. Contact the election desk if you need assistance.",
    );
  }

  const secret = generateTotpSecret();
  const label = `${normalizedMemberId} (${input.fullName.trim()})`;

  return {
    secret,
    formattedSecret: formatBase32(secret),
    otpauthUrl: createOtpAuthUrl(secret, label),
    recoveryCodes: generateRecoveryCodes(),
  };
}

export async function completeRegistration(
  input: RegistrationInput,
  pendingEnrollment: PendingEnrollment,
  verificationCode: string,
): Promise<{ recoveryCodes: string[] }> {
  const accounts = readAccounts();
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedMemberId = normalizeMemberId(input.memberId);

  if (
    accounts.some(
      (account) =>
        account.email === normalizedEmail || account.memberId === normalizedMemberId,
    )
  ) {
    throw new AuthError(
      "DUPLICATE",
      "We could not create this election credential. Contact the election desk if you need assistance.",
    );
  }

  const isValidCode = await verifyTotpToken(
    pendingEnrollment.secret,
    verificationCode,
  );

  if (!isValidCode) {
    throw new AuthError("INVALID", "The authenticator code could not be verified.");
  }

  const passwordSalt = toBase64Url(randomBytes(ECNBA_SECURITY_POLICY.password.saltBytes));
  const passwordHash = await hashPassword(input.password, passwordSalt);

  const storedRecoveryCodes = await Promise.all(
    pendingEnrollment.recoveryCodes.map(async (code) => {
      const salt = toBase64Url(randomBytes(ECNBA_SECURITY_POLICY.password.saltBytes));
      return {
        salt,
        hash: await hashRecoveryCode(code, salt),
        usedAt: null,
      };
    }),
  );

  accounts.push({
    id: crypto.randomUUID(),
    fullName: input.fullName.trim(),
    memberId: normalizedMemberId,
    branch: input.branch.trim(),
    email: normalizedEmail,
    phone: normalizePhone(input.phone),
    passwordHash,
    passwordSalt,
    mfaSecret: pendingEnrollment.secret,
    recoveryCodes: storedRecoveryCodes,
    createdAt: new Date().toISOString(),
    lockedUntil: null,
    failedPasswordAttempts: 0,
    failedMfaAttempts: 0,
    lastAuthenticatedAt: null,
    role: "voter",
  });

  writeAccounts(accounts);

  return {
    recoveryCodes: pendingEnrollment.recoveryCodes,
  };
}

export async function beginPasswordSignIn(
  identifier: string,
  password: string,
): Promise<SignInChallenge> {
  const accounts = readAccounts();
  const account = findAccountByIdentifier(accounts, identifier);

  if (!account) {
    throw new AuthError("INVALID", INVALID_MESSAGE);
  }

  ensureAccountNotLocked(account);

  const passwordHash = await hashPassword(password, account.passwordSalt);

  if (passwordHash !== account.passwordHash) {
    registerFailedPasswordAttempt(account);
    writeAccounts(accounts);
    throw new AuthError(account.lockedUntil ? "LOCKED" : "INVALID", account.lockedUntil ? LOCKED_MESSAGE : INVALID_MESSAGE);
  }

  account.failedPasswordAttempts = 0;
  writeAccounts(accounts);

  return {
    accountId: account.id,
    displayName: account.fullName,
    memberId: account.memberId,
    branch: account.branch,
    email: account.email,
    role: account.role,
  };
}

function findAccountById(accounts: StoredAccount[], accountId: string): StoredAccount {
  const account = accounts.find((entry) => entry.id === accountId);

  if (!account) {
    throw new AuthError("INVALID", INVALID_MESSAGE);
  }

  return account;
}

export async function completeTotpSignIn(
  accountId: string,
  verificationCode: string,
): Promise<AuthSession> {
  const accounts = readAccounts();
  const account = findAccountById(accounts, accountId);
  ensureAccountNotLocked(account);

  const isValidCode = await verifyTotpToken(account.mfaSecret, verificationCode);

  if (!isValidCode) {
    registerFailedMfaAttempt(account);
    writeAccounts(accounts);
    throw new AuthError(account.lockedUntil ? "LOCKED" : "INVALID", account.lockedUntil ? LOCKED_MESSAGE : INVALID_MESSAGE);
  }

  resetAuthCounters(account);
  account.lastAuthenticatedAt = new Date().toISOString();
  writeAccounts(accounts);

  return createSession(account);
}

export async function completeRecoveryCodeSignIn(
  accountId: string,
  recoveryCode: string,
): Promise<AuthSession> {
  const accounts = readAccounts();
  const account = findAccountById(accounts, accountId);
  ensureAccountNotLocked(account);

  const normalized = normalizeRecoveryCode(recoveryCode);
  let matchedCode = false;

  for (const entry of account.recoveryCodes) {
    if (entry.usedAt) {
      continue;
    }

    const candidateHash = await hashRecoveryCode(normalized, entry.salt);

    if (candidateHash === entry.hash) {
      entry.usedAt = new Date().toISOString();
      matchedCode = true;
      break;
    }
  }

  if (!matchedCode) {
    registerFailedMfaAttempt(account);
    writeAccounts(accounts);
    throw new AuthError(account.lockedUntil ? "LOCKED" : "INVALID", account.lockedUntil ? LOCKED_MESSAGE : INVALID_MESSAGE);
  }

  resetAuthCounters(account);
  account.lastAuthenticatedAt = new Date().toISOString();
  writeAccounts(accounts);

  return createSession(account);
}
