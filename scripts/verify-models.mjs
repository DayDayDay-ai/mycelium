import {chromium} from '@playwright/test';
import {PrismaClient} from '@prisma/client';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const db=new PrismaClient();
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
try {
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 page.on('pageerror',e=>errors.push(e.message));
 const species=['belyy-grib','podberezovik','lisichka','shampinion','veshenka','maslenok','smorchok','muhomor'];
 for(const slug of species) {
  await page.goto('http://127.0.0.1:3000/mushrooms/'+slug);
  await page.getByRole('button',{name:'3D-модель',exact:true}).click();
  await page.locator('canvas').waitFor();
  await page.waitForTimeout(1200);
  assert.equal(await page.getByText('3D недоступно.',{exact:false}).count(),0);
  if(['belyy-grib','podberezovik','lisichka','veshenka'].includes(slug)) await page.screenshot({path:'verification/model-'+slug+'.png'});
  console.log('PASS 3D '+slug);
 }
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:3000/mushrooms/podberezovik');
 await page.getByRole('button',{name:'3D-модель',exact:true}).click();
 await page.locator('canvas').waitFor();
 await page.waitForTimeout(1200);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:'verification/mobile-detailed-model.png'});
 assert.deepEqual(errors,[]);
 const counts={accounts:await db.user.count(),sessions:await db.session.count(),progress:await db.userMushroomProgress.count(),mushrooms:await db.mushroom.count()};
 assert.equal(counts.accounts,0);assert.equal(counts.progress,0);
 await writeFile('verification/models-report.json',JSON.stringify({status:'PASS',species,errors,counts},null,2));
 console.log(JSON.stringify(counts));
} finally {await browser.close();await db.$disconnect();}
