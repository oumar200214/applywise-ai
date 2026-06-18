import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "ApplyWise AI - AI-Powered Job Application Assistant",
  description: "Turn any job post into a complete application. Upload your CV, paste a job offer, and get a tailored CV, cover letter, interview questions, and skill gap analysis in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a365d',
                color: '#fff',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              },
              success: {
                iconTheme: { primary: '#4edea3', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ff6b6b', secondary: '#fff' },
                style: { background: '#ba1a1a' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
