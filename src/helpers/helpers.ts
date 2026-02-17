import { foundry } from "viem/chains";
import { addressBook } from "../data/addressBook";
import { anvilClient } from "../clients/anvilClient";
import { Address, formatEther, type PublicClient, type GetBalanceReturnType, type WalletClient, type SignAuthorizationReturnType } from "viem";

export async function __getCode(address: Address, publicClient: PublicClient): Promise<boolean> {
    const code = await publicClient.getCode({ address });
    const hasCode = code !== undefined && code !== "0x" && code !== null;
    return hasCode;
}

export async function authorize(wallet: WalletClient, client: PublicClient) {
    // Owner signs the authorization (delegates their EOA code to SIMPLE7702_RECOVERY)
    const authorization: SignAuthorizationReturnType = await wallet.signAuthorization({
        account: wallet.account!,
        contractAddress: addressBook.SIMPLE7702_RECOVERY as Address,
    });

    // A separate relayer sends the type-4 tx.
    // When sender == authority, the sender's nonce is bumped before the authorization
    // list is processed, causing a nonce mismatch. Using a different sender avoids this.
    const txHash = await anvilClient.sendTransaction({
        account: anvilClient.account!,
        chain: foundry,
        authorizationList: [authorization],
        to: wallet.account!.address,
    });

    const receipt = await client.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status === "success") {
        console.log(`7702 Authorization set for ${wallet.account!.address} → ${addressBook.SIMPLE7702_RECOVERY}`);
        console.log(`TX Hash: ${txHash}`);
    } else {
        throw new Error(`Authorization transaction failed: ${txHash}`);
    }
}

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

const helpers = {
    __getCode,
    authorize,
    sendEth,
    balanceChecker,
}

export default helpers;