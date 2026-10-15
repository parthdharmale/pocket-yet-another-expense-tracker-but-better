import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDemoLedger} from '../lib/pocket/demo-data.ts';
import {changeDemoLedger} from '../lib/pocket/demo.ts';
import {schemas} from '../lib/pocket/validation.ts';
import {rewards} from '../lib/pocket/engine.ts';

test('demo contains only independent fictional examples and follows the visitor date',()=>{
 const now=new Date('2026-12-31T20:00:00Z'),a=createDemoLedger(now),b=createDemoLedger(now);
 assert.equal(a.entries[0].date,'2027-01-01');
 for(const collection of ['cards','platforms','entries','wishes'] as const)for(const value of a[collection])assert.ok(schemas[collection].safeParse(value).success,`${collection}: ${value.id}`);
 assert.ok(schemas.settings.safeParse(a.settings).success);
 a.entries[0].title='Visitor edit';a.cards[0].rules[0].rate=99;
 assert.notEqual(b.entries[0].title,a.entries[0].title);assert.notEqual(b.cards[0].rules[0].rate,99);
 assert.ok(b.entries.every(e=>e.id.startsWith('demo-')));
});
test('manual demo entry recalculates cashback, honors the Swiggy threshold, and never mutates original data',()=>{
 const data=createDemoLedger(new Date('2026-10-10T12:00:00Z')),original=JSON.stringify(data),entry={...data.entries[0],id:'new',amount:25000,share:25000};
 const small=changeDemoLedger(data,'entries',entry);
 assert.equal(rewards(small).result.new,0);
 const larger=changeDemoLedger(data,'entries',{...entry,amount:65000,share:65000});
 assert.equal(rewards(larger).result.new,6500);assert.equal(JSON.stringify(data),original);
 assert.equal(data.entries.length+1,larger.entries.length);
});
test('demo rejects invalid shares, missing platforms and disallowed friend card amounts',()=>{
 const data=createDemoLedger(),entry={...data.entries[0],id:'new'};
 assert.throws(()=>changeDemoLedger(data,'entries',{...entry,share:entry.amount+1}));
 assert.throws(()=>changeDemoLedger(data,'entries',{...entry,platformId:'missing'}));
 data.cards[0].owner='friend';
 assert.throws(()=>changeDemoLedger(data,'entries',entry),/unavailable/);
});
test('demo wishlist decisions are linked once and reset recreates the untouched samples',()=>{
 const now=new Date('2026-10-10T12:00:00Z'),data=createDemoLedger(now),wish=data.wishes[0];
 const result=changeDemoLedger(data,'entries',{...data.entries[1],id:'wish-entry',platformId:wish.platformId},wish.id);
 assert.equal(result.wishes[0].status,'resisted');assert.equal(result.wishes[0].entryId,'wish-entry');
 assert.throws(()=>changeDemoLedger(result,'entries',{...result.entries[0],id:'again'},wish.id),/already/);
 assert.deepEqual(createDemoLedger(now),data);
});
test('resisted entries need no platform and earn no rewards or spending',()=>{
 const data=createDemoLedger(),entry={...data.entries[0],id:'no-platform',kind:'resisted' as const,platformId:'none',paymentId:'none'};
 const next=changeDemoLedger(data,'entries',entry),saved=next.entries.find(e=>e.id===entry.id)!;
 assert.equal(saved.platformId,'none');assert.equal(saved.paymentId,'none');assert.equal(saved.category,'Other');assert.equal(saved.reward,null);assert.equal(rewards(next).result[entry.id]??0,0);
});
