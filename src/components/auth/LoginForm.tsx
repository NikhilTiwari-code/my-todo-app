"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Eye, EyeOff, LogIn, Mail, Lock, Sparkles } from "lucide-react";

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Login failed");
      }

      // Store token and update auth context
      login(data.token);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/todos");
      }
    } catch (error: any) {
      setServerError(error.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="relative">
      {/* Animated background gradient orbs */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-32 left-20 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      <form onSubmit={handleSubmit} className="space-y-4 relative">
        {/* Header with icon */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/50 mb-3 animate-float">
            <LogIn className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Sign in to continue your journey</p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <Alert variant="error" className="bg-red-50/80 backdrop-blur-sm border-red-200 dark:bg-red-900/20 animate-slideDown">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {serverError}
            </AlertDescription>
          </Alert>
        )}

        {/* Email Field */}
        <div className="group">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors z-10">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder=" "
              autoComplete="email"
              disabled={isLoading}
              className={`peer w-full pl-11 pr-4 py-3 rounded-xl border-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 outline-none ${
                errors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            />
            <label className="absolute left-11 top-1/2 -translate-y-1/2 text-gray-500 transition-all duration-300 pointer-events-none peer-focus:top-0 peer-focus:left-3 peer-focus:text-xs peer-focus:text-purple-600 peer-focus:bg-white dark:peer-focus:bg-gray-950 peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-gray-950 peer-[:not(:placeholder-shown)]:px-2 z-10">
              Email Address
            </label>
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-slideDown">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="group">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder=" "
              autoComplete="current-password"
              disabled={isLoading}
              className={`peer w-full pl-11 pr-12 py-3 rounded-xl border-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 outline-none ${
                errors.password ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            />
            <label className="absolute left-11 top-1/2 -translate-y-1/2 text-gray-500 transition-all duration-300 pointer-events-none peer-focus:top-0 peer-focus:left-3 peer-focus:text-xs peer-focus:text-purple-600 peer-focus:bg-white dark:peer-focus:bg-gray-950 peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-gray-950 peer-[:not(:placeholder-shown)]:px-2">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-slideDown">
              {errors.password}
            </p>
          )}
        </div>

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <Link 
            href="/forgot-password" 
            className="text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button with gradient */}
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
          
          {/* Button content */}
          <span className="relative flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                Sign In
              </>
            )}
          </span>
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-gray-950 text-gray-500">
              New to our platform?
            </span>
          </div>
        </div>

        {/* Register Link */}
        <Link href="/register">
          <button
            type="button"
            className="group relative w-full py-3.5 px-6 rounded-xl font-semibold transition-all duration-300 overflow-hidden border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600"
          >
            <span className="relative bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-pink-700">
              Create Account →
            </span>
          </button>
        </Link>
      </form>
    </div>
  );
}

