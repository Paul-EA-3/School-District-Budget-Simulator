import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "h-10" }) => (
  <img
    src="https://educationassociates.com/wp-content/uploads/2022/10/EA-Full-Logo.svg"
    alt="Education Associates Logo"
    className={className}
    style={{ objectFit: 'contain' }}
  />
);

export default Logo;
