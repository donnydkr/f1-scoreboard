import "./globals.css";

export const metadata = {
  title: "F1 Scoreboard",
  description: "Publiek scoreboard en admin invoer voor race tijden."
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
