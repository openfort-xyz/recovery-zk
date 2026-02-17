import "dotenv/config";
import { foundry } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, Hex, http, type WalletClient, publicActions } from "viem";

export function createWallet(privateKey: Hex, rpcUrl: string): WalletClient {
    return createWalletClient({
        account: privateKeyToAccount(privateKey),
        chain: foundry,
        transport: http(rpcUrl),
    }).extend(publicActions);
}
