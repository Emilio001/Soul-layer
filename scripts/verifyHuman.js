import hre from "hardhat";

// Sustituye por la dirección real de tu contrato desplegado
const CONTRACT_ADDRESS = "0x342C1023Dc80b395FB7F381C3316d75dE03303e4";
// Dirección del usuario que se quiere verificar como humano
const USER_ADDRESS = "0x51c0c7E0C59997c2AcBDAA6aCc82Da8398A0532";

async function main() {
  // El firmante debe poseer VERIFIER_ROLE en el contrato
  const [verifier] = await hre.ethers.getSigners();
  const soulToken  = await hre.ethers.getContractAt("SoulToken", CONTRACT_ADDRESS);

  // 1. Generar un nonce único para esta verificación (protección anti-replay)
  const nonce = hre.ethers.randomBytes(32);
  const nonceHex = hre.ethers.hexlify(nonce);

  // 2. Reconstruir el mismo hash que el contrato calculará on-chain
  const network = await hre.ethers.provider.getNetwork();
  const chainId = network.chainId;

  const messageHash = hre.ethers.solidityPackedKeccak256(
    ["address", "bytes32", "uint256"],
    [USER_ADDRESS, nonceHex, chainId]
  );

  // 3. Firmar el hash con la clave privada del verificador
  const signature = await verifier.signMessage(hre.ethers.getBytes(messageHash));

  // 4. Enviar la firma al contrato para que la valide on-chain con ecrecover
  const tx = await soulToken.verifyHumanWithSignature(USER_ADDRESS, nonceHex, signature);
  await tx.wait();

  console.log("Usuario verificado como humano mediante firma ECDSA");
  console.log("Nonce utilizado:", nonceHex);
  console.log("Hash de transacción:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
