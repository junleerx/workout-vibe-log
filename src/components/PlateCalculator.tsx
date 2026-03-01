import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface PlateCalculatorProps {
    weight: number;
    unit: 'kg' | 'lbs';
}

export function PlateCalculator({ weight, unit }: PlateCalculatorProps) {
    const [isOpen, setIsOpen] = useState(false);

    // kg: 바벨 20kg. 원판: 20, 10, 5, 2.5, 1.25
    // lbs: 바벨 45lbs. 원판: 45, 35, 25, 10, 5, 2.5
    const barWeight = unit === 'kg' ? 20 : 45;
    const plates = unit === 'kg' ? [20, 10, 5, 2.5, 1.25] : [45, 35, 25, 10, 5, 2.5];

    const calculatePlates = () => {
        if (weight <= barWeight) return [];

        let remainingWeight = (weight - barWeight) / 2;
        const result: { plate: number; count: number }[] = [];

        for (const plate of plates) {
            if (remainingWeight >= plate) {
                const count = Math.floor(remainingWeight / plate);
                result.push({ plate, count });
                remainingWeight -= plate * count;
            }
        }

        return result;
    };

    const plateBreakdown = calculatePlates();

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="absolute right-2 p-1.5 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                    title="원판 계산기"
                >
                    <Calculator className="w-4 h-4" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-white/10 glass max-w-[90vw] rounded-2xl w-[90vw]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground">
                        원판 계산기 (한쪽 기준)
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="flex items-center justify-between text-base">
                        <span className="text-muted-foreground">목표 무게</span>
                        <span className="font-bold text-lg">{weight} {unit}</span>
                    </div>
                    <div className="flex items-center justify-between text-base">
                        <span className="text-muted-foreground">바벨 무게</span>
                        <span className="font-medium">{barWeight} {unit}</span>
                    </div>

                    <div className="h-px bg-border/50 my-2" />

                    {weight < barWeight ? (
                        <div className="text-center text-muted-foreground py-4">
                            바벨({barWeight}{unit})보다 가벼운 무게입니다.
                        </div>
                    ) : plateBreakdown.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                            빈 바벨만 사용하세요.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="text-sm font-medium text-muted-foreground mb-2">바벨 양쪽에 각각 꽂을 원판</div>
                            {plateBreakdown.map(({ plate, count }, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-secondary/50 p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center font-bold text-primary">
                                            {plate}
                                        </div>
                                        <span className="font-medium text-foreground">{plate} {unit} 원판</span>
                                    </div>
                                    <div className="font-bold text-lg">
                                        x {count}개
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
