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
import { Clock3, MapPin, RefreshCw, ShieldCheck } from "lucide-react";
import type { AuthSession } from "../lib/mockAuth";

type TurnoutPoint = {
  time: string;
  turnout: number;
  ballots: string;
};

type ReconciliationPoint = {
  checkpoint: string;
  accredited: number;
  cast: number;
  accreditedCount: string;
  castCount: string;
};

type ZoneParticipation = {
  code: string;
  zone: string;
  anchor: string;
  turnout: number;
  accredited: string;
  cast: string;
  gridColumn: string;
  gridRow: string;
};

type AuthTrendPoint = {
  time: string;
  success: number;
  recovery: number;
  failed: number;
  lockouts: number;
};

type ActivityEvent = {
  time: string;
  zone: string;
  actor: string;
  action: string;
  detail: string;
  tone: "positive" | "neutral" | "warning";
};

type AlertItem = {
  time: string;
  title: string;
  detail: string;
  tone: "positive" | "neutral" | "warning";
};

type SummaryItem = {
  title: string;
  value: string;
  detail: string;
};

type DashboardAction = {
  id: string;
  label: string;
  description: string;
  variant?: "solid" | "outline" | "ghost";
  colorScheme?: string;
  disabled?: boolean;
};

type CommandNotice = {
  time: string;
  title: string;
  detail: string;
  tone: "positive" | "neutral" | "warning";
};

type DashboardConfig = {
  shellLabel: string;
  heading: string;
  description: string;
  roleLabel: string;
  summaryCards: SummaryItem[];
  operationsCards: SummaryItem[];
  liveFeedLabel: string;
  liveFeedHeading: string;
  liveFeedDescription: string;
  liveFeedExportLabel: string;
  liveActivity: ActivityEvent[];
  alertsTitle: string;
  alerts: AlertItem[];
  actionsTitle: string;
  privilegeTitle: string;
  privilegeDetail: string;
  actions: DashboardAction[];
};

const TURNOUT_SERIES: TurnoutPoint[] = [
  { time: "08:00", turnout: 11, ballots: "9,618 ballots" },
  { time: "10:00", turnout: 24, ballots: "20,214 ballots" },
  { time: "12:00", turnout: 39, ballots: "34,106 ballots" },
  { time: "14:00", turnout: 51, ballots: "44,589 ballots" },
  { time: "16:00", turnout: 58, ballots: "50,741 ballots" },
  { time: "18:00", turnout: 62.8, ballots: "54,891 ballots" },
];

const RECONCILIATION_SERIES: ReconciliationPoint[] = [
  { checkpoint: "09:00", accredited: 18, cast: 12, accreditedCount: "15,734 accredited", castCount: "10,482 cast" },
  { checkpoint: "11:00", accredited: 34, cast: 27, accreditedCount: "29,812 accredited", castCount: "23,476 cast" },
  { checkpoint: "13:00", accredited: 49, cast: 41, accreditedCount: "42,905 accredited", castCount: "35,884 cast" },
  { checkpoint: "15:00", accredited: 63, cast: 54, accreditedCount: "55,127 accredited", castCount: "47,311 cast" },
  { checkpoint: "17:00", accredited: 72, cast: 62.8, accreditedCount: "62,944 accredited", castCount: "54,891 cast" },
];

const ZONE_MAP: ZoneParticipation[] = [
  { code: "NW", zone: "North West", anchor: "Kano / Kaduna", turnout: 54, accredited: "11,804", cast: "10,116", gridColumn: "1", gridRow: "1" },
  { code: "NC", zone: "North Central", anchor: "Abuja / Ilorin", turnout: 69, accredited: "9,942", cast: "8,281", gridColumn: "2", gridRow: "1" },
  { code: "NE", zone: "North East", anchor: "Maiduguri / Yola", turnout: 47, accredited: "6,512", cast: "5,203", gridColumn: "3", gridRow: "1" },
  { code: "SW", zone: "South West", anchor: "Lagos / Ibadan", turnout: 81, accredited: "19,804", cast: "17,946", gridColumn: "1", gridRow: "2" },
  { code: "SS", zone: "South South", anchor: "Port Harcourt / Uyo", turnout: 63, accredited: "8,447", cast: "7,294", gridColumn: "2", gridRow: "2" },
  { code: "SE", zone: "South East", anchor: "Enugu / Awka", turnout: 66, accredited: "8,135", cast: "6,051", gridColumn: "3", gridRow: "2" },
];

const AUTH_SERIES: AuthTrendPoint[] = [
  { time: "12:00", success: 98.2, recovery: 1.2, failed: 17, lockouts: 4 },
  { time: "13:00", success: 98.7, recovery: 1.0, failed: 12, lockouts: 3 },
  { time: "14:00", success: 98.4, recovery: 1.1, failed: 19, lockouts: 5 },
  { time: "15:00", success: 98.9, recovery: 0.8, failed: 10, lockouts: 2 },
  { time: "16:00", success: 99.1, recovery: 0.7, failed: 8, lockouts: 2 },
  { time: "17:00", success: 98.8, recovery: 0.9, failed: 11, lockouts: 3 },
];

