import test from 'node:test';
import assert from 'node:assert/strict';
import { missingServiceNames } from '../src/schemaRules.js';
import {services} from '../src/rules.js';
test('detects missing new packages in old CHECK definition',()=>{
 const legacy="CHECK (service = ANY (ARRAY['Grooming toàn diện'::text,'Spa dưỡng lông'::text,'Daycare cả ngày'::text]))";
 assert.ok(missingServiceNames(legacy,Object.keys(services)).includes('Spa phục hồi lông'));
 assert.ok(!missingServiceNames(legacy,Object.keys(services)).includes('Grooming toàn diện'));
});
test('all eight allowed packages have no missing names',()=>{
 const def='CHECK (service IN ('+Object.keys(services).map(s=>"'"+s+"'").join(',')+'))';
 assert.deepEqual(missingServiceNames(def,Object.keys(services)),[]);
});
test('no constraint is never reported as ready',()=>{
 assert.equal(missingServiceNames('',Object.keys(services)).length,8);
});
