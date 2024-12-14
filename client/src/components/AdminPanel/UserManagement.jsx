// client/src/components/AdminPanel/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { Trash2, Ban } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL } from '../../config';

const getDeviceInfo = async () => {
  const info = {
    browser: navigator.userAgent,
    os: navigator.platform,
    language: navigator.language,
    vendor: navigator.vendor,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    colorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  try {
    const networkInterfaces = await navigator.mediaDevices?.enumerateDevices();
    info.networkDevices = networkInterfaces?.map(device => device.deviceId);
  } catch (e) {
    console.log('Network interfaces not available');
    info.networkDevices = [];
  }

  return info;
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete user');

      setUsers(users.filter(user => user._id !== userId));
    } catch (error) {
      setError(error.message);
    }
  };

  const handleBlockUser = async (email) => {
    const reason = prompt('Enter reason for blocking this user:');
    if (!reason) return;

    try {
      const deviceInfo = await getDeviceInfo();
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/block-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, reason, deviceInfo })
      });

      if (!response.ok) throw new Error('Failed to block user');

      alert('User blocked successfully');
      // Remove the blocked user from the list
      setUsers(users.filter(user => user.email !== email));
    } catch (error) {
setError(error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Username</th>
                <th className="py-2 text-left">Email</th>
                <th className="py-2 text-left">Created At</th>
                <th className="py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} className="border-b">
                  <td className="py-2">{user.username}</td>
                  <td className="py-2">{user.email}</td>
                  <td className="py-2">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBlockUser(user.email)}
                        className="p-1 hover:bg-red-100 rounded-full"
                        title="Block User"
                      >
                        <Ban className="w-5 h-5 text-red-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="p-1 hover:bg-red-100 rounded-full"
                        title="Delete User"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
