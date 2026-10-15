import type {PocketData,Entry} from './types.ts';
import {cardFromCatalog} from './card-catalog.ts';
import {addDays,chooseRule} from './engine.ts';

// Public, invented examples only. No account, storage, credentials or AI dependencies.
export function createDemoLedger(now=new Date()):PocketData {
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const cards=[cardFromCatalog('swiggy-hdfc-bank-credit-card','demo-swiggy'),cardFromCatalog('hsbc-rupay-cashback-credit-card','demo-hsbc'),cardFromCatalog('cashback-sbi-card','demo-sbi')];
 cards.forEach((c,i)=>{c.limit=[5000000,10000000,8000000][i];c.billingDay=15;c.color=['forest','ruby','slate'][i]});
 cards[0].rules.forEach(r=>{r.minSpendExclusive=25000});
 const platforms=[['swiggy-food','Swiggy Food','Food delivery'],['swiggy-instamart','Swiggy Instamart','Groceries'],['zomato','Zomato','Food delivery'],['amazon-now','Amazon Now','Groceries'],['zepto','Zepto','Groceries'],['amazon-shopping','Amazon Shopping','Shopping'],['flipkart-shopping','Flipkart Shopping','Shopping'],['flipkart-minutes','Flipkart Minutes','Groceries'],['swiggy-dineout','Swiggy Dineout','Dining']].map(([id,name,category])=>({id,name,category,channel:'online' as const,active:true}));
 const data:PocketData={version:1,cards,platforms,entries:[],wishes:[],settings:{id:'preferences',monthlyBudget:1200000,weeklyBudget:300000,rollover:false,budgetStart:date.slice(0,7),paymentModes:['UPI','Cash','Debit card'],timezone:'Asia/Kolkata',onboarded:true}};
 const examples:[number,string,number,string,string,Entry['kind']][]=[
 [0,'Friday night sushi',650,'swiggy-food','demo-swiggy','spend'],[0,'Skipped those headphones',2499,'amazon-shopping','none','resisted'],[-1,'Groceries for the week',1420,'zepto','demo-hsbc','spend'],[-2,'Coffee & a croissant',320,'zomato','demo-hsbc','spend'],[-3,'A little desk upgrade',1899,'amazon-shopping','demo-sbi','spend'],[-4,'Dinner with friends',1250,'swiggy-dineout','demo-swiggy','spend'],[-5,'Midweek essentials',870,'swiggy-instamart','demo-swiggy','spend'],[-6,'Let the sneakers wait',3999,'flipkart-shopping','none','resisted'],[-8,'Movie night snacks',480,'swiggy-instamart','demo-swiggy','spend'],[-10,'Lunch break',420,'swiggy-food','demo-swiggy','spend'],[-31,'A book for the weekend',599,'amazon-shopping','demo-sbi','spend'],[-33,'Chose to make coffee at home',280,'zomato','none','resisted']];
 examples.forEach(([offset,title,rupees,platformId,paymentId,kind],i)=>{const platform=platforms.find(p=>p.id===platformId)!,card=cards.find(c=>c.id===paymentId),entryDate=addDays(date,offset);data.entries.push({id:`demo-entry-${i}`,date:entryDate,title,amount:rupees*100,share:rupees*100,platformId,paymentId,kind,category:platform.category,note:'Fictional demo entry',refunds:[],settled:false,credited:null,reward:kind==='spend'&&card?chooseRule(card,platform,entryDate):null,billingDay:card?.billingDay??null,createdAt:new Date(now.getTime()+i).toISOString(),deleted:false})});
 data.wishes=[{id:'demo-wish',title:'Noise-cancelling headphones',amount:799900,platformId:'amazon-shopping',note:'Do I need these, or just want a little treat?',createdAt:new Date(now.getTime()-6*3600000).toISOString(),hours:48,status:'waiting',entryId:null}];
 return data;
}
