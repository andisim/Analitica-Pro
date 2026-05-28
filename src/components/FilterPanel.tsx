import { useState, useMemo, ChangeEvent } from "react";
import { Search, Calendar, CreditCard, RotateCcw, ChevronDown, ChevronUp, DollarSign, Filter } from "lucide-react";
import { DashboardFilters, Transaction } from "../types";
import { getPaymentMethodTranslations } from "../data";

interface FilterPanelProps {
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  allTransactions: Transaction[];
}

export default function FilterPanel({ filters, setFilters, allTransactions }: FilterPanelProps) {
  const [isProductFilterExpanded, setIsProductFilterExpanded] = useState(false);

  // Derive unique lists for options
  const uniqueProducts = useMemo(() => {
    return Array.from(new Set(allTransactions.map(t => t.product))).sort();
  }, [allTransactions]);

  // Unique payment methods
  const uniquePaymentMethods = useMemo(() => {
    return Array.from(new Set(allTransactions.map(t => t.paymentMethod))).sort();
  }, [allTransactions]);

  const priceBounds = useMemo(() => {
    if (allTransactions.length === 0) return { min: 0, max: 200 };
    const prices = allTransactions.map(t => t.price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices))
    };
  }, [allTransactions]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, searchQuery: e.target.value });
  };

  const handleProductToggle = (product: string) => {
    const isSelected = filters.selectedProducts.includes(product);
    const updatedSelected = isSelected
      ? filters.selectedProducts.filter(p => p !== product)
      : [...filters.selectedProducts, product];
    setFilters({ ...filters, selectedProducts: updatedSelected });
  };

  const handlePaymentToggle = (method: string) => {
    const isSelected = filters.selectedPaymentMethods.includes(method);
    const updatedSelected = isSelected
      ? filters.selectedPaymentMethods.filter(m => m !== method)
      : [...filters.selectedPaymentMethods, method];
    setFilters({ ...filters, selectedPaymentMethods: updatedSelected });
  };

  const handleDatePreset = (preset: "all" | "august" | "september" | "october") => {
    let startDate = "2025-08-15";
    let endDate = "2025-10-07";

    if (preset === "august") {
      startDate = "2025-08-15";
      endDate = "2025-08-31";
    } else if (preset === "september") {
      startDate = "2025-09-01";
      endDate = "2025-09-30";
    } else if (preset === "october") {
      startDate = "2025-10-01";
      endDate = "2025-10-07";
    }

    setFilters({ ...filters, startDate, endDate });
  };

  const handleSelectAllProducts = () => {
    setFilters({ ...filters, selectedProducts: uniqueProducts });
  };

  const handleClearProducts = () => {
    setFilters({ ...filters, selectedProducts: [] });
  };

  const handleResetAll = () => {
    setFilters({
      startDate: "2025-08-15",
      endDate: "2025-10-07",
      selectedProducts: [],
      selectedPaymentMethods: [],
      searchQuery: "",
      minPrice: priceBounds.min,
      maxPrice: priceBounds.max
    });
  };

  const isPresetActive = (preset: "all" | "august" | "september" | "october") => {
    if (preset === "all") {
      return filters.startDate === "2025-08-15" && filters.endDate === "2025-10-07";
    }
    if (preset === "august") {
      return filters.startDate === "2025-08-15" && filters.endDate === "2025-08-31";
    }
    if (preset === "september") {
      return filters.startDate === "2025-09-01" && filters.endDate === "2025-09-30";
    }
    if (preset === "october") {
      return filters.startDate === "2025-10-01" && filters.endDate === "2025-10-07";
    }
    return false;
  };

  return (
    <div id="filter-panel-container" className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-805 rounded-xl p-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-105 dark:bg-zinc-800 rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100">
            <Filter className="w-4 h-4 text-blue-600" id="filter-icon" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Filtros de Análisis</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Refina las visualizaciones del panel al instante</p>
          </div>
        </div>
        <button
          id="btn-reset-filters"
          onClick={handleResetAll}
          className="inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2 border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reestablecer Filtros
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="filter-controls-grid">
        {/* Tarea 1: Búsqueda de Productos y Número de Pedido */}
        <div className="space-y-2 flex flex-col" id="filter-search-box">
          <label htmlFor="search-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
            Búsqueda General
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              id="search-input"
              type="text"
              placeholder="Búsqueda por prenda, pedido..."
              value={filters.searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-md outline-none transition-all text-slate-900 dark:text-zinc-100 font-sans"
            />
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">
            Filtra por nombre o códigos de orden (ej: "TT-1054", "Denim")
          </div>
        </div>

        {/* Tarea 2: Filtro de Fecha con Preset */}
        <div className="space-y-2" id="filter-dates-section">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight block">
            Rango de Fechas
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                id="filter-start-date"
                type="date"
                min="2025-08-15"
                max="2025-10-07"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full pl-8 pr-1.5 py-1.5 text-xs bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-md text-slate-800 dark:text-zinc-200 outline-none"
              />
            </div>
            <span className="text-xs text-slate-400 font-bold">a</span>
            <div className="relative flex-1">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                id="filter-end-date"
                type="date"
                min="2025-08-15"
                max="2025-10-07"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full pl-8 pr-1.5 py-1.5 text-xs bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-md text-slate-800 dark:text-zinc-200 outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1" id="date-presets-row">
            <button
              id="preset-all"
              type="button"
              onClick={() => handleDatePreset("all")}
              className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                isPresetActive("all")
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-slate-350"
              }`}
            >
              Completo
            </button>
            <button
              id="preset-august"
              type="button"
              onClick={() => handleDatePreset("august")}
              className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                isPresetActive("august")
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-slate-350"
              }`}
            >
              Agosto
            </button>
            <button
              id="preset-september"
              type="button"
              onClick={() => handleDatePreset("september")}
              className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                isPresetActive("september")
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-655 dark:text-slate-300"
              }`}
            >
              Septiembre
            </button>
            <button
              id="preset-october"
              type="button"
              onClick={() => handleDatePreset("october")}
              className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                isPresetActive("october")
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-655 dark:text-slate-300"
              }`}
            >
              Octubre
            </button>
          </div>
        </div>

        {/* Tarea 3: Filtro de Método de Pago */}
        <div className="space-y-2" id="filter-payment-methods">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight block">
            Métodos de Pago
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
            {uniquePaymentMethods.map((method) => {
              const isSelected = filters.selectedPaymentMethods.includes(method);
              return (
                <button
                  key={method}
                  type="button"
                  id={`btn-pay-${method.replace(/\s+/g, "-")}`}
                  onClick={() => handlePaymentToggle(method)}
                  className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg border transition-all text-left font-semibold ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                      : "border-slate-200 dark:border-zinc-800 bg-slate-50 hover:bg-slate-100/70 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{getPaymentMethodTranslations(method)}</span>
                  </span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tarea 4: Precios Min y Max */}
        <div className="space-y-2 flex flex-col justify-between" id="filter-price-range">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight flex items-center justify-between">
              <span>Franja de Precios</span>
              <span className="text-[11px] text-slate-400 font-mono">
                ${filters.minPrice} - ${filters.maxPrice}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                <input
                  id="filter-min-price"
                  type="number"
                  min={priceBounds.min}
                  max={filters.maxPrice}
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: Math.max(priceBounds.min, parseInt(e.target.value) || 0) })}
                  className="w-full pl-6 pr-1 py-1 text-xs bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-md text-slate-800 dark:text-zinc-200 outline-none"
                  placeholder="Min"
                />
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                <input
                  id="filter-max-price"
                  type="number"
                  min={filters.minPrice}
                  max={priceBounds.max}
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: Math.min(priceBounds.max, parseInt(e.target.value) || 200) })}
                  className="w-full pl-6 pr-1 py-1 text-xs bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-md text-slate-800 dark:text-zinc-200 outline-none"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              id="collapse-product-list-toggle"
              type="button"
              onClick={() => setIsProductFilterExpanded(!isProductFilterExpanded)}
              className="w-full flex items-center justify-between py-2 px-3 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 transition-all border border-blue-100 dark:border-blue-900/10 cursor-pointer"
            >
              <span>{isProductFilterExpanded ? "Ocultar prendas individuales" : "Filtrar prendas individuales"}</span>
              {isProductFilterExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Tarea 5: Filtro Desplegable de Prendas */}
      {isProductFilterExpanded && (
        <div className="mt-6 pt-5 border-t border-dashed border-slate-200 dark:border-zinc-800" id="product-checklist-panel">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
              Selección por Prenda de Ropa ({filters.selectedProducts.length} seleccionadas)
            </h4>
            <div className="flex gap-2">
              <button
                id="product-select-all"
                type="button"
                onClick={handleSelectAllProducts}
                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Seleccionar Todo
              </button>
              <span className="text-slate-300 dark:text-zinc-700 text-xs">|</span>
              <button
                id="product-deselect-all"
                type="button"
                onClick={handleClearProducts}
                className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
              >
                Limpiar Selección
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2" id="products-checkbox-cloud">
            {uniqueProducts.map((prod) => {
              const isSelected = filters.selectedProducts.includes(prod);
              return (
                <label
                  key={prod}
                  className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer text-xs transition-all select-none ${
                    isSelected
                      ? "border-blue-400 bg-blue-50/40 dark:bg-blue-950/20 text-slate-800 dark:text-white font-medium"
                      : "border-slate-200 dark:border-zinc-800 bg-slate-50 hover:bg-slate-100/70 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleProductToggle(prod)}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 bg-white border-slate-300"
                  />
                  <span className="truncate">{prod}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
