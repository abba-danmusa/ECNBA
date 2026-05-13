import { type ReactNode, useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CircleHelp,
  Copy,
  Lock,
  LogOut,
  ShieldCheck,
  TimerReset,
  UserRound,
  Users,
  Vote,
  Wifi,
  WifiOff,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { AuthSession } from "../lib/mockAuth";

type View = "ballot" | "review" | "receipt";
type Tone = "neutral" | "positive" | "critical";
type OfficeMode = "single" | "multi";

type Candidate = {
  id: string;
  name: string;
  branch: string;
  bio: string;
};

type BallotOffice = {
  id: string;
  title: string;
  subtitle: string;
  instructions: string;
  mode: OfficeMode;
  seats: number;
  maxSelections: number;
  candidates: Candidate[];
};

type BallotSelection = {
  candidateIds: string[];
  abstained: boolean;
};

type BallotSelections = Record<string, BallotSelection>;

type BallotDraft = {
  selections: BallotSelections;
  updatedAt: string;
};

type SubmittedReceipt = {
  receiptId: string;
  commitmentHash: string;
  trackingCode: string;
  verificationCode: string;
  submittedAt: string;
  pollsCloseAt: string;
  contestCount: number;
  abstentionCount: number;
  selectionCount: number;
  qrValue: string;
  copyValue: string;
};

const POLLS_CLOSES_AT = "2026-05-16T17:00:00+01:00";
const DRAFT_STORAGE_PREFIX = "ecnba-voter-draft:v1:";
const RECEIPT_STORAGE_PREFIX = "ecnba-voter-receipt:v1:";

const BALLOT_OFFICES: BallotOffice[] = [
  {
    id: "president",
    title: "President",
    subtitle: "1 seat",
    instructions: "Choose one candidate or explicitly abstain.",
    mode: "single",
    seats: 1,
    maxSelections: 1,
    candidates: [
      {
        id: "president-adeyemi",
        name: "Mariam A. Adeyemi, SAN",
        branch: "Lagos",
        bio: "Campaigns on court reform, member services, and transparent budgeting.",
      },
      {
        id: "president-okafor",
        name: "Chinedu E. Okafor",
        branch: "Abuja",
        bio: "Focuses on faster disciplinary processes and branch technology upgrades.",
      },
      {
        id: "president-idowu",
        name: "Titi O. Idowu",
        branch: "Port Harcourt",
        bio: "Prioritises welfare delivery, training access, and regional inclusion.",
      },
    ],
  },
  {
    id: "vice-president",
    title: "Vice President",
    subtitle: "1 seat",
    instructions: "Choose one candidate or explicitly abstain.",
    mode: "single",
    seats: 1,
    maxSelections: 1,
    candidates: [
      {
        id: "vp-danjuma",
        name: "Bello Danjuma",
        branch: "Kaduna",
        bio: "Backs branch operations support and national mentorship pipelines.",
      },
      {
        id: "vp-oladipo",
        name: "Kemi Oladipo",
        branch: "Ibadan",
        bio: "Advocates member protection, hybrid meetings, and women-in-law initiatives.",
      },
      {
        id: "vp-ezike",
        name: "Uche Ezike",
        branch: "Enugu",
        bio: "Running on policy coordination, litigation support, and inclusion metrics.",
      },
    ],
  },
  {
    id: "general-secretary",
    title: "General Secretary",
    subtitle: "1 seat",
    instructions: "Choose one candidate or explicitly abstain.",
    mode: "single",
    seats: 1,
    maxSelections: 1,
    candidates: [
      {
        id: "gs-obaseki",
        name: "Favour Obaseki",
        branch: "Benin",
        bio: "Promises stronger records management and cleaner member communications.",
      },
      {
        id: "gs-balogun",
        name: "Deji Balogun",
        branch: "Ilorin",
        bio: "Pushes for constitutional compliance workflows and branch response SLAs.",
      },
      {
        id: "gs-hassan",
        name: "Rukayat Hassan",
        branch: "Kano",
        bio: "Focused on secretariat digitisation and timely circular publication.",
      },
    ],
  },
  {
    id: "assistant-general-secretary",
    title: "Assistant General Secretary",
    subtitle: "1 seat",
    instructions: "Choose one candidate or explicitly abstain.",
    mode: "single",
    seats: 1,
    maxSelections: 1,
    candidates: [
      {
        id: "ags-anuoluwapo",
        name: "Anuoluwapo Fashola",
        branch: "Abeokuta",
        bio: "Supports branch filing standards and faster committee coordination.",
      },
      {
        id: "ags-ibrahim",
        name: "Nafisat Ibrahim",
        branch: "Jos",
        bio: "Wants tighter election documentation and volunteer service programmes.",
      },
      {
        id: "ags-nduka",
        name: "Emeka Nduka",
        branch: "Owerri",
        bio: "Centres operational continuity, archives, and cross-branch onboarding.",
      },
    ],
  },
  {
    id: "treasurer",
    title: "Treasurer",
    subtitle: "1 seat",
    instructions: "Choose one candidate or explicitly abstain.",
    mode: "single",
    seats: 1,
    maxSelections: 1,
    candidates: [
      {
        id: "treasurer-udoh",
        name: "Iniobong Udoh",
        branch: "Uyo",
        bio: "Running on monthly treasury disclosures and cleaner audit trails.",
      },
      {
        id: "treasurer-ajayi",
        name: "Seun Ajayi",
        branch: "Akure",
        bio: "Promises payment transparency, budget dashboards, and reserve planning.",
      },
      {
        id: "treasurer-bassey",
        name: "Mercy Bassey",
        branch: "Calabar",
        bio: "Focused on member dues reconciliation and stronger spending controls.",
      },
    ],
  },
  {
    id: "publicity-secretary",
    title: "Publicity Secretary",
    subtitle: "1 seat",
    instructions: "Choose one candidate or explicitly abstain.",
    mode: "single",
    seats: 1,
    maxSelections: 1,
    candidates: [
      {
        id: "publicity-adelaja",
        name: "Tosin Adelaja",
        branch: "Osogbo",
        bio: "Advocates clear member briefings, media discipline, and civic trust.",
      },
      {
        id: "publicity-mordi",
        name: "Ese Mordi",
        branch: "Warri",
        bio: "Focuses on crisis communication and member-facing public education.",
      },
      {
        id: "publicity-onyema",
        name: "Kingsley Onyema",
        branch: "Awka",
        bio: "Campaigns on multilingual updates and branch storytelling standards.",
      },
    ],
  },
  {
    id: "representatives",
    title: "NBA Representatives to the General Council of the Bar",
    subtitle: "5 seats",
    instructions: "Choose up to 5 candidates or explicitly abstain.",
    mode: "multi",
    seats: 5,
    maxSelections: 5,
    candidates: [
      {
        id: "rep-ogundipe",
        name: "Amina Ogundipe",
        branch: "Lagos",
        bio: "Specialises in legal policy and bar governance oversight.",
      },
      {
        id: "rep-okorie",
        name: "Chukwudi Okorie",
        branch: "Abuja",
        bio: "Known for ethics reform advocacy and disciplinary process reviews.",
      },
      {
        id: "rep-momoh",
        name: "Zainab Momoh",
        branch: "Benin",
        bio: "Supports young lawyers' access, branch representation, and training.",
      },
      {
        id: "rep-danjuma",
        name: "Ibrahim Danjuma",
        branch: "Kaduna",
        bio: "Campaigning on federal balance, cost control, and policy follow-through.",
      },
      {
        id: "rep-igwe",
        name: "Nkiru Igwe",
        branch: "Enugu",
        bio: "Focused on rights advocacy and clear national council reporting.",
      },
      {
        id: "rep-adebayo",
        name: "Yetunde Adebayo",
        branch: "Ibadan",
        bio: "Backs constitutional literacy and branch consultation standards.",
      },
      {
        id: "rep-suleiman",
        name: "Kabir Suleiman",
        branch: "Kano",
        bio: "Promotes regional inclusion and transparent committee attendance.",
      },
      {
        id: "rep-fyneface",
        name: "Tarela Fyneface",
        branch: "Port Harcourt",
        bio: "Wants stronger public-interest coordination and policy continuity.",
      },
    ],
  },
];

function GlassPanel({
  children,
  accent = "rgba(31, 184, 157, 0.16)",
  lowBandwidth = false,
}: {
  children: ReactNode;
  accent?: string;
  lowBandwidth?: boolean;
}) {
  return (
    <Box
      className={lowBandwidth ? undefined : "panel-rise shadow-[0_28px_90px_rgba(2,8,14,0.46)]"}
      bg={lowBandwidth ? "rgba(7, 16, 26, 0.96)" : "var(--panel-bg)"}
      border="1px solid var(--panel-border)"
      rounded="28px"
      position="relative"
      overflow="hidden"
      backdropFilter={lowBandwidth ? "none" : "blur(16px)"}
      _before={{
        content: '""',
        position: "absolute",
        inset: "0",
        bgGradient: lowBandwidth ? undefined : `linear(135deg, ${accent}, transparent 40%)`,
        pointerEvents: "none",
      }}
    >
      <Box position="relative" zIndex={1}>
        {children}
      </Box>
    </Box>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Stack
      rounded="22px"
      border="1px solid var(--line-soft)"
      bg="rgba(255,255,255,0.025)"
      px="5"
      py="4"
      gap="1.5"
    >
      <Text fontSize="xs" letterSpacing="0.2em" textTransform="uppercase" color="var(--text-dim)">
        {label}
      </Text>
      <Text fontFamily='"Sora", sans-serif' fontWeight="700" fontSize="xl" color="var(--text-main)">
        {value}
      </Text>
      <Text fontSize="sm" color="var(--text-soft)" lineHeight="1.6">
        {hint}
      </Text>
    </Stack>
  );
}

function InfoBanner({
  tone,
  message,
}: {
  tone: Tone;
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
      lineHeight="1.65"
    >
      {message}
    </Box>
  );
}

function createInitialSelections(): BallotSelections {
  return Object.fromEntries(
    BALLOT_OFFICES.map((office) => [office.id, { candidateIds: [], abstained: false }]),
  );
}

function getDraftStorageKey(memberId: string): string {
  return `${DRAFT_STORAGE_PREFIX}${memberId}`;
}

function getReceiptStorageKey(memberId: string): string {
  return `${RECEIPT_STORAGE_PREFIX}${memberId}`;
}

function readLocalStorage<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: unknown): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeLocalStorage(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}

