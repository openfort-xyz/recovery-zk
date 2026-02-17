import { Guardian } from "../data/interfaces";
import { addressBook } from "@/data/addressBook";
import { ABI_RECOVERY_FACTORY } from "@/data/abis";
import { Address } from "viem";
import { anvilClient } from "../clients/anvilClient";

export async function deployRecoveryManager(
    wallet: Address,
    guardians: Guardian[],
    threshold: bigint,
    challengePeriod: bigint
): Promise<Address> {
    const { result: proxyAddress, request } = await anvilClient.simulateContract({
        account: anvilClient.account!,
        address: addressBook.RECOVERY_FACTORY,
        abi: ABI_RECOVERY_FACTORY,
        functionName: 'deployRecoveryManager',
        args: [wallet, guardians, threshold, challengePeriod],
    });

    const txHash = await anvilClient.writeContract(request);
    await anvilClient.waitForTransactionReceipt({ hash: txHash });

    console.log(`RecoveryManager deployed for ${wallet} at ${proxyAddress}`);
    return proxyAddress as Address;
}
