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
          @keyframes screen-glow-opacity {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1.0; }
          }
          .tablet-screen-animate {
            animation: screen-glow-opacity 2.5s ease-in-out infinite;
          }
        `}
      </style>
      <div className="farmer-animate">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <g>
                {/* Ground */}
                <ellipse cx="100" cy="170" rx="60" ry="10" fill="#A3C1AD" />

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

                {/* Arm holding tablet */}
                <rect x="65" y="115" width="20" height="10" rx="5" fill="#D9534F" />

                {/* Tablet */}
                <g transform="rotate(15, 60, 130)">
                    <rect x="40" y="120" width="35" height="45" rx="5" fill="#4A5568" />
                    <rect x="42.5" y="122.5" width="30" height="40" fill="#36D399" className="tablet-screen-animate" />
                    <polyline points="45,155 50,145 55,150 60,140 65,148" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </g>
        </svg>
      </div>
    </div>
  );
};

export default AnimatedFarmer;