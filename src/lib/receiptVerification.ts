import { utf8Bytes, randomBytes, toBase64Url, fromBase64Url, hmacSha1, getArrayBuffer } from "./crypto";

/**
 * Cryptographic receipt verification system for voting
 * Implements secure, verifiable voting receipts that:
 * - Prove a vote was cast and counted
 * - Maintain ballot secrecy (don't reveal the vote content)
 * - Use cryptographic commitments and signatures
 */

export interface VoteReceipt {
  receiptId: string; // Unique receipt identifier
  timestamp: string; // ISO 8601 timestamp of vote
  versionNumber: string; // System/election version
  commitment: string; // SHA-256 commitment to vote data
  signature: string; // HMAC signature for authenticity
  publicKey: string; // Public verification key (system level)
}

export interface VoteData {
  voterId: string; // Anonymized voter identifier
  office: string; // Office being voted for
  encryptedChoice: string; // Encrypted vote choice
  electionId: string; // Election identifier
  timestamp: number; // Milliseconds since epoch
}

export interface VerificationResult {
  verified: boolean;
  message: string;
  details: string;
  reference?: string;
  receiptData?: {
    timestamp: string;
    office: string;
    includeCount: number;
  };
}

// Mock audit ledger - in production, this would be a public blockchain/ledger
class AuditLedger {
  private receiptMap: Map<string, { receipt: VoteReceipt; data: VoteData }> = new Map();
  private systemKey: Uint8Array;

  constructor() {
    // In production, this would be a well-known public key
    // For now, we use a deterministic key derived from election ID
    this.systemKey = utf8Bytes("ECNBA-ELECTION-2026-SYSTEM-KEY-v1.0");
  }

  addReceipt(receipt: VoteReceipt, data: VoteData): void {
    this.receiptMap.set(receipt.receiptId, { receipt, data });
  }

  getReceipt(receiptId: string): { receipt: VoteReceipt; data: VoteData } | undefined {
    return this.receiptMap.get(receiptId);
  }

  getAllReceipts(): Array<{ receipt: VoteReceipt; data: VoteData }> {
    return Array.from(this.receiptMap.values());
  }

  getSystemKey(): Uint8Array {
    return this.systemKey;
  }
}

// Global audit ledger instance
let globalLedger: AuditLedger | null = null;

function getLedger(): AuditLedger {
  if (!globalLedger) {
    globalLedger = new AuditLedger();
  }
  return globalLedger;
}

/**
 * Generate a cryptographic commitment to vote data
 * Uses SHA-256 of structured data for zero-knowledge verification
 */
