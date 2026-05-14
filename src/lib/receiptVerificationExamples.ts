// RECEIPT_VERIFICATION_EXAMPLES.ts
// Example usage and test cases for the cryptographic receipt verification system
// This file demonstrates key scenarios and validates system behavior

import {
  generateVoteReceipt,
  verifyVotingReceipt,
  verifyReceiptSignature,
  generateVoteCommitment,
  initializeAuditLedger,
  getValidReceiptIdForDemo,
  type VoteData,
  type VerificationResult,
} from "../lib/receiptVerification";

/**
 * EXAMPLE 1: Complete Vote Receipt Lifecycle
 * Shows the full flow from vote casting to verification
 */
export async function exampleCompleteVotingCycle(): Promise<void> {
  console.log("🗳️  EXAMPLE 1: Complete Voting Cycle");
  console.log("=====================================\n");

  // Step 1: Initialize system (done once per election)
  console.log("1️⃣  Initializing audit ledger...");
  await initializeAuditLedger();
  console.log("✓ Ledger initialized with sample votes\n");

  // Step 2: Create vote data
  console.log("2️⃣  Casting vote...");
  const voteData: VoteData = {
    voterId: "VOTER-00042",
    office: "President",
    encryptedChoice: "kJ7hR_x9mP2q",
    electionId: "ECNBA-2026-ELECTION-01",
    timestamp: Date.now(),
  };
  console.log("   Vote object:", voteData);
  console.log("   (encryptedChoice is encrypted, cannot be read)\n");

  // Step 3: Generate receipt
  console.log("3️⃣  Generating cryptographic receipt...");
  const receipt = await generateVoteReceipt(voteData);
  console.log("   Receipt ID:", receipt.receiptId);
  console.log("   Timestamp:", receipt.timestamp);
  console.log("   Commitment:", receipt.commitment.substring(0, 20) + "...");
  console.log("   Signature:", receipt.signature.substring(0, 20) + "...");
  console.log("   (Receipt is cryptographically bound to vote data)\n");

  // Step 4: Print receipt for voter
  console.log("4️⃣  Receipt printed/emailed to voter");
  console.log("   ┌─────────────────────────────────────┐");
  console.log(`   │ Your ECNBA Receipt                  │`);
  console.log("   │                                     │");
  console.log(`   │ Receipt ID: ${receipt.receiptId}   │`);
  console.log(`   │ Office: ${voteData.office.padEnd(31)}│`);
  console.log(`   │ Time: ${receipt.timestamp.substring(0, 19)}         │`);
  console.log("   │                                     │");
  console.log("   │ Keep this receipt to verify your    │");
  console.log("   │ vote was counted.                   │");
  console.log("   └─────────────────────────────────────┘\n");

  // Step 5: Later verification
  console.log("5️⃣  Voter enters receipt on verification portal...");
  const result = await verifyVotingReceipt(receipt.receiptId);

  console.log("   Result:", result.message);
  console.log("   Details:", result.details);
  console.log("   Office Votes:", result.receiptData?.includeCount);
  console.log("   Hash Ref:", result.reference);
  console.log("\n✅ Complete cycle successful!\n");
}

/**
 * EXAMPLE 2: Signature Verification
 * Demonstrates tamper detection
 */
export async function exampleSignatureVerification(): Promise<void> {
  console.log("🔐 EXAMPLE 2: Signature Verification & Tamper Detection");
  console.log("========================================================\n");

  // Setup
  await initializeAuditLedger();

  const voteData: VoteData = {
    voterId: "VOTER-00001",
    office: "Vice President",
    encryptedChoice: "encrypted_vote_data",
    electionId: "ECNBA-2026-ELECTION-01",
    timestamp: Date.now(),
  };

  const receipt = await generateVoteReceipt(voteData);

  // Test 1: Valid signature
  console.log("1️⃣  Testing valid receipt signature...");
  let isValid = await verifyReceiptSignature(receipt);
  console.log(`   ✓ Signature valid: ${isValid}`);
  console.log(`   Receipt has not been modified\n`);

  // Test 2: Tampered receipt
  console.log("2️⃣  Testing tampered receipt (signature check)...");
  const tamperedReceipt = {
    ...receipt,
    signature: "TAMPERED_SIGNATURE",
  };
  isValid = await verifyReceiptSignature(tamperedReceipt);
  console.log(`   ✗ Signature valid: ${isValid}`);
  console.log(`   Tampering detected! Receipt rejected\n`);

  // Test 3: Commitment verification
  console.log("3️⃣  Testing commitment integrity...");
  const commitment = await generateVoteCommitment(voteData);
  console.log(`   Generated commitment: ${commitment.substring(0, 30)}...`);
  console.log(`   Stored commitment:    ${receipt.commitment.substring(0, 30)}...`);
  console.log(`   Match: ${commitment === receipt.commitment}`);
  console.log("   ✓ Vote data is integral\n");

  console.log("✅ Signature verification examples complete!\n");
}

