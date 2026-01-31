import type { Metadata } from "next";
import { Forum } from "next/font/google";
import "./globals.css";
import { EventDataProvider } from "./providers";

const forum = Forum({
  variable: "--font-forum",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Theoria",
  description: "Theoria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${forum.variable} antialiased`}>
        <EventDataProvider>{children}</EventDataProvider>
      </body>
    </html>
  );
}
