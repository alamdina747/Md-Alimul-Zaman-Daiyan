import React, { useState, useEffect } from "react";
import { 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  Brain, 
  Globe, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bot
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message, GroundingSource } from "../types";
import { parseThinkingAndResponse, formatTime } from "../utils";

interface MessageItemProps {
  message: Message;
  isGenerating: boolean;
  userAvatar: string;
}

export default function MessageItem({ message, isGenerating, userAvatar }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [thinkingExpanded, setThinkingExpanded] = useState(true);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  // Initialize client-side Speech Synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSpeechSynthesis(window.speechSynthesis);
    }
    
    return () => {
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  // Separate the thinking block from the response block
  const { thinking, response } = parseThinkingAndResponse(message.content);

  // Auto-collapse thinking block once generation finishes for older messages to keep UI clean
  useEffect(() => {
    if (!isGenerating && thinking) {
      // Keep it open for user convenience, but let them toggle
    }
  }, [isGenerating, thinking]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  const handleTTS = () => {
    if (!speechSynthesis) return;

    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    // Clean text of markdown characters before speaking
    const cleanText = response
      .replace(/[#*`_~\[\]()]/g, "")
      .replace(/<[^>]*>/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    
    setSpeechUtterance(utterance);
    setSpeaking(true);
    speechSynthesis.speak(utterance);
  };

  const isUser = message.role === "user";

  return (
    <div 
      className={`group flex w-full gap-4 p-4 py-6 md:p-6 transition-colors ${
        isUser ? "bg-bento-dark/20" : "bg-bento-panel/30 border-y border-bento-border/30"
      }`}
      id={`message-${message.id}`}
    >
      {/* Avatar column */}
      <div className="shrink-0">
        {isUser ? (
          <img
            src={userAvatar}
            alt="User"
            className="h-9 w-9 rounded-lg object-cover ring-2 ring-bento-border"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light text-brand ring-2 ring-brand/20">
            <Bot className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Main Content Column */}
      <div className="flex-1 space-y-3 overflow-hidden">
        {/* Header Metadata */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">
            {isUser ? "You" : "Sacred Path"}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {formatTime(message.timestamp)}
          </span>
          {!isUser && message.groundingSources && message.groundingSources.length > 0 && (
            <span className="flex items-center gap-1 rounded bg-brand-light px-2.5 py-0.5 text-[9px] font-bold text-brand border border-brand/20 uppercase tracking-wider font-mono">
              <Globe className="h-2.5 w-2.5" />
              Web Grounded
            </span>
          )}
        </div>

        {/* User Attached Image (If present) */}
        {isUser && message.image && (
          <div className="max-w-xs overflow-hidden rounded-xl border border-bento-border bg-bento-bg/50 p-1.5 shadow-md">
            <img
              src={`data:${message.image.mimeType};base64,${message.image.base64}`}
              alt="Attached content"
              className="max-h-56 w-auto rounded-lg object-contain"
            />
          </div>
        )}

        {/* Core Message Body */}
        <div className={`text-sm leading-relaxed ${isUser ? "rounded-2xl border border-brand/10 bg-brand-light/5 border-l-3 border-l-brand px-4 py-3.5 text-slate-200" : "text-slate-300"}`}>
          {/* 1. THINKING PROCESS ACCORDION */}
          {!isUser && thinking && (
            <div className="mb-4 overflow-hidden rounded-xl border border-bento-border bg-bento-panel">
              <button
                onClick={() => setThinkingExpanded(!thinkingExpanded)}
                className="flex w-full items-center justify-between bg-bento-dark/50 px-4 py-2.5 text-xs font-mono text-brand transition-colors hover:bg-bento-dark/75"
              >
                <div className="flex items-center gap-2">
                  <Brain className={`h-3.5 w-3.5 text-brand ${isGenerating && !response ? "animate-pulse" : ""}`} />
                  <span className="font-bold uppercase tracking-wider">Reasoning Chain</span>
                  {isGenerating && !response && (
                    <span className="inline-flex items-center rounded bg-brand-light px-1.5 py-0.2 text-[9px] font-mono font-bold text-brand animate-pulse uppercase">
                      Evaluating...
                    </span>
                  )}
                </div>
                {thinkingExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-brand" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-brand" />
                )}
              </button>

              {thinkingExpanded && (
                <div className="border-t border-bento-border/50 bg-bento-dark/30 p-4 font-mono text-xs text-slate-300 leading-relaxed max-h-96 overflow-y-auto">
                  {thinking.split('\n').filter(line => line.trim().length > 0).map((step, index) => (
                    <div key={index} className="flex gap-3 mb-2.5 last:mb-0">
                      <div className="text-brand font-bold select-none min-w-[20px]">{String(index + 1).padStart(2, '0')}</div>
                      <div className="flex-1 text-slate-300/90">{step.replace(/^-\s*/, '')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. FINAL TEXT RESPONSE (Rendered Markdown) */}
          <div className="prose prose-invert max-w-none space-y-3 prose-p:leading-relaxed prose-pre:bg-bento-dark prose-pre:p-0 prose-pre:border prose-pre:border-bento-border prose-pre:rounded-xl">
            {isUser ? (
              <p className="whitespace-pre-wrap text-slate-200">{response}</p>
            ) : response ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Enhance Pre/Code components to include a header and "Copy Code" button
                  pre: ({ children }) => {
                    return <pre className="my-3 overflow-x-auto bg-bento-dark border border-bento-border rounded-xl">{children}</pre>;
                  },
                  code: ({ node, inline, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeText = String(children).replace(/\n$/, "");
                    
                    if (!inline && match) {
                      return (
                        <div className="flex flex-col">
                          {/* Code Block Header */}
                          <div className="flex items-center justify-between bg-bento-panel px-4 py-2 text-[10px] font-semibold font-mono text-slate-400 border-b border-bento-border">
                            <span>{match[1].toUpperCase()}</span>
                            <button
                              onClick={async () => {
                                await navigator.clipboard.writeText(codeText);
                              }}
                              className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                              <Copy className="h-3 w-3" />
                              Copy
                            </button>
                          </div>
                          {/* Actual Code content */}
                          <code className="p-4 overflow-x-auto text-xs leading-relaxed text-brand font-mono bg-bento-dark rounded-b-xl" {...props}>
                            {children}
                          </code>
                        </div>
                      );
                    }
                    
                    return (
                      <code className="rounded bg-bento-panel px-1.5 py-0.5 text-xs text-brand font-mono font-medium border border-bento-border" {...props}>
                        {children}
                      </code>
                    );
                  },
                  // Make markdown links open in new tabs securely
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand underline hover:text-cyan-300 inline-flex items-center gap-0.5 font-medium"
                    >
                      {children}
                      <ExternalLink className="h-2.5 w-2.5 inline" />
                    </a>
                  ),
                  p: ({ children }) => <p className="mb-3 text-slate-300 leading-relaxed last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-slate-300">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-slate-300">{children}</ol>,
                  li: ({ children }) => <li className="text-slate-300">{children}</li>,
                  h1: ({ children }) => <h1 className="text-lg font-bold text-slate-100 mt-4 mb-2 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold text-slate-100 mt-3 mb-1.5 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-100 mt-2 mb-1 first:mt-0">{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-bento-border bg-bento-panel pl-4 py-1.5 my-3 italic text-slate-400 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="my-4 overflow-x-auto rounded-xl border border-bento-border bg-bento-panel/40">
                      <table className="w-full text-left border-collapse text-xs">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-bento-dark border-b border-bento-border font-semibold text-slate-300">{children}</thead>,
                  tbody: ({ children }) => <tbody className="divide-y divide-bento-border/50">{children}</tbody>,
                  tr: ({ children }) => <tr className="hover:bg-bento-dark/20 transition-colors">{children}</tr>,
                  th: ({ children }) => <th className="p-3 font-medium">{children}</th>,
                  td: ({ children }) => <td className="p-3 text-slate-300">{children}</td>,
                }}
              >
                {response}
              </ReactMarkdown>
            ) : (
              // If generating and thinking is active but response hasn't started yet
              <div className="flex items-center gap-2 py-1 text-slate-500 font-mono text-xs">
                <span className="flex h-1.5 w-1.5 animate-ping rounded-full bg-brand" />
                <span>Formulating response...</span>
              </div>
            )}
          </div>
        </div>

        {/* Citations list */}
        {!isUser && message.groundingSources && message.groundingSources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-bento-border space-y-1.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Search Grounding Sources:
            </span>
            <div className="flex flex-wrap gap-2">
              {message.groundingSources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-bento-bg hover:bg-bento-panel border border-bento-border hover:border-brand/30 px-2.5 py-1 text-xs text-slate-300 font-medium transition-all"
                  title={source.title}
                >
                  <Globe className="h-3 w-3 text-brand shrink-0" />
                  <span className="truncate max-w-[150px]">{source.title}</span>
                  <ExternalLink className="h-2.5 w-2.5 text-slate-500" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Message Actions (Copy & TTS) */}
        {!isUser && response && (
          <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg p-1.5 text-slate-500 hover:bg-bento-panel hover:text-slate-300 text-xs transition-colors"
              title="Copy response"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-brand" />
                  <span className="text-brand font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={handleTTS}
              className="flex items-center gap-1.5 rounded-lg p-1.5 text-slate-500 hover:bg-slate-900 hover:text-slate-300 text-xs transition-colors"
              title={speaking ? "Stop narration" : "Listen to response"}
            >
              {speaking ? (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                  <span className="text-rose-400 font-medium">Stop Narration</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>Listen</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
