-- V6.48 - DỮ LIỆU MẪU TÙY CHỌN, KHÔNG PHẢI TỒN KHO THỰC TẾ.
-- Yêu cầu bảng retail_products từ 024. Chạy trên TEST sau khi sao lưu. Idempotent theo tên.
-- Nên chạy 028 trước, sau đó 029. Không sửa giá/tồn kho các dòng đã tồn tại.
BEGIN;
INSERT INTO public.retail_products(name,category,description,price,stock)
SELECT v.name,v.category,v.description,v.price,v.stock FROM (VALUES
('Pate mềm cho mèo vị gà','Chăm sóc','Pate dạng mềm; tham khảo thành phần trước khi dùng',29000::bigint,48),
('Hạt dinh dưỡng cho mèo trưởng thành 1kg','Chăm sóc','Thức ăn khô cho mèo trưởng thành',169000::bigint,18),
('Hạt dinh dưỡng cho chó trưởng thành 1kg','Chăm sóc','Thức ăn khô cho chó trưởng thành',159000::bigint,21),
('Súp thưởng cho mèo vị cá','Chăm sóc','Gói súp thưởng cho mèo',35000::bigint,35),
('Bánh thưởng huấn luyện chó','Chăm sóc','Bánh thưởng kích thước nhỏ',75000::bigint,19),
('Sữa tắm dưỡng lông hương dịu','Chăm sóc','Sữa tắm chăm sóc lông chó mèo',139000::bigint,17),
('Dầu xả gỡ rối lông','Chăm sóc','Dầu xả hỗ trợ gỡ rối sau tắm',149000::bigint,12),
('Lược chải lông hai mặt','Chăm sóc','Lược chải lông tiện dụng tại nhà',89000::bigint,24),
('Bàn chải massage tắm thú cưng','Chăm sóc','Dụng cụ massage khi tắm',69000::bigint,20),
('Khăn tắm siêu thấm','Chăm sóc','Khăn hút nước dùng sau tắm',99000::bigint,22),
('Dung dịch vệ sinh tai thú cưng','Vệ sinh','Vệ sinh tai theo hướng dẫn sử dụng',119000::bigint,16),
('Bàn chải và kem đánh răng thú cưng','Vệ sinh','Bộ dụng cụ vệ sinh răng miệng',129000::bigint,14),
('Khăn ướt vệ sinh không mùi','Vệ sinh','Khăn lau nhanh chân và thân thú cưng',59000::bigint,33),
('Túi cuộn đựng phân phân hủy sinh học','Vệ sinh','Túi dùng khi đi dạo',49000::bigint,26),
('Khay vệ sinh mèo thành cao','Vệ sinh','Khay cát có thành chắn',185000::bigint,13),
('Xẻng xúc cát lỗ lọc','Vệ sinh','Xẻng lọc cát thuận tiện',39000::bigint,30),
('Tấm lót vệ sinh 50 miếng','Vệ sinh','Tấm lót thấm hút cho chó',175000::bigint,14),
('Cát vệ sinh mèo ít bụi 5L','Vệ sinh','Cát vệ sinh dùng trong khay',145000::bigint,25),
('Lót khay vệ sinh dễ thay','Vệ sinh','Túi lót dùng cho khay vệ sinh',65000::bigint,23),
('Bóng cao su tương tác','Phụ kiện','Bóng đồ chơi cho chó',59000::bigint,35),
('Cần câu đồ chơi cho mèo','Phụ kiện','Đồ chơi tương tác cùng mèo',49000::bigint,34),
('Đồ chơi gặm hình xương','Phụ kiện','Đồ chơi gặm dành cho chó',79000::bigint,18),
('Vòng cổ phản quang','Phụ kiện','Vòng cổ có thể điều chỉnh',89000::bigint,20),
('Dây dắt có tay cầm êm','Phụ kiện','Dây dắt dùng khi đi dạo',129000::bigint,17),
('Yếm ngực điều chỉnh size','Phụ kiện','Yếm ngực cho thú cưng',179000::bigint,14),
('Bát inox chống trượt','Phụ kiện','Bát ăn cho chó mèo',85000::bigint,21),
('Bình nước cầm tay đi dạo','Phụ kiện','Bình nước tiện mang theo',119000::bigint,18),
('Đệm nằm thú cưng cỡ nhỏ','Phụ kiện','Đệm nằm dễ vệ sinh',249000::bigint,11),
('Balo vận chuyển thú cưng','Phụ kiện','Balo vận chuyển có lỗ thoáng',389000::bigint,8),
('Túi đựng đồ dùng khi đi spa','Phụ kiện','Túi phụ kiện mang đến PetDay',99000::bigint,12)
) AS v(name,category,description,price,stock)
WHERE NOT EXISTS (SELECT 1 FROM public.retail_products p WHERE p.name=v.name);
COMMIT;
