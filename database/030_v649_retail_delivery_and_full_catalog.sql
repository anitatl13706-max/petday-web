-- PetDay V6.49
-- Mục tiêu:
-- 1) Mở rộng retail_orders để hỗ trợ giao tận nhà.
-- 2) Bổ sung catalog sản phẩm phong phú hơn, giúp mỗi nhóm có khoảng 10 sản phẩm.
-- File này an toàn để chạy bổ sung trên TEST sau khi sao lưu.
BEGIN;

-- V6.41 giới hạn 3 danh mục; V6.49 thêm nhóm 'Thức ăn'.
-- Thay đổi constraint một cách có kiểm soát, không sửa/xóa dữ liệu đang có.
ALTER TABLE public.retail_products DROP CONSTRAINT IF EXISTS retail_products_category_check;
ALTER TABLE public.retail_products
 ADD CONSTRAINT retail_products_category_check CHECK (category IN ('Thức ăn','Vệ sinh','Chăm sóc','Phụ kiện'));

ALTER TABLE public.retail_orders
  ADD COLUMN IF NOT EXISTS fulfillment_method TEXT NOT NULL DEFAULT 'pickup'
    CHECK (fulfillment_method IN ('pickup','delivery')),
  ADD COLUMN IF NOT EXISTS delivery_zone TEXT
    CHECK (delivery_zone IN ('inner_hcm','outer_hcm')),
  ADD COLUMN IF NOT EXISTS receiver_name TEXT,
  ADD COLUMN IF NOT EXISTS receiver_phone TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_note TEXT,
  ADD COLUMN IF NOT EXISTS delivery_fee BIGINT NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0);

UPDATE public.retail_orders
SET delivery_note = ''
WHERE delivery_note IS NULL;

