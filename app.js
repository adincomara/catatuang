/**
 * CatatUang - Financial Tracking Web App (Optimized for Android & iOS WebView)
 */

// --- Default Data & Initial State ---
const DEFAULT_CATEGORIES = {
  expense: [
    { id: 'food', name: 'Makanan & Minuman', icon: '🍔', color: '#f97316' },
    { id: 'transport', name: 'Transportasi & Bensin', icon: '🛵', color: '#06b6d4' },
    { id: 'groceries', name: 'Belanja Kebutuhan', icon: '🛒', color: '#10b981' },
    { id: 'bills', name: 'Tagihan & Utilitas', icon: '⚡', color: '#eab308' },
    { id: 'entertainment', name: 'Hiburan & Hobi', icon: '🎬', color: '#ec4899' },
    { id: 'health', name: 'Kesehatan & Obat', icon: '💊', color: '#ef4444' },
    { id: 'education', name: 'Pendidikan', icon: '📚', color: '#8b5cf6' },
    { id: 'charity', name: 'Sedekah & Donasi', icon: '🤲', color: '#14b8a6' },
    { id: 'family', name: 'Keluarga & Rumah', icon: '🏠', color: '#6366f1' },
    { id: 'other_exp', name: 'Lainnya', icon: '📦', color: '#64748b' }
  ],
  income: [
    { id: 'salary', name: 'Gaji Pokok', icon: '💵', color: '#22c55e' },
    { id: 'bonus', name: 'Bonus & THR', icon: '🎉', color: '#3b82f6' },
    { id: 'investment', name: 'Investasi & Bunga', icon: '📈', color: '#10b981' },
    { id: 'freelance', name: 'Side Job & Usaha', icon: '💻', color: '#8b5cf6' },
    { id: 'gift', name: 'Hadiah / Diberi', icon: '🎁', color: '#f59e0b' },
    { id: 'other_inc', name: 'Pemasukan Lain', icon: '💰', color: '#64748b' }
  ]
};

const DEFAULT_WALLETS = [
  { id: 'w1', name: 'Uang Tunai (Cash)', type: 'cash', initialBalance: 250000, icon: '💵', color: '#10b981' },
  { id: 'w2', name: 'Rekening BCA', type: 'bank', initialBalance: 5200000, icon: '🏦', color: '#2563eb' },
  { id: 'w3', name: 'GoPay / OVO', type: 'ewallet', initialBalance: 175000, icon: '📱', color: '#06b6d4' }
];

const SAMPLE_TRANSACTIONS = [
  {
    id: 'tx_sample_1',
    type: 'income',
    amount: 6500000,
    category: 'salary',
    walletId: 'w2',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    note: 'Gaji Bulanan Masuk'
  },
  {
    id: 'tx_sample_2',
    type: 'expense',
    amount: 45000,
    category: 'food',
    walletId: 'w1',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    note: 'Nasi Padang + Es Teh'
  },
  {
    id: 'tx_sample_3',
    type: 'expense',
    amount: 35000,
    category: 'transport',
    walletId: 'w3',
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    note: 'Bensin Pertalite & Parkir'
  },
  {
    id: 'tx_sample_4',
    type: 'expense',
    amount: 185000,
    category: 'bills',
    walletId: 'w2',
    date: new Date(Date.now() - 86400000).toISOString(),
    note: 'Token Listrik PLN & Internet'
  },
  {
    id: 'tx_sample_5',
    type: 'transfer',
    amount: 150000,
    walletId: 'w2',
    targetWalletId: 'w3',
    date: new Date().toISOString(),
    note: 'Top Up saldo GoPay dari BCA'
  },
  {
    id: 'tx_sample_6',
    type: 'expense',
    amount: 28000,
    category: 'food',
    walletId: 'w3',
    date: new Date().toISOString(),
    note: 'Kopi Susu Gula Aren'
  }
];

// --- App State ---
class AppState {
  constructor() {
    this.googleUser = this.loadRaw('catatuang_google_user', null);
    this.settings = this.loadRaw('catatuang_settings', {
      darkMode: false,
      hideBalance: false,
      currency: 'IDR',
      googleClientId: ''
    });

    // Periode bulan aktif (default: bulan dan tahun saat ini)
    const now = new Date();
    this.selectedYear = now.getFullYear();
    this.selectedMonth = now.getMonth(); // 0 = Jan, 11 = Des

    // Muat data dompet & transaksi terisolasi per email akun yang login
    this.loadUserData();

    this.currentTab = 'home';
    this.filterType = 'all';
    this.searchQuery = '';
    this.selectedWalletFilter = 'all';
    this.currentTxType = 'expense';
    this.editingTxId = null;
    this.editingWalletId = null;
  }

  getUserStoragePrefix() {
    if (this.googleUser && this.googleUser.email) {
      // Normalisasi email agar aman sebagai key (huruf kecil, ganti karakter aneh)
      const cleanEmail = this.googleUser.email.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '_');
      return `catatuang_u_${cleanEmail}_`;
    }
    return 'catatuang_u_guest_';
  }

  loadUserData() {
    const prefix = this.getUserStoragePrefix();
    this.wallets = this.loadRaw(prefix + 'wallets', DEFAULT_WALLETS);
    this.transactions = this.loadRaw(prefix + 'transactions', SAMPLE_TRANSACTIONS);
  }

  loadRaw(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn('LocalStorage error:', e);
      return fallback;
    }
  }

  saveRaw(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  saveAll() {
    const prefix = this.getUserStoragePrefix();
    this.saveRaw(prefix + 'wallets', this.wallets);
    this.saveRaw(prefix + 'transactions', this.transactions);
    this.saveRaw('catatuang_settings', this.settings);
    this.saveRaw('catatuang_google_user', this.googleUser);
  }

  // Cek apakah transaksi berada di periode bulan yang sedang dipilih
  isTxInSelectedPeriod(tx) {
    if (!tx || !tx.date) return false;
    const d = new Date(tx.date);
    return d.getFullYear() === this.selectedYear && d.getMonth() === this.selectedMonth;
  }

  // Saldo dompet dihitung murni dari mutasi di periode bulan yang aktif (Cutoff Bulanan)
  getWalletBalance(walletId) {
    const wallet = this.wallets.find(w => w.id === walletId);
    if (!wallet) return 0;
    
    // Di periode bulan aktif: saldo mulai dihitung dari modal saldo periode + mutasi bulan ini
    let balance = Number(wallet.initialBalance) || 0;

    this.transactions.forEach(t => {
      if (this.isTxInSelectedPeriod(t)) {
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
    });
    return balance;
  }

  getTotalBalance() {
    return this.wallets.reduce((acc, w) => acc + this.getWalletBalance(w.id), 0);
  }

  getMonthlyTotals(year, month) {
    let income = 0;
    let expense = 0;

    this.transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') income += amt;
        else if (t.type === 'expense') expense += amt;
      }
    });

    return { income, expense, net: income - expense };
  }
}

const state = new AppState();

// --- Formatting Helpers ---
function formatCurrency(val) {
  if (state.settings.hideBalance) return '••••••••';
  const num = Number(val) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return 'Hari Ini';
  if (isYesterday) return 'Kemarin';

  const options = { day: 'numeric', month: 'short', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined };
  return d.toLocaleDateString('id-ID', options);
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
}

function getCategoryInfo(type, catId) {
  const list = DEFAULT_CATEGORIES[type] || [];
  return list.find(c => c.id === catId) || { name: 'Lainnya', icon: '📝', color: '#94a3b8' };
}

