import React, { useEffect, useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Sparkles, 
  ArrowRight,
  Plus
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { useAuth } from "../components/AuthContext";
import { useCurrency } from "../components/CurrencyContext";
import { transactionAPI } from "../services/api";
import { toast, Toaster } from "sonner";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { TransactionModal } from "../components/TransactionModal";

export function Dashboard() {
  const { token } = useAuth();
  const { formatAmount } = useCurrency();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await transactionAPI.getTransactions();
      setTransactions(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load transactions");
      setTransactions([]);
    }
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  // Chart Data: Category Wise
  const categoryData = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc: any, t) => {
      const existing = acc.find((item: any) => item.name === t.category);
      if (existing) existing.value += t.amount;
      else acc.push({ name: t.category, value: t.amount });
      return acc;
    }, []);

  const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4"];

  // Chart Data: Monthly Trends (last 6 months)
  const monthlyData = transactions.reduce((acc: any, t) => {
    const month = new Date(t.date).toLocaleString("default", { month: "short" });
    const existing = acc.find((item: any) => item.month === month);
    if (existing) {
      if (t.type === "income") existing.income += t.amount;
      else existing.expenses += t.amount;
    } else {
      acc.push({ 
        month, 
        income: t.type === "income" ? t.amount : 0, 
        expenses: t.type === "expense" ? t.amount : 0 
      });
    }
    return acc;
  }, []).reverse().slice(-6);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Overview</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Track your financial health and spending patterns.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            <Plus size={16} />
            Add Transaction
          </button>
        </div>
      </header>

      {/* Summary Cards */}
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
      >
        <SummaryCard 
          title="Total Balance" 
          amount={balance} 
          icon={Wallet} 
          color="indigo" 
          formatAmount={formatAmount}
          gradient="from-indigo-500/10 to-blue-500/10"
        />
        <SummaryCard 
          title="Total Income" 
          amount={totalIncome} 
          icon={TrendingUp} 
          color="emerald" 
          formatAmount={formatAmount}
          gradient="from-emerald-500/10 to-teal-500/10"
        />
        <SummaryCard 
          title="Total Expenses" 
          amount={totalExpenses} 
          icon={TrendingDown} 
          color="rose" 
          formatAmount={formatAmount}
          gradient="from-rose-500/10 to-orange-500/10"
        />
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 relative z-10">Monthly Trends</h3>
          <div className="h-[250px] md:h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: "#f8fafc", opacity: 0.1 }}
                  contentStyle={{ 
                    borderRadius: "12px", 
                    border: "none", 
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    backgroundColor: "#1e293b",
                    color: "#f8fafc"
                  }}
                  itemStyle={{ color: "#f8fafc" }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors relative overflow-hidden group"
        >
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full -ml-16 -mb-16 transition-transform duration-700 group-hover:scale-150" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 relative z-10">Expenses by Category</h3>
          <div className="h-[250px] md:h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "12px", 
                    border: "none", 
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    backgroundColor: "#1e293b",
                    color: "#f8fafc"
                  }}
                  itemStyle={{ color: "#f8fafc" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 relative z-10">
            {categoryData.slice(0, 4).map((item: any, i: number) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">{formatAmount(item.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 gap-8"
      >
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
            <Link to="/transactions" className="text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-1 hover:underline">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="space-y-4">
            {transactions.slice(0, 10).map((t, index) => (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + (index * 0.05) }}
                className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    t.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                  }`}>
                    {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{t.category}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={`font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount)}
                </p>
              </motion.div>
            ))}
            {transactions.length === 0 && (
              <p className="text-center text-slate-500 dark:text-slate-400 py-10">No transactions yet.</p>
            )}
          </div>
        </div>
      </motion.div>

      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
}

function SummaryCard({ title, amount, icon: Icon, color, formatAmount, gradient }: any) {
  const colors: any = {
    indigo: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    rose: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400",
  };

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 md:gap-4 transition-all relative overflow-hidden group`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 relative z-10 transition-transform group-hover:scale-110 ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div className="min-w-0 flex-1 relative z-10">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 whitespace-nowrap">{title}</p>
        <p className="text-lg font-extrabold text-slate-900 dark:text-white leading-none">{formatAmount(amount)}</p>
      </div>
    </motion.div>
  );
}