const LIVE_ACTIVITY: ActivityEvent[] = [
  {
    time: "17:41:12",
    zone: "South West",
    actor: "Lagos collation desk",
    action: "Turnout crossed the 80% threshold.",
    detail: "1,284 ballots were committed across accredited units in the last 15 minutes.",
    tone: "positive",
  },
  {
    time: "17:33:48",
    zone: "North Central",
    actor: "Abuja help desk",
    action: "Paused authenticator queue fully cleared.",
    detail: "Twelve voters resumed voting after secure MFA resets and identity confirmation.",
    tone: "neutral",
  },
  {
    time: "17:28:09",
    zone: "South South",
    actor: "Rivers branch supervisor",
    action: "Accreditation-to-ballot delta narrowed below 6%.",
    detail: "Field officers confirmed no device outage and normal casting resumed.",
    tone: "positive",
  },
  {
    time: "17:18:54",
    zone: "North East",
    actor: "Election security monitor",
    action: "Repeated failed MFA attempts isolated to one endpoint.",
    detail: "Traffic was rate-limited and the affected voter sessions were preserved for review.",
    tone: "warning",
  },
  {
    time: "17:07:16",
    zone: "Federation",
    actor: "Chairman command center",
    action: "Interim operations snapshot exported to observers.",
    detail: "The export contained turnout, accreditation, auth, and branch uptime metrics only.",
    tone: "neutral",
  },
];

const ALERTS: AlertItem[] = [
  {
    time: "17:18",
    title: "North East auth anomaly contained",
    detail: "MFA failure burst rate-limited after endpoint isolation; no ballot integrity issue detected.",
    tone: "warning",
  },
  {
    time: "16:52",
    title: "Help desk queue back within SLA",
    detail: "Pending voter recovery tickets dropped from 7 to 2 after Abuja and Lagos reassignment.",
    tone: "positive",
  },
  {
    time: "16:30",
    title: "Ledger replication heartbeat healthy",
    detail: "Cross-zone audit sync completed without drift across all monitored services.",
    tone: "neutral",
  },
];

const SECRETARY_ACTIVITY: ActivityEvent[] = [
  {
    time: "17:44:03",
    zone: "Federation",
    actor: "National secretariat desk",
    action: "Chairman briefing pack moved to final review.",
    detail: "Turnout snapshots, branch minutes, and unresolved incident notes were compiled into the 18:00 briefing set.",
    tone: "positive",
  },
  {
    time: "17:37:20",
    zone: "South West",
    actor: "Lagos collation desk",
    action: "Signed branch minutes uploaded for archive indexing.",
    detail: "Three branch returns were tagged, timestamped, and queued for observer-safe publication.",
    tone: "neutral",
  },
  {
    time: "17:30:11",
    zone: "North Central",
    actor: "Abuja returns coordinator",
    action: "Incident memo prepared for chairman escalation.",
    detail: "A polling-unit closure request was documented, but approval remains pending before any timetable change.",
    tone: "warning",
  },
  {
    time: "17:22:46",
    zone: "South South",
    actor: "Rivers branch secretary",
    action: "Collation discrepancy note resolved.",
    detail: "Missing accreditation remarks were attached and the branch ledger was returned to the green queue.",
    tone: "positive",
  },
  {
    time: "17:09:54",
    zone: "Federation",
    actor: "Secretary operations console",
    action: "Internal notice draft staged for chairman approval.",
    detail: "The draft contains turnout, queue status, and documented exceptions without system-control actions.",
    tone: "neutral",
  },
];

const SECRETARY_ALERTS: AlertItem[] = [
  {
    time: "17:31",
    title: "Approval pending on branch closure memo",
    detail: "Secretary can log and package the request, but timetable changes are blocked until chairman sign-off.",
    tone: "warning",
  },
  {
    time: "17:12",
    title: "Returns archive sync completed",
    detail: "Uploaded minutes from 14 branches were mirrored to the immutable records store without drift.",
    tone: "positive",
  },
  {
    time: "16:48",
    title: "Observer brief draft ready",
    detail: "A sanitized summary of turnout and branch status is staged for final executive review.",
    tone: "neutral",
  },
];

const CHAIRMAN_DASHBOARD: DashboardConfig = {
  shellLabel: "🗳️ ECNBA 2026 Elections – Admin Dashboard",
  heading: "Live election operations for the Chairman command center",
  description:
    "Monitor turnout, accreditation, zonal participation, authentication health, and immutable activity trails in a single secure command view.",
  roleLabel: "Chairman",
  summaryCards: [
    { title: "Eligible Voters", value: "87,432", detail: "Registered members eligible to vote today." },
    { title: "Ballots Cast", value: "54,891", detail: "Ballots received so far across the federation." },
    { title: "Turnout Rate", value: "62.8%", detail: "Current participation rate among registered voters." },
    { title: "Polls Close", value: "3h 24m", detail: "Time remaining until official voting closes." },
  ],
  operationsCards: [
    { title: "✅ Uptime", value: "99.97%", detail: "Election services remain available and monitored." },
    { title: "⚡ Avg Resp Time", value: "245ms", detail: "Current API response time across voting endpoints." },
    { title: "📊 Error Rate", value: "0.02%", detail: "Very low incident rate across the control plane." },
    { title: "🔥 CPU Usage", value: "34%", detail: "Application infrastructure operating within expected limits." },
  ],
  liveFeedLabel: "⚡ Live election activity stream",
  liveFeedHeading: "Operations feed mirrored to audit storage",
  liveFeedDescription:
    "Field operations, help desk movement, security events, and command actions in one stream.",
  liveFeedExportLabel: "Export Audit Log",
  liveActivity: LIVE_ACTIVITY,
  alertsTitle: "⚠️ Alerts & anomalies",
  alerts: ALERTS,
  actionsTitle: "Command actions",
  privilegeTitle: "Override scope",
  privilegeDetail:
    "The chairman can authorize timetable changes, publish observer-safe exports, and escalate operational controls directly from this workspace.",
  actions: [
    {
      id: "extend-voting",
      label: "Extend Voting",
      description: "Authorize a federation-wide extension when field conditions require extra voting time.",
      colorScheme: "teal",
    },
    {
      id: "dispatch-incident-response",
      label: "Dispatch Incident Response",
      description: "Mobilize field supervisors and technical staff to branches with active anomalies or queue spikes.",
      variant: "outline",
    },
    {
      id: "view-helpdesk-queue",
      label: "Refresh Help Desk Command View",
      description: "Inspect unresolved voter support cases and coordinate reassignment across branches.",
      variant: "outline",
    },
    {
      id: "freeze-suspicious-endpoint",
      label: "Freeze Suspicious Endpoint",
      description: "Isolate a flagged device path while preserving voter sessions and the forensic trail.",
      variant: "outline",
    },
    {
      id: "release-observer-report",
      label: "Release Observer Situation Report",
      description: "Publish a sanitized operational bulletin to oversight stakeholders from the command center.",
      variant: "outline",
    },
    {
      id: "trigger-federation-snapshot",
      label: "Trigger Federation Snapshot",
      description: "Seal an updated operations snapshot for audit storage and executive review.",
      variant: "outline",
    },
  ],
};

