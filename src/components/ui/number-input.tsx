import * as React from "react"
import { Plus, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  onHoldIncrement?: number;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, step = 1, min = 0, max, suffix, onHoldIncrement, onBlur, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState(value.toString());
    const [isHolding, setIsHolding] = React.useState(false);
    const holdIntervalRef = React.useRef<NodeJS.Timeout>();
    const pressTimerRef = React.useRef<NodeJS.Timeout>();

    React.useEffect(() => {
      setInputValue(value.toString());
    }, [value]);

    const handleIncrement = React.useCallback((incrementStep = step) => {
      onChange(Math.min(max ?? Infinity, value + incrementStep));
    }, [value, max, onChange, step]);

    const handleDecrement = React.useCallback((decrementStep = step) => {
      onChange(Math.max(min ?? -Infinity, value - decrementStep));
    }, [value, min, onChange, step]);

    const startHold = (action: 'inc' | 'dec') => {
      setIsHolding(true);
      pressTimerRef.current = setTimeout(() => {
        holdIntervalRef.current = setInterval(() => {
          if (action === 'inc') handleIncrement(onHoldIncrement || step);
          else handleDecrement(onHoldIncrement || step);
        }, 100);
      }, 300); // 300ms before hold fast increments
    };

    const stopHold = () => {
      setIsHolding(false);
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      let parsed = parseFloat(inputValue);
      if (isNaN(parsed)) parsed = min || 0;
      if (min !== undefined && parsed < min) parsed = min;
      if (max !== undefined && parsed > max) parsed = max;

      setInputValue(parsed.toString());
      onChange(parsed);

      if (onBlur) onBlur(e);
    };

    return (
      <div className={cn("flex items-center w-full h-9 rounded-lg border border-input bg-background/50 overflow-hidden shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring", className)}>
        <button
          type="button"
          className="h-full flex items-center justify-center px-2 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-colors"
          onClick={() => handleDecrement()}
          onMouseDown={() => startHold('dec')}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={() => startHold('dec')}
          onTouchEnd={stopHold}
          disabled={min !== undefined && value <= min}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <div className="relative flex-1 h-full min-w-[20px]">
          <input
            type="number"
            className={cn(
              "flex h-full w-full bg-transparent px-1 text-center text-sm font-semibold focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              suffix ? "pr-6" : ""
            )}
            style={{ minWidth: 0 }}
            ref={ref}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            {...props}
          />
          {suffix && (
            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        <button
          type="button"
          className="h-full flex items-center justify-center px-2 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-colors"
          onClick={() => handleIncrement()}
          onMouseDown={() => startHold('inc')}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={() => startHold('inc')}
          onTouchEnd={stopHold}
          disabled={max !== undefined && value >= max}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }
