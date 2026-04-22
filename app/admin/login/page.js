import Link from "next/link";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { adminText } from "@/lib/admin-text";

export default function AdminLoginPage() {
  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">{adminText.loginPage.eyebrow}</p>
        <h1>{adminText.loginPage.title}</h1>
        <p className="hero-copy">
          {adminText.loginPage.intro}
        </p>
        <AdminLoginForm />
        <div className="hero-links">
          <Link className="ghost-button" href="/">
            {adminText.loginPage.backToScoreboard}
          </Link>
        </div>
      </section>
    </main>
  );
}
