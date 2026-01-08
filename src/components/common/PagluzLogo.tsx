// src/components/common/PagluzLogo.tsx

import React, { useState } from 'react';
// Logo oficial em SVG
import logoPagluz from '../../assets/new-logo.svg';

interface PagluzLogoProps {
  className?: string;
}

const PagluzLogo: React.FC<PagluzLogoProps> = ({ className }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`${className || ''} flex items-center justify-center`}
        style={{ minWidth: 120 }}
      >
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded bg-white/20" />
          <span className="text-white font-semibold">Pagluz</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={logoPagluz}
      alt="Pagluz Operações de Energia"
      className={`${className || ''} block`}
      onError={() => setFailed(true)}
    />
  );
};

export default PagluzLogo;