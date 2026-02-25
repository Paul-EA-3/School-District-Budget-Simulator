import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "h-10" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="w-8 h-8 bg-indigo-900 rounded-lg flex items-center justify-center flex-shrink-0">
      <span className="text-white font-bold text-xl">E</span>
    </div>
    <span className="text-indigo-900 font-bold text-xl tracking-tight whitespace-nowrap">
      Education <span className="text-orange-500">Associates</span>
    </span>
  </div>
);

export default Logo;
