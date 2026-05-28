import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mechanic Portal — BikerClinic",
  description: "Field technician app for BikerClinic mechanics.",
};

export default function MechanicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0E0E18" }}>
      {children}
    </div>
  );
}
