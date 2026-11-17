import React from 'react';
/** Display only: taxi handoff is recorded separately, not an appointment stage. */
export const journeySteps=['Đã xác nhận','Đang chăm sóc','Hoàn tất'] as const;
export function journeyPosition(status:string,careCompleted=false):number {
  if(status==='Đang chờ xác nhận')return -2;
  if(status==='Đã xác nhận')return 0;
  if(status==='Hoàn tất')return 2;
  if(status==='Không hoàn thành')return 2;
  if(status==='Đang thực hiện')return careCompleted?1:1;
  return -1;
}
export default function BookingJourney({status,paymentStatus,careCompleted=false}:{status:string;paymentStatus:string;careCompleted?:boolean}){
 const position=journeyPosition(status,careCompleted);
 return <div className="petday-journey" aria-label="Tiến trình dịch vụ">
  {position===-2?<p className="petday-journey-muted">Chờ thanh toán ban đầu để xác nhận lịch.</p>:position<0?<p className="petday-journey-muted">Lịch đã hủy — không còn tiến trình chăm sóc.</p>:
   <ol className="petday-journey-steps">{journeySteps.map((original,index)=>{const step=status==='Không hoàn thành'&&index===2?'Không hoàn thành':original;return <li key={step} className={index<position?'is-done':index===position?(status==='Không hoàn thành'?'is-current text-red-700':'is-current'):'is-future'} aria-current={index===position?'step':undefined}><span className="petday-journey-dot" aria-hidden="true">{index<position?'✓':index+1}</span><span>{step}</span></li>})}</ol>}
 </div>;
}
