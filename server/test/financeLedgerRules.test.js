import test from 'node:test';
import assert from 'node:assert/strict';
import {canCollect,filterLedger,ledgerSummary} from '../../src/financeLedgerRules.mjs';
const rows=[
 {code:'A',date:'2026-11-05',slot:'10:00',status:'Đã hủy',paymentStatus:'Chưa thanh toán',total:100,petName:'Milo'},
 {code:'B',date:'2026-11-06',slot:'08:30',status:'Hoàn tất',paymentStatus:'Đã thanh toán',total:200,petName:'Luna'},
 {code:'C',date:'2026-11-07',slot:'08:30',status:'Đã xác nhận',paymentStatus:'Chưa thanh toán',total:300,petName:'Tí'},
 {code:'D',date:'2026-11-04',slot:'08:30',status:'Đã hủy',paymentStatus:'Đã thanh toán',total:500,petName:'Mèo'}
];
test('Không xác nhận thu lịch đã hủy',()=>assert.equal(canCollect(rows[0]),false));
test('Không xác nhận thu trùng lịch đã thu',()=>assert.equal(canCollect(rows[1]),false));
test('Chỉ lịch đang hoạt động chưa thu nằm trong danh sách chờ',()=>assert.deepEqual(filterLedger(rows,{filter:'unpaid'}).map(x=>x.code),['C']));
test('Lịch đã hủy nhưng đã thu vẫn trong lịch sử đã thu',()=>assert.deepEqual(filterLedger(rows,{filter:'paid'}).map(x=>x.code),['B','D']));
test('Tổng cần kiểm tra không cộng lịch đã hủy',()=>assert.deepEqual(ledgerSummary(rows),{count:1,amount:300}));
test('Tìm kiếm có dấu tiếng Việt',()=>assert.deepEqual(filterLedger(rows,{filter:'all',query:'Tí'}).map(x=>x.code),['C']));
test('Không thay đổi thứ tự của đầu vào',()=>{const before=rows.map(x=>x.code).join(',');filterLedger(rows,{filter:'all'});assert.equal(rows.map(x=>x.code).join(','),before);});
