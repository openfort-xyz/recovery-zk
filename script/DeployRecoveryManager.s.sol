// SPDX-License-Identifier: MIT

pragma solidity ^0.8.29;

import "lib/forge-std/src/StdJson.sol";
import { GuardianLib } from "contracts/libraries/GuardianLib.sol";
import { RecoveryManager } from "contracts/recovery/RecoveryManager.sol";
import { Script, console2 as console } from "lib/forge-std/src/Script.sol";

contract DeployRecoveryManager is Script {
    bytes32 constant salt = 0x000000000000000000000000000000000000000000000000000000017885423a;
    address constant WALLET = 0x00000256d7ef704c043cb352D7D6D3546A720A2e;
    uint256 constant THRESHOLD = 3;
    uint256 constant CHALLENGE_PERIOD = 1 days;
    address constant PASSKEY_VERIFIER = 0x51019BcD8AA3D75fC91828E5814Fbbd06fa7e158;
    address constant ZKJWT_VERIFIER = 0x1b40956cAB416840b676A30d9a886a856063f7C0;
    address private CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    GuardianLib.Guardian[] private guardians;

    function run() public {
        vm.startBroadcast();

        bytes memory constructorArgs = abi.encode(
            WALLET,
            guardians,
            THRESHOLD,
            CHALLENGE_PERIOD,
            PASSKEY_VERIFIER,
            ZKJWT_VERIFIER
        );
        // console.logBytes(constructorArgs);

        bytes memory creationCode = abi.encodePacked(type(RecoveryManager).creationCode, constructorArgs);
        console.logBytes(creationCode);

        address expectedAddress = vm.computeCreate2Address(salt, keccak256(creationCode), CREATE2_DEPLOYER);

        console.log("Expected deployment address:", expectedAddress);
        console.log("Using salt:", vm.toString(salt));
        console.log("CREATE2 Deployer:", CREATE2_DEPLOYER);

        if (expectedAddress.code.length > 0) {
            console.log("Contract already deployed at:", expectedAddress);
            vm.stopBroadcast();
            return;
        }

        bytes memory deploymentData = abi.encodePacked(salt, creationCode);

        (bool success, bytes memory res) = CREATE2_DEPLOYER.call(deploymentData);
        require(address(bytes20(res)) == expectedAddress, "Wrong Addres Delpoyed");

        require(success, "CREATE2 deployment failed");

        console.log("Contract deployed successfully!");
        console.log("Deployed to expected address:", expectedAddress);

        require(expectedAddress.code.length > 0, "No code at deployed address");

        console.log("Deployment completed successfully!");

        vm.stopBroadcast();
    }
}