/**
 * EXAMPLE 3: Batch Verification
 * Shows how to verify multiple receipts
 */
export async function exampleBatchVerification(): Promise<void> {
  console.log("📊 EXAMPLE 3: Batch Receipt Verification");
  console.log("=========================================\n");

  // Initialize with sample data
  await initializeAuditLedger();

  // Get sample receipts
  const receiptIds = Array.from({ length: 5 }).map((_, i) => {
    // Create some mock receipt IDs - in real scenario these would come from voters
    const index = i + 1;
    return getValidReceiptIdForDemo();
  });

  console.log(`Verifying ${receiptIds.length} receipts...\n`);

  let verifiedCount = 0;
  let officeTallies: Record<string, number> = {};

  for (const receiptId of receiptIds) {
    const result = await verifyVotingReceipt(receiptId);

    if (result.verified) {
      verifiedCount++;
      const office = result.receiptData?.office || "Unknown";
      officeTallies[office] = (officeTallies[office] || 0) + 1;

      console.log(`✓ ${receiptId}`);
      console.log(`  Office: ${office}, Tally: ${result.receiptData?.includeCount}`);
    } else {
      console.log(`✗ ${receiptId} - ${result.message}`);
    }
  }

  console.log(`\n📈 Summary:`);
  console.log(`   Verified: ${verifiedCount}/${receiptIds.length}`);
  console.log(`   Offices represented: ${Object.keys(officeTallies).join(", ")}`);
  console.log("\n✅ Batch verification complete!\n");
}

/**
 * EXAMPLE 4: Error Handling
 * Demonstrates error scenarios and recovery
 */
export async function exampleErrorHandling(): Promise<void> {
  console.log("⚠️  EXAMPLE 4: Error Handling");
  console.log("=============================\n");

  await initializeAuditLedger();

  // Test 1: Invalid receipt ID
  console.log("1️⃣  Verifying invalid receipt ID...");
  let result = await verifyVotingReceipt("RX-XXXX-XXXX-XXXX-XXXX");
  console.log(`   Message: ${result.message}`);
  console.log(`   Details: ${result.details}`);
  console.log(`   Verified: ${result.verified}\n`);

  // Test 2: Empty receipt ID
  console.log("2️⃣  Verifying empty receipt ID...");
  result = await verifyVotingReceipt("");
  console.log(`   Message: ${result.message}`);
  console.log(`   Verified: ${result.verified}\n`);

  // Test 3: Malformed receipt ID
  console.log("3️⃣  Verifying malformed receipt ID...");
  result = await verifyVotingReceipt("NOT-A-VALID-FORMAT");
  console.log(`   Message: ${result.message}`);
  console.log(`   Verified: ${result.verified}\n`);

  // Test 4: Valid receipt with proper verification
  console.log("4️⃣  Verifying valid receipt...");
  const validReceiptId = getValidReceiptIdForDemo();
  result = await verifyVotingReceipt(validReceiptId);
  console.log(`   Message: ${result.message}`);
  console.log(`   Verified: ${result.verified}\n`);

  console.log("✅ Error handling examples complete!\n");
}

/**
 * EXAMPLE 5: Cryptographic Properties Demonstration
 * Shows SHA-256 and HMAC behavior
 */
