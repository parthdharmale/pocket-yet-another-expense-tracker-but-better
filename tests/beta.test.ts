import {seedCards} from './fixtures/reward-cards.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialDirectory,approveMember,changeMemberStatus} from '../lib/auth/members.ts';
import {initialLedger} from '../lib/pocket/initial.ts';
import {reserveUsage} from '../lib/ai/budget.ts';
import {shortcutEntryId} from '../lib/shortcut/token.ts';
import {chooseRule,rewards} from '../lib/pocket/engine.ts';
test('approved accounts remain distinct, cannot resurrect deleted members, and protect the owner',()=>{
 const d=initialDirectory('Owner@example.com'),a=approveMember(d,' A@example.com '),b=approveMember(d,'b@example.com');
 assert.equal(d.members[0].id,'personal');assert.equal(a.email,'a@example.com');assert.notEqual(a.id,b.id);
 assert.equal(approveMember(d,'a@example.com').id,a.id);changeMemberStatus(d,a.id,'suspended');assert.equal(a.status,'suspended');changeMemberStatus(d,a.id,'approved');assert.equal(a.status,'approved');
 assert.throws(()=>changeMemberStatus(d,'personal','suspended'));changeMemberStatus(d,a.id,'deleted');assert.throws(()=>approveMember(d,'a@example.com'));
});
test('new accounts get independent empty ledgers without the owner cards and overrides',()=>{
 const owner=initialLedger('personal'),a=initialLedger('a'),b=initialLedger('b');assert.equal(owner.cards.length,0);assert.equal(owner.settings.onboarded,false);assert.equal(a.cards.length,0);assert.equal(a.entries.length,0);assert.equal(a.settings.onboarded,false);
 a.platforms[0].name='Custom platform';a.settings.paymentModes.push('Custom mode');assert.notEqual(b.platforms[0].name,a.platforms[0].name);assert.equal(b.settings.paymentModes.includes('Custom mode'),false);
 assert.notEqual(shortcutEntryId('same-request','a'),shortcutEntryId('same-request','b'));assert.equal(shortcutEntryId('same-request','personal'),shortcutEntryId('same-request'));
});
test('AI reservation enforces both user and global ceilings and resets at UTC day boundary',()=>{
 const empty={date:'2026-10-09',total:0,users:{}};const a=reserveUsage(empty,'2026-10-09','a',1,2)!;assert.equal(reserveUsage(a,'2026-10-09','a',1,2),null);const b=reserveUsage(a,'2026-10-09','b',1,2)!;assert.equal(reserveUsage(b,'2026-10-09','c',10,2),null);const next=reserveUsage(b,'2026-10-10','a',1,2)!;assert.equal(next.total,1);assert.equal(empty.total,0);
});
test('other users own explicit card thresholds; the engine does not force the owner personal override',()=>{
 const data=initialLedger('member'),card=structuredClone(seedCards[0]);for(const rule of card.rules)rule.minSpendExclusive=0;data.cards=[card];const rule=chooseRule(card,data.platforms[0])!;assert.equal(rule.minSpendExclusive,0);
 data.entries=[{id:'a',date:'2026-10-09',title:'Tea',amount:10000,share:10000,platformId:'swiggy-food',paymentId:card.id,kind:'spend',category:'Food delivery',note:'',refunds:[],settled:false,credited:null,reward:rule,billingDay:null,createdAt:new Date().toISOString(),deleted:false}];assert.equal(rewards(data).result.a,1000);
});
