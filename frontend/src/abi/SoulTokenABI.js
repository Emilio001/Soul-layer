export const SoulTokenABI = [
  // ---- Eventos ----
  "event SoulCreated(address indexed user, uint256 indexed tokenId)",
  "event SoulBurned(address indexed user, uint256 indexed tokenId)",
  "event HumanVerified(address indexed user, bool verified)",
  "event ReputationChanged(address indexed user, uint256 oldReputation, uint256 newReputation, uint8 eventType, address indexed platform)",

  // ---- Funciones de escritura ----
  "function mintSoul() external",
  "function burnSoul() external",
  "function verifyHumanWithSignature(address user, bytes32 nonce, bytes calldata signature) external",
  "function revokeHumanVerification(address user) external",
  "function increaseReputation(address user, uint256 points, uint8 eventType) external",
  "function decreaseReputation(address user, uint256 points, uint8 eventType) external",

  // ---- Funciones de lectura ----
  "function getProfile(address user) external view returns (bool exists, bool isHuman, uint256 reputation, uint256 createdAt, uint256 updatedAt, uint256 tokenId)",
  "function hasSoul(address user) external view returns (bool)",
  "function soulOf(address user) external view returns (uint256)",
  "function isSignatureUsed(bytes32 nonce) external view returns (bool)",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function ADMIN_ROLE() external view returns (bytes32)",
  "function VERIFIER_ROLE() external view returns (bytes32)",
  "function REPUTATION_ROLE() external view returns (bytes32)",
  "function MAX_REPUTATION_PER_TX() external view returns (uint256)",
];
