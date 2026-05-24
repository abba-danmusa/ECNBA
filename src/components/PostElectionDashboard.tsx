import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Download,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { AuthSession } from "../lib/mockAuth";
import {
  getValidReceiptIdForDemo,
  initializeAuditLedger,
  verifyVotingReceipt,
  type VerificationResult,
} from "../lib/receiptVerification";

type CertifiedResult = {
  office: string;
  winner: string;
  votes: string;
  percent: number;
  percentLabel: string;
  margin: string;
  turnout: string;
  certifiedAt: string;
};

type VerificationTrendPoint = {
  time: string;
  verified: number;
  challenged: number;
};

type CertificationEvent = {
  time: string;
  stage: string;
  detail: string;
  tone: "positive" | "neutral" | "warning";
};

type AuditPackage = {
  label: string;
  size: string;
  format: string;
  scope: string;
  downloads: string;
};

type TransparencyEvent = {
  time: string;
  actor: string;
  action: string;
  detail: string;
  tone: "positive" | "neutral" | "warning";
};

const OFFICIAL_RESULTS: CertifiedResult[] = [
  {
    office: "President",
    winner: "Barrister Adewale O.",
    votes: "45,231",
    percent: 52.3,
    percentLabel: "52.3%",
    margin: "+4.1 pts",
    turnout: "67%",
    certifiedAt: "18:21",
  },
  {
    office: "Vice President",
    winner: "Alhaji Bello M.",
    votes: "42,189",
    percent: 48.7,
    percentLabel: "48.7%",
    margin: "+1.8 pts",
    turnout: "64%",
    certifiedAt: "18:24",
  },
  {
    office: "General Secretary",
    winner: "Mrs. Ifeanyi C.",
    votes: "51,234",
    percent: 59.1,
    percentLabel: "59.1%",
    margin: "+10.7 pts",
    turnout: "69%",
    certifiedAt: "18:28",
  },
];

const VERIFICATION_TREND: VerificationTrendPoint[] = [
  { time: "18:00", verified: 46, challenged: 3 },
  { time: "19:00", verified: 82, challenged: 4 },
  { time: "20:00", verified: 109, challenged: 4 },
  { time: "21:00", verified: 138, challenged: 3 },
  { time: "22:00", verified: 162, challenged: 2 },
  { time: "23:00", verified: 181, challenged: 2 },
];

const CERTIFICATION_TIMELINE: CertificationEvent[] = [
  {
    time: "18:05",
    stage: "Poll close certified",
    detail: "All voting windows were sealed and branch tallies were frozen for reconciliation.",
    tone: "positive",
  },
  {
    time: "18:14",
    stage: "Zonal tallies reconciled",
    detail: "Regional collation desks matched accreditation counts to committed ballots within tolerance.",
    tone: "positive",
  },
  {
    time: "18:22",
    stage: "Observer sign-off recorded",
    detail: "Independent observers acknowledged the reconciliation snapshot before public publication.",
    tone: "neutral",
  },
  {
    time: "18:31",
    stage: "Public verifier released",
    detail: "Receipt verification, official office results, and audit package downloads were opened to the portal.",
    tone: "positive",
  },
];

const REPORTS: AuditPackage[] = [
  {
    label: "Full Audit Log",
    size: "72.4 MB",
    format: "JSON",
    scope: "Every signed election event from accreditation to publication",
    downloads: "418 downloads",
  },
  {
    label: "System Access Log",
    size: "12.1 MB",
    format: "CSV",
    scope: "Administrative access, observer views, and support role activity",
    downloads: "267 downloads",
  },
  {
    label: "Anomaly Detection Report",
    size: "8.9 MB",
    format: "PDF",
    scope: "Security anomalies, containment actions, and review outcomes",
    downloads: "194 downloads",
  },
  {
    label: "Turnout Reconciliation Workbook",
    size: "16.2 MB",
    format: "XLSX",
    scope: "Branch turnout, accreditation, and final ballot inclusion checks",
    downloads: "303 downloads",
  },
];

