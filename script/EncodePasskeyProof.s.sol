// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import { Script, console2 as console } from "lib/forge-std/src/Script.sol";

contract EncodePasskeyProof is Script {
    bytes authenticatorData = hex"49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631d00000000";
    string clientDataJSON =
        "{\"type\":\"webauthn.get\",\"challenge\":\"Sz11fQcA07Mo5Oz5h9lMz7TIQMoa_MoXYy9B5P1KeUo\",\"origin\":\"http://localhost:3000\",\"crossOrigin\":false,\"other_keys_can_be_added_here\":\"do not compare clientDataJSON against a template. See https://goo.gl/yabPex\"}";
    uint256 challengeLocation = 23;
    uint256 responseTypeLocation = 1;
    uint256 r = 0x5093dda483a35e808ff2d01de8f72f11e3fd143b36b6b37197f4f0f5b2a2b8a9;
    uint256 s = 0x17cd6a420172208c4df7fc91ec4d4a555eacac970a5645f72557b9020a6fdb4c;
    uint256 x = 0x0b72f31725093a6ea013ef098b0a152a8e1f82bc5309f0d9067af2c34ea31b52;
    uint256 y = 0x30956aded980dd91e2f454d2855c993708f942ba2fc1c81adb729fa97d5b0795;

    function run() public {
        bytes memory proof =
            abi.encode(authenticatorData, clientDataJSON, challengeLocation, responseTypeLocation, r, s, x, y);

        console.log("proof: ", vm.toString(proof));
    }
}
