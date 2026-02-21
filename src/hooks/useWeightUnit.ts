import { useState, useCallback } from 'react';

const KEY = 'weight_unit';
const KG_TO_LBS = 2.20462;

export type WeightUnit = 'kg' | 'lbs';

export function useWeightUnit() {
    const [unit, setUnit] = useState<WeightUnit>(() => {
        // Default is 'lbs' — only use stored value if explicitly set before
        return (localStorage.getItem(KEY) as WeightUnit) || 'lbs';
    });

    const toggleUnit = useCallback(() => {
        setUnit((prev) => {
            const next = prev === 'kg' ? 'lbs' : 'kg';
            localStorage.setItem(KEY, next);
            return next;
        });
    }, []);

    /** kg 값을 표시 단위로 변환해서 반환 (소수점 1자리) */
    const toDisplay = useCallback(
        (kg: number): number => {
            if (unit === 'lbs') return Math.round(kg * KG_TO_LBS * 10) / 10;
            return kg;
        },
        [unit]
    );

    /** 표시 단위 값을 kg으로 변환해서 반환 (항상 kg으로 저장) */
    const toKg = useCallback(
        (value: number): number => {
            if (unit === 'lbs') return Math.round((value / KG_TO_LBS) * 100) / 100;
            return value;
        },
        [unit]
    );

    return { unit, toggleUnit, toDisplay, toKg };
}

