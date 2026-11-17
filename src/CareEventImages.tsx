import { createPortal } from "react-dom"
import { useEffect, useRef, useState } from "react"
import { apiFetch, backendAssetUrl } from "./apiFetch"

export type CareImageMeta = {
  id: number
  fileName?: string
  createdAt?: string
}

const acceptedTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"])
const maxBytes = 5 * 1024 * 1024

function ImageIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
}

export function CareImagePicker({files,onChange,onError,disabled=false}:{files:File[];onChange:(files:File[])=>void;onError:(message:string)=>void;disabled?:boolean}) {
  const inputRef=useRef<HTMLInputElement>(null)
  const [previews,setPreviews]=useState<string[]>([])
  useEffect(()=>{
    const urls=files.map(file=>URL.createObjectURL(file));setPreviews(urls)
    return ()=>urls.forEach(url=>URL.revokeObjectURL(url))
  },[files])
  function pick(selected:File[]){
    const valid:File[]=[]
    for(const file of selected){
      if(!acceptedTypes.has(file.type.toLowerCase())){onError("Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.");continue}
      if(file.size>maxBytes){onError(`Ảnh ${file.name} vượt quá 5 MB.`);continue}
      valid.push(file)
    }
    const merged=[...files,...valid].filter((file,index,list)=>list.findIndex(other=>other.name===file.name&&other.size===file.size&&other.lastModified===file.lastModified)===index)
    if(merged.length>5)onError("Mỗi lần cập nhật chỉ được chọn tối đa 5 ảnh.")
    onChange(merged.slice(0,5))
    if(inputRef.current)inputRef.current.value=""
  }
  return <div className="mt-3">
    <input ref={inputRef} className="sr-only" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple disabled={disabled} onChange={event=>pick(Array.from(event.target.files||[]))}/>
    <button type="button" disabled={disabled||files.length>=5} onClick={()=>inputRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#B9CBE2] bg-white px-4 py-2.5 text-sm font-bold text-[#142B55] transition-colors hover:bg-[#EDF5FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF765E] disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none">
      <ImageIcon/> Thêm ảnh <span className="font-normal text-slate-500">({files.length}/5)</span>
    </button>
    <p className="mt-1.5 text-xs text-slate-500">Không bắt buộc · Tối đa 5 ảnh · JPG, PNG, WebP · 5 MB/ảnh.</p>
    {previews.length>0&&<div className="mt-3 flex flex-wrap gap-2" aria-label="Ảnh chờ tải lên">
      {previews.map((url,index)=><div key={url} title={files[index]?.name} className="relative h-20 w-20 overflow-visible rounded-[10px] border border-[#DDE7F3] bg-slate-50">
        <img src={url} alt={`Ảnh xem trước ${index+1}`} className="h-full w-full rounded-[10px] object-cover"/>
        <button type="button" disabled={disabled} onClick={()=>onChange(files.filter((_,itemIndex)=>itemIndex!==index))} aria-label={`Xóa ảnh ${files[index]?.name||index+1}`} className="absolute -right-2 -top-2 grid h-11 w-11 place-items-center rounded-full border border-white bg-[#142B55] text-lg font-bold text-white shadow-md transition hover:bg-[#0D2145] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF765E] disabled:opacity-45">×</button>
      </div>)}
    </div>}
  </div>
}

export class CareImageUploadError extends Error {
  failedFiles:File[]
  uploadedCount:number
  constructor(message:string,failedFiles:File[],uploadedCount:number){super(message);this.name="CareImageUploadError";this.failedFiles=failedFiles;this.uploadedCount=uploadedCount}
}

export async function uploadCareEventImages(bookingCode:string,eventId:number,files:File[],token:string){
  for(let index=0;index<files.length;index++){
    const file=files[index]
    let response:Response
    try{response=await apiFetch(`/api/bookings/${encodeURIComponent(bookingCode)}/care-events/${eventId}/images`,{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":file.type||"application/octet-stream","X-File-Name":encodeURIComponent(file.name)},body:file})}
    catch{throw new CareImageUploadError("Không kết nối được Backend để tải ảnh. Kiểm tra Backend đang chạy rồi thử lại.",files.slice(index),index)}
    if(!response.ok){
      const contentType=response.headers.get("content-type")||""
      const body=contentType.includes("application/json")?await response.json().catch(()=>({})):{}
      const message=response.status===404&&!contentType.includes("application/json")
        ? "Backend đang chạy bản cũ và chưa có API tải ảnh. Hãy khởi động lại Backend rồi nhấn Thử tải lại."
        : body.error||`Không tải được ảnh ${file.name} (HTTP ${response.status}).`
      throw new CareImageUploadError(message,files.slice(index),index)
    }
  }
  return {uploadedCount:files.length}
}

type LoadedImage={key:string;url:string;alt:string}

export function CareEventImageGallery({images=[],legacyPhotoUrl,token}:{images?:CareImageMeta[];legacyPhotoUrl?:string;token:string}){
  const [loaded,setLoaded]=useState<LoadedImage[]>([])
  const [loading,setLoading]=useState(images.length>0)
  const [active,setActive]=useState<number|null>(null)
  const closeRef=useRef<HTMLButtonElement>(null)
  const dialogRef=useRef<HTMLDivElement>(null)
  const openerRef=useRef<HTMLElement|null>(null)
  useEffect(()=>{
    const controller=new AbortController();let urls:string[]=[];setLoaded([]);setLoading(images.length>0)
    Promise.all(images.map(async image=>{
      try{const response=await apiFetch(`/api/care-event-images/${image.id}`,{headers:{Authorization:"Bearer "+token},signal:controller.signal});if(!response.ok)return null;const url=URL.createObjectURL(await response.blob());urls.push(url);return {key:String(image.id),url,alt:image.fileName?`Ảnh chăm sóc ${image.fileName}`:"Ảnh chăm sóc thú cưng"}}catch{return null}
    })).then(items=>{if(!controller.signal.aborted){setLoaded(items.filter(Boolean) as LoadedImage[]);setLoading(false)}})
    return ()=>{controller.abort();urls.forEach(url=>URL.revokeObjectURL(url))}
  },[images,token])
  const displayed=[...(legacyPhotoUrl?[{key:"legacy-"+legacyPhotoUrl,url:backendAssetUrl(legacyPhotoUrl),alt:"Ảnh chăm sóc thú cưng"}]:[]),...loaded]
  const lightboxOpen=active!==null
  useEffect(()=>{
    if(!lightboxOpen)return
    const previous=document.activeElement as HTMLElement|null;openerRef.current=previous
    const oldOverflow=document.body.style.overflow;document.body.style.overflow="hidden";closeRef.current?.focus()
    const key=(event:KeyboardEvent)=>{if(event.key==="Escape")setActive(null);if(event.key==="ArrowLeft")setActive(value=>value===null?null:(value-1+displayed.length)%displayed.length);if(event.key==="ArrowRight")setActive(value=>value===null?null:(value+1)%displayed.length);if(event.key==="Tab"){const controls=Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])')||[]);if(!controls.length)return;const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}}
    document.addEventListener("keydown",key)
    return ()=>{document.removeEventListener("keydown",key);document.body.style.overflow=oldOverflow;setTimeout(()=>openerRef.current?.focus(),0)}
  },[lightboxOpen,displayed.length])
  if(loading)return <div className="flex max-w-full shrink-0 flex-wrap gap-2 sm:max-w-[264px]" aria-label="Đang tải ảnh nhật ký">{Array.from({length:Math.max(1,images.length+(legacyPhotoUrl?1:0))},(_,index)=><span key={index} className="h-20 w-20 animate-pulse rounded-[10px] border border-[#D9E5F2] bg-slate-100 motion-reduce:animate-none"/>)}</div>
  if(!displayed.length)return images.length ? <p className="text-xs text-amber-800">Không tải được ảnh đã lưu. Kiểm tra file ảnh trên máy chủ hoặc quyền truy cập.</p> : null
  return <>
    <div className="flex max-w-full shrink-0 flex-wrap gap-2 sm:max-w-[264px]" aria-label="Ảnh nhật ký chăm sóc">
      {displayed.map((image,index)=><button key={image.key} type="button" onClick={()=>setActive(index)} aria-label={`Mở ảnh chăm sóc ${index+1}/${displayed.length}`} className="h-20 w-20 overflow-hidden rounded-[10px] border border-[#D9E5F2] bg-slate-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF765E] motion-reduce:transform-none motion-reduce:transition-none">
        <img src={image.url} alt={image.alt} loading="lazy" className="h-full w-full object-cover"/>
      </button>)}
    </div>
    {active!==null&&displayed[active]&&createPortal(<div role="dialog" aria-modal="true" aria-label={`Xem ảnh chăm sóc ${active+1}/${displayed.length}`} className="fixed inset-0 z-[70] grid place-items-center bg-[#07152D]/85 p-4 backdrop-blur-sm" onMouseDown={event=>{if(event.target===event.currentTarget)setActive(null)}}>
      <div ref={dialogRef} className="relative flex max-h-[92vh] w-full max-w-5xl flex-col items-center">
        <button ref={closeRef} type="button" onClick={()=>setActive(null)} aria-label="Đóng ảnh lớn" className="absolute right-0 top-0 z-10 grid h-11 w-11 place-items-center rounded-full bg-white text-2xl font-bold text-[#142B55] shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF765E]">×</button>
        <img src={displayed[active].url} alt={displayed[active].alt} className="max-h-[82vh] max-w-full rounded-2xl bg-white object-contain shadow-2xl"/>
        <p className="mt-3 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-[#142B55]">{active+1} / {displayed.length}</p>
        {displayed.length>1&&<><button type="button" onClick={()=>setActive(value=>value===null?0:(value-1+displayed.length)%displayed.length)} aria-label="Ảnh trước" className="absolute left-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-2xl font-bold text-[#142B55] shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF765E]">‹</button><button type="button" onClick={()=>setActive(value=>value===null?0:(value+1)%displayed.length)} aria-label="Ảnh sau" className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-2xl font-bold text-[#142B55] shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF765E]">›</button></>}
      </div>
    </div>,document.body)}
  </>
}
