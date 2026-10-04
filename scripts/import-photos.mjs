// One-time import; the application uses local, static files. No live API requests.
import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { request } from './network.mjs';
const db = new PrismaClient();
await mkdir('public/photos', { recursive: true });
let manifest = {};
try { manifest = JSON.parse(await readFile('src/lib/photo-credits.json', 'utf8')); } catch {}
const items = await db.mushroom.findMany({ where: { isPublished: true }, orderBy: { slug: 'asc' } });
for (const item of items) {
  try {
    if (manifest[item.slug]) {
      await db.mushroom.update({where:{id:item.id},data:{coverImage:manifest[item.slug].url}});
      continue;
    }
    console.log('IMPORT', item.slug);
    const taxa = await request(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(item.nameLatin)}&rank=species&per_page=10`);
    if(taxa.status !== 200) throw new Error(`Taxa API ${taxa.status}`);
    const aliases = { 'Calvatia gigantea':'Langermannia gigantea', 'Lepista nuda':'Collybia nuda' };
    const taxon = JSON.parse(taxa.body).results.find(x => x.name === item.nameLatin || x.name === aliases[item.nameLatin]);
    if(!taxon) throw new Error('Exact species could not be resolved');
    const response = await request(`https://api.inaturalist.org/v1/observations?taxon_id=${taxon.id}&quality_grade=research&photo_license=cc0,cc-by,cc-by-sa&per_page=5`);
    if (response.status !== 200) throw new Error(`API ${response.status}`);
    const observations = JSON.parse(response.body).results;
    if(taxon.default_photo && ['cc0','cc-by','cc-by-sa'].includes(taxon.default_photo.license_code)) observations.unshift({taxon:{id:taxon.id},photos:[taxon.default_photo],uri:`https://www.inaturalist.org/taxa/${taxon.id}`});
    let selected;
    for (const observation of observations) {
      if (observation.taxon?.id !== taxon.id) continue;
      for (const photo of observation.photos || []) {
        if (!['cc0', 'cc-by', 'cc-by-sa'].includes(photo.license_code)) continue;
        const url = photo.url.replace('/square.', '/medium.');
        let image;
        try { image = await request(`https://static.inaturalist.org/photos/${photo.id}/medium.jpg`); if (image.status !== 200) image = await request(url); } catch { continue; }
        if (image.status !== 200 || !image.type?.startsWith('image/')) continue;
        const ext = image.type.includes('png') ? 'png' : 'jpg';
        const local = `/photos/${item.slug}.${ext}`;
        await writeFile(`public${local}`, image.body);
        selected = { url: local, author: photo.attribution, license: photo.license_code, licenseUrl: photo.license_code === 'cc0' ? 'https://creativecommons.org/publicdomain/zero/1.0/' : `https://creativecommons.org/licenses/${photo.license_code === 'cc-by' ? 'by' : 'by-sa'}/4.0/`, sourceUrl: `https://www.inaturalist.org/photos/${photo.id}`, observationUrl: observation.uri || `https://www.inaturalist.org/observations/${observation.id}`, taxon: item.nameLatin, importedAt: new Date().toISOString(), changes: 'Оригинальный файл; отображение может обрезаться по рамке.' };
        break;
      }
      if (selected) break;
    }
    if (!selected) throw new Error('No licensed, research-grade photo for exact taxon');
    manifest[item.slug] = selected;
    await writeFile('src/lib/photo-credits.json', JSON.stringify(manifest, null, 2));
    await db.mushroomImage.deleteMany({ where: { mushroomId: item.id, url: { startsWith: '/photos/' } } });
    await db.mushroomImage.create({ data: { mushroomId: item.id, url: selected.url, alt: `${item.nameRu} (${item.nameLatin}). ${selected.author}` } });
    await db.mushroom.update({ where: { id: item.id }, data: { coverImage: selected.url } });
    console.log('PHOTO OK', item.slug, selected.license);
  } catch (error) { console.log('PHOTO FAILED', item.slug, error.message); }
  await new Promise(resolve => setTimeout(resolve, 1000));
}
await writeFile('src/lib/photo-credits.json', JSON.stringify(manifest, null, 2));
console.log('Imported', Object.keys(manifest).length, '/', items.length);
await db.$disconnect();
