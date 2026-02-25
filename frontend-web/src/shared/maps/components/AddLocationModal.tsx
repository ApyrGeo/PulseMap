import { useState } from 'react';
import { LocationCategory, LocationPostDTO } from '../Interfaces';
import { classifyLocation } from '../services/LocationsApiService';
import { useAuth } from '../../../auth/AuthProvider';
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
  const [isClassifying, setIsClassifying] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [showManualSelect, setShowManualSelect] = useState(false);
  const [showUncategorizedWarning, setShowUncategorizedWarning] =
    useState(false);
  const [hours, setHours] = useState<number>(0);
  const [days, setDays] = useState<number>(isOwner ? 0 : 1); // Default 1 day for users

  const categories = Object.keys(LocationCategory)
    .filter(
      (key) =>
        LocationCategory[key as keyof typeof LocationCategory] !==
        LocationCategory.NotSet
    )
    .map((key) => ({
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
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setShowUncategorizedWarning(false);
                setSuggestedCategories([]);
                setShowManualSelect(false);
                setCategory(LocationCategory.NotSet);
              }}
              onBlur={async () => {
                // Only classify if there's some description text
                if (!description || description.trim().length === 0) return;
                setIsClassifying(true);
                setShowUncategorizedWarning(false);
                setSuggestedCategories([]);
                setShowManualSelect(false);
                try {
                  const categories = await classifyLocation(description);
                  // Check if we got valid suggestions
                  const validCategories = categories.filter(
                    (cat) =>
                      cat &&
                      cat !== 'Uncategorized' &&
                      cat !== LocationCategory.NotSet &&
                      cat !== 'Not Set'
                  );
                  if (validCategories.length > 0) {
                    setSuggestedCategories(validCategories);
                  } else {
                    setShowUncategorizedWarning(true);
                    setShowManualSelect(true);
                  }
                } catch (err) {
                  console.error('Classification error', err);
                } finally {
                  setIsClassifying(false);
                }
              }}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            {isClassifying && (
              <p className="duration-info">
                Se generează potrivirea cea mai bună pentru descriere...
              </p>
            )}
            {!isClassifying &&
              suggestedCategories.length > 0 &&
              !showManualSelect && (
                <div>
                  <p className="duration-info">Tag-uri sugerate:</p>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginBottom: '12px',
                    }}
                  >
                    {suggestedCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat as LocationCategory);
                          setShowUncategorizedWarning(false);
                        }}
                        className="form-input"
                        style={{
                          padding: '8px 16px',
                          cursor: 'pointer',
                          backgroundColor:
                            category === cat ? '#3b82f6' : '#f3f4f6',
                          color: category === cat ? 'white' : '#1f2937',
                          border:
                            category === cat
                              ? '2px solid #3b82f6'
                              : '2px solid #d1d5db',
                          borderRadius: '6px',
                          fontWeight: category === cat ? 'bold' : 'normal',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualSelect(true)}
                    className="duration-info"
                    style={{
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                    }}
                  >
                    Selectare manuală
                  </button>
                </div>
              )}
            {!isClassifying && showManualSelect && (
              <div>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => {
                    setCategory(String(e.target.value) as LocationCategory);
                    setShowUncategorizedWarning(false);
                  }}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {showUncategorizedWarning && (
                  <p className="duration-info" style={{ color: '#b91c1c' }}>
                    Descrierea este prea vagă. Încearcă să adaugi mai multe
                    detalii sau selectează manual categoria.
                  </p>
                )}
              </div>
            )}
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
