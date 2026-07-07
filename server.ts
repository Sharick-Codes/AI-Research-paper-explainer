import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini client safely
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } else {
    console.warn("GEMINI_API_KEY environment variable is not defined.");
  }
} catch (err) {
  console.error("Failed to initialize Gemini AI client:", err);
}

// Robust fallback and retry wrapper for Gemini Content Generation to prevent 503 Service Unavailable errors
async function generateContentWithFallback(ai: GoogleGenAI, params: {
  contents: any;
  config?: any;
}) {
  const models = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];
  let lastError: any = null;

  for (const model of models) {
    let retries = 2; // Try up to 3 times per model (initial + 2 retries)
    while (retries >= 0) {
      try {
        console.log(`Attempting generateContent with model: ${model}, retries left: ${retries}`);
        const response = await ai.models.generateContent({
          ...params,
          model: model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.error(`Error with model ${model} (retries remaining: ${retries}):`, err);
        
        const errorString = String(err.message || "").toLowerCase();
        
        // If it is a 429 or quota/rate limit error, do NOT retry this model. Switch to the next model immediately!
        const isQuotaExceeded = err.status === 429 || 
                                errorString.includes("429") || 
                                errorString.includes("quota") || 
                                errorString.includes("rate limit") || 
                                errorString.includes("exhausted");
        
        if (isQuotaExceeded) {
          console.warn(`Quota exceeded for model ${model}. Switching to next model immediately...`);
          break; // Break the while loop to go to the next model in the for loop
        }

        // If it is a 503 or other transient network error, retry after a brief delay
        const isTransient = err.status === 503 || 
                            errorString.includes("503") || 
                            errorString.includes("temporary") || 
                            errorString.includes("high demand") || 
                            errorString.includes("unavailable");
        
        if (isTransient && retries > 0) {
          const delay = (3 - retries) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          retries--;
        } else {
          // If we run out of retries, or if it is not transient, break to try the next fallback model
          break;
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content with all available models.");
}

const promptTemplates: Record<string, string> = {
  summary: "Provide a comprehensive summary of this research paper. Highlight the core problem solved, the methodology, key findings, and the main contributions.",
  sections: "Provide a section-by-section breakdown of the paper and explain each major section (such as Introduction, Related Work, Method, Experiments, Conclusion) in a clear, student-friendly way.",
  abstract: "Explain the abstract of this paper in extremely simple terms, as if explaining to a 10-year-old student.",
  introduction: "Break down the Introduction of this paper. Explain what motivated this research, the background context, and the primary objectives.",
  litReview: "Summarize the literature review or related work section. Explain what previous research had done, what limitations existed, and how this paper builds upon them.",
  methodology: "Explain the methodology of this paper in step-by-step detail. How did the authors design their experiment, framework, or system? Explain the logical steps.",
  algorithm: "Analyze the core algorithms, pseudocode, or mathematical models used in this paper. Explain how they work conceptually and step-by-step.",
  dataset: "Detail the datasets, data sources, and preprocessing steps mentioned in the paper. What data was used, how was it gathered, and what were its characteristics?",
  results: "Provide a detailed analysis of the results. What did the experiments prove? Explain any graphs, metrics (precision, recall, accuracy, etc.), or tables conceptually.",
  conclusion: "Summarize the conclusion of this paper. What are the key takeaways, and what claims do the authors make about their work?",
  futureScope: "What are the future work directions or future scope suggested by the authors or implied by their findings?",
  researchGap: "Identify the research gap(s) this paper addresses and any remaining gaps or limitations in their current work.",
  dictionary: "Create a technical terms dictionary for this paper. List key acronyms, complex jargon, and domain-specific terms with clear definitions.",
  formula: "List and explain the key formulas, equations, or mathematical notation in this paper, explaining what each variable represents and the overall meaning of the formulas.",
  flowchart: "Generate a text-based ASCII flowchart or Mermaid.js markdown block representation showing the sequence of steps, data flow, or system architecture of the paper.",
  implementation: "Provide a step-by-step implementation guide (such as conceptual python/pseudo-code, system setup steps, or API calls) for a developer who wants to recreate or adapt the paper's findings.",
  viva: "List 10 potential viva or presentation defense questions about this paper along with professional, comprehensive sample answers.",
  quiz: "Generate a multiple-choice quiz (5 questions with options A, B, C, D and marked correct answers) based on the core contents of this paper for testing comprehension.",
  ppt: "Create a comprehensive PowerPoint presentation slide-by-slide outline (e.g., Slide 1: Title & Authors, Slide 2: Motivation, etc.) for presenting this paper.",
  takeaways: "Provide the key takeaways, practical contributions, and real-world implications of this paper.",
  diagrams: "Generate a Mermaid.js diagram or an ASCII visual diagram illustrating the architecture, flowchart, or main concept of this paper.",
  notes: "Generate detailed study notes, categorized bullet points, and formulas of this paper for easy memorization and review."
};

// API: Explain Research Paper Feature
app.post("/api/explain", async (req, res) => {
  const { paperText, feature, title } = req.body;

  if (!ai) {
    return res.status(500).json({ error: "Gemini AI client is not configured. Please set GEMINI_API_KEY." });
  }

  if (!paperText || !feature) {
    return res.status(400).json({ error: "Missing paperText or feature parameter." });
  }

  const promptTemplate = promptTemplates[feature];
  if (!promptTemplate) {
    return res.status(400).json({ error: "Invalid feature type requested." });
  }

  try {
    const systemInstruction = `You are an expert AI research assistant. Your task is to explain and analyze the research paper titled "${title || "Uploaded Research Paper"}". Refer directly to the provided paper text to formulate your response. Be clear, professional, and educational. Format your response beautifully using Markdown.`;
    
    const userPrompt = `${promptTemplate}\n\nHere is the paper text:\n\n${paperText.slice(0, 100000)}`; // Slice text to stay within comfortable limits

    const response = await generateContentWithFallback(ai, {
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
      }
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error("Error generating explanation:", error);
    res.status(500).json({ error: error.message || "Failed to generate explanation from Gemini API." });
  }
});

// API: AI Chat Assistant
app.post("/api/chat", async (req, res) => {
  const { paperText, history, message, title } = req.body;

  if (!ai) {
    return res.status(500).json({ error: "Gemini AI client is not configured. Please set GEMINI_API_KEY." });
  }

  if (!paperText || !message) {
    return res.status(400).json({ error: "Missing paperText or message parameter." });
  }

  try {
    const systemInstruction = `You are an expert interactive AI assistant for the research paper titled "${title || "Uploaded Research Paper"}". You must answer questions accurately using the provided research paper text. If the answer cannot be found or inferred from the paper, mention that, but do your best to explain general scientific concepts related to it if requested. Format your output nicely in Markdown. Here is the research paper content for reference:\n\n${paperText.slice(0, 100000)}`;

    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content || msg.text }]
    }));

    // Add the user message as the final item
    chatHistory.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await generateContentWithFallback(ai, {
      contents: chatHistory,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
      }
    });

    res.json({ response: response.text });
  } catch (error: any) {
    console.error("Error in AI Chat:", error);
    res.status(500).json({ error: error.message || "Failed to chat with Gemini API." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
