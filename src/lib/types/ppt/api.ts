/**
 * API 类型定义
 * 前后端接口契约，确保类型安全
 */

// ============ 用户相关 ============
export interface ApiUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  credits: number; // Changed from 'points' to 'credits' for consistency
  role: 'user' | 'vip' | 'admin';
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: ApiUser;
  token: string;
  expiresAt: string;
}

// ============ PPT相关 ============
export interface ApiPPT {
  id: string;
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  tags: string[];
  language: 'Chinese' | 'English';
  preview_url: string;
  preview_urls?: string[];
  downloadUrl?: string;
  pages: number;
  file_size: number;
  file_sizeDisplay?: string;
  format?: string;
  aspectRatio?: string;
  downloads: number;
  views: number;
  rating?: number;
  reviewCount?: number;
  price: number; // 积分价格，0表示免费
  author?: string;
  isFeatured?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchRequest {
  query: string;
  category?: string;
  language?: string;
  sort?: 'popular' | 'newest' | 'downloads';
  page?: number;
  pageSize?: number;
}

export interface SearchResponse {
  results: ApiPPT[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface DownloadRequest {
  pptId: string;
  method: 'firstFree' | 'credits' | 'ad' | 'register';
}

export interface DownloadResponse {
  downloadUrl: string;
  expiresAt: string; // 48 hours validity
  remainingCredits?: number;
}

export interface UserDownloadHistory {
  pptId: string;
  downloadedAt: string;
  method: string;
}

export interface UserDownloadStatus {
  pptId: string;
  hasDownloadedBefore: boolean;
  isFirstDownloadAvailable: boolean; // Whether this PPT offers first free download
  remainingFreeDownloads: number;
  lastDownloadAt?: string;
  downloadMethod?: 'firstFree' | 'credits' | 'ad' | 'register';
}

// ============ 搜索建议 ============
export interface SearchSuggestionsRequest {
  query: string;
  limit?: number;
}

export interface SearchSuggestionsResponse {
  suggestions: string[];
  history: string[];
  trending: string[];
}

// ============ 审计日志 ============
export interface AuditLog {
  action: string;
  userId?: string;
  metadata: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

// ============ API响应统一格式 ============
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

// ============ 错误代码 ============
export enum ApiErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  RATE_LIMITED = 'RATE_LIMITED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INSUFFICIENT_POINTS = 'INSUFFICIENT_POINTS',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface DownloadOption {
  type: 'firstFree' | 'credits' | 'ad' | 'register';
  label: string;
  requiredCredits?: number;
  rewardCredits?: number;
  description: string;
  icon?: string;
  enabled: boolean;
  disabledReason?: string;
}

// ============ Review相关接口 ============
export interface Review {
  id: string;
  pptId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  verified: boolean; // Whether user has downloaded this PPT
  helpful: number;
  created_at: string;
  updated_at?: string;
}

export interface ReviewsRequest {
  pptId: string;
  page?: number;
  pageSize?: number;
  sort?: 'newest' | 'helpful' | 'rating';
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  average: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  page: number;
  pageSize: number;
}

export interface SubmitReviewRequest {
  pptId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
}

export interface SubmitReviewResponse {
  review: Review;
  creditsEarned: number;
}

export interface MarkReviewHelpfulRequest {
  reviewId: string;
}

// ============ 下载日志相关接口 ============
export interface DownloadLog {
  id: string;
  userId: string;
  pptId: string;
  method: 'firstFree' | 'credits' | 'ad' | 'register';
  creditsUsed?: number;
  downloadUrl: string;
  expiresAt: string;
  created_at: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateDownloadLogRequest {
  pptId: string;
  method: 'firstFree' | 'credits' | 'ad' | 'register';
}

export interface CreateDownloadLogResponse {
  log: DownloadLog;
  downloadUrl: string;
  expiresAt: string;
  remainingCredits?: number;
}

// ============ 积分相关接口 ============
export interface CreditsBalance {
  balance: number;
  pendingRewards: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

export interface CreditsTransaction {
  id: string;
  userId: string;
  amount: number; // Positive for earning, negative for spending
  type: 'earned' | 'spent' | 'refund';
  reason: string;
  relatedId?: string; // PPT ID or Review ID
  created_at: string;
}
