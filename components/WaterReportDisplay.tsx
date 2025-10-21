import React from 'react';
import type { WaterResourceReport, VillageMapData, PointOfInterest } from '../types';
import InteractiveMap from './InteractiveMap';

interface WaterReportDisplayProps {
  data: WaterResourceReport;
}

const WaterReportDisplay: React.FC<WaterReportDisplayProps> = ({ data }) => {
  const { center, analysis, resources } = data;

  // Transform data for the InteractiveMap component
  const mapData: VillageMapData = {
    villageName: '', // Not strictly needed by the map component itself
    center: center,
    pointsOfInterest: resources.map(resource => ({
      name: resource.name,
      type: resource.type, // This will be used to select the icon
      description: `<strong>Availability: ${resource.availability}</strong>. ${resource.description}`,
      latitude: resource.latitude,
      longitude: resource.longitude,
    }) as PointOfInterest),
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-bold text-lg text-green-800 mb-2">Map of Water Resources</h4>
        <div className="rounded-xl overflow-hidden border border-gray-200 h-[40vh] min-h-[300px]">
            <InteractiveMap data={mapData} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <h4 className="font-bold text-lg text-green-800 mb-2">Irrigation Connectivity</h4>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{analysis.irrigationConnectivity}</p>
        </div>
        <div>
            <h4 className="font-bold text-lg text-green-800 mb-2">Crop Suitability Analysis</h4>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{analysis.cropSuitability}</p>
        </div>
      </div>
      
      <div>
        <h4 className="font-bold text-lg text-green-800 mb-2">Resource Details</h4>
        <div className="space-y-3">
          {resources.map(resource => (
            <div key={resource.name} className="p-3 bg-gray-50 rounded-lg border">
              <p className="font-semibold text-gray-800">{resource.name} <span className="text-sm font-normal text-gray-500">({resource.type})</span></p>
              <p className="text-sm"><strong className="font-medium">Availability:</strong> {resource.availability}</p>
              <p className="text-sm mt-1">{resource.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WaterReportDisplay;
