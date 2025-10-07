import { AuthCard, RegisterForm } from "@/components/auth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | Todo App",
  description: "Create a new todo account",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create Account"
      description="Sign up to start managing your todos"
    >
      <RegisterForm />
    </AuthCard>
  );
}
