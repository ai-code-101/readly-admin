import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const display = Instrument_Serif({ variable: "--font-display-serif", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: { default: "Readly Admin", template: "%s · Readly Admin" },
  description: "Manage the Readly library",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} antialiased`}>
      <body className="min-h-screen font-sans">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="min-w-0 flex-1 px-4 pb-8 pt-20 sm:px-6 md:pt-8 lg:px-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
