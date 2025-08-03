import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({ children, open, onOpenChange }) => {
  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { open, onOpenChange } as any);
        }
        return child;
      })}
    </div>
  );
};

export const DialogTrigger: React.FC<DialogTriggerProps> = ({ children, asChild = false }) => {
  return <>{children}</>;
};

export const DialogContent: React.FC<DialogContentProps & { open?: boolean; onOpenChange?: (open: boolean) => void }> = ({ 
  children, 
  className, 
  open, 
  onOpenChange 
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Use controlled state if open prop is provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" />
          <div
            ref={contentRef}
            className={cn(
              'relative bg-background rounded-lg shadow-lg p-6 w-full max-w-md mx-4',
              className
            )}
          >
            {children}
          </div>
        </div>
      )}
    </>
  );
};

export const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}>
      {children}
    </div>
  );
};

export const DialogTitle: React.FC<DialogTitleProps> = ({ children, className }) => {
  return (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
      {children}
    </h2>
  );
}; 