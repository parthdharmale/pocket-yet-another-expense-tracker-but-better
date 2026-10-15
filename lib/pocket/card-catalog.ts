import rawCatalog from '../../docs/card-catalog/india-credit-cards.json' with {type:'json'};
import type {Card,Rule} from './types.ts';

export type CatalogBenefit={id:string;type:string;platforms:string[];summary:string;payment_route:string|null;rate_percent:number|null;cap:Record<string,unknown>|null;minimum_spend_paise:number|null;coupon_code:string|null;valid_from:string|null;valid_until:string|null;conditions?:string[];exclusions?:string[];review_required:string[];source_ids:string[]};
export type CatalogCard={id:string;issuer:string;name:string;aliases:string[];network:string;research_status:string;platforms:string[];benefit_summary:string;benefits:CatalogBenefit[];source_ids:string[];checked_on:string;notes:string;calculation_ready:boolean};
type Catalog={checked_on:string;cards:CatalogCard[];sources:{id:string;title:string;url:string}[]};
const catalog=rawCatalog as Catalog;
export const catalogCards=catalog.cards;
export const catalogCheckedOn=catalog.checked_on;
const normalize=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
export function searchCards(query:string){const words=query.toLowerCase().trim().split(/\s+/).filter(Boolean);return catalogCards.filter(c=>words.every(word=>[c.name,c.issuer,...c.aliases].some(s=>normalize(s).includes(normalize(word)))));}
const exclusions=['Fuel','Rent','Wallet','Gift cards','EMI','Insurance','Education','Government','Jewellery','Cash advance','Fees'];
const food=['Food delivery','Groceries','Dining'];
const retail=['Food delivery','Groceries','Shopping','Dining','Travel','Entertainment','Other'];
function rule(id:string,label:string,rate:number,cap:number|null,extra:Partial<Rule>={}):Rule{return {id,label,rate,cap,bucket:id,period:'statement',kind:'cashback',unit:0,points:0,pointValue:null,platformIds:[],categories:[],excludedCategories:[...exclusions],provenance:'issuer',notes:'Eligible domestic non-EMI purchases only. Issuer MCC/MID exclusions and settlement rounding apply. Estimates use recorded purchases and outside-app usage.',active:true,...extra};}
const merchants=(names:string[])=>({merchantNames:names});
export type CatalogOptions={prime?:boolean};
// Explicit, reviewed adapters. Never execute free-form descriptions or treat unknown caps as unlimited.
export function catalogRules(id:string,options:CatalogOptions={}):Rule[]{
 switch(id){
  case 'swiggy-hdfc-bank-credit-card':return [
   rule('swiggy','Swiggy food, Instamart & Dineout',10,150000,merchants(['Swiggy Food','Swiggy Instamart','Swiggy Dineout','Swiggy Genie'])),
   rule('online','Selected online shopping',5,150000,{...merchants(['Amazon Shopping','Flipkart Shopping','Myntra','Ajio','Nykaa']),channel:'online',notes:'Selected eligible shopping MCCs only; not every online payment. Confirm merchant coding.'}),
   rule('base','Other eligible retail',1,50000,{categories:retail})].map(r=>({...r,rounding:'nearest-rupee-half-down' as const}));
  case 'hsbc-rupay-cashback-credit-card':return [rule('food','Dining, food delivery & groceries',10,40000,{categories:food,bucket:'hsbc-shared'}),rule('base','Other eligible retail',1,40000,{categories:retail,bucket:'hsbc-shared'})];
  case 'hsbc-live-plus-credit-card':return [
   rule('shopping-exclusions','Amazon, Flipkart & Myntra shopping',1.5,null,merchants(['Amazon Shopping','Flipkart Shopping','Myntra'])),
   rule('accelerated','Eligible food, grocery, shopping & utilities',10,120000,{categories:[...food,'Shopping','Utilities'],period:'month',excludedCategories:exclusions.filter(c=>c!=='Utilities')}),
   rule('base','Other eligible retail',1.5,null,{categories:retail})];
  case 'flipkart-axis-bank-credit-card':return [
   rule('flipkart','Flipkart shopping',5,400000,{...merchants(['Flipkart Shopping']),period:'statement-quarter'}),
   rule('myntra','Myntra shopping',7.5,400000,{...merchants(['Myntra']),period:'statement-quarter'}),
   rule('cleartrip','Cleartrip',5,400000,{...merchants(['Cleartrip']),period:'statement-quarter'}),
   rule('partners','Preferred merchants',4,null,merchants(['Swiggy Food'])),
   rule('base','Other eligible retail',1,null,{categories:retail})];
  case 'cashback-sbi-card':return [rule('online','Eligible online purchases',5,200000,{channel:'online',categories:retail,validFrom:'2026-04-01',excludedCategories:[...exclusions,'Utilities','Railways','Digital gaming','Tolls']}),rule('offline','Eligible offline purchases',1,200000,{channel:'offline',categories:retail,validFrom:'2026-04-01',excludedCategories:[...exclusions,'Utilities','Railways','Digital gaming','Tolls']})];
  case 'myntra-kotak-credit-card':return [rule('partners','Preferred partner cashback',5,100000,merchants(['Swiggy Food','Swiggy Instamart','Cleartrip','PVR','Urban Company'])),rule('myntra','Myntra: instant discount only',0,null,merchants(['Myntra'])),rule('base','Other eligible retail',1.25,null,{categories:retail})];
  case 'axis-bank-ace-credit-card':return [rule('google-pay','Google Pay Android utility bills',5,50000,{...merchants(['Google Pay bills (Android)']),bucket:'ace-accelerated',notes:'Eligible utility/recharge payments through Google Pay on Android only. Shared ₹500 pool with partner cashback.'}),rule('partners','Swiggy, Zomato & Ola',4,50000,{...merchants(['Swiggy Food','Zomato','Ola']),bucket:'ace-accelerated'}),rule('base','Other eligible retail',1.5,null,{categories:retail})];
  case 'amazon-pay-icici-bank-credit-card':return [rule('amazon',options.prime?'Amazon shopping · Prime':'Amazon shopping · non-Prime',options.prime?5:3,null,{...merchants(['Amazon Shopping']),kind:'credit',rewardCurrency:'Amazon Pay balance'}),rule('base','Other eligible retail',1,null,{categories:retail,kind:'credit',rewardCurrency:'Amazon Pay balance'})];
  case 'icici-bank-coral-credit-card':return [rule('retail','Eligible retail reward points',0,null,{categories:retail,kind:'points',unit:10000,points:2})];
  case 'hdfc-bank-infinia-metal-edition-credit-card':
  case 'hdfc-bank-infinia-credit-card':return [rule('groceries','Grocery reward points',0,2000,{categories:['Groceries'],kind:'points',unit:15000,points:5,period:'month',additionalCaps:[{bucket:'infinia-total',cap:200000,period:'statement'}]}),rule('retail','Eligible retail reward points',0,200000,{categories:retail.filter(c=>c!=='Groceries'),kind:'points',unit:15000,points:5,bucket:'infinia-total'})];
  default:return [];
 }
}
const extraSources:Record<string,{title:string;url:string}[]>={
 'hdfc-bank-infinia-metal-edition-credit-card':[{title:'HDFC Infinia reward points and category caps',url:'https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/infinia-credit-card/infinia2.pdf'}],
 'icici-bank-coral-credit-card':[{title:'ICICI Coral reward rates',url:'https://www.icici.bank.in/personal-banking/cards/credit-card/coral-credit-card'}],
 'axis-bank-ace-credit-card':[{title:'Axis ACE cashback terms',url:'https://www.axis.bank.in/docs/default-source/default-document-library/axis-bank-ace-credit-card-tncs.pdf?sfvrsn=a3effc42_6'}],
 'hsbc-live-plus-credit-card':[{title:'HSBC Live+ service guide — shopping exclusions',url:'https://www.hsbc.bank.in/content/dam/hsbc/in/documents/credit-cards/live-plus-credit-card-services-guide.pdf'}],
 'hsbc-rupay-cashback-credit-card':[{title:'HSBC RuPay cashback service guide — shared cap',url:'https://www.hsbc.bank.in/content/dam/hsbc/in/documents/credit-cards/rupay-cashback/rupay-cashback-credit-card-services-guide.pdf'}]
};
export function catalogBenefitText(benefit:CatalogBenefit){return [benefit.summary,benefit.rate_percent!==null?`Rate: ${benefit.rate_percent}%.`:'',benefit.cap?`Cap: ${Object.entries(benefit.cap).filter(([key])=>key!=='bucket').map(([key,v])=>`${key.replaceAll('_',' ')} ${String(v).replaceAll('_',' ')}`).join('; ')}.`:'',benefit.minimum_spend_paise!==null?`Minimum spend: ₹${benefit.minimum_spend_paise/100}.`:'',...benefit.review_required.map(note=>`Confirm: ${note}.`),benefit.platforms.length?`Platforms: ${benefit.platforms.join(', ')}.`:'',benefit.payment_route?`Route: ${benefit.payment_route}.`:'',benefit.coupon_code?`Coupon: ${benefit.coupon_code}.`:'',benefit.valid_from?`From ${benefit.valid_from}.`:'',benefit.valid_until?`Until ${benefit.valid_until}.`:'',...(benefit.conditions??[]),...(benefit.exclusions?.length?[`Exclusions: ${benefit.exclusions.join(', ')}.`]:[])].filter(Boolean).join(' ');}
export function cardFromCatalog(id:string,instanceId:string,options:CatalogOptions={}):Card{
 const product=catalogCards.find(c=>c.id===id);if(!product)throw Error('Choose a card from the catalogue.');
 const rules=catalogRules(id,options),sourceIds=new Set([...product.source_ids,...product.benefits.flatMap(b=>b.source_ids)]);
 const benefits=[product.benefit_summary,...product.benefits.map(catalogBenefitText)];
 if(id==='hsbc-live-plus-credit-card')benefits.push('Amazon, Flipkart and Myntra shopping earns 1.5%, excluded from the accelerated 10% category (current issuer service guide).');
 if(id==='amazon-pay-icici-bank-credit-card')benefits.push('Rewards are Amazon Pay balance, kept separate from cash cashback. Amazon Prime membership determines the shopping rate.');
 return {id:instanceId,catalogId:id,catalogCheckedOn:catalogCheckedOn,name:product.name,issuer:product.issuer,owner:'self',limit:null,billingDay:null,color:'forest',rules:structuredClone(rules),benefits:[...new Set(benefits)],sources:[...catalog.sources.filter(s=>sourceIds.has(s.id)).map(({title,url})=>({title,url})),...(extraSources[id]??[])],verifiedAt:catalogCheckedOn,status:'needs-confirmation',notes:[product.notes,rules.length?'Automatic estimates cover the configured rules below; other perks and checkout discounts stay in Benefits & sources.':'Benefits imported. Reward calculation is not configured: enter confirmed rates/caps below before relying on an estimate.','Confirm your exact variant, merchant eligibility and statement day.'].filter(Boolean).join(' '),active:true,openingUsage:[]};
}
