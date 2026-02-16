---
date: 2026-02-16
researcher: claude
repo: privacy-ethereum/social-recovery-sdk
branch: main
commit: a74848ee0571c5c0729f3953ebd4098d08275a15
tags: [social-recovery, full-stack, architecture, EOA, Passkey, zkJWT]
status: complete
last_updated: 2026-02-16
---

# Research: Full Architecture Overview — Social Recovery SDK

## Research Question

Document the entire system architecture of the social-recovery-sdk: all components across Contracts (Solidity/Foundry), SDK (TypeScript), and Circuits (Noir/zkJWT), and how they connect.

## Summary

The social-recovery-sdk is a composable, standalone SDK for adding social recovery to smart wallets. It implements a three-layer architecture: **Solidity contracts** (Foundry) managing on-chain recovery sessions and proof verification, a **TypeScript SDK** orchestrating recovery flows and proof generation, and a **Noir ZK circuit** enabling privacy-preserving JWT-based guardian authentication. Wallet owners designate guardians (EOA, Passkey, or zkJWT) who can collectively restore access via an N-of-M threshold scheme with a challenge period for owner cancellation.

## Layers Involved

- [x] Contracts (`contracts/src/`)
- [x] SDK (`sdk/src/`)
- [x] Circuits (`circuits/zkjwt/`)
- [x] Cross-layer

---

## 1. Project Structure

```
social-recovery-sdk/
├── contracts/                    # Solidity smart contracts (Foundry)
│   ├── src/
│   │   ├── RecoveryManager.sol
│   │   ├── RecoveryManagerFactory.sol
│   │   ├── verifiers/
│   │   │   ├── PasskeyVerifier.sol
│   │   │   ├── ZkJwtVerifier.sol
│   │   │   └── HonkVerifier.sol      # Auto-generated Noir proof verifier
│   │   ├── interfaces/
│   │   │   ├── IRecoveryManager.sol
│   │   │   ├── IVerifier.sol
│   │   │   └── IWallet.sol
│   │   ├── libraries/
│   │   │   ├── GuardianLib.sol
│   │   │   └── EIP712Lib.sol
│   │   └── mocks/
│   │       ├── MockRecoveryWallet.sol
│   │       └── P256VerifierStub.sol
│   └── test/
│
├── sdk/                          # TypeScript SDK
│   ├── src/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   ├── auth/
│   │   │   ├── AuthManager.ts
│   │   │   ├── adapters/
│   │   │   │   ├── IAuthAdapter.ts
│   │   │   │   ├── EoaAdapter.ts
│   │   │   │   ├── PasskeyAdapter.ts
│   │   │   │   └── ZkJwtAdapter.ts
│   │   │   └── utils/
│   │   │       ├── eip712.ts
│   │   │       ├── webauthn.ts
│   │   │       └── zkjwt/
│   │   │           ├── poseidon.ts
│   │   │           ├── rsa.ts
│   │   │           ├── jwt.ts
│   │   │           ├── google-jwks.ts
│   │   │           └── circuit.ts
│   │   ├── recovery/
│   │   │   ├── RecoveryClient.ts
│   │   │   └── PolicyBuilder.ts
│   │   └── contracts/
│   │       ├── abis/
│   │       ├── RecoveryManagerContract.ts
│   │       └── FactoryContract.ts
│   └── test/
│
├── circuits/                     # Noir ZK circuits
│   └── zkjwt/
│       ├── src/main.nr
│       ├── Nargo.toml
│       ├── Prover.toml
│       └── scripts/
│           └── src/
│               ├── generate-prover.ts
│               ├── utils/
│               │   ├── rsa.ts
│               │   ├── jwt.ts
│               │   ├── poseidon.ts
│               │   ├── prover-toml.ts
│               │   └── google-jwks.ts
│               └── fixtures/
│                   ├── self-signed.ts
│                   └── google-signed.ts
│
├── SPEC.md
├── ARCHITECTURE.md
├── CHECKLIST.md
└── ROADMAP.md
```

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         WALLET                               │
│  Implements: IWallet (owner, setOwner, isRecoveryAuthorized) │
└──────────────────────────────────────────────────────────────┘
                              │
                   authorized to execute
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    RECOVERY MANAGER                          │
│                   (one per wallet, EIP-1167 proxy)           │
│                                                              │
│  Policy: wallet, threshold, challengePeriod, guardians[]     │
│  Session: intentHash, newOwner, deadline, approvals[]        │
│                                                              │
│  startRecovery() → submitProof() → executeRecovery()         │
└──────────────────────────────────────────────────────────────┘
                              │
              delegates proof verification
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │   EOA    │   │ Passkey  │   │  ZkJWT   │
        │ecrecover │   │ Verifier │   │ Verifier │
        │(inline)  │   │(P-256)   │   │(Honk ZK) │
        └──────────┘   └──────────┘   └──────────┘
                              │               │
                              ▼               ▼
                        ┌──────────┐   ┌──────────┐
                        │p256-veri-│   │  Honk    │
                        │  fier    │   │ Verifier │
                        │(RIP-7212)│   │ generated│
                        └──────────┘   └──────────┘
