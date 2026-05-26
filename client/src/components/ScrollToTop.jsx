import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Utility component that listens to route changes and automatically resets 
 * the scroll position of the main layout container (or window) to the top.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll the custom scroll container if it exists
    const scrollContainer = document.getElementById('main-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo(0, 0);
    }
    
    // Fallback for window scrolling
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
