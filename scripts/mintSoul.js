import hre from "hardhat";

// Sustituye por la dirección real de tu contrato desplegado
const CONTRACT_ADDRESS = "0x342C1023Dc80b395FB7F381C3316d75dE03303e4";

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const soulToken = await hre.ethers.getContractAt("SoulToken", CONTRACT_ADDRESS);

  console.log("Creando identidad para:", signer.address);

  const tx = await soulToken.connect(signer).mintSoul();
  await tx.wait();

  console.log("SoulToken creado correctamente");
  console.log("Hash de transacción:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
