import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "h-10" }) => (
  <svg viewBox="0 0 310 55" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Edunomics Lab Logo">
    <g transform="translate(0, 5)">
        {/* Icon Geometry */}
        {/* Grey L-Shape (Vertical Spine + Bottom Leg) */}
        <path d="M10 0 H 18 V 35 H 40 V 43 H 10 V 0 Z" fill="#58595b" />

        {/* Green E-Parts (Top Leg + Middle Leg) */}
        <rect x="18" y="0" width="22" height="8" fill="#78BE20" />
        <rect x="18" y="17" width="18" height="8" fill="#78BE20" />

        {/* Green Left Nub */}
        <rect x="0" y="17" width="10" height="8" fill="#78BE20" />

        {/* Text */}
        <text x="50" y="30" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="28" fill="#78BE20">EDUNOMICS</text>
        <text x="225" y="30" fontFamily="Arial, sans-serif" fontWeight="300" fontSize="28" fill="#78BE20">LAB</text>
        <text x="50" y="46" fontFamily="Arial, sans-serif" fontSize="9.5" fill="#58595b" letterSpacing="0.3">The Study of Education Finance</text>
    </g>
  </svg>
);

export default Logo;
