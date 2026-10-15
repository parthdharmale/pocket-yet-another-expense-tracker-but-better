import type {PocketData,Rule} from './types';
export const SWIGGY_MINIMUM_EXCLUSIVE=25000;
const note='Personal eligibility rule: Swiggy HDFC cashback applies only when the net card charge is above ₹250.';
export function correctedRule(cardId:string,rule:Rule):Rule{return cardId==='swiggy-hdfc'&&rule.kind==='cashback'?{...rule,minSpendExclusive:Math.max(rule.minSpendExclusive??0,SWIGGY_MINIMUM_EXCLUSIVE)}:rule;}
export function applyRewardCorrections(data:PocketData){
 let changed=false;const next=structuredClone(data);
 for(const card of next.cards){if(card.id!=='swiggy-hdfc')continue;card.rules=card.rules.map(rule=>{const corrected=correctedRule(card.id,rule);if(corrected.minSpendExclusive!==rule.minSpendExclusive)changed=true;return corrected;});if(!card.benefits.includes(note)){card.benefits.push(note);changed=true;}}
 for(const entry of next.entries){if(!entry.reward)continue;const corrected=correctedRule(entry.paymentId,entry.reward);if(corrected.minSpendExclusive!==entry.reward.minSpendExclusive)changed=true;entry.reward=corrected;}
 return {data:next,changed};
}
