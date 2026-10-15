import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seedPlatforms,initialSettings} from '../lib/pocket/seed.ts';
import {seedCards} from './fixtures/reward-cards.ts';
import {schemas} from '../lib/pocket/validation.ts';
test('all seeded configuration can be edited and resaved',()=>{for(const c of seedCards)assert.ok(schemas.cards.safeParse(c).success,c.name);for(const p of seedPlatforms)assert.ok(schemas.platforms.safeParse(p).success);assert.ok(schemas.settings.safeParse(initialSettings).success)});
