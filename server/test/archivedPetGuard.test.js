import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
// Guard contract: all booking-related pet lookups must exclude archived rows.
test('booking transaction excludes archived pets',()=>assert.match(source,/FROM pets WHERE id=\$1 AND owner_id=\$2 AND archived_at IS NULL'\,\[b.petId,req.user.id\]/));
test('quote and promo lookup exclude archived pets',()=>{
 const hits=source.match(/FROM pets WHERE id=\$1 AND owner_id=\$2 AND archived_at IS NULL'\,\[d.petId,req.user.id\]/g)||[];
 assert.ok(hits.length>=2,`Expected quote and promotion guard, found ${hits.length}`);
});
test('profile edit excludes archived pets',()=>assert.match(source,/photo_url=\$8,coat=\$11 WHERE id=\$9 AND owner_id=\$10 AND archived_at IS NULL RETURNING/));
