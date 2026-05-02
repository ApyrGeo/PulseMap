import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CategoryDTO, LocationPostDTO } from '../Interfaces';
import { classifyLocation } from '../services/LocationsApiService';
import { useAuth } from '../../../auth/AuthProvider';
import { uploadMultipleImagesToAzure } from '../../services/AzureBlobService';
import { fetchCategories } from '../services/CategoriesApiService';
import Counter from '../../components/Counter/Counter';
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
  const { t } = useTranslation();
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

  const categories = availableCategories
    .filter((cat) => cat.name !== 'Not Set')
    .map((cat) => ({
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
      alert(t('addLocation.setDuration'));
      return;
    }

    if (!user) return;

    let imageUrls: string[] = [];

    if (selectedImages.length > 0) {
      setIsUploadingImages(true);
      try {
        const uploadResults = await uploadMultipleImagesToAzure(selectedImages);
        imageUrls = uploadResults.map((result) => result.url);
      } catch {
        alert(t('addLocation.uploadError'));
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
          <h2 className="modal-title">{t('addLocation.title')}</h2>
          <button className="modal-close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Toggle for Owned Location */}
          <div className="form-group">
            <label className="form-label">{t('addLocation.locationType')}</label>
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
                    if (e.target.checked && hasOwnedLocation) {
                      alert(t('addLocation.alreadyOwned'));
                      setIsOwned(false);
                      return;
                    }
                    setIsOwned(e.target.checked);
                  }}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ color: '#1f2937' }}>
                  {t('addLocation.ownedLocation')}
                </span>
              </label>
            </div>
            {isOwned && !hasOwnedLocation && (
              <p className="duration-info" style={{ color: '#3b82f6', marginTop: '4px' }}>
                <img src="/icons/info.png" style={{ width: 13, height: 13, verticalAlign: 'middle', marginRight: 4 }} alt="" />
                {t('addLocation.ownedInfo')}
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">{t('addLocation.latitude')}</label>
            <input
              className="form-input"
              type="text"
              value={latitude.toFixed(6)}
              disabled
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('addLocation.longitude')}</label>
            <input
              className="form-input"
              type="text"
              value={longitude.toFixed(6)}
              disabled
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('addLocation.name')}</label>
            <input
              className="form-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={t('addLocation.namePlaceholder')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('addLocation.description')}</label>
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
              placeholder={t('addLocation.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('addLocation.category')}</label>
            {isClassifying && (
              <p className="duration-info">{t('addLocation.aiClassifying')}</p>
            )}
            {!isClassifying &&
              suggestedCategories.length > 0 &&
              !showManualSelect && (
                <div>
                  <p className="duration-info">{t('addLocation.aiSuggested')}</p>
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
                    {t('addLocation.manualSelect')}
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
                    {t('addLocation.descriptionVague')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Image Upload Section */}
          <div className="form-group">
            <label className="form-label">{t('addLocation.images')}</label>
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
              <label className="form-label">{t('addLocation.duration')}</label>
              <div className="duration-controls">
                <div className="counter-group">
                  <label className="duration-label">{t('addLocation.days')}</label>
                  <div className="counter-row">
                    <button type="button" className="counter-btn" onClick={() => setDays((d) => Math.max(0, d - 1))}>−</button>
                    <Counter value={days} fontSize={28} textColor="#22C55E" fontWeight={700} />
                    <button type="button" className="counter-btn" onClick={() => setDays((d) => Math.min(29, d + 1))}>+</button>
                  </div>
                </div>
                <div className="counter-group">
                  <label className="duration-label">{t('addLocation.hours')}</label>
                  <div className="counter-row">
                    <button type="button" className="counter-btn" onClick={() => setHours((h) => Math.max(0, h - 1))}>−</button>
                    <Counter value={hours} fontSize={28} textColor="#22C55E" fontWeight={700} />
                    <button type="button" className="counter-btn" onClick={() => setHours((h) => Math.min(23, h + 1))}>+</button>
                  </div>
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
              {isUploadingImages ? t('addLocation.submitting') : t('addLocation.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLocationModal;
