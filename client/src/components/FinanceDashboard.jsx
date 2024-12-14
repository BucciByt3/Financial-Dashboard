// src/components/FinanceDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Sun, Moon, PlusCircle } from 'lucide-react';
import TransactionModal from './TransactionModal';
import StatisticsPage from './StatisticsPage';
import MainDashboard from './MainDashboard';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const FinanceDashboard = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeAccount, setActiveAccount] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [accountsRes, cardsRes, transactionsRes] = await Promise.all([
        fetch(`${API_URL}/api/accounts`, { headers }),
        fetch(`${API_URL}/api/cards`, { headers }),
        fetch(`${API_URL}/api/transactions`, { headers })
      ]);

      if (!accountsRes.ok || !cardsRes.ok || !transactionsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [accountsData, cardsData, transactionsData] = await Promise.all([
        accountsRes.json(),
        cardsRes.json(),
        transactionsRes.json()
      ]);

      setAccounts(accountsData);
      setCards(cardsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAccountSelect = (accountId) => {
    setActiveAccount(accountId);
  };

  const handleAddTransaction = async (newTransaction) => {
    try {
      setTransactions(prev => [...prev, newTransaction]);
      
      setAccounts(prev => 
        prev.map(account => {
          if (account._id === newTransaction.accountId) {
            const balanceChange = newTransaction.type === 'income' 
              ? newTransaction.amount 
              : -newTransaction.amount;
            return {
              ...account,
              balance: parseFloat((account.balance + balanceChange).toFixed(2))
            };
          }
          return account;
        })
      );

      setShowTransactionModal(false);
      await fetchData();
    } catch (error) {
      console.error('Error handling new transaction:', error);
    }
  };

  const handleAddAccount = async (accountName, accountType) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: accountName,
          type: accountType,
          balance: 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add account');
      }

      await fetchData();
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    try {
      const token = localStorage.getItem('token');

      // Delete all cards associated with the account
      const accountCards = cards.filter(card => card.accountId === accountId);
      await Promise.all(accountCards.map(card => 
        fetch(`${API_URL}/api/cards/${card._id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ));

      // Delete all transactions associated with the account
      const accountTransactions = transactions.filter(transaction => transaction.accountId === accountId);
      await Promise.all(accountTransactions.map(transaction => 
        fetch(`${API_URL}/api/transactions/${transaction._id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ));

      // Delete the account
      const response = await fetch(`${API_URL}/api/accounts/${accountId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      await fetchData();
      if (activeAccount === accountId) {
        setActiveAccount(null);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(error.message);
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete card');
      }

      await fetchData();
    } catch (error) {
      console.error('Error deleting card:', error);
      alert(error.message);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      await fetchData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert(error.message);
    }
  };

  const handleAddCard = async (cardData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cardData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add card');
      }

      await fetchData();
    } catch (error) {
      console.error('Error adding card:', error);
      alert(error.message);
    }
  };

  const calculateAccountStats = (accountId) => {
    const accountTransactions = transactions.filter(t => 
      !accountId || t.accountId === accountId
    );

    const totalIncome = accountTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = accountTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses
    };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
        {/* Header */}
        <header className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Financial Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm">Welcome, {user?.username}</span>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
              <button
                onClick={() => setShowStats(!showStats)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {showStats ? 'Show Dashboard' : 'Show Statistics'}
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        {showStats ? (
          <StatisticsPage 
            transactions={transactions}
            accounts={accounts}
          />
        ) : (
          <MainDashboard 
            accounts={accounts}
            cards={cards}
            transactions={transactions}
            activeAccount={activeAccount}
            stats={calculateAccountStats(activeAccount)}
            onAccountSelect={handleAccountSelect}
            onAddAccount={handleAddAccount}
            onAddCard={handleAddCard}
            onDeleteAccount={handleDeleteAccount}
            onDeleteCard={handleDeleteCard}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {/* Transaction Modal */}
        <TransactionModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          onSubmit={handleAddTransaction}
          accounts={accounts}
        />

        {/* Add New Transaction Button */}
        <div className="fixed bottom-8 right-8">
          <button
            onClick={() => setShowTransactionModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-105"
          >
            <PlusCircle className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
