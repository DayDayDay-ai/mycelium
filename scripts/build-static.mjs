import {spawn} from 'node:child_process';
import path from 'node:path';
import {normalizeSegments} from './normalize-segments.mjs';
const env={...process.env};
if(process.platform==='win32') env.NODE_OPTIONS=[env.NODE_OPTIONS, '--require "'+path.resolve('scripts/windows-fs.cjs').replaceAll('\\','/')+'"'].filter(Boolean).join(' ');
const status=await new Promise(resolve=>{const child=spawn(process.execPath,[path.resolve('node_modules/next/dist/bin/next'),'build'],{env,stdio:'inherit'});child.on('error',()=>resolve(1));child.on('exit',code=>resolve(code??1));});
if(status!==0)process.exit(status);
// Normalize nested RSC segment names emitted by Next.js on Windows for static hosts.
console.log('Static segment aliases:',await normalizeSegments());