function getWalletInfo(walletId) {
  return state.wallets.find(w => w.id === walletId) || { name: 'Dompet', icon: '👛', color: '#64748b' };
}

// --- UI Rendering ---

function renderApp() {
  checkAuthGate();
  applyTheme();
  renderHeader();
  renderTabContent();
  renderBottomNav();
}

function checkAuthGate() {
  const gateEl = document.getElementById('loginGateView');
  const mainEl = document.getElementById('mainAppView');
  if (!gateEl || !mainEl) return;

  if (state.googleUser) {
    gateEl.classList.add('hidden');
    mainEl.classList.remove('hidden');
  } else {
    gateEl.classList.remove('hidden');
    mainEl.classList.add('hidden');
  }
}

function loginAsGuest() {
  state.googleUser = {
    name: 'Tamu (Offline)',
    email: 'guest@offline.local',
    picture: 'icon.svg',
    isGuest: true
  };
  state.loadUserData(); // Muat data khusus profil tamu
  state.saveAll();
  showToast('Masuk dalam Mode Tamu (Offline)');
  renderApp();
}

function applyTheme() {
  const html = document.documentElement;
  if (state.settings.darkMode) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.checked = state.settings.darkMode;
  }
}

function renderHeader() {
  const headerTotal = document.getElementById('headerTotalBalance');
  if (headerTotal) {
    headerTotal.textContent = formatCurrency(state.getTotalBalance());
  }
  const hideBtn = document.getElementById('toggleHideBalanceBtn');
  if (hideBtn) {
    hideBtn.innerHTML = state.settings.hideBalance
      ? `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>`
      : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
  }

  // Label Periode Aktif
  const periodLabel = document.getElementById('currentPeriodLabel');
  if (periodLabel) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    periodLabel.textContent = `${monthNames[state.selectedMonth]} ${state.selectedYear}`;
  }
}

// Navigasi Ganti Periode Bulan (Cutoff)
function changePeriod(delta) {
  let m = state.selectedMonth + delta;
  let y = state.selectedYear;
  if (m < 0) {
    m = 11;
    y -= 1;
  } else if (m > 11) {
    m = 0;
    y += 1;
  }
  state.selectedMonth = m;
  state.selectedYear = y;
  renderApp();
  showToast(`Beralih ke periode: ${getMonthNameFull(m)} ${y}`);
}

function getMonthNameFull(m) {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return months[m] || '';
}

function openPeriodPickerModal() {
  const mSelect = document.getElementById('periodMonthSelect');
  const ySelect = document.getElementById('periodYearSelect');
  if (mSelect) mSelect.value = state.selectedMonth;
  if (ySelect) {
    const curYear = new Date().getFullYear();
    const years = [curYear - 2, curYear - 1, curYear, curYear + 1];
    ySelect.innerHTML = years.map(yr => `<option value="${yr}" ${yr === state.selectedYear ? 'selected' : ''}>${yr}</option>`).join('');
  }
  openBottomSheet('periodPickerModal');
}

function applyPeriodSelection() {
  const mSelect = document.getElementById('periodMonthSelect');
  const ySelect = document.getElementById('periodYearSelect');
  if (mSelect && ySelect) {
    state.selectedMonth = parseInt(mSelect.value, 10);
    state.selectedYear = parseInt(ySelect.value, 10);
    closeBottomSheet('periodPickerModal');
    renderApp();
    showToast(`Periode aktif: ${getMonthNameFull(state.selectedMonth)} ${state.selectedYear}`);
  }
}

function switchTab(tabName) {
  state.currentTab = tabName;
  document.querySelectorAll('.tab-view').forEach(el => el.classList.add('hidden'));
  const activeTab = document.getElementById(`tab-${tabName}`);
  if (activeTab) activeTab.classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(btn => {
    const isTarget = btn.getAttribute('data-tab') === tabName;
    btn.classList.toggle('text-emerald-600', isTarget);
    btn.classList.toggle('dark:text-emerald-400', isTarget);
    btn.classList.toggle('text-slate-400', !isTarget);
    btn.classList.toggle('dark:text-slate-500', !isTarget);
    if (isTarget) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  if (tabName === 'home') renderHomeScreen();
  else if (tabName === 'wallets') renderWalletsScreen();
  else if (tabName === 'transactions') renderTransactionsScreen();
  else if (tabName === 'stats') renderStatsScreen();
  else if (tabName === 'settings') renderSettingsScreen();
}

function renderBottomNav() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.onclick = () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) switchTab(tab);
    };
  });
}

function renderTabContent() {
  switchTab(state.currentTab);
}

// --- Screen 1: Home Dashboard ---
function renderHomeScreen() {
  const totals = state.getMonthlyTotals(state.selectedYear, state.selectedMonth);

  const incEl = document.getElementById('homeMonthIncome');
  const expEl = document.getElementById('homeMonthExpense');
  if (incEl) incEl.textContent = formatCurrency(totals.income);
  if (expEl) expEl.textContent = formatCurrency(totals.expense);

  // Wallets Mini Carousel (Saldo khusus periode bulan yang aktif)
  const walletList = document.getElementById('homeWalletList');
  if (walletList) {
    walletList.innerHTML = state.wallets.map(w => {
      const bal = state.getWalletBalance(w.id);
      return `
        <div onclick="openWalletTransactions('${w.id}')" class="flex-shrink-0 w-44 p-3.5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/60 active:scale-95 transition-transform cursor-pointer">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xl p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50">${w.icon}</span>
            <span class="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400">${w.type}</span>
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">${w.name}</div>
          <div class="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">${formatCurrency(bal)}</div>
        </div>
      `;
    }).join('');
  }

  // Recent Transactions (khusus periode aktif)
  const recentList = document.getElementById('homeRecentTransactions');
  if (recentList) {
    const periodTxs = state.transactions.filter(t => state.isTxInSelectedPeriod(t));
    const recent = [...periodTxs]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (recent.length === 0) {
      recentList.innerHTML = `
        <div class="text-center py-8 text-slate-400 text-sm">
          Belum ada transaksi di periode <b>${getMonthNameFull(state.selectedMonth)} ${state.selectedYear}</b>.<br/>Klik tombol <b>+</b> untuk mencatat!
        </div>
      `;
    } else {
      recentList.innerHTML = recent.map(tx => renderTransactionItem(tx)).join('');
    }
  }
}

