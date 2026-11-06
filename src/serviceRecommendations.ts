/** Simple transparent suggestions, not diagnostic or a medical recommendation. */
export function suggestServiceNames(pet:{species:string;weight:number;age:number}|null|undefined):string[]{
 if(!pet)return [];
 if(pet.species==='Mèo')return ['Grooming cơ bản','Spa thư giãn'];
 if(pet.species!=='Chó')return [];
 if(pet.weight>30)return ['Grooming cơ bản','Spa thư giãn'];
 if(pet.age<1)return ['Grooming cơ bản','Daycare nửa ngày'];
 return pet.weight<=10?['Grooming toàn diện','Daycare nửa ngày']:['Grooming toàn diện','Spa dưỡng lông'];
}
