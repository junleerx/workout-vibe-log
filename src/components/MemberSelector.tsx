import { useState } from 'react';
import { Member } from '@/types/member';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus, User, Trash2, Edit2, Check, X } from 'lucide-react';

interface MemberSelectorProps {
  members: Member[];
  selectedMember: Member | null;
  onSelectMember: (member: Member) => void;
  onAddMember: (name: string) => Promise<Member | undefined>;
  onUpdateMember: (memberId: string, updates: Partial<Pick<Member, 'name'>>) => Promise<void>;
  onDeleteMember: (memberId: string) => Promise<void>;
}

export function MemberSelector({
  members,
  selectedMember,
  onSelectMember,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
}: MemberSelectorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    setIsAdding(true);
    const member = await onAddMember(newMemberName.trim());
    if (member) {
      setNewMemberName('');
      setShowAddDialog(false);
    }
    setIsAdding(false);
  };

  const handleStartEdit = (member: Member) => {
    setEditingMemberId(member.id);
    setEditName(member.name);
  };

  const handleSaveEdit = async (memberId: string) => {
    if (!editName.trim()) return;
    await onUpdateMember(memberId, { name: editName.trim() });
    setEditingMemberId(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingMemberId(null);
    setEditName('');
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">회원 선택</h3>
        <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              관리
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>회원 관리</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  {editingMemberId === member.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleSaveEdit(member.id)}
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: member.avatar_color }}
                        >
                          {member.name.charAt(0)}
                        </div>
                        <span className="font-medium">{member.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStartEdit(member)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onDeleteMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  등록된 회원이 없습니다.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {members.map((member) => (
          <button
            key={member.id}
            onClick={() => onSelectMember(member)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              selectedMember?.id === member.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: member.avatar_color }}
            >
              {member.name.charAt(0)}
            </div>
            <span className="text-sm font-medium">{member.name}</span>
          </button>
        ))}

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-all whitespace-nowrap">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">회원 추가</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>새 회원 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="회원 이름을 입력하세요"
                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
              />
              <Button
                onClick={handleAddMember}
                disabled={!newMemberName.trim() || isAdding}
                className="w-full"
              >
                {isAdding ? '추가 중...' : '회원 추가'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
