import { useEffect, useMemo, useState } from "react";
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
  Clock3,
  MapPin,
  RefreshCw,
  Send,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import type { AuthSession } from "../lib/mockAuth";

type TicketPriority = "Critical" | "High" | "Medium" | "Low";

type TicketItem = {
  priority: TicketPriority;
  id: string;
  issue: string;
  timeOpen: string;
  slaRemaining: number;
  branch: string;
  owner: string;
};

type VoterRecord = {
  name: string;
  branch: string;
  accredited: boolean;
  voted: boolean;
  phone: string;
  lastCheckpoint: string;
  queueStatus: string;
};

type SupportLoadPoint = {
  time: string;
  queue: number;
  resolved: number;
  escalated: number;
};

type BranchDemand = {
  code: string;
  branch: string;
  focus: string;
  open: number;
  authResets: number;
  receiptCases: number;
  gridColumn: string;
  gridRow: string;
};

type RecoveryTrendPoint = {
  time: string;
  completed: number;
  resets: number;
  lockouts: number;
};

type SupportEvent = {
  time: string;
  branch: string;
  actor: string;
  action: string;
  detail: string;
  tone: "positive" | "neutral" | "warning";
};

const TICKETS: TicketItem[] = [
  {
    priority: "Critical",
    id: "#T-4321",
    issue: "Cannot receive authenticator code after accreditation",
    timeOpen: "12 min",
    slaRemaining: 18 * 60,
    branch: "Lagos Branch",
    owner: "Agent Tola",
  },
  {
    priority: "High",
    id: "#T-4320",
    issue: "Password reset loop blocking ballot access",
    timeOpen: "25 min",
    slaRemaining: 6 * 60,
    branch: "Abuja FCT",
    owner: "Agent Mary",
  },
  {
    priority: "Medium",
    id: "#T-4319",
    issue: "Receipt copy action missing after successful vote",
    timeOpen: "45 min",
    slaRemaining: 0,
    branch: "Port Harcourt",
    owner: "Queue pending",
  },
];

const SUPPORT_LOAD: SupportLoadPoint[] = [
  { time: "12:00", queue: 19, resolved: 7, escalated: 2 },
  { time: "13:00", queue: 16, resolved: 11, escalated: 3 },
  { time: "14:00", queue: 14, resolved: 15, escalated: 2 },
  { time: "15:00", queue: 11, resolved: 19, escalated: 2 },
  { time: "16:00", queue: 9, resolved: 23, escalated: 1 },
  { time: "17:00", queue: 7, resolved: 28, escalated: 1 },
];

const BRANCH_DEMAND: BranchDemand[] = [
  { code: "LG", branch: "Lagos", focus: "Authenticator backlog", open: 5, authResets: 14, receiptCases: 2, gridColumn: "1", gridRow: "1" },
  { code: "ABJ", branch: "Abuja FCT", focus: "Credential recovery", open: 3, authResets: 9, receiptCases: 1, gridColumn: "2", gridRow: "1" },
  { code: "KN", branch: "Kano", focus: "Low-bandwidth retries", open: 2, authResets: 5, receiptCases: 0, gridColumn: "3", gridRow: "1" },
  { code: "PH", branch: "Port Harcourt", focus: "Receipt retrieval", open: 4, authResets: 6, receiptCases: 3, gridColumn: "1", gridRow: "2" },
  { code: "EN", branch: "Enugu", focus: "Member ID mismatch", open: 2, authResets: 3, receiptCases: 1, gridColumn: "2", gridRow: "2" },
  { code: "IB", branch: "Ibadan", focus: "SMS delivery delays", open: 1, authResets: 4, receiptCases: 0, gridColumn: "3", gridRow: "2" },
];

const RECOVERY_TREND: RecoveryTrendPoint[] = [
  { time: "12:00", completed: 91, resets: 8, lockouts: 2 },
  { time: "13:00", completed: 93, resets: 7, lockouts: 2 },
  { time: "14:00", completed: 95, resets: 6, lockouts: 1 },
  { time: "15:00", completed: 96, resets: 5, lockouts: 1 },
  { time: "16:00", completed: 97, resets: 4, lockouts: 1 },
  { time: "17:00", completed: 98, resets: 3, lockouts: 1 },
];

