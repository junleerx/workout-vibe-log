/**
 * Supabase 설정
 * .env 파일에 VITE_SUPABASE_URL 과 VITE_SUPABASE_PUBLISHABLE_KEY 를 반드시 설정하세요.
 */
export const supabaseDefaults = {
  url: import.meta.env.VITE_SUPABASE_URL ?? '',
  anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
};