INSERT INTO public.retail_products(name,category,description,price,stock)
SELECT v.name,v.category,v.description,v.price,v.stock
FROM (VALUES
-- THỨC ĂN
('Hạt dinh dưỡng cho chó vị gà 1kg','Thức ăn','Hạt khô cho chó trưởng thành, vị gà dễ ăn',145000::bigint,24),
('Hạt dinh dưỡng cho mèo cá hồi 1kg','Thức ăn','Hạt khô cho mèo, bổ sung omega và taurine',155000::bigint,22),
('Pate chó vị bò 400g','Thức ăn','Pate mềm cho chó, phù hợp đổi bữa',38000::bigint,30),
('Pate mèo cá ngừ 85g','Thức ăn','Pate cá ngừ mềm thơm cho mèo',26000::bigint,36),
('Snack thưởng chó que mềm','Thức ăn','Bánh thưởng khi huấn luyện hoặc chơi cùng thú cưng',49000::bigint,28),
('Súp thưởng cho mèo vị cá ngừ','Thức ăn','Súp thưởng dạng thanh, dễ dùng hằng ngày',42000::bigint,26),
('Bánh quy xương mini cho chó','Thức ăn','Bánh thưởng giòn, hỗ trợ vui chơi và huấn luyện',52000::bigint,18),
('Pudding dinh dưỡng cho mèo','Thức ăn','Thức ăn thưởng mềm mịn cho mèo kén ăn',35000::bigint,20),
('Hạt sữa cho chó con 500g','Thức ăn','Hạt mềm cho chó con, dễ nhai và hấp thu',118000::bigint,16),
('Combo pate mix 6 vị cho mèo','Thức ăn','Set 6 gói pate nhiều vị cho mèo đổi bữa',149000::bigint,12),

-- CHĂM SÓC
('Sữa tắm dịu nhẹ cho chó mèo 300ml','Chăm sóc','Làm sạch nhẹ nhàng, phù hợp da nhạy cảm',119000::bigint,18),
('Dầu xả mượt lông 250ml','Chăm sóc','Giúp lông mềm mượt và dễ chải sau tắm',125000::bigint,14),
('Xịt khử mùi lông thú cưng','Chăm sóc','Khử mùi nhanh giữa các lần grooming',89000::bigint,20),
('Bàn chải đánh răng thú cưng','Chăm sóc','Dụng cụ chăm sóc răng miệng tại nhà',45000::bigint,22),
('Kem đánh răng thú cưng vị sữa','Chăm sóc','Hỗ trợ vệ sinh răng miệng, mùi vị dễ chịu',52000::bigint,19),
('Kìm cắt móng an toàn','Chăm sóc','Cắt móng tại nhà với đầu chặn bảo vệ',69000::bigint,17),
('Lược gỡ rối lông dài','Chăm sóc','Dùng cho chó mèo lông dài hoặc lông rối',98000::bigint,15),
('Khăn tắm siêu thấm cho thú cưng','Chăm sóc','Khăn mềm, hút nước tốt sau khi tắm',79000::bigint,21),
('Xịt dưỡng lông bóng khỏe','Chăm sóc','Giúp lông mềm và hạn chế xơ rối',96000::bigint,13),
('Găng tay chải lông silicon','Chăm sóc','Chải lông thư giãn, dễ gom lông rụng',65000::bigint,18),

-- VỆ SINH
('Tấm lót vệ sinh than hoạt tính 10 miếng','Vệ sinh','Tấm lót chống thấm và hạn chế mùi',85000::bigint,25),
('Túi đựng phân cuộn đôi','Vệ sinh','Dùng khi dắt chó đi dạo ngoài trời',35000::bigint,35),
('Dung dịch lau chân sau đi dạo','Vệ sinh','Làm sạch nhanh chân và bụng dưới',72000::bigint,18),
('Bọt vệ sinh khô cho mèo','Vệ sinh','Vệ sinh nhanh không cần xả nước',94000::bigint,14),
('Cát vệ sinh vón cục 5L','Vệ sinh','Cát hạt mịn, khử mùi cơ bản cho mèo',110000::bigint,20),
('Xẻng xúc cát mèo','Vệ sinh','Dùng vệ sinh khay cát hằng ngày',29000::bigint,24),
('Xịt khử mùi khay vệ sinh','Vệ sinh','Giảm mùi khu vực toilet thú cưng',79000::bigint,16),
('Khăn ướt vệ sinh tai mắt','Vệ sinh','Khăn dùng một lần cho vùng tai và mắt',48000::bigint,23),
('Nước rửa bát ăn thú cưng 500ml','Vệ sinh','Làm sạch khay ăn và phụ kiện',59000::bigint,15),
('Bộ lót vệ sinh du lịch mini','Vệ sinh','Tiện mang theo khi di chuyển ngắn ngày',68000::bigint,12),

-- PHỤ KIỆN
('Dây dắt phản quang cho chó','Phụ kiện','Dây dắt chắc chắn, có phản quang an toàn',129000::bigint,14),
('Vòng cổ size S cho chó mèo','Phụ kiện','Vòng cổ mềm nhẹ cho thú cưng cỡ nhỏ',69000::bigint,20),
('Đồ chơi bóng phát tiếng','Phụ kiện','Bóng đồ chơi tạo âm thanh nhẹ khi cắn',59000::bigint,18),
('Cần câu lông cho mèo','Phụ kiện','Đồ chơi tương tác giúp mèo vận động',49000::bigint,22),
('Bát ăn chống trượt','Phụ kiện','Bát đáy chống trượt, dùng cho chó mèo',85000::bigint,19),
('Bình nước du lịch cho thú cưng','Phụ kiện','Bình nước cầm tay khi ra ngoài',115000::bigint,15),
('Túi vận chuyển thú cưng size M','Phụ kiện','Túi xách thoáng khí cho thú cưng nhỏ',259000::bigint,9),
('Nệm nằm êm cho chó mèo','Phụ kiện','Đệm nằm mềm phù hợp nghỉ ngơi trong nhà',219000::bigint,8),
('Nhà ngủ vải gấp gọn','Phụ kiện','Nhà vải êm, dễ tháo giặt và cất gọn',269000::bigint,6),
('Balo phi hành gia cho mèo','Phụ kiện','Balo vận chuyển có cửa trong suốt',329000::bigint,7)
) AS v(name,category,description,price,stock)
WHERE NOT EXISTS (SELECT 1 FROM public.retail_products p WHERE p.name=v.name);

COMMIT;
