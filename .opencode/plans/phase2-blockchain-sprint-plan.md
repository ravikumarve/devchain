# Phase 2: Blockchain & Web3 - Detailed Sprint Plan

**Duration:** 5 weeks | **Focus:** NFT-based ownership verification on Polygon

---

## 📊 Sprint Overview

| Sprint     | Duration | Focus Area                  | Key Deliverables                           |
| ---------- | -------- | --------------------------- | ------------------------------------------ |
| Sprint 2.1 | Week 1-2 | Smart Contract Development  | Soulbound NFT contract, testnet deployment |
| Sprint 2.2 | Week 3   | Backend NFT Minting Service | Mint API, transaction handling             |
| Sprint 2.3 | Week 4-5 | On-Chain Verification API   | Verification middleware, SDK               |

---

## 🏃 Sprint 2.1: Smart Contract Development (Week 1-2)

### Objective

Develop and deploy a Soulbound Token (SBT) smart contract on Polygon Mumbai testnet.

### Tasks Breakdown

#### Week 1: Contract Architecture

| Day | Task                                           | Agent                             | Deliverable                       |
| --- | ---------------------------------------------- | --------------------------------- | --------------------------------- |
| 1   | Set up Hardhat project in `/blockchain`        | @backend-architect                | `hardhat.config.js`, dependencies |
| 2   | Design SBT contract interface                  | @blockchain-security-auditor      | Contract spec document            |
| 3   | Implement `DevChainLicense.sol`                | @solidity-smart-contract-engineer | Initial contract code             |
| 4   | Add minting logic with purchase binding        | @solidity-smart-contract-engineer | `mintLicense()` function          |
| 5   | Implement soulbound (non-transfer) restriction | @blockchain-security-auditor      | `_beforeTokenTransfer` override   |

#### Week 2: Testing & Deployment

| Day | Task                                  | Agent                        | Deliverable               |
| --- | ------------------------------------- | ---------------------------- | ------------------------- |
| 6   | Write unit tests for contract         | @api-tester                  | `DevChainLicense.test.js` |
| 7   | Add integration tests                 | @api-tester                  | Full mint flow tests      |
| 8   | Security audit (reentrancy, overflow) | @blockchain-security-auditor | Audit report              |
| 9   | Deploy to Polygon Mumbai testnet      | @devops-automator            | Deployed contract address |
| 10  | Verify contract on PolygonScan        | @devops-automator            | Verified contract         |

### Smart Contract Specification

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title DevChainLicense
 * @dev Soulbound NFT for proof of ownership
 * @dev Non-transferable after minting
 */
contract DevChainLicense is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct LicenseData {
        string productId;
        string buyerId;
        uint256 purchaseAmount;
        uint256 mintedAt;
    }

    mapping(uint256 => LicenseData) public licenseData;
    mapping(string => uint256[]) public buyerLicenses; // buyerId -> tokenIds

    event LicenseMinted(
        uint256 indexed tokenId,
        string productId,
        string buyerId,
        address indexed walletAddress
    );

    constructor() ERC721("DevChain License", "DCL") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @dev Mint a soulbound license NFT
     * @param to Recipient wallet address
     * @param productId Product UUID
     * @param buyerId Buyer UUID
     * @param purchaseAmount Amount paid in cents
     */
    function mintLicense(
        address to,
        string calldata productId,
        string calldata buyerId,
        uint256 purchaseAmount
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            productId,
            buyerId
        )));

        _safeMint(to, tokenId);

        licenseData[tokenId] = LicenseData({
            productId: productId,
            buyerId: buyerId,
            purchaseAmount: purchaseAmount,
            mintedAt: block.timestamp
        });

        buyerLicenses[buyerId].push(tokenId);

        emit LicenseMinted(tokenId, productId, buyerId, to);
        return tokenId;
    }

    /**
     * @dev Override transfer to make token soulbound
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        require(
            from == address(0) || to == address(0),
            "DevChainLicense: Soulbound tokens cannot be transferred"
        );
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev Get all licenses for a buyer
     */
    function getLicensesByBuyer(string calldata buyerId)
        external view returns (uint256[] memory) {
        return buyerLicenses[buyerId];
    }

    /**
     * @dev Verify ownership of a product license
     */
    function verifyLicense(
        address wallet,
        string calldata productId
    ) external view returns (bool) {
        uint256[] memory tokens = balanceOf(wallet) > 0
            ? getTokensByOwner(wallet)
            : new uint256[](0);

        for (uint256 i = 0; i < tokens.length; i++) {
            if (keccak256(bytes(licenseData[tokens[i]].productId)) == keccak256(bytes(productId))) {
                return true;
            }
        }
        return false;
    }

    function getTokensByOwner(address owner) internal view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        uint256 index = 0;
        for (uint256 i = 0; i < totalSupply(); i++) {
            if (_ownerOf(i) == owner) {
                tokens[index] = i;
                index++;
            }
        }
        return tokens;
    }

    function supportsInterface(bytes4 interfaceId)
        public view virtual override(ERC721, AccessControl)
        returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
