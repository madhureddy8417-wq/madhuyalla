import React, { useEffect, useRef } from 'react';
import ReactDOMServer from 'react-dom/server';
import type { VillageMapData, PointOfInterest } from '../types';
import { WaterIcon, MarketYardIcon, SchemeIcon, FertilizerShopsIcon, ColdStorageIcon, GpsIcon } from './icons';

// Make Leaflet available on the window object for TypeScript
declare global {
  interface Window {
    L: any;
  }
}

interface InteractiveMapProps {
  data: VillageMapData;
}

const getIconForPoi = (type: string) => {
    const lowerCaseType = type.toLowerCase();
    if (lowerCaseType.includes('water')) return <WaterIcon />;
    if (lowerCaseType.includes('market') || lowerCaseType.includes('yard')) return <MarketYardIcon />;
    if (lowerCaseType.includes('scheme') || lowerCaseType.includes('government') || lowerCaseType.includes('office')) return <SchemeIcon />;
    if (lowerCaseType.includes('fertilizer') || lowerCaseType.includes('shop')) return <FertilizerShopsIcon />;
    if (lowerCaseType.includes('storage')) return <ColdStorageIcon />;
    return <GpsIcon />; // Default icon
};


const InteractiveMap: React.FC<InteractiveMapProps> = ({ data }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null); // To hold the map instance

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) { // Initialize map only once
      const L = window.L;
      if (!L || !L.markerClusterGroup) {
        console.error("Leaflet or Leaflet MarkerCluster is not loaded");
        return;
      }

      const { center, pointsOfInterest } = data;
      
      const map = L.map(mapRef.current).setView([center.latitude, center.longitude], 15);
      mapInstance.current = map;

      L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps'
      }).addTo(map);

      // Create a marker cluster group
      const markers = L.markerClusterGroup();

      pointsOfInterest.forEach((poi: PointOfInterest) => {
        const iconComponent = getIconForPoi(poi.type);
        const iconHtml = ReactDOMServer.renderToString(
            <div className="bg-white rounded-full p-1 shadow-md flex items-center justify-center">
                {iconComponent}
            </div>
        );

        const customIcon = L.divIcon({
          html: iconHtml,
          className: '', // No default class
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });

        const marker = L.marker([poi.latitude, poi.longitude], { icon: customIcon });
        
        const popupContent = `
          <div class="font-sans">
            <h4 class="font-bold text-md text-green-800">${poi.name}</h4>
            <p class="text-sm text-gray-600">${poi.description}</p>
          </div>
        `;
        marker.bindPopup(popupContent);
        
        // Add marker to the cluster group instead of the map
        markers.addLayer(marker);
      });

      // Add the cluster group to the map
      map.addLayer(markers);
    }

    // Cleanup function to remove map on component unmount
    return () => {
        if (mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
        }
    };
  }, [data]);

  return <div ref={mapRef} style={{ height: '65vh', width: '100%', borderRadius: '12px' }} />;
};

export default InteractiveMap;