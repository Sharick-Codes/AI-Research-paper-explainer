// Pure native REST implementation with zero runtime dependencies for 100% Vercel Serverless reliability

export const GEMINI_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-2.5-flash-lite",
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-3.8-flash"
];

export async function callGemini(
  apiKey: string,
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemInstruction?: string,
  temperature: number = 0.2
): Promise<string> {
  let lastError: any = null;

  const payload: any = {
    contents,
    generationConfig: {
      temperature,
    }
  };

  if (systemInstruction) {
    payload.system_instruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: any = await res.json();

      if (!res.ok) {
        lastError = new Error(data?.error?.message || `Gemini API error (${res.status})`);
        console.warn(`[Gemini REST] Model ${model} returned error:`, data?.error?.message);
        continue;
      }

      const candidate = data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini REST] Model ${model} fetch failed:`, err?.message);
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
