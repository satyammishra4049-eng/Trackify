import React, { useState, useRef } from "react";
import { useAuth } from "../components/AuthContext";
import { userAPI } from "../services/api";
import { useCurrency } from "../components/CurrencyContext";
import { 
  User, 
  Mail, 
  Camera, 
  Save, 
  Shield,
  Calendar,
  Key,
  X,
  Download,
  Lock,
  Eye,
  EyeOff,
  FileText,
  Share2,
  TrendingUp,
  Moon,
  Sun
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTheme } from "../components/ThemeContext";
import { toast, Toaster } from "sonner";

export function Profile() {
  const { user, token, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { currency } = useCurrency();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Change State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  // Data Export State
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const data = await userAPI.updateProfile(name, email, avatarUrl);
      updateProfile(data.user);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous message
    setPasswordMessage(null);
    setIsChangingPassword(true);
    
    // VALIDATION 1: Check if new passwords match
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Invalid password' });
      setIsChangingPassword(false);
      return;
    }
    
    // VALIDATION 2: Check minimum length
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Invalid password' });
      setIsChangingPassword(false);
      return;
    }
    
    // VALIDATION 3: Check if current and new are same
    if (currentPassword === newPassword) {
      setPasswordMessage({ type: 'error', text: 'Invalid password' });
      setIsChangingPassword(false);
      return;
    }

    try {
      await userAPI.updatePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'Update successful' });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordMessage(null);
      }, 1500);
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: 'Invalid password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const generatePDFReport = async (shouldShare = false) => {
    setIsGeneratingPDF(true);
    try {
      // Get selected currency code (fallback to INR)
      const currencyCode = currency?.code || 'INR';
      
      // Fetch data with currency parameter
      const data = await userAPI.exportData(currencyCode);
      
      // Use currency symbol + formatted number (ASCII-compatible for jsPDF)
      const getCurrencySymbol = (code: string) => {
        const symbols: Record<string, string> = {
          'USD': '$',
          'EUR': 'EUR ',
          'GBP': 'GBP ',
          'JPY': 'JPY ',
          'INR': 'Rs. ',
          'AUD': 'A$',
          'CAD': 'C$',
          'CHF': 'CHF ',
          'CNY': 'CNY ',
          'NZD': 'NZ$',
          'BRL': 'R$',
          'RUB': 'RUB ',
          'KRW': 'KRW ',
          'SGD': 'S$',
          'MXN': 'Mex$',
          'ZAR': 'R',
          'TRY': 'TL ',
          'AED': 'AED ',
          'SAR': 'SAR ',
          'THB': 'THB ',
          'IDR': 'Rp ',
          'MYR': 'RM',
          'PHP': 'P',
          'VND': 'VND ',
          'HKD': 'HK$',
          'TWD': 'NT$',
          'EGP': 'E£',
          'NGN': 'N',
          'PKR': 'Rs. ',
          'BDT': 'Tk ',
          'UAH': 'UAH ',
          'PLN': 'zl ',
          'SEK': 'kr ',
          'NOK': 'kr ',
          'DKK': 'kr ',
          'ILS': 'ILS ',
          'CLP': 'CLP$',
          'COP': 'COL$',
          'PEN': 'S/. ',
          'ARS': 'ARS$',
          'CZK': 'Kc ',
          'HUF': 'Ft ',
          'RON': 'lei ',
        };
        return symbols[code] || code + ' ';
      };
      
      const formatCurrency = (amount: number) => {
        const symbol = getCurrencySymbol(currencyCode);
        const formatted = amount.toLocaleString('en-US');
        return `${symbol}${formatted}`;
      };
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(79, 70, 229); // Indigo-600
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Trackify Financial Report", 15, 25);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - 15, 25, { align: "right" });
      
      // User Info
      doc.setTextColor(51, 65, 85); // Slate-700
      doc.setFontSize(12);
      doc.text(`User: ${data.user.name}`, 15, 50);
      doc.text(`Email: ${data.user.email}`, 15, 56);
      doc.text(`Currency: ${currencyCode}`, 15, 62);
      
      // Summary Section
      const totalIncome = data.transactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      const totalExpense = data.transactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      const netBalance = totalIncome - totalExpense;
      
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.line(15, 68, pageWidth - 15, 68);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Financial Summary", 15, 78);
      
      autoTable(doc, {
        startY: 83,
        head: [['Metric', 'Amount']],
        body: [
          ['Total Income', formatCurrency(totalIncome)],
          ['Total Expenses', formatCurrency(totalExpense)],
          ['Net Balance', formatCurrency(netBalance)]
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 10 }
      });
      
      // Transactions Table
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Recent Transactions", 15, (doc as any).lastAutoTable.finalY + 15);
      
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
        body: data.transactions.map((t: any) => [
          t.date,
          t.description || '-',
          t.category,
          t.type.toUpperCase(),
          formatCurrency(t.amount)
        ]),
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 }
      });
      
      // Budgets Table
      if (data.budgets.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Monthly Budgets", 15, 20);
        
        autoTable(doc, {
          startY: 25,
          head: [['Category', 'Monthly Limit', 'Month']],
          body: data.budgets.map((b: any) => [
            b.category,
            formatCurrency(b.amount),
            b.month
          ]),
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] },
          styles: { fontSize: 10 }
        });
      }
      
      if (shouldShare && navigator.share) {
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], `trackify-report-${new Date().toISOString().split('T')[0]}.pdf`, { type: 'application/pdf' });
        
        try {
          await navigator.share({
            title: 'Trackify Financial Report',
            text: 'Check out my financial report from Trackify!',
            files: [file]
          });
        } catch (err) {
          console.error("Sharing failed:", err);
          doc.save(`trackify-report-${new Date().toISOString().split('T')[0]}.pdf`);
        }
      } else {
        doc.save(`trackify-report-${new Date().toISOString().split('T')[0]}.pdf`);
      }
      
      toast.success(`PDF report generated with ${currencyCode} currency!`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF report");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Profile Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Manage your personal information and account preferences.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center transition-colors">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-xl">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-4xl font-bold">
                    {user?.name[0]}
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-90"
              >
                <Camera size={18} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{user?.email}</p>
            
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Account Type</p>
                <p className="text-sm font-bold text-indigo-600">Premium</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Member Since</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Mar 2026</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <User size={20} className="text-indigo-600" />
              Personal Information
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Sun size={20} className="text-indigo-600" />
              Appearance
            </h3>
            
            <div className="space-y-4">
              <div 
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm">
                    {theme === 'light' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-400" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Theme Mode</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Switch between light and dark visual styles.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${theme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Light
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${theme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Dark
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Download size={20} className="text-indigo-600" />
              Data Export & Reports
            </h3>
            
            <div className="space-y-4">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Financial PDF Report</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Generate a comprehensive PDF report of your income, expenses, and budget performance.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => generatePDFReport(false)}
                    disabled={isGeneratingPDF}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isGeneratingPDF ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Download size={18} />}
                    Download PDF
                  </button>
                  <button 
                    onClick={() => generatePDFReport(true)}
                    disabled={isGeneratingPDF}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Share2 size={18} />
                    Share Report
                  </button>
                </div>
              </div>

            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Key size={20} className="text-indigo-600" />
              Security
            </h3>
            
            <div className="space-y-4">
              <div 
                onClick={() => {
                  setIsPasswordModalOpen(true);
                  setPasswordMessage(null);
                }}
                className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-all">
                    <Lock size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Change Password</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Update your account security credentials.</p>
                  </div>
                </div>
                <button className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600">
                  <Key size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Change Password</h3>
                <button onClick={() => setIsPasswordModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                  <X size={20} className="text-slate-500 dark:text-slate-400" />
                </button>
              </div>

              <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Current Password</label>
                  <div className="relative">
                    <input 
                      type={showCurrentPassword ? "text" : "password"} 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all pr-12"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">New Password</label>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all pr-12"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all pr-12"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {passwordMessage && (
                  <div className={`p-3 rounded-xl text-center text-sm font-bold ${
                    passwordMessage.type === 'error' 
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                      : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {passwordMessage.text}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                >
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
