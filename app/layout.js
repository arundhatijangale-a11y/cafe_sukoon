import "@/css/styles.css";
import "@/css/auth.css";

export const metadata = {
  title: "Café Sukoon — AI-Powered Music Sanctuary",
  description: "Café Sukoon — Where Coffee Meets Music. Experience an AI-powered personalized music recommendation system blending Hollywood Hits and Bollywood Vibes with machine learning.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  themeColor: "#16100c",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
