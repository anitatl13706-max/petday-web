// V6.38: saleable service packages. Keep service names stable because bookings
// store the selected package as TEXT; always validate and price server-side.
export const services = {
  'Grooming vệ sinh nhanh': {base:110000,max:40,species:['Chó','Mèo'],units:1,category:'Grooming',duration:45,description:'Làm sạch bàn chân, chải lông, vệ sinh cơ bản; không bao gồm tắm toàn thân.'},
  'Grooming cơ bản': {base:140000,max:40,species:['Chó','Mèo'],units:1,category:'Grooming',duration:60,description:'Tắm, sấy và vệ sinh cơ bản.'},
  'Grooming toàn diện': {base:180000,max:40,species:['Chó','Mèo'],units:1,category:'Grooming',duration:90,description:'Tắm sấy, vệ sinh và chăm sóc cơ bản toàn diện.'},
  'Grooming tạo kiểu': {base:260000,max:40,species:['Chó','Mèo'],units:2,category:'Grooming',duration:120,description:'Chó được tư vấn tạo kiểu theo giống; mèo được tỉa vệ sinh và chỉnh lông nhẹ khi phù hợp. Nhân viên xác nhận tình trạng lông và mức độ hợp tác trước khi thực hiện.'},
  'Spa dịu nhẹ': {base:190000,max:40,species:['Chó','Mèo'],units:2,category:'Spa',duration:75,description:'Tắm dịu nhẹ và sấy nhẹ theo tình trạng da lông; không phải điều trị da liễu.'},
  'Spa thư giãn': {base:220000,max:40,species:['Chó','Mèo'],units:2,category:'Spa',duration:90,description:'Làm sạch nhẹ nhàng và thư giãn theo tình trạng thú cưng.'},
  'Spa dưỡng lông': {base:280000,max:40,species:['Chó','Mèo'],units:2,category:'Spa',duration:120,description:'Làm sạch và dưỡng lông chuyên sâu.'},
  'Spa phục hồi lông': {base:350000,max:40,species:['Chó','Mèo'],units:2,category:'Spa',duration:150,description:'Gói dưỡng và chăm sóc bộ lông chuyên sâu; không phải điều trị bệnh da.'},
  'Daycare nửa ngày': {base:190000,max:30,species:['Chó','Mèo'],units:1,category:'Daycare',duration:240,description:'Chăm sóc chó và mèo nửa ngày, bố trí khu vực riêng phù hợp.'},
  'Daycare cả ngày': {base:320000,max:30,species:['Chó','Mèo'],units:2,category:'Daycare',duration:480,description:'Chăm sóc chó và mèo trong ngày, tách khu theo loài.'}
};
// Extra care options apply only when not already included in the base service.
// Server owns the price: client submits IDs only, never monetary values.
// PetDay TEST service policy: young puppies require consultation before daycare.
// Daycare policy for the PetDay course demo: dogs and cats must be at least 1 year old.
export const daycareMinimumAgeYears=1;
export const addOns={
 'nail_trim':{label:'Cắt và dũa móng',amount:40000,services:['Spa dưỡng lông','Spa thư giãn','Spa phục hồi lông','Daycare cả ngày','Daycare nửa ngày']},
 'ear_care':{label:'Vệ sinh tai chuyên sâu',amount:35000,services:['Spa dưỡng lông','Spa thư giãn','Spa phục hồi lông','Daycare cả ngày','Daycare nửa ngày']},
 'coat_mask':{label:'Ủ dưỡng lông chuyên sâu',amount:70000,services:['Grooming vệ sinh nhanh','Grooming cơ bản','Grooming toàn diện','Grooming tạo kiểu','Spa dưỡng lông','Spa thư giãn','Spa dịu nhẹ']},
 'daycare_meal':{label:'Suất ăn trong ngày',amount:55000,services:['Daycare cả ngày','Daycare nửa ngày']},
 'paw_moisturize':{label:'Dưỡng ẩm đệm chân',amount:45000,services:['Spa thư giãn','Spa dưỡng lông','Daycare cả ngày','Daycare nửa ngày']},
 'daycare_photo':{label:'Ảnh cập nhật trong ngày',amount:35000,services:['Daycare cả ngày','Daycare nửa ngày']},
 'gentle_brushing':{label:'Chải lông nhẹ theo tình trạng',amount:40000,services:['Daycare cả ngày','Daycare nửa ngày','Spa thư giãn']},
 'teeth_care':{label:'Vệ sinh răng miệng cơ bản',amount:45000,services:['Daycare cả ngày','Daycare nửa ngày','Spa dưỡng lông','Grooming cơ bản','Grooming toàn diện','Grooming tạo kiểu','Grooming vệ sinh nhanh','Spa thư giãn','Spa dịu nhẹ','Spa phục hồi lông']},
 'sanitary_trim':{label:'Tỉa vệ sinh gọn vùng chân và bụng',amount:55000,services:['Grooming cơ bản','Grooming toàn diện','Grooming vệ sinh nhanh','Spa thư giãn','Spa dịu nhẹ']},
 'accessory_bow':{label:'Nơ hoặc khăn cổ sau chăm sóc',amount:25000,services:['Grooming vệ sinh nhanh','Grooming cơ bản','Grooming toàn diện','Grooming tạo kiểu','Spa dịu nhẹ','Spa thư giãn','Spa dưỡng lông','Spa phục hồi lông']},
 'portrait':{label:'Ảnh chân dung sau chăm sóc',amount:40000,services:['Grooming vệ sinh nhanh','Grooming cơ bản','Grooming toàn diện','Grooming tạo kiểu','Spa dịu nhẹ','Spa thư giãn','Spa dưỡng lông','Spa phục hồi lông']},
 'paw_care_plus':{label:'Dưỡng ẩm đệm chân chuyên sâu',amount:55000,services:['Grooming vệ sinh nhanh','Grooming cơ bản','Grooming tạo kiểu','Spa phục hồi lông','Spa dịu nhẹ']},
 'coat_detangle':{label:'Gỡ rối nhẹ theo tình trạng lông',amount:50000,services:['Grooming vệ sinh nhanh','Grooming cơ bản','Spa dịu nhẹ','Daycare cả ngày','Daycare nửa ngày']},
 'private_play':{label:'Vui chơi tương tác riêng 20 phút',amount:55000,services:['Daycare cả ngày','Daycare nửa ngày']},
 'daycare_health_log':{label:'Bản ghi ăn uống và nghỉ ngơi chi tiết',amount:30000,services:['Daycare cả ngày','Daycare nửa ngày']}
};
export function calculateExtras(service,ids=[]){
 if(!Array.isArray(ids)||ids.length>3||new Set(ids).size!==ids.length)throw Error('Danh sách dịch vụ cộng thêm không hợp lệ.');
 const lines=[];let total=0;
 for(const id of ids){const item=addOns[id];if(!item||!item.services.includes(service))throw Error('Dịch vụ cộng thêm không phù hợp gói chính.');lines.push({type:'addon',code:id,label:item.label,amount:item.amount});total+=item.amount;}
 return {lines,total};
}
export const slots={'08:30':3,'10:00':2,'13:30':3,'15:00':2,'17:30':2};
export const transitions={'Đang chờ xác nhận':['Đã xác nhận','Đã hủy'],'Đã xác nhận':['Đang thực hiện','Đã hủy'],'Đang thực hiện':['Hoàn tất'],'Hoàn tất':[],'Đã hủy':[]};
export function calculate(service, pet){const item=services[service];if(!item||!item.species.includes(pet.species)||!Number.isFinite(Number(pet.weight))||Number(pet.weight)<=0||pet.weight>item.max)throw Error('Loài hoặc cân nặng thú cưng không phù hợp dịch vụ.');if(!Number.isFinite(Number(pet.age))||pet.age<0||pet.age>40)throw Error('Tuổi thú cưng không hợp lệ. Vui lòng cập nhật hồ sơ.');if(item.category==='Daycare'&&pet.age<daycareMinimumAgeYears)throw Error('Daycare nhận chó hoặc mèo từ đủ 1 tuổi. Vui lòng chọn dịch vụ khác nếu thú cưng nhỏ hơn.');const weightFee=item.category==='Daycare'?0:pet.weight<=5?0:pet.weight<=10?50000:pet.weight<=20?100000:160000;return {total:item.base+weightFee,lines:[{type:'base',label:service,amount:item.base},{type:'weight',label:'Điều chỉnh cân nặng',amount:weightFee}]};}
export function validSlot(service,slot){return Boolean(slots[slot])&&!(services[service]?.category==='Daycare'&&!['08:30','10:00'].includes(slot))&&!(services[service]?.category==='Spa'&&slot==='17:30');}
export function validFutureDate(date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;const d=new Date(date+'T00:00:00+07:00');const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const [year,month,day]=date.split('-').map(Number);return Number.isFinite(d.getTime())&&new Date(Date.UTC(year,month-1,day)).toISOString().slice(0,10)===date&&date>today;}

