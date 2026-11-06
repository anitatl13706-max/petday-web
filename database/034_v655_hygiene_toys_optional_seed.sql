-- V6.55 optional: Add 15 hygiene and 15 toys catalog entries if missing.
-- BACKUP PostgreSQL TEST before running. Does not delete or overwrite existing products.
BEGIN;
INSERT INTO public.retail_products(name,category,description,price,stock)
SELECT v.name,v.category,v.description,v.price,v.stock FROM (VALUES
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
('Bàn cào móng mèo mini','Đồ chơi & Vận động','Sản phẩm minh họa dành cho thú cưng.',109000::bigint,29)
) AS v(name,category,description,price,stock)
WHERE NOT EXISTS (SELECT 1 FROM public.retail_products p WHERE lower(trim(p.name))=lower(trim(v.name)));
COMMIT;
