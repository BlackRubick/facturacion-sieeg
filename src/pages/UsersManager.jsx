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
    <div className="max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl mb-4">Usuarios registrados</h2>
      <table className="w-full border mb-6">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Nombre</th>
            <th className="p-2">Correo</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id || user.email} className="border-b">
              <td className="p-2">{editId === user.id ? (
                <input type="text" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="border p-1" />
              ) : user.name}</td>
              <td className="p-2">{editId === user.id ? (
                <input type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} className="border p-1" />
              ) : user.email}</td>
              <td className="p-2">{editId === user.id ? (
                <select value={editData.type} onChange={e => setEditData({ ...editData, type: e.target.value })} className="border p-1">
                  <option value="admin">Administrador</option>
                  <option value="vendedor">Vendedor</option>
                </select>
              ) : user.type}</td>
              <td className="p-2">
                {editId === user.id ? (
                  <button onClick={handleUpdate} className="bg-green-500 text-white px-2 py-1 rounded mr-2">Guardar</button>
                ) : (
                  <button onClick={() => handleEdit(user)} className="bg-yellow-500 text-white px-2 py-1 rounded mr-2">Editar</button>
                )}
                <button onClick={() => handleDelete(user.id || user.email)} className="bg-red-500 text-white px-2 py-1 rounded">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersManager;
