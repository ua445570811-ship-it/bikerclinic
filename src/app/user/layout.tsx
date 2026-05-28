import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Garage — BikerClinic",
  description: "Customer portal for BikerClinic. Track bookings and service history.",
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0E0E18" }}>
      {children}
    </div>
  );
}
