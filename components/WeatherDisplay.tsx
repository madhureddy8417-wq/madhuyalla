import React from 'react';
import type { WeatherReport, Language } from '../types';
import { UI_STRINGS } from '../constants';
import { 
    SunnyIcon, 
    CloudyIcon, 
    RainyIcon, 
    PartlyCloudyIcon, 
    HumidityIcon, 
    RainChanceIcon, 
    WindSpeedIcon,
    UvIndexIcon,
    AdvisoryIcon,
    SunriseIcon,
    SunsetIcon,
    WindDirectionIcon,
    FeelsLikeIcon
} from './icons';

interface WeatherDisplayProps {
  data: WeatherReport | null;
  isLoading: boolean;
  error: string | null;
  language: Language;
}

const WeatherIcon: React.FC<{ condition: string; className?: string }> = ({ condition, className = 'h-10 w-10' }) => {
  const normalizedCondition = condition.toLowerCase();
  const iconProps = { className };

  if (normalizedCondition.includes('sun') || normalizedCondition.includes('clear')) {
    return <SunnyIcon {...iconProps} />;
  }
  if (normalizedCondition.includes('cloud')) {
    return <PartlyCloudyIcon {...iconProps} />;
  }
  if (normalizedCondition.includes('rain') || normalizedCondition.includes('shower') || normalizedCondition.includes('storm')) {
    return <RainyIcon {...iconProps} />;
  }
  return <CloudyIcon {...iconProps} />;
};

const WeatherInfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center space-x-2">
    {icon}
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-700">{value}</p>
    </div>
  </div>
);

const WeatherSkeleton: React.FC = () => (
    <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-md border border-gray-200 animate-pulse space-y-4">
        {/* Current Weather Skeleton */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                <div>
                    <div className="h-8 w-24 bg-gray-300 rounded-md mb-2"></div>
                    <div className="h-4 w-32 bg-gray-300 rounded-md"></div>
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                {[...Array(8)].map((_, i) => <div key={i} className="h-10 w-24 bg-gray-300 rounded-md"></div>)}
            </div>
        </div>

        {/* Advisory Skeleton */}
        <div className="bg-gray-200 p-4 rounded-lg">
            <div className="h-5 w-40 bg-gray-300 rounded-md mb-3"></div>
            <div className="space-y-2">
                <div className="h-4 w-full bg-gray-300 rounded-md"></div>
                <div className="h-4 w-5/6 bg-gray-300 rounded-md"></div>
            </div>
        </div>
        
        {/* Hourly Skeleton */}
        <div>
            <div className="h-5 w-32 bg-gray-300 rounded-md mb-3"></div>
            <div className="flex space-x-4 overflow-hidden">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-20 h-28 bg-gray-200 rounded-lg"></div>
                ))}
            </div>
        </div>

        {/* Daily Skeleton */}
        <div>
            <div className="h-5 w-32 bg-gray-300 rounded-md mb-3"></div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                ))}
            </div>
        </div>
    </div>
);


const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ data, isLoading, error, language }) => {
  const T = UI_STRINGS[language];

  if (isLoading) {
    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-green-800 mb-3">{T.fetchingWeather}</h2>
            <WeatherSkeleton />
        </div>
    );
  }

  if (error) {
    return (
        <div className="mb-8 p-4 bg-red-100 text-red-700 rounded-lg text-center">
            {error}
        </div>
    );
  }

  if (!data) {
    return null;
  }

  const { current, hourly, forecast, agriculturalAdvisory } = data;

  return (
    <div className="mb-8">
        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-md border border-gray-200 space-y-6">
            {/* Current Weather */}
            <div>
                <h2 className="text-xl font-bold text-green-800 mb-3">{T.currentWeather}</h2>
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <WeatherIcon condition={current.condition} className="w-16 h-16" />
                        <div>
                            <p className="text-4xl font-bold text-gray-800">{current.temperature}</p>
                            <p className="text-gray-600 font-medium">{current.condition}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
                       <WeatherInfoItem icon={<FeelsLikeIcon />} label={T.feelsLike} value={current.feelsLike} />
                       <WeatherInfoItem icon={<HumidityIcon />} label={T.humidity} value={current.humidity} />
                       <WeatherInfoItem icon={<RainChanceIcon />} label={T.rain} value={current.precipitationProbability} />
                       <WeatherInfoItem icon={<WindSpeedIcon />} label={T.wind} value={current.windSpeed} />
                       <WeatherInfoItem icon={<WindDirectionIcon />} label={T.windDirection} value={current.windDirection} />
                       <WeatherInfoItem icon={<UvIndexIcon />} label={T.uvIndex} value={current.uvIndex} />
                       <WeatherInfoItem icon={<SunriseIcon />} label={T.sunrise} value={current.sunrise} />
                       <WeatherInfoItem icon={<SunsetIcon />} label={T.sunset} value={current.sunset} />
                    </div>
                </div>
            </div>

            {/* Agricultural Advisory */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h2 className="text-xl font-bold text-yellow-800 mb-2 flex items-center gap-2">
                    <AdvisoryIcon />
                    {T.agriculturalAdvisory}
                </h2>
                <ul className="list-disc list-inside ml-2 space-y-1 text-yellow-900">
                    {agriculturalAdvisory.map((tip, index) => <li key={index}>{tip}</li>)}
                </ul>
            </div>
            
            {/* Hourly Forecast */}
            <div>
                <h2 className="text-xl font-bold text-green-800 mb-3">{T.hourlyForecast}</h2>
                <div className="flex space-x-3 overflow-x-auto pb-3 -mb-3">
                    {hourly.map((hour, index) => (
                        <div key={index} className="flex-shrink-0 bg-green-50/60 p-3 rounded-lg flex flex-col items-center text-center w-24">
                            <p className="font-bold text-sm text-gray-800">{hour.time}</p>
                            <WeatherIcon condition={hour.condition} className="w-8 h-8 my-1" />
                            <p className="font-semibold text-gray-700">{hour.temperature}</p>
                            <div className="flex items-center text-xs text-blue-600 mt-1">
                                <HumidityIcon className="w-3 h-3 mr-1" />
                                <span>{hour.precipitationProbability}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Daily Forecast */}
            <div>
                <h2 className="text-xl font-bold text-green-800 mb-3">{T.forecast}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    {forecast.map((day, index) => (
                        <div key={index} className="bg-green-50/60 p-3 rounded-lg flex flex-col items-center text-center space-y-1">
                            <p className="font-bold text-gray-800">{day.day}</p>
                            <WeatherIcon condition={day.condition} className="w-9 h-9" />
                            <p className="text-sm text-gray-600">{day.condition}</p>
                            <p className="font-semibold text-gray-700 text-sm">
                                {day.maxTemp} / <span className="text-gray-500">{day.minTemp}</span>
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default WeatherDisplay;