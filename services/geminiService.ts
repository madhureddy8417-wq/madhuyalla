

import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Language, Location, SuitableCropInfo, DiseaseAnalysis, MarketInfo, GovernmentScheme, FarmingMaterial, WeatherReport, VillageMapData, WaterResourceReport } from '../types';

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

export const getWeatherForecast = async (location: Location, language: Language): Promise<WeatherReport> => {
  const prompt = `Provide a detailed, agriculturally-focused weather report for ${location.village}, ${location.mandal}, ${location.district} in Andhra Pradesh, India.
  
  Current Conditions:
  - Temperature in Celsius (e.g., "32°C")
  - A brief, one or two-word weather condition (e.g., "Sunny", "Partly Cloudy", "Light Rain")
  - Humidity percentage (e.g., "65%")
  - Probability of precipitation for the next 24 hours (e.g., "10%")
  - Wind speed in km/h (e.g., "15 km/h")
  - UV Index (e.g., "8 High")
  
  3-Day Forecast:
  - For today and the next two days, provide the day's name (e.g., "Monday").
  - Maximum and minimum temperature in Celsius for each day.
  - A brief, one or two-word weather condition for each day.
  
  Please provide the entire response, including all field values and day names, in the ${language} language.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      current: {
        type: Type.OBJECT,
        properties: {
          temperature: { type: Type.STRING },
          condition: { type: Type.STRING },
          humidity: { type: Type.STRING },
          precipitationProbability: { type: Type.STRING },
          windSpeed: { type: Type.STRING },
          uvIndex: { type: Type.STRING },
        },
        required: ["temperature", "condition", "humidity", "precipitationProbability", "windSpeed", "uvIndex"],
      },
      forecast: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING },
            maxTemp: { type: Type.STRING },
            minTemp: { type: Type.STRING },
            condition: { type: Type.STRING },
          },
          required: ["day", "maxTemp", "minTemp", "condition"],
        },
      },
    },
    required: ["current", "forecast"],
  };
  return generateJson(prompt, schema);
};

export const getSuitableCropInfo = async (location: Location, language: Language): Promise<SuitableCropInfo[]> => {
  const prompt = `Based on the soil type, water availability, and climate of ${location.village}, ${location.mandal}, ${location.district} in Andhra Pradesh, list the top 5 most suitable crops to grow. For each crop, provide a detailed profile including:
- A brief reason for its suitability.
- Its typical sowing season in this region.
- Its water requirements (e.g., Low, Medium, High).
- The potential yield per acre as a descriptive string (e.g., "20-25 quintals per acre").
- A single, average numerical value for the potential yield (e.g., for "20-25 quintals per acre", return 22.5).
- The current average market price per quintal in local markets as a descriptive string (e.g., "₹2,000 - ₹2,200 per quintal").
- A single, average numerical value for the market price (e.g., for "₹2,000 - ₹2,200", return 2100).
Please provide the entire response, including all field values, in the ${language} language.`;
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        cropName: { type: Type.STRING },
        suitability: { type: Type.STRING, description: "Reason why this crop is suitable for the location." },
        avgMarketPrice: { type: Type.STRING, description: "e.g., ₹2,000 - ₹2,200 per quintal" },
        avgMarketPriceValue: { type: Type.NUMBER, description: "A single average numeric value for the market price." },
        sowingSeason: { type: Type.STRING },
        waterRequirement: { type: Type.STRING },
        potentialYield: { type: Type.STRING, description: "e.g., '20-25 quintals per acre'" },
        potentialYieldValue: { type: Type.NUMBER, description: "A single average numeric value for the potential yield." },
      },
      required: ["cropName", "suitability", "avgMarketPrice", "avgMarketPriceValue", "sowingSeason", "waterRequirement", "potentialYield", "potentialYieldValue"],
    },
  };
  return generateJson(prompt, schema);
};

export const analyzeCropImage = async (location: Location, imageBase64: string, mimeType: string, language: Language): Promise<DiseaseAnalysis> => {
  const prompt = `Analyze the provided image of a crop leaf from a farm in ${location.village}, ${location.district}, Andhra Pradesh. Identify any visible diseases or pest infections. If a disease is found, provide its name, a confidence score (High, Medium, or Low), a brief description, preventive measures, and recommended treatments. For treatments, prioritize locally available, sustainable, and organic solutions first, followed by chemical options if necessary, suitable for that region. If no disease is found, state that the plant appears healthy. Please provide the entire response, including all field values, in the ${language} language.`;
  
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
  const prompt = `For the 3 nearest major agricultural markets (Rythu Bazaars, Mandis) to ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh, provide a detailed report. For each market, include its name and approximate distance. Also, list the top 5-7 major crops currently available. For each crop, specify:
- Its current demand level (e.g., High, Medium, Low).
- The average price per kilogram as a descriptive string (e.g., "₹40 - ₹50 per kg").
- A single, average numerical value for the price per kilogram (e.g., for "₹40 - ₹50", return 45).
- The recent price trend (e.g., Increasing, Decreasing, Stable).
- Seller slot availability for farmers (e.g., 'Open', 'By appointment', 'Limited slots').
- A brief note on how to book a selling slot if required (e.g., 'Contact market office at [phone number]', 'Register on website').
Please provide the entire response, including all field values, in the ${language} language.`;
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
              pricePerKgValue: { type: Type.NUMBER, description: "A single average numeric value for the price per kg." },
              priceTrend: { type: Type.STRING, description: "e.g., Increasing, Decreasing, Stable" },
              sellerSlotAvailability: { type: Type.STRING, description: "e.g., 'Open', 'By appointment'" },
              bookingNotes: { type: Type.STRING, description: "Instructions on how to book a slot." },
            },
            required: ["cropName", "demand", "pricePerKg", "pricePerKgValue", "priceTrend", "sellerSlotAvailability", "bookingNotes"],
          },
        },
      },
      required: ["marketName", "distance", "availableCrops"],
    },
  };
  return generateJson(prompt, schema);
};

export const getGovernmentSchemes = async (location: Location, language: Language): Promise<GovernmentScheme[]> => {
  const prompt = `List the top 5 most relevant central and state government agricultural schemes currently active for farmers in ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh. For each scheme, provide its name, a brief description, eligibility criteria, an official link for more information, and the application deadline if applicable (state "Varies" or "Open" if there's no fixed date). Please provide the entire response, including all field values, in the ${language} language.`;
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        eligibility: { type: Type.STRING },
        link: { type: Type.STRING },
        applicationDeadline: { type: Type.STRING },
      },
      required: ["name", "description", "eligibility", "link", "applicationDeadline"],
    },
  };
  return generateJson(prompt, schema);
};

