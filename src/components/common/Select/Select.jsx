import React, { forwardRef } from 'react';

const Select = forwardRef(({ label, options = [], value, onChange, placeholder = '', isLoading = false, ...props }, ref) => {
  // Log para depuración de value y options
  console.log('[Select.jsx] value:', value, 'options:', options);
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select
        ref={ref}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={isLoading}
        {...props}
      >
        <option value="" disabled>{placeholder || 'Selecciona una opción'}</option>
        {options.map((opt, idx) => (
          <option key={opt.value + '-' + idx} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
});
//error?
export default Select;
