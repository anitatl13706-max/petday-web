import ts from 'typescript';
import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
const base=new URL('../src/',import.meta.url);
let total=0;let failures=0;
for(const name of readdirSync(base).filter(name=>/\.tsx?$/.test(name)&&!name.endsWith('.d.ts'))){
 const source=readFileSync(new URL(name,base),'utf8');
 const compiled=ts.transpileModule(source,{fileName:name,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}});
 const errors=(compiled.diagnostics||[]).filter(e=>e.category===ts.DiagnosticCategory.Error);
 if(errors.length){failures++;for(const error of errors)console.error(name,ts.flattenDiagnosticMessageText(error.messageText,'\n'))}else total++;
}
console.log(`Đã kiểm tra cú pháp: ${total} file đạt, ${failures} file lỗi`);
if(failures)process.exitCode=1;
