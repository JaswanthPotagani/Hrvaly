import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { Providers } from "@/components/providers";
import "@/lib/env";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Margi - AI Placement Assistant & ATS Resume Checker",
  description: "Boost your career with AI-powered mock interviews, ATS resume scoring, and personalized placement guidance.",
  keywords: ["AI Interview Prep", "ATS Resume Checker", "Mock Interview AI", "Placement Preparation Tool", "AI career coach", "resume builder", "mock interview", "interview preparation", "career guidance", "job search", "artificial intelligence", "career acceleration"],
  authors: [{ name: "MARGI Team" }],
  creator: "MARGI",
  publisher: "MARGI",
  metadataBase: new URL("https://www.margi.live"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Margi - AI Placement Assistant & ATS Resume Checker",
    description: "Boost your career with AI-powered mock interviews, ATS resume scoring, and personalized placement guidance.",
    url: "https://www.margi.live",
    siteName: "MARGI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Margi - AI Placement Assistant & ATS Resume Checker",
    description: "Build professional resumes, practice mock interviews, and get hired faster with MARGI.",
    creator: "@margi_live",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} relative`}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "WebSite",
                    "name": "MARGI",
                    "url": "https://www.margi.live",
                    "potentialAction": {
                      "@type": "SearchAction",
                      "target": "https://www.margi.live/search?q={search_term_string}",
                      "query-input": "required name=search_term_string"
                    }
                  },
                  {
                    "@type": "Organization",
                    "name": "MARGI",
                    "url": "https://www.margi.live",
                    "logo": "https://www.margi.live/icon.png",
                    "sameAs": ["https://twitter.com/margi_live"]
                  }
                ]
              }),
            }}
          />
          <Providers>
            <Header />
            <main className="min-h-screen relative z-10">{children}</main>
            
            <footer className="bg-muted/30 backdrop-blur-md py-12 border-t border-border/50">
              <div className="container mx-auto px-4 text-center text-muted-foreground">
                <p>© Copyright MARGI 2025</p>
              </div>
            </footer>
          </Providers>
        </body>
      </html>
  );
}
