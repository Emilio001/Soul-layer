import hre from "hardhat";

const CONTRACT_ADDRESS = "0x48381C8d67f6f9187d78261a5934FbbE49E06C5b";
const USER_ADDRESS = "0x51c0c7E0C59997c2AcBDAA6aCc82Da8398A05320";

async function main() {
  const soulToken = await hre.ethers.getContractAt("SoulToken", CONTRACT_ADDRESS);

  const tx = await soulToken.verifyHuman(USER_ADDRESS, true);
  await tx.wait();

  console.log("Usuario verificado como humano");
  console.log("Hash de transacción:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});