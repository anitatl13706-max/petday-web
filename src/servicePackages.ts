/** V6.38 bookable packages, synchronized with server/src/rules.js. */
export const servicePackages = [
 {name:'Grooming vệ sinh nhanh',category:'Grooming',price:110000,duration:45,species:['Chó','Mèo'],description:'Vệ sinh bàn chân, chải lông, lau sạch nhẹ nhàng; không bao gồm tắm toàn thân.',icon:'🐾'},
 {name:'Grooming cơ bản',category:'Grooming',price:140000,duration:60,species:['Chó','Mèo'],description:'Tắm sạch, sấy khô, chải lông và vệ sinh tai – móng cơ bản.',icon:'🫧'},
 {name:'Grooming toàn diện',category:'Grooming',price:180000,duration:90,species:['Chó','Mèo'],description:'Tắm sấy, chải gỡ lông rối nhẹ, vệ sinh tai – móng và chăm sóc bàn chân.',icon:'🛁'},
 {name:'Grooming tạo kiểu',category:'Grooming',price:260000,duration:120,species:['Chó','Mèo'],description:'Chó: cắt tỉa tạo kiểu theo giống và dáng lông. Mèo: tỉa vệ sinh, gọn lông nhẹ theo tình trạng; nhân viên đánh giá trước khi thực hiện.',icon:'✂️'},
 {name:'Spa dịu nhẹ',category:'Spa',price:190000,duration:75,species:['Chó','Mèo'],description:'Làm sạch dịu nhẹ phù hợp tình trạng da lông; không thay thế dịch vụ thú y.',icon:'🫧'},
 {name:'Spa thư giãn',category:'Spa',price:220000,duration:90,species:['Chó','Mèo'],description:'Tắm dịu nhẹ, massage thư giãn, sấy và chải lông theo tình trạng thực tế.',icon:'🌿'},
 {name:'Spa dưỡng lông',category:'Spa',price:280000,duration:120,species:['Chó','Mèo'],description:'Tắm, dưỡng lông, gỡ rối nhẹ và sấy tạo độ bồng; kiểm tra tình trạng lông trước khi làm.',icon:'✨'},
 {name:'Spa phục hồi lông',category:'Spa',price:350000,duration:150,species:['Chó','Mèo'],description:'Gói dưỡng lông chuyên sâu, chăm sóc vùng lông khô xơ; không thay thế điều trị thú y.',icon:'💎'},
 {name:'Daycare nửa ngày',category:'Daycare',price:190000,duration:240,species:['Chó','Mèo'],description:'Chăm sóc chó hoặc mèo trong nửa ngày, bố trí khu vực phù hợp từng loài.',icon:'🐾'},
 {name:'Daycare cả ngày',category:'Daycare',price:320000,duration:480,species:['Chó','Mèo'],description:'Trông giữ chó hoặc mèo trong ngày; khu vực sinh hoạt theo loài và tính cách.',icon:'🐕'}
] as const;
export const hasBookableService=(name:string)=>servicePackages.some(x=>x.name===name);