```

---

## 3. Contracts Layer

### 3.1 RecoveryManager.sol

**Path:** `contracts/src/RecoveryManager.sol`
**Purpose:** Core contract managing recovery sessions. One instance per wallet, deployed as EIP-1167 minimal proxy.

**State Variables:**
| Variable | Type | Line | Description |
|----------|------|------|-------------|
| `_initialized` | `bool` | 23 | Prevents re-initialization |
| `wallet` | `address` | 25 | Protected wallet address |
| `threshold` | `uint256` | 26 | N in N-of-M |
| `challengePeriod` | `uint256` | 27 | Seconds after threshold before execution |
| `nonce` | `uint256` | 28 | Incremented per session, prevents replay |
| `_guardians` | `Guardian[]` | 30 | Guardian configurations |
| `passkeyVerifier` | `IVerifier` | 32 | Singleton passkey verifier |
| `zkJwtVerifier` | `IVerifier` | 33 | Singleton zkJWT verifier |
| `_sessionIntentHash` | `bytes32` | 36 | Active session intent hash |
| `_sessionNewOwner` | `address` | 37 | Proposed new owner |
| `_sessionDeadline` | `uint64` | 38 | Session expiration |
| `_sessionThresholdMetAt` | `uint64` | 39 | When threshold was met (0 if not) |
| `_sessionApprovalCount` | `uint8` | 40 | Current approvals |
| `_sessionApprovals` | `mapping(bytes32 => bool)` | 41 | Guardian approval tracking |

**Key Functions:**

| Function | Line | Phase | Description |
|----------|------|-------|-------------|
| `initialize()` | 54 | setup | Called once by factory after proxy deployment |
| `startRecovery()` | 123 | initiate | First guardian starts session with proof |
| `submitProof()` | 170 | support | Additional guardians submit proofs |
| `executeRecovery()` | 201 | execute | Execute after challenge period |
| `cancelRecovery()` | 231 | challenge | Owner cancels active session |
| `clearExpiredRecovery()` | 248 | — | Anyone clears expired session |
| `updatePolicy()` | 267 | setup | Owner updates guardians/threshold/period |
| `_verifyProof()` | 286 | — | Routes proof to correct verifier by guardian type |
| `_verifyEoaProof()` | 305 | — | Inline ECDSA verification via ecrecover |
| `_setPolicy()` | 316 | — | Validates and stores guardian policy |
| `_clearSession()` | 350 | — | Clears all session state |

**Proof Routing (`_verifyProof`, line 286):**
- `GuardianType.EOA` → inline `ecrecover` (no external verifier)
- `GuardianType.Passkey` → `passkeyVerifier.verify()`
- `GuardianType.ZkJWT` → `zkJwtVerifier.verify()`

### 3.2 RecoveryManagerFactory.sol

**Path:** `contracts/src/RecoveryManagerFactory.sol`
**Purpose:** Deploys RecoveryManager proxies using EIP-1167 minimal proxy pattern. Stores singleton verifier addresses.

**Immutable State:**
- `implementation` (line 11) — RecoveryManager implementation contract
- `passkeyVerifier` (line 12) — Singleton PasskeyVerifier
- `zkJwtVerifier` (line 13) — Singleton ZkJwtVerifier

**Mapping:** `getRecoveryManager[wallet] → proxy address` (line 15)

**Key Function:** `deployRecoveryManager()` (line 34) — Deploys EIP-1167 proxy via `_clone()` assembly (45-byte runtime), initializes with wallet config and singleton verifiers. One RecoveryManager per wallet enforced.

### 3.3 PasskeyVerifier.sol

**Path:** `contracts/src/verifiers/PasskeyVerifier.sol`
**Purpose:** Verifies WebAuthn/P-256 signatures for passkey guardians.

**`verify()` (line 17):**
1. Decodes proof: `(authenticatorData, clientDataJSON, challengeLocation, responseTypeLocation, r, s, pubKeyX, pubKeyY)`
2. Computes identifier: `keccak256(pubKeyX || pubKeyY)` — must match stored `guardianIdentifier`
3. Creates challenge: `abi.encodePacked(intentHash)`
4. Delegates to `WebAuthn.verifySignature()` with `requireUserVerification = true`

**Dependency:** `p256-verifier` library (daimo-eth) — supports RIP-7212 precompile with software fallback (~330k gas without precompile, ~3.4k with).

### 3.4 ZkJwtVerifier.sol

**Path:** `contracts/src/verifiers/ZkJwtVerifier.sol`
**Purpose:** Wraps auto-generated HonkVerifier for zkJWT proof verification.

**Constants:**
- `NUM_PUBLIC_INPUTS = 20` (line 19)
- `NUM_MODULUS_LIMBS = 18` (line 20)
- `BN254_SCALAR_FIELD_MODULUS` (line 24) — intentHash reduced mod this

**`verify()` (line 34):**
1. Decodes proof: `(bytes rawProof, bytes32[18] pubkeyModulusLimbs)`
2. Builds 20-element public inputs array:
   - `[0..17]` — RSA modulus limbs (identifies signing key, e.g., Google)
   - `[18]` — `intentHash % BN254_SCALAR_FIELD_MODULUS` (session binding)
   - `[19]` — `guardianIdentifier` (Poseidon2 commitment)
3. Delegates to `honkVerifier.verify(rawProof, publicInputs)`

### 3.5 HonkVerifier.sol

**Path:** `contracts/src/verifiers/HonkVerifier.sol`
**Purpose:** Auto-generated Honk proof verifier (~37KB). Contains embedded verification key for the zkJWT circuit.

**Circuit Properties:** `N = 262144` (2^18 gates), `NUMBER_OF_PUBLIC_INPUTS = 36`, BN254 curve.

### 3.6 Libraries

**GuardianLib.sol** (`contracts/src/libraries/GuardianLib.sol`):
- `GuardianType` enum: `EOA (0)`, `Passkey (1)`, `ZkJWT (2)` (line 10)
- `Guardian` struct: `{guardianType, identifier}` (line 19)
- `computePasskeyIdentifier(pubKeyX, pubKeyY)` → `keccak256(abi.encodePacked(pubKeyX, pubKeyY))` (line 28)
- `computeEoaIdentifier(addr)` → `bytes32(uint256(uint160(addr)))` (line 38)
- `isValidGuardian()` — validates identifier non-zero, type in range, EOA canonical encoding (line 52)

**EIP712Lib.sol** (`contracts/src/libraries/EIP712Lib.sol`):
- Domain: `{name: "SocialRecovery", version: "1"}` (lines 9-12)
- `RecoveryIntent` struct: `{wallet, newOwner, nonce, deadline, chainId, recoveryManager}` (line 31)
- `hashTypedData(intent, verifyingContract)` → full EIP-712 hash with `\x19\x01` prefix (line 77)
- Provides replay protection across chains, contracts, sessions, and time

### 3.7 Interfaces

| Interface | Path | Purpose |
|-----------|------|---------|
| `IRecoveryManager` | `contracts/src/interfaces/IRecoveryManager.sol` | Full RecoveryManager specification: 6 events, 12 errors, 9 view functions, 6 write functions |
| `IVerifier` | `contracts/src/interfaces/IVerifier.sol` | `verify(guardianIdentifier, intentHash, proof) → bool` + `guardianType() → uint8` |
| `IWallet` | `contracts/src/interfaces/IWallet.sol` | `owner()`, `setOwner(newOwner)`, `isRecoveryAuthorized(account)` |

### 3.8 Mocks

- **MockRecoveryWallet.sol** — Minimal IWallet implementation for testing with basic owner management and recovery authorization mapping
- **P256VerifierStub.sol** — Returns `true` for any 160-byte input, simulates EIP-7212 precompile for local Anvil testing

### 3.9 Foundry Configuration

**`contracts/foundry.toml`:**
- Solidity `^0.8.21`
- Remappings: `p256-verifier/`, `forge-std/`
- Deploy profile: `optimizer_runs = 1` (size optimization for EIP-170 on HonkVerifier)

---

## 4. SDK Layer (TypeScript)

### 4.1 Core Types (`sdk/src/types.ts`)

| Type | Description |
|------|-------------|
| `GuardianType` (enum) | `EOA (0)`, `Passkey (1)`, `ZkJWT (2)` — mirrors Solidity |
| `Guardian` | `{guardianType, identifier: Hex}` |
| `RecoveryIntent` | `{wallet, newOwner, nonce, deadline, chainId, recoveryManager}` |
| `P256PublicKey` | `{x: bigint, y: bigint}` |
| `PasskeyCredential` | `{credentialId, publicKey: P256PublicKey}` |
| `PasskeyProof` | Full WebAuthn proof: authenticatorData, clientDataJSON, indices, r, s, pubKey |
| `GuardianProof` | `{guardianIdentifier, guardianType, proof: Hex}` — ABI-encoded |
| `RecoverySession` | `{intentHash, newOwner, deadline, thresholdMetAt, approvalCount}` |
| `RecoveryPolicy` | `{wallet, threshold, challengePeriod, guardians[]}` |

### 4.2 Constants (`sdk/src/constants.ts`)

- EIP-712 domain: `{name: "SocialRecovery", version: "1"}`
- `P256_VERIFIER_ADDRESS`: `0xc2b78104907F722DABAc4C69f826a522B2754De4`
- `DEFAULT_CHALLENGE_PERIOD`: 86400 seconds (1 day)
- `DEFAULT_DEADLINE_SECONDS`: 86700 seconds (challenge period + 300s buffer)
- Per-chain `VERIFIER_ADDRESSES` and `FACTORY_ADDRESSES` mappings

### 4.3 Auth Module

**AuthManager** (`sdk/src/auth/AuthManager.ts`):
- Strategy pattern — routes proof generation to appropriate adapter by `GuardianType`
- `registerAdapter(adapter)`, `generateProof(type, intent, identifier)`, `computeIdentifier(type, credentials)`

**IAuthAdapter** (`sdk/src/auth/adapters/IAuthAdapter.ts`):
- Interface: `generateProof(intent, guardianIdentifier) → ProofResult`, `computeIdentifier(credentials) → Hex`

**EoaAdapter** (`sdk/src/auth/adapters/EoaAdapter.ts`):
- Signs RecoveryIntent via EIP-712 using viem `WalletClient`
- `computeIdentifier(address)` → `pad(address, {size: 32})`
- Proof ABI-encoded as `(uint8 v, bytes32 r, bytes32 s)`

**PasskeyAdapter** (`sdk/src/auth/adapters/PasskeyAdapter.ts`):
- Calls browser WebAuthn API (`navigator.credentials.get()`)
- `computeIdentifier(publicKey)` → `keccak256(pubKeyX || pubKeyY)`
- Parses DER-encoded P-256 signature, canonicalizes to low-S form
- Proof ABI-encoded as `(bytes, string, uint256, uint256, uint256, uint256, uint256, uint256)`

**ZkJwtAdapter** (`sdk/src/auth/adapters/ZkJwtAdapter.ts`):
- Generates Noir ZK proof from JWT token
- `computeZkJwtIdentifier(email, salt)` → `Poseidon2(email_hash, salt)` via Barretenberg
- Fetches Google JWKS if needed, extracts RSA modulus, builds circuit inputs
- Reduces `intentHash % BN254_SCALAR_FIELD_MODULUS` for circuit compatibility
- Proof ABI-encoded as `(bytes rawProof, bytes32[18] modulusLimbs)`

### 4.4 Auth Utilities

**eip712.ts** (`sdk/src/auth/utils/eip712.ts`):
- `hashRecoveryIntent(intent)` — EIP-712 typed data hash via viem
- `createRecoveryIntent(params)` — Creates intent with deadline defaulting to `now + deadlineSeconds`
- `isValidIntent(intent, options)` — Validates non-zero addresses, deadline, challenge period

**webauthn.ts** (`sdk/src/auth/utils/webauthn.ts`):
- `parseCosePublicKey(coseKey)` — COSE-decodes WebAuthn public key, validates P-256
- `createPasskeyCredential(rpId, userName, challenge)` — Calls `navigator.credentials.create()`
- `getPasskeyAssertion(credentialId, challenge, rpId)` — Calls `navigator.credentials.get()`
- `parseP256Signature(derSignature)` — DER-decodes + low-S canonicalization (`S <= n/2`)
- `findClientDataIndex()`, `challengeToBase64Url()`, `base64UrlToBytes()`

**zkjwt/poseidon.ts** (`sdk/src/auth/utils/zkjwt/poseidon.ts`):
- `initBarretenberg()` — Lazy singleton initialization
- `packEmailToFields(email)` — 5 Field elements, 31 bytes each, big-endian
- `computeEmailHash(bb, email)` → `Poseidon2([packed[0..4], email_len], 6)`
- `computeCommitment(bb, email, salt)` → `Poseidon2([email_hash, salt], 2)`

**zkjwt/rsa.ts** (`sdk/src/auth/utils/zkjwt/rsa.ts`):
- `splitBigIntToLimbs(bigInt, 120, 18)` — 2048-bit → 18 × 120-bit limbs
- `computeRedcParams(modulus)` — Montgomery reduction: `(1 << (2*2048+4)) / modulus`
- `extractModulusFromJwk(jwk)` — base64url → BigInt

**zkjwt/jwt.ts** (`sdk/src/auth/utils/zkjwt/jwt.ts`):
- `extractJwtInputs(jwt, publicKeyJwk, maxDataLength)` — JWT → circuit inputs (data, limbs, offset)

**zkjwt/google-jwks.ts** (`sdk/src/auth/utils/zkjwt/google-jwks.ts`):
- `decodeJwtHeader(jwt)` → `{alg, kid}`
- `decodeJwtPayload(jwt)` → claims object
- `fetchGoogleJwk(kid)` — Fetches from `https://www.googleapis.com/oauth2/v3/certs`

