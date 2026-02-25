import { useState, useEffect } from 'react';
import { Location, LocationCategory, LocationPutDTO } from '../Interfaces';
import './LocationModal.css';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Location</h2>
          <button className="modal-close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              className="form-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className="form-select"
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

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-button-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="modal-button-submit">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLocationModal;
