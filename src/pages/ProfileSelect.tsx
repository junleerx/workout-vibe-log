import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Plus, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ProfileSelect = () => {
    const [newMemberName, setNewMemberName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const { members, selectedMember, setSelectedMember, addMember } = useMembers();
    const { toast } = useToast();

    useEffect(() => {
          if (!user) {
                  navigate('/auth');
          }
    }, [user, navigate]);

    const handleSelectMember = (memberId: string) => {
          const member = members.find(m => m.id === memberId);
          if (member) {
                  setSelectedMember(member);
                  navigate('/');
          }
    };

    const handleAddMember = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!newMemberName.trim()) {
                  toast({
                            title: '입력 오류',
                            description: '프로필 이름을 입력해주세요.',
                            variant: 'destructive',
                  });
                  return;
          }

          setIsCreating(true);
          try {
                  const newMember = await addMember(newMemberName);
                  if (newMember) {
                            setSelectedMember(newMember);
                            setNewMemberName('');
                            navigate('/');
                  }
          } catch (error) {
                  toast({
                            title: '오류',
                            description: '프로필 생성에 실패했습니다.',
                            variant: 'destructive',
                  });
          } finally {
                  setIsCreating(false);
          }
    };

    const handleSignOut = async () => {
          await signOut();
          navigate('/auth');
    };

    return (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                        <Card className="border-border/50 bg-card/50 backdrop-blur mb-6">
                                  <CardHeader className="text-center space-y-4">
                                              <div className="flex justify-center">
                                                            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                                                                            <Dumbbell className="h-8 w-8 text-primary" />
                                                            </div>div>
                                              </div>div>
                                              <div>
                                                            <CardTitle className="text-2xl font-bold">프로필 선택</CardTitle>CardTitle>
                                                            <CardDescription className="text-muted-foreground">
                                                                            운동 기록을 관리할 프로필을 선택하세요
                                                            </CardDescription>CardDescription>
                                              </div>div>
                                              <div className="text-sm text-muted-foreground">
                                                            로그인: {user?.email}
                                              </div>div>
                                  </CardHeader>CardHeader>
                        </Card>Card>
                
                  {/* 기존 프로필 목록 */}
                  {members.length > 0 && (
                      <Card className="border-border/50 bg-card/50 backdrop-blur mb-6">
                                  <CardHeader>
                                                <CardTitle className="text-lg">기존 프로필</CardTitle>CardTitle>
                                  </CardHeader>CardHeader>
                                  <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                  {members.map((member) => (
                                          <Button
                                                                key={member.id}
                                                                onClick={() => handleSelectMember(member.id)}
                                                                variant={selectedMember?.id === member.id ? 'default' : 'outline'}
                                                                className="h-auto py-3 px-4 flex flex-col items-start justify-start"
                                                              >
                                                              <span className="font-semibold">{member.name}</span>span>
                                                              <span className="text-xs text-muted-foreground">
                                                                {member.workouts?.length || 0}개 운동 기록
                                                              </span>span>
                                          </Button>Button>
                                        ))}
                                                </div>div>
                                  </CardContent>CardContent>
                      </Card>Card>
                        )}
                
                  {/* 새 프로필 생성 */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur mb-6">
                                  <CardHeader>
                                              <CardTitle className="text-lg flex items-center gap-2">
                                                            <Plus className="h-5 w-5" />
                                                            새 프로필 생성
                                              </CardTitle>CardTitle>
                                  </CardHeader>CardHeader>
                                  <CardContent>
                                              <form onSubmit={handleAddMember} className="space-y-4">
                                                            <Input
                                                                              type="text"
                                                                              placeholder="프로필 이름 (예: 상현, 복근 운동 등)"
                                                                              value={newMemberName}
                                                                              onChange={(e) => setNewMemberName(e.target.value)}
                                                                              className="bg-background/50 border-border/50"
                                                                              disabled={isCreating}
                                                                            />
                                                            <Button
                                                                              type="submit"
                                                                              className="w-full"
                                                                              disabled={isCreating}
                                                                            >
                                                                            프로필 생성 및 진입
                                                            </Button>Button>
                                              </form>form>
                                  </CardContent>CardContent>
                        </Card>Card>
                
                  {/* 로그아웃 버튼 */}
                        <div className="text-center">
                                  <Button
                                                variant="ghost"
                                                onClick={handleSignOut}
                                                className="text-muted-foreground hover:text-foreground"
                                              >
                                              <LogOut className="h-4 w-4 mr-2" />
                                              로그아웃
                                  </Button>Button>
                        </div>div>
                </div>div>
          </div>div>
        );
};

export default ProfileSelect;</div>
