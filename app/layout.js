import "./globals.css";
import { adminText } from "@/lib/admin-text";

export const metadata = {
  title: "F1 Scoreboard",
  description: "Publiek scoreboard en admin invoer voor race tijden."
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>
        <div className="app-frame">{children}</div>
        <footer className="site-footer">
          <p>{adminText.adminPage.footerCopyright}</p>
        </footer>
      </body>
    </html>
  );
}
