// SPDX-License-Identifier: MIT

pragma solidity ^0.8.29;

import "lib/forge-std/src/StdJson.sol";
import { Script, console2 as console } from "lib/forge-std/src/Script.sol";
import { RecoveryManagerFactory } from "contracts/recovery/RecoveryManagerFactory.sol";

contract DeployRecoveryFactory is Script {
    bytes32 constant salt = 0x000000000000000000000000000000000000000000000000000000017885423a;
    address private CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
    address constant RECOVERY_MANAGER_IMPL = 0x19bA566256D026fee820F89Eb2324F2945295B61;
    address constant PASSKEY_VERIFIER = 0x51019BcD8AA3D75fC91828E5814Fbbd06fa7e158;
    address constant ZKJWT_VERIFIER = 0x1b40956cAB416840b676A30d9a886a856063f7C0;

    function run() public {
        vm.startBroadcast();
        require(RECOVERY_MANAGER_IMPL != address(0), "Set RECOVERY_MANAGER_IMPL address first");

        bytes memory constructorArgs = abi.encode(RECOVERY_MANAGER_IMPL, PASSKEY_VERIFIER, ZKJWT_VERIFIER);

        bytes memory creationCode = abi.encodePacked(type(RecoveryManagerFactory).creationCode, constructorArgs);

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
        require(success, "CREATE2 deployment failed");

        address deployedAddress = address(bytes20(res));
        require(deployedAddress == expectedAddress, "Wrong Address Deployed");

        console.log("RecoveryManagerFactory deployed to:", deployedAddress);

        require(deployedAddress.code.length > 0, "No code at deployed address");

        console.log("Deployment completed successfully!");
    }
}
