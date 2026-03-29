import React, { createContext, useContext, useState, useEffect } from "react";

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const currencies: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "MXN", symbol: "Mex$", name: "Mexican Peso" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "TWD", symbol: "NT$", name: "New Taiwan Dollar" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
  { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "ILS", symbol: "₪", name: "Israeli New Shekel" },
  { code: "CLP", symbol: "CLP$", name: "Chilean Peso" },
  { code: "COP", symbol: "COL$", name: "Colombian Peso" },
  { code: "PEN", symbol: "S/.", name: "Peruvian Sol" },
  { code: "ARS", symbol: "ARS$", name: "Argentine Peso" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
  { code: "RON", symbol: "lei", name: "Romanian Leu" },
  { code: "KZT", symbol: "₸", name: "Kazakhstani Tenge" },
  { code: "QAR", symbol: "﷼", name: "Qatari Riyal" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar" },
  { code: "BHD", symbol: ".د.ب", name: "Bahraini Dinar" },
  { code: "OMR", symbol: "﷼", name: "Omani Rial" },
  { code: "JOD", symbol: "د.ا", name: "Jordanian Dinar" },
  { code: "LBP", symbol: "ل.ل", name: "Lebanese Pound" },
  { code: "DZD", symbol: "د.ج", name: "Algerian Dinar" },
  { code: "MAD", symbol: "د.م.", name: "Moroccan Dirham" },
  { code: "TND", symbol: "د.ت", name: "Tunisian Dinar" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi" },
  { code: "UGX", symbol: "USh", name: "Ugandan Shilling" },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling" },
  { code: "ETB", symbol: "Br", name: "Ethiopian Birr" },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee" },
  { code: "NPR", symbol: "₨", name: "Nepalese Rupee" },
  { code: "MMK", symbol: "K", name: "Myanmar Kyat" },
  { code: "KHR", symbol: "៛", name: "Cambodian Riel" },
  { code: "LAK", symbol: "₭", name: "Lao Kip" },
  { code: "MVR", symbol: "Rf", name: "Maldivian Rufiyaa" },
  { code: "AFN", symbol: "؋", name: "Afghan Afghani" },
  { code: "IQD", symbol: "ع.د", name: "Iraqi Dinar" },
  { code: "IRR", symbol: "﷼", name: "Iranian Rial" },
  { code: "SYP", symbol: "£", name: "Syrian Pound" },
  { code: "YER", symbol: "﷼", name: "Yemeni Rial" },
  { code: "CRC", symbol: "₡", name: "Costa Rican Colón" },
  { code: "DOP", symbol: "RD$", name: "Dominican Peso" },
  { code: "GTQ", symbol: "Q", name: "Guatemalan Quetzal" },
  { code: "HNL", symbol: "L", name: "Honduran Lempira" },
  { code: "NIO", symbol: "C$", name: "Nicaraguan Córdoba" },
  { code: "PAB", symbol: "B/.", name: "Panamanian Balboa" },
  { code: "PYG", symbol: "₲", name: "Paraguayan Guaraní" },
  { code: "UYU", symbol: "$U", name: "Uruguayan Peso" },
  { code: "VEF", symbol: "Bs", name: "Venezuelan Bolívar" },
  { code: "ISK", symbol: "kr", name: "Icelandic Króna" },
  { code: "HRK", symbol: "kn", name: "Croatian Kuna" },
  { code: "BGN", symbol: "лв", name: "Bulgarian Lev" },
  { code: "GEL", symbol: "₾", name: "Georgian Lari" },
  { code: "AMD", symbol: "֏", name: "Armenian Dram" },
  { code: "AZN", symbol: "₼", name: "Azerbaijani Manat" },
  { code: "ALL", symbol: "L", name: "Albanian Lek" },
  { code: "BAM", symbol: "KM", name: "Bosnia-Herzegovina Mark" },
  { code: "MKD", symbol: "ден", name: "Macedonian Denar" },
  { code: "RSD", symbol: "дин.", name: "Serbian Dinar" },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrencyByCode: (code: string) => void;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(currencies[0]);

  useEffect(() => {
    const savedCurrencyCode = localStorage.getItem("currencyCode");
    if (savedCurrencyCode) {
      const found = currencies.find((c) => c.code === savedCurrencyCode);
      if (found) setCurrency(found);
    }
  }, []);

  const setCurrencyByCode = (code: string) => {
    const found = currencies.find((c) => c.code === code);
    if (found) {
      setCurrency(found);
      localStorage.setItem("currencyCode", code);
    }
  };

  const formatAmount = (amount: number) => {
    return `${currency.symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrencyByCode, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
