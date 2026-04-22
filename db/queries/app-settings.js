import { sql } from "@/lib/db";

async function ensureAppSettingsTable() {
  await sql(
    `
      create table if not exists app_settings (
        key text primary key,
        value text,
        updated_at timestamptz not null default now()
      )
    `
  );
}

export async function getAppSetting(key) {
  await ensureAppSettingsTable();

  const result = await sql(
    `
      select value
      from app_settings
      where key = $1
      limit 1
    `,
    [key]
  );

  return result.rows[0]?.value || null;
}

export async function setAppSetting(key, value) {
  await ensureAppSettingsTable();

  const result = await sql(
    `
      insert into app_settings (key, value, updated_at)
      values ($1, $2, now())
      on conflict (key) do update
        set value = excluded.value,
            updated_at = now()
      returning key, value, updated_at
    `,
    [key, value]
  );

  return result.rows[0] || null;
}
