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
    UvIndexIcon
} from './icons';

interface WeatherDisplayProps {
  data: WeatherReport | null;
  isLoading: boolean;
  error: string | null;
  language: Language;
}

const WeatherIcon: React.FC<{ condition: string; size?: string }> = ({ condition, size = 'h-10 w-10' }) => {
  const normalizedCondition = condition.toLowerCase();
  if (normalizedCondition.includes('sun') || normalizedCondition.includes('clear')) {
    return <SunnyIcon />;
  }
  if (normalizedCondition.includes('cloud')) {
    return <PartlyCloudyIcon />;
  }
  if (normalizedCondition.includes('rain') || normalizedCondition.includes('shower') || normalizedCondition.includes('storm')) {
    return <RainyIcon />;
  }
  return <CloudyIcon />;
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
    <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-md border border-gray-200 animate-pulse">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div>
                    <div className="h-8 w-20 bg-gray-300 rounded-md mb-1"></div>
                    <div className="h-4 w-28 bg-gray-300 rounded-md"></div>
                </div>
            </div>
            <div className="h-6 w-32 bg-gray-300 rounded-md sm:hidden"></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                <div className="h-10 w-20 bg-gray-300 rounded-md"></div>
                <div className="h-10 w-20 bg-gray-300 rounded-md"></div>
                <div className="h-10 w-20 bg-gray-300 rounded-md"></div>
                <div className="h-10 w-20 bg-gray-300 rounded-md"></div>
            </div>
        </div>
        <div className="border-t my-4 border-gray-200"></div>
        <div className="flex justify-between gap-4">
            <div className="flex-1 h-24 bg-gray-300 rounded-lg"></div>
            <div className="flex-1 h-24 bg-gray-300 rounded-lg"></div>
            <div className="flex-1 h-24 bg-gray-300 rounded-lg"></div>
        </div>
    </div>
);


const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ data, isLoading, error, language }) => {
  const T = UI_STRINGS[language];

  if (isLoading) {
    return (
        <div className="mb-8">
            <h2 className="text-xl font-bold text-green-800 mb-3">{T.fetchingWeather}</h2>
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

  const { current, forecast } = data;

  return (
    <div className="mb-8">
        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-md border border-gray-200">
            {/* Current Weather */}
            <h2 className="text-xl font-bold text-green-800 mb-3">{T.currentWeather}</h2>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <WeatherIcon condition={current.condition} />
                    <div>
                        <p className="text-4xl font-bold text-gray-800">{current.temperature}</p>
                        <p className="text-gray-600">{current.condition}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-2">
                   <WeatherInfoItem icon={<HumidityIcon />} label={T.humidity} value={current.humidity} />
                   <WeatherInfoItem icon={<RainChanceIcon />} label={T.rain} value={current.precipitationProbability} />
                   <WeatherInfoItem icon={<WindSpeedIcon />} label={T.wind} value={current.windSpeed} />
                   <WeatherInfoItem icon={<UvIndexIcon />} label={T.uvIndex} value={current.uvIndex} />
                </div>
            </div>

            {/* Forecast */}
            <div className="border-t my-4 border-gray-200"></div>
            <h2 className="text-xl font-bold text-green-800 mb-3">{T.forecast}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {forecast.map((day, index) => (
                    <div key={index} className="bg-green-50/50 p-3 rounded-lg flex items-center justify-between sm:flex-col sm:items-center sm:text-center">
                        <div className="flex items-center sm:flex-col gap-2">
                             <WeatherIcon condition={day.condition} />
                             <div>
                                <p className="font-bold text-gray-800">{day.day}</p>
                                <p className="text-sm text-gray-600 hidden sm:block">{day.condition}</p>
                            </div>
                        </div>
                        <p className="font-semibold text-gray-700">
                            {day.maxTemp} / <span className="text-gray-500">{day.minTemp}</span>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default WeatherDisplay;