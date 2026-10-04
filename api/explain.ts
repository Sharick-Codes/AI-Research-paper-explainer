import { getGeminiClient, promptTemplates, generateContentWithFallback } from "./_gemini";

async function getJsonBody(req: any) {
  if (req.body && typeof req.body === "object") return req.body;
  if (req.body && typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk: any) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req: any, res: any) {
  // Support CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-gemini-api-key"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const body: any = await getJsonBody(req);
    const { paperText, feature, title } = body;

    const customKey = (req.headers["x-gemini-api-key"] as string) || "";
    const ai = getGeminiClient(customKey);

    if (!ai) {
      return res.status(500).json({
        error: "Gemini AI is not configured. Please add GEMINI_API_KEY in your Vercel Project Settings or under Settings > Gemini API Key in the app."
      });
    }

    if (!paperText || !feature) {
      return res.status(400).json({ error: "Missing paperText or feature parameter." });
    }

    const promptTemplate = promptTemplates[feature];
    if (!promptTemplate) {
      return res.status(400).json({ error: `Invalid feature type requested: ${feature}` });
    }

    const systemInstruction = `You are an expert AI research assistant. Your task is to explain and analyze the research paper titled "${title || "Uploaded Research Paper"}". Refer directly to the provided paper text to formulate your response. Be clear, professional, and educational. Format your response beautifully using Markdown.`;
    const userPrompt = `${promptTemplate}\n\nHere is the paper text:\n\n${paperText.slice(0, 100000)}`;

    const response = await generateContentWithFallback(ai, {
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    return res.status(200).json({ result: response.text });
  } catch (error: any) {
    console.error("Error in /api/explain:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate explanation from Gemini API."
    });
  }
}
