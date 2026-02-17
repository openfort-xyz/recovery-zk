import { foundry } from "viem/chains";
import { anvilClient } from "../clients/anvilClient";
import { Address, formatEther, type PublicClient, type GetBalanceReturnType } from "viem";

export async function sendEth(to: Address, amount: bigint, client: PublicClient) {
    try {
        const txHash = await anvilClient.sendTransaction({ account: anvilClient.account!, chain: foundry, to, value: amount });
        const receipt = await client.waitForTransactionReceipt({ hash: txHash });

        if (receipt.status === "success") {
            console.log(`Transferred ${formatEther(amount)} ETH to ${to} : TX Hash: ${txHash}`);
            const balance = await client.getBalance({ address: to });
            console.log(`New Balance of ${to}: ${formatEther(balance)} ETH`);
        } else {
            throw new Error(`Transaction failed: ${txHash}`);
        }
    } catch (error) {
        console.error("Error sending ETH:", error);
    }
}

export async function balanceChecker(address: Address, publicClient: PublicClient): Promise<GetBalanceReturnType> {
    return await publicClient.getBalance({ address });
}