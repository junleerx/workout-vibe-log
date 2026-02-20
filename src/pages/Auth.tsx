import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// 간단한 ID를 이메일 형식으로 변환
const formatAsEmail = (id: string) => {
  if (id.includes('@')) return id;
  return `${id}@junisgym.com`;
};

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading, signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate('/profile-select');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !password) {
      toast({
        title: '입력 오류',
        description: 'ID와 비밀번호를 모두 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: '비밀번호 오류',
        description: '비밀번호는 최소 6자 이상이어야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const email = formatAsEmail(userId);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: '가입 오류',
              description: '이미 가입된 ID입니다. 로그인해주세요.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: '가입 오류',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: '가입 완료!',
            description: '이제 로그인할 수 있습니다.',
          });
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: '로그인 오류',
              description: 'ID 또는 비밀번호가 올바르지 않습니다.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: '로그인 오류',
              description: error.message,
              variant: 'destructive',
            });
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />

      <Card className="w-full max-w-md glass gradient-border border-border/30 relative z-10">
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="flex justify-center">
            <div className="p-3 rounded-2xl bg-primary/10 glow-effect">
              <Dumbbell className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gradient">Juni's Gym</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              {isSignUp ? '계정을 만들어 운동을 기록하세요' : '간단한 ID로 로그인하세요'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="ID (예: qwer)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="bg-background/50 border-border/40 rounded-xl h-11 focus:ring-2 focus:ring-primary/30 transition-shadow"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="비밀번호 (6자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-border/40 rounded-xl h-11 focus:ring-2 focus:ring-primary/30 transition-shadow"
                disabled={isSubmitting}
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--gradient-premium)' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isSignUp ? '가입하기' : '로그인'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              disabled={isSubmitting}
            >
              {isSignUp
                ? '이미 계정이 있으신가요? 로그인'
                : '계정이 없으신가요? 가입하기'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
