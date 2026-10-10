import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  History,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Star
} from 'lucide-react';
import type { Product, Category, RevisionMeta } from '@cms/schemas';
import { api } from '../../api/client.js';
import { StructuredEditor } from '../../components/Editor/StructuredEditor.js';
import { SEOFields } from '../../components/SEO/SEOFields.js';
import { MediaPickerModal } from '../../components/Media/MediaPickerModal.js';
import { StatusBadge } from '../../components/UI/StatusBadge.js';
import { CategorySelector } from '../../components/Taxonomy/CategorySelector.js';
import { useAuth } from '../../context/AuthContext.js';

export const ProductEdit: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const isNew = !slug || slug === 'new';
  const navigate = useNavigate();
  const { can } = useAuth();

  const [product, setProduct] = useState<Partial<Product>>({
    name: '',
    slug: '',
    sku: '',
    price: 0,
    currency: 'USD',
    shortDescription: '',
    description: { blocks: [] },
    images: [],
    category: 'general',
    tags: [],
    status: 'draft',
    featured: false,
    template: 'default',
    seo: {
      title: '',
      description: '',
      canonical: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      robots: 'index,follow'
    }
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Revisions
  const [revisions, setRevisions] = useState<RevisionMeta[]>([]);
  const [showRevisions, setShowRevisions] = useState(false);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  useEffect(() => {
    loadCategories();
    if (!isNew && slug) {
      loadProduct(slug);
    }
  }, [slug, isNew]);

  const loadCategories = async () => {
    try {
      const data = await api.get<Category[]>('/api/categories?type=product');
      setCategories(data);
    } catch {
      //
    }
  };

  const loadProduct = async (prodSlug: string) => {
    setLoading(true);
    try {
      const data = await api.get<Product>(`/api/products/${prodSlug}`);
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publish = false) => {
    if (!product.name?.trim()) {
      setError('Product name is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const targetStatus = publish ? 'published' : product.status || 'draft';
    const payload = {
      ...product,
      price: Number(product.price || 0),
      status: targetStatus
    };

    try {
      if (isNew) {
        const created = await api.post<Product>('/api/products', payload);
        navigate(`/products/${created.slug}`, { replace: true });
        setSuccess('Product created successfully!');
      } else {
        const updated = await api.put<Product>(`/api/products/${slug}`, payload);
        setProduct(updated);
        setSuccess(publish ? 'Product published successfully!' : 'Product saved successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const addImageToGallery = (url: string) => {
    if (!product.images?.includes(url)) {
      setProduct({ ...product, images: [...(product.images || []), url] });
    }
  };

  const removeImage = (urlToRemove: string) => {
    setProduct({ ...product, images: product.images?.filter((u) => u !== urlToRemove) });
  };

  const loadRevisions = async () => {
    if (isNew || !slug) return;
    setLoadingRevisions(true);
    try {
      const data = await api.get<RevisionMeta[]>(`/api/products/${slug}/revisions`);
      setRevisions(data);
    } catch {
      //
    } finally {
      setLoadingRevisions(false);
    }
  };

  const restoreRevision = async (revId: string) => {
    if (!slug) return;
    if (!confirm('Restore this revision?')) return;

    try {
      const restored = await api.post<Product>(`/api/products/${slug}/revisions/${revId}/restore`);
      setProduct(restored);
      setShowRevisions(false);
      setSuccess('Restored revision successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Restore failed');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Loading product data...</div>;
  }

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/products"
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {isNew ? 'Add New Product' : `Edit: ${product.name}`}
              </h1>
              {!isNew && product.status && <StatusBadge status={product.status} />}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              URL: /products/{product.slug || 'slug-preview'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isNew && (
            <>
              <button
                type="button"
                onClick={() => {
                  setShowRevisions(true);
                  loadRevisions();
                }}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <History className="w-3.5 h-3.5" />
                <span>Revisions</span>
              </button>

              <a
                href={`/api/preview/product/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-brand-400 border border-slate-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </a>
            </>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Draft</span>
          </button>

          {can('products.publish') && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Product</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={product.name || ''}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
              placeholder="e.g. Wireless Noise-Cancelling Headphones"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-base font-semibold text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={product.price ?? 0}
                onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Currency
              </label>
              <select
                value={product.currency || 'USD'}
                onChange={(e) => setProduct({ ...product, currency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                SKU / Code
              </label>
              <input
                type="text"
                value={product.sku || ''}
                onChange={(e) => setProduct({ ...product, sku: e.target.value })}
                placeholder="PROD-001"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Short Description / Summary
            </label>
            <textarea
              rows={2}
              value={product.shortDescription || ''}
              onChange={(e) => setProduct({ ...product, shortDescription: e.target.value })}
              placeholder="Brief summary displayed on product cards..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <CategorySelector
            value={product.category || 'general'}
            onChange={(slug) => setProduct({ ...product, category: slug })}
            type="product"
            label="Product Category"
          />

          <div className="pt-2">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={product.featured || false}
                onChange={(e) => setProduct({ ...product, featured: e.target.checked })}
                className="rounded bg-slate-950 border-slate-800 text-brand-500 focus:ring-0"
              />
              <span className="flex items-center space-x-1">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>Feature on Homepage</span>
              </span>
            </label>
          </div>

          {/* Product Gallery Images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Product Gallery
              </label>
              <button
                type="button"
                onClick={() => setShowMediaPicker(true)}
                className="text-xs text-brand-400 hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Image</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(product.images || []).map((img, idx) => (
                <div key={idx} className="relative aspect-square bg-slate-950 rounded border border-slate-800 overflow-hidden group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(img)}
                    className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Structured Content Block Editor for Specifications & Full Details */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Product Details & Specifications
        </label>
        <StructuredEditor
          content={product.description || { blocks: [] }}
          onChange={(newContent) => setProduct({ ...product, description: newContent })}
        />
      </div>

      {/* SEO Accordion */}
      <SEOFields
        seo={product.seo || ({} as any)}
        onChange={(newSeo) => setProduct({ ...product, seo: newSeo })}
        defaultTitle={product.name}
        defaultDescription={product.shortDescription}
      />

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url) => addImageToGallery(url)}
      />

      {/* Revisions Drawer */}
      {showRevisions && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-white text-base">Revision History</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRevisions(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                Close ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {loadingRevisions ? (
                <div className="text-center py-10 text-slate-400">Loading revisions...</div>
              ) : revisions.length === 0 ? (
                <div className="text-center py-10 text-slate-500">No revisions found.</div>
              ) : (
                revisions.map((rev) => (
                  <div key={rev.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-emerald-400">Version {rev.version}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{new Date(rev.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-300">{rev.summary}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-400">By {rev.authorEmail}</span>
                      <button
                        type="button"
                        onClick={() => restoreRevision(rev.id)}
                        className="px-2.5 py-1 bg-brand-600/20 hover:bg-brand-600/40 text-brand-400 rounded text-xs font-semibold"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