const SUPPORT_STREAM: SupportEvent[] = [
  {
    time: "17:42:05",
    branch: "Lagos",
    actor: "Agent Tola",
    action: "Recovered a voter session without ballot duplication.",
    detail: "Authenticator resync succeeded and casting resumed from the preserved accreditation state.",
    tone: "positive",
  },
  {
    time: "17:34:18",
    branch: "Abuja FCT",
    actor: "Queue supervisor",
    action: "Reassigned two password recovery tickets to standby agents.",
    detail: "Average first response dropped under five minutes across the live queue.",
    tone: "neutral",
  },
  {
    time: "17:26:41",
    branch: "Port Harcourt",
    actor: "Receipt support desk",
    action: "Closed a missing receipt case after ledger confirmation.",
    detail: "The voter received a verified receipt reference without reopening the ballot flow.",
    tone: "positive",
  },
  {
    time: "17:19:07",
    branch: "Kano",
    actor: "Security escalation monitor",
    action: "Flagged repeated MFA failure bursts from one device cluster.",
    detail: "Lockout and rate-limit controls were applied while help desk staff preserved legitimate voter sessions.",
    tone: "warning",
  },
];

const VOTER_DIRECTORY: Record<string, VoterRecord> = {
  "ECNBA-2048": {
    name: "John O. Member",
    branch: "Lagos Branch",
    accredited: true,
    voted: false,
    phone: "+234 810 555 0123",
    lastCheckpoint: "Accredited at 16:52, waiting to re-enter ballot flow",
    queueStatus: "Ready for MFA reset and return to voting",
  },
  "ECNBA-3124": {
    name: "Ngozi A. Eze",
    branch: "Abuja FCT",
    accredited: true,
    voted: true,
    phone: "+234 701 224 3301",
    lastCheckpoint: "Ballot committed at 15:08, receipt delivered",
    queueStatus: "Closed - no further recovery action needed",
  },
};

function formatSla(seconds: number) {
  if (seconds <= 0) {
    return "Overdue";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
}

function buildChartGeometry(values: number[], width: number, height: number, minValue: number, maxValue: number) {
  const padX = 28;
  const padY = 20;
  const innerWidth = width - padX * 2;
  const innerHeight = height - padY * 2;
  const span = Math.max(maxValue - minValue, 1);
  const step = values.length > 1 ? innerWidth / (values.length - 1) : 0;

  const points = values.map((value, index) => {
    const x = padX + step * index;
    const y = height - padY - ((value - minValue) / span) * innerHeight;
    return { x, y, value };
  });

  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area =
    points.length === 0
      ? ""
      : [
          `M ${points[0].x} ${height - padY}`,
          ...points.map((point) => `L ${point.x} ${point.y}`),
          `L ${points[points.length - 1].x} ${height - padY}`,
          "Z",
        ].join(" ");

  return { area, line, padX, padY, points };
}

function toneStyles(tone: SupportEvent["tone"]) {
  if (tone === "positive") {
    return {
      bg: "rgba(31, 184, 157, 0.1)",
      border: "rgba(31, 184, 157, 0.24)",
      dot: "var(--brand-500)",
      ring: "rgba(31, 184, 157, 0.14)",
      label: "Stable",
      labelColor: "var(--brand-200)",
    };
  }

  if (tone === "warning") {
    return {
      bg: "rgba(255, 123, 114, 0.1)",
      border: "rgba(255, 123, 114, 0.24)",
      dot: "var(--danger-400)",
      ring: "rgba(255, 123, 114, 0.14)",
      label: "Watch",
      labelColor: "var(--danger-400)",
    };
  }

  return {
    bg: "rgba(240, 177, 75, 0.08)",
    border: "rgba(240, 177, 75, 0.24)",
    dot: "var(--gold-400)",
    ring: "rgba(240, 177, 75, 0.14)",
    label: "Info",
    labelColor: "var(--gold-400)",
  };
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="24px" px="5" py="5">
      <Text fontSize="xs" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)">
        {label}
      </Text>
      <Text mt="3" fontFamily='"Sora", sans-serif' fontWeight="700" fontSize="3xl" color="var(--text-main)">
        {value}
      </Text>
      <Text mt="2" fontSize="sm" color="var(--text-soft)">
        {detail}
      </Text>
    </Box>
  );
}

