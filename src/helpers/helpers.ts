import { foundry } from "viem/chains";
import { EIP712 } from "@/data/constants";
import { ABI_SIMPLE_7702 } from "@/data/abis";
import { addressBook } from "../data/addressBook";
import { anvilClient } from "../clients/anvilClient";
import { KeyDataReg, RecoveryIntent } from "@/data/interfaces";
import { Address, Hex, formatEther, type PublicClient, type GetBalanceReturnType, type WalletClient, type SignAuthorizationReturnType, encodeFunctionData, encodeAbiParameters, hashTypedData as viemHashTypedData } from "viem";

const EIP712_DOMAIN = {
    name: EIP712.NAME,
    version: EIP712.VERSION,
} as const;

const EIP712_TYPES = {
    RecoveryIntent: [
        { name: "wallet", type: "address" },
        { name: "newOwner", type: "KeyDataReg" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
        { name: "chainId", type: "uint256" },
        { name: "recoveryManager", type: "address" },
    ],
    KeyDataReg: [
        { name: "keyType", type: "uint8" },
        { name: "validUntil", type: "uint48" },
        { name: "validAfter", type: "uint48" },
        { name: "limits", type: "uint48" },
        { name: "key", type: "bytes" },
        { name: "keyControl", type: "uint8" },
    ],
} as const;

export async function __getCode(address: Address, publicClient: PublicClient): Promise<boolean> {
    const code = await publicClient.getCode({ address });
    const hasCode = code !== undefined && code !== "0x" && code !== null;
    return hasCode;
}

export async function authorize(wallet: WalletClient, client: PublicClient) {
    const authorization: SignAuthorizationReturnType = await wallet.signAuthorization({
        account: wallet.account!,
        contractAddress: addressBook.SIMPLE7702_RECOVERY as Address,
    });

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

export async function authorizeRecoveryManager(wallet: WalletClient, account: Address) {
    const data = encodeFunctionData({
        abi: ABI_SIMPLE_7702,
        functionName: 'authorizeRecoveryManager',
        args: [account],
    });

    const txHash = await wallet.sendTransaction({
        account: wallet.account!,
        chain: foundry,
        to: wallet.account!.address,
        data
    });
    await anvilClient.waitForTransactionReceipt({ hash: txHash });

    console.log(`RecoveryManager authorized for ${wallet.account!.address}`);
}

function _eip712Params(intent: RecoveryIntent) {
    return {
        domain: { ...EIP712_DOMAIN, chainId: Number(intent.chainId), verifyingContract: intent.recoveryManager },
        types: EIP712_TYPES,
        primaryType: "RecoveryIntent" as const,
        message: {
            wallet: intent.wallet,
            newOwner: {
                keyType: intent.newOwner.keyType,
                validUntil: intent.newOwner.validUntil,
                validAfter: intent.newOwner.validAfter,
                limits: intent.newOwner.limits,
                key: intent.newOwner.key,
                keyControl: intent.newOwner.keyControl,
            },
            nonce: intent.nonce,
            deadline: intent.deadline,
            chainId: intent.chainId,
            recoveryManager: intent.recoveryManager,
        },
    };
}

export function hashTypedData(intent: RecoveryIntent): Hex {
    return viemHashTypedData(_eip712Params(intent));
}

export async function signIntent(wallet: WalletClient, intent: RecoveryIntent): Promise<Hex> {
    const sig = await wallet.signTypedData({
        account: wallet.account!,
        ..._eip712Params(intent),
    });

    const r = `0x${sig.slice(2, 66)}` as Hex;
    const s = `0x${sig.slice(66, 130)}` as Hex;
    const v = parseInt(sig.slice(130, 132), 16);

    return encodeAbiParameters(
        [{ type: "uint8" }, { type: "bytes32" }, { type: "bytes32" }],
        [v, r, s]
    );
}

export async function balanceChecker(address: Address, publicClient: PublicClient): Promise<GetBalanceReturnType> {
    return await publicClient.getBalance({ address });
}

export async function  getKeyData(address: Address): Promise<KeyDataReg> {
    return await anvilClient.readContract({
        address,
        abi: ABI_SIMPLE_7702,
        functionName: 'keyData',
        args: [],
    }) as unknown as KeyDataReg;
}

const helpers = {
    __getCode,
    authorize,
    sendEth,
    authorizeRecoveryManager,
    hashTypedData,
    signIntent,
    balanceChecker,
    getKeyData, 
}

export default helpers;
