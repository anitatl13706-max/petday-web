-- PetDay V6.54: 15 grooming items, optional for PostgreSQL TEST. BACK UP FIRST.
-- Does not delete existing SKUs or overwrite existing price/stock.
BEGIN;
INSERT INTO public.retail_products(name,category,description,price,stock)
SELECT v.name,v.category,v.description,v.price,v.stock FROM (VALUES
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
('Khăn tắm siêu thấm','Tắm & Chăm sóc lông','Khăn mềm, hút nước tốt sau khi tắm.',99000::bigint,22)
) AS v(name,category,description,price,stock)
WHERE NOT EXISTS (SELECT 1 FROM public.retail_products p WHERE lower(trim(p.name))=lower(trim(v.name)));
COMMIT;
