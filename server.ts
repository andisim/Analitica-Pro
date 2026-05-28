import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Initialize server-side Gemini client
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route: AI-powered analytical assessment
  app.post("/api/analyze-with-ai", async (req, res) => {
    try {
      const { transactions, csvContext, fileName } = req.body;

      if (!apiKey) {
        return res.status(405).json({ 
          error: "GEMINI_API_KEY is not configured in your application settings. Please set it up in the panel." 
        });
      }

      // Prepare dataset context
      let datasetDescription = "";
      if (csvContext) {
        datasetDescription = `Se ha cargado un archivo CSV externo llamado "${fileName || 'datos_externos.csv'}".\nContenido/muestra del CSV:\n${csvContext}`;
      } else if (transactions && Array.isArray(transactions)) {
        datasetDescription = `Se están analizando ${transactions.length} registros del panel de ventas de pantalones.\nUna muestra de transacciones:\n${JSON.stringify(transactions.slice(0, 15), null, 2)}`;
      } else {
        return res.status(400).json({ error: "No se proporcionaron datos válidos para analizar." });
      }

      const prompt = `Analiza detalladamente los siguientes datos comerciales de venta de pantalones (jeans, chinos, formal, deportivos, sastreros, etc.) y provee un análisis interactivo de alta calidad comercial para el usuario actual:

${datasetDescription}

Debes responder ÚNICAMENTE con un objeto de tipo JSON válido con la siguiente estructura de datos en español:
{
  "summary": "Resumen ejecutivo explicando los hallazgos principales en un párrafo claro y profesional.",
  "metrics": [
    { "name": "Nombre de la Métrica", "value": "Valor o resultado", "change": "Cambio relativo (ej. +12.3% o N/A)", "trend": "up | down | neutral", "description": "Comentario corto justificativo" }
  ],
  "strengths": [
    "Punto fuerte o patrón de éxito identificado 1",
    "Punto fuerte o patrón de éxito identificado 2"
  ],
  "opportunities": [
    { "title": "Área de Oportunidad", "desc": "Descripción de cómo capitalizar esta área", "impact": "Alto | Medio | Bajo" }
  ],
  "recommendations": [
    "Recomendación estratégica de inventario, marketing o precios 1",
    "Recomendación estratégica de inventario, marketing o precios 2"
  ]
}

REGLAS CRÍTICAS:
1. Responde UNICAMENTE con el objeto JSON crudo. No incluyas marcas triple-comilla como \`\`\`json ni bloques de markdown.
2. Si los datos cargados no son formato de ventas estándar, adáptate y haz un análisis descriptivo del dataset cargado en la estructura JSON provista.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              metrics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.STRING },
                    change: { type: Type.STRING },
                    trend: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "value", "change", "trend", "description"]
                }
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              opportunities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    desc: { type: Type.STRING },
                    impact: { type: Type.STRING }
                  },
                  required: ["title", "desc", "impact"]
                }
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["summary", "metrics", "strengths", "opportunities", "recommendations"]
          }
        }
      });

      const responseText = response.text || "{}";
      try {
        const parsedJson = JSON.parse(responseText);
        res.json(parsedJson);
      } catch (parseError) {
        console.error("AI response parser error:", responseText, parseError);
        res.status(500).json({ 
          error: "El modelo no generó una respuesta en el formato JSON esperado.", 
          raw: responseText 
        });
      }

    } catch (err: any) {
      console.error("Gemini invocation error:", err);
      res.status(500).json({ error: err.message || "Error al invocar el motor de IA." });
    }
  });

  // Serve Vite assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on http://localhost:${PORT}`);
  });
}

startServer();
