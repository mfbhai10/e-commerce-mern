import { useEffect, useMemo, useState } from 'react';
import categoryService from '../../services/categoryService';
import SectionHeader from '../../components/common/SectionHeader';

const emptyForm = {
  name: '',
  description: '',
  parent: '',
  sortOrder: 0,
  isActive: true,
};

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(emptyForm);

  const parentOptions = useMemo(() => categories.filter((category) => category._id !== editingId), [categories, editingId]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await categoryService.getCategories({ limit: 100 });
      setCategories(response.data.data.categories || []);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId('');
    setMessage('');
  };

  const handleChange = (field) => (event) => {
    const value = field === 'isActive' ? event.target.value === 'true' : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setForm({
      name: category.name || '',
      description: category.description || '',
      parent: category.parent?._id || '',
      sortOrder: category.sortOrder ?? 0,
      isActive: Boolean(category.isActive),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const payload = {
        ...form,
        parent: form.parent || null,
      };

      if (editingId) {
        await categoryService.updateCategory(editingId, payload);
        setMessage('Category updated successfully.');
      } else {
        await categoryService.createCategory(payload);
        setMessage('Category created successfully.');
      }

      resetForm();
      await loadCategories();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) {
      return;
    }

    try {
      await categoryService.deleteCategory(id);
      await loadCategories();
      if (editingId === id) resetForm();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to delete category.');
    }
  };

  return (
    <div className="stack-lg">
      <section className="page">
        <SectionHeader
          eyebrow="Admin"
          title="Category management"
          description="Maintain your category tree through live API requests and responsive management controls."
        />

        {message ? <div className="status-card status-card--success">{message}</div> : null}
        {error ? <div className="status-card status-card--error">{error}</div> : null}
        {loading ? <div className="status-card">Loading categories...</div> : null}

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="form-field form-field--full">
              <span>Name</span>
              <input value={form.name} onChange={handleChange('name')} required />
            </label>
            <label className="form-field form-field--full">
              <span>Description</span>
              <textarea value={form.description} onChange={handleChange('description')} rows="4" />
            </label>
            <label className="form-field">
              <span>Parent category</span>
              <select value={form.parent} onChange={handleChange('parent')}>
                <option value="">No parent</option>
                {parentOptions.map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Sort order</span>
              <input type="number" value={form.sortOrder} onChange={handleChange('sortOrder')} />
            </label>
            <label className="form-field">
              <span>Active</span>
              <select value={form.isActive ? 'true' : 'false'} onChange={handleChange('isActive')}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="button-link" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update category' : 'Create category'}
            </button>
            {editingId ? (
              <button type="button" className="button-link button-link--secondary" onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="page">
        <SectionHeader
          eyebrow="Hierarchy"
          title="Existing categories"
          description="All categories are fetched from the backend and displayed with their current hierarchy."
        />

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Parent</th>
                <th>Active</th>
                <th>Sort</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id}>
                  <td>{category.name}</td>
                  <td>{category.slug}</td>
                  <td>{category.parent?.name || 'Root'}</td>
                  <td>{category.isActive ? 'Yes' : 'No'}</td>
                  <td>{category.sortOrder}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" onClick={() => handleEdit(category)}>Edit</button>
                      <button type="button" onClick={() => handleDelete(category._id)}>Delete</button>
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

export default AdminCategoriesPage;
