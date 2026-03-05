import { useState } from 'react';
import { WatchModal } from './WatchModal';
import { ProgressBar } from './ProgressBar';
import { addSavingsEntry } from '../firebase';

interface WatchCardProps {
  watch: {
    id: string;
    model: string;
    purchaseLink: string;
    pricePhp: number;
    grailLevel: string;
    imageUrl?: string;
    createdAt?: string;
  };
  savedAmount: number;
  onRefresh: () => void;
}

export function WatchCard({ watch, savedAmount, onRefresh }: WatchCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClaimGrail = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await addSavingsEntry({
        date: today,
        amount: watch.pricePhp,
        type: '-',
        description: `${watch.model} obtained`,
      });
      onRefresh();
    } catch (error) {
      console.error('Error claiming grail:', error);
      throw error;
    }
  };

  const grailEmoji: Record<string, string> = {
    'Paper Cup': '🥤',
    'Tin Mug': '🏺',
    'Ceramic Chalice': '🍷',
    'Crystal Goblet': '💎',
    'Holy Grail': '⚜️',
  };

  const isComplete = savedAmount >= watch.pricePhp;
  const percentage = (savedAmount / watch.pricePhp) * 100;

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className={`cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
          isComplete ? 'border-amber-300' : 'border-stone-200'
        }`}
      >
        <div className="group relative h-48 overflow-hidden bg-stone-200">
          {watch.imageUrl ? (
            <img
              src={watch.imageUrl}
              alt={watch.model}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://via.placeholder.com/400x300?text=Image+Not+Found';
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-stone-200 text-sm font-medium text-stone-500">
              No image
            </div>
          )}
          {isComplete && (
            <div className="absolute inset-0 flex items-center justify-center bg-amber-100/70">
              <div className="rounded-xl border border-amber-200 bg-white/90 px-4 py-2 text-center text-sm font-semibold text-amber-800 shadow-sm">
                Ready to claim
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 p-4">
          <div>
            <div className="mb-1 flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="line-clamp-2 text-lg font-semibold text-stone-800">
                  {watch.model}
                </h3>
                <p className="text-sm text-stone-500">
                  {grailEmoji[watch.grailLevel] || '⚜️'} {watch.grailLevel}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 p-3">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-stone-600">Target: ₱{watch.pricePhp.toLocaleString()}</span>
              <span className="font-semibold text-emerald-700">
                ₱{savedAmount.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              {Math.round(percentage)}% complete • ₱{(watch.pricePhp - savedAmount).toLocaleString()} left
            </p>
          </div>

          <ProgressBar currentAmount={savedAmount} totalAmount={watch.pricePhp} />

          <button
            onClick={() => setIsModalOpen(true)}
            className={`w-full rounded-xl py-2 text-sm font-medium transition ${
              isComplete
                ? 'bg-amber-300 text-amber-900 hover:bg-amber-400'
                : 'bg-stone-800 text-white hover:bg-stone-700'
            }`}
          >
            {isComplete ? 'View Details & Claim' : 'View Details'}
          </button>
        </div>
      </div>

      <WatchModal
        watch={watch}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClaimGrail={handleClaimGrail}
        onForgotGrail={onRefresh}
        isProgress={isLoading}
        savedAmount={savedAmount}
      />
    </>
  );
}
