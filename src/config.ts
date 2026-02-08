/**
 * Supabase 기본 설정 (Lovable 등에서 환경 변수 설정이 어려울 때 사용)
 * .env에 VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY 가 있으면 그걸 쓰고,
 * 없으면 아래 값이 사용됩니다. anon 키는 공개용이라 코드에 넣어도 괜찮습니다.
 */
export const supabaseDefaults = {
  url: 'https://nhdawwtkixcgwcfdbzot.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZGF3d3RraXhjZ3djZmRiem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDI2MDgsImV4cCI6MjA4NTg3ODYwOH0.FKyDDqkQ0Pe8dVyBKwSW1mfmZQ5ZfqQhJxHrjvAdAM4',
};
