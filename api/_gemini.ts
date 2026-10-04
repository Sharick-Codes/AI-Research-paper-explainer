import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Default models fallback order with official verified Gemini model IDs
export const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-pro",
];

export function getGeminiClient(customApiKey?: string): GoogleGenAI | null {
  const apiKey = (customApiKey && customApiKey.trim().length > 0)
    ? customApiKey.trim()
    : process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI client:", err);
    return null;
  }
}

export async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  }
) {
  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    let retries = 1;
    while (retries >= 0) {
      try {
        console.log(`[Gemini] Attempting generateContent with model: ${model} (retries left: ${retries})`);
        const response = await ai.models.generateContent({
          ...params,
          model: model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errorString = String(err?.message || "").toLowerCase();
        console.error(`[Gemini] Error with model ${model}:`, err?.message || err);

        const isQuotaExceeded =
          err?.status === 429 ||
          errorString.includes("429") ||
          errorString.includes("quota") ||
          errorString.includes("rate limit") ||
          errorString.includes("exhausted");

        // Immediately switch model if quota exceeded or model not found
        if (isQuotaExceeded || err?.status === 404 || errorString.includes("not found")) {
          console.warn(`[Gemini] Model ${model} unavailable (quota/404). Falling back to next model...`);
          break;
        }

        const isTransient =
          err?.status === 503 ||
          errorString.includes("503") ||
          errorString.includes("temporary") ||
          errorString.includes("high demand") ||
          errorString.includes("unavailable");

        if (isTransient && retries > 0) {
          const delay = (2 - retries) * 1200;
          await new Promise((resolve) => setTimeout(resolve, delay));
          retries--;
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content with all available Gemini models.");
}

export const promptTemplates: Record<string, string> = {
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
