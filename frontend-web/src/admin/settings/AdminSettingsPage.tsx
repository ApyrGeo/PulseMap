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

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>
        Admin Settings
      </h1>

      <section
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: 16,
          backgroundColor: '#fff',
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12 }}>
          Categories
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', gap: 10, alignItems: 'center' }}
        >
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="New category name"
            required
            style={{
              flex: 1,
              border: '1px solid #d1d5db',
              borderRadius: 8,
              padding: '10px 12px',
            }}
          />
          <button
            type="submit"
            disabled={isSaving}
            style={{
              border: '1px solid #d1d5db',
              borderRadius: 8,
              padding: '10px 14px',
              backgroundColor: '#ffffff',
              cursor: isSaving ? 'not-allowed' : 'pointer',
            }}
          >
            {isSaving ? 'Adding...' : 'Add Category'}
          </button>
        </form>
      </section>

      <section
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: 16,
          backgroundColor: '#fff',
        }}
      >
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12 }}>
          Existing Categories
        </h2>

        {isLoading ? (
          <p style={{ margin: 0, color: '#6b7280' }}>Loading categories...</p>
        ) : categories.length === 0 ? (
          <p style={{ margin: 0, color: '#6b7280' }}>No categories found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 6px' }}>
                    Name
                  </th>
                  <th style={{ textAlign: 'left', padding: '8px 6px' }}>
                    Slug
                  </th>
                  <th style={{ textAlign: 'left', padding: '8px 6px' }}>
                    Active
                  </th>
                  <th style={{ textAlign: 'left', padding: '8px 6px' }}>
                    Order
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td
                      style={{
                        padding: '8px 6px',
                        borderTop: '1px solid #f3f4f6',
                      }}
                    >
                      {category.name}
                    </td>
                    <td
                      style={{
                        padding: '8px 6px',
                        borderTop: '1px solid #f3f4f6',
                      }}
                    >
                      {category.slug}
                    </td>
                    <td
                      style={{
                        padding: '8px 6px',
                        borderTop: '1px solid #f3f4f6',
                      }}
                    >
                      {category.isActive ? 'Yes' : 'No'}
                    </td>
                    <td
                      style={{
                        padding: '8px 6px',
                        borderTop: '1px solid #f3f4f6',
                      }}
                    >
                      {category.sortOrder}
                    </td>
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
