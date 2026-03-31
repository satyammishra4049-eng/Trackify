import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  X, 
  TrendingUp, 
  TrendingDown
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { useCurrency } from "../components/CurrencyContext";
import { transactionAPI } from "../services/api";
import { TransactionModal } from "../components/TransactionModal";
import { motion, AnimatePresence } from "motion/react";
import { toast, Toaster } from "sonner";

export function Transactions() {
  const { token } = useAuth();
  const { formatAmount } = useCurrency();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const categories = ["Food", "Travel", "Bills", "Shopping", "Salary", "Entertainment", "Health", "Other"];

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const data = await transactionAPI.getTransactions();
      setTransactions(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load transactions");
      setTransactions([]);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await transactionAPI.deleteTransaction(deleteId);
      toast.success("Transaction deleted");
      fetchTransactions();
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete transaction");
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setEditingData(t);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setEditingData(null);
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === "all" || t.type === filterType;
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;
    
    const transactionDate = new Date(t.date);
    const matchesStartDate = !startDate || transactionDate >= new Date(startDate);
    const matchesEndDate = !endDate || transactionDate <= new Date(endDate);
    
    return matchesSearch && matchesType && matchesCategory && matchesStartDate && matchesEndDate;
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Transactions</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage your income and expenses.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </header>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by category or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-700 dark:text-slate-300 transition-all"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-700 dark:text-slate-300 transition-all"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
            <Filter size={16} />
            <span>Date Range:</span>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 md:w-40 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white transition-all"
            />
            <span className="text-slate-400 dark:text-slate-600">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 md:w-40 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white transition-all"
            />
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(""); setEndDate(""); }}
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                title="Clear date filter"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <AnimatePresence mode="popLayout">
                {filteredTransactions.map((t, index) => (
                  <motion.tr 
                    key={t.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: Math.min(index * 0.03, 0.5) }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="px-3 md:px-6 py-3 md:py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs md:text-sm">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-slate-600 dark:text-slate-400 max-w-xs truncate text-xs md:text-sm">{t.description || "-"}</td>
                    <td className={`px-3 md:px-6 py-3 md:py-4 font-bold text-xs md:text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount)}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-right space-x-1 md:space-x-2">
                      <button onClick={() => openEdit(t)} className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => confirmDelete(t.id)} className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 md:px-6 py-12 md:py-20 text-center text-slate-500 dark:text-slate-400 text-xs md:text-sm">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add/Edit Modal */}
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={fetchTransactions}
        editingId={editingId}
        initialData={editingData}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Transaction?</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8">This action cannot be undone. Are you sure you want to remove this record?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
