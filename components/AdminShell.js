import Link from "next/link";
import { adminText } from "@/lib/admin-text";

export function AdminShell({ children }) {
  return (
    <main className="admin-shell">
      <div className="hero admin-hero">
        <div className="admin-nav-actions">
          <Link href="/" className="ghost-button">
            {adminText.page.openPublicScoreboard}
          </Link>
          <a href="/api/admin/export" className="ghost-button" download="f1-scoreboard-export.csv">
            Export CSV
          </a>
          <form className="admin-logout" action="/api/auth/logout" method="post">
            <button className="ghost-button" type="submit">
              {adminText.page.logout}
            </button>
          </form>
        </div>
        <p className="eyebrow admin-eyebrow">{adminText.shell.eyebrow}</p>
        <h1>{adminText.shell.title}</h1>
        <p className="hero-copy">
          {adminText.shell.intro}
        </p>
      </div>
      {children}
    </main>
  );
}
