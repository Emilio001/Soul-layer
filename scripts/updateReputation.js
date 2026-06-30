import hre from "hardhat";

// Sustituye por la dirección real de tu contrato desplegado
const CONTRACT_ADDRESS = "0x342C1023Dc80b395FB7F381C3316d75dE03303e4";
const USER_ADDRESS = "0x51c0c7E0C59997c2AcBDAA6aCc82Da8398A0532";

// Tipos de evento definidos en el enum ReputationEvent del contrato
const ReputationEvent = {
  CONTENT_CREATED:    0,
  POSITIVE_REVIEW:    1,
  NEGATIVE_REVIEW:    2,
  COMMUNITY_REWARD:   3,
  MODERATION_PENALTY: 4,
};

async function main() {
  // El firmante debe poseer REPUTATION_ROLE en el contrato
  const [platform] = await hre.ethers.getSigners();
  const soulToken  = await hre.ethers.getContractAt("SoulToken", CONTRACT_ADDRESS);

  const points = 10;
  const eventType = ReputationEvent.POSITIVE_REVIEW;

  const tx = await soulToken
    .connect(platform)
    .increaseReputation(USER_ADDRESS, points, eventType);
  await tx.wait();

  console.log(`Reputación incrementada en ${points} puntos (evento: POSITIVE_REVIEW)`);
  console.log("Hash de transacción:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
