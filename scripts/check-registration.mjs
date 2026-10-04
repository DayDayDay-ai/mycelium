import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto('http://127.0.0.1:3000/account');
 await page.getByRole('button',{name:'Нет аккаунта? Зарегистрироваться'}).click();
 await page.getByLabel('Повтори пароль',{exact:true}).waitFor();
 assert.equal(await page.locator('form input').count(),5);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:'verification/mobile-registration.png',fullPage:true});
 console.log('PASS Mobile registration: 5 fields, no overflow');
} finally {await browser.close();}
