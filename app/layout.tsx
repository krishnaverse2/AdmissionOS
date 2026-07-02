import type { Metadata } from "next";
import "./globals.css";
import BottomNavigation from "@/components/BottomNavigation";

export const metadata: Metadata = {
  title: "AdmissionOS — College Predictor",
  description:
    "Predict Maharashtra DSE/CAP admission chances using official cutoff data.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      style={
        {
          "--font-space-grotesk":
            "'Avenir Next', 'Segoe UI Semibold', system-ui, sans-serif",
          "--font-inter":
            "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
          "--font-jetbrains-mono":
            "'JetBrains Mono', 'SF Mono', 'Cascadia Mono', Consolas, monospace",
        } as React.CSSProperties
      }
    >
      <body className="min-h-full bg-[#E6F3F1] text-ink">
        <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-[#F8FAFC] shadow-2xl shadow-teal-950/10 sm:border-x sm:border-teal-950/10">
          <main className="flex-1 pb-24">
            {children}
          </main>

          <BottomNavigation />
        </div>
      </body>
    </html>
  );
}