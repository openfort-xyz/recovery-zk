import { Hex } from "viem";

export enum GuardianType {
    EOA,
    Passkey,
    ZkJWT,
}

export interface Guardian {
    guardianType: GuardianType;
    identifier: Hex; 
}
