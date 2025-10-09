// "use client";

// import React, { useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/contexts/AuthContext";
// import { Input } from "@/components/ui/Input";
// import { Button } from "@/components/ui/Button";
// import { Alert, AlertDescription } from "@/components/ui/Alert";

// interface RegisterFormProps {
//   onSuccess?: () => void;
// }

// export default function RegisterForm({ onSuccess }: RegisterFormProps) {
//   const router = useRouter();
//   const { login } = useAuth();
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//   });
//   const [errors, setErrors] = useState<{
//     name?: string;
//     email?: string;
//     password?: string;
//     confirmPassword?: string;
//   }>({});
//   const [serverError, setServerError] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   const validateForm = () => {
//     const newErrors: typeof errors = {};

//     if (!formData.name) {
//       newErrors.name = "Name is required";
//     } else if (formData.name.length < 2) {
//       newErrors.name = "Name must be at least 2 characters";
//     }

//     if (!formData.email) {
//       newErrors.email = "Email is required";
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       newErrors.email = "Email is invalid";
//     }

//     if (!formData.password) {
//       newErrors.password = "Password is required";
//     } else if (formData.password.length < 6) {
//       newErrors.password = "Password must be at least 6 characters";
//     }

//     if (!formData.confirmPassword) {
//       newErrors.confirmPassword = "Please confirm your password";
//     } else if (formData.password !== formData.confirmPassword) {
//       newErrors.confirmPassword = "Passwords do not match";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setServerError("");

//     if (!validateForm()) return;

//     setIsLoading(true);

//     try {
//       const response = await fetch("/api/auth/register", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           name: formData.name,
//           email: formData.email,
//           password: formData.password,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error?.message || "Registration failed");
//       }

//       // Store token and update auth context
//       login(data.token);

//       // Call success callback
//       if (onSuccess) {
//         onSuccess();
//       } else {
//         router.push("/todos");
//       }
//     } catch (error: any) {
//       setServerError(error.message || "An error occurred during registration");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     // Clear error when user starts typing
//     if (errors[name as keyof typeof errors]) {
//       setErrors((prev) => ({ ...prev, [name]: undefined }));
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       {serverError && (
//         <Alert variant="error">
//           <AlertDescription>{serverError}</AlertDescription>
//         </Alert>
//       )}

//       <Input
//         label="Name"
//         type="text"
//         name="name"
//         value={formData.name}
//         onChange={handleChange}
//         error={errors.name}
//         placeholder="John Doe"
//         autoComplete="name"
//         disabled={isLoading}
//       />

//       <Input
//         label="Email"
//         type="email"
//         name="email"
//         value={formData.email}
//         onChange={handleChange}
//         error={errors.email}
//         placeholder="john@example.com"
//         autoComplete="email"
//         disabled={isLoading}
//       />

//       <Input
//         label="Password"
//         type="password"
//         name="password"
//         value={formData.password}
//         onChange={handleChange}
//         error={errors.password}
//         placeholder="••••••••"
//         autoComplete="new-password"
//         disabled={isLoading}
//       />

//       <Input
//         label="Confirm Password"
//         type="password"
//         name="confirmPassword"
//         value={formData.confirmPassword}
//         onChange={handleChange}
//         error={errors.confirmPassword}
//         placeholder="••••••••"
//         autoComplete="new-password"
//         disabled={isLoading}
//       />

//       <Button type="submit" className="w-full" isLoading={isLoading}>
//         {isLoading ? "Creating account..." : "Register"}
//       </Button>

//       <p className="text-center text-sm text-gray-600 dark:text-gray-400">
//         Already have an account?{" "}
//         <Link
//           href="/login"
//           className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
//         >
//           Login
//         </Link>
//       </p>
//     </form>
//   );
// }



//********************************************************************************************


"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Eye, EyeOff, CheckCircle, XCircle, Shield, Sparkles, Mail, Lock, User } from "lucide-react";
import { useEmailCheck } from "@/hooks/useEmailCheck";


interface RegisterFormProps {
  onSuccess?: () => void;
}

// Password strength checker
const checkPasswordStrength = (password: string) => {
  let strength = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  if (checks.length) strength++;
  if (checks.uppercase) strength++;
  if (checks.lowercase) strength++;
  if (checks.number) strength++;
  if (checks.special) strength++;

  return {
    score: strength,
    label: strength <= 2 ? "Weak" : strength === 3 ? "Medium" : strength === 4 ? "Good" : "Strong",
    color: strength <= 2 ? "bg-red-500" : strength === 3 ? "bg-yellow-500" : strength === 4 ? "bg-blue-500" : "bg-green-500",
    checks,
  };
};

// Email validation
const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Input sanitization
const sanitizeInput = (input: string) => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
};

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreeToTerms?: string;
  }>({});

  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(checkPasswordStrength(""));
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Use the custom hook for email checking with debounce
  const { isChecking: emailChecking, isAvailable: emailAvailable, message: emailMessage, error: emailError } = useEmailCheck(formData.email);

  // Update password strength on change
  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(formData.password));
  }, [formData.password]);

  // Track mouse movement for interactive animations
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Name validation with XSS prevention
    if (!formData.name) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (formData.name.length > 50) {
      newErrors.name = "Name must be less than 50 characters";
    } else if (/<script|javascript:|onerror=/i.test(formData.name)) {
      newErrors.name = "Invalid characters in name";
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Email is invalid";
    } else if (emailAvailable === false) {
      newErrors.email = "This email is already registered";
    }

    // Strong password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (passwordStrength.score < 3) {
      newErrors.password = "Password is too weak. Please meet the requirements below.";
    }

    // Confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Terms acceptance
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
<<<<<<< HEAD
        credentials: "include", // Include cookies