const SECRETARY_DASHBOARD: DashboardConfig = {
  shellLabel: "🗳️ ECNBA 2026 Elections – Secretary Dashboard",
  heading: "Election coordination workspace for the Secretary",
  description:
    "Track returns, prepare executive briefs, manage collation records, and coordinate internal communications without chairman-only override powers.",
  roleLabel: "Secretary",
  summaryCards: [
    { title: "Returns Logged", value: "92/96", detail: "Branch collation packets received and indexed in the secretariat queue." },
    { title: "Minutes Prepared", value: "34", detail: "Meeting and branch minutes compiled for executive review." },
    { title: "Pending Approvals", value: "3", detail: "Requests packaged for chairman decision before any system-wide change." },
    { title: "Polls Close", value: "3h 24m", detail: "Shared election clock for notices, briefs, and archive cutoffs." },
  ],
  operationsCards: [
    { title: "🗂️ Archive Sync", value: "14 branches", detail: "Latest signed minutes mirrored to the protected records store." },
    { title: "📝 Draft Briefs", value: "4", detail: "Chairman and observer summaries staged for final review." },
    { title: "📣 Notice Queue", value: "7", detail: "Internal updates waiting for scheduling or executive approval." },
    { title: "🤝 Desk Requests", value: "12", detail: "Branch coordination issues currently being tracked by the secretariat." },
  ],
  liveFeedLabel: "📝 Secretariat activity stream",
  liveFeedHeading: "Collation, minutes, and approvals in one feed",
  liveFeedDescription:
    "Track documented returns, internal notices, branch follow-ups, and items staged for chairman sign-off.",
  liveFeedExportLabel: "Export Minutes Register",
  liveActivity: SECRETARY_ACTIVITY,
  alertsTitle: "⚠️ Alerts & approvals",
  alerts: SECRETARY_ALERTS,
  actionsTitle: "Secretary actions",
  privilegeTitle: "Privilege boundary",
  privilegeDetail:
    "The secretary can prepare briefs, document incidents, and manage internal communications, but voting extensions and final public releases still require chairman approval.",
  actions: [
    {
      id: "prepare-chairman-brief",
      label: "Prepare Chairman Brief",
      description: "Assemble turnout summaries, unresolved issues, and branch notes into the next executive briefing pack.",
      colorScheme: "teal",
    },
    {
      id: "export-collation-minutes",
      label: "Export Collation Minutes",
      description: "Download the latest branch minutes and collation notes for records and executive circulation.",
      variant: "outline",
    },
    {
      id: "queue-public-notice",
      label: "Queue Public Notice for Approval",
      description: "Draft an internal or observer-safe notice and move it to the chairman approval lane.",
      variant: "outline",
    },
    {
      id: "extend-voting",
      label: "Extend Voting (Chairman only)",
      description: "Operational overrides remain visible for context, but cannot be executed from the secretary workspace.",
      variant: "ghost",
      disabled: true,
    },
  ],
};

function formatDashboardTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function createActionOutcome(
  role: "chairman" | "secretary",
  action: DashboardAction,
  timestamp: number,
): { notice: CommandNotice; event: ActivityEvent } {
  const time = formatDashboardTime(timestamp);
  const actor = role === "chairman" ? "Chairman command center" : "Secretary operations console";

  switch (action.id) {
    case "extend-voting":
      return {
        notice: {
          time,
          title: role === "chairman" ? "Voting extension authorized" : "Voting override restricted",
          detail:
            role === "chairman"
              ? "A 30-minute federation-wide extension was staged with branch alerts, audit tagging, and observer-facing notice updates."
              : "The secretary workspace can document an extension request, but final timetable overrides remain blocked until the chairman approves them.",
          tone: role === "chairman" ? "warning" : "warning",
        },
        event: {
          time,
          zone: "Federation",
          actor,
          action:
            role === "chairman"
              ? "Authorized a 30-minute voting extension."
              : "Prepared but could not execute a voting extension request.",
          detail:
            role === "chairman"
              ? "Branches received updated close-of-poll guidance and audit storage captured the override package."
              : "The request was logged for executive approval without changing the live poll timetable.",
          tone: "warning",
        },
      };
    case "dispatch-incident-response":
      return {
        notice: {
          time,
          title: "Incident response teams dispatched",
          detail: "Field supervisors in the North East and South South queues were reassigned to anomaly and congestion hotspots.",
          tone: "positive",
        },
        event: {
          time,
          zone: "Federation",
          actor,
          action: "Incident response teams dispatched to flagged branches.",
          detail: "Two technical supervisors and one queue support team were reassigned with chairman approval.",
          tone: "positive",
        },
      };
    case "view-helpdesk-queue":
      return {
        notice: {
          time,
          title: "Help desk queue mirrored to command view",
          detail: "Critical recovery tickets were re-sorted by SLA risk so chairman oversight reflects the latest support backlog.",
          tone: "neutral",
        },
        event: {
          time,
          zone: "Federation",
          actor,
          action: "Synchronized the live help desk queue.",
          detail: "Recovery tickets, escalations, and standby staffing allocations were refreshed in the chairman console.",
          tone: "neutral",
        },
      };
    case "freeze-suspicious-endpoint":
      return {
        notice: {
          time,
          title: "Suspicious endpoint frozen",
          detail: "Traffic to the flagged endpoint was isolated while voter sessions and evidence trails were preserved for review.",
          tone: "warning",
        },
        event: {
          time,
          zone: "North East",
          actor,
          action: "Flagged endpoint isolated from the live voting path.",
          detail: "Containment controls were activated without invalidating legitimate voter sessions.",
          tone: "warning",
        },
      };
    case "release-observer-report":
      return {
        notice: {
          time,
          title: role === "chairman" ? "Observer situation report released" : "Observer notice staged for approval",
          detail:
            role === "chairman"
              ? "A sanitized turnout, uptime, and incident summary was published to oversight stakeholders."
              : "The draft observer notice was packaged for executive sign-off and held outside the public release channel.",
          tone: "positive",
        },
        event: {
          time,
          zone: "Federation",
          actor,
          action:
            role === "chairman"
              ? "Released an observer-safe situation report."
              : "Queued an observer-safe notice for chairman approval.",
          detail:
            role === "chairman"
              ? "The bulletin excluded privileged controls and member-identifying data."
              : "The publication package contains only sanitized branch and turnout data.",
          tone: "positive",
        },
      };
    case "trigger-federation-snapshot":
      return {
        notice: {
          time,
          title: "Federation snapshot sealed",
          detail: "A fresh operations snapshot was committed to audit storage for executive replay and post-election verification.",
          tone: "neutral",
        },
        event: {
          time,
          zone: "Federation",
          actor,
          action: "Triggered a federation-wide operations snapshot.",
          detail: "Turnout, auth, branch status, and anomaly markers were sealed into the latest audit bundle.",
          tone: "neutral",
        },
      };
    case "prepare-chairman-brief":
      return {
        notice: {
          time,
          title: "Chairman brief assembled",
          detail: "The next executive pack now includes updated turnout, unresolved incidents, and branch coordination notes.",
          tone: "positive",
        },
        event: {
          time,
          zone: "Federation",
          actor,
          action: "Prepared the next chairman operations brief.",
          detail: "The brief merged collated minutes, queue summaries, and pending approvals.",
          tone: "positive",
        },
      };
    case "export-collation-minutes":
      return {
        notice: {
          time,
          title: "Collation minutes exported",
          detail: "Signed branch minutes and collation notes were packaged for executive circulation and records custody.",
          tone: "neutral",
        },
        event: {
          time,
          zone: "Federation",
          actor,
          action: "Exported the latest collation minutes register.",
          detail: "The package includes branch notes, timestamps, and approval markers only.",
          tone: "neutral",
        },
      };
    case "queue-public-notice":
      return {
        notice: {
          time,
          title: "Public notice queued for approval",
          detail: "The draft communication is ready for chairman sign-off and remains outside public channels until approved.",
          tone: "neutral",
        },
        event: {
          time,
          zone: "Federation",
          actor,
          action: "Queued an internal or observer notice for approval.",
          detail: "The draft captured turnout, queue posture, and approved branch messaging.",
          tone: "neutral",
        },
      };
    default:
      return {
        notice: {
          time,
          title: `${action.label} acknowledged`,
          detail: action.description,
          tone: "neutral",
        },
        event: {
          time,
          zone: "Federation",
          actor,
          action: `${action.label} executed.`,
          detail: action.description,
          tone: "neutral",
        },
      };
  }
}

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

function LegendItem({ color, ring, label }: { color: string; ring: string; label: string }) {
  return (
    <HStack gap="2">
      <Box h="10px" w="10px" rounded="full" bg={color} boxShadow={`0 0 0 6px ${ring}`} />
      <Text fontSize="xs" letterSpacing="0.12em" textTransform="uppercase" color="var(--text-dim)">
        {label}
      </Text>
    </HStack>
  );
}

