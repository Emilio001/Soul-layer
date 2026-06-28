# Soul-layer

\*\*Trabajo Fin de Grado\*\* — Ingeniería de Sonido e Imagen en Telecomunicación  

Universidad de Alicante · 2026  

Autor: Emilio



\---



\## Descripción



Soul Layer es un sistema de identidad digital descentralizada y tokenizada orientado a plataformas multimedia. Combina identificadores descentralizados (DID), verificación criptográfica de humanidad mediante firmas ECDSA y gestión de reputación persistente mediante tokens no transferibles (Soulbound Tokens) desplegados sobre blockchain compatible con Ethereum.



El sistema permite a los usuarios disponer de una identidad digital persistente asociada a un token reputacional no transferible, cuya información puede ser consultada públicamente sin necesidad de exponer datos personales. Las plataformas multimedia pueden consultar el estado reputacional de los usuarios para aplicar políticas de acceso, participación o visibilidad de contenido.



\---



\## Características principales



\- \*\*Identidad descentralizada\*\*: cada usuario dispone de un perfil Soul Layer vinculado a su dirección blockchain, sin depender de una autoridad central.

\- \*\*Token no transferible (Soulbound Token)\*\*: la reputación permanece asociada permanentemente a la identidad que la ha generado, implementada sobre el estándar ERC-721.

\- \*\*Verificación de humanidad\*\*: mecanismo basado en firmas ECDSA generadas off-chain y verificadas on-chain mediante `ecrecover`, con protección anti-replay basada en nonces.

\- \*\*Sistema de roles descentralizado\*\*: control de acceso distribuido entre tres roles independientes (`ADMIN\_ROLE`, `VERIFIER\_ROLE`, `REPUTATION\_ROLE`) mediante OpenZeppelin AccessControl.

\- \*\*Reputación con eventos tipados\*\*: historial reputacional trazable con semántica asociada a cada cambio (`CONTENT\_CREATED`, `POSITIVE\_REVIEW`, `NEGATIVE\_REVIEW`, `COMMUNITY\_REWARD`, `MODERATION\_PENALTY`).

\- \*\*Derecho al olvido\*\*: función `burnSoul()` que permite al usuario eliminar voluntariamente su identidad del sistema.

\- \*\*Interfaz web descentralizada\*\*: dApp funcional construida con React, Vite y ethers.js, integrada con MetaMask.



\---



\## Estructura del repositorio



soul-layer/

├── contracts/

│   └── SoulToken.sol

├── scripts/

│   ├── deploy.js

│   ├── mintSoul.js

│   ├── verifyHuman.js

│   ├── updateReputation.js

│   └── readProfile.js

├── test/

│   └── SoulToken.test.js

├── frontend/

│   └── src/

│       ├── App.jsx

│       └── abi/

│           └── SoulTokenABI.js

├── hardhat.config.cjs

├── package.json

├── .env.example

└── README.md



\---



\## Tecnologías utilizadas



| Tecnología | Versión | Uso |

|---|---|---|

| Solidity | 0.8.24 | Desarrollo del contrato inteligente |

| Hardhat | Latest | Compilación, tests y despliegue |

| OpenZeppelin Contracts | 5.x | ERC-721, AccessControl, ECDSA |

| Chai | Latest | Aserciones en tests automatizados |

| ethers.js | Latest | Comunicación frontend-blockchain |

| React + Vite | Latest | Interfaz web descentralizada |

| MetaMask | - | Wallet y firma de transacciones |

| Polygon Amoy | Testnet | Red blockchain de pruebas |



\---



\## Instalación y uso



\### Requisitos previos



\- Node.js >= 18

\- npm >= 9

\- MetaMask instalado en el navegador



\### Instalación



git clone https://github.com/Emilio001/Soul-layer.git

cd Soul-layer

npm install



\### Configuración



cp .env.example .env



Edita .env con tus datos:



PRIVATE\_KEY=tu\_clave\_privada

ALCHEMY\_API\_KEY=tu\_api\_key\_de\_alchemy



\### Compilar el contrato



npx hardhat compile



\### Ejecutar los tests



npx hardhat test



Resultado esperado: 42 tests pasados.



\### Desplegar en Polygon Amoy



npx hardhat run scripts/deploy.js --network amoy



\### Ejecutar la interfaz web



cd frontend

npm install

npm run dev



\---



\## Contrato desplegado



| Campo | Valor |

|---|---|

| Red | Polygon Amoy Testnet |

| Contrato | SoulToken |

| Dirección | 0x342C1023Dc80b395FB7F381C3316d75dE03303e4 |

| Explorador | https://amoy.polygonscan.com/address/0x342C1023Dc80b395FB7F381C3316d75dE03303e4 |



\---



\## Roles del sistema



| Rol | Descripción |

|---|---|

| ADMIN\_ROLE | Gestión general del sistema y asignación de roles |

| VERIFIER\_ROLE | Emisión de verificaciones de humanidad mediante firmas ECDSA |

| REPUTATION\_ROLE | Actualización de atributos reputacionales por plataformas autorizadas |



\---



\## Tests automatizados



La batería de tests cubre 9 grupos temáticos:



1\. Despliegue y roles

2\. Creación de identidades (mintSoul)

3\. Eliminación voluntaria (burnSoul)

4\. Verificación por firma ECDSA

5\. Protección anti-replay (nonces)

6\. Revocación de verificación

7\. Incremento y decremento de reputación con eventos tipados

8\. No transferibilidad del token

9\. Flujos completos de integración
