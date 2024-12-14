import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const StatisticsPage = ({ transactions = [], accounts = [] }) => {
  const [timeframe, setTimeframe] = useState('month');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [chartData, setChartData] = useState({
    income: [],
    expenses: [],
    categories: [],
    balance: []
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    calculateChartData();
  }, [timeframe, selectedAccount, transactions]);

  const calculateChartData = () => {
    let filteredTransactions = transactions;
    
    if (selectedAccount !== 'all') {
      filteredTransactions = transactions.filter(t => t.accountId === selectedAccount);
    }

    const grouped = filteredTransactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const key = timeframe === 'month' 
        ? date.toLocaleString('default', { month: 'short' })
        : timeframe === 'quarter'
        ? `Q${Math.floor(date.getMonth() / 3) + 1}`
        : date.getFullYear().toString();

      if (!acc[key]) {
        acc[key] = {
          income: 0,
          expenses: 0
        };
      }

      if (transaction.type === 'income') {
        acc[key].income += transaction.amount;
      } else {
        acc[key].expenses += Math.abs(transaction.amount);
      }

      return acc;
    }, {});

    const categoryData = filteredTransactions.reduce((acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = 0;
      }
      acc[transaction.category] += Math.abs(transaction.amount);
      return acc;
    }, {});

    const balanceData = Object.entries(grouped).map(([date, values]) => ({
      date,
      income: values.income,
      expenses: values.expenses,
      balance: values.income - values.expenses
    }));

    const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({
      name,
      value
    }));

    setChartData({
      balance: balanceData,
      categories: categoryChartData
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option key="month" value="month">Monthly</option>
            <option key="quarter" value="quarter">Quarterly</option>
            <option key="year" value="year">Yearly</option>
          </select>

          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option key="all" value="all">All Accounts</option>
            {accounts.map(account => (
              <option key={account._id} value={account._id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all">
          <Download className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.balance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" fill="#4CAF50" name="Income" />
                  <Bar dataKey="expenses" fill="#f44336" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.balance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#2196F3" 
                    strokeWidth={2}
                    name="Balance"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.categories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatisticsPage;
