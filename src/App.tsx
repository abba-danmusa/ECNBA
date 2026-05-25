import {
  Suspense,
  startTransition,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  lazy,
  useDeferredValue,
  useEffect,
  useState,
} from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Copy,
  KeyRound,
  Lock,
  ScanLine,
  ShieldCheck,
  TimerReset,
  UserRound,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  beginPasswordSignIn,
  beginRegistration,
  completeRecoveryCodeSignIn,
  completeRegistration,
  completeTotpSignIn,
  getInvalidMessage,
  getRegistrationCount,
  type AuthSession,
  type PendingEnrollment,
  type RegistrationInput,
  type SignInChallenge,
} from "./lib/mockAuth";
import {
  ECNBA_SECURITY_POLICY,
  PLATFORM_PRINCIPLES,
  SECURITY_HIGHLIGHTS,
} from "./lib/securityPolicy";
import { getTotpSecondsRemaining } from "./lib/totp";

const VoterDashboard = lazy(async () => {
  const module = await import("./components/VoterDashboard");
  return { default: module.VoterDashboard };
});

const AdminDashboard = lazy(async () => {
  const module = await import("./components/AdminDashboard");
  return { default: module.AdminDashboard };
});

const SecretaryDashboard = lazy(async () => {
  const module = await import("./components/AdminDashboard");
  return { default: module.SecretaryDashboard };
});

const HelpDeskDashboard = lazy(async () => {
  const module = await import("./components/HelpDeskDashboard");
  return { default: module.HelpDeskDashboard };
});

const PostElectionDashboard = lazy(async () => {
  const module = await import("./components/PostElectionDashboard");
  return { default: module.PostElectionDashboard };
});

type Mode = "signin" | "signup";
type SignInStage = "credentials" | "mfa" | "success";
type SignUpStage = "form" | "mfa" | "success";
type FlashTone = "neutral" | "positive" | "critical";

type SignInFormState = {
  identifier: string;
  password: string;
};

type SignUpFormState = RegistrationInput & {
  confirmPassword: string;
  attestation: boolean;
};

const initialSignInForm: SignInFormState = {
  identifier: "",
  password: "",
};

const initialSignUpForm: SignUpFormState = {
  fullName: "",
  memberId: "",
  branch: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  attestation: false,
};

function GlassPanel({
  children,
  accent = "rgba(31, 184, 157, 0.18)",
}: {
  children: ReactNode;
  accent?: string;
}) {
  return (
    <Box
      className="panel-rise shadow-[0_28px_90px_rgba(2,8,14,0.46)]"
      bg="var(--panel-bg)"
      border="1px solid var(--panel-border)"
      rounded="28px"
      position="relative"
      overflow="hidden"
      backdropFilter="blur(16px)"
      _before={{
        content: '""',
        position: "absolute",
        inset: "0",
        bgGradient: `linear(135deg, ${accent}, transparent 40%)`,
        pointerEvents: "none",
      }}
    >
      <Box position="relative" zIndex={1}>
        {children}
      </Box>
    </Box>
  );
}

function SectionField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <Stack gap="2">
      <Flex align="center" justify="space-between" gap="4" wrap="wrap">
        <Text fontSize="sm" fontWeight="700" color="var(--text-main)">
          {label}
        </Text>
        {hint ? (
          <Text fontSize="xs" color="var(--text-dim)">
            {hint}
          </Text>
        ) : null}
      </Flex>
      {children}
    </Stack>
  );
}

function StatusBanner({
  tone,
  message,
}: {
  tone: FlashTone;
  message: string;
}) {
  const palette =
    tone === "positive"
      ? {
          bg: "rgba(31, 184, 157, 0.12)",
          border: "rgba(31, 184, 157, 0.35)",
          color: "var(--brand-200)",
        }
      : tone === "critical"
        ? {
            bg: "rgba(255, 123, 114, 0.12)",
            border: "rgba(255, 123, 114, 0.32)",
            color: "var(--danger-400)",
          }
        : {
            bg: "rgba(240, 177, 75, 0.12)",
            border: "rgba(240, 177, 75, 0.28)",
            color: "#f7ce83",
          };

  return (
    <Box
      bg={palette.bg}
      border="1px solid"
      borderColor={palette.border}
      color={palette.color}
      rounded="20px"
      px="4"
      py="3"
      fontSize="sm"
      lineHeight="1.55"
    >
      {message}
    </Box>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Stack
      bg="rgba(255, 255, 255, 0.03)"
      border="1px solid var(--line-soft)"
      rounded="22px"
      px="5"
      py="4"
      gap="2"
    >
      <Text fontSize="xs" letterSpacing="0.22em" textTransform="uppercase" color="var(--text-dim)">
        {title}
      </Text>
      <Text fontFamily='"Sora", sans-serif' fontWeight="700" fontSize="xl" color="var(--text-main)">
        {value}
      </Text>
      <Text fontSize="sm" color="var(--text-soft)" lineHeight="1.6">
        {description}
      </Text>
    </Stack>
  );
}

function RecoveryCodeBoard({ codes }: { codes: string[] }) {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2 }} gap="3">
      {codes.map((code) => (
        <Box
          key={code}
          rounded="18px"
          border="1px solid var(--line-soft)"
          bg="rgba(255, 255, 255, 0.02)"
          px="4"
          py="3"
          fontFamily='"Sora", sans-serif'
          fontSize="sm"
          fontWeight="700"
          letterSpacing="0.12em"
          textAlign="center"
          color="var(--text-main)"
        >
          {code}
        </Box>
      ))}
    </SimpleGrid>
  );
}

