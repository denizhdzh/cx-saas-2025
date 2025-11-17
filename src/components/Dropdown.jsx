import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  label,
  description
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-neutral-900 dark:text-neutral-50 mb-1">
          {label}
        </label>
      )}
      {description && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
          {description}
        </p>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-50 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">
              {selectedOption?.label || placeholder}
            </div>
            {selectedOption?.description && (
              <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                {selectedOption.description}
              </div>
            )}
          </div>
          <ChevronDownIcon
            className={`w-4 h-4 text-neutral-500 flex-shrink-0 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            <div className="p-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex flex-col gap-1 px-3 py-2 text-left rounded-md transition-colors ${
                    value === option.value
                      ? 'bg-neutral-100 dark:bg-neutral-800'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {option.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
