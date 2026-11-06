-- PetDay V6.57: OPTIONAL catalog for Dụng cụ ăn uống & Nghỉ ngơi (PostgreSQL TEST only).
-- Back up before running. Requires previous category schema migration 032.
-- Product photos appear WITHOUT running this SQL. This seed does not overwrite existing prices, stock or orders.
BEGIN;
INSERT INTO public.retail_products(name,category,description,price,stock)
SELECT v.name,'Dụng cụ ăn uống & Nghỉ ngơi',v.description,v.price,v.stock FROM (VALUES
('Bát inox chống trượt','Bát inox đáy chống trượt, dễ vệ sinh.',79000::bigint,28),
('Bát nhựa chống trượt','Bát nhựa nhẹ có đế chống trượt.',49000::bigint,30),
('Bát sứ cho mèo','Bát sứ hình mèo, phù hợp với thức ăn khô và ướt.',89000::bigint,26),
('Bát ăn chậm cho chó','Bát thiết kế gờ nổi giúp chó ăn chậm hơn.',139000::bigint,24),
('Khay ăn đôi','Khay hai bát inox có đế chống trượt.',169000::bigint,20),
('Thảm lót bát ăn chống nước','Thảm lót chống thấm hạn chế nước và vụn thức ăn.',59000::bigint,28),
('Bình nước tự động','Bình nước tuần hoàn dành cho thú cưng.',259000::bigint,18),
('Máy cho ăn tự động','Máy cho ăn tự động theo lượng thức ăn cài đặt.',889000::bigint,16),
('Hộp đựng thức ăn kín khí','Hộp bảo quản hạt khô và chống ẩm.',129000::bigint,25),
('Muỗng đong thức ăn','Muỗng chia khẩu phần hạt khô.',29000::bigint,32),
('Đệm nằm thú cưng size S','Đệm nằm mềm phù hợp thú cưng nhỏ.',199000::bigint,18),
('Đệm nằm thú cưng size M','Đệm nằm có thành mềm cho thú cưng cỡ vừa.',259000::bigint,20),
('Nệm tròn lông mềm','Nệm tròn êm, dễ cuộn tròn nghỉ ngơi.',299000::bigint,18),
('Nhà ngủ vải gấp gọn','Nhà ngủ bằng vải, dễ gấp gọn và vệ sinh.',349000::bigint,17),
('Chăn mềm cho chó mèo','Chăn mềm giữ ấm và lót chỗ nằm cho chó mèo.',119000::bigint,30)
) AS v(name,description,price,stock)
WHERE NOT EXISTS (SELECT 1 FROM public.retail_products p WHERE lower(trim(p.name))=lower(trim(v.name)));
COMMIT;