// --- Screen 2: Dompet / Akun ---
function renderWalletsScreen() {
  const container = document.getElementById('walletsContainer');
  if (!container) return;

  const total = state.getTotalBalance();
  const summaryEl = document.getElementById('walletsTotalNetworth');
  if (summaryEl) summaryEl.textContent = formatCurrency(total);

  container.innerHTML = state.wallets.map(w => {
    const bal = state.getWalletBalance(w.id);
    return `
      <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <div onclick="editWallet('${w.id}')" class="flex items-center gap-3.5 cursor-pointer min-w-0 flex-1 pr-2">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-slate-50 dark:bg-slate-700/50 shadow-inner shrink-0">
            ${w.icon}
          </div>
          <div class="min-w-0">
            <div class="font-semibold text-slate-800 dark:text-slate-100 truncate">${w.name}</div>
            <div class="text-xs text-slate-400 capitalize">Saldo Awal: ${formatCurrency(w.initialBalance)}</div>
          </div>
        </div>
        <div class="text-right shrink-0">
          <div class="font-bold text-base text-slate-900 dark:text-slate-100">${formatCurrency(bal)}</div>
          <div class="flex items-center justify-end gap-1.5 mt-1.5">
            <button type="button" onclick="editWallet('${w.id}')" class="px-2.5 py-1 text-xs rounded-lg font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 active:scale-95 transition">Ubah</button>
            <button type="button" onclick="deleteWalletById('${w.id}')" class="px-2.5 py-1 text-xs rounded-lg font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 active:scale-95 transition">Hapus</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// --- Screen 3: Transactions History ---
function renderTransactionsScreen() {
  const filterWalletSelect = document.getElementById('txFilterWallet');
  if (filterWalletSelect) {
    const currentVal = state.selectedWalletFilter;
    filterWalletSelect.innerHTML = `<option value="all">Semua Dompet</option>` +
      state.wallets.map(w => `<option value="${w.id}" ${w.id === currentVal ? 'selected' : ''}>${w.name}</option>`).join('');
  }

  const listContainer = document.getElementById('txGroupedList');
  if (!listContainer) return;

  // Filter transactions: dibatasi khusus untuk periode bulan yang aktif
  let filtered = state.transactions
    .filter(t => state.isTxInSelectedPeriod(t))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (state.filterType !== 'all') {
    filtered = filtered.filter(t => t.type === state.filterType);
  }
  if (state.selectedWalletFilter !== 'all') {
    filtered = filtered.filter(t => t.walletId === state.selectedWalletFilter || t.targetWalletId === state.selectedWalletFilter);
  }
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(t => {
      const noteMatch = (t.note || '').toLowerCase().includes(q);
      const cat = getCategoryInfo(t.type, t.category).name.toLowerCase();
      return noteMatch || cat.includes(q);
    });
  }

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-16 text-slate-400">
        <svg class="w-12 h-12 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
        <p class="text-sm">Tidak ada transaksi yang cocok.</p>
      </div>
    `;
    return;
  }

  // Group by Date
  const groups = {};
  filtered.forEach(tx => {
    const dayKey = tx.date.split('T')[0];
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(tx);
  });

  listContainer.innerHTML = Object.keys(groups).map(dayKey => {
    const items = groups[dayKey];
    let dayExpense = 0;
    let dayIncome = 0;

    items.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'expense') dayExpense += amt;
      else if (t.type === 'income') dayIncome += amt;
    });

    const displayDate = formatDate(dayKey);

    return `
      <div class="mb-4">
        <div class="flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 py-1.5 border-b border-slate-100 dark:border-slate-800">
          <span>${displayDate}</span>
          <div class="flex gap-2 font-normal">
            ${dayIncome > 0 ? `<span class="text-emerald-500">+${formatCurrency(dayIncome)}</span>` : ''}
            ${dayExpense > 0 ? `<span class="text-rose-500">-${formatCurrency(dayExpense)}</span>` : ''}
          </div>
        </div>
        <div class="divide-y divide-slate-100/70 dark:divide-slate-800/70">
          ${items.map(t => renderTransactionItem(t)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderTransactionItem(tx) {
  const isExp = tx.type === 'expense';
  const isInc = tx.type === 'income';
  const isTrf = tx.type === 'transfer';

  let icon = '🔄';
  let title = 'Transfer Dompet';
  let badgeColor = 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
  let sign = '';
  let amountClass = 'text-slate-700 dark:text-slate-200';

  if (isExp) {
    const cat = getCategoryInfo('expense', tx.category);
    icon = cat.icon;
    title = cat.name;
    badgeColor = 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400';
    sign = '-';
    amountClass = 'text-rose-600 dark:text-rose-400';
  } else if (isInc) {
    const cat = getCategoryInfo('income', tx.category);
    icon = cat.icon;
    title = cat.name;
    badgeColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
    sign = '+';
    amountClass = 'text-emerald-600 dark:text-emerald-400';
  }

  const walletSource = getWalletInfo(tx.walletId);
  const walletTarget = isTrf ? getWalletInfo(tx.targetWalletId) : null;
  const walletDisplay = isTrf
    ? `${walletSource.name} ➔ ${walletTarget.name}`
    : walletSource.name;

  return `
    <div onclick="openTransactionDetail('${tx.id}')" class="flex items-center justify-between py-3 px-1 active:bg-slate-50 dark:active:bg-slate-800/60 rounded-xl transition cursor-pointer">
      <div class="flex items-center gap-3 min-w-0 pr-2">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-xl bg-slate-100 dark:bg-slate-800 shrink-0">
          ${icon}
        </div>
        <div class="min-w-0">
          <div class="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">${tx.note || title}</div>
          <div class="text-[11px] text-slate-400 dark:text-slate-500 truncate flex items-center gap-1.5">
            <span>${walletDisplay}</span>
            <span>•</span>
            <span>${formatTime(tx.date)}</span>
          </div>
        </div>
      </div>
      <div class="text-right shrink-0">
        <div class="font-bold text-sm ${amountClass}">${sign}${formatCurrency(tx.amount)}</div>
        <div class="text-[10px] text-slate-400 capitalize">${title}</div>
      </div>
    </div>
  `;
}

// --- Screen 4: Statistik & Laporan ---
let statsChartInstance = null;

function renderStatsScreen() {
  const totals = state.getMonthlyTotals(state.selectedYear, state.selectedMonth);

  const expTotalEl = document.getElementById('statsExpenseTotal');
  const incTotalEl = document.getElementById('statsIncomeTotal');
  const netTotalEl = document.getElementById('statsNetTotal');

  if (expTotalEl) expTotalEl.textContent = formatCurrency(totals.expense);
  if (incTotalEl) incTotalEl.textContent = formatCurrency(totals.income);
  if (netTotalEl) {
    netTotalEl.textContent = formatCurrency(totals.net);
    netTotalEl.className = totals.net >= 0
      ? 'text-lg font-bold text-emerald-600 dark:text-emerald-400'
      : 'text-lg font-bold text-rose-600 dark:text-rose-400';
  }

  // Calculate Breakdown by Category
  const catTotals = {};
  state.transactions.forEach(t => {
    if (t.type === 'expense') {
      const d = new Date(t.date);
      if (d.getFullYear() === state.selectedYear && d.getMonth() === state.selectedMonth) {
        catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount);
      }
    }
  });

  const breakdownContainer = document.getElementById('statsCategoryBreakdown');
  const sortedCategories = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a]);

  if (sortedCategories.length === 0) {
    if (breakdownContainer) {
      breakdownContainer.innerHTML = `<div class="text-center text-sm text-slate-400 py-6">Belum ada pengeluaran di bulan ini.</div>`;
    }
    if (statsChartInstance) {
      statsChartInstance.destroy();
      statsChartInstance = null;
    }
    return;
  }

  const chartLabels = [];
  const chartData = [];
  const chartColors = [];

  if (breakdownContainer) {
    breakdownContainer.innerHTML = sortedCategories.map(catId => {
      const cat = getCategoryInfo('expense', catId);
      const amt = catTotals[catId];
      const pct = totals.expense > 0 ? Math.round((amt / totals.expense) * 100) : 0;

      chartLabels.push(cat.name);
      chartData.push(amt);
      chartColors.push(cat.color || '#3b82f6');

      return `
        <div class="mb-3">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>${cat.icon}</span> ${cat.name}
            </span>
            <span class="font-bold text-slate-800 dark:text-slate-100">${formatCurrency(amt)} <span class="text-slate-400 font-normal">(${pct}%)</span></span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-700/60 rounded-full h-2 overflow-hidden">
            <div class="h-2 rounded-full transition-all duration-500" style="width: ${pct}%; background-color: ${cat.color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Draw or Update Chart.js Donut
  const canvas = document.getElementById('statsDonutChart');
  if (canvas && window.Chart) {
    if (statsChartInstance) statsChartInstance.destroy();

    statsChartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          backgroundColor: chartColors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        cutout: '70%'
      }
    });
  }
}