function buildChartGeometry(
  values: number[],
  width: number,
  height: number,
  minValue: number,
  maxValue: number,
) {
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

function toneStyles(tone: ActivityEvent["tone"] | AlertItem["tone"]) {
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

function TurnoutTimelinePanel({ lastUpdatedAgo }: { lastUpdatedAgo: number }) {
  const width = 620;
  const height = 220;
  const geometry = buildChartGeometry(
    TURNOUT_SERIES.map((point) => point.turnout),
    width,
    height,
    0,
    80,
  );
  const currentPoint = geometry.points[geometry.points.length - 1];

  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
      <Flex justify="space-between" align="center" mb="5" gap="4" wrap="wrap">
        <Stack gap="1">
          <Text fontSize="sm" fontWeight="700" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)">
            📈 Turnout over time
          </Text>
          <Heading fontFamily='"Sora", sans-serif' size="lg" color="var(--text-main)">
            Federation turnout curve
          </Heading>
          <Text color="var(--text-soft)" fontSize="sm">
            Live participation trend from first accreditation through the current close-of-day run rate.
          </Text>
        </Stack>
        <HStack gap="3" color="var(--text-soft)">
          <Clock3 size={16} />
          <Text fontSize="xs">Auto-refreshing every 2 seconds • updated {lastUpdatedAgo}s ago</Text>
        </HStack>
      </Flex>

      <Box rounded="24px" bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.06)" p="4">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="220" role="img" aria-label="Turnout over time">
          <defs>
            <linearGradient id="turnout-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(31, 184, 157, 0.34)" />
              <stop offset="100%" stopColor="rgba(31, 184, 157, 0.04)" />
            </linearGradient>
          </defs>

          {[20, 40, 60, 80].map((tick) => {
            const y = height - geometry.padY - (tick / 80) * (height - geometry.padY * 2);
            return (
              <g key={tick}>
                <line x1={geometry.padX} y1={y} x2={width - geometry.padX} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" />
                <text x="0" y={y + 4} fill="rgba(201, 214, 223, 0.56)" fontSize="11">
                  {tick}%
                </text>
              </g>
            );
          })}

          <path d={geometry.area} fill="url(#turnout-fill)" />
          <polyline fill="none" stroke="rgba(31, 184, 157, 0.95)" strokeWidth="4" points={geometry.line} />

          {geometry.points.map((point, index) => (
            <g key={TURNOUT_SERIES[index].time}>
              <circle cx={point.x} cy={point.y} r="6" fill="#1fb89d" stroke="#041018" strokeWidth="3" />
              <text x={point.x} y={height - 2} fill="rgba(230, 238, 243, 0.74)" fontSize="12" textAnchor="middle">
                {TURNOUT_SERIES[index].time}
              </text>
            </g>
          ))}

          <g>
            <circle cx={currentPoint.x} cy={currentPoint.y} r="10" fill="rgba(31, 184, 157, 0.18)" />
            <circle cx={currentPoint.x} cy={currentPoint.y} r="6" fill="#1fb89d" stroke="#041018" strokeWidth="3" />
            <text x={currentPoint.x - 6} y={currentPoint.y - 18} fill="#9ae7d8" fontSize="13" fontWeight="700" textAnchor="end">
              62.8%
            </text>
          </g>
        </svg>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap="3" mt="4">
        <Box rounded="20px" border="1px solid rgba(255,255,255,0.08)" bg="rgba(255,255,255,0.02)" px="4" py="4">
          <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
            Current run rate
          </Text>
          <Text mt="2" fontFamily='"Sora", sans-serif' fontSize="2xl" fontWeight="700" color="var(--text-main)">
            4,150 / hr
          </Text>
          <Text color="var(--text-soft)" fontSize="sm">
            Ballots cast during the latest hour window.
          </Text>
        </Box>
        <Box rounded="20px" border="1px solid rgba(255,255,255,0.08)" bg="rgba(255,255,255,0.02)" px="4" py="4">
          <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
            Peak acceleration
          </Text>
          <Text mt="2" fontFamily='"Sora", sans-serif' fontSize="2xl" fontWeight="700" color="var(--text-main)">
            12:00 - 14:00
          </Text>
          <Text color="var(--text-soft)" fontSize="sm">
            Highest turnout climb as midday queues converted to completed ballots.
          </Text>
        </Box>
        <Box rounded="20px" border="1px solid rgba(255,255,255,0.08)" bg="rgba(255,255,255,0.02)" px="4" py="4">
          <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
            Latest checkpoint
          </Text>
          <Text mt="2" fontFamily='"Sora", sans-serif' fontSize="2xl" fontWeight="700" color="var(--text-main)">
            {TURNOUT_SERIES[TURNOUT_SERIES.length - 1].ballots}
          </Text>
          <Text color="var(--text-soft)" fontSize="sm">
            Certified ballots included in the live operational count.
          </Text>
        </Box>
      </SimpleGrid>
    </Box>
  );
}

function RegionalParticipationPanel() {
  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
      <Flex justify="space-between" align="start" gap="4" wrap="wrap">
        <Stack gap="1">
          <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
            🗺️ Regional participation map
          </Text>
          <Heading fontFamily='"Sora", sans-serif' size="md" color="var(--text-main)">
            Zonal command heat map
          </Heading>
        </Stack>
        <HStack gap="2" color="var(--text-soft)">
          <MapPin size={16} />
          <Text fontSize="xs">Hotter tiles indicate stronger verified participation</Text>
        </HStack>
      </Flex>

      <Grid templateColumns="repeat(3, minmax(0, 1fr))" templateRows="repeat(2, minmax(120px, 1fr))" gap="3" mt="5">
        {ZONE_MAP.map((zone) => (
          <Box
            key={zone.code}
            gridColumn={zone.gridColumn}
            gridRow={zone.gridRow}
            rounded="24px"
            border="1px solid rgba(255,255,255,0.08)"
            bg={`linear-gradient(180deg, rgba(31, 184, 157, ${0.08 + zone.turnout / 220}), rgba(7, 16, 26, 0.96))`}
            p="4"
            position="relative"
            overflow="hidden"
          >
            <Box position="absolute" inset="0" bg="radial-gradient(circle at top right, rgba(255,255,255,0.12), transparent 45%)" opacity="0.8" />
            <Stack position="relative" gap="3" h="full" justify="space-between">
              <Flex justify="space-between" align="start" gap="3">
                <Box>
                  <Text fontSize="xs" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)">
                    {zone.code}
                  </Text>
                  <Text mt="1" color="var(--text-main)" fontWeight="700">
                    {zone.zone}
                  </Text>
                </Box>
                <Text fontFamily='"Sora", sans-serif' fontSize="2xl" fontWeight="700" color="var(--text-main)">
                  {zone.turnout}%
                </Text>
              </Flex>

              <Box>
                <Text color="var(--text-soft)" fontSize="sm">
                  {zone.anchor}
                </Text>
                <Text mt="3" color="var(--text-main)" fontSize="sm" fontWeight="700">
                  {zone.accredited} accredited
                </Text>
                <Text color="var(--text-soft)" fontSize="sm">
                  {zone.cast} ballots committed
                </Text>
              </Box>
            </Stack>
          </Box>
        ))}
      </Grid>
    </Box>
  );
}

