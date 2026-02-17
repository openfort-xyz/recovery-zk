import "dotenv/config";
import { foundry } from "viem/chains";
import { execSync } from "child_process";
import { addressBook } from "../data/addressBook";
import { anvilClient } from "../clients/anvilClient";
import { Address, formatEther, parseEther, type PublicClient } from "viem";

async function __getCode(address: Address, publicClient: PublicClient): Promise<boolean> {
    const code = await publicClient.getCode({ address });
    const hasCode = code !== undefined && code !== "0x" && code !== null;
    return hasCode;
}

async function _deployPasskeyVerifier(publicClient: PublicClient) {
    if (await __getCode(addressBook.PASSKEY_VERIFIER, publicClient)) {
        return;
    }
    try {
        const output = execSync("make deploy-passkey-verifier", { encoding: "utf-8", cwd: process.cwd() });
        console.log(output);
    } catch (error: any) {
        console.error("❌ Failed to deploy passkey-verifier:", error.message);
        throw error;
    }
}

async function _deployHonkVerifier(publicClient: PublicClient) {
    if (await __getCode(addressBook.HONK_VERIFIER, publicClient)) {
        return;
    }
    try {
        const output = execSync("make deploy-honk-verifier", { encoding: "utf-8", cwd: process.cwd() });
        console.log(output);
    } catch (error: any) {
        console.error("❌ Failed to deploy honk-verifier:", error.message);
        throw error;
    }
}

async function _deployZkJwtVerifier(publicClient: PublicClient) {
    if (await __getCode(addressBook.ZKJWT_VERIFIER, publicClient)) {
        return;
    }
    try {
        const output = execSync("make deploy-zkjwt-verifier", { encoding: "utf-8", cwd: process.cwd() });
        console.log(output);
    } catch (error: any) {
        console.error("❌ Failed to deploy zkjwt-verifier:", error.message);
        throw error;
    }
}

async function _deployRecoveryManager(publicClient: PublicClient) {
    if (await __getCode(addressBook.RECOVERY_MANAGER, publicClient)) {
        return;
    }
    try {
        const output = execSync("make deploy-recovery-manager", { encoding: "utf-8", cwd: process.cwd() });
        console.log(output);
    } catch (error: any) {
        console.error("❌ Failed to deploy recovery-manager:", error.message);
        throw error;
    }
}

async function _deployRecoveryFactory(publicClient: PublicClient) {
    if (await __getCode(addressBook.RECOVERY_FACTORY, publicClient)) {
        return;
    }
    try {
        const output = execSync("make deploy-recovery-factory", { encoding: "utf-8", cwd: process.cwd() });
        console.log(output);
    } catch (error: any) {
        console.error("❌ Failed to deploy recovery-factory:", error.message);
        throw error;
    }
}

async function _deploySimple7702Recovery(publicClient: PublicClient) {
    if (await __getCode(addressBook.SIMPLE7702_RECOVERY, publicClient)) {
        return;
    }
    try {
        const output = execSync("make deploy-simple7702-recovery", { encoding: "utf-8", cwd: process.cwd() });
        console.log(output);
    } catch (error: any) {
        console.error("❌ Failed to deploy simple7702-recovery:", error.message);
        throw error;
    }
}

async function deployContracts(publicClient: PublicClient) {
    // Deploy contracts in order
    await _deployPasskeyVerifier(publicClient);
    await _deployHonkVerifier(publicClient);
    await _deployZkJwtVerifier(publicClient);
    await _deployRecoveryManager(publicClient);
    await _deployRecoveryFactory(publicClient);
    await _deploySimple7702Recovery(publicClient);

    console.log("🎉 All contracts deployed successfully!");
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

export async function preConditions(publicClient: PublicClient) {
    await deployContracts(publicClient);
}