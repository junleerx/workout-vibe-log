/**
 * Supabase 기본 설정 (Lovable 등에서 환경 변수 설정이 어려울 때 사용)
 * .env에 VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY 가 있으면 그걸 쓰고,
 * 없으면 아래 값이 사용됩니다. anon 키는 공개용이라 코드에 넣어도 괜찮습니다.
 */
export const supabaseDefaults = {
  url: 'https://khylugmamayscyktzlhy.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoeWx1Z21hbWF5c2N5a3R6bGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MzkwNTEsImV4cCI6MjA4NzAxNTA1MX0.UekVP1nmzfKE_3X8FE7iqxQVP6PYGOh5V1njKrnXREk',
};
