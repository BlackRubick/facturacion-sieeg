import React, { useState, useMemo, useRef, useEffect } from 'react';

const SearchableSelect = ({ 
  label, 
  options = [], 
  value, 
  onChange, 
  placeholder = '', 
  isLoading = false,
  error = false,
  helperText = '',
  maxDisplayOptions = 50,
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Encontrar la opción seleccionada
  const selectedOption = useMemo(() => {
    return options.find(opt => opt.value === value);
  }, [options, value]);

  // Actualizar el valor mostrado cuando cambia la selección
  useEffect(() => {
    if (selectedOption) {
      setDisplayValue(selectedOption.label);
      setSearchTerm('');
    } else {
      setDisplayValue('');
    }
  }, [selectedOption]);

  // Filtrar y limitar opciones
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) {
      return options.slice(0, maxDisplayOptions);
    }
    
    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered.slice(0, maxDisplayOptions);
  }, [options, searchTerm, maxDisplayOptions]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        if (selectedOption) {
          setDisplayValue(selectedOption.label);
          setSearchTerm('');
        } else {
          setDisplayValue('');
          setSearchTerm('');
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, selectedOption]);

  const handleInputChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setDisplayValue(newSearchTerm);
    
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleOptionSelect = (option) => {
    onChange(option.value);
    setDisplayValue(option.label);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (selectedOption) {
      setSearchTerm('');
      setDisplayValue('');
      // Focus al input para permitir escribir inmediatamente
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      if (selectedOption) {
        setDisplayValue(selectedOption.label);
        setSearchTerm('');
      }
    }
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative" ref={containerRef}>
        <input
          ref={inputRef}
          type="text"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${isLoading ? 'bg-gray-100' : 'bg-white'}`}
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={isOpen ? 'Escribe para buscar...' : placeholder}
          disabled={isLoading}
          {...props}
        />
        
        {/* Dropdown arrow */}
        <div 
          className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
        >
          <svg 
            className={`h-5 w-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Dropdown */}
        {isOpen && !isLoading && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              <>
                {/* Mostrar contador de resultados si hay búsqueda */}
                {searchTerm && (
                  <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                    {filteredOptions.length === maxDisplayOptions && options.length > maxDisplayOptions
                      ? `Mostrando ${maxDisplayOptions} de ${options.filter(opt => 
                          opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          opt.value.toLowerCase().includes(searchTerm.toLowerCase())
                        ).length} resultados`
                      : `${filteredOptions.length} resultado${filteredOptions.length !== 1 ? 's' : ''}`
                    }
                  </div>
                )}
                
                {filteredOptions.map((option, index) => (
                  <div
                    key={`${option.value}-${index}`}
                    className="px-3 py-2 cursor-pointer hover:bg-blue-50 hover:text-blue-700 text-sm"
                    onClick={() => handleOptionSelect(option)}
                  >
                    {option.label}
                  </div>
                ))}
                
                {/* Mensaje si hay más resultados */}
                {!searchTerm && options.length > maxDisplayOptions && (
                  <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-t">
                    Escribe para buscar entre {options.length} opciones disponibles
                  </div>
                )}
              </>
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                {searchTerm ? 'No se encontraron resultados' : 'No hay opciones disponibles'}
              </div>
            )}
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>
      
      {/* Helper text / Error message */}
      {helperText && (
        <p className={`mt-1 text-sm ${error ? 'text-red-500' : 'text-gray-500'}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default SearchableSelect;