=======
        credentials: "include",
>>>>>>> frontend
        body: JSON.stringify({
          name: sanitizeInput(formData.name).trim(),
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 429) {
          throw new Error("Too many registration attempts. Please try again later.");
        }
        if (response.status === 409) {
          throw new Error("This email is already registered. Please login instead.");
        }
        throw new Error(data.error?.message || "Registration failed");
      }

<<<<<<< HEAD
      // Registration successful - redirect to login
      // (Register endpoint doesn't set cookies, user needs to login)
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/login");
=======
      // Success - redirect or callback
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/login?registered=true");
>>>>>>> frontend
      }
    } catch (error: any) {
      setServerError(error.message || "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div 
      className="relative"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background gradient orbs */}
      <div 
        className="absolute -top-32 -left-32 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob transition-transform duration-1000"
        style={{
          transform: isHovered 
            ? `translate(${mousePosition.x / 10}px, ${mousePosition.y / 10}px) scale(1.2)` 
            : 'translate(0, 0) scale(1)'
        }}
      />
      <div 
        className="absolute -top-32 -right-32 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 transition-transform duration-1000"
        style={{
          transform: isHovered 
            ? `translate(${-mousePosition.x / 15}px, ${mousePosition.y / 15}px) scale(1.3)` 
            : 'translate(0, 0) scale(1)'
        }}
      />
      <div 
        className="absolute -bottom-32 left-20 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 transition-transform duration-1000"
        style={{
          transform: isHovered 
            ? `translate(${mousePosition.x / 20}px, ${-mousePosition.y / 20}px) scale(1.15)` 
            : 'translate(0, 0) scale(1)'
        }}
      />

      {/* Interactive light effect that follows cursor */}
      {isHovered && (
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(168, 85, 247, 0.15), transparent 40%)`
          }}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4 relative" noValidate>
        {/* Header with icon */}
        <div className="text-center space-y-2 mb-6">
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg mb-3 transition-all duration-500 ${
            isHovered ? 'shadow-purple-500/50 scale-110 rotate-12 animate-float' : 'shadow-purple-500/30 scale-100 rotate-0'
          }`}>
            <Sparkles className={`w-7 h-7 text-white transition-transform duration-500 ${isHovered ? 'rotate-180 scale-110' : 'rotate-0'}`} />
          </div>
          <h2 className={`text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent transition-all duration-500 ${
            isHovered ? 'scale-105 tracking-wider' : 'scale-100'
          }`}>
            Create Account
          </h2>
          <p className={`text-sm text-gray-600 dark:text-gray-400 transition-all duration-500 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-1'
          }`}>Join us and start your journey</p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <Alert variant="error" className="bg-red-50/80 backdrop-blur-sm border-red-200 dark:bg-red-900/20 animate-slideDown">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {serverError}
            </AlertDescription>
          </Alert>
        )}

        {/* Name Field with icon */}
        <div className={`group transition-all duration-500 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-90'}`} style={{ transitionDelay: '50ms' }}>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-all duration-300 group-focus-within:scale-110">
              <User className="w-5 h-5" />
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder=" "
              disabled={isLoading}
              required
              className={`peer w-full pl-11 pr-4 py-3 rounded-xl border-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 focus:scale-[1.02] outline-none ${
                errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-300 dark:hover:border-purple-700`}
            />
            <label className="absolute left-11 top-1/2 -translate-y-1/2 text-gray-500 transition-all duration-300 pointer-events-none peer-focus:top-0 peer-focus:left-3 peer-focus:text-xs peer-focus:text-purple-600 peer-focus:bg-white dark:peer-focus:bg-gray-950 peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-gray-950 peer-[:not(:placeholder-shown)]:px-2">
              Full Name
            </label>
          </div>
          {errors.name && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-slideDown">
              <XCircle className="w-4 h-4" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Field with availability check */}
        <div className={`group transition-all duration-500 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-90'}`} style={{ transitionDelay: '100ms' }}>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-all duration-300 z-10 group-focus-within:scale-110">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder=" "
              disabled={isLoading}
              required
              className={`peer w-full pl-11 pr-12 py-3 rounded-xl border-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 focus:scale-[1.02] outline-none ${
                errors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-300 dark:hover:border-purple-700`}
            />
            <label className="absolute left-11 top-1/2 -translate-y-1/2 text-gray-500 transition-all duration-300 pointer-events-none peer-focus:top-0 peer-focus:left-3 peer-focus:text-xs peer-focus:text-purple-600 peer-focus:bg-white dark:peer-focus:bg-gray-950 peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-gray-950 peer-[:not(:placeholder-shown)]:px-2 z-10">
              Email Address
            </label>

            {/* Email status indicators */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {emailChecking && (
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              )}
              {emailAvailable === true && formData.email && !emailChecking && (
                <CheckCircle className="w-5 h-5 text-green-500 animate-scaleIn" />
              )}
              {emailAvailable === false && formData.email && !emailChecking && (
                <XCircle className="w-5 h-5 text-red-500 animate-scaleIn" />
              )}
            </div>
          </div>

          {/* Email messages */}
          {emailMessage && formData.email && !errors.email && !emailChecking && (
            <p className={`mt-2 text-sm flex items-center gap-1 animate-slideDown ${
              emailAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {emailAvailable ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {emailMessage}
            </p>
          )}
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-slideDown">
              <XCircle className="w-4 h-4" />
              {errors.email}
            </p>
          )}
          {emailError && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 animate-slideDown">
              Unable to verify email availability
            </p>
          )}
        </div>

        {/* Password Field with strength meter */}
        <div className={`group transition-all duration-500 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-90'}`} style={{ transitionDelay: '150ms' }}>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-all duration-300 group-focus-within:scale-110">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder=" "
              disabled={isLoading}
              required
              className={`peer w-full pl-11 pr-12 py-3 rounded-xl border-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 focus:scale-[1.02] outline-none ${
                errors.password ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-300 dark:hover:border-purple-700`}
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

          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="mt-2 space-y-2 animate-slideDown">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold min-w-[50px] ${
                  passwordStrength.score <= 2 ? 'text-red-500' : 
                  passwordStrength.score === 3 ? 'text-yellow-500' : 
                  passwordStrength.score === 4 ? 'text-blue-500' : 'text-green-500'
                }`}>
                  {passwordStrength.label}
                </span>
              </div>

              {/* Password Requirements */}
              <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-100 dark:border-purple-800/30">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-purple-500" />
                  Password Requirements:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: "length", label: "8+ chars" },
                    { key: "uppercase", label: "Uppercase" },
                    { key: "lowercase", label: "Lowercase" },
                    { key: "number", label: "Number" },
                    { key: "special", label: "Special" },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className={`flex items-center gap-1 text-xs transition-all duration-300 ${
                        passwordStrength.checks[key as keyof typeof passwordStrength.checks]
                          ? "text-green-600 dark:text-green-400 scale-100"
                          : "text-gray-400 scale-95"
                      }`}
                    >
                      {passwordStrength.checks[key as keyof typeof passwordStrength.checks] ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border-2 border-current" />
                      )}
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-slideDown">
              <XCircle className="w-4 h-4" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className={`group transition-all duration-500 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-90'}`} style={{ transitionDelay: '200ms' }}>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-all duration-300 group-focus-within:scale-110">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder=" "
              disabled={isLoading}
              required
              className={`peer w-full pl-11 pr-12 py-3 rounded-xl border-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 focus:scale-[1.02] outline-none ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-300 dark:hover:border-purple-700`}
            />
            <label className="absolute left-11 top-1/2 -translate-y-1/2 text-gray-500 transition-all duration-300 pointer-events-none peer-focus:top-0 peer-focus:left-3 peer-focus:text-xs peer-focus:text-purple-600 peer-focus:bg-white dark:peer-focus:bg-gray-950 peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-gray-950 peer-[:not(:placeholder-shown)]:px-2">
              Confirm Password
            </label>
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-slideDown">
              <XCircle className="w-4 h-4" />
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Terms Checkbox */}
        <div className={`space-y-1 transition-all duration-500 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-90'}`} style={{ transitionDelay: '250ms' }}>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                disabled={isLoading}
                className="peer w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-2 focus:ring-purple-500/20 focus:ring-offset-0 transition-all cursor-pointer checked:bg-gradient-to-br checked:from-purple-500 checked:to-pink-600 checked:border-transparent checked:scale-110"
              />
              <CheckCircle className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-all duration-300 peer-checked:rotate-360" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
              I agree to the{" "}
              <Link href="/terms" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium underline underline-offset-2 hover:underline-offset-4 transition-all">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium underline underline-offset-2 hover:underline-offset-4 transition-all">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="text-sm text-red-600 dark:text-red-400 ml-8 flex items-center gap-1 animate-slideDown">
              <XCircle className="w-4 h-4" />
              {errors.agreeToTerms}
            </p>
          )}
        </div>

        {/* Security Notice */}
        <div className={`flex items-start gap-2.5 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/30 rounded-lg backdrop-blur-sm transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.01] ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-90'}`} style={{ transitionDelay: '300ms' }}>
          <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
          <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
            Your password is encrypted. We'll send a verification email after registration.
          </p>
        </div>

        {/* Submit Button with gradient */}
        <button
          type="submit"
          disabled={isLoading || emailChecking}
          className={`group relative w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${isHovered ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-90 scale-95'}`}
          style={{ transitionDelay: '350ms' }}
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 transition-all duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
          
          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
          </div>
          
          {/* Button content */}
          <span className="relative flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating your account...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                Create Account
              </>
            )}
          </span>
        </button>

        {/* Login Link */}
        <p className={`text-center text-sm text-gray-600 dark:text-gray-400 transition-all duration-500 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-70'}`} style={{ transitionDelay: '400ms' }}>
          Already have an account?{" "}
          <Link 
            href="/login" 
            className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-pink-700 transition-all hover:tracking-wide"
          >
            Sign in →
          </Link>
        </p>
      </form>
    </div>
  );
}