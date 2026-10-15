import test from 'node:test';
import assert from 'node:assert/strict';
import {moveCalendar} from '../lib/pocket/calendar.ts';

test('calendar cannot navigate into a future month, including year rollover',()=>{
 assert.equal(moveCalendar('2026-10-12','month',1,'2026-10-12'),null);
 assert.equal(moveCalendar('2026-12-31','month',1,'2026-12-31'),null);
 assert.deepEqual(moveCalendar('2026-09-30','month',1,'2026-10-12'),{date:'2026-10-01',selected:'2026-10-01'});
});
test('current week remains reachable without selecting its future anchor day',()=>{
 assert.deepEqual(moveCalendar('2026-10-11','week',1,'2026-10-12'),{date:'2026-10-18',selected:'2026-10-12'});
 assert.equal(moveCalendar('2026-10-18','week',1,'2026-10-12'),null);
 assert.equal(moveCalendar('2026-10-12','week',1,'2026-10-12'),null);
});
test('past dates remain selectable across month and week boundaries',()=>{
 assert.deepEqual(moveCalendar('2026-01-01','month',-1,'2026-01-01'),{date:'2025-12-01',selected:'2025-12-01'});
 assert.deepEqual(moveCalendar('2026-10-12','week',-1,'2026-10-12'),{date:'2026-10-05',selected:'2026-10-05'});
});
