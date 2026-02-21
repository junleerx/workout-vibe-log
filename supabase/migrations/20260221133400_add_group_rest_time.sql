-- 서킷/그룹 라운드 간 휴식 시간 (초)
ALTER TABLE public.program_exercises ADD COLUMN IF NOT EXISTS group_rest_time integer;
