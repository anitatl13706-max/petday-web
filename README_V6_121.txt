PETDAY V6.121 — TAXI DON GIAN & THU TIEN MAT KHI HOAN TAT

Nguon: V6.120. Ban nay la ma nguon cap nhat, khong phai chi giao dien mau.

DIEU CHINH
1. Pet Taxi moi duoc ghi nhan/xac nhan cung lich dich vu khi du dieu kien. Lich lan dau chua du coc khong duoc chay Taxi.
2. Admin co the bam Xe xuat phat truc tiep tu chuyen da dat; sau do Hoan tat chuyen. Ngoai le: No-show da xac minh, loi PetDay, huy sau xuat phat va chua don (50%).
3. Khach huy tung chieu chua xuat phat: mien/hoan 100%; da xuat phat thi gui yeu cau xac minh 50%; No-show 0%; PetDay loi 100%. Tinh rieng 2 chieu.
4. Hoan phi Taxi: tai sanh sach, backend tu tao ho so approved neu co phan da thu hoan duoc; neu chua thu thi giam cong no, khong tao giao dich hoan ao. PETDAY_DEMO_PAYMENT=true co che do hoan mo phong, khong chuyen ngan hang that.
5. Admin bam Hoan tat cham soc: neu co tien mat con phai thu, hop thoai cho chon OK da nhan du; backend tao receipt tien mat va chuyen trang thai hoan tat trong CUNG PostgreSQL transaction. Cancel chi ghi nhan cham soc da xong, khong tu coi da thu tien. Chuyen khoan khong tu ghi thu.
6. Khong can SQL migration moi neu da chay du migration V6.117/V6.120.

CHAY
- Trong PETDAY_OFFICIAL: npm install, npm run dev.
- Trong PETDAY_OFFICIAL/server: npm install, npm start, PORT=4001, DATABASE_URL tro database TEST. PETDAY_DEMO_PAYMENT=true chi dung tren database TEST.
- Neu bao HTTP 502 dang nhap, kiem tra backend dang lang nghe cong 4001.

KIEM THU
- node --test server/test/*.test.js
- npm run build (can cai npm dependencies; chua build trong moi truong nay do npm offline khong co @tailwindcss/vite).
- TEST can thiet tren PostgreSQL: tao lich khach cu co Taxi; admin Xe xuat phat => Hoan tat; huy chieu tra khi xe chua xuat phat => 100%; huy sau xuat phat => xac minh 50%; No-show => 0%; loi PetDay => 100%; bam 2 lan khong hoan trung; dich vu thu tien mat bang mot lan Hoan tat; dich vu chuyen khoan khong tu sinh receipt tien mat.

GIOI HAN
- Chua tich hop nha cung cap thanh toan thuc / refund bank. Khoan hoan du dieu kien khong dong nghia tien da duoc chuyen.
- Chua test voi PostgreSQL va UI tren may cua nguoi dung.
