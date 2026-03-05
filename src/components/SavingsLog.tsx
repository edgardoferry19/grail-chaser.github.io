import { useState } from 'react';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { addSavingsEntry } from '../firebase';
import { db } from '../firebase';

interface SavingsEntry {
  id: string;
  date: string;
  amount: number;
  type: '+' | '-';
  description: string;
  createdAt?: string;
}

interface SavingsLogProps {
  savings: Record<string, SavingsEntry>;
  onRefresh: () => void;
}

export function SavingsLog({ savings, onRefresh }: SavingsLogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<SavingsEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: '+' as '+' | '-',
    description: '',
  });

  const savingsArray = Object.entries(savings).map(([id, data]) => ({
    ...data,
    id,
  }));

  const sortedSavings = [...savingsArray].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const handleAddSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await addSavingsEntry({
        date: formData.date,
        amount: parseFloat(formData.amount),
        type: formData.type,
        description: formData.description,
      });

      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: '+',
        description: '',
      });
      onRefresh();
    } catch (error) {
      console.error('Error adding savings entry:', error);
      alert('Failed to add entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: SavingsEntry) => {
    setEditingId(entry.id);
    setEditData({ ...entry });
  };

  const handleSaveEdit = async () => {
    if (!editData || !editingId) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'savings', editingId);
      await updateDoc(docRef, {
        date: editData.date,
        amount: editData.amount,
        type: editData.type,
        description: editData.description,
      });
      setEditingId(null);
      setEditData(null);
      onRefresh();
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Failed to update entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'savings', id));
      onRefresh();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700 shadow-md transition hover:bg-stone-50"
      >
        <span className="text-base">₱</span> Savings
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/45 p-4">
          <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-stone-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-2xl font-semibold text-stone-800">Savings</h2>
                <p className="text-sm text-stone-500">Add entries and manage your savings history</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full px-3 py-1 text-2xl font-semibold leading-none text-stone-500 transition hover:bg-stone-100 hover:text-stone-700"
              >
                ×
              </button>
            </div>

            <div className="grid gap-0 overflow-y-auto md:grid-cols-[340px_1fr]">
              <div className="border-b border-stone-200 bg-stone-50/70 p-5 md:border-b-0 md:border-r">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-600">Log Entry</h3>
                <form onSubmit={handleAddSavings} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none ring-0 transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Amount (PHP)</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="5000"
                      min="0"
                      step="100"
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none ring-0 transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: (e.target.value as '+' | '-') || '+',
                        }))
                      }
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="+">Add Savings (+)</option>
                      <option value="-">Deduct / Spend (-)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      placeholder="e.g., Monthly savings"
                      className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-stone-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400"
                  >
                    {loading ? 'Saving...' : 'Save Entry'}
                  </button>
                </form>
              </div>

              <div className="flex min-h-0 flex-col">
                <div className="border-b border-stone-200 px-5 py-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-600">Savings History</h3>
                </div>

                <div className="flex-1 overflow-y-auto">
              {sortedSavings.length === 0 ? (
                <div className="p-10 text-center text-stone-500">
                  <p className="text-base font-medium">No savings entries yet</p>
                  <p className="mt-1 text-sm">Use the form on the left to add your first entry.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 border-b border-stone-200 bg-stone-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-600">Date</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-600">Description</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-stone-600">Amount</th>
                        <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-stone-600">Type</th>
                        <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-stone-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSavings.map((entry) => (
                        <tr key={entry.id} className="border-b border-stone-100 text-sm transition hover:bg-stone-50/80">
                          {editingId === entry.id ? (
                            <>
                              <td className="px-5 py-3">
                                <input
                                  type="date"
                                  value={editData?.date || ''}
                                  onChange={(e) =>
                                    setEditData((prev) => ({
                                      ...prev!,
                                      date: e.target.value,
                                    }))
                                  }
                                  className="w-full rounded-lg border border-stone-200 px-3 py-1.5 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                                />
                              </td>
                              <td className="px-5 py-3">
                                <input
                                  type="text"
                                  value={editData?.description || ''}
                                  onChange={(e) =>
                                    setEditData((prev) => ({
                                      ...prev!,
                                      description: e.target.value,
                                    }))
                                  }
                                  className="w-full rounded-lg border border-stone-200 px-3 py-1.5 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                                />
                              </td>
                              <td className="px-5 py-3 text-right">
                                <input
                                  type="number"
                                  value={editData?.amount || ''}
                                  onChange={(e) =>
                                    setEditData((prev) => ({
                                      ...prev!,
                                      amount: parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                  className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-right outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                                />
                              </td>
                              <td className="px-5 py-3 text-center">
                                <select
                                  value={editData?.type || '+'}
                                  onChange={(e) =>
                                    setEditData((prev) => ({
                                      ...prev!,
                                      type: (e.target.value as '+' | '-') || '+',
                                    }))
                                  }
                                  className="rounded-lg border border-stone-200 px-3 py-1.5 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                                >
                                  <option value="+">+</option>
                                  <option value="-">-</option>
                                </select>
                              </td>
                              <td className="px-5 py-3 text-center">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={handleSaveEdit}
                                    disabled={loading}
                                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:bg-emerald-300"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancel}
                                    disabled={loading}
                                    className="rounded-lg bg-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-400 disabled:bg-stone-200"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {new Date(entry.date).toLocaleDateString('en-US')}
                              </td>
                              <td className="px-5 py-3 text-stone-700">{entry.description}</td>
                              <td
                                className={`px-5 py-3 text-right font-medium ${
                                  entry.type === '+' ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                {entry.type}₱{entry.amount.toLocaleString('en-US', {
                                  maximumFractionDigits: 0,
                                })}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span
                                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                                    entry.type === '+'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {entry.type === '+' ? 'Deposit' : 'Withdraw'}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-center">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => handleEdit(entry)}
                                    className="rounded-lg bg-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-300"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(entry.id)}
                                    className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-200"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
                </div>
              </div>
            </div>

            {sortedSavings.length > 0 && (
              <div className="grid grid-cols-1 gap-4 border-t border-stone-200 bg-stone-50 px-5 py-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-stone-500">Total Deposits</p>
                  <p className="text-lg font-semibold text-emerald-700">
                    ₱
                    {sortedSavings
                      .filter((e) => e.type === '+')
                      .reduce((sum, e) => sum + e.amount, 0)
                      .toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-stone-500">Total Withdrawals</p>
                  <p className="text-lg font-semibold text-rose-700">
                    ₱
                    {sortedSavings
                      .filter((e) => e.type === '-')
                      .reduce((sum, e) => sum + e.amount, 0)
                      .toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-stone-500">Net Savings</p>
                  <p className="text-lg font-semibold text-stone-800">
                    ₱
                    {sortedSavings
                      .reduce((sum, e) => sum + (e.type === '+' ? e.amount : -e.amount), 0)
                      .toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
