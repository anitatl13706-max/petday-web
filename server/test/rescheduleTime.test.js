import test from 'node:test';
import assert from 'node:assert/strict';
import { sameAppointmentTime } from '../src/rescheduleTime.mjs';

test('same day and same hour is not a reschedule', () => {
  assert.equal(sameAppointmentTime('2026-12-04', '08:30', '2026-12-04', '08:30'), true);
  assert.equal(sameAppointmentTime('2026-12-04', '08:30:00', '2026-12-04', '08:30'), true);
});
test('changing only date or only slot counts as a reschedule', () => {
  assert.equal(sameAppointmentTime('2026-12-04', '08:30', '2026-12-05', '08:30'), false);
  assert.equal(sameAppointmentTime('2026-12-04', '08:30', '2026-12-04', '10:00'), false);
});
test('do not shift calendar date to UTC', () => {
  assert.equal(sameAppointmentTime('2026-12-04', '08:30', '2026-12-05', '08:30'), false);
});
