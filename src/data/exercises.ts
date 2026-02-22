import { ExerciseTemplate } from '@/types/workout';

export const exerciseTemplates: ExerciseTemplate[] = [
  // 가슴
  { name: '벤치프레스', category: '가슴' },
  { name: '인클라인 벤치프레스', category: '가슴' },
  { name: '덤벨 플라이', category: '가슴' },
  { name: '케이블 크로스오버', category: '가슴' },
  { name: '푸쉬업', category: '가슴' },
  { name: '딥스', category: '가슴' },

  // 등
  { name: '풀업', category: '등' },
  { name: '랫풀다운', category: '등' },
  { name: '바벨로우', category: '등' },
  { name: '시티드 로우', category: '등' },
  { name: '덤벨 로우', category: '등' },
  { name: '데드리프트', category: '등' },

  // 어깨
  { name: '오버헤드 프레스', category: '어깨' },
  { name: '덤벨 숄더프레스', category: '어깨' },
  { name: '사이드 레터럴 레이즈', category: '어깨' },
  { name: '프론트 레이즈', category: '어깨' },
  { name: '페이스풀', category: '어깨' },
  { name: '리어 델트 플라이', category: '어깨' },

  // 하체
  { name: '스쿼트', category: '하체' },
  { name: '레그프레스', category: '하체' },
  { name: '런지', category: '하체' },
  { name: '레그 익스텐션', category: '하체' },
  { name: '레그 컬', category: '하체' },
  { name: '카프 레이즈', category: '하체' },
  { name: '힙 쓰러스트', category: '하체' },

  // 팔
  { name: '바벨 컬', category: '팔' },
  { name: '덤벨 컬', category: '팔' },
  { name: '해머 컬', category: '팔' },
  { name: '트라이셉스 푸쉬다운', category: '팔' },
  { name: '오버헤드 트라이셉스', category: '팔' },
  { name: '스컬크러셔', category: '팔' },

  // 복근
  { name: '크런치', category: '복근' },
  { name: '레그레이즈', category: '복근' },
  { name: '플랭크', category: '복근' },
  { name: '러시안 트위스트', category: '복근' },
  { name: '행잉 레그레이즈', category: '복근' },

  // 전신
  { name: '버피', category: '전신' },
  { name: '클린 앤 저크', category: '전신' },
  { name: '케틀벨 스윙', category: '전신' },
];

export const categoryColors: Record<string, string> = {
  '가슴': 'bg-accent/15 text-accent border-accent/20',
  '등': 'bg-primary/15 text-primary border-primary/20',
  '어깨': 'bg-primary/20 text-primary border-primary/30',
  '하체': 'bg-amber-500/15 text-amber-500 border-amber-500/20',
  '팔': 'bg-secondary text-secondary-foreground border-border',
  '복근': 'bg-secondary text-secondary-foreground border-border',
  '전신': 'bg-primary/20 text-primary border-primary/30',
};
