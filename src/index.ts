import helpers from "./helpers/helpers";
import { preConditions } from "./utils/preConditions";
import { createWallet } from "./clients/walletsClient";
import { getPublicClient } from "./clients/publicClient";
import { Hex, type WalletClient, parseEther } from "viem";

const OWNER_7702_PRIVATE_KEY = process.env.OWNER_7702_PRIVATE_KEY as Hex;

const main = async () => {
    // Create Wallet Clients
    const owner7702Wallet: WalletClient = createWallet(OWNER_7702_PRIVATE_KEY, process.env.RPC_URL_ANVIL!);
    // Create Public Client 
    const publicClient = await getPublicClient();

    // Run pre-conditions
    await preConditions(publicClient);
    await helpers.sendEth(owner7702Wallet.account!.address, parseEther("10"), publicClient);

    // Balance Check
    const balance = await helpers.balanceChecker(owner7702Wallet.account!.address, publicClient);
    console.log(`Owner7702 Balance: ${balance} wei`);

    // Authorize 7702 Recovery
    await helpers.authorize(owner7702Wallet, publicClient);
    const hasCode = await helpers.__getCode(owner7702Wallet.account!.address, publicClient);
    console.log(`Code at Owner7702 Address: ${hasCode}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});