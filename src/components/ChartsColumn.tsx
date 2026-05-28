import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from "recharts";
import { TrendingUp, ShoppingBag, BarChart3, PieChartIcon, Activity } from "lucide-react";
import { Transaction } from "../types";
import { getProductCategory, getPaymentMethodTranslations } from "../data";

interface ChartsColumnProps {
  filteredTransactions: Transaction[];
}

export default function ChartsColumn({ filteredTransactions }: ChartsColumnProps) {
  const [activeTab, setActiveTab] = useState<"time" | "products" | "categories">("time");
  const [productMetric, setProductMetric] = useState<"revenue" | "quantity">("revenue");

  // Chart 1: Time Series Data
  const timeSeriesData = useMemo(() => {
    const dailyMap: { [date: string]: { date: string; revenue: number; items: number } } = {};
    
    // Group transactions by date
    filteredTransactions.forEach(t => {
      const dateStr = t.date;
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { date: dateStr, revenue: 0, items: 0 };
      }
      dailyMap[dateStr].revenue += t.price;
      dailyMap[dateStr].items += 1;
    });

    // Convert to sorted array
    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTransactions]);

  // Chart 2: Product Metrics Data
  const productData = useMemo(() => {
    const prodMap: { [name: string]: { name: string; revenue: number; quantity: number } } = {};
    
    filteredTransactions.forEach(t => {
      if (!prodMap[t.product]) {
        prodMap[t.product] = { name: t.product, revenue: 0, quantity: 0 };
      }
      prodMap[t.product].revenue += t.price;
      prodMap[t.product].quantity += 1;
    });

    return Object.values(prodMap).sort((a, b) => {
      if (productMetric === "revenue") {
        return b.revenue - a.revenue;
      }
      return b.quantity - a.quantity;
    });
  }, [filteredTransactions, productMetric]);

  // Chart 3: Payment Method Distribution
  const paymentMethodData = useMemo(() => {
    const payMap: { [method: string]: { name: string; value: number; count: number } } = {};
    
    filteredTransactions.forEach(t => {
      const TranslatedName = getPaymentMethodTranslations(t.paymentMethod);
      if (!payMap[t.paymentMethod]) {
        payMap[t.paymentMethod] = { name: TranslatedName, value: 0, count: 0 };
      }
      payMap[t.paymentMethod].value += t.price;
      payMap[t.paymentMethod].count += 1;
    });

    return Object.values(payMap);
  }, [filteredTransactions]);

  // Chart 4: Trousers Category distribution
  const categoryData = useMemo(() => {
    const catMap: { [cat: string]: { subject: string; value: number; revenue: number } } = {
      "Denim & Overalls": { subject: "Denim & Overalls", value: 0, revenue: 0 },
      "Sastrería & Formal": { subject: "Sastrería & Formal", value: 0, revenue: 0 },
      "Casual Trousers": { subject: "Casual Trousers", value: 0, revenue: 0 },
      "Chinos & Khakis": { subject: "Chinos & Khakis", value: 0, revenue: 0 },
      "Deportivo & Athleisure": { subject: "Deportivos", value: 0, revenue: 0 },
      "Trabajo & Workwear": { subject: "Trabajos", value: 0, revenue: 0 },
      "Shorts & Cargos": { subject: "Shorts & Cargos", value: 0, revenue: 0 }
    };

    filteredTransactions.forEach(t => {
      const cat = getProductCategory(t.product);
      if (catMap[cat]) {
        catMap[cat].value += 1;
        catMap[cat].revenue += t.price;
      }
    });

    return Object.values(catMap);
  }, [filteredTransactions]);

  // Color arrays for consistent thematic palettes
  const COLORS = ["#2563eb", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];
  const RADAR_COLORS = { stroke: "#2563eb", fill: "#2563eb", opacity: 0.15 };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0
    }).format(value);
  };

  // Custom tooltips to present a premium typography interface
  const CustomCurrencyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-950 p-3.5 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-sm">
          <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 tracking-normal mb-1">{label}</p>
          <p className="text-sm font-bold text-slate-800 dark:text-white font-mono">
            Ingreso: {formatCurrency(payload[0].value)}
          </p>
          {payload[1] && (
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
              Cantidad: {payload[1].value} prendas
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomProductTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-950 p-3.5 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-sm">
          <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mb-1">{data.name}</p>
          <p className="text-sm font-bold text-blue-650 dark:text-blue-400 font-mono">
            Ingresos: {formatCurrency(data.revenue)}
          </p>
          <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold">
            Unidades: <span className="font-mono font-bold text-slate-800 dark:text-white">{data.quantity}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-805 rounded-xl p-6 shadow-xs flex flex-col space-y-6" id="charts-main-panel">
      {/* Tab Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-850 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Visualizaciones de Datos
          </h3>
          <p className="text-xs text-slate-505 dark:text-slate-400">Analiza las métricas clave estructuradas de distintas maneras</p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-zinc-850 p-1 rounded-lg self-start" id="charts-tab-bar">
          <button
            id="tab-time"
            onClick={() => setActiveTab("time")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
              activeTab === "time"
                ? "bg-white dark:bg-zinc-800 text-blue-605 dark:text-blue-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Tendencias Temporales
          </button>
          
          <button
            id="tab-products"
            onClick={() => setActiveTab("products")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
              activeTab === "products"
                ? "bg-white dark:bg-zinc-800 text-blue-605 dark:text-blue-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Rendimiento Prendas
          </button>
          
          <button
            id="tab-categories"
            onClick={() => setActiveTab("categories")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
              activeTab === "categories"
                ? "bg-white dark:bg-zinc-800 text-blue-605 dark:text-blue-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Pagos y Categorías
          </button>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="h-72 flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl" id="no-charts-data">
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">Sin datos de gráficos para los filtros actuales</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Prueba reajustando la fecha, precios, o prendas seleccionadas</p>
        </div>
      ) : (
        <div className="min-h-[300px] flex items-center justify-center" id="charts-canvas-wrapper">
          {/* Manera 1: Tendencia Temporal */}
          {activeTab === "time" && (
            <div className="w-full space-y-2 animate-fade-in" id="time-chart-view">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                  Velocidad de Caja & Facturación Diaria
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-mono">
                  {timeSeriesData.length} Días Activos
                </span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.15)" />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "gray" }}
                      minTickGap={20}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "gray" }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip content={<CustomCurrencyTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                    <Area
                      type="monotone"
                      dataKey="items"
                      stroke="#10b981"
                      strokeWidth={1}
                      fill="none"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[11px] text-center text-zinc-400 dark:text-zinc-500 italic">
                Usa el tooltip para inspeccionar los picos de ventas y el recuento de existencias despachadas.
              </div>
            </div>
          )}

          {/* Manera 2: Top Products Bar Chart */}
          {activeTab === "products" && (
            <div className="w-full space-y-4 animate-fade-in" id="products-chart-view">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                  Desglose de Pantalones por Prenda
                </span>
                
                {/* Dynamic toggle tool */}
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50 self-start">
                  <button
                    id="btn-metric-revenue"
                    onClick={() => setProductMetric("revenue")}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      productMetric === "revenue"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                     }`}
                  >
                    Ventas ($)
                  </button>
                  <button
                    id="btn-metric-quantity"
                    onClick={() => setProductMetric("quantity")}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      productMetric === "quantity"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                    }`}
                  >
                    Unidades Vendidas (N)
                  </button>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={productData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(150, 150, 150, 0.15)" />
                    <XAxis 
                      type="number" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "gray" }}
                      tickFormatter={(v) => productMetric === "revenue" ? `$${v}` : v}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fontSize: 9, fill: "gray" }}
                      width={120}
                    />
                    <Tooltip content={<CustomProductTooltip />} />
                    <Bar 
                      dataKey={productMetric === "revenue" ? "revenue" : "quantity"} 
                      radius={[0, 4, 4, 0]}
                      barSize={12}
                    >
                      {productData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Manera 3: Categories & Payments layout */}
          {activeTab === "categories" && (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in" id="categories-chart-view">
              
              {/* Pie: Payment Methods */}
              <div className="space-y-3 flex flex-col" id="pay-method-donut-card">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-center md:text-left">
                  Métodos de Pago Preferidos
                </span>
                <div className="h-60 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), "Ingresos"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Decorative centered text inside donut chart */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase">VOLUMEN</span>
                    <span className="text-lg font-black text-zinc-800 dark:text-white font-mono">
                      {filteredTransactions.length}
                    </span>
                    <span className="text-[9px] text-zinc-400">prendas</span>
                  </div>
                </div>
                {/* Modern visual custom legends */}
                <div className="flex flex-wrap gap-2 justify-center" id="custom-legends-payment">
                  {paymentMethodData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-[10px] text-zinc-600 dark:text-zinc-300 font-medium">
                        {entry.name}: <span className="font-mono font-bold">{formatCurrency(entry.value)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Radar: Category distributions */}
              <div className="space-y-3 flex flex-col" id="product-category-radar-card">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-center md:text-left">
                  Matriz por Familia de Estilos (Unidades)
                </span>
                <div className="h-60 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryData}>
                      <PolarGrid stroke="rgba(130, 130, 130, 0.15)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "#888888", fontWeight: "medium" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 8 }} />
                      <Radar
                        name="Model Styles"
                        dataKey="value"
                        stroke={RADAR_COLORS.stroke}
                        fill={RADAR_COLORS.fill}
                        fillOpacity={RADAR_COLORS.opacity}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Mini category metrics below radar */}
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 text-center italic">
                  Las familias agrupan telas como Jeans de Mezclilla, Sastrería de Lana y Lino Fresco.
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