const TRANSPARENCY_FEED: TransparencyEvent[] = [
  {
    time: "23:14:08",
    actor: "Public verifier",
    action: "Receipt RX-4Q2P-7K8D-3H1M-9T6L validated successfully.",
    detail: "The commitment was confirmed against the published ledger without exposing ballot choice.",
    tone: "positive",
  },
  {
    time: "23:09:41",
    actor: "Observer portal",
    action: "Downloaded the turnout reconciliation workbook.",
    detail: "The export included certified branch counts and office-level inclusion summaries.",
    tone: "neutral",
  },
  {
    time: "22:56:17",
    actor: "Public verifier",
    action: "A mismatched receipt challenge was rejected.",
    detail: "The submitted ID was not present in the release ledger and no certified ballot record was affected.",
    tone: "warning",
  },
  {
    time: "22:48:33",
    actor: "Audit publication service",
    action: "Anomaly report checksum mirrored to transparency storage.",
    detail: "The package hash is now available for independent download verification.",
    tone: "positive",
  },
];

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

function toneStyles(tone: CertificationEvent["tone"] | TransparencyEvent["tone"]) {
  if (tone === "positive") {
    return {
      bg: "rgba(31, 184, 157, 0.1)",
      border: "rgba(31, 184, 157, 0.24)",
      dot: "var(--brand-500)",
      ring: "rgba(31, 184, 157, 0.14)",
      label: "Certified",
      labelColor: "var(--brand-200)",
    };
  }

  if (tone === "warning") {
    return {
      bg: "rgba(255, 123, 114, 0.1)",
      border: "rgba(255, 123, 114, 0.24)",
      dot: "var(--danger-400)",
      ring: "rgba(255, 123, 114, 0.14)",
      label: "Flagged",
      labelColor: "var(--danger-400)",
    };
  }

  return {
    bg: "rgba(240, 177, 75, 0.08)",
    border: "rgba(240, 177, 75, 0.24)",
    dot: "var(--gold-400)",
    ring: "rgba(240, 177, 75, 0.14)",
    label: "Published",
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

function ReceiptVerifierPanel({
  receiptId,
  onReceiptIdChange,
  verification,
  isVerifying,
  onVerify,
  ledgerInitialized,
  demoReceiptId,
  onLoadDemoReceipt,
  onCopy,
}: {
  receiptId: string;
  onReceiptIdChange: (value: string) => void;
  verification: VerificationResult | null;
  isVerifying: boolean;
  onVerify: () => void;
  ledgerInitialized: boolean;
  demoReceiptId: string | null;
  onLoadDemoReceipt: () => void;
  onCopy: (text: string) => void;
}) {
  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
      <Stack gap="1">
        <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
          🔍 Public receipt verification
        </Text>
        <Heading fontFamily='"Sora", sans-serif' size="lg" color="var(--text-main)">
          Confirm ballot inclusion from the audit ledger
        </Heading>
        <Text color="var(--text-soft)" fontSize="sm">
          Enter a receipt ID to prove the ballot was recorded and included in the certified tally without revealing the vote.
        </Text>
      </Stack>

      <Stack gap="5" mt="6">
        <Stack gap="3">
          <Flex gap="3" wrap="wrap">
            <Input
              value={receiptId}
              onChange={(event) => onReceiptIdChange(event.target.value.toUpperCase())}
              bg="rgba(255,255,255,0.03)"
              border="1px solid var(--line-soft)"
              color="var(--text-main)"
              placeholder="Enter receipt ID (e.g. RX-XXXX-XXXX-XXXX-XXXX)"
              rounded="20px"
              flex="1"
              disabled={isVerifying}
            />
            <Button onClick={onVerify} rounded="20px" fontWeight="700" loading={isVerifying} disabled={!receiptId.trim()}>
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>
          </Flex>

          {ledgerInitialized && demoReceiptId ? (
            <Text fontSize="xs" color="var(--text-dim)">
              Tip: use{" "}
              <Button size="xs" variant="ghost" onClick={onLoadDemoReceipt} color="var(--brand-200)" fontWeight="700">
                Load Demo Receipt
              </Button>{" "}
              to test the verifier against the current release ledger.
            </Text>
          ) : null}
        </Stack>

        {verification ? (
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
                      {verification.message}
                    </Text>
                  </>
                ) : (
                  <>
                    <AlertCircle size={24} color="#ff7b72" strokeWidth={1.5} />
                    <Text fontWeight="700" color="#ff7b72" fontSize="lg">
                      {verification.message}
                    </Text>
                  </>
                )}
              </HStack>

              <Text color="var(--text-soft)" fontSize="sm">
                {verification.details}
              </Text>

              {verification.receiptData ? (
                <SimpleGrid columns={{ base: 1, md: 3 }} gap="3" width="full">
                  <Box rounded="18px" bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.08)" px="4" py="3">
                    <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
                      Timestamp
                    </Text>
                    <Text mt="2" color="var(--text-main)" fontWeight="700" fontSize="sm">
                      {new Date(verification.receiptData.timestamp).toLocaleString()}
                    </Text>
                  </Box>
                  <Box rounded="18px" bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.08)" px="4" py="3">
                    <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
                      Office
                    </Text>
                    <Badge mt="2" colorScheme="brand" rounded="full">
                      {verification.receiptData.office}
                    </Badge>
                  </Box>
                  <Box rounded="18px" bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.08)" px="4" py="3">
                    <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
                      Included votes
                    </Text>
                    <Text mt="2" color="var(--text-main)" fontWeight="700">
                      {verification.receiptData.includeCount}
                    </Text>
                  </Box>
                </SimpleGrid>
              ) : null}

              {verification.reference ? (
                <HStack gap="2" width="full" align="start">
                  <VStack gap="1" align="start" flex="1">
                    <Text fontSize="xs" color="var(--text-dim)" letterSpacing="0.1em" textTransform="uppercase" fontWeight="700">
                      Hash reference
                    </Text>
                    <Text color="var(--text-soft)" fontSize="xs" fontFamily="monospace" wordBreak="break-all">
                      {verification.reference}
                    </Text>
                  </VStack>
                  <Button size="sm" variant="outline" rounded="12px" onClick={() => onCopy(verification.reference!)} title="Copy to clipboard">
                    <Copy size={14} />
                  </Button>
                </HStack>
              ) : null}

              <Box fontSize="xs" color="var(--text-dim)" bg="rgba(255,255,255,0.01)" rounded="12px" p="3" width="full">
                <Text fontWeight="700" mb="1">
                  Verification note
                </Text>
                <Text>
                  This verifier checks the published receipt against the released commitment ledger and signature data. The result proves inclusion without exposing the underlying ballot selection.
                </Text>
              </Box>
            </VStack>
          </Box>
        ) : !isVerifying ? (
          <Box bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.08)" rounded="24px" p="5">
            <Text color="var(--text-soft)" fontSize="sm">
              Enter a receipt ID to confirm that the ballot was received, recorded, and included in the official tally. The published receipt proves counting, not candidate choice.
            </Text>
          </Box>
        ) : null}

        {isVerifying ? (
          <Flex align="center" justify="center" gap="3" p="6">
            <Spinner color="var(--brand-200)" size="sm" />
            <Text color="var(--text-soft)">Verifying receipt against the published audit ledger...</Text>
          </Flex>
        ) : null}
      </Stack>
    </Box>
  );
}

