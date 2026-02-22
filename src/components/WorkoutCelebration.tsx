import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface WorkoutCelebrationProps {
    isVisible: boolean;
}

const FlameLogo = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" className={className}>
        <path fill="#EF6C57" d="M13 2.139S6 8.151 6 18.152C6 30 18 36 18 36s12-6 12-17.848C30 8.151 18 0 18 0s-5 2.139-5 2.139z" />
        <path fill="#FDD35D" d="M19 1.139C19 1.139 12 6.641 12 16.643c0 9.215 9 15.228 9 15.228s-4-6.012-4-9.018C17 19.847 21 16.841 21 16.841s2 6.012 2 8.016c0 5 4 2.399 4 2.399s1-5.12 1-9.125c0-6-8-17-9-17z" />
    </svg>
);

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
                                    scale: [1, 1.15, 1],
                                    filter: [
                                        "drop-shadow(0 0 0px rgba(251, 191, 36, 0))",
                                        "drop-shadow(0 0 30px rgba(239, 108, 87, 0.8))",
                                        "drop-shadow(0 0 0px rgba(251, 191, 36, 0))"
                                    ]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="relative z-10 w-40 h-40 flex items-center justify-center"
                            >
                                <FlameLogo className="w-32 h-32" />
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