// --- Screen 5: Settings ---
function renderSettingsScreen() {
  // Stats summary inside settings (khusus transaksi periode aktif)
  const periodTxs = state.transactions.filter(t => state.isTxInSelectedPeriod(t));
  const totalTxCount = document.getElementById('settingsTotalTx');
  if (totalTxCount) {
    totalTxCount.textContent = `${periodTxs.length} transaksi di ${getMonthNameFull(state.selectedMonth)} ${state.selectedYear} (${state.transactions.length} total)`;
  }

  renderGoogleAccountUI();
}

function renderGoogleAccountUI() {
  const loggedOutView = document.getElementById('googleLoggedOutView');
  const loggedInView = document.getElementById('googleLoggedInView');
  if (!loggedOutView || !loggedInView) return;

  if (state.googleUser) {
    loggedOutView.classList.add('hidden');
    loggedInView.classList.remove('hidden');

    const nameEl = document.getElementById('googleUserName');
    const emailEl = document.getElementById('googleUserEmail');
    const avatarEl = document.getElementById('googleUserAvatar');

    if (nameEl) nameEl.textContent = state.googleUser.name || 'Pengguna Google';
    if (emailEl) emailEl.textContent = state.googleUser.email || '';
    if (avatarEl) {
      avatarEl.src = state.googleUser.picture || 'icon.svg';
    }

    const exportBtn = document.getElementById('btnExportSpreadsheet');
    if (exportBtn) {
      if (state.googleUser.isGuest) {
        exportBtn.classList.add('opacity-50');
        exportBtn.title = 'Login dengan akun Google asli untuk ekspor ke Spreadsheet';
      } else {
        exportBtn.classList.remove('opacity-50');
        exportBtn.title = '';
      }
    }
  } else {
    loggedOutView.classList.remove('hidden');
    loggedInView.classList.add('hidden');
  }
}

// --- Modal Add / Edit Transaction ---
function openAddTransactionModal(presetType = 'expense') {
  state.editingTxId = null;
  state.currentTxType = presetType;

  document.getElementById('modalTxTitle').textContent = 'Tambah Transaksi';
  document.getElementById('txAmountInput').value = '';
  document.getElementById('txNoteInput').value = '';
  
  // Set current date & time (sesuai periode aktif jika bulan berbeda)
  const now = new Date();
  let defaultDate = new Date();
  if (now.getFullYear() !== state.selectedYear || now.getMonth() !== state.selectedMonth) {
    defaultDate = new Date(state.selectedYear, state.selectedMonth, 1, 12, 0);
  }
  const localIso = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  document.getElementById('txDateTimeInput').value = localIso;

  setTxTypeSwitch(presetType);
  populateWalletSelects();
  renderCategoryGrid();

  // Reset scan button UI
  const statusEl = document.getElementById('scanReceiptStatus');
  if (statusEl) {
    statusEl.classList.add('hidden');
    statusEl.textContent = '⏳ Membaca Nota dengan AI...';
  }
  const camInput = document.getElementById('receiptCameraInput');
  const galInput = document.getElementById('receiptGalleryInput');
  if (camInput) camInput.value = '';
  if (galInput) galInput.value = '';

  openBottomSheet('transactionModal');
}

function setTxTypeSwitch(type) {
  state.currentTxType = type;
  document.querySelectorAll('.tx-type-btn').forEach(btn => {
    const isCur = btn.getAttribute('data-type') === type;
    btn.classList.toggle('bg-white', isCur);
    btn.classList.toggle('dark:bg-slate-700', isCur);
    btn.classList.toggle('shadow-sm', isCur);
    btn.classList.toggle('text-emerald-600', isCur && type === 'income');
    btn.classList.toggle('text-rose-600', isCur && type === 'expense');
    btn.classList.toggle('text-blue-600', isCur && type === 'transfer');
  });

  const transferTargetBox = document.getElementById('transferTargetWalletBox');
  const catSection = document.getElementById('categorySelectSection');
  if (type === 'transfer') {
    if (transferTargetBox) transferTargetBox.classList.remove('hidden');
    if (catSection) catSection.classList.add('hidden');
  } else {
    if (transferTargetBox) transferTargetBox.classList.add('hidden');
    if (catSection) catSection.classList.remove('hidden');
    renderCategoryGrid();
  }
}

function renderCategoryGrid() {
  const grid = document.getElementById('categoryGrid');
  if (!grid) return;

  const categories = DEFAULT_CATEGORIES[state.currentTxType] || [];
  grid.innerHTML = categories.map((cat, idx) => {
    const isSelected = idx === 0; // Default first category
    return `
      <button type="button" onclick="selectCategory('${cat.id}')" data-cat="${cat.id}" class="cat-pill flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition ${isSelected ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-semibold' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'}">
        <span class="text-2xl mb-1">${cat.icon}</span>
        <span class="text-[11px] leading-tight line-clamp-1">${cat.name}</span>
      </button>
    `;
  }).join('');

  if (categories.length > 0) {
    document.getElementById('selectedCategoryId').value = categories[0].id;
  }
}

function selectCategory(catId) {
  document.getElementById('selectedCategoryId').value = catId;
  document.querySelectorAll('.cat-pill').forEach(btn => {
    const isSel = btn.getAttribute('data-cat') === catId;
    btn.classList.toggle('border-emerald-500', isSel);
    btn.classList.toggle('bg-emerald-50/50', isSel);
    btn.classList.toggle('dark:bg-emerald-950/20', isSel);
    btn.classList.toggle('text-emerald-700', isSel);
    btn.classList.toggle('dark:text-emerald-300', isSel);
    btn.classList.toggle('font-semibold', isSel);
  });
}

function populateWalletSelects() {
  const sourceSel = document.getElementById('txSourceWallet');
  const targetSel = document.getElementById('txTargetWallet');

  const options = state.wallets.map(w => `<option value="${w.id}">${w.name} (${formatCurrency(state.getWalletBalance(w.id))})</option>`).join('');

  if (sourceSel) sourceSel.innerHTML = options;
  if (targetSel) {
    targetSel.innerHTML = state.wallets.map((w, idx) => `<option value="${w.id}" ${idx === 1 ? 'selected' : ''}>${w.name}</option>`).join('');
  }
}

function addQuickAmount(delta) {
  const input = document.getElementById('txAmountInput');
  const current = Number(input.value) || 0;
  input.value = current + delta;
}

