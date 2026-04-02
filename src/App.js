import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, Search, Filter, Plus, Edit2, Trash2, Download, Moon, Sun, Eye, Edit3 } from 'lucide-react';
const MOCK_TRANSACTIONS = [
  { id: 1, date: '2024-04-15', amount: 207500, category: 'Salary', type: 'income', description: 'Monthly Salary' },
  { id: 2, date: '2024-04-14', amount: 7055, category: 'Groceries', type: 'expense', description: 'Weekly shopping' },
  { id: 3, date: '2024-04-12', amount: 3735, category: 'Entertainment', type: 'expense', description: 'Movie tickets' },
  { id: 4, date: '2024-04-10', amount: 9960, category: 'Transport', type: 'expense', description: 'Gas & fuel' },
  { id: 5, date: '2024-04-08', amount: 41500, category: 'Utilities', type: 'expense', description: 'Electricity bill' },
  { id: 6, date: '2024-04-05', amount: 16600, category: 'Dining', type: 'expense', description: 'Restaurant' },
  { id: 7, date: '2024-04-01', amount: 99600, category: 'Salary', type: 'income', description: 'Freelance project' },
  { id: 8, date: '2024-03-28', amount: 5395, category: 'Groceries', type: 'expense', description: 'Shopping' },
  { id: 9, date: '2024-03-25', amount: 12450, category: 'Entertainment', type: 'expense', description: 'Concert' },
  { id: 10, date: '2024-03-20', amount: 249000, category: 'Salary', type: 'income', description: 'Monthly Salary' },
  { id: 11, date: '2024-03-18', amount: 7470, category: 'Dining', type: 'expense', description: 'Lunch meetings' },
  { id: 12, date: '2024-03-15', amount: 16600, category: 'Shopping', type: 'expense', description: 'Clothing' },
];

const CATEGORY_COLORS = {
  Salary: '#10b981',
  Groceries: '#f59e0b',
  Entertainment: '#8b5cf6',
  Transport: '#06b6d4',
  Utilities: '#ef4444',
  Dining: '#ec4899',
  Shopping: '#f97316',
};

const AppContext = React.createContext();