function mergeSelections(draft: BallotSelections | null): BallotSelections {
  const initial = createInitialSelections();

  if (!draft) {
    return initial;
  }

  return Object.fromEntries(
    BALLOT_OFFICES.map((office) => {
      const current = draft[office.id];

      if (!current) {
        return [office.id, initial[office.id]];
      }

      return [
        office.id,
        {
          abstained: Boolean(current.abstained),
          candidateIds: Array.isArray(current.candidateIds) ? current.candidateIds : [],
        },
      ];
    }),
  );
}

function isOfficeComplete(office: BallotOffice, selection: BallotSelection | undefined): boolean {
  if (!selection) {
    return false;
  }

  if (selection.abstained) {
    return true;
  }

  if (office.mode === "single") {
    return selection.candidateIds.length === 1;
  }

  return selection.candidateIds.length > 0;
}

function getSelectedCandidateNames(
  office: BallotOffice,
  selection: BallotSelection | undefined,
): string[] {
  if (!selection || selection.abstained) {
    return [];
  }

  return office.candidates
    .filter((candidate) => selection.candidateIds.includes(candidate.id))
    .map((candidate) => candidate.name);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCountdown(milliseconds: number): string {
  if (milliseconds <= 0) {
    return "Polls closed";
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
  }

  return `${hours.toString().padStart(2, "0")}h ${minutes
    .toString()
    .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function createReceipt(
  session: AuthSession,
  selections: BallotSelections,
): Promise<SubmittedReceipt> {
  const submittedAt = new Date().toISOString();
  const normalizedSelections = BALLOT_OFFICES.map((office) => {
    const selection = selections[office.id] ?? { candidateIds: [], abstained: false };

    return {
      officeId: office.id,
      abstained: selection.abstained,
      candidateIds: [...selection.candidateIds].sort(),
    };
  });

  const payload = JSON.stringify({
    voter: session.memberId,
    branch: session.branch,
    issuedAt: submittedAt,
    nonce: crypto.randomUUID(),
    selections: normalizedSelections,
  });

  const commitmentHash = await sha256Hex(payload);
  const trackingCode = commitmentHash.slice(0, 12).toUpperCase();
  const verificationCode = [
    commitmentHash.slice(12, 16),
    commitmentHash.slice(16, 20),
    commitmentHash.slice(20, 24),
  ]
    .map((segment) => segment.toUpperCase())
    .join("-");
  const receiptId = `ECNBA-${session.memberId.replace(/[^A-Z0-9]/gi, "").slice(-6).toUpperCase()}-${trackingCode.slice(0, 6)}`;
  const abstentionCount = normalizedSelections.filter((selection) => selection.abstained).length;
  const selectionCount = normalizedSelections.reduce(
    (total, selection) => total + selection.candidateIds.length,
    0,
  );
  const copyValue = [
    "ECNBA Cryptographic Voting Receipt",
    `Receipt ID: ${receiptId}`,
    `Tracking code: ${trackingCode}`,
    `Verification code: ${verificationCode}`,
    `Commitment hash: ${commitmentHash}`,
    `Submitted at: ${formatDateTime(submittedAt)}`,
    `Polls close at: ${formatDateTime(POLLS_CLOSES_AT)}`,
    `Contests sealed: ${normalizedSelections.length}`,
    `Abstentions recorded: ${abstentionCount}`,
    "This receipt confirms ballot inclusion without revealing your selections.",
  ].join("\n");

  return {
    receiptId,
    commitmentHash,
    trackingCode,
    verificationCode,
    submittedAt,
    pollsCloseAt: POLLS_CLOSES_AT,
    contestCount: normalizedSelections.length,
    abstentionCount,
    selectionCount,
    qrValue: copyValue,
    copyValue,
  };
}

function CandidateCard({
  office,
  candidate,
  selected,
  lowBandwidth,
  onChoose,
}: {
  office: BallotOffice;
  candidate: Candidate;
  selected: boolean;
  lowBandwidth: boolean;
  onChoose: () => void;
}) {
  return (
    <Box
      as="button"
      onClick={onChoose}
      textAlign="left"
      rounded="24px"
      border="1px solid"
      borderColor={selected ? "rgba(31,184,157,0.56)" : "var(--line-soft)"}
      bg={selected ? "rgba(31,184,157,0.12)" : "rgba(255,255,255,0.025)"}
      px="5"
      py="4"
      transition="transform 160ms ease, border-color 160ms ease, background 160ms ease"
      _hover={{
        transform: "translateY(-2px)",
        borderColor: "rgba(31,184,157,0.4)",
      }}
    >
      <Flex align="start" justify="space-between" gap="4">
        <Stack gap="2">
          <HStack gap="2" align="center" wrap="wrap">
            <Text fontWeight="700" color="var(--text-main)">
              {candidate.name}
            </Text>
            <Text
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="0.18em"
              color="var(--text-dim)"
            >
              {candidate.branch}
            </Text>
          </HStack>
          <Text fontSize="sm" color="var(--text-soft)" lineHeight="1.65">
            {candidate.bio}
          </Text>
        </Stack>

        <Box
          flexShrink={0}
          rounded="full"
          px="3"
          py="1.5"
          border="1px solid"
          borderColor={selected ? "rgba(31,184,157,0.45)" : "rgba(255,255,255,0.08)"}
          bg={selected ? "rgba(31,184,157,0.16)" : "rgba(255,255,255,0.02)"}
          color={selected ? "var(--brand-200)" : "var(--text-dim)"}
          fontSize="xs"
          letterSpacing="0.16em"
          textTransform="uppercase"
        >
          {selected ? (office.mode === "multi" ? "Selected" : "Chosen") : lowBandwidth ? "Pick" : "Select"}
        </Box>
      </Flex>
    </Box>
  );
}

function OfficeCard({
  office,
  selection,
  lowBandwidth,
  onToggleCandidate,
  onToggleAbstain,
}: {
  office: BallotOffice;
  selection: BallotSelection;
  lowBandwidth: boolean;
  onToggleCandidate: (office: BallotOffice, candidateId: string) => void;
  onToggleAbstain: (officeId: string) => void;
}) {
  const selectedCount = selection.candidateIds.length;
  const officeComplete = isOfficeComplete(office, selection);

  return (
    <GlassPanel
      accent={office.mode === "multi" ? "rgba(240, 177, 75, 0.14)" : "rgba(31, 184, 157, 0.14)"}
      lowBandwidth={lowBandwidth}
    >
      <Stack gap="5" px={{ base: "5", md: "6" }} py={{ base: "5", md: "6" }}>
        <Flex align={{ base: "start", md: "center" }} justify="space-between" gap="4" wrap="wrap">
          <Stack gap="2">
            <HStack gap="3" wrap="wrap">
              <Heading fontFamily='"Sora", sans-serif' fontSize={{ base: "xl", md: "2xl" }} color="var(--text-main)">
                {office.title}
              </Heading>
              <Text
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="0.18em"
                rounded="full"
                px="3"
                py="1.5"
                border="1px solid var(--line-soft)"
                color="var(--text-dim)"
              >
                {office.subtitle}
              </Text>
              {officeComplete ? (
                <HStack
                  gap="2"
                  rounded="full"
                  border="1px solid rgba(31,184,157,0.26)"
                  bg="rgba(31,184,157,0.08)"
                  px="3"
                  py="1.5"
                  color="var(--brand-200)"
                >
                  <Check size={14} />
                  <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.16em">
                    Captured
                  </Text>
                </HStack>
              ) : null}
            </HStack>
            <Text color="var(--text-soft)" fontSize="sm" lineHeight="1.7">
              {office.instructions}
            </Text>
          </Stack>

          <Button
            type="button"
            variant="ghost"
            rounded="full"
            px="4"
            border="1px solid"
            borderColor={selection.abstained ? "rgba(240,177,75,0.3)" : "var(--line-soft)"}
            bg={selection.abstained ? "rgba(240,177,75,0.12)" : "rgba(255,255,255,0.02)"}
            color={selection.abstained ? "#f6cf89" : "var(--text-soft)"}
            onClick={() => onToggleAbstain(office.id)}
          >
            {selection.abstained ? "Abstaining" : "Abstain"}
          </Button>
        </Flex>

        {office.mode === "multi" ? (
          <HStack
            rounded="20px"
            border="1px solid rgba(240,177,75,0.2)"
            bg="rgba(240,177,75,0.08)"
            px="4"
            py="3"
            justify="space-between"
            flexWrap="wrap"
            gap="3"
          >
            <Text fontSize="sm" color="#f7ce83">
              {selection.abstained
                ? "Representative selection skipped for this ballot."
                : `${selectedCount} of ${office.maxSelections} representative slots chosen.`}
            </Text>
            {!selection.abstained && selectedCount === office.maxSelections ? (
              <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.18em" color="#f7ce83">
                Limit reached
              </Text>
            ) : null}
          </HStack>
        ) : null}

        {selection.abstained ? (
          <InfoBanner
            tone="neutral"
            message="This office is marked as abstained. Choosing a candidate will clear the abstention."
          />
        ) : null}

        <Stack gap="3">
          {office.candidates.map((candidate) => {
            const selected = selection.candidateIds.includes(candidate.id);
            const limitReached =
              office.mode === "multi" &&
              !selected &&
              selection.candidateIds.length >= office.maxSelections;

            return (
              <Box
                key={candidate.id}
                opacity={limitReached ? 0.55 : 1}
                pointerEvents={limitReached ? "none" : "auto"}
              >
                <CandidateCard
                  office={office}
                  candidate={candidate}
                  selected={selected}
                  lowBandwidth={lowBandwidth}
                  onChoose={() => onToggleCandidate(office, candidate.id)}
                />
              </Box>
            );
          })}
        </Stack>
      </Stack>
    </GlassPanel>
  );
}

export function VoterDashboard({
  session,
  onCloseSession,
}: {
  session: AuthSession;
  onCloseSession: () => void;
}) {
  const [view, setView] = useState<View>("ballot");
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState<{ tone: Tone; message: string } | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [selections, setSelections] = useState<BallotSelections>(() => createInitialSelections());
  const [receipt, setReceipt] = useState<SubmittedReceipt | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const storedReceipt = readLocalStorage<SubmittedReceipt>(getReceiptStorageKey(session.memberId));

    if (storedReceipt) {
      setReceipt(storedReceipt);
      setSelections(createInitialSelections());
      setDraftSavedAt(null);
      setNotice({
        tone: "neutral",
        message:
          "This member profile has already cast a ballot on this device. The receipt remains available, and duplicate voting is locked.",
      });
      removeLocalStorage(getDraftStorageKey(session.memberId));
      setHydrated(true);
      return;
    }

    const storedDraft = readLocalStorage<BallotDraft>(getDraftStorageKey(session.memberId));

    if (storedDraft) {
      setSelections(mergeSelections(storedDraft.selections));
      setDraftSavedAt(storedDraft.updatedAt);
      setNotice({
        tone: "positive",
        message:
          "A saved ballot draft was restored for this verified voter session. Review each office before submission.",
      });
    } else {
      setSelections(createInitialSelections());
      setDraftSavedAt(null);
      setNotice({
        tone: "neutral",
        message:
          "Selections are autosaved on this device until submission. Every office must be answered by choosing a candidate or abstaining.",
      });
    }

    setHydrated(true);
  }, [session.memberId]);

  useEffect(() => {
    if (!hydrated || receipt) {
      return;
    }

    const updatedAt = new Date().toISOString();
    writeLocalStorage(getDraftStorageKey(session.memberId), {
      selections,
      updatedAt,
    } satisfies BallotDraft);
    setDraftSavedAt(updatedAt);
  }, [hydrated, receipt, selections, session.memberId]);

  const completedOffices = BALLOT_OFFICES.filter((office) =>
    isOfficeComplete(office, selections[office.id]),
  ).length;
  const totalOffices = BALLOT_OFFICES.length;
  const progressPercent = Math.round((completedOffices / totalOffices) * 100);
  const representativesSelected = selections.representatives?.candidateIds.length ?? 0;
  const pollsCloseIn = formatCountdown(new Date(POLLS_CLOSES_AT).getTime() - now);
  const remainingOffices = BALLOT_OFFICES.filter(
    (office) => !isOfficeComplete(office, selections[office.id]),
  );

  function updateSelection(officeId: string, next: BallotSelection) {
    setSelections((current) => ({
      ...current,
      [officeId]: next,
    }));
  }

  function handleToggleCandidate(office: BallotOffice, candidateId: string) {
    const current = selections[office.id] ?? { candidateIds: [], abstained: false };

    if (office.mode === "single") {
      updateSelection(office.id, {
        abstained: false,
        candidateIds: [candidateId],
      });
      return;
    }

    const alreadySelected = current.candidateIds.includes(candidateId);
    const nextCandidateIds = alreadySelected
      ? current.candidateIds.filter((id) => id !== candidateId)
      : current.candidateIds.length < office.maxSelections
        ? [...current.candidateIds, candidateId]
        : current.candidateIds;

    updateSelection(office.id, {
      abstained: false,
      candidateIds: nextCandidateIds,
    });
  }

  function handleToggleAbstain(officeId: string) {
    const current = selections[officeId] ?? { candidateIds: [], abstained: false };

    updateSelection(officeId, {
      abstained: !current.abstained,
      candidateIds: [],
    });
  }

  async function handleSubmitBallot() {
    setSubmitting(true);
    setNotice(null);

    try {
      const nextReceipt = await createReceipt(session, selections);
      writeLocalStorage(getReceiptStorageKey(session.memberId), nextReceipt);
      removeLocalStorage(getDraftStorageKey(session.memberId));
      setReceipt(nextReceipt);
      setView("receipt");
      setCopyState("idle");
      setNotice({
        tone: "positive",
        message:
          "Your ballot has been encrypted, sealed, and recorded for this prototype session. Keep the receipt to verify inclusion later.",
      });
    } catch (error) {
      setNotice({
        tone: "critical",
        message:
          error instanceof Error
            ? error.message
            : "The ballot could not be sealed right now. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyReceipt() {
    if (!receipt) {
      return;
    }

    await navigator.clipboard.writeText(receipt.copyValue);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  return (
    <Box minH="100vh" position="relative" overflow="hidden" bg="var(--page-bg)">
      {!lowBandwidth ? (
        <>
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
        </>
      ) : null}

      <Box maxW="1440px" mx="auto" px={{ base: "5", md: "8", xl: "10" }} py={{ base: "6", md: "8", xl: "10" }}>
        <Stack gap="6">
          <GlassPanel accent="rgba(31, 184, 157, 0.12)" lowBandwidth={lowBandwidth}>
            <Stack gap="6" px={{ base: "6", md: "8", xl: "10" }} py={{ base: "6", md: "7", xl: "8" }}>
              <Flex align={{ base: "start", xl: "center" }} justify="space-between" gap="5" wrap="wrap">
                <Stack gap="4" maxW="3xl">
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
                    <Vote size={16} />
                    <Text fontSize="xs" letterSpacing="0.18em" textTransform="uppercase" fontWeight="700">
                      Verified voter dashboard
                    </Text>
                  </HStack>

                  <Stack gap="3">
                    <Heading
                      fontFamily='"Sora", sans-serif'
                      fontWeight="700"
                      letterSpacing="-0.03em"
                      lineHeight="1.03"
                      fontSize={{ base: "3xl", md: "4xl", xl: "5xl" }}
                      color="var(--text-main)"
                    >
                      Cast a complete ECNBA ballot with progress visibility, review safeguards, and a sealed receipt.
                    </Heading>
                    <Text color="var(--text-soft)" fontSize={{ base: "md", md: "lg" }} lineHeight="1.8" maxW="2xl">
                      Welcome back, {session.displayName}. Your secure session is active for {session.branch}, and this prototype keeps the voter journey explicit from first selection to final confirmation.
                    </Text>
                  </Stack>

                  <HStack gap="3" wrap="wrap">
                    <HStack
                      rounded="full"
                      border="1px solid rgba(31,184,157,0.22)"
                      bg="rgba(31,184,157,0.08)"
                      px="4"
                      py="2"
                      color="var(--brand-200)"
                    >
                      <ShieldCheck size={15} />
                      <Text fontSize="sm" fontWeight="700">
                        {session.assurance}
                      </Text>
                    </HStack>
                    <HStack
                      rounded="full"
                      border="1px solid var(--line-soft)"
                      bg="rgba(255,255,255,0.03)"
                      px="4"
                      py="2"
                      color="var(--text-soft)"
                    >
                      <UserRound size={15} />
                      <Text fontSize="sm">
                        {session.memberId} • {session.branch}
                      </Text>
                    </HStack>
                  </HStack>
                </Stack>

                <Stack gap="3" align={{ base: "stretch", md: "end" }} minW={{ xl: "310px" }}>
                  <HStack gap="3" wrap="wrap" justify={{ base: "start", md: "end" }}>
                    <Button
                      type="button"
                      rounded="full"
                      px="4"
                      border="1px solid var(--line-soft)"
                      bg="rgba(255,255,255,0.03)"
                      color="var(--text-soft)"
                      onClick={() => setLowBandwidth((current) => !current)}
                    >
                      <HStack gap="2">
                        {lowBandwidth ? <WifiOff size={16} /> : <Wifi size={16} />}
                        <Text as="span">{lowBandwidth ? "Low-bandwidth on" : "Low-bandwidth off"}</Text>
                      </HStack>
                    </Button>
                    <Button
                      type="button"
                      rounded="full"
                      px="4"
                      border="1px solid var(--line-soft)"
                      bg="rgba(255,255,255,0.03)"
                      color="var(--text-soft)"
                      onClick={onCloseSession}
                    >
                      <HStack gap="2">
                        <LogOut size={16} />
                        <Text as="span">Close session</Text>
                      </HStack>
                    </Button>
                  </HStack>

                  <SimpleGrid columns={{ base: 1, sm: 2 }} gap="3" w="full">
                    <MetricCard
                      label="Ballot progress"
                      value={`${completedOffices}/${totalOffices}`}
                      hint={receipt ? "Ballot sealed and locked." : "Every office must be answered before review."}
                    />
                    <MetricCard
                      label="Polls close"
                      value={pollsCloseIn}
                      hint={`Scheduled close: ${formatDateTime(POLLS_CLOSES_AT)}`}
                    />
                  </SimpleGrid>
                </Stack>
              </Flex>

              {notice ? <InfoBanner tone={notice.tone} message={notice.message} /> : null}
            </Stack>
          </GlassPanel>

          <Grid templateColumns={{ base: "1fr", xl: lowBandwidth ? "1fr" : "1.14fr 0.86fr" }} gap="6" alignItems="start">
            <Stack gap="5">
              {view === "ballot" && receipt ? (
                <GlassPanel accent="rgba(31, 184, 157, 0.16)" lowBandwidth={lowBandwidth}>
                  <Stack gap="5" px={{ base: "5", md: "6" }} py={{ base: "6", md: "7" }}>
                    <HStack gap="3" color="var(--brand-200)">
                      <BadgeCheck size={18} />
                      <Text fontWeight="700" color="var(--text-main)">
                        Ballot already cast
                      </Text>
                    </HStack>
                    <Text color="var(--text-soft)" lineHeight="1.75">
                      This dashboard is now read-only for {session.memberId}. The recorded ballot cannot be opened again, which prevents duplicate voting in the prototype flow.
                    </Text>

                    <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
                      <MetricCard
                        label="Receipt ID"
                        value={receipt.receiptId}
                        hint="Use this as the member-facing reference number."
                      />
                      <MetricCard
                        label="Submission time"
                        value={formatDateTime(receipt.submittedAt)}
                        hint="Timestamp of the sealed ballot entry."
                      />
                      <MetricCard
                        label="Contests sealed"
                        value={receipt.contestCount.toString()}
                        hint={`${receipt.abstentionCount} abstentions and ${receipt.selectionCount} selections recorded.`}
                      />
                    </SimpleGrid>

                    <HStack gap="3" flexWrap="wrap">
                      <Button
                        type="button"
                        h="54px"
                        rounded="20px"
                        bg="linear-gradient(135deg, var(--brand-500), #14957e)"
                        color="#02110d"
                        fontWeight="800"
                        onClick={() => setView("receipt")}
                      >
                        View cryptographic receipt
                      </Button>
                      <Button
                        type="button"
                        rounded="20px"
                        variant="ghost"
                        color="var(--text-soft)"
                        border="1px solid var(--line-soft)"
                        onClick={handleCopyReceipt}
                      >
                        <HStack gap="2">
                          <Copy size={16} />
                          <Text as="span">{copyState === "copied" ? "Copied" : "Copy receipt"}</Text>
                        </HStack>
                      </Button>
                    </HStack>
                  </Stack>
                </GlassPanel>
              ) : null}

              {view === "ballot" && !receipt ? (
                <>
                  {BALLOT_OFFICES.map((office) => (
                    <OfficeCard
                      key={office.id}
                      office={office}
                      selection={selections[office.id] ?? { candidateIds: [], abstained: false }}
                      lowBandwidth={lowBandwidth}
                      onToggleCandidate={handleToggleCandidate}
                      onToggleAbstain={handleToggleAbstain}
                    />
                  ))}

                  <GlassPanel accent="rgba(240, 177, 75, 0.12)" lowBandwidth={lowBandwidth}>
                    <Stack gap="4" px={{ base: "5", md: "6" }} py={{ base: "5", md: "6" }}>
                      <HStack gap="3" color="#f6cf89">
                        <Lock size={18} />
                        <Text fontWeight="700" color="var(--text-main)">
                          Review before submission
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color="var(--text-soft)" lineHeight="1.75">
                        You will review every office on the next screen before the ballot is sealed. Incomplete offices must be answered by making a choice or abstaining.
                      </Text>
                      <HStack gap="3" flexWrap="wrap">
                        <Button
                          type="button"
                          h="54px"
                          flex="1"
                          rounded="20px"
                          bg="linear-gradient(135deg, var(--brand-500), #14957e)"
                          color="#02110d"
                          fontWeight="800"
                          disabled={remainingOffices.length > 0}
                          onClick={() => setView("review")}
                        >
                          <HStack gap="2">
                            <Text as="span">
                              {remainingOffices.length > 0
                                ? `Answer ${remainingOffices.length} more office${remainingOffices.length > 1 ? "s" : ""}`
                                : "Continue to review"}
                            </Text>
                            <ArrowRight size={16} />
                          </HStack>
                        </Button>
                      </HStack>
                    </Stack>
                  </GlassPanel>
                </>
              ) : null}

              {view === "review" && !receipt ? (
                <GlassPanel accent="rgba(240, 177, 75, 0.14)" lowBandwidth={lowBandwidth}>
                  <Stack gap="6" px={{ base: "5", md: "6", xl: "7" }} py={{ base: "6", md: "7" }}>
                    <Stack gap="3">
                      <HStack gap="3" color="#f6cf89">
                        <TimerReset size={18} />
                        <Text fontWeight="700" color="var(--text-main)">
                          Review ballot selections
                        </Text>
                      </HStack>
                      <Heading fontFamily='"Sora", sans-serif' fontSize={{ base: "2xl", md: "3xl" }} color="var(--text-main)">
                        Confirm every office before you seal the ballot.
                      </Heading>
                      <Text color="var(--text-soft)" lineHeight="1.8">
                        This is the last screen where choices are shown in plain language. After submission, the receipt confirms inclusion without exposing your selections.
                      </Text>
                    </Stack>

                    <Stack gap="4">
                      {BALLOT_OFFICES.map((office) => {
                        const selection = selections[office.id];
                        const selectedNames = getSelectedCandidateNames(office, selection);

                        return (
                          <Box
                            key={office.id}
                            rounded="24px"
                            border="1px solid var(--line-soft)"
                            bg="rgba(255,255,255,0.025)"
                            px={{ base: "4", md: "5" }}
                            py={{ base: "4", md: "5" }}
                          >
                            <Flex align={{ base: "start", md: "center" }} justify="space-between" gap="4" wrap="wrap">
                              <Stack gap="2">
                                <Text fontWeight="700" color="var(--text-main)">
                                  {office.title}
                                </Text>
                                <Text fontSize="sm" color="var(--text-soft)" lineHeight="1.7">
                                  {selection?.abstained
                                    ? "Abstained"
                                    : selectedNames.length > 0
                                      ? selectedNames.join(", ")
                                      : "No answer recorded"}
                                </Text>
                              </Stack>
                              <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.18em" color="var(--text-dim)">
                                {selection?.abstained
                                  ? "Abstain"
                                  : office.mode === "multi"
                                    ? `${selectedNames.length}/${office.maxSelections} selected`
                                    : "1 selected"}
                              </Text>
                            </Flex>
                          </Box>
                        );
                      })}
                    </Stack>

                    <HStack gap="3" flexWrap="wrap">
                      <Button
                        type="button"
                        rounded="20px"
                        variant="ghost"
                        color="var(--text-soft)"
                        border="1px solid var(--line-soft)"
                        onClick={() => setView("ballot")}
                      >
                        <HStack gap="2">
                          <ArrowLeft size={16} />
                          <Text as="span">Back to ballot</Text>
                        </HStack>
                      </Button>
                      <Button
                        type="button"
                        h="54px"
                        flex="1"
                        rounded="20px"
                        bg="linear-gradient(135deg, var(--brand-500), #14957e)"
                        color="#02110d"
                        fontWeight="800"
                        disabled={submitting}
                        onClick={handleSubmitBallot}
                      >
                        {submitting ? "Sealing ballot..." : "Submit sealed ballot"}
                      </Button>
                    </HStack>
                  </Stack>
                </GlassPanel>
              ) : null}

              {view === "receipt" && receipt ? (
                <GlassPanel accent="rgba(31, 184, 157, 0.16)" lowBandwidth={lowBandwidth}>
                  <Stack gap="6" px={{ base: "5", md: "6", xl: "7" }} py={{ base: "6", md: "7" }}>
                    <Stack gap="3">
                      <HStack gap="3" color="var(--brand-200)">
                        <BadgeCheck size={18} />
                        <Text fontWeight="700" color="var(--text-main)">
                          Ballot confirmed
                        </Text>
                      </HStack>
                      <Heading fontFamily='"Sora", sans-serif' fontSize={{ base: "2xl", md: "3xl" }} color="var(--text-main)">
                        Your encrypted ballot has been recorded.
                      </Heading>
                      <Text color="var(--text-soft)" lineHeight="1.8">
                        Keep this receipt as a voter-facing proof of inclusion. It is intentionally non-revealing, so it does not list the candidates you selected.
                      </Text>
                    </Stack>

                    <Grid templateColumns={{ base: "1fr", lg: lowBandwidth ? "1fr" : "1fr 320px" }} gap="5">
                      <Stack
                        rounded="26px"
                        border="1px solid var(--line-soft)"
                        bg="rgba(255,255,255,0.025)"
                        p="5"
                        gap="4"
                      >
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                          <MetricCard
                            label="Receipt ID"
                            value={receipt.receiptId}
                            hint="Member-facing receipt reference."
                          />
                          <MetricCard
                            label="Tracking code"
                            value={receipt.trackingCode}
                            hint="Short code for help desk validation."
                          />
                          <MetricCard
                            label="Verification code"
                            value={receipt.verificationCode}
                            hint="Secondary lookup phrase."
                          />
                          <MetricCard
                            label="Submitted"
                            value={formatDateTime(receipt.submittedAt)}
                            hint={`Polls close at ${formatDateTime(receipt.pollsCloseAt)}.`}
                          />
                        </SimpleGrid>

                        <Stack
                          rounded="22px"
                          border="1px solid rgba(31,184,157,0.26)"
                          bg="rgba(31,184,157,0.08)"
                          px="4"
                          py="4"
                          gap="2"
                        >
                          <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.2em" color="var(--brand-200)">
                            Commitment hash
                          </Text>
                          <Text
                            fontFamily='"Sora", sans-serif'
                            fontSize={{ base: "sm", md: "md" }}
                            color="var(--text-main)"
                            lineHeight="1.8"
                            wordBreak="break-all"
                          >
                            {receipt.commitmentHash}
                          </Text>
                        </Stack>

                        <HStack gap="3" flexWrap="wrap">
                          <Button
                            type="button"
                            rounded="20px"
                            variant="ghost"
                            color="var(--text-soft)"
                            border="1px solid var(--line-soft)"
                            onClick={handleCopyReceipt}
                          >
                            <HStack gap="2">
                              <Copy size={16} />
                              <Text as="span">{copyState === "copied" ? "Copied" : "Copy receipt"}</Text>
                            </HStack>
                          </Button>
                          <Button
                            type="button"
                            h="54px"
                            flex="1"
                            rounded="20px"
                            bg="linear-gradient(135deg, var(--brand-500), #14957e)"
                            color="#02110d"
                            fontWeight="800"
                            onClick={() => setView("ballot")}
                          >
                            Return to dashboard
                          </Button>
                        </HStack>
                      </Stack>

                      {!lowBandwidth ? (
                        <Stack
                          rounded="26px"
                          border="1px solid var(--line-soft)"
                          bg="rgba(255,255,255,0.025)"
                          p="5"
                          gap="4"
                          align="center"
                          justify="center"
                        >
                          <Text fontSize="sm" fontWeight="700" color="var(--text-main)">
                            Receipt QR
                          </Text>
                          <Box rounded="24px" bg="white" p="4" boxShadow="0 18px 40px rgba(0,0,0,0.2)">
                            <QRCodeSVG
                              value={receipt.qrValue}
                              size={188}
                              bgColor="#ffffff"
                              fgColor="#0d1723"
                              includeMargin
                            />
                          </Box>
                          <Text fontSize="xs" color="var(--text-dim)" textAlign="center" lineHeight="1.65">
                            The QR mirrors the copied receipt text for quick desk-side verification.
                          </Text>
                        </Stack>
                      ) : (
                        <InfoBanner
                          tone="neutral"
                          message="Low-bandwidth mode keeps the receipt text-first. QR rendering is suppressed to reduce extra payload and visual noise."
                        />
                      )}
                    </Grid>
                  </Stack>
                </GlassPanel>
              ) : null}
            </Stack>

            {!lowBandwidth ? (
              <Stack gap="5">
                <GlassPanel accent="rgba(31, 184, 157, 0.14)" lowBandwidth={lowBandwidth}>
                  <Stack gap="5" px={{ base: "5", md: "6" }} py={{ base: "5", md: "6" }}>
                    <Stack gap="3">
                      <HStack gap="3" color="var(--brand-200)">
                        <Vote size={18} />
                        <Text fontWeight="700" color="var(--text-main)">
                          Progress indicator
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color="var(--text-soft)" lineHeight="1.75">
                        {receipt
                          ? "Ballot progress is complete and locked."
                          : `${completedOffices} of ${totalOffices} offices have been answered.`}
                      </Text>
                    </Stack>

                    <Box rounded="full" h="3" bg="rgba(255,255,255,0.08)" overflow="hidden">
                      <Box
                        h="full"
                        w={`${receipt ? 100 : progressPercent}%`}
                        rounded="full"
                        bg="linear-gradient(90deg, var(--brand-500), #f0b14b)"
                        transition="width 220ms ease"
                      />
                    </Box>

                    <Stack gap="2.5">
                      {BALLOT_OFFICES.map((office) => {
                        const complete = receipt || isOfficeComplete(office, selections[office.id]);

                        return (
                          <Flex
                            key={office.id}
                            align="center"
                            justify="space-between"
                            rounded="18px"
                            border="1px solid var(--line-soft)"
                            bg="rgba(255,255,255,0.02)"
                            px="4"
                            py="3"
                            gap="4"
                          >
                            <Text fontSize="sm" color="var(--text-soft)">
                              {office.title}
                            </Text>
                            <HStack
                              gap="2"
                              color={complete ? "var(--brand-200)" : "var(--text-dim)"}
                            >
                              {complete ? <Check size={14} /> : <TimerReset size={14} />}
                              <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.18em">
                                {complete ? "Ready" : "Pending"}
                              </Text>
                            </HStack>
                          </Flex>
                        );
                      })}
                    </Stack>
                  </Stack>
                </GlassPanel>

                <GlassPanel accent="rgba(240, 177, 75, 0.12)" lowBandwidth={lowBandwidth}>
                  <Stack gap="4" px={{ base: "5", md: "6" }} py={{ base: "5", md: "6" }}>
                    <HStack gap="3" color="#f6cf89">
                      <Users size={18} />
                      <Text fontWeight="700" color="var(--text-main)">
                        Representatives section
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color="var(--text-soft)" lineHeight="1.75">
                      Up to 5 candidates can be chosen for the General Council of the Bar. The review screen will show the final list before submission.
                    </Text>
                    <MetricCard
                      label="Representative choices"
                      value={receipt ? "Locked" : `${representativesSelected}/5`}
                      hint={receipt ? "Selections already sealed." : "Leave blank only if you explicitly abstain."}
                    />
                  </Stack>
                </GlassPanel>

                <GlassPanel accent="rgba(31, 184, 157, 0.1)" lowBandwidth={lowBandwidth}>
                  <Stack gap="4" px={{ base: "5", md: "6" }} py={{ base: "5", md: "6" }}>
                    <HStack gap="3" color="var(--brand-200)">
                      <ShieldCheck size={18} />
                      <Text fontWeight="700" color="var(--text-main)">
                        Session and support
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color="var(--text-soft)" lineHeight="1.75">
                      Secure session expiry: {formatDateTime(session.idleExpiresAt)}. Draft status:{" "}
                      {receipt ? "submitted" : draftSavedAt ? `saved ${formatDateTime(draftSavedAt)}` : "waiting for first change"}.
                    </Text>
                    <Text fontSize="sm" color="var(--text-soft)" lineHeight="1.75">
                      Accessible help is available throughout the ballot. Voters can pause here, contact support, and return without losing a local draft.
                    </Text>
                  </Stack>
                </GlassPanel>
              </Stack>
            ) : null}
          </Grid>
        </Stack>
      </Box>

      <Stack position="fixed" right={{ base: "4", md: "6" }} bottom={{ base: "4", md: "6" }} zIndex={30} align="end" gap="3">
        {helpOpen ? (
          <Box
            maxW="340px"
            rounded="24px"
            border="1px solid var(--line-soft)"
            bg="rgba(7,16,26,0.96)"
            boxShadow="0 24px 80px rgba(0,0,0,0.35)"
            px="5"
            py="5"
          >
            <Stack gap="3">
              <HStack gap="3" color="var(--brand-200)">
                <CircleHelp size={18} />
                <Text fontWeight="700" color="var(--text-main)">
                  Voter help desk
                </Text>
              </HStack>
              <Text fontSize="sm" color="var(--text-soft)" lineHeight="1.75">
                Need assistance with accessibility, verification, or ballot navigation? Support remains available without exposing your current choices.
              </Text>
              <Text fontSize="sm" color="var(--text-soft)">
                Hotline: +234 700 ECNBA HELP
              </Text>
              <Text fontSize="sm" color="var(--text-soft)">
                Email: helpdesk@ecnba.vote
              </Text>
              <Text fontSize="sm" color="var(--text-soft)">
                Response target: under 5 minutes during the live poll window.
              </Text>
            </Stack>
          </Box>
        ) : null}

        <Button
          type="button"
          h="56px"
          rounded="full"
          px="5"
          bg="linear-gradient(135deg, var(--gold-400), var(--gold-500))"
          color="#1f1300"
          fontWeight="800"
          boxShadow="0 18px 44px rgba(240,177,75,0.28)"
          onClick={() => setHelpOpen((current) => !current)}
        >
          <HStack gap="2">
            <CircleHelp size={18} />
            <Text as="span">{helpOpen ? "Hide help desk" : "Help desk"}</Text>
          </HStack>
        </Button>
      </Stack>
    </Box>
  );
}
