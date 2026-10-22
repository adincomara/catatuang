export const prerender = false;

/**
 * Cloudflare D1 Synchronization Endpoint
 * Handles background push/pull of wallets and transactions per Google user.
 */
export async function POST({ request, locals }) {
  try {
    const body = await request.json();
    const { email, lastSyncTime = 0, mutations } = body;

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Valid user email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const serverTime = Date.now();

    // Access Cloudflare D1 binding
    const db = locals.runtime?.env?.DB;

    // Fallback if D1 is not bound (e.g. standard local dev preview)
    // ponytail: Mock fallback acknowledging mutations, real D1 active in Cloudflare Pages
    if (!db) {
      return new Response(
        JSON.stringify({
          status: 'ok',
          connected: false,
          serverTime,
          pulled: { wallets: [], transactions: [], batches: [] },
          message: 'D1 not bound in current runtime; mutations retained locally'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Auto-ensure batches table exists in D1
    await db.prepare(
      `CREATE TABLE IF NOT EXISTS batches (
        id TEXT PRIMARY KEY,
        user_email TEXT NOT NULL,
        name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        snapshot TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER
      )`
    ).run();

    // 1. Process incoming wallet mutations
    if (mutations && Array.isArray(mutations.wallets) && mutations.wallets.length > 0) {
      for (const w of mutations.wallets) {
        await db
          .prepare(
            `INSERT INTO wallets (id, user_email, name, type, initial_balance, icon, updated_at, deleted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               name = excluded.name,
               type = excluded.type,
               initial_balance = excluded.initial_balance,
               icon = excluded.icon,
               updated_at = excluded.updated_at,
               deleted_at = excluded.deleted_at
             WHERE excluded.updated_at >= wallets.updated_at`
          )
          .bind(
            w.id,
            cleanEmail,
            w.name || 'Dompet',
            w.type || 'bank',
            Number(w.initialBalance ?? w.initial_balance) || 0,
            w.icon || '👛',
            w.updated_at || serverTime,
            w.deleted_at || null
          )
          .run();
      }
    }

    // 2. Process incoming transaction mutations
    if (mutations && Array.isArray(mutations.transactions) && mutations.transactions.length > 0) {
      for (const t of mutations.transactions) {
        await db
          .prepare(
            `INSERT INTO transactions (id, user_email, wallet_id, target_wallet_id, type, amount, category, note, date, updated_at, deleted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               wallet_id = excluded.wallet_id,
               target_wallet_id = excluded.target_wallet_id,
               type = excluded.type,
               amount = excluded.amount,
               category = excluded.category,
               note = excluded.note,
               date = excluded.date,
               updated_at = excluded.updated_at,
               deleted_at = excluded.deleted_at
             WHERE excluded.updated_at >= transactions.updated_at`
          )
          .bind(
            t.id,
            cleanEmail,
            t.walletId || t.wallet_id,
            t.targetWalletId || t.target_wallet_id || null,
            t.type || 'expense',
            Number(t.amount) || 0,
            t.category || null,
            t.note || '',
            t.date,
            t.updated_at || serverTime,
            t.deleted_at || null
          )
          .run();
      }
    }

    // 3. Process incoming batch mutations (Tutup Buku snapshots)
    if (mutations && Array.isArray(mutations.batches) && mutations.batches.length > 0) {
      for (const b of mutations.batches) {
        await db
          .prepare(
            `INSERT INTO batches (id, user_email, name, start_date, end_date, snapshot, created_at, updated_at, deleted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               name = excluded.name,
               start_date = excluded.start_date,
               end_date = excluded.end_date,
               snapshot = excluded.snapshot,
               updated_at = excluded.updated_at,
               deleted_at = excluded.deleted_at
             WHERE excluded.updated_at >= batches.updated_at`
          )
          .bind(
            b.id,
            cleanEmail,
            b.name || 'Batch',
            b.startDate || b.start_date || '',
            b.endDate || b.end_date || '',
            typeof b.snapshot === 'string' ? b.snapshot : JSON.stringify(b.snapshot || {}),
            b.createdAt || b.created_at || serverTime,
            b.updated_at || b.updatedAt || serverTime,
            b.deleted_at || b.deletedAt || null
          )
          .run();
      }
    }

    // 4. Query records updated since client's lastSyncTime
    const sinceTime = Number(lastSyncTime) || 0;

    const walletsRes = await db
      .prepare(
        `SELECT id, name, type, initial_balance as initialBalance, icon, updated_at, deleted_at
         FROM wallets
         WHERE user_email = ? AND updated_at > ?`
      )
      .bind(cleanEmail, sinceTime)
      .all();

    const txRes = await db
      .prepare(
        `SELECT id, wallet_id as walletId, target_wallet_id as targetWalletId, type, amount, category, note, date, updated_at, deleted_at
         FROM transactions
         WHERE user_email = ? AND updated_at > ?`
      )
      .bind(cleanEmail, sinceTime)
      .all();

    const batchesRes = await db
      .prepare(
        `SELECT id, name, start_date as startDate, end_date as endDate, snapshot, created_at as createdAt, updated_at, deleted_at
         FROM batches
         WHERE user_email = ? AND updated_at > ?`
      )
      .bind(cleanEmail, sinceTime)
      .all();

    return new Response(
      JSON.stringify({
        status: 'ok',
        connected: true,
        serverTime,
        pulled: {
          wallets: walletsRes.results || [],
          transactions: txRes.results || [],
          batches: (batchesRes.results || []).map(b => ({
            ...b,
            snapshot: typeof b.snapshot === 'string' ? JSON.parse(b.snapshot) : b.snapshot
          }))
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: 'ready', endpoint: '/api/sync' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
