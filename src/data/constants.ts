import { Hex, keccak256, toHex } from "viem";

/// @notice EIP-712 domain name
const NAME: string = "SocialRecovery";

/// @notice EIP-712 domain version
const VERSION: string = "1";

/// @notice EIP-712 domain type hash
const DOMAIN_TYPEHASH: Hex = keccak256(
    toHex(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    )
);

/// @notice KeyDataReg type hash (referenced struct)
const KEY_DATA_REG_TYPEHASH: Hex = keccak256(
    toHex(
        "KeyDataReg(uint8 keyType,uint48 validUntil,uint48 validAfter,uint48 limits,bytes key,uint8 keyControl)"
    )
);

/// @notice RecoveryIntent type hash
/// @dev Per EIP-712, referenced struct types are appended in alphabetical order
const RECOVERY_INTENT_TYPEHASH: Hex = keccak256(
    toHex(
        "RecoveryIntent(address wallet,KeyDataReg newOwner,uint256 nonce,uint256 deadline,uint256 chainId,address recoveryManager)"
        + "KeyDataReg(uint8 keyType,uint48 validUntil,uint48 validAfter,uint48 limits,bytes key,uint8 keyControl)"
    )
);


export const EIP712 = {
    NAME,
    VERSION,
    DOMAIN_TYPEHASH,
    KEY_DATA_REG_TYPEHASH,
    RECOVERY_INTENT_TYPEHASH
}