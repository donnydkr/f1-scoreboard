import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getAppSetting, setAppSetting } from "@/db/queries/app-settings";
import {
  ADMIN_DEFAULT_PASSWORD,
  ADMIN_DEFAULT_USERNAME,
  ADMIN_FORCE_PASSWORD_CHANGE_COOKIE,
  ADMIN_PASSWORD_HASH_SETTING_KEY,
  ADMIN_PASSWORD_MUST_CHANGE_SETTING_KEY,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS
} from "@/lib/constants";

function toBuffer(value) {
  return Buffer.from(value, "utf8");
}

function safeStringEqual(left, right) {
  const leftBuffer = toBuffer(left);
  const rightBuffer = toBuffer(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getSessionToken() {
  return process.env.ADMIN_SESSION_TOKEN || "development-admin-session-token";
}

function isHttpsAppUrl() {
  const appUrl = process.env.APP_URL || "";

  try {
    return new URL(appUrl).protocol === "https:";
  } catch {
    return false;
  }
}

function getCookieOptions() {
  const secure = isHttpsAppUrl() || (process.env.NODE_ENV === "production" && !process.env.APP_URL);

  return {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS
  };
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = String(storedHash || "").split(":");

  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = scryptSync(password, salt, 64).toString("hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const actualBuffer = Buffer.from(actualHash, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function isValidAdminSessionToken(value) {
  if (!value) {
    return false;
  }

  return safeStringEqual(value, getSessionToken());
}

export async function getAdminAuthState() {
  const [passwordHash, mustChangeSetting] = await Promise.all([
    getAppSetting(ADMIN_PASSWORD_HASH_SETTING_KEY),
    getAppSetting(ADMIN_PASSWORD_MUST_CHANGE_SETTING_KEY)
  ]);

  const hasStoredPassword = Boolean(passwordHash);
  const mustChangePassword = hasStoredPassword ? mustChangeSetting !== "0" : true;

  return {
    username: ADMIN_DEFAULT_USERNAME,
    passwordHash,
    hasStoredPassword,
    mustChangePassword
  };
}

export async function verifyAdminCredentials(username, password) {
  const normalizedUsername = typeof username === "string" ? username.trim() : "";
  const normalizedPassword = typeof password === "string" ? password : "";

  if (!safeStringEqual(normalizedUsername, ADMIN_DEFAULT_USERNAME)) {
    return { ok: false, mustChangePassword: false };
  }

  const state = await getAdminAuthState();
  const validPassword = state.hasStoredPassword
    ? verifyPassword(normalizedPassword, state.passwordHash)
    : safeStringEqual(normalizedPassword, ADMIN_DEFAULT_PASSWORD);

  return {
    ok: validPassword,
    mustChangePassword: validPassword ? state.mustChangePassword : false
  };
}

export async function changeAdminPassword(newPassword) {
  const hashedPassword = hashPassword(newPassword);

  await Promise.all([
    setAppSetting(ADMIN_PASSWORD_HASH_SETTING_KEY, hashedPassword),
    setAppSetting(ADMIN_PASSWORD_MUST_CHANGE_SETTING_KEY, "0")
  ]);
}

export async function hasValidAdminSession() {
  const cookieStore = await cookies();
  return isValidAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value || "");
}

export async function isPasswordChangeRequired() {
  const state = await getAdminAuthState();
  return state.mustChangePassword;
}

export async function canUseProtectedAdminArea() {
  const [isLoggedIn, mustChangePassword] = await Promise.all([
    hasValidAdminSession(),
    isPasswordChangeRequired()
  ]);

  return {
    isLoggedIn,
    mustChangePassword,
    isReady: isLoggedIn && !mustChangePassword
  };
}

export function applyAdminSessionCookies(response, mustChangePassword) {
  const options = getCookieOptions();

  response.cookies.set(ADMIN_SESSION_COOKIE, getSessionToken(), options);
  response.cookies.set(
    ADMIN_FORCE_PASSWORD_CHANGE_COOKIE,
    mustChangePassword ? "1" : "0",
    options
  );

  return response;
}

export function clearAdminSessionCookies(response) {
  const secure = isHttpsAppUrl() || (process.env.NODE_ENV === "production" && !process.env.APP_URL);

  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0
  });

  response.cookies.set(ADMIN_FORCE_PASSWORD_CHANGE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0
  });

  return response;
}