function saveTransaction() {
  const amount = Number(document.getElementById('txAmountInput').value);
  if (!amount || amount <= 0) {
    showToast('Harap masukkan nominal yang valid!');
    return;
  }

  const type = state.currentTxType;
  const sourceWalletId = document.getElementById('txSourceWallet').value;
  const targetWalletId = document.getElementById('txTargetWallet').value;
  const categoryId = document.getElementById('selectedCategoryId').value;
  const dateStr = document.getElementById('txDateTimeInput').value;
  const note = document.getElementById('txNoteInput').value.trim();

  if (type === 'transfer' && sourceWalletId === targetWalletId) {
    showToast('Dompet asal dan tujuan tidak boleh sama!');
    return;
  }

  if (state.editingTxId) {
    // Edit existing
    const idx = state.transactions.findIndex(t => t.id === state.editingTxId);
    if (idx !== -1) {
      state.transactions[idx] = {
        id: state.editingTxId,
        type,
        amount,
        category: categoryId,
        walletId: sourceWalletId,
        targetWalletId: type === 'transfer' ? targetWalletId : undefined,
        date: new Date(dateStr).toISOString(),
        note
      };
      showToast('Transaksi berhasil diperbarui!');
    }
  } else {
    // Add new
    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type,
      amount,
      category: categoryId,
      walletId: sourceWalletId,
      targetWalletId: type === 'transfer' ? targetWalletId : undefined,
      date: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
      note
    };
    state.transactions.unshift(newTx);
    // Sinkronkan periode tampilan ke tanggal transaksi yang baru dibuat
    const txDate = new Date(newTx.date);
    state.selectedYear = txDate.getFullYear();
    state.selectedMonth = txDate.getMonth();
    showToast('Transaksi berhasil disimpan!');
  }

  state.saveAll();
  closeBottomSheet('transactionModal');
  renderApp();
}

// --- AI Receipt Scanner ---
async function handleReceiptUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('scanReceiptStatus');
  if (statusEl) {
    statusEl.classList.remove('hidden');
    statusEl.textContent = '⏳ Membaca Nota dengan AI...';
    statusEl.className = 'text-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-2 py-1 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 animate-pulse';
  }

  try {
    // Convert to base64
    const base64Data = await readFileAsBase64(file);

    showToast('Sedang menganalisis struk/nota belanja...');
    const resp = await fetch('/api/scan-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data })
    });

    if (!resp.ok) {
      throw new Error('Gagal menghubungi server scan (' + resp.status + ')');
    }

    const resJson = await resp.json();
    if (!resJson.success || !resJson.data) {
      throw new Error(resJson.error || 'Gagal membaca nota');
    }

    const data = resJson.data;

    // Fill form automatically
    if (data.total && Number(data.total) > 0) {
      document.getElementById('txAmountInput').value = data.total;
    } else if (Array.isArray(data.items) && data.items.length > 0) {
      // Fallback jika total kosong tapi ada item
      showToast('Periksa kembali nominal total yang tertera pada nota.');
    }

    // Penentuan Catatan Transaksi (Merchant / Barang)
    let noteText = '';
    if (data.merchant && data.merchant.trim()) {
      noteText = data.merchant.trim();
    }
    if (Array.isArray(data.items) && data.items.length > 0) {
      const itemsList = data.items.filter(Boolean).slice(0, 3).join(', ');
      if (itemsList) {
        noteText = noteText ? `${noteText} (${itemsList})` : itemsList;
      }
    }
    if (!noteText) {
      noteText = 'Belanja Nota / Struk';
    }
    document.getElementById('txNoteInput').value = noteText;

    if (data.date) {
      try {
        const d = new Date(data.date);
        if (!isNaN(d.getTime())) {
          const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          document.getElementById('txDateTimeInput').value = localIso;
        }
      } catch (e) {}
    } else {
      // Default ke waktu sekarang jika nota tidak mencantumkan tanggal
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      document.getElementById('txDateTimeInput').value = localIso;
    }

    // Set type to expense (karena nota fisik/struk selalu pengeluaran)
    setTxTypeSwitch('expense');

    // Pick category: jika AI berhasil infer kategori, gunakan. Jika tidak, default ke 'food' atau 'groceries'
    if (data.category && DEFAULT_CATEGORIES.expense.some(c => c.id === data.category)) {
      selectCategory(data.category);
    } else {
      // Coba tebak dari teks nama barang/merchant
      const textToScan = noteText.toLowerCase();
      if (/makan|minum|kopi|nasi|resto|cafe|teh|ayam|mie|snack|roti|bakso/.test(textToScan)) {
        selectCategory('food');
      } else if (/bensin|pertalite|pertamax|parkir|spbu|ojek|grab|gojek|tol/.test(textToScan)) {
        selectCategory('transport');
      } else if (/indomaret|alfamart|superindo|sabun|shampoo|minyak|odol|tisu/.test(textToScan)) {
        selectCategory('groceries');
      } else if (/obat|apotek|farmasi|paracetamol|vitamin|klinik/.test(textToScan)) {
        selectCategory('health');
      } else if (/listrik|pln|pdam|pulsa|paket data|telkom|internet/.test(textToScan)) {
        selectCategory('bills');
      } else {
        selectCategory('groceries'); // Fallback paling umum untuk nota belanja
      }
    }

    showToast('✨ Nota berhasil dibaca! Total: ' + formatCurrency(data.total || 0));
    if (statusEl) {
      statusEl.classList.remove('animate-pulse');
      statusEl.textContent = '✅ Nota Terbaca: ' + (data.merchant || 'Selesai');
    }
  } catch (err) {
    console.error('Scan receipt error:', err);
    showToast('Gagal memproses nota: ' + err.message);
    if (statusEl) {
      statusEl.classList.remove('animate-pulse');
      statusEl.textContent = '❌ Gagal membaca nota. Coba foto lebih jelas.';
      statusEl.className = 'text-center text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-2 py-1 px-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40';
    }
  }
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

// --- PWA Add to Home Screen (Webview / Native Feel) ---
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  
  // Tampilkan banner notifikasi tambah ke beranda jika belum di-dismiss
  const dismissed = sessionStorage.getItem('catatuang_pwa_dismissed');
  if (!dismissed) {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.classList.remove('hidden');
  }
});

async function triggerPwaInstall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('Aplikasi berhasil ditambahkan ke Layar Utama!');
    }
    deferredInstallPrompt = null;
    dismissPwaBanner();
  } else {
    // Jika di iOS Safari atau browser tanpa beforeinstallprompt
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      alert('Untuk memasang di iPhone/iPad:\n1. Klik tombol Share (ikon kotak tanda panah ke atas di Safari)\n2. Pilih "Add to Home Screen" (Tambahkan ke Layar Utama)');
    } else {
      alert('Untuk memasang aplikasi ke Layar Utama:\nKlik tombol titik tiga di pojok kanan atas browser Anda, lalu pilih "Tambahkan ke Layar Utama" atau "Install app".');
    }
  }
}

function dismissPwaBanner() {
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) banner.classList.add('hidden');
  sessionStorage.setItem('catatuang_pwa_dismissed', '1');
}

// Otomatis tawarkan notifikasi install saat user login atau buka app
setTimeout(() => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const dismissed = sessionStorage.getItem('catatuang_pwa_dismissed');
  if (!isStandalone && !dismissed) {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.classList.remove('hidden');
  }
}, 3000);