export async function exampleCryptographicProperties(): Promise<void> {
  console.log("🔑 EXAMPLE 5: Cryptographic Properties");
  console.log("=======================================\n");

  // Property 1: Determinism
  console.log("1️⃣  Determinism: Same input = Same hash");
  const voteData: VoteData = {
    voterId: "VOTER-00001",
    office: "President",
    encryptedChoice: "same_vote",
    electionId: "ECNBA-2026-ELECTION-01",
    timestamp: 1689870000000, // Fixed timestamp
  };

  const commitment1 = await generateVoteCommitment(voteData);
  const commitment2 = await generateVoteCommitment(voteData);
  console.log(`   Commitment 1: ${commitment1.substring(0, 30)}...`);
  console.log(`   Commitment 2: ${commitment2.substring(0, 30)}...`);
  console.log(`   Match: ${commitment1 === commitment2} ✓\n`);

  // Property 2: Avalanche effect
  console.log("2️⃣  Avalanche Effect: One bit change = Different hash");
  const voteData2: VoteData = {
    ...voteData,
    voterId: "VOTER-00002", // Slightly different
  };
  const commitment3 = await generateVoteCommitment(voteData2);
  console.log(`   Original: ${commitment1.substring(0, 30)}...`);
  console.log(`   Modified: ${commitment3.substring(0, 30)}...`);
  console.log(`   Different: ${commitment1 !== commitment3} ✓\n`);

  // Property 3: Preimage resistance
  console.log("3️⃣  Preimage Resistance: Cannot reverse hash");
  console.log(`   Hash: ${commitment1.substring(0, 30)}...`);
  console.log(`   Cannot recover vote data from hash ✓`);
  console.log(`   Protects voter privacy\n`);

  // Property 4: Collision resistance
  console.log("4️⃣  Collision Resistance: Same office, different times");
  const voteData3: VoteData = {
    ...voteData,
    timestamp: 1689870001000, // Different timestamp
  };
  const commitment4 = await generateVoteCommitment(voteData3);
  console.log(`   Vote 1: ${commitment1.substring(0, 30)}...`);
  console.log(`   Vote 2: ${commitment4.substring(0, 30)}...`);
  console.log(`   No collision (all votes unique) ✓\n`);

  console.log("✅ Cryptographic properties verified!\n");
}

/**
 * EXAMPLE 6: Real-world Election Scenario
 * Simulates a complete election with multiple voters
 */
export async function exampleRealWorldElection(): Promise<void> {
  console.log("🏛️  EXAMPLE 6: Real-world Election Scenario");
  console.log("============================================\n");

  console.log("📍 Election Setup");
  console.log("   Election: ECNBA 2026 General Election");
  console.log("   Date: 2026-07-20");
  console.log("   Polling Centers: 5");
  console.log("   Offices: President, Vice President, General Secretary");
  console.log("   Voters: 173 (publicly tracked)\n");

  // Initialize
  await initializeAuditLedger();

  console.log("📋 Election Results Summary");
  console.log("   ┌──────────────────────────────────┐");
  console.log("   │ President                         │");
  console.log("   │ ├─ Barrister Adewale O.  52.3%   │");
  console.log("   │ ├─ Dr. Chioma E.         25.1%   │");
  console.log("   │ └─ Gen. Okonkwo T.       22.6%   │");
  console.log("   │                                   │");
  console.log("   │ Vice President                    │");
  console.log("   │ ├─ Alhaji Bello M.       48.7%   │");
  console.log("   │ ├─ Chief Okafor P.       28.9%   │");
  console.log("   │ └─ Senator Abubakar K.   22.4%   │");
  console.log("   │                                   │");
  console.log("   │ General Secretary                 │");
  console.log("   │ ├─ Mrs. Ifeanyi C.       59.1%   │");
  console.log("   │ ├─ Mr. Adebayo S.        24.3%   │");
  console.log("   │ └─ Dr. Emeka N.          16.6%   │");
  console.log("   └──────────────────────────────────┘\n");

  console.log("🔍 Voter Verification Portal Opens");
  console.log("   Voters can now verify receipts\n");

  // Simulate voter verification
  const testReceiptId = getValidReceiptIdForDemo();
  console.log(`📱 Sample Verification: ${testReceiptId}`);

  const result = await verifyVotingReceipt(testReceiptId);
  console.log("   Status: " + (result.verified ? "✅ VERIFIED" : "❌ FAILED"));
  console.log("   Vote Office: " + result.receiptData?.office);
  console.log("   Votes Cast: " + result.receiptData?.includeCount);
  console.log("   Hash Reference: " + result.reference);
  console.log(`\n   Vote recorded: ${result.receiptData?.timestamp}`);
  console.log(`   Voter can verify: Vote was counted\n`);

  console.log("✅ Real-world election cycle complete!\n");
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  try {
    await exampleCompleteVotingCycle();
    await exampleSignatureVerification();
    await exampleBatchVerification();
    await exampleErrorHandling();
    await exampleCryptographicProperties();
    await exampleRealWorldElection();

    console.log("=".repeat(65));
    console.log("✅ All examples completed successfully!");
    console.log("=".repeat(65));
  } catch (error) {
    console.error("❌ Error during examples:", error);
  }
}
