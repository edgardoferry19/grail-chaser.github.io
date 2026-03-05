import { useState, useEffect } from 'react';
import { fetchWatches, fetchSavings } from './firebase';
import { WatchForm } from './components/WatchForm';
import { WatchCard } from './components/WatchCard';
import { SavingsLog } from './components/SavingsLog';

const AUTH_SESSION_KEY = 'grail_chaser_auth_session';
const AUTH_SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

const normalizePassword = (value: string) => {
  const trimmed = value
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '');

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
};

const APP_PASSWORD = normalizePassword(import.meta.env.VITE_PASSWORD?.toString() || '');

interface Watch {
  id: string;
  model: string;
  purchaseLink: string;
  pricePhp: number;
  grailLevel: string;
  imageUrl?: string;
  createdAt?: string;
  claimed?: boolean;
  claimedAt?: string;
}

function App() {
  const [savings, setSavings] = useState<Record<string, any>>({});
  const [watches, setWatches] = useState<Watch[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { expiresAt?: number };
        if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(AUTH_SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(AUTH_SESSION_KEY);
      }
    }
    setAuthChecking(false);
  }, []);

  // Fetch watches and savings on mount and when refresh key changes
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setDataError('');
      return;
    }

    setLoading(true);
    setDataError('');

    // Subscribe to watches
    const unsubscribeWatches = fetchWatches(
      (watchesData) => {
        const watchesArray: Watch[] = Object.entries(watchesData).map(
          ([id, data]: [string, any]) => ({
            id,
            ...data,
          })
        );
        setWatches(watchesArray);
      },
      (error) => {
        console.error('Watches listener failed:', error);
        setDataError('Live watch data is temporarily unavailable. Retrying automatically...');
        setLoading(false);
      }
    );

    // Subscribe to savings
    const unsubscribeSavings = fetchSavings(
      (savingsData) => {
        setSavings(savingsData);
        const total = Object.values(savingsData).reduce((sum, entry: any) => {
          if (entry.type === '+') return sum + (entry.amount || 0);
          if (entry.type === '-') return sum - (entry.amount || 0);
          return sum;
        }, 0);
        setTotalSavings(total);
        setDataError('');
        setLoading(false);
      },
      (error) => {
        console.error('Savings listener failed:', error);
        setDataError('Live savings data is temporarily unavailable. Retrying automatically...');
        setLoading(false);
      }
    );

    return () => {
      unsubscribeWatches();
      unsubscribeSavings();
    };
  }, [refreshKey, isAuthenticated]);

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedInputPassword = normalizePassword(password);

    if (!normalizedInputPassword) {
      setAuthError('Please enter your password.');
      return;
    }

    if (!APP_PASSWORD) {
      setAuthError('Access password is not configured. Set VITE_PASSWORD and redeploy.');
      return;
    }

    setAuthError('');
    if (normalizedInputPassword !== APP_PASSWORD) {
      setAuthError('Incorrect password. Please try again.');
      return;
    }

    localStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({ expiresAt: Date.now() + AUTH_SESSION_DURATION_MS })
    );
    setIsAuthenticated(true);
    setPassword('');
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    setIsAuthenticated(false);
    setSavings({});
    setWatches([]);
    setTotalSavings(0);
    setRefreshKey(0);
  };

  const handleRefresh = () => {
    setDataError('');
    setRefreshKey((prev) => prev + 1);
  };

  const getSavingsForWatch = (watchId: string) => {
    // Since savings entries are not tracked per-watch, show how much of this
    // watch would be covered by the pooled savings. We assume the full pool
    // could be applied to any single grail (useful for "progress if you
    // focused on this grail"). Cap at the watch price so UI stays sensible.
    if (watches.length === 0) return 0;

    const watchPrice = watches.find((w) => w.id === watchId)?.pricePhp || 0;
    if (watchPrice === 0) return 0;

    return Math.min(totalSavings, watchPrice);
  };

  const sortedWatches = [...watches].sort((a, b) => {
    const aProgress = getSavingsForWatch(a.id) / a.pricePhp;
    const bProgress = getSavingsForWatch(b.id) / b.pricePhp;
    return bProgress - aProgress;
  });

  // Compute average savings rate as the simple (unweighted) mean of
  // individual grail completion percentages for active (not claimed) grails.
  const activeWatches = watches.filter((w) => !w.claimed);
  const averageSavingsRate =
    activeWatches.length > 0
      ? Math.round(
          (activeWatches.reduce((sum, w) => sum + Math.min(totalSavings / w.pricePhp, 1), 0) /
            activeWatches.length) *
            100
        )
      : 0;

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-stone-300 border-t-emerald-400"></div>
          <p className="text-sm text-stone-500">Preparing secure access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
        <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold text-stone-800">Grail Chaser</h1>
          <p className="mt-2 text-sm text-stone-500">Enter your access password to continue.</p>

          <form onSubmit={handleAuthenticate} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-stone-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                placeholder="Enter password"
                autoFocus
              />
            </div>

            {authError && <p className="text-sm text-rose-600">{authError}</p>}

            <button
              type="submit"
              className="w-full rounded-xl bg-stone-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800">
      <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-stone-100/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-stone-800 sm:text-4xl">
                Grail Chaser
              </h1>
              <p className="mt-1 text-sm text-stone-500 sm:text-base">Track your watch savings journey</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-right shadow-sm">
              <p className="text-xs uppercase tracking-wide text-stone-500">Total Savings</p>
              <p className="text-3xl font-semibold text-emerald-700">
                ₱{totalSavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
              <button
                onClick={handleLogout}
                className="mt-2 text-xs font-medium text-stone-400 transition hover:text-stone-600"
              >
                Lock
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {dataError && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {dataError}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-stone-300 border-t-emerald-400"></div>
              <p className="text-lg text-stone-500">Loading your grail watches...</p>
            </div>
          </div>
        ) : watches.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mb-4 text-5xl">⌚</div>
            <h2 className="mb-2 text-3xl font-semibold text-stone-800">No Grails Yet</h2>
            <p className="mb-8 text-stone-500">
              Start building your watch collection. Add your first grail watch!
            </p>
            <button
              onClick={() => {
                const addBtn = document.querySelector('[class*="fixed"][class*="bottom-6"][class*="right-6"]');
                if (addBtn) (addBtn as HTMLElement).click();
              }}
              className="rounded-xl bg-stone-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
            >
              Add Your First Grail
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-stone-500">Total Watches</p>
                <p className="mt-1 text-3xl font-semibold text-stone-800">{watches.length}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-emerald-700/70">Total Grail Value</p>
                <p className="mt-1 text-3xl font-semibold text-emerald-700">
                  ₱{watches
                    .reduce((sum, w) => sum + w.pricePhp, 0)
                    .toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-rose-700/70">Average Savings Rate</p>
                <p className="mt-1 text-3xl font-semibold text-rose-700">
                    {averageSavingsRate}
                  %
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {sortedWatches.map((watch) => (
                <WatchCard
                  key={watch.id}
                  watch={watch}
                  savedAmount={getSavingsForWatch(watch.id)}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Buttons */}
      <SavingsLog savings={savings} onRefresh={handleRefresh} />
      <WatchForm onWatchAdded={handleRefresh} />
    </div>
  );
}

export default App;
