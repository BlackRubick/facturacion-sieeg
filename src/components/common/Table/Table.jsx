import React from 'react';

const Table = ({ columns, data }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full bg-white border rounded">
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.accessor} className="px-4 py-2 border-b bg-gray-50 text-left text-sm font-semibold text-gray-700">
              {col.Header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="hover:bg-gray-100">
            {columns.map(col => (
              <td key={col.accessor} className="px-4 py-2 border-b text-sm text-gray-600">
                {row[col.accessor]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Table;
