import { Address, Hex } from "viem";

export enum GuardianType {
    EOA,
    Passkey,
    ZkJWT,
}

export enum KeyType {
    EOA,
    WEBAUTHN,
    P256,
    P256NONKEY
}

export enum KeyControl {
    Self,
    Custodial
}

export interface Guardian {
    guardianType: GuardianType;
    identifier: Hex;
}

export interface PubKey {
    x: Hex;
    y: Hex;
}

export interface KeyData {
    keyType: KeyType;
    isActive: boolean;
    masterKey: boolean;
    isDelegated: boolean;
    validUntil: number;
    validAfter: number;
    limits: number;
    key: Hex;
}

export interface KeyDataReg {
    keyType: KeyType;
    validUntil: number;
    validAfter: number;
    limits: number;
    key: Hex;
    keyControl: KeyControl;
}


export interface RecoveryIntent {
    wallet: Address;
    newOwner: KeyDataReg;
    nonce: bigint;
    deadline: bigint;
    chainId: bigint;
    recoveryManager: Address;
}

export interface PasskeyProof {
    authenticatorData: Hex;
    clientDataJSON: string;
    challengeLocation: bigint;
    responseTypeLocation: bigint;
    r: bigint;
    s: bigint;
    x: bigint;
    y: bigint;
}