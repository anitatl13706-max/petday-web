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
  return {fee:tariff.fee,line:{type:'taxi',label:'Pet Taxi · '+tariff.label,amount:tariff.fee}};
}
