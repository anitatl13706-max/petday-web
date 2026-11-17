PETDAY V6.117 – TACH COC 20%, CHUYEN KHOAN, TIEN MAT VA TRANG THAI

CANH BAO: CHI KIEM THU TREN DATABASE TEST. SAO LUU DATABASE TRUOC KHI CHAY SQL.

1) Chay SQL: PETDAY_OFFICIAL/database/062_v6117_payment_plan_and_receipt_purpose.sql
   Yeu cau database TEST da co cac migration 001–061 cua du an.
   KHONG chay lai cac migration hang loat va KHONG xoa du lieu.

2) Sao chep .env hop le (ket noi DB TEST) vao PETDAY_OFFICIAL/server/.env.
3) Dung backend cu tren cong 4001 (dung dung tien trinh cua PetDay, khong tat tat ca Node).
4) Tai PETDAY_OFFICIAL:
   npm install
   npm run dev
5) Mo PowerShell khac, vao PETDAY_OFFICIAL/server:
   npm install
   $env:PORT=4001
   $env:PETDAY_DEMO_PAYMENT='true'  (CHI DATABASE TEST)
   npm start
6) Mo dung URL Vite hien thi (localhost:5173 hoac cong khac).

DANH SACH KIEM THU
- Khach lan dau chon coc 20%, QR thanh toan 36.000d cho dich vu 180.000d.
  Ky vong: payment_plan=DEPOSIT_20; receipt purpose=DEPOSIT; con lai 144.000d.
- Khach lan dau chon thanh toan toan bo 180.000d.
  Ky vong: payment_plan=FULL_PREPAY; receipt purpose=FULL_PAYMENT, KHONG ghi nhan 180.000d la coc.
- Coc qua QR 36.000d, Admin thu them 100.000d tien mat:
  bankPaid=36.000d, cashPaid=100.000d, collectedPaid=136.000d, outstanding=44.000d.
- Tab Tai chinh > Dich vu: 4 bo loc, bo loc phuong an, kenh thu, xem chi tiet.
- Du lieu cu khong co purpose: de trong va khong tu gan nham la coc.
- Thu nghiem cac truong hop huy/hoan, chong thu trung va Taxi.

GIOI HAN
- Giao dich QR TEST khong chuyen tien ngan hang that.
- Hoan tien ngan hang that van chua tich hop API.
- Frontend chua build duoc trong moi truong tao file do thieu thu vien npm.
