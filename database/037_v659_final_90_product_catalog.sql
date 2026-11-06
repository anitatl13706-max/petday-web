-- PetDay V6.59 — 90-item curated shop (6 categories x 15)
-- TEST ONLY. Back up PostgreSQL before executing.
-- Prerequisite: core migration 024 and all foundational schema for retail.
-- This script keeps existing products, prices, inventory, prior orders and payment data unchanged.
BEGIN;
ALTER TABLE public.retail_products DROP CONSTRAINT IF EXISTS retail_products_category_check;
ALTER TABLE public.retail_products ADD CONSTRAINT retail_products_category_check CHECK (category IN (
 'Thức ăn & Dinh dưỡng','Tắm & Chăm sóc lông','Vệ sinh & Răng miệng','Đồ chơi & Vận động','Đi dạo & Di chuyển','Dụng cụ ăn uống & Nghỉ ngơi',
 'Thức ăn','Chăm sóc','Vệ sinh','Phụ kiện'));
CREATE TEMP TABLE petday_v659_catalog (name TEXT,category TEXT,description TEXT,price BIGINT,stock INTEGER) ON COMMIT DROP;
INSERT INTO petday_v659_catalog(name,category,description,price,stock) VALUES
('Hạt cho chó trưởng thành vị gà 1kg','Thức ăn & Dinh dưỡng','Hạt khô dành cho chó trưởng thành vị gà',145000::bigint,24),
('Hạt cho chó con vị sữa 500g','Thức ăn & Dinh dưỡng','Hạt dành cho chó con vị sữa',118000::bigint,16),
('Hạt cho chó giống nhỏ 1kg','Thức ăn & Dinh dưỡng','Hạt cho chó giống nhỏ',155000::bigint,19),
('Hạt cho mèo trưởng thành vị cá hồi 1kg','Thức ăn & Dinh dưỡng','Hạt khô dành cho mèo trưởng thành vị cá hồi',155000::bigint,22),
('Hạt cho mèo con 500g','Thức ăn & Dinh dưỡng','Hạt dinh dưỡng cho mèo con',99000::bigint,18),
('Pate chó vị bò 400g','Thức ăn & Dinh dưỡng','Pate mềm vị bò dành cho chó',38000::bigint,30),
('Pate chó vị gà 400g','Thức ăn & Dinh dưỡng','Pate mềm vị gà dành cho chó',38000::bigint,28),
('Pate mèo vị cá ngừ 85g','Thức ăn & Dinh dưỡng','Pate mèo vị cá ngừ',26000::bigint,36),
('Pate mèo vị cá hồi 85g','Thức ăn & Dinh dưỡng','Pate mèo vị cá hồi',27000::bigint,25),
('Súp thưởng mèo vị cá ngừ','Thức ăn & Dinh dưỡng','Súp thưởng cho mèo vị cá ngừ',42000::bigint,26),
('Súp thưởng mèo vị gà','Thức ăn & Dinh dưỡng','Súp thưởng cho mèo vị gà',42000::bigint,23),
('Snack que mềm cho chó','Thức ăn & Dinh dưỡng','Snack thưởng dạng que mềm cho chó',49000::bigint,28),
('Bánh thưởng hình xương mini','Thức ăn & Dinh dưỡng','Bánh thưởng hình xương dành cho chó',52000::bigint,18),
('Pudding dinh dưỡng cho mèo','Thức ăn & Dinh dưỡng','Pudding mềm dành cho mèo',35000::bigint,20),
('Combo pate mèo 6 vị','Thức ăn & Dinh dưỡng','Combo pate cho mèo, sáu hương vị',149000::bigint,12),
('Sữa tắm dịu nhẹ cho chó mèo 300ml','Tắm & Chăm sóc lông','Sữa tắm làm sạch nhẹ nhàng cho chó mèo.',119000::bigint,23),
('Sữa tắm dưỡng lông hương dịu','Tắm & Chăm sóc lông','Sữa tắm chăm sóc lông, hương thơm dịu nhẹ.',139000::bigint,20),
('Sữa tắm cho thú cưng da nhạy cảm','Tắm & Chăm sóc lông','Sữa tắm dịu nhẹ cho thú cưng có làn da nhạy cảm.',149000::bigint,16),
('Dầu xả mượt lông 250ml','Tắm & Chăm sóc lông','Dầu xả giúp lông mềm mượt sau tắm.',125000::bigint,19),
('Dầu xả hỗ trợ gỡ rối','Tắm & Chăm sóc lông','Dầu xả hỗ trợ gỡ rối cho lông dài.',149000::bigint,14),
('Xịt dưỡng lông bóng khỏe','Tắm & Chăm sóc lông','Xịt dưỡng giảm xơ rối và chăm sóc lông.',96000::bigint,18),
('Xịt khử mùi lông thú cưng','Tắm & Chăm sóc lông','Xịt khử mùi sử dụng giữa các lần tắm.',89000::bigint,20),
('Sữa tắm khô dạng bọt','Tắm & Chăm sóc lông','Bọt tắm khô tiện lợi cho thú cưng.',94000::bigint,16),
('Lược chải lông mềm','Tắm & Chăm sóc lông','Lược chải mềm giúp loại bỏ lông rụng.',79000::bigint,22),
('Lược gỡ rối lông dài','Tắm & Chăm sóc lông','Lược hỗ trợ gỡ lông rối và lông dài.',98000::bigint,15),
('Lược chải lông hai mặt','Tắm & Chăm sóc lông','Lược hai mặt chải và chăm sóc lông.',89000::bigint,24),
('Găng tay chải lông silicon','Tắm & Chăm sóc lông','Găng tay silicon hỗ trợ gom lông rụng.',65000::bigint,18),
('Bàn chải massage khi tắm','Tắm & Chăm sóc lông','Dụng cụ massage nhẹ nhàng khi tắm.',69000::bigint,20),
('Kìm cắt móng thú cưng','Tắm & Chăm sóc lông','Kìm cắt móng có tay cầm chắc chắn.',69000::bigint,17),
('Khăn tắm siêu thấm','Tắm & Chăm sóc lông','Khăn mềm, hút nước tốt sau khi tắm.',99000::bigint,22),
('Cát vệ sinh mèo vón cục 5L','Vệ sinh & Răng miệng','Sản phẩm minh họa dành cho thú cưng.',49000::bigint,15),
('Cát vệ sinh mèo ít bụi 5L','Vệ sinh & Răng miệng','Sản phẩm minh họa dành cho thú cưng.',59000::bigint,16),
('Khay vệ sinh mèo thành cao','Vệ sinh & Răng miệng','Sản phẩm minh họa dành cho thú cưng.',69000::bigint,17),
('Xẻng xúc cát mèo','Vệ sinh & Răng miệng','Sản phẩm minh họa dành cho thú cưng.',79000::bigint,18),
('Tấm lót vệ sinh 10 miếng','Vệ sinh & Răng miệng','Sản phẩm minh họa dành cho thú cưng.',89000::bigint,19),
('Tấm lót vệ sinh 50 miếng','Vệ sinh & Răng miệng','Sản phẩm minh họa dành cho thú cưng.',99000::bigint,20),
('Túi đựng phân cuộn đôi','Vệ sinh & Răng miệng','Sản phẩm minh họa dành cho thú cưng.',109000::bigint,21),
('Túi phân phân hủy sinh học','Vệ sinh & Răng miệng','Sản phẩm minh họa dành cho thú cưng.',119000::bigint,22),
('Khăn ướt vệ sinh không mùi','Vệ sinh & Răng miệng','Sản phẩm minh họa dành cho thú cưng.',49000::bigint,23),
('Khăn ướt vệ sinh tai mắt','Vệ sinh & Răng miệng','Sản phẩm minh họa dành cho thú cưng.',59000::bigint,24),
('Dung dịch lau chân sau đi dạo','Vệ sinh & Răng miệng','Sản phẩm minh họa dành cho thú cưng.',69000::bigint,25),
('Xịt khử mùi khay vệ sinh','Vệ sinh & Răng miệng','Sản phẩm minh họa dành cho thú cưng.',79000::bigint,26),
('Bàn chải đánh răng thú cưng','Vệ sinh & Răng miệng','Sản phẩm minh họa dành cho thú cưng.',89000::bigint,27),
('Kem đánh răng thú cưng vị sữa','Vệ sinh & Răng miệng','Sản phẩm minh họa dành cho thú cưng.',99000::bigint,28),
('Bộ bàn chải và kem đánh răng','Vệ sinh & Răng miệng','Sản phẩm minh họa dành cho thú cưng.',109000::bigint,29),
('Bóng cao su tương tác','Đồ chơi & Vận động','Sản phẩm minh họa dành cho thú cưng.',49000::bigint,15),
('Bóng phát tiếng cho chó','Đồ chơi & Vận động','Sản phẩm minh họa dành cho thú cưng.',59000::bigint,16),
('Bóng gai massage nướu','Đồ chơi & Vận động','Sản phẩm minh họa dành cho thú cưng.',69000::bigint,17),
('Đồ chơi gặm hình xương','Đồ chơi & Vận động','Sản phẩm minh họa dành cho thú cưng.',79000::bigint,18),
('Dây thừng kéo co','Đồ chơi & Vận động','Sản phẩm minh họa dành cho thú cưng.',89000::bigint,19),
('Thú bông hình vịt','Đồ chơi & Vận động','Sản phẩm minh họa dành cho thú cưng.',99000::bigint,20),
('Thú bông hình gấu','Đồ chơi & Vận động','Sản phẩm minh họa dành cho thú cưng.',109000::bigint,21),
('Đồ chơi phát thưởng','Đồ chơi & Vận động','Sản phẩm minh họa dành cho thú cưng.',119000::bigint,22),
('Đĩa bay silicon cho chó','Đồ chơi & Vận động','Sản phẩm minh họa dành cho thú cưng.',49000::bigint,23),
('Cần câu lông cho mèo','Đồ chơi & Vận động','Sản phẩm minh họa dành cho thú cưng.',59000::bigint,24),
('Cần câu gắn chuông cho mèo','Đồ chơi & Vận động','Sản phẩm minh họa dành cho thú cưng.',69000::bigint,25),
('Bóng chuông nhiều màu','Đồ chơi & Vận động','Sản phẩm minh họa dành cho thú cưng.',79000::bigint,26),
('Chuột bông đồ chơi cho mèo','Đồ chơi & Vận động','Sản phẩm minh họa dành cho thú cưng.',89000::bigint,27),
('Đồ chơi lò xo cho mèo','Đồ chơi & Vận động','Sản phẩm minh họa dành cho thú cưng.',99000::bigint,28),
('Bàn cào móng mèo mini','Đồ chơi & Vận động','Sản phẩm minh họa dành cho thú cưng.',109000::bigint,29),
('Dây dắt chó cơ bản 1,5m','Đi dạo & Di chuyển','Dây nylon mềm, móc kim loại, dài 1,5m.',75000::bigint,22),
('Dây dắt phản quang','Đi dạo & Di chuyển','Dây dắt có dải phản quang để đi dạo buổi tối.',89000::bigint,23),
('Dây dắt tự rút 3m','Đi dạo & Di chuyển','Dây tự thu, nút khóa điều chỉnh độ dài.',135000::bigint,18),
('Vòng cổ size S','Đi dạo & Di chuyển','Vòng cổ điều chỉnh được cho thú cưng cỡ nhỏ.',59000::bigint,25),
('Vòng cổ size M','Đi dạo & Di chuyển','Vòng cổ điều chỉnh được cho thú cưng cỡ vừa.',69000::bigint,22),
('Yếm ngực điều chỉnh size','Đi dạo & Di chuyển','Yếm ngực có khóa và dây điều chỉnh.',99000::bigint,20),
('Yếm ngực chống kéo','Đi dạo & Di chuyển','Yếm ngực hỗ trợ phân bố lực khi dắt chó.',119000::bigint,18),
('Bình nước du lịch','Đi dạo & Di chuyển','Bình uống nước cho thú cưng khi đi dạo.',99000::bigint,19),
('Bát nước gấp gọn','Đi dạo & Di chuyển','Bát silicon có thể gấp lại và móc vào túi.',69000::bigint,22),
('Túi đựng đồ đi spa','Đi dạo & Di chuyển','Túi đựng khăn, bàn chải và đồ dùng cá nhân.',149000::bigint,15),
('Túi vận chuyển size S','Đi dạo & Di chuyển','Túi vận chuyển thông thoáng cho thú cưng nhỏ.',199000::bigint,12),
('Túi vận chuyển size M','Đi dạo & Di chuyển','Túi vận chuyển size vừa, có lưới thông gió.',249000::bigint,10),
('Balo phi hành gia cho mèo','Đi dạo & Di chuyển','Balo cửa trong suốt và lỗ thông khí.',259000::bigint,12),
('Balo vận chuyển thoáng khí','Đi dạo & Di chuyển','Balo có lưới thông gió cho thú cưng.',259000::bigint,10),
('Đai an toàn thú cưng trên ô tô','Đi dạo & Di chuyển','Đai gài dây an toàn ô tô kết hợp móc khóa.',79000::bigint,16),
('Bát inox chống trượt','Dụng cụ ăn uống & Nghỉ ngơi','Bát inox đáy chống trượt, dễ vệ sinh.',79000::bigint,28),
('Bát nhựa chống trượt','Dụng cụ ăn uống & Nghỉ ngơi','Bát nhựa nhẹ có đế chống trượt.',49000::bigint,30),
('Bát sứ cho mèo','Dụng cụ ăn uống & Nghỉ ngơi','Bát sứ hình mèo, phù hợp với thức ăn khô và ướt.',89000::bigint,26),
('Bát ăn chậm cho chó','Dụng cụ ăn uống & Nghỉ ngơi','Bát thiết kế gờ nổi giúp chó ăn chậm hơn.',139000::bigint,24),
('Khay ăn đôi','Dụng cụ ăn uống & Nghỉ ngơi','Khay hai bát inox có đế chống trượt.',169000::bigint,20),
('Thảm lót bát ăn chống nước','Dụng cụ ăn uống & Nghỉ ngơi','Thảm lót chống thấm hạn chế nước và vụn thức ăn.',59000::bigint,28),
('Bình nước tự động','Dụng cụ ăn uống & Nghỉ ngơi','Bình nước tuần hoàn dành cho thú cưng.',259000::bigint,18),
('Máy cho ăn tự động','Dụng cụ ăn uống & Nghỉ ngơi','Máy cho ăn tự động theo lượng thức ăn cài đặt.',889000::bigint,16),
('Hộp đựng thức ăn kín khí','Dụng cụ ăn uống & Nghỉ ngơi','Hộp bảo quản hạt khô và chống ẩm.',129000::bigint,25),
('Muỗng đong thức ăn','Dụng cụ ăn uống & Nghỉ ngơi','Muỗng chia khẩu phần hạt khô.',29000::bigint,32),
('Đệm nằm thú cưng size S','Dụng cụ ăn uống & Nghỉ ngơi','Đệm nằm mềm phù hợp thú cưng nhỏ.',199000::bigint,18),
('Đệm nằm thú cưng size M','Dụng cụ ăn uống & Nghỉ ngơi','Đệm nằm có thành mềm cho thú cưng cỡ vừa.',259000::bigint,20),
('Nệm tròn lông mềm','Dụng cụ ăn uống & Nghỉ ngơi','Nệm tròn êm, dễ cuộn tròn nghỉ ngơi.',299000::bigint,18),
('Nhà ngủ vải gấp gọn','Dụng cụ ăn uống & Nghỉ ngơi','Nhà ngủ bằng vải, dễ gấp gọn và vệ sinh.',349000::bigint,17),
('Chăn mềm cho chó mèo','Dụng cụ ăn uống & Nghỉ ngơi','Chăn mềm giữ ấm và lót chỗ nằm cho chó mèo.',119000::bigint,30);
-- Insert only products not already present (case-insensitive). No overwrites.
INSERT INTO public.retail_products(name,category,description,price,stock)
SELECT v.name,v.category,v.description,v.price,v.stock FROM petday_v659_catalog v
WHERE NOT EXISTS(SELECT 1 FROM public.retail_products p WHERE lower(trim(p.name))=lower(trim(v.name)));
-- Correct category on canonical rows only. Do not touch price, stock, existing orders or noncanonical entries.
UPDATE public.retail_products p SET category=v.category,updated_at=now()
FROM petday_v659_catalog v WHERE lower(trim(p.name))=lower(trim(v.name)) AND p.category IS DISTINCT FROM v.category;
COMMIT;
-- Verify: each canonical group should have at least 15 distinct matching names.
SELECT category,COUNT(DISTINCT lower(trim(name))) AS products_in_database
FROM public.retail_products WHERE category IN (
 'Thức ăn & Dinh dưỡng','Tắm & Chăm sóc lông','Vệ sinh & Răng miệng','Đồ chơi & Vận động','Đi dạo & Di chuyển','Dụng cụ ăn uống & Nghỉ ngơi')
GROUP BY category ORDER BY category;
