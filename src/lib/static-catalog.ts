import snapshot from './mushrooms.json';
import type { Mushroom, MushroomImage, MushroomRegion, MushroomLookalike } from './mushroom-types';
export type StaticMushroom = Mushroom & {images:MushroomImage[];regions:MushroomRegion[];lookalikes:(MushroomLookalike & {similar:Mushroom})[]};
export const mushrooms = snapshot as unknown as StaticMushroom[];
export function filterCatalog(p:URLSearchParams) {
  const edible=p.getAll('edibility').flatMap(v=>v.split(',')).filter(v=>['EDIBLE','CONDITIONAL','INEDIBLE','POISONOUS','DEADLY'].includes(v));
  const q=(p.get('q')||'').trim().toLocaleLowerCase('ru'),month=Number(p.get('month')),difficulty=Number(p.get('difficulty'));
  const seasons:Record<string,number[]>={spring:[3,4,5],summer:[6,7,8],autumn:[9,10,11],winter:[12,1,2]};
  const season=seasons[p.get('season')||''];
  const data=mushrooms.filter(x=>x.isPublished&&(!edible.length||edible.includes(x.edibility))&&(!['REGIONAL','ALLOWED','FORBIDDEN','PROTECTED'].includes(p.get('collection')||'')||x.collectionStatus===p.get('collection'))&&(!q||x.nameRu.toLocaleLowerCase('ru').includes(q)||x.nameLatin.toLowerCase().includes(q))&&(!(month>=1&&month<=12)||x.seasonMonths.includes(month))&&(!season||x.seasonMonths.some(m=>season.includes(m)))&&(!(difficulty>=1&&difficulty<=3)||x.difficulty===difficulty)&&(!p.get('habitat')||x.habitat.includes(p.get('habitat')!)));
  const sort=p.get('sort'),danger=['EDIBLE','CONDITIONAL','INEDIBLE','POISONOUS','DEADLY'];
  return data.sort((a,b)=>sort==='az'?a.nameRu.localeCompare(b.nameRu,'ru'):sort==='difficulty'?a.difficulty-b.difficulty:sort==='danger'||sort==='edible'?(danger.indexOf(a.edibility)-danger.indexOf(b.edibility))*(sort==='danger'?-1:1):sort==='season'?Math.min(...a.seasonMonths)-Math.min(...b.seasonMonths):b.popularity-a.popularity);
}
