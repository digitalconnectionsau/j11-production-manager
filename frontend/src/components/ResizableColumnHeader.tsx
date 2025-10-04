import React, { useState, useRef, useCallback } from 'react';

interface ResizableColumnHeaderProps {
  children: React.ReactNode;
  width?: number;
  onResize?: (width: number) => void;
  className?: string;
  minWidth?: number;
  maxWidth?: number;
}

const ResizableColumnHeader: React.FC<ResizableColumnHeaderProps> = ({
  children,
  width,
  onResize,
  className = '',
  minWidth = 40,
  maxWidth = 500,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width || 150);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = currentWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX.current;
      const newWidth = Math.min(
        Math.max(startWidth.current + diff, minWidth),
        maxWidth
      );
      setCurrentWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      onResize?.(currentWidth);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [currentWidth, minWidth, maxWidth, onResize]);

  // Update internal width when prop changes
  React.useEffect(() => {
    if (width !== undefined) {
      setCurrentWidth(width);
    }
  }, [width]);

  return (
    <th
      className={`relative select-none ${className}`}
      style={{ width: `${currentWidth}px`, minWidth: `${minWidth}px` }}
    >
      <div className="flex items-center justify-between h-full">
        <div className="flex-1 truncate pr-2">
          {children}
        </div>
        <div
          className={`absolute top-0 right-0 w-2 h-full cursor-col-resize flex items-center justify-center group ${
            isResizing ? 'bg-blue-200' : 'hover:bg-gray-200'
          }`}
          onMouseDown={handleMouseDown}
        >
          <div className={`w-0.5 h-4 bg-gray-300 group-hover:bg-gray-400 ${
            isResizing ? 'bg-blue-500' : ''
          }`} />
        </div>
      </div>
    </th>
  );
};

export default ResizableColumnHeader;