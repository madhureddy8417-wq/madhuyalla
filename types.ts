export type Language = 'english' | 'telugu';

export interface Location {
  village: string;
  mandal: string;
  district: string;
}

export interface MockLocation {
  village: string;
  mandal: string;
  district: string;
}

export type MockLocationsByLang = {
  [key in Language]: MockLocation[];
};

// Types for "Soil & Crops" Feature
export interface SuitableCropInfo {
  cropName: string;
  suitability: string;
  avgMarketPrice: string;
  sowingSeason: string;
  waterRequirement: string;
  potentialYield: string;
  potentialYieldValue: number;
  avgMarketPriceValue: number;
}

// Types for "Crop Doctor" Feature
export interface DiseaseAnalysis {
  diseaseName: string;
  confidence: 'High' | 'Medium' | 'Low';
  description: string;
  preventiveMeasures: string[];
  treatment: string[];
}

// Types for "Market Insights" Feature
export interface CropMarketData {
  cropName: string;
  demand: 'High' | 'Medium' | 'Low' | string;
  pricePerKg: string;
  pricePerKgValue: number;
  priceTrend: 'Increasing' | 'Decreasing' | 'Stable' | string;
  sellerSlotAvailability: string;
  bookingNotes: string;
}

export interface MarketInfo {
  marketName: string;
  distance: string;
  availableCrops: CropMarketData[];
}


// Types for "Government Schemes" Feature
export interface GovernmentScheme {
  name: string;
  description:string;
  eligibility: string;
  link: string;
  applicationDeadline: string;
}

// New Types
export interface FarmingMaterial {
  name: string;
  description: string;
  usage: string;
  estimatedPrice: string;
  localSourcing: string;
  availability: string;
  bookingInfo: string;
}

export interface GroundingSource {
  link: string;
  title: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Weather Feature Types
export interface CurrentWeather {
  temperature: string;
  condition: string;
  humidity: string;
  precipitationProbability: string;
  windSpeed: string;
  uvIndex: string;
}

export interface DailyForecast {
  day: string;
  maxTemp: string;
  minTemp: string;
  condition: string;
}

export interface WeatherReport {
  current: CurrentWeather;
  forecast: DailyForecast[];
}

// Village Map Types
export interface PointOfInterest {
  name: string;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
}

export interface VillageMapData {
  villageName: string;
  center: {
    latitude: number;
    longitude: number;
  };
  pointsOfInterest: PointOfInterest[];
}

// Water Resources Feature Types
export interface WaterResource {
  name: string;
  type: 'River' | 'Canal' | 'Reservoir' | 'Groundwater' | 'Other';
  availability: string; // e.g., "75% Full", "Good", "Moderate", "Low"
  description: string;
  latitude: number;
  longitude: number;
}

export interface WaterResourceReport {
  center: {
    latitude: number;
    longitude: number;
  };
  analysis: {
    irrigationConnectivity: string;
    cropSuitability: string;
  };
  resources: WaterResource[];
}


export type ModalType = 'soil' | 'doctor' | 'market' | 'schemes' | 'assistant' | 'materials' | 'shops' | 'links' | 'transport' | 'map' | 'coldstorage' | 'marketyard' | 'water' | 'drone';