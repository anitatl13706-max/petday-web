import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CARE_IMAGE_MAX_BYTES,inspectCareImage,safeOriginalImageName} from '../src/careImageValidation.mjs';

const server=readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
const migration=readFileSync(new URL('../../database/065_v6130_care_event_images.sql',import.meta.url),'utf8');
const frontend=readFileSync(new URL('../../src/CareEventImages.tsx',import.meta.url),'utf8');
const portal=readFileSync(new URL('../../src/Portal.tsx',import.meta.url),'utf8');
const staff=readFileSync(new URL('../../src/StaffWorkspace.tsx',import.meta.url),'utf8');

test('care image inspection trusts magic bytes, not extension or claimed MIME alone',()=>{
 const jpg=Buffer.from([255,216,255,224,0,16]);
 const png=Buffer.from([137,80,78,71,13,10,26,10,0]);
 const webp=Buffer.from('RIFF0000WEBP0','ascii');
 assert.equal(inspectCareImage(jpg,'image/jpeg').extension,'jpg');
 assert.equal(inspectCareImage(png,'image/png').extension,'png');
 assert.equal(inspectCareImage(webp,'image/webp').extension,'webp');
 assert.match(inspectCareImage(jpg,'image/png').error,/không khớp/);
 assert.match(inspectCareImage(Buffer.from('not-an-image'),'image/jpeg').error,/không phải ảnh/);
 assert.match(inspectCareImage(Buffer.alloc(CARE_IMAGE_MAX_BYTES+1),'image/png').error,/5 MB/);
 assert.equal(safeOriginalImageName(encodeURIComponent('../../pet\u0000.jpg')),'pet.jpg');
});

test('new care photos are private, assignment-scoped, and limited to five per event',()=>{
 assert.match(server,/app\.get\('\/api\/care-event-images\/:id',auth/);
 assert.match(server,/app\.get\('\/api\/bookings\/:code\/care-events\/:eventId\/images',auth/);
 assert.match(server,/mayReadCareImages\(req\.user,image\.booking_id,image\.customer_id\)/);
 assert.match(server,/app\.post\('\/api\/bookings\/:code\/care-events\/:eventId\/images',auth,careOperator,express\.raw/);
 assert.match(server,/count\.rows\[0\]\.total>=CARE_IMAGE_MAX_PER_EVENT/);
 assert.match(server,/private_uploads\/care-events/);
 assert.doesNotMatch(server,/app\.use\('\/private_uploads'/);
 assert.match(server,/FROM care_event_images ci WHERE ci\.service_event_id=e\.id/);
});

test('migration links image metadata to both booking and immutable care event',()=>{
 assert.match(migration,/CREATE TABLE IF NOT EXISTS public\.care_event_images/);
 assert.match(migration,/FOREIGN KEY\(service_event_id,booking_id\)/);
 assert.match(migration,/REFERENCES public\.service_events\(id,booking_id\) ON DELETE RESTRICT/);
 assert.match(migration,/byte_size INTEGER NOT NULL CHECK \(byte_size BETWEEN 1 AND 5242880\)/);
});

test('shared React UI provides optional previews, removal, protected viewing and lightbox navigation',()=>{
 assert.match(frontend,/Không bắt buộc/);
 assert.match(frontend,/multiple/);
 assert.match(frontend,/URL\.createObjectURL/);
 assert.match(frontend,/URL\.revokeObjectURL/);
 assert.match(frontend,/api\/care-event-images/);
 assert.match(frontend,/role="dialog"/);
 assert.match(frontend,/ArrowLeft/);
 assert.match(frontend,/ArrowRight/);
});

test('failed care image upload keeps remaining files and retries the original event',()=>{
 assert.match(frontend,/class CareImageUploadError/);
 assert.match(frontend,/files\.slice\(index\)/);
 assert.match(frontend,/Backend đang chạy bản cũ và chưa có API tải ảnh/);
 for(const source of [portal,staff]){
  assert.match(source,/instanceof CareImageUploadError/);
  assert.match(source,/Thử tải lại ảnh/);
  assert.match(source,/eventId/);
 }
 assert.match(staff,/uploadCareEventImages\(item\.code,imageRetry\.eventId,images,token\)/);
});
