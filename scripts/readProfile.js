import hre from "hardhat";

// Sustituye por la dirección real de tu contrato desplegado
const CONTRACT_ADDRESS = "0x342C1023Dc80b395FB7F381C3316d75dE03303e4";
const USER_ADDRESS = "0x51c0c7E0C59997c2AcBDAA6aCc82Da8398A0532";

async function main() {
  const soulToken = await hre.ethers.getContractAt("SoulToken", CONTRACT_ADDRESS);

  const profile = await soulToken.getProfile(USER_ADDRESS);

  console.log("---- Perfil Soul Layer ----");
  console.log("Existe:", profile.exists);
  console.log("Verificado como humano:", profile.isHuman);
  console.log("Reputación:", profile.reputation.toString());
  console.log("Creado en:", new Date(Number(profile.createdAt) * 1000).toLocaleString());
  console.log("Actualizado en:", new Date(Number(profile.updatedAt) * 1000).toLocaleString());
  console.log("Token ID:", profile.tokenId.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
