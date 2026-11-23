import assert from 'node:assert/strict';
import { app } from '../../src/app';

async function main(): Promise<void> {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const request = (path: string, init: RequestInit = {}) => fetch(`${base}${path}`, init);
  try {
    let response = await request('/api/dashboard');
    assert.equal(response.status, 401);
    assert.notEqual((await response.text()).includes('test-session-secret'), true);

    response = await request('/api/dashboard', { headers: { Origin: 'http://blocked.test' } });
    assert.equal(response.status, 403);
    response = await request('/api/auth/session', { headers: { Origin: 'http://allowed.test' } });
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://allowed.test');

    response = await request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://allowed.test' }, body: JSON.stringify({ password: 'test-password' }) });
    assert.equal(response.status, 200);
    const login = await response.json() as { csrfToken: string };
    const cookie = response.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie);
    response = await request('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': login.csrfToken }, body: JSON.stringify({ message: '' }) });
    assert.equal(response.status, 400);
    response = await request('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': login.csrfToken }, body: JSON.stringify({ message: '' }) });
    assert.equal(response.status, 400);
    response = await request('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': login.csrfToken }, body: JSON.stringify({ message: '' }) });
    assert.equal(response.status, 429);
    response = await request('/health/ready');
    assert.equal(response.status, 503);
    const readiness = await response.json() as { checks: { database: string; agentRouter: string; authentication: string } };
    assert.equal(readiness.checks.authentication, 'configured');
    assert.equal(readiness.checks.database, 'unavailable');
    assert.equal(readiness.checks.agentRouter, 'missing');
    assert.notEqual(JSON.stringify(readiness).includes('test-session-secret'), true);
    console.log('PASS security middleware, CORS, validation, rate limiting, and readiness checks');
  } finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
