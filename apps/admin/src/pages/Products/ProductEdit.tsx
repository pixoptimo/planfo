import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Product, Category, RevisionMeta } from '@cms/schemas';
import { api } from '../../api/client.js';
import { StructuredEditor } from '../../components/Editor/StructuredEditor.js';
import { SEOFields } from '../../components/SEO/SEOFields.js';
import { MediaPickerModal } from '../../components/Media/MediaPickerModal.js';
import { StatusBadge } from '../../components/UI/StatusBadge.js';
import { CategorySelector } from '../../components/Taxonomy/CategorySelector.js';
import { slugify } from '../../utils/slugify.js';
import { useAuth } from '../../context/AuthContext.js';

export const ProductEdit: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const isNew = !slug || slug === 'new';
  const navigate = useNavigate();
  const { can } = useAuth();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!isNew);

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
      robots: 'index,follow',
      noIndex: false
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
      } else {
        const updated = await api.put<Product>(`/api/products/${slug}`, payload);
        setProduct(updated);
        setSuccess('Product saved successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const loadRevisions = async () => {
    if (isNew || !slug) return;
    setLoadingRevisions(true);
    try {
      const data = await api.get<RevisionMeta[]>(`/api/revisions/product/${slug}`);
      setRevisions(data);
    } catch {
      //
    } finally {
      setLoadingRevisions(false);
    }
  };

  const handleRestoreRevision = async (revId: string) => {
    if (!slug) return;
    if (!confirm('Restore this snapshot? Unsaved changes will be replaced.')) return;
    try {
      const restored = await api.post<Product>(`/api/revisions/product/${slug}/${revId}/restore`);
      setProduct(restored);
      setShowRevisions(false);
      setSuccess('Snapshot restored successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Restore failed');
    }
  };

  const removeImage = (urlToRemove: string) => {
    setProduct((prev) => ({
      ...prev,
      images: (prev.images || []).filter((u) => u !== urlToRemove)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 text-on-surface-variant font-body-sm">
        <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span>Loading product editor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto font-body-md text-on-surface antialiased pb-20">
      {/* Header Bar */}
      <div className="w-full bg-surface-container-lowest px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-sm border border-surface-container-high/40 rounded-2xl">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/products"
            className="p-2 text-on-surface-variant hover:text-primary bg-surface-container rounded-xl transition-colors shrink-0"
            title="Back to Products"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-headline-sm text-headline-sm font-serif text-on-surface truncate">
                {isNew ? 'New Product' : `Edit: ${product.name || 'Untitled'}`}
              </h1>
              {!isNew && <StatusBadge status={product.status || 'draft'} />}
            </div>
            <p className="font-code text-code text-on-surface-variant text-[11px] truncate mt-0.5">
              URL: /products/{product.slug || 'slug-preview'}
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2.5">
          {!isNew && (
            <>
              <button
                type="button"
                onClick={() => {
                  setShowRevisions(true);
                  loadRevisions();
                }}
                className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
                <span>Revisions</span>
              </button>

              <a
                href={`/api/preview/product/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-high text-primary rounded-xl font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                <span>Live Preview</span>
              </a>
            </>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">save</span>
            )}
            <span>Save Draft</span>
          </button>

          {can('products.publish') && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {saving ? (
                <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">send</span>
              )}
              <span>{product.status === 'published' ? 'Update Product' : 'Publish Product'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-error-container/40 border border-error/20 rounded-2xl flex items-center gap-3 text-error font-body-sm">
          <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-surface-container-highest border border-primary/20 rounded-2xl flex items-center gap-3 text-primary font-body-sm font-semibold">
          <span className="material-symbols-outlined text-[20px] shrink-0">check_circle</span>
          <span>{success}</span>
        </div>
      )}

      {/* Main 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Title, Pricing, Specs */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={product.name || ''}
                onChange={(e) => {
                  const newName = e.target.value;
                  setProduct((prev) => {
                    const next = { ...prev, name: newName };
                    if (!slugManuallyEdited || !prev.slug) {
                      next.slug = slugify(newName);
                    }
                    return next;
                  });
                }}
                placeholder="e.g. Wireless Noise-Cancelling Headphones"
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-4 py-2.5 font-headline-sm text-headline-sm font-serif text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  URL Slug
                </label>
                {product.name && (
                  <button
                    type="button"
                    onClick={() => {
                      const auto = slugify(product.name || '');
                      setProduct((prev) => ({ ...prev, slug: auto }));
                      setSlugManuallyEdited(false);
                    }}
                    className="font-label-xs text-label-xs text-primary hover:underline font-semibold"
                  >
                    Regenerate from Name
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-code text-code text-on-surface-variant bg-surface-container-low px-3 py-2 rounded-xl border border-surface-container-high/40 text-xs shrink-0">
                  /products/
                </span>
                <input
                  type="text"
                  value={product.slug || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSlugManuallyEdited(val.trim().length > 0);
                    setProduct((prev) => ({ ...prev, slug: val }));
                  }}
                  placeholder="auto-generated-from-name"
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-code text-code text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.price ?? 0}
                  onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-code text-code text-sm font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Currency
                </label>
                <select
                  value={product.currency || 'USD'}
                  onChange={(e) => setProduct({ ...product, currency: e.target.value })}
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
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
                <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  SKU / Code
                </label>
                <input
                  type="text"
                  value={product.sku || ''}
                  onChange={(e) => setProduct({ ...product, sku: e.target.value })}
                  placeholder="PROD-001"
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-code text-code text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Short Description / Summary
              </label>
              <textarea
                rows={2}
                value={product.shortDescription || ''}
                onChange={(e) => setProduct({ ...product, shortDescription: e.target.value })}
                placeholder="Brief summary displayed on product cards..."
                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl p-3 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>

          {/* Structured Content Block Editor for Specifications & Full Details */}
          <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">article</span>
                <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                  Product Details & Specifications
                </h2>
              </div>
              <span className="font-label-xs text-label-xs text-on-surface-variant font-medium">
                Structured Block Canvas
              </span>
            </div>
            <StructuredEditor
              content={product.description || { blocks: [] }}
              onChange={(description) => setProduct((prev) => ({ ...prev, description }))}
            />
          </div>

          {/* SEO Metadata */}
          <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl p-6 shadow-sm">
            <SEOFields
              seo={
                product.seo || {
                  title: '',
                  description: '',
                  canonical: '',
                  ogTitle: '',
                  ogDescription: '',
                  ogImage: '',
                  robots: 'index,follow',
                  noIndex: false
                }
              }
              onChange={(seo) => setProduct((prev) => ({ ...prev, seo }))}
            />
          </div>
        </div>

        {/* Right Column (4 cols): Category, Featured, Gallery */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl p-5 shadow-sm space-y-4">
            <CategorySelector
              value={product.category || 'general'}
              onChange={(slug) => setProduct({ ...product, category: slug })}
              type="product"
              label="Product Category"
            />

            <div className="pt-2 border-t border-surface-container-high/40">
              <label className="flex items-center gap-2.5 font-label-sm text-label-sm font-semibold text-on-surface cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={product.featured || false}
                  onChange={(e) => setProduct({ ...product, featured: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-surface-container-high focus:ring-primary"
                />
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-500 text-[18px] fill-current">star</span>
                  <span>Feature on Homepage</span>
                </span>
              </label>
            </div>

            {/* Product Gallery Images */}
            <div className="pt-3 border-t border-surface-container-high/40">
              <div className="flex items-center justify-between mb-3">
                <label className="font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Product Gallery ({product.images?.length || 0})
                </label>
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="font-label-xs text-label-xs text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Add Image</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(product.images || []).map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square bg-surface-container rounded-xl border border-surface-container-high/40 overflow-hidden group shadow-2xs"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(img)}
                      className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-error text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPickerModal
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={(url) => {
            setProduct((prev) => ({
              ...prev,
              images: [...(prev.images || []), url]
            }));
            setShowMediaPicker(false);
          }}
        />
      )}

      {/* Revisions History Modal */}
      {showRevisions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-surface-container-high/40 flex items-center justify-between bg-surface-container-low/40">
              <h3 className="font-headline-sm text-headline-sm font-serif text-on-surface">Product Revisions</h3>
              <button
                type="button"
                onClick={() => setShowRevisions(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-2">
              {loadingRevisions ? (
                <div className="p-8 text-center text-on-surface-variant font-body-sm">Loading revisions...</div>
              ) : revisions.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant font-body-sm">No revisions recorded yet.</div>
              ) : (
                revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 bg-surface-container-low border border-surface-container-high/40 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="font-label-sm text-label-sm font-semibold text-on-surface">
                        {new Date(rev.createdAt).toLocaleString()}
                      </p>
                      <p className="font-body-sm text-[11px] text-on-surface-variant">
                        Author: {rev.authorEmail || 'Lead Architect'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestoreRevision(rev.id)}
                      className="px-3 py-1 bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold rounded-lg transition-colors"
                    >
                      Restore
                    </button>
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
