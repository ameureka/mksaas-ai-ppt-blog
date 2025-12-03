/**
 * Ad Watch Action Types
 * Types for ad watch start and complete actions
 */

export interface StartWatchRequest {
  pptId: string;
}

export interface StartWatchResponse {
  success: boolean;
  data?: {
    watchToken: string;
    duration: number;
    expiresAt: string;
  };
  error?: string;
  code?: AdWatchError;
}

export interface CompleteWatchRequest {
  watchToken: string;
  pptId: string;
}

export interface CompleteWatchResponse {
  success: boolean;
  data?: {
    downloadToken: string;
    creditsAwarded: number;
    newBalance: number;
  };
  error?: string;
  code?: AdWatchError;
}

export enum AdWatchError {
  USER_LIMIT_EXCEEDED = 'USER_LIMIT_EXCEEDED',
  IP_LIMIT_EXCEEDED = 'IP_LIMIT_EXCEEDED',
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_ALREADY_USED = 'TOKEN_ALREADY_USED',
  TIME_NOT_ELAPSED = 'TIME_NOT_ELAPSED',
  INVALID_PPT = 'INVALID_PPT',
  CREDIT_AWARD_FAILED = 'CREDIT_AWARD_FAILED',
  AD_REWARD_DISABLED = 'AD_REWARD_DISABLED',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

export const AdWatchErrorMessages: Record<AdWatchError, string> = {
  [AdWatchError.USER_LIMIT_EXCEEDED]: '今日观看次数已达上限',
  [AdWatchError.IP_LIMIT_EXCEEDED]: '当前网络观看次数已达上限',
  [AdWatchError.TOKEN_NOT_FOUND]: '观看令牌不存在',
  [AdWatchError.TOKEN_EXPIRED]: '观看令牌已过期',
  [AdWatchError.TOKEN_ALREADY_USED]: '观看令牌已使用',
  [AdWatchError.TIME_NOT_ELAPSED]: '观看时间不足',
  [AdWatchError.INVALID_PPT]: '无效的 PPT',
  [AdWatchError.CREDIT_AWARD_FAILED]: '积分发放失败',
  [AdWatchError.AD_REWARD_DISABLED]: '广告奖励功能已禁用',
  [AdWatchError.UNAUTHORIZED]: '请先登录',
};