```

### File Structure

```
blockchain/
├── contracts/
│   └── DevChainLicense.sol
├── scripts/
│   ├── deploy.js
│   └── grant-minter-role.js
├── test/
│   └── DevChainLicense.test.js
├── hardhat.config.js
├── package.json
└── .env.example
```

### Dependencies

```json
{
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "hardhat": "^2.19.0"
  },
  "dependencies": {
    "@openzeppelin/contracts": "^5.0.0",
    "dotenv": "^16.3.1"
  }
}
```

### Environment Variables

```env
# .env.example
POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_deployer_private_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### Testing Checklist

- [ ] Mint license successfully
- [ ] Prevent transfer of soulbound token
- [ ] Verify license ownership returns correct boolean
- [ ] Get licenses by buyer ID
- [ ] Multiple licenses for same buyer
- [ ] Revert on unauthorized minting
- [ ] Gas optimization (< 500k gas per mint)

### Risk Mitigation

| Risk                 | Mitigation                              |
| -------------------- | --------------------------------------- |
| Gas cost spikes      | Use Polygon (low gas), batch operations |
| Contract bugs        | Comprehensive unit tests, audit         |
| Private key exposure | Use `.env`, never commit keys           |
| Testnet instability  | Test on multiple RPC endpoints          |

---

## 🏃 Sprint 2.2: Backend NFT Minting Service (Week 3)

### Objective

Integrate NFT minting into the purchase flow via backend service.

### Tasks Breakdown

| Day | Task                                   | Agent               | Deliverable                    |
| --- | -------------------------------------- | ------------------- | ------------------------------ |
| 11  | Install ethers.js, create Web3 service | @backend-architect  | `web3Service.js`               |
| 12  | Add wallet address field to User model | @database-optimizer | Prisma migration               |
| 13  | Create minting controller              | @backend-architect  | `nftController.js`             |
| 14  | Integrate minting into payment webhook | @backend-architect  | Updated `paymentController.js` |
| 15  | Add retry logic for failed mints       | @backend-architect  | Queue-based retry system       |

### Database Schema Changes

```prisma
// Add to User model
model User {
  // ... existing fields
  walletAddress String?  // Already exists
  nftMintingStatus String? // "pending" | "minted" | "failed"
}

// Add to OwnershipRecord model
model OwnershipRecord {
  // ... existing fields
  nftTokenId String?      // Token ID from blockchain
  mintingStatus String @default("pending") // "pending" | "minted" | "failed"
  mintingTxHash String?   // Transaction hash
  mintingError String?    // Error message if failed
  retryCount Int @default(0)
}
```

### Backend Service Implementation

```javascript
// backend/src/services/web3Service.js
const { ethers } = require('ethers');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Contract ABI (simplified)
const LICENSE_ABI = [
  'function mintLicense(address to, string productId, string buyerId, uint256 purchaseAmount) returns (uint256)',
  'function verifyLicense(address wallet, string productId) view returns (bool)',
  'event LicenseMinted(uint256 indexed tokenId, string productId, string buyerId, address indexed walletAddress)',
];

class Web3Service {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.MINTER_PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(
      process.env.LICENSE_CONTRACT_ADDRESS,
      LICENSE_ABI,
      this.wallet
    );
  }

  /**
   * Mint a license NFT for a purchase
   */
  async mintLicense(buyerWallet, productId, buyerId, purchaseAmount) {
    try {
      const tx = await this.contract.mintLicense(buyerWallet, productId, buyerId, purchaseAmount);

      const receipt = await tx.wait();

      // Parse event to get tokenId
      const event = receipt.logs.find((log) => log.fragment?.name === 'LicenseMinted');

      const tokenId = event?.args?.tokenId?.toString();

      return {
        success: true,
        tokenId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('Minting error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify if a wallet owns a license for a product
   */
  async verifyLicense(walletAddress, productId) {
    try {
      const hasLicense = await this.contract.verifyLicense(walletAddress, productId);
      return { verified: hasLicense };
    } catch (error) {
      console.error('Verification error:', error);
      return { verified: false, error: error.message };
    }
  }
}

module.exports = new Web3Service();
```

