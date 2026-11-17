// Daycare: a single customer-facing plan, 40,000 VND per actual operating hour.
// Historic half-day booking keys remain valid to display archived bookings.
import {services,calculate} from './rules.js';
export const DAYCARE_RATE_PER_HOUR=40000;
export const DAYCARE_MAX_DAYS=7;
export function minuteOf(value){
 if(!/^\d{2}:\d{2}$/.test(String(value||'')))return NaN;
 const h=Number(value.slice(0,2)),m=Number(value.slice(3,5));
 return h<24&&m<60?h*60+m:NaN;
}
export function validDaycareArrival(value){
 const n=minuteOf(value);return Number.isFinite(n)&&n>=480&&n<1200;
}
function dayIndex(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return NaN;
 const dt=Date.parse(value+'T00:00:00Z');
 return Number.isFinite(dt)&&new Date(dt).toISOString().slice(0,10)===value?Math.floor(dt/86400000):NaN;
}
export function daycarePeriods(date,endDate,arrival,departure){
 const start=dayIndex(date),finish=dayIndex(endDate||date),a=minuteOf(arrival),b=minuteOf(departure);
 if(!Number.isFinite(start)||!Number.isFinite(finish)||finish<start||finish-start>=DAYCARE_MAX_DAYS)throw Error('Ngày về phải từ ngày đến đến tối đa 7 ngày.');
 if(!validDaycareArrival(arrival)||!Number.isFinite(b)||b<480||b>1200)throw Error('Giờ Daycare phải nằm trong khoảng 08:00–20:00.');
 if(start===finish&&b-a<60)throw Error('Daycare tối thiểu 1 giờ.');
 // Same operating hours apply on intervening days: no overnight/24-hour service charged.
 const result=[];
 for(let d=start;d<=finish;d++){
  const from=d===start?a:480,to=d===finish?b:1200;
  if(to<=from)throw Error('Giờ về phải sau giờ đến trong cùng ngày; ngày kế tiếp áp dụng giờ phục vụ 08:00–20:00.');
  result.push({date:new Date(d*86400000).toISOString().slice(0,10),start:from,end:to});
 }
 return result;
}
export function daycareWindowIssue(service,arrival,departure,date='2026-11-20',endDate=date){
 if(services[service]?.category!=='Daycare')return 'Không phải gói Daycare.';
 try{daycarePeriods(date,endDate,arrival,departure);return null;}catch(e){return e.message;}
}
export function daycareCharge(service,arrival,departure,date='2026-11-20',endDate=date){
 const issue=daycareWindowIssue(service,arrival,departure,date,endDate);if(issue)throw Error(issue);
 const minutes=daycarePeriods(date,endDate,arrival,departure).reduce((n,p)=>n+p.end-p.start,0);
 return {minutes,amount:Math.ceil(minutes*DAYCARE_RATE_PER_HOUR/60)};
}
export function applyDaycareAndCompanion(quote,{service,slot,daycarePickupTime,daycareEndDate,date,companionService,pet}){
 const main=services[service];if(!main)throw Error('Dịch vụ chính không tồn tại.');
 if(main.category!=='Daycare'){
  if(companionService)throw Error('Chỉ Daycare được chọn một gói Grooming/Spa kèm theo.');
  return quote;
 }
 const startDate=date||'2026-11-20',endDate=daycareEndDate||startDate;
 const {minutes,amount}=daycareCharge(service,slot,daycarePickupTime,startDate,endDate);
 const old=quote.lines.find(x=>x.type==='base');if(!old)throw Error('Báo giá không có dòng gói chính.');
 quote.total+=amount-old.amount;old.amount=amount;old.label='Daycare · '+(minutes/60)+' giờ × 40.000đ';
 quote.lines.push({type:'schedule',label:`Daycare ${startDate} ${slot} – ${endDate} ${daycarePickupTime} (${minutes/60} giờ phục vụ)`,startDate,endDate,startTime:slot,endTime:daycarePickupTime,amount:0});
 if(companionService){
  const companion=services[companionService];
  if(!companion||!['Grooming','Spa'].includes(companion.category)||companion.duration>minutes)throw Error('Chỉ được chọn một gói Grooming hoặc Spa phù hợp thời lượng Daycare.');
  const second=calculate(companionService,pet);
  quote.total+=second.total;
  quote.lines.push({type:'companion_service',label:'Chăm sóc trong Daycare · '+companionService,service:companionService,amount:second.total});
 }
 return quote;
}
export function bookingInterval(service,slot,lines=[]){
 const st=minuteOf(slot);if(!services[service]||!Number.isFinite(st))return {start:0,end:1440};
 const schedule=(Array.isArray(lines)?lines:[]).find(l=>l.type==='schedule'&&l.endTime);
 const end=services[service].category==='Daycare'&&schedule?minuteOf(schedule.endTime):st+services[service].duration;
 return {start:st,end:Number.isFinite(end)?end:st+services[service].duration};
}
export function bookingPeriods(service,date,slot,lines=[]){
 const schedule=(Array.isArray(lines)?lines:[]).find(l=>l.type==='schedule'&&l.endTime);
 if(services[service]?.category==='Daycare'&&schedule?.endDate){
  try{return daycarePeriods(date,schedule.endDate,slot,schedule.endTime)}catch{return []}
 }
 return [{date,...bookingInterval(service,slot,lines)}];
}
export function hasOverlap(a,b){return a.start<b.end&&b.start<a.end;}
