import { useState, useEffect, useMemo } from "react";
import { 
  BarChart3, 
  Moon, 
  Sun, 
  RefreshCcw, 
  User, 
  Calendar, 
  HelpCircle,
  TrendingUp,
  Tag
} from "lucide-react";
import { Transaction, DashboardFilters } from "./types";
import { initialTransactions, getPaymentMethodTranslations, getProductCategory } from "./data";
import StatsCards from "./components/StatsCards";
import FilterPanel from "./components/FilterPanel";
import ChartsColumn from "./components/ChartsColumn";
import InsightsPanel from "./components/InsightsPanel";
import TransactionTable from "./components/TransactionTable";
import AIAnalysisPanel from "./components/AIAnalysisPanel";

const LOCAL_STORAGE_KEY = "pantalones_store_transactions_v1";
const THEME_STORAGE_KEY = "pantalones_store_dark_mode";

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved ? saved === "true" : false;
  });

  // DB State (load from localStorage or use pre-parsed user dataset)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed parsing transactions from memory", e);
      }
    }
    return initialTransactions;
  });

  // Persist DB state on change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  // Persist Theme state
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, darkMode.toString());
  }, [darkMode]);

  // Filter conditions state
  const [filters, setFilters] = useState<DashboardFilters>(() => {
    const prices = transactions.map(t => t.price);
    const minPrice = prices.length > 0 ? Math.floor(Math.min(...prices)) : 58;
    const maxPrice = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 175;

    return {
      startDate: "2025-08-15",
      endDate: "2025-10-07",
      selectedProducts: [],
      selectedPaymentMethods: [],
      searchQuery: "",
      minPrice,
      maxPrice
    };
  });

  // Keep min/max filter bounds synchronized with state modifications
  useEffect(() => {
    const prices = transactions.map(t => t.price);
    const minCalculated = prices.length > 0 ? Math.floor(Math.min(...prices)) : 58;
    const maxCalculated = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 175;
    
    setFilters(prev => ({
      ...prev,
      minPrice: Math.max(minCalculated, prev.minPrice > maxCalculated ? minCalculated : prev.minPrice),
      maxPrice: Math.min(maxCalculated, prev.maxPrice < minCalculated ? maxCalculated : prev.maxPrice)
    }));
  }, [transactions]);

  // Reactive filtering calculation
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Date Bounds Check
      if (t.date < filters.startDate || t.date > filters.endDate) {
        return false;
      }

      // 2. Price Bounds Check
      if (t.price < filters.minPrice || t.price > filters.maxPrice) {
        return false;
      }

      // 3. Product Multi-select Check (Empty list means view all)
      if (filters.selectedProducts.length > 0 && !filters.selectedProducts.includes(t.product)) {
        return false;
      }

      // 4. Payment Method Check (Empty list means view all)
      if (filters.selectedPaymentMethods.length > 0 && !filters.selectedPaymentMethods.includes(t.paymentMethod)) {
        return false;
      }

      // 5. General Search Check
      if (filters.searchQuery.trim() !== "") {
        const query = filters.searchQuery.toLowerCase();
        const matchesProduct = t.product.toLowerCase().includes(query);
        const matchesOrder = t.orderNumber.toLowerCase().includes(query);
        const matchesPayment = getPaymentMethodTranslations(t.paymentMethod).toLowerCase().includes(query) || t.paymentMethod.toLowerCase().includes(query);
        const matchesCategory = getProductCategory(t.product).toLowerCase().includes(query);
        
        if (!matchesProduct && !matchesOrder && !matchesPayment && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filters]);

  // CRUD actions
  const handleAddTransaction = (newFields: Omit<Transaction, "id">) => {
    const newId = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    const completeTransaction: Transaction = {
      id: newId,
      ...newFields
    };
    setTransactions(prev => [completeTransaction, ...prev]);
  };

  const handleEditTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta venta de pantalones del registro?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  // Re-load initial static file data
  const handleReloadDemoData = () => {
    if (confirm("¿Deseas restablecer el registro completo a los datos iniciales de fábrica de la tienda? Se perderán las modificaciones locales.")) {
      setTransactions(initialTransactions);
      const prices = initialTransactions.map(t => t.price);
      setFilters({
        startDate: "2025-08-15",
        endDate: "2025-10-07",
        selectedProducts: [],
        selectedPaymentMethods: [],
        searchQuery: "",
        minPrice: Math.floor(Math.min(...prices)),
        maxPrice: Math.ceil(Math.max(...prices))
      });
    }
  };

  return (
    <div className={darkMode ? "dark min-h-screen font-sans bg-slate-950 text-slate-100 selection:bg-blue-600/20" : "min-h-screen font-sans bg-slate-50 text-slate-800 selection:bg-blue-100"} id="app-root-container">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 md:space-y-8" id="dashboard-wrapper">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-805 rounded-xl shadow-xs" id="dashboard-header">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-lg shadow-sm hover:rotate-6 transition-all shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                  ANALÍTICA PRO <span className="text-slate-400 dark:text-slate-500 font-normal">/ Panel de Control</span>
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-slate-150 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 rounded">
                  Vendas Analítico
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Panel interactivo avanzado de ventas y existencias para pantalones, chinos y mezclilla
              </p>
            </div>
          </div>

          {/* Identity & Theme controls */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto" id="header-identity-actions">
            
            {/* User Identity Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 text-xs">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-semibold text-slate-500">Analista Activo</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">andisimion08@gmail.com</span>
              </div>
            </div>

            {/* Time Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 text-xs font-mono">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">2026-05-28</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Trigger Reset default mock data */}
              <button
                id="btn-reimport-data"
                onClick={handleReloadDemoData}
                className="p-2.5 rounded-lg border border-slate-250 dark:border-zinc-700 bg-white hover:bg-slate-50 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-all cursor-pointer shadow-xs"
                title="Reiniciar a datos por defecto"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>

              {/* Theme toggle standard */}
              <button
                id="btn-toggle-theme"
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 rounded-lg border border-slate-250 dark:border-zinc-700 bg-white hover:bg-slate-50 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-all cursor-pointer shadow-xs"
                title={darkMode ? "Estilo Claro" : "Estilo Oscuro"}
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            </div>

          </div>
        </header>

        {/* METRIC STATS ROW */}
        <StatsCards 
          filteredTransactions={filteredTransactions} 
          allTransactions={transactions} 
        />

        {/* AI COPILOT & CSV IMPORT WORKSPACE */}
        <AIAnalysisPanel 
          currentTransactions={filteredTransactions} 
          onLoadCustomTransactions={(newTx) => {
            setTransactions(newTx);
            // Autofit filters based on the newly uploaded dataset
            const prices = newTx.map(t => t.price);
            const minCalculated = prices.length > 0 ? Math.floor(Math.min(...prices)) : 0;
            const maxCalculated = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 1000;
            
            const dates = newTx.map(t => t.date).sort();
            const minDate = dates.length > 0 ? dates[0] : "2025-01-01";
            const maxDate = dates.length > 0 ? dates[dates.length - 1] : "2026-12-31";

            setFilters({
              startDate: minDate,
              endDate: maxDate,
              selectedProducts: [],
              selectedPaymentMethods: [],
              searchQuery: "",
              minPrice: minCalculated,
              maxPrice: maxCalculated
            });
          }}
          onRestoreDefaultData={() => {
            setTransactions(initialTransactions);
            const prices = initialTransactions.map(t => t.price);
            setFilters({
              startDate: "2025-08-15",
              endDate: "2025-10-07",
              selectedProducts: [],
              selectedPaymentMethods: [],
              searchQuery: "",
              minPrice: Math.floor(Math.min(...prices)),
              maxPrice: Math.ceil(Math.max(...prices))
            });
          }}
        />

        {/* TWO-COLUMN CORE WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="core-bento-workspace">
          
          {/* LEFT COLUMN: FILTERS & ACTIONS */}
          <div className="lg:col-span-1 space-y-6 flex flex-col" id="workspace-left-col">
            <FilterPanel 
              filters={filters} 
              setFilters={setFilters} 
              allTransactions={transactions} 
            />
            
            <InsightsPanel 
              filteredTransactions={filteredTransactions} 
              allTransactions={transactions}
            />
          </div>

          {/* RIGHT COLUMN: INTERACTIVE VISUALIZATIONS */}
          <div className="lg:col-span-2 space-y-6 flex flex-col" id="workspace-right-col">
            <ChartsColumn 
              filteredTransactions={filteredTransactions} 
            />
          </div>

        </div>

        {/* BIG FULL WIDTH TRANSACTION GRID ROW */}
        <div className="w-full" id="workspace-table-row">
          <TransactionTable 
            transactions={filteredTransactions}
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        </div>

        {/* METICULOUS FOOTER DESIGN (No tech-Larping / clean humbleness) */}
        <footer className="py-6 border-t border-slate-200 dark:border-zinc-800 text-center flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-400 dark:text-slate-500 gap-3" id="dashboard-footer">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 font-medium">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span>Trousers Analytica &copy; 2026. Todos los derechos reservados.</span>
          </div>
          <div className="flex items-center justify-center sm:justify-end gap-1.5 font-mono text-[10px]">
            <Tag className="w-3.5 h-3.5" />
            <span>DB Status: {transactions.length} Pantalones cargados en estado local persistente.</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
