import React, { useState, useEffect, useRef } from "react";
import { 
  Menu, 
  Send, 
  Image as ImageIcon, 
  X, 
  Brain, 
  Globe, 
  ArrowUp, 
  Loader2, 
  AlertTriangle,
  Sparkles,
  Bot,
  Mic,
  Zap,
  Download,
  ImagePlus,
  FileText,
  Table,
  Presentation,
  Home
} from "lucide-react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Sidebar from "./components/Sidebar";
import SuggestionGrid from "./components/SuggestionGrid";
import MessageItem from "./components/MessageItem";
import SettingsModal from "./components/SettingsModal";
import AuthModal from "./components/AuthModal";
import { ChatSession, Message, AppSettings, ImageAttachment } from "./types";
import { 
  loadSessions, 
  saveSessions, 
  loadSettings, 
  saveSettings, 
  fileToBase64,
  parseThinkingAndResponse,
  exportToDocx,
  exportToExcel,
  exportToPptx
} from "./utils";

export default function App() {
  // Application settings and sessions
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Active chat state
  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState<ImageAttachment | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [systemHealth, setSystemHealth] = useState<{ hasApiKey: boolean; checked: boolean }>({
    hasApiKey: true,
    checked: false,
  });

  // Speech Recognition state & ref
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setInputText((prev) => {
            const separator = prev.endsWith(' ') || prev === '' ? '' : ' ';
            return prev + separator + finalTranscript;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Unified Mode Setter
  const setSessionMode = (mode: 'flash' | 'websearch' | 'deepsearch') => {
    if (!currentSessionId) return;
    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            deepThinking: mode === 'deepsearch',
            webSearch: mode === 'websearch',
            updatedAt: Date.now()
          };
        }
        return s;
      });
      saveSessions(updated);
      return updated;
    });
  };

  // Refs for UI
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement | null>(null);

  // 1. Initial Load from LocalStorage and backend health check
  useEffect(() => {
    const loadedSessions = loadSessions();
    setSessions(loadedSessions);

    // If there are sessions, select the last active one. Otherwise, create a default session
    if (loadedSessions.length > 0) {
      setCurrentSessionId(loadedSessions[0].id);
    } else {
      // Create an initial empty chat to welcome the user
      const defaultSession: ChatSession = {
        id: "session_" + Date.now(),
        title: "New Chat",
        messages: [],
        deepThinking: settings.defaultDeepThinking,
        webSearch: settings.defaultWebSearch,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const initialSessions = [defaultSession];
      setSessions(initialSessions);
      saveSessions(initialSessions);
      setCurrentSessionId(defaultSession.id);
    }

    // Verify Gemini API key configuration on backend
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setSystemHealth({
          hasApiKey: data.hasApiKey,
          checked: true,
        });
      })
      .catch((err) => {
        console.error("Failed to fetch health check:", err);
        setSystemHealth({ hasApiKey: false, checked: true });
      });
  }, [settings.defaultDeepThinking, settings.defaultWebSearch]);

  // 2. Auto-scroll to bottom of conversation
  const scrollToBottom = (behavior: "auto" | "smooth" = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("smooth");
  }, [sessions, isGenerating]);

  // Handle Session Settings changes
  const currentSession = sessions.find((s) => s.id === currentSessionId) || null;

  const toggleSessionDeepThinking = () => {
    if (!currentSessionId) return;
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === currentSessionId ? { ...s, deepThinking: !s.deepThinking, updatedAt: Date.now() } : s
      );
      saveSessions(updated);
      return updated;
    });
  };

  const toggleSessionWebSearch = () => {
    if (!currentSessionId) return;
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === currentSessionId ? { ...s, webSearch: !s.webSearch, updatedAt: Date.now() } : s
      );
      saveSessions(updated);
      return updated;
    });
  };

  // Create a new empty session
  const handleCreateSession = (deepThinking = settings.defaultDeepThinking, webSearch = settings.defaultWebSearch) => {
    const newSession: ChatSession = {
      id: "session_" + Date.now(),
      title: "New Chat",
      messages: [],
      deepThinking,
      webSearch,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    saveSessions(updated);
    setCurrentSessionId(newSession.id);
    setInputText("");
    clearAttachedImage();
    setTimeout(() => textInputRef.current?.focus(), 100);
  };

  // Delete specific session
  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    saveSessions(updated);

    if (currentSessionId === id) {
      if (updated.length > 0) {
        setCurrentSessionId(updated[0].id);
      } else {
        handleCreateSession();
      }
    }
  };

  // Rename session title
  const handleRenameSession = (id: string, newTitle: string) => {
    const updated = sessions.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s));
    setSessions(updated);
    saveSessions(updated);
  };

  // Clear all sessions
  const handleClearAllSessions = () => {
    setSessions([]);
    saveSessions([]);
    handleCreateSession();
  };

  // Save Settings from SettingsModal
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Auth Callbacks
  const handleAuthSuccess = (name: string, email: string, avatar: string, provider: "google" | "email") => {
    const updatedSettings: AppSettings = {
      ...settings,
      userName: name,
      userAvatar: avatar,
      isLoggedIn: true,
      userEmail: email,
      authProvider: provider,
    };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  const handleLogout = () => {
    const updatedSettings: AppSettings = {
      ...settings,
      userName: "User",
      userAvatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=avatar",
      isLoggedIn: false,
      userEmail: undefined,
      authProvider: undefined,
    };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  const handleExport = (format: 'txt' | 'md') => {
    if (!currentSession) return;
    
    let content = `# ${currentSession.title}\n\n`;
    currentSession.messages.forEach((msg) => {
      const { thinking, response } = parseThinkingAndResponse(msg.content);
      content += `## ${msg.role === 'user' ? 'You' : 'Sacred Path'} (${new Date(msg.timestamp).toLocaleString()})\n\n`;
      if (thinking) content += `> Thinking: ${thinking}\n\n`;
      content += `${response}\n\n---\n\n`;
    });

    const blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSession.title.replace(/\s+/g, '_')}_export.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle Image attachment
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleGenerateImage = async () => {
    if (!inputText.trim() || !currentSessionId) return;
    
    setIsGenerating(true);
    const userPrompt = inputText.trim();
    setInputText("");

    // Add user message to UI
    const userMessage: Message = {
      id: "msg_" + Date.now(),
      role: "user",
      content: `Generate an image: ${userPrompt}`,
      timestamp: Date.now(),
    };

    setSessions((prev) => {
      const updated = prev.map((s) => 
        s.id === currentSessionId ? { ...s, messages: [...s.messages, userMessage], updatedAt: Date.now() } : s
      );
      saveSessions(updated);
      return updated;
    });

    try {
      const response = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt }),
      });
      const data = await response.json();
      
      if (data.imageUrl) {
        const modelMessage: Message = {
          id: "msg_" + (Date.now() + 1),
          role: "model",
          content: `Here is the image you requested: ![Generated Image](${data.imageUrl})`,
          timestamp: Date.now(),
        };

        setSessions((prev) => {
          const updated = prev.map((s) => 
            s.id === currentSessionId ? { ...s, messages: [...s.messages, modelMessage], updatedAt: Date.now() } : s
          );
          saveSessions(updated);
          return updated;
        });
      } else {
        throw new Error(data.error || "Failed to generate image.");
      }
    } catch (error: any) {
      console.error("Image Generation Error:", error);
      const errorMessage: Message = {
        id: "msg_" + (Date.now() + 1),
        role: "model",
        content: `⚠️ **Error generating image:** ${error.message}`,
        timestamp: Date.now(),
      };
      setSessions((prev) => {
        const updated = prev.map((s) => 
          s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMessage], updatedAt: Date.now() } : s
        );
        saveSessions(updated);
        return updated;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const result = await fileToBase64(file);
        setAttachedImage(result);
        setImagePreviewUrl(URL.createObjectURL(file));
      } catch (err) {
        alert("Failed to read image file. Please try another one.");
      }
    }
  };

  const clearAttachedImage = () => {
    setAttachedImage(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Send message to the active session
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() && !attachedImage) return;
    if (!currentSessionId || isGenerating) return;

    // Clear text and attachment inputs
    setInputText("");
    const messageImage = attachedImage;
    clearAttachedImage();

    // 1. Construct user message
    const userMessage: Message = {
      id: "msg_" + Date.now(),
      role: "user",
      content: textToSend.trim(),
      image: messageImage || undefined,
      timestamp: Date.now(),
    };

    // 2. Add user message to current session
    let updatedSessions = sessions.map((s) => {
      if (s.id === currentSessionId) {
        // Auto-rename chat session title from "New Chat" on the first message
        const title = s.title === "New Chat" ? (textToSend.length > 30 ? textToSend.slice(0, 30) + "..." : textToSend) : s.title;
        return {
          ...s,
          title,
          messages: [...s.messages, userMessage],
          updatedAt: Date.now(),
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    saveSessions(updatedSessions);

    // 3. Initialize empty model response placeholder message
    const modelMessageId = "msg_model_" + Date.now();
    const modelMessagePlaceholder: Message = {
      id: modelMessageId,
      role: "model",
      content: "",
      timestamp: Date.now(),
    };

    updatedSessions = updatedSessions.map((s) => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          messages: [...s.messages, modelMessagePlaceholder],
        };
      }
      return s;
    });
    setSessions(updatedSessions);

    // 4. Fire SSE request
    setIsGenerating(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const activeSession = updatedSessions.find((s) => s.id === currentSessionId)!;
      
      // We only send the message text and roles to keep context light.
      // Images must be sent as inlineData base64 only if they are attached to the latest or previous messages.
      const payloadMessages = activeSession.messages
        .filter((msg) => msg.id !== modelMessageId)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
          image: msg.image ? { mimeType: msg.image.mimeType, base64: msg.image.base64 } : undefined,
        }));

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: payloadMessages,
          deepThinking: activeSession.deepThinking,
          webSearch: activeSession.webSearch,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error Status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Reader could not be initialized from the response body stream.");
      }

      const decoder = new TextDecoder();
      let streamBuffer = "";
      let modelFullText = "";
      let groundingSources: any[] | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split("\n");
        // Save the last partial line back to the buffer
        streamBuffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const dataStr = trimmed.slice(6).trim();
          if (dataStr === "[DONE]") continue;

          try {
            const data = JSON.parse(dataStr);
            if (data.error) {
              throw new Error(data.error);
            }
            if (data.text) {
              modelFullText += data.text;
            }
            if (data.groundingSources && !groundingSources) {
              groundingSources = data.groundingSources;
            }

            // Real-time UI updating of the active streaming message
            setSessions((prev) => {
              return prev.map((s) => {
                if (s.id === currentSessionId) {
                  return {
                    ...s,
                    messages: s.messages.map((m) => {
                      if (m.id === modelMessageId) {
                        return {
                          ...m,
                          content: modelFullText,
                          groundingSources: groundingSources || undefined,
                        };
                      }
                      return m;
                    }),
                  };
                }
                return s;
              });
            });
          } catch (e: any) {
            // Keep going if line parsing was interrupted, but output major errors
            if (e.message && e.message.includes("missing") || e.message && e.message.includes("API Key")) {
              throw e;
            }
          }
        }
      }

      // Final persistence
      setSessions((prev) => {
        const finalSessions = prev.map((s) => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              updatedAt: Date.now(),
            };
          }
          return s;
        });
        saveSessions(finalSessions);
        return finalSessions;
      });

    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Chat generation stream aborted by user.");
      } else {
        console.error("Chat error:", err);
        // Display elegant error feedback inside the message bubble
        setSessions((prev) => {
          const fallbackSessions = prev.map((s) => {
            if (s.id === currentSessionId) {
              return {
                ...s,
                messages: s.messages.map((m) => {
                  if (m.id === modelMessageId) {
                    return {
                      ...m,
                      content: `⚠️ **Error generating response:** ${err.message || "Unable to connect to server."}\n\nPlease check your system settings or internet connection and try again.`,
                    };
                  }
                  return m;
                }),
              };
            }
            return s;
          });
          saveSessions(fallbackSessions);
          return fallbackSessions;
        });
      }
    } finally {
      setIsGenerating(false);
      setAbortController(null);
      setTimeout(() => textInputRef.current?.focus(), 50);
    }
  };

  // Handle interrupting a running generator
  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bento-dark font-sans text-slate-100 antialiased" id="main-app-root">
      {/* Sidebar Component */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onCreateSession={() => handleCreateSession()}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onClearAllSessions={handleClearAllSessions}
        onOpenSettings={() => setShowSettings(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        settings={settings}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Workspace Column */}
      <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-bento-dark/60">
        
        {/* Workspace Top Header Bar */}
        <header className="flex h-16 items-center justify-between border-b border-bento-border bg-bento-panel/90 px-4 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-bento-bg hover:text-slate-200 transition-colors md:hidden"
              id="open-sidebar-mobile-btn"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="rounded-lg p-2 text-slate-400 hover:bg-bento-bg hover:text-slate-200 transition-colors"
              title="Home"
              id="home-btn"
            >
              <Home className="h-5 w-5" />
            </button>
            
            {/* Active Session Info */}
            {currentSession && (
              <div className="flex items-center gap-3">
                <div className="min-w-0">
                  <span className="text-[9px] text-brand/80 font-mono font-bold uppercase tracking-wider block leading-none">Workspace Cell</span>
                  <h2 className="text-xs md:text-sm font-semibold text-slate-200 truncate max-w-[180px] md:max-w-xs mt-1">
                    {currentSession.title}
                  </h2>
                </div>
                <div className="flex items-center gap-1 border-l border-bento-border pl-3">
                  <button
                    onClick={() => handleExport('txt')}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-bento-bg rounded-lg transition-colors"
                    title="Export as Text"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleExport('md')}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-bento-bg rounded-lg transition-colors"
                    title="Export as Markdown"
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Session Realtime Modifiers / Mode Selector */}
          {currentSession && (
            <div className="flex items-center gap-1.5 bg-bento-bg p-1 rounded-xl border border-bento-border shadow-inner" id="bento-mode-changer">
              <button
                onClick={() => setSessionMode('flash')}
                disabled={isGenerating}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] md:text-xs font-semibold rounded-lg transition-all ${
                  !currentSession.deepThinking && !currentSession.webSearch
                    ? "bg-brand text-slate-950 font-bold shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Flash Mode: Fast & direct AI conversation"
              >
                <Zap className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Flash</span>
              </button>

              <button
                onClick={() => setSessionMode('websearch')}
                disabled={isGenerating}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] md:text-xs font-semibold rounded-lg transition-all ${
                  currentSession.webSearch
                    ? "bg-brand text-slate-950 font-bold shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Web Search Mode: Live internet grounded answers"
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Web Search</span>
                <span className="sm:hidden">Search</span>
              </button>

              <button
                onClick={() => setSessionMode('deepsearch')}
                disabled={isGenerating}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] md:text-xs font-semibold rounded-lg transition-all ${
                  currentSession.deepThinking
                    ? "bg-brand text-slate-950 font-bold shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Deep Search Mode: Step-by-step logical reasoning"
              >
                <Brain className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Deep Search</span>
                <span className="sm:hidden">Deep</span>
              </button>
            </div>
          )}
        </header>

        {/* API Warning banner */}
        {systemHealth.checked && !systemHealth.hasApiKey && (
          <div className="flex items-center gap-2 bg-rose-500/15 border-b border-rose-500/20 px-4 py-2.5 text-xs text-rose-300 font-medium">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>
              <strong>Gemini API Key is missing!</strong> Please add your API key via the **Secrets Panel** (Settings &gt; Secrets in the UI) to enable responses.
            </span>
          </div>
        )}

        {/* Core Chat Scroll Area */}
        <div className="flex-1 overflow-y-auto" id="chat-messages-container">
          {currentSession && currentSession.messages.length === 0 ? (
            <SuggestionGrid
              onSelectSuggestion={(prompt) => {
                setInputText(prompt);
                // Trigger sending
                setTimeout(() => handleSendMessage(prompt), 50);
              }}
              userName={settings.userName}
            />
          ) : (
            <div className="flex flex-col">
              {currentSession?.messages.map((msg, idx) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  isGenerating={isGenerating && idx === currentSession.messages.length - 1}
                  userAvatar={settings.userAvatar}
                />
              ))}
              {/* Dummy spacing element for autoscroll */}
              <div ref={messagesEndRef} className="h-24" />
            </div>
          )}
        </div>

        {/* Bottom Interactive Inputs Footer */}
        <footer className="border-t border-bento-border bg-bento-panel/80 px-4 py-4 backdrop-blur-xs">
          <div className="mx-auto max-w-3xl">
            
            {/* Attached Image Thumbnail Panel */}
            {imagePreviewUrl && (
              <div className="mb-3.5 inline-flex relative items-center rounded-xl border border-bento-border bg-bento-bg p-1.5 shadow-lg">
                <img
                  src={imagePreviewUrl}
                  alt="Attachment preview"
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <button
                  onClick={clearAttachedImage}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                  title="Remove image attachment"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Input Form layout */}
            <div className="relative rounded-2xl border border-bento-border bg-bento-bg/50 px-4 py-3.5 focus-within:border-brand/40 transition-colors">
              <textarea
                ref={textInputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isGenerating}
                placeholder={
                  currentSession?.deepThinking && currentSession?.webSearch
                    ? "Ask Sacred Path with Deep Thinking & Web Search enabled..."
                    : currentSession?.deepThinking
                    ? "Ask Sacred Path with Deep Thinking enabled..."
                    : currentSession?.webSearch
                    ? "Ask Sacred Path with Web Search enabled..."
                    : "Ask Sacred Path anything..."
                }
                className="w-full resize-none bg-transparent pr-12 text-sm text-slate-200 outline-hidden placeholder:text-slate-500 max-h-36 min-h-[20px] leading-relaxed"
                id="chat-textarea-input"
                style={{ height: "auto" }}
              />

              {/* Sub-actions toolbar inside Input bar */}
              <div className="mt-3 flex items-center justify-between border-t border-bento-border/50 pt-2.5">
                <div className="flex items-center gap-2">
                  {/* File Attachment input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="hidden-file-uploader"
                  />
                  <button
                    onClick={handleImageClick}
                    disabled={isGenerating}
                    className="rounded-xl p-2 text-slate-500 hover:bg-bento-panel hover:text-brand transition-all active:scale-95"
                    title="Attach image (multimodal)"
                    id="attach-image-btn"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>

                  <button
                    onClick={handleGenerateImage}
                    disabled={isGenerating}
                    className="rounded-xl p-2 text-slate-500 hover:bg-bento-panel hover:text-brand transition-all active:scale-95"
                    title="Generate image from prompt"
                    id="generate-image-btn"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </button>
                  
                  {currentSession && currentSession.messages.length > 0 && (
                    <div className="flex items-center gap-1 border border-bento-border bg-bento-panel/50 rounded-xl p-1 ml-2">
                      <button onClick={() => exportToDocx(currentSession.messages)} title="Export to DOCX" className="p-1.5 text-slate-400 hover:text-brand hover:bg-bento-bg rounded-lg transition-all"><FileText className="h-4 w-4"/></button>
                      <button onClick={() => exportToExcel(currentSession.messages)} title="Export to Excel" className="p-1.5 text-slate-400 hover:text-brand hover:bg-bento-bg rounded-lg transition-all"><Table className="h-4 w-4"/></button>
                      <button onClick={() => exportToPptx(currentSession.messages)} title="Export to PPTX" className="p-1.5 text-slate-400 hover:text-brand hover:bg-bento-bg rounded-lg transition-all"><Presentation className="h-4 w-4"/></button>
                    </div>
                  )}

                  {/* Microphone speech input button */}
                  <button
                    onClick={toggleListening}
                    disabled={isGenerating}
                    className={`rounded-xl p-2 transition-all active:scale-95 relative ${
                      isListening
                        ? "bg-rose-500/15 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 animate-pulse"
                        : "text-slate-500 hover:bg-bento-panel hover:text-brand"
                    }`}
                    title={isListening ? "Listening... click to stop" : "Voice typing (Speech-to-text)"}
                    id="voice-type-btn"
                  >
                    <Mic className="h-4 w-4" />
                    {isListening && (
                      <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                      </span>
                    )}
                  </button>
                  
                  <span className="text-[10px] text-slate-600 font-medium">
                    Supports text, markdown, and image analysis
                  </span>
                </div>

                {/* Send / Stop generator button */}
                <div>
                  {isGenerating ? (
                    <button
                      onClick={handleStopGeneration}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all active:scale-95 border border-rose-500/15"
                      title="Stop generation"
                      id="stop-generation-btn"
                    >
                      <Loader2 className="h-4.5 w-4.5 animate-spin text-rose-400" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputText.trim() && !attachedImage}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                        inputText.trim() || attachedImage
                          ? "bg-brand text-slate-950 hover:bg-brand/90 active:scale-95 shadow-md shadow-brand/15"
                          : "bg-bento-bg/50 text-slate-600 cursor-not-allowed border border-bento-border/50"
                      }`}
                      title="Send message"
                      id="submit-message-btn"
                    >
                      <ArrowUp className="h-4.5 w-4.5 stroke-[3px]" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom notice */}
            <p className="mt-2.5 text-center text-[10px] text-slate-600 font-medium leading-relaxed">
              Sacred Path can make errors. Verify important information.
            </p>
          </div>
        </footer>
      </div>

      {/* App Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* User Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Vercel Speed Insights */}
      <SpeedInsights />
    </div>
  );
}
