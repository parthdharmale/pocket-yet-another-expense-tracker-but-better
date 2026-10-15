import Pocket from '../pocket';
import {createDemoLedger} from '@/lib/pocket/demo-data';
// Cache public samples; no session reads or account-specific rendering.
export const revalidate=3600;
export const metadata={title:'Try Pocket — interactive demo',description:'Explore Pocket with fictional spending, cards and mindful wins. No account required.'};
export default function Demo(){return <Pocket initialData={createDemoLedger()} owner={false} demo/>;}
