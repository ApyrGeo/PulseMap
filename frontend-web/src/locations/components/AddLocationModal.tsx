import { useState } from 'react';
import { LocationCategory, LocationPostDTO } from '../Interfaces';
import { useAuth } from '../../auth/AuthProvider';
import './LocationModal.css';

interface AddLocationModalProps {
  isOpen: boolean;
  latitude: number;
  longitude: number;
  onClose: () => void;
  onSubmit: (data: LocationPostDTO) => void;
  isOwner?: boolean; // Show duration controls for owners
}

const AddLocationModal = ({
  isOpen,
  latitude,
  longitude,
  onClose,
  onSubmit,
  isOwner = false,
}: AddLocationModalProps) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LocationCategory>(
    LocationCategory.NotSet
  );
  const [hours, setHours] = useState<number>(0);
  const [days, setDays] = useState<number>(isOwner ? 0 : 1); // Default 1 day for users

  const categories = Object.keys(LocationCategory).map((key) => ({
    value: LocationCategory[key as keyof typeof LocationCategory],
    label: key,
  }));

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const dayOptions = Array.from({ length: 30 }, (_, i) => i);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const totalHours = days * 24 + hours;

    if (isOwner && totalHours === 0) {
      alert('Please specify at least some duration (hours or days)');
      return;
    }

    if (!user) {
      alert('User is not authenticated');
      return;
    }

    onSubmit({
      latitude,
      longitude,
      name,
      description,
      category,
      creatorId: user.id,
      duration: `${days}.${hours}:00:00`,
    });
    setName('');
    setDescription('');
    setDays(isOwner ? 0 : 1);
    setHours(0);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Location</h2>
          <button className="modal-close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Latitude</label>
            <input
              className="form-input"
              type="text"
              value={latitude.toFixed(6)}
              disabled
            />
          </div>

          <div className="form-group">
            <label className="form-label">Longitude</label>
            <input
              className="form-input"
              type="text"
              value={longitude.toFixed(6)}
              disabled
            />
          </div>

          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              className="form-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter location name"
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

          {isOwner && (
            <div className="form-group">
              <label className="form-label">Duration *</label>
              <div className="duration-controls">
                <div>
                  <label className="duration-label">Days</label>
                  <select
                    className="form-select"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  >
                    {dayOptions.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="duration-label">Hours</label>
                  <select
                    className="form-select"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                  >
                    {hourOptions.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="duration-info">
                Total: {days > 0 && `${days} day${days !== 1 ? 's' : ''}`}
                {days > 0 && hours > 0 && ' and '}
                {hours > 0 && `${hours} hour${hours !== 1 ? 's' : ''}`}
                {days === 0 && hours === 0 && 'No duration set'}
              </p>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
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
              Add Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLocationModal;
