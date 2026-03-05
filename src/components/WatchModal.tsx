import { useState } from 'react';
import { deleteWatch, updateWatch } from '../firebase';

const GRAIL_LEVELS = [
  'Paper Cup',
  'Tin Mug',
  'Ceramic Chalice',
  'Crystal Goblet',
  'Holy Grail',
];

interface WatchModalProps {
  watch: {
    id: string;
    model: string;
    purchaseLink: string;
    pricePhp: number;
    grailLevel: string;
    imageUrl?: string;
    createdAt?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onClaimGrail: () => Promise<void>;
  onForgotGrail: () => void;
  isProgress: boolean;
  savedAmount: number;
}

export function WatchModal({
  watch,
  isOpen,
  onClose,
  onClaimGrail,
  onForgotGrail,
  isProgress,
  savedAmount,
}: WatchModalProps) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    model: watch.model,
    purchaseLink: watch.purchaseLink,
    pricePhp: String(watch.pricePhp),
    grailLevel: watch.grailLevel,
    imageUrl: watch.imageUrl || '',
  });

  const isComplete = savedAmount >= watch.pricePhp;

  const syncEditForm = () => {
    setEditForm({
      model: watch.model,
      purchaseLink: watch.purchaseLink,
      pricePhp: String(watch.pricePhp),
      grailLevel: watch.grailLevel,
      imageUrl: watch.imageUrl || '',
    });
  };

  const handleClaim = async () => {
    setLoading(true);
    try {
      await onClaimGrail();
      setLoading(false);
      onClose();
    } catch (error) {
      console.error('Error claiming grail:', error);
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (confirm('Are you sure you want to delete this grail? This cannot be undone.')) {
      try {
        await deleteWatch(watch.id);
        onForgotGrail();
        onClose();
      } catch (error) {
        console.error('Error removing watch:', error);
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.model || !editForm.pricePhp) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await updateWatch(watch.id, {
        model: editForm.model,
        purchaseLink: editForm.purchaseLink,
        pricePhp: parseFloat(editForm.pricePhp),
        grailLevel: editForm.grailLevel,
        imageUrl: editForm.imageUrl,
      });
      setIsEditing(false);
      onForgotGrail();
    } catch (error) {
      console.error('Error updating grail:', error);
      alert('Failed to update grail. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    syncEditForm();
    onClose();
  };

  if (!isOpen) return null;

  const grailEmoji: Record<string, string> = {
    'Paper Cup': '🥤',
    'Tin Mug': '🏺',
    'Ceramic Chalice': '🍷',
    'Crystal Goblet': '💎',
    'Holy Grail': '⚜️',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/45 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-stone-200 bg-white shadow-2xl">
        <div className="relative">
          {watch.imageUrl ? (
            <img
              src={watch.imageUrl}
              alt={watch.model}
              className="h-64 w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://via.placeholder.com/500x300?text=Image+Not+Found';
              }}
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-stone-200 text-sm font-medium text-stone-500">
              No image
            </div>
          )}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-2xl font-semibold leading-none text-stone-700 shadow transition hover:bg-white"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{grailEmoji[watch.grailLevel] || '⚜️'}</span>
              <h2 className="text-3xl font-semibold text-stone-800">{watch.model}</h2>
            </div>
            <p className="text-sm italic text-stone-500">{watch.grailLevel}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-2xl bg-stone-50 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Target Price</p>
              <p className="mt-1 text-2xl font-semibold text-stone-800">
                ₱{watch.pricePhp.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Saved</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-700">
                ₱{savedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-stone-600">Progress to Grail</p>
            <div className="h-3 w-full overflow-hidden rounded-full bg-stone-200">
              <div
                className={`h-full bg-gradient-to-r from-amber-300 to-emerald-300 transition-all duration-500 ease-out ${
                  isComplete ? 'animate-pulse' : ''
                }`}
                style={{ width: `${Math.min((savedAmount / watch.pricePhp) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-stone-500">
              {Math.round((savedAmount / watch.pricePhp) * 100)}% complete
            </p>
          </div>

          {watch.purchaseLink && !isEditing && (
            <a
              href={watch.purchaseLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-xl bg-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-300"
            >
              View Purchase Link →
            </a>
          )}

          {isComplete && !isEditing && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-800">You can claim this grail.</p>
              <p className="mt-1 text-sm text-amber-700">
                You've saved enough. Claim it now or forget it forever.
              </p>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4 border-t border-stone-200 pt-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Watch Model *</label>
                <input
                  type="text"
                  value={editForm.model}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, model: e.target.value }))}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Purchase Link</label>
                <input
                  type="url"
                  value={editForm.purchaseLink}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, purchaseLink: e.target.value }))}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Price (PHP) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.pricePhp}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, pricePhp: e.target.value }))}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Grail Level *</label>
                  <select
                    value={editForm.grailLevel}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, grailLevel: e.target.value }))}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  >
                    {GRAIL_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Image URL (optional)</label>
                <input
                  type="url"
                  value={editForm.imageUrl}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="flex gap-3 border-t border-stone-200 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    syncEditForm();
                  }}
                  className="flex-1 rounded-xl bg-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-stone-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-3 border-t border-stone-200 pt-4">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-xl bg-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-300"
              >
                Edit Grail
              </button>
              <button
                onClick={handleForgot}
                className="rounded-xl bg-rose-100 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-200"
              >
                Delete Grail
              </button>
              {isComplete && (
                <button
                  onClick={handleClaim}
                  disabled={loading || isProgress}
                  className="ml-auto rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {loading ? 'Processing...' : '✨ Grail Claimed'}
                </button>
              )}
              {!isComplete && (
                <button
                  onClick={handleClose}
                  className="ml-auto rounded-xl bg-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-400"
                >
                  Close
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
