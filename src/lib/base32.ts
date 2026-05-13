const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function normalizeBase32(value: string): string {
  return value.replace(/[\s-]+/g, "").toUpperCase();
}

export function formatBase32(value: string, groupSize = 4): string {
  const normalized = normalizeBase32(value);
  return normalized.match(new RegExp(`.{1,${groupSize}}`, "g"))?.join(" ") ?? normalized;
}

export function base32Encode(bytes: Uint8Array): string {
  let output = "";
  let buffer = 0;
  let bitsLeft = 0;

  bytes.forEach((byte) => {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;

    while (bitsLeft >= 5) {
      output += BASE32_ALPHABET[(buffer >>> (bitsLeft - 5)) & 31];
      bitsLeft -= 5;
    }
  });

  if (bitsLeft > 0) {
    output += BASE32_ALPHABET[(buffer << (5 - bitsLeft)) & 31];
  }

  return output;
}

export function base32Decode(value: string): Uint8Array {
  const normalized = normalizeBase32(value);
  let buffer = 0;
  let bitsLeft = 0;
  const output: number[] = [];

  for (const character of normalized) {
    const index = BASE32_ALPHABET.indexOf(character);

    if (index === -1) {
      throw new Error("Invalid base32 value.");
    }

    buffer = (buffer << 5) | index;
    bitsLeft += 5;

    if (bitsLeft >= 8) {
      output.push((buffer >>> (bitsLeft - 8)) & 255);
      bitsLeft -= 8;
    }
  }

  return new Uint8Array(output);
}
