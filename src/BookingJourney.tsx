import React from 'react';

/** Purely presentational. Does not infer or mutate payment status from service progress. */
export const journeySteps=['Chờ duyệt','Đã xác nhận','Đang chăm sóc','Chờ bàn giao','Hoàn tất'] as const;
export function journeyPosition(status:string,careCompleted=false):number {
  switch(status){case 'Đang chờ xác nhận':return 0;case 'Đã xác nhận':return 1;case 'Đang thực hiện':return careCompleted?3:2;case 'Hoàn tất':return 4;default:return -1;}
}
export default function BookingJourney({status,paymentStatus,careCompleted=false}:{status:string;paymentStatus:string;careCompleted?:boolean}){
  const position=journeyPosition(status,careCompleted);
  return <div className="petday-journey" aria-label="Tiến trình lịch hẹn">
    {position<0?<p className="petday-journey-muted">Lịch đã hủy — không còn tiến trình chăm sóc.</p>:
      <ol className="petday-journey-steps">{journeySteps.map((step,index)=><li key={step} className={index<position?'is-done':index===position?'is-current':'is-future'} aria-current={index===position?'step':undefined}><span className="petday-journey-dot" aria-hidden="true">{index<position?'✓':index+1}</span><span>{step}</span></li>)}</ol>}

  </div>;
}
