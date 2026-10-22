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
          pulled: { wallets: [], transactions: [] },
          message: 'D1 not bound in current runtime; mutations retained locally'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    // 3. Query records updated since client's lastSyncTime
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

    return new Response(
      JSON.stringify({
        status: 'ok',
        connected: true,
        serverTime,
        pulled: {
          wallets: walletsRes.results || [],
          transactions: txRes.results || []
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
