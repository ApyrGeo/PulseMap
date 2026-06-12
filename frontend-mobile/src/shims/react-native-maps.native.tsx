import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = null;

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapViewRef {
  animateToRegion: (region: Region, duration?: number) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Not Set':     '#6B7280',
  Music:         '#8B5CF6',
  Sport:         '#10B981',
  Food:          '#F59E0B',
  Entertainment: '#EF4444',
  Education:     '#3B82F6',
  Health:        '#EC4899',
  Technology:    '#14B8A6',
  Travel:        '#F97316',
  Art:           '#A855F7',
  Business:      '#06B6D4',
};

interface MarkerData {
  id: string;
  latitude: number;
  longitude: number;
  category: string;
  isExpired: boolean;
  isNearby: boolean;
}

export interface EventData {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  locationsCount: number;
}

interface MapViewProps {
  children?: React.ReactNode;
  style?: object;
  initialRegion?: Region;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  followsUserLocation?: boolean;
  provider?: string | null;
  onRegionChangeComplete?: (region: Region) => void;
  onPress?: (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => void;
  events?: EventData[];
  [key: string]: unknown;
}

interface MarkerProps {
  coordinate: { latitude: number; longitude: number };
  onPress?: () => void;
  children?: React.ReactNode;
  title?: string;
  description?: string;
  category?: string;
  isExpired?: boolean;
  isNearby?: boolean;
  [key: string]: unknown;
}

function latDeltaToZoom(latitudeDelta: number): number {
  return Math.round(Math.log2(360 / latitudeDelta));
}

function generateHTML(lat: number, lng: number, zoom: number, showUserLocation: boolean): string {
  const catColors = JSON.stringify(CATEGORY_COLORS);
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body,#map{width:100%;height:100%;background:#f4f4f4;}
  .leaflet-control-attribution{display:none;}
  @keyframes event-pulse{
    0%,100%{transform:scale(1);opacity:0.9;}
    50%{transform:scale(1.12);opacity:1;}
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
var CATEGORY_COLORS=${catColors};
var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${lat},${lng}],${zoom});
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
  subdomains:['a','b','c','d'],maxZoom:22
}).addTo(map);

var markerLayer={};
var eventLayer={};
var userDot=null,userRing=null;

function postRN(data){
  if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(data));
}

function tearDropIcon(category,isExpired,isNearby){
  var color=isExpired?'#6B7280':(CATEGORY_COLORS[category]||'#22C55E');
  var border=isNearby?'#22C55E':'#fff';
  var size=isNearby?34:28;
  var dot=Math.round(size*0.29);
  var html='<div style="width:'+size+'px;height:'+size+'px;background:'+color+
    ';border:'+(isNearby?'3':'2')+'px solid '+border+
    ';border-radius:50% 50% 50% 0;box-shadow:0 3px 8px rgba(0,0,0,.4);position:relative;">'+
    '<div style="width:'+dot+'px;height:'+dot+'px;background:'+border+
    ';border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"></div></div>';
  return L.divIcon({html:html,className:'',iconSize:[size,size],iconAnchor:[size/2,size],popupAnchor:[0,-size]});
}

window.updateMarkers=function(list){
  var newIds={};
  list.forEach(function(m){newIds[m.id]=true;});
  Object.keys(markerLayer).forEach(function(id){
    if(!newIds[id]){markerLayer[id].remove();delete markerLayer[id];}
  });
  list.forEach(function(m){
    var icon=tearDropIcon(m.category,m.isExpired,m.isNearby);
    if(markerLayer[m.id]){
      markerLayer[m.id].setLatLng([m.latitude,m.longitude]);
      markerLayer[m.id].setIcon(icon);
    }else{
      var mk=L.marker([m.latitude,m.longitude],{icon:icon}).addTo(map);
      (function(id){
        mk.on('click',function(e){
          e.originalEvent&&e.originalEvent.stopPropagation&&e.originalEvent.stopPropagation();
          postRN({type:'markerPress',id:id});
        });
      })(m.id);
      markerLayer[m.id]=mk;
    }
  });
};

