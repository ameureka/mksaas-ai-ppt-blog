export interface ChannelConfig {
  id: string;
  name: string;
  baseUrl: string;
  pagePattern: string;
  perPage: number;
  maxPage?: number;
}

export interface TemplateCard {
  title: string;
  detailUrl: string;
  coverUrl?: string | undefined;
  category?: string | undefined;
  channelId: string;
  page: number;
}

export interface TemplateDetail {
  aid: string;
  title: string;
  channelName?: string | undefined;
  updatedAt?: string | undefined;
  fileSizeKB?: number | undefined;
  attachmentType?: string | undefined;
  ratio?: string | undefined;
  tags: string[];
  downloadLink: string;
  detailUrl: string;
}

export interface DownloadLinks {
  local?: string | undefined;
  quark?: string | undefined;
}
