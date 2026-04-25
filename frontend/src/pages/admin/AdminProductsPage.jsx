import { useEffect, useMemo, useState } from 'react';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import SectionHeader from '../../components/common/SectionHeader';
import ProductCard from '../../components/products/ProductCard';
import { formatCurrency } from '../../utils/format';

const emptyForm = {
  name: '',
  shortDescription: '',
  description: '',
  category: '',
  subCategories: [],
  brand: '',
  sku: '',
  price: '',
  compareAtPrice: '',
  currency: 'USD',
  stock: { quantity: 0, reserved: 0, lowStockThreshold: 5, trackInventory: true },
  tags: '',
  status: 'draft',
  isFeatured: false,
  attributes: '',
};

const serializeAttributes = (attributes) => {
  if (!attributes) {
    return '';
  }

  if (attributes instanceof Map) {
    return JSON.stringify(Object.fromEntries(attributes));
  }

  if (typeof attributes === 'object') {
    return JSON.stringify(attributes);
  }

  return String(attributes);
};

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const subCategoryOptions = useMemo(
    () => categories.filter((category) => category._id !== form.category),
    [categories, form.category],
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [productResponse, categoryResponse] = await Promise.all([
        productService.getProducts({ limit: 100 }),
        categoryService.getCategories({ limit: 100 }),
      ]);

      setProducts(productResponse.data.data.products || []);
      setCategories(categoryResponse.data.data.categories || []);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to load product data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId('');
    setSelectedFiles([]);
    setMessage('');
  };

  const handleFieldChange = (field) => (event) => {
    const value = field === 'isFeatured' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleStockChange = (field) => (event) => {
    setForm((current) => ({
      ...current,
      stock: {
        ...current.stock,
        [field]: field === 'trackInventory' ? event.target.checked : Number(event.target.value),
      },
    }));
  };

  const handleSubCategoriesChange = (event) => {
    const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
    setForm((current) => ({ ...current, subCategories: selected }));
  };

  const handleImagesChange = (event) => {
    setSelectedFiles(Array.from(event.target.files || []));
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setForm({
      ...emptyForm,
      name: product.name || '',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      category: product.category?._id || '',
      subCategories: (product.subCategories || []).map((item) => item._id || item),
      brand: product.brand || '',
      sku: product.sku || '',
      price: product.price ?? '',
      compareAtPrice: product.compareAtPrice ?? '',
      currency: product.currency || 'USD',
      stock: product.stock || emptyForm.stock,
      tags: (product.tags || []).join(', '),
      status: product.status || 'draft',
      isFeatured: Boolean(product.isFeatured),
      attributes: serializeAttributes(product.attributes),
    });
    setSelectedFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildFormData = () => {
    const formData = new FormData();
    let parsedAttributes = '{}';

    if (form.attributes.trim()) {
      try {
        parsedAttributes = JSON.stringify(JSON.parse(form.attributes));
      } catch (_error) {
        throw new Error('Attributes must be valid JSON');
      }
    }

    formData.append('name', form.name);
    formData.append('shortDescription', form.shortDescription);
    formData.append('description', form.description);
    formData.append('category', form.category);
    formData.append('subCategories', JSON.stringify(form.subCategories));
    formData.append('brand', form.brand);
    formData.append('sku', form.sku);
    formData.append('price', String(form.price));
    if (form.compareAtPrice) formData.append('compareAtPrice', String(form.compareAtPrice));
    formData.append('currency', form.currency);
    formData.append('stock', JSON.stringify(form.stock));
    formData.append('tags', JSON.stringify(form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)));
    formData.append('status', form.status);
    formData.append('isFeatured', String(form.isFeatured));
    formData.append('attributes', parsedAttributes);

    selectedFiles.forEach((file) => formData.append('images', file));
    return formData;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const payload = buildFormData();

      if (editingId) {
        await productService.updateProduct(editingId, payload);
        setMessage('Product updated successfully.');
      } else {
        await productService.createProduct(payload);
        setMessage('Product created successfully.');
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      setError(
        requestError?.message || requestError?.response?.data?.message || 'Unable to save product.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) {
      return;
    }

    try {
      await productService.deleteProduct(id);
      await loadData();
      if (editingId === id) resetForm();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to delete product.');
    }
  };

  return (
    <div className="stack-lg">
      <section className="page">
        <SectionHeader
          eyebrow="Admin"
          title="Product management"
          description="Create, update, and delete products using API-backed forms and tables."
        />

        {message ? <div className="status-card status-card--success">{message}</div> : null}
        {error ? <div className="status-card status-card--error">{error}</div> : null}
        {loading ? <div className="status-card">Loading products...</div> : null}

        <div className="admin-form-grid">
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="form-field form-field--full">
                <span>Name</span>
                <input value={form.name} onChange={handleFieldChange('name')} required />
              </label>
              <label className="form-field form-field--full">
                <span>Short description</span>
                <input value={form.shortDescription} onChange={handleFieldChange('shortDescription')} />
              </label>
              <label className="form-field form-field--full">
                <span>Description</span>
                <textarea value={form.description} onChange={handleFieldChange('description')} rows="5" required />
              </label>
              <label className="form-field">
                <span>Category</span>
                <select value={form.category} onChange={handleFieldChange('category')} required>
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Subcategories</span>
                <select multiple value={form.subCategories} onChange={handleSubCategoriesChange}>
                  {subCategoryOptions.map((category) => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Brand</span>
                <input value={form.brand} onChange={handleFieldChange('brand')} />
              </label>
              <label className="form-field">
                <span>SKU</span>
                <input value={form.sku} onChange={handleFieldChange('sku')} required />
              </label>
              <label className="form-field">
                <span>Price</span>
                <input type="number" min="0" step="0.01" value={form.price} onChange={handleFieldChange('price')} required />
              </label>
              <label className="form-field">
                <span>Compare at price</span>
                <input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={handleFieldChange('compareAtPrice')} />
              </label>
              <label className="form-field">
                <span>Currency</span>
                <input value={form.currency} onChange={handleFieldChange('currency')} maxLength="3" />
              </label>
              <label className="form-field">
                <span>Status</span>
                <select value={form.status} onChange={handleFieldChange('status')}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="form-field">
                <span>Tags</span>
                <input value={form.tags} onChange={handleFieldChange('tags')} placeholder="comma, separated, tags" />
              </label>
              <label className="form-field form-field--full">
                <span>Attributes JSON</span>
                <textarea value={form.attributes} onChange={handleFieldChange('attributes')} rows="4" placeholder='{"color":"Black","material":"Cotton"}' />
              </label>
              <label className="form-field">
                <span>Stock quantity</span>
                <input type="number" min="0" value={form.stock.quantity} onChange={handleStockChange('quantity')} />
              </label>
              <label className="form-field">
                <span>Reserved stock</span>
                <input type="number" min="0" value={form.stock.reserved} onChange={handleStockChange('reserved')} />
              </label>
              <label className="form-field">
                <span>Low stock threshold</span>
                <input type="number" min="0" value={form.stock.lowStockThreshold} onChange={handleStockChange('lowStockThreshold')} />
              </label>
              <label className="form-field">
                <span>Track inventory</span>
                <select value={form.stock.trackInventory ? 'true' : 'false'} onChange={(event) => setForm((current) => ({ ...current, stock: { ...current.stock, trackInventory: event.target.value === 'true' } }))}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
              <label className="form-field form-field--full">
                <span>Product images</span>
                <input type="file" accept="image/*" multiple onChange={handleImagesChange} />
                <span className="form-help">Upload one or more images. New uploads will be sent to Cloudinary.</span>
              </label>
              <label className="form-field form-field--full checkbox-field">
                <input type="checkbox" checked={form.isFeatured} onChange={handleFieldChange('isFeatured')} />
                <span>Mark as featured</span>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="button-link" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update product' : 'Create product'}
              </button>
              {editingId ? (
                <button type="button" className="button-link button-link--secondary" onClick={resetForm}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>

          <div className="admin-preview-column">
            {products.length ? (
              <div className="product-grid">
                {products.slice(0, 4).map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="page">
        <SectionHeader
          eyebrow="Inventory"
          title="Existing products"
          description="Current products are fetched directly from the backend and rendered in a responsive management table."
        />

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Stock</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td>{product.category?.name || 'N/A'}</td>
                  <td>{formatCurrency(product.price, product.currency)}</td>
                  <td>{product.status}</td>
                  <td>{product.stock?.quantity ?? 0}</td>
                  <td>{product.isFeatured ? 'Yes' : 'No'}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" onClick={() => handleEdit(product)}>Edit</button>
                      <button type="button" onClick={() => handleDelete(product._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminProductsPage;
