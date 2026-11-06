-- V6.53 / PostgreSQL TEST ONLY; BACK UP BEFORE RUNNING. Does not update past orders or existing prices/stocks.
BEGIN;
ALTER TABLE public.retail_products DROP CONSTRAINT IF EXISTS retail_products_category_check;
ALTER TABLE public.retail_products ADD CONSTRAINT retail_products_category_check CHECK (category IN (
 'Thức ăn & Dinh dưỡng','Tắm & Chăm sóc lông','Vệ sinh & Răng miệng','Đồ chơi & Vận động','Đi dạo & Di chuyển','Dụng cụ ăn uống & Nghỉ ngơi',
 'Thức ăn','Chăm sóc','Vệ sinh','Phụ kiện'));
-- Important: known old categories may be mixed. Name-based fallback for test catalog; review ambiguous custom products manually.
UPDATE public.retail_products SET category=CASE
 WHEN name ~* '(hạt|pate|pa-tê|súp thưởng|snack|bánh thưởng|bánh quy|pudding|thức ăn|combo pate|sữa cho chó con)' THEN 'Thức ăn & Dinh dưỡng'
 WHEN name ~* '(bàn chải đánh răng|kem đánh răng|vệ sinh|khăn ướt|khăn lau|khăn lót|cát|khay vệ sinh|xẻng|tấm lót|lót khay|túi đựng phân|túi cuộn|rửa bát|lau chân|khử mùi khay|khử mùi toilet|vệ sinh tai)' THEN 'Vệ sinh & Răng miệng'
 WHEN name ~* '(đồ chơi|bóng|cần câu|chuột bông|dây thừng|kéo co|đĩa bay|thú bông|gặm|bàn cào)' THEN 'Đồ chơi & Vận động'
 WHEN name ~* '(dây dắt|vòng cổ|yếm ngực|balo|túi vận chuyển|túi đựng đồ|túi xách|bình nước du lịch|bình nước cầm tay|bát du lịch|bát gấp|đai an toàn)' THEN 'Đi dạo & Di chuyển'
 WHEN name ~* '(bát ăn|bát inox|bát sứ|khay ăn|bát nhựa|thảm lót bát|nước tự động|cho ăn tự động|hộp đựng thức ăn|muỗng đong|đệm|nệm|nhà ngủ|chăn mềm)' THEN 'Dụng cụ ăn uống & Nghỉ ngơi'
 ELSE 'Tắm & Chăm sóc lông' END, updated_at=NOW()
WHERE category IN ('Thức ăn','Chăm sóc','Vệ sinh','Phụ kiện');
INSERT INTO public.retail_products(name,category,description,price,stock)
SELECT v.name,'Thức ăn & Dinh dưỡng',v.description,v.price,v.stock
FROM (VALUES
 ('Hạt cho chó trưởng thành vị gà 1kg','Hạt khô dành cho chó trưởng thành vị gà',145000::bigint,24),
 ('Hạt cho chó con vị sữa 500g','Hạt dành cho chó con vị sữa',118000::bigint,16),
 ('Hạt cho chó giống nhỏ 1kg','Hạt cho chó giống nhỏ',155000::bigint,19),
 ('Hạt cho mèo trưởng thành vị cá hồi 1kg','Hạt khô dành cho mèo trưởng thành vị cá hồi',155000::bigint,22),
 ('Hạt cho mèo con 500g','Hạt dinh dưỡng cho mèo con',99000::bigint,18),
 ('Pate chó vị bò 400g','Pate mềm vị bò dành cho chó',38000::bigint,30),
 ('Pate chó vị gà 400g','Pate mềm vị gà dành cho chó',38000::bigint,28),
 ('Pate mèo vị cá ngừ 85g','Pate mèo vị cá ngừ',26000::bigint,36),
 ('Pate mèo vị cá hồi 85g','Pate mèo vị cá hồi',27000::bigint,25),
 ('Súp thưởng mèo vị cá ngừ','Súp thưởng cho mèo vị cá ngừ',42000::bigint,26),
 ('Súp thưởng mèo vị gà','Súp thưởng cho mèo vị gà',42000::bigint,23),
 ('Snack que mềm cho chó','Snack thưởng dạng que mềm cho chó',49000::bigint,28),
 ('Bánh thưởng hình xương mini','Bánh thưởng hình xương dành cho chó',52000::bigint,18),
 ('Pudding dinh dưỡng cho mèo','Pudding mềm dành cho mèo',35000::bigint,20),
 ('Combo pate mèo 6 vị','Combo pate cho mèo, sáu hương vị',149000::bigint,12)
) AS v(name,description,price,stock)
WHERE NOT EXISTS (SELECT 1 FROM public.retail_products p WHERE lower(trim(p.name))=lower(trim(v.name)));
COMMIT;
