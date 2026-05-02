import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CategoryDTO, Location, LocationPutDTO } from '../Interfaces';
import { fetchCategories } from '../services/CategoriesApiService';
import { uploadMultipleImagesToAzure } from '../../services/AzureBlobService';
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
  const { t } = useTranslation();
  const [name, setName] = useState(location.name);
  const [description, setDescription] = useState(location.description || '');
  const [category, setCategory] = useState(location.category);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(location.imageUrls ?? []);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(location.name);
    setDescription(location.description || '');
    setCategory(location.category);
    setImageUrls(location.imageUrls ?? []);
  }, [location]);

  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        const data = await fetchCategories(true);
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setIsUploadingImages(true);
    try {
      const results = await uploadMultipleImagesToAzure(files);
      setImageUrls((prev) => [...prev, ...results.map((r) => r.url)]);
    } catch (err) {
      console.error('Image upload failed', err);
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, category, imageUrls });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('editLocation.title')}</h2>
          <button className="modal-close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('editLocation.name')}</label>
            <input
              className="form-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('editLocation.category')}</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(String(e.target.value))}
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('editLocation.description')}</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('editLocation.images')}</label>
            {imageUrls.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {imageUrls.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img
                      src={url}
                      alt=""
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        background: '#EF4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        cursor: 'pointer',
                        fontSize: 12,
                        lineHeight: '20px',
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleImageSelect}
            />
            <button
              type="button"
              className="modal-button-cancel"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImages}
            >
              {isUploadingImages ? t('editLocation.uploading') : t('editLocation.addPhotos')}
            </button>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-button-cancel"
              onClick={onClose}
            >
              {t('editLocation.cancel')}
            </button>
            <button type="submit" className="modal-button-submit" disabled={isUploadingImages}>
              {t('editLocation.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLocationModal;
