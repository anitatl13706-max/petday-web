-- TUY CHON - Chay sau khi sao luu PostgreSQL TEST.
-- Seed V6.48 phan loai nham 5 san pham thuc an vao Chăm sóc.
-- Cap nhat DANH MUC, KHONG chinh gia/ton kho/don hang.
BEGIN;
UPDATE public.retail_products
SET category='Thức ăn', updated_at=now()
WHERE category='Chăm sóc'
  AND name IN (
    'Pate mềm cho mèo vị gà',
    'Hạt dinh dưỡng cho mèo trưởng thành 1kg',
    'Hạt dinh dưỡng cho chó trưởng thành 1kg',
    'Súp thưởng cho mèo vị cá',
    'Bánh thưởng huấn luyện chó'
  );
COMMIT;
