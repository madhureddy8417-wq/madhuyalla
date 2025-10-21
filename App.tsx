

import React, { useState, useRef, useEffect } from 'react';
// FIX: Make imports type-specific for clarity and correctness.
import { GoogleGenAI, type Chat, type GenerateContentResponse } from "@google/genai";
import Header from './components/Header';
import Modal from './components/Modal';
import WeatherDisplay from './components/WeatherDisplay';
import InteractiveMap from './components/InteractiveMap';
import WaterReportDisplay from './components/WaterReportDisplay';
import { UI_STRINGS, FEATURES } from './constants';
import * as gemini from './services/geminiService';
// FIX: Remove non-existent import of GenerateContentResponse from local types.
import type { Language, Location, ModalType, ChatMessage, WeatherReport, VillageMapData, WaterResourceReport, SuitableCropInfo, SuitableSpeciesInfo, MarketInfo, AquaMarketInfo, GovernmentScheme, AquaScheme, FarmingMaterial, AquaFarmingMaterial, DiseaseAnalysis, FishDiseaseAnalysis, CropMarketData, AquaMarketData } from './types';
import HomePage from './components/HomePage';
import { YieldChart, PriceChart, MarketPriceChart } from './components/charts';

type AppMode = 'agri' | 'aqua';

// FIX: Correct the onClick prop type to accept an async function, and define props with React.FC to allow for 'key' prop.
const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, onClick: () => Promise<void> }> = ({ icon, title, onClick }) => {
  const IconComponent = icon as React.ElementType;
  return (
    <button onClick={onClick} className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200 transition-all hover:shadow-xl hover:border-green-300 hover:-translate-y-1 text-center flex flex-col items-center justify-center space-y-3">
      <div className="bg-green-100 p-4 rounded-full">
        <IconComponent />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-green-800">{title}</h3>
    </button>
  );
};

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('agri');
  const [language, setLanguage] = useState<Language>('english');
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [chat, setChat] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [weatherData, setWeatherData] = useState<WeatherReport | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  
  const [showHomePage, setShowHomePage] = useState(true);

  const T = UI_STRINGS[language];
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const resetState = () => {
    setLocation(null);
    setError(null);
    setActiveModal(null);
    setModalData(null);
    setChat(null);
    setChatHistory([]);
    setWeatherData(null);
    setWeatherError(null);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    resetState();
  };

  const handleModeChange = (mode: AppMode) => {
    setAppMode(mode);
    resetState();
  };

  const handleLocationSet = async (loc: Location) => {
    setLocation(loc);
    setActiveModal(null);
    setModalData(null);
    setError(null);
    
    setWeatherData(null);
    setWeatherError(null);
    setIsWeatherLoading(true);
    try {
        const data = await gemini.getWeatherForecast(loc, language);
        setWeatherData(data);
    } catch (e) {
        setWeatherError(T.weatherError);
    } finally {
        setIsWeatherLoading(false);
    }
  };

  const handleFeatureClick = async (type: ModalType) => {
    if (!location) return;

    setActiveModal(type);
    setIsModalLoading(true);
    setError(null);
    setModalData(null);

    try {
      let data;
      // Handle special cases first
      if (type === 'doctor') {
        setImageFile(null);
        setImagePreview(null);
        setIsModalLoading(false);
        return;
      }
      if (type === 'assistant') {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const systemInstruction = appMode === 'agri'
          ? `You are a helpful AI assistant for farmers in Andhra Pradesh, India. Your name is AGRIGUIDE. Provide concise, practical advice in ${language}.`
          : `You are a helpful AI expert for aquaculture (fish and shrimp farming) in Andhra Pradesh, India. Your name is AQUAGUIDE. Provide concise, practical advice in ${language}.`;
        const newChat = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction } });
        setChat(newChat);
        setChatHistory([]);
        setUserMessage('');
        setIsModalLoading(false);
        return;
      }

      // Map feature type to the correct service function
      const serviceMap: { [key in AppMode]: { [key: string]: Function } } = {
        agri: {
          soil: gemini.getSuitableCropInfo,
          market: gemini.getMarketInsights,
          schemes: gemini.getGovernmentSchemes,
          materials: gemini.getFarmingMaterialsInfo,
          shops: gemini.getNearbyShops,
          links: gemini.getGovLinksAndSubsidies,
          transport: gemini.getNearbyTransportation,
          marketyard: gemini.getNearbyMarketYards,
          drone: gemini.getDroneDeliveryServices,
        },
        aqua: {
          soil: gemini.getSuitableSpeciesInfo,
          market: gemini.getAquaMarketInsights,
          schemes: gemini.getAquaGovernmentSchemes,
          materials: gemini.getAquaFarmingMaterialsInfo,
          shops: gemini.getNearbyShops,
          links: gemini.getGovLinksAndSubsidies,
          transport: gemini.getNearbyTransportation,
          marketyard: gemini.getNearbyMarketYards,
          drone: gemini.getDroneDeliveryServices,
        }
      };
      
      let serviceFunction: Function | undefined = serviceMap[appMode][type] || undefined;
      
      // Common services
      if (!serviceFunction) {
          const commonServiceMap: { [key: string]: Function } = {
              map: gemini.getVillageMapInfo,
              water: gemini.getNearbyWaterResources,
              coldstorage: gemini.getNearbyColdStorages
          };
          serviceFunction = commonServiceMap[type];
      }
      
      if (serviceFunction) {
          // Check if it's a grounded search that needs appMode
          if (['shops', 'links', 'transport', 'marketyard', 'drone'].includes(type)) {
              data = await serviceFunction(location, language, appMode);
          } else {
              data = await serviceFunction(location, language);
          }
      } else {
          setIsModalLoading(false);
          throw new Error("Feature not implemented for this mode.");
      }

      setModalData(data);
    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
    } finally {
      setIsModalLoading(false);
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile || !location) return;

    setIsModalLoading(true);
    setModalData(null);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const analysisFunction = appMode === 'agri' ? gemini.analyzeCropImage : gemini.analyzeFishImage;
        const data = await analysisFunction(location, base64String, imageFile.type, language);
        setModalData(data);
        setIsModalLoading(false);
      };
      reader.readAsDataURL(imageFile);
    } catch (e: any) {
      setError(e.message || "Failed to analyze image.");
      setIsModalLoading(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!userMessage.trim() || !chat || isChatLoading) return;
    
    const message = userMessage.trim();
    setUserMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: message }]);
    setIsChatLoading(true);
    
    try {
        const result = await chat.sendMessage({ message });
        setChatHistory(prev => [...prev, { role: 'model', text: result.text }]);
    } catch (e: any) {
        setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again."}]);
        console.error("Chat error:", e);
    } finally {
        setIsChatLoading(false);
    }
  };
  
  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
    setError(null);
    setImageFile(null);
    setImagePreview(null);
    if(activeModal === 'assistant') {
        setChat(null);
        setChatHistory([]);
    }
  };

  const renderMarkdown = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/(\r\n|\n|\r)/gm, '<br>');
  };
  
  const handleEnter = (mode: AppMode) => {
    setAppMode(mode);
    setShowHomePage(false);
  }

  if (showHomePage) {
    return <HomePage onEnter={handleEnter} />;
  }
  
  const renderModalContent = () => {
    if (!modalData) return null;
    
    if (appMode === 'agri') {
        switch(activeModal) {
            case 'soil': return <>
                {(modalData as SuitableCropInfo[]).map(item => (
                    <div key={item.cropName} className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-bold text-green-700">{item.cropName}</h4>
                        <p><strong>Suitability:</strong> {item.suitability}</p>
                        <p><strong>Sowing Season:</strong> {item.sowingSeason}</p>
                        <p><strong>Potential Yield:</strong> {item.potentialYield}</p>
                        <p><strong>Avg. Price:</strong> {item.avgMarketPrice}</p>
                    </div>
                ))}
                <div className="mt-6 border-t pt-4">
                    <YieldChart data={modalData} nameKey="cropName" valueKey="potentialYieldValue" chartTitle="Potential Yield" barName="Yield" barColor="#34D399" />
                    <PriceChart data={modalData} nameKey="cropName" valueKey="avgMarketPriceValue" chartTitle="Average Market Price" barName="Price (₹)" barColor="#3B82F6" />
                </div>
            </>;
            case 'doctor':
                const cropData = modalData as DiseaseAnalysis;
                return <>
                    <h4 className="font-bold text-green-700">{cropData.diseaseName}</h4>
                    <p><strong>Confidence:</strong> {cropData.confidence}</p>
                    <p><strong>Description:</strong> {cropData.description}</p>
                    <p className="font-semibold mt-2">Preventive Measures:</p>
                    <ul className="list-disc list-inside ml-4">{cropData.preventiveMeasures?.map((m: string) => <li key={m}>{m}</li>)}</ul>
                    <p className="font-semibold mt-2">Treatment:</p>
                    {/* FIX: The list item for treatment was empty. Added the treatment text `{t}` inside the `li` tag. This likely caused a cascade of parsing errors. */}
                    <ul className="list-disc list-inside ml-4">{cropData.treatment?.map((t: string) => <li key={t}>{t}</li>)}</ul>
                </>;
            case 'market': return (modalData as MarketInfo[]).map(market => (
                <div key={market.marketName} className="mb-6 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-bold text-green-700">{market.marketName} ({market.distance})</h4>
                  <MarketPriceChart data={market.availableCrops} />
                  <div className="divide-y divide-gray-200 mt-4">
                    {market.availableCrops?.map((c: CropMarketData) => 
                      <div key={c.cropName} className="py-2">
                        <p className="font-semibold">{c.cropName}</p>
                        <p className="text-sm">Price: {c.pricePerKg} (Demand: {c.demand}, Trend: {c.priceTrend})</p>
                      </div>
                    )}
                  </div>
                </div>
              ));
            case 'schemes': return (modalData as GovernmentScheme[]).map(scheme => (
              <div key={scheme.name} className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-green-700">{scheme.name}</h4>
                <p><strong>Eligibility:</strong> {scheme.eligibility}</p>
                <a href={scheme.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">More Info</a>
              </div>
            ));
            case 'materials': return (modalData as FarmingMaterial[]).map(material => (
              <div key={material.name} className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-green-700">{material.name}</h4>
                <p><strong>Usage:</strong> {material.usage}</p>
                <p><strong>Est. Price:</strong> {material.estimatedPrice}</p>
              </div>
            ));
        }
    } else { // appMode === 'aqua'
        switch(activeModal) {
            case 'soil': return <>
                {(modalData as SuitableSpeciesInfo[]).map(item => (
                    <div key={item.speciesName} className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-bold text-blue-700">{item.speciesName}</h4>
                        <p><strong>Suitability:</strong> {item.suitability}</p>
                        <p><strong>Stocking Season:</strong> {item.stockingSeason}</p>
                        <p><strong>Yield:</strong> {item.potentialYield}</p>
                        <p><strong>Avg. Price:</strong> {item.avgMarketPrice}</p>
                    </div>
                ))}
                <div className="mt-6 border-t pt-4">
                    <YieldChart data={modalData} nameKey="speciesName" valueKey="potentialYieldValue" chartTitle="Potential Yield (Tons)" barName="Yield" barColor="#34D399" />
                    <PriceChart data={modalData} nameKey="speciesName" valueKey="avgMarketPriceValue" chartTitle="Average Market Price (per Kg)" barName="Price (₹)" barColor="#3B82F6" />
                </div>
            </>;
            case 'doctor':
                const fishData = modalData as FishDiseaseAnalysis;
                return <>
                    <h4 className="font-bold text-blue-700">{fishData.diseaseName}</h4>
                    <p><strong>Confidence:</strong> {fishData.confidence}</p>
                    <p><strong>Description:</strong> {fishData.description}</p>
                    <p className="font-semibold mt-2">Preventive Measures:</p>
                    <ul className="list-disc list-inside ml-4">{fishData.preventiveMeasures?.map((m: string) => <li key={m}>{m}</li>)}</ul>
                    <p className="font-semibold mt-2">Treatment:</p>
                    {/* FIX: The list item for treatment was empty. Added the treatment text `{t}` inside the `li` tag. This likely caused a cascade of parsing errors. */}
                    <ul className="list-disc list-inside ml-4">{fishData.treatment?.map((t: string) => <li key={t}>{t}</li>)}</ul>
                </>;
             case 'market': return (modalData as AquaMarketInfo[]).map(market => (
                <div key={market.marketName} className="mb-6 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-bold text-blue-700">{market.marketName} ({market.distance})</h4>
                  <MarketPriceChart data={market.availableSpecies.map(s => ({...s, cropName: s.speciesName}))} />
                  <div className="divide-y divide-gray-200 mt-4">
                    {market.availableSpecies?.map((c: AquaMarketData) => 
                      <div key={c.speciesName} className="py-2">
                        <p className="font-semibold">{c.speciesName}</p>
                        <p className="text-sm">Price: {c.pricePerKg} (Demand: {c.demand}, Trend: {c.priceTrend})</p>
                      </div>
                    )}
                  </div>
                </div>
              ));
            case 'schemes': return (modalData as AquaScheme[]).map(scheme => (
              <div key={scheme.name} className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-blue-700">{scheme.name}</h4>
                <p><strong>Eligibility:</strong> {scheme.eligibility}</p>
                <a href={scheme.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">More Info</a>
              </div>
            ));
            case 'materials': return (modalData as AquaFarmingMaterial[]).map(material => (
              <div key={material.name} className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-blue-700">{material.name}</h4>
                <p><strong>Usage:</strong> {material.usage}</p>
                <p><strong>Est. Price:</strong> {material.estimatedPrice}</p>
              </div>
            ));
        }
    }
    
    // Common modal content
    switch(activeModal) {
        case 'map': return <InteractiveMap data={modalData as VillageMapData} />;
        case 'water': return <WaterReportDisplay data={modalData as WaterResourceReport} />;
        case 'shops':
        case 'links':
        case 'transport':
        case 'coldstorage':
        case 'marketyard':
        case 'drone':
            // FIX: Use GenerateContentResponse instead of the non-existent GeminiResponse.
            const groundedData = modalData as GenerateContentResponse;
            return <div>
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(groundedData.text) }} />
                {groundedData.candidates?.[0]?.groundingMetadata?.groundingChunks?.length > 0 && (
                    <div className="mt-4">
                        <h5 className="font-bold text-green-700">{T.sources}:</h5>
                        <ul className="list-disc list-inside ml-4 text-sm">
                            {groundedData.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any, index: number) => (
                                (chunk.web || chunk.maps) && (
                                    <li key={index}>
                                        <a href={chunk.web?.uri || chunk.maps?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            {chunk.web?.title || chunk.maps?.title || 'Source'}
                                        </a>
                                    </li>
                                )
                            ))}
                        </ul>
                    </div>
                )}
            </div>;
        default: return null;
    }
  };


  return (
    <div className={`min-h-screen font-sans ${appMode === 'agri' ? 'bg-green-50/50' : 'bg-blue-50/50'}`}>
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        onLocationSet={handleLocationSet}
        appMode={appMode}
        onModeChange={handleModeChange}
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {location && (
            <WeatherDisplay 
                data={weatherData}
                isLoading={isWeatherLoading}
                error={weatherError}
                language={language}
            />
        )}
        {!location ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mt-4">{T.setLocationPrompt}</h2>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {FEATURES[appMode].map(feature => (
                <FeatureCard 
                    key={feature.id}
                    icon={feature.icon} 
                    title={T[feature.titleKey as keyof typeof T] as string}
                    onClick={() => handleFeatureClick(feature.id as ModalType)} 
                />
            ))}
          </div>
        )}
      </main>

      <Modal 
        isOpen={!!activeModal} 
        onClose={closeModal} 
        title={activeModal ? T.modalTitles[activeModal] : ''}
        modalData={modalData}
        activeModal={activeModal}
        appMode={appMode}
      >
        {isModalLoading && (
            <div className="flex justify-center items-center h-48">
              <svg className="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
        )}
        {error && <p className="text-red-500 text-center">{error}</p>}
        {!isModalLoading && !error && (
            <div>
                {renderModalContent()}
                {activeModal === 'doctor' && !modalData && (
                    <div className="text-center">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="mb-4 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                        {imagePreview && <img src={imagePreview} alt="Preview" className="mx-auto max-h-60 rounded-lg mb-4" />}
                        <button onClick={handleAnalyzeImage} disabled={!imageFile} className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">Analyze Image</button>
                    </div>
                )}
            </div>
        )}
        {activeModal === 'assistant' && (
            <div className="flex flex-col h-[70vh]">
                <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-t-lg">
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-white border'}`}>
                                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                            </div>
                        </div>
                    ))}
                    {isChatLoading && (
                        <div className="flex justify-start">
                            <div className="p-3 rounded-2xl bg-white border">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0 p-4 border-t bg-white rounded-b-lg">
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={userMessage}
                            onChange={(e) => setUserMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={T.chatPlaceholder}
                            className="flex-grow border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button onClick={handleSendMessage} disabled={isChatLoading || !userMessage.trim()} className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:bg-green-300">
                            {T.send}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
};

export default App;