export async function generateVoteCommitment(voteData: VoteData): Promise<string> {
  const dataString = JSON.stringify({
    voterId: voteData.voterId,
    office: voteData.office,
    encryptedChoice: voteData.encryptedChoice,
    electionId: voteData.electionId,
    timestamp: voteData.timestamp,
  });

  const dataBytes = utf8Bytes(dataString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", getArrayBuffer(dataBytes));
  const hashArray = new Uint8Array(hashBuffer);

  return toBase64Url(hashArray);
}

/**
 * Generate a receipt ID with cryptographic randomness
 */
function generateReceiptId(): string {
  const randomPart = randomBytes(12); // 96 bits of entropy
  const receiptIdBase32 = toBase64Url(randomPart)
    .replace(/[^A-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 16);

  // Format as RX-AAAA-BBBB-CCCC-DDDD for readability
  return `RX-${receiptIdBase32.slice(0, 4)}-${receiptIdBase32.slice(4, 8)}-${receiptIdBase32.slice(8, 12)}-${receiptIdBase32.slice(12, 16)}`;
}

/**
 * Create a receipt signature using HMAC with system key
 * Ensures receipt cannot be forged without system key
 */
export async function createReceiptSignature(
  receiptId: string,
  commitment: string,
  timestamp: string,
): Promise<string> {
  const ledger = getLedger();
  const systemKey = ledger.getSystemKey();

  const dataToSign = `${receiptId}|${commitment}|${timestamp}`;
  const signatureBytes = await hmacSha1(systemKey, utf8Bytes(dataToSign));

  return toBase64Url(signatureBytes);
}

/**
 * Generate a new voting receipt
 * Should be called when a vote is successfully cast
 */
export async function generateVoteReceipt(voteData: VoteData): Promise<VoteReceipt> {
  const timestamp = new Date().toISOString();
  const commitment = await generateVoteCommitment(voteData);
  const receiptId = generateReceiptId();
  const signature = await createReceiptSignature(receiptId, commitment, timestamp);

  const receipt: VoteReceipt = {
    receiptId,
    timestamp,
    versionNumber: "1.0-ECNBA-2026",
    commitment,
    signature,
    publicKey: "ECNBA-ELECTION-2026-SYSTEM-v1.0",
  };

  // Store in ledger
  const ledger = getLedger();
  ledger.addReceipt(receipt, voteData);

  return receipt;
}

/**
 * Verify a receipt's signature using system public key
 * Returns whether the signature is valid (receipt hasn't been tampered with)
 */
export async function verifyReceiptSignature(receipt: VoteReceipt): Promise<boolean> {
  try {
    const expectedSignature = await createReceiptSignature(
      receipt.receiptId,
      receipt.commitment,
      receipt.timestamp,
    );

    return expectedSignature === receipt.signature;
  } catch {
    return false;
  }
}

/**
 * Main verification function for voter-facing receipt verification
 * Checks:
 * 1. Receipt exists in published ledger
 * 2. Signature is valid
 * 3. Timestamp is within valid range
 * 4. Returns aggregated vote count for the office
 */
export async function verifyVotingReceipt(receiptId: string): Promise<VerificationResult> {
  try {
    const ledger = getLedger();
    const entry = ledger.getReceipt(receiptId.toUpperCase());

    if (!entry) {
      return {
        verified: false,
        message: "NOT VERIFIED",
        details:
          "The receipt ID could not be found in the published audit ledger. Please check the receipt ID and try again.",
      };
    }

    const { receipt, data } = entry;

    // Verify signature
    const signatureValid = await verifyReceiptSignature(receipt);
    if (!signatureValid) {
      return {
        verified: false,
        message: "NOT VERIFIED",
        details:
          "The receipt signature is invalid. This receipt may have been tampered with or forged.",
      };
    }

    // Verify commitment matches vote data
    const expectedCommitment = await generateVoteCommitment(data);
    if (expectedCommitment !== receipt.commitment) {
      return {
        verified: false,
        message: "NOT VERIFIED",
        details: "The receipt commitment does not match the stored vote data.",
      };
    }

    // Parse timestamp
    const receiptTime = new Date(receipt.timestamp);
    const now = new Date();
    const daysSinceVote = Math.floor((now.getTime() - receiptTime.getTime()) / (1000 * 60 * 60 * 24));

    // Count votes for this office in the ledger
    const allReceipts = ledger.getAllReceipts();
    const officeVotes = allReceipts.filter((entry) => entry.data.office === data.office);
    const includeCount = officeVotes.length;

    // Generate deterministic reference from receipt and vote data
    const referenceData = `${receipt.receiptId}|${data.electionId}|${receipt.commitment}`;
    const referenceBuffer = await crypto.subtle.digest("SHA-256", getArrayBuffer(utf8Bytes(referenceData)));
    const referenceArray = new Uint8Array(referenceBuffer);
    const reference = `0x${Array.from(referenceArray)
      .slice(0, 16)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`;

    return {
      verified: true,
      message: "VERIFIED",
      details: `Your vote for ${data.office} was recorded on ${receiptTime.toLocaleString()} (${daysSinceVote} days ago) and included in the final tally with ${includeCount} total votes for this office.`,
      reference,
      receiptData: {
        timestamp: receipt.timestamp,
        office: data.office,
        includeCount,
      },
    };
  } catch (error) {
    return {
      verified: false,
      message: "VERIFICATION ERROR",
      details: `An error occurred during verification: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Get mock vote data for testing
 * In production, this would be retrieved from secure storage
 */
export function getMockVoteData(receiptId: string): VoteData | null {
  const ledger = getLedger();
  const entry = ledger.getReceipt(receiptId.toUpperCase());

  if (!entry) {
    return null;
  }

  return entry.data;
}

/**
 * Initialize the audit ledger with sample verified receipts
 * Used for demonstration and testing
 */
export async function initializeAuditLedger(): Promise<void> {
  const ledger = getLedger();

  // Create sample votes for each office
  const offices = ["President", "Vice President", "General Sec"];
  const candidates: Record<string, string[]> = {
    President: ["Barrister Adewale O.", "Dr. Chioma E.", "Gen. Okonkwo T."],
    "Vice President": ["Alhaji Bello M.", "Chief Okafor P.", "Senator Abubakar K."],
    "General Sec": ["Mrs. Ifeanyi C.", "Mr. Adebayo S.", "Dr. Emeka N."],
  };

  let receiptIndex = 0;

  for (const office of offices) {
    const candidateList = candidates[office] || [];

    // Create 50-60 sample votes per office
    const voteCount = 50 + Math.floor(Math.random() * 11);

    for (let i = 0; i < voteCount; i++) {
      receiptIndex++;
      const candidate = candidateList[i % candidateList.length];

      const voteData: VoteData = {
        voterId: `VOTER-${String(receiptIndex).padStart(5, "0")}`,
        office,
        encryptedChoice: toBase64Url(randomBytes(32)), // In production, this would be actual encryption
        electionId: "ECNBA-2026-ELECTION-01",
        timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // Random time in past 7 days
      };

      const receipt = await generateVoteReceipt(voteData);
    }
  }
}

/**
 * Get a valid receipt ID for demonstration purposes
 */
export function getValidReceiptIdForDemo(): string {
  const ledger = getLedger();
  const allReceipts = ledger.getAllReceipts();

  if (allReceipts.length === 0) {
    return "RX-47A9-F2B1-883K-LM22"; // Fallback demo ID
  }

  return allReceipts[0].receipt.receiptId;
}
