import React, { useState } from "react";
import { X, Apple, Phone, Mail } from "lucide-react";
import { signInWithGoogle, signInWithApple } from "../lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (name: string, email: string, avatar: string, provider: "google" | "apple" | "phone" | "email") => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);

    try {
      const result = await signInWithGoogle();
      const user = result.user;
      
      const displayName = user.displayName || user.email?.split("@")[0] || "User";
      const photoURL = user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(displayName)}`;
      const email = user.email || "";

      onAuthSuccess(displayName, email, photoURL, "google");
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in process was cancelled.");
      } else {
        console.error("Google Auth Error:", err);
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError("");
    setIsLoading(true);

    try {
      const result = await signInWithApple();
      const user = result.user;
      
      const displayName = user.displayName || "User";
      const photoURL = user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(displayName)}`;
      const email = user.email || "";

      onAuthSuccess(displayName, email, photoURL, "apple");
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in process was cancelled.");
      } else {
        console.error("Apple Auth Error:", err);
        setError("Apple sign-in failed. Please ensure the provider is enabled in your Firebase project.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSignIn = () => {
    alert("Phone authentication requires additional configuration and a reCAPTCHA setup. Please enable Phone provider in Firebase console.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="auth-modal-overlay">
      <div 
        className="absolute inset-0 bg-bento-dark/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm transform overflow-hidden rounded-2xl border border-bento-border bg-bento-panel p-6 text-left shadow-2xl transition-all animate-fade-in" id="auth-modal-card">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-xl font-bold text-slate-100">
            Log in or sign up
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-bento-bg hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-bento-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-gray-100 transition-all"
          >
             <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.05,3.1v2.58h3.31c1.94,-1.78 3.06,-4.41 3.06,-7.43c0,-0.66 -0.06,-1.29 -0.16,-1.95Z" fill="#4285F4" />
                <path d="M12,20.62c2.43,0 4.47,-0.81 5.96,-2.19l-3.31,-2.58c-0.92,0.61 -2.1,0.98 -3.65,0.98c-2.34,0 -4.33,-1.58 -5.04,-3.71H2.53v2.67C4.02,18.73 7.78,20.62 12,20.62Z" fill="#34A853" />
                <path d="M6.96,13.12a5.18,5.18 0 0 1 0,-3.24V7.21H2.53a8.91,8.91 0 0 0 0,8.58l4.43,-2.67Z" fill="#FBBC05" />
                <path d="M12,6.38c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.46,3.68 14.42,3 12,3C7.78,3 4.02,4.89 2.53,7.21l4.43,2.67C7.67,8.16 9.66,6.38 12,6.38Z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
          <button 
            onClick={handleAppleSignIn}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-bento-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-gray-100 transition-all"
          >
            <Apple className="h-5 w-5" />
            Continue with Apple
          </button>
          <button 
            onClick={handlePhoneSignIn}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-bento-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-gray-100 transition-all"
          >
            <Phone className="h-5 w-5" />
            Continue with phone
          </button>
        </div>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-bento-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-bento-panel px-2 text-slate-500 font-bold">OR</span>
          </div>
        </div>

        <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border border-bento-border bg-bento-bg px-4 py-3 text-sm text-slate-200 outline-hidden focus:border-brand transition-colors"
              placeholder="Email address"
            />
            <button className="w-full rounded-full bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-all">
                Continue
            </button>
            <button className="w-full text-center text-xs text-slate-400 hover:text-slate-200 pt-2">
                Try it first
            </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