function PriorityPill({ priority }: { priority: TicketPriority }) {
  const appearance = {
    Critical: { color: "#ff7b72", label: "Critical" },
    High: { color: "#f0b14b", label: "High" },
    Medium: { color: "#6b9bf7", label: "Medium" },
    Low: { color: "#8a8f9c", label: "Low" },
  }[priority];

  return (
    <Box
      px="3"
      py="1"
      rounded="full"
      bg={`${appearance.color}1a`}
      border={`1px solid ${appearance.color}`}
      fontSize="xs"
      fontWeight="700"
      color={appearance.color}
      letterSpacing="0.14em"
      textTransform="uppercase"
      w="fit-content"
    >
      {appearance.label}
    </Box>
  );
}

function SupportLoadPanel({ lastUpdatedAgo }: { lastUpdatedAgo: number }) {
  const width = 620;
  const height = 220;
  const geometry = buildChartGeometry(
    SUPPORT_LOAD.map((point) => point.queue),
    width,
    height,
    0,
    24,
  );
  const currentPoint = geometry.points[geometry.points.length - 1];

  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
      <Flex justify="space-between" align="center" mb="5" gap="4" wrap="wrap">
        <Stack gap="1">
          <Text fontSize="sm" fontWeight="700" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)">
            📞 Voter support load over time
          </Text>
          <Heading fontFamily='"Sora", sans-serif' size="lg" color="var(--text-main)">
            Queue pressure through election day
          </Heading>
          <Text color="var(--text-soft)" fontSize="sm">
            Track open recovery cases as agents clear authentication, password, and receipt issues.
          </Text>
        </Stack>
        <HStack gap="3" color="var(--text-soft)">
          <Clock3 size={16} />
          <Text fontSize="xs">Updated {lastUpdatedAgo}s ago</Text>
        </HStack>
      </Flex>

      <Box rounded="24px" bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.06)" p="4">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="220" role="img" aria-label="Help desk queue load over time">
          <defs>
            <linearGradient id="support-load-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(31, 184, 157, 0.30)" />
              <stop offset="100%" stopColor="rgba(31, 184, 157, 0.04)" />
            </linearGradient>
          </defs>

          {[6, 12, 18, 24].map((tick) => {
            const y = height - geometry.padY - (tick / 24) * (height - geometry.padY * 2);

            return (
              <g key={tick}>
                <line x1={geometry.padX} y1={y} x2={width - geometry.padX} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" />
                <text x="0" y={y + 4} fill="rgba(201, 214, 223, 0.56)" fontSize="11">
                  {tick}
                </text>
              </g>
            );
          })}

          <path d={geometry.area} fill="url(#support-load-fill)" />
          <polyline fill="none" stroke="rgba(31, 184, 157, 0.95)" strokeWidth="4" points={geometry.line} />

          {geometry.points.map((point, index) => (
            <g key={SUPPORT_LOAD[index].time}>
              <circle cx={point.x} cy={point.y} r="6" fill="#1fb89d" stroke="#041018" strokeWidth="3" />
              <text x={point.x} y={height - 2} fill="rgba(230, 238, 243, 0.74)" fontSize="12" textAnchor="middle">
                {SUPPORT_LOAD[index].time}
              </text>
            </g>
          ))}

          <g>
            <circle cx={currentPoint.x} cy={currentPoint.y} r="10" fill="rgba(31, 184, 157, 0.18)" />
            <circle cx={currentPoint.x} cy={currentPoint.y} r="6" fill="#1fb89d" stroke="#041018" strokeWidth="3" />
            <text x={currentPoint.x - 6} y={currentPoint.y - 18} fill="#9ae7d8" fontSize="13" fontWeight="700" textAnchor="end">
              7 open
            </text>
          </g>
        </svg>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap="3" mt="4">
        <Box rounded="20px" border="1px solid rgba(255,255,255,0.08)" bg="rgba(255,255,255,0.02)" px="4" py="4">
          <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
            Cases cleared
          </Text>
          <Text mt="2" fontFamily='"Sora", sans-serif' fontSize="2xl" fontWeight="700" color="var(--text-main)">
            103
          </Text>
          <Text color="var(--text-soft)" fontSize="sm">
            Voter issues resolved since noon without reopening completed ballots.
          </Text>
        </Box>
        <Box rounded="20px" border="1px solid rgba(255,255,255,0.08)" bg="rgba(255,255,255,0.02)" px="4" py="4">
          <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
            Peak queue
          </Text>
          <Text mt="2" fontFamily='"Sora", sans-serif' fontSize="2xl" fontWeight="700" color="var(--text-main)">
            19 cases
          </Text>
          <Text color="var(--text-soft)" fontSize="sm">
            Highest concurrent support load reached before agents redistributed shifts.
          </Text>
        </Box>
        <Box rounded="20px" border="1px solid rgba(255,255,255,0.08)" bg="rgba(255,255,255,0.02)" px="4" py="4">
          <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
            Escalations
          </Text>
          <Text mt="2" fontFamily='"Sora", sans-serif' fontSize="2xl" fontWeight="700" color="var(--text-main)">
            1 active
          </Text>
          <Text color="var(--text-soft)" fontSize="sm">
            Only one security-monitored issue still requires supervisory attention.
          </Text>
        </Box>
      </SimpleGrid>
    </Box>
  );
}

