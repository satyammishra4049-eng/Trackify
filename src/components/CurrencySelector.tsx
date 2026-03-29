import React, { useState, useRef, useEffect } from "react";
import { Search, Globe, ChevronDown, Check } from "lucide-react";
import { useCurrency, currencies, Currency } from "./CurrencyContext";
import { motion, AnimatePresence } from "motion/react";

export function CurrencySelector() {
  const { currency, setCurrencyByCode } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCurrencies = currencies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        <div className="flex items-center gap-2 truncate">
          <Globe size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="truncate">
            {currency.code} ({currency.symbol}) - {currency.name}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-[100] overflow-hidden flex flex-col max-h-[320px]"
          >
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                <input
                  type="text"
                  placeholder="Search currency..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {filteredCurrencies.length > 0 ? (
                filteredCurrencies.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCurrencyByCode(c.code);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      currency.code === c.code ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="w-8 font-bold text-slate-400 dark:text-slate-500 shrink-0">{c.code}</span>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">{c.symbol}</span>
                      {currency.code === c.code && <Check size={14} />}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 dark:text-slate-600 text-xs">No currencies found</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
