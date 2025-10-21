import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import Header from './components/Header';
import Modal from './components/Modal';
import WeatherDisplay from './components/WeatherDisplay';
import InteractiveMap from './components/InteractiveMap';
import WaterReportDisplay from './components/WaterReportDisplay';
import { DoctorIcon, MarketIcon, SchemeIcon, SoilIcon, AIAssistantIcon, FarmingMaterialsIcon, FertilizerShopsIcon, GovLinksIcon, TransportIcon, SatelliteIcon, ColdStorageIcon, MarketYardIcon, WaterIcon, DroneIcon } from './components/icons';
import { UI_STRINGS } from './constants';
import { getSuitableCropInfo, analyzeCropImage, getMarketInsights, getGovernmentSchemes, getFarmingMaterialsInfo, getNearbyFertilizerShops, getGovLinksAndSubsidies, getNearbyTransportation, getVillageMapInfo, getNearbyColdStorages, getNearbyMarketYards, getNearbyWaterResources, getWeatherForecast, getDroneDeliveryServices } from './services/geminiService';
import type { Language, Location, SuitableCropInfo, DiseaseAnalysis, MarketInfo, GovernmentScheme, ModalType, FarmingMaterial, ChatMessage, GroundingSource, WeatherReport, CropMarketData, VillageMapData, WaterResourceReport } from './types';
import HomePage from './components/HomePage';
import { CropYieldChart, CropPriceChart, MarketPriceChart } from './components/charts';

const FeatureCard = ({ icon, title, onClick }: { icon: React.ReactNode, title: string, onClick: () => void }) => (
  <button onClick={onClick} className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200 transition-all hover:shadow-xl hover:border-green-300 hover:-translate-y-1 text-center flex flex-col items-center justify-center space-y-3">
    <div className="bg-green-100 p-4 rounded-full">
      {icon}
    </div>
    <h3 className="text-sm sm:text-base font-bold text-green-800">{title}</h3>
  </button>
);


