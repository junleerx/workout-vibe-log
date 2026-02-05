import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CustomExercise } from '@/types/member';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function useCustomExercises() {
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCustomExercises = useCallback(async () => {
    if (!user) {
      setCustomExercises([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('custom_exercises')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setCustomExercises((data || []) as CustomExercise[]);
    } catch (error) {
      console.error('Error fetching custom exercises:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCustomExercises();
  }, [fetchCustomExercises]);

  const addCustomExercise = async (name: string, category: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('custom_exercises')
        .insert({
          user_id: user.id,
          name,
          category,
        })
        .select()
        .single();

      if (error) throw error;

      const newExercise = data as CustomExercise;
      setCustomExercises([...customExercises, newExercise]);

      toast({
        title: '추가 완료',
        description: `"${name}" 운동이 추가되었습니다.`,
      });

      return newExercise;
    } catch (error) {
      console.error('Error adding custom exercise:', error);
      toast({
        title: '오류',
        description: '운동 추가에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const deleteCustomExercise = async (exerciseId: string) => {
    try {
      const { error } = await supabase
        .from('custom_exercises')
        .delete()
        .eq('id', exerciseId);

      if (error) throw error;

      setCustomExercises(customExercises.filter(e => e.id !== exerciseId));

      toast({
        title: '삭제 완료',
        description: '운동이 삭제되었습니다.',
      });
    } catch (error) {
      console.error('Error deleting custom exercise:', error);
      toast({
        title: '오류',
        description: '운동 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  return {
    customExercises,
    loading,
    addCustomExercise,
    deleteCustomExercise,
    refetchCustomExercises: fetchCustomExercises,
  };
}
