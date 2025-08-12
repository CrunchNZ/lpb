import React, { useRef, useEffect, ReactNode, useState } from 'react';
import { useAnimation } from './AnimationProvider';

interface GestureHandlerProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinchIn?: (scale: number) => void;
  onPinchOut?: (scale: number) => void;
  className?: string;
  disabled?: boolean;
  swipeThreshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
}

// TouchPoint interface intentionally omitted as not used

interface GestureState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  isTracking: boolean;
  touchCount: number;
  initialDistance?: number;
  initialScale?: number;
}

export const GestureHandler: React.FC<GestureHandlerProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onDoubleTap,
  onLongPress,
  onPinchIn,
  onPinchOut,
  className = '',
  disabled = false,
  swipeThreshold = 50,
  longPressDelay = 500,
  doubleTapDelay = 300,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gestureState = useRef<GestureState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    isTracking: false,
    touchCount: 0,
  });
  const lastTapTime = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const { bounce, shake } = useAnimation();
  const [isPressed, setIsPressed] = useState(false);

  const getDistance = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  const getAngle = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  };

  const getScale = (initialDistance: number, currentDistance: number): number => {
    return currentDistance / initialDistance;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;

    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    gestureState.current = {
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      startTime: Date.now(),
      isTracking: true,
      touchCount: e.touches.length,
    };

    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = getDistance(
        touch1.clientX,
        touch1.clientY,
        touch2.clientX,
        touch2.clientY
      );
      gestureState.current.initialDistance = distance;
      gestureState.current.initialScale = 1;
    }

    setIsPressed(true);

    // Start long press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        if (gestureState.current.isTracking) {
          onLongPress();
          if (containerRef.current) {
            shake(containerRef.current);
          }
        }
      }, longPressDelay);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !gestureState.current.isTracking) return;

    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    gestureState.current.currentX = x;
    gestureState.current.currentY = y;

    // Handle pinch gestures
    if (e.touches.length === 2 && gestureState.current.initialDistance) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = getDistance(
        touch1.clientX,
        touch1.clientY,
        touch2.clientX,
        touch2.clientY
      );
      const scale = getScale(gestureState.current.initialDistance, currentDistance);

      if (scale < 0.8 && onPinchIn) {
        onPinchIn(scale);
      } else if (scale > 1.2 && onPinchOut) {
        onPinchOut(scale);
      }
    }

    // Cancel long press if moved too much
    if (longPressTimer.current) {
      const distance = getDistance(
        gestureState.current.startX,
        gestureState.current.startY,
        x,
        y
      );
      if (distance > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handleTouchEnd = (_e: React.TouchEvent) => {
    if (disabled || !gestureState.current.isTracking) return;

    const endTime = Date.now();
    const duration = endTime - gestureState.current.startTime;
    const distance = getDistance(
      gestureState.current.startX,
      gestureState.current.startY,
      gestureState.current.currentX,
      gestureState.current.currentY
    );

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    setIsPressed(false);

    // Handle tap gestures
    if (distance < 10 && duration < 300) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;

      if (timeSinceLastTap < doubleTapDelay && onDoubleTap) {
        onDoubleTap();
        if (containerRef.current) {
          bounce(containerRef.current);
        }
      } else if (onTap) {
        onTap();
      }

      lastTapTime.current = now;
    }

    // Handle swipe gestures
    if (distance > swipeThreshold && duration < 1000) {
      const angle = getAngle(
        gestureState.current.startX,
        gestureState.current.startY,
        gestureState.current.currentX,
        gestureState.current.currentY
      );

      if (angle > -45 && angle < 45 && onSwipeRight) {
        onSwipeRight();
      } else if (angle > 135 || angle < -135 && onSwipeLeft) {
        onSwipeLeft();
      } else if (angle > 45 && angle < 135 && onSwipeDown) {
        onSwipeDown();
      } else if (angle > -135 && angle < -45 && onSwipeUp) {
        onSwipeUp();
      }
    }

    // Reset gesture state
    gestureState.current.isTracking = false;
  };

  const handleTouchCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    gestureState.current.isTracking = false;
    setIsPressed(false);
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`apple-gesture-handler ${className} ${isPressed ? 'apple-gesture-pressed' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={{
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      {children}
    </div>
  );
};

// GestureHandler styles
const gestureHandlerStyles = `
  .apple-gesture-handler {
    position: relative;
    overflow: hidden;
  }

  .apple-gesture-pressed {
    transform: scale(0.98);
    transition: transform 100ms ease-out;
  }

  .apple-gesture-handler:active {
    transform: scale(0.95);
  }

  .apple-gesture-handler * {
    pointer-events: none;
  }

  .apple-gesture-handler *:not(.apple-gesture-handler) {
    pointer-events: auto;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = gestureHandlerStyles;
  document.head.appendChild(style);
}

export default GestureHandler; 