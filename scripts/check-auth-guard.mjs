import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const code=readFileSync(new URL('../src/Portal.tsx',import.meta.url),'utf8');
// Shop sections are rendered outside the authenticated JSX branch.
// All role checks must be null-safe while /api/me is pending or session has expired.
for (const role of ['customer','admin','staff']) {
  assert.ok(code.includes(`view==='shop'&&user?.role==='${role}'`),`Missing null-safe shop guard for ${role}`);
  assert.ok(!code.includes(`view==='shop'&&user.role==='${role}'`),`Unsafe shop role guard for ${role}`);
}
console.log('PASS: all shop role checks are null-safe during anonymous and loading states');
