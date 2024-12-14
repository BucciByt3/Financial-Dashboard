// src/components/MainDashboard.jsx
import React from 'react';
import { PlusCircle, CreditCard, Wallet, PieChart, Trash2, TrendingUp, DollarSign, Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MainDashboard = ({ 
  accounts = [], 
  cards = [], 
  transactions = [], 
  activeAccount, 
  stats = { balance: 0, totalIncome: 0, totalExpenses: 0 },
  onAccountSelect,
  onAddAccount,
  onAddCard,
  onDeleteAccount,
  onDeleteCard,
  onDeleteTransaction
}) => {
  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getCurrentTransactions = () => {
    return (transactions || [])
      .filter(t => !activeAccount || t.accountId === activeAccount)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const handleAddAccount = () => {
    try {
      const name = prompt('Enter account name:');
      if (!name) return;

      const type = prompt('Enter account type (checking/savings):').toLowerCase();
      if (!type || !['checking', 'savings'].includes(type)) {
        alert('Please enter either "checking" or "savings"');
        return;
      }

      onAddAccount(name, type);
    } catch (error) {
      console.error('Error adding account:', error);
      alert('Failed to add account. Please try again.');
    }
  };

  const handleDeleteAccount = (accountId) => {
    if (window.confirm('Are you sure you want to delete this account? All associated cards and transactions will also be deleted.')) {
      onDeleteAccount(accountId);
    }
  };

  const handleDeleteCard = (cardId) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      onDeleteCard(cardId);
    }
  };

  const handleDeleteTransaction = (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      onDeleteTransaction(transactionId);
    }
  };

  const handleAddCard = async () => {
    if (!accounts.length) {
      alert('Please create an account first');
      return;
    }

    try {
      const accountNames = accounts.map(acc => acc.name).join(', ');
      const selectedName = prompt(
        `Available accounts: ${accountNames}\n\nEnter the account name to add a card to:`
      );
      if (!selectedName) return;

      const account = accounts.find(acc => 
        acc.name.toLowerCase() === selectedName.toLowerCase()
      );
      if (!account) {
        alert('Account not found. Please enter an exact account name.');
        return;
      }

      const type = prompt('Enter card type (credit/debit):');
      if (!type || !['credit', 'debit'].includes(type.toLowerCase())) {
        alert('Please enter either "credit" or "debit"');
        return;
      }

      const number = prompt('Enter card number (XXXX-XXXX-XXXX-XXXX):');
      if (!number || !/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(number)) {
        alert('Please enter a valid card number in the format XXXX-XXXX-XXXX-XXXX');
        return;
      }

      const expiry = prompt('Enter expiry date (MM/YY):');
      if (!expiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
        alert('Please enter a valid expiry date in the format MM/YY');
        return;
      }

      await onAddCard({
        accountId: account._id,
        type: type.toLowerCase(),
        number,
        expiry
      });

    } catch (error) {
      console.error('Error adding card:', error);
      alert(error.message || 'Failed to add card. Please try again.');
    }
  };

  return (
    <main className="container mx-auto p-4">
      <div className="grid grid-cols-12 gap-4">
        {/* Accounts and Cards Sidebar */}
        <div className="col-span-3">
          {/* Accounts Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Accounts
                <button 
                  onClick={handleAddAccount}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div
                  key="all-accounts"
                  onClick={() => onAccountSelect(null)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    !activeAccount ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <Wallet className="w-5 h-5 mr-2" />
                    <div>
                      <div className="font-medium">All Accounts</div>
                      <div className="text-sm opacity-75">
                        ${formatNumber(accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0))}
                      </div>
                    </div>
                  </div>
                </div>
                {accounts.map(account => (
                  <div
                    key={account._id}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      activeAccount === account._id ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center" onClick={() => onAccountSelect(account._id)}>
                        <Wallet className="w-5 h-5 mr-2" />
                        <div>
                          <div className="font-medium">{account.name}</div>
                          <div className="text-sm opacity-75">
                            ${formatNumber(account.balance)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAccount(account._id);
                        }}
                        className="p-1 hover:bg-red-200 dark:hover:bg-red-700 rounded-full transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cards Card */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Cards
                <button 
                  onClick={handleAddCard}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(cards || [])
                  .filter(card => !activeAccount || card.accountId === activeAccount)
                  .map(card => (
                    <div
                      key={card._id}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CreditCard className="w-5 h-5 mr-2" />
                          <div>
                            <div className="font-medium">
                              {card.type.charAt(0).toUpperCase() + card.type.slice(1)} Card
                            </div>
                            <div className="text-sm opacity-75">
                              **** {card.number.slice(-4)}
                            </div>
                            <div className="text-sm opacity-75">
                              Expires: {card.expiry}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteCard(card._id)}
                          className="p-1 hover:bg-red-200 dark:hover:bg-red-700 rounded-full transition-all"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="col-span-9">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-75">Total Balance</p>
                    <h3 className="text-2xl font-bold mt-1">
                      ${formatNumber(stats.balance)}
                    </h3>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <DollarSign className="w-6 h-6 text-blue-500 dark:text-blue-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-75">Total Income</p>
                    <h3 className="text-2xl font-bold mt-1">
                      ${formatNumber(stats.totalIncome)}
                    </h3>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <TrendingUp className="w-6 h-6 text-green-500 dark:text-green-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-75">Total Expenses</p>
                    <h3 className="text-2xl font-bold mt-1">
                      ${formatNumber(stats.totalExpenses)}
                    </h3>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                    <PieChart className="w-6 h-6 text-red-500 dark:text-red-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Transactions
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all">
                    <Calendar className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getCurrentTransactions().map(transaction => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'income'
                          ? 'bg-green-100 dark:bg-green-900 text-green-500'
                          : 'bg-red-100 dark:bg-red-900 text-red-500'
                      }`}>
                        {transaction.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <PieChart className="w-5 h-5" />}
                      </div>
                      <div className="ml-3">
                        <div className="font-medium">{transaction.category}</div>
                        <div className="text-sm opacity-75">{transaction.description}</div>
                        <div className="text-sm opacity-75">
                          {new Date(transaction.date).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`font-bold ${
                        transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${formatNumber(Math.abs(transaction.amount))}
                      </div>
                      <button
                        onClick={() => handleDeleteTransaction(transaction._id)}
                        className="p-1 hover:bg-red-200 dark:hover:bg-red-700 rounded-full transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default MainDashboard;
