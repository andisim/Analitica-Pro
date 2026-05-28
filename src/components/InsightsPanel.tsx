import { useMemo } from "react";
import { Sparkles, Trophy, CreditCard, TrendingUp, AlertCircle, ShoppingBag, Lightbulb } from "lucide-react";
import { Transaction } from "../types";
import { getProductCategory, getPaymentMethodTranslations } from "../data";

interface InsightsPanelProps {
  filteredTransactions: Transaction[];
  allTransactions: Transaction[];
}

export default function InsightsPanel({ filteredTransactions, allTransactions }: InsightsPanelProps) {
  const insights = useMemo(() => {
    if (filteredTransactions.length === 0) return null;

    // 1. Calculate Revenue per Product to get the winner
    const productRevenues: { [product: string]: number } = {};
    const productQuantities: { [product: string]: number } = {};
    filteredTransactions.forEach(t => {
      productRevenues[t.product] = (productRevenues[t.product] || 0) + t.price;
      productQuantities[t.product] = (productQuantities[t.product] || 0) + 1;
    });

    let topProduct = "";
    let maxRevenue = 0;
    Object.entries(productRevenues).forEach(([product, rev]) => {
      if (rev > maxRevenue) {
        maxRevenue = rev;
        topProduct = product;
      }
    });

    // 2. Dominant Payment Method
    const paymentCounts: { [method: string]: number } = {};
    filteredTransactions.forEach(t => {
      paymentCounts[t.paymentMethod] = (paymentCounts[t.paymentMethod] || 0) + 1;
    });

    let topPayment = "";
    let maxPaymentCount = 0;
    Object.entries(paymentCounts).forEach(([method, count]) => {
      if (count > maxPaymentCount) {
        maxPaymentCount = count;
        topPayment = method;
      }
    });

    // 3. Peak date
    const dateRevenues: { [date: string]: number } = {};
    filteredTransactions.forEach(t => {
      dateRevenues[t.date] = (dateRevenues[t.date] || 0) + t.price;
    });

    let peakDate = "";
    let maxDateRevenue = 0;
    Object.entries(dateRevenues).forEach(([d, rev]) => {
      if (rev > maxDateRevenue) {
        maxDateRevenue = rev;
        peakDate = d;
      }
    });

    // 4. Group by category
    const categoryRevenues: { [cat: string]: number } = {};
    filteredTransactions.forEach(t => {
      const cat = getProductCategory(t.product);
      categoryRevenues[cat] = (categoryRevenues[cat] || 0) + t.price;
    });

    let topCategory = "";
    let maxCatRevenue = 0;
    Object.entries(categoryRevenues).forEach(([cat, rev]) => {
      if (rev > maxCatRevenue) {
        maxCatRevenue = rev;
        topCategory = cat;
      }
    });

    // Calculations of shares
    const currentRevenue = filteredTransactions.reduce((acc, t) => acc + t.price, 0);
    const topProductShare = currentRevenue > 0 ? (maxRevenue / currentRevenue) * 100 : 0;
    const topCategoryShare = currentRevenue > 0 ? (maxCatRevenue / currentRevenue) * 100 : 0;
    
    // Average price comparing
    const averagePrice = currentRevenue / filteredTransactions.length;
    const globalAveragePrice = allTransactions.reduce((acc, t) => acc + t.price, 0) / allTransactions.length;

    // Generar consejos dinámicos según el mes y los pantalones más vendidos
    let recommendation = "";
    if (topCategory.includes("Sastrería") || topCategory.includes("Formal")) {
      recommendation = "La sastrería formal (lana, pantalones de etiqueta) lidera las ventas en este intervalo. Es un momento propicio para lanzar paquetes corporativos o de eventos, y mantener inventario alto de cortes de lana fina.";
    } else if (topCategory.includes("Denim")) {
      recommendation = "La línea Denim & Overalls presenta una tracción sobresaliente. Considera promocionar chaquetas o chaquetones a juego para maximizar el ticket promedio mediante cross-selling de ropa de mezclilla.";
    } else if (topCategory.includes("Deportivo") || topCategory.includes("Athleisure")) {
      recommendation = "Los joggers y pantalones deportivos premium registran un excelente desempeño diario. Recomendamos campañas enfocadas en confort de teletrabajo o bienestar diario, optimizando el stock en tallas intermedias (M/L).";
    } else if (topCategory.includes("Casual") || topCategory.includes("Linen") || topCategory.includes("Seersucker")) {
      recommendation = "Los pantalones de lino y de aspecto casual para verano tienen alta frecuencia. Prepara remates de final de temporada estival y asocia estos artículos con camisas frescas para aumentar la rotación.";
    } else {
      recommendation = "Registras una mezcla de ventas balanceada. Sugerimos optimizar el catálogo digital destacando el top 3 de pantalones más vendidos en la cabecera e incentivando pagos digitales con pequeños descuentos.";
    }

    return {
      topProduct,
      topProductQty: productQuantities[topProduct],
      topProductRevenue: maxRevenue,
      topProductShare,
      topPayment: getPaymentMethodTranslations(topPayment),
      topPaymentCount: maxPaymentCount,
      peakDate,
      peakDateRevenue: maxDateRevenue,
      topCategory,
      topCategoryShare,
      isPremiumAverage: averagePrice > globalAveragePrice,
      averagePrice,
      recommendation
    };
  }, [filteredTransactions, allTransactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString + "T00:00:00").toLocaleDateString("es-ES", options);
  };

  if (!insights) {
    return null;
  }

  return (
    <div id="insights-panel" className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-805 rounded-xl p-6 shadow-xs flex flex-col space-y-5">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Análisis Avanzado & Insights Clave</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Extrapolación estadística en tiempo real de los pantalones seleccionados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="insights-bento-grid">
        {/* Insight 1: Producto Máximo */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 flex flex-col justify-between space-y-3" id="insight-top-product">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-350 uppercase tracking-widest bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded">
              Pantalón Estrella
            </span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate" title={insights.topProduct}>
              {insights.topProduct}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
              Ha generado <strong className="text-slate-700 dark:text-slate-200 font-bold font-mono">{formatCurrency(insights.topProductRevenue)}</strong> (unidades vendidas: {insights.topProductQty}).
            </p>
          </div>
          <div className="text-[11px] text-slate-450 dark:text-slate-500">
            Representa el <strong>{insights.topProductShare.toFixed(1)}%</strong> de estos ingresos acumulados.
          </div>
        </div>

        {/* Insight 2: Canal Favorito */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 flex flex-col justify-between space-y-3" id="insight-top-payment">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-350 uppercase tracking-widest bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded">
              Canal de Checkout
            </span>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">
              {insights.topPayment}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
              Es el método más solicitado, con <strong className="text-slate-700 dark:text-slate-200 font-bold font-mono">{insights.topPaymentCount}</strong> checkouts de clientes.
            </p>
          </div>
          <div className="text-[11px] text-slate-450 dark:text-slate-500">
            Agrupa la preferencia operativa en comercios de ropa.
          </div>
        </div>

        {/* Insight 3: Pico de Tracción */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 flex flex-col justify-between space-y-3" id="insight-peak-day">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-350 uppercase tracking-widest bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded">
              Pico de Caja
            </span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white">
              {formatDate(insights.peakDate)}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
              Se registró el pico de ventas con un total neto diario de <strong className="text-slate-700 dark:text-slate-200 font-bold font-mono">{formatCurrency(insights.peakDateRevenue)}</strong>.
            </p>
          </div>
          <div className="text-[11px] text-slate-450 dark:text-slate-500">
            Día de mayor convergencia y despachos.
          </div>
        </div>
      </div>

      {/* Recommended Area */}
      <div className="p-4 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850/50 flex items-start gap-3" id="insight-recommendations text">
        <div className="p-1.5 bg-blue-105 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg shrink-0 mt-0.5 bg-blue-50">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest block">
            RECOMENDACIÓN COMERCIAL EN {insights.topCategory.toUpperCase()}
          </span>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            {insights.recommendation} En promedio, las prendas comercializadas en estos filtros tienen un precio de <strong>{formatCurrency(insights.averagePrice)}</strong>, lo que representa un valor de ticket 
            {insights.isPremiumAverage ? (
              <span className="text-emerald-350 dark:text-emerald-400 font-semibold"> superior al promedio global de la tienda</span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400 font-semibold"> alineado con las gamas accesibles de la tienda</span>
            )}.
          </p>
        </div>
      </div>
    </div>
  );
}
