import React from 'react';

const AnimatedFarmer: React.FC = () => {
  return (
    <div className="relative w-40 h-40 mx-auto -mb-4">
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
          }
          .farmer-animate {
            animation: float 3s ease-in-out infinite;
          }
        `}
      </style>
      <div className="farmer-animate">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="split-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="50%" stopColor="#A7F3D0" /> {/* Light green for Agri */}
                    <stop offset="50%" stopColor="#BAE6FD" /> {/* Light blue for Aqua */}
                </linearGradient>
            </defs>

            {/* Background */}
            <circle cx="100" cy="100" r="95" fill="url(#split-bg)" stroke="#E5E7EB" strokeWidth="2" />

            {/* Sun */}
            <circle cx="50" cy="60" r="15" fill="#FBBF24" opacity="0.8" />
            
            {/* Waves */}
            <path d="M 5,120 Q 55,105 100,120 T 195,120" stroke="#3B82F6" fill="none" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
            <path d="M 15,135 Q 65,120 110,135 T 205,135" stroke="#60A5FA" fill="none" strokeWidth="3" strokeLinecap="round" opacity="0.7" />

            {/* Farmer Group */}
            <g>
                {/* Body */}
                <rect x="80" y="100" width="40" height="50" rx="10" fill="#D9534F" />
                
                {/* Legs */}
                <rect x="85" y="150" width="10" height="20" fill="#4A5568" />
                <rect x="105" y="150" width="10" height="20" fill="#4A5568" />
                
                {/* Head */}
                <circle cx="100" cy="80" r="25" fill="#FDE3A7" />

                {/* Hat */}
                <path d="M70 70 Q100 50 130 70 L135 75 A 40 40 0 0 1 65 75 Z" fill="#A0522D" />
                <rect x="65" y="72" width="70" height="5" fill="#8B4513" />

                {/* Eyes */}
                <circle cx="92" cy="80" r="3" fill="#2D3748" />
                <circle cx="108" cy="80" r="3" fill="#2D3748" />
                
                {/* Smile */}
                <path d="M95 90 Q100 95 105 90" stroke="#2D3748" fill="none" strokeWidth="2" strokeLinecap="round" />

                {/* Left Arm (viewer's left) holding paddy crop */}
                <rect x="115" y="110" width="20" height="10" rx="5" fill="#D9534F" />
                <g transform="translate(135, 95) rotate(15)">
                    {/* Stalk 1 */}
                    <path d="M0,20 Q-2,10 0,0" stroke="#84CC16" fill="none" strokeWidth="2" />
                    <ellipse cx="-0.5" cy="5" rx="1" ry="2" fill="#FBBF24" transform="rotate(-20, -0.5, 5)"/>
                    <ellipse cx="0.5" cy="2" rx="1" ry="2" fill="#FBBF24" transform="rotate(20, 0.5, 2)"/>

                    {/* Stalk 2 */}
                    <path d="M3,20 Q3,10 3,0" stroke="#A3E635" fill="none" strokeWidth="2" />
                    <ellipse cx="2.5" cy="6" rx="1" ry="2" fill="#FBBF24" transform="rotate(-20, 2.5, 6)"/>
                    <ellipse cx="3.5" cy="3" rx="1" ry="2" fill="#FBBF24" transform="rotate(20, 3.5, 3)"/>
                    <ellipse cx="3" cy="0.5" rx="1" ry="2" fill="#FACC15" />

                    {/* Stalk 3 */}
                    <path d="M-3,20 Q-3,10 -3,0" stroke="#A3E635" fill="none" strokeWidth="2" />
                    <ellipse cx="-3.5" cy="4" rx="1" ry="2" fill="#FBBF24" transform="rotate(-20, -3.5, 4)"/>
                    <ellipse cx="-2.5" cy="1" rx="1" ry="2" fill="#FACC15" transform="rotate(20, -2.5, 1)"/>
                </g>
                
                {/* Right Arm (viewer's right) holding fish */}
                <rect x="65" y="110" width="20" height="10" rx="5" fill="#D9534F" />
                <g transform="translate(50, 118) rotate(-10)">
                  <path d="M5,2.5 C10,0 15,0 20,2.5 C22.5,3.75 22.5,6.25 20,7.5 C15,10 10,10 5,7.5 C2.5,6.25 2.5,3.75 5,2.5 Z" fill="#3B82F6" stroke="#2563EB" strokeWidth="0.5" />
                  <path d="M20,2.5 L25,0 L25,10 L20,7.5 Z" fill="#60A5FA" stroke="#2563EB" strokeWidth="0.5" />
                  <circle cx="7.5" cy="3.5" r="1" fill="white" />
                  <circle cx="7.5" cy="3.5" r="0.5" fill="black" />
                </g>
            </g>
        </svg>
      </div>
    </div>
  );
};

export default AnimatedFarmer;
