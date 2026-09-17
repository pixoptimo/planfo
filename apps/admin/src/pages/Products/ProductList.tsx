import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, ShoppingBag, Star } from 'lucide-react';
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
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.slug.includes(search.toLowerCase()) ||
                          p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Products Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">Manage e-commerce products, pricing, SKU codes, and specifications</p>
        </div>

        {can('products.create') && (
          <Link
            to="/products/new"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, slug or SKU..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading products...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No products found. Add your first store product!
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-3.5 font-semibold text-white">
                      <Link to={`/products/${prod.slug}`} className="hover:text-brand-400 transition flex items-center space-x-3">
                        {prod.images?.[0] ? (
                          <img src={prod.images[0]} alt="" className="w-8 h-8 rounded object-cover border border-slate-800" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-500">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <span>{prod.name}</span>
                          {prod.featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-400 font-mono">
                      {prod.sku || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono font-bold text-emerald-400">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: prod.currency || 'USD' }).format(prod.price)}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-300 font-mono">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px]">{prod.category}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={prod.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <a
                          href={`/api/preview/product/${prod.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded transition"
                          title="Live Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <Link
                          to={`/products/${prod.slug}`}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        {can('products.delete') && (
                          <button
                            type="button"
                            onClick={() => handleDelete(prod.slug, prod.name)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
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
