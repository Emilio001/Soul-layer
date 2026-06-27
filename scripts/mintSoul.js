import hre from "hardhat";

const CONTRACT_ADDRESS = "0x48381C8d67f6f9187d78261a5934FbbE49E06C5b";

async function main() {
  const soulToken = await hre.ethers.getContractAt("SoulToken", CONTRACT_ADDRESS);

  const tx = await soulToken.mintSoul();
  await tx.wait();

  console.log("SoulToken creado correctamente");
  console.log("Hash de transacción:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});