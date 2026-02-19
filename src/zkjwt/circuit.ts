/**
 * ZK proof generation for the zkJWT circuit.
 *
 * Uses @noir-lang/noir_js for witness generation and the native `bb` CLI
 * for UltraHonk proof generation (WASM bb.js crashes on RSA-2048 circuits).
 */
import { Noir } from "@noir-lang/noir_js";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import type { JwtInputs } from "./jwt";

const MAX_DATA_LENGTH = 900;
const MAX_EMAIL_LENGTH = 128;

const CIRCUIT_ARTIFACT_PATH = path.resolve(
  __dirname,
  "../../circuits/zkjwt/target/zkjwt.json"
);

const BB_BINARY = path.resolve(os.homedir(), ".bb/bb");

export const BN254_SCALAR_FIELD_MODULUS =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

export interface ZkJwtCircuitInputs {
  data: number[];
  dataLength: number;
  base64_decode_offset: number;
  redc_params_limbs: bigint[];
  signature_limbs: bigint[];
  email: number[];
  emailLength: number;
  salt: bigint;
  pubkey_modulus_limbs: bigint[];
  intent_hash: bigint;
}

export interface ZkJwtProofResult {
  rawProof: Uint8Array;
  publicInputs: string[];
}

let circuitArtifact: any = null;

function loadCircuitArtifact(): { abi: any; bytecode: string } {
  if (!circuitArtifact) {
    circuitArtifact = JSON.parse(
      fs.readFileSync(CIRCUIT_ARTIFACT_PATH, "utf-8")
    );
  }
  return circuitArtifact;
}

/**
 * Convert JwtInputs (camelCase) + user params into ZkJwtCircuitInputs (snake_case matching Noir ABI).
 */
export function prepareCircuitInputs(
  jwtInputs: JwtInputs,
  email: string,
  salt: bigint,
  intentHash: bigint
): ZkJwtCircuitInputs {
  const emailBytes = Array.from(new TextEncoder().encode(email));
  return {
    data: jwtInputs.data,
    dataLength: jwtInputs.dataLength,
    base64_decode_offset: jwtInputs.base64DecodeOffset,
    signature_limbs: jwtInputs.signatureLimbs,
    pubkey_modulus_limbs: jwtInputs.pubkeyModulusLimbs,
    redc_params_limbs: jwtInputs.redcParamsLimbs,
    email: emailBytes,
    emailLength: emailBytes.length,
    salt,
    intent_hash: intentHash,
  };
}

/**
 * Generate a zkJWT UltraHonk proof.
 *
 * 1. noir_js executes the circuit to produce a witness
 * 2. Native `bb prove -t evm` generates the EVM-compatible proof
 */
export async function generateZkJwtProof(
  inputs: ZkJwtCircuitInputs
): Promise<ZkJwtProofResult> {
  const artifact = loadCircuitArtifact();

  // Pad arrays to circuit constants
  const paddedData = new Array(MAX_DATA_LENGTH).fill(0);
  for (let i = 0; i < inputs.data.length && i < MAX_DATA_LENGTH; i++) {
    paddedData[i] = inputs.data[i];
  }
  const paddedEmail = new Array(MAX_EMAIL_LENGTH).fill(0);
  for (let i = 0; i < inputs.email.length && i < MAX_EMAIL_LENGTH; i++) {
    paddedEmail[i] = inputs.email[i];
  }

  // Format inputs for noir_js (BoundedVec format)
  const formattedInputs = {
    data: { storage: paddedData, len: inputs.dataLength },
    base64_decode_offset: inputs.base64_decode_offset,
    signature_limbs: inputs.signature_limbs.map(String),
    pubkey_modulus_limbs: inputs.pubkey_modulus_limbs.map(String),
    redc_params_limbs: inputs.redc_params_limbs.map(String),
    email: { storage: paddedEmail, len: inputs.emailLength },
    salt: String(inputs.salt),
    intent_hash: String(inputs.intent_hash),
  };

  // Generate witness via noir_js
  console.log("Generating witness...");
  const noir = new Noir(artifact);
  const { witness } = await noir.execute(formattedInputs as any);

  // Prove via native bb binary
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "zkjwt-"));
  try {
    fs.writeFileSync(path.join(tmpDir, "witness.gz"), witness);

    console.log("Generating UltraHonk proof...");
    execSync(
      `"${BB_BINARY}" prove` +
        ` -b "${CIRCUIT_ARTIFACT_PATH}"` +
        ` -w "${path.join(tmpDir, "witness.gz")}"` +
        ` -o "${tmpDir}"` +
        ` --write_vk -t evm`,
      { stdio: "pipe", timeout: 300_000 }
    );

    // Read proof and public inputs
    const rawProof = new Uint8Array(
      fs.readFileSync(path.join(tmpDir, "proof"))
    );
    const piBuf = fs.readFileSync(path.join(tmpDir, "public_inputs"));
    const publicInputs: string[] = [];
    for (let i = 0; i < piBuf.length; i += 32) {
      publicInputs.push("0x" + piBuf.subarray(i, i + 32).toString("hex"));
    }

    console.log(`Proof generated (${rawProof.length} bytes, ${publicInputs.length} public inputs).`);
    return { rawProof, publicInputs };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
