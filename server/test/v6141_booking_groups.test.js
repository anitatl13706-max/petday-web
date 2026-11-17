import test from 'node:test';
import assert from 'node:assert/strict';
import {bookingGroup,matchesBookingGroup,matchesBookingPeriod} from '../../src/bookingFilterRules.mjs';
import {autoCloseDecision,bookingFinishDate} from '../src/autoClosePolicy.mjs';
const cash={status:'Đã xác nhận',paymentStatus:'Chưa thanh toán',paymentMethod:'cash',date:'2026-11-17'};
test('prepayment and post-care outstanding share payment group; active cash is not overdue debt',()=>{
 for(const b of [{...cash,status:'Đang chờ xác nhận'},{...cash,status:'Hoàn tất'},{...cash,status:'Đang thực hiện',careCompleted:true}]){assert.equal(bookingGroup(b),'pending');assert.ok(matchesBookingGroup(b,'processing'));assert.ok(!matchesBookingGroup(b,'done'));}
 assert.equal(bookingGroup(cash),'confirmed');assert.equal(bookingGroup({...cash,status:'Đang thực hiện'}),'active');
});
test('settled care exits payment group; closures take precedence over payment',()=>{
 assert.equal(bookingGroup({...cash,status:'Hoàn tất',paymentStatus:'Đã thanh toán'}),'done');
 assert.equal(bookingGroup({...cash,status:'Không hoàn thành'}),'incomplete');assert.equal(bookingGroup({...cash,status:'Đã hủy',noShowReason:'Vắng mặt'}),'no-show');assert.equal(bookingGroup({...cash,status:'Đã hủy'}),'cancelled');
});
test('date filtering is orthogonal to status',()=>{assert.ok(matchesBookingPeriod(cash,'today','2026-11-17'));assert.ok(!matchesBookingPeriod(cash,'upcoming','2026-11-17'));assert.ok(matchesBookingPeriod(cash,'upcoming','2026-11-16'));assert.ok(matchesBookingGroup(cash,'confirmed'));});
test('no-show applies after appointment date, not to unpaid prepayment or terminal outcomes',()=>{const args={finishDate:'2026-11-16',today:'2026-11-17'};assert.equal(autoCloseDecision({...args,status:'Đã xác nhận'}),'no_show');for(const status of ['Đang chờ xác nhận','Không hoàn thành','Hoàn tất','Đã hủy'])assert.equal(autoCloseDecision({...args,status}),null);});
test('multiday care closes only after departure date',()=>{const finishDate=bookingFinishDate({category:'Daycare',service:'Daycare cả ngày',date:'2026-11-16',lineItems:[{type:'schedule',endDate:'2026-11-20'}]});assert.equal(autoCloseDecision({status:'Đang thực hiện',finishDate,today:'2026-11-17'}),null);assert.equal(autoCloseDecision({status:'Đang thực hiện',finishDate,today:'2026-11-21'}),'completed');});