window.updateEvents=function(list){
  // Always recreate all markers so size reflects current zoom level
  Object.keys(eventLayer).forEach(function(id){
    eventLayer[id].marker.remove();
    delete eventLayer[id];
  });
  var zoom=map.getZoom();
  // Inversely proportional: zoom 12 → large, zoom 14 → smaller but still visible
  list.forEach(function(e){
    var sid=String(e.id);
    var sz=Math.min(44+(14-zoom)*20+Math.min(e.locationsCount*2,20),100);
    var fs=Math.max(12,Math.round(sz/4));
    var html='<div style="width:'+sz+'px;height:'+sz+'px;background:#ef4444;'+
      'border:3px solid #fff;border-radius:50%;display:flex;align-items:center;'+
      'justify-content:center;animation:event-pulse 2s ease-in-out infinite;'+
      'box-shadow:0 0 14px rgba(239,68,68,0.6);">'+
      '<span style="color:#fff;font-weight:bold;font-size:'+fs+'px;">'+e.locationsCount+'</span></div>';
    var icon=L.divIcon({html:html,className:'',iconSize:[sz,sz],iconAnchor:[sz/2,sz/2]});
    var marker=L.marker([e.latitude,e.longitude],{icon:icon}).addTo(map);
    (function(ev){
      marker.on('click',function(){
        map.flyTo([ev.latitude,ev.longitude],15,{duration:0.8,animate:true});
      });
      marker.on('contextmenu',function(){
        L.popup({closeButton:false,className:''})
          .setLatLng([ev.latitude,ev.longitude])
          .setContent('<div style="font-size:13px;font-weight:600;color:#1f2937;white-space:nowrap;">'+ev.name+'</div>')
          .openOn(map);
      });
    })(e);
    eventLayer[sid]={marker:marker};
  });
};

${showUserLocation ? `
var watchId=null;
function startUserLocationWatch(){
  if(!navigator.geolocation||watchId!==null)return;
  watchId=navigator.geolocation.watchPosition(
    function(pos){
      var p=[pos.coords.latitude,pos.coords.longitude];
      if(userDot){userDot.setLatLng(p);}
      else{userDot=L.circleMarker(p,{radius:10,color:'#4285F4',fillColor:'#4285F4',fillOpacity:0.9,weight:2}).addTo(map);}
      if(userRing){userRing.setLatLng(p);}
      else{userRing=L.circleMarker(p,{radius:24,color:'#4285F4',fillColor:'#4285F4',fillOpacity:0.15,weight:1}).addTo(map);}
    },
    function(){
      watchId=null;
      setTimeout(startUserLocationWatch,3000);
    },
    {enableHighAccuracy:true}
  );
}
startUserLocationWatch();
` : ''}

map.on('moveend',function(){
  var c=map.getCenter(),b=map.getBounds();
  postRN({type:'regionChange',latitude:c.lat,longitude:c.lng,
    latitudeDelta:b.getNorth()-b.getSouth(),
    longitudeDelta:b.getEast()-b.getWest()});
});

map.on('click',function(e){
  postRN({type:'mapPress',latitude:e.latlng.lat,longitude:e.latlng.lng});
});

