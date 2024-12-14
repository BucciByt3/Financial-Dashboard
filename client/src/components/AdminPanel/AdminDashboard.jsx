// client/src/components/AdminPanel/AdminDashboard.jsx
import React, { useState } from 'react';
import UserManagement from './UserManagement';
import BlockedUsers from './BlockedUsers';
import LogsView from './LogsView';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded ${
                activeTab === 'users' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('blocked')}
              className={`px-4 py-2 rounded ${
                activeTab === 'blocked' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Blocked Users
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded ${
                activeTab === 'logs' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              System Logs
            </button>
          </div>
        </CardContent>
      </Card>

      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'blocked' && <BlockedUsers />}
      {activeTab === 'logs' && <LogsView />}
    </div>
  );
};

export default AdminDashboard;
