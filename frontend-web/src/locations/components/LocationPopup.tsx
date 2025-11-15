import { Popup } from 'react-leaflet';
import { Location } from '../Interfaces';
import { useState } from 'react';

interface LocationPopupProps {
  location: Location;
}

const LocationPopup = ({ location }: LocationPopupProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const placeholderImages = ['📍 Image 1', '🗺️ Image 2', '📷 Image 3'];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % placeholderImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? placeholderImages.length - 1 : prev - 1
    );
  };

  return (
    <Popup>
      <div className="min-w-[280px] max-w-[320px]">
        <div className="text-center space-y-3 mb-4">
          <h3 className="text-xl font-bold text-gray-800">{location.name}</h3>

          <div className="relative w-full h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center text-gray-600 text-sm font-medium shadow-inner overflow-hidden">
            <div className="text-2xl">
              {placeholderImages[currentImageIndex]}
            </div>

            {placeholderImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all"
                >
                  <span className="text-gray-700 font-bold">‹</span>
                </button>

                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all"
                >
                  <span className="text-gray-700 font-bold">›</span>
                </button>

                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {placeholderImages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex
                          ? 'bg-white w-4'
                          : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {location.description && (
            <p className="text-gray-700 text-sm px-2 py-2 bg-gray-50 rounded-lg">
              {location.description}
            </p>
          )}
        </div>

        <div className="mb-3 pb-3 border-b border-gray-200">
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            Coordinates
          </h4>
          <p className="text-sm text-gray-800 bg-gray-50 px-2 py-1 rounded font-mono">
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
        </div>

        {location.creator && (
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Creator
            </h4>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {location.creator.username.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {location.creator.username}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Popup>
  );
};

export default LocationPopup;
