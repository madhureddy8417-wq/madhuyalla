import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Language, Location, SuitableCropInfo, DiseaseAnalysis, MarketInfo, GovernmentScheme, FarmingMaterial, WeatherReport, VillageMapData, WaterResourceReport, SuitableSpeciesInfo, FishDiseaseAnalysis, AquaMarketInfo, AquaScheme, AquaFarmingMaterial } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash";

const getLocationString = (location: Location): string => {
  if (location.constituency && location.district) {
    return `${location.constituency} constituency, ${location.district} district`;
  }
  if (location.village && location.mandal && location.district) {
    return `${location.village}, ${location.mandal}, ${location.district}`;
  }
  return location.district; // Fallback
};


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
    const locationString = getLocationString(location);
    const prompt = `Provide a detailed, agriculturally-focused weather report for ${locationString} in Andhra Pradesh, India.
  
  Current Conditions:
  - Temperature in Celsius (e.g., "32°C")
  - "Feels like" temperature in Celsius (e.g., "35°C")
  - A brief, one or two-word weather condition (e.g., "Sunny", "Partly Cloudy")
  - Humidity percentage (e.g., "65%")
  - Probability of precipitation for the next 24 hours (e.g., "10%")
  - Wind speed in km/h (e.g., "15 km/h")
  - Wind direction (e.g., "NW", "S")
  - Sunrise time (e.g., "5:45 AM")
  - Sunset time (e.g., "6:30 PM")
  - UV Index (e.g., "8 High")
  
  Hourly Forecast for the next 24 hours (at 3-hour intervals):
  - Provide 8 entries.
  - For each entry, include the time (e.g., "10:00 AM"), temperature in Celsius, a brief weather condition, and precipitation probability.

  5-Day Forecast:
  - For today and the next four days, provide the day's name (e.g., "Monday").
  - Maximum and minimum temperature in Celsius for each day.
  - A brief, one or two-word weather condition for each day.

  Agricultural Advisory:
  - Based on the complete forecast, provide a list of 2-3 concise, actionable bullet points of advice for farmers in this specific region. For example: "High humidity and upcoming rain increase the risk of fungal diseases; consider proactive spraying." or "Strong winds expected this afternoon; postpone pesticide application."

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
                    feelsLike: { type: Type.STRING },
                    windDirection: { type: Type.STRING },
                    sunrise: { type: Type.STRING },
                    sunset: { type: Type.STRING },
                },
                required: ["temperature", "condition", "humidity", "precipitationProbability", "windSpeed", "uvIndex", "feelsLike", "windDirection", "sunrise", "sunset"],
            },
            hourly: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        time: { type: Type.STRING },
                        temperature: { type: Type.STRING },
                        condition: { type: Type.STRING },
                        precipitationProbability: { type: Type.STRING },
                    },
                    required: ["time", "temperature", "condition", "precipitationProbability"],
                },
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
            agriculturalAdvisory: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
        },
        required: ["current", "hourly", "forecast", "agriculturalAdvisory"],
    };
    return generateJson(prompt, schema);
};

// --- AGRI GUIDE SERVICES ---

export const getSuitableCropInfo = async (location: Location, language: Language): Promise<SuitableCropInfo[]> => {
  const locationString = getLocationString(location);
  const prompt = `Based on the soil type, water availability, and climate of ${locationString} in Andhra Pradesh, list the top 5 most suitable crops to grow. For each crop, provide a detailed profile including:
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
  const locationString = getLocationString(location);
  const prompt = `Analyze the provided image of a crop leaf from a farm in ${locationString}, Andhra Pradesh. Identify any visible diseases or pest infections. If a disease is found, provide its name, a confidence score (High, Medium, or Low), a brief description, preventive measures, and recommended treatments. For treatments, prioritize locally available, sustainable, and organic solutions first, followed by chemical options if necessary, suitable for that region. If no disease is found, state that the plant appears healthy. Please provide the entire response, including all field values, in the ${language} language.`;
  
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
  const locationString = getLocationString(location);
  const prompt = `For the 3 nearest major agricultural markets (Rythu Bazaars, Mandis) to ${locationString}, Andhra Pradesh, provide a detailed report. For each market, include its name and approximate distance. Also, list the top 5-7 major crops currently available. For each crop, specify:
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
  const locationString = getLocationString(location);
  const prompt = `List the top 5 most relevant central and state government agricultural schemes currently active for farmers in ${locationString}, Andhra Pradesh. For each scheme, provide its name, a brief description, eligibility criteria, an official link for more information, and the application deadline if applicable (state "Varies" or "Open" if there's no fixed date). Please provide the entire response, including all field values, in the ${language} language.`;
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
  const locationString = getLocationString(location);
  const prompt = `Provide a list of 5 essential farming materials, tools, or equipment suitable for the agricultural context of ${locationString}, Andhra Pradesh. For each item, provide:
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

// --- AQUA GUIDE SERVICES ---

export const getSuitableSpeciesInfo = async (location: Location, language: Language): Promise<SuitableSpeciesInfo[]> => {
    const locationString = getLocationString(location);
    const prompt = `Based on the water sources (salinity, type), climate, and market demand near ${locationString} in Andhra Pradesh, list the top 5 most suitable aquaculture species (fish or shrimp) to cultivate. For each species, provide:
- Its name (e.g., "Vannamei Shrimp", "Rohu Fish").
- A brief reason for its suitability to the region.
- Its typical stocking season.
- Key water parameters required (e.g., "Salinity: 10-25 ppt, pH: 7.5-8.5").
- Potential yield per acre/hectare as a descriptive string (e.g., "4-5 tons per hectare").
- A single, average numerical value for the potential yield in tons.
- The current average market price per kilogram in local markets as a descriptive string (e.g., "₹300 - ₹350 per kg").
- A single, average numerical value for the market price per kg.
Please provide the entire response in the ${language} language.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                speciesName: { type: Type.STRING },
                suitability: { type: Type.STRING },
                avgMarketPrice: { type: Type.STRING },
                avgMarketPriceValue: { type: Type.NUMBER },
                stockingSeason: { type: Type.STRING },
                waterParameters: { type: Type.STRING },
                potentialYield: { type: Type.STRING },
                potentialYieldValue: { type: Type.NUMBER },
            },
            required: ["speciesName", "suitability", "avgMarketPrice", "avgMarketPriceValue", "stockingSeason", "waterParameters", "potentialYield", "potentialYieldValue"],
        },
    };
    return generateJson(prompt, schema);
};

