import React, { useState } from "react";
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Settings, 
  Globe, 
  Brain,
  Search,
  Bot,
  LogIn,
  LogOut
} from "lucide-react";
import { ChatSession, AppSettings } from "../types";

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: (deepThinking?: boolean, webSearch?: boolean) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onClearAllSessions: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  settings: AppSettings;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
  onOpenSettings,
  onOpenAuth,
  onLogout,
  settings,
  sidebarOpen,
  setSidebarOpen,
}: SidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const startRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
          id="sidebar-backdrop"
        />
      )}

      <div 
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-bento-border bg-bento-panel text-slate-100 transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-bento-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-slate-950 font-bold shadow-lg shadow-brand/10">
              <Bot className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-slate-100">Sacred <span className="text-brand">Path</span></h1>
              {/* Add other indicators here */}
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-slate-200 md:hidden"
            id="close-sidebar-mobile-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Button: New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onCreateSession();
              setSidebarOpen(false); // Close mobile sidebar on select
            }}
            id="new-chat-btn"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 px-4 text-sm font-semibold text-slate-950 transition-all hover:bg-brand/90 active:scale-[0.98] shadow-md shadow-brand/15"
          >
            <Plus className="h-4 w-4 stroke-[3px]" />
            New Chat
          </button>
        </div>

        {/* Search Chats */}
        {sessions.length > 0 && (
          <div className="px-3 pb-2">
            <div className="relative flex items-center rounded-lg bg-bento-bg px-3 py-1.5 border border-bento-border focus-within:border-brand/50 transition-colors">
              <Search className="h-4 w-4 text-slate-500 mr-2" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-200 outline-hidden placeholder:text-slate-500"
                id="search-chats-input"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-slate-500 hover:text-slate-300">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <MessageSquare className="h-8 w-8 text-slate-700 mb-2 stroke-[1.5]" />
              <p className="text-xs text-slate-500">
                {searchQuery ? "No matching chats" : "Your chat sessions will appear here"}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === currentSessionId;
              const isEditing = session.id === editingSessionId;

              return (
                <div
                  key={session.id}
                  id={`chat-item-${session.id}`}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectSession(session.id);
                      setSidebarOpen(false);
                    }
                  }}
                  className={`group relative flex items-center justify-between rounded-xl p-3 text-sm transition-all cursor-pointer ${
                    isActive
                      ? "bg-bento-bg text-slate-100 border border-brand/20 shadow-xs"
                      : "text-slate-400 hover:bg-bento-bg/45 hover:text-slate-200"
                  }`}
                >
                  <div className="flex flex-1 items-center gap-2.5 min-w-0 pr-6">
                    <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? "text-brand" : "text-slate-500"}`} />
                    
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded-md bg-bento-dark px-2 py-0.5 text-xs text-slate-100 border border-bento-border focus:outline-hidden focus:border-brand"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename(session.id, e as any);
                          if (e.key === "Escape") setEditingSessionId(null);
                        }}
                      />
                    ) : (
                      <span className="truncate text-xs font-medium">
                        {session.title}
                      </span>
                    )}
                  </div>

                  {/* Badges indicating toggles inside of a session */}
                  {!isEditing && (
                    <div className="absolute right-12 flex items-center gap-1 group-hover:hidden">
                      {session.deepThinking && (
                        <span title="Reasoning Mode Enabled">
                          <Brain className="h-3 w-3 text-purple-400/80" />
                        </span>
                      )}
                      {session.webSearch && (
                        <span title="Web Search Grounding Enabled">
                          <Globe className="h-3 w-3 text-brand/80" />
                        </span>
                      )}
                    </div>
                  )}

                  {/* Hover Actions */}
                  <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => saveRename(session.id, e)}
                          className="rounded-md p-1 hover:bg-bento-border text-brand"
                          title="Save title"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={cancelRename}
                          className="rounded-md p-1 hover:bg-slate-800 text-rose-400"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => startRename(session, e)}
                          className="rounded-md p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                          title="Rename Chat"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className="rounded-md p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                          title="Delete Chat"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Area with Settings and User Profile */}
        <div className="p-3 border-t border-bento-border space-y-2 bg-bento-panel backdrop-blur-xs">
          {sessions.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to delete all chats? This cannot be undone.")) {
                  onClearAllSessions();
                }
              }}
              id="clear-all-sessions-btn"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-bento-border/60 py-2 text-xs font-semibold text-slate-400 hover:bg-bento-bg hover:text-rose-400 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Clear Conversation History
            </button>
          )}

          {settings.isLoggedIn ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-bento-bg p-2.5 border border-bento-border">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={settings.userAvatar}
                    alt={settings.userName}
                    referrerPolicy="no-referrer"
                    className="h-8.5 w-8.5 rounded-lg object-cover ring-2 ring-brand/20 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-200">{settings.userName}</p>
                    <span className="text-[9px] text-brand font-bold uppercase tracking-wider block leading-none mt-0.5">
                      {settings.authProvider === "google" ? "Google Account" : "Premium Member"}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={onOpenSettings}
                    id="open-settings-btn"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-bento-border hover:text-slate-200 transition-colors"
                    title="Open Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onLogout}
                    id="logout-btn"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-bento-border hover:text-rose-400 transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={onOpenAuth}
                id="sidebar-sign-in-btn"
                className="flex w-full items-center justify-between gap-2.5 rounded-xl border border-dashed border-brand/40 bg-brand/5 p-3 hover:bg-brand/10 transition-all active:scale-[0.98] text-left group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand shrink-0">
                    <LogIn className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-100">Sign in & Log in</p>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Unlock cloud session sync</span>
                  </div>
                </div>
                <div className="flex h-5 items-center rounded-md bg-brand/15 px-1.5 text-[9px] font-extrabold uppercase tracking-wide text-brand group-hover:bg-brand/20 transition-all">
                  Join
                </div>
              </button>
              
              <div className="flex items-center justify-between rounded-xl bg-bento-bg/40 p-2.5 border border-bento-border/50 opacity-70">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={settings.userAvatar}
                    alt={settings.userName}
                    referrerPolicy="no-referrer"
                    className="h-8 w-8 rounded-lg object-cover grayscale shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-400">{settings.userName} (Guest)</p>
                  </div>
                </div>
                <button
                  onClick={onOpenSettings}
                  id="open-settings-guest-btn"
                  className="rounded-lg p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                  title="Open Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
