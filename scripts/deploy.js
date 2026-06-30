import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Desplegando con la cuenta:", deployer.address);

  const SoulToken = await hre.ethers.getContractFactory("SoulToken");

  // El constructor recibe la dirección admin.
  // En producción podría ser un multisig (Gnosis Safe, etc.)
  const soulToken = await SoulToken.deploy(deployer.address);
  await soulToken.waitForDeployment();

  const contractAddress = await soulToken.getAddress();
  const tx = soulToken.deploymentTransaction();

  console.log("SoulToken desplegado en:", contractAddress);
  console.log("Hash de la transacción:", tx.hash);

  // Conceder roles iniciales al propio deployer para pruebas.
  // En producción, estos roles se asignarían a cuentas distintas.
  const VERIFIER_ROLE   = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("VERIFIER_ROLE"));
  const REPUTATION_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("REPUTATION_ROLE"));

  await (await soulToken.grantRole(VERIFIER_ROLE,   deployer.address)).wait();
  await (await soulToken.grantRole(REPUTATION_ROLE, deployer.address)).wait();

  console.log("Roles VERIFIER y REPUTATION concedidos al deployer para pruebas.");
  console.log("\nGuarda esta dirección en tus scripts:", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
