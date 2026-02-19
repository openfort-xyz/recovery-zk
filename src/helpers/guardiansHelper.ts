import { foundry } from "viem/chains";
import { ABI_RECOVERY_MANAGER } from "@/data/abis";
import { anvilClient } from "@/clients/anvilClient";
import { Guardian, GuardianType, RecoveryIntent, PasskeyProof } from "../data/interfaces";
import { Hex, keccak256, concat, pad, toHex, Address, type WalletClient, encodeFunctionData, encodeAbiParameters } from "viem";
import { initBarretenberg, computeCommitment } from "../zkjwt/poseidon";

export async function getGuardian(guardianType: GuardianType, identifier: Hex): Promise<Guardian> {
    return {
        guardianType,
        identifier,
    };
}

export async function computePasskeyIdentifier(pubKeyX: Hex, pubKeyY: Hex): Promise<Hex> {
    const concatenatedPubKey = concat([pubKeyX, pubKeyY]);
    return keccak256(concatenatedPubKey);
}

export async function computeEoaIdentifier(address: Address): Promise<Hex> {
    return pad(address, { size: 32 });
}

export async function computeZkJwtIdentifier(email: string, salt: bigint): Promise<Hex> {
    const bb = await initBarretenberg();
    const commitment = computeCommitment(bb, email, salt);
    return `0x${commitment.toString().replace("0x", "").padStart(64, "0")}` as Hex;
}

export async function identifierToAddress(identifier: Hex): Promise<Address> {
    return identifier as Address;
}

export async function startRecovery(
    recoveryManagerAddress: Address,
    intent: RecoveryIntent,
    guardianIndex: bigint,
    proof: Hex
) {
    const data = encodeFunctionData({
        abi: ABI_RECOVERY_MANAGER,
        functionName: 'startRecovery',
        args: [intent, guardianIndex, proof],
    });

    const txHash = await anvilClient.sendTransaction({
        account: anvilClient.account!,
        chain: foundry,
        to: recoveryManagerAddress,
        data
    });
    await anvilClient.waitForTransactionReceipt({ hash: txHash });

    console.log(`Recovery started by guardian at index ${guardianIndex} with proof ${proof}`);
}

export async function executeRecovery(recoveryManagerAddress: Address) {
    await anvilClient.request({ method: "evm_increaseTime" as any, params: [86401] } as any);
    await anvilClient.request({ method: "evm_mine" as any, params: [] } as any);

    const data = encodeFunctionData({
        abi: ABI_RECOVERY_MANAGER,
        functionName: 'executeRecovery',
        args: [],
    });

    const txHash = await anvilClient.sendTransaction({
        account: anvilClient.account!,
        chain: foundry,
        to: recoveryManagerAddress,
        data
    });
    await anvilClient.waitForTransactionReceipt({ hash: txHash });

    console.log(`Recovery executed at ${recoveryManagerAddress}`);
}

export function encodePasskeyProof(passkeyProof: PasskeyProof): Hex {
    return encodeAbiParameters(
        [
            { type: "bytes" },
            { type: "string" },
            { type: "uint256" },
            { type: "uint256" },
            { type: "uint256" },
            { type: "uint256" },
            { type: "uint256" },
            { type: "uint256" },
        ],
        [
            passkeyProof.authenticatorData,
            passkeyProof.clientDataJSON,
            passkeyProof.challengeLocation,
            passkeyProof.responseTypeLocation,
            passkeyProof.r,
            passkeyProof.s,
            passkeyProof.x,
            passkeyProof.y,
        ]
    );
}

export function encodeZkJwtProof(rawProof: Uint8Array, pubkeyModulusLimbs: bigint[]): Hex {
    const modulusLimbs = pubkeyModulusLimbs.map(
        (limb) => pad(toHex(limb), { size: 32 })
    ) as [Hex, ...Hex[]];

    return encodeAbiParameters(
        [{ type: "bytes" }, { type: "bytes32[18]" }],
        [toHex(rawProof), modulusLimbs],
    );
}