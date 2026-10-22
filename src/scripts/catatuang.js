/**
 * CatatUang - Financial Tracking Logic
 * Designed for Astro + Cloudflare Pages
 * Follows design.md NerdWallet specs: Spruce #008254, Mint ladder, and Utilitarian layout.
 */

// Default categories
export const DEFAULT_CATEGORIES = {
  expense: [
    { id: 'food', name: 'Makanan & Minuman', icon: '🍔', color: '#f97316' },
    { id: 'transport', name: 'Transportasi & Bensin', icon: '🛵', color: '#06b6d4' },
    { id: 'groceries', name: 'Belanja Kebutuhan', icon: '🛒', color: '#008254' },
    { id: 'bills', name: 'Tagihan & Utilitas', icon: '⚡', color: '#eab308' },
    { id: 'entertainment', name: 'Hiburan & Hobi', icon: '🎬', color: '#ec4899' },
    { id: 'health', name: 'Kesehatan & Obat', icon: '💊', color: '#de2828' },
    { id: 'education', name: 'Pendidikan', icon: '📚', color: '#8b5cf6' },
    { id: 'charity', name: 'Sedekah & Donasi', icon: '🤲', color: '#14b8a6' },
    { id: 'family', name: 'Keluarga & Rumah', icon: '🏠', color: '#6366f1' },
    { id: 'other_exp', name: 'Lainnya', icon: '📦', color: '#64748b' }
  ],
  income: [
    { id: 'salary', name: 'Gaji Pokok', icon: '💵', color: '#008254' },
    { id: 'bonus', name: 'Bonus & THR', icon: '🎉', color: '#005fb9' },
    { id: 'investment', name: 'Investasi & Bunga', icon: '📈', color: '#10b981' },
    { id: 'freelance', name: 'Side Job & Usaha', icon: '💻', color: '#8b5cf6' },
    { id: 'gift', name: 'Hadiah / Diberi', icon: '🎁', color: '#f59e0b' },
    { id: 'other_inc', name: 'Pemasukan Lain', icon: '💰', color: '#64748b' }
  ]
};

export const DEFAULT_WALLETS = [
  { id: 'w1', name: 'Uang Tunai (Cash)', type: 'cash', initialBalance: 250000, icon: '💵', color: '#008254' },
  { id: 'w2', name: 'Rekening Bank', type: 'bank', initialBalance: 5000000, icon: '🏦', color: '#005fb9' },
  { id: 'w3', name: 'GoPay / OVO', type: 'ewallet', initialBalance: 200000, icon: '📱', color: '#06b6d4' }
];

export const DEFAULT_GOOGLE_CLIENT_ID = '511845373742-mbu4m40ugcklo8a3fcrugho86kvlbndn.apps.googleusercontent.com';

// Format helper to YYYY-MM-DD
export function formatToDateKey(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key) {
  const parts = key.split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

// Storage isolation key helper
export function getUserStoragePrefix(user) {
  if (!user || !user.email) return null;
  const cleanEmail = user.email.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '_');
  return `catatuang_u_${cleanEmail}_`;
}

// Preset range calculations
export function getPresetDateRange(mode, refDate = new Date()) {
  const y = refDate.getFullYear();
  const m = refDate.getMonth();

  if (mode === 'thisMonth') {
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    return { startDate: formatToDateKey(firstDay), endDate: formatToDateKey(lastDay) };
  } else if (mode === 'lastMonth') {
    const firstDay = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0);
    return { startDate: formatToDateKey(firstDay), endDate: formatToDateKey(lastDay) };
  } else if (mode === 'last7Days') {
    const start = new Date(refDate.getTime() - 6 * 86400000);
    return { startDate: formatToDateKey(start), endDate: formatToDateKey(refDate) };
  } else if (mode === 'last30Days') {
    const start = new Date(refDate.getTime() - 29 * 86400000);
    return { startDate: formatToDateKey(start), endDate: formatToDateKey(refDate) };
  } else if (mode === 'thisYear') {
    const firstDay = new Date(y, 0, 1);
    const lastDay = new Date(y, 11, 31);
    return { startDate: formatToDateKey(firstDay), endDate: formatToDateKey(lastDay) };
  }
  // Default to this month
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);
  return { startDate: formatToDateKey(firstDay), endDate: formatToDateKey(lastDay) };
}

