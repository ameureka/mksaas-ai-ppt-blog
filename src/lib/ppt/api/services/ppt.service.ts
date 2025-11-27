/**
 * PPT服务
 * 实现搜索、下载、浏览等功能
 */

import { ApiClient } from '@/lib/ppt/api/client';
import type {
  DownloadResponse,
  SearchRequest,
  SearchResponse,
  SearchSuggestionsRequest,
  SearchSuggestionsResponse,
} from '@/lib/types/ppt/api';
import type { PPT } from '@/lib/types/ppt/ppt';

export class PPTService {
  /**
   * 搜索PPT模板
   * @param params 搜索参数
   * @returns 搜索结果
   */
  static async search(params: SearchRequest): Promise<SearchResponse> {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null) as [string, string][]
    ).toString();

    return ApiClient.get<SearchResponse>(`/ppts/search?${queryString}`);
  }

  /**
   * 获取PPT详情
   * @param id PPT ID
   * @returns PPT详细信息
   */
  static async getById(id: string): Promise<PPT> {
    return ApiClient.get<PPT>(`/ppts/${id}`);
  }

  /**
   * 下载PPT
   * @param pptId PPT ID
   * @returns 下载链接和剩余积分
   */
  static async download(pptId: string): Promise<DownloadResponse> {
    return ApiClient.post<DownloadResponse>(
      `/ppts/${pptId}/download`,
      {},
      true // 需要认证
    );
  }

  /**
   * 获取搜索建议
   * @param params 搜索建议参数
   * @returns 建议列表
   */
  static async getSuggestions(
    params: SearchSuggestionsRequest
  ): Promise<SearchSuggestionsResponse> {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null) as [string, string][]
    ).toString();
    return ApiClient.get<SearchSuggestionsResponse>(
      `/search/suggestions?${queryString}`
    );
  }

  /**
   * 获取精选PPT
   * @param limit 数量限制
   * @returns PPT列表
   */
  static async getFeatured(limit = 8): Promise<PPT[]> {
    return ApiClient.get<PPT[]>(`/ppts/featured?limit=${limit}`);
  }

  /**
   * 获取最新PPT
   * @param limit 数量限制
   * @returns PPT列表
   */
  static async getLatest(limit = 8): Promise<PPT[]> {
    return ApiClient.get<PPT[]>(`/ppts/latest?limit=${limit}`);
  }

  /**
   * 记录浏览次数
   * @param pptId PPT ID
   */
  static async recordView(pptId: string): Promise<void> {
    await ApiClient.post(`/ppts/${pptId}/view`, {});
  }
}
