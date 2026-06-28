import { expect } from "chai";
import hre from "hardhat";

// ─── Helpers ────────────────────────────────────────────────────────────────

const ReputationEvent = {
  CONTENT_CREATED:   0,
  POSITIVE_REVIEW:   1,
  NEGATIVE_REVIEW:   2,
  COMMUNITY_REWARD:  3,
  MODERATION_PENALTY: 4,
};

function randomNonce() {
  return hre.ethers.randomBytes(32);
}

async function buildSignature(signer, userAddress, nonce, chainId) {
  const messageHash = hre.ethers.solidityPackedKeccak256(
    ["address", "bytes32", "uint256"],
    [userAddress, nonce, chainId]
  );
  return signer.signMessage(hre.ethers.getBytes(messageHash));
}

async function deployFixture() {
  const [deployer, admin, verifier, platform, user1, user2] =
    await hre.ethers.getSigners();

  const SoulToken = await hre.ethers.getContractFactory("SoulToken");
  const contract  = await SoulToken.deploy(admin.address);
  await contract.waitForDeployment();

  const VERIFIER_ROLE   = await contract.VERIFIER_ROLE();
  const REPUTATION_ROLE = await contract.REPUTATION_ROLE();

  await contract.connect(admin).grantRole(VERIFIER_ROLE,   verifier.address);
  await contract.connect(admin).grantRole(REPUTATION_ROLE, platform.address);

  const network = await hre.ethers.provider.getNetwork();
  const chainId = network.chainId;

  return { contract, deployer, admin, verifier, platform, user1, user2, chainId };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("SoulToken", function () {

  // ── 1. Despliegue y roles ─────────────────────────────────────────────────
  describe("Despliegue y roles", function () {

    it("El nombre y símbolo del token son correctos", async function () {
      const { contract } = await deployFixture();
      expect(await contract.name()).to.equal("Soul Layer Token");
      expect(await contract.symbol()).to.equal("SOUL");
    });

    it("El admin tiene ADMIN_ROLE", async function () {
      const { contract, admin } = await deployFixture();
      const ADMIN_ROLE = await contract.ADMIN_ROLE();
      expect(await contract.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("El verifier tiene VERIFIER_ROLE", async function () {
      const { contract, verifier } = await deployFixture();
      const VERIFIER_ROLE = await contract.VERIFIER_ROLE();
      expect(await contract.hasRole(VERIFIER_ROLE, verifier.address)).to.be.true;
    });

    it("La plataforma tiene REPUTATION_ROLE", async function () {
      const { contract, platform } = await deployFixture();
      const REPUTATION_ROLE = await contract.REPUTATION_ROLE();
      expect(await contract.hasRole(REPUTATION_ROLE, platform.address)).to.be.true;
    });

    it("MAX_REPUTATION_PER_TX es 100", async function () {
      const { contract } = await deployFixture();
      expect(await contract.MAX_REPUTATION_PER_TX()).to.equal(100n);
    });

  });

  // ── 2. Creación de identidades (mintSoul) ─────────────────────────────────
  describe("mintSoul", function () {

    it("Un usuario puede crear su identidad", async function () {
      const { contract, user1 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      expect(await contract.hasSoul(user1.address)).to.be.true;
    });

    it("El perfil se inicializa con reputación 0 e isHuman false", async function () {
      const { contract, user1 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      const profile = await contract.getProfile(user1.address);
      expect(profile.exists).to.be.true;
      expect(profile.isHuman).to.be.false;
      expect(profile.reputation).to.equal(0n);
    });

    it("Se emite el evento SoulCreated al crear la identidad", async function () {
      const { contract, user1 } = await deployFixture();
      await expect(contract.connect(user1).mintSoul())
        .to.emit(contract, "SoulCreated")
        .withArgs(user1.address, 1n);
    });

    it("Un usuario no puede crear dos identidades", async function () {
      const { contract, user1 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await expect(contract.connect(user1).mintSoul())
        .to.be.revertedWithCustomError(contract, "SoulAlreadyExists");
    });

    it("Dos usuarios pueden crear identidades independientes", async function () {
      const { contract, user1, user2 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await contract.connect(user2).mintSoul();
      expect(await contract.hasSoul(user1.address)).to.be.true;
      expect(await contract.hasSoul(user2.address)).to.be.true;
    });

    it("El tokenId del segundo usuario es 2", async function () {
      const { contract, user1, user2 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await contract.connect(user2).mintSoul();
      const profile2 = await contract.getProfile(user2.address);
      expect(profile2.tokenId).to.equal(2n);
    });

    it("hasSoul devuelve false para una dirección sin identidad", async function () {
      const { contract, user1 } = await deployFixture();
      expect(await contract.hasSoul(user1.address)).to.be.false;
    });

  });

  // ── 3. Eliminación voluntaria (burnSoul) ──────────────────────────────────
  describe("burnSoul", function () {

    it("El usuario puede eliminar su identidad", async function () {
      const { contract, user1 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await contract.connect(user1).burnSoul();
      expect(await contract.hasSoul(user1.address)).to.be.false;
    });

    it("Se emite el evento SoulBurned al eliminar la identidad", async function () {
      const { contract, user1 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await expect(contract.connect(user1).burnSoul())
        .to.emit(contract, "SoulBurned")
        .withArgs(user1.address, 1n);
    });

    it("Eliminar una identidad inexistente revierte con SoulDoesNotExist", async function () {
      const { contract, user1 } = await deployFixture();
      await expect(contract.connect(user1).burnSoul())
        .to.be.revertedWithCustomError(contract, "SoulDoesNotExist");
    });

    it("Tras burnSoul el usuario puede crear una nueva identidad", async function () {
      const { contract, user1 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await contract.connect(user1).burnSoul();
      await contract.connect(user1).mintSoul();
      expect(await contract.hasSoul(user1.address)).to.be.true;
    });

    it("Tras burnSoul la reputación se reinicia a 0", async function () {
      const { contract, platform, user1 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await contract.connect(platform).increaseReputation(
        user1.address, 50, ReputationEvent.CONTENT_CREATED
      );
      await contract.connect(user1).burnSoul();
      await contract.connect(user1).mintSoul();
      const profile = await contract.getProfile(user1.address);
      expect(profile.reputation).to.equal(0n);
    });

  });

  // ── 4. Verificación por firma ECDSA ───────────────────────────────────────
  describe("verifyHumanWithSignature", function () {

    it("Un verificador autorizado puede verificar a un usuario", async function () {
      const { contract, verifier, user1, chainId } = await deployFixture();
      await contract.connect(user1).mintSoul();
      const nonce = randomNonce();
      const sig   = await buildSignature(verifier, user1.address, nonce, chainId);
      await contract.verifyHumanWithSignature(user1.address, nonce, sig);
      const profile = await contract.getProfile(user1.address);
      expect(profile.isHuman).to.be.true;
    });

    it("Se emite el evento HumanVerified al verificar", async function () {
      const { contract, verifier, user1, chainId } = await deployFixture();
      await contract.connect(user1).mintSoul();
      const nonce = randomNonce();
      const sig   = await buildSignature(verifier, user1.address, nonce, chainId);
      await expect(contract.verifyHumanWithSignature(user1.address, nonce, sig))
        .to.emit(contract, "HumanVerified")
        .withArgs(user1.address, true);
    });

    it("Una firma de cuenta sin VERIFIER_ROLE es rechazada", async function () {
      const { contract, user1, user2, chainId } = await deployFixture();
      await contract.connect(user1).mintSoul();
      const nonce = randomNonce();
      const sig   = await buildSignature(user2, user1.address, nonce, chainId);
      await expect(
        contract.verifyHumanWithSignature(user1.address, nonce, sig)
      ).to.be.revertedWithCustomError(contract, "InvalidSignature");
    });

    it("Una firma ya usada no puede reutilizarse (anti-replay)", async function () {
      const { contract, verifier, user1, user2, chainId } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await contract.connect(user2).mintSoul();
      const nonce = randomNonce();
      const sig   = await buildSignature(verifier, user1.address, nonce, chainId);
      await contract.verifyHumanWithSignature(user1.address, nonce, sig);
      await expect(
        contract.verifyHumanWithSignature(user1.address, nonce, sig)
      ).to.be.revertedWithCustomError(contract, "SignatureAlreadyUsed");
    });

    it("isSignatureUsed devuelve true tras consumir la firma", async function () {
      const { contract, verifier, user1, chainId } = await deployFixture();
      await contract.connect(user1).mintSoul();
      const nonce = randomNonce();
      const sig   = await buildSignature(verifier, user1.address, nonce, chainId);
      await contract.verifyHumanWithSignature(user1.address, nonce, sig);
      expect(await contract.isSignatureUsed(nonce)).to.be.true;
    });

    it("Verificar un usuario sin identidad revierte con SoulDoesNotExist", async function () {
      const { contract, verifier, user1, chainId } = await deployFixture();
      const nonce = randomNonce();
      const sig   = await buildSignature(verifier, user1.address, nonce, chainId);
      await expect(
        contract.verifyHumanWithSignature(user1.address, nonce, sig)
      ).to.be.revertedWithCustomError(contract, "SoulDoesNotExist");
    });

  });

  // ── 5. Revocación de verificación ─────────────────────────────────────────
  describe("revokeHumanVerification", function () {

    it("Un verificador puede revocar la verificación de humanidad", async function () {
      const { contract, verifier, user1, chainId } = await deployFixture();
      await contract.connect(user1).mintSoul();
      const nonce = randomNonce();
      const sig   = await buildSignature(verifier, user1.address, nonce, chainId);
      await contract.verifyHumanWithSignature(user1.address, nonce, sig);
      await contract.connect(verifier).revokeHumanVerification(user1.address);
      const profile = await contract.getProfile(user1.address);
      expect(profile.isHuman).to.be.false;
    });

    it("Una cuenta sin VERIFIER_ROLE no puede revocar", async function () {
      const { contract, user1, user2 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await expect(
        contract.connect(user2).revokeHumanVerification(user1.address)
      ).to.be.reverted;
    });

  });

  // ── 6. Incremento de reputación ───────────────────────────────────────────
  describe("increaseReputation", function () {

    it("Una plataforma autorizada puede incrementar la reputación", async function () {
      const { contract, platform, user1 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await contract.connect(platform).increaseReputation(
        user1.address, 30, ReputationEvent.CONTENT_CREATED
      );
      const profile = await contract.getProfile(user1.address);
      expect(profile.reputation).to.equal(30n);
    });

    it("Se emite el evento ReputationChanged con el tipo de evento correcto", async function () {
      const { contract, platform, user1 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await expect(
        contract.connect(platform).increaseReputation(
          user1.address, 30, ReputationEvent.POSITIVE_REVIEW
        )
      ).to.emit(contract, "ReputationChanged")
        .withArgs(user1.address, 0n, 30n, ReputationEvent.POSITIVE_REVIEW, platform.address);
    });

    it("Superar MAX_REPUTATION_PER_TX revierte con MaxReputationPerTxExceeded", async function () {
      const { contract, platform, user1 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await expect(
        contract.connect(platform).increaseReputation(
          user1.address, 101, ReputationEvent.COMMUNITY_REWARD
        )
      ).to.be.revertedWithCustomError(contract, "MaxReputationPerTxExceeded");
    });

    it("Una cuenta sin REPUTATION_ROLE no puede incrementar la reputación", async function () {
      const { contract, user1, user2 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await expect(
        contract.connect(user2).increaseReputation(
          user1.address, 10, ReputationEvent.CONTENT_CREATED
        )
      ).to.be.reverted;
    });

    it("La reputación se acumula correctamente en múltiples transacciones", async function () {
      const { contract, platform, user1 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await contract.connect(platform).increaseReputation(
        user1.address, 40, ReputationEvent.CONTENT_CREATED
      );
      await contract.connect(platform).increaseReputation(
        user1.address, 25, ReputationEvent.POSITIVE_REVIEW
      );
      const profile = await contract.getProfile(user1.address);
      expect(profile.reputation).to.equal(65n);
    });

  });

  // ── 7. Decremento de reputación ───────────────────────────────────────────
  describe("decreaseReputation", function () {

    it("Una plataforma autorizada puede decrementar la reputación", async function () {
      const { contract, platform, user1 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await contract.connect(platform).increaseReputation(
        user1.address, 50, ReputationEvent.CONTENT_CREATED
      );
      await contract.connect(platform).decreaseReputation(
        user1.address, 20, ReputationEvent.MODERATION_PENALTY
      );
      const profile = await contract.getProfile(user1.address);
      expect(profile.reputation).to.equal(30n);
    });

    it("La reputación no baja de 0", async function () {
      const { contract, platform, user1 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await contract.connect(platform).increaseReputation(
        user1.address, 10, ReputationEvent.CONTENT_CREATED
      );
      await contract.connect(platform).decreaseReputation(
        user1.address, 50, ReputationEvent.MODERATION_PENALTY
      );
      const profile = await contract.getProfile(user1.address);
      expect(profile.reputation).to.equal(0n);
    });

    it("Se emite el evento ReputationChanged con MODERATION_PENALTY", async function () {
      const { contract, platform, user1 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await contract.connect(platform).increaseReputation(
        user1.address, 50, ReputationEvent.CONTENT_CREATED
      );
      await expect(
        contract.connect(platform).decreaseReputation(
          user1.address, 20, ReputationEvent.MODERATION_PENALTY
        )
      ).to.emit(contract, "ReputationChanged")
        .withArgs(user1.address, 50n, 30n, ReputationEvent.MODERATION_PENALTY, platform.address);
    });

  });

  // ── 8. No transferibilidad ────────────────────────────────────────────────
  describe("No transferibilidad", function () {

    it("transferFrom revierte con NonTransferable", async function () {
      const { contract, user1, user2 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      const tokenId = await contract.soulOf(user1.address);
      await expect(
        contract.connect(user1).transferFrom(user1.address, user2.address, tokenId)
      ).to.be.revertedWithCustomError(contract, "NonTransferable");
    });

    it("safeTransferFrom revierte con NonTransferable", async function () {
      const { contract, user1, user2 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      const tokenId = await contract.soulOf(user1.address);
      await expect(
        contract.connect(user1)["safeTransferFrom(address,address,uint256)"](
          user1.address, user2.address, tokenId
        )
      ).to.be.revertedWithCustomError(contract, "NonTransferable");
    });

    it("approve revierte con ApprovalsDisabled", async function () {
      const { contract, user1, user2 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      const tokenId = await contract.soulOf(user1.address);
      await expect(
        contract.connect(user1).approve(user2.address, tokenId)
      ).to.be.revertedWithCustomError(contract, "ApprovalsDisabled");
    });

    it("setApprovalForAll revierte con ApprovalsDisabled", async function () {
      const { contract, user1, user2 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      await expect(
        contract.connect(user1).setApprovalForAll(user2.address, true)
      ).to.be.revertedWithCustomError(contract, "ApprovalsDisabled");
    });

  });

  // ── 9. Consultas ──────────────────────────────────────────────────────────
  describe("Consultas", function () {

    it("getProfile devuelve los datos correctos del perfil", async function () {
      const { contract, user1 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      const profile = await contract.getProfile(user1.address);
      expect(profile.exists).to.be.true;
      expect(profile.isHuman).to.be.false;
      expect(profile.reputation).to.equal(0n);
      expect(profile.tokenId).to.equal(1n);
    });

    it("soulOf revierte con SoulDoesNotExist si no tiene identidad", async function () {
      const { contract, user1 } = await deployFixture();
      await expect(contract.soulOf(user1.address))
        .to.be.revertedWithCustomError(contract, "SoulDoesNotExist");
    });

    it("soulOf devuelve el tokenId correcto", async function () {
      const { contract, user1 } = await deployFixture();
      await contract.connect(user1).mintSoul();
      expect(await contract.soulOf(user1.address)).to.equal(1n);
    });

  });

  // ── 10. Flujos completos ──────────────────────────────────────────────────
  describe("Flujo completo de identidad", function () {

    it("Mint → verificación humana → reputación → consulta", async function () {
      const { contract, verifier, platform, user1, chainId } = await deployFixture();

      await contract.connect(user1).mintSoul();
      expect(await contract.hasSoul(user1.address)).to.be.true;

      const nonce = randomNonce();
      const sig   = await buildSignature(verifier, user1.address, nonce, chainId);
      await contract.verifyHumanWithSignature(user1.address, nonce, sig);

      await contract.connect(platform).increaseReputation(
        user1.address, 40, ReputationEvent.CONTENT_CREATED
      );
      await contract.connect(platform).increaseReputation(
        user1.address, 25, ReputationEvent.POSITIVE_REVIEW
      );

      const profile = await contract.getProfile(user1.address);
      expect(profile.isHuman).to.be.true;
      expect(profile.reputation).to.equal(65n);
    });

    it("Mint → reputación → burn → nuevo mint funciona correctamente", async function () {
      const { contract, platform, user1 } = await deployFixture();

      await contract.connect(user1).mintSoul();
      await contract.connect(platform).increaseReputation(
        user1.address, 50, ReputationEvent.COMMUNITY_REWARD
      );
      await contract.connect(user1).burnSoul();

      expect(await contract.hasSoul(user1.address)).to.be.false;

      await contract.connect(user1).mintSoul();
      const profile = await contract.getProfile(user1.address);
      expect(profile.exists).to.be.true;
      expect(profile.reputation).to.equal(0n);
    });

  });

});
