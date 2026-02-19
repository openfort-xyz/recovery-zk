/**
 * Poseidon2 hash computation utilities using bb.js
 * Ported from circuits/zkjwt/scripts/src/utils/poseidon.ts
 */
import { BarretenbergSync, Fr } from "@aztec/bb.js";

const PACKED_EMAIL_FIELDS = 5;
const BYTES_PER_FIELD = 31;

let bbInstance: BarretenbergSync | null = null;

/**
 * Initialize Barretenberg (call once at startup)
 */
export async function initBarretenberg(): Promise<BarretenbergSync> {
  if (!bbInstance) {
    bbInstance = await BarretenbergSync.initSingleton();
  }
  return bbInstance;
}

/**
 * Pack email bytes into Field elements (31 bytes per Field, big-endian)
 * Matches the circuit's pack_bytes_to_fields() function
 */
export function packEmailToFields(email: string): bigint[] {
  const bytes = new TextEncoder().encode(email);
  const result: bigint[] = new Array(PACKED_EMAIL_FIELDS).fill(0n);

  for (let fieldIdx = 0; fieldIdx < PACKED_EMAIL_FIELDS; fieldIdx++) {
    let fieldValue = 0n;
    const startByte = fieldIdx * BYTES_PER_FIELD;

    for (let byteOffset = 0; byteOffset < BYTES_PER_FIELD; byteOffset++) {
      const byteIdx = startByte + byteOffset;
      if (byteIdx < bytes.length) {
        fieldValue = fieldValue * 256n + BigInt(bytes[byteIdx]);
      }
    }
    result[fieldIdx] = fieldValue;
  }

  return result;
}

/**
 * Compute the email hash: Poseidon2([packed[0..4], email_len], 6)
 */
export function computeEmailHash(bb: BarretenbergSync, email: string): Fr {
  const packed = packEmailToFields(email);
  const emailLen = BigInt(new TextEncoder().encode(email).length);

  const inputs: Fr[] = [
    new Fr(packed[0]),
    new Fr(packed[1]),
    new Fr(packed[2]),
    new Fr(packed[3]),
    new Fr(packed[4]),
    new Fr(emailLen),
  ];

  return bb.poseidon2Hash(inputs);
}

/**
 * Compute the commitment: Poseidon2([email_hash, salt], 2)
 */
export function computeCommitment(
  bb: BarretenbergSync,
  email: string,
  salt: bigint
): Fr {
  const emailHash = computeEmailHash(bb, email);
  return bb.poseidon2Hash([emailHash, new Fr(salt)]);
}
