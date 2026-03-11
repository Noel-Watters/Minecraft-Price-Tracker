import type { Metadata } from "next";
import "@/styles/globals.css";




export const metadata: Metadata = {
  title: "Beacon",
  description: "Beacon - CivMC Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head> 
      <body> {children}</body>
    </html>
  );
}

