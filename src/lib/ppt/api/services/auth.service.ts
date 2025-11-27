/**
 * 认证服务
 * 实现用户登录、注册、登出等功能
 */

import { ApiClient } from '@/lib/ppt/api/client';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '@/lib/types/ppt/api';
import type { PPTUser } from '@/lib/types/ppt/user';

export class AuthService {
  /**
   * 用户登录
   * @param credentials 登录凭证
   * @returns 认证响应（用户信息 + Token）
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await ApiClient.post<AuthResponse>(
      '/auth/login',
      credentials
    );

    // 保存Token到本地
    ApiClient.setAuthToken(response.token);

    return response;
  }

  /**
   * 用户注册
   * @param data 注册信息
   * @returns 认证响应
   */
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await ApiClient.post<AuthResponse>('/auth/register', data);

    // 自动登录：保存Token
    ApiClient.setAuthToken(response.token);

    return response;
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<void> {
    try {
      await ApiClient.post('/auth/logout', {}, true);
    } finally {
      // 无论后端是否成功，都清除本地Token
      ApiClient.clearAuthToken();
    }
  }

  /**
   * 获取当前用户信息
   * @returns 用户信息
   */
  static async getCurrentUser(): Promise<PPTUser> {
    return ApiClient.get<PPTUser>('/user/profile', true);
  }

  /**
   * 刷新Token
   * @returns 新的认证响应
   */
  static async refreshToken(): Promise<AuthResponse> {
    const response = await ApiClient.post<AuthResponse>(
      '/auth/refresh',
      {},
      true
    );

    ApiClient.setAuthToken(response.token);

    return response;
  }
}