function VerificationTrendPanel() {
  const width = 380;
  const height = 190;
  const geometry = buildChartGeometry(
    VERIFICATION_TREND.map((point) => point.verified),
    width,
    height,
    0,
    200,
  );
  const currentPoint = geometry.points[geometry.points.length - 1];

  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
      <Stack gap="1">
        <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
          📈 Receipt verification trend
        </Text>
        <Heading fontFamily='"Sora", sans-serif' size="md" color="var(--text-main)">
          Public confidence activity
        </Heading>
        <Text color="var(--text-soft)" fontSize="sm">
          Verified receipt checks are rising while challenged IDs remain low after release.
        </Text>
      </Stack>

      <Box rounded="24px" bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.06)" p="4" mt="5">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="190" role="img" aria-label="Receipt verification trend">
          <defs>
            <linearGradient id="verification-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(31, 184, 157, 0.28)" />
              <stop offset="100%" stopColor="rgba(31, 184, 157, 0.03)" />
            </linearGradient>
          </defs>

          {[50, 100, 150, 200].map((tick) => {
            const y = height - geometry.padY - (tick / 200) * (height - geometry.padY * 2);
            return (
              <g key={tick}>
                <line x1={geometry.padX} y1={y} x2={width - geometry.padX} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" />
                <text x="0" y={y + 4} fill="rgba(201, 214, 223, 0.56)" fontSize="11">
                  {tick}
                </text>
              </g>
            );
          })}

          <path d={geometry.area} fill="url(#verification-fill)" />
          <polyline fill="none" stroke="rgba(31, 184, 157, 0.95)" strokeWidth="4" points={geometry.line} />

          {geometry.points.map((point, index) => (
            <g key={VERIFICATION_TREND[index].time}>
              <circle cx={point.x} cy={point.y} r="5" fill="#1fb89d" stroke="#041018" strokeWidth="3" />
              <text x={point.x} y={height - 2} fill="rgba(230, 238, 243, 0.74)" fontSize="12" textAnchor="middle">
                {VERIFICATION_TREND[index].time}
              </text>
            </g>
          ))}

          <g>
            <circle cx={currentPoint.x} cy={currentPoint.y} r="10" fill="rgba(31, 184, 157, 0.18)" />
            <circle cx={currentPoint.x} cy={currentPoint.y} r="5" fill="#1fb89d" stroke="#041018" strokeWidth="3" />
            <text x={currentPoint.x - 4} y={currentPoint.y - 18} fill="#9ae7d8" fontSize="13" fontWeight="700" textAnchor="end">
              181 checks
            </text>
          </g>
        </svg>
      </Box>

      <SimpleGrid columns={{ base: 1, sm: 3 }} gap="3" mt="4">
        <Box rounded="20px" border="1px solid rgba(255,255,255,0.08)" bg="rgba(255,255,255,0.02)" px="4" py="4">
          <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
            Success rate
          </Text>
          <Text mt="2" fontFamily='"Sora", sans-serif' fontSize="2xl" fontWeight="700" color="var(--text-main)">
            98.9%
          </Text>
          <Text color="var(--text-soft)" fontSize="sm">
            Verified public checks completed without challenge.
          </Text>
        </Box>
        <Box rounded="20px" border="1px solid rgba(255,255,255,0.08)" bg="rgba(255,255,255,0.02)" px="4" py="4">
          <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
            Challenged IDs
          </Text>
          <Text mt="2" fontFamily='"Sora", sans-serif' fontSize="2xl" fontWeight="700" color="var(--text-main)">
            2
          </Text>
          <Text color="var(--text-soft)" fontSize="sm">
            Current-hour mismatches rejected by the published ledger.
          </Text>
        </Box>
        <Box rounded="20px" border="1px solid rgba(255,255,255,0.08)" bg="rgba(255,255,255,0.02)" px="4" py="4">
          <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
            Avg verify time
          </Text>
          <Text mt="2" fontFamily='"Sora", sans-serif' fontSize="2xl" fontWeight="700" color="var(--text-main)">
            1.6 sec
          </Text>
          <Text color="var(--text-soft)" fontSize="sm">
            Median lookup and ledger comparison time on the portal.
          </Text>
        </Box>
      </SimpleGrid>
    </Box>
  );
}

