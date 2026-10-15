import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareDraft,entryFromDraft,extractionInstructions,type ExtractedEntry} from '../lib/ai/entry.ts';
import {seedPlatforms,initialSettings} from '../lib/pocket/seed.ts';
import {seedCards} from './fixtures/reward-cards.ts';
const data={version:0,cards:structuredClone(seedCards),platforms:seedPlatforms,settings:initialSettings,entries:[],wishes:[]};
const draft:ExtractedEntry={title:'Biryani',amount:450,date:'2026-10-08',platformId:'swiggy-food',paymentId:data.cards[0].id,kind:'spend',share:null,note:'',uncertain:false,questions:[]};
test('complete entry converts rupees to paise and keeps server reward calculation',()=>{const entry=entryFromDraft(draft,'test',data);assert.equal(entry.amount,45000);assert.equal(entry.share,45000);assert.equal(entry.reward,null)});
test('missing or unknown payment and platform cannot auto-save',()=>{for(const patch of [{paymentId:null},{paymentId:'invented'},{platformId:'invented'}])assert.equal(prepareDraft({...draft,...patch},data).complete,false)});
test('friend card requires strictly more than 3000 rupees',()=>{const paymentId=data.cards.find(c=>c.owner==='friend')!.id;assert.equal(prepareDraft({...draft,paymentId,amount:3000},data).complete,false);assert.equal(prepareDraft({...draft,paymentId,amount:3001},data).complete,true)});
test('uncertainty and invalid dates or splits require review',()=>{for(const patch of [{uncertain:true},{date:'2026-02-30'},{share:451},{questions:['Which card?']}])assert.equal(prepareDraft({...draft,...patch},data).complete,false)});
test('resisted purchases need no payment and use full amount as avoided spending',()=>{const entry=entryFromDraft({...draft,kind:'resisted',paymentId:null},'test',data);assert.equal(entry.paymentId,'none');assert.equal(entry.share,45000)});
test('AI context contains no ledger or card limits',()=>{const context=extractionInstructions(data,'2026-10-08','2026-10-07');assert.ok(!context.includes('openingUsage'));assert.ok(!context.includes('monthlyBudget'));assert.ok(context.includes('NEVER invent'));});
test('voice resisted entry saves without any configured platforms or payment modes',()=>{
 const empty={...data,platforms:[],cards:[],settings:{...data.settings,paymentModes:[]}};
 const raw={...draft,kind:'resisted' as const,title:'Shoes',amount:2000,platformId:null,paymentId:null};
 const checked=prepareDraft(raw,empty);assert.equal(checked.complete,true);assert.deepEqual(checked.questions,[]);
 const entry=entryFromDraft(raw,'voice-resisted',empty);assert.equal(entry.platformId,'none');assert.equal(entry.paymentId,'none');assert.equal(entry.category,'Other');assert.equal(entry.amount,200000);assert.equal(entry.share,200000);assert.equal(entry.reward,null);
});
test('resisted entries ignore unknown merchants and cards but retain essential review checks',()=>{
 const raw={...draft,kind:'resisted' as const,platformId:'unknown-shop',paymentId:'unknown-card'};
 assert.equal(prepareDraft(raw,data).complete,true);
 for(const patch of [{amount:null},{title:null},{date:'bad'},{uncertain:true,questions:['Which purchase should I record?']}])assert.equal(prepareDraft({...raw,...patch},data).complete,false);
 const instructions=extractionInstructions(data,'2026-10-11','2026-10-11');assert.ok(instructions.includes('platform and payment are NOT required'));
});
