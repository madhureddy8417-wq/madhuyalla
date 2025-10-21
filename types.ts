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
export interface SuitableCropPrice {
  cropName: string;
  suitability: string;
  avgMarketPrice: string;
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
}

// New Types
export interface FarmingMaterial {
  name: string;
  description: string;
  usage: string;
}

export interface GroundingSource {
  link: string;
  title: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}


export type ModalType = 'soil' | 'doctor' | 'market' | 'schemes' | 'assistant' | 'materials' | 'shops' | 'links' | 'transport' | 'map' | 'coldstorage' | 'marketyard';