**zkjwt/circuit.ts** (`sdk/src/auth/utils/zkjwt/circuit.ts`):
- `BN254_SCALAR_FIELD_MODULUS` constant
- `generateZkJwtProof(inputs)` — Loads compiled circuit artifact, executes via `noir_js`, generates UltraHonk proof

### 4.5 Recovery Module

**RecoveryClient** (`sdk/src/recovery/RecoveryClient.ts`):
- Main SDK entry point coordinating auth, contracts, and deployment
- `deployRecoveryManager(policy)` — Via factory, deploys + initializes proxy
- `startRecovery(intent, guardianIndex, proof)` — Validates intent, submits to contract
- `submitProof(guardianIndex, proof)` — Additional guardian proofs
- `executeRecovery()` — Execute after challenge period
- `cancelRecovery()` — Owner cancels
- `clearExpiredRecovery()` — Clear stale session
- `getSession()`, `isRecoveryActive()`, `getPolicy()`, `isReadyToExecute()` — Query state

**PolicyBuilder** (`sdk/src/recovery/PolicyBuilder.ts`):
- Fluent API: `.setWallet(addr).setThreshold(2n).addEoaGuardian(addr).addPasskeyGuardian(pk).addZkJwtGuardian(commitment).build()`
- Validates: wallet non-zero, threshold <= guardian count, no zero/duplicate identifiers

