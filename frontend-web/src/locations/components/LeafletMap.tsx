import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  Location,
  LocationCategory,
  LocationPostDTO,
  MessagePostDTO,
  ResponseMessagePostDTO,
} from '../Interfaces';
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

const categoryColors: { [key: string]: string } = {
  [LocationCategory.NotSet]: '#6B7280', // Gray
  [LocationCategory.Music]: '#8B5CF6', // Purple
  [LocationCategory.Sport]: '#10B981', // Green
  [LocationCategory.Food]: '#F59E0B', // Orange
  [LocationCategory.Entertainment]: '#EF4444', // Red
  [LocationCategory.Education]: '#3B82F6', // Blue
  [LocationCategory.Health]: '#EC4899', // Pink
  [LocationCategory.Technology]: '#14B8A6', // Teal
  [LocationCategory.Travel]: '#F97316', // Orange-Red
  [LocationCategory.Art]: '#A855F7', // Purple-Pink
  [LocationCategory.Business]: '#06B6D4', // Cyan
};

// Create a colored marker icon
const getMarkerIcon = (category: LocationCategory) => {
  const color =
    categoryColors[category] || categoryColors[LocationCategory.NotSet];

  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" 
            fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="6" fill="#fff"/>
    </svg>
  `;

  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

interface LeafletMapProps {
  locations: Location[];
  onMapClick?: (lat: number, lng: number) => void;
  onAddComment?: (message: MessagePostDTO) => Promise<void>;
  onAddResponse?: (message: ResponseMessagePostDTO) => Promise<void>;
  onContextMenu?: (e: React.MouseEvent, location: Location) => void;
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

const LeafletMap = ({
  locations,
  onMapClick,
  onAddComment,
  onAddResponse,
  onContextMenu,
}: LeafletMapProps) => {
  const center: [number, number] =
    locations.length > 0
      ? [locations[0].latitude, locations[0].longitude]
      : [46.76073058700941, 23.571628332138065]; // Default center

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: '90vh', width: '100%' }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap, &copy; CARTO"
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
        maxZoom={22}
        maxNativeZoom={19}
        subdomains={['a', 'b', 'c', 'd']}
      />

      {locations.map((loc) => (
        <Marker
          key={loc.id}
          position={[loc.latitude, loc.longitude]}
          icon={getMarkerIcon(loc.category)}
          eventHandlers={
            onContextMenu
              ? {
                  contextmenu: (e) => {
                    const mouseEvent =
                      e.originalEvent as unknown as React.MouseEvent;
                    onContextMenu(mouseEvent, loc);
                  },
                }
              : undefined
          }
        >
          {onAddComment && onAddResponse && (
            <LocationPopup
              location={loc}
              onAddComment={onAddComment}
              onAddResponse={onAddResponse}
            />
          )}
        </Marker>
      ))}

      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
    </MapContainer>
  );
};

export default LeafletMap;
