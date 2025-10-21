import React from 'react';
import AnimatedFarmer from './AnimatedFarmer';

interface HomePageProps {
  onEnter: (mode: 'agri' | 'aqua') => void;
}

const HomePage: React.FC<HomePageProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex flex-col items-center justify-center text-center p-4 font-sans">
      <AnimatedFarmer />
      <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mt-4">
        Welcome to your AI Assistant
      </h1>
      <p className="text-lg text-gray-600 mt-2 max-w-2xl">
        Your unified partner in modern farming and aquaculture. Get tailored insights, analysis, and guidance for your specific needs.
      </p>
      <blockquote className="text-md md:text-lg text-green-700 italic mt-4 mb-8 max-w-md md:max-w-lg">
        "INNOVATION MEETS THE SOIL AND THE SEA"
      </blockquote>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => onEnter('agri')}
          className="px-8 py-3 bg-green-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-green-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
        >
          Enter AGRI Portal
        </button>
        <button
          onClick={() => onEnter('aqua')}
          className="px-8 py-3 bg-blue-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          Enter AQUA Portal
        </button>
      </div>
    </div>
  );
};

export default HomePage;