export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type MapMarker = MapCoordinate & {
  id: string;
  label?: string;
  title: string;
  variant?: 'task' | 'origin';
};

export type DynamicMapProps = {
  center: MapCoordinate;
  height?: number;
  markers?: MapMarker[];
  mode: 'picker' | 'markers';
  onCenterChange?: (coordinate: MapCoordinate) => void;
  onMarkerPress?: (markerId: string) => void;
  selectedMarkerId?: string;
  zoom?: number;
};