// --- Detail & Delete Modal ---
function openTransactionDetail(txId) {
  const tx = state.transactions.find(t => t.id === txId);
  if (!tx) return;

  const modal = document.getElementById('txDetailModal');
  if (!modal) return;

  const isExp = tx.type === 'expense';
  const isInc = tx.type === 'income';
  const isTrf = tx.type === 'transfer';

  let icon = '🔄';
  let title = 'Transfer';
  if (isExp) {
    const c = getCategoryInfo('expense', tx.category);
    icon = c.icon;
    title = c.name;
  } else if (isInc) {
    const c = getCategoryInfo('income', tx.category);
    icon = c.icon;
    title = c.name;
  }

  document.getElementById('detailTxIcon').textContent = icon;
  document.getElementById('detailTxTitle').textContent = tx.note || title;
  document.getElementById('detailTxAmount').textContent = (isExp ? '-' : isInc ? '+' : '') + formatCurrency(tx.amount);
  document.getElementById('detailTxDate').textContent = `${formatDate(tx.date)}, ${formatTime(tx.date)}`;
  document.getElementById('detailTxWallet').textContent = getWalletInfo(tx.walletId).name;
  document.getElementById('detailTxCategory').textContent = title;
  document.getElementById('detailTxNote').textContent = tx.note || '-';

  const editBtn = document.getElementById('detailEditBtn');
  if (editBtn) {
    editBtn.onclick = () => openEditTransactionModal(txId);
  }

  const deleteBtn = document.getElementById('detailDeleteBtn');
  deleteBtn.onclick = () => {
    if (confirm('Yakin ingin menghapus transaksi ini?')) {
      state.transactions = state.transactions.filter(t => t.id !== txId);
      state.saveAll();
      closeBottomSheet('txDetailModal');
      showToast('Transaksi telah dihapus');
      renderApp();
    }
  };

  openBottomSheet('txDetailModal');
}

function openEditTransactionModal(txId) {
  const tx = state.transactions.find(t => t.id === txId);
  if (!tx) return;
  closeBottomSheet('txDetailModal');

  state.editingTxId = tx.id;
  state.currentTxType = tx.type;

  document.getElementById('modalTxTitle').textContent = 'Ubah Transaksi';
  document.getElementById('txAmountInput').value = tx.amount;
  document.getElementById('txNoteInput').value = tx.note || '';

  const d = new Date(tx.date);
  const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  document.getElementById('txDateTimeInput').value = localIso;

  setTxTypeSwitch(tx.type);
  populateWalletSelects();

  if (document.getElementById('txSourceWallet')) {
    document.getElementById('txSourceWallet').value = tx.walletId;
  }
  if (tx.type === 'transfer' && tx.targetWalletId && document.getElementById('txTargetWallet')) {
    document.getElementById('txTargetWallet').value = tx.targetWalletId;
  }
  if (tx.type !== 'transfer' && tx.category) {
    selectCategory(tx.category);
  }

  openBottomSheet('transactionModal');
}

// --- Bottom Sheet Controls ---
function openBottomSheet(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeBottomSheet(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// --- Wallet Modal & Editing ---
let walletBalanceMode = 'current'; // 'current' or 'initial'

function setWalletBalanceMode(mode) {
  walletBalanceMode = mode;
  const btnCurrent = document.getElementById('btnModeCurrent');
  const btnInitial = document.getElementById('btnModeInitial');
  const helpText = document.getElementById('walletBalanceHelpText');
  const balanceInput = document.getElementById('walletBalanceInput');

  if (!state.editingWalletId) return;
  const wallet = state.wallets.find(w => w.id === state.editingWalletId);
  if (!wallet) return;

  if (mode === 'current') {
    if (btnCurrent) btnCurrent.className = 'px-2 py-0.5 rounded-md font-semibold bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400';
    if (btnInitial) btnInitial.className = 'px-2 py-0.5 rounded-md text-slate-500';
    if (helpText) helpText.textContent = 'Mengatur saldo akhir saat ini secara langsung.';
    balanceInput.value = state.getWalletBalance(wallet.id);
  } else {
    if (btnInitial) btnInitial.className = 'px-2 py-0.5 rounded-md font-semibold bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400';
    if (btnCurrent) btnCurrent.className = 'px-2 py-0.5 rounded-md text-slate-500';
    if (helpText) helpText.textContent = 'Mengatur saldo modal awal saat dompet pertama kali dibuat.';
    balanceInput.value = wallet.initialBalance ?? 0;
  }
}

function openAddWalletModal() {
  state.editingWalletId = null;
  walletBalanceMode = 'initial';

  const modalTitle = document.getElementById('modalWalletTitle');
  const submitBtn = document.getElementById('modalWalletSubmitBtn');
  const deleteBtn = document.getElementById('modalWalletDeleteBtn');
  const modeSwitch = document.getElementById('walletBalanceModeSwitch');
  const balanceLabel = document.getElementById('walletBalanceLabel');
  const helpText = document.getElementById('walletBalanceHelpText');

  if (modalTitle) modalTitle.textContent = 'Tambah Dompet Baru';
  if (submitBtn) submitBtn.textContent = 'Buat Dompet';
  if (deleteBtn) deleteBtn.classList.add('hidden');
  if (modeSwitch) modeSwitch.classList.add('hidden');
  if (balanceLabel) balanceLabel.textContent = 'Saldo Awal (Rp)';
  if (helpText) helpText.textContent = 'Saldo awal saat dompet pertama kali dibuat.';

  document.getElementById('editingWalletId').value = '';
  document.getElementById('walletNameInput').value = '';
  document.getElementById('walletBalanceInput').value = '';
  document.getElementById('walletTypeSelect').value = 'bank';
  openBottomSheet('walletModal');
}

function editWallet(walletId) {
  const wallet = state.wallets.find(w => w.id === walletId);
  if (!wallet) return;

  state.editingWalletId = walletId;
  const modalTitle = document.getElementById('modalWalletTitle');
  const submitBtn = document.getElementById('modalWalletSubmitBtn');
  const deleteBtn = document.getElementById('modalWalletDeleteBtn');
  const modeSwitch = document.getElementById('walletBalanceModeSwitch');
  const balanceLabel = document.getElementById('walletBalanceLabel');

  if (modalTitle) modalTitle.textContent = 'Ubah Dompet';
  if (submitBtn) submitBtn.textContent = 'Simpan Perubahan';
  if (balanceLabel) balanceLabel.textContent = 'Nominal Saldo (Rp)';

  if (deleteBtn) {
    if (state.wallets.length > 1) {
      deleteBtn.classList.remove('hidden');
    } else {
      deleteBtn.classList.add('hidden');
    }
  }

  if (modeSwitch) modeSwitch.classList.remove('hidden');

  document.getElementById('editingWalletId').value = walletId;
  document.getElementById('walletNameInput').value = wallet.name;
  document.getElementById('walletTypeSelect').value = wallet.type;

  // Default mode to 'current' so user can directly set current balance
  setWalletBalanceMode('current');

  openBottomSheet('walletModal');
}

function saveWallet() {
  const name = document.getElementById('walletNameInput').value.trim();
  const inputAmount = Number(document.getElementById('walletBalanceInput').value) || 0;
  const type = document.getElementById('walletTypeSelect').value;

  if (!name) {
    showToast('Harap beri nama dompet!');
    return;
  }

  let icon = '🏦';
  if (type === 'cash') icon = '💵';
  else if (type === 'ewallet') icon = '📱';
  else if (type === 'credit') icon = '💳';

  if (state.editingWalletId) {
    const wallet = state.wallets.find(w => w.id === state.editingWalletId);
    if (wallet) {
      wallet.name = name;
      wallet.type = type;
      wallet.icon = icon;

      if (walletBalanceMode === 'current') {
        let mutation = 0;
        state.transactions.forEach(t => {
          const amt = Number(t.amount) || 0;
          if (t.type === 'expense' && t.walletId === wallet.id) {
            mutation -= amt;
          } else if (t.type === 'income' && t.walletId === wallet.id) {
            mutation += amt;
          } else if (t.type === 'transfer') {
            if (t.walletId === wallet.id) mutation -= amt;
            if (t.targetWalletId === wallet.id) mutation += amt;
          }
        });
        wallet.initialBalance = inputAmount - mutation;
      } else {
        wallet.initialBalance = inputAmount;
      }
      showToast('Dompet berhasil diperbarui!');
    }
  } else {
    const newWallet = {
      id: 'w_' + Date.now(),
      name,
      type,
      initialBalance: inputAmount,
      icon,
      color: '#0ea5e9'
    };
    state.wallets.push(newWallet);
    showToast('Dompet baru berhasil dibuat!');
  }

  state.saveAll();
  closeBottomSheet('walletModal');
  renderApp();
}

function deleteWalletById(walletId) {
  if (state.wallets.length <= 1) {
    showToast('Minimal harus ada 1 dompet aktif!');
    return;
  }
  const wallet = state.wallets.find(w => w.id === walletId);
  if (!wallet) return;

  if (confirm(`Yakin ingin menghapus dompet "${wallet.name}"?`)) {
    state.wallets = state.wallets.filter(w => w.id !== walletId);
    state.saveAll();
    showToast(`Dompet "${wallet.name}" berhasil dihapus`);
    renderApp();
  }
}

function deleteWallet() {
  if (!state.editingWalletId) return;
  deleteWalletById(state.editingWalletId);
  closeBottomSheet('walletModal');
}

function openWalletTransactions(walletId) {
  state.selectedWalletFilter = walletId;
  switchTab('transactions');
}

// --- Google OAuth & Google Spreadsheet Export ---
const DEFAULT_GOOGLE_CLIENT_ID = '511845373742-mbu4m40ugcklo8a3fcrugho86kvlbndn.apps.googleusercontent.com';

function getEffectiveGoogleClientId() {
  return (state.settings && state.settings.googleClientId && state.settings.googleClientId.trim()) 
    ? state.settings.googleClientId.trim() 
    : DEFAULT_GOOGLE_CLIENT_ID;
}

function openGoogleClientIdModal() {
  const input = document.getElementById('googleClientIdInput');
  if (input) input.value = (state.settings && state.settings.googleClientId) ? state.settings.googleClientId : DEFAULT_GOOGLE_CLIENT_ID;
  openBottomSheet('googleClientIdModal');
}

function saveGoogleClientId() {
  const input = document.getElementById('googleClientIdInput');
  const val = input ? input.value.trim() : '';
  state.settings.googleClientId = val;
  state.saveAll();
  closeBottomSheet('googleClientIdModal');
  showToast('Google Client ID berhasil disimpan!');
}

function loginWithGoogle() {
  const clientId = getEffectiveGoogleClientId();
  
  if (!clientId) {
    openGoogleClientIdModal();
    showToast('Harap masukkan Google Client ID Anda terlebih dahulu!');
    return;
  }

  if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
    showToast('Sedang memuat SDK Google, coba sesaat lagi...');
    return;
  }

  try {
    // Gunakan scope dasar (profile & email) agar login SELALU berhasil tanpa hambatan izin sensitif
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: async (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          state.googleAccessToken = tokenResponse.access_token;
          await fetchGoogleUserProfile(tokenResponse.access_token);
        } else {
          showToast('Login Google dibatalkan atau gagal.');
        }
      }
    });
    tokenClient.requestAccessToken();
  } catch (err) {
    console.error('Google login error:', err);
    showToast('Error login Google: ' + err.message);
  }
}

