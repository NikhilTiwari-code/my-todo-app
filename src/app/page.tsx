import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with Theme Toggle */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">TodoApp</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Manage Your Tasks
            <br />
            <span className="text-blue-600">Effortlessly</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            A modern, fast, and intuitive todo application with dark mode support.
            Stay organized and boost your productivity.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center mb-16">
            <Link href="/register">
              <Button size="lg">
                Start Free →
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-4">✓</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Simple & Intuitive
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Clean interface designed for productivity. No clutter, just tasks.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-4">🌙</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Dark Mode
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Easy on the eyes with automatic theme switching support.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Secure & Private
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your data is encrypted and protected with industry standards.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600 dark:text-gray-400">
          <p>© 2025 TodoApp. Built with Next.js and TypeScript.</p>
        </div>
      </footer>
    </div>
  );
}
