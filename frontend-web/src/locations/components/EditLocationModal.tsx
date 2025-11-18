import { useState, useEffect } from 'react';
import { Location, LocationCategory, LocationPutDTO } from '../Interfaces';

interface EditLocationModalProps {
  isOpen: boolean;
  location: Location;
  onClose: () => void;
  onSubmit: (data: LocationPutDTO) => void;
}

const EditLocationModal = ({
  isOpen,
  location,
  onClose,
  onSubmit,
}: EditLocationModalProps) => {
  const [name, setName] = useState(location.name);
  const [description, setDescription] = useState(location.description || '');
  const [category, setCategory] = useState(location.category);

  useEffect(() => {
    setName(location.name);
    setDescription(location.description || '');
    setCategory(location.category);
  }, [location]);

  const categories = Object.keys(LocationCategory).map((key) => ({
    value: LocationCategory[key as keyof typeof LocationCategory],
    label: key,
  }));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, category });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Location</h2>
          <button
            className="text-2xl text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={category}
              onChange={(e) =>
                setCategory(String(e.target.value) as LocationCategory)
              }
              required
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLocationModal;
