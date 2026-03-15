import { useEffect, useState } from 'react';
import { CategoryDTO, LocationPostDTO } from '../Interfaces';
import { classifyLocation } from '../services/LocationsApiService';
import { useAuth } from '../../../auth/AuthProvider';
import { uploadMultipleImagesToAzure } from '../../services/AzureBlobService';
import { fetchCategories } from '../services/CategoriesApiService';
import './LocationModal.css';

interface AddLocationModalProps {
  isOpen: boolean;
  latitude: number;
  longitude: number;
  onClose: () => void;
  onSubmit: (data: LocationPostDTO) => void;
  hasOwnedLocation?: boolean; // Whether user already has an owned location
}

const AddLocationModal = ({
  isOpen,
  latitude,
  longitude,
  onClose,
  onSubmit,
  hasOwnedLocation = false,
}: AddLocationModalProps) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<CategoryDTO[]>(
    []
  );
  const [isClassifying, setIsClassifying] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [showManualSelect, setShowManualSelect] = useState(false);
  const [showUncategorizedWarning, setShowUncategorizedWarning] =
    useState(false);
  const [hours, setHours] = useState<number>(0);
  const [days, setDays] = useState<number>(1); // Default 1 day
  const [isOwned, setIsOwned] = useState<boolean>(false); // Toggle for owned location
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        const categories = await fetchCategories(true);
        setAvailableCategories(categories);
        setCategory((current) => current || categories[0]?.name || '');
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    })();
  }, [isOpen]);

  const categories = availableCategories.map((cat) => ({
    value: cat.name,
    label: cat.name,
  }));

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const dayOptions = Array.from({ length: 30 }, (_, i) => i);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedImages((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalHours = days * 24 + hours;

    if (isOwned && totalHours === 0) {
      alert('Please specify at least some duration (hours or days)');
      return;
    }

    if (!user) {
      alert('User is not authenticated');
      return;
    }

    let imageUrls: string[] = [];

    // Upload images to Azure if any are selected
    if (selectedImages.length > 0) {
      setIsUploadingImages(true);
      try {
        const uploadResults = await uploadMultipleImagesToAzure(selectedImages);
        imageUrls = uploadResults.map((result) => result.url);
      } catch {
        alert('Failed to upload images. Please try again.');
        setIsUploadingImages(false);
        return;
      }
      setIsUploadingImages(false);
    }

    onSubmit({
      latitude,
      longitude,
      name,
      description,
      category,
      creatorId: user.id,
      duration: `${days}.${hours}:00:00`,
      ownerId: isOwned ? user.id : undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    });

    // Reset form
    setName('');
    setDescription('');
    setDays(1);
    setHours(0);
    setIsOwned(false);
    setSelectedImages([]);
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
          {/* Toggle for Owned Location */}
          <div className="form-group">
            <label className="form-label">Location Type</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={isOwned}
                  onChange={(e) => {
                    console.log('Checkbox clicked!');
                    console.log('Checked:', e.target.checked);
                    console.log('hasOwnedLocation:', hasOwnedLocation);

                    // Check if user is trying to enable owned mode but already has one
                    if (e.target.checked && hasOwnedLocation) {
                      console.log(
                        'Showing alert - user already has owned location'
                      );
                      alert(
                        'You already have an active owned location. You can only have one owned location at a time.'
                      );
                      setIsOwned(false);
                      return;
                    }
                    setIsOwned(e.target.checked);
                  }}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ color: '#1f2937' }}>
                  Owned Location (My Business/Place)
                </span>
              </label>
            </div>
            {isOwned && !hasOwnedLocation && (
              <p
                className="duration-info"
                style={{ color: '#3b82f6', marginTop: '4px' }}
              >
                <span role="img" aria-label="info">
                  ℹ️
                </span>{' '}
                Owned locations are for your business or place. You can set
                custom duration.
              </p>
            )}
          </div>

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
                setCategory(availableCategories[0]?.name ?? '');
              }}
              onBlur={async () => {
                // Only classify if there's some description text
                if (!description || description.trim().length === 0) return;
                setIsClassifying(true);
                setShowUncategorizedWarning(false);
                setSuggestedCategories([]);
                setShowManualSelect(false);
                try {
                  const aiCategories = await classifyLocation(description);
                  // Check if we got valid suggestions
                  const validCategories = aiCategories.filter(
                    (cat) =>
                      cat &&
                      cat !== 'Uncategorized' &&
                      availableCategories.some(
                        (availableCat) =>
                          availableCat.name.toLowerCase() === cat.toLowerCase()
                      )
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
                          setCategory(cat);
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
                    setCategory(String(e.target.value));
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

          {/* Image Upload Section */}
          <div className="form-group">
            <label className="form-label">Images (Optional)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="form-input"
              style={{ padding: '8px' }}
            />
            {selectedImages.length > 0 && (
              <div
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                {selectedImages.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      width: '80px',
                      height: '80px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '2px solid #e5e7eb',
                    }}
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isOwned && (
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
              disabled={isUploadingImages}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-button-submit"
              disabled={isUploadingImages}
            >
              {isUploadingImages ? 'Uploading Images...' : 'Add Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLocationModal;
