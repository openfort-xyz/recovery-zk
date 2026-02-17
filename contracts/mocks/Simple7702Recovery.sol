// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "../interfaces/IKey.sol";
import { IRecovery } from "contracts/interfaces/IRecovery.sol";
import { IEntryPoint } from "lib/account-abstraction-v9/contracts/interfaces/IEntryPoint.sol";
import { Simple7702Account } from "lib/account-abstraction-v9/contracts/accounts/Simple7702Account.sol";

contract Simple7702Recovery is Simple7702Account, IRecovery, IKey {
    error Unauthorized();

    address public RECOVERY_MANAGER;
    KeyData public keyData;

    mapping(address => bool) private _recoveryAuthorized;

    event RecoveryAuthorizationUpdated(address indexed account, bool authorized);

    constructor(IEntryPoint _entryPoint) Simple7702Account(_entryPoint) { }

    function setOwner(KeyDataReg memory _newOwner) external override {
        if (msg.sender != address(this) && !_recoveryAuthorized[msg.sender]) revert Unauthorized();
        KeyData storage $ = keyData;
        $.keyType = _newOwner.keyType;
        $.isActive = true;
        $.masterKey = true;
        $.isDelegatedControl = false;
        $.validUntil = _newOwner.validUntil;
        $.validAfter = _newOwner.validAfter;
        $.limits = _newOwner.limits;
        $.key = _newOwner.key;
    }

    function authorizeRecoveryManager(address account) external {
        if (msg.sender != address(this)) revert Unauthorized();
        _recoveryAuthorized[account] = true;
        emit RecoveryAuthorizationUpdated(account, true);
    }

    function revokeRecoveryManager(address account) external {
        if (msg.sender != address(this)) revert Unauthorized();
        delete _recoveryAuthorized[account];
        emit RecoveryAuthorizationUpdated(account, false);
    }

    function isRecoveryAuthorized(address account) external view override returns (bool) {
        return _recoveryAuthorized[account];
    }

    function owner() external view override returns (address) {
        return address(this);
    }
}
