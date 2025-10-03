import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with Theme Toggle */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Todo App</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Welcome to Your Todo App</h2>
          <p className="text-muted-foreground mb-6">
            Click the theme toggle button in the top right to switch between light and dark mode.
          </p>
          
          {/* Demo Card */}
          <div className="bg-secondary border border-border rounded-lg p-6 mb-4">
            <h3 className="text-xl font-semibold mb-2">Sample Todo Item</h3>
            <p className="text-secondary-foreground">
              This is where your todos will appear. The theme automatically switches colors!
            </p>
          </div>

          {/* Demo Button */}
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
            Add Todo
          </button>
        </div>
      </main>
    </div>
  );
}
