import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('out'),base=process.env.NEXT_PUBLIC_BASE_PATH||'',port=Number(process.env.PORT||3000);
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.txt':'text/plain','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.glb':'model/gltf-binary'};
http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');let relative=decodeURIComponent(url.pathname);
  if(base&&relative==='/'){res.writeHead(302,{Location:base+'/'});return res.end();}
  if(base&&!relative.startsWith(base+'/')&&relative!==base){res.writeHead(404);return res.end('Not found');}
  if(base)relative=relative.slice(base.length);
  let file=path.resolve(root,'.'+relative);
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end();}
  const stat=await fs.stat(file);if(stat.isDirectory())file=path.join(file,'index.html');
  const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(body);
 }catch {res.writeHead(404,{'Content-Type':'text/html'});res.end(await fs.readFile(path.join(root,'404.html')).catch(()=> 'Not found'));}
}).listen(port,'127.0.0.1',()=>console.log('Static site: http://127.0.0.1:'+port+base+'/'));
