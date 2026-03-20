// ─── User Types ────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'buyer' | 'seller' | 'admin';

// ─── Product Types ──────────────────────────────────────
export interface Product {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;          // in cents (e.g. 999 = $9.99)
  currency: 'USD' | 'INR';
  category: ProductCategory;
  tags: string[];
  fileUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  downloadCount: number;
  rating: number;
  reviewCount: number;
  blockchainCertId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory =
  | 'template'
  | 'tool'
  | 'library'
  | 'script'
  | 'component'
  | 'api'
  | 'other';

// ─── Order Types ────────────────────────────────────────
export interface Order {
  id: string;
  buyerId: string;
  productId: string;
  amount: number;
  currency: 'USD' | 'INR';
  status: OrderStatus;
  blockchainTxId?: string;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'completed' | 'refunded' | 'disputed';

// ─── Gig / Freelancer Types ──────────────────────────────
export interface Gig {
  id: string;
  freelancerId: string;
  title: string;
  description: string;
  priceFrom: number;
  priceTo?: number;
  currency: 'USD' | 'INR';
  deliveryDays: number;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Types ──────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

#### 6. Create `.gitignore` (root)
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
.expo/
*.tsbuildinfo

# Environment files — NEVER commit these
.env
.env.local
.env.production
.env.staging

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/settings.json
.idea/

# Mobile
ios/
android/

# Supabase
supabase/.temp/
