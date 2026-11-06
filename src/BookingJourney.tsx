import React from 'react';

/** Purely presentational. Does not infer or mutate payment status from service progress. */
export const journeySteps=['Chờ duyệt','Đã xác nhận','Đang chăm sóc','Hoàn tất'] as const;
export function journeyPosition(status:string):number {
  switch(status){case 'Đang chờ xác nhận':return 0;case 'Đã xác nhận':return 1;case 'Đang thực hiện':return 2;case 'Hoàn tất':return 3;default:return -1;}
}
export default function BookingJourney({status,paymentStatus}:{status:string;paymentStatus:string}){
  const position=journeyPosition(status);
  return <div className="petday-journey" aria-label="Tiến trình lịch hẹn">
    {position<0?<p className="petday-journey-muted">Lịch đã hủy — không còn tiến trình chăm sóc.</p>:
      <ol className="petday-journey-steps">{journeySteps.map((step,index)=><li key={step} className={index<position?'is-done':index===position?'is-current':'is-future'} aria-current={index===position?'step':undefined}><span className="petday-journey-dot" aria-hidden="true">{index<position?'✓':index+1}</span><span>{step}</span></li>)}</ol>}

  </div>;
}
