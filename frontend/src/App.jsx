import { useState } from "react";
import { ethers } from "ethers";
import { SoulTokenABI } from "./abi/SoulTokenABI";

const CONTRACT_ADDRESS = "0x48381C8d67f6f9187d78261a5934FbbE49E06C5b";
const AMOY_CHAIN_ID = "0x13882";
const EXPLORER_URL = "https://amoy.polygonscan.com";

function App() {
  const [account, setAccount] = useState("");
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("");

  async function switchToAmoy() {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: AMOY_CHAIN_ID }],
    });
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        alert("MetaMask no detectado");
        return;
      }

      await switchToAmoy();

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setAccount(accounts[0]);
      setStatus("Wallet conectada correctamente.");
    } catch (error) {
      console.error(error);
      setStatus("No se pudo conectar MetaMask o cambiar a Polygon Amoy.");
    }
  }

  async function getReadContract() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    return new ethers.Contract(CONTRACT_ADDRESS, SoulTokenABI, provider);
  }

  async function loadProfile() {
    try {
      if (!account) {
        setStatus("Conecta primero la wallet.");
        return;
      }

      setStatus("Consultando estado on-chain...");

      const contract = await getReadContract();
      const data = await contract.getProfile(account);

      setProfile({
        exists: data[0],
        isHuman: data[1],
        reputation: Number(data[2]),
        createdAt: Number(data[3]),
        updatedAt: Number(data[4]),
        tokenId: Number(data[5]),
      });

      setStatus("Perfil cargado correctamente desde Polygon Amoy.");
    } catch (error) {
      console.error(error);
      setStatus("No se pudo cargar el perfil. Revisa que MetaMask esté en Polygon Amoy.");
    }
  }

  function formatDate(timestamp) {
    if (!timestamp || timestamp === 0) return "No disponible";
    return new Date(timestamp * 1000).toLocaleString();
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.titleBlock}>
            <h1 style={styles.title}>Soul Layer</h1>
            <p style={styles.subtitle}>
              Identidad descentralizada y reputación verificable para plataformas multimedia
            </p>
          </div>

          <a
            href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            style={styles.linkButton}
          >
            Ver contrato
          </a>
        </header>

        <section style={{ ...styles.card, ...styles.centerCard }}>
          <h2>Demo segura</h2>
          <p style={styles.text}>
            Esta interfaz permite consultar el estado real del perfil Soul Layer
            almacenado en Polygon Amoy. Las operaciones de escritura, como la
            creación del token, la verificación de humanidad y la actualización
            de reputación, ya fueron validadas previamente mediante transacciones
            on-chain y pueden verificarse en el explorador de bloques.
          </p>

          {!account ? (
            <button style={styles.primaryButton} onClick={connectWallet}>
              Conectar MetaMask
            </button>
          ) : (
            <>
              <p style={styles.label}>Wallet conectada</p>
              <p style={styles.address}>{account}</p>

              <div style={styles.centerButtonRow}>
                <button style={styles.primaryButton} onClick={loadProfile}>
                  Cargar perfil on-chain
                </button>
              </div>
            </>
          )}

          {status && <p style={styles.status}>{status}</p>}
        </section>

        {profile && (
          <section style={styles.grid}>
            <div style={{ ...styles.card, ...styles.profileCard }}>
              <h2>Perfil Soul Layer</h2>

              <p>
                <strong>Estado:</strong>{" "}
                {profile.exists ? "Activo" : "No creado"}
              </p>

              <p>
                <strong>Token ID:</strong> {profile.tokenId}
              </p>

              <p>
                <strong>Creado:</strong> {formatDate(profile.createdAt)}
              </p>

              <p>
                <strong>Última actualización:</strong>{" "}
                {formatDate(profile.updatedAt)}
              </p>
            </div>

            <div style={styles.card}>
              <h2>Identidad y reputación</h2>

              <div style={styles.metric}>
                <span>Verificación humana</span>
                <strong style={profile.isHuman ? styles.good : styles.bad}>
                  {profile.isHuman ? "Verificado" : "No verificado"}
                </strong>
              </div>

              <div style={styles.metric}>
                <span>Reputación</span>
                <strong style={styles.reputation}>{profile.reputation}</strong>
              </div>

              <div style={styles.disabledBox}>
                <p>
                  Las acciones de escritura están desactivadas en modo demo para
                  evitar consumo innecesario de POL de testnet.
                </p>

                <div style={styles.buttonRow}>
                  <button style={styles.disabledButton} disabled>
                    Crear SoulToken
                  </button>

                  <button style={styles.disabledButton} disabled>
                    Verificar humano
                  </button>

                  <button style={styles.disabledButton} disabled>
                    Actualizar reputación
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <section style={styles.card}>
          <h2>Información técnica</h2>

          <p>
            <strong>Red:</strong> Polygon Amoy
          </p>

          <p>
            <strong>Contrato:</strong>{" "}
            <a
              href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              style={styles.link}
            >
              {CONTRACT_ADDRESS}
            </a>
          </p>

          <p style={styles.text}>
            El frontend se comunica con el contrato inteligente mediante
            ethers.js y utiliza MetaMask como proveedor de conexión entre el
            navegador y la blockchain.
          </p>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f1020, #16182f)",
    color: "#ffffff",
    fontFamily: "Arial, sans-serif",
    padding: "40px",
  },
  container: {
    maxWidth: "1050px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "30px",
    gap: "20px",
  },
  titleBlock: {
    textAlign: "left",
  },
  title: {
    fontSize: "42px",
    margin: 0,
    lineHeight: "1.1",
  },
  subtitle: {
    color: "#b8b8d1",
    marginTop: "8px",
    marginBottom: 0,
    fontSize: "18px",
  },
  card: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "18px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
  },
  centerCard: {
    textAlign: "center",
  },
  profileCard: {
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "16px",
  },
  centerButtonRow: {
    display: "flex",
    justifyContent: "center",
    marginTop: "16px",
  },
  primaryButton: {
    background: "#7c3aed",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  disabledButton: {
    background: "#34364f",
    color: "#a0a0b8",
    border: "1px solid #4b4f8f",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "not-allowed",
  },
  label: {
    color: "#b8b8d1",
    marginBottom: "6px",
  },
  address: {
    background: "#0f1020",
    padding: "10px",
    borderRadius: "10px",
    overflowWrap: "break-word",
    fontWeight: "bold",
  },
  status: {
    color: "#b8b8d1",
    marginTop: "18px",
  },
  text: {
    color: "#d5d5e5",
    lineHeight: "1.6",
  },
  link: {
    color: "#a78bfa",
    textDecoration: "none",
    fontWeight: "bold",
  },
  linkButton: {
    color: "#ffffff",
    background: "#252850",
    border: "1px solid #4b4f8f",
    padding: "10px 14px",
    borderRadius: "10px",
    textDecoration: "none",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  metric: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "18px 0",
    padding: "14px",
    background: "rgba(0,0,0,0.2)",
    borderRadius: "12px",
  },
  good: {
    color: "#22c55e",
  },
  bad: {
    color: "#f97316",
  },
  reputation: {
    fontSize: "28px",
    color: "#a78bfa",
  },
  disabledBox: {
    marginTop: "20px",
    padding: "16px",
    borderRadius: "14px",
    background: "rgba(0,0,0,0.18)",
    color: "#c5c5d8",
  },
};

export default App;
