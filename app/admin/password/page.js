import { redirect } from "next/navigation";
import { AdminPasswordChangeForm } from "@/components/AdminPasswordChangeForm";
import { adminText } from "@/lib/admin-text";
import { hasValidAdminSession, isPasswordChangeRequired } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPasswordPage() {
  const isLoggedIn = await hasValidAdminSession();

  if (!isLoggedIn) {
    redirect("/admin/login");
  }

  const mustChangePassword = await isPasswordChangeRequired();

  return (
    <main className="login-shell">
      <section className="login-card">
        <h1>{mustChangePassword ? adminText.auth.firstLoginTitle : adminText.auth.changePasswordTitle}</h1>
        <p className="subtle">
          {mustChangePassword ? adminText.auth.firstLoginIntro : adminText.auth.changePasswordIntro}
        </p>
        <AdminPasswordChangeForm requireCurrentPassword />
      </section>
    </main>
  );
}
