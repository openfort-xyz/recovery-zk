export const ABI_RECOVERY_MANAGER =
    [
        {
            "type": "constructor",
            "inputs": [

            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "cancelRecovery",
            "inputs": [

            ],
            "outputs": [

            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "challengePeriod",
            "inputs": [

            ],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "clearExpiredRecovery",
            "inputs": [

            ],
            "outputs": [

            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "executeRecovery",
            "inputs": [

            ],
            "outputs": [

            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "getGuardian",
            "inputs": [
                {
                    "name": "index",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "tuple",
                    "internalType": "struct GuardianLib.Guardian",
                    "components": [
                        {
                            "name": "guardianType",
                            "type": "uint8",
                            "internalType": "enum GuardianLib.GuardianType"
                        },
                        {
                            "name": "identifier",
                            "type": "bytes32",
                            "internalType": "bytes32"
                        }
                    ]
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getSession",
            "inputs": [

            ],
            "outputs": [
                {
                    "name": "intentHash",
                    "type": "bytes32",
                    "internalType": "bytes32"
                },
                {
                    "name": "newOwner",
                    "type": "tuple",
                    "internalType": "struct IKey.KeyDataReg",
                    "components": [
                        {
                            "name": "keyType",
                            "type": "uint8",
                            "internalType": "enum IKey.KeyType"
                        },
                        {
                            "name": "validUntil",
                            "type": "uint48",
                            "internalType": "uint48"
                        },
                        {
                            "name": "validAfter",
                            "type": "uint48",
                            "internalType": "uint48"
                        },
                        {
                            "name": "limits",
                            "type": "uint48",
                            "internalType": "uint48"
                        },
                        {
                            "name": "key",
                            "type": "bytes",
                            "internalType": "bytes"
                        },
                        {
                            "name": "keyControl",
                            "type": "uint8",
                            "internalType": "enum IKey.KeyControl"
                        }
                    ]
                },
                {
                    "name": "deadline",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "thresholdMetAt",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "approvalCount",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "guardianCount",
            "inputs": [

            ],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "hasApproved",
            "inputs": [
                {
                    "name": "guardianIdentifier",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "initialize",
            "inputs": [
                {
                    "name": "_wallet",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "guardians",
                    "type": "tuple[]",
                    "internalType": "struct GuardianLib.Guardian[]",
                    "components": [
                        {
                            "name": "guardianType",
                            "type": "uint8",
                            "internalType": "enum GuardianLib.GuardianType"
                        },
                        {
                            "name": "identifier",
                            "type": "bytes32",
                            "internalType": "bytes32"
                        }
                    ]
                },
                {
                    "name": "_threshold",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_challengePeriod",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_passkeyVerifier",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_zkJwtVerifier",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [

            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "isRecoveryActive",
            "inputs": [

            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "nonce",
            "inputs": [

            ],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "passkeyVerifier",
            "inputs": [

            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "contract IVerifier"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "startRecovery",
            "inputs": [
                {
                    "name": "intent",
                    "type": "tuple",
                    "internalType": "struct EIP712Lib.RecoveryIntent",
                    "components": [
                        {
                            "name": "wallet",
                            "type": "address",
                            "internalType": "address"
                        },
                        {
                            "name": "newOwner",
                            "type": "tuple",
                            "internalType": "struct IKey.KeyDataReg",
                            "components": [
                                {
                                    "name": "keyType",
                                    "type": "uint8",
                                    "internalType": "enum IKey.KeyType"
                                },
                                {
                                    "name": "validUntil",
                                    "type": "uint48",
                                    "internalType": "uint48"
                                },
                                {
                                    "name": "validAfter",
                                    "type": "uint48",
                                    "internalType": "uint48"
                                },
                                {
                                    "name": "limits",
                                    "type": "uint48",
                                    "internalType": "uint48"
                                },
                                {
                                    "name": "key",
                                    "type": "bytes",
                                    "internalType": "bytes"
                                },
                                {
                                    "name": "keyControl",
                                    "type": "uint8",
                                    "internalType": "enum IKey.KeyControl"
                                }
                            ]
                        },
                        {
                            "name": "nonce",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "deadline",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "chainId",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "recoveryManager",
                            "type": "address",
                            "internalType": "address"
                        }
                    ]
                },
                {
                    "name": "guardianIndex",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "proof",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ],
            "outputs": [

            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "submitProof",
            "inputs": [
                {
                    "name": "guardianIndex",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "proof",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ],
            "outputs": [

            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "threshold",
            "inputs": [

            ],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "updatePolicy",
            "inputs": [
                {
                    "name": "newGuardians",
                    "type": "tuple[]",
                    "internalType": "struct GuardianLib.Guardian[]",
                    "components": [
                        {
                            "name": "guardianType",
                            "type": "uint8",
                            "internalType": "enum GuardianLib.GuardianType"
                        },
                        {
                            "name": "identifier",
                            "type": "bytes32",
                            "internalType": "bytes32"
                        }
                    ]
                },
                {
                    "name": "newThreshold",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "newChallengePeriod",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [

            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "wallet",
            "inputs": [

            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "zkJwtVerifier",
            "inputs": [

            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "contract IVerifier"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "event",
            "name": "PolicyUpdated",
            "inputs": [
                {
                    "name": "wallet",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "ProofSubmitted",
            "inputs": [
                {
                    "name": "intentHash",
                    "type": "bytes32",
                    "indexed": true,
                    "internalType": "bytes32"
                },
                {
                    "name": "guardianIdentifier",
                    "type": "bytes32",
                    "indexed": true,
                    "internalType": "bytes32"
                },
                {
                    "name": "approvalCount",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "RecoveryCancelled",
            "inputs": [
                {
                    "name": "intentHash",
                    "type": "bytes32",
                    "indexed": true,
                    "internalType": "bytes32"
                },
                {
                    "name": "wallet",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "RecoveryExecuted",
            "inputs": [
                {
                    "name": "intentHash",
                    "type": "bytes32",
                    "indexed": true,
                    "internalType": "bytes32"
                },
                {
                    "name": "wallet",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "newOwner",
                    "type": "tuple",
                    "indexed": false,
                    "internalType": "struct IKey.KeyDataReg",
                    "components": [
                        {
                            "name": "keyType",
                            "type": "uint8",
                            "internalType": "enum IKey.KeyType"
                        },
                        {
                            "name": "validUntil",
                            "type": "uint48",
                            "internalType": "uint48"
                        },
                        {
                            "name": "validAfter",
                            "type": "uint48",
                            "internalType": "uint48"
                        },
                        {
                            "name": "limits",
                            "type": "uint48",
                            "internalType": "uint48"
                        },
                        {
                            "name": "key",
                            "type": "bytes",
                            "internalType": "bytes"
                        },
                        {
                            "name": "keyControl",
                            "type": "uint8",
                            "internalType": "enum IKey.KeyControl"
                        }
                    ]
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "RecoveryStarted",
            "inputs": [
                {
                    "name": "intentHash",
                    "type": "bytes32",
                    "indexed": true,
                    "internalType": "bytes32"
                },
                {
                    "name": "wallet",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "newOwner",
                    "type": "tuple",
                    "indexed": false,
                    "internalType": "struct IKey.KeyDataReg",
                    "components": [
                        {
                            "name": "keyType",
                            "type": "uint8",
                            "internalType": "enum IKey.KeyType"
                        },
                        {
                            "name": "validUntil",
                            "type": "uint48",
                            "internalType": "uint48"
                        },
                        {
                            "name": "validAfter",
                            "type": "uint48",
                            "internalType": "uint48"
                        },
                        {
                            "name": "limits",
                            "type": "uint48",
                            "internalType": "uint48"
                        },
                        {
                            "name": "key",
                            "type": "bytes",
                            "internalType": "bytes"
                        },
                        {
                            "name": "keyControl",
                            "type": "uint8",
                            "internalType": "enum IKey.KeyControl"
                        }
                    ]
                },
                {
                    "name": "deadline",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "ThresholdMet",
            "inputs": [
                {
                    "name": "intentHash",
                    "type": "bytes32",
                    "indexed": true,
                    "internalType": "bytes32"
                },
                {
                    "name": "thresholdMetAt",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "error",
            "name": "AlreadyInitialized",
            "inputs": [

            ]
        },
        {
            "type": "error",
            "name": "ChallengePeriodNotElapsed",
            "inputs": [

            ]
        },
        {
            "type": "error",
            "name": "DeadlineNotReached",
            "inputs": [

            ]
        },
        {
            "type": "error",
            "name": "GuardianAlreadyApproved",
            "inputs": [

            ]
        },
        {
            "type": "error",
            "name": "GuardianNotFound",
            "inputs": [

            ]
        },
        {
            "type": "error",
            "name": "IntentExpired",
            "inputs": [

            ]
        },
        {
            "type": "error",
            "name": "InvalidIntent",
            "inputs": [

            ]
        },
        {
            "type": "error",
            "name": "InvalidPolicy",
            "inputs": [

            ]
        },
        {
            "type": "error",
            "name": "InvalidProof",
            "inputs": [

            ]
        },
        {
            "type": "error",
            "name": "RecoveryAlreadyActive",
            "inputs": [

            ]
        },
        {
            "type": "error",
            "name": "RecoveryNotActive",
            "inputs": [

            ]
        },
        {
            "type": "error",
            "name": "ThresholdNotMet",
            "inputs": [

            ]
        },
        {
            "type": "error",
            "name": "Unauthorized",
            "inputs": [

            ]
        },
        {
            "type": "error",
            "name": "ZeroPasskeyVerifier",
            "inputs": [

            ]
        },
        {
            "type": "error",
            "name": "ZeroWallet",
            "inputs": [

            ]
        },
        {
            "type": "error",
            "name": "ZeroZkJwtVerifier",
            "inputs": [

            ]
        }
    ] as const;

export const ABI_RECOVERY_FACTORY =
    [
        {
            "type": "constructor",
            "inputs": [
                {
                    "name": "_implementation",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_passkeyVerifier",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_zkJwtVerifier",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "deployRecoveryManager",
            "inputs": [
                {
                    "name": "_wallet",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "guardians",
                    "type": "tuple[]",
                    "internalType": "struct GuardianLib.Guardian[]",
                    "components": [
                        {
                            "name": "guardianType",
                            "type": "uint8",
                            "internalType": "enum GuardianLib.GuardianType"
                        },
                        {
                            "name": "identifier",
                            "type": "bytes32",
                            "internalType": "bytes32"
                        }
                    ]
                },
                {
                    "name": "_threshold",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_challengePeriod",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "proxy",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "getRecoveryManager",
            "inputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "implementation",
            "inputs": [

            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "passkeyVerifier",
            "inputs": [

            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "zkJwtVerifier",
            "inputs": [

            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "event",
            "name": "RecoveryManagerDeployed",
            "inputs": [
                {
                    "name": "wallet",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "recoveryManager",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "error",
            "name": "AlreadyDeployed",
            "inputs": [

            ]
        },
        {
            "type": "error",
            "name": "DeploymentFailed",
            "inputs": [

            ]
        }
    ] as const;

export const ABI_SIMPLE_7702 =
    [
        {
            "type": "constructor",
            "inputs": [
                {
                    "name": "_entryPoint",
                    "type": "address",
                    "internalType": "contract IEntryPoint"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "fallback",
            "stateMutability": "payable"
        },
        {
            "type": "receive",
            "stateMutability": "payable"
        },
        {
            "type": "function",
            "name": "RECOVERY_MANAGER",
            "inputs": [

            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "authorizeRecoveryManager",
            "inputs": [
                {
                    "name": "account",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [

            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "entryPoint",
            "inputs": [

            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "contract IEntryPoint"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "execute",
            "inputs": [
                {
                    "name": "target",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "value",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "data",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ],
            "outputs": [

            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "executeBatch",
            "inputs": [
                {
                    "name": "calls",
                    "type": "tuple[]",
                    "internalType": "struct BaseAccount.Call[]",
                    "components": [
                        {
                            "name": "target",
                            "type": "address",
                            "internalType": "address"
                        },
                        {
                            "name": "value",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "data",
                            "type": "bytes",
                            "internalType": "bytes"
                        }
                    ]
                }
            ],
            "outputs": [

            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "getNonce",
            "inputs": [

            ],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "isRecoveryAuthorized",
            "inputs": [
                {
                    "name": "account",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "isValidSignature",
            "inputs": [
                {
                    "name": "hash",
                    "type": "bytes32",
                    "internalType": "bytes32"
                },
                {
                    "name": "signature",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ],
            "outputs": [
                {
                    "name": "magicValue",
                    "type": "bytes4",
                    "internalType": "bytes4"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "keyData",
            "inputs": [

            ],
            "outputs": [
                {
                    "name": "keyType",
                    "type": "uint8",
                    "internalType": "enum IKey.KeyType"
                },
                {
                    "name": "isActive",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "masterKey",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "isDelegatedControl",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "validUntil",
                    "type": "uint48",
                    "internalType": "uint48"
                },
                {
                    "name": "validAfter",
                    "type": "uint48",
                    "internalType": "uint48"
                },
                {
                    "name": "limits",
                    "type": "uint48",
                    "internalType": "uint48"
                },
                {
                    "name": "key",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "onERC1155BatchReceived",
            "inputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "",
                    "type": "uint256[]",
                    "internalType": "uint256[]"
                },
                {
                    "name": "",
                    "type": "uint256[]",
                    "internalType": "uint256[]"
                },
                {
                    "name": "",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bytes4",
                    "internalType": "bytes4"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "onERC1155Received",
            "inputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bytes4",
                    "internalType": "bytes4"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "onERC721Received",
            "inputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bytes4",
                    "internalType": "bytes4"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "owner",
            "inputs": [

            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "revokeRecoveryManager",
            "inputs": [
                {
                    "name": "account",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [

            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setOwner",
            "inputs": [
                {
                    "name": "_newOwner",
                    "type": "tuple",
                    "internalType": "struct IKey.KeyDataReg",
                    "components": [
                        {
                            "name": "keyType",
                            "type": "uint8",
                            "internalType": "enum IKey.KeyType"
                        },
                        {
                            "name": "validUntil",
                            "type": "uint48",
                            "internalType": "uint48"
                        },
                        {
                            "name": "validAfter",
                            "type": "uint48",
                            "internalType": "uint48"
                        },
                        {
                            "name": "limits",
                            "type": "uint48",
                            "internalType": "uint48"
                        },
                        {
                            "name": "key",
                            "type": "bytes",
                            "internalType": "bytes"
                        },
                        {
                            "name": "keyControl",
                            "type": "uint8",
                            "internalType": "enum IKey.KeyControl"
                        }
                    ]
                }
            ],
            "outputs": [

            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "supportsInterface",
            "inputs": [
                {
                    "name": "id",
                    "type": "bytes4",
                    "internalType": "bytes4"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "stateMutability": "pure"
        },
        {
            "type": "function",
            "name": "validateUserOp",
            "inputs": [
                {
                    "name": "userOp",
                    "type": "tuple",
                    "internalType": "struct PackedUserOperation",
                    "components": [
                        {
                            "name": "sender",
                            "type": "address",
                            "internalType": "address"
                        },
                        {
                            "name": "nonce",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "initCode",
                            "type": "bytes",
                            "internalType": "bytes"
                        },
                        {
                            "name": "callData",
                            "type": "bytes",
                            "internalType": "bytes"
                        },
                        {
                            "name": "accountGasLimits",
                            "type": "bytes32",
                            "internalType": "bytes32"
                        },
                        {
                            "name": "preVerificationGas",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "gasFees",
                            "type": "bytes32",
                            "internalType": "bytes32"
                        },
                        {
                            "name": "paymasterAndData",
                            "type": "bytes",
                            "internalType": "bytes"
                        },
                        {
                            "name": "signature",
                            "type": "bytes",
                            "internalType": "bytes"
                        }
                    ]
                },
                {
                    "name": "userOpHash",
                    "type": "bytes32",
                    "internalType": "bytes32"
                },
                {
                    "name": "missingAccountFunds",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "validationData",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "event",
            "name": "RecoveryAuthorizationUpdated",
            "inputs": [
                {
                    "name": "account",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "authorized",
                    "type": "bool",
                    "indexed": false,
                    "internalType": "bool"
                }
            ],
            "anonymous": false
        },
        {
            "type": "error",
            "name": "ECDSAInvalidSignature",
            "inputs": [

            ]
        },
        {
            "type": "error",
            "name": "ECDSAInvalidSignatureLength",
            "inputs": [
                {
                    "name": "length",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "ECDSAInvalidSignatureS",
            "inputs": [
                {
                    "name": "s",
                    "type": "bytes32",
                    "internalType": "bytes32"
                }
            ]
        },
        {
            "type": "error",
            "name": "ExecuteError",
            "inputs": [
                {
                    "name": "index",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "error",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ]
        },
        {
            "type": "error",
            "name": "NotFromEntryPoint",
            "inputs": [
                {
                    "name": "msgSender",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "entity",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "entryPoint",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "Unauthorized",
            "inputs": [

            ]
        }
    ] as const;
