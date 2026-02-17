// Zoom level thresholds for different map views
export const ZOOM_THRESHOLDS = {
  NEIGHBORHOOD: 15, // Show individual markers (neighborhood/street level)
  EVENT: 13, // Show event clusters (district level)
  CITY: 6, // Show count only (city level)
  // Below CITY zoom level: show count popup
};
