import type { Page, Post, Product, Category, Menu, SiteSettings, StructuredContent, Blueprint, BlueprintEntry } from '@cms/schemas';

export interface TemplateContext {
  site: SiteSettings;
  menu: Menu | null;
  headerMenu?: Menu | null;
  footerMenu?: Menu | null;
  menus?: Menu[];
  page?: Page;
  post?: Post;
  product?: Product;
  template?: any;
  posts?: Post[];
  products?: Product[];
  templates?: any[];
  categories?: Category[];
  category?: Category;
  blueprint?: Blueprint;
  entry?: BlueprintEntry;
  entries?: BlueprintEntry[];
  tag?: string;
  renderContent: (content: StructuredContent) => string;
  formatDate: (dateStr: string) => string;
  formatPrice: (amount: number, currency: string) => string;
  activeSlug?: string;
  currentYear: number;
}
