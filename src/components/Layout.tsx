import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PiggyBank, 
  LogOut, 
  Menu, 
  X,
  TrendingUp,
  Wallet,
  Globe,
  User
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { useCurrency } from "./CurrencyContext";
import { CurrencySelector } from "./CurrencySelector";
import { motion, AnimatePresence } from "motion/react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { currency, setCurrencyByCode } = useCurrency();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Transactions", path: "/transactions", icon: ArrowLeftRight },
    { name: "Budgets", path: "/budgets", icon: PiggyBank },
    { name: "Profile", path: "/profile", icon: User },
  ];

  const handleLogoutClick = () => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 fixed h-full transition-colors">
        <Link to="/" className="flex items-center gap-2 mb-8 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <TrendingUp size={22} />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Trackify</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  location.pathname === item.path
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <item.icon size={18} className={`transition-transform duration-300 group-hover:scale-110 ${location.pathname === item.path ? "animate-pulse-slow" : ""}`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            </motion.div>
          ))}
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800"
          >
            <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Settings</p>
            <div className="px-3">
              <CurrencySelector />
            </div>
          </motion.div>
        </nav>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-5 border-t border-slate-100 dark:border-slate-800"
        >
          <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 mb-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all group">
            <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-xs overflow-hidden border border-slate-200 dark:border-slate-700 group-hover:border-indigo-500 transition-colors">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                user?.name[0]
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">{user?.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          </Link>
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 text-sm group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            Logout
          </button>
        </motion.div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-14 px-4 flex items-center justify-between z-50 transition-colors">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <TrendingUp size={18} />
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-white">Trackify</span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 dark:text-slate-400">
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="md:hidden fixed inset-0 bg-white dark:bg-slate-900 z-40 pt-20 px-6 transition-colors"
          >
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl ${
                    location.pathname === item.path
                      ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <item.icon size={24} />
                  <span className="text-lg">{item.name}</span>
                </Link>
              ))}
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-3 w-full px-4 py-4 text-slate-500 dark:text-slate-400"
              >
                <LogOut size={24} />
                <span className="text-lg">Logout</span>
              </button>

              <div className="pt-10 border-t border-slate-100 dark:border-slate-800 mt-6">
                <p className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Settings</p>
                <div className="px-4">
                  <CurrencySelector />
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-60 pt-16 md:pt-0 p-4 md:p-8 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                  <LogOut size={36} className="text-red-600 dark:text-red-500 ml-1" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Do you want to logout?</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
                  Are you sure you want to log out of Trackify?
                </p>
                <div className="flex items-center gap-4 w-full">
                  <button
                    onClick={() => setIsLogoutModalOpen(false)}
                    className="flex-1 px-4 py-3.5 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="flex-1 px-4 py-3.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200/50 dark:shadow-none transition-all hover:-translate-y-0.5"
                  >
                    Yes, Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
