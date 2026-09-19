// Isolated Postgres/WASM check. Never connects to Supabase or a network database.
// npm install --prefix /tmp/opptracker-sql-check @electric-sql/pglite
// PGLITE_MODULE=/tmp/opptracker-sql-check/node_modules/@electric-sql/pglite/dist/index.js node tests/migration_check.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_MODULE).href)
const db = new PGlite()
const owner = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'
const opportunity = '33333333-3333-4333-8333-333333333333'
const foreignOpportunity = '44444444-4444-4444-8444-444444444444'
try {
  await db.exec(`CREATE ROLE authenticated; CREATE ROLE anon; CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email text);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth, public TO authenticated, anon;
    GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon;`)
  await db.exec(await readFile('supabase/schema.sql', 'utf8'))
  await db.exec(`INSERT INTO auth.users VALUES ('${owner}','one@example.com'), ('${other}','two@example.com');
    INSERT INTO public.opportunities(id,user_id,title,notes) VALUES ('${opportunity}','${owner}','Keep this opportunity','Keep these notes'), ('${foreignOpportunity}','${other}','Private opportunity','Private');
    GRANT SELECT ON public.opportunities TO authenticated;`)
  const before = await db.query(
    'SELECT * FROM public.opportunities ORDER BY id'
  )
  const migration = await readFile(
    'supabase/migrations/002_preparation_and_chat.sql',
    'utf8'
  )
  await db.exec(migration)
  assert.deepEqual(
    await db.query('SELECT * FROM public.opportunities ORDER BY id'),
    before
  )
  await db.exec(
    `SET ROLE authenticated; SET request.jwt.claim.sub = '${owner}';`
  )
  const {
    rows: [conversation]
  } = await db.query(
    `INSERT INTO public.ai_conversations(user_id,title,messages) VALUES ($1,'Test history',$2) RETURNING *`,
    [
      owner,
      JSON.stringify([
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: 'Hello',
          timestamp: new Date().toISOString()
        }
      ])
    ]
  )
  const {
    rows: [plan]
  } = await db.query(
    `INSERT INTO public.preparation_plans(user_id,title,kind,opportunity_id,target_date) VALUES ($1,'Certificate plan','certificate',$2,'2027-02-01') RETURNING *`,
    [owner, opportunity]
  )
  for (const table of ['ai_conversations', 'preparation_plans']) {
    await assert.rejects(
      db.query(`UPDATE public.${table} SET user_id=$1`, [other]),
      /row-level security/
    )
    await db.exec(`SET request.jwt.claim.sub = '${other}'`)
    assert.equal(
      (await db.query(`SELECT * FROM public.${table}`)).rows.length,
      0
    )
    assert.equal(
      (await db.query(`UPDATE public.${table} SET title='stolen' RETURNING *`))
        .rows.length,
      0
    )
    await db.exec(`SET request.jwt.claim.sub = '${owner}'`)
    await assert.rejects(
      db.query(`DELETE FROM public.${table} RETURNING *`),
      /permission denied/
    )
  }
  await assert.rejects(
    db.query(
      `INSERT INTO public.ai_conversations(user_id,title) VALUES ($1,'Impersonation')`,
      [other]
    ),
    /row-level security/
  )
  await assert.rejects(
    db.query(
      `INSERT INTO public.preparation_plans(user_id,title,kind,opportunity_id) VALUES ($1,'Forbidden link','interview',$2)`,
      [owner, foreignOpportunity]
    ),
    /row-level security/
  )
  await assert.rejects(
    db.query(`UPDATE public.preparation_plans SET opportunity_id=$1`, [
      foreignOpportunity
    ]),
    /row-level security/
  )
  await assert.rejects(
    db.query(`UPDATE public.ai_conversations SET messages='[{}]'::jsonb`),
    /check constraint/
  )
  await assert.rejects(
    db.query(
      `UPDATE public.preparation_plans SET tasks='[{"id":"1","title":"Study","done":"false"}]'::jsonb`
    ),
    /check constraint/
  )
  await assert.rejects(
    db.query(`UPDATE public.preparation_plans SET kind='invalid'`),
    /check constraint/
  )
  await assert.rejects(
    db.query(`UPDATE public.preparation_plans SET target_date='2027-02-30'`),
    /date\/time field value out of range/
  )
  for (const [table, row] of [
    ['ai_conversations', conversation],
    ['preparation_plans', plan]
  ]) {
    // Driver dates lose microseconds: query the exact timestamp string as the API does.
    const {
      rows: [version]
    } = await db.query(
      `SELECT updated_at::text AS stamp FROM public.${table} WHERE id=$1`,
      [row.id]
    )
    assert.equal(
      (
        await db.query(
          `UPDATE public.${table} SET title='First edit' WHERE id=$1 AND updated_at=$2 RETURNING *`,
          [row.id, version.stamp]
        )
      ).rows.length,
      1
    )
    assert.equal(
      (
        await db.query(
          `UPDATE public.${table} SET title='Stale edit' WHERE id=$1 AND updated_at=$2 RETURNING *`,
          [row.id, version.stamp]
        )
      ).rows.length,
      0
    )
  }
  await db.exec('RESET ROLE; SET ROLE anon;')
  await assert.rejects(
    db.query('SELECT * FROM public.ai_conversations'),
    /permission denied/
  )
  await assert.rejects(
    db.query('SELECT * FROM public.preparation_plans'),
    /permission denied/
  )
  await db.exec('RESET ROLE;')
  await assert.rejects(db.exec(migration), /already exists/)
  await db.exec('ROLLBACK;')
  assert.deepEqual(
    await db.query('SELECT * FROM public.opportunities ORDER BY id'),
    before
  )
  console.log(
    'PASS: additive migration, preserved opportunities, owner RLS, private links, validation, no deletes, stale-write protection, repeat-run rollback.'
  )
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await db.close()
}
