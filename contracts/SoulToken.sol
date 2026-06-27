// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title SoulToken - Soulbound Token para identidad digital descentralizada
/// @author Emilio Martínez Delgado
/// @notice Token no transferible que representa la identidad y reputación de un usuario
contract SoulToken is ERC721, Ownable {

    // -------- Errores personalizados --------
    error SoulAlreadyExists();
    error SoulDoesNotExist();
    error NonTransferable();
    error ApprovalsDisabled();

    // -------- Estado --------
    uint256 private _nextTokenId;

    struct SoulProfile {
        bool exists;
        bool isHuman;
        uint256 reputation;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // Mappings por address (identidad = address EOA)
    mapping(address => uint256) private _soulOf;
    mapping(address => SoulProfile) private _profiles;

    // -------- Eventos --------
    event SoulCreated(address indexed user, uint256 indexed tokenId);
    event HumanVerified(address indexed user, bool verified);
    event ReputationUpdated(address indexed user, uint256 oldReputation, uint256 newReputation);

    constructor() ERC721("Soul Layer Token", "SOUL") Ownable(msg.sender) {
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
            exists: true,
            isHuman: false,
            reputation: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit SoulCreated(msg.sender, tokenId);
    }

    // -------- Admin --------

    /// @notice Marca o desmarca una identidad como verificada como humano
    function verifyHuman(address user, bool verified) external onlyOwner {
        if (!_profiles[user].exists) revert SoulDoesNotExist();

        _profiles[user].isHuman = verified;
        _profiles[user].updatedAt = block.timestamp;
        emit HumanVerified(user, verified);
    }

    /// @notice Establece directamente el valor de reputación de un usuario
    function updateReputation(address user, uint256 newReputation) external onlyOwner {
        if (!_profiles[user].exists) revert SoulDoesNotExist();

        uint256 oldReputation = _profiles[user].reputation;
        _profiles[user].reputation = newReputation;
        _profiles[user].updatedAt = block.timestamp;
        emit ReputationUpdated(user, oldReputation, newReputation);
    }

    /// @notice Incrementa la reputación de un usuario en un número de puntos
    function increaseReputation(address user, uint256 points) external onlyOwner {
        if (!_profiles[user].exists) revert SoulDoesNotExist();

        uint256 oldReputation = _profiles[user].reputation;
        uint256 newReputation = oldReputation + points;
        _profiles[user].reputation = newReputation;
        _profiles[user].updatedAt = block.timestamp;
        emit ReputationUpdated(user, oldReputation, newReputation);
    }

    /// @notice Decrementa la reputación de un usuario, con mínimo en 0
    function decreaseReputation(address user, uint256 points) external onlyOwner {
        if (!_profiles[user].exists) revert SoulDoesNotExist();

        uint256 oldReputation = _profiles[user].reputation;
        uint256 newReputation = (points >= oldReputation) ? 0 : (oldReputation - points);
        _profiles[user].reputation = newReputation;
        _profiles[user].updatedAt = block.timestamp;
        emit ReputationUpdated(user, oldReputation, newReputation);
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

    // -------- No transferibilidad --------

    /// @dev Bloquea cualquier transferencia entre usuarios (solo mint y burn permitidos)
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
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
}
