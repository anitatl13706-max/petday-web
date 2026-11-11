import test from 'node:test';
import assert from 'node:assert/strict';
import {taxiLegTransitionIssue} from '../src/taxiIncidentRules.mjs';
test('luồng rút gọn 4 trạng thái',()=>{
 assert.equal(taxiLegTransitionIssue({state:'requested',leg:'pickup'},'confirm'),null);
 assert.equal(taxiLegTransitionIssue({state:'confirmed',leg:'pickup'},'depart'),null);
 assert.equal(taxiLegTransitionIssue({state:'en_route',leg:'pickup'},'complete'),null);
 assert.ok(taxiLegTransitionIssue({state:'confirmed',leg:'pickup'},'complete'));
});
test('khách vắng mặt chỉ với chiều đón và trong chuyến',()=>{
 assert.equal(taxiLegTransitionIssue({state:'en_route',leg:'pickup'},'no_show'),null);
 assert.match(taxiLegTransitionIssue({state:'en_route',leg:'return'},'no_show'),/chiều đón/);
 assert.ok(taxiLegTransitionIssue({state:'completed',leg:'pickup'},'no_show'));
});
test('chỉ được hủy trước xuất phát và không cần ghi liên hệ/chờ giờ',()=>{
 assert.equal(taxiLegTransitionIssue({state:'confirmed',leg:'return'},'cancel'),null);
 assert.ok(taxiLegTransitionIssue({state:'en_route',leg:'return'},'cancel'));
 assert.ok(taxiLegTransitionIssue({state:'en_route',leg:'pickup'},'contact'));
 assert.ok(taxiLegTransitionIssue({state:'en_route',leg:'pickup'},'arrive'));
});
