import { foundry } from "viem/chains";
import helpers from "./helpers/helpers";
import { preConditions } from "./utils/preConditions";
import { createWallet } from "./clients/walletsClient";
import { getPublicClient } from "./clients/publicClient";
import { Address, Hex, type WalletClient, parseEther } from "viem";
import { deployRecoveryManager } from "./helpers/deployRecoveryManager";
import { Guardian, KeyControl, KeyDataReg, KeyType, RecoveryIntent } from "./data/interfaces";
import { computeEoaIdentifier, getGuardian, startRecovery, executeRecovery } from "./helpers/guardiansHelper";

const OWNER_7702_PRIVATE_KEY = process.env.OWNER_7702_PRIVATE_KEY as Hex;
const GUARDIAN_EOA_PRIVATE_KEY = process.env.GUARDIAN_EOA as Hex;
const NEW_OWNER_PRIVATE_KEY = process.env.NEW_OWNER_PRIVATE_KEY as Hex;

const THRESHOLD = 1n;
const CHALLENGE_PERIOD = 60n * 60n * 24n * 1n;

const main = async () => {
    // Create Wallet Clients
    const owner7702Wallet: WalletClient = createWallet(OWNER_7702_PRIVATE_KEY, process.env.RPC_URL_ANVIL!);
    const guardianEOAWallet: WalletClient = createWallet(GUARDIAN_EOA_PRIVATE_KEY, process.env.RPC_URL_ANVIL!);
    const newOwnerWallet: WalletClient = createWallet(NEW_OWNER_PRIVATE_KEY, process.env.RPC_URL_ANVIL!);

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

    // Deploy Recovery Manager
    let guardians: Guardian[] = [];

    const guarnianEOA = await getGuardian(0, await computeEoaIdentifier(guardianEOAWallet.account!.address as Address));
    guardians.push(guarnianEOA);

    const proxyAddress = await deployRecoveryManager(
        owner7702Wallet.account!.address,
        guardians,
        THRESHOLD,
        CHALLENGE_PERIOD
    );

    console.log(`Recovery Manager deployed at: ${proxyAddress}`);

    // Authorize Recovery Manager
    await helpers.authorizeRecoveryManager(owner7702Wallet, proxyAddress);

    // Recovery Intent
    const newOwnerKeyDataReg: KeyDataReg = {
        keyType: KeyType.EOA,
        validUntil: 281474976710655, // Max value for uint48
        validAfter: 0,
        limits: 0,
        key: await computeEoaIdentifier(newOwnerWallet.account!.address),
        keyControl: KeyControl.Self,
    };

    const now = BigInt(Math.floor(Date.now() / 1000));
    const deadline = now + CHALLENGE_PERIOD + 3600n;

    const intent: RecoveryIntent = {
        wallet: owner7702Wallet.account!.address,
        newOwner: newOwnerKeyDataReg,
        nonce: 0n,
        deadline: deadline,
        chainId: BigInt(foundry.id),
        recoveryManager: proxyAddress
    };

    const intentHash = helpers.hashTypedData(intent);
    console.log(`Intent Hash: ${intentHash}`);

    const proof = await helpers.signIntent(guardianEOAWallet, intent);
    console.log(`Guardian Proof: ${proof}`); 

    // Check old keyData
    let keyData: KeyDataReg = await helpers.getKeyData(owner7702Wallet.account!.address);
    console.log(`Old Key Data: ${JSON.stringify(keyData)}`);

    // Start Recovery Process (this will be challenged after the challenge period)
    await startRecovery(proxyAddress, intent, 0n, proof);

    // Execute Recovery after challenge period (for testing purposes, we will execute immediately)
    await executeRecovery(proxyAddress);

    // Check new keyData
    keyData = await helpers.getKeyData(owner7702Wallet.account!.address);
    console.log(`New Key Data: ${JSON.stringify(keyData)}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});