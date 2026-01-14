import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Geist, Amarante } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { ConditionalLayout } from "@/components/conditional-layout";
// import { Analytics } from "@vercel/analytics/react";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // Support for iPhone notch and dynamic UI
};

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Paga",
  description: "Dream Studio.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

const amarante = Amarante({
  variable: "--font-amarante",
  display: "swap",
  subsets: ["latin"],
  weight: "400",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.className} ${amarante.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster
            position="top-right"
            expand={false}
            offset="16px"
            className="!z-[99999]"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast: "!bg-background !text-foreground !border !border-border !shadow-lg !rounded-lg !p-4 w-full max-w-[calc(100vw-2rem)] sm:max-w-md",
                title: "!text-sm !font-semibold !text-foreground",
                description: "!text-sm !text-muted-foreground !mt-1",
                actionButton: "!bg-primary !text-primary-foreground !rounded-md !px-3 !py-2 !text-sm !font-medium !mt-3",
                cancelButton: "!bg-muted !text-muted-foreground !rounded-md !px-3 !py-2 !text-sm !font-medium !mt-3 !ml-2",
                closeButton: "!bg-background !text-foreground !border !border-border !rounded-md",
                success: "!bg-green-50 !text-green-900 !border-green-200 dark:!bg-green-950 dark:!text-green-100 dark:!border-green-800",
                error: "!bg-red-50 !text-red-900 !border-red-200 dark:!bg-red-950 dark:!text-red-100 dark:!border-red-800",
                warning: "!bg-yellow-50 !text-yellow-900 !border-yellow-200 dark:!bg-yellow-950 dark:!text-yellow-100 dark:!border-yellow-800",
                info: "!bg-blue-50 !text-blue-900 !border-blue-200 dark:!bg-blue-950 dark:!text-blue-100 dark:!border-blue-800",
              },
            }}
          />
          <ConditionalLayout>{children}</ConditionalLayout>
        </ThemeProvider>
        {/* <Analytics /> */}
      </body>
    </html>
  );
}
