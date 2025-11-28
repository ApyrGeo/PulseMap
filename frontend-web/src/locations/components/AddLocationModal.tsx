import { useState } from 'react';
import { LocationCategory, LocationPostDTO } from '../Interfaces';
import { useAuth } from '../../auth/AuthProvider';

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
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Location</h2>
          <button
            className="text-2xl text-gray-500 hover:text-gray-700 cursor-pointer"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              type="text"
              value={latitude.toFixed(6)}
              disabled
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              type="text"
              value={longitude.toFixed(6)}
              disabled
            />
          </div>

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
              placeholder="Enter location name"
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

          {isOwner && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Days
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                  <label className="block text-xs text-gray-600 mb-1">
                    Hours
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
              <p className="text-xs text-gray-500 mt-1">
                Total: {days > 0 && `${days} day${days !== 1 ? 's' : ''}`}
                {days > 0 && hours > 0 && ' and '}
                {hours > 0 && `${hours} hour${hours !== 1 ? 's' : ''}`}
                {days === 0 && hours === 0 && 'No duration set'}
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
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
              Add Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLocationModal;
