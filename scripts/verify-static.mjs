import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const base=(process.env.STATIC_BASE_URL||'http://127.0.0.1:3000/mycelium').replace(/\/$/,'');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],api=[],failed=[],checks=[];
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/'))api.push(r.url());});page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))failed.push(r.url());});
 async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name);}
 async function register(name,username){await page.goto(base+'/account/');await page.getByRole('button',{name:'Нет аккаунта? Зарегистрироваться'}).click();await page.getByLabel('Имя',{exact:true}).fill(name);await page.getByLabel('Ник',{exact:true}).fill(username);await page.getByLabel('Повтори ник',{exact:true}).fill(username);await page.getByLabel('Пароль',{exact:true}).fill('1234');await page.getByLabel('Повтори пароль',{exact:true}).fill('1234');await page.getByRole('button',{name:'Создать аккаунт',exact:false}).click();await page.getByText('@'+username,{exact:true}).waitFor();}
 await check('Static catalogue, URL filters and search',async()=>{
  await page.goto(base+'/');await page.getByRole('link',{name:'Начать изучать'}).click();await page.locator('.mushroom-card').nth(38).waitFor();assert.equal(await page.locator('.mushroom-card').count(),39);
  await page.goto(base+'/mushrooms/?q=Boletus&edibility=EDIBLE&month=8');await page.locator('.mushroom-card').first().waitFor();assert.ok(await page.locator('.mushroom-card').count()<39);
  await page.reload();await page.locator('.mushroom-card').first().waitFor();
 });
 await check('Photo, WebGL, READY and catalogue return; guest persistence',async()=>{
  await page.goto(base+'/mushrooms/belyy-grib/');await page.locator('.specimen-photo img').waitFor();await page.waitForFunction(()=>{const img=document.querySelector('.specimen-photo img');return img?.complete&&img.naturalWidth>0;});
  await page.getByRole('button',{name:'3D-модель',exact:true}).click();await page.locator('canvas').waitFor();await page.waitForTimeout(800);
  await page.locator('.ready-section').scrollIntoViewIfNeeded();await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'Да, изучил',exact:true}).click();await page.waitForURL(base+'/mushrooms/');await page.getByText('Изучено',{exact:true}).first().waitFor();
  await page.reload();await page.getByText('Изучено',{exact:true}).first().waitFor();
 });
 await check('Local registration with 4-character password; guest import',async()=>{
  await register('Анна','forest_anna');await page.getByRole('button',{name:'Перенести локальный прогресс'}).click();await page.getByText('Готово',{exact:true}).waitFor();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('mycelium-accounts-v1')));assert.equal(stored[0].password,undefined);assert.notEqual(stored[0].passwordHash,'1234');assert.equal(stored[0].passwordHash.length,64);
  await page.goto(base+'/progress/');await page.getByText('1 / 39 изучено',{exact:false}).waitFor();await page.reload();await page.getByText('1 / 39 изучено',{exact:false}).waitFor();
 });
 await check('Logout, isolated second account and case-insensitive login',async()=>{
  await page.goto(base+'/account/');await page.getByRole('button',{name:'Выйти',exact:true}).click();await page.getByLabel('Ник',{exact:true}).waitFor();
  await register('Борис','forest_boris');await page.goto(base+'/progress/');await page.getByText('0 / 39 изучено',{exact:false}).waitFor();
  await page.goto(base+'/account/');await page.getByRole('button',{name:'Выйти',exact:true}).click();await page.getByLabel('Ник',{exact:true}).fill('FOREST_ANNA');await page.getByLabel('Пароль',{exact:true}).fill('0000');await page.getByRole('button',{name:/^Войти/}).click();await page.getByRole('alert').waitFor();
  await page.getByLabel('Пароль',{exact:true}).fill('1234');await page.getByRole('button',{name:/^Войти/}).click();await page.getByText('@forest_anna',{exact:true}).waitFor();await page.goto(base+'/progress/');await page.getByText('1 / 39 изучено',{exact:false}).waitFor();
 });
 await check('Mobile model and local account form, no horizontal overflow',async()=>{
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/mushrooms/podberezovik/');await page.getByRole('button',{name:'3D-модель',exact:true}).click();await page.locator('canvas').waitFor();await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'verification/static-mobile.png',fullPage:false});
  await page.goto(base+'/account/');await page.getByRole('button',{name:'Выйти',exact:true}).click();await page.getByRole('button',{name:'Нет аккаунта? Зарегистрироваться'}).click();assert.equal(await page.locator('form input').count(),5);await page.screenshot({path:'verification/static-registration.png',fullPage:true});
 });
 await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/mushrooms/');await page.locator('.mushroom-card').nth(38).waitFor();await page.screenshot({path:'verification/static-catalog.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(api,[]);assert.deepEqual(failed,[]);
 await writeFile('verification/static-report.json',JSON.stringify({status:'PASS',base,checks,errors,apiRequests:api.length,failedResources:failed},null,2));
 console.log('PASS: no server API, JavaScript errors or missing resources');
} finally {await browser.close();}
