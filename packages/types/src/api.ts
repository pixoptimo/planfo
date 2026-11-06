export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  field?: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface DashboardStats {
  pagesCount: number;
  postsCount: number;
  productsCount: number;
  draftsCount: number;
  mediaCount: number;
  categoriesCount: number;
  recentlyUpdated: Array<{
    id: string;
    title: string;
    type: 'page' | 'post' | 'product';
    slug: string;
    status: string;
    updatedAt: string;
  }>;
}

export interface PublishResult {
  success: boolean;
  publishedAt: string;
  durationMs: number;
  stats: {
    pagesGenerated: number;
    postsGenerated: number;
    productsGenerated: number;
    taxonomiesGenerated: number;
    assetsCopied: number;
    sitemapGenerated: boolean;
    robotsGenerated: boolean;
    cssFilesCompressed?: number;
    jsFilesCompressed?: number;
    htmlFilesCompressed?: number;
    unwantedFilesPurged?: number;
    bytesSaved?: number;
  };
  outputPath: string;
  deployment?: {
    target: string;
    branch?: string;
    commitSha?: string;
    cname?: string;
  };
  errors?: string[];
}
