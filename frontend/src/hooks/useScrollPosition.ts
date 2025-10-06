import { useEffect, useRef } from 'react';

interface UseScrollPositionOptions {
  key?: string;
  behavior?: 'auto' | 'smooth';
  offsetTop?: number; // Offset from top (e.g., for fixed header)
}

export const useScrollPosition = (options: UseScrollPositionOptions = {}) => {
  const {
    key = 'default',
    behavior = 'auto',
    offsetTop = 80 // Default offset for top navigation bar
  } = options;
  
  const scrollPositionRef = useRef<number>(0);

  // Save current scroll position
  const saveScrollPosition = () => {
    scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
    sessionStorage.setItem(`scrollPosition_${key}`, scrollPositionRef.current.toString());
  };

  // Restore scroll position
  const restoreScrollPosition = () => {
    const savedPosition = sessionStorage.getItem(`scrollPosition_${key}`);
    if (savedPosition) {
      const position = parseInt(savedPosition, 10);
      // Ensure we don't scroll above the offset (navigation bar)
      const adjustedPosition = Math.max(position, offsetTop);
      window.scrollTo({
        top: adjustedPosition,
        behavior
      });
    } else {
      // If no saved position, scroll to just below the top bar
      window.scrollTo({
        top: offsetTop,
        behavior
      });
    }
  };

  // Clear saved position
  const clearScrollPosition = () => {
    sessionStorage.removeItem(`scrollPosition_${key}`);
  };

  // Auto-save scroll position on scroll
  useEffect(() => {
    const handleScroll = () => {
      saveScrollPosition();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [key]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition
  };
};

// Hook specifically for maintaining scroll position during data fetches
export const useScrollRestoration = (
  isLoading: boolean,
  key?: string,
  offsetTop?: number
) => {
  const { saveScrollPosition, restoreScrollPosition } = useScrollPosition({ 
    key, 
    offsetTop 
  });
  
  const wasLoadingRef = useRef(false);

  useEffect(() => {
    // Save position when loading starts
    if (isLoading && !wasLoadingRef.current) {
      saveScrollPosition();
    }
    
    // Restore position when loading ends
    if (!isLoading && wasLoadingRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        restoreScrollPosition();
      }, 50);
    }
    
    wasLoadingRef.current = isLoading;
  }, [isLoading, saveScrollPosition, restoreScrollPosition]);
};