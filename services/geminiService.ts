import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Language, Location, SuitableCropPrice, DiseaseAnalysis, MarketInfo, GovernmentScheme, FarmingMaterial } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash";

const generateJson = async (prompt: string, responseSchema: any) => {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });
    const text = response.text.trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating JSON from Gemini API:", error);
    throw new Error("An error occurred while fetching data. This may be a temporary issue. Please try again.");
  }
};

export const getSuitableCropsAndPrices = async (location: Location, language: Language): Promise<SuitableCropPrice[]> => {
  const prompt = `Based on the soil type and climate of ${location.village}, ${location.mandal}, ${location.district} in Andhra Pradesh, list the top 5 most suitable crops to grow. For each crop, provide a brief reason for its suitability and its current average market price per quintal in the local markets. Please provide the entire response, including all field values, in the ${language} language.`;
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        cropName: { type: Type.STRING },
        suitability: { type: Type.STRING, description: "Reason why this crop is suitable for the location." },
        avgMarketPrice: { type: Type.STRING, description: "e.g., ₹2,000 - ₹2,200 per quintal" },
      },
      required: ["cropName", "suitability", "avgMarketPrice"],
    },
  };
  return generateJson(prompt, schema);
};

export const analyzeCropImage = async (location: Location, imageBase64: string, mimeType: string, language: Language): Promise<DiseaseAnalysis> => {
  const prompt = `Analyze the provided image of a crop leaf from a farm in ${location.village}, ${location.district}, Andhra Pradesh. Identify any visible diseases or pest infections. If a disease is found, provide its name, a confidence score (High, Medium, or Low), a brief description, preventive measures, and recommended organic/chemical treatments suitable for that region. If no disease is found, state that the plant appears healthy. Please provide the entire response, including all field values, in the ${language} language.`;
  
  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: mimeType,
    },
  };

  const textPart = { text: prompt };

  const schema = {
    type: Type.OBJECT,
    properties: {
      diseaseName: { type: Type.STRING, description: "Name of the identified disease, or 'Healthy'." },
      confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
      description: { type: Type.STRING },
      preventiveMeasures: { type: Type.ARRAY, items: { type: Type.STRING } },
      treatment: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["diseaseName", "confidence", "description", "preventiveMeasures", "treatment"],
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [textPart, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    const text = response.text.trim();
    return JSON.parse(text) as DiseaseAnalysis;
  } catch (error) {
    console.error("Error analyzing image with Gemini API:", error);
    throw new Error("An error occurred while analyzing the image. This may be a temporary issue. Please try again.");
  }
};

export const getMarketInsights = async (location: Location, language: Language): Promise<MarketInfo[]> => {
  const prompt = `For the 3 nearest major agricultural markets (Rythu Bazaars, Mandis) to ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh, provide a detailed report. For each market, include its name and approximate distance. Also, list the top 5-7 major crops currently available in each market. For each crop, specify its current demand level (e.g., High, Medium, Low) and the average price per kilogram. Please provide the entire response, including all field values, in the ${language} language.`;
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        marketName: { type: Type.STRING },
        distance: { type: Type.STRING, description: "e.g., 15 km" },
        availableCrops: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              cropName: { type: Type.STRING },
              demand: { type: Type.STRING, description: "e.g., High, Medium, Low" },
              pricePerKg: { type: Type.STRING, description: "e.g., ₹40 - ₹50 per kg" },
            },
            required: ["cropName", "demand", "pricePerKg"],
          },
        },
      },
      required: ["marketName", "distance", "availableCrops"],
    },
  };
  return generateJson(prompt, schema);
};

export const getGovernmentSchemes = async (location: Location, language: Language): Promise<GovernmentScheme[]> => {
  const prompt = `List the top 3 most relevant central and state government agricultural schemes currently active for farmers in ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh. For each scheme, provide its name, a brief description, eligibility criteria, and an official link for more information. Please provide the entire response, including all field values, in the ${language} language.`;
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        eligibility: { type: Type.STRING },
        link: { type: Type.STRING },
      },
      required: ["name", "description", "eligibility", "link"],
    },
  };
  return generateJson(prompt, schema);
};

