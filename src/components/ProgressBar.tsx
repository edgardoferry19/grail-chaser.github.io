interface ProgressBarProps {
  currentAmount: number;
  totalAmount: number;
}

export function ProgressBar({ currentAmount, totalAmount }: ProgressBarProps) {
  const percentage = totalAmount > 0 ? (currentAmount / totalAmount) * 100 : 0;
  const isComplete = percentage >= 100;

  const getGradient = () => {
    if (percentage < 33) return 'from-rose-300 to-amber-300';
    if (percentage < 67) return 'from-amber-300 to-emerald-300';
    return 'from-emerald-300 to-emerald-400';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-stone-700">
          ₱{currentAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </span>
        <span className="text-sm font-medium text-stone-500">
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className={`h-full bg-gradient-to-r ${getGradient()} transition-all duration-500 ease-out ${
            isComplete ? 'animate-pulse' : ''
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      <p className="mt-1 text-xs text-stone-500">
        ₱{totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })} needed
      </p>
    </div>
  );
}
