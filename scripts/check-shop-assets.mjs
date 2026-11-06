import {readFileSync,existsSync,statSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const src=readFileSync(join(root,'src/BusinessExpansion.tsx'),'utf8');
const catalog=src.split('const canonicalCatalog:Record<string,string[]>={')[1]?.split('\n};')[0];
if(!catalog)throw Error('Không tìm thấy danh mục 90 sản phẩm');
const entries=[...catalog.matchAll(/^ '([^']+)': \[([^\n]+)\],?$/gm)];
const categoryFiles=['thuc-an-dinh-duong','tam-cham-soc-long','ve-sinh-rang-mieng','do-choi-van-dong','di-dao-di-chuyen','dung-cu-an-uong-nghi-ngoi'];
const aliases={'sua-tam-diu-nhe-cho-cho-meo':'sua-tam-diu-nhe-cho-cho-meo-300ml','dau-xa-go-roi-long':'dau-xa-ho-tro-go-roi','luoc-go-roi-long':'luoc-go-roi-long-dai','kim-cat-mong-an-toan':'kim-cat-mong-thu-cung','khan-tam-sieu-tham-cho-thu-cung':'khan-tam-sieu-tham','ban-chai-massage-tam-thu-cung':'ban-chai-massage-khi-tam'};
const slug=(s)=>s.toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const names=entries.flatMap(([,category,items])=>[...items.matchAll(/'([^']+)'/g)].map(m=>m[1]));
const missing=[];
const files=[...categoryFiles.map(s=>join(root,'public/shop/categories',s+'.webp')),...names.map(s=>join(root,'public/shop/products',(aliases[slug(s)]||slug(s))+'.webp'))];
for(const file of files){if(!existsSync(file)||statSync(file).size<200)missing.push(file.replace(root,''));else if(readFileSync(file).subarray(0,4).toString()!=='RIFF')missing.push(file.replace(root,'')+' (không phải WebP)');}
console.log(`Danh mục: ${entries.length}/6; sản phẩm: ${names.length}/90; ảnh kiểm tra: ${files.length}; lỗi: ${missing.length}`);
if(entries.length!==6||names.length!==90||missing.length){console.error(missing.join('\n'));process.exitCode=1;}