export const getFarmingMaterialsInfo = async (location: Location, language: Language): Promise<FarmingMaterial[]> => {
  const prompt = `Provide a list of 5 essential farming materials, tools, or equipment suitable for the agricultural context of ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh. For each item, provide:
- Its name.
- A brief description.
- Its primary usage.
- An estimated price range in INR.
- Suggestions for local sourcing.
- Its current availability/stock status (e.g., 'In Stock', 'Low Stock', 'Pre-order available').
- Instructions for online booking or purchase if available (e.g., 'Order via website [link]', 'Call [phone number] to reserve').
Please provide the entire response, including all field values, in the ${language} language.`;
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        usage: { type: Type.STRING },
        estimatedPrice: { type: Type.STRING },
        localSourcing: { type: Type.STRING },
        availability: { type: Type.STRING, description: "e.g., 'In Stock', 'Low Stock'" },
        bookingInfo: { type: Type.STRING, description: "Instructions on how to book or buy." },
      },
      required: ["name", "description", "usage", "estimatedPrice", "localSourcing", "availability", "bookingInfo"],
    },
  };
  return generateJson(prompt, schema);
};

export const getNearbyFertilizerShops = async (location: Location, language: Language, userCoords: { latitude: number; longitude: number } | null): Promise<GenerateContentResponse> => {
  const prompt = `Find nearby shops known for quality seeds and government-approved fertilizers and pesticides around ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh. For each shop, list its name, address, and contact number if available. Also, mention its current stock status on common items (e.g., 'Good stock of Urea and DAP') and if they offer online booking or pre-ordering, including instructions on how to do so. The response should be in markdown format and in the ${language} language.`;
  
  const config: any = {
    tools: [{googleMaps: {}}],
  };

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
  const prompt = `Find nearby transportation services with experience in handling agricultural produce from ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh. For each service, list its name, contact information, types of vehicles offered, current availability (e.g., 'Available on short notice', 'Book 2 days in advance'), and how to book a vehicle. The response should be in markdown format and in the ${language} language.`;
  
  const config: any = {
    tools: [{googleMaps: {}}],
  };

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

export const getVillageMapInfo = async (location: Location, language: Language): Promise<VillageMapData> => {
  const prompt = `Provide key geographical details for the village of ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh. Return a JSON object containing:
1.  The village name.
2.  The central latitude and longitude of the village.
3.  An array of 3-5 important agricultural points of interest (POIs) within or very near the village.
For each POI, include its name, a type (e.g., "Water Source", "Market Yard", "Government Office", "Fertilizer Shop", "Cold Storage"), a brief one-sentence description, and its precise latitude and longitude.
Please provide the entire response, including all field values, in the ${language} language.`;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      villageName: { type: Type.STRING },
      center: {
        type: Type.OBJECT,
        properties: {
          latitude: { type: Type.NUMBER },
          longitude: { type: Type.NUMBER },
        },
        required: ["latitude", "longitude"],
      },
      pointsOfInterest: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING },
            description: { type: Type.STRING },
            latitude: { type: Type.NUMBER },
            longitude: { type: Type.NUMBER },
          },
          required: ["name", "type", "description", "latitude", "longitude"],
        },
      },
    },
    required: ["villageName", "center", "pointsOfInterest"],
  };

  return generateJson(prompt, schema);
};

