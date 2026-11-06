import fs from 'node:fs';import path from 'node:path';
const file=path.resolve('server/.env');
if(!fs.existsSync(file)){console.log('CHƯA CÓ server/.env. Sao chép server/.env.example -> server/.env, tự điền thông tin thật trên máy bạn.');process.exitCode=1;}
else {const env=Object.fromEntries(fs.readFileSync(file,'utf8').split(/\r?\n/).filter(x=>x&&!x.trim().startsWith('#')&&x.includes('=')).map(line=>{const p=line.indexOf('=');return [line.slice(0,p).trim(),line.slice(p+1).trim()]}));const present=k=>Boolean(env[k])&&!/YOUR_|REPLACE_WITH|CHANGE_ME/i.test(env[k]);
for(const [title,keys] of [['Cơ sở dữ liệu',['DATABASE_URL','JWT_SECRET']],['Quên mật khẩu SMTP',['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','SMTP_FROM','RESET_BASE_URL']]]){const missing=keys.filter(k=>!present(k));console.log(title+': '+(missing.length?'THIẾU '+missing.join(', '):'ĐỦ TRƯỜNG CẤU HÌNH (chưa xác nhận kết nối)'));}
console.log('Ngân hàng: cấu hình trong Admin > Tài chính > Thiết lập ngân hàng (cần PostgreSQL và tài khoản Admin); không đoán thông tin chuyển khoản.');
console.log('Schema: kiểm tra GET http://localhost:4000/api/health/schema và /api/health/workflows; sao lưu DB trước khi chạy migration.');
}
