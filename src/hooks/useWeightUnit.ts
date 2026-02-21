import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const KEY = 'weight_unit';
const LBS_TO_KG = 0.453592;
const KG_TO_LBS = 2.20462;

export type WeightUnit = 'kg' | 'lbs';

/**
 * Weight unit system:
 * - Weights are stored AS-IS in the selected unit (no hidden conversion)
 * - When the user switches units, ALL existing weights in the DB are converted
 * - toDisplay() and toKg() are no-ops — kept for API compatibility but do nothing
 */
export function useWeightUnit() {
    const [unit, setUnit] = useState<WeightUnit>(() => {
        return (localStorage.getItem(KEY) as WeightUnit) || 'lbs';
    });

    /** Convert all weights in Supabase DB from one unit to another */
    const convertAllWeightsInDB = async (from: WeightUnit, to: WeightUnit) => {
        if (from === to) return;
        const factor = from === 'lbs' ? LBS_TO_KG : KG_TO_LBS;

        try {
            // Convert exercise_sets weights
            const { data: sets } = await supabase.from('exercise_sets').select('id, weight');
            if (sets && sets.length > 0) {
                for (const s of sets) {
                    const newWeight = Math.round((Number(s.weight) * factor) * 100) / 100;
                    await supabase.from('exercise_sets').update({ weight: newWeight }).eq('id', s.id);
                }
            }

            // Convert workouts total_volume
            const { data: workouts } = await supabase.from('workouts').select('id, total_volume');
            if (workouts && workouts.length > 0) {
                for (const w of workouts) {
                    if (w.total_volume) {
                        const newVol = Math.round((Number(w.total_volume) * factor) * 100) / 100;
                        await supabase.from('workouts').update({ total_volume: newVol }).eq('id', w.id);
                    }
                }
            }

            // Convert program target weights in program_exercises (if table exists)
            try {
                const { data: progExs } = await supabase.from('program_exercises').select('id, target_weight');
                if (progExs && progExs.length > 0) {
                    for (const pe of progExs) {
                        if (pe.target_weight) {
                            const newW = Math.round((Number(pe.target_weight) * factor) * 100) / 100;
                            await supabase.from('program_exercises').update({ target_weight: newW }).eq('id', pe.id);
                        }
                    }
                }
            } catch {
                // program_exercises table may not exist, ignore
            }
        } catch (err) {
            console.error('Weight conversion error:', err);
        }
    };

    const toggleUnit = useCallback(async () => {
        const current = (localStorage.getItem(KEY) as WeightUnit) || 'lbs';
        const next = current === 'kg' ? 'lbs' : 'kg';

        // Convert all existing data first
        await convertAllWeightsInDB(current, next);

        localStorage.setItem(KEY, next);
        setUnit(next);
        // Reload to refresh all fetched data
        window.location.reload();
    }, []);

    // These are kept for API compatibility but do nothing (no conversion needed)
    const toDisplay = useCallback((val: number): number => val, []);
    const toKg = useCallback((val: number): number => val, []);

    return { unit, toggleUnit, toDisplay, toKg };
}
