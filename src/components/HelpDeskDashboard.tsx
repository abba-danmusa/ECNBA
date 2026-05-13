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
  AlertTriangle,
  ArrowRight,
  Clock3,
  ShieldCheck,
  Shuffle,
  Send,
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
};

type VoterRecord = {
  name: string;
  branch: string;
  voted: boolean;
  phone: string;
};

const TICKETS: TicketItem[] = [
  { priority: "Critical", id: "#T-4321", issue: "Cannot receive MFA code", timeOpen: "12 min", slaRemaining: 18 * 60 },
  { priority: "High", id: "#T-4320", issue: "Forgot password", timeOpen: "25 min", slaRemaining: 6 * 60 },
  { priority: "Medium", id: "#T-4319", issue: "Receipt not copying", timeOpen: "45 min", slaRemaining: 0 },
];

const VOTER_DIRECTORY: Record<string, VoterRecord> = {
  "ECNBA-2048": { name: "John O. Member", branch: "Lagos Branch", voted: false, phone: "+234 810 555 0123" },
  "ECNBA-3124": { name: "Ngozi A. Eze", branch: "Abuja FCT", voted: true, phone: "+234 701 224 3301" },
};

function formatSla(seconds: number) {
  if (seconds <= 0) {
    return "Overdue";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
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
      <Text mt="2" fontSize="sm" color="var(--text-soft)">{detail}</Text>
    </Box>
  );
}

function Pill({ priority }: { priority: TicketPriority }) {
  const appearance = {
    Critical: { color: "#ff7b72", label: "🔴 CRITICAL" },
    High: { color: "#f0b14b", label: "🟡 HIGH" },
    Medium: { color: "#6b9bf7", label: "🟢 MED" },
    Low: { color: "#8a8f9c", label: "⚪ LOW" },
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
    >
      {appearance.label}
    </Box>
  );
}

