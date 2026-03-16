"use client";
import React from "react";
import SchedulePage from "./components/SchedulePage";
import { usePageTitle } from "@/lib/usePageTitle";

export default function HorariosPage() {
  usePageTitle("Horarios");
  return (
    <div className="min-h-screen bg-gray-50">
      <SchedulePage />
    </div>
  );
}
