import test from 'node:test'
import assert from 'node:assert/strict'
import handler from '../api/ai.ts'
import type { IncomingMessage, ServerResponse } from 'node:http'

test('AI endpoint enforces configuration, auth, owner, validation and hides provider errors', async () => {
  const originalFetch = globalThis.fetch
  const env = { ...process.env }
  const owner = '11111111-1111-4111-8111-111111111111'
  let user = owner,
    providerStatus = 200,
    calls = 0,
    lastPrompt = ''
  const response = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('/auth/v1/user'))
      return user === 'invalid'
        ? response({ message: 'Invalid token' }, 401)
        : response({
            id: user,
            aud: 'authenticated',
            role: 'authenticated',
            email: 'test@example.com'
          })
    assert.ok(
      String(url).startsWith('https://generativelanguage.googleapis.com/')
    )
    calls++
    lastPrompt = String(init?.body)
    return response(
      providerStatus === 200
        ? { candidates: [{ content: { parts: [{ text: 'Safe answer' }] } }] }
        : { error: { message: 'SECRET_DEBUG_VALUE' } },
      providerStatus
    )
  }
  const run = async (
    body: unknown = { prompt: 'Help me plan', json: false },
    token = 'valid-token',
    method = 'POST'
  ) => {
    let result = '',
      status = 0
    const headers: Record<string, string | number> = {}
    const req = {
      method,
      headers: { authorization: token ? `Bearer ${token}` : undefined },
      body
    } as IncomingMessage & { body?: unknown }
    const res = {
      setHeader: (key: string, value: string | number) => {
        headers[key] = value
      },
      set statusCode(value: number) {
        status = value
      },
      end: (value: string) => {
        result = value
      }
    } as unknown as ServerResponse
    await handler(req, res)
    return { status, body: JSON.parse(result), headers }
  }
  try {
    delete process.env.GEMINI_API_KEY
    assert.equal((await run()).status, 503)
    Object.assign(process.env, {
      GEMINI_API_KEY: 'SERVER_SECRET',
      GEMINI_MODEL: 'gemini-test-model',
      AI_ALLOWED_USER_ID: owner,
      SUPABASE_URL: 'https://test.invalid',
      SUPABASE_ANON_KEY: 'public-test-key'
    })
    assert.equal((await run({}, '', 'GET')).status, 405)
    assert.equal((await run({}, '')).status, 401)
    user = 'invalid'
    assert.equal((await run()).status, 401)
    user = 'another-user'
    assert.equal((await run()).status, 403)
    user = owner
    for (const body of [
      null,
      {},
      { prompt: '' },
      { prompt: 'x'.repeat(40001) },
      { prompt: 'valid', json: 'true' }
    ])
      assert.equal((await run(body)).status, 400)
    assert.equal(calls, 0)
    const good = await run({ prompt: 'Use the supplied details', json: true })
    assert.equal(good.status, 200)
    assert.equal(good.body.text, 'Safe answer')
    assert.ok(lastPrompt.includes('application/json'))
    assert.equal(good.headers['Cache-Control'], 'no-store')
    providerStatus = 500
    const bad = await run()
    assert.equal(bad.status, 502)
    assert.ok(!JSON.stringify(bad).includes('SECRET_DEBUG_VALUE'))
    providerStatus = 200
    for (let i = 0; i < 18; i++) await run()
    assert.equal((await run()).status, 429)
  } finally {
    globalThis.fetch = originalFetch
    for (const key of Object.keys(process.env))
      if (!(key in env)) delete process.env[key]
    Object.assign(process.env, env)
  }
})
