import fs from 'node:fs/promises';
import path from 'node:path';
export async function normalizeSegments(root='out') {
 let count=0;
 async function copyNested(directory,parent,prefix) {
  for(const entry of await fs.readdir(directory,{withFileTypes:true})) {
   const source=path.join(directory,entry.name),name=prefix+'.'+entry.name;
   if(entry.isDirectory())await copyNested(source,parent,name);
   else if(entry.name.endsWith('.txt')){await fs.copyFile(source,path.join(parent,name));count++;}
  }
 }
 async function walk(directory) {
  for(const entry of await fs.readdir(directory,{withFileTypes:true})) if(entry.isDirectory()) {
   const child=path.join(directory,entry.name);
   if(entry.name.startsWith('__next.'))await copyNested(child,directory,entry.name);
   else await walk(child);
  }
 }
 await walk(root);return count;
}
