import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, LogOut, Edit2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ProfileSelect = () => {
  const [newMemberName, setNewMemberName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { members, selectedMember, setSelectedMember, addMember, updateMember } = useMembers();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  const handleSelectMember = (memberId: string) => {
    if (editingId) return;
    const member = members.find(m => m.id === memberId);
    if (member) {
      setSelectedMember(member);
      navigate('/');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      toast({ title: '입력 오류', description: '프로필 이름을 입력해주세요.', variant: 'destructive' });
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
    } catch {
      toast({ title: '오류', description: '프로필 생성에 실패했습니다.', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const startEditing = (memberId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(memberId);
    setEditingName(currentName);
  };

  const handleSaveRename = async (memberId: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    await updateMember(memberId, { name: trimmed });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
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
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
                <img src="/logo-patch.jpg" alt="Juni's Gym" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">프로필 선택</CardTitle>
              <CardDescription className="text-muted-foreground">
                운동 기록을 관리할 프로필을 선택하세요
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">로그인: {user?.email}</div>
          </CardHeader>
        </Card>

        {members.length > 0 && (
          <Card className="border-border/50 bg-card/50 backdrop-blur mb-6">
            <CardHeader>
              <CardTitle className="text-lg">기존 프로필</CardTitle>
              <p className="text-xs text-muted-foreground">✏️ 연필 아이콘을 눌러 이름을 변경할 수 있습니다</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => handleSelectMember(member.id)}
                    className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all
                      ${editingId === member.id ? 'cursor-default' : 'cursor-pointer'}
                      ${selectedMember?.id === member.id
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-secondary/40 border-border/40 hover:border-primary/40 hover:bg-secondary/70'
                      }`}
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: member.avatar_color || '#6366f1' }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name or edit input */}
                    <div className="flex-1 min-w-0">
                      {editingId === member.id ? (
                        <Input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(member.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 py-0 px-2 text-sm bg-background text-foreground border-primary"
                        />
                      ) : (
                        <div>
                          <div className="font-semibold text-sm">{member.name}</div>
                          <div className={`text-xs ${selectedMember?.id === member.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            운동 프로필
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {editingId === member.id ? (
                        <>
                          <button
                            onClick={() => handleSaveRename(member.id)}
                            className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/40 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => startEditing(member.id, member.name, e)}
                          className={`p-1.5 rounded-lg transition-colors
                            ${selectedMember?.id === member.id
                              ? 'hover:bg-white/20 text-primary-foreground/70'
                              : 'hover:bg-primary/10 text-muted-foreground hover:text-primary'
                            }`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/50 bg-card/50 backdrop-blur mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5" />
              새 프로필 생성
            </CardTitle>
          </CardHeader>
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
              <Button type="submit" className="w-full" disabled={isCreating}>
                프로필 생성 및 진입
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSelect;