function strengthSignal(password: string): {
  label: string;
  progress: number;
  color: string;
  guidance: string;
} {
  const segments = password.trim().split(/\s+/).filter(Boolean);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9\s]/.test(password);
  const variation = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;

  let score = 0;

  if (password.length >= ECNBA_SECURITY_POLICY.password.minLength) {
    score += 30;
  }

  if (password.length >= 16) {
    score += 20;
  }

  if (segments.length >= 4) {
    score += 25;
  }

  if (variation >= 3) {
    score += 15;
  }

  if (!/\s{2,}/.test(password) && !/(.)\1{2,}/.test(password)) {
    score += 10;
  }

  if (score >= 85) {
    return {
      label: "Election-ready",
      progress: score,
      color: "var(--brand-500)",
      guidance: "Strong length and variation. Keep it unique to this platform.",
    };
  }

  if (score >= 60) {
    return {
      label: "Strong",
      progress: score,
      color: "var(--gold-400)",
      guidance: "Good direction. A longer passphrase makes this even better.",
    };
  }

  return {
    label: "Needs work",
    progress: score,
    color: "var(--danger-400)",
    guidance: ECNBA_SECURITY_POLICY.password.recommendation,
  };
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function maskEmail(value: string): string {
  const [name, domain] = value.split("@");

  if (!domain) {
    return value;
  }

  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(name.length - 2, 2))}@${domain}`;
}

function getInputStyles() {
  return {
    bg: "rgba(255, 255, 255, 0.03)",
    border: "1px solid var(--line-soft)",
    color: "var(--text-main)",
    rounded: "18px",
    h: "54px",
    px: "4",
    _placeholder: {
      color: "var(--text-dim)",
    },
    _hover: {
      borderColor: "rgba(31, 184, 157, 0.42)",
    },
    _focusVisible: {
      outline: "none",
      borderColor: "rgba(31, 184, 157, 0.72)",
      boxShadow: "0 0 0 4px rgba(31, 184, 157, 0.12)",
    },
  } as const;
}

export default function App() {
  const [mode, setMode] = useState<Mode>("signin");
  const [signInStage, setSignInStage] = useState<SignInStage>("credentials");
  const [signUpStage, setSignUpStage] = useState<SignUpStage>("form");
  const [signInForm, setSignInForm] = useState(initialSignInForm);
  const [signUpForm, setSignUpForm] = useState(initialSignUpForm);
  const [signInChallenge, setSignInChallenge] = useState<SignInChallenge | null>(null);
  const [pendingEnrollment, setPendingEnrollment] = useState<PendingEnrollment | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authCode, setAuthCode] = useState("");
  const [recoveryMode, setRecoveryMode] = useState<"totp" | "recovery">("totp");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [flash, setFlash] = useState<{ tone: FlashTone; message: string } | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [registeredCount, setRegisteredCount] = useState(() => getRegistrationCount());
  const deferredPassword = useDeferredValue(signUpForm.password);
  const passwordSignal = strengthSignal(deferredPassword);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  function resetSignInFlow() {
    setSignInStage("credentials");
    setSignInChallenge(null);
    setSession(null);
    setAuthCode("");
    setRecoveryMode("totp");
  }

  function resetSignUpFlow() {
    setSignUpStage("form");
    setPendingEnrollment(null);
    setRecoveryCodes([]);
    setCopyState("idle");
    setAuthCode("");
  }

  function createDemoAdminSession(): AuthSession {
    const issuedAt = new Date();
    const idleExpiresAt = new Date(
      issuedAt.getTime() + ECNBA_SECURITY_POLICY.session.idleMinutes * 60_000,
    ).toISOString();
    const sessionExpiresAt = new Date(
      issuedAt.getTime() + ECNBA_SECURITY_POLICY.session.absoluteHours * 60 * 60_000,
    ).toISOString();

    return {
      displayName: "Amina O. Olumide",
      memberId: "ECNBA-0000",
      branch: "National Headquarters",
      email: "chairman@ecnba.org",
      issuedAt: issuedAt.toISOString(),
      idleExpiresAt,
      sessionExpiresAt,
      assurance: "Password + authenticator app",
      role: "chairman",
    };
  }

  function launchChairmanDemo() {
    startTransition(() => {
      setMode("signin");
      setSignInStage("success");
      setSession(createDemoAdminSession());
      setFlash({
        tone: "positive",
        message: "Chairman dashboard opened in demo mode. Role-based admin tools are available.",
      });
      resetSignUpFlow();
    });
  }

  function createDemoSecretarySession(): AuthSession {
    const issuedAt = new Date();
    const idleExpiresAt = new Date(
      issuedAt.getTime() + ECNBA_SECURITY_POLICY.session.idleMinutes * 60_000,
    ).toISOString();
    const sessionExpiresAt = new Date(
      issuedAt.getTime() + ECNBA_SECURITY_POLICY.session.absoluteHours * 60 * 60_000,
    ).toISOString();

    return {
      displayName: "Bolanle A. Fashina",
      memberId: "ECNBA-0021",
      branch: "National Secretariat",
      email: "secretary@ecnba.org",
      issuedAt: issuedAt.toISOString(),
      idleExpiresAt,
      sessionExpiresAt,
      assurance: "Password + authenticator app",
      role: "secretary",
    };
  }

  function launchSecretaryDemo() {
    startTransition(() => {
      setMode("signin");
      setSignInStage("success");
      setSession(createDemoSecretarySession());
      setFlash({
        tone: "positive",
        message: "Secretary dashboard opened in demo mode. Coordination and reporting tools are now available.",
      });
      resetSignUpFlow();
    });
  }

  function createDemoAgentSession(): AuthSession {
    const issuedAt = new Date();
    const idleExpiresAt = new Date(
      issuedAt.getTime() + ECNBA_SECURITY_POLICY.session.idleMinutes * 60_000,
    ).toISOString();
    const sessionExpiresAt = new Date(
      issuedAt.getTime() + ECNBA_SECURITY_POLICY.session.absoluteHours * 60 * 60_000,
    ).toISOString();

    return {
      displayName: "Amaka N. Eke",
      memberId: "ECNBA-9001",
      branch: "Election Help Desk",
      email: "agent@ecnba.org",
      issuedAt: issuedAt.toISOString(),
      idleExpiresAt,
      sessionExpiresAt,
      assurance: "Password + authenticator app",
      role: "agent",
    };
  }

  function launchAgentDemo() {
    startTransition(() => {
      setMode("signin");
      setSignInStage("success");
      setSession(createDemoAgentSession());
      setFlash({
        tone: "positive",
        message: "Help Desk dashboard opened in demo mode. Role-based support tools are now available.",
      });
      resetSignUpFlow();
    });
  }

  function createDemoObserverSession(): AuthSession {
    const issuedAt = new Date();
    const idleExpiresAt = new Date(
      issuedAt.getTime() + ECNBA_SECURITY_POLICY.session.idleMinutes * 60_000,
    ).toISOString();
    const sessionExpiresAt = new Date(
      issuedAt.getTime() + ECNBA_SECURITY_POLICY.session.absoluteHours * 60 * 60_000,
    ).toISOString();

    return {
      displayName: "Adaeze U. Onwuka",
      memberId: "ECNBA-5000",
      branch: "National Observer",
      email: "observer@ecnba.org",
      issuedAt: issuedAt.toISOString(),
      idleExpiresAt,
      sessionExpiresAt,
      assurance: "Password + authenticator app",
      role: "observer",
    };
  }

  function launchObserverDemo() {
    startTransition(() => {
      setMode("signin");
      setSignInStage("success");
      setSession(createDemoObserverSession());
      setFlash({
        tone: "positive",
        message: "Post-election audit portal opened in demo mode. Observer tools are now available.",
      });
      resetSignUpFlow();
    });
  }

  function switchMode(nextMode: Mode) {
    startTransition(() => {
      setMode(nextMode);
      setFlash(null);
      if (nextMode === "signin") {
        resetSignUpFlow();
      } else {
        resetSignInFlow();
      }
    });
  }

  function handleSignInChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const { name, value } = event.target;
    setSignInForm((current) => ({ ...current, [name]: value }));
  }

  function handleSignUpChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const { name, value, type, checked } = event.target;
    setSignUpForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function validateSignUpForm(): string | null {
    if (signUpForm.fullName.trim().split(/\s+/).length < 2) {
      return "Enter your full legal name as it appears on the ECNBA register.";
    }

    if (!signUpForm.memberId.trim()) {
      return "Enter your ECNBA member ID.";
    }

    if (!signUpForm.branch.trim()) {
      return "Enter your branch or electoral unit.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpForm.email.trim())) {
      return "Enter a valid verified email address.";
    }

    if (signUpForm.phone.replace(/[^\d]/g, "").length < 10) {
      return "Enter a valid mobile number for election notifications.";
    }

    if (signUpForm.password.length < ECNBA_SECURITY_POLICY.password.minLength) {
      return `Use at least ${ECNBA_SECURITY_POLICY.password.minLength} characters in your passphrase.`;
    }

    if (signUpForm.password.length > ECNBA_SECURITY_POLICY.password.maxLength) {
      return `Keep the passphrase within ${ECNBA_SECURITY_POLICY.password.maxLength} characters.`;
    }

    if (signUpForm.password !== signUpForm.confirmPassword) {
      return "The confirmation passphrase does not match.";
    }

    if (!signUpForm.attestation) {
      return "Confirm that the registration details belong to your official election identity.";
    }

    return null;
  }

  async function handleBeginEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validateSignUpForm();

    if (validationMessage) {
      setFlash({ tone: "critical", message: validationMessage });
      return;
    }

    setSubmitting(true);
    setFlash(null);

    try {
      const enrollment = await beginRegistration(signUpForm);
      setPendingEnrollment(enrollment);
      setSignUpStage("mfa");
      setAuthCode("");
      setFlash({
        tone: "neutral",
        message:
          "Authenticator setup is ready. Scan the QR code, then enter the current 6 digit code to activate the account.",
      });
    } catch (error) {
      setFlash({
        tone: "critical",
        message:
          error instanceof Error ? error.message : "Registration could not be started.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleActivateRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pendingEnrollment) {
      return;
    }

    setSubmitting(true);
    setFlash(null);

    try {
      const result = await completeRegistration(signUpForm, pendingEnrollment, authCode);
      setRecoveryCodes(result.recoveryCodes);
      setRegisteredCount(getRegistrationCount());
      setSignUpStage("success");
      setFlash({
        tone: "positive",
        message:
          "Multi-factor enrollment is complete. Store the recovery codes before you continue to sign in.",
      });
    } catch (error) {
      setFlash({
        tone: "critical",
        message:
          error instanceof Error ? error.message : "The authenticator code could not be verified.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePrimarySignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!signInForm.identifier.trim() || !signInForm.password) {
      setFlash({ tone: "critical", message: "Enter both your identifier and passphrase." });
      return;
    }

    setSubmitting(true);
    setFlash(null);

    try {
      const challenge = await beginPasswordSignIn(
        signInForm.identifier,
        signInForm.password,
      );
      setSignInChallenge(challenge);
      setSignInStage("mfa");
      setAuthCode("");
      setRecoveryMode("totp");
      setFlash({
        tone: "neutral",
        message: "Primary credentials verified. Complete the authenticator step to enter the election portal.",
      });
    } catch (error) {
      setFlash({
        tone: "critical",
        message:
          error instanceof Error ? error.message : getInvalidMessage(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSecondFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!signInChallenge) {
      return;
    }

    if (!authCode.trim()) {
      setFlash({
        tone: "critical",
        message:
          recoveryMode === "totp"
            ? "Enter the current authenticator code."
            : "Enter one of your recovery codes.",
      });
      return;
    }

    setSubmitting(true);
    setFlash(null);

    try {
      const nextSession =
        recoveryMode === "totp"
          ? await completeTotpSignIn(signInChallenge.accountId, authCode)
          : await completeRecoveryCodeSignIn(signInChallenge.accountId, authCode);

      setSession(nextSession);
      setSignInStage("success");
      setFlash({
        tone: "positive",
        message: "Election access approved. Your secure session is active.",
      });
    } catch (error) {
      setFlash({
        tone: "critical",
        message:
          error instanceof Error ? error.message : getInvalidMessage(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function copyRecoveryCodes() {
    if (recoveryCodes.length === 0) {
      return;
    }

    await navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  const secondsRemaining = getTotpSecondsRemaining(now);
  const inputStyles = getInputStyles();

  if (mode === "signin" && signInStage === "success" && session) {
    function closeActiveSession() {
      setSignInForm(initialSignInForm);
      setSession(null);
      resetSignInFlow();
      setFlash({
        tone: "neutral",
        message: "Session closed. Sign in again when you are ready.",
      });
    }

    return (
      <Suspense
        fallback={
          <Box minH="100vh" bg="var(--page-bg)" px="5" py="8">
            <Box maxW="720px" mx="auto">
              <GlassPanel accent="rgba(31, 184, 157, 0.14)">
                <Stack gap="4" px={{ base: "6", md: "8" }} py={{ base: "7", md: "8" }}>
                  <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.22em" color="var(--text-dim)">
                    Loading dashboard experience
                  </Text>
                  <Heading fontFamily='"Sora", sans-serif' fontSize={{ base: "2xl", md: "3xl" }} color="var(--text-main)">
                    Preparing your dashboard workspace.
                  </Heading>
                  <Text color="var(--text-soft)" lineHeight="1.8">
                    Secure session verified. The election dashboard is now being loaded with the appropriate role-based tools.
                  </Text>
                </Stack>
              </GlassPanel>
            </Box>
          </Box>
        }
      >
        {session.role === "chairman" ? (
          <AdminDashboard session={session} onCloseSession={closeActiveSession} />
        ) : session.role === "secretary" ? (
          <SecretaryDashboard session={session} onCloseSession={closeActiveSession} />
        ) : session.role === "agent" ? (
          <HelpDeskDashboard session={session} onCloseSession={closeActiveSession} />
        ) : session.role === "observer" ? (
          <PostElectionDashboard session={session} onCloseSession={closeActiveSession} />
        ) : (
          <VoterDashboard session={session} onCloseSession={closeActiveSession} />
        )}
      </Suspense>
    );
  }

  return (
    <Box minH="100vh" position="relative" overflow="hidden" bg="var(--page-bg)">
      <Box className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(31,184,157,0.22),transparent_24%),radial-gradient(circle_at_82%_4%,rgba(240,177,75,0.18),transparent_24%),radial-gradient(circle_at_84%_78%,rgba(33,150,243,0.12),transparent_28%)]" />
      <Box className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:84px_84px]" />
      <Box
        className="election-orb absolute -left-20 top-24 h-64 w-64 rounded-full blur-3xl"
        bg="rgba(31, 184, 157, 0.18)"
      />
      <Box
        className="election-orb alt absolute right-[-6rem] top-40 h-72 w-72 rounded-full blur-3xl"
        bg="rgba(240, 177, 75, 0.14)"
      />

      <Box maxW="1440px" mx="auto" px={{ base: "5", md: "8", xl: "10" }} py={{ base: "6", md: "8", xl: "10" }}>
        <Grid templateColumns={{ base: "1fr", xl: "1.08fr 0.92fr" }} gap={{ base: "6", xl: "7" }} alignItems="stretch">
          <GlassPanel accent="rgba(31, 184, 157, 0.12)">
            <Stack gap={{ base: "7", lg: "8" }} px={{ base: "6", md: "8", xl: "10" }} py={{ base: "7", md: "9" }}>
              <Stack gap="4" maxW="2xl">
                <HStack
                  w="fit-content"
                  rounded="full"
                  border="1px solid rgba(240, 177, 75, 0.26)"
                  bg="rgba(240, 177, 75, 0.08)"
                  px="4"
                  py="2"
                  gap="2"
                  color="#f6cf89"
                >
                  <ShieldCheck size={16} />
                  <Text fontSize="xs" letterSpacing="0.18em" textTransform="uppercase" fontWeight="700">
                    High-assurance ECNBA access
                  </Text>
                </HStack>

                <Heading
                  fontFamily='"Sora", sans-serif'
                  fontWeight="700"
                  letterSpacing="-0.03em"
                  lineHeight="1.04"
                  fontSize={{ base: "3xl", md: "4xl", xl: "5xl" }}
                  color="var(--text-main)"
                >
                  Election credentials built for secure member verification and protected ballot access.
                </Heading>

                <Text maxW="xl" color="var(--text-soft)" fontSize={{ base: "md", md: "lg" }} lineHeight="1.8">
                  This authentication experience pairs a strong passphrase with an authenticator app, short session windows, and recovery controls so the ECNBA platform feels premium without relaxing election-grade safeguards.
                </Text>
              </Stack>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                <StatCard
                  title="Registered demos"
                  value={registeredCount.toString().padStart(2, "0")}
                  description="Accounts created in this local prototype automatically require MFA."
                />
                <StatCard
                  title="Live OTP cadence"
                  value={`${secondsRemaining}s remaining`}
                  description="Authenticator codes refresh every 30 seconds with a ±1 step grace window."
                />
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                {SECURITY_HIGHLIGHTS.map((highlight) => (
                  <StatCard
                    key={highlight.title}
                    title={highlight.title}
                    value={highlight.value}
                    description={highlight.description}
                  />
                ))}
              </SimpleGrid>

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="5">
                <Stack
                  rounded="24px"
                  border="1px solid var(--line-soft)"
                  bg="rgba(255, 255, 255, 0.025)"
                  p="6"
                  gap="4"
                >
                  <HStack gap="3" align="center">
                    <KeyRound size={18} color="var(--brand-200)" />
                    <Text fontWeight="700" color="var(--text-main)">
                      Security posture
                    </Text>
                  </HStack>
                  {PLATFORM_PRINCIPLES.map((principle) => (
                    <HStack key={principle} align="start" gap="3">
                      <Box mt="1.5" h="2" w="2" rounded="full" bg="var(--brand-500)" flexShrink={0} />
                      <Text color="var(--text-soft)" fontSize="sm" lineHeight="1.7">
                        {principle}
                      </Text>
                    </HStack>
                  ))}
                </Stack>

                <Stack
                  rounded="24px"
                  border="1px solid var(--line-soft)"
                  bg="rgba(255, 255, 255, 0.025)"
                  p="6"
                  gap="4"
                >
                  <HStack gap="3" align="center">
                    <TimerReset size={18} color="#f6cf89" />
                    <Text fontWeight="700" color="var(--text-main)">
                      Recommended controls
                    </Text>
                  </HStack>
                  <Text color="var(--text-soft)" fontSize="sm" lineHeight="1.75">
                    Idle sessions end after {ECNBA_SECURITY_POLICY.session.idleMinutes} minutes, while every absolute session closes after {ECNBA_SECURITY_POLICY.session.absoluteHours} hours.
                  </Text>
                  <Text color="var(--text-soft)" fontSize="sm" lineHeight="1.75">
                    Access attempts are throttled after {ECNBA_SECURITY_POLICY.signIn.maxAttempts} failures to reduce brute-force risk on shared election devices.
                  </Text>
                  <Text color="var(--text-soft)" fontSize="sm" lineHeight="1.75">
                    One-time recovery codes are issued only after successful MFA setup and should be stored offline by each member.
                  </Text>
                </Stack>
              </Grid>
            </Stack>
          </GlassPanel>

          <GlassPanel accent="rgba(240, 177, 75, 0.1)">
            <Flex direction="column" h="full">
              <Stack gap="6" px={{ base: "5", md: "7" }} py={{ base: "6", md: "7" }} flex="1">
                <Flex align={{ base: "start", sm: "center" }} justify="space-between" gap="4" wrap="wrap">
                  <Stack gap="1.5">
                    <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.22em" color="var(--text-dim)" fontWeight="700">
                      Secure authentication
                    </Text>
                    <Heading fontFamily='"Sora", sans-serif' fontSize={{ base: "2xl", md: "3xl" }} color="var(--text-main)" letterSpacing="-0.03em">
                      {mode === "signin" ? "Sign in to vote" : "Create election credentials"}
                    </Heading>
                  </Stack>

                  <HStack
                    bg="rgba(255,255,255,0.03)"
                    border="1px solid var(--line-soft)"
                    p="1"
                    rounded="full"
                    gap="1"
                  >
                  <Button
                    onClick={() => switchMode("signin")}
                    rounded="full"
                    px="5"
                    bg={mode === "signin" ? "rgba(31, 184, 157, 0.18)" : "transparent"}
                    color={mode === "signin" ? "var(--text-main)" : "var(--text-soft)"}
                    _hover={{ bg: mode === "signin" ? "rgba(31, 184, 157, 0.18)" : "rgba(255,255,255,0.05)" }}
                  >
                    Sign in
                  </Button>
                  <Button
                    onClick={() => switchMode("signup")}
                    rounded="full"
                    px="5"
                    bg={mode === "signup" ? "rgba(31, 184, 157, 0.18)" : "transparent"}
                    color={mode === "signup" ? "var(--text-main)" : "var(--text-soft)"}
                    _hover={{ bg: mode === "signup" ? "rgba(31, 184, 157, 0.18)" : "rgba(255,255,255,0.05)" }}
                  >
                    Sign up
                  </Button>
                </HStack>
              </Flex>

              {flash ? <StatusBanner tone={flash.tone} message={flash.message} /> : null}

              {mode === "signup" && signUpStage === "form" ? (
                <form onSubmit={handleBeginEnrollment}>
                  <Stack gap="5">
                    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
                      <SectionField label="Full name" hint="Official register">
                        <Input
                          {...inputStyles}
                          name="fullName"
                          value={signUpForm.fullName}
                          onChange={handleSignUpChange}
                          placeholder="Aisha O. Ekhator"
                        />
                      </SectionField>
                      <SectionField label="ECNBA member ID" hint="Unique voter identity">
                        <Input
                          {...inputStyles}
                          name="memberId"
                          value={signUpForm.memberId}
                          onChange={handleSignUpChange}
                          placeholder="ECNBA-2048"
                        />
                      </SectionField>
                    </Grid>

                    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
                      <SectionField label="Verified email">
                        <Input
                          {...inputStyles}
                          type="email"
                          name="email"
                          value={signUpForm.email}
                          onChange={handleSignUpChange}
                          placeholder="member@ecnba.org"
                        />
                      </SectionField>
                      <SectionField label="Mobile number" hint="Election notices">
                        <Input
                          {...inputStyles}
                          name="phone"
                          value={signUpForm.phone}
                          onChange={handleSignUpChange}
                          placeholder="+234 800 000 0000"
                        />
                      </SectionField>
                    </Grid>

                    <SectionField label="Branch or electoral unit">
                      <Input
                        {...inputStyles}
                        name="branch"
                        value={signUpForm.branch}
                        onChange={handleSignUpChange}
                        placeholder="Benin branch"
                      />
                    </SectionField>

                    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
                      <SectionField
                        label="Create passphrase"
                        hint={`${ECNBA_SECURITY_POLICY.password.minLength}-${ECNBA_SECURITY_POLICY.password.maxLength} chars`}
                      >
                        <Input
                          {...inputStyles}
                          type="password"
                          name="password"
                          value={signUpForm.password}
                          onChange={handleSignUpChange}
                          placeholder="Four unique words with spacing"
                        />
                      </SectionField>
                      <SectionField label="Confirm passphrase">
                        <Input
                          {...inputStyles}
                          type="password"
                          name="confirmPassword"
                          value={signUpForm.confirmPassword}
                          onChange={handleSignUpChange}
                          placeholder="Repeat passphrase"
                        />
                      </SectionField>
                    </Grid>

                    <Stack gap="2">
                      <Flex align="center" justify="space-between" gap="3" wrap="wrap">
                        <Text fontSize="sm" fontWeight="700" color="var(--text-main)">
                          Passphrase quality
                        </Text>
                        <Text fontSize="sm" color={passwordSignal.color} fontWeight="700">
                          {passwordSignal.label}
                        </Text>
                      </Flex>
                      <Box
                        rounded="full"
                        h="2.5"
                        bg="rgba(255,255,255,0.08)"
                        overflow="hidden"
                      >
                        <Box
                          h="full"
                          w={`${Math.min(passwordSignal.progress, 100)}%`}
                          rounded="full"
                          bg={passwordSignal.color}
                          transition="width 220ms ease"
                        />
                      </Box>
                      <Text fontSize="sm" color="var(--text-soft)">
                        {passwordSignal.guidance}
                      </Text>
                    </Stack>

                    <label className="flex items-start gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-soft)]">
                      <input
                        className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-[var(--brand-500)]"
                        type="checkbox"
                        name="attestation"
                        checked={signUpForm.attestation}
                        onChange={handleSignUpChange}
                      />
                      <span>
                        I confirm that these details represent my official ECNBA election identity and that I understand MFA will be required on every sign-in.
                      </span>
                    </label>

                    <Button
                      type="submit"
                      h="56px"
                      rounded="20px"
                      bg="linear-gradient(135deg, var(--brand-500), #14957e)"
                      color="#02110d"
                      fontWeight="800"
                      _hover={{
                        transform: "translateY(-1px)",
                        boxShadow: "0 16px 36px rgba(31, 184, 157, 0.22)",
                      }}
                      _active={{ transform: "translateY(0)" }}
                      disabled={submitting}
                    >
                      {submitting ? "Preparing secure enrollment..." : "Continue to MFA setup"}
                    </Button>
                  </Stack>
                </form>
              ) : null}

              {mode === "signup" && signUpStage === "mfa" && pendingEnrollment ? (
                <form onSubmit={handleActivateRegistration}>
                  <Grid templateColumns={{ base: "1fr", lg: "0.86fr 1.14fr" }} gap="5">
                    <Stack
                      rounded="26px"
                      border="1px solid var(--line-soft)"
                      bg="rgba(255,255,255,0.025)"
                      p="5"
                      gap="4"
                      align="center"
                    >
                      <Text fontSize="sm" fontWeight="700" color="var(--text-main)">
                        Scan with your authenticator app
                      </Text>
                      <Box rounded="24px" bg="white" p="4" boxShadow="0 18px 40px rgba(0,0,0,0.2)">
                        <QRCodeSVG
                          value={pendingEnrollment.otpauthUrl}
                          size={176}
                          bgColor="#ffffff"
                          fgColor="#0d1723"
                          includeMargin
                        />
                      </Box>
                      <Text fontSize="xs" color="var(--text-dim)" textAlign="center" maxW="240px" lineHeight="1.6">
                        Compatible with Google Authenticator, Microsoft Authenticator, Authy, and similar TOTP apps.
                      </Text>
                    </Stack>

                    <Stack gap="5">
                      <Stack
                        rounded="24px"
                        border="1px solid var(--line-soft)"
                        bg="rgba(255,255,255,0.025)"
                        p="5"
                        gap="4"
                      >
                        <HStack gap="3" color="var(--brand-200)">
                          <ScanLine size={18} />
                          <Text fontWeight="700" color="var(--text-main)">
                            Manual setup key
                          </Text>
                        </HStack>
                        <Text color="var(--text-soft)" fontSize="sm" lineHeight="1.7">
                          If QR scanning is unavailable, enter this secret into the authenticator app manually.
                        </Text>
                        <Box
                          rounded="20px"
                          border="1px dashed rgba(31,184,157,0.34)"
                          bg="rgba(31,184,157,0.08)"
                          px="4"
                          py="4"
                          fontFamily='"Sora", sans-serif'
                          fontSize={{ base: "sm", md: "md" }}
                          letterSpacing="0.14em"
                          textAlign="center"
                          color="var(--text-main)"
                        >
                          {pendingEnrollment.formattedSecret}
                        </Box>
                      </Stack>

                      <SectionField label="Enter the current 6 digit code" hint={`Refreshes every ${ECNBA_SECURITY_POLICY.mfa.periodSeconds}s`}>
                        <Input
                          {...inputStyles}
                          name="authCode"
                          value={authCode}
                          onChange={(event) => setAuthCode(event.target.value)}
                          placeholder="123456"
                          inputMode="numeric"
                          maxLength={6}
                        />
                      </SectionField>

                      <HStack
                        rounded="20px"
                        border="1px solid rgba(240,177,75,0.2)"
                        bg="rgba(240,177,75,0.08)"
                        px="4"
                        py="3"
                        gap="3"
                        color="#f6cf89"
                        align="start"
                      >
                        <TimerReset size={18} />
                        <Text fontSize="sm" lineHeight="1.7">
                          A recovery pack of {ECNBA_SECURITY_POLICY.recovery.codeCount} one-time codes will be shown after this verification succeeds. Store them offline.
                        </Text>
                      </HStack>

                      <HStack gap="3" flexWrap="wrap">
                        <Button
                          type="button"
                          variant="ghost"
                          rounded="18px"
                          px="5"
                          color="var(--text-soft)"
                          onClick={resetSignUpFlow}
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          h="54px"
                          flex="1"
                          rounded="20px"
                          bg="linear-gradient(135deg, var(--brand-500), #14957e)"
                          color="#02110d"
                          fontWeight="800"
                          _hover={{
                            transform: "translateY(-1px)",
                            boxShadow: "0 16px 36px rgba(31, 184, 157, 0.22)",
                          }}
                          disabled={submitting}
                        >
                          {submitting ? "Verifying authenticator..." : "Activate secure account"}
                        </Button>
                      </HStack>
                    </Stack>
                  </Grid>
                </form>
              ) : null}

              {mode === "signup" && signUpStage === "success" ? (
                <Stack gap="5">
                  <Stack
                    rounded="24px"
                    border="1px solid rgba(31,184,157,0.22)"
                    bg="rgba(31,184,157,0.08)"
                    p="5"
                    gap="3"
                  >
                    <HStack gap="3">
                      <BadgeCheck size={18} color="var(--brand-200)" />
                      <Text fontWeight="700" color="var(--text-main)">
                        MFA setup complete
                      </Text>
                    </HStack>
                    <Text color="var(--text-soft)" fontSize="sm" lineHeight="1.75">
                      These recovery codes are displayed once. Anyone holding one can satisfy the second factor, so keep them offline and separate from your primary device.
                    </Text>
                  </Stack>

                  <RecoveryCodeBoard codes={recoveryCodes} />

                  <HStack gap="3" flexWrap="wrap">
                    <Button
                      rounded="18px"
                      variant="ghost"
                      color="var(--text-soft)"
                      border="1px solid var(--line-soft)"
                      onClick={copyRecoveryCodes}
                    >
                      <HStack gap="2">
                        <Copy size={16} />
                        <Text as="span">{copyState === "copied" ? "Copied" : "Copy codes"}</Text>
                      </HStack>
                    </Button>
                    <Button
                      h="54px"
                      flex="1"
                      rounded="20px"
                      bg="linear-gradient(135deg, var(--brand-500), #14957e)"
                      color="#02110d"
                      fontWeight="800"
                      onClick={() => {
                        setSignInForm({
                          identifier: signUpForm.email,
                          password: signUpForm.password,
                        });
                        switchMode("signin");
                      }}
                    >
                      <HStack gap="2">
                        <Text as="span">Continue to sign in</Text>
                        <ArrowRight size={16} />
                      </HStack>
                    </Button>
                  </HStack>
                </Stack>
              ) : null}

              {mode === "signin" && signInStage === "credentials" ? (
                <form onSubmit={handlePrimarySignIn}>
                  <Stack gap="5">
                    <SectionField label="Member ID or verified email">
                      <Input
                        {...inputStyles}
                        name="identifier"
                        value={signInForm.identifier}
                        onChange={handleSignInChange}
                        placeholder="ECNBA-2048 or member@ecnba.org"
                      />
                    </SectionField>

                    <SectionField label="Passphrase">
                      <Input
                        {...inputStyles}
                        type="password"
                        name="password"
                        value={signInForm.password}
                        onChange={handleSignInChange}
                        placeholder="Enter your secure passphrase"
                      />
                    </SectionField>

                    <SimpleGrid columns={{ base: 1, md: 3 }} gap="3">
                      <Box rounded="20px" border="1px solid var(--line-soft)" bg="rgba(255,255,255,0.025)" px="4" py="4">
                        <HStack gap="3" mb="2" color="var(--brand-200)">
                          <Lock size={16} />
                          <Text fontSize="sm" fontWeight="700" color="var(--text-main)">
                            Session control
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color="var(--text-soft)" lineHeight="1.6">
                          Idle timeout of {ECNBA_SECURITY_POLICY.session.idleMinutes} minutes.
                        </Text>
                      </Box>
                      <Box rounded="20px" border="1px solid var(--line-soft)" bg="rgba(255,255,255,0.025)" px="4" py="4">
                        <HStack gap="3" mb="2" color="#f6cf89">
                          <ShieldCheck size={16} />
                          <Text fontSize="sm" fontWeight="700" color="var(--text-main)">
                            Mandatory MFA
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color="var(--text-soft)" lineHeight="1.6">
                          Authenticator verification is always required after the password step.
                        </Text>
                      </Box>
                      <Box rounded="20px" border="1px solid var(--line-soft)" bg="rgba(255,255,255,0.025)" px="4" py="4">
                        <HStack gap="3" mb="2" color="var(--brand-200)">
                          <UserRound size={16} />
                          <Text fontSize="sm" fontWeight="700" color="var(--text-main)">
                            Prototype storage
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color="var(--text-soft)" lineHeight="1.6">
                          Demo accounts stay only in this browser's local storage.
                        </Text>
                      </Box>
                    </SimpleGrid>

                    <Button
                      type="submit"
                      h="56px"
                      rounded="20px"
                      bg="linear-gradient(135deg, var(--brand-500), #14957e)"
                      color="#02110d"
                      fontWeight="800"
                      _hover={{
                        transform: "translateY(-1px)",
                        boxShadow: "0 16px 36px rgba(31, 184, 157, 0.22)",
                      }}
                      disabled={submitting}
                    >
                      {submitting ? "Verifying passphrase..." : "Continue to authenticator check"}
                    </Button>
                  </Stack>
                </form>
              ) : null}

              {mode === "signin" && signInStage === "mfa" && signInChallenge ? (
                <form onSubmit={handleSecondFactor}>
                  <Stack gap="5">
                    <Stack
                      rounded="24px"
                      border="1px solid var(--line-soft)"
                      bg="rgba(255,255,255,0.025)"
                      p="5"
                      gap="3"
                    >
                      <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.2em" color="var(--text-dim)">
                        Verified identity
                      </Text>
                      <Text fontWeight="700" color="var(--text-main)">
                        {signInChallenge.displayName}
                      </Text>
                      <Text fontSize="sm" color="var(--text-soft)">
                        {signInChallenge.memberId} • {signInChallenge.branch} • {maskEmail(signInChallenge.email)}
                      </Text>
                    </Stack>

                    <HStack
                      bg="rgba(255,255,255,0.03)"
                      border="1px solid var(--line-soft)"
                      p="1"
                      rounded="full"
                      gap="1"
                      w="fit-content"
                    >
                      <Button
                        type="button"
                        onClick={() => {
                          setRecoveryMode("totp");
                          setAuthCode("");
                        }}
                        rounded="full"
                        px="5"
                        bg={recoveryMode === "totp" ? "rgba(31, 184, 157, 0.18)" : "transparent"}
                        color={recoveryMode === "totp" ? "var(--text-main)" : "var(--text-soft)"}
                        _hover={{ bg: recoveryMode === "totp" ? "rgba(31, 184, 157, 0.18)" : "rgba(255,255,255,0.05)" }}
                      >
                        Authenticator app
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setRecoveryMode("recovery");
                          setAuthCode("");
                        }}
                        rounded="full"
                        px="5"
                        bg={recoveryMode === "recovery" ? "rgba(31, 184, 157, 0.18)" : "transparent"}
                        color={recoveryMode === "recovery" ? "var(--text-main)" : "var(--text-soft)"}
                        _hover={{ bg: recoveryMode === "recovery" ? "rgba(31, 184, 157, 0.18)" : "rgba(255,255,255,0.05)" }}
                      >
                        Recovery code
                      </Button>
                    </HStack>

                    <SectionField
                      label={recoveryMode === "totp" ? "Authenticator code" : "Recovery code"}
                      hint={recoveryMode === "totp" ? `${secondsRemaining}s left in current window` : "Single use fallback"}
                    >
                      <Input
                        {...inputStyles}
                        value={authCode}
                        onChange={(event) => setAuthCode(event.target.value)}
                        placeholder={recoveryMode === "totp" ? "123456" : "ABCD-EFGH-JKLM"}
                        inputMode={recoveryMode === "totp" ? "numeric" : "text"}
                      />
                    </SectionField>

                    <HStack
                      rounded="20px"
                      border="1px solid rgba(31,184,157,0.2)"
                      bg="rgba(31,184,157,0.08)"
                      px="4"
                      py="3"
                      gap="3"
                      align="start"
                      color="var(--brand-200)"
                    >
                      <Check size={18} />
                      <Text fontSize="sm" lineHeight="1.7" color="var(--text-soft)">
                        After {ECNBA_SECURITY_POLICY.mfa.maxAttempts} failed MFA entries, access is paused for {ECNBA_SECURITY_POLICY.signIn.lockMinutes} minutes.
                      </Text>
                    </HStack>

                    <HStack gap="3" flexWrap="wrap">
                      <Button
                        type="button"
                        variant="ghost"
                        rounded="18px"
                        px="5"
                        color="var(--text-soft)"
                        onClick={resetSignInFlow}
                      >
                        Start over
                      </Button>
                      <Button
                        type="submit"
                        h="54px"
                        flex="1"
                        rounded="20px"
                        bg="linear-gradient(135deg, var(--brand-500), #14957e)"
                        color="#02110d"
                        fontWeight="800"
                        disabled={submitting}
                      >
                        {submitting ? "Validating second factor..." : "Unlock election session"}
                      </Button>
                    </HStack>
                  </Stack>
                </form>
              ) : null}

              <Text fontSize="sm" color="var(--text-dim)" lineHeight="1.75">
                Prototype note: the interface, policy, and MFA flow are production-oriented, but this demo stores records and secrets in the browser so the experience can be reviewed without a backend. Real deployment should move identity proofing, TOTP verification, retry counting, and session issuance to the server.
              </Text>

              <Stack gap="3" mt="auto">
                <Button
                  type="button"
                  h="56px"
                  rounded="20px"
                  bg="linear-gradient(135deg, var(--brand-500), #14957e)"
                  color="#02110d"
                  fontWeight="800"
                  _hover={{
                    transform: "translateY(-1px)",
                    boxShadow: "0 16px 36px rgba(31, 184, 157, 0.22)",
                  }}
                  _active={{ transform: "translateY(0)" }}
                  onClick={launchChairmanDemo}
                >
                  Preview Chairman dashboard
                </Button>
                <Button
                  type="button"
                  h="56px"
                  rounded="20px"
                  bg="rgba(255,255,255,0.05)"
                  color="var(--text-main)"
                  fontWeight="800"
                  _hover={{ bg: "rgba(255,255,255,0.1)" }}
                  _active={{ transform: "translateY(0)" }}
                  onClick={launchSecretaryDemo}
                >
                  Preview Secretary dashboard
                </Button>
                <Button
                  type="button"
                  h="56px"
                  rounded="20px"
                  bg="rgba(255,255,255,0.05)"
                  color="var(--text-main)"
                  fontWeight="800"
                  _hover={{ bg: "rgba(255,255,255,0.1)" }}
                  _active={{ transform: "translateY(0)" }}
                  onClick={launchAgentDemo}
                >
                  Preview Help Desk dashboard
                </Button>
                <Button
                  type="button"
                  h="56px"
                  rounded="20px"
                  bg="rgba(255,255,255,0.05)"
                  color="var(--text-main)"
                  fontWeight="800"
                  _hover={{ bg: "rgba(255,255,255,0.1)" }}
                  _active={{ transform: "translateY(0)" }}
                  onClick={launchObserverDemo}
                >
                  Preview Audit & Results portal
                </Button>
                <Text fontSize="sm" color="var(--text-soft)">
                  Open a role-aware command center for the Chairman, Secretary, Help Desk agent, or Observer and inspect secure election controls.
                </Text>
              </Stack>
            </Stack>
          </Flex>
          </GlassPanel>
        </Grid>
      </Box>
    </Box>
  );
}
