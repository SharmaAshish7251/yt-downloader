import "./globals.css";

export const metadata = {
  title: "YT Downloader — Local video downloads",
  description:
    "Download YouTube videos you own or have permission to save with a local, private downloader.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
