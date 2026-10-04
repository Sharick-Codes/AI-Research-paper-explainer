import { callGemini, promptTemplates } from "./_gemini";

export const config = {
  maxDuration: 60,
};

function sendJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

async function getJsonBody(req: any): Promise<any> {
  if (req.body) {
    if (typeof req.body === "object") return req.body;
    if (typeof req.body === "string") {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
  }

  if (req.readableEnded || req.complete) {
    return {};
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
    req.on("error", () => resolve({}));
    setTimeout(() => resolve({}), 600);
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-gemini-api-key"
  );

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed. Use POST." });
  }

  try {
    const body: any = await getJsonBody(req);
    const { paperText, feature, title } = body;

    const apiKey = ((req.headers["x-gemini-api-key"] as string) || "").trim() || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return sendJson(res, 500, {
        error: "Gemini API key is not configured. Please add GEMINI_API_KEY in Vercel Environment Variables or in the Settings panel."
      });
    }

    if (!paperText || !feature) {
      return sendJson(res, 400, { error: "Missing paperText or feature parameter." });
    }

    const promptTemplate = promptTemplates[feature];
    if (!promptTemplate) {
      return sendJson(res, 400, { error: `Invalid feature type requested: ${feature}` });
    }

    const systemInstruction = `You are an expert AI research assistant. Your task is to explain and analyze the research paper titled "${title || "Uploaded Research Paper"}". Refer directly to the provided paper text to formulate your response. Be clear, professional, and educational. Format your response beautifully using Markdown.`;
    const userPrompt = `${promptTemplate}\n\nHere is the paper text:\n\n${paperText.slice(0, 40000)}`;

    const result = await callGemini(
      apiKey,
      [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction,
      0.2
    );

    return sendJson(res, 200, { result });
  } catch (error: any) {
    console.error("Error in /api/explain:", error);
    return sendJson(res, 500, {
      error: error?.message || "Failed to generate explanation from Gemini API."
    });
  }
}
