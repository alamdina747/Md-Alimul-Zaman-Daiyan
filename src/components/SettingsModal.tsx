import React, { useState, useRef } from "react";
import { X, User, ShieldAlert, Check, RefreshCw, Upload, Camera } from "lucide-react";
import { AppSettings } from "../types";

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

const AVATAR_PRESETS = [
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=avatar",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Felix",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Ginger",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zack",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
];

export default function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [userName, setUserName] = useState(settings.userName || "");
  const [userAvatar, setUserAvatar] = useState(settings.userAvatar || "");
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [defaultDeepThinking, setDefaultDeepThinking] = useState(settings.defaultDeepThinking);
  const [defaultWebSearch, setDefaultWebSearch] = useState(settings.defaultWebSearch);
  const [isApplying, setIsApplying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onSave({
      ...settings,
      userName: userName.trim() || "User",
      userAvatar,
      defaultDeepThinking,
      defaultWebSearch,
    });
    onClose();
  };

  const randomizeAvatar = () => {
    const randomSeed = Math.floor(Math.random() * 10000);
    setUserAvatar(`https://api.dicebear.com/7.x/pixel-art/svg?seed=${randomSeed}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUserAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (customAvatarUrl.trim()) {
      setUserAvatar(customAvatarUrl.trim());
      setCustomAvatarUrl("");
      setIsApplying(true);
      setTimeout(() => setIsApplying(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="settings-modal-container">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-bento-border bg-bento-panel p-6 text-left shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-bento-border pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light text-brand">
              <User className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-bento-bg hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 space-y-5">
          {/* User Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 font-sans block">Display Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full rounded-xl border border-bento-border bg-bento-bg px-3.5 py-2.5 text-sm text-slate-200 outline-hidden focus:border-brand transition-colors"
              placeholder="e.g. User"
              id="settings-username-input"
            />
          </div>

          {/* User Avatar Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 block font-sans">Change Profile Picture</label>
            <div className="bg-bento-bg p-3.5 rounded-xl border border-bento-border space-y-3.5">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={userAvatar}
                    alt="Selected avatar"
                    className="h-14 w-14 rounded-xl object-cover ring-2 ring-brand/30 bg-bento-panel"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-slate-950 hover:bg-brand/80 shadow-md transition-colors"
                    title="Upload image file"
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <p className="text-[11px] text-slate-400 font-semibold leading-none">Preset Avatars</p>
                  <div className="flex flex-wrap gap-1.5">
                    {AVATAR_PRESETS.map((preset) => {
                      const isSelected = preset === userAvatar;
                      return (
                        <button
                          key={preset}
                          onClick={() => setUserAvatar(preset)}
                          type="button"
                          className={`relative h-7 w-7 rounded-md overflow-hidden ring-1 transition-all ${
                            isSelected ? "ring-2 ring-brand scale-105" : "ring-bento-border hover:scale-105"
                          }`}
                        >
                          <img src={preset} alt="preset" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-brand-light flex items-center justify-center">
                              <Check className="h-3 w-3 text-brand stroke-[3px]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Upload & Custom URL Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-bento-border/50">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-bento-border bg-bento-panel px-3 py-1.5 text-xs text-slate-300 hover:text-slate-100 hover:bg-bento-border/40 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5 text-slate-400" />
                  Upload Photo
                </button>
                <button
                  type="button"
                  onClick={randomizeAvatar}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-bento-border bg-bento-panel px-3 py-1.5 text-xs text-slate-300 hover:text-slate-100 hover:bg-bento-border/40 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                  Randomize Art
                </button>
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  placeholder="Or paste external image URL..."
                  className="flex-1 rounded-lg border border-bento-border bg-bento-panel/50 px-2.5 py-1.5 text-[11px] text-slate-200 outline-hidden focus:border-brand/50"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  className="rounded-lg bg-brand/10 border border-brand/20 px-2.5 py-1.5 text-[11px] font-bold text-brand hover:bg-brand/20 transition-all"
                >
                  {isApplying ? "Applied!" : "Apply"}
                </button>
              </div>
            </div>
          </div>

          {/* Default Chat Preferences */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-semibold text-slate-400 block">New Chat Defaults</span>
            
            <div className="space-y-2.5">
              {/* Deep Thinking */}
              <label className="flex items-center justify-between rounded-xl border border-bento-border/50 bg-bento-bg/20 p-3 hover:bg-bento-bg/40 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Default Deep Thinking Mode</span>
                  <span className="text-[10px] text-slate-500">Toggles full-depth logical reasoning steps for responses.</span>
                </div>
                <input
                  type="checkbox"
                  checked={defaultDeepThinking}
                  onChange={(e) => setDefaultDeepThinking(e.target.checked)}
                  className="h-4.5 w-4.5 rounded-sm border-bento-border bg-bento-bg text-brand accent-brand"
                />
              </label>

              {/* Web Search */}
              <label className="flex items-center justify-between rounded-xl border border-bento-border/50 bg-bento-bg/20 p-3 hover:bg-bento-bg/40 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Default Google Web Search</span>
                  <span className="text-[10px] text-slate-500">Enables live real-time internet search citations by default.</span>
                </div>
                <input
                  type="checkbox"
                  checked={defaultWebSearch}
                  onChange={(e) => setDefaultWebSearch(e.target.checked)}
                  className="h-4.5 w-4.5 rounded-sm border-bento-border bg-bento-bg text-brand accent-brand"
                />
              </label>
            </div>
          </div>

          {/* Keys Warning */}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-amber-200">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[10px] leading-relaxed text-amber-300">
              Your API requests are fully proxied and secured server-side. The required <code className="font-mono bg-amber-950 px-1 py-0.5 rounded text-amber-400 text-[9px]">GEMINI_API_KEY</code> is handled automatically by the environment secrets configuration.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-bento-border pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-bento-border bg-transparent px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-bento-bg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            id="save-settings-submit-btn"
            className="rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-brand/90 transition-all active:scale-[0.98]"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