function CertifiedResultsPanel() {
  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
      <Stack gap="1">
        <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
          🏆 Certified office results
        </Text>
        <Heading fontFamily='"Sora", sans-serif' size="lg" color="var(--text-main)">
          Public result board
        </Heading>
        <Text color="var(--text-soft)" fontSize="sm">
          Official office-level outcomes released after reconciliation and observer sign-off.
        </Text>
      </Stack>

      <Stack gap="4" mt="6">
        {OFFICIAL_RESULTS.map((result) => (
          <Box
            key={result.office}
            rounded="24px"
            border="1px solid rgba(255,255,255,0.08)"
            bg="rgba(255,255,255,0.02)"
            px="4"
            py="4"
          >
            <Flex justify="space-between" align="start" gap="4" wrap="wrap">
              <Box>
                <Text color="var(--text-main)" fontWeight="700">
                  {result.office}
                </Text>
                <Text color="var(--text-soft)" fontSize="sm">
                  Winner: {result.winner}
                </Text>
              </Box>
              <Text fontSize="xs" letterSpacing="0.16em" textTransform="uppercase" color="var(--text-dim)">
                Certified {result.certifiedAt}
              </Text>
            </Flex>

            <Box mt="4" bg="rgba(255,255,255,0.06)" rounded="full" h="12px" overflow="hidden">
              <Box h="full" w={`${result.percent}%`} rounded="full" bg="linear-gradient(90deg, #1fb89d, #14957e)" />
            </Box>

            <Flex justify="space-between" gap="4" mt="3" wrap="wrap">
              <Text color="var(--text-main)" fontWeight="700">
                {result.votes} votes
              </Text>
              <Text color="var(--brand-200)" fontWeight="700">
                {result.percentLabel}
              </Text>
            </Flex>

            <Flex justify="space-between" gap="4" mt="1" wrap="wrap">
              <Text color="var(--text-soft)" fontSize="sm">
                Winning margin: {result.margin}
              </Text>
              <Text color="var(--text-soft)" fontSize="sm">
                Office turnout: {result.turnout}
              </Text>
            </Flex>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function CertificationTimelinePanel() {
  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
      <Stack gap="1">
        <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
          ⛓️ Certification timeline
        </Text>
        <Heading fontFamily='"Sora", sans-serif' size="md" color="var(--text-main)">
          Chain of publication
        </Heading>
        <Text color="var(--text-soft)" fontSize="sm">
          How the election moved from poll close to public transparency release.
        </Text>
      </Stack>

      <Stack gap="3" mt="6">
        {CERTIFICATION_TIMELINE.map((event) => {
          const palette = toneStyles(event.tone);

          return (
            <Flex
              key={`${event.time}-${event.stage}`}
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
                  <Text fontFamily='"Sora", sans-serif' fontWeight="700" color="var(--text-main)">
                    {event.stage}
                  </Text>
                  <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color={palette.labelColor} fontWeight="700">
                    {event.time}
                  </Text>
                </Flex>
                <Text color="var(--text-soft)" fontSize="sm">
                  {event.detail}
                </Text>
              </Stack>
            </Flex>
          );
        })}
      </Stack>
    </Box>
  );
}

function AuditManifestPanel() {
  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
      <Stack gap="1">
        <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
          📦 Audit package manifest
        </Text>
        <Heading fontFamily='"Sora", sans-serif' size="lg" color="var(--text-main)">
          Transparency downloads
        </Heading>
        <Text color="var(--text-soft)" fontSize="sm">
          Download the released evidence packages used to support the public results announcement.
        </Text>
      </Stack>

      <Stack gap="4" mt="6">
        {REPORTS.map((report) => (
          <Box
            key={report.label}
            rounded="24px"
            border="1px solid rgba(255,255,255,0.08)"
            bg="rgba(255,255,255,0.02)"
            px="4"
            py="4"
          >
            <Flex justify="space-between" align="start" gap="4" wrap="wrap">
              <Box>
                <Text fontWeight="700" color="var(--text-main)">
                  {report.label}
                </Text>
                <Text color="var(--text-soft)" fontSize="sm">
                  {report.scope}
                </Text>
              </Box>
              <Button variant="outline" rounded="20px" fontWeight="700">
                <HStack gap="2">
                  <Download size={16} />
                  <Text>Download</Text>
                </HStack>
              </Button>
            </Flex>

            <HStack gap="3" wrap="wrap" mt="4">
              <Box px="3" py="1" rounded="full" border="1px solid rgba(255,255,255,0.08)" bg="rgba(255,255,255,0.02)">
                <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
                  {report.format}
                </Text>
              </Box>
              <Box px="3" py="1" rounded="full" border="1px solid rgba(255,255,255,0.08)" bg="rgba(255,255,255,0.02)">
                <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
                  {report.size}
                </Text>
              </Box>
              <Box px="3" py="1" rounded="full" border="1px solid rgba(255,255,255,0.08)" bg="rgba(255,255,255,0.02)">
                <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
                  {report.downloads}
                </Text>
              </Box>
            </HStack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function TransparencyFeedPanel() {
  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
      <Stack gap="1">
        <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
          🌐 Transparency activity stream
        </Text>
        <Heading fontFamily='"Sora", sans-serif' size="md" color="var(--text-main)">
          Live public and observer activity
        </Heading>
      </Stack>

      <Stack gap="3" mt="6">
        {TRANSPARENCY_FEED.map((event) => {
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
                  <Text fontFamily='"Sora", sans-serif' fontWeight="700" color="var(--text-main)">
                    {event.time}
                  </Text>
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

export function PostElectionDashboard({ session, onCloseSession }: { session: AuthSession; onCloseSession: () => void }) {
  const [now, setNow] = useState(Date.now());
  const [receiptId, setReceiptId] = useState("");
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [demoReceiptId, setDemoReceiptId] = useState<string | null>(null);
  const [ledgerInitialized, setLedgerInitialized] = useState(false);

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
              Certified results, public verification, and transparency evidence in one portal.
            </Heading>
            <Text color="var(--text-soft)" fontSize="md" maxW="3xl">
              Review official office outcomes, verify your receipt against the released audit ledger, and inspect the packages that support the final election record.
            </Text>
          </Stack>

          <Stack gap="3" align="end" minW="220px">
            <HStack gap="3" align="center" bg="rgba(255,255,255,0.05)" border="1px solid var(--line-soft)" rounded="24px" px="4" py="3">
              <ShieldCheck color="#1fb89d" />
              <Text fontWeight="700">Role: {session.role === "chairman" ? "ECNBA Admin" : "Observer / Public"}</Text>
            </HStack>
            <Box bg="rgba(255,255,255,0.04)" border="1px solid var(--line-soft)" rounded="24px" px="4" py="3">
              <Text fontSize="xs" color="var(--text-dim)">
                Last updated
              </Text>
              <Text mt="1" fontWeight="700" color="var(--text-main)">
                {lastUpdated}
              </Text>
            </Box>
            <Button onClick={onCloseSession} variant="ghost" rounded="20px" fontWeight="700" color="var(--text-main)">
              Exit Portal
            </Button>
          </Stack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="4">
          <StatCard label="Certified Offices" value="3" detail="Office-level results published after reconciliation and observer sign-off." />
          <StatCard label="Receipt Checks Tonight" value="181" detail="Public verification requests completed against the release ledger." />
          <StatCard label="Audit Packages" value="4" detail="Transparency files available for independent review and download." />
          <StatCard label="Observer Downloads" value="1,182" detail="Evidence package retrievals across observers, media, and members." />
        </SimpleGrid>

        <Grid templateColumns={{ base: "1fr", xl: "0.58fr 0.42fr" }} gap="4">
          <ReceiptVerifierPanel
            receiptId={receiptId}
            onReceiptIdChange={setReceiptId}
            verification={verification}
            isVerifying={isVerifying}
            onVerify={verifyReceipt}
            ledgerInitialized={ledgerInitialized}
            demoReceiptId={demoReceiptId}
            onLoadDemoReceipt={handleLoadDemoReceipt}
            onCopy={copyToClipboard}
          />
          <VerificationTrendPanel />
        </Grid>

        <Grid templateColumns={{ base: "1fr", xl: "0.56fr 0.44fr" }} gap="4">
          <CertifiedResultsPanel />
          <CertificationTimelinePanel />
        </Grid>

        <Grid templateColumns={{ base: "1fr", xl: "0.58fr 0.42fr" }} gap="4">
          <AuditManifestPanel />
          <TransparencyFeedPanel />
        </Grid>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
          <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
            <HStack align="center" gap="3" mb="4">
              <ShieldCheck color="#1fb89d" />
              <Text fontWeight="700" color="var(--text-main)">
                Cryptographically certified publication
              </Text>
            </HStack>
            <Stack gap="2">
              <Text color="var(--text-soft)" fontSize="sm">
                Published receipts are checked against signed commitments and release-ledger references. The certification flow preserves evidence from tally closure through public verification.
              </Text>
              <Text fontSize="xs" color="var(--text-dim)" fontFamily="monospace">
                HMAC-SHA1 signatures
                <br />
                SHA-256 commitments
                <br />
                96-bit receipt entropy
              </Text>
            </Stack>
          </Box>

          <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
            <HStack align="center" gap="3" mb="4">
              <Sparkles color="#1fb89d" />
              <Text fontWeight="700" color="var(--text-main)">
                Privacy-preserving transparency
              </Text>
            </HStack>
            <Stack gap="2">
              <Text color="var(--text-soft)" fontSize="sm">
                The public can confirm inclusion without exposing candidate selection. Receipts remain tamper-evident while ballot secrecy stays intact.
              </Text>
              <Text fontSize="xs" color="var(--text-dim)">
                Zero-knowledge style inclusion proof
                <br />
                Voter anonymity preserved
                <br />
                Public auditability retained
              </Text>
            </Stack>
          </Box>
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
