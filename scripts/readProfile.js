import hre from "hardhat";

const CONTRACT_ADDRESS = "0x48381C8d67f6f9187d78261a5934FbbE49E06C5b";
const USER_ADDRESS = "0x51c0c7E0C59997c2AcBDAA6aCc82Da8398A05320";

async function main() {
  const soulToken = await hre.ethers.getContractAt("SoulToken", CONTRACT_ADDRESS);

  const profile = await soulToken.getProfile(USER_ADDRESS);

  console.log("Existe:", profile[0]);
  console.log("Verificado como humano:", profile[1]);
  console.log("Reputación:", profile[2].toString());
  console.log("Creado en:", profile[3].toString());
  console.log("Actualizado en:", profile[4].toString());
  console.log("Token ID:", profile[5].toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});