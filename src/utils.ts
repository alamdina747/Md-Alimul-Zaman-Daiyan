import { ChatSession, AppSettings, Message } from "./types";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import * as XLSX from "xlsx";
import PptxGenJS from "pptxgenjs";
import { saveAs } from "file-saver";

/**
 * Parses raw text content from the Gemini API and separates the step-by-step
 * reasoning process (wrapped in <thinking>...</thinking>) from the final friendly output.
 * Fully supports real-time streaming where tags may be opened but not yet closed.
 */
export function parseThinkingAndResponse(content: string): { thinking?: string; response: string } {
  if (!content) return { response: "" };

  const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/i;
  const match = content.match(thinkingRegex);

  if (match) {
    const thinking = match[1].trim();
    // Remove the entire <thinking>...</thinking> block from the response
    const response = content.replace(thinkingRegex, "").trim();
    return { thinking, response };
  }

  // Handle incomplete or streaming thinking block (opened but not closed yet)
  const openTag = "<thinking>";
  const openIndex = content.toLowerCase().indexOf(openTag);
  
  if (openIndex !== -1) {
    const closeTag = "</thinking>";
    const closeIndex = content.toLowerCase().indexOf(closeTag);
    
    if (closeIndex !== -1) {
      // Both open and closed but regex failed for some reason
      const thinking = content.slice(openIndex + openTag.length, closeIndex).trim();
      const response = (content.slice(0, openIndex) + content.slice(closeIndex + closeTag.length)).trim();
      return { thinking, response };
    } else {
      // Open but not closed (active thinking in the stream)
      const thinking = content.slice(openIndex + openTag.length).trim();
      const response = content.slice(0, openIndex).trim();
      return { thinking, response };
    }
  }

  return { response: content };
}

/**
 * Converts a File object into a Promise that resolves with its base64 string
 * and mimeType for sending directly to the Gemini API.
 */
export interface Base64Image {
  mimeType: string;
  base64: string;
}

export function fileToBase64(file: File): Promise<Base64Image> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Extract only the base64 part (excluding the data:image/png;base64, prefix)
      const base64Parts = result.split(",");
      if (base64Parts.length === 2) {
        resolve({
          mimeType: file.type,
          base64: base64Parts[1],
        });
      } else {
        reject(new Error("Failed to parse base64 file data."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Load chat sessions from local storage
 */
export function loadSessions(): ChatSession[] {
  try {
    const data = localStorage.getItem("gemini_chat_sessions");
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load chat sessions:", e);
    return [];
  }
}

/**
 * Save chat sessions to local storage
 */
export function saveSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem("gemini_chat_sessions", JSON.stringify(sessions));
  } catch (e) {
    console.error("Failed to save chat sessions:", e);
  }
}

/**
 * Load app settings
 */
export function loadSettings(): AppSettings {
  const defaultSettings: AppSettings = {
    defaultDeepThinking: true,
    defaultWebSearch: false,
    userAvatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=avatar",
    userName: "User",
  };

  try {
    const data = localStorage.getItem("gemini_chat_settings");
    return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
  } catch (e) {
    return defaultSettings;
  }
}

/**
 * Save app settings
 */
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem("gemini_chat_settings", JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

/**
 * Formats timestamps in a human-friendly relative way
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export async function exportToDocx(messages: Message[]) {
  const children: Paragraph[] = [];
  children.push(new Paragraph({ 
    text: "Chat History", 
    heading: HeadingLevel.HEADING_1,
    alignment: "center"
  }));
  
  messages.forEach(m => {
    children.push(new Paragraph({
      text: "--------------------------------------------------",
      spacing: { before: 200 }
    }));
    children.push(new Paragraph({
      text: m.role.toUpperCase(),
      heading: HeadingLevel.HEADING_3,
      shading: { fill: "f3f3f3" },
      spacing: { before: 200, after: 100 }
    }));
    children.push(new Paragraph({
      text: m.content,
      spacing: { after: 200, before: 100 }
    }));
  });

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, "chat-export.docx");
}

export function exportToExcel(messages: Message[]) {
  const worksheet = XLSX.utils.json_to_sheet(messages.map(m => ({ Role: m.role.toUpperCase(), Content: m.content })));
  
  // Set column widths (rough estimate as xlsx library doesn't easily style)
  worksheet["!cols"] = [{ wch: 15 }, { wch: 80 }];
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Chat");
  XLSX.writeFile(workbook, "chat-export.xlsx");
}

export function exportToPptx(messages: Message[]) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  
  // Title Slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: "f3f3f3" };
  titleSlide.addText("Chat History Export", { x: "10%", y: "40%", fontSize: 44, bold: true, color: "333333" });

  messages.forEach(m => {
    const slide = pptx.addSlide();
    slide.background = { color: "ffffff" };
    // Role header
    slide.addText(m.role.toUpperCase(), { 
      x: 0.5, y: 0.2, fontSize: 16, bold: true, color: "666666",
      w: "90%", h: 0.5
    });
    // Content
    slide.addText(m.content, { 
      x: 0.5, y: 1.0, fontSize: 18, w: "90%", h: "70%",
      align: "left", valign: "top"
    });
  });
  pptx.writeFile({ fileName: "chat-export.pptx" });
}