export const analyzeFishImage = async (location: Location, imageBase64: string, mimeType: string, language: Language): Promise<FishDiseaseAnalysis> => {
    const locationString = getLocationString(location);
    const prompt = `Analyze the provided image of a fish or shrimp from an aquaculture farm in ${locationString}, Andhra Pradesh. Identify any visible diseases, parasites, or stress indicators. If a disease is found, provide its name, a confidence score (High, Medium, Low), a brief description, common preventive measures, and recommended treatments suitable for aquaculture in that region. If no disease is found, state that the specimen appears healthy. Please provide the entire response in the ${language} language.`;
    const imagePart = { inlineData: { data: imageBase64, mimeType: mimeType } };
    const textPart = { text: prompt };
    const schema = {
        type: Type.OBJECT,
        properties: {
            diseaseName: { type: Type.STRING },
            confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
            description: { type: Type.STRING },
            preventiveMeasures: { type: Type.ARRAY, items: { type: Type.STRING } },
            treatment: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["diseaseName", "confidence", "description", "preventiveMeasures", "treatment"],
    };
    try {
        const response = await ai.models.generateContent({ model, contents: { parts: [textPart, imagePart] }, config: { responseMimeType: "application/json", responseSchema: schema } });
        return JSON.parse(response.text.trim()) as FishDiseaseAnalysis;
    } catch (error) {
        console.error("Error analyzing image with Gemini API:", error);
        throw new Error("An error occurred while analyzing the image.");
    }
};

export const getAquaMarketInsights = async (location: Location, language: Language): Promise<AquaMarketInfo[]> => {
    const locationString = getLocationString(location);
    const prompt = `For the 3 nearest major fish/shrimp landing centers or wholesale markets to ${locationString}, Andhra Pradesh, provide a detailed report. For each market, include its name and approximate distance. List the top 5-7 major aquaculture species traded. For each species, specify:
- Current demand (High, Medium, Low).
- Average price per kilogram as a string (e.g., "₹300 - ₹320 per kg").
- A single, average numerical value for the price per kg.
- Recent price trend (Increasing, Decreasing, Stable).
- Information for sellers (e.g., 'Auction-based', 'Direct to exporters').
- Brief market notes (e.g., 'High demand for export-grade sizes').
Please provide the entire response in the ${language} language.`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                marketName: { type: Type.STRING },
                distance: { type: Type.STRING },
                availableSpecies: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            speciesName: { type: Type.STRING },
                            demand: { type: Type.STRING },
                            pricePerKg: { type: Type.STRING },
                            pricePerKgValue: { type: Type.NUMBER },
                            priceTrend: { type: Type.STRING },
                            sellerInfo: { type: Type.STRING },
                            marketNotes: { type: Type.STRING },
                        },
                        required: ["speciesName", "demand", "pricePerKg", "pricePerKgValue", "priceTrend", "sellerInfo", "marketNotes"],
                    },
                },
            },
            required: ["marketName", "distance", "availableSpecies"],
        },
    };
    return generateJson(prompt, schema);
};