async function fetchGoogleUserProfile(accessToken) {
  try {
    const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (resp.ok) {
      const user = await resp.json();
      state.googleUser = {
        name: user.name,
        email: user.email,
        picture: user.picture
      };
      // Muat data khusus milik email Google ini
      state.loadUserData();
      state.saveAll();
      renderApp();
      showToast('Halo ' + user.name + '! Berhasil masuk.');
    }
  } catch (e) {
    console.error('Profile fetch error:', e);
  }
}

function logoutGoogle() {
  state.googleUser = null;
  state.googleAccessToken = null;
  // Muat data profil tamu kosong
  state.loadUserData();
  state.saveAll();
  renderApp();
  showToast('Telah keluar dari akun Google.');
}

async function exportToGoogleSpreadsheet() {
  if (state.transactions.length === 0) {
    showToast('Belum ada transaksi untuk diekspor!');
    return;
  }

  // Gunakan Ekspor Spreadsheet File (.xlsx) yang 100% kompatibel langsung dengan Google Sheets
  // Tanpa blokir izin Google / Error 403, siapa saja (teman/publik) bisa langsung pakai!
  exportSpreadsheetXLSX();
}

function exportSpreadsheetXLSX() {
  try {
    if (typeof XLSX === 'undefined') {
      showToast('Gagal memuat modul Spreadsheet. Coba refresh browser.');
      return;
    }

    // Ekspor khusus transaksi pada periode bulan yang sedang aktif
    const periodTxs = state.transactions.filter(t => state.isTxInSelectedPeriod(t));
    if (periodTxs.length === 0) {
      showToast(`Belum ada transaksi di periode ${getMonthNameFull(state.selectedMonth)} ${state.selectedYear} untuk diekspor!`);
      return;
    }

    const dataRows = [
      ['No', 'Tanggal', 'Waktu', 'Tipe', 'Kategori', 'Dompet', 'Nominal (IDR)', 'Catatan']
    ];

    periodTxs.forEach((t, idx) => {
      const isExp = t.type === 'expense';
      const isInc = t.type === 'income';
      const catName = t.type === 'transfer' ? 'Transfer' : getCategoryInfo(t.type, t.category).name;
      const walletSource = getWalletInfo(t.walletId).name;
      const walletTarget = t.type === 'transfer' ? getWalletInfo(t.targetWalletId).name : '';
      const walletDisplay = t.type === 'transfer' ? `${walletSource} -> ${walletTarget}` : walletSource;
      
      const d = new Date(t.date);
      const datePart = d.toLocaleDateString('id-ID');
      const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

      dataRows.push([
        idx + 1,
        datePart,
        timePart,
        isExp ? 'Pengeluaran' : isInc ? 'Pemasukan' : 'Transfer',
        catName,
        walletDisplay,
        Number(t.amount) || 0,
        t.note || ''
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(dataRows);

    // Set column widths
    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 10 },
      { wch: 14 },
      { wch: 22 },
      { wch: 20 },
      { wch: 16 },
      { wch: 30 }
    ];

    const sheetTitle = `${getMonthNameFull(state.selectedMonth)} ${state.selectedYear}`.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

    const emailName = (state.googleUser && state.googleUser.email) ? state.googleUser.email.split('@')[0] : 'Keuangan';
    const monthNum = String(state.selectedMonth + 1).padStart(2, '0');
    const fileName = `CatatUang_${emailName}_${state.selectedYear}-${monthNum}.xlsx`;

    XLSX.writeFile(wb, fileName);
    showToast(`File Spreadsheet periode ${getMonthNameFull(state.selectedMonth)} ${state.selectedYear} berhasil diunduh!`);
  } catch (err) {
    console.error('XLSX export error:', err);
    showToast('Error ekspor Spreadsheet: ' + err.message);
  }
}

async function exportToGoogleDriveAPI() {
  // Opsional: jika tetap ingin direct create via REST API Google Sheets
  const clientId = getEffectiveGoogleClientId();
  if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
    showToast('Sedang memuat SDK Google, coba sesaat lagi...');
    return;
  }

  showToast('Meminta izin akses Google Sheets...');
  try {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      callback: async (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          await executeSpreadsheetExport(tokenResponse.access_token);
        } else {
          showToast('Izin akses Spreadsheet dibatalkan atau ditolak.');
        }
      }
    });
    tokenClient.requestAccessToken();
  } catch (err) {
    console.error('Spreadsheet request error:', err);
    showToast('Error: ' + err.message);
  }
}