export class AppState {
  constructor() {
    this.googleUser = this.loadRaw('catatuang_auth_user', null);
    this.settings = this.loadRaw('catatuang_settings', {
      hideBalance: false
    });

    // Custom period state
    this.periodMode = 'thisMonth';
    const initialRange = getPresetDateRange('thisMonth');
    this.startDate = initialRange.startDate;
    this.endDate = initialRange.endDate;

    // View state
    this.currentTab = 'home';
    this.filterType = 'all';
    this.filterWallet = 'all';
    this.searchQuery = '';
    this.currentTxType = 'expense';
    this.editingTxId = null;
    this.editingWalletId = null;
    this.selectedCategory = 'food';

    // Chart instance ref
    this.chartInstance = null;

    // Load data for active user
    this.loadUserData();
  }

  loadRaw(key, fallback) {
    if (typeof localStorage === 'undefined') return fallback;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  saveRaw(key, val) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      // ponytail: quota exceeded silently handled to avoid console error logs
    }
  }

  loadUserData() {
    const prefix = getUserStoragePrefix(this.googleUser);
    if (!prefix) {
      this.wallets = [];
      this.transactions = [];
      return;
    }

    this.wallets = this.loadRaw(prefix + 'wallets', DEFAULT_WALLETS);
    this.transactions = this.loadRaw(prefix + 'transactions', []);
    this.syncQueue = this.loadRaw(prefix + 'sync_queue', { wallets: [], transactions: [] });
    this.lastSyncTime = this.loadRaw(prefix + 'last_sync_time', 0);
    this.syncStatus = this.getPendingCount() > 0 ? 'pending' : 'synced';
  }

  getPendingCount() {
    if (!this.syncQueue) return 0;
    const wCount = Array.isArray(this.syncQueue.wallets) ? this.syncQueue.wallets.length : 0;
    const txCount = Array.isArray(this.syncQueue.transactions) ? this.syncQueue.transactions.length : 0;
    return wCount + txCount;
  }

  saveUserData() {
    const prefix = getUserStoragePrefix(this.googleUser);
    if (!prefix) return;
    this.saveRaw(prefix + 'wallets', this.wallets);
    this.saveRaw(prefix + 'transactions', this.transactions);
    this.saveRaw(prefix + 'sync_queue', this.syncQueue);
    this.saveRaw(prefix + 'last_sync_time', this.lastSyncTime);
    this.saveRaw('catatuang_settings', this.settings);
  }

  // Queue a wallet mutation for background D1 sync
  queueWalletMutation(wallet, isDeleted = false) {
    if (!this.syncQueue) this.syncQueue = { wallets: [], transactions: [] };
    const mutation = {
      ...wallet,
      updated_at: Date.now(),
      deleted_at: isDeleted ? Date.now() : null
    };
    // Replace existing queued item with same id or push
    this.syncQueue.wallets = (this.syncQueue.wallets || []).filter(w => w.id !== wallet.id);
    this.syncQueue.wallets.push(mutation);
    this.syncStatus = 'pending';
    this.saveUserData();
  }

  // Queue a transaction mutation for background D1 sync
  queueTxMutation(tx, isDeleted = false) {
    if (!this.syncQueue) this.syncQueue = { wallets: [], transactions: [] };
    const mutation = {
      ...tx,
      updated_at: Date.now(),
      deleted_at: isDeleted ? Date.now() : null
    };
    this.syncQueue.transactions = (this.syncQueue.transactions || []).filter(t => t.id !== tx.id);
    this.syncQueue.transactions.push(mutation);
    this.syncStatus = 'pending';
    this.saveUserData();
  }

  // Merge records pulled from Cloudflare D1
  mergeServerRecords(pulled) {
    let changed = false;

    // Merge wallets
    if (pulled.wallets && pulled.wallets.length > 0) {
      const map = new Map(this.wallets.map(w => [w.id, w]));
      for (const sw of pulled.wallets) {
        const local = map.get(sw.id);
        if (!local || (sw.updated_at || 0) >= (local.updated_at || 0)) {
          if (sw.deleted_at) {
            map.delete(sw.id);
          } else {
            map.set(sw.id, {
              id: sw.id,
              name: sw.name,
              type: sw.type,
              initialBalance: Number(sw.initialBalance || sw.initial_balance) || 0,
              icon: sw.icon || '👛',
              updated_at: sw.updated_at
            });
          }
          changed = true;
        }
      }
      this.wallets = Array.from(map.values());
    }

    // Merge transactions
    if (pulled.transactions && pulled.transactions.length > 0) {
      const map = new Map(this.transactions.map(t => [t.id, t]));
      for (const st of pulled.transactions) {
        const local = map.get(st.id);
        if (!local || (st.updated_at || 0) >= (local.updated_at || 0)) {
          if (st.deleted_at) {
            map.delete(st.id);
          } else {
            map.set(st.id, {
              id: st.id,
              walletId: st.walletId || st.wallet_id,
              targetWalletId: st.targetWalletId || st.target_wallet_id,
              type: st.type,
              amount: Number(st.amount) || 0,
              category: st.category,
              note: st.note || '',
              date: st.date,
              updated_at: st.updated_at
            });
          }
          changed = true;
        }
      }
      this.transactions = Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    if (changed) {
      this.saveUserData();
    }
    return changed;
  }

  // Check if a transaction falls within the active custom period
  isTxInPeriod(tx) {
    if (!tx || !tx.date) return false;
    const txKey = formatToDateKey(tx.date);
    return txKey >= this.startDate && txKey <= this.endDate;
  }

  // Filtered transactions in the active period
  getPeriodTransactions() {
    return this.transactions.filter(t => this.isTxInPeriod(t));
  }

  // Wallet balance computed with transactions in active period
  getWalletBalance(walletId) {
    const wallet = this.wallets.find(w => w.id === walletId);
    if (!wallet) return 0;

    let balance = Number(wallet.initialBalance) || 0;
    for (const t of this.transactions) {
      if (this.isTxInPeriod(t)) {
        const amt = Number(t.amount) || 0;
        if (t.type === 'expense' && t.walletId === walletId) {
          balance -= amt;
        } else if (t.type === 'income' && t.walletId === walletId) {
          balance += amt;
        } else if (t.type === 'transfer') {
          if (t.walletId === walletId) balance -= amt;
          if (t.targetWalletId === walletId) balance += amt;
        }
      }
    }
    return balance;
  }

  getTotalBalance() {
    return this.wallets.reduce((acc, w) => acc + this.getWalletBalance(w.id), 0);
  }

  getPeriodSummary() {
    let income = 0;
    let expense = 0;

    for (const t of this.transactions) {
      if (this.isTxInPeriod(t)) {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') income += amt;
        else if (t.type === 'expense') expense += amt;
      }
    }

    return { income, expense, net: income - expense };
  }

  getCategoryBreakdown() {
    const breakdown = {};
    let totalExpense = 0;

    for (const t of this.transactions) {
      if (this.isTxInPeriod(t) && t.type === 'expense') {
        const amt = Number(t.amount) || 0;
        const catId = t.category || 'other_exp';
        breakdown[catId] = (breakdown[catId] || 0) + amt;
        totalExpense += amt;
      }
    }

    return { breakdown, totalExpense };
  }
}