export const getNearbyColdStorages = async (location: Location, language: Language, userCoords: { latitude: number; longitude: number } | null): Promise<GenerateContentResponse> => {
  const prompt = `Find nearby cold storages suitable for agricultural produce around ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh. For each facility, list its name, location, current available storage capacity (e.g., 'High availability', 'Limited space', 'Fully booked'), and the detailed process for booking space (e.g., contact number, online portal link, documents required). The response should be in markdown format and in the ${language} language.`;
  
  const config: any = {
    tools: [{googleMaps: {}}],
  };

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
  const prompt = `Find nearby agricultural market yards, Rythu Bazaars, or Mandis around ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh. For each market, list its name, location, the current situation for sellers (e.g., 'Accepting new sellers', 'Slots available via booking', 'Waiting list'), and the detailed process to register or book a selling slot. The response should be in markdown format and in the ${language} language.`;
  
  const config: any = {
    tools: [{googleMaps: {}}],
  };

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

export const getNearbyWaterResources = async (location: Location, language: Language): Promise<WaterResourceReport> => {
  const prompt = `Provide a detailed report on water resources for agriculture in ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh. Return a JSON object containing:
1. The central latitude and longitude for the map view.
2. A list of 3-5 major nearby water resources (rivers, canals, reservoirs). For each resource, provide its name, type, current water availability/storage status (e.g., "75% Full", "Good", "Low"), a brief description, and its precise latitude and longitude.
3. An analysis object with:
    a. A paragraph describing irrigation connectivity: how water from these sources reaches the local fields.
    b. A paragraph analyzing crop suitability based on the current water supply for crops like paddy, cotton, etc.
Please provide the entire response, including all field values, in the ${language} language.`;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      center: {
        type: Type.OBJECT,
        properties: {
          latitude: { type: Type.NUMBER },
          longitude: { type: Type.NUMBER },
        },
        required: ["latitude", "longitude"],
      },
      analysis: {
        type: Type.OBJECT,
        properties: {
          irrigationConnectivity: { type: Type.STRING },
          cropSuitability: { type: Type.STRING },
        },
        required: ["irrigationConnectivity", "cropSuitability"],
      },
      resources: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['River', 'Canal', 'Reservoir', 'Groundwater', 'Other'] },
            availability: { type: Type.STRING },
            description: { type: Type.STRING },
            latitude: { type: Type.NUMBER },
            longitude: { type: Type.NUMBER },
          },
          required: ["name", "type", "availability", "description", "latitude", "longitude"],
        },
      },
    },
    required: ["center", "analysis", "resources"],
  };

  return generateJson(prompt, schema);
};

export const getDroneDeliveryServices = async (location: Location, language: Language, userCoords: { latitude: number; longitude: number } | null): Promise<GenerateContentResponse> => {
  const prompt = `Find nearby agricultural drone delivery services around ${location.village}, ${location.mandal}, ${location.district}, Andhra Pradesh. These services are used for delivering items like fertilizers, pesticides, seeds, or for spraying crops. For each service, list its name, contact information, types of services offered (e.g., 'delivery', 'spraying'), payload capacity, current availability (e.g., 'Available on demand', 'Book in advance'), and how to book the service. The response should be in markdown format and in the ${language} language.`;
  
  const config: any = {
    tools: [{googleMaps: {}}],
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: config,
    });
    return response;
  } catch (error) {
    console.error("Error getting data from Gemini API with Maps grounding:", error);
    throw new Error("An error occurred while finding drone delivery services. This may be a temporary issue. Please try again.");
  }
};

export const reverseGeocode = async (coords: { latitude: number; longitude: number }, language: Language): Promise<Location> => {
  const prompt = `Based on the geographical coordinates latitude: ${coords.latitude} and longitude: ${coords.longitude}, identify the exact village, mandal, and district in Andhra Pradesh, India. Provide the entire response, including all field values, in the ${language} language.`;
  const schema = {
    type: Type.OBJECT,
    properties: {
      village: { type: Type.STRING },
      mandal: { type: Type.STRING },
      district: { type: Type.STRING },
    },
    required: ["village", "mandal", "district"],
  };
  return generateJson(prompt, schema);
};