import { FormEvent, useEffect, useState } from 'react';
import { CategoryDTO, CategoryPostDTO } from '../../shared/maps/Interfaces';
import {
  addCategory,
  fetchCategories,
} from '../../shared/maps/services/CategoriesApiService';

const AdminSettingsPage = () => {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCategories(false);
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const payload: CategoryPostDTO = {
      name: trimmedName,
      isActive: true,
      sortOrder: categories.length,
    };

    setIsSaving(true);
    try {
      await addCategory(payload);
      setName('');
      await loadCategories();
    } catch (error) {
      console.error('Failed to add category', error);
      alert('Failed to add category. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const sectionStyle: React.CSSProperties = {
    border: '1px solid #2D2D44',
    borderRadius: 10,
    padding: 16,
    backgroundColor: '#1A1A2E',
    marginBottom: 16,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: '1px solid #2D2D44',
    borderRadius: 8,
    padding: '10px 12px',
    backgroundColor: '#0F0F1A',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '8px 6px',
    color: '#8E8E8E',
    fontSize: '0.8rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 6px',
    borderTop: '1px solid #2D2D44',
    color: '#fff',
    fontSize: '0.875rem',
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16, color: '#fff' }}>
        Admin Settings
      </h1>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12, color: '#fff' }}>
          Categories
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="New category name"
            required
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={isSaving}
            style={{
              border: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              backgroundColor: '#FF6B35',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving ? 'Adding...' : 'Add Category'}
          </button>
        </form>
      </section>

      <section style={{ ...sectionStyle, marginBottom: 0 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12, color: '#fff' }}>
          Existing Categories
        </h2>

        {isLoading ? (
          <p style={{ margin: 0, color: '#8E8E8E' }}>Loading categories...</p>
        ) : categories.length === 0 ? (
          <p style={{ margin: 0, color: '#8E8E8E' }}>No categories found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Slug</th>
                  <th style={thStyle}>Active</th>
                  <th style={thStyle}>Order</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td style={tdStyle}>{category.name}</td>
                    <td style={tdStyle}>{category.slug}</td>
                    <td style={tdStyle}>
                      <span style={{
                        color: category.isActive ? '#10B981' : '#8E8E8E',
                        fontWeight: 600,
                      }}>
                        {category.isActive ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td style={tdStyle}>{category.sortOrder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminSettingsPage;