const App: React.FC = () => {
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

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setLocation(null);
    setError(null);
    setActiveModal(null);
    setModalData(null);
    setChat(null);
    setChatHistory([]);
    setWeatherData(null);
    setWeatherError(null);
  };

  const handleLocationSet = async (loc: Location) => {
    setLocation(loc);
    setActiveModal(null);
    setModalData(null);
    setError(null);
    
    // Fetch weather data
    setWeatherData(null);
    setWeatherError(null);
    setIsWeatherLoading(true);
    try {
        const data = await getWeatherForecast(loc, language);
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

    const groundedTypes: ModalType[] = ['shops', 'transport', 'coldstorage', 'marketyard', 'drone'];

    try {
      let data;
      if (groundedTypes.includes(type)) {
          const fetchGroundedData = async (coords: {latitude: number, longitude: number} | null) => {
              let promise;
              switch(type) {
                case 'shops': promise = getNearbyFertilizerShops(location, language, coords); break;
                case 'transport': promise = getNearbyTransportation(location, language, coords); break;
                case 'coldstorage': promise = getNearbyColdStorages(location, language, coords); break;
                case 'marketyard': promise = getNearbyMarketYards(location, language, coords); break;
                case 'drone': promise = getDroneDeliveryServices(location, language, coords); break;
              }

              try {
                const result = await promise;
                setModalData(result);
              } catch(e: any) {
                setError(e.message || "An unknown error occurred.");
              } finally {
                setIsModalLoading(false);
              }
          };

          navigator.geolocation.getCurrentPosition(
            (position) => fetchGroundedData(position.coords),
            (error) => {
              console.warn("Could not get geolocation, falling back to location name.", error.message);
              fetchGroundedData(null);
            },
            { timeout: 10000 }
          );
          return;
      }

      switch (type) {
        case 'doctor':
          setImageFile(null);
          setImagePreview(null);
          setIsModalLoading(false);
          return;
        case 'assistant':
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `You are a helpful AI assistant for farmers in Andhra Pradesh, India. Your name is AGRIGUIDE. Provide concise, practical advice. Your answers should be in the ${language} language.`
                }
            });
            setChat(newChat);
            setChatHistory([]);
            setUserMessage('');
            setIsModalLoading(false);
            return;
        case 'soil':
          data = await getSuitableCropInfo(location, language);
          break;
        case 'market':
          data = await getMarketInsights(location, language);
          break;
        case 'schemes':
          data = await getGovernmentSchemes(location, language);
          break;
        case 'materials':
          data = await getFarmingMaterialsInfo(location, language);
          break;
        case 'links':
            data = await getGovLinksAndSubsidies(location, language);
            break;
        case 'map':
            data = await getVillageMapInfo(location, language);
            break;
        case 'water':
            data = await getNearbyWaterResources(location, language);
            break;
        default:
            setIsModalLoading(false);
            return;
      }
      setModalData(data);
    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
    } finally {
        if (!groundedTypes.includes(type)) {
            setIsModalLoading(false);
        }
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
        const data = await analyzeCropImage(location, base64String, imageFile.type, language);
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

  // Simple markdown renderer
  const renderMarkdown = (text: string) => {
    // FIX: Added a check to ensure text is not null or undefined, preventing potential runtime errors.
    // This resolves a cascade of confusing compiler errors caused by passing a potentially unsafe function to JSX.
    if (!text) {
      return '';
    }
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/(\r\n|\n|\r)/gm, '<br>');
  };

  if (showHomePage) {
    return <HomePage onEnter={() => setShowHomePage(false)} />;
  }

  return (
    <div className="min-h-screen bg-green-50/50 font-sans">
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        onLocationSet={handleLocationSet}
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
            <FeatureCard icon={<SoilIcon />} title={T.soilAndCrops} onClick={() => handleFeatureClick('soil')} />
            <FeatureCard icon={<DoctorIcon />} title={T.cropDoctor} onClick={() => handleFeatureClick('doctor')} />
            <FeatureCard icon={<MarketIcon />} title={T.marketInsights} onClick={() => handleFeatureClick('market')} />
            <FeatureCard icon={<SchemeIcon />} title={T.govtSchemes} onClick={() => handleFeatureClick('schemes')} />
            <FeatureCard icon={<AIAssistantIcon />} title={T.aiAssistant} onClick={() => handleFeatureClick('assistant')} />
            <FeatureCard icon={<FarmingMaterialsIcon />} title={T.farmingMaterials} onClick={() => handleFeatureClick('materials')} />
            <FeatureCard icon={<FertilizerShopsIcon />} title={T.fertilizerShops} onClick={() => handleFeatureClick('shops')} />
            <FeatureCard icon={<GovLinksIcon />} title={T.govLinks} onClick={() => handleFeatureClick('links')} />
            <FeatureCard icon={<TransportIcon />} title={T.nearbyTransport} onClick={() => handleFeatureClick('transport')} />
            <FeatureCard icon={<SatelliteIcon />} title={T.villageMap} onClick={() => handleFeatureClick('map')} />
            <FeatureCard icon={<ColdStorageIcon />} title={T.coldStorages} onClick={() => handleFeatureClick('coldstorage')} />
            <FeatureCard icon={<MarketYardIcon />} title={T.marketYards} onClick={() => handleFeatureClick('marketyard')} />
            <FeatureCard icon={<WaterIcon />} title={T.nearbyWaterResources} onClick={() => handleFeatureClick('water')} />
            <FeatureCard icon={<DroneIcon />} title={T.droneDelivery} onClick={() => handleFeatureClick('drone')} />
          </div>
        )}
      </main>

      <Modal 
        isOpen={!!activeModal} 
        onClose={closeModal} 
        title={activeModal ? T.modalTitles[activeModal] : ''}
        modalData={modalData}
        activeModal={activeModal}
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
        {modalData && !isModalLoading && (
            <div>
              {activeModal === 'soil' && (
                <div>
                  {(modalData as SuitableCropInfo[]).map(crop => (
                    <div key={crop.cropName} className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-bold text-green-700">{crop.cropName}</h4>
                      <p><strong className="font-semibold">Suitability:</strong> {crop.suitability}</p>
                      <p><strong className="font-semibold">Sowing Season:</strong> {crop.sowingSeason}</p>
                      <p><strong className="font-semibold">Water Requirement:</strong> {crop.waterRequirement}</p>
                      <p><strong className="font-semibold">Potential Yield:</strong> {crop.potentialYield}</p>
                      <p><strong className="font-semibold">Avg. Price:</strong> {crop.avgMarketPrice}</p>
                    </div>
                  ))}
                  <div className="mt-6 border-t pt-4">
                      <CropYieldChart data={modalData as SuitableCropInfo[]} />
                      <CropPriceChart data={modalData as SuitableCropInfo[]} />
                  </div>
                </div>
              )}
              {activeModal === 'doctor' && (
                <div>
                  <h4 className="font-bold text-green-700">{modalData.diseaseName}</h4>
                  <p><strong className="font-semibold">Confidence:</strong> {modalData.confidence}</p>
                  <p><strong className="font-semibold">Description:</strong> {modalData.description}</p>
                  <p className="font-semibold mt-2">Preventive Measures:</p>
                  <ul className="list-disc list-inside ml-4">
                    {modalData.preventiveMeasures?.map((m: string) => <li key={m}>{m}</li>)}
                  </ul>
                  <p className="font-semibold mt-2">Treatment:</p>
                  <ul className="list-disc list-inside ml-4">
                    {modalData.treatment?.map((t: string) => <li key={t}>{t}</li>)}
                  </ul>
                </div>
              )}
              {activeModal === 'market' && (modalData as MarketInfo[]).map(market => (
                <div key={market.marketName} className="mb-6 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-bold text-green-700">{market.marketName} ({market.distance})</h4>
                  <MarketPriceChart data={market.availableCrops} />
                  <div className="divide-y divide-gray-200 mt-4">
                    {market.availableCrops?.map((c: CropMarketData) => 
                      <div key={c.cropName} className="py-2">
                        <p className="font-semibold">{c.cropName}</p>
                        <p className="text-sm">Price: {c.pricePerKg} (Demand: {c.demand}, Trend: {c.priceTrend})</p>
                        <p className="text-sm"><strong className="font-semibold">{T.availability}:</strong> {c.sellerSlotAvailability}</p>
                        <p className="text-sm"><strong className="font-semibold">{T.bookingInfo}:</strong> {c.bookingNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {activeModal === 'schemes' && (modalData as GovernmentScheme[]).map(scheme => (
                <div key={scheme.name} className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-bold text-green-700">{scheme.name}</h4>
                  <p><strong className="font-semibold">Description:</strong> {scheme.description}</p>
                  <p><strong className="font-semibold">Eligibility:</strong> {scheme.eligibility}</p>
                  <p><strong className="font-semibold">Deadline:</strong> {scheme.applicationDeadline}</p>
                  <a href={scheme.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">More Info</a>
                </div>
              ))}
              {activeModal === 'materials' && (modalData as FarmingMaterial[]).map(material => (
                <div key={material.name} className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-bold text-green-700">{material.name}</h4>
                  <p><strong className="font-semibold">Description:</strong> {material.description}</p>
                  <p><strong className="font-semibold">Usage:</strong> {material.usage}</p>
                  <p><strong className="font-semibold">Est. Price:</strong> {material.estimatedPrice}</p>
                  <p><strong className="font-semibold">Sourcing:</strong> {material.localSourcing}</p>
                  <p><strong className="font-semibold">{T.availability}:</strong> {material.availability}</p>
                  <p><strong className="font-semibold">{T.bookingInfo}:</strong> {material.bookingInfo}</p>
                </div>
              ))}
              {activeModal === 'map' && <InteractiveMap data={modalData as VillageMapData} />}
              {activeModal === 'water' && <WaterReportDisplay data={modalData as WaterResourceReport} />}
              {['shops', 'links', 'transport', 'coldstorage', 'marketyard', 'drone'].includes(activeModal!) && (
                <div>
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(modalData.text) }} />
                    {(modalData as GenerateContentResponse).candidates?.[0]?.groundingMetadata?.groundingChunks?.length > 0 && (
                        <div className="mt-4">
                            <h5 className="font-bold text-green-700">{T.sources}:</h5>
                            <ul className="list-disc list-inside ml-4 text-sm">
                                {modalData.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any, index: number) => (
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
                </div>
              )}
            </div>
        )}
        {activeModal === 'doctor' && !modalData && !isModalLoading && (
          <div className="text-center">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="mb-4 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
            {imagePreview && <img src={imagePreview} alt="Crop preview" className="mx-auto max-h-60 rounded-lg mb-4" />}
            <button onClick={handleAnalyzeImage} disabled={!imageFile} className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">Analyze Image</button>
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