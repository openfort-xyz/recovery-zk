import { Hex, keccak256, concat, pad, Address } from "viem";
import { Guardian, GuardianType } from "../data/interfaces";

export async function getGuardian(guardianType: GuardianType, identifier: Hex): Promise<Guardian> {
    return {
        guardianType,
        identifier,
    };
}

export async function computePasskeyIdentifier(pubKeyX: Hex, pubKeyY: Hex): Promise<Hex> {
    const concatenatedPubKey = concat([pubKeyX, pubKeyY]); 
    return keccak256(concatenatedPubKey);
}

export async function computeEoaIdentifier(address: Address): Promise<Hex> {
    return pad(address, { size: 32 });
}

export async function identifierToAddress(identifier: Hex): Promise<Address> {
    return identifier as Address;
}