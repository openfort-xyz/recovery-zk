/**
 * RSA utilities for BigInt-to-limbs conversion
 * Ported from circuits/zkjwt/scripts/src/utils/rsa.ts
 */

/**
 * Split a BigInt into fixed-size chunks (limbs)
 * Splits into 18 limbs of 120 bits each for RSA-2048
 */
export function splitBigIntToLimbs(
  bigInt: bigint,
  chunkSize: number = 120,
  numChunks: number = 18
): bigint[] {
  const chunks: bigint[] = [];
  const mask = (1n << BigInt(chunkSize)) - 1n;

  for (let i = 0; i < numChunks; i++) {
    const chunk = (bigInt >> (BigInt(i) * BigInt(chunkSize))) & mask;
    chunks.push(chunk);
  }

  return chunks;
}

/**
 * Compute Montgomery reduction parameters for the bignum library
 * Formula: (1 << (2 * 2048 + 4)) / modulus
 */
export function computeRedcParams(modulus: bigint): bigint {
  return (1n << (2n * 2048n + 4n)) / modulus;
}

/**
 * Extract the modulus from a JWK public key
 */
export function extractModulusFromJwk(jwk: JsonWebKey): bigint {
  if (!jwk.n) {
    throw new Error("JWK does not contain modulus (n)");
  }

  const base64 = jwk.n.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Buffer.from(base64, "base64");
  return BigInt("0x" + bytes.toString("hex"));
}