### API Endpoints

```javascript
// backend/src/routes/nft.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { mintLicense, verifyLicense, getMyLicenses } = require('../controllers/nftController');

// Mint license (internal, called by payment webhook)
router.post('/mint', protect, mintLicense);

// Verify license ownership
router.get('/verify/:productId', protect, verifyLicense);

// Get user's licenses
router.get('/my-licenses', protect, getMyLicenses);

module.exports = router;
```

### Integration with Payment Flow

```javascript
// In paymentController.js - after successful payment
const web3Service = require('../services/web3Service');

// After Stripe webhook confirms payment
async function handleSuccessfulPayment(session) {
  // ... existing order creation logic

  // Create ownership record
  const ownership = await prisma.ownershipRecord.create({
    data: {
      orderId: order.id,
      buyerId: order.buyerId,
      productId: order.productId,
      ownershipHash: generateOwnershipHash(order),
      mintingStatus: 'pending',
    },
  });

  // Attempt NFT minting if buyer has wallet address
  const buyer = await prisma.user.findUnique({ where: { id: order.buyerId } });

  if (buyer.walletAddress) {
    const mintResult = await web3Service.mintLicense(
      buyer.walletAddress,
      order.productId,
      order.buyerId,
      order.amount
    );

    if (mintResult.success) {
      await prisma.ownershipRecord.update({
        where: { id: ownership.id },
        data: {
          nftTokenId: mintResult.tokenId,
          mintingTxHash: mintResult.txHash,
          mintingStatus: 'minted',
          isOnChain: true,
        },
      });
    } else {
      await prisma.ownershipRecord.update({
        where: { id: ownership.id },
        data: {
          mintingStatus: 'failed',
          mintingError: mintResult.error,
        },
      });
      // Add to retry queue
      await addToMintingRetryQueue(ownership.id);
    }
  }
}
```

### Retry Queue System

```javascript
// backend/src/services/mintingQueue.js
const { PrismaClient } = require('@prisma/client');
const web3Service = require('./web3Service');

const prisma = new PrismaClient();
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 60000; // 1 minute

async function processMintingRetryQueue() {
  const pending = await prisma.ownershipRecord.findMany({
    where: {
      mintingStatus: 'failed',
      retryCount: { lt: MAX_RETRIES },
    },
    include: {
      buyer: true,
    },
  });

  for (const record of pending) {
    if (!record.buyer.walletAddress) continue;

    const result = await web3Service.mintLicense(
      record.buyer.walletAddress,
      record.productId,
      record.buyerId,
      record.purchaseAmount
    );

    if (result.success) {
      await prisma.ownershipRecord.update({
        where: { id: record.id },
        data: {
          nftTokenId: result.tokenId,
          mintingTxHash: result.txHash,
          mintingStatus: 'minted',
          isOnChain: true,
        },
      });
    } else {
      await prisma.ownershipRecord.update({
        where: { id: record.id },
        data: {
          retryCount: { increment: 1 },
          mintingError: result.error,
        },
      });
    }
  }
}

// Run every 5 minutes
setInterval(processMintingRetryQueue, 5 * 60 * 1000);

module.exports = { processMintingRetryQueue };
```

### Testing Checklist

- [ ] Web3 service connects to Polygon
- [ ] Mint license returns correct tokenId
- [ ] Failed mint is queued for retry
- [ ] Retry queue processes pending mints
- [ ] Ownership record updated correctly
- [ ] API endpoints return correct responses

---

## 🏃 Sprint 2.3: On-Chain Verification API (Week 4-5)

### Objective

Create a lightweight verification API that developers can integrate into their applications.

### Tasks Breakdown

#### Week 4: Verification API

| Day | Task                            | Agent              | Deliverable             |
| --- | ------------------------------- | ------------------ | ----------------------- |
| 16  | Design verification API spec    | @backend-architect | OpenAPI spec            |
| 17  | Implement verification endpoint | @backend-architect | `verifyLicense()`       |
| 18  | Add caching layer (Redis)       | @backend-architect | Cache implementation    |
| 19  | Create rate limiting            | @security-engineer | Rate limiter middleware |
| 20  | Write API documentation         | @technical-writer  | API docs                |

#### Week 5: SDK & Integration

| Day | Task                       | Agent               | Deliverable                |
| --- | -------------------------- | ------------------- | -------------------------- |
| 21  | Create JavaScript SDK      | @frontend-developer | `@devchain/verify-sdk`     |
| 22  | Add React hook             | @frontend-developer | `useLicenseVerification()` |
| 23  | Write SDK documentation    | @technical-writer   | README, examples           |
| 24  | Create demo integration    | @frontend-developer | Demo app                   |
| 25  | Final testing & deployment | @api-tester         | E2E tests                  |

