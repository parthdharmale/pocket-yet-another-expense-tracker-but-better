import {seedPlatforms,initialSettings} from './seed.ts';
import type {PocketData} from './types';
export function initialLedger(owner:string):PocketData{if(!owner)throw Error("An account ID is required.");return {version:0,cards:[],platforms:structuredClone(seedPlatforms),entries:[],wishes:[],settings:{...structuredClone(initialSettings),budgetStart:new Date().toISOString().slice(0,7),timezone:'Asia/Kolkata',onboarded:false}};}
