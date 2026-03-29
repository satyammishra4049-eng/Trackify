import React, { useState, useEffect } from "react";
import { 
  Plus, 
  PiggyBank, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp,
  X,
  Target,
  ChevronRight,
  Trash2
} from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { useCurrency } from "../components/CurrencyContext";
import { motion, AnimatePresence } from "motion/react";

export function Budgets() {
  const { token } = useAuth();
  const { formatAmount, currency } = useCurrency();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    category: "Food",
    amount: "",
    month: new Date().toISOString().slice(0, 7) // YYYY-MM
  });

  const categories = ["Food", "Travel", "Bills", "Shopping", "Entertainment", "Health", "Other"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [bRes, tRes] = await Promise.all([
      fetch("/api/budgets", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/transactions", { headers: { Authorization: `Bearer ${token}` } })
    ]);
    const bData = await bRes.json();
    const tData = await tRes.json();
    setBudgets(bData);
    setTransactions(tData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) }),
    });

    if (res.ok) {
      fetchData();
      setIsModalOpen(false);
      setFormData({ ...formData, amount: "" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/budgets/${deleteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      fetchData();
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const calculateSpent = (category: string, month: string) => {
    return transactions
      .filter(t => t.type === 'expense' && t.category === category && t.date.startsWith(month))
      .reduce((acc, t) => acc + t.amount, 0);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Budget Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Set monthly limits and track your spending discipline.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95"
        >
          <Plus size={16} />
          Set New Budget
        </button>
      </header>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {budgets.map((budget, index) => {
          const spent = calculateSpent(budget.category, budget.month);
          const percent = Math.min((spent / budget.amount) * 100, 100);
          const isOver = spent > budget.amount;

          return (
            <motion.div 
              key={budget.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-all group relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${isOver ? 'from-rose-500/5 to-orange-500/5' : 'from-indigo-500/5 to-blue-500/5'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isOver ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    <Target size={20} />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{budget.category}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{budget.month}</span>
                  <button 
                    onClick={() => confirmDelete(budget.id)}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                    title="Delete budget"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 relative z-10">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Spent: <span className="font-bold text-slate-900 dark:text-white">{formatAmount(spent)}</span></span>
                  <span className="text-slate-500 dark:text-slate-400">Limit: <span className="font-bold text-slate-900 dark:text-white">{formatAmount(budget.amount)}</span></span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.5 + (index * 0.1) }}
                    className={`h-full rounded-full ${isOver ? 'bg-rose-500' : 'bg-indigo-600'}`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 relative z-10">
                <div className="flex items-center gap-1.5">
                  {isOver ? (
                    <AlertCircle size={16} className="text-rose-500 animate-pulse" />
                  ) : (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  )}
                  <span className={`text-xs font-bold ${isOver ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {isOver ? "Over budget!" : "On track"}
                  </span>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {Math.round(percent)}% used
                </span>
              </div>
            </motion.div>
          );
        })}

        {budgets.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-full py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
          >
            <PiggyBank size={48} className="mb-4 text-slate-300 dark:text-slate-700 animate-bounce" />
            <p className="text-lg font-bold">No budgets set yet</p>
            <p className="text-sm">Start by setting a monthly limit for a category.</p>
          </motion.div>
        )}
      </motion.div>

      {/* Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 transition-colors"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Set Budget</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Monthly Limit</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm">
                      {currency.symbol}
                    </div>
                    <input
                      type="number"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Month</label>
                  <input
                    type="month"
                    required
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                >
                  Save Budget
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 text-center transition-colors"
            >
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Budget?</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8">Are you sure you want to remove this budget limit? This will not delete your transactions.</p>
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
