import React from "react";

export const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen relative overflow-hidden">
    <div className="absolute inset-0 bg-pearls" />
    <div className="relative p-4 flex flex-col gap-4 text-white">{children}</div>
  </div>
);