### 4.6 Contract Wrappers

**FactoryContract** (`sdk/src/contracts/FactoryContract.ts`):
- Typed viem wrapper for RecoveryManagerFactory
- `deployRecoveryManager(wallet, guardians, threshold, challengePeriod)` → tx hash

**RecoveryManagerContract** (`sdk/src/contracts/RecoveryManagerContract.ts`):
- Typed viem wrapper for RecoveryManager
- Full read/write coverage matching IRecoveryManager interface

**ABIs:** `FactoryAbi.ts`, `RecoveryManagerAbi.ts` — Complete ABI definitions

### 4.7 Dependencies

- `viem` (^2.0.0) — Ethereum client, EIP-712 hashing, contract interaction
- `@aztec/bb.js` (0.82.2) — Barretenberg: Poseidon2 hashing + UltraHonk proving
- `@noir-lang/noir_js` (1.0.0-beta.18) — Noir circuit execution

---

## 5. Circuits Layer (Noir)

### 5.1 zkJWT Circuit (`circuits/zkjwt/src/main.nr`)

**Purpose:** Zero-knowledge proof that a guardian owns a verified email address (via JWT) bound to a specific recovery session.

**Constants (lines 4-7):**
- `MAX_DATA_LENGTH = 900` — JWT signed data max
- `MAX_EMAIL_LENGTH = 128` — Email max bytes
- `PACKED_EMAIL_FIELDS = 5` — ceil(128/31) Fields
- `BYTES_PER_FIELD = 31` — Bytes per Noir Field element

