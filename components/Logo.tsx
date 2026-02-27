import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "h-10" }) => (
  <div className={`flex items-center ${className}`}>
    <span className="text-indigo-900 font-bold italic text-2xl tracking-tight font-sans">
      Education Associates
    </span>
  </div>
);

export default Logo;