### Verification API Specification

```yaml
# OpenAPI 3.0
openapi: 3.0.0
info:
  title: DevChain License Verification API
  version: 1.0.0

paths:
  /api/v1/verify/{productId}:
    get:
      summary: Verify license ownership
      parameters:
        - name: productId
          in: path
          required: true
          schema:
            type: string
        - name: walletAddress
          in: query
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Verification result
          content:
            application/json:
              schema:
                type: object
                properties:
                  verified:
                    type: boolean
                  productId:
                    type: string
                  walletAddress:
                    type: string
                  licenseTokenId:
                    type: string
                    nullable: true
                  mintedAt:
                    type: string
                    format: date-time
                    nullable: true

  /api/v1/verify/batch:
    post:
      summary: Batch verify multiple licenses
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                checks:
                  type: array
                  items:
                    type: object
                    properties:
                      productId:
                        type: string
                      walletAddress:
                        type: string
      responses:
        '200':
          description: Batch verification results
```

### Verification Controller

```javascript
// backend/src/controllers/verifyController.js
const { PrismaClient } = require('@prisma/client');
const web3Service = require('../services/web3Service');
const NodeCache = require('node-cache');

const prisma = new PrismaClient();
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 min cache

/**
 * Verify single license
 */
async function verifyLicense(req, res) {
  try {
    const { productId } = req.params;
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress is required' });
    }

    // Validate wallet address
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // Check cache first
    const cacheKey = `${walletAddress}:${productId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Check database for ownership record
    const ownership = await prisma.ownershipRecord.findFirst({
      where: {
        productId,
        buyer: { walletAddress },
        isOnChain: true,
      },
      include: { buyer: true },
    });

    if (ownership) {
      const result = {
        verified: true,
        productId,
        walletAddress,
        licenseTokenId: ownership.nftTokenId,
        mintedAt: ownership.issuedAt,
      };
      cache.set(cacheKey, result);
      return res.json(result);
    }

    // Fallback to on-chain verification
    const onChainResult = await web3Service.verifyLicense(walletAddress, productId);

    const result = {
      verified: onChainResult.verified,
      productId,
      walletAddress,
      licenseTokenId: null,
      mintedAt: null,
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('VerifyLicense error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
}

/**
 * Batch verify multiple licenses
 */
async function batchVerify(req, res) {
  try {
    const { checks } = req.body;

    if (!Array.isArray(checks) || checks.length === 0) {
      return res.status(400).json({ error: 'checks array is required' });
    }

    if (checks.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 checks per batch' });
    }

    const results = await Promise.all(
      checks.map(async ({ productId, walletAddress }) => {
        const cacheKey = `${walletAddress}:${productId}`;
        const cached = cache.get(cacheKey);

        if (cached) return cached;

        const ownership = await prisma.ownershipRecord.findFirst({
          where: {
            productId,
            buyer: { walletAddress },
            isOnChain: true,
          },
        });

        const result = ownership
          ? {
              verified: true,
              productId,
              walletAddress,
              licenseTokenId: ownership.nftTokenId,
            }
          : {
              verified: false,
              productId,
              walletAddress,
            };

        cache.set(cacheKey, result);
        return result;
      })
    );

    res.json({ results });
  } catch (err) {
    console.error('BatchVerify error:', err);
    res.status(500).json({ error: 'Batch verification failed' });
  }
}

module.exports = { verifyLicense, batchVerify };
```

### JavaScript SDK

```javascript
// packages/verify-sdk/src/index.js
const DEVCHAIN_API = 'https://devchain.onrender.com/api/v1';

class DevChainVerify {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = DEVCHAIN_API;
  }

  /**
   * Verify if a wallet owns a license for a product
   * @param {string} productId - The product UUID
   * @param {string} walletAddress - The wallet address (0x...)
   * @returns {Promise<{verified: boolean, licenseTokenId?: string}>}
   */
  async verify(productId, walletAddress) {
    const response = await fetch(
      `${this.baseUrl}/verify/${productId}?walletAddress=${walletAddress}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Verification failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Batch verify multiple licenses
   * @param {Array<{productId: string, walletAddress: string}>} checks
   * @returns {Promise<{results: Array}>}
   */
  async batchVerify(checks) {
    const response = await fetch(`${this.baseUrl}/verify/batch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ checks }),
    });

    if (!response.ok) {
      throw new Error(`Batch verification failed: ${response.statusText}`);
    }

    return response.json();
  }
}

