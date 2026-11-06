/** V6.38 bookable packages, synchronized with server/src/rules.js. */
export const servicePackages = [
 {name:'Grooming cơ bản',category:'Grooming',price:140000,duration:60,species:['Chó','Mèo'],description:'Tắm sạch, sấy khô, chải lông và vệ sinh tai – móng cơ bản.',icon:'🫧'},
 {name:'Grooming toàn diện',category:'Grooming',price:180000,duration:90,species:['Chó','Mèo'],description:'Tắm sấy, chải gỡ lông rối nhẹ, vệ sinh tai – móng và chăm sóc bàn chân.',icon:'🛁'},
 {name:'Grooming tạo kiểu',category:'Grooming',price:260000,duration:120,species:['Chó'],description:'Cắt tỉa và tạo kiểu theo giống, dáng lông; tư vấn kiểu trước khi thực hiện.',icon:'✂️'},
 {name:'Spa thư giãn',category:'Spa',price:220000,duration:90,species:['Chó','Mèo'],description:'Tắm dịu nhẹ, massage thư giãn, sấy và chải lông theo tình trạng thực tế.',icon:'🌿'},
 {name:'Spa dưỡng lông',category:'Spa',price:280000,duration:120,species:['Chó','Mèo'],description:'Tắm, dưỡng lông, gỡ rối nhẹ và sấy tạo độ bồng; kiểm tra tình trạng lông trước khi làm.',icon:'✨'},
 {name:'Spa phục hồi lông',category:'Spa',price:350000,duration:150,species:['Chó','Mèo'],description:'Gói dưỡng lông chuyên sâu, chăm sóc vùng lông khô xơ; không thay thế điều trị thú y.',icon:'💎'},
 {name:'Daycare nửa ngày',category:'Daycare',price:190000,duration:240,species:['Chó'],description:'Chăm sóc và giám sát chó trong nửa ngày, có giờ nghỉ và hoạt động phù hợp.',icon:'🐾'},
 {name:'Daycare cả ngày',category:'Daycare',price:320000,duration:480,species:['Chó'],description:'Trông giữ chó trong ngày, giám sát, hoạt động nhẹ và nghỉ ngơi theo lịch.',icon:'🐕'}
] as const;
export const hasBookableService=(name:string)=>servicePackages.some(x=>x.name===name);
