// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title SoulToken - Soulbound Token para identidad digital descentralizada
/// @author Emilio Martínez Delgado
/// @notice Token no transferible que representa la identidad y reputación de un usuario.
///         La verificación de humanidad se realiza mediante firma ECDSA de un verificador
///         autorizado, sin depender de un único administrador con control absoluto.
contract SoulToken is ERC721, AccessControl {
    using ECDSA for bytes32;

    // -------- Roles --------
    /// @notice Puede gestionar roles y configuración general del sistema
    bytes32 public constant ADMIN_ROLE     = keccak256("ADMIN_ROLE");
    /// @notice Entidades autorizadas a emitir verificaciones de humanidad
    bytes32 public constant VERIFIER_ROLE  = keccak256("VERIFIER_ROLE");
    /// @notice Plataformas autorizadas a actualizar la reputación de usuarios
    bytes32 public constant REPUTATION_ROLE = keccak256("REPUTATION_ROLE");

    // -------- Errores personalizados --------
    error SoulAlreadyExists();
    error SoulDoesNotExist();
    error NonTransferable();
    error ApprovalsDisabled();
    error InvalidSignature();
    error SignatureAlreadyUsed();
    error MaxReputationPerTxExceeded();
    error NotTokenOwner();

    // -------- Constantes --------
    /// @notice Máximo de puntos de reputación por transacción (evita inflación)
    uint256 public constant MAX_REPUTATION_PER_TX = 100;

    // -------- Tipos de evento reputacional --------
    enum ReputationEvent {
        CONTENT_CREATED,     // El usuario publicó contenido
        POSITIVE_REVIEW,     // El usuario recibió una valoración positiva
        NEGATIVE_REVIEW,     // El usuario recibió una valoración negativa
        COMMUNITY_REWARD,    // Recompensa por contribución a la comunidad
        MODERATION_PENALTY   // Penalización por comportamiento inadecuado
    }

    // -------- Estado --------
    uint256 private _nextTokenId;

    struct SoulProfile {
        bool exists;
        bool isHuman;
        uint256 reputation;
        uint256 createdAt;
        uint256 updatedAt;
    }

    mapping(address => uint256)     private _soulOf;
    mapping(address => SoulProfile) private _profiles;

    /// @notice Registro de nonces usados para evitar replay attacks en verificación
    mapping(bytes32 => bool) private _usedSignatures;

    // -------- Eventos --------
    event SoulCreated(address indexed user, uint256 indexed tokenId);
    event SoulBurned(address indexed user, uint256 indexed tokenId);
    event HumanVerified(address indexed user, bool verified);
    event ReputationChanged(
        address indexed user,
        uint256 oldReputation,
        uint256 newReputation,
        ReputationEvent eventType,
        address indexed platform
    );

    // -------- Constructor --------
    constructor(address admin) ERC721("Soul Layer Token", "SOUL") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _nextTokenId = 1;
    }

    // -------- Core --------

    /// @notice Crea una nueva identidad Soul Layer para el llamante
    function mintSoul() external {
        if (_profiles[msg.sender].exists) revert SoulAlreadyExists();

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        _soulOf[msg.sender] = tokenId;
        _profiles[msg.sender] = SoulProfile({
            exists:     true,
            isHuman:    false,
            reputation: 0,
            createdAt:  block.timestamp,
            updatedAt:  block.timestamp
        });

        emit SoulCreated(msg.sender, tokenId);
    }

    /// @notice Permite al propio usuario eliminar su identidad (derecho al olvido)
    function burnSoul() external {
        if (!_profiles[msg.sender].exists) revert SoulDoesNotExist();

        uint256 tokenId = _soulOf[msg.sender];

        delete _soulOf[msg.sender];
        delete _profiles[msg.sender];
        _burn(tokenId);

        emit SoulBurned(msg.sender, tokenId);
    }

    // -------- Verificación de humanidad --------

    /// @notice Verifica un usuario como humano mediante firma ECDSA de un verificador autorizado.
    /// @dev    El verificador firma off-chain el mensaje (user, nonce, chainId).
    ///         El contrato valida la firma on-chain con ecrecover, sin almacenar datos personales.
    ///         Cada firma solo puede usarse una vez (protección anti-replay).
    /// @param user     Dirección del usuario a verificar
    /// @param nonce    Valor único generado por el verificador para esta verificación
    /// @param signature Firma ECDSA generada por el verificador autorizado
    function verifyHumanWithSignature(
        address user,
        bytes32 nonce,
        bytes calldata signature
    ) external {
        if (!_profiles[user].exists) revert SoulDoesNotExist();
        if (_usedSignatures[nonce])  revert SignatureAlreadyUsed();

        // Reconstruir el mensaje que el verificador firmó
        bytes32 messageHash = keccak256(
            abi.encodePacked(user, nonce, block.chainid)
        );
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(messageHash);

        // Recuperar la dirección del firmante y comprobar que tiene el rol VERIFIER
        address signer = ECDSA.recover(ethSignedHash, signature);
        if (!hasRole(VERIFIER_ROLE, signer)) revert InvalidSignature();

        // Marcar la firma como usada (anti-replay)
        _usedSignatures[nonce] = true;

        _profiles[user].isHuman    = true;
        _profiles[user].updatedAt  = block.timestamp;
        emit HumanVerified(user, true);
    }

    /// @notice Revoca la verificación de humanidad (solo VERIFIER_ROLE)
    function revokeHumanVerification(address user) external onlyRole(VERIFIER_ROLE) {
        if (!_profiles[user].exists) revert SoulDoesNotExist();
        _profiles[user].isHuman   = false;
        _profiles[user].updatedAt = block.timestamp;
        emit HumanVerified(user, false);
    }

    // -------- Gestión de reputación --------

    /// @notice Incrementa la reputación de un usuario asociando un tipo de evento
    /// @param user      Dirección del usuario
    /// @param points    Puntos a incrementar (máximo MAX_REPUTATION_PER_TX por tx)
    /// @param eventType Tipo de evento que origina el cambio
    function increaseReputation(
        address user,
        uint256 points,
        ReputationEvent eventType
    ) external onlyRole(REPUTATION_ROLE) {
        if (!_profiles[user].exists)    revert SoulDoesNotExist();
        if (points > MAX_REPUTATION_PER_TX) revert MaxReputationPerTxExceeded();

        uint256 oldReputation = _profiles[user].reputation;
        uint256 newReputation = oldReputation + points;

        _profiles[user].reputation = newReputation;
        _profiles[user].updatedAt  = block.timestamp;

        emit ReputationChanged(user, oldReputation, newReputation, eventType, msg.sender);
    }

    /// @notice Decrementa la reputación de un usuario, con mínimo en 0
    /// @param user      Dirección del usuario
    /// @param points    Puntos a decrementar
    /// @param eventType Tipo de evento que origina el cambio
    function decreaseReputation(
        address user,
        uint256 points,
        ReputationEvent eventType
    ) external onlyRole(REPUTATION_ROLE) {
        if (!_profiles[user].exists) revert SoulDoesNotExist();

        uint256 oldReputation = _profiles[user].reputation;
        uint256 newReputation = (points >= oldReputation) ? 0 : (oldReputation - points);

        _profiles[user].reputation = newReputation;
        _profiles[user].updatedAt  = block.timestamp;

        emit ReputationChanged(user, oldReputation, newReputation, eventType, msg.sender);
    }

    // -------- Vistas --------

    /// @notice Devuelve el perfil completo de un usuario
    function getProfile(address user)
        external
        view
        returns (
            bool exists,
            bool isHuman,
            uint256 reputation,
            uint256 createdAt,
            uint256 updatedAt,
            uint256 tokenId
        )
    {
        SoulProfile memory p = _profiles[user];
        return (p.exists, p.isHuman, p.reputation, p.createdAt, p.updatedAt, _soulOf[user]);
    }

    /// @notice Indica si una dirección tiene un Soul creado
    function hasSoul(address user) external view returns (bool) {
        return _profiles[user].exists;
    }

    /// @notice Devuelve el tokenId asociado a una dirección
    function soulOf(address user) external view returns (uint256) {
        if (!_profiles[user].exists) revert SoulDoesNotExist();
        return _soulOf[user];
    }

    /// @notice Indica si una firma (nonce) ya fue utilizada
    function isSignatureUsed(bytes32 nonce) external view returns (bool) {
        return _usedSignatures[nonce];
    }

    // -------- No transferibilidad --------

    /// @dev Bloquea cualquier transferencia entre usuarios (solo mint y burn permitidos)
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert NonTransferable();
        return super._update(to, tokenId, auth);
    }

    /// @dev Deshabilita aprobaciones, coherente con la no transferibilidad
    function approve(address, uint256) public pure override {
        revert ApprovalsDisabled();
    }

    /// @dev Deshabilita aprobaciones para todos, coherente con la no transferibilidad
    function setApprovalForAll(address, bool) public pure override {
        revert ApprovalsDisabled();
    }

    // -------- Resolución de conflicto de herencia --------

    /// @dev ERC721 y AccessControl definen supportsInterface; hay que resolverlo explícitamente
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