module.exports = DevChainVerify;
```

### React Hook

```typescript
// packages/verify-sdk/src/react/useLicenseVerification.ts
import { useState, useEffect } from 'react';
import DevChainVerify from '../index';

interface VerificationResult {
  verified: boolean;
  productId: string;
  walletAddress: string;
  licenseTokenId?: string;
  mintedAt?: string;
}

interface UseLicenseVerificationOptions {
  productId: string;
  walletAddress: string;
  apiKey: string;
  autoVerify?: boolean;
}

export function useLicenseVerification({
  productId,
  walletAddress,
  apiKey,
  autoVerify = true,
}: UseLicenseVerificationOptions) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async () => {
    if (!productId || !walletAddress) return;

    setLoading(true);
    setError(null);

    try {
      const client = new DevChainVerify(apiKey);
      const verificationResult = await client.verify(productId, walletAddress);
      setResult(verificationResult);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoVerify && productId && walletAddress) {
      verify();
    }
  }, [productId, walletAddress, autoVerify]);

  return { result, loading, error, verify };
}
```

### Usage Example

```tsx
// In a React app
import { useLicenseVerification } from '@devchain/verify-sdk/react';

function ProtectedFeature({ productId }) {
  const { walletAddress } = useWallet(); // User's wallet hook

  const { result, loading, error } = useLicenseVerification({
    productId,
    walletAddress,
    apiKey: 'your-api-key',
    autoVerify: true,
  });

  if (loading) return <div>Verifying license...</div>;
  if (error) return <div>Error: {error}</div>;

  if (!result?.verified) {
    return (
      <div>
        <h3>License Required</h3>
        <p>Purchase this product to access premium features.</p>
        <a href={`https://devchain-app.vercel.app/product/${productId}`}>Buy Now</a>
      </div>
    );
  }

  return (
    <div>
      <h3>Premium Feature</h3>
      <p>License verified! Token ID: {result.licenseTokenId}</p>
      {/* Premium content here */}
    </div>
  );
}
```

### Testing Checklist

- [ ] Verification API returns correct results
- [ ] Cache hit reduces response time
- [ ] Batch verification handles 50 checks
- [ ] Rate limiting prevents abuse
- [ ] SDK works in Node.js environment
- [ ] React hook integrates correctly
- [ ] Invalid wallet address returns 400
- [ ] Missing parameters return 400

---

## 📊 Phase 2 Summary

### Deliverables

| Deliverable            | Status  | Location                                   |
| ---------------------- | ------- | ------------------------------------------ |
| Soulbound NFT Contract | Pending | `blockchain/contracts/DevChainLicense.sol` |
| Hardhat Project        | Pending | `blockchain/`                              |
| Web3 Service           | Pending | `backend/src/services/web3Service.js`      |
| NFT Controller         | Pending | `backend/src/controllers/nftController.js` |
| Verification API       | Pending | `backend/src/routes/verify.js`             |
| JavaScript SDK         | Pending | `packages/verify-sdk/`                     |
| React Hook             | Pending | `packages/verify-sdk/src/react/`           |

### Environment Variables Required

```env
# Backend .env additions
POLYGON_RPC_URL=https://polygon-rpc.com
MINTER_PRIVATE_KEY=0x...
LICENSE_CONTRACT_ADDRESS=0x...
REDIS_URL=redis://localhost:6379  # For caching
```

### Dependencies to Install

```bash
# Blockchain
cd blockchain && npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts dotenv

# Backend
cd backend
npm install ethers node-cache

# SDK Package
cd packages/verify-sdk
npm init -y
```

### Success Metrics

| Metric                     | Target           |
| -------------------------- | ---------------- |
| Mint gas cost              | < 500,000 gas    |
| Verification response time | < 100ms (cached) |
| Mint success rate          | > 99%            |
| SDK bundle size            | < 10KB           |

---

## 🚨 Risk Register

| Risk                       | Probability | Impact   | Mitigation                                   |
| -------------------------- | ----------- | -------- | -------------------------------------------- |
| Polygon network congestion | Medium      | High     | Use Mumbai testnet first, monitor gas prices |
| Private key compromise     | Low         | Critical | Use environment variables, rotate keys       |
| Contract bug               | Medium      | Critical | Comprehensive tests, audit, bug bounty       |
| API rate limiting bypass   | Medium      | Medium   | Implement Redis-based rate limiting          |
| SDK compatibility issues   | Low         | Medium   | Test on multiple Node versions, browsers     |

---

**Next Phase:** Phase 3 - Service & Job Ecosystem
