import { adminText } from "@/lib/admin-text";

export function AdminShell({ children }) {
  return (
    <main className="admin-shell">
      <div className="hero admin-hero">
        <form className="admin-logout" action="/api/auth/logout" method="post">
          <button className="ghost-button" type="submit">
            {adminText.page.logout}
          </button>
        </form>
        <p className="eyebrow">{adminText.shell.eyebrow}</p>
        <h1>{adminText.shell.title}</h1>
        <p className="hero-copy">
          {adminText.shell.intro}
        </p>
      </div>
      {children}
    </main>
  );
}
