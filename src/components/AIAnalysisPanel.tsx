import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { 
  Sparkles, 
  Upload, 
  FileSpreadsheet, 
  Trash2, 
  Database, 
  BrainCircuit, 
  ArrowRight,
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle2, 
  Flame,
  HelpCircle,
  Play,
  RotateCcw
} from "lucide-react";
import { Transaction } from "../types";

interface AIAnalysisPanelProps {
  currentTransactions: Transaction[];
  onLoadCustomTransactions: (newTransactions: Transaction[]) => void;
  onRestoreDefaultData: () => void;
}

interface AIMetric {
  name: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  description: string;
}

interface AIOpportunity {
  title: string;
  desc: string;
  impact: string;
}

interface AIAnalysisResult {
  summary: string;
  metrics: AIMetric[];
  strengths: string[];
  opportunities: AIOpportunity[];
  recommendations: string[];
}

export default function AIAnalysisPanel({ 
  currentTransactions, 
  onLoadCustomTransactions,
  onRestoreDefaultData 
}: AIAnalysisPanelProps) {
  // File state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [isCompatible, setIsCompatible] = useState(false);
  const [mappedTransactions, setMappedTransactions] = useState<Transaction[]>([]);
  
  // AI State
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading animation messages simulation
  const loadingSteps = [
    "Leyendo estructura del archivo...",
    "Limpiando tokens erróneos...",
    "Computando distribuciones de precios y categorías...",
    "Identificando patrones estacionales de venta...",
    "Consultando modelos predictivos de retail...",
    "Generando informe ejecutivo final..."
  ];

  // Drag handlers
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Safe split by comma ignoring commas inside quotes
  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let insideQuote = false;
    let entry = "";
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        result.push(entry.trim());
        entry = "";
      } else {
        entry += char;
      }
    }
    result.push(entry.trim());
    return result;
  };

  // Parse CSV File Client Side
  const processFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Solo se admiten archivos en formato .csv");
      return;
    }

    setError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length < 2) {
        setError("El archivo CSV no contiene suficientes filas.");
        return;
      }

      const headers = parseCSVLine(lines[0]);
      setCsvHeaders(headers);

      // Parse some rows for preview
      const previewRows: any[] = [];
      const parsedTransactionsList: Transaction[] = [];

      for (let i = 1; i < lines.length; i++) {
        const columns = parseCSVLine(lines[i]);
        if (columns.length < headers.length) continue;

        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = columns[idx] || "";
        });
        
        if (i <= 10) {
          previewRows.push(rowObj);
        }

        // Try mapping to Transactions standard
        parsedTransactionsList.push(rowObj);
      }

      setParsedRows(previewRows);

      // Analyze headers to see compatibility
      validateAndMapTransactions(headers, parsedTransactionsList);
    };

    reader.readAsText(file);
  };

  // Automatically maps custom headers/columns to App's required properties
  const validateAndMapTransactions = (headers: string[], rawRows: any[]) => {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    
    // Find index or key of best fits
    const findIndex = (keywords: string[]): number => {
      return normalizedHeaders.findIndex(nh => keywords.some(kw => nh.includes(kw)));
    };

    const orderIdx = findIndex(["order", "id", "pedido", "número", "num"]);
    const productIdx = findIndex(["product", "item", "producto", "nombre", "prenda", "pantalón", "pantalon"]);
    const priceIdx = findIndex(["price", "precio", "monto", "valor", "costo", "total", "cantidad", "usd"]);
    const dateIdx = findIndex(["date", "fecha", "día", "dia"]);
    const paymentIdx = findIndex(["payment", "pago", "método", "metodo"]);

    const satisfiesMinimum = productIdx !== -1 && priceIdx !== -1;

    if (!satisfiesMinimum) {
      setIsCompatible(false);
      setMappedTransactions([]);
      return;
    }

    // Map into standard transaction schema
    const results: Transaction[] = rawRows.map((row, i) => {
      const keys = Object.keys(row);
      
      const orderVal = orderIdx !== -1 ? row[keys[orderIdx]] : `PED-${1200 + i}`;
      const productVal = productIdx !== -1 ? row[keys[productIdx]] : "Pantalón Importado";
      const paymentVal = paymentIdx !== -1 ? row[keys[paymentIdx]] : "Efectivo";
      
      let dateVal = "2025-09-01";
      if (dateIdx !== -1) {
        let rawDate = row[keys[dateIdx]];
        // Attempt ISO extraction
        if (rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          dateVal = rawDate;
        } else if (rawDate) {
          // Fallback parsing or use raw
          dateVal = rawDate.split("/").reverse().join("-"); // tries DD/MM/YYYY
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
            dateVal = "2025-09-01";
          }
        }
      }

      let priceVal = 85.0;
      if (priceIdx !== -1) {
        const rawPrice = row[keys[priceIdx]];
        const cleaned = parseFloat(rawPrice.replace(/[^0-9.]/g, ""));
        if (!isNaN(cleaned)) {
          priceVal = cleaned;
        }
      }

      return {
        id: `custom-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        orderNumber: orderVal,
        product: productVal,
        price: priceVal,
        date: dateVal,
        paymentMethod: paymentVal
      };
    });

    setIsCompatible(true);
    setMappedTransactions(results);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setCsvHeaders([]);
    setIsCompatible(false);
    setMappedTransactions([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleApplyToDashboard = () => {
    if (mappedTransactions.length > 0) {
      onLoadCustomTransactions(mappedTransactions);
    }
  };

  // AI Generation Handler
  const handleRequestAIAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAiResult(null);

    // Dynamic steps loader simulation
    let currentStep = 0;
    setLoadingStep(0);
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length - 1) {
        currentStep++;
        setLoadingStep(currentStep);
      }
    }, 1200);

    try {
      let bodyData: any = {};
      if (selectedFile) {
        // Send a representative sample or string lines of the CSV file to avoid huge token costs
        const headers = csvHeaders.join(",");
        const rowsSample = parsedRows.slice(0, 30).map(r => Object.values(r).join(",")).join("\n");
        bodyData = {
          csvContext: `${headers}\n${rowsSample}`,
          fileName: selectedFile.name
        };
      } else {
        // Send current visible transaction data
        bodyData = {
          transactions: currentTransactions.slice(0, 100) // top 100 to fit request contexts
        };
      }

      const response = await fetch("/api/analyze-with-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const resErr = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(resErr.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setAiResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "No se pudo generar el análisis. Asegúrate de tener una conexión de red estable y una API Key configurada.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-805 rounded-xl p-6 shadow-xs space-y-6" id="ai-workspace-panel">
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-lg shadow-sm">
            <BrainCircuit className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              Copiloto IA & Importador CSV
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Carga tus propios conjuntos de datos e invoca recomendaciones predictivas con Gemini
            </p>
          </div>
        </div>

        {/* Restore default button */}
        <button
          onClick={onRestoreDefaultData}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-750 text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all font-medium cursor-pointer shadow-2xs"
          title="Restaurar datos de muestra de la tienda"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Tienda</span>
        </button>
      </div>

      {/* CORE TWO FLEX AREA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="uploader-analyzer-grid">
        
        {/* LEFT COLUMN: FILE DROP ZONE */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-450 uppercase tracking-wider block">
            Cargar un archivo .CSV personalizado
          </label>

          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragActive 
                  ? "border-blue-500 bg-blue-50/20 dark:bg-blue-900/10" 
                  : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/10"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="p-3 bg-white dark:bg-zinc-850 rounded-full border border-slate-100 dark:border-zinc-800 shadow-3xs mb-3 text-slate-400 dark:text-zinc-500">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                Arrastra tu archivo CSV aquí, o <span className="text-blue-600 dark:text-blue-400 underline font-semibold">explora archivos</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-2 font-mono">
                Soporta columnas de Ventas (Producto, Precio, Fecha, Pago, etc.)
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 bg-slate-50/30 dark:bg-zinc-900/10 space-y-3">
              <div className="flex items-center justify-between gap-3 bg-white dark:bg-zinc-850 p-3 rounded-lg border border-slate-150 dark:border-zinc-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                    <FileSpreadsheet className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate" title={selectedFile.name}>
                      {selectedFile.name}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-450 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB &bull; {parsedRows.length} filas leídas
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all cursor-pointer"
                  title="Remover archivo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Header mapped metrics info */}
              <div className="text-xs space-y-2 p-1">
                {isCompatible ? (
                  <div className="flex items-center gap-1 text-emerald-650 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>¡Columnas compatibles mapeadas con éxito!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-amber-650 dark:text-amber-400 font-medium leading-tight">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Headers genéricos. Se puede analizar por IA pero no cargar en el dashboard.</span>
                  </div>
                )}
                
                {/* Visual Preview rows of data */}
                <div className="bg-white dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 rounded-lg p-2.5 overflow-hidden">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Vista previa de columnas detectadas</span>
                  <div className="flex flex-wrap gap-1 shadow-2xs p-1 bg-slate-50 dark:bg-zinc-900/20 rounded">
                    {csvHeaders.slice(0, 5).map((h, i) => (
                      <span key={i} className="text-[9px] font-mono bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-350 px-1.5 py-0.5 rounded border border-slate-100 dark:border-zinc-750">
                        {h}
                      </span>
                    ))}
                    {csvHeaders.length > 5 && <span className="text-[9px] text-slate-400 font-semibold">+{csvHeaders.length - 5} más</span>}
                  </div>
                </div>
              </div>

              {/* Action columns mapper */}
              {isCompatible && (
                <button
                  onClick={handleApplyToDashboard}
                  className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-white font-medium text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-slate-900/10"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Cargar {mappedTransactions.length} registros en el Dashboard</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: IA PROMPT & TRIGGER */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-450 uppercase tracking-wider block">
              Accionar Consultoría de Inteligencia Artificial
            </label>
            
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="¿Qué te gustaría encontrar? Ej: 'Qué marcas de lino tienen mejor penetración y cómo estructuro la campaña de marketing estival?' u opcionalmente déjalo vacío para el escaneo por defecto de tendencias"
              className="w-full h-24 text-xs p-3 rounded-lg border border-slate-250 dark:border-zinc-750 bg-slate-50/20 dark:bg-zinc-950/20 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none font-sans"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleRequestAIAnalysis}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                loading 
                  ? "bg-slate-400 dark:bg-zinc-700 cursor-not-allowed" 
                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 shadow-blue-500/10"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>
                {loading 
                  ? "Computando Análisis Avanzado..." 
                  : selectedFile 
                    ? "Generar consultoría IA de este CSV" 
                    : "Generar consultoría IA del Dashboard"}
              </span>
            </button>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center leading-relaxed">
              Gemini analizará de punta a punta las correlaciones de ventas en tiempo real, elaborando un reporte de alto impacto útil para marketing y logística.
            </p>
          </div>
        </div>

      </div>

      {/* ERROR FEEDBACK ROW */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 text-xs text-red-650 dark:text-red-400 leading-relaxed font-sans flex items-start gap-2">
          <Flame className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block mb-0.5">Atención</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* LOADING SECTION STATE */}
      {loading && (
        <div className="p-8 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-blue-500/10 border-t-blue-600 animate-spin"></div>
            <div className="absolute p-2.5 bg-white dark:bg-zinc-850 rounded-full border border-slate-100 dark:border-zinc-800 shadow-sm text-blue-600">
              <BrainCircuit className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {loadingSteps[loadingStep]}
            </h4>
            <p className="text-[10px] text-slate-400 font-sans">
              Extrayendo valor semántico y ratios de correlación del negocio...
            </p>
          </div>
        </div>
      )}

      {/* AI INTELLIGENCE COMPLETED REPORT */}
      {aiResult && (
        <div className="p-6 rounded-xl border border-slate-202 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-950/10 space-y-6 animate-fade-in" id="ai-report-complete">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm animate-ping"></div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Reporte de Negocios de Gemini Completo
            </span>
          </div>

          {/* executive summary card */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Resumen Ejecutivo
            </h3>
            <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-sans bg-white dark:bg-zinc-850 p-4 rounded-xl border border-slate-150 dark:border-zinc-800 shadow-3xs">
              {aiResult.summary}
            </p>
          </div>

          {/* AI Custom KPI Metrics Cards */}
          {aiResult.metrics && aiResult.metrics.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Métricas Calculadas por IA
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {aiResult.metrics.map((metric, i) => (
                  <div key={i} className="bg-white dark:bg-zinc-850 p-4 rounded-xl border border-slate-150 dark:border-zinc-800 flex flex-col justify-between gap-2 shadow-3xs">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate block" title={metric.name}>
                      {metric.name}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-slate-800 dark:text-white font-mono">
                        {metric.value}
                      </span>
                      {metric.change && metric.change !== "N/A" && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                          metric.trend === "up" 
                            ? "bg-emerald-50 dark:bg-emerald-550/10 text-emerald-600 dark:text-emerald-400" 
                            : metric.trend === "down"
                              ? "bg-rose-50 dark:bg-rose-550/10 text-rose-600 dark:text-rose-400"
                              : "bg-slate-50 dark:bg-zinc-840 text-slate-500"
                        }`}>
                          {metric.trend === "up" && <TrendingUp className="w-2.5 h-2.5" />}
                          {metric.trend === "down" && <TrendingDown className="w-2.5 h-2.5" />}
                          <span>{metric.change}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug font-sans">
                      {metric.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Growth Areas Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* STRENGTHS */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Fortalezas de Ventas Detectadas
              </h3>
              <div className="bg-white dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 rounded-xl p-4 divide-y divide-slate-100 dark:divide-zinc-800">
                {aiResult.strengths.map((strength, i) => (
                  <div key={i} className="flex gap-2.5 py-3 first:pt-0 last:pb-0 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-650 dark:text-slate-300 font-sans leading-relaxed">
                      {strength}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* OPPORTUNITIES */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Oportunidades de Crecimiento Comercial
              </h3>
              <div className="bg-white dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 rounded-xl p-4 divide-y divide-slate-100 dark:divide-zinc-800">
                {aiResult.opportunities.map((opp, i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                        {opp.title}
                      </h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        opp.impact === "Alto" 
                          ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400" 
                          : opp.impact === "Medio"
                            ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                            : "bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-slate-400"
                      }`}>
                        Impacto {opp.impact}
                      </span>
                    </div>
                    <p className="text-xs text-slate-550 dark:text-slate-350 font-sans leading-relaxed">
                      {opp.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Actionable recommendations list */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Plan de Acción Recomendado (Logística & Marketing)
            </h3>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-zinc-850 dark:to-zinc-850/60 p-4 rounded-xl border border-blue-105/50 dark:border-zinc-800 space-y-3">
              {aiResult.recommendations.map((rec, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <div className="p-1 bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 rounded-full shrink-0 mt-0.5 border border-slate-100 dark:border-zinc-700 shadow-3xs">
                    <Play className="w-2.5 h-2.5 fill-current text-blue-500" />
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-205 font-sans leading-relaxed">
                    {rec}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
