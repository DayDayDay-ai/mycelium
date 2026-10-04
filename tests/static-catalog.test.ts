import {test} from 'node:test';
import assert from 'node:assert/strict';
import {filterCatalog,mushrooms} from '../src/lib/static-catalog';
test('Static catalog combines filters and ignores invalid parameters',()=>{
 assert.equal(mushrooms.length,39);
 const filtered=filterCatalog(new URLSearchParams('edibility=EDIBLE,CONDITIONAL&month=8&q=Boletus'));
 assert.ok(filtered.length>0);
 assert.ok(filtered.every(x=>['EDIBLE','CONDITIONAL'].includes(x.edibility)&&x.seasonMonths.includes(8)&&x.nameLatin.includes('Boletus')));
 assert.equal(filterCatalog(new URLSearchParams('edibility=INVALID&month=99&difficulty=0')).length,39);
});
test('Static catalog search and sorting are deterministic',()=>{
 assert.equal(filterCatalog(new URLSearchParams('q=лисичка')).some(x=>x.slug==='lisichka'),true);
 const data=filterCatalog(new URLSearchParams('sort=difficulty'));
 assert.ok(data.every((x,i)=>i===0||data[i-1].difficulty<=x.difficulty));
});
