import { AuthCard, LoginForm } from "@/components/auth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Todo App",
  description: "Login to your todo account",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome Back"
      description="Enter your credentials to access your todos"
    >
      <LoginForm />
    </AuthCard>
  );
}