import React, { useState, useRef, useEffect } from 'react';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <DropdownMenuTrigger onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </DropdownMenuTrigger>
      {isOpen && <DropdownMenuContent>{children}</DropdownMenuContent>}
    </div>
  );
};

export const DropdownMenuTrigger: React.FC<React.HTMLProps<HTMLButtonElement>> = ({ children, ...props }) => (
  <button className="p-1 rounded-full hover:bg-gray-200" {...props}>
    {children}
  </button>
);

export const DropdownMenuContent: React.FC<React.HTMLProps<HTMLDivElement>> = ({ children, ...props }) => (
  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5" {...props}>
    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
      {children}
    </div>
  </div>
);

export const DropdownMenuItem: React.FC<React.HTMLProps<HTMLDivElement>> = ({ children, ...props }) => (
  <div
    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
    role="menuitem"
    {...props}
  >
    {children}
  </div>
);