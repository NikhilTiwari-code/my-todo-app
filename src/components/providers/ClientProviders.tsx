"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import ReactQueryProvider from "@/lib/react-query-provider";

interface ClientProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper
 * This component wraps all providers that need client-side execution
 * (like SocketProvider which uses socket.io-client)
 */
export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      <SocketProvider>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
