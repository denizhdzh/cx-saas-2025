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
        <label className="block text-xs font-medium text-stone-900 dark:text-stone-50 mb-1">
          {label}
        </label>
      )}
      {description && (
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">
          {description}
        </p>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-50 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">
              {selectedOption?.label || placeholder}
            </div>
            {selectedOption?.description && (
              <div className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                {selectedOption.description}
              </div>
            )}
          </div>
          <ChevronDownIcon
            className={`w-4 h-4 text-stone-500 flex-shrink-0 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
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
                      ? 'bg-stone-100 dark:bg-stone-800'
                      : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                  }`}
                >
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-50">
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-xs text-stone-500 dark:text-stone-400">
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
