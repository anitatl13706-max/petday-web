import test from 'node:test';
import assert from 'node:assert/strict';
import {servicesOverlap} from '../src/rules.js';
test('same time across different packages overlaps',()=>assert.equal(servicesOverlap('Grooming cơ bản','10:00','Spa dưỡng lông','10:00'),true));
test('overlapping service at adjacent slot is rejected',()=>assert.equal(servicesOverlap('Grooming toàn diện','08:30','Grooming cơ bản','10:00'),false));
test('long daycare blocks afternoon on the same day',()=>assert.equal(servicesOverlap('Daycare cả ngày','08:30','Spa dưỡng lông','13:30'),true));
test('different time after first service is allowed',()=>assert.equal(servicesOverlap('Grooming cơ bản','08:30','Spa dưỡng lông','10:00'),false));
test('unknown historic service conservatively conflicts',()=>assert.equal(servicesOverlap('old name','08:30','Grooming cơ bản','10:00'),true));
