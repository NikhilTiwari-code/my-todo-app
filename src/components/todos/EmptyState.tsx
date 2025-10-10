"use client";

import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/Alert";

interface EmptyStateProps {
  message?: string;
  description?: string;
}

export default function EmptyState({
  message = "No todos yet",
  description = "Create your first todo to get started!",
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <Alert variant="default" className="max-w-md">
        <AlertTitle className="text-center text-xl">{message}</AlertTitle>
        <AlertDescription className="text-center mt-2">
          {description}
        </AlertDescription>
      </Alert>
    </div>
  );
}