**Private Inputs (lines 40-45):**
| Input | Type | Description |
|-------|------|-------------|
| `data` | `BoundedVec<u8, 900>` | JWT header.payload (signed part) |
| `base64_decode_offset` | `u32` | Where payload starts (after first `.`) |
| `redc_params_limbs` | `[u128; 18]` | Montgomery REDC parameters |
| `signature_limbs` | `[u128; 18]` | RSA signature as 18 × 120-bit limbs |
| `email` | `BoundedVec<u8, 128>` | Email address bytes |
| `salt` | `Field` | Random salt for commitment |

**Public Inputs (lines 47-48):**
| Input | Type | Description |
|-------|------|-------------|
| `pubkey_modulus_limbs` | `pub [u128; 18]` | RSA public key modulus (identifies signer) |
| `intent_hash` | `pub Field` | EIP-712 hash reduced mod BN254 (session binding) |

**Public Output:** `commitment: Field` — `Poseidon2(email_hash, salt)`

**Verification Logic (lines 53-87):**
1. **RSA signature verification** (line 61): `jwt.verify()` — RS256 (RSA 2048-bit SHA-256) via `noir-jwt` library
2. **Claim assertion** (line 64): `jwt.assert_claim_bool("email_verified", true)` — Email must be verified
3. **Email matching** (lines 67-72): Byte-by-byte comparison of JWT email claim with private `email` input
4. **Intent hash validation**: `intent_hash != 0` (prevents zero-hash attacks)
5. **Commitment computation** (lines 75-87):
   - Pack email into 5 Fields (31 bytes each, big-endian)
   - `email_hash = Poseidon2([packed[0..4], email_len], 6)`
   - `commitment = Poseidon2([email_hash, salt], 2)`

**Helper:** `pack_bytes_to_fields<N, M>()` (line 9) — Big-endian byte packing into Field elements.

**Tests (lines 90-177):** Packing correctness, commitment determinism, multi-field uniqueness, intent_hash != 0.

### 5.2 Circuit Dependencies (`Nargo.toml`)

- **noir-jwt v0.5.1** (`zkemail/noir-jwt`) — RS256 JWT parsing and signature verification
- **poseidon v0.2.0** (`noir-lang/poseidon`) — Poseidon2 hash function

### 5.3 Script Infrastructure (`circuits/zkjwt/scripts/`)

**generate-prover.ts** — CLI orchestrator generating `Prover.toml` for witness generation:
- `--fixture=self-signed|google` — Test or real JWT
- `--email`, `--salt`, `--intent-hash` — Configurable parameters
- `--jwt=<token>` — Required for Google fixture
- Outputs expected commitment for verification

