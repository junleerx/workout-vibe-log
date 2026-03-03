import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Workout } from '@/types/workout';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface AIChatViewProps {
  recentWorkouts?: Workout[];
}

const SUGGESTED_QUESTIONS = [
  '내 벤치프레스 최근 기록이 어때?',
  '이번 주에 어느 부위를 덜 했어?',
  '요즘 운동 볼륨이 늘고 있어?',
  '가장 발전이 빠른 운동이 뭐야?',
];

export function AIChatView({ recentWorkouts = [] }: AIChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const workoutContext = recentWorkouts.slice(0, 10).map(w => ({
    date: w.date.slice(0, 10),
    duration: w.duration,
    totalVolume: w.totalVolume,
    exercises: w.exercises.map(ex => ({
      name: ex.name,
      category: ex.category,
      sets: ex.sets.map(s => ({
        reps: s.reps,
        weight: s.weight,
        completed: s.completed,
        rir: s.rir,
      })),
    })),
  }));

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // 최대 20개 메시지(10턴)만 API에 전달
    const historyForApi = newMessages.slice(-20).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { messages: historyForApi, workoutContext },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: '오류가 발생했어요. 다시 시도해주세요.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col">
      {/* 컨텍스트 배지 */}
      <div className="flex justify-center mb-5">
        {recentWorkouts.length > 0 ? (
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
            <History className="w-3.5 h-3.5" />
            최근 {Math.min(recentWorkouts.length, 10)}회 운동 기록 참고 중
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground text-xs px-3 py-1.5 rounded-full">
            운동 기록 없음 — 일반 운동 질문은 가능해요
          </div>
        )}
      </div>

      {/* 메시지 목록 */}
      <div className="flex flex-col gap-3 pb-28">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-5 pt-4 text-center px-2">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">AI 코치에게 뭐든 물어보세요</p>
              <p className="text-xs text-muted-foreground break-keep">
                운동 기록을 보고 더 정확한 답변을 드려요
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left text-xs px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/70 text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
            {msg.role === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-secondary text-foreground rounded-bl-md'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-secondary px-4 py-3 rounded-2xl rounded-bl-md">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력창 — 하단 고정 */}
      <div className="sticky bottom-20 bg-background/95 backdrop-blur-sm pt-3 pb-2 border-t border-border/40">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="AI 코치에게 질문하세요..."
            disabled={loading}
            className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            size="icon"
            className="rounded-xl w-12 h-12 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
