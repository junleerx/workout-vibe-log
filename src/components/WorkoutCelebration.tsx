import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Sparkles } from 'lucide-react';

interface WorkoutCelebrationProps {
    isVisible: boolean;
}

export function WorkoutCelebration({ isVisible }: WorkoutCelebrationProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="celebration-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                            duration: 0.6,
                        }}
                        className="flex flex-col items-center"
                    >
                        <div className="relative mb-6">
                            {/* Spinning/pulsing aura */}
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 0.2 }}
                                transition={{ duration: 0.8 }}
                                className="absolute inset-0 bg-gradient-to-r from-primary/50 via-amber-500/50 to-primary/50 rounded-full blur-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            />

                            {/* Main Icon */}
                            <motion.div
                                animate={{
                                    rotate: [0, 15, -15, 0],
                                    scale: [1, 1.2, 1],
                                    filter: [
                                        "drop-shadow(0 0 0px rgba(251, 191, 36, 0))",
                                        "drop-shadow(0 0 20px rgba(251, 191, 36, 0.8))",
                                        "drop-shadow(0 0 0px rgba(251, 191, 36, 0))"
                                    ]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="relative z-10 w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center border-4 border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.5)]"
                            >
                                <Dumbbell className="w-16 h-16 text-white" />
                            </motion.div>

                            {/* Bursting particles */}
                            {[...Array(12)].map((_, i) => {
                                const angle = (i * Math.PI * 2) / 12;
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                                        animate={{
                                            opacity: [1, 1, 0],
                                            scale: [0, 1.5, 0.5],
                                            x: Math.cos(angle) * 120,
                                            y: Math.sin(angle) * 120,
                                            rotate: 360,
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            ease: "easeOut",
                                        }}
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
                                    >
                                        <Sparkles
                                            className={`w-6 h-6 ${i % 2 === 0 ? 'text-amber-400' : 'text-primary'}`}
                                        />
                                    </motion.div>
                                );
                            })}
                        </div>

                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl font-black mb-2 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent"
                            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}
                        >
                            운동 완료!
                        </motion.h2>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-muted-foreground font-medium text-lg text-center"
                        >
                            오늘도 수고하셨습니다 👏
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
