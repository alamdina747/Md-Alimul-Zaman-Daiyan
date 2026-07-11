import React, { useState } from "react";
import { X, Mail, Lock, User, LogIn, UserPlus } from "lucide-react";
import { AppSettings } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (name: string, email: string, avatar: string, provider: "google" | "email") => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!isLogin && !name) {
      setError("Please provide your name.");
      return;
    }

    setIsLoading(true);

    // Simulate standard authentication network latency
    setTimeout(() => {
      setIsLoading(false);
      const displayName = isLogin ? (email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1)) : name;
      const avatarSeed = encodeURIComponent(displayName);
      const generatedAvatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${avatarSeed}`;
      onAuthSuccess(displayName, email, generatedAvatar, "email");
      onClose();
    }, 1200);
  };

  const handleGoogleSignIn = () => {
    setError("");
    setIsLoading(true);

    // Simulate authentic Google OAuth popup flow
    setTimeout(() => {
      setIsLoading(false);
      // Use consistent default user data for the simulation
      const defaultName = "Alamdina";
      const defaultEmail = "alamdina747@gmail.com";
      const generatedAvatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(defaultName)}`;
      onAuthSuccess(defaultName, defaultEmail, generatedAvatar, "google");
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="auth-modal-overlay">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-bento-dark/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-bento-border bg-bento-panel p-6 text-left shadow-2xl transition-all animate-fade-in" id="auth-modal-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-bento-border pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Access your saved sessions on Sacred Path
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-bento-bg hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Google Authentication Button */}
        <div className="mt-5">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-bento-border bg-bento-bg px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-bento-bg/80 active:scale-[0.98] transition-all"
            id="google-signin-btn"
          >
            {/* Elegant Google logo */}
            <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.05,3.1v2.58h3.31c1.94,-1.78 3.06,-4.41 3.06,-7.43c0,-0.66 -0.06,-1.29 -0.16,-1.95Z" fill="#4285F4" />
                <path d="M12,20.62c2.43,0 4.47,-0.81 5.96,-2.19l-3.31,-2.58c-0.92,0.61 -2.1,0.98 -3.65,0.98c-2.34,0 -4.33,-1.58 -5.04,-3.71H2.53v2.67C4.02,18.73 7.78,20.62 12,20.62Z" fill="#34A853" />
                <path d="M6.96,13.12a5.18,5.18 0 0 1 0,-3.24V7.21H2.53a8.91,8.91 0 0 0 0,8.58l4.43,-2.67Z" fill="#FBBC05" />
                <path d="M12,6.38c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.46,3.68 14.42,3 12,3C7.78,3 4.02,4.89 2.53,7.21l4.43,2.67C7.67,8.16 9.66,6.38 12,6.38Z" fill="#EA4335" />
              </g>
            </svg>
            Sign in with Google
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-bento-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-bento-panel px-2 text-[10px] font-bold tracking-wider text-slate-500">
              Or continue with
            </span>
          </div>
        </div>

        {/* Form Error Message */}
        {error && (
          <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* Login/Signup Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 block" htmlFor="auth-name">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  id="auth-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-bento-border bg-bento-bg pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-hidden focus:border-brand transition-colors"
                  placeholder="John Doe"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block" htmlFor="auth-email">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                id="auth-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-bento-border bg-bento-bg pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-hidden focus:border-brand transition-colors"
                placeholder="name@example.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block" htmlFor="auth-password">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                id="auth-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-bento-border bg-bento-bg pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-hidden focus:border-brand transition-colors"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-slate-950 hover:bg-brand/90 active:scale-[0.98] transition-all disabled:opacity-50"
              id="auth-submit-btn"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              ) : isLogin ? (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </>
              )}
            </button>
          </div>
        </form>

        {/* Switch Signin / Signup flow */}
        <div className="mt-5 text-center text-xs">
          <span className="text-slate-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          </span>
          <button
            onClick={() => {
              setError("");
              setIsLogin(!isLogin);
            }}
            disabled={isLoading}
            className="font-bold text-brand hover:text-cyan-300 transition-colors"
          >
            {isLogin ? "Create an account" : "Sign in to existing"}
          </button>
        </div>
      </div>
    </div>
  );
}
