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
  VStack,
  Spinner,
  Badge,
} from "@chakra-ui/react";
import {
  ArrowRight,
  Download,
  ShieldCheck,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Copy,
} from "lucide-react";
import type { AuthSession } from "../lib/mockAuth";
import {
  initializeAuditLedger,
  verifyVotingReceipt,
  getValidReceiptIdForDemo,
  type VerificationResult,
} from "../lib/receiptVerification";

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

export function PostElectionDashboard({ session, onCloseSession }: { session: AuthSession; onCloseSession: () => void }) {
  const [now, setNow] = useState(Date.now());
  const [receiptId, setReceiptId] = useState("");
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [demoReceiptId, setDemoReceiptId] = useState<string | null>(null);
  const [ledgerInitialized, setLedgerInitialized] = useState(false);

  // Initialize audit ledger on component mount
  useEffect(() => {
    initializeAuditLedger().then(() => {
      const validReceiptId = getValidReceiptIdForDemo();
      setDemoReceiptId(validReceiptId);
      setReceiptId(validReceiptId);
      setLedgerInitialized(true);
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const lastUpdated = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  async function verifyReceipt() {
    if (!receiptId.trim()) {
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyVotingReceipt(receiptId.trim().toUpperCase());
      setVerification(result);
    } finally {
      setIsVerifying(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  function handleLoadDemoReceipt() {
    if (demoReceiptId) {
      setReceiptId(demoReceiptId);
      setVerification(null);
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
            <Stack gap="3">
              <Flex gap="3" wrap="wrap">
                <Input
                  value={receiptId}
                  onChange={(event) => setReceiptId(event.target.value.toUpperCase())}
                  bg="rgba(255,255,255,0.03)"
                  border="1px solid var(--line-soft)"
                  color="var(--text-main)"
                  placeholder="Enter your receipt ID (e.g., RX-XXXX-XXXX-XXXX-XXXX)"
                  rounded="20px"
                  flex="1"
                  disabled={isVerifying}
                />
                <Button
                  onClick={verifyReceipt}
                  rounded="20px"
                  fontWeight="700"
                  loading={isVerifying}
                  disabled={!receiptId.trim()}
                >
                  {isVerifying ? "Verifying..." : "Verify"}
                </Button>
              </Flex>
              {ledgerInitialized && demoReceiptId && (
                <Text fontSize="xs" color="var(--text-dim)">
                  💡 Tip: Click{" "}
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={handleLoadDemoReceipt}
                    color="var(--brand-200)"
                    fontWeight="700"
                  >
                    Load Demo Receipt
                  </Button>{" "}
                  to test the system
                </Text>
              )}
            </Stack>

            {verification && (
              <Box
                bg="rgba(255,255,255,0.02)"
                border={`1px solid ${verification.verified ? "rgba(31, 184, 157, 0.3)" : "rgba(255, 123, 114, 0.3)"}`}
                rounded="24px"
                p="5"
              >
                <VStack gap="4" align="start">
                  <HStack gap="3" width="full">
                    {verification.verified ? (
                      <>
                        <CheckCircle size={24} color="#1fb89d" strokeWidth={1.5} />
                        <Text fontWeight="700" color="#1fb89d" fontSize="lg">
                          ✅ {verification.message}
                        </Text>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={24} color="#ff7b72" strokeWidth={1.5} />
                        <Text fontWeight="700" color="#ff7b72" fontSize="lg">
                          ❌ {verification.message}
                        </Text>
                      </>
                    )}
                  </HStack>

                  <Text color="var(--text-soft)" fontSize="sm">
                    {verification.details}
                  </Text>

                  {verification.receiptData && (
                    <Stack gap="2" width="full" bg="rgba(255,255,255,0.02)" rounded="16px" p="3">
                      <HStack justify="space-between" fontSize="sm">
                        <Text color="var(--text-dim)">Receipt Timestamp:</Text>
                        <Text color="var(--text-soft)" fontFamily="monospace">
                          {new Date(verification.receiptData.timestamp).toLocaleString()}
                        </Text>
                      </HStack>
                      <HStack justify="space-between" fontSize="sm">
                        <Text color="var(--text-dim)">Office:</Text>
                        <Badge colorScheme="brand" rounded="full">
                          {verification.receiptData.office}
                        </Badge>
                      </HStack>
                      <HStack justify="space-between" fontSize="sm">
                        <Text color="var(--text-dim)">Votes for Office:</Text>
                        <Text color="var(--text-soft)" fontWeight="700">
                          {verification.receiptData.includeCount} included votes
                        </Text>
                      </HStack>
                    </Stack>
                  )}

                  {verification.reference && (
                    <HStack gap="2" width="full">
                      <VStack gap="1" align="start" flex="1">
                        <Text fontSize="xs" color="var(--text-dim)" letterSpacing="0.1em" textTransform="uppercase" fontWeight="700">
                          🔗 Hash Reference
                        </Text>
                        <Text color="var(--text-soft)" fontSize="xs" fontFamily="monospace" wordBreak="break-all">
                          {verification.reference}
                        </Text>
                      </VStack>
                      <Button
                        size="sm"
                        variant="outline"
                        rounded="12px"
                        onClick={() => copyToClipboard(verification.reference!)}
                        title="Copy to clipboard"
                      >
                        <Copy size={14} />
                      </Button>
                    </HStack>
                  )}

                  <Box fontSize="xs" color="var(--text-dim)" bg="rgba(255,255,255,0.01)" rounded="12px" p="3" width="full">
                    <Text fontWeight="700" mb="1">
                      🛡️ Cryptographic Verification Details:
                    </Text>
                    <Text>
                      This receipt has been verified against the published audit ledger using SHA-256 commitments and HMAC-SHA1
                      signatures. The vote commitment proves your ballot was recorded and included in the final tally.
                    </Text>
                  </Box>
                </VStack>
              </Box>
            )}

            {!verification && !isVerifying && (
              <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.08)" rounded="24px" p="5">
                <Text color="var(--text-soft)" fontSize="sm">
                  🎫 Enter a receipt ID above to verify that your ballot was received, recorded, and included in the official tally.
                  The receipt proves your vote counts without revealing your candidate selection.
                </Text>
              </Box>
            )}

            {isVerifying && (
              <Flex align="center" justify="center" gap="3" p="6">
                <Spinner color="var(--brand-200)" size="sm" />
                <Text color="var(--text-soft)">Verifying receipt against audit ledger...</Text>
              </Flex>
            )}
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
              <Text fontWeight="700" color="var(--text-main)">Cryptographically Certified</Text>
            </HStack>
            <Stack gap="2">
              <Text color="var(--text-soft)" fontSize="sm">
                All receipts are signed using HMAC-SHA1 and verified against SHA-256 commitments. Your vote commitment proves the
                ballot was received and counted.
              </Text>
              <Text fontSize="xs" color="var(--text-dim)" fontFamily="monospace">
                • Algorithm: HMAC-SHA1 signatures
                <br />• Commitment: SHA-256 hash
                <br />• Entropy: 96-bit receipt randomness
              </Text>
            </Stack>
          </Box>

          <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
            <HStack align="center" gap="3" mb="4">
              <Sparkles color="#1fb89d" />
              <Text fontWeight="700" color="var(--text-main)">Privacy-Preserving Verification</Text>
            </HStack>
            <Stack gap="2">
              <Text color="var(--text-soft)" fontSize="sm">
                The receipt proves your vote was recorded without revealing your candidate selection. Ballot secrecy is protected
                through cryptographic commitment schemes.
              </Text>
              <Text fontSize="xs" color="var(--text-dim)">
                ✓ Zero-knowledge vote verification
                <br />✓ Voter anonymity maintained
                <br />✓ Tamper-evident receipts
              </Text>
            </Stack>
          </Box>
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
