import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Location } from '../Interfaces';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import AddLocationModal from './AddLocationModal';
import LocationPopup from './LocationPopup';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface LeafletMapProps {
  locations: Location[];
  onMapClick: (data: {
    latitude: number;
    longitude: number;
    name: string;
    description?: string;
  }) => void;
}

const MapClickHandler = ({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const LeafletMap = ({ locations, onMapClick }: LeafletMapProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const center: [number, number] =
    locations.length > 0
      ? [locations[0].latitude, locations[0].longitude]
      : [46.76073058700941, 23.571628332138065]; // Default center

  const handleMapClick = (lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
    setIsModalOpen(true);
  };

  const handleModalSubmit = (data: {
    latitude: number;
    longitude: number;
    name: string;
    description?: string;
  }) => {
    onMapClick(data);
    setIsModalOpen(false);
    setClickedCoords(null);
  };

  return (
    <>
      <MapContainer
        center={center}
        zoom={20}
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {locations.map((loc) => (
          <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
            <LocationPopup location={loc} />
          </Marker>
        ))}

        <MapClickHandler onMapClick={handleMapClick} />
      </MapContainer>

      {clickedCoords && (
        <AddLocationModal
          isOpen={isModalOpen}
          latitude={clickedCoords.lat}
          longitude={clickedCoords.lng}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleModalSubmit}
        />
      )}
    </>
  );
};

export default LeafletMap;
