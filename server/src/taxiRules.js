// A fixed-price pickup request, NOT a real-time route quotation.
// The selected service area is subject to manual availability confirmation by Admin.
export const taxiTariffs = Object.freeze({
  nearby: {label:'Khu vực gần cơ sở (ước tính)',fee:70000},
  extended: {label:'Khu vực mở rộng (ước tính)',fee:120000},
});
export function taxiQuote(taxi){
  if(!taxi || !taxi.enabled)return {fee:0,line:null};
  const tariff=taxiTariffs[taxi.zone];
  if(!tariff)throw new Error('Vùng đưa đón không hợp lệ.');
  if(typeof taxi.address!=='string'||taxi.address.trim().length<12||taxi.address.length>250)throw new Error('Vui lòng nhập địa chỉ đón cụ thể (12–250 ký tự).');
  if(typeof taxi.phone!=='string'||!/^(0|\+84)[0-9]{9}$/.test(taxi.phone.trim()))throw new Error('Số điện thoại liên hệ chưa hợp lệ.');
  const direction=taxi.direction||'pickup';
  if(!['pickup','return','round_trip'].includes(direction))throw new Error('Chiều đưa đón không hợp lệ.');
  if((direction==='return'||direction==='round_trip')&&typeof taxi.returnAddress==='string'&&taxi.returnAddress.trim()&&taxi.returnAddress.trim().length<12)throw new Error('Địa chỉ trả thú cưng phải có ít nhất 12 ký tự.');
  const count=direction==='round_trip'?2:1;
  const label=direction==='round_trip'?'Đưa đi và đón về':direction==='return'?'Đưa thú cưng về':'Đón thú cưng đến';
  return {fee:tariff.fee*count,line:{type:'taxi',label:'Pet Taxi · '+label+' · '+tariff.label,amount:tariff.fee*count}};
}
