import { ADMIN_COOKIE_NAME } from "@/lib/constants";

export function hasValidAdminSession(request) {
  const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  return Boolean(
    sessionCookie &&
      process.env.ADMIN_SESSION_TOKEN &&
      sessionCookie === process.env.ADMIN_SESSION_TOKEN
  );
}