export const getAquaGovernmentSchemes = async (location: Location, language: Language): Promise<AquaScheme[]> => {
    const locationString = getLocationString(location);
    const prompt = `List the top 5 most relevant central and state government aquaculture or fisheries schemes currently active for farmers in ${locationString}, Andhra Pradesh. Include schemes like Pradhan Mantri Matsya Sampada Yojana (PMMSY). For each, provide its name, a brief description, eligibility, an official link, and the application deadline. Please provide the response in the ${language} language.`;
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

export const getAquaFarmingMaterialsInfo = async (location: Location, language: Language): Promise<AquaFarmingMaterial[]> => {
    const locationString = getLocationString(location);
    const prompt = `Provide a list of 5 essential pieces of equipment or materials for aquaculture (e.g., aerators, feed, seed, water testing kits) suitable for the context of ${locationString}, Andhra Pradesh. For each item, provide its name, a brief description, its primary usage, an estimated price range, suggestions for local sourcing/brands, availability, and booking/purchase info. Please provide the entire response in the ${language} language.`;
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
                availability: { type: Type.STRING },
                bookingInfo: { type: Type.STRING },
            },
            required: ["name", "description", "usage", "estimatedPrice", "localSourcing", "availability", "bookingInfo"],
        },
    };
    return generateJson(prompt, schema);
};

// --- COMMON & GROUNDED SERVICES ---

const generateGroundedResponse = async (prompt: string): Promise<GenerateContentResponse> => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: { tools: [{ googleMaps: {} }] },
        });
        return response;
    } catch (error) {
        console.error("Error with Maps grounding:", error);
        throw new Error("An error occurred while finding nearby services. Please try again.");
    }
}

export const getNearbyShops = async (location: Location, language: Language, appMode: 'agri' | 'aqua'): Promise<GenerateContentResponse> => {
    const locationString = getLocationString(location);
    const prompt = appMode === 'agri'
        ? `Find nearby shops known for quality seeds and government-approved fertilizers and pesticides around ${locationString}, Andhra Pradesh. For each shop, list its name, address, and contact number. Mention stock status on common items and if they offer online booking. The response should be in markdown format and in the ${language} language.`
        : `Find nearby aquaculture shops, feed suppliers, and fish/shrimp hatcheries around ${locationString}, Andhra Pradesh. For each, list its name, address, and contact number. Mention what they specialize in (e.g., 'Vannamei seed', 'Floating fish feed') and how to place an order. The response should be in markdown format and in the ${language} language.`;
    return generateGroundedResponse(prompt);
};

export const getGovLinksAndSubsidies = async (location: Location, language: Language, appMode: 'agri' | 'aqua'): Promise<GenerateContentResponse> => {
    const locationString = getLocationString(location);
    const subject = appMode === 'agri' ? 'farming materials and pesticides' : 'aquaculture equipment, feed, and seed';
    const prompt = `Provide official government links for crop/aquaculture registration, and information on subsidies for ${subject} available for farmers in ${locationString}, Andhra Pradesh. The response should be in markdown format and in the ${language} language, with clear headings.`;
    try {
        return await ai.models.generateContent({ model, contents: prompt, config: { tools: [{ googleSearch: {} }] } });
    } catch (error) {
        console.error("Error with Search grounding:", error);
        throw new Error("An error occurred while finding government links. Please try again.");
    }
};