**Utility modules:**
| File | Purpose |
|------|---------|
| `utils/rsa.ts` | RSA key generation, 2048-bit → 18×120-bit limb splitting, Montgomery REDC params |
| `utils/jwt.ts` | JWT → circuit inputs (signed data, signature limbs, modulus limbs, base64 offset) |
| `utils/poseidon.ts` | Barretenberg Poseidon2 for off-chain commitment computation |
| `utils/prover-toml.ts` | Serialize circuit inputs to Nargo Prover.toml format |
| `utils/google-jwks.ts` | Fetch Google JWKS, decode JWT header/payload |

**Fixtures:**
- `fixtures/self-signed.ts` — Generates fresh RSA 2048 key pair + test JWT for development
- `fixtures/google-signed.ts` — Uses real Google OAuth `id_token` for production-like testing

---

## 6. Guardian Authentication Methods

### 6.1 Comparison Table

| Property | EOA | Passkey | zkJWT |
|----------|-----|---------|-------|
| **Identifier** | `bytes32(uint256(address))` | `keccak256(pubKeyX \|\| pubKeyY)` | `Poseidon2(email_hash, salt)` |
| **Proof Type** | ECDSA signature (v,r,s) | WebAuthn assertion (P-256) | Noir ZK proof (Honk) |
| **Verifier** | Inline `ecrecover` | PasskeyVerifier (singleton) | ZkJwtVerifier → HonkVerifier |
| **Privacy at Rest** | Address on-chain | PubKey hash on-chain | Commitment only (email hidden) |
| **Privacy During Recovery** | Address revealed | PubKey revealed in proof | Email NOT revealed |
| **Gas Cost** | ~21k (ecrecover) | ~330k (P-256 fallback) / ~3.4k (RIP-7212) | ~300k+ (ZK proof) |
| **Setup** | Collect Ethereum address | Guardian creates passkey | Owner enters email + generates salt |

### 6.2 Identifier Computation

**EOA:** `bytes32(uint256(uint160(address)))` — Left-padded address
- Canonical encoding enforced: `identifierToAddress(identifier) == original_address`

**Passkey:** `keccak256(abi.encodePacked(pubKeyX, pubKeyY))` — Hash of P-256 coordinates
- Computed identically in GuardianLib.sol and PasskeyAdapter.ts

**zkJWT:** `Poseidon2(email_hash, salt)` where `email_hash = Poseidon2([packed_email[0..4], email_len], 6)`
- Computed identically in main.nr circuit, poseidon.ts (SDK), and poseidon.ts (scripts)
- Salt shared out-of-band between wallet owner and guardian

---

## 7. Recovery Flow (End-to-End)

### 7.1 Setup Phase

```
setup → initiate → support → challenge → execute
  ↑
```

1. Owner chooses guardians and computes identifiers
2. Owner configures policy: `{guardians[], threshold, challengePeriod}`
3. SDK `PolicyBuilder` validates and builds `RecoveryPolicy`
4. SDK `RecoveryClient.deployRecoveryManager(policy)` calls factory
5. Factory deploys EIP-1167 proxy, calls `initialize()` with policy + singleton verifiers
6. Owner authorizes RecoveryManager in wallet (wallet-specific: `authorizeRecoveryManager()`)

### 7.2 Initiate Phase

```
setup → initiate → support → challenge → execute
            ↑
```

1. Guardian creates `RecoveryIntent` via SDK `createRecoveryIntent()`
2. Guardian generates proof via appropriate adapter:
   - **EOA:** EIP-712 signature over intent hash
   - **Passkey:** WebAuthn assertion with intent hash as challenge
   - **zkJWT:** Noir circuit proof binding JWT email to intent hash
3. SDK calls `RecoveryManager.startRecovery(intent, guardianIndex, proof)`
4. Contract validates intent fields (wallet, nonce, chainId, deadline, recoveryManager)
5. Contract verifies proof via `_verifyProof()` routing
6. Session created: `{intentHash, newOwner, deadline}`
7. First approval recorded
8. If 1-of-N: threshold met immediately, `thresholdMetAt` set

### 7.3 Support Phase

```
setup → initiate → support → challenge → execute
                       ↑
```

1. Additional guardians generate proofs for the same intent hash
2. SDK calls `RecoveryManager.submitProof(guardianIndex, proof)`
3. Contract verifies proof, records approval, increments `approvalCount`
4. When `approvalCount >= threshold`: sets `thresholdMetAt = block.timestamp`
5. Emits `ThresholdMet` event — challenge period begins

### 7.4 Challenge Phase

```
setup → initiate → support → challenge → execute
                                  ↑
```

- Owner monitors `RecoveryStarted` / `ThresholdMet` events
- Owner can call `cancelRecovery()` at any time while session is active
- Cancel clears session, increments nonce (invalidates all pending proofs)
- Recommended challenge period: 1-7 days

### 7.5 Execute Phase

```
setup → initiate → support → challenge → execute
                                             ↑
```

1. After `block.timestamp >= thresholdMetAt + challengePeriod`
2. And `block.timestamp < deadline`
3. Anyone calls `RecoveryManager.executeRecovery()`
4. Contract clears session, increments nonce
5. Calls `IWallet(wallet).setOwner(newOwner)`
6. `newOwner` now authorized on wallet

