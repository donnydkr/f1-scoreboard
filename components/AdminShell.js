import Link from "next/link";
import { AdminGearLink } from "@/components/AdminGearLink";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { adminText } from "@/lib/admin-text";

export function AdminShell({
  children,
  eyebrow,
  title,
  intro,
  showLogout = true,
  showAdminLink = false,
  variant = "default"
}) {
  const heroClassName = `hero${variant === "admin" ? " admin-hero" : ""}`;

  return (
    <main className="admin-shell">
      <div className={heroClassName}>
        <img className="hero-logo" src="/F1_logo.png" alt="F1 logo" />
        <div className="admin-nav-actions">
          <div className="nav-action-group">
            <Link href="/public" className="ghost-button">
              {adminText.page.openPublicScoreboard}
            </Link>
            {showLogout ? <AdminLogoutButton /> : null}
          </div>
          {showAdminLink ? <AdminGearLink /> : null}
        </div>
        <p className="eyebrow admin-eyebrow">{eyebrow || adminText.shell.eyebrow}</p>
        <h1>{title || adminText.shell.title}</h1>
        {(intro || adminText.shell.intro) ? (
          <p className="hero-copy">{intro || adminText.shell.intro}</p>
        ) : null}
      </div>
      {children}
    </main>
  );
}