async function executeSpreadsheetExport(accessToken) {
  showToast('Membuat Google Spreadsheet baru...');

  try {
    const title = `CatatUang - Laporan Keuangan (${new Date().toLocaleDateString('id-ID')})`;
    
    // 1. Create Spreadsheet
    const createResp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: { title: title }
      })
    });

    if (!createResp.ok) {
      // If unauthorized, token might be expired
      if (createResp.status === 401) {
        showToast('Sesi Google kadaluarsa, silakan login ulang.');
        state.googleAccessToken = null;
        loginWithGoogle();
        return;
      }
      const err = await createResp.json();
      throw new Error(err.error ? err.error.message : 'Gagal membuat spreadsheet');
    }

    const sheetData = await createResp.json();
    const spreadsheetId = sheetData.spreadsheetId;
    const spreadsheetUrl = sheetData.spreadsheetUrl;

    // 2. Prepare Rows Data
    const values = [
      ['No', 'Tanggal & Waktu', 'Tipe', 'Kategori', 'Dompet', 'Nominal (IDR)', 'Catatan']
    ];

    state.transactions.forEach((t, idx) => {
      const isExp = t.type === 'expense';
      const isInc = t.type === 'income';
      const catName = t.type === 'transfer' ? 'Transfer' : getCategoryInfo(t.type, t.category).name;
      const walletSource = getWalletInfo(t.walletId).name;
      const walletTarget = t.type === 'transfer' ? getWalletInfo(t.targetWalletId).name : '';
      const walletDisplay = t.type === 'transfer' ? `${walletSource} -> ${walletTarget}` : walletSource;

      values.push([
        idx + 1,
        new Date(t.date).toLocaleString('id-ID'),
        isExp ? 'Pengeluaran' : isInc ? 'Pemasukan' : 'Transfer',
        catName,
        walletDisplay,
        Number(t.amount) || 0,
        t.note || ''
      ]);
    });

    // 3. Append Data to Sheet
    const updateResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: values })
    });

    if (!updateResp.ok) {
      throw new Error('Gagal mengisi data spreadsheet');
    }

    showToast('Berhasil diekspor ke Google Spreadsheet!');
    if (confirm('Ekspor Berhasil! Buka Google Spreadsheet sekarang?')) {
      window.open(spreadsheetUrl, '_blank');
    }
  } catch (err) {
    console.error('Spreadsheet export error:', err);
    showToast('Error ekspor: ' + err.message);
  }
}

// --- Backup & Restore & Demo Data ---
function exportJSON() {
  const backup = {
    app: 'CatatUang',
    version: '1.0',
    exportDate: new Date().toISOString(),
    wallets: state.wallets,
    transactions: state.transactions,
    settings: state.settings
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `catatuang_backup_${new Date().toISOString().slice(0, 10)}.json`);
  dlAnchor.click();
  showToast('Data berhasil diekspor!');
}

function exportCSV() {
  if (state.transactions.length === 0) {
    showToast('Belum ada transaksi untuk diekspor!');
    return;
  }

  const rows = [
    ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Dompet', 'Nominal', 'Catatan']
  ];

  state.transactions.forEach(t => {
    const catName = t.type === 'transfer' ? 'Transfer' : getCategoryInfo(t.type, t.category).name;
    const walletName = getWalletInfo(t.walletId).name;
    rows.push([
      t.id,
      t.date,
      t.type,
      `"${catName}"`,
      `"${walletName}"`,
      t.amount,
      `"${(t.note || '').replace(/"/g, '""')}"`
    ]);
  });

  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", encodeURI(csvContent));
  dlAnchor.setAttribute("download", `catatuang_transaksi_${new Date().toISOString().slice(0, 10)}.csv`);
  dlAnchor.click();
  showToast('CSV berhasil diekspor!');
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.wallets && data.transactions) {
        state.wallets = data.wallets;
        state.transactions = data.transactions;
        if (data.settings) state.settings = data.settings;
        state.saveAll();
        renderApp();
        showToast('Data cadangan berhasil dipulihkan!');
      } else {
        showToast('Format file cadangan tidak valid!');
      }
    } catch (err) {
      showToast('Gagal membaca file JSON!');
    }
  };
  reader.readAsText(file);
}

function loadSampleData() {
  if (confirm('Muat data contoh transaksi Indonesia? Data saat ini akan digabungkan.')) {
    state.transactions = [...SAMPLE_TRANSACTIONS, ...state.transactions];
    state.saveAll();
    renderApp();
    showToast('Data contoh berhasil dimuat!');
  }
}

function resetAllData() {
  if (confirm('PERINGATAN: Semua riwayat transaksi akan dihapus dan SEMUA saldo dompet akan di-reset menjadi Rp 0. Lanjutkan?')) {
    // Kosongkan seluruh riwayat transaksi
    state.transactions = [];
    
    // Nol-kan saldo seluruh dompet yang ada
    state.wallets = state.wallets.map(w => ({
      ...w,
      initialBalance: 0
    }));

    state.saveAll();
    renderApp();
    showToast('Semua transaksi dihapus dan saldo dompet di-reset ke Rp 0!');
  }
}

// --- Toast Notification ---
function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2');
  toast.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, 2600);
}

// --- Init Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  renderApp();

  // Search input
  const searchInput = document.getElementById('txSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderTransactionsScreen();
    });
  }

  // Filter chips in Transactions
  document.querySelectorAll('.tx-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.tx-filter-chip').forEach(c => {
        c.classList.remove('bg-emerald-600', 'text-white');
        c.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      });
      chip.classList.add('bg-emerald-600', 'text-white');
      chip.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');

      state.filterType = chip.getAttribute('data-type');
      renderTransactionsScreen();
    });
  });

  // Wallet filter in Transactions
  const walletFilter = document.getElementById('txFilterWallet');
  if (walletFilter) {
    walletFilter.addEventListener('change', (e) => {
      state.selectedWalletFilter = e.target.value;
      renderTransactionsScreen();
    });
  }

  // Toggle Hide Balance
  const toggleHideBtn = document.getElementById('toggleHideBalanceBtn');
  if (toggleHideBtn) {
    toggleHideBtn.addEventListener('click', () => {
      state.settings.hideBalance = !state.settings.hideBalance;
      state.saveAll();
      renderApp();
    });
  }

  // Dark Mode Toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('change', (e) => {
      state.settings.darkMode = e.target.checked;
      state.saveAll();
      applyTheme();
      if (state.currentTab === 'stats') renderStatsScreen();
    });
  }

  // Register PWA Service Worker if available
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js?v=4.0').then(reg => {
      reg.update();
    }).catch(err => {
      console.log('SW registration note:', err.message);
    });
  }
});

// Force Cache Cleanup & Reload
async function forceAppUpdate() {
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }
  } catch (e) {
    console.error('Cache wipe error:', e);
  }
  showToast('Memperbarui aplikasi...');
  setTimeout(() => {
    window.location.reload(true);
  }, 400);
}
