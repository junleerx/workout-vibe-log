import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Member } from '@/types/member';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
];

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMembers = useCallback(async () => {
    if (!user) {
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const memberList = (data || []) as Member[];
      setMembers(memberList);

      // Auto-select first member if none selected
      if (memberList.length > 0 && !selectedMember) {
        setSelectedMember(memberList[0]);
      }
    } catch (error: any) {
      console.error('Error fetching members:', error);
      toast({
        title: '오류',
        description: `회원 목록 로드 실패: ${error.message || '알 수 없는 오류'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, selectedMember]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = async (name: string) => {
    if (!user) return;

    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    try {
      const { data, error } = await supabase
        .from('members')
        .insert({
          user_id: user.id,
          name,
          avatar_color: randomColor,
        })
        .select()
        .single();

      if (error) throw error;

      const newMember = data as Member;
      setMembers([...members, newMember]);

      if (!selectedMember) {
        setSelectedMember(newMember);
      }

      toast({
        title: '추가 완료',
        description: `${name}님이 추가되었습니다.`,
      });

      return newMember;
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({
        title: '오류',
        description: `회원 추가 실패: ${error.message || '알 수 없는 오류'}`,
        variant: 'destructive',
      });
    }
  };

  const updateMember = async (memberId: string, updates: Partial<Pick<Member, 'name' | 'avatar_color'>>) => {
    try {
      const { error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', memberId);

      if (error) throw error;

      setMembers(members.map(m =>
        m.id === memberId ? { ...m, ...updates } : m
      ));

      if (selectedMember?.id === memberId) {
        setSelectedMember({ ...selectedMember, ...updates });
      }

      toast({
        title: '수정 완료',
        description: '회원 정보가 수정되었습니다.',
      });
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: '오류',
        description: '회원 수정에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const deleteMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      const updatedMembers = members.filter(m => m.id !== memberId);
      setMembers(updatedMembers);

      if (selectedMember?.id === memberId) {
        setSelectedMember(updatedMembers[0] || null);
      }

      toast({
        title: '삭제 완료',
        description: '회원이 삭제되었습니다.',
      });
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: '오류',
        description: '회원 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  return {
    members,
    selectedMember,
    setSelectedMember,
    loading,
    addMember,
    updateMember,
    deleteMember,
    refetchMembers: fetchMembers,
  };
}
