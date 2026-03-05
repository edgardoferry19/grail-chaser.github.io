import { useState } from 'react';
import { addWatch } from '../firebase';

const GRAIL_LEVELS = [
  'Paper Cup',
  'Tin Mug',
  'Ceramic Chalice',
  'Crystal Goblet',
  'Holy Grail',
];

interface WatchFormProps {
  onWatchAdded: () => void;
}

export function WatchForm({ onWatchAdded }: WatchFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    model: '',
    purchaseLink: '',
    pricePhp: '',
    grailLevel: 'Paper Cup',
    imageUrl: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.model || !formData.pricePhp) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await addWatch({
        model: formData.model,
        purchaseLink: formData.purchaseLink,
        pricePhp: parseFloat(formData.pricePhp),
        grailLevel: formData.grailLevel,
        imageUrl: formData.imageUrl,
      });

      setFormData({
        model: '',
        purchaseLink: '',
        pricePhp: '',
        grailLevel: 'Paper Cup',
        imageUrl: '',
      });
      setIsOpen(false);
      onWatchAdded();
    } catch (error) {
      console.error('Error adding watch:', error);
      alert('Failed to add watch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-stone-800 px-5 py-3 text-sm font-medium text-white shadow-md transition hover:bg-stone-700"
      >
        <span className="text-base">+</span> Add Grail
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/45 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-stone-200 bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-stone-200 bg-white px-6 py-5">
              <h2 className="text-2xl font-semibold text-stone-800">Add New Grail</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full px-3 py-1 text-2xl font-semibold leading-none text-stone-500 transition hover:bg-stone-100 hover:text-stone-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Watch Model *
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g., Rolex Submariner"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Purchase Link
                </label>
                <input
                  type="url"
                  name="purchaseLink"
                  value={formData.purchaseLink}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Price (PHP) *
                </label>
                <input
                  type="number"
                  name="pricePhp"
                  value={formData.pricePhp}
                  onChange={handleChange}
                  placeholder="50000"
                  min="0"
                  step="100"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Grail Level *
                </label>
                <select
                  name="grailLevel"
                  value={formData.grailLevel}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                >
                  {GRAIL_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/watch.jpg (optional)"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {formData.imageUrl && (
                <div className="mt-4">
                  <p className="mb-2 text-sm text-stone-600">Preview:</p>
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="h-40 w-full rounded-xl border border-stone-200 object-cover"
                    onError={() => console.log('Image failed to load')}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-xl bg-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-stone-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400"
                >
                  {loading ? 'Adding...' : 'Add Grail'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
