import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  value = [0],
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  disabled = false
}) => {
  const [localValue, setLocalValue] = useState(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    handleMouseMove(e.nativeEvent);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newValue = Math.round((min + percentage * (max - min)) / step) * step;
    
    const newValues = [Math.max(min, Math.min(max, newValue))];
    setLocalValue(newValues);
    onValueChange?.(newValues);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const percentage = ((localValue[0] - min) / (max - min)) * 100;

  return (
    <div className={cn('relative w-full', className)}>
      <div
        ref={sliderRef}
        className={cn(
          'relative h-2 w-full rounded-full bg-secondary cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onMouseDown={handleMouseDown}
      >
        <div
          className="absolute h-full bg-primary rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute top-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-sm transform -translate-y-1/2 transition-all hover:scale-110"
          style={{ left: `${percentage}%`, marginLeft: '-8px' }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{min}</span>
        <span>{localValue[0]}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}; 