window.RWI_PROFILE_REGISTRY_ABI = Object.freeze([
  {
    "inputs": [],
    "name": "AvatarMimeTypeMismatch",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AvatarTooLarge",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BioTooLong",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAvatarMimeType",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NameTooLong",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint64",
        "name": "version",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "bio",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "avatarMimeType",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "avatar",
        "type": "bytes"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "avatarHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "updatedAt",
        "type": "uint64"
      }
    ],
    "name": "ProfileUpdated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "AVATAR_MIME_JPEG",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "AVATAR_MIME_NONE",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "AVATAR_MIME_PNG",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "AVATAR_MIME_WEBP",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "CODE_VERSION",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_AVATAR_BYTES",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_BIO_BYTES",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_NAME_BYTES",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "profiles",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "bio",
            "type": "string"
          },
          {
            "internalType": "bytes32",
            "name": "avatarHash",
            "type": "bytes32"
          },
          {
            "internalType": "uint64",
            "name": "updatedAt",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "version",
            "type": "uint64"
          },
          {
            "internalType": "uint8",
            "name": "avatarMimeType",
            "type": "uint8"
          }
        ],
        "internalType": "struct RWICreatorProfileRegistry.Profile",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "bio",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "avatarMimeType",
        "type": "uint8"
      },
      {
        "internalType": "bytes",
        "name": "avatar",
        "type": "bytes"
      }
    ],
    "name": "setProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]);
