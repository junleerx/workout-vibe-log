import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Timer, X, Plus, Minus } from 'lucide-react';

interface RestTimerProps {
  initialSeconds: number;
  onClose: () => void;
}

export function RestTimer({ initialSeconds, onClose }: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // 타이머 종료 시 알림음 등을 넣을 수 있습니다.
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {}); // 브라우저 정책상 차단될 수 있음
      setIsActive(false);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const progress = ((initialSeconds - timeLeft) / initialSeconds) * 100;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-card border-2 border-primary p-4 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-bold text-primary">
          <Timer className="w-5 h-5" />
          <span>휴식 중...</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="text-4xl font-black text-center my-4 tabular-nums">
        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </div>

      <Progress value={progress} className="h-2 mb-4" />

      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setTimeLeft(prev => prev + 30)}>+30초</Button>
        <Button variant="outline" size="sm" onClick={() => setTimeLeft(prev => Math.max(0, prev - 10))}>-10초</Button>
        <Button 
          variant={isActive ? "secondary" : "default"} 
          size="sm" 
          onClick={() => setIsActive(!isActive)}
        >
          {isActive ? "일시정지" : "다시 시작"}
        </Button>
      </div>
    </div>
  );
}
