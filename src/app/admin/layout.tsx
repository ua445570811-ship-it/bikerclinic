import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Portal — BikerClinic",
  description: "Executive CRM portal for BikerClinic operations team.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A14" }}>
      {children}
    </div>
  );
}
