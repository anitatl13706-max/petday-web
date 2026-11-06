import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
test('staff care permission is scoped by login-linked staff profile',()=>{
 assert.match(source,/WHERE m\.active=true AND b\.code=\$1 AND m\.user_id=\$2/);
});
test('staff appointment list is scoped to logged-in staff',()=>{
 assert.match(source,/am\.active=true AND am\.user_id=\$1/);
});
test('staff milestone rechecks identity under booking lock',()=>{
 assert.match(source,/WHERE a\.booking_id=\$1 AND m\.active=true AND m\.user_id=\$2/);
});
