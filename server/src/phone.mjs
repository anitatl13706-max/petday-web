/** Normalize Vietnamese phone numbers for signup, profile and login. */
export function normalizePetDayPhone(raw){
 const s=String(raw||'').replace(/[\s.()-]/g,'');
 const n=s.startsWith('+84')?'0'+s.slice(3):s.startsWith('84')?'0'+s.slice(2):s;
 return /^0[0-9]{9}$/.test(n)?n:null;
}
