// client/src/components/AdminPanel/LogsView.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL } from '../../config';

const LogsView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: '',
    category: '',
    startDate: '',
    endDate: ''
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      let url = `${API_URL}/api/admin/logs`;

      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const getLogColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-red-500 bg-red-50 dark:bg-red-900/10';
      case 'warning':
        return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      default:
        return 'text-blue-500 bg-blue-50 dark:bg-blue-900/10';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          System Logs
          <div className="flex gap-4">
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">All Types</option>
              <option value="error">Errors</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
            </select>

            <select
              value={filter.category}
              onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
              className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">All Categories</option>
              <option value="auth">Authentication</option>
              <option value="admin">Admin</option>
              <option value="system">System</option>
              <option value="user">User</option>
            </select>

            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
              className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            />
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
              className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No logs found</div>
          ) : (
            logs.map(log => (
              <div
                key={log._id}
                className={`p-4 rounded-lg ${getLogColor(log.type)}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold">{log.category}</span>
	            <p className="mt-1">{log.message}</p>
                    {log.details && (
                      <pre className="mt-2 text-sm bg-white/50 dark:bg-black/5 p-2 rounded overflow-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                  <span className="text-sm whitespace-nowrap ml-4">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
          {!loading && logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No logs found matching the selected filters
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LogsView;
