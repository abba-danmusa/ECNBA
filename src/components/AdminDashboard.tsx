import { useEffect, useState } from "react";
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
  AlertTriangle,
  ArrowRight,
  Clock3,
  Cpu,
  Download,
  FileText,
  MapPin,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import type { AuthSession } from "../lib/mockAuth";

type BranchTurnout = {
  branch: string;
  percent: number;
};

type OfficeVote = {
  office: string;
  votes: string;
  intensity: number;
};

type AuditEntry = {
  time: string;
  user: string;
  action: string;
  ip: string;
};

const BRANCH_TURNOUT: BranchTurnout[] = [
  { branch: "Lagos", percent: 78 },
  { branch: "Abuja FCT", percent: 72 },
  { branch: "Kano", percent: 48 },
  { branch: "Port Harcourt", percent: 64 },
  { branch: "Ibadan", percent: 56 },
];

const OFFICE_VOTES: OfficeVote[] = [
  { office: "President", votes: "4,231 votes", intensity: 88 },
  { office: "Vice President", votes: "3,892 votes", intensity: 76 },
  { office: "General Sec", votes: "5,124 votes", intensity: 93 },
  { office: "Treasurer", votes: "3,567 votes", intensity: 71 },
  { office: "Representatives", votes: "7,891 votes", intensity: 100 },
];

const AUDIT_LOG: AuditEntry[] = [
  { time: "14:32:21", user: "Chairman", action: "Exported voter list (anonymized)", ip: "192.168.1.10" },
  { time: "14:28:05", user: "Observer", action: "Viewed turnout dashboard", ip: "192.168.1.45" },
  { time: "14:15:44", user: "Secretary", action: "Generated interim report", ip: "192.168.1.22" },
  { time: "14:02:33", user: "Help Desk", action: "Verified voter ID: #NBA23891", ip: "192.168.1.67" },
  { time: "13:58:12", user: "Chairman", action: "Extended voting by 30 minutes", ip: "192.168.1.10" },
];

const ALERTS = [
  "[14:45:22] Multiple failed MFA attempts from IP 10.20.30.40 – flagged",
  "[14:30:15] Help desk queue: 3 pending tickets (within SLA)",
  "[14:00:00] System backup completed successfully",
];

const TURNOUT_TREND = [
  { label: "8am", value: 32 },
  { label: "10am", value: 45 },
  { label: "12pm", value: 53 },
  { label: "2pm", value: 61 },
  { label: "4pm", value: 69 },
  { label: "6pm", value: 78 },
];

function SummaryCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <Box
      bg="rgba(255, 255, 255, 0.03)"
      border="1px solid var(--line-soft)"
      rounded="24px"
      px="5"
      py="5"
    >
      <Text fontSize="xs" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)">
        {title}
      </Text>
      <Text
        mt="3"
        fontFamily='"Sora", sans-serif'
        fontWeight="700"
        fontSize="3xl"
        color="var(--text-main)"
      >
        {value}
      </Text>
      <Text mt="2" fontSize="sm" color="var(--text-soft)">
        {detail}
      </Text>
    </Box>
  );
}

function DataBar({ label, percent }: { label: string; percent: number }) {
  return (
    <Stack gap="3">
      <Flex justify="space-between" align="center">
        <Text color="var(--text-main)" fontWeight="700">
          {label}
        </Text>
        <Text color="var(--text-soft)" fontSize="sm">
          {percent}%
        </Text>
      </Flex>
      <Box bg="rgba(255,255,255,0.04)" rounded="full" h="10px" overflow="hidden">
        <Box
          h="full"
          w={`${percent}%`}
          rounded="full"
          bg="linear-gradient(90deg, #1fb89d, #14957e)"
        />
      </Box>
    </Stack>
  );
}

function VoteLine({ office, votes, intensity }: OfficeVote) {
  return (
    <Flex align="center" justify="space-between" gap="4">
      <Text fontWeight="700" color="var(--text-main)">{office}</Text>
      <Flex align="center" gap="3" minW="180px">
        <Box flex="1" bg="rgba(255,255,255,0.03)" rounded="full" h="10px" overflow="hidden">
          <Box h="full" w={`${intensity}%`} bg="rgba(31, 184, 157, 0.9)" />
        </Box>
        <Text color="var(--text-soft)" fontSize="sm" minW="80px" textAlign="right">{votes}</Text>
      </Flex>
    </Flex>
  );
}

