import type { Page, Post, Product, Category, Menu, SiteSettings, StructuredContent } from '@cms/schemas';

export interface TemplateContext {
  site: SiteSettings;
  menu: Menu | null;
  page?: Page;
  post?: Post;
  product?: Product;
  posts?: Post[];
  products?: Product[];
  categories?: Category[];
  category?: Category;
  tag?: string;
  renderContent: (content: StructuredContent) => string;
  formatDate: (dateStr: string) => string;
  formatPrice: (amount: number, currency: string) => string;
  activeSlug?: string;
  currentYear: number;
}
