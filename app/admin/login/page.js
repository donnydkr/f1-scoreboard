import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { adminText } from "@/lib/admin-text";
import { hasValidAdminSession, isPasswordChangeRequired } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }) {
  const isLoggedIn = await hasValidAdminSession();
  const params = await searchParams;

  if (isLoggedIn) {
    const mustChangePassword = await isPasswordChangeRequired();
    redirect(mustChangePassword ? "/admin/password" : "/admin");
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <h1>{adminText.auth.loginTitle}</h1>
        <p className="subtle">{adminText.auth.loginIntro}</p>
        {params?.logged_out === "1" ? <p className="form-success">{adminText.auth.loggedOutMessage}</p> : null}
        <AdminLoginForm />
      </section>
    </main>
  );
}
