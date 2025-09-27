import React from 'react';

const Input = React.forwardRef(({ label, ...props }, ref) => (
  <div className="mb-4">
    {label && <label className="block mb-1 text-sm font-medium text-gray-700">{label}</label>}
    <input
      ref={ref}
      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
      {...props}
    />
  </div>
));

export default Input;
