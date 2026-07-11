import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

// Verify Gemini API key is present
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not defined. AI functionality will be unavailable.");
}

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests (up to 10MB to accommodate images)
  app.use(express.json({ limit: "10mb" }));

  // API Status Endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      hasApiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // Chat Streaming Endpoint (Server-Sent Events)
  app.post("/api/chat/stream", async (req, res) => {
    // Enable Server-Sent Events headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const { messages, deepThinking, webSearch } = req.body;

      if (!messages || !Array.isArray(messages)) {
        res.write(`data: ${JSON.stringify({ error: "Invalid or empty messages history." })}\n\n`);
        res.end();
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.write(`data: ${JSON.stringify({ error: "Gemini API Key is missing. Please configure it in Settings > Secrets." })}\n\n`);
        res.end();
        return;
      }

      // 1. Set System Instruction based on features selected
      let systemInstruction = "";
      if (deepThinking) {
        systemInstruction = `You are a highly advanced AI assistant with deep reasoning, cognitive analysis, and complex problem-solving capabilities.
        
CRITICAL REQUIREMENT: For every query, you MUST perform a thorough, step-by-step thinking and reasoning process before providing your final answer.
You MUST wrap your entire thinking/reasoning process inside XML-like tags <thinking>...</thinking> at the very beginning of your response.

In your thinking process, you should:
- Deeply analyze the user's intent, core task, and unstated assumptions.
- Break down complex problems into bite-sized logic gates.
- Outline steps, consider alternative perspectives or solutions, and identify potential bugs or edge cases.
- Solve math or logic problems explicitly and self-correct your errors transparently.

Once you close the </thinking> tag, output your final, beautifully-structured, user-friendly, and complete response in clean Markdown.

Example format:
<thinking>
1. Identify the user's request details.
2. Formulate step-by-step logic.
3. Handle math/logic and resolve contradictions.
4. Draft final response.
</thinking>
The final response goes here...`;
      } else {
        systemInstruction = `You are "Sacred Path", a highly conversational, intelligent, and helpful AI companion modeled on ChatGPT.
Provide detailed, human-like, elegant, and structured responses in clean Markdown. Use code formatting, bullet points, and tables where applicable to make answers clear and professional.`;
      }

      // 2. Format history for Gemini SDK
      // Each Content object contains 'role' ('user' | 'model') and 'parts'
      const formattedContents = messages.map((msg: any) => {
        const parts: any[] = [];

        // If an image is provided, construct the inlineData part
        if (msg.image && msg.image.base64 && msg.image.mimeType) {
          parts.push({
            inlineData: {
              mimeType: msg.image.mimeType,
              data: msg.image.base64,
            },
          });
        }

        parts.push({ text: msg.content });

        return {
          role: msg.role === "user" ? "user" : "model",
          parts,
        };
      });

      // 3. Configure tools (like Google Search Grounding)
      const tools = webSearch ? [{ googleSearch: {} }] : undefined;

      // 4. Generate content stream
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          tools,
        },
      });

      let groundingSources: any[] | null = null;

      for await (const chunk of responseStream) {
        const textChunk = chunk.text || "";

        // Attempt to extract grounding metadata (web search citations) if present
        const searchChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (searchChunks && !groundingSources) {
          groundingSources = searchChunks
            .map((c: any) => ({
              title: c.web?.title || c.title || "Web Source",
              uri: c.web?.uri || c.uri || "",
            }))
            .filter((s: any) => s.uri);
        }

        // Send intermediate SSE chunk
        res.write(`data: ${JSON.stringify({ text: textChunk, groundingSources })}\n\n`);
      }

      // Signal completion
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      console.error("Streaming Chat Error:", error);
      res.write(`data: ${JSON.stringify({ error: error.message || "An error occurred during text generation." })}\n\n`);
      res.end();
    }
  });

  // Image Generation Endpoint
  app.post("/api/image/generate", async (req, res) => {
    try {
      const { prompt, aspectRatio } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "Prompt is required." });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({ error: "Gemini API Key is missing." });
        return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || "1:1",
            imageSize: "1K",
          },
        },
      });

      let imageUrl: string | null = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageUrl) {
        res.status(500).json({ error: "Failed to generate image." });
        return;
      }

      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Image Generation Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during image generation." });
    }
  });

  // Setup Vite Dev Server / Static Asset Hosting
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static assets in production mode.");
  }

  // Start Server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
  process.exit(1);
});
