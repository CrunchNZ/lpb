import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { useAnimation } from './AnimationProvider';

interface ContextMenuProps {
  children: ReactNode;
  items: ContextMenuItem[];
  onSelect?: (item: ContextMenuItem) => void;
  className?: string;
  disabled?: boolean;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  action?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  items,
  onSelect,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const { scaleIn } = useAnimation();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;

    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX;
    const y = e.clientY;

    // Ensure menu stays within viewport
    const menuWidth = 200; // Approximate menu width
    const menuHeight = items.length * 44; // Approximate menu height

    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > window.innerWidth) {
      adjustedX = x - menuWidth;
    }

    if (y + menuHeight > window.innerHeight) {
      adjustedY = y - menuHeight;
    }

    setPosition({ x: adjustedX, y: adjustedY });
    setIsOpen(true);
  };

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;

    if (item.action) {
      item.action();
    }

    if (onSelect) {
      onSelect(item);
    }

    setIsOpen(false);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('contextmenu', handleClickOutside);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      scaleIn(menuRef.current);
    }
  }, [isOpen, scaleIn]);

  // Removed unused handleClose to satisfy linter

  return (
    <div className={`apple-context-menu ${className}`}>
      <div
        ref={triggerRef}
        onContextMenu={handleContextMenu}
        className="apple-context-menu-trigger"
      >
        {children}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className="apple-context-menu-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
          }}
        >
          <div
            className="apple-context-menu"
            style={{
              position: 'fixed',
              left: position.x,
              top: position.y,
              zIndex: 1001,
            }}
          >
            {items.map((item) => (
              <React.Fragment key={item.id}>
                {item.separator ? (
                  <div className="apple-context-menu-separator" />
                ) : (
                  <button
                    className={`apple-context-menu-item ${
                      item.disabled ? 'apple-context-menu-item-disabled' : ''
                    } ${
                      item.destructive ? 'apple-context-menu-item-destructive' : ''
                    }`}
                    onClick={() => handleItemClick(item)}
                    disabled={item.disabled}
                  >
                    {item.icon && (
                      <span className="apple-context-menu-item-icon">
                        {item.icon}
                      </span>
                    )}
                    <span className="apple-context-menu-item-label">
                      {item.label}
                    </span>
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ContextMenu styles
const contextMenuStyles = `
  .apple-context-menu {
    position: relative;
    display: inline-block;
  }

  .apple-context-menu-trigger {
    cursor: pointer;
  }

  .apple-context-menu-overlay {
    background: transparent;
  }

  .apple-context-menu {
    background: rgba(28, 28, 30, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 12px;
    padding: 8px 0;
    min-width: 200px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transform-origin: top left;
  }

  .apple-context-menu-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 12px 16px;
    background: none;
    border: none;
    color: white;
    font-size: 15px;
    font-weight: 400;
    cursor: pointer;
    transition: all 150ms ease-in-out;
    text-align: left;
  }

  .apple-context-menu-item:hover:not(.apple-context-menu-item-disabled) {
    background: rgba(255, 255, 255, 0.1);
  }

  .apple-context-menu-item:active:not(.apple-context-menu-item-disabled) {
    background: rgba(255, 255, 255, 0.15);
  }

  .apple-context-menu-item-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .apple-context-menu-item-destructive {
    color: #FF453A;
  }

  .apple-context-menu-item-destructive:hover {
    background: rgba(255, 69, 58, 0.1);
  }

  .apple-context-menu-item-icon {
    margin-right: 12px;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .apple-context-menu-item-label {
    flex: 1;
  }

  .apple-context-menu-separator {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 4px 0;
  }

  /* Light mode support */
  @media (prefers-color-scheme: light) {
    .apple-context-menu {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .apple-context-menu-item {
      color: #1C1C1E;
    }

    .apple-context-menu-item:hover:not(.apple-context-menu-item-disabled) {
      background: rgba(0, 0, 0, 0.05);
    }

    .apple-context-menu-item:active:not(.apple-context-menu-item-disabled) {
      background: rgba(0, 0, 0, 0.1);
    }

    .apple-context-menu-item-destructive {
      color: #FF3B30;
    }

    .apple-context-menu-item-destructive:hover {
      background: rgba(255, 59, 48, 0.1);
    }

    .apple-context-menu-separator {
      background: rgba(0, 0, 0, 0.1);
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = contextMenuStyles;
  document.head.appendChild(style);
}

export default ContextMenu;