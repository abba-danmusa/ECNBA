import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  ArrowRight,
  Download,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { AuthSession } from "../lib/mockAuth";

const OFFICIAL_RESULTS = [
  { office: "President", winner: "Barrister Adewale O.", votes: "45,231", percent: "52.3%" },
  { office: "Vice President", winner: "Alhaji Bello M.", votes: "42,189", percent: "48.7%" },
  { office: "General Sec", winner: "Mrs. Ifeanyi C.", votes: "51,234", percent: "59.1%" },
];

const REPORTS = [
  { label: "Full Audit Log (JSON)", size: "72.4 MB" },
  { label: "System Access Log (CSV)", size: "12.1 MB" },
  { label: "Anomaly Detection Report (PDF)", size: "8.9 MB" },
  { label: "Voter Turnout Analysis (Excel)", size: "16.2 MB" },
];

type ReceiptStatus = {
  verified: boolean;
  message: string;
  details?: string;
  reference?: string;
};

export function PostElectionDashboard({ session, onCloseSession }: { session: AuthSession; onCloseSession: () => void }) {
  const [now, setNow] = useState(Date.now());
  const [receiptId, setReceiptId] = useState("RX-47A9-F2B1-883K-LM22");
  const [verification, setVerification] = useState<ReceiptStatus | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const lastUpdated = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  function verifyReceipt() {
    if (receiptId.trim().toUpperCase() === "RX-47A9-F2B1-883K-LM22") {
      setVerification({
        verified: true,
        message: "VERIFIED",
        details: "Your vote for President was recorded on 20/07/2026 14:32:21 and included in the final tally.",
        reference: "0x7f83b1657ff1fc53b92dc18148a1d65d",
      });
    } else {
      setVerification({
        verified: false,
        message: "NOT VERIFIED",
        details: "The receipt ID could not be found in the published audit ledger.",
      });
    }
  }

  return (
    <Box minH="100vh" bg="var(--page-bg)" px={{ base: "5", md: "8", xl: "10" }} py={{ base: "6", md: "8", xl: "10" }}>
      <Stack gap="8">
        <Flex align="start" justify="space-between" gap="4" wrap="wrap">
          <Stack gap="2" maxW="3xl">
            <Text fontSize="sm" letterSpacing="0.24em" textTransform="uppercase" color="var(--brand-200)" fontWeight="700">
              📋 Post-Election Audit Portal
            </Text>
            <Heading fontFamily='"Sora", sans-serif' fontSize={{ base: "3xl", md: "4xl" }} lineHeight="1.05" color="var(--text-main)">
              Official ECNBA results, public receipt verification, and audit downloads.
            </Heading>
            <Text color="var(--text-soft)" fontSize="md" maxW="3xl">
              Verify your receipt, review certified results, and download post-election audit packages from the ECNBA transparency portal.
            </Text>
          </Stack>
          <Stack gap="3" align="end" minW="220px">
            <Text color="var(--text-soft)">Role: ECNBA + Public</Text>
            <Box bg="rgba(255,255,255,0.04)" border="1px solid var(--line-soft)" rounded="24px" px="4" py="3">
              <Text fontSize="xs" color="var(--text-dim)">Last updated</Text>
              <Text mt="1" fontWeight="700" color="var(--text-main)">{lastUpdated}</Text>
            </Box>
            <Button onClick={onCloseSession} variant="ghost" rounded="20px" fontWeight="700" color="var(--text-main)">
              Exit Portal
            </Button>
          </Stack>
        </Flex>

        <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
          <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
            🏆 Official Results (Released by ECNBA)
          </Text>
          <Stack gap="4" mt="5">
            {OFFICIAL_RESULTS.map((result) => (
              <Flex key={result.office} align="center" justify="space-between" gap="4" p="4" bg="rgba(255,255,255,0.02)" rounded="24px">
                <Box>
                  <Text fontWeight="700" color="var(--text-main)">{result.office}</Text>
                  <Text color="var(--text-soft)">Winner: {result.winner}</Text>
                </Box>
                <Text fontWeight="700" color="var(--text-main)">{result.votes} votes</Text>
                <Text color="var(--text-soft)">{result.percent}</Text>
              </Flex>
            ))}
          </Stack>
        </Box>

        <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
          <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
            🔍 Cryptographic receipt verifier (Public)
          </Text>
          <Stack gap="5" mt="5">
            <Flex gap="3" wrap="wrap">
              <Input
                value={receiptId}
                onChange={(event) => setReceiptId(event.target.value.toUpperCase())}
                bg="rgba(255,255,255,0.03)"
                border="1px solid var(--line-soft)"
                color="var(--text-main)"
                placeholder="Enter your receipt ID"
                rounded="20px"
                flex="1"
              />
              <Button onClick={verifyReceipt} rounded="20px" fontWeight="700">
                Verify
              </Button>
            </Flex>
            <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.08)" rounded="24px" p="5">
              {verification ? (
                <Stack gap="3">
                  <Text fontWeight="700" color={verification.verified ? "#1fb89d" : "#ff7b72"}>
                    {verification.verified ? "✅ VERIFIED" : "❌ NOT VERIFIED"}
                  </Text>
                  <Text color="var(--text-soft)">{verification.details}</Text>
                  {verification.reference ? (
                    <Text color="var(--text-soft)">🔗 Blockchain reference: {verification.reference}</Text>
                  ) : null}
                </Stack>
              ) : (
                <Text color="var(--text-soft)">Enter a receipt ID above to prove your vote was included in the published tally.</Text>
              )}
            </Box>
          </Stack>
        </Box>

        <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
          <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
            📊 Audit reports (available for download)
          </Text>
          <Stack gap="4" mt="5">
            {REPORTS.map((report) => (
              <Flex key={report.label} align="center" justify="space-between" gap="4" p="4" bg="rgba(255,255,255,0.02)" rounded="24px">
                <Box>
                  <Text fontWeight="700" color="var(--text-main)">{report.label}</Text>
                  <Text color="var(--text-soft)">{report.size}</Text>
                </Box>
                <Button variant="outline" rounded="20px" fontWeight="700">
                  <HStack gap="2">
                    <Download size={16} />
                    <Text>Download</Text>
                  </HStack>
                </Button>
              </Flex>
            ))}
          </Stack>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
          <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
            <HStack align="center" gap="3" mb="4">
              <ShieldCheck color="#1fb89d" />
              <Text fontWeight="700" color="var(--text-main)">Certified transparency</Text>
            </HStack>
            <Text color="var(--text-soft)" fontSize="sm">
              Official results and integrity checks are published with cryptographic receipts for public verification.
            </Text>
          </Box>
          <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
            <HStack align="center" gap="3" mb="4">
              <Sparkles color="#1fb89d" />
              <Text fontWeight="700" color="var(--text-main)">Public audit visibility</Text>
            </HStack>
            <Text color="var(--text-soft)" fontSize="sm">
              Anyone can confirm their vote was counted without exposing candidate-level choices or personal voter data.
            </Text>
          </Box>
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
