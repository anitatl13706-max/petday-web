import test from 'node:test';
import assert from 'node:assert/strict';
import {services,calculate,calculateExtras,validSlot,buildDailySlotPreview} from '../src/rules.js';
test('10 bookable packages with valid prices and categories',()=>{assert.equal(Object.keys(services).length,10);for(const [name,s] of Object.entries(services)){assert.ok(s.base>0,name);assert.ok(s.units>0,name);assert.ok(s.species.length>0,name)}});
test('basic package with weight-adjusted price',()=>assert.equal(calculate('Grooming cơ bản',{species:'Chó',weight:7,age:2}).total,190000));
test('cat may book styling and daycare when eligible',()=>{assert.ok(calculate('Grooming tạo kiểu',{species:'Mèo',weight:4,age:2}).total>0);for(const x of ['Daycare nửa ngày','Daycare cả ngày'])assert.ok(calculate(x,{species:'Mèo',weight:4,age:2}).total>0);});
test('half day daycare only morning without weight supplement',()=>{assert.equal(calculate('Daycare nửa ngày',{species:'Chó',weight:25,age:2}).total,190000);assert.equal(validSlot('Daycare nửa ngày','13:30'),false)});
test('full day daycare still costs two units',()=>assert.equal(services['Daycare cả ngày'].units,2));
test('spa late slots blocked for all spa variants',()=>{for(const x of ['Spa dịu nhẹ','Spa thư giãn','Spa dưỡng lông','Spa phục hồi lông'])assert.equal(validSlot(x,'17:30'),false)});
test('add-ons validated for new packages',()=>{assert.equal(calculateExtras('Daycare nửa ngày',['daycare_meal']).total,55000);assert.throws(()=>calculateExtras('Grooming cơ bản',['daycare_meal']))});
test('preview reserves two capacity units for styling',()=>{const x=buildDailySlotPreview({service:'Grooming tạo kiểu',branch:'PetDay Thảo Điền',used:{'08:30':2}}).find(x=>x.slot==='08:30');assert.equal(x.available,false)});

test('all services offer at least three add-ons and max three extras per booking', async()=>{
 const {addOns,calculateExtras}=await import('../src/rules.js');
 for(const name of Object.keys(services)){
  const eligible=Object.entries(addOns).filter(([,x])=>x.services.includes(name));
  assert.ok(eligible.length>=3,`${name} only has ${eligible.length} add-ons`);
  const ids=eligible.slice(0,3).map(([id])=>id);
  assert.ok(calculateExtras(name,ids).total>0);
  assert.throws(()=>calculateExtras(name,[...ids,eligible[3]?.[0]||ids[0]]));
 }
});
