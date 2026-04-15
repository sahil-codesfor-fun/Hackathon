import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "GUARDEX — AI-Powered Exam Proctoring",
  description: "Comprehensive AI-driven online exam proctoring platform for campus coding examinations. Real-time webcam monitoring, tab detection, clipboard control, and integrated secure IDE.",
  keywords: "exam proctoring, AI proctoring, coding exam, online exam, secure IDE, academic integrity",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