export function HelpDeskDashboard({ session, onCloseSession }: { session: AuthSession; onCloseSession: () => void }) {
  const [now, setNow] = useState(Date.now());
  const [ticketTimer, setTicketTimer] = useState(30 * 60);
  const [memberId, setMemberId] = useState("ECNBA-2048");
  const [verification, setVerification] = useState<VoterRecord | null>(null);
  const [mfaResetSent, setMfaResetSent] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      setTicketTimer((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const ticketCompliance = useMemo(() => {
    const open = TICKETS.length;
    const highPriority = TICKETS.filter((ticket) => ticket.priority === "Critical" || ticket.priority === "High").length;
    return Math.round(((open - highPriority) / open) * 100);
  }, []);

  const handleVerify = () => {
    setVerification(VOTER_DIRECTORY[memberId] ?? null);
    setMfaResetSent(false);
  };

  const handleResetMfa = () => {
    setMfaResetSent(true);
  };

  const lastUpdated = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <Box minH="100vh" bg="var(--page-bg)" px={{ base: "5", md: "8", xl: "10" }} py={{ base: "6", md: "8", xl: "10" }}>
      <Stack gap="8">
        <Flex direction={{ base: "column", md: "row" }} align="start" justify="space-between" gap="6">
          <Stack gap="3" maxW={{ base: "100%", md: "65%" }}>
            <Text fontSize="sm" letterSpacing="0.24em" textTransform="uppercase" color="var(--brand-200)" fontWeight="700">
              🎧 Help Desk Dashboard – Election Day Support
            </Text>
            <Heading fontFamily='"Sora", sans-serif' fontSize={{ base: "3xl", md: "4xl" }} lineHeight="1.05" color="var(--text-main)">
              Real-time support for agent-first voter recovery and ticket response
            </Heading>
            <Text color="var(--text-soft)" maxW="3xl" fontSize="md">
              Resolve urgent voter issues, verify verified IDs securely, and manage incident SLA compliance with a live support command view.
            </Text>
          </Stack>

          <Stack gap="3" align="end" minW="220px">
            <HStack gap="3" align="center" bg="rgba(255,255,255,0.05)" border="1px solid var(--line-soft)" rounded="24px" px="4" py="3">
              <ShieldCheck color="#1fb89d" />
              <Text fontWeight="700">Role: Agent</Text>
            </HStack>
            <Box bg="rgba(255,255,255,0.04)" border="1px solid var(--line-soft)" rounded="24px" px="4" py="3">
              <Text fontSize="xs" color="var(--text-dim)">Last updated</Text>
              <Text mt="1" fontWeight="700" color="var(--text-main)">{lastUpdated}</Text>
            </Box>
          </Stack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="4">
          <StatCard label="Open Tickets" value="12" detail="Currently waiting for agent action." />
          <StatCard label="In Progress" value="8" detail="Tickets being triaged by the help desk." />
          <StatCard label="Resolved Today" value="45" detail="Issues closed within the current election day." />
          <StatCard label="Avg Response" value="4.2 min" detail="Mean time to first response for new tickets." />
        </SimpleGrid>

        <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
          <Flex justify="space-between" align="center" mb="5" wrap="wrap" gap="4">
            <Stack gap="1">
              <Text fontSize="sm" fontWeight="700" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)">
                🔴 Critical tickets (30-min SLA)
              </Text>
              <Text color="var(--text-soft)" fontSize="sm">
                Top priority incidents with explicit SLA countdown and rapid assignment.
              </Text>
            </Stack>
            <HStack gap="3">
              <Box px="3" py="2" rounded="20px" bg="rgba(255,123,114,0.12)" border="1px solid rgba(255,123,114,0.24)">
                <Text fontSize="xs" color="#ff7b72" fontWeight="700">SLA remaining</Text>
                <Text mt="1" fontWeight="700" color="var(--text-main)">{formatSla(ticketTimer)}</Text>
              </Box>
              <Button onClick={() => setTicketTimer(30 * 60)} rounded="20px" fontWeight="700">
                Reset SLA timer
              </Button>
            </HStack>
          </Flex>

          <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.08)" rounded="24px" overflow="hidden">
            <Grid templateColumns="0.9fr 1.1fr 1.6fr 0.9fr 1fr" gap="4" px="4" py="3" bg="rgba(255,255,255,0.04)">
              <Text fontSize="xs" letterSpacing="0.18em" color="var(--text-dim)" fontWeight="700">Priority</Text>
              <Text fontSize="xs" letterSpacing="0.18em" color="var(--text-dim)" fontWeight="700">Ticket ID</Text>
              <Text fontSize="xs" letterSpacing="0.18em" color="var(--text-dim)" fontWeight="700">Issue</Text>
              <Text fontSize="xs" letterSpacing="0.18em" color="var(--text-dim)" fontWeight="700">Time Open</Text>
              <Text fontSize="xs" letterSpacing="0.18em" color="var(--text-dim)" fontWeight="700">Action</Text>
            </Grid>
            {TICKETS.map((ticket) => (
              <Grid key={ticket.id} templateColumns="0.9fr 1.1fr 1.6fr 0.9fr 1fr" gap="4" px="4" py="4" borderTop="1px solid rgba(255,255,255,0.06)">
                <Pill priority={ticket.priority} />
                <Text color="var(--text-main)" fontWeight="700">{ticket.id}</Text>
                <Text color="var(--text-soft)">{ticket.issue}</Text>
                <Text color="var(--text-soft)">{ticket.timeOpen}</Text>
                <Button variant="outline" rounded="20px" fontWeight="700">
                  Assign
                </Button>
              </Grid>
            ))}
          </Box>
        </Box>

        <Grid templateColumns={{ base: "1fr", lg: "0.76fr 0.84fr" }} gap="4">
          <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
            <Text fontSize="sm" fontWeight="700" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)">
              🔍 Voter verification tool
            </Text>
            <Stack gap="4" mt="6">
              <Flex gap="3" wrap="wrap">
                <Input
                  value={memberId}
                  onChange={(event) => setMemberId(event.target.value.toUpperCase())}
                  bg="rgba(255,255,255,0.03)"
                  border="1px solid var(--line-soft)"
                  color="var(--text-main)"
                  placeholder="Enter Voter NBA ID"
                  rounded="20px"
                  flex="1"
                />
                <Button onClick={handleVerify} rounded="20px" fontWeight="700">
                  Verify
                </Button>
              </Flex>
              <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.08)" rounded="24px" p="5">
                {verification ? (
                  <Stack gap="3">
                    <Text color="var(--text-main)" fontWeight="700">✅ Voter found: {verification.name}</Text>
                    <Text color="var(--text-soft)">✅ Branch: {verification.branch}</Text>
                    <Text color="var(--text-soft)">✅ Voted: {verification.voted ? "Yes" : "No"}</Text>
                    <Text color="var(--text-soft)">📱 MFA: SMS sent to {verification.phone.replace(/(\d{3})\d{3}/, "$1XXX")}</Text>
                    <Button onClick={handleResetMfa} rounded="20px" fontWeight="700">
                      <HStack gap="2">
                        <Send size={16} />
                        <Text>Reset MFA</Text>
                      </HStack>
                    </Button>
                    {mfaResetSent ? (
                      <Text fontSize="sm" color="var(--brand-200)">SMS reset instruction delivered.</Text>
                    ) : null}
                  </Stack>
                ) : (
                  <Text color="var(--text-soft)">Enter a voter ID and press verify to confirm registration status and whether they have cast a ballot.</Text>
                )}
              </Box>
            </Stack>
          </Box>

          <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
            <Flex align="center" justify="space-between" wrap="wrap" gap="4">
              <Stack gap="1">
                <Text fontSize="sm" fontWeight="700" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)">
                  Support operations
                </Text>
                <Text color="var(--text-soft)" fontSize="sm">Live agent metrics and active issue routing.</Text>
              </Stack>
              <Button onClick={onCloseSession} variant="ghost" rounded="22px" fontWeight="700" color="var(--text-main)">
                <HStack gap="2">
                  <ArrowRight size={16} />
                  <Text>Exit Help Desk</Text>
                </HStack>
              </Button>
            </Flex>
            <Stack gap="4" mt="7">
              <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.08)" rounded="24px" p="5">
                <Flex align="center" gap="3">
                  <Users color="#1fb89d" />
                  <Text fontWeight="700" color="var(--text-main)">Agent availability</Text>
                </Flex>
                <Text mt="3" color="var(--text-soft)">6 agents online, 2 agents currently handling escalations.</Text>
              </Box>
              <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.08)" rounded="24px" p="5">
                <Flex align="center" gap="3">
                  <Clock3 color="#f0b14b" />
                  <Text fontWeight="700" color="var(--text-main)">SLA compliance</Text>
                </Flex>
                <Text mt="3" color="var(--text-soft)">Current critical ticket compliance is {ticketCompliance}% across the queue.</Text>
              </Box>
              <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.08)" rounded="24px" p="5">
                <Flex align="center" gap="3">
                  <AlertTriangle color="#ff7b72" />
                  <Text fontWeight="700" color="var(--text-main)">Recent action</Text>
                </Flex>
                <Text mt="3" color="var(--text-soft)">A high-priority MFA failure ticket was escalated and is now pending assignment.</Text>
              </Box>
            </Stack>
          </Box>
        </Grid>
      </Stack>
    </Box>
  );
}
