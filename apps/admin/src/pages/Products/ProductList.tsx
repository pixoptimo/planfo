import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '@cms/schemas';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/UI/StatusBadge.js';
import { useAuth } from '../../context/AuthContext.js';

export const ProductList: React.FC = () => {
  const { can } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.get<Product[]>('/api/products');
      setProducts(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}"?`)) return;
    try {
      await api.delete(`/api/products/${slug}`);
      setProducts(products.filter((p) => p.slug !== slug));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto font-body-md text-on-surface antialiased">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-label-xs text-label-xs uppercase tracking-widest text-primary font-bold">
              05 / Storefront Catalog
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <h1 className="font-headline-lg text-headline-lg font-serif text-on-surface tracking-tight">
            Products Catalog
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant pt-1">
            Manage e-commerce products, pricing, SKU inventory, and specifications.
          </p>
        </div>

        {can('products.create') && (
          <Link
            to="/products/new"
            className="px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all hover:scale-[1.01] self-start sm:self-center"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add New Product</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-lowest border border-surface-container-high/40 p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1 min-w-[260px]">
          <span className="material-symbols-outlined text-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, slug or SKU..."
            className="w-full bg-surface-container-low border border-surface-container-high/30 rounded-xl pl-10 pr-4 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container-low border border-surface-container-high/30 rounded-xl px-3.5 py-1.5 font-label-sm text-label-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead className="bg-surface-container-low text-on-surface-variant font-label-xs text-label-xs uppercase tracking-wider border-b border-surface-container-high/40">
              <tr>
                <th className="px-6 py-3.5">Product Name</th>
                <th className="px-6 py-3.5">SKU</th>
                <th className="px-6 py-3.5">Price</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/30 text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant font-body-sm">
                    <div className="flex flex-col items-center gap-2">
                      <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span>Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant font-body-sm">
                    No products found. Add your first store product!
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-surface-container-low/40 transition-colors group">
                    <td className="px-6 py-4">
                      <Link
                        to={`/products/${prod.slug}`}
                        className="hover:text-primary transition-colors flex items-center gap-3"
                      >
                        {prod.images?.[0] ? (
                          <img
                            src={prod.images[0]}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover border border-surface-container-high/40 shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-surface-container border border-surface-container-high/40 flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-title-sm text-title-sm font-semibold text-on-surface truncate">
                            {prod.name}
                          </span>
                          {prod.featured && (
                            <span className="material-symbols-outlined text-amber-500 text-[16px] shrink-0 fill-current">
                              star
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant font-mono">
                      {prod.sku || '—'}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono font-bold text-primary">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: prod.currency || 'USD'
                      }).format(prod.price)}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="bg-surface-container px-2.5 py-0.5 rounded-full font-label-xs text-label-xs font-medium text-on-surface">
                        {prod.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={prod.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/api/preview/product/${prod.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                          title="Live Preview"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </a>
                        <Link
                          to={`/products/${prod.slug}`}
                          className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </Link>
                        {can('products.delete') && (
                          <button
                            type="button"
                            onClick={() => handleDelete(prod.slug, prod.name)}
                            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
