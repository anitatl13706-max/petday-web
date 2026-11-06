-- TÙY CHỌN: dữ liệu minh họa, không phải hàng đã xác minh hoặc tồn kho thật.
-- Sao lưu PostgreSQL trước khi chạy. Chạy sau migration 024, không xóa hàng hiện có.
BEGIN;
INSERT INTO public.retail_products(name,category,description,price,stock)
SELECT v.name,v.category,v.description,v.price,v.stock FROM (VALUES
('Sữa tắm dịu nhẹ cho chó mèo','Chăm sóc','Chai dung tích nhỏ dùng vệ sinh da lông thông thường',119000::bigint,16),
('Xịt khử mùi lông thú cưng','Chăm sóc','Hỗ trợ chăm sóc lông sau khi đi dạo',89000::bigint,14),
('Lược gỡ rối lông','Chăm sóc','Dụng cụ gỡ rối nhẹ nhàng cho thú cưng',99000::bigint,9),
('Bàn chải đánh răng thú cưng','Chăm sóc','Bàn chải mềm chăm sóc răng miệng tại nhà',49000::bigint,20),
('Túi đựng phân thú cưng','Vệ sinh','Cuộn túi tiện lợi khi dắt chó đi dạo',39000::bigint,30),
('Tấm lót vệ sinh chó','Vệ sinh','Gói tấm lót thấm hút dùng tại nhà',115000::bigint,17),
('Cát vệ sinh mèo','Vệ sinh','Túi cát vệ sinh dùng cho khay cát',135000::bigint,12),
('Xẻng xúc cát mèo','Vệ sinh','Xẻng nhựa vệ sinh khay cát',35000::bigint,18),
('Dây dắt chó có khóa','Phụ kiện','Dây dắt sử dụng khi ra ngoài',129000::bigint,15),
('Vòng cổ điều chỉnh','Phụ kiện','Vòng cổ điều chỉnh theo kích cỡ',75000::bigint,13),
('Bóng đồ chơi thú cưng','Phụ kiện','Đồ chơi tương tác với thú cưng',55000::bigint,15),
('Bình nước du lịch','Phụ kiện','Bình uống nước gọn nhẹ khi ra ngoài',129000::bigint,8)
) AS v(name,category,description,price,stock)
WHERE NOT EXISTS (SELECT 1 FROM public.retail_products p WHERE p.name=v.name);
COMMIT;