### 7.6 Expired Session Handling

- If deadline passes without execution, session is stuck
- Anyone calls `clearExpiredRecovery()` to clear it
- Prevents permanent lockout when owner has lost keys
- Nonce incremented, new recovery can begin

---

## 8. Cross-Layer Data Flows

### 8.1 EOA Proof Flow

```
SDK (EoaAdapter)                    Contract (RecoveryManager)
─────────────────                   ──────────────────────────
hashRecoveryIntent(intent)     →    EIP712Lib.hashTypedData(intent)
  ↓ (EIP-712 hash)                    ↓
walletClient.signTypedData()        _verifyEoaProof(identifier, hash, proof)
  ↓ (v, r, s)                        ↓
abi.encode(v, r, s)            →    ecrecover(hash, v, r, s) == guardian address
```

### 8.2 Passkey Proof Flow

```
SDK (PasskeyAdapter)                Contract (PasskeyVerifier)
────────────────────                ──────────────────────────
hashRecoveryIntent(intent)     →    intentHash (in challenge)
  ↓ (challenge bytes)                 ↓
navigator.credentials.get()         abi.decode(proof)
  ↓ (assertion)                       ↓
parseP256Signature(DER)             keccak256(pubKeyX||pubKeyY) == identifier?
  ↓ (r, s with low-S)                ↓
abi.encode(authData, json,          WebAuthn.verifySignature(challenge, ...)
  indices, r, s, pubKeyX, pubKeyY)
```

### 8.3 zkJWT Proof Flow

```
SDK (ZkJwtAdapter)                  Circuit (main.nr)              Contract (ZkJwtVerifier)
──────────────────                  ─────────────────              ────────────────────────
extractJwtInputs(jwt, jwk)    →    data, signature_limbs,    →    abi.decode(rawProof, limbs)
  ↓                                 pubkey_modulus_limbs            ↓
computeCommitment(email, salt) →    jwt.verify() [RSA check]       Build publicInputs[20]:
  ↓                                   ↓                              [0..17] = modulus limbs
intentHash % BN254            →    intent_hash (pub input)          [18] = hash % BN254
  ↓                                   ↓                              [19] = commitment
Noir.execute(inputs)                email_verified == true            ↓
  ↓                                   ↓                            honkVerifier.verify(
UltraHonkBackend.generateProof     commitment = Poseidon2(             rawProof, publicInputs)
  ↓                                   email_hash, salt)
abi.encode(rawProof, limbs[18])    → returned as public output
```

---

## 9. Security Model

### 9.1 Replay Protection (EIP-712)

All guardian proofs are bound to:
- **Wallet address** — Specific wallet only
- **Nonce** — Specific session only (incremented on completion/cancellation)
- **Deadline** — Time-bounded validity
- **Chain ID** — No cross-chain replay
- **RecoveryManager address** — No cross-contract replay

### 9.2 Threat Mitigations

| Threat | Mitigation |
|--------|------------|
| Guardian collusion | N-of-M threshold + challenge period |
| Single guardian compromise | Requires N guardians |
| Replay attacks | EIP-712 nonce + deadline + chainId + recoveryManager |
| Front-running | Proof bound to specific `newOwner` |
| Griefing (spam recovery) | Only guardians can start recovery |
| Signature malleability | Passkey: low-S canonicalization; EOA: ecrecover is unambiguous |
| Zero-hash attack (zkJWT) | Circuit constraint: `intent_hash != 0` |
| Stale session lockout | `clearExpiredRecovery()` callable by anyone after deadline |

### 9.3 Privacy Model

| Method | At Rest (on-chain) | During Recovery |
|--------|-------------------|-----------------|
| EOA | Address stored as identifier | Address revealed via ecrecover |
| Passkey | PubKey hash stored | PubKey revealed in proof calldata |
| zkJWT | Poseidon2 commitment only | Email NOT revealed (ZK proof) |

---

## 10. Deployment Architecture

### 10.1 Deployment Order

1. Deploy `HonkVerifier` (generated, largest contract)
2. Deploy `PasskeyVerifier` (singleton)
3. Deploy `ZkJwtVerifier(honkVerifier)` (singleton, wraps HonkVerifier)
4. Deploy `RecoveryManager` implementation (singleton, constructor marks as initialized)
5. Deploy `RecoveryManagerFactory(implementation, passkeyVerifier, zkJwtVerifier)`
6. Per wallet: `factory.deployRecoveryManager(wallet, guardians, threshold, challengePeriod)`

### 10.2 Gas Optimization

- **EIP-1167 Minimal Proxy:** 45-byte runtime per wallet (~100k deploy vs ~300k+ full contract)
- **Singleton Verifiers:** PasskeyVerifier and ZkJwtVerifier shared across all RecoveryManagers
- **Deploy Profile:** `optimizer_runs = 1` for HonkVerifier EIP-170 size limit compliance

---

