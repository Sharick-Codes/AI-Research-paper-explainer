import { getGeminiClient, generateContentWithFallback } from "./_gemini";

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
    const { paperText, history, message, title } = body;

    const customKey = (req.headers["x-gemini-api-key"] as string) || "";
    const ai = getGeminiClient(customKey);

    if (!ai) {
      return sendJson(res, 500, {
        error: "Gemini AI is not configured. Please add GEMINI_API_KEY in your Vercel Project Settings or under Settings > Gemini API Key in the app."
      });
    }

    if (!paperText || !message) {
      return sendJson(res, 400, { error: "Missing paperText or message parameter." });
    }

    const systemInstruction = `You are an expert interactive AI assistant for the research paper titled "${title || "Uploaded Research Paper"}". You must answer questions accurately using the provided research paper text. If the answer cannot be found or inferred from the paper, mention that, but do your best to explain general scientific concepts related to it if requested. Format your output nicely in Markdown. Here is the research paper content for reference:\n\n${paperText.slice(0, 40000)}`;

    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content || msg.text }],
    }));

    // Add current user message
    chatHistory.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await generateContentWithFallback(ai, {
      contents: chatHistory,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    return sendJson(res, 200, { response: response.text });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return sendJson(res, 500, {
      error: error?.message || "Failed to chat with Gemini API."
    });
  }
}
