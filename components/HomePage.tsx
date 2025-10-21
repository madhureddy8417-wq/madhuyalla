import React from 'react';
import AnimatedFarmer from './AnimatedFarmer';

interface HomePageProps {
  onEnter: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-green-50/50 flex flex-col items-center justify-center text-center p-4 font-sans">
      <AnimatedFarmer />
      <h1 className="text-4xl sm:text-5xl font-bold text-green-800 mt-4">
        Welcome to AGRIGUIDE
      </h1>
      <p className="text-lg text-gray-600 mt-2">
        Your AI-powered partner in modern farming.
      </p>
      <blockquote className="text-md md:text-lg text-green-700 italic mt-4 mb-8 max-w-md md:max-w-lg">
        "MODERN AGRICULTURE IS WHERE INNOVATION MEETS THE SOIL"
      </blockquote>
      <button
        onClick={onEnter}
        className="px-8 py-3 bg-green-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-green-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
      >
        Enter Location Portal
      </button>
    </div>
  );
};

export default HomePage;