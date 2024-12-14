// client/src/components/AdminPanel/BlockedUsers.jsx
import React, { useState, useEffect } from 'react';
import { Unlock, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL } from '../../config';

const BlockedUsers = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/blocked-users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch blocked users');
      
      const data = await response.json();
      setBlockedUsers(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (id) => {
    if (!window.confirm('Are you sure you want to unblock this user?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/blocked-users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to unblock user');
      setBlockedUsers(blockedUsers.filter(user => user._id !== id));
    } catch (error) {
      setError(error.message);
    }
  };

  const toggleExpand = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blocked Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {blockedUsers.map(user => (
            <div key={user._id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{user.email}</h3>
                  <p className="text-sm text-gray-500">Blocked: {new Date(user.blockedAt).toLocaleDateString()}</p>
                  <p className="text-sm text-red-500">Reason: {user.reason}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleExpand(user._id)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    {expandedUser === user._id ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  <button
                    onClick={() => handleUnblock(user._id)}
                    className="p-2 hover:bg-green-100 rounded-full"
                  >
                    <Unlock className="w-5 h-5 text-green-500" />
                  </button>
                </div>
              </div>

              {expandedUser === user._id && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg text-sm">
                  <h4 className="font-bold mb-2">Device Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><strong>Browser:</strong> {user.deviceInfo?.browser}</p>
                      <p><strong>OS:</strong> {user.deviceInfo?.os}</p>
                      <p><strong>Screen:</strong> {user.deviceInfo?.screenResolution}</p>
                      <p><strong>Color Depth:</strong> {user.deviceInfo?.colorDepth}</p>
                    </div>
                    <div>
                      <p><strong>Language:</strong> {user.deviceInfo?.language}</p>
                      <p><strong>Timezone:</strong> {user.deviceInfo?.timezone}</p>
                      <p><strong>IP Address:</strong> {user.ipAddress}</p>
                      <p><strong>Hardware ID:</strong> {user.deviceInfo?.hardwareId}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-bold mb-2">Hardware Identifiers</h4>
                    <div className="bg-gray-100 p-2 rounded overflow-x-auto">
                      <pre className="text-xs">{JSON.stringify(user.deviceInfo?.hardwareInfo, null, 2)}</pre>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-bold mb-2">Network Information</h4>
                    <div className="bg-gray-100 p-2 rounded">
                      <p><strong>User Agent:</strong> {user.userAgent}</p>
                      <p><strong>IP Address:</strong> {user.ipAddress}</p>
                      {user.deviceInfo?.networkDevices && (
                        <div>
                          <strong>Network Devices:</strong>
                          <ul className="list-disc pl-4">
                            {user.deviceInfo.networkDevices.map((device, index) => (
                              <li key={index}>{device}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BlockedUsers;
