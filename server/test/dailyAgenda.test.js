import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyAgenda,agendaFlags} from '../../src/dailyAgendaRules.mjs';
const rows=[{code:'PD2',date:'2026-11-04',slot:'13:30',branch:'A',status:'Đã xác nhận',paymentStatus:'Chưa thanh toán'},{code:'PD1',date:'2026-11-04',slot:'08:30',branch:'A',status:'Đang chờ xác nhận',paymentStatus:'Chưa thanh toán'},{code:'PD3',date:'2026-11-04',slot:'10:00',branch:'B',status:'Đã hủy'},{code:'PD4',date:'2026-11-05',slot:'08:30',branch:'A',status:'Hoàn tất'}];
test('daily agenda filters date and excludes cancelled',()=>assert.deepEqual(dailyAgenda(rows,'2026-11-04').map(x=>x.code),['PD1','PD2']));
test('daily agenda filters branch',()=>assert.deepEqual(dailyAgenda(rows,'2026-11-04','B'),[]));
test('daily agenda rejects invalid day input',()=>assert.deepEqual(dailyAgenda(rows,'oops'),[]));
test('pending booking needs confirmation',()=>{const f=agendaFlags(rows[1]);assert.equal(f.needsConfirmation,true);assert.equal('needsStaff' in f,false)});
test('confirmed booking has no staff assignment blocker',()=>assert.equal('needsStaff' in agendaFlags(rows[0]),false));
test('canceled booking never prompts payment',()=>assert.equal(agendaFlags(rows[2]).needsPayment,false));
test('completed booking with paid status does not prompt payment',()=>assert.equal(agendaFlags({...rows[3],paymentStatus:'Đã thanh toán'}).needsPayment,false));

test('completed and no-show appointments are absent from daily work queue',()=>assert.deepEqual(dailyAgenda([...rows,{...rows[0],code:'DONE',status:'Hoàn tất'},{...rows[0],code:'NOSHOW',status:'Không đến'}],'2026-11-04').map(x=>x.code),['PD1','PD2']));

test('completed and no-show appointments are absent from daily work queue',()=>assert.deepEqual(dailyAgenda([...rows,{...rows[0],code:'DONE',status:'Hoàn tất'},{...rows[0],code:'NOSHOW',status:'Không đến'}],'2026-11-04').map(x=>x.code),['PD1','PD2']));
