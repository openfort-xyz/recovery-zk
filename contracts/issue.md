# [Bug] Permissionless `deployRecoveryManager()` enables permanent DOS via mapping poisoning

## Description

`RecoveryManagerFactory.deployRecoveryManager()` has no access control — any address can call it for any `_wallet` parameter. Combined with the write-once `getRecoveryManager` mapping and the `AlreadyDeployed()` guard, this allows an attacker to permanently block a wallet from deploying a RecoveryManager through the factory.

## Steps to Reproduce

1. Attacker calls `factory.deployRecoveryManager(victimWallet, attackerGuardians, 1, 0)`
2. `getRecoveryManager[victimWallet]` is now set to the attacker's proxy
3. Victim calls `factory.deployRecoveryManager(victimWallet, legitimateGuardians, 2, 86400)`
4. Transaction reverts with `AlreadyDeployed()`
5. Victim retries — reverts again. No function exists to clear or reset the mapping.

The attacker does **not** need to monitor the mempool. They can proactively poison any known wallet address before the owner ever attempts to deploy. Batch-poisoning hundreds of wallets costs only ~100k gas each.

## Root Cause

Three properties in `RecoveryManagerFactory.sol` combine:

1. **No `msg.sender` check** — `deployRecoveryManager()` is fully permissionless (line 34)
2. **Write-once mapping** — `getRecoveryManager[_wallet]` is set at line 53 with no delete/reset function
3. **`AlreadyDeployed()` guard** — Line 43 permanently blocks any second deployment for the same wallet

## Impact

- **Permanent DOS** per wallet per factory instance — irreversible, no on-chain recovery path
- **No fund loss** — the attacker cannot take control of the wallet because `executeRecovery()` calls `IRecovery(wallet).setOwner()` which requires wallet-side authorization via `isRecoveryAuthorized()`
- **Low cost, high scalability** — attacker spends ~100k gas per wallet, can pre-poison in bulk
- **Workaround exists but breaks UX** — victim must deploy a new factory or manually deploy a proxy outside the factory

## Severity

Medium — no fund loss, but permanent DOS of the canonical factory for targeted wallets with no on-chain remediation.

## Suggested Fix

Require wallet owner authorization before deployment. Two options:

**Option A — `msg.sender` check:**
```solidity
if (msg.sender != _wallet && msg.sender != IRecovery(_wallet).owner()) revert Unauthorized();
```

**Option B — EIP-712 signed authorization (recommended):**

Add an `ownerSignature` parameter. The wallet owner signs an EIP-712 `DeployAuthorization` struct binding the exact `guardiansHash`, `threshold`, `challengePeriod`, `nonce`, `chainId`, and `factory` address. The factory verifies the signature on-chain before deploying. This is front-run resistant (attacker cannot substitute parameters without invalidating the signature) and relayer-compatible (owner does not need to submit the tx directly).

## POC

A Foundry test suite demonstrating the attack is available at `test/POC/FrontRunDeployRecoveryManager.t.sol` with three test cases:

- `test_POC_attackerFrontRunsPoisonsMapping` — attacker front-runs, victim permanently blocked
- `test_POC_attackerPreEmptivelyPoisonsWallet` — attacker pre-poisons without mempool monitoring
- `test_POC_attackerCannotTakeOverWallet` — confirms attacker cannot take wallet ownership despite controlling the proxy's guardians