function BranchDemandPanel() {
  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
      <Flex justify="space-between" align="start" gap="4" wrap="wrap">
        <Stack gap="1">
          <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
            🗺️ Support demand by branch
          </Text>
          <Heading fontFamily='"Sora", sans-serif' size="md" color="var(--text-main)">
            Recovery hotspots
          </Heading>
        </Stack>
        <HStack gap="2" color="var(--text-soft)">
          <MapPin size={16} />
          <Text fontSize="xs">Darker panels mark heavier live recovery demand</Text>
        </HStack>
      </Flex>

      <Grid templateColumns="repeat(3, minmax(0, 1fr))" templateRows="repeat(2, minmax(120px, 1fr))" gap="3" mt="5">
        {BRANCH_DEMAND.map((branch) => (
          <Box
            key={branch.code}
            gridColumn={branch.gridColumn}
            gridRow={branch.gridRow}
            rounded="24px"
            border="1px solid rgba(255,255,255,0.08)"
            bg={`linear-gradient(180deg, rgba(31, 184, 157, ${0.06 + branch.open / 30}), rgba(7, 16, 26, 0.96))`}
            p="4"
            position="relative"
            overflow="hidden"
          >
            <Box position="absolute" inset="0" bg="radial-gradient(circle at top right, rgba(255,255,255,0.10), transparent 45%)" />
            <Stack position="relative" gap="3" h="full" justify="space-between">
              <Flex justify="space-between" align="start" gap="3">
                <Box>
                  <Text fontSize="xs" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)">
                    {branch.code}
                  </Text>
                  <Text mt="1" color="var(--text-main)" fontWeight="700">
                    {branch.branch}
                  </Text>
                </Box>
                <Text fontFamily='"Sora", sans-serif' fontSize="2xl" fontWeight="700" color="var(--text-main)">
                  {branch.open}
                </Text>
              </Flex>

              <Box>
                <Text color="var(--text-soft)" fontSize="sm">
                  {branch.focus}
                </Text>
                <Text mt="3" color="var(--text-main)" fontSize="sm" fontWeight="700">
                  {branch.authResets} MFA resets
                </Text>
                <Text color="var(--text-soft)" fontSize="sm">
                  {branch.receiptCases} receipt recovery cases
                </Text>
              </Box>
            </Stack>
          </Box>
        ))}
      </Grid>
    </Box>
  );
}

