import Link from "next/link";
import { adminText } from "@/lib/admin-text";

export function AdminGearLink() {
  return (
    <Link href="/admin" className="ghost-button icon-button" aria-label={adminText.page.openAdminDashboard}>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
        <path
          d="M10.5 2h3l.6 2.36a7.78 7.78 0 0 1 1.78.74l2.1-1.2 2.12 2.12-1.2 2.1c.3.57.55 1.16.74 1.78L22 10.5v3l-2.36.6a7.78 7.78 0 0 1-.74 1.78l1.2 2.1-2.12 2.12-2.1-1.2a7.78 7.78 0 0 1-1.78.74L13.5 22h-3l-.6-2.36a7.78 7.78 0 0 1-1.78-.74l-2.1 1.2L3.9 17.98l1.2-2.1a7.78 7.78 0 0 1-.74-1.78L2 13.5v-3l2.36-.6c.19-.62.44-1.21.74-1.78l-1.2-2.1L6.02 3.9l2.1 1.2c.57-.3 1.16-.55 1.78-.74L10.5 2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </Link>
  );
}
