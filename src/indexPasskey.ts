import { foundry } from "viem/chains";
import helpers from "./helpers/helpers";
import { preConditions } from "./utils/preConditions";
import { createWallet } from "./clients/walletsClient";
import { getPublicClient } from "./clients/publicClient";
import { Address, Hex, type WalletClient, parseEther } from "viem";
import { deployRecoveryManager } from "./helpers/deployRecoveryManager";
import { Guardian, KeyControl, KeyDataReg, KeyType, RecoveryIntent, PasskeyProof } from "./data/interfaces";
import { computePasskeyIdentifier, computeEoaIdentifier, getGuardian, startRecovery, executeRecovery, encodePasskeyProof } from "./helpers/guardiansHelper";

const OWNER_7702_PRIVATE_KEY = process.env.OWNER_7702_PRIVATE_KEY as Hex;
const GUARDIAN_EOA_PRIVATE_KEY = process.env.GUARDIAN_EOA as Hex;
const NEW_OWNER_PRIVATE_KEY = process.env.NEW_OWNER_PRIVATE_KEY as Hex;

const THRESHOLD = 1n;
const CHALLENGE_PERIOD = 60n * 60n * 24n * 1n;

const coordinates = {
    x: "0x0b72f31725093a6ea013ef098b0a152a8e1f82bc5309f0d9067af2c34ea31b52" as Hex,
    y: "0x30956aded980dd91e2f454d2855c993708f942ba2fc1c81adb729fa97d5b0795" as Hex,
}

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

    const guarnianPasskey = await getGuardian(1, await computePasskeyIdentifier(coordinates.x, coordinates.y));
    guardians.push(guarnianPasskey);

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

    const deadline = 1771500076n;

    // const proxyAddress = '0x850019d58757bc6dC33b8cBE7Bd7e0f1d8c5BF8a';
    
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

    const passkeyProof: PasskeyProof = {
        authenticatorData: '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631d00000000',
        clientDataJSON: '{\"type\":\"webauthn.get\",\"challenge\":\"Sz11fQcA07Mo5Oz5h9lMz7TIQMoa_MoXYy9B5P1KeUo\",\"origin\":\"http://localhost:3000\",\"crossOrigin\":false,\"other_keys_can_be_added_here\":\"do not compare clientDataJSON against a template. See https://goo.gl/yabPex\"}',
        challengeLocation: 23n,
        responseTypeLocation: 1n,
        r: BigInt("0x5093dda483a35e808ff2d01de8f72f11e3fd143b36b6b37197f4f0f5b2a2b8a9"),
        s: BigInt("0x17cd6a420172208c4df7fc91ec4d4a555eacac970a5645f72557b9020a6fdb4c"),
        x: BigInt(coordinates.x),
        y: BigInt(coordinates.y),
    };

    const proof = encodePasskeyProof(passkeyProof);
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