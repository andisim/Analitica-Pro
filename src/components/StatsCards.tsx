import { motion } from "motion/react";
import { DollarSign, ShoppingBag, CreditCard, Tag, Landmark } from "lucide-react";
import { Transaction } from "../types";

interface StatsCardsProps {
  filteredTransactions: Transaction[];
  allTransactions: Transaction[];
}

export default function StatsCards({ filteredTransactions, allTransactions }: StatsCardsProps) {
  const totalRevenue = filteredTransactions.reduce((acc, t) => acc + t.price, 0);
  const totalOrdersCount = new Set(filteredTransactions.map(t => t.orderNumber)).size;
  const itemsSold = filteredTransactions.length;
  const averagePrice = itemsSold > 0 ? totalRevenue / itemsSold : 0;

  // Calculate comparisons
  const allRevenue = allTransactions.reduce((acc, t) => acc + t.price, 0);
  const percentageOfTotal = allRevenue > 0 ? (totalRevenue / allRevenue) * 100 : 0;

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2
    }).format(value);
  };

  const metrics = [
    {
      id: "stat-revenue",
      title: "Ingresos Totales",
      value: formatCurrency(totalRevenue),
      sub: `${percentageOfTotal.toFixed(1)}% del total general`,
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      id: "stat-orders",
      title: "Pedidos Únicos",
      value: totalOrdersCount,
      sub: `En ${new Set(allTransactions.map(t => t.orderNumber)).size} transacciones globales`,
      icon: ShoppingBag,
      color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20"
    },
    {
      id: "stat-items",
      title: "Pantalones Vendidos",
      value: itemsSold,
      sub: `${itemsSold} unidades seleccionadas`,
      icon: Tag,
      color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
    },
    {
      id: "stat-aov",
      title: "Precio Promedio/Prenda",
      value: formatCurrency(averagePrice),
      sub: `Valor medio de ticket unitario`,
      icon: Landmark,
      color: "text-purple-650 dark:text-purple-400 bg-purple-500/10 border-purple-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        return (
          <motion.div
            key={m.id}
            id={m.id}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
            className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between transition-all"
          >
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight uppercase">
                {m.title}
              </span>
              <span className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white font-mono">
                {m.value}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {m.sub}
              </span>
            </div>
            <div className={`p-2.5 rounded-lg ${m.color} bg-opacity-10 shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
