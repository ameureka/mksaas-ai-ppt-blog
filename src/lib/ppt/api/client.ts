/**
 * API客户端抽象层
 * 统一处理请求、响应、错误、认证
 */

import type { ApiErrorCode } from '@/lib/types/ppt/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
}

export class ApiClient {
  private static async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { requiresAuth = false, ...fetchConfig } = config;

    // 构建请求头
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchConfig.headers,
    };

    // 添加认证token（如果需要）
    if (requiresAuth) {
      const token = ApiClient.getAuthToken();
      if (token) {
        (headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchConfig,
        headers,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new ApiError(
          data.error?.code || 'INTERNAL_ERROR',
          data.error?.message || 'Request failed',
          data.error?.details
        );
      }

      return data.data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // 网络错误或其他异常
      throw new ApiError(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  static get<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return ApiClient.request<T>(endpoint, {
      method: 'GET',
      requiresAuth,
    });
  }

  static post<T>(
    endpoint: string,
    body?: unknown,
    requiresAuth = false
  ): Promise<T> {
    return ApiClient.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      requiresAuth,
    });
  }

  static put<T>(
    endpoint: string,
    body?: unknown,
    requiresAuth = false
  ): Promise<T> {
    return ApiClient.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      requiresAuth,
    });
  }

  static delete<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return ApiClient.request<T>(endpoint, {
      method: 'DELETE',
      requiresAuth,
    });
  }

  // Token管理
  private static getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  static setAuthToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  }

  static clearAuthToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
  }
}