function handleMsg(e){
  try{
    var d=JSON.parse(e.data);
    if(d.type==='flyTo'){
      map.flyTo([d.lat,d.lng],map.getZoom(),{duration:d.duration/1000,animate:true});
    }
  }catch(err){}
}
document.addEventListener('message',handleMsg);
window.addEventListener('message',handleMsg);
</script>
</body>
</html>`;
}

const MapView = forwardRef<MapViewRef, MapViewProps>(
  ({ children, style, initialRegion, showsUserLocation = false, onRegionChangeComplete, onPress, events }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const onPressCallbacks = useRef<Record<string, () => void>>({});
    const mapLoaded = useRef(false);
    const pendingMarkers = useRef<MarkerData[] | null>(null);
    const pendingEvents = useRef<EventData[] | null>(null);

    const lat = initialRegion?.latitude ?? 44.4268;
    const lng = initialRegion?.longitude ?? 26.1025;
    const zoom = initialRegion ? latDeltaToZoom(initialRegion.latitudeDelta) : 15;

    const html = useMemo(() => generateHTML(lat, lng, zoom, showsUserLocation), []);

    useImperativeHandle(ref, () => ({
      animateToRegion: (region: Region, duration = 800) => {
        const zoom = latDeltaToZoom(region.latitudeDelta);
        webViewRef.current?.injectJavaScript(
          `map.flyTo([${region.latitude},${region.longitude}],${zoom},{duration:${duration / 1000},animate:true});true;`
        );
      },
    }));

    const handleLoad = useCallback(() => {
      mapLoaded.current = true;
      if (pendingMarkers.current !== null) {
        webViewRef.current?.injectJavaScript(
          `window.updateMarkers(${JSON.stringify(pendingMarkers.current)});true;`
        );
        pendingMarkers.current = null;
      }
      if (pendingEvents.current !== null) {
        webViewRef.current?.injectJavaScript(
          `window.updateEvents(${JSON.stringify(pendingEvents.current)});true;`
        );
        pendingEvents.current = null;
      }
    }, []);

    // Inject markers when children (Marker elements) change
    useEffect(() => {
      const markerList: MarkerData[] = [];
      const callbacks: Record<string, () => void> = {};

      React.Children.forEach(children, (child, index) => {
        if (!React.isValidElement(child)) return;
        const p = child.props as MarkerProps;
        const id = String(index);
        markerList.push({
          id,
          latitude: p.coordinate.latitude,
          longitude: p.coordinate.longitude,
          category: p.category ?? 'Not Set',
          isExpired: p.isExpired ?? false,
          isNearby: p.isNearby ?? false,
        });
        if (p.onPress) callbacks[id] = p.onPress;
      });

      onPressCallbacks.current = callbacks;

      if (mapLoaded.current) {
        webViewRef.current?.injectJavaScript(
          `window.updateMarkers(${JSON.stringify(markerList)});true;`
        );
      } else {
        pendingMarkers.current = markerList;
      }
    }, [children]);

    useEffect(() => {
      const list = events ?? [];
      if (mapLoaded.current) {
        webViewRef.current?.injectJavaScript(
          `window.updateEvents(${JSON.stringify(list)});true;`
        );
      } else {
        pendingEvents.current = list;
      }
    }, [events]);

    const handleMessage = useCallback(
      (event: WebViewMessageEvent) => {
        try {
          const data = JSON.parse(event.nativeEvent.data);
          if (data.type === 'markerPress') {
            onPressCallbacks.current[data.id]?.();
          } else if (data.type === 'regionChange') {
            onRegionChangeComplete?.({
              latitude: data.latitude,
              longitude: data.longitude,
              latitudeDelta: data.latitudeDelta,
              longitudeDelta: data.longitudeDelta,
            });
          } else if (data.type === 'mapPress') {
            onPress?.({
              nativeEvent: {
                coordinate: { latitude: data.latitude, longitude: data.longitude },
              },
            });
          }
        } catch {}
      },
      [onRegionChangeComplete, onPress]
    );

    return (
      <View style={[{ flex: 1 }, style]}>
        <WebView
          ref={webViewRef}
          source={{ html, baseUrl: 'https://localhost' }}
          onLoad={handleLoad}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          style={{ flex: 1, backgroundColor: '#f4f4f4' }}
          scrollEnabled={false}
          bounces={false}
          allowsInlineMediaPlayback
          geolocationEnabled={showsUserLocation}
          onGeolocationPermissionsShowPrompt={
            showsUserLocation
              ? ({ origin, callback }) => callback(origin, true, true)
              : undefined
          }
        />
      </View>
    );
  }
);
MapView.displayName = 'MapView';

export const Marker: React.FC<MarkerProps> = () => null;

export default MapView;