export const getNearbyTransportation = async (location: Location, language: Language, appMode: 'agri' | 'aqua'): Promise<GenerateContentResponse> => {
    const locationString = getLocationString(location);
    const produceType = appMode === 'agri' ? 'agricultural produce' : 'fish and shrimp (mentioning refrigerated trucks)';
    const prompt = `Find nearby transportation services with experience in handling ${produceType} from ${locationString}, Andhra Pradesh. For each service, list its name, contact information, types of vehicles offered, availability, and how to book. The response should be in markdown format and in the ${language} language.`;
    return generateGroundedResponse(prompt);
};

export const getVillageMapInfo = async (location: Location, language: Language): Promise<VillageMapData> => {
  const locationString = getLocationString(location);
  const prompt = `Provide key geographical details for ${locationString}, Andhra Pradesh. Return a JSON object containing:
1.  The location's name.
2.  The central latitude and longitude of the location.
3.  An array of 3-5 important agricultural or aquacultural points of interest (POIs) within or very near the main town of the area.
For each POI, include its name, a type (e.g., "Water Source", "Market Yard", "Government Office", "Fertilizer Shop", "Hatchery"), a brief one-sentence description, and its precise latitude and longitude.
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

export const getNearbyColdStorages = async (location: Location, language: Language): Promise<GenerateContentResponse> => {
  const locationString = getLocationString(location);
  const prompt = `Find nearby cold storages suitable for agricultural or aquacultural produce around ${locationString}, Andhra Pradesh. For each facility, list its name, location, available capacity, and the detailed process for booking space. The response should be in markdown format and in the ${language} language.`;
  return generateGroundedResponse(prompt);
};

export const getNearbyMarketYards = async (location: Location, language: Language, appMode: 'agri' | 'aqua'): Promise<GenerateContentResponse> => {
  const locationString = getLocationString(location);
  const marketType = appMode === 'agri' ? 'agricultural market yards, Rythu Bazaars, or Mandis' : 'fish/shrimp wholesale markets or landing centers';
  const prompt = `Find nearby ${marketType} around ${locationString}, Andhra Pradesh. For each market, list its name, location, the current situation for sellers, and the detailed process to register or book a selling slot. The response should be in markdown format and in the ${language} language.`;
  return generateGroundedResponse(prompt);
};

export const getNearbyWaterResources = async (location: Location, language: Language): Promise<WaterResourceReport> => {
  const locationString = getLocationString(location);
  const prompt = `Provide a detailed report on water resources for agriculture and aquaculture in ${locationString}, Andhra Pradesh. Return a JSON object containing:
1. The central latitude and longitude for the map view.
2. A list of 3-5 major nearby water resources (rivers, canals, reservoirs). For each resource, provide its name, type, current water availability/storage status (e.g., "75% Full", "Good", "Low"), a brief description, and its precise latitude and longitude.
3. An analysis object with:
    a. A paragraph describing irrigation or water source connectivity for local farms/ponds.
    b. A paragraph analyzing crop or aquaculture suitability based on the current water supply.
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

export const getDroneDeliveryServices = async (location: Location, language: Language, appMode: 'agri' | 'aqua'): Promise<GenerateContentResponse> => {
  const locationString = getLocationString(location);
  const usage = appMode === 'agri' ? 'delivering items like fertilizers, pesticides, seeds, or for spraying crops' : 'delivering items like feed, seed (larvae), or water samples for testing';
  const prompt = `Find nearby agricultural drone delivery services around ${locationString}, Andhra Pradesh. These services are used for ${usage}. For each service, list its name, contact information, types of services offered, payload capacity, availability, and how to book the service. The response should be in markdown format and in the ${language} language.`;
  return generateGroundedResponse(prompt);
};

export const reverseGeocode = async (coords: { latitude: number; longitude: number }, language: Language): Promise<Location> => {
  const prompt = `Based on the geographical coordinates latitude: ${coords.latitude} and longitude: ${coords.longitude}, identify the exact village, mandal, district, and legislative assembly constituency in Andhra Pradesh, India. Provide the entire response, including all field values, in the ${language} language.`;
  const schema = {
    type: Type.OBJECT,
    properties: {
      village: { type: Type.STRING },
      mandal: { type: Type.STRING },
      district: { type: Type.STRING },
      constituency: { type: Type.STRING },
    },
    required: ["village", "mandal", "district", "constituency"],
  };
  return generateJson(prompt, schema);
};