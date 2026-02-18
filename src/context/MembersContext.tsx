import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Member } from '@/types/member';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const AVATAR_COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
];

interface MembersContextType {
    members: Member[];
    selectedMember: Member | null;
    loading: boolean;
    setSelectedMember: (member: Member | null) => void;
    addMember: (name: string) => Promise<Member | undefined>;
    updateMember: (memberId: string, updates: Partial<Pick<Member, 'name' | 'avatar_color'>>) => Promise<void>;
    deleteMember: (memberId: string) => Promise<void>;
    refetchMembers: () => Promise<void>;
    switchProfile: (memberId: string) => void;
}

const MembersContext = createContext<MembersContextType | undefined>(undefined);

export function MembersProvider({ children }: { children: React.ReactNode }) {
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchMembers = useCallback(async () => {
        if (!user) {
            setMembers([]);
            setSelectedMember(null);
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

            // Restore selected member from localStorage or default to first
            const savedMemberId = localStorage.getItem('selectedMemberId');

            if (savedMemberId) {
                const savedMember = memberList.find(m => m.id === savedMemberId);
                if (savedMember) {
                    setSelectedMember(savedMember);
                } else if (memberList.length > 0) {
                    // Saved ID not valid anymore
                    setSelectedMember(memberList[0]);
                    localStorage.setItem('selectedMemberId', memberList[0].id);
                }
            } else if (memberList.length > 0) {
                setSelectedMember(memberList[0]);
                localStorage.setItem('selectedMemberId', memberList[0].id);
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
    }, [user, toast]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleSetSelectedMember = (member: Member | null) => {
        setSelectedMember(member);
        if (member) {
            localStorage.setItem('selectedMemberId', member.id);
        } else {
            localStorage.removeItem('selectedMemberId');
        }
    };

    const switchProfile = (memberId: string) => {
        const member = members.find(m => m.id === memberId);
        if (member) {
            handleSetSelectedMember(member);
            toast({
                title: '프로필 변경',
                description: `${member.name} 프로필로 전환되었습니다.`,
            });
        }
    };

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
            setMembers(prev => [...prev, newMember]);

            if (!selectedMember) {
                handleSetSelectedMember(newMember);
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

            setMembers(prev => prev.map(m =>
                m.id === memberId ? { ...m, ...updates } : m
            ));

            if (selectedMember?.id === memberId) {
                setSelectedMember(prev => prev ? { ...prev, ...updates } : null);
            }

            toast({
                title: '수정 완료',
                description: '회원 정보가 수정되었습니다.',
            });
        } catch (error: any) {
            console.error('Error updating member:', error);
            toast({
                title: '오류',
                description: `회원 수정 실패: ${error.message || '알 수 없는 오류'}`,
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

            // Optimistic update
            const updatedMembers = members.filter(m => m.id !== memberId);
            setMembers(updatedMembers);

            if (selectedMember?.id === memberId) {
                const nextMember = updatedMembers[0] || null;
                handleSetSelectedMember(nextMember);
            }

            toast({
                title: '삭제 완료',
                description: '회원이 삭제되었습니다.',
            });
        } catch (error: any) {
            console.error('Error deleting member:', error);
            toast({
                title: '오류',
                description: `회원 삭제 실패: ${error.message || '알 수 없는 오류'}`,
                variant: 'destructive',
            });
        }
    };

    return (
        <MembersContext.Provider value={{
            members,
            selectedMember,
            loading,
            setSelectedMember: handleSetSelectedMember,
            addMember,
            updateMember,
            deleteMember,
            refetchMembers: fetchMembers,
            switchProfile
        }}>
            {children}
        </MembersContext.Provider>
    );
}

export function useMembersContext() {
    const context = useContext(MembersContext);
    if (context === undefined) {
        throw new Error('useMembersContext must be used within a MembersProvider');
    }
    return context;
}
