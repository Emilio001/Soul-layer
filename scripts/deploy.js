import hre from "hardhat";

async function main() {
  const SoulToken = await hre.ethers.getContractFactory("SoulToken");
  const soulToken = await SoulToken.deploy();

  await soulToken.waitForDeployment();

  // Obtener la transacción de despliegue
  const tx = soulToken.deploymentTransaction();

  console.log("SoulToken desplegado en:", await soulToken.getAddress());
  console.log("Hash de la transacción:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});