import {PrismaClient} from '@prisma/client';
import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import assert from 'node:assert/strict';
const db=new PrismaClient();
try {
 const credits=JSON.parse(await readFile('src/lib/photo-credits.json','utf8'));
 const items=await db.mushroom.findMany({where:{isPublished:true},include:{images:true}});
 assert.equal(items.length,39);
 for(const item of items){
   const credit=credits[item.slug]; assert.ok(credit,`Missing photo credit: ${item.slug}`);
   assert.equal(item.coverImage,credit.url);assert.ok(item.images.some(x=>x.url===credit.url));
   const meta=await sharp(`public${credit.url}`).metadata();assert.ok(Math.max(meta.width,meta.height)>=400&&Math.min(meta.width,meta.height)>=150,item.slug);
   assert.ok(item.habitat.length>0&&!item.habitat.some(x=>x.includes('Требует проверки')));
   assert.ok(item.sourceUrl.startsWith('https://www.first-nature.com/fungi/'));
 }
 const result={mushrooms:items.length,localPhotos:items.length,licensedPhotos:items.length,status:'PASS',checkedAt:new Date().toISOString()};
 await writeFile('verification/content-report.json',JSON.stringify(result,null,2)); console.log(result);
} finally {await db.$disconnect()}