const AppProvider = ({ children }) => {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : MOCK_TRANSACTIONS;
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [role, setRole] = useState(() => {
    const saved = localStorage.getItem('role');
    return saved || 'viewer';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('role', role);
  }, [role]);

  const addTransaction = useCallback((transaction) => {
    const newTransaction = {
      ...transaction,
      id: Math.max(...transactions.map(t => t.id), 0) + 1,
    };
    setTransactions([newTransaction, ...transactions]);
  }, [transactions]);

  const updateTransaction = useCallback((id, updates) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, ...updates } : t));
  }, [transactions]);

  const deleteTransaction = useCallback((id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  }, [transactions]);

  const value = {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    darkMode,
    setDarkMode,
    role,
    setRole,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterType,
    setFilterType,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const useApp = () => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

const SummaryCard = ({ title, value, icon: Icon, color, trend }) => {
  return (
    <div className={`rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${
      title === 'Balance' 
        ? `bg-gradient-to-br ${color} text-white` 
        : `bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700`
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className={`text-sm font-medium ${title === 'Balance' ? 'opacity-90' : 'text-slate-600 dark:text-slate-400'}`}>
            {title}
          </p>
        </div>
        {Icon && <Icon size={24} className={title === 'Balance' ? 'opacity-75' : 'text-slate-400 dark:text-slate-500'} />}
      </div>
      <p className={`text-3xl font-bold mb-2 ${title === 'Balance' ? '' : ''}`}>
        ₹{value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      {trend && (
        <p className={`text-sm ${trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
        </p>
      )}
    </div>
  );
};

// Transactions List Component
const TransactionsList = () => {
  const { transactions, filterCategory, filterType, searchTerm, role, deleteTransaction, updateTransaction } = useApp();
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      const matchesType = filterType === 'all' || t.type === filterType;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [transactions, filterCategory, filterType, searchTerm]);

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setEditData(transaction);
  };

  const handleSave = () => {
    updateTransaction(editingId, editData);
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">No transactions found</p>
        </div>
      ) : (
        filteredTransactions.map(transaction => (
          <div
            key={transaction.id}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 flex items-center justify-between border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex items-center gap-4 flex-1">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: CATEGORY_COLORS[transaction.category] || '#6b7280' }}
              >
                {transaction.category[0]}
              </div>
              <div className="flex-1 min-w-0">
                {editingId === transaction.id ? (
                  <input
                    type="text"
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    className="w-full px-2 py-1 rounded border dark:bg-slate-700 dark:border-slate-600"
                  />
                ) : (
                  <>
                    <p className="font-medium text-slate-900 dark:text-white truncate">{transaction.description}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{transaction.category}</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                {editingId === transaction.id ? (
                  <input
                    type="number"
                    value={editData.amount}
                    onChange={(e) => setEditData({ ...editData, amount: parseFloat(e.target.value) })}
                    className="w-24 px-2 py-1 rounded border dark:bg-slate-700 dark:border-slate-600 text-right"
                  />
                ) : (
                  <>
                    <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                      {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{transaction.date}</p>
                  </>
                )}
              </div>
              {role === 'admin' && (
                <div className="flex gap-2">
                  {editingId === transaction.id ? (
                    <button
                      onClick={handleSave}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} className="text-slate-600 dark:text-slate-400" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteTransaction(transaction.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Insights Component
const Insights = ({ transactions }) => {
  const insights = useMemo(() => {
    if (transactions.length === 0) return [];

    const expensesByCategory = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

    const topCategory = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a)[0];
    const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1) : 0;

    return [
      {
        label: 'Top Spending Category',
        value: topCategory ? topCategory[0] : 'N/A',
        detail: topCategory ? `₹${topCategory[1].toFixed(2)}` : 'No data'
      },
      {
        label: 'Monthly Savings Rate',
        value: `${savingsRate}%`,
        detail: `${totalIncome > totalExpenses ? 'Surplus' : 'Deficit'}`
      },
      {
        label: 'Average Transaction',
        value: `₹${(transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length).toFixed(2)}`,
        detail: `Across ${transactions.length} transactions`
      }
    ];
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {insights.map((insight, i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{insight.label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{insight.value}</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">{insight.detail}</p>
        </div>
      ))}
    </div>
  );
};

// Add/Edit Transaction Modal
const TransactionModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'Groceries',
    type: 'expense',
    description: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.amount && formData.description) {
      onSubmit({ ...formData, amount: parseFloat(formData.amount) });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Add Transaction</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="Salary">Salary</option>
                <option value="Groceries">Groceries</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Transport">Transport</option>
                <option value="Utilities">Utilities</option>
                <option value="Dining">Dining</option>
                <option value="Shopping">Shopping</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const {
    transactions,
    darkMode,
    setDarkMode,
    role,
    setRole,
    filterCategory,
    setFilterCategory,
    filterType,
    setFilterType,
    searchTerm,
    setSearchTerm,
    addTransaction,
  } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const totalBalance = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
  }, [transactions]);

  const totalIncome = useMemo(() => {
    return transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const spendingByCategory = useMemo(() => {
    const data = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const balanceTrend = useMemo(() => {
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let balance = 0;
    return sortedTransactions.slice(-20).map(t => {
      balance += t.type === 'income' ? t.amount : -t.amount;
      return { date: t.date.slice(-5), balance };
    });
  }, [transactions]);

  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return ['all', ...Array.from(cats)];
  }, [transactions]);

  const handleExport = () => {
    const csv = [
      ['Date', 'Description', 'Category', 'Type', 'Amount (₹)'],
      ...transactions.map(t => [t.date, t.description, t.category, t.type, t.amount])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                FinanceFlow
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Role:</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white font-medium"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SummaryCard
              title="Balance"
              value={totalBalance}
              color="from-blue-500 to-blue-600"
              trend={15}
            />
            <SummaryCard
              title="Income"
              value={totalIncome}
              trend={8}
            />
            <SummaryCard
              title="Expenses"
              value={totalExpenses}
              trend={-5}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-slate-700">
            {['overview', 'transactions', 'insights'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition-colors capitalize border-b-2 ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Balance Trend */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Balance Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={balanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                        border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`,
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [`₹${value.toFixed(2)}`, 'Balance']}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#3b82f6"
                      dot={false}
                      strokeWidth={3}
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Spending Breakdown */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Spending Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={spendingByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ₹${value.toFixed(0)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {spendingByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                        border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`,
                        borderRadius: '8px',
                      }}
                      formatter={(value) => `₹${value.toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  {role === 'admin' && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                    >
                      <Plus size={20} /> Add Transaction
                    </button>
                  )}
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium flex items-center gap-2 text-slate-700 dark:text-slate-300"
                  >
                    <Download size={20} /> Export
                  </button>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-slate-500" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="all">All Types</option>
                      <option value="income">Income</option>
                      <option value="expense">Expenses</option>
                    </select>
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Transactions List */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <TransactionsList />
              </div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <Insights transactions={transactions} />
              
              {/* Category Breakdown */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Category Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={spendingByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                        border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`,
                        borderRadius: '8px',
                      }}
                      formatter={(value) => `₹${value.toFixed(2)}`}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                      {spendingByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#6b7280'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <TransactionModal
          onClose={() => setShowModal(false)}
          onSubmit={addTransaction}
        />
      )}
    </div>
  );
};

// App Root
export default function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}