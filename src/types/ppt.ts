import type { ListParams, ListResult } from './server-action';

export type PPTCategory =
  | 'business'
  | 'product'
  | 'education'
  | 'marketing'
  | 'general';

export type PPTStatus = 'draft' | 'published' | 'archived';

export interface PPT {
  id: string;
  title: string;
  category: PPTCategory;
  author: string;
  description?: string;
  slides_count: number;
  file_size: string;
  file_url: string;
  preview_url?: string;
  downloads: number;
  views: number;
  status?: PPTStatus;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface PPTListParams extends ListParams {
  category?: PPTCategory;
  status?: PPTStatus;
  dateFrom?: string;
  dateTo?: string;
}

export type PPTListResult = ListResult<PPT>;

export interface PPTListFilters {
  search?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'created_at' | 'downloads' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface PPTListResponse {
  data: PPT[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreatePPTInput {
  title: string;
  category: PPTCategory;
  description?: string;
  file_url: string;
  preview_url?: string;
}

export interface UpdatePPTInput {
  title?: string;
  category?: PPTCategory;
  description?: string;
  status?: PPTStatus;
}
