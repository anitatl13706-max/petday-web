-- PetDay V6.56: optional catalog for Di dạo & Di chuyển, TEST ONLY.
-- Back up database first; run after migration 032_v653_six_categories_food_seed.sql.
-- Product photos do NOT require SQL; this file only adds missing names.
BEGIN;
INSERT INTO public.retail_products(name,category,description,price,stock)
SELECT v.name,'Đi dạo & Di chuyển',v.description,v.price,v.stock FROM (VALUES
('Dây dắt chó cơ bản 1,5m','Dây nylon mềm, móc kim loại, dài 1,5m.',75000::bigint,22),
('Dây dắt phản quang','Dây dắt có dải phản quang để đi dạo buổi tối.',89000::bigint,23),
('Dây dắt tự rút 3m','Dây tự thu, nút khóa điều chỉnh độ dài.',135000::bigint,18),
('Vòng cổ size S','Vòng cổ điều chỉnh được cho thú cưng cỡ nhỏ.',59000::bigint,25),
('Vòng cổ size M','Vòng cổ điều chỉnh được cho thú cưng cỡ vừa.',69000::bigint,22),
('Yếm ngực điều chỉnh size','Yếm ngực có khóa và dây điều chỉnh.',99000::bigint,20),
('Yếm ngực chống kéo','Yếm ngực hỗ trợ phân bố lực khi dắt chó.',119000::bigint,18),
('Bình nước du lịch','Bình uống nước cho thú cưng khi đi dạo.',99000::bigint,19),
('Bát nước gấp gọn','Bát silicon có thể gấp lại và móc vào túi.',69000::bigint,22),
('Túi đựng đồ đi spa','Túi đựng khăn, bàn chải và đồ dùng cá nhân.',149000::bigint,15),
('Túi vận chuyển size S','Túi vận chuyển thông thoáng cho thú cưng nhỏ.',199000::bigint,12),
('Túi vận chuyển size M','Túi vận chuyển size vừa, có lưới thông gió.',249000::bigint,10),
('Balo phi hành gia cho mèo','Balo cửa trong suốt và lỗ thông khí.',259000::bigint,12),
('Balo vận chuyển thoáng khí','Balo có lưới thông gió cho thú cưng.',259000::bigint,10),
('Đai an toàn thú cưng trên ô tô','Đai gài dây an toàn ô tô kết hợp móc khóa.',79000::bigint,16)
) AS v(name,description,price,stock)
WHERE NOT EXISTS (SELECT 1 FROM public.retail_products p WHERE lower(trim(p.name))=lower(trim(v.name)));
COMMIT;
