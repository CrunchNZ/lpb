import React, { createContext, useContext, ReactNode, useCallback } from 'react';

interface AnimationContextType {
  animate: (element: HTMLElement, animation: string, duration?: number) => Promise<void>;
  fadeIn: (element: HTMLElement) => Promise<void>;
  fadeOut: (element: HTMLElement) => Promise<void>;
  slideUp: (element: HTMLElement) => Promise<void>;
  slideDown: (element: HTMLElement) => Promise<void>;
  scaleIn: (element: HTMLElement) => Promise<void>;
  scaleOut: (element: HTMLElement) => Promise<void>;
  bounce: (element: HTMLElement) => Promise<void>;
  shake: (element: HTMLElement) => Promise<void>;
  pulse: (element: HTMLElement) => Promise<void>;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

interface AnimationProviderProps {
  children: ReactNode;
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({ children }) => {
  const animate = useCallback((element: HTMLElement, animation: string, duration = 300): Promise<void> => {
    return new Promise((resolve) => {
      element.style.animation = `${animation} ${duration}ms ease-in-out`;
      const handleAnimationEnd = () => {
        element.removeEventListener('animationend', handleAnimationEnd);
        element.style.animation = '';
        resolve();
      };
      element.addEventListener('animationend', handleAnimationEnd);
    });
  }, []);

  const fadeIn = useCallback((element: HTMLElement): Promise<void> => {
    element.style.opacity = '0';element.style.display = 'block';
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        element.style.transition = 'opacity 300ms ease-in-out';
        element.style.opacity = '1';
        setTimeout(() => {
          element.style.transition = '';
          resolve();
        }, 300);
      });
    });
  }, []);

  const fadeOut = useCallback((element: HTMLElement): Promise<void> => {
    element.style.transition = 'opacity 300ms ease-in-out';
    element.style.opacity = '0';
    return new Promise((resolve) => {
      setTimeout(() => {
        element.style.display = 'none';
        element.style.transition = '';
        resolve();
      }, 300);
    });
  }, []);

  const slideUp = useCallback((element: HTMLElement): Promise<void> => {
    element.style.transform = 'translateY(20px)';
    element.style.opacity = '0';element.style.display = 'block';
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        element.style.transition = 'all 300ms ease-in-out';
        element.style.transform = 'translateY(0)';
        element.style.opacity = '1';
        setTimeout(() => {
          element.style.transition = '';
          resolve();
        }, 300);
      });
    });
  }, []);

  const slideDown = useCallback((element: HTMLElement): Promise<void> => {
    element.style.transition = 'all 300ms ease-in-out';
    element.style.transform = 'translateY(20px)';
    element.style.opacity = '0';
    return new Promise((resolve) => {
      setTimeout(() => {
        element.style.display = 'none';
        element.style.transition = '';
        resolve();
      }, 300);
    });
  }, []);

  const scaleIn = useCallback((element: HTMLElement): Promise<void> => {
    element.style.transform = 'scale(0.9)';
    element.style.opacity = '0';element.style.display = 'block';
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        element.style.transition = 'all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        element.style.transform = 'scale(1)';
        element.style.opacity = '1';
        setTimeout(() => {
          element.style.transition = '';
          resolve();
        }, 300);
      });
    });
  }, []);

  const scaleOut = useCallback((element: HTMLElement): Promise<void> => {
    element.style.transition = 'all 300ms ease-in-out';
    element.style.transform = 'scale(0.9)';
    element.style.opacity = '0';
    return new Promise((resolve) => {
      setTimeout(() => {
        element.style.display = 'none';
        element.style.transition = '';
        resolve();
      }, 300);
    });
  }, []);

  const bounce = useCallback((element: HTMLElement): Promise<void> => {
    return animate(element, 'apple-bounce', 600);
  }, [animate]);

  const shake = useCallback((element: HTMLElement): Promise<void> => {
    return animate(element, 'apple-shake', 500);
  }, [animate]);

  const pulse = useCallback((element: HTMLElement): Promise<void> => {
    return animate(element, 'apple-pulse', 1000);
  }, [animate]);

  const value: AnimationContextType = {
    animate,
    fadeIn,
    fadeOut,
    slideUp,
    slideDown,
    scaleIn,
    scaleOut,
    bounce,
    shake,
    pulse,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = (): AnimationContextType => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};

// Animation keyframes for additional animations
const additionalStyles = `
  @keyframes apple-bounce {
    0%, 20%, 53%, 80%, 100% {
      transform: translate3d(0, 0, 0);
    }
    40%, 43% {
      transform: translate3d(0, -8px, 0);
    }
    70% {
      transform: translate3d(0, -4px, 0);
    }
    90% {
      transform: translate3d(0, -2px, 0);
    }
  }

  @keyframes apple-shake {
    0%, 100% {
      transform: translateX(0);
    }
    10%, 30%, 50%, 70%, 90% {
      transform: translateX(-4px);
    }
    20%, 40%, 60%, 80% {
      transform: translateX(4px);
    }
  }

  @keyframes apple-pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes apple-rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes apple-slide-in-left {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes apple-slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes apple-zoom-in {
    from {
      transform: scale(0.3);
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes apple-zoom-out {
    from {
      transform: scale(1);
      opacity: 1;
    }
    to {
      transform: scale(0.3);
      opacity: 0;
    }
  }

  @keyframes apple-flip-in-x {
    from {
      transform: perspective(400px) rotate3d(1, 0, 0, 90deg);
      opacity: 0;
    }
    40% {
      transform: perspective(400px) rotate3d(1, 0, 0, -20deg);
    }
    60% {
      transform: perspective(400px) rotate3d(1, 0, 0, 10deg);
    }
    80% {
      transform: perspective(400px) rotate3d(1, 0, 0, -5deg);
    }
    to {
      transform: perspective(400px);
      opacity: 1;
    }
  }

  @keyframes apple-flip-out-x {
    from {
      transform: perspective(400px);
      opacity: 1;
    }
    to {
      transform: perspective(400px) rotate3d(1, 0, 0, -90deg);
      opacity: 0;
    }
  }

  @keyframes apple-light-speed-in {
    from {
      transform: translate3d(-100%, 0, 0) skewX(30deg);
      opacity: 0;
    }
    60% {
      transform: skewX(-20deg);
      opacity: 1;
    }
    80% {
      transform: skewX(5deg);
    }
    to {
      transform: translate3d(0, 0, 0);
      opacity: 1;
    }
  }

  @keyframes apple-light-speed-out {
    from {
      opacity: 1;
    }
    to {
      transform: translate3d(100%, 0, 0) skewX(-30deg);
      opacity: 0;
    }
  }
`;

// Inject additional styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = additionalStyles;
  document.head.appendChild(style);
}

export default AnimationProvider; 