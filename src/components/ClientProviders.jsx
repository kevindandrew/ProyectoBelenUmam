"use client";
import { SessionProvider } from "@/components/SessionProvider";

export default function ClientProviders({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