export function AdminDashboard({ session, onCloseSession }: { session: AuthSession; onCloseSession: () => void }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const lastUpdated = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const lastUpdatedAgo = Math.floor((Date.now() - now) / 1000);

  return (
    <Box minH="100vh" bg="var(--page-bg)" px={{ base: "5", md: "8", xl: "10" }} py={{ base: "6", md: "8", xl: "10" }}>
      <Stack gap="8">
        <Flex direction={{ base: "column", md: "row" }} align="start" justify="space-between" gap="6">
          <Stack gap="3" maxW={{ base: "100%", md: "65%" }}>
            <Text fontSize="sm" letterSpacing="0.24em" textTransform="uppercase" color="var(--brand-200)" fontWeight="700">
              🗳️ ECNBA 2026 Elections – Admin Dashboard
            </Text>
            <Heading fontFamily='"Sora", sans-serif' fontSize={{ base: "3xl", md: "4xl" }} lineHeight="1.05" color="var(--text-main)">
              Live election operations for the Chairman command center
            </Heading>
            <Text color="var(--text-soft)" maxW="3xl" fontSize="md">
              Monitor turnout, branch performance, aggregated office tallies, system health, and immutable audit trails in a single secure command view.
            </Text>
          </Stack>

          <Stack gap="3" align="end" minW="220px">
            <HStack gap="3" align="center" bg="rgba(255,255,255,0.05)" border="1px solid var(--line-soft)" rounded="24px" px="4" py="3">
              <ShieldCheck color="#1fb89d" />
              <Text fontWeight="700">Role: {session.role === "chairman" ? "Chairman" : session.role}</Text>
            </HStack>
            <Box bg="rgba(255,255,255,0.04)" border="1px solid var(--line-soft)" rounded="24px" px="4" py="3">
              <Text fontSize="xs" color="var(--text-dim)">Last updated</Text>
              <Text mt="1" fontWeight="700" color="var(--text-main)">{lastUpdated}</Text>
            </Box>
          </Stack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="4">
          <SummaryCard title="Eligible Voters" value="87,432" detail="Registered members eligible to vote today." />
          <SummaryCard title="Voter Cast" value="54,891" detail="Ballots received so far across the federation." />
          <SummaryCard title="Turnout Rate" value="62.8%" detail="Current participation rate among registered voters." />
          <SummaryCard title="Polls Close" value="3h 24m" detail="Time remaining until official voting closes." />
        </SimpleGrid>

        <Grid templateColumns={{ base: "1fr", xl: "0.66fr 0.34fr" }} gap="4">
          <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
            <Flex justify="space-between" align="center" mb="5" gap="4" wrap="wrap">
              <Stack gap="1">
                <Text fontSize="sm" fontWeight="700" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)">
                  📈 Live turnout trend
                </Text>
                <Heading fontFamily='"Sora", sans-serif' size="lg" color="var(--text-main)">
                  High-engagement turnout curve
                </Heading>
              </Stack>
              <Text fontSize="xs" color="var(--text-soft)">Live update every 2 seconds • updated {lastUpdatedAgo}s ago</Text>
            </Flex>

            <Box position="relative" h="220px" rounded="24px" bg="rgba(255,255,255,0.02)" p="5">
              <Flex h="full" align="end" justify="space-between" gap="3" pb="4">
                {TURNOUT_TREND.map((point) => (
                  <Box key={point.label} h="full" w="full" pos="relative">
                    <Box
                      position="absolute"
                      bottom={`${point.value * 0.85}%`}
                      left="50%"
                      transform="translateX(-50%)"
                      w="10px"
                      h="10px"
                      rounded="full"
                      bg="var(--brand-500)"
                      boxShadow="0 0 0 8px rgba(31, 184, 157, 0.12)"
                    />
                    <Box
                      position="absolute"
                      bottom="0"
                      left="25%"
                      right="25%"
                      h={`${point.value * 0.85}%`}
                      bg="rgba(31, 184, 157, 0.14)"
                      roundedTop="full"
                    />
                    <Text position="absolute" bottom="-24px" left="50%" transform="translateX(-50%)" fontSize="xs" color="var(--text-soft)">
                      {point.label}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </Box>
          </Box>

          <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
            <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
              📍 Turnout by branch (Live)
            </Text>
            <Stack gap="4" mt="6">
              {BRANCH_TURNOUT.map((item) => (
                <DataBar key={item.branch} label={item.branch} percent={item.percent} />
              ))}
            </Stack>
          </Box>
        </Grid>

        <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
          <Flex align="center" justify="space-between" mb="5" wrap="wrap" gap="4">
            <Stack gap="1">
              <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
                🗳️ Votes per office (aggregated – no candidate names until polls close)
              </Text>
              <Text color="var(--text-soft)" fontSize="sm">
                Aggregated vote totals update in real time without revealing candidate-level disclosures.
              </Text>
            </Stack>
          </Flex>
          <Stack gap="4">
            {OFFICE_VOTES.map((entry) => (
              <VoteLine key={entry.office} {...entry} />
            ))}
          </Stack>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="4">
          <SummaryCard title="✅ Uptime" value="99.97%" detail="Election services remain available and monitored." />
          <SummaryCard title="⚡ Avg Resp Time" value="245ms" detail="Current API response time across voting endpoints." />
          <SummaryCard title="📊 Error Rate" value="0.02%" detail="Very low incident rate across the control plane." />
          <SummaryCard title="🔥 CPU Usage" value="34%" detail="Application infrastructure operating within expected limits." />
        </SimpleGrid>

        <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
          <Flex justify="space-between" align="center" wrap="wrap" gap="4" mb="5">
            <Stack gap="1">
              <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
                🔐 Immutable audit log (tamper-proof)
              </Text>
              <Text color="var(--text-soft)" fontSize="sm">Every administrative action is recorded for accountability.</Text>
            </Stack>
            <HStack gap="3" wrap="wrap">
              <Button variant="outline" fontWeight="700" rounded="20px">
                Export Audit Log
              </Button>
              <Button variant="outline" fontWeight="700" rounded="20px">
                Export Full Report
              </Button>
              <Button onClick={() => setNow(Date.now())} fontWeight="700" rounded="20px">
                Refresh
              </Button>
            </HStack>
          </Flex>

          <Box overflowX="auto">
            <Box minW="720px">
              <Grid templateColumns="1fr 1fr 2fr 1fr" gap="4" px="3" py="3" bg="rgba(255,255,255,0.02)" roundedTop="lg">
                <Text fontSize="xs" letterSpacing="0.18em" color="var(--text-dim)" fontWeight="700">Timestamp</Text>
                <Text fontSize="xs" letterSpacing="0.18em" color="var(--text-dim)" fontWeight="700">User</Text>
                <Text fontSize="xs" letterSpacing="0.18em" color="var(--text-dim)" fontWeight="700">Action</Text>
                <Text fontSize="xs" letterSpacing="0.18em" color="var(--text-dim)" fontWeight="700">IP</Text>
              </Grid>
              <Stack gap="0">
                {AUDIT_LOG.map((entry) => (
                  <Grid key={`${entry.time}-${entry.ip}`} templateColumns="1fr 1fr 2fr 1fr" gap="4" px="3" py="3" borderTop="1px solid rgba(255,255,255,0.04)">
                    <Text color="var(--text-main)">{entry.time}</Text>
                    <Text color="var(--text-soft)">{entry.user}</Text>
                    <Text color="var(--text-soft)">{entry.action}</Text>
                    <Text color="var(--text-soft)">{entry.ip}</Text>
                  </Grid>
                ))}
              </Stack>
            </Box>
          </Box>
        </Box>

        <Grid templateColumns={{ base: "1fr", xl: "0.55fr 0.45fr" }} gap="4">
          <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
            <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
              ⚠️ Alerts & anomalies
            </Text>
            <Stack gap="3" mt="5">
              {ALERTS.map((alert) => (
                <Flex key={alert} align="start" gap="3">
                  <Box mt="1" h="2" w="2" rounded="full" bg="var(--danger-400)" />
                  <Text color="var(--text-soft)" fontSize="sm">{alert}</Text>
                </Flex>
              ))}
            </Stack>
          </Box>

          <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
            <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
              Command actions
            </Text>
            <Stack gap="4" mt="5">
              <Button colorScheme="teal" rounded="22px" fontWeight="700">
                Extend Voting (Chairman only)
              </Button>
              <Button variant="outline" rounded="22px" fontWeight="700">
                View Live Help Desk Queue
              </Button>
              <Button onClick={onCloseSession} variant="ghost" rounded="22px" fontWeight="700" color="var(--text-main)">
                Exit Dashboard
              </Button>
            </Stack>
          </Box>
        </Grid>
      </Stack>
    </Box>
  );
}
