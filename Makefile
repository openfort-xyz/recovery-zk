# Load environment variables from .env
include .env
export $(shell sed 's/=.*//' .env)

.SILENT:

deploy-honk-verifier:
	forge script ./script/deploy/DeployHonkVerifier.s.sol \
		--private-key $(PRIVATE_KEY_ANVIL) \
		--rpc-url $(RPC_URL_ANVIL) \
		-vv \
		--broadcast

deploy-passkey-verifier:
	forge script ./script/deploy/DeployPasskeyVerifier.s.sol \
		--private-key $(PRIVATE_KEY_ANVIL) \
		--rpc-url $(RPC_URL_ANVIL) \
		-vv \
		--broadcast

deploy-zkjwt-verifier:
	forge script ./script/deploy/DeployZkJwtVerifier.s.sol \
		--private-key $(PRIVATE_KEY_ANVIL) \
		--rpc-url $(RPC_URL_ANVIL) \
		-vv \
		--broadcast

deploy-recovery-manager:
	forge script ./script/deploy/DeployRecoveryManager.s.sol \
		--private-key $(PRIVATE_KEY_ANVIL) \
		--rpc-url $(RPC_URL_ANVIL) \
		-vv \
		--broadcast

deploy-recovery-factory:
	forge script ./script/deploy/DeployRecoveryFactory.s.sol \
		--private-key $(PRIVATE_KEY_ANVIL) \
		--rpc-url $(RPC_URL_ANVIL) \
		-vv \
		--broadcast