/** Availability preview; final booking still checks capacity under transaction lock. */
export function buildDailySlotPreview({service,branch,used={},blocked={}}){
 if(!services[service]||!['PetDay Thảo Điền','PetDay Phú Mỹ Hưng'].includes(branch))throw Error('Invalid service or branch');
 return Object.keys(slots).filter(slot=>validSlot(service,slot)).map(slot=>{
  const cap=branch==='PetDay Phú Mỹ Hưng'?Math.max(2,slots[slot]-1):slots[slot];
  const remaining=Math.max(0,cap-(Number(used[slot])||0));
  const reason=blocked[slot]?'Tạm ngừng nhận lịch: '+blocked[slot]:remaining<services[service].units?'Đã hết chỗ phù hợp':null;
  return {slot,remaining,available:!reason,reason};
 });
}

/** Prevent the same pet from receiving two services with overlapping time windows.
 * Each appointment retains its own capacity, staff and payment state. */
export function servicesOverlap(serviceA,slotA,serviceB,slotB){
 const a=services[serviceA],b=services[serviceB];
 if(!a||!b)return true; // reject unverifiable legacy service conservatively
 const minute=slot=>{const m=/^(\d{2}):(\d{2})$/.exec(String(slot));return m?Number(m[1])*60+Number(m[2]):NaN};
 const x=minute(slotA),y=minute(slotB);
 if(!Number.isFinite(x)||!Number.isFinite(y))return true;
 return x<y+b.duration&&y<x+a.duration;
}
