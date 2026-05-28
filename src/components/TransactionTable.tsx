import { useState, useMemo, FormEvent } from "react";
import { 
  ArrowUpDown, 
  Download, 
  Trash2, 
  Edit3, 
  Plus, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  Sparkles,
  ShoppingBag,
  ListFilter
} from "lucide-react";
import { Transaction } from "../types";
import { getProductCategory, getPaymentMethodTranslations } from "../data";

interface TransactionTableProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, "id">) => void;
  onEditTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

type SortField = "orderNumber" | "product" | "price" | "date" | "paymentMethod";
type SortOrder = "asc" | "desc";

export default function TransactionTable({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction
}: TransactionTableProps) {
  // Sorting state
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Add form toggle and content
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOrderNumber, setNewOrderNumber] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState("Credit Card");

  // Edit inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedProduct, setEditedProduct] = useState("");
  const [editedPrice, setEditedPrice] = useState("");
  const [editedDate, setEditedDate] = useState("");
  const [editedPayment, setEditedPayment] = useState("Credit Card");

  // Product catalog list for autofill
  const productCatalog = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.product))).sort();
  }, [transactions]);

  // Generate next order number
  const suggestedOrderNumber = useMemo(() => {
    const numbers = transactions
      .map(t => parseInt(t.orderNumber.replace("TT-", "")))
      .filter(num => !isNaN(num));
    if (numbers.length === 0) return "TT-1001";
    const nextNum = Math.max(...numbers) + 1;
    return `TT-${nextNum}`;
  }, [transactions]);

  // Handle Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Sorted list
  const sortedTransactions = useMemo(() => {
    const list = [...transactions];
    return list.sort((a, b) => {
      let valA: string | number = a[sortField];
      let valB: string | number = b[sortField];

      if (sortField === "price") {
        valA = Number(valA);
        valB = Number(valB);
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }

      // String sorting
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [transactions, sortField, sortOrder]);

  // Paginated list
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(transactions.length / itemsPerPage) || 1;

  // Handle form trigger
  const triggerAddForm = () => {
    setNewOrderNumber(suggestedOrderNumber);
    setNewProduct(productCatalog[0] || "Slim-Fit Denim Jeans");
    setNewPrice("88.00");
    setNewDate(new Date().toISOString().split("T")[0]);
    setNewPaymentMethod("Credit Card");
    setShowAddForm(!showAddForm);
  };

  // Submit Add form
  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newOrderNumber || !newProduct || !newPrice || !newDate) return;
    onAddTransaction({
      orderNumber: newOrderNumber,
      product: newProduct,
      price: parseFloat(newPrice) || 88.0,
      date: newDate,
      paymentMethod: newPaymentMethod
    });
    setShowAddForm(false);
  };

  // Edit trigger
  const startEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditedProduct(transaction.product);
    setEditedPrice(transaction.price.toString());
    setEditedDate(transaction.date);
    setEditedPayment(transaction.paymentMethod);
  };

  // Submit Edit
  const handleEditSubmit = (id: string) => {
    if (!editedProduct || !editedPrice || !editedDate) return;
    onEditTransaction({
      id,
      orderNumber: transactions.find(t => t.id === id)?.orderNumber || "TT-1000",
      product: editedProduct,
      price: parseFloat(editedPrice) || 88.0,
      date: editedDate,
      paymentMethod: editedPayment
    });
    setEditingId(null);
  };

  // Export current list to CSV file
  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    
    // Header
    const csvRows = ["id,Order Number,Product,Price,Date,Payment Method"];
    
    // Map entries
    transactions.forEach(t => {
      csvRows.push(`"${t.id}","${t.orderNumber}","${t.product}",${t.price},"${t.date}","${t.paymentMethod}"`);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `panel_ropa_ventas_filtrado_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPaymentBadgeColor = (method: string) => {
    switch (method) {
      case "Credit Card":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-350 border-blue-200/40";
      case "Debit Card":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-350 border-orange-200/40";
      case "eWallet":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-350 border-purple-200/40";
      case "Cash":
        return "bg-emerald-500/10 text-emerald-800 dark:text-emerald-350 border-emerald-200/40";
      default:
        return "bg-zinc-500/10 text-zinc-700 border-zinc-200/40";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div id="transactions-data-wrapper" className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden flex flex-col">
      
      {/* Table Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            Registro de Transacciones
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {transactions.length} registros corresponden a los filtros aplicados.
          </p>
        </div>

        <div className="flex gap-2.5 self-start">
          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded border border-slate-200 dark:border-zinc-700 bg-white hover:bg-slate-50 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
          
          <button
            id="btn-toggle-add-form"
            onClick={triggerAddForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Nueva Venta
          </button>
        </div>
      </div>

      {/* Tarea: Formulario Expandible para Añadir Venta */}
      {showAddForm && (
        <form 
          id="add-transaction-form" 
          onSubmit={handleAddSubmit} 
          className="bg-slate-50 dark:bg-zinc-850/50 border-b border-slate-200 dark:border-zinc-800/80 p-6 animate-slide-down space-y-4"
        >
          <div className="flex items-center justify-between gap-2 border-b border-dashed border-slate-200 dark:border-zinc-805 pb-2">
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-blue-600 animate-spin-slow" />
              Añadir Venta de Ropa al Registro en Estado (LocalState)
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="p-1 rounded hover:bg-slate-150 dark:hover:bg-zinc-800 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4" id="add-form-controls-row">
            
            {/* Pedido ID */}
            <div className="space-y-1">
              <label htmlFor="input-add-order" className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Código Pedido</label>
              <input
                id="input-add-order"
                type="text"
                required
                value={newOrderNumber}
                onChange={(e) => setNewOrderNumber(e.target.value)}
                placeholder="ej: TT-1099"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            {/* Producto Selección Dropdown */}
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="input-add-product" className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Modelo de Pantalón</label>
              <div className="flex gap-1.5">
                <select
                  id="input-add-product"
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  className="flex-1 px-2.5 py-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-slate-850 dark:text-slate-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none"
                >
                  {productCatalog.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="custom_p">-- Escribir otro --</option>
                </select>
                {/* if selected write own model */}
                {newProduct === "custom_p" && (
                  <input
                    id="input-add-custom-product"
                    type="text"
                    required
                    placeholder="Escribe modelo..."
                    onChange={(e) => setNewProduct(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none"
                  />
                )}
              </div>
            </div>

            {/* Precio */}
            <div className="space-y-1">
              <label htmlFor="input-add-price" className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Precio ($ USD)</label>
              <input
                id="input-add-price"
                type="number"
                step="0.01"
                min="10"
                max="500"
                required
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="98.00"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none font-mono font-semibold"
              />
            </div>

            {/* Fecha */}
            <div className="space-y-1">
              <label htmlFor="input-add-date" className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Fecha Venta</label>
              <input
                id="input-add-date"
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1 md:col-span-1">
              <label htmlFor="input-add-payment" className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Pago</label>
              <select
                id="input-add-payment"
                value={newPaymentMethod}
                onChange={(e) => setNewPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="eWallet">eWallet</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            {/* Button Submit row */}
            <div className="md:col-span-4 flex justify-end items-center gap-1.5 md:pt-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-300 text-slate-650 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                Guardar Venta
              </button>
            </div>

          </div>
        </form>
      )}

      {/* Main Grid View */}
      <div className="overflow-x-auto w-full">
        {transactions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-2">
            <ListFilter className="w-8 h-8 text-zinc-300 animate-bounce" />
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Ninguna orden satisface los criterios activos</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Prueba presionando "Reestablecer Filtros" arriba para reactivar todo el lote</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse" id="sales-data-table">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-850 text-zinc-500 dark:text-zinc-400 text-xs font-semibold border-b border-zinc-100 dark:border-zinc-800">
                
                {/* Pedido */}
                <th id="th-order" className="py-3 px-4 select-none cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors" onClick={() => handleSort("orderNumber")}>
                  <div className="flex items-center gap-1.5">
                    Pedido
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>

                {/* Prenda */}
                <th id="th-product" className="py-3 px-4 select-none cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors" onClick={() => handleSort("product")}>
                  <div className="flex items-center gap-1.5">
                    Prenda de Ropa / Pantalón
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>

                {/* Categoría */}
                <th className="py-3 px-4 text-zinc-400">
                  Categoría Estilo
                </th>

                {/* Precio */}
                <th id="th-price" className="py-3 px-4 select-none cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors" onClick={() => handleSort("price")}>
                  <div className="flex items-center gap-1.5">
                    Precio
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>

                {/* Fecha */}
                <th id="th-date" className="py-3 px-4 select-none cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors" onClick={() => handleSort("date")}>
                  <div className="flex items-center gap-1.5">
                    Fecha de Caja
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>

                {/* Pago */}
                <th id="th-payment" className="py-3 px-4 select-none cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors" onClick={() => handleSort("paymentMethod")}>
                  <div className="flex items-center gap-1.5">
                    Método
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>

                {/* Acciones */}
                <th className="py-3 px-4 text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-820 text-xs text-zinc-700 dark:text-zinc-300 font-sans">
              {paginatedTransactions.map((t) => {
                const isEditing = editingId === t.id;
                return (
                  <tr 
                    key={t.id} 
                    id={`row-${t.id}`}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30 transition-all font-sans"
                  >
                    
                    {/* ID */}
                    <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-150">
                      {t.orderNumber}
                    </td>

                    {/* Prenda / Modelo */}
                    <td className="py-3 px-4 font-medium max-w-[200px] truncate">
                      {isEditing ? (
                        <input
                          id={`edit-product-${t.id}`}
                          type="text"
                          value={editedProduct}
                          onChange={(e) => setEditedProduct(e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 rounded outline-none"
                        />
                      ) : (
                        t.product
                      )}
                    </td>

                    {/* Categoría derivado */}
                    <td className="py-3 px-4">
                      <span className="text-[10px] select-none font-bold text-zinc-450 uppercase px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                        {getProductCategory(t.product)}
                      </span>
                    </td>

                    {/* Precio $ */}
                    <td className="py-3 px-4 font-mono font-semibold text-zinc-900 dark:text-white">
                      {isEditing ? (
                        <input
                          id={`edit-price-${t.id}`}
                          type="number"
                          step="0.01"
                          value={editedPrice}
                          onChange={(e) => setEditedPrice(e.target.value)}
                          className="w-20 px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 rounded outline-none text-right font-mono"
                        />
                      ) : (
                        formatCurrency(t.price)
                      )}
                    </td>

                    {/* Fecha de compra */}
                    <td className="py-3 px-4 font-mono">
                      {isEditing ? (
                        <input
                          id={`edit-date-${t.id}`}
                          type="date"
                          value={editedDate}
                          onChange={(e) => setEditedDate(e.target.value)}
                          className="px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 rounded outline-none"
                        />
                      ) : (
                        t.date
                      )}
                    </td>

                    {/* Método de Pago */}
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <select
                          id={`edit-pay-${t.id}`}
                          value={editedPayment}
                          onChange={(e) => setEditedPayment(e.target.value)}
                          className="px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-303 rounded outline-none"
                        >
                          <option value="Credit Card">Credit Card</option>
                          <option value="Debit Card">Debit Card</option>
                          <option value="eWallet">eWallet</option>
                          <option value="Cash">Cash</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${getPaymentBadgeColor(t.paymentMethod)}`}>
                          {getPaymentMethodTranslations(t.paymentMethod)}
                        </span>
                      )}
                    </td>

                    {/* Acciones Inline CRUD */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              id={`btn-save-edit-${t.id}`}
                              onClick={() => handleEditSubmit(t.id)}
                              className="p-1 px-2 rounded-md bg-emerald-550 text-white hover:bg-emerald-650 flex items-center gap-0.5 text-[10px] font-bold cursor-pointer transition-all"
                              title="Guardar cambios"
                            >
                              <Check className="w-3 h-3" />
                              Guardar
                            </button>
                            <button
                              id={`btn-cancel-edit-${t.id}`}
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded-md bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                              title="Descartar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              id={`btn-trigger-edit-${t.id}`}
                              onClick={() => startEdit(t)}
                              className="p-1.5 rounded-lg border border-zinc-150 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-550 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all"
                              title="Modificar artículo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-delete-${t.id}`}
                              onClick={() => onDeleteTransaction(t.id)}
                              className="p-1.5 rounded-lg border border-zinc-150 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-zinc-550 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-450 cursor-pointer transition-all"
                              title="Eliminar de estado"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Bar */}
      {transactions.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-890/20 gap-3 text-xs" id="table-pagination-row">
          
          {/* Items per page Selector */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Filas por página:</span>
            <select
              id="pagination-items-select"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 font-semibold outline-none"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-zinc-400 font-medium">
              Viendo {Math.min(transactions.length, (currentPage - 1) * itemsPerPage + 1)}-
              {Math.min(transactions.length, currentPage * itemsPerPage)} de {transactions.length}
            </span>
          </div>

          {/* Page numbers */}
          <div className="flex items-center gap-1" id="pagination-buttons-cloud">
            <button
              id="btn-page-prev"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300 disabled:opacity-40 disabled:hover:bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                return (
                  <div key={p} className="flex items-center">
                    {prev && p - prev > 1 && (
                      <span className="px-2 text-zinc-400 font-bold">...</span>
                    )}
                    <button
                      id={`btn-page-num-${p}`}
                      onClick={() => setCurrentPage(p)}
                      className={`px-3 py-1.5 rounded font-bold border transition-all cursor-pointer ${
                        currentPage === p
                          ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                          : "border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {p}
                    </button>
                  </div>
                );
              })}

            <button
              id="btn-page-next"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300 disabled:opacity-40 disabled:hover:bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
