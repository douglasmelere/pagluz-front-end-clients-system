import { useState, useEffect } from 'react';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallScreen: boolean;
  isMediumScreen: boolean;
  isLargeScreen: boolean;
  screenWidth: number;
  screenHeight: number;
}

export function useResponsive(): ResponsiveState {
  const [responsiveState, setResponsiveState] = useState<ResponsiveState>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const height = typeof window !== 'undefined' ? window.innerHeight : 768;
    
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      isSmallScreen: width < 640,
      isMediumScreen: width >= 640 && width < 1024,
      isLargeScreen: width >= 1024,
      screenWidth: width,
      screenHeight: height,
    };
  });

  useEffect(() => {
    const updateResponsiveness = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      const newState = {
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isSmallScreen: width < 640,
        isMediumScreen: width >= 640 && width < 1024,
        isLargeScreen: width >= 1024,
        screenWidth: width,
        screenHeight: height,
      };

      setResponsiveState(newState);
    };

    // Set initial state
    updateResponsiveness();

    // Add event listener
    window.addEventListener('resize', updateResponsiveness);

    // Cleanup
    return () => window.removeEventListener('resize', updateResponsiveness);
  }, []);

  return responsiveState;
}

// Hook específico para orientação do dispositivo
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
}

// Hook para detectar se o dispositivo suporta touch
export function useTouchSupport() {
  const [isTouchSupported, setIsTouchSupported] = useState(false);

  useEffect(() => {
    setIsTouchSupported('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouchSupported;
}
