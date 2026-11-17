PETDAY V6.119 - GIAO DIEN LICH HEN GON HON

Thay doi tren ma nguon V6.118:
- The lich khach hien tong tien, da thu, con lai va trang thai ngan gon.
- Phan thong tin bo sung (ghi chu, Taxi, nhat ky, doi/huy lich) thu gon, bam 'Xem chi tiet' de mo.
- Nut '+ Dat them dich vu khac' nam o the lich; chuyen thang sang trang Dat lich, neu pet con ho so thi chon san, dich vu va ngay gio de khach chon moi.
- Bo mau vang 'Dang cho xac nhan' gay hieu nham tren the lich. Lich dang cho khoan thanh toan bat buoc van hien 'Cho coc 20%' / 'Cho thanh toan ban dau'. Khong chuyen trang thai that khi chua thu du tien.
- Khong thay doi API, cau truc PostgreSQL hoac chinh sach thanh toan.

CHAY TREN WINDOWS (PowerShell mo tai thu muc giai nen):
Frontend:
$pkg = Get-ChildItem -Path . -Filter package.json -Recurse -File | Where-Object { $_.FullName -notmatch 'node_modules|\\server\\' } | Select-Object -First 1
Set-Location $pkg.DirectoryName
npm install
npm run dev

Backend: mo PowerShell thu hai tai thu muc giai nen, phai co server/.env tro den PostgreSQL TEST.
$server = Get-ChildItem -Path . -Filter package.json -Recurse -File | Where-Object { $_.DirectoryName -match '\\server$' -and $_.FullName -notmatch 'node_modules' } | Select-Object -First 1
Set-Location $server.DirectoryName
npm install
$env:PORT = '4001'
# Chi bat khi database la TEST rieng:
$env:PETDAY_DEMO_PAYMENT = 'true'
npm start

Luu y: dong backend ban cu tren 4001 truoc. Khong can migration SQL moi cho V6.119, nhung van can database da duoc cap nhat den V6.117.
KIEM THU: The lich => + Dat them dich vu khac => trang Dat lich, tu chon Goi chinh va ngay gio; lich cho coc => nut QR; lich da xac nhan => khong hien canh bao vang.
