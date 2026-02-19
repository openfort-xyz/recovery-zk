import fs from "fs";
import path from "path";
import { foundry } from "viem/chains";
import helpers from "./helpers/helpers";
import { extractJwtInputs } from "./zkjwt/jwt";
import { preConditions } from "./utils/preConditions";
import { createWallet } from "./clients/walletsClient";
import { getPublicClient } from "./clients/publicClient";
import { Hex, type WalletClient, parseEther } from "viem";
import { deployRecoveryManager } from "./helpers/deployRecoveryManager";
import { decodeJwtHeader, decodeJwtPayload, fetchGoogleJwk } from "./zkjwt/google-jwks";
import { prepareCircuitInputs, generateZkJwtProof, BN254_SCALAR_FIELD_MODULUS } from "./zkjwt/circuit";
import { Guardian, GuardianType, KeyControl, KeyDataReg, KeyType, RecoveryIntent } from "./data/interfaces";
import { computeEoaIdentifier, computeZkJwtIdentifier, getGuardian, startRecovery, executeRecovery, encodeZkJwtProof } from "./helpers/guardiansHelper";

const OWNER_7702_PRIVATE_KEY = process.env.OWNER_7702_PRIVATE_KEY as Hex;
const NEW_OWNER_PRIVATE_KEY = process.env.NEW_OWNER_PRIVATE_KEY as Hex;

const THRESHOLD = 1n;
const CHALLENGE_PERIOD = 60n * 60n * 24n * 1n;

const GUARDIAN_EMAIL: string = 'alex@openfort.xyz';
const SALT: string = '0123456789';

const main = async () => {
    // Create Wallet Clients
    const owner7702Wallet: WalletClient = createWallet(OWNER_7702_PRIVATE_KEY, process.env.RPC_URL_ANVIL!);
    const newOwnerWallet: WalletClient = createWallet(NEW_OWNER_PRIVATE_KEY, process.env.RPC_URL_ANVIL!);

    // Create Public Client
    const publicClient = await getPublicClient();

    // Run pre-conditions
    await preConditions(publicClient);
    await helpers.sendEth(owner7702Wallet.account!.address, parseEther("10"), publicClient);

    // Authorize 7702 Recovery
    await helpers.authorize(owner7702Wallet, publicClient);

    // Deploy Recovery Manager with ZkJWT Guardian
    let guardians: Guardian[] = [];
    const guardianZkJwt = await getGuardian(GuardianType.ZkJWT, await computeZkJwtIdentifier(GUARDIAN_EMAIL, BigInt(SALT)));
    guardians.push(guardianZkJwt);

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
        validUntil: 281474976710655,
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

    // Generate zkJWT Proof
    const jwtPath = path.resolve(__dirname, "./data/jwt.json");
    const jwt: string = JSON.parse(fs.readFileSync(jwtPath, "utf-8")).jwt;

    const header = decodeJwtHeader(jwt);
    const jwk = await fetchGoogleJwk(header.kid);

    const payload = decodeJwtPayload(jwt);
    const email = payload.email as string;
    if (!email) throw new Error("JWT payload does not contain an 'email' claim.");
    if (email !== GUARDIAN_EMAIL) throw new Error(`JWT email (${email}) does not match GUARDIAN_EMAIL (${GUARDIAN_EMAIL}).`);

    const jwtInputs = extractJwtInputs(jwt, jwk, 900);
    const intentHashBigInt = BigInt(intentHash) % BN254_SCALAR_FIELD_MODULUS;
    const circuitInputs = prepareCircuitInputs(jwtInputs, email, BigInt(SALT), intentHashBigInt);

    const { rawProof } = await generateZkJwtProof(circuitInputs);
    const proof = encodeZkJwtProof(rawProof, jwtInputs.pubkeyModulusLimbs);

    // Check old keyData
    let keyData: KeyDataReg = await helpers.getKeyData(owner7702Wallet.account!.address);
    console.log(`Old Key Data: ${JSON.stringify(keyData)}`);

    // Start Recovery
    await startRecovery(proxyAddress, intent, 0n, proof);

    // Execute Recovery after challenge period
    await executeRecovery(proxyAddress);

    // Check new keyData
    keyData = await helpers.getKeyData(owner7702Wallet.account!.address);
    console.log(`New Key Data: ${JSON.stringify(keyData)}`);
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
