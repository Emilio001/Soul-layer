require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

if (!PRIVATE_KEY || !RPC_URL) {
  console.warn(
    "Aviso: PRIVATE_KEY o RPC_URL no están definidos en el archivo .env. " +
    "El despliegue en Polygon Amoy no funcionará hasta configurarlos."
  );
}

module.exports = {
  solidity: "0.8.24",
  networks: {
    amoy: {
      url: RPC_URL || "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