## 11. Test Coverage

| Suite | Tests | Description |
|-------|-------|-------------|
| Contract: GuardianLib | Multiple | Identifier computation, validation, fuzzing |
| Contract: EIP712Lib | Multiple | Domain separator, struct hash, typed data hash |
| Contract: PasskeyVerifier | Multiple | Guardian type, identifier check, signature verification |
| Contract: ZkJwtVerifier | Multiple | Public inputs layout, field reduction, proof passthrough |
| Contract: RecoveryManager | ~90 | Full lifecycle: init, start, submit, execute, cancel, expire, policy |
| Contract: RecoveryManagerFactory | Multiple | Proxy deployment, initialization, mapping |
| SDK: eip712 | 40+ | Intent hashing, creation, validation |
| SDK: webauthn | 40+ | COSE parsing, DER signatures, low-S canonicalization |
| SDK: adapters | 91+ | EOA, Passkey, ZkJWT proof generation |
| SDK: e2e | Multiple | Full recovery flow against Anvil (EOA, Passkey, zkJWT) |
| Circuit: main.nr | 4 | Packing, commitment, uniqueness, intent_hash != 0 |

---

## Code References (consolidated)

| File | Lines | Description |
|------|-------|-------------|
| `contracts/src/RecoveryManager.sol` | 14-388 | Core contract: policy, sessions, proof routing, execution |
| `contracts/src/RecoveryManagerFactory.sol` | 10-71 | Factory: EIP-1167 proxy deployment |
| `contracts/src/verifiers/PasskeyVerifier.sol` | 11-69 | WebAuthn/P-256 verification via p256-verifier |
| `contracts/src/verifiers/ZkJwtVerifier.sol` | 18-69 | Honk ZK proof verification wrapper |
| `contracts/src/verifiers/HonkVerifier.sol` | 1-50+ | Auto-generated circuit verifier (~37KB) |
| `contracts/src/libraries/GuardianLib.sol` | 7-70 | Guardian types, identifiers, validation |
| `contracts/src/libraries/EIP712Lib.sol` | 9-111 | EIP-712 typed data hashing for RecoveryIntent |
| `contracts/src/interfaces/IRecoveryManager.sol` | 10-189 | Full interface specification |
| `contracts/src/interfaces/IVerifier.sol` | 7-23 | Common verifier interface |
| `contracts/src/interfaces/IWallet.sol` | 7-23 | Wallet integration interface |
| `sdk/src/types.ts` | 1-122 | TypeScript types mirroring Solidity |
| `sdk/src/constants.ts` | 1-89 | EIP-712 domain, addresses, defaults |
| `sdk/src/auth/AuthManager.ts` | 1-40 | Adapter registry (strategy pattern) |
| `sdk/src/auth/adapters/EoaAdapter.ts` | 1-80 | EOA EIP-712 signing |
| `sdk/src/auth/adapters/PasskeyAdapter.ts` | 1-100 | WebAuthn assertion + P-256 parsing |
| `sdk/src/auth/adapters/ZkJwtAdapter.ts` | 1-140 | Noir ZK proof generation |
| `sdk/src/auth/utils/eip712.ts` | 1-188 | Intent hashing and validation |
| `sdk/src/auth/utils/webauthn.ts` | 1-374 | WebAuthn, COSE, DER, low-S canonicalization |
| `sdk/src/auth/utils/zkjwt/poseidon.ts` | 1-94 | Barretenberg Poseidon2 hashing |
| `sdk/src/auth/utils/zkjwt/rsa.ts` | 1-76 | RSA limb splitting, Montgomery REDC |
| `sdk/src/auth/utils/zkjwt/jwt.ts` | 1-69 | JWT → circuit inputs extraction |
| `sdk/src/auth/utils/zkjwt/google-jwks.ts` | 1-45 | Google JWKS fetch |
| `sdk/src/auth/utils/zkjwt/circuit.ts` | 1-100 | Noir execution + UltraHonk proving |
| `sdk/src/recovery/RecoveryClient.ts` | 1-229 | Main SDK client orchestrating full flow |
| `sdk/src/recovery/PolicyBuilder.ts` | 1-88 | Fluent policy builder with validation |
| `sdk/src/contracts/FactoryContract.ts` | 1-89 | Typed viem factory wrapper |
| `sdk/src/contracts/RecoveryManagerContract.ts` | 1-228 | Typed viem RecoveryManager wrapper |
| `circuits/zkjwt/src/main.nr` | 1-177 | Noir circuit: JWT verify + Poseidon2 commitment |
| `circuits/zkjwt/Nargo.toml` | 1-8 | Circuit config: noir-jwt v0.5.1, poseidon v0.2.0 |
| `circuits/zkjwt/scripts/src/generate-prover.ts` | 1-151 | CLI for generating Prover.toml inputs |

---

## Open Questions

- None for this architectural overview. The codebase is well-documented with SPEC.md, ARCHITECTURE.md, CHECKLIST.md, and ROADMAP.md providing clear design rationale.