function AccreditationVsVotesPanel() {
  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
      <Flex align="center" justify="space-between" mb="5" wrap="wrap" gap="4">
        <Stack gap="1">
          <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
            🪪 Accreditation vs votes cast
          </Text>
          <Heading fontFamily='"Sora", sans-serif' size="lg" color="var(--text-main)">
            Reconciliation lanes
          </Heading>
          <Text color="var(--text-soft)" fontSize="sm">
            Compare members cleared to vote against ballots already deposited to spot queue lag or casting friction.
          </Text>
        </Stack>
        <HStack gap="4" wrap="wrap">
          <LegendItem color="var(--gold-400)" ring="rgba(240, 177, 75, 0.14)" label="Accredited" />
          <LegendItem color="var(--brand-500)" ring="rgba(31, 184, 157, 0.14)" label="Votes Cast" />
        </HStack>
      </Flex>

      <Stack gap="4">
        {RECONCILIATION_SERIES.map((entry) => {
          const gap = Math.max(entry.accredited - entry.cast, 0);

          return (
            <Box
              key={entry.checkpoint}
              rounded="24px"
              border="1px solid rgba(255,255,255,0.08)"
              bg="rgba(255,255,255,0.02)"
              px="4"
              py="4"
            >
              <Flex justify="space-between" align="start" gap="4" wrap="wrap">
                <Box>
                  <Text color="var(--text-main)" fontWeight="700">
                    {entry.checkpoint}
                  </Text>
                  <Text color="var(--text-soft)" fontSize="sm">
                    {entry.accreditedCount} • {entry.castCount}
                  </Text>
                </Box>
                <Text color={gap > 8 ? "var(--gold-400)" : "var(--brand-200)"} fontSize="sm" fontWeight="700">
                  {gap.toFixed(1)} point queue gap
                </Text>
              </Flex>

              <Box position="relative" h="36px" mt="4">
                <Box position="absolute" top="50%" left="0" right="0" h="2px" bg="rgba(255,255,255,0.1)" transform="translateY(-50%)" />
                <Box
                  position="absolute"
                  top="50%"
                  left={`${entry.cast}%`}
                  w={`${gap}%`}
                  h="8px"
                  bg="rgba(240, 177, 75, 0.22)"
                  rounded="full"
                  transform="translateY(-50%)"
                />
                <Box
                  position="absolute"
                  top="50%"
                  left={`calc(${entry.cast}% - 9px)`}
                  h="18px"
                  w="18px"
                  rounded="full"
                  bg="var(--brand-500)"
                  border="3px solid #041018"
                  transform="translateY(-50%)"
                />
                <Box
                  position="absolute"
                  top="50%"
                  left={`calc(${entry.accredited}% - 9px)`}
                  h="18px"
                  w="18px"
                  rounded="full"
                  bg="var(--gold-400)"
                  border="3px solid #041018"
                  transform="translateY(-50%)"
                />
              </Box>

              <Flex justify="space-between" gap="4" mt="2" wrap="wrap">
                <Text color="var(--brand-200)" fontSize="sm">
                  Cast: {entry.cast}%
                </Text>
                <Text color="#f7ce83" fontSize="sm">
                  Accredited: {entry.accredited}%
                </Text>
              </Flex>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

function AuthenticationTrendPanel() {
  const width = 380;
  const height = 180;
  const geometry = buildChartGeometry(
    AUTH_SERIES.map((point) => point.success),
    width,
    height,
    97.5,
    99.5,
  );

  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
      <Stack gap="1">
        <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
          🔐 Authentication success trends
        </Text>
        <Heading fontFamily='"Sora", sans-serif' size="md" color="var(--text-main)">
          MFA health across the election stack
        </Heading>
        <Text color="var(--text-soft)" fontSize="sm">
          Track successful second-factor completion alongside recovery usage and failed attempts.
        </Text>
      </Stack>

      <Box rounded="24px" bg="rgba(255,255,255,0.02)" border="1px solid rgba(255,255,255,0.06)" p="4" mt="5">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="180" role="img" aria-label="Authentication success trends">
          <defs>
            <linearGradient id="auth-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(31, 184, 157, 0.24)" />
              <stop offset="100%" stopColor="rgba(31, 184, 157, 0.02)" />
            </linearGradient>
          </defs>

          {[97.5, 98, 98.5, 99, 99.5].map((tick) => {
            const normalized = (tick - 97.5) / 2;
            const y = height - geometry.padY - normalized * (height - geometry.padY * 2);

            return (
              <g key={tick}>
                <line x1={geometry.padX} y1={y} x2={width - geometry.padX} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" />
                <text x="0" y={y + 4} fill="rgba(201, 214, 223, 0.56)" fontSize="11">
                  {tick.toFixed(1)}%
                </text>
              </g>
            );
          })}

          <path d={geometry.area} fill="url(#auth-fill)" />
          <polyline fill="none" stroke="rgba(31, 184, 157, 0.95)" strokeWidth="4" points={geometry.line} />

          {geometry.points.map((point, index) => (
            <g key={AUTH_SERIES[index].time}>
              <circle cx={point.x} cy={point.y} r="5" fill="#1fb89d" stroke="#041018" strokeWidth="3" />
              <text x={point.x} y={height - 2} fill="rgba(230, 238, 243, 0.74)" fontSize="12" textAnchor="middle">
                {AUTH_SERIES[index].time}
              </text>
            </g>
          ))}
        </svg>
      </Box>

      <SimpleGrid columns={{ base: 1, sm: 3 }} gap="3" mt="4">
        <Box rounded="20px" border="1px solid rgba(255,255,255,0.08)" bg="rgba(255,255,255,0.02)" px="4" py="4">
          <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
            Current success
          </Text>
          <Text mt="2" fontFamily='"Sora", sans-serif' fontSize="2xl" fontWeight="700" color="var(--text-main)">
            98.8%
          </Text>
          <Text color="var(--text-soft)" fontSize="sm">
            Verified sign-ins completing MFA on the first or second attempt.
          </Text>
        </Box>
        <Box rounded="20px" border="1px solid rgba(255,255,255,0.08)" bg="rgba(255,255,255,0.02)" px="4" py="4">
          <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
            Recovery code usage
          </Text>
          <Text mt="2" fontFamily='"Sora", sans-serif' fontSize="2xl" fontWeight="700" color="var(--text-main)">
            0.9%
          </Text>
          <Text color="var(--text-soft)" fontSize="sm">
            Secure fallback volume staying below the election-day watch threshold.
          </Text>
        </Box>
        <Box rounded="20px" border="1px solid rgba(255,255,255,0.08)" bg="rgba(255,255,255,0.02)" px="4" py="4">
          <Text fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="var(--text-dim)">
            Failed attempts
          </Text>
          <Text mt="2" fontFamily='"Sora", sans-serif' fontSize="2xl" fontWeight="700" color="var(--text-main)">
            11
          </Text>
          <Text color="var(--text-soft)" fontSize="sm">
            Current hour failures with three enforced temporary lockouts.
          </Text>
        </Box>
      </SimpleGrid>
    </Box>
  );
}

function LiveActivityPanel({
  onRefresh,
  label,
  heading,
  description,
  exportLabel,
  events,
}: {
  onRefresh: () => void;
  label: string;
  heading: string;
  description: string;
  exportLabel: string;
  events: ActivityEvent[];
}) {
  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
      <Flex justify="space-between" align="center" wrap="wrap" gap="4" mb="5">
        <Stack gap="1">
          <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
            {label}
          </Text>
          <Heading fontFamily='"Sora", sans-serif' size="lg" color="var(--text-main)">
            {heading}
          </Heading>
          <Text color="var(--text-soft)" fontSize="sm">
            {description}
          </Text>
        </Stack>
        <HStack gap="3" wrap="wrap">
          <Button variant="outline" fontWeight="700" rounded="20px">
            {exportLabel}
          </Button>
          <Button onClick={onRefresh} fontWeight="700" rounded="20px">
            <HStack gap="2">
              <RefreshCw size={16} />
              <Text>Refresh feed</Text>
            </HStack>
          </Button>
        </HStack>
      </Flex>

      <Stack gap="3">
        {events.map((event) => {
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
                      {event.zone}
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

function OperationsDashboard({
  session,
  onCloseSession,
  role,
}: {
  session: AuthSession;
  onCloseSession: () => void;
  role: "chairman" | "secretary";
}) {
  const [clockNow, setClockNow] = useState(Date.now());
  const [lastRefreshAt, setLastRefreshAt] = useState(Date.now());
  const [commandNotice, setCommandNotice] = useState<CommandNotice | null>(null);
  const [commandFeed, setCommandFeed] = useState<ActivityEvent[]>([]);
  const dashboard = role === "secretary" ? SECRETARY_DASHBOARD : CHAIRMAN_DASHBOARD;
  const liveFeedEvents = [...commandFeed, ...dashboard.liveActivity].slice(0, 7);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const lastUpdated = new Date(lastRefreshAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const lastUpdatedAgo = Math.max(0, Math.floor((clockNow - lastRefreshAt) / 1000));

  function handleRefresh() {
    setClockNow(Date.now());
    setLastRefreshAt(Date.now());
  }

  function handleDashboardAction(action: DashboardAction) {
    if (action.disabled) {
      return;
    }

    const timestamp = Date.now();
    const outcome = createActionOutcome(role, action, timestamp);

    setCommandNotice(outcome.notice);
    setCommandFeed((current) => [outcome.event, ...current].slice(0, 4));
    setClockNow(timestamp);
    setLastRefreshAt(timestamp);
  }

  return (
    <Box minH="100vh" bg="var(--page-bg)" px={{ base: "5", md: "8", xl: "10" }} py={{ base: "6", md: "8", xl: "10" }}>
      <Stack gap="8">
        <Flex direction={{ base: "column", md: "row" }} align="start" justify="space-between" gap="6">
          <Stack gap="3" maxW={{ base: "100%", md: "65%" }}>
            <Text fontSize="sm" letterSpacing="0.24em" textTransform="uppercase" color="var(--brand-200)" fontWeight="700">
              {dashboard.shellLabel}
            </Text>
            <Heading fontFamily='"Sora", sans-serif' fontSize={{ base: "3xl", md: "4xl" }} lineHeight="1.05" color="var(--text-main)">
              {dashboard.heading}
            </Heading>
            <Text color="var(--text-soft)" maxW="3xl" fontSize="md">
              {dashboard.description}
            </Text>
          </Stack>

          <Stack gap="3" align="end" minW="220px">
            <HStack gap="3" align="center" bg="rgba(255,255,255,0.05)" border="1px solid var(--line-soft)" rounded="24px" px="4" py="3">
              <ShieldCheck color="#1fb89d" />
              <Text fontWeight="700">Role: {dashboard.roleLabel}</Text>
            </HStack>
            <Box bg="rgba(255,255,255,0.04)" border="1px solid var(--line-soft)" rounded="24px" px="4" py="3">
              <Text fontSize="xs" color="var(--text-dim)">Signed in as</Text>
              <Text mt="1" fontWeight="700" color="var(--text-main)">
                {session.displayName}
              </Text>
              <Text fontSize="sm" color="var(--text-soft)">
                {session.branch}
              </Text>
            </Box>
            <Box bg="rgba(255,255,255,0.04)" border="1px solid var(--line-soft)" rounded="24px" px="4" py="3">
              <Text fontSize="xs" color="var(--text-dim)">Last refreshed</Text>
              <Text mt="1" fontWeight="700" color="var(--text-main)">
                {lastUpdated}
              </Text>
            </Box>
          </Stack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="4">
          {dashboard.summaryCards.map((card) => (
            <SummaryCard key={card.title} title={card.title} value={card.value} detail={card.detail} />
          ))}
        </SimpleGrid>

        <Grid templateColumns={{ base: "1fr", xl: "0.64fr 0.36fr" }} gap="4">
          <TurnoutTimelinePanel lastUpdatedAgo={lastUpdatedAgo} />
          <RegionalParticipationPanel />
        </Grid>

        <Grid templateColumns={{ base: "1fr", xl: "0.58fr 0.42fr" }} gap="4">
          <AccreditationVsVotesPanel />
          <AuthenticationTrendPanel />
        </Grid>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="4">
          {dashboard.operationsCards.map((card) => (
            <SummaryCard key={card.title} title={card.title} value={card.value} detail={card.detail} />
          ))}
        </SimpleGrid>

        <Grid templateColumns={{ base: "1fr", xl: "0.62fr 0.38fr" }} gap="4">
          <LiveActivityPanel
            onRefresh={handleRefresh}
            label={dashboard.liveFeedLabel}
            heading={dashboard.liveFeedHeading}
            description={dashboard.liveFeedDescription}
            exportLabel={dashboard.liveFeedExportLabel}
            events={liveFeedEvents}
          />

          <Stack gap="4">
            <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
              <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
                {dashboard.alertsTitle}
              </Text>
              <Stack gap="3" mt="5">
                {dashboard.alerts.map((alert) => {
                  const palette = toneStyles(alert.tone);

                  return (
                    <Box
                      key={`${alert.time}-${alert.title}`}
                      rounded="22px"
                      border="1px solid"
                      borderColor={palette.border}
                      bg={palette.bg}
                      px="4"
                      py="4"
                    >
                      <Flex justify="space-between" align="start" gap="4">
                        <Stack gap="1">
                          <Text color="var(--text-main)" fontWeight="700">
                            {alert.title}
                          </Text>
                          <Text color="var(--text-soft)" fontSize="sm">
                            {alert.detail}
                          </Text>
                        </Stack>
                        <Text fontSize="xs" letterSpacing="0.16em" textTransform="uppercase" color={palette.labelColor} fontWeight="700">
                          {alert.time}
                        </Text>
                      </Flex>
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            <Box bg="rgba(255,255,255,0.03)" border="1px solid var(--line-soft)" rounded="28px" p="6">
              <Text fontSize="sm" letterSpacing="0.18em" textTransform="uppercase" color="var(--text-dim)" fontWeight="700">
                {dashboard.actionsTitle}
              </Text>
              <Stack gap="4" mt="5">
                {commandNotice ? (
                  <Box
                    rounded="22px"
                    border="1px solid"
                    borderColor={toneStyles(commandNotice.tone).border}
                    bg={toneStyles(commandNotice.tone).bg}
                    px="4"
                    py="4"
                  >
                    <Flex justify="space-between" align="start" gap="4" wrap="wrap">
                      <Stack gap="1">
                        <Text color="var(--text-main)" fontWeight="700">
                          {commandNotice.title}
                        </Text>
                        <Text color="var(--text-soft)" fontSize="sm">
                          {commandNotice.detail}
                        </Text>
                      </Stack>
                      <Text
                        fontSize="xs"
                        letterSpacing="0.16em"
                        textTransform="uppercase"
                        color={toneStyles(commandNotice.tone).labelColor}
                        fontWeight="700"
                      >
                        {commandNotice.time}
                      </Text>
                    </Flex>
                  </Box>
                ) : null}
                <Box rounded="22px" border="1px solid rgba(255,255,255,0.08)" bg="rgba(255,255,255,0.02)" px="4" py="4">
                  <Text color="var(--text-main)" fontWeight="700">
                    {dashboard.privilegeTitle}
                  </Text>
                  <Text color="var(--text-soft)" fontSize="sm" mt="2">
                    {dashboard.privilegeDetail}
                  </Text>
                </Box>
                {dashboard.actions.map((action) => (
                  <Stack key={action.label} gap="2">
                    <Button
                      colorScheme={action.colorScheme}
                      variant={action.variant}
                      rounded="22px"
                      fontWeight="700"
                      disabled={action.disabled}
                      onClick={() => handleDashboardAction(action)}
                    >
                      {action.label}
                    </Button>
                    <Text color="var(--text-soft)" fontSize="sm">
                      {action.description}
                    </Text>
                  </Stack>
                ))}
                <Button onClick={onCloseSession} variant="ghost" rounded="22px" fontWeight="700" color="var(--text-main)">
                  Exit Dashboard
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Grid>
      </Stack>
    </Box>
  );
}

export function AdminDashboard({
  session,
  onCloseSession,
}: {
  session: AuthSession;
  onCloseSession: () => void;
}) {
  return <OperationsDashboard session={session} onCloseSession={onCloseSession} role="chairman" />;
}

export function SecretaryDashboard({
  session,
  onCloseSession,
}: {
  session: AuthSession;
  onCloseSession: () => void;
}) {
  return <OperationsDashboard session={session} onCloseSession={onCloseSession} role="secretary" />;
}
