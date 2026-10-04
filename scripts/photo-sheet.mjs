import sharp from 'sharp';
import {readFile, mkdir} from 'node:fs/promises';
const credits = Object.entries(JSON.parse(await readFile('src/lib/photo-credits.json','utf8')));
await mkdir('verification',{recursive:true});
for(let start=0;start<credits.length;start+=20){
  const layers=[];
  for(const [i,[slug,c]] of credits.slice(start,start+20).entries()){
    const img=await sharp(`public${c.url}`).resize(230,170,{fit:'contain',background:'#101010'}).png().toBuffer();
    const x=(i%4)*240, y=Math.floor(i/4)*200;
    layers.push({input:img,left:x,top:y});
    const label=Buffer.from(`<svg width="235" height="28"><text x="4" y="20" font-family="Arial" font-size="13" fill="white">${c.taxon}</text></svg>`);
    layers.push({input:label,left:x,top:y+172});
  }
  await sharp({create:{width:960,height:1000,channels:3,background:'#101010'}}).composite(layers).jpeg().toFile(`verification/photos-${start/20+1}.jpg`);
}
