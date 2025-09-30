import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const UsersManager = () => {
  const { getUsers, deleteUser, updateUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ name: '', email: '', type: 'vendedor' });

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getUsers();
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setUsers([]);
      }
    };
    fetchUsers();
  }, [getUsers]);

  const handleDelete = async (id) => {
    await deleteUser(id);
    const data = await getUsers();
    if (Array.isArray(data)) {
      setUsers(data);
    } else if (data && Array.isArray(data.users)) {
      setUsers(data.users);
    } else {
      setUsers([]);
    }
  };

  const handleEdit = (user) => {
    setEditId(user.id);
    setEditData({ name: user.name, email: user.email, type: user.type });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateUser(editId, editData);
    setEditId(null);
    setUsers(await getUsers());
  };

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-4 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">Usuarios registrados</h2>
        <table className="w-full border border-blue-100 rounded-xl overflow-hidden mb-6 text-sm">
          <thead>
            <tr className="bg-blue-50 text-blue-700">
              <th className="p-2 font-semibold">Nombre</th>
              <th className="p-2 font-semibold">Correo</th>
              <th className="p-2 font-semibold">Tipo</th>
              <th className="p-2 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-blue-50 hover:bg-blue-50">
                <td className="p-2">{user.name}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">{user.type}</td>
                <td className="p-2">
                  <button onClick={() => handleEdit(user)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs mr-2 hover:bg-blue-800">Editar</button>
                  <button onClick={() => handleDelete(user.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {editId && (
          <form onSubmit={handleUpdate} className="bg-blue-50 rounded p-4 mb-4">
            <h3 className="text-blue-700 font-semibold mb-2">Editar usuario</h3>
            <input
              type="text"
              value={editData.name}
              onChange={e => setEditData({ ...editData, name: e.target.value })}
              className="w-full mb-2 p-2 border border-blue-200 rounded text-sm"
              placeholder="Nombre"
              required
            />
            <input
              type="email"
              value={editData.email}
              onChange={e => setEditData({ ...editData, email: e.target.value })}
              className="w-full mb-2 p-2 border border-blue-200 rounded text-sm"
              placeholder="Correo"
              required
            />
            <select
              value={editData.type}
              onChange={e => setEditData({ ...editData, type: e.target.value })}
              className="w-full mb-2 p-2 border border-blue-200 rounded text-sm"
            >
              <option value="admin">Administrador</option>
              <option value="vendedor">Vendedor</option>
            </select>
            <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded font-semibold text-sm shadow hover:bg-blue-800 transition-colors w-full">Guardar</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UsersManager;