function TicketRoutingPanel({
  ticketTimer,
  onResetTimer,
}: {
  ticketTimer: number;
  onResetTimer: () => void;
}) {
  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
      <Flex justify="space-between" align="center" mb="5" wrap="wrap" gap="4">
        <Stack gap="1">
          <Text fontSize="sm" fontWeight="700" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)">
            🚨 Incident routing lanes
          </Text>
          <Heading fontFamily='"Sora", sans-serif' size="lg" color="var(--text-main)">
            Critical recovery queue
          </Heading>
          <Text color="var(--text-soft)" fontSize="sm">
            Prioritize blocked voters without disturbing accreditation or committed ballot records.
          </Text>
        </Stack>
        <HStack gap="3" wrap="wrap">
          <Box px="3" py="2" rounded="20px" bg="rgba(255,123,114,0.12)" border="1px solid rgba(255,123,114,0.24)">
            <Text fontSize="xs" color="#ff7b72" fontWeight="700">
              Oldest SLA clock
            </Text>
            <Text mt="1" fontWeight="700" color="var(--text-main)">
              {formatSla(ticketTimer)}
            </Text>
          </Box>
          <Button onClick={onResetTimer} rounded="20px" fontWeight="700">
            Reset SLA timer
          </Button>
        </HStack>
      </Flex>

      <Stack gap="3">
        {TICKETS.map((ticket) => {
          const percent = Math.max(0, Math.min(100, (ticket.slaRemaining / (30 * 60)) * 100));

          return (
            <Box
              key={ticket.id}
              rounded="24px"
              border="1px solid rgba(255,255,255,0.08)"
              bg="rgba(255,255,255,0.02)"
              px="4"
              py="4"
            >
              <Flex justify="space-between" align="start" gap="4" wrap="wrap">
                <Stack gap="2" flex="1">
                  <HStack gap="3" wrap="wrap">
                    <PriorityPill priority={ticket.priority} />
                    <Text color="var(--text-main)" fontWeight="700">
                      {ticket.id}
                    </Text>
                    <Text fontSize="sm" color="var(--text-soft)">
                      {ticket.branch}
                    </Text>
                  </HStack>
                  <Text color="var(--text-main)" fontWeight="700">
                    {ticket.issue}
                  </Text>
                  <Text color="var(--text-soft)" fontSize="sm">
                    Open for {ticket.timeOpen} • Owner: {ticket.owner}
                  </Text>
                </Stack>

                <Button variant="outline" rounded="20px" fontWeight="700">
                  Assign
                </Button>
              </Flex>

              <Box mt="4" bg="rgba(255,255,255,0.06)" rounded="full" h="10px" overflow="hidden">
                <Box
                  h="full"
                  w={`${percent}%`}
                  rounded="full"
                  bg={ticket.priority === "Critical" ? "linear-gradient(90deg, #ff7b72, #f0b14b)" : "linear-gradient(90deg, #1fb89d, #14957e)"}
                />
              </Box>

              <Flex justify="space-between" gap="4" mt="2" wrap="wrap">
                <Text color="var(--text-soft)" fontSize="sm">
                  Remaining SLA: {formatSla(ticket.slaRemaining)}
                </Text>
                <Text color={ticket.slaRemaining <= 0 ? "var(--danger-400)" : "var(--brand-200)"} fontSize="sm" fontWeight="700">
                  {ticket.slaRemaining <= 0 ? "Needs supervisor intervention" : "Within recovery window"}
                </Text>
              </Flex>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

function SupportStreamPanel({ onRefresh }: { onRefresh: () => void }) {
  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
      <Flex justify="space-between" align="center" wrap="wrap" gap="4" mb="5">
        <Stack gap="1">
          <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
            ⚡ Live support activity stream
          </Text>
          <Heading fontFamily='"Sora", sans-serif' size="md" color="var(--text-main)">
            Agent actions and recovery events
          </Heading>
        </Stack>
        <Button onClick={onRefresh} fontWeight="700" rounded="20px">
          <HStack gap="2">
            <RefreshCw size={16} />
            <Text>Refresh feed</Text>
          </HStack>
        </Button>
      </Flex>

      <Stack gap="3">
        {SUPPORT_STREAM.map((event) => {
          const palette = toneStyles(event.tone);

          return (
            <Flex
              key={`${event.time}-${event.action}`}
              align="start"
              gap="4"
              rounded="24px"
              border="1px solid"
              borderColor={palette.border}
              bg={palette.bg}
              px="4"
              py="4"
            >
              <Stack align="center" gap="2" pt="1">
                <Box h="12px" w="12px" rounded="full" bg={palette.dot} boxShadow={`0 0 0 8px ${palette.ring}`} />
                <Box flex="1" w="1px" bg="rgba(255,255,255,0.08)" minH="42px" />
              </Stack>

              <Stack gap="2" flex="1">
                <Flex justify="space-between" align="start" gap="4" wrap="wrap">
                  <HStack gap="3" wrap="wrap">
                    <Text fontFamily='"Sora", sans-serif' fontWeight="700" color="var(--text-main)">
                      {event.time}
                    </Text>
                    <Text fontSize="xs" letterSpacing="0.16em" textTransform="uppercase" color="var(--text-dim)">
                      {event.branch}
                    </Text>
                  </HStack>
                  <Box px="3" py="1" rounded="full" border="1px solid" borderColor={palette.border}>
                    <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color={palette.labelColor} fontWeight="700">
                      {palette.label}
                    </Text>
                  </Box>
                </Flex>

                <Text color="var(--text-main)" fontWeight="700">
                  {event.action}
                </Text>
                <Text color="var(--text-soft)" fontSize="sm">
                  {event.actor} • {event.detail}
                </Text>
              </Stack>
            </Flex>
          );
        })}
      </Stack>
    </Box>
  );
}

function VoterRecoveryPanel({
  memberId,
  onMemberIdChange,
  onVerify,
  verification,
  mfaResetSent,
  onResetMfa,
  hasAttemptedVerify,
}: {
  memberId: string;
  onMemberIdChange: (value: string) => void;
  onVerify: () => void;
  verification: VoterRecord | null;
  mfaResetSent: boolean;
  onResetMfa: () => void;
  hasAttemptedVerify: boolean;
}) {
  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
      <Stack gap="1">
        <Text fontSize="sm" fontWeight="700" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)">
          🔍 Voter recovery cockpit
        </Text>
        <Heading fontFamily='"Sora", sans-serif' size="lg" color="var(--text-main)">
          Verify identity before support action
        </Heading>
        <Text color="var(--text-soft)" fontSize="sm">
          Confirm accreditation, ballot state, and recovery readiness before issuing an MFA reset.
        </Text>
      </Stack>

      <Stack gap="4" mt="6">
        <Flex gap="3" wrap="wrap">
          <Input
            value={memberId}
            onChange={(event) => onMemberIdChange(event.target.value.toUpperCase())}
            bg="rgba(255,255,255,0.03)"
            border="1px solid var(--line-soft)"
            color="var(--text-main)"
            placeholder="Enter voter NBA ID"
            rounded="20px"
            flex="1"
          />
          <Button onClick={onVerify} rounded="20px" fontWeight="700">
            Verify
          </Button>
        </Flex>

        <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.08)" rounded="24px" p="5">
          {verification ? (
            <Stack gap="4">
              <HStack gap="3">
                <UserCheck size={18} color="#1fb89d" />
                <Text color="var(--text-main)" fontWeight="700">
                  {verification.name}
                </Text>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
                <Box rounded="18px" border="1px solid rgba(255,255,255,0.06)" bg="rgba(255,255,255,0.02)" px="4" py="3">
                  <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
                    Branch
                  </Text>
                  <Text mt="2" color="var(--text-main)" fontWeight="700">
                    {verification.branch}
                  </Text>
                </Box>
                <Box rounded="18px" border="1px solid rgba(255,255,255,0.06)" bg="rgba(255,255,255,0.02)" px="4" py="3">
                  <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
                    Ballot state
                  </Text>
                  <Text mt="2" color="var(--text-main)" fontWeight="700">
                    {verification.voted ? "Ballot already committed" : "Not yet voted"}
                  </Text>
                </Box>
              </SimpleGrid>

              <Stack gap="2">
                <Text color="var(--text-soft)">Accredited: {verification.accredited ? "Yes" : "No"}</Text>
                <Text color="var(--text-soft)">Checkpoint: {verification.lastCheckpoint}</Text>
                <Text color="var(--text-soft)">Queue status: {verification.queueStatus}</Text>
                <Text color="var(--text-soft)">
                  MFA contact: SMS to {verification.phone.replace(/(\d{3})\d{3}/, "$1XXX")}
                </Text>
              </Stack>

              <Button onClick={onResetMfa} rounded="20px" fontWeight="700">
                <HStack gap="2">
                  <Send size={16} />
                  <Text>Issue secure MFA reset</Text>
                </HStack>
              </Button>

              {mfaResetSent ? (
                <Text fontSize="sm" color="var(--brand-200)">
                  Reset instructions dispatched and the voter can safely resume the preserved ballot flow.
                </Text>
              ) : null}
            </Stack>
          ) : hasAttemptedVerify ? (
            <Stack gap="2">
              <Text color="var(--danger-400)" fontWeight="700">
                No voter record matched this ID.
              </Text>
              <Text color="var(--text-soft)" fontSize="sm">
                Confirm the member ID, then retry before escalating to supervisor review.
              </Text>
            </Stack>
          ) : (
            <Text color="var(--text-soft)">
              Enter a voter ID and verify the member before resetting MFA or investigating a receipt issue.
            </Text>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

function OperationsPanel({
  ticketCompliance,
  onCloseSession,
}: {
  ticketCompliance: number;
  onCloseSession: () => void;
}) {
  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
      <Flex align="center" justify="space-between" wrap="wrap" gap="4">
        <Stack gap="1">
          <Text fontSize="sm" fontWeight="700" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)">
            Support operations
          </Text>
          <Text color="var(--text-soft)" fontSize="sm">
            Staff posture, recovery conversion, and escalation readiness.
          </Text>
        </Stack>
        <Button onClick={onCloseSession} variant="ghost" rounded="22px" fontWeight="700" color="var(--text-main)">
          <HStack gap="2">
            <ArrowRight size={16} />
            <Text>Exit Help Desk</Text>
          </HStack>
        </Button>
      </Flex>

      <Stack gap="4" mt="6">
        <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.08)" rounded="24px" p="5">
          <Flex align="center" gap="3">
            <Users color="#1fb89d" />
            <Text fontWeight="700" color="var(--text-main)">
              Agent deployment
            </Text>
          </Flex>
          <Text mt="3" color="var(--text-soft)">
            6 agents online, 2 on escalation duty, and 1 floating supervisor covering late-hour branch surges.
          </Text>
        </Box>

        <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.08)" rounded="24px" p="5">
          <Flex align="center" gap="3" mb="4">
            <RefreshCw color="#f0b14b" />
            <Text fontWeight="700" color="var(--text-main)">
              Authentication recovery trend
            </Text>
          </Flex>
          <Stack gap="3">
            {RECOVERY_TREND.map((entry) => (
              <Box key={entry.time}>
                <Flex justify="space-between" gap="4" wrap="wrap">
                  <Text color="var(--text-main)" fontWeight="700">
                    {entry.time}
                  </Text>
                  <Text color="var(--text-soft)" fontSize="sm">
                    {entry.completed}% completion • {entry.resets} resets • {entry.lockouts} lockout
                  </Text>
                </Flex>
                <Box mt="2" bg="rgba(255,255,255,0.06)" rounded="full" h="10px" overflow="hidden">
                  <Flex h="full">
                    <Box w={`${entry.completed}%`} bg="rgba(31, 184, 157, 0.9)" />
                    <Box w={`${entry.resets}%`} bg="rgba(240, 177, 75, 0.9)" />
                    <Box w={`${entry.lockouts}%`} bg="rgba(255, 123, 114, 0.9)" />
                  </Flex>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.08)" rounded="24px" p="5">
          <Flex align="center" gap="3">
            <Clock3 color="#1fb89d" />
            <Text fontWeight="700" color="var(--text-main)">
              SLA posture
            </Text>
          </Flex>
          <Text mt="3" color="var(--text-soft)">
            Critical queue compliance is {ticketCompliance}% and improving as standby agents absorb credential recovery spikes.
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}

export function HelpDeskDashboard({ session, onCloseSession }: { session: AuthSession; onCloseSession: () => void }) {
  const [clockNow, setClockNow] = useState(Date.now());
  const [lastRefreshAt, setLastRefreshAt] = useState(Date.now());
  const [ticketTimer, setTicketTimer] = useState(30 * 60);
  const [memberId, setMemberId] = useState("ECNBA-2048");
  const [verification, setVerification] = useState<VoterRecord | null>(null);
  const [mfaResetSent, setMfaResetSent] = useState(false);
  const [hasAttemptedVerify, setHasAttemptedVerify] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockNow(Date.now());
      setTicketTimer((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const ticketCompliance = useMemo(() => {
    const open = TICKETS.length;
    const withinSla = TICKETS.filter((ticket) => ticket.slaRemaining > 0).length;
    return Math.round((withinSla / open) * 100);
  }, []);

  const lastUpdated = new Date(lastRefreshAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const lastUpdatedAgo = Math.max(0, Math.floor((clockNow - lastRefreshAt) / 1000));

  function handleVerify() {
    setVerification(VOTER_DIRECTORY[memberId] ?? null);
    setMfaResetSent(false);
    setHasAttemptedVerify(true);
  }

  function handleResetMfa() {
    setMfaResetSent(true);
    setLastRefreshAt(Date.now());
  }

  function handleRefresh() {
    setClockNow(Date.now());
    setLastRefreshAt(Date.now());
  }

  return (
    <Box minH="100vh" bg="var(--page-bg)" px={{ base: "5", md: "8", xl: "10" }} py={{ base: "6", md: "8", xl: "10" }}>
      <Stack gap="8">
        <Flex direction={{ base: "column", md: "row" }} align="start" justify="space-between" gap="6">
          <Stack gap="3" maxW={{ base: "100%", md: "65%" }}>
            <Text fontSize="sm" letterSpacing="0.24em" textTransform="uppercase" color="var(--brand-200)" fontWeight="700">
              🎧 Help Desk Dashboard - Election Day Support
            </Text>
            <Heading fontFamily='"Sora", sans-serif' fontSize={{ base: "3xl", md: "4xl" }} lineHeight="1.05" color="var(--text-main)">
              Real-time voter recovery for the election support floor
            </Heading>
            <Text color="var(--text-soft)" maxW="3xl" fontSize="md">
              Resolve blocked voter journeys, monitor branch support demand, and keep authenticated election access moving without risking ballot integrity.
            </Text>
          </Stack>

          <Stack gap="3" align="end" minW="220px">
            <HStack gap="3" align="center" bg="rgba(255,255,255,0.05)" border="1px solid var(--line-soft)" rounded="24px" px="4" py="3">
              <ShieldCheck color="#1fb89d" />
              <Text fontWeight="700">Role: {session.role === "chairman" ? "Chairman" : "Agent"}</Text>
            </HStack>
            <Box bg="rgba(255,255,255,0.04)" border="1px solid var(--line-soft)" rounded="24px" px="4" py="3">
              <Text fontSize="xs" color="var(--text-dim)">
                Last refreshed
              </Text>
              <Text mt="1" fontWeight="700" color="var(--text-main)">
                {lastUpdated}
              </Text>
            </Box>
          </Stack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="4">
          <StatCard label="Open Recovery Cases" value="7" detail="Voter issues still awaiting closure or safe hand-off." />
          <StatCard label="Agents Online" value="6" detail="Help desk agents currently staffed across support queues." />
          <StatCard label="Resolved Today" value="103" detail="Election-day issues closed without affecting ballot integrity." />
          <StatCard label="Avg First Response" value="4.2 min" detail="Mean response time for newly opened support cases." />
        </SimpleGrid>

        <Grid templateColumns={{ base: "1fr", xl: "0.62fr 0.38fr" }} gap="4">
          <SupportLoadPanel lastUpdatedAgo={lastUpdatedAgo} />
          <BranchDemandPanel />
        </Grid>

        <Grid templateColumns={{ base: "1fr", xl: "0.58fr 0.42fr" }} gap="4">
          <TicketRoutingPanel ticketTimer={ticketTimer} onResetTimer={() => setTicketTimer(30 * 60)} />
          <SupportStreamPanel onRefresh={handleRefresh} />
        </Grid>

        <Grid templateColumns={{ base: "1fr", xl: "0.6fr 0.4fr" }} gap="4">
          <VoterRecoveryPanel
            memberId={memberId}
            onMemberIdChange={setMemberId}
            onVerify={handleVerify}
            verification={verification}
            mfaResetSent={mfaResetSent}
            onResetMfa={handleResetMfa}
            hasAttemptedVerify={hasAttemptedVerify}
          />
          <OperationsPanel ticketCompliance={ticketCompliance} onCloseSession={onCloseSession} />
        </Grid>
      </Stack>
    </Box>
  );
}
