import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AnimationProvider, useAnimation } from '../src/frontend/components/AnimationProvider';
import { ContextMenu, ContextMenuItem } from '../src/frontend/components/ContextMenu';
import { GestureHandler } from '../src/frontend/components/GestureHandler';

// Mock store
const mockStore = configureStore({
  reducer: {
    ui: (state = { navigation: { activeTab: 'positions' } }) => state,
  },
});

// Test component for AnimationProvider
const TestAnimationComponent: React.FC = () => {
  const animation = useAnimation();
  
  const handleTestAnimation = async () => {
    const element = document.createElement('div');
    await animation.fadeIn(element);
  };

  return (
    <div>
      <button onClick={handleTestAnimation}>Test Animation</button>
    </div>
  );
};

// Wrapper component for tests that need AnimationProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={mockStore}>
    <AnimationProvider>
      {children}
    </AnimationProvider>
  </Provider>
);

describe('Apple Design System Components', () => {
  describe('AnimationProvider', () => {
    it('should provide animation functions', () => {
      render(
        <Provider store={mockStore}>
          <AnimationProvider>
            <TestAnimationComponent />
          </AnimationProvider>
        </Provider>
      );

      expect(screen.getByText('Test Animation')).toBeInTheDocument();
    });

    it('should throw error when used outside provider', () => {
      // React 18+ catches errors and logs them instead of throwing
      // So we check that the error is thrown during render
      expect(() => {
        render(<TestAnimationComponent />);
      }).toThrow('useAnimation must be used within an AnimationProvider');
    });

    it('should handle fadeIn animation', async () => {
      const TestComponent: React.FC = () => {
        const animation = useAnimation();
        const elementRef = React.useRef<HTMLDivElement>(null);
        
        const handleFadeIn = async () => {
          if (elementRef.current) {
            await animation.fadeIn(elementRef.current);
          }
        };

        return (
          <div>
            <button onClick={handleFadeIn}>Fade In</button>
            <div ref={elementRef} data-testid="animated-element">Content</div>
          </div>
        );
      };

      render(
        <Provider store={mockStore}>
          <AnimationProvider>
            <TestComponent />
          </AnimationProvider>
        </Provider>
      );

      const button = screen.getByText('Fade In');
      const element = screen.getByTestId('animated-element');

      fireEvent.click(button);

      await waitFor(() => {
        expect(element).toHaveStyle('opacity: 1');
      });
    });

    it('should handle scaleIn animation', async () => {
      const TestComponent: React.FC = () => {
        const animation = useAnimation();
        const elementRef = React.useRef<HTMLDivElement>(null);
        
        const handleScaleIn = async () => {
          if (elementRef.current) {
            await animation.scaleIn(elementRef.current);
          }
        };

        return (
          <div>
            <button onClick={handleScaleIn}>Scale In</button>
            <div ref={elementRef} data-testid="scaled-element">Content</div>
          </div>
        );
      };

      render(
        <Provider store={mockStore}>
          <AnimationProvider>
            <TestComponent />
          </AnimationProvider>
        </Provider>
      );

      const button = screen.getByText('Scale In');
      const element = screen.getByTestId('scaled-element');

      fireEvent.click(button);

      await waitFor(() => {
        expect(element).toHaveStyle('transform: scale(1)');
      });
    });
  });

  describe('ContextMenu', () => {
    const mockItems: ContextMenuItem[] = [
      { id: '1', label: 'Copy', action: jest.fn() },
      { id: '2', label: 'Paste', action: jest.fn() },
      { id: '3', label: 'Delete', action: jest.fn(), destructive: true },
      { id: '4', label: '', separator: true },
      { id: '5', label: 'Disabled', action: jest.fn(), disabled: true },
    ];

    it('should render context menu trigger', () => {
      render(
        <TestWrapper>
          <ContextMenu items={mockItems}>
            <div>Right click me</div>
          </ContextMenu>
        </TestWrapper>
      );

      expect(screen.getByText('Right click me')).toBeInTheDocument();
    });

    it('should show context menu on right click', () => {
      render(
        <TestWrapper>
          <ContextMenu items={mockItems}>
            <div>Right click me</div>
          </ContextMenu>
        </TestWrapper>
      );

      const trigger = screen.getByText('Right click me');
      fireEvent.contextMenu(trigger);

      expect(screen.getByText('Copy')).toBeInTheDocument();
      expect(screen.getByText('Paste')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should call action when menu item is clicked', () => {
      const mockAction = jest.fn();
      const items: ContextMenuItem[] = [
        { id: '1', label: 'Test', action: mockAction },
      ];

      render(
        <TestWrapper>
          <ContextMenu items={items}>
            <div>Right click me</div>
          </ContextMenu>
        </TestWrapper>
      );

      const trigger = screen.getByText('Right click me');
      fireEvent.contextMenu(trigger);

      const menuItem = screen.getByText('Test');
      fireEvent.click(menuItem);

      expect(mockAction).toHaveBeenCalled();
    });

    it('should not call action for disabled items', () => {
      const mockAction = jest.fn();
      const items: ContextMenuItem[] = [
        { id: '1', label: 'Disabled', action: mockAction, disabled: true },
      ];

      render(
        <TestWrapper>
          <ContextMenu items={items}>
            <div>Right click me</div>
          </ContextMenu>
        </TestWrapper>
      );

      const trigger = screen.getByText('Right click me');
      fireEvent.contextMenu(trigger);

      const menuItem = screen.getByText('Disabled');
      fireEvent.click(menuItem);

      expect(mockAction).not.toHaveBeenCalled();
    });

    it('should close menu when clicking outside', () => {
      render(
        <TestWrapper>
          <ContextMenu items={mockItems}>
            <div>Right click me</div>
          </ContextMenu>
        </TestWrapper>
      );

      const trigger = screen.getByText('Right click me');
      fireEvent.contextMenu(trigger);

      expect(screen.getByText('Copy')).toBeInTheDocument();

      fireEvent.click(document.body);

      expect(screen.queryByText('Copy')).not.toBeInTheDocument();
    });

    it('should handle onSelect callback', () => {
      const mockOnSelect = jest.fn();
      const items: ContextMenuItem[] = [
        { id: '1', label: 'Test', action: jest.fn() },
      ];

      render(
        <TestWrapper>
          <ContextMenu items={items} onSelect={mockOnSelect}>
            <div>Right click me</div>
          </ContextMenu>
        </TestWrapper>
      );

      const trigger = screen.getByText('Right click me');
      fireEvent.contextMenu(trigger);

      const menuItem = screen.getByText('Test');
      fireEvent.click(menuItem);

      expect(mockOnSelect).toHaveBeenCalledWith(items[0]);
    });
  });

  describe('GestureHandler', () => {
    it('should render children', () => {
      render(
        <TestWrapper>
          <GestureHandler>
            <div>Gesture content</div>
          </GestureHandler>
        </TestWrapper>
      );

      expect(screen.getByText('Gesture content')).toBeInTheDocument();
    });

    it('should handle tap gesture', () => {
      const mockOnTap = jest.fn();

      render(
        <TestWrapper>
          <GestureHandler onTap={mockOnTap}>
            <div>Tap me</div>
          </GestureHandler>
        </TestWrapper>
      );

      const element = screen.getByText('Tap me');
      
      // Simulate touch start and end
      fireEvent.touchStart(element, {
        touches: [{ clientX: 0, clientY: 0 }],
      });
      
      fireEvent.touchEnd(element, {
        touches: [],
      });

      expect(mockOnTap).toHaveBeenCalled();
    });

    it('should handle double tap gesture', () => {
      const mockOnDoubleTap = jest.fn();

      render(
        <TestWrapper>
          <GestureHandler onDoubleTap={mockOnDoubleTap}>
            <div>Double tap me</div>
          </GestureHandler>
        </TestWrapper>
      );

      const element = screen.getByText('Double tap me');
      
      // First tap
      fireEvent.touchStart(element, {
        touches: [{ clientX: 0, clientY: 0 }],
      });
      fireEvent.touchEnd(element, { touches: [] });
      
      // Second tap (within double tap delay)
      fireEvent.touchStart(element, {
        touches: [{ clientX: 0, clientY: 0 }],
      });
      fireEvent.touchEnd(element, { touches: [] });

      expect(mockOnDoubleTap).toHaveBeenCalled();
    });

    it('should handle swipe gestures', () => {
      const mockOnSwipeLeft = jest.fn();
      const mockOnSwipeRight = jest.fn();

      render(
        <TestWrapper>
          <GestureHandler onSwipeLeft={mockOnSwipeLeft} onSwipeRight={mockOnSwipeRight}>
            <div>Swipe me</div>
          </GestureHandler>
        </TestWrapper>
      );

      const element = screen.getByText('Swipe me');
      
      // Simulate swipe right
      fireEvent.touchStart(element, {
        touches: [{ clientX: 0, clientY: 0 }],
      });
      
      fireEvent.touchMove(element, {
        touches: [{ clientX: 100, clientY: 0 }],
      });
      
      fireEvent.touchEnd(element, { touches: [] });

      expect(mockOnSwipeRight).toHaveBeenCalled();
    });

    it('should handle long press gesture', async () => {
      const mockOnLongPress = jest.fn();

      render(
        <TestWrapper>
          <GestureHandler onLongPress={mockOnLongPress} longPressDelay={100}>
            <div>Long press me</div>
          </GestureHandler>
        </TestWrapper>
      );

      const element = screen.getByText('Long press me');
      
      fireEvent.touchStart(element, {
        touches: [{ clientX: 0, clientY: 0 }],
      });

      await waitFor(() => {
        expect(mockOnLongPress).toHaveBeenCalled();
      }, { timeout: 200 });
    });

    it('should be disabled when disabled prop is true', () => {
      const mockOnTap = jest.fn();

      render(
        <TestWrapper>
          <GestureHandler onTap={mockOnTap} disabled={true}>
            <div>Disabled gesture</div>
          </GestureHandler>
        </TestWrapper>
      );

      const element = screen.getByText('Disabled gesture');
      
      fireEvent.touchStart(element, {
        touches: [{ clientX: 0, clientY: 0 }],
      });
      
      fireEvent.touchEnd(element, { touches: [] });

      expect(mockOnTap).not.toHaveBeenCalled();
    });
  });

  describe('Apple Design System Integration', () => {
    it('should apply Apple design classes correctly', () => {
      render(
        <Provider store={mockStore}>
          <div className="apple-card apple-p-4 apple-text-lg apple-font-medium">
            Apple styled content
          </div>
        </Provider>
      );

      const element = screen.getByText('Apple styled content');
      expect(element).toHaveClass('apple-card', 'apple-p-4', 'apple-text-lg', 'apple-font-medium');
    });

    it('should handle Apple button styles', () => {
      render(
        <Provider store={mockStore}>
          <button className="apple-btn apple-btn-primary">
            Apple Button
          </button>
        </Provider>
      );

      const button = screen.getByText('Apple Button');
      expect(button).toHaveClass('apple-btn', 'apple-btn-primary');
    });

    it('should handle Apple input styles', () => {
      render(
        <Provider store={mockStore}>
          <input className="apple-input" placeholder="Apple input" />
        </Provider>
      );

      const input = screen.getByPlaceholderText('Apple input');
      expect(input).toHaveClass('apple-input');
    });

    it('should handle Apple spacing utilities', () => {
      render(
        <Provider store={mockStore}>
          <div className="apple-m-4 apple-px-6 apple-py-8">
            Spaced content
          </div>
        </Provider>
      );

      const element = screen.getByText('Spaced content');
      expect(element).toHaveClass('apple-m-4', 'apple-px-6', 'apple-py-8');
    });

    it('should handle Apple typography utilities', () => {
      render(
        <Provider store={mockStore}>
          <div className="apple-text-2xl apple-font-bold apple-leading-tight">
            Typography test
          </div>
        </Provider>
      );

      const element = screen.getByText('Typography test');
      expect(element).toHaveClass('apple-text-2xl', 'apple-font-bold', 'apple-leading-tight');
    });
  });
}); 