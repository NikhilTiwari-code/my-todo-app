"use client";

import TodoList from "@/components/todos/todo-list";
import CreateTodoForm from "@/components/todos/create-todo-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function TodosPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">My Todos</h1>
          <ThemeToggle />
        </div>


        

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Form - Left Column */}
          <div className="lg:col-span-1">
            <CreateTodoForm />
          </div>

          {/* Todo List - Right Column */}
          <div className="lg:col-span-2">
            <TodoList />
          </div>
        </div>
      </div>
    </div>
  );
}
