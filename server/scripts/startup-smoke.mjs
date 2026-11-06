import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
const port=41987;
const child=spawn(process.execPath,['src/server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATABASE_URL:process.env.DATABASE_URL||'postgresql://invalid:invalid@127.0.0.1:1/petday',JWT_SECRET:process.env.JWT_SECRET||'petday_startup_smoke_only_not_for_production_2026',PORT:String(port),PETDAY_AUTO_REMINDERS:'false'},stdio:['ignore','pipe','pipe']});
let output='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);
let code=null;child.on('exit',x=>{code=x});
for(let i=0;i<35;i++){if(output.includes('PetDay API running at'))break;if(code!==null)break;await delay(150)}
const ok=output.includes('PetDay API running at');child.kill();
if(!ok){console.error('Backend did not start. Output:\n'+output.slice(0,6000));process.exitCode=1;}else console.log('PASS: backend imports, validates startup and listens (no DB mutation).');
