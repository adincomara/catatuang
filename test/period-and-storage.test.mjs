import assert from 'node:assert/strict';

// Core logic functions under test
function getUserStoragePrefix(user) {
  if (!user || !user.email) {
    throw new Error('Mandatory Google Auth required: user email must exist');
  }
  const cleanEmail = user.email.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '_');
  return `catatuang_u_${cleanEmail}_`;
}

function getLocalDateKey(dateInput) {
  const d = new Date(dateInput);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isDateInPeriod(dateInput, startDateStr, endDateStr) {
  if (!dateInput || !startDateStr || !endDateStr) return false;
  const targetKey = getLocalDateKey(dateInput);
  return targetKey >= startDateStr && targetKey <= endDateStr;
}

function computePeriodSummary(transactions, startDateStr, endDateStr) {
  let income = 0;
  let expense = 0;

  for (const tx of transactions) {
    if (isDateInPeriod(tx.date, startDateStr, endDateStr)) {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') income += amt;
      else if (tx.type === 'expense') expense += amt;
    }
  }

  return { income, expense, net: income - expense };
}

function computeWalletBalance(wallet, transactions, startDateStr, endDateStr) {
  let balance = Number(wallet.initialBalance) || 0;
  for (const tx of transactions) {
    if (isDateInPeriod(tx.date, startDateStr, endDateStr)) {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'expense' && tx.walletId === wallet.id) {
        balance -= amt;
      } else if (tx.type === 'income' && tx.walletId === wallet.id) {
        balance += amt;
      } else if (tx.type === 'transfer') {
        if (tx.walletId === wallet.id) balance -= amt;
        if (tx.targetWalletId === wallet.id) balance += amt;
      }
    }
  }
  return balance;
}

function mergeRecords(localList, serverList) {
  const map = new Map(localList.map(item => [item.id, item]));

  for (const s of serverList) {
    const existing = map.get(s.id);
    if (!existing || (s.updated_at || 0) >= (existing.updated_at || 0)) {
      if (s.deleted_at) {
        map.delete(s.id);
      } else {
        map.set(s.id, s);
      }
    }
  }

  return Array.from(map.values());
}

// --- RUN TESTS ---
console.log('Running test suite for CatatUang storage & custom period logic...');

// Test 1: Mandatory Google Auth & User Isolation Prefix
assert.throws(() => getUserStoragePrefix(null), /Mandatory Google Auth required/);
assert.throws(() => getUserStoragePrefix({}), /Mandatory Google Auth required/);
assert.equal(getUserStoragePrefix({ email: 'Budi.Santoso@gmail.com' }), 'catatuang_u_budi.santoso_gmail.com_');
assert.equal(getUserStoragePrefix({ email: 'alice@domain.org' }), 'catatuang_u_alice_domain.org_');
assert.equal(getUserStoragePrefix({ email: 'dev@localhost' }), 'catatuang_u_dev_localhost_');
assert.notEqual(
  getUserStoragePrefix({ email: 'user1@gmail.com' }),
  getUserStoragePrefix({ email: 'user2@gmail.com' }),
  'Different Google accounts must have separate storage keys'
);

// Test 2: Custom Date Range Checking (inclusive boundaries)
const tx1 = { id: '1', date: '2026-10-01T10:00:00', amount: 100000, type: 'income', walletId: 'w1' };
const tx2 = { id: '2', date: '2026-10-15T15:30:00', amount: 50000, type: 'expense', walletId: 'w1' };
const tx3 = { id: '3', date: '2026-10-31T23:59:00', amount: 20000, type: 'expense', walletId: 'w1' };
const tx4 = { id: '4', date: '2026-11-01T08:00:00', amount: 30000, type: 'expense', walletId: 'w1' };

const txList = [tx1, tx2, tx3, tx4];

// Range: 2026-10-10 to 2026-10-31
assert.equal(isDateInPeriod(tx1.date, '2026-10-10', '2026-10-31'), false, 'tx1 before start date');
assert.equal(isDateInPeriod(tx2.date, '2026-10-10', '2026-10-31'), true, 'tx2 inside range');
assert.equal(isDateInPeriod(tx3.date, '2026-10-10', '2026-10-31'), true, 'tx3 on end boundary');
assert.equal(isDateInPeriod(tx4.date, '2026-10-10', '2026-10-31'), false, 'tx4 after end date');

// Test 3: Custom Period Summary
const summary = computePeriodSummary(txList, '2026-10-10', '2026-10-31');
assert.equal(summary.income, 0);
assert.equal(summary.expense, 70000); // tx2 (50000) + tx3 (20000)
assert.equal(summary.net, -70000);

// Test 4: Full October Summary
const octSummary = computePeriodSummary(txList, '2026-10-01', '2026-10-31');
assert.equal(octSummary.income, 100000);
assert.equal(octSummary.expense, 70000);
assert.equal(octSummary.net, 30000);

// Test 5: Wallet balance within custom range
const wallet = { id: 'w1', name: 'Cash', initialBalance: 500000 };
const walletBal = computeWalletBalance(wallet, txList, '2026-10-10', '2026-10-31');
// Initial 500000 - tx2(50000) - tx3(20000) = 430000
assert.equal(walletBal, 430000);

// Test 6: Offline-first conflict resolution & soft delete
const localTxs = [
  { id: 't1', amount: 50000, updated_at: 1000 },
  { id: 't2', amount: 20000, updated_at: 1000 }
];
const serverTxs = [
  { id: 't1', amount: 55000, updated_at: 1050 }, // newer on server
  { id: 't2', amount: 20000, updated_at: 1050, deleted_at: 1050 }, // deleted on server
  { id: 't3', amount: 15000, updated_at: 1020 } // created on other device
];
const merged = mergeRecords(localTxs, serverTxs);
assert.equal(merged.length, 2, 't2 deleted, t1 and t3 retained');
assert.equal(merged.find(x => x.id === 't1').amount, 55000, 't1 updated to latest server amount');
assert.equal(merged.find(x => x.id === 't2'), undefined, 't2 must be removed');
assert.equal(merged.find(x => x.id === 't3').amount, 15000, 't3 added from server');

console.log('✓ All 6 core logic test assertions passed successfully.');