export const getFarmingMaterialsInfo = async (location: Location, language: Language): Promise<FarmingMaterial[]> => {
  const prompt = `Provide a list of 5 essential farming materials, tools, or equipment suitable for the agricultural context of ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh. For each item, provide its name, a brief description, and its primary usage in local farming practices. Please provide the entire response, including all field values, in the ${language} language.`;
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        usage: { type: Type.STRING },
      },
      required: ["name", "description", "usage"],
    },
  };
  return generateJson(prompt, schema);
};

export const getNearbyFertilizerShops = async (location: Location, language: Language, userCoords: { latitude: number; longitude: number } | null): Promise<GenerateContentResponse> => {
  const prompt = `Find nearby shops for quality seeds and pesticides around ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh. List at least 3 shops with their names and locations. The response should be in markdown format and in the ${language} language.`;
  
  const config: any = {
    tools: [{googleMaps: {}}],
  };

  if (userCoords) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
        }
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: config,
    });
    return response;
  } catch (error) {
    console.error("Error getting data from Gemini API with Maps grounding:", error);
    throw new Error("An error occurred while finding nearby shops. This may be a temporary issue. Please try again.");
  }
};

export const getGovLinksAndSubsidies = async (location: Location, language: Language): Promise<GenerateContentResponse> => {
    const prompt = `Provide official government links for crop booking, and information on subsidies for farming materials and pesticides available for farmers in ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh. The response should be in markdown format and in the ${language} language, with clear headings for each category.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        return response;
    } catch (error) {
        console.error("Error getting data from Gemini API with Search grounding:", error);
        throw new Error("An error occurred while finding government links. This may be a temporary issue. Please try again.");
    }
};

export const getNearbyTransportation = async (location: Location, language: Language, userCoords: { latitude: number; longitude: number } | null): Promise<GenerateContentResponse> => {
  const prompt = `Find nearby transportation services suitable for transporting agricultural crops from ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh. List at least 3 services with their names, contact information if available, and locations. The response should be in markdown format and in the ${language} language.`;
  
  const config: any = {
    tools: [{googleMaps: {}}],
  };

  if (userCoords) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
        }
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: config,
    });
    return response;
  } catch (error) {
    console.error("Error getting data from Gemini API with Maps grounding:", error);
    throw new Error("An error occurred while finding nearby transportation. This may be a temporary issue. Please try again.");
  }
};

export const getVillageMapInfo = async (location: Location, language: Language, userCoords: { latitude: number; longitude: number } | null): Promise<GenerateContentResponse> => {
  const prompt = `Show me a map and provide key geographical details for the village of ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh. The response should be in markdown format and in the ${language} language.`;
  
  const config: any = {
    tools: [{googleMaps: {}}],
  };

  if (userCoords) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
        }
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: config,
    });
    return response;
  } catch (error) {
    console.error("Error getting data from Gemini API with Maps grounding:", error);
    throw new Error("An error occurred while finding village map information. This may be a temporary issue. Please try again.");
  }
};

export const getNearbyColdStorages = async (location: Location, language: Language, userCoords: { latitude: number; longitude: number } | null): Promise<GenerateContentResponse> => {
  const prompt = `Find nearby cold storages suitable for agricultural produce around ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh. List at least 3 facilities with their names and locations. The response should be in markdown format and in the ${language} language.`;
  
  const config: any = {
    tools: [{googleMaps: {}}],
  };

  if (userCoords) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
        }
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: config,
    });
    return response;
  } catch (error) {
    console.error("Error getting data from Gemini API with Maps grounding:", error);
    throw new Error("An error occurred while finding nearby cold storages. This may be a temporary issue. Please try again.");
  }
};

export const getNearbyMarketYards = async (location: Location, language: Language, userCoords: { latitude: number; longitude: number } | null): Promise<GenerateContentResponse> => {
  const prompt = `Find nearby agricultural market yards, Rythu Bazaars, or Mandis around ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh. List at least 3 market yards with their names and locations. The response should be in markdown format and in the ${language} language.`;
  
  const config: any = {
    tools: [{googleMaps: {}}],
  };

  if (userCoords) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
        }
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: config,
    });
    return response;
  } catch (error) {
    console.error("Error getting data from Gemini API with Maps grounding:", error);
    throw new Error("An error occurred while finding nearby market yards. This may be a temporary issue. Please try again.");
  }
};