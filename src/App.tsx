import {apiFetch} from './apiFetch';
import SystemCheck from './SystemCheck';
import {servicePackages} from './servicePackages';
import SupportWidget from './SupportWidget';
import { useEffect, useMemo, useState } from 'react';
import Portal from './Portal';

type Page = 'home' | 'services' | 'shop' | 'booking' | 'appointments' | 'admin' | 'account' | 'system';

type IconName =
  | 'arrow'
  | 'calendar'
  | 'check'
  | 'chevron'
  | 'clock'
  | 'close'
  | 'facebook'
  | 'heart'
  | 'instagram'
  | 'location'
  | 'mail'
  | 'menu'
  | 'paw'
  | 'phone'
  | 'play'
  | 'search'
  | 'shield'
  | 'sparkle'
  | 'star'
  | 'user';

function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    facebook: <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v6h4v-6h3l1-4h-4V9c0-.7.3-1 1-1Z" />,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    paw: <><path d="M12 11c-3 0-6 3-6 6 0 2 1.5 3 3.5 2.5 1.6-.4 3.4-.4 5 0C16.5 20 18 19 18 17c0-3-3-6-6-6Z" /><ellipse cx="6.5" cy="9" rx="2" ry="2.5" /><ellipse cx="17.5" cy="9" rx="2" ry="2.5" /><ellipse cx="10" cy="5.5" rx="2" ry="2.5" /><ellipse cx="14" cy="5.5" rx="2" ry="2.5" /></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />,
    play: <path d="m9 7 8 5-8 5V7Z" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    shield: <><path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    sparkle: <><path d="m12 3 1.4 4.1L17 9l-3.6 1.9L12 15l-1.4-4.1L7 9l3.6-1.9L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15ZM5 3l.6 1.4L7 5l-1.4.6L5 7l-.6-1.4L3 5l1.4-.6L5 3Z" /></>,
    star: <path d="m12 2 3 6 6.5 1-4.7 4.6 1.1 6.4-5.9-3-5.9 3 1.1-6.4L2.5 9 9 8l3-6Z" />,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  };
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const photos = {
  hero: 'https://images.unsplash.com/photo-1606231106595-30ebc70aa72b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400',
  grooming: 'https://images.unsplash.com/photo-1791714887477-c71786e32fba?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900',
  daycare: 'https://images.unsplash.com/photo-1636654581774-82712b59f87b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900',
  dogs: 'https://images.unsplash.com/photo-1712052302539-eade14024ef7?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1000',
  cat: 'https://images.unsplash.com/photo-1719936230018-97cf37f441b7?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900',
  owner: 'https://images.unsplash.com/photo-1786920415697-764ac422c7ba?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900',
  labs: 'https://images.unsplash.com/photo-1620021030164-b0e70f5a5500?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900',
};

type Service = {
  id: number;
  category: 'Grooming' | 'Spa' | 'Daycare';
  name: string;
  description: string;
  price: string;
  duration: string;
  image: string;
  popular?: boolean;
};

const services: Service[] = servicePackages.map((s,i)=>({
 id:i+1,category:s.category,name:s.name,description:s.description,
 price:'Từ '+s.price.toLocaleString('vi-VN')+'đ',
 duration:s.duration>=240?(s.duration===480?'Cả ngày':'Nửa ngày'):`Khoảng ${s.duration} phút`,
 image:s.category==='Grooming'?'/services/grooming.webp':s.category==='Spa'?'/services/spa.webp':'/services/daycare.webp',
 popular:false
}));

function Logo({ light = false }: { light?: boolean }) {
  return (
    <button className="group flex items-center gap-2.5" onClick={() => navigateTo('home')} aria-label="Về trang chủ PetDay">
      <span className={`grid h-10 w-10 place-items-center rounded-[14px] ${light ? 'bg-white text-[#142B55]' : 'bg-[#142B55] text-white'}`}>
        <Icon name="paw" size={23} />
      </span>
      <span className={`text-[24px] font-extrabold tracking-[-0.04em] ${light ? 'text-white' : 'text-[#142B55]'}`}>Pet<span className="text-[#FF765E]">Day</span></span>
    </button>
  );
}

function navigateTo(page: Page) {
  const hashes: Record<Page, string> = { home: '', services: 'dich-vu', shop: 'cua-hang', booking: 'dat-lich', appointments: 'lich-hen', admin: 'quan-tri', account: 'tai-khoan', system: 'kiem-tra-he-thong' };
  window.location.hash = hashes[page];
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function Header({ page }: { page: Page }) {
  const [open, setOpen] = useState(false);
  const [accountOpen,setAccountOpen] = useState(false);
  const [viewer,setViewer] = useState<{full_name:string;role:string}|null>(null);
  useEffect(()=>{const token=sessionStorage.getItem('petday_token_v3')||sessionStorage.getItem('petday_api_token');if(!token){setViewer(null);return;}apiFetch('/api/me',{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.ok?r.json():null).then(setViewer).catch(()=>setViewer(null));},[page]);
  const go = (target: Page, section?:string) => { setOpen(false); if(section)sessionStorage.setItem('petday_focus_section',section); navigateTo(target); if(section)window.dispatchEvent(new Event('petday:focus')); };
  return (
    <>
      <div className="hidden bg-[#142B55] py-2 text-white md:block">
        <div className="container-pd flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><Icon name="phone" size={14} /> 1900 8668</span>
            <span className="flex items-center gap-1.5"><Icon name="clock" size={14} /> Thứ 2 – Chủ nhật: 08:00 – 20:00</span>
          </div>
          <span>Miễn phí tư vấn chăm sóc thú cưng</span>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-[#142B55]/8 bg-white/95 backdrop-blur-md">
        <div className="container-pd flex h-[76px] items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-8 lg:flex">
            <button className={`nav-link ${page === 'home' ? 'active' : ''}`} onClick={() => go('home')}>Trang chủ</button>
            <button className={`nav-link ${page === 'services' ? 'active' : ''}`} onClick={() => go('services')}>Dịch vụ</button>
            <button className={`nav-link ${page === 'shop' ? 'active' : ''}`} onClick={() => go('shop')}>Cửa hàng</button>
            <a className="nav-link" href="#quy-trinh">Quy trình</a>
            <a className="nav-link" href="#ve-petday">Về PetDay</a>
            <a className="nav-link" href="#cam-nang">Cẩm nang</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <div className="relative">
              <button aria-label="Mở menu tài khoản" aria-haspopup="menu" aria-expanded={accountOpen} onClick={()=>setAccountOpen(v=>!v)} className="flex items-center gap-2 rounded-full border border-[#142B55]/10 bg-[#EDF5FC] px-4 py-2.5 text-sm font-semibold text-[#142B55]"><Icon name="user" size={19}/><span>{viewer?.full_name?.split(' ').slice(-1)[0]||'Tài khoản'}</span><svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${accountOpen ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg></button>
              {accountOpen&&<div role="menu" className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-[#DDE9F8] bg-white p-2 shadow-xl">
                <div className="border-b border-[#E3ECF7] px-3 py-3"><p className="truncate text-sm font-bold text-[#142B55]">{viewer?.full_name||'Chào mừng đến PetDay'}</p><p className="mt-1 text-xs text-slate-500">{viewer?.role==='admin'?'Quản trị viên':viewer?.role==='staff'?'Nhân viên PetDay':viewer?'Tài khoản khách hàng':'Vui lòng đăng nhập để tiếp tục'}</p></div>
                {(viewer?.role==='admin' ? [
                  ['Bảng điều hành','admin',''],['Lịch hẹn & điều phối','admin','admin-bookings'],['Tài chính & đơn hàng','admin','admin-finance-workbench']
                ] : viewer?.role==='staff' ? [['Lịch làm việc của tôi','admin','']] : viewer ? [
                  ['Tài khoản & thú cưng','account','account-profile'],['Lịch hẹn của tôi','appointments','appointments-list'],['Thanh toán','appointments','customer-payments'],['Hỗ trợ & thông báo','account','customer-consultations']
                ] : [['Đăng nhập / Đăng ký','account','']]).map(([label,to,section])=><button key={label} role="menuitem" className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[#142B55] transition hover:bg-[#EDF5FC] focus-visible:outline-[#FF765E]" onClick={()=>{setAccountOpen(false);go(to as Page,section||undefined)}}>{label}</button>)}
                {viewer&&<button role="menuitem" className="mt-1 w-full border-t border-[#E3ECF7] px-3 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50" onClick={()=>{sessionStorage.removeItem('petday_token_v3');sessionStorage.removeItem('petday_api_token');setAccountOpen(false);setViewer(null);go('home');window.location.reload()}}>Đăng xuất</button>}
              </div>}
            </div>
            <button className="btn-coral" onClick={() => go(viewer?.role==='admin'||viewer?.role==='staff'?'admin':'booking')}><Icon name="calendar" size={18} /> {viewer?.role==='admin'?'Quản trị':viewer?.role==='staff'?'Lịch làm việc':'Đặt lịch ngay'}</button>
          </div>
          <button className="grid h-11 w-11 place-items-center rounded-full bg-[#DCEEFF] text-[#142B55] md:hidden" onClick={() => setOpen(!open)} aria-label="Mở menu">
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
        {open && (
          <div className="border-t border-[#142B55]/8 bg-white px-5 pb-6 pt-3 md:hidden">
            <nav className="flex flex-col">
              <button className="mobile-link" onClick={() => go('home')}>Trang chủ</button>
              <button className="mobile-link" onClick={() => go('services')}>Dịch vụ</button>
              <button className="mobile-link" onClick={() => go('shop')}>Cửa hàng thú cưng</button>
              {viewer?.role==='customer'&&<button className="mobile-link" onClick={() => go('appointments')}>Lịch hẹn của tôi</button>}
              <button className="mobile-link" onClick={() => go(viewer?.role==='admin'||viewer?.role==='staff'?'admin':'account')}>{viewer?.role==='admin'?'Quản trị':viewer?.role==='staff'?'Lịch làm việc':'Tài khoản của tôi'}</button>
              <a className="mobile-link" href="#quy-trinh" onClick={() => setOpen(false)}>Quy trình</a>
              <a className="mobile-link" href="#ve-petday" onClick={() => setOpen(false)}>Về PetDay</a>
              <button className="btn-coral mt-4 justify-center" onClick={() => go(viewer?.role==='admin'||viewer?.role==='staff'?'admin':'booking')}>{viewer?.role==='admin'?'Quản trị':'Đặt lịch ngay'}</button>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

function SectionHeading({ eyebrow, title, description, centered = true }: { eyebrow: string; title: React.ReactNode; description?: string; centered?: boolean }) {
  return (
    <div className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mt-4 text-[32px] font-extrabold leading-[1.18] tracking-[-0.035em] text-[#142B55] md:text-[44px]">{title}</h2>
      {description && <p className="mt-4 leading-7 text-[#5E6C83]">{description}</p>}
    </div>
  );
}

function Stars() {
  return <div className="flex gap-1 text-[#FF765E]">{[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={16} className="fill-current" />)}</div>;
}

function ServiceCard({ service, compact = false }: { service: Service; compact?: boolean }) {
  const [detailsOpen,setDetailsOpen]=useState(false);
  return (
    <article className="service-card group">
      <div className={`relative overflow-hidden ${compact ? 'h-52' : 'h-60'}`}>
        <img src={service.image} alt={service.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#142B55] shadow-sm">{service.category}</span>
        {service.popular && <span className="absolute right-4 top-4 rounded-full bg-[#FF765E] px-3 py-1.5 text-xs font-bold text-white">Được yêu thích</span>}
      </div>
      <div className="p-5 md:p-6">
        <div className="mb-3 flex items-center gap-3 text-xs font-semibold text-[#738097]"><span className="flex items-center gap-1.5"><Icon name="clock" size={15} /> {service.duration}</span></div>
        <h3 className="text-xl font-bold tracking-[-0.02em] text-[#142B55]">{service.name}</h3>
        <p className="mt-2 min-h-12 text-sm leading-6 text-[#68758B]">{service.description}</p><p className="mt-2 text-xs font-semibold text-[#526179]">{service.category==='Daycare'?'Dành cho chó · nhận buổi sáng':service.name==='Grooming tạo kiểu'?'Dành cho chó':'Dành cho chó và mèo'} · Giá được xác nhận khi đặt</p>
        <div className="mt-5 flex items-end justify-between border-t border-[#142B55]/8 pt-4">
          <div><span className="block text-[11px] font-semibold uppercase tracking-wider text-[#8A95A8]">Giá dịch vụ</span><strong className="mt-1 block text-lg text-[#142B55]">{service.price}</strong></div>
          <button className="grid h-11 w-11 place-items-center rounded-full bg-[#DCEEFF] text-[#142B55] transition group-hover:bg-[#FF765E] group-hover:text-white" aria-label={`Đặt ${service.name}`} onClick={() => { sessionStorage.setItem('petday_service_prefill', service.name); navigateTo('booking'); }}><Icon name="arrow" /></button>
        </div>
      </div>
    </article>
  );
}

function BookingBar() {
  const [pet, setPet] = useState('Chó');
  const [interest, setInterest] = useState('Grooming');
  const [preferredDate, setPreferredDate] = useState('');
  const openBooking = () => {
    sessionStorage.setItem('petday_service_prefill',interest==='Spa'?'Spa dưỡng lông':interest==='Daycare'?'Daycare cả ngày':'Grooming toàn diện');
    if (preferredDate) localStorage.setItem('petday_booking_date', preferredDate);
    navigateTo('booking');
  };
  return (
    <div id="dat-lich" className="container-pd relative z-10 -mt-10">
      <div className="grid gap-3 rounded-[24px] bg-white p-4 shadow-[0_18px_60px_rgba(20,43,85,0.14)] md:grid-cols-[1fr_1fr_1fr_auto] md:p-5">
        <label className="field"><span>Bé nhà bạn là</span><select value={pet} onChange={e => setPet(e.target.value)}><option>Chó</option><option>Mèo</option></select></label>
        <label className="field"><span>Dịch vụ quan tâm</span><select value={interest} onChange={event => setInterest(event.target.value)}><option>Grooming</option><option>Spa</option><option>Daycare</option></select></label>
        <label className="field"><span>Ngày mong muốn</span><input type="date" value={preferredDate} onChange={event => setPreferredDate(event.target.value)} /></label>
        <button className="btn-coral justify-center self-stretch px-7" onClick={openBooking}><Icon name="calendar" size={19} /> Tìm lịch trống</button>
      </div>
    </div>
  );
}

function usePublishedServices(){
 const [published,setPublished]=useState<any[]|null>(null);
 useEffect(()=>{let live=true;apiFetch('/api/public/services').then(async r=>{if(!r.ok)throw Error('catalog unavailable');return r.json()}).then((items:any[])=>{if(live&&Array.isArray(items))setPublished(items)}).catch(()=>{});return()=>{live=false};},[]);
 return services.filter(s=>published===null||published.some(x=>x.name===s.name)).map(s=>{const live=published?.find(x=>x.name===s.name);return {...s,price:live?'Từ '+Number(live.basePrice).toLocaleString('vi-VN')+'đ':s.price};});
}
function HomePage() {
  const liveServices=usePublishedServices();
  const [reviewOffset,setReviewOffset]=useState(0);
  const [storyOpen,setStoryOpen]=useState(false);
  return (
    <main>
      <section className="relative overflow-hidden bg-[#DCEEFF]">
        <div className="hero-dot absolute -left-10 top-16 h-32 w-32 opacity-35" />
        <div className="container-pd grid min-h-[650px] items-center gap-10 py-16 lg:grid-cols-[1.03fr_.97fr] lg:py-20">
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#142B55] shadow-sm"><Icon name="sparkle" size={17} className="text-[#FF765E]" /> Chăm bằng chuyên môn, yêu bằng cả trái tim</div>
            <h1 className="max-w-[650px] text-[44px] font-extrabold leading-[1.08] tracking-[-0.05em] text-[#142B55] sm:text-[58px] lg:text-[68px]">Mỗi ngày của bé đều là một <span className="relative text-[#FF765E]">ngày vui<span className="absolute -bottom-2 left-0 h-2 w-full rounded-full bg-[#FF765E]/20" /></span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#53647E]">Dịch vụ grooming, spa và chăm sóc ban ngày chuyên nghiệp, nơi mỗi thú cưng được thấu hiểu, nâng niu và là chính mình.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="btn-navy" onClick={() => navigateTo('booking')}>Đặt lịch cho bé <Icon name="arrow" size={18} /></button>
              <button className="btn-white" onClick={() => navigateTo('services')}><span className="grid h-7 w-7 place-items-center rounded-full bg-[#DCEEFF]"><Icon name="play" size={15} /></span> Khám phá dịch vụ</button>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-6 text-sm font-semibold text-[#52617A]">
              <span className="flex items-center gap-2"><span className="check-dot"><Icon name="check" size={13} /></span> Chuyên viên tận tâm</span>
              <span className="flex items-center gap-2"><span className="check-dot"><Icon name="check" size={13} /></span> Không gian sạch chuẩn</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[590px]">
            <div className="absolute -inset-4 translate-x-5 translate-y-5 rounded-[44px_44px_120px_44px] bg-[#142B55]/8" />
            <div className="relative h-[420px] overflow-hidden rounded-[38px_38px_110px_38px] sm:h-[520px]">
              <img src={photos.hero} alt="Khách hàng vui vẻ ôm thú cưng tại PetDay" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#142B55]/25 to-transparent" />
            </div>
            <div className="absolute -left-5 bottom-8 flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-xl sm:-left-10">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#FFF0EC] text-[#FF765E]"><Icon name="heart" className="fill-current" /></div>
              <div><strong className="block text-sm text-[#142B55]">4.9/5 trải nghiệm</strong><span className="text-xs text-[#718097]">từ hơn 2.000 sen</span></div>
            </div>
            <div className="absolute -right-2 top-10 grid h-20 w-20 rotate-6 place-items-center rounded-3xl bg-[#FF765E] text-white shadow-lg"><Icon name="paw" size={38} /></div>
          </div>
        </div>
      </section>
      <BookingBar />

      <section className="section-space">
        <div className="container-pd">
          <SectionHeading eyebrow="Dịch vụ tại PetDay" title={<>Chăm sóc trọn vẹn, <span className="text-[#FF765E]">niềm vui trọn ngày</span></>} description="Mỗi dịch vụ được thiết kế theo nhu cầu riêng, đảm bảo bé luôn thoải mái và được chăm sóc đúng cách." />
          <div className="mt-11 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {liveServices.filter(s => [2, 5, 8].includes(s.id)).map(s => <ServiceCard key={s.id} service={s} />)}
          </div>
          <div className="mt-9 text-center"><button className="btn-outline" onClick={() => navigateTo('services')}>Xem tất cả dịch vụ <Icon name="arrow" size={18} /></button></div>
        </div>
      </section>

      <section aria-labelledby="home-shop-title" className="section-space bg-[#F7FAFD]">
        <div className="container-pd">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><span className="eyebrow">PETDAY SHOP</span><h2 id="home-shop-title" className="mt-3 text-3xl font-extrabold text-[#142B55] md:text-4xl">Mua sắm cho thú cưng, <span className="text-[#FF765E]">thật tiện lợi</span></h2><p className="mt-3 max-w-xl text-[#5E6C83]">Khám phá sản phẩm cần thiết cho bé. Mua riêng, nhận tại cửa hàng hoặc chọn giao tận nhà.</p></div>
            <button className="btn-navy" onClick={()=>navigateTo('shop')}>Khám phá cửa hàng <Icon name="arrow" size={18}/></button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {([['Thức ăn & Dinh dưỡng','thuc-an-dinh-duong.webp','Hạt, pate và bánh thưởng'],['Tắm & Chăm sóc lông','tam-cham-soc-long.webp','Sữa tắm, lược và đồ chăm sóc'],['Vệ sinh & Răng miệng','ve-sinh-rang-mieng.webp','Vệ sinh và chăm sóc răng miệng'],['Đồ chơi & Vận động','do-choi-van-dong.webp','Đồ chơi và tương tác hằng ngày'],['Đi dạo & Di chuyển','di-dao-di-chuyen.webp','Phụ kiện ra ngoài an toàn'],['Dụng cụ ăn uống & Nghỉ ngơi','dung-cu-an-uong-nghi-ngoi.webp','Bát, đệm và nơi nghỉ ngơi']] as const).map(([name,file,description])=><button key={name} type="button" onClick={()=>{sessionStorage.setItem('petday_shop_category_prefill',name);navigateTo('shop')}} className="group overflow-hidden rounded-3xl border border-[#DEE9F7] bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><img src={'/shop/categories/'+file} alt={'Danh mục '+name} className="h-44 w-full object-cover transition group-hover:scale-[1.02]"/><div className="p-5"><h3 className="text-lg font-extrabold text-[#142B55]">{name}</h3><p className="mt-1 text-sm text-slate-500">{description}</p><span className="mt-3 inline-block text-sm font-bold text-[#DF6857]">Khám phá sản phẩm →</span></div></button>)}
          </div>
        </div>
      </section>

      <section id="quy-trinh" className="section-space bg-[#F7FAFD]">
        <div className="container-pd">
          <SectionHeading eyebrow="Quy trình nhẹ nhàng" title="4 bước để bé có một ngày thật vui" description="Đơn giản với sen, chỉn chu với bé — PetDay lo phần còn lại." />
          <div className="relative mt-12 grid gap-5 md:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-9 hidden border-t-2 border-dashed border-[#BFD7F0] md:block" />
            {[
              ['01', 'Chọn dịch vụ', 'Tìm dịch vụ phù hợp với nhu cầu của bé.', 'search'],
              ['02', 'Đặt lịch hẹn', 'Chọn ngày giờ thuận tiện trong vài thao tác.', 'calendar'],
              ['03', 'Đón tiếp bé', 'Chuyên viên kiểm tra và lắng nghe thói quen.', 'heart'],
              ['04', 'Bé vui về nhà', 'Nhận bé sạch xinh cùng hướng dẫn chăm sóc.', 'sparkle'],
            ].map(([num, title, text, icon]) => (
              <div key={num} className="relative rounded-[24px] border border-[#142B55]/7 bg-white p-6 text-center shadow-[0_8px_35px_rgba(20,43,85,.05)]">
                <div className="relative mx-auto grid h-[72px] w-[72px] place-items-center rounded-2xl bg-[#DCEEFF] text-[#142B55]"><Icon name={icon as IconName} size={28} /><span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-[#FF765E] text-[10px] font-bold text-white">{num}</span></div>
                <h3 className="mt-5 font-bold text-[#142B55]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6D798E]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ve-petday" className="section-space overflow-hidden">
        <div className="container-pd grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative">
            <div className="h-[520px] overflow-hidden rounded-[36px]"><img src={photos.dogs} alt="Những chú chó vui chơi tại PetDay" className="h-full w-full object-cover" /></div>
            <div className="absolute -bottom-7 -right-4 rounded-[24px] bg-[#142B55] p-6 text-white shadow-xl sm:right-8">
              <strong className="block text-4xl font-extrabold">—</strong><span className="mt-1 block text-sm text-white/70">năm đồng hành<br />cùng thú cưng</span>
            </div>
          </div>
          <div>
            <SectionHeading centered={false} eyebrow="Vì sao chọn PetDay?" title={<>Nơi bé được chăm như <span className="text-[#FF765E]">người nhà</span></>} description="Chúng tôi tin rằng chăm sóc tốt bắt đầu từ sự thấu hiểu. Mỗi bé đều có tính cách, sở thích và nhịp riêng cần được tôn trọng." />
            <div className="mt-8 space-y-5">
              {[
                ['shield', 'An toàn là ưu tiên số một', 'Quy trình vệ sinh nghiêm ngặt, sản phẩm rõ nguồn gốc và giám sát liên tục.'],
                ['heart', 'Chăm sóc theo tính cách của bé', 'Không ép buộc, không vội vàng; luôn kiên nhẫn để bé làm quen và thư giãn.'],
                ['user', 'Đội ngũ được đào tạo bài bản', 'Chuyên viên giàu kinh nghiệm, cập nhật kỹ thuật và kiến thức hành vi thường xuyên.'],
              ].map(([icon, title, text]) => <div key={title} className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FFF0EC] text-[#FF765E]"><Icon name={icon as IconName} /></span><div><h3 className="font-bold text-[#142B55]">{title}</h3><p className="mt-1 text-sm leading-6 text-[#6A778C]">{text}</p></div></div>)}
            </div>
            <button className="btn-navy mt-8" onClick={()=>setStoryOpen(v=>!v)}>Câu chuyện PetDay <Icon name="arrow" size={18}/></button>{storyOpen&&<div id="petday-story" className="mt-5 rounded-2xl border border-[#DDE9F8] bg-[#F2F7FC] p-5 scroll-mt-28"><h3 className="font-extrabold text-[#142B55]">Về PetDay</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">PetDay là dự án website đặt lịch chăm sóc chó và mèo, được thiết kế để kết nối chủ thú cưng với quy trình đặt lịch, tiếp nhận, chăm sóc, thanh toán và đánh giá minh bạch. Những thông tin về năm hoạt động và thành tích doanh nghiệp chỉ được công bố khi có dữ liệu xác thực.</p></div>}
          </div>
        </div>
      </section>

      <section className="section-space bg-[#142B55] text-white">
        <div className="container-pd">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <SectionHeading centered={false} eyebrow="Khách hàng nói gì?" title={<span className="text-white">Góc chia sẻ trải nghiệm (minh họa)</span>} />
            <div className="flex gap-2"><button aria-label="Đánh giá trước" onClick={()=>setReviewOffset(v=>(v+2)%3)} className="slider-btn rotate-180"><Icon name="arrow" /></button><button aria-label="Đánh giá tiếp theo" onClick={()=>setReviewOffset(v=>(v+1)%3)} className="slider-btn"><Icon name="arrow" /></button></div>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ['“Bé Bơ vốn rất sợ tắm nhưng đến PetDay lại hợp tác bất ngờ. Các bạn gửi ảnh từng bước nên mình rất yên tâm.”', 'Minh Anh', 'Sen của Bơ • Poodle'],
              ['“Không gian sạch, không có mùi và nhân viên nhớ cả thói quen của bé. Mình đã trở thành khách quen hơn hai năm.”', 'Hoàng Nam', 'Sen của Mây • Corgi'],
              ['“Sau buổi spa, lông bé mềm và thơm dịu rất lâu. Điều mình thích nhất là các bạn không hề làm bé căng thẳng.”', 'Thu Hà', 'Sen của Míu • Mèo Anh lông ngắn'],
            ].map((_,i,arr)=>arr[(i+reviewOffset)%arr.length]).map(([quote, name, meta], i) => <article key={name} className={`rounded-[24px] p-6 ${i === 1 ? 'bg-[#DCEEFF] text-[#142B55]' : 'bg-white/8 text-white'}`}><Stars /><p className={`mt-5 min-h-28 leading-7 ${i === 1 ? 'text-[#445570]' : 'text-white/80'}`}>{quote}</p><div className={`mt-5 border-t pt-5 ${i === 1 ? 'border-[#142B55]/10' : 'border-white/10'}`}><strong className="block">{name}</strong><span className={`mt-1 text-xs ${i === 1 ? 'text-[#64738A]' : 'text-white/55'}`}>{meta}</span></div></article>)}
          </div>
        </div>
      </section>

      <section id="cam-nang" className="section-space">
        <div className="container-pd">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <SectionHeading centered={false} eyebrow="Cẩm nang chăm bé" title="Kiến thức nhỏ, yêu thương lớn" />
            <button onClick={()=>document.getElementById("petday-articles")?.scrollIntoView({behavior:"smooth"})} className="btn-outline">Xem tất cả bài viết <Icon name="arrow" size={18} /></button>
          </div>
          <div id="petday-articles" className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              [photos.cat, 'Chăm sóc', '5 dấu hiệu cho thấy mèo của bạn cần được grooming', '6 phút đọc'],
              [photos.labs, 'Dinh dưỡng', 'Chọn bữa ăn phù hợp theo độ tuổi và mức vận động', '8 phút đọc'],
              [photos.owner, 'Hành vi', 'Giúp bé làm quen với lần đầu đến spa như thế nào?', '5 phút đọc'],
            ].map(([image, tag, title, time]) => <article key={title} className="article-card group"><div className="h-60 overflow-hidden rounded-[22px]"><img src={image} alt={title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /></div><div className="pt-5"><div className="flex items-center gap-3 text-xs font-semibold"><span className="text-[#FF765E]">{tag}</span><span className="h-1 w-1 rounded-full bg-[#9CA6B5]" /><span className="text-[#7A8698]">{time}</span></div><h3 className="mt-3 text-xl font-bold leading-7 tracking-[-0.02em] text-[#142B55]">{title}</h3><button onClick={()=>window.dispatchEvent(new CustomEvent("petday:article",{detail:title}))} className="mt-4 flex items-center gap-2 text-sm font-bold text-[#142B55]">Đọc bài viết <Icon name="arrow" size={17} /></button></div></article>)}
          </div>
        </div>
      </section>
    </main>
  );
}

const careArticles = [
 {title:'5 dấu hiệu cho thấy mèo của bạn cần được grooming',body:['Bộ lông rối, bết hoặc có những mảng lông khó chải có thể là dấu hiệu cần được chăm sóc thêm.','Mèo liếm lông nhiều hơn bình thường, khó tự vệ sinh một số vùng hoặc có mùi bất thường cũng cần được quan sát.','Nếu da đỏ, đau, rụng lông bất thường hoặc mèo khó chịu, nên tham khảo bác sĩ thú y trước khi đặt dịch vụ.']},
 {title:'Chọn bữa ăn phù hợp theo độ tuổi và mức vận động',body:['Nhu cầu ăn uống thay đổi theo tuổi, kích thước và mức vận động của từng thú cưng.','Chọn thức ăn phù hợp loài và giai đoạn phát triển, theo dõi cân nặng và cho uống đủ nước.','Không tự thay đổi chế độ ăn điều trị nếu chưa có hướng dẫn của bác sĩ thú y.']},
 {title:'Giúp bé làm quen với lần đầu đến spa như thế nào?',body:['Tập cho thú cưng quen với việc chạm nhẹ vào bàn chân, chải lông và tiếng động ở mức thấp.','Trước buổi spa, thông báo cho nhân viên về tính cách, dị ứng hoặc các tình huống khiến thú cưng lo lắng.','Ưu tiên buổi chăm sóc ngắn, nhẹ nhàng; dừng lại nếu thú cưng quá căng thẳng.']}
];
function CareArticleReader({article,onClose}:{article:typeof careArticles[number];onClose:()=>void}){return <div role="dialog" aria-modal="true" aria-label={article.title} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0E2143]/60 p-4" onClick={onClose}><article onClick={e=>e.stopPropagation()} className="w-full max-w-2xl max-h-[85vh] overflow-auto rounded-3xl bg-white p-7 shadow-2xl"><div className="flex items-start justify-between gap-3"><h2 className="text-2xl font-extrabold text-[#142B55]">{article.title}</h2><button aria-label="Đóng bài viết" onClick={onClose} className="rounded-full border px-3 py-2">✕</button></div><div className="mt-5 space-y-4 text-[#445570] leading-8">{article.body.map(x=><p key={x}>{x}</p>)}</div><p className="mt-6 text-xs text-slate-500">Thông tin tham khảo chăm sóc thú cưng, không thay thế tư vấn thú y.</p></article></div>}

function ServicesPage() {
  const liveServices=usePublishedServices();
  const [category, setCategory] = useState('Tất cả');
  const [query, setQuery] = useState('');
  const filtered = liveServices.filter(s => (category === 'Tất cả' || s.category === category) && `${s.name} ${s.description}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <main>
      <section className="relative overflow-hidden bg-[#DCEEFF] py-16 md:py-20">
        <div className="hero-dot absolute right-0 top-0 h-40 w-40 opacity-30" />
        <div className="container-pd relative text-center">
          <div className="mb-4 text-sm font-semibold text-[#64748C]"><button onClick={() => navigateTo('home')}>Trang chủ</button><span className="mx-2">/</span><span className="text-[#142B55]">Dịch vụ</span></div>
          <span className="eyebrow">Dịch vụ PetDay</span>
          <h1 className="mx-auto mt-4 max-w-3xl text-[40px] font-extrabold leading-[1.12] tracking-[-0.045em] text-[#142B55] md:text-[58px]">Chăm sóc đúng nhu cầu, nâng niu từng khoảnh khắc</h1>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#5D6C83]">Chọn một trong ba nhu cầu: làm đẹp, thư giãn hoặc trông giữ ban ngày. Xem chi tiết gói trước khi đặt; giá theo hồ sơ thú cưng.</p>
        </div>
      </section>
      <section className="section-space">
        <div className="container-pd">
          <div className="mb-8 grid gap-4 md:grid-cols-3">{[
            ['Grooming','Tắm sạch & cắt tỉa','Chăm sóc vệ sinh, cắt tỉa và tạo kiểu theo nhu cầu.'],
            ['Spa','Thư giãn & dưỡng lông','Chọn liệu trình thư giãn, chăm sóc da và lông.'],
            ['Daycare','Trông giữ ban ngày','Lựa chọn nửa ngày hoặc cả ngày cho chó.']
          ].map(([group,title,description])=><button key={group} onClick={()=>setCategory(group)} className={`rounded-3xl border p-6 text-left transition hover:shadow-lg ${category===group?'border-[#FF765E] bg-[#FFF3EF]':'border-[#DCE7F4] bg-[#F7FAFF]'}`}><span className="text-xs font-bold uppercase tracking-widest text-[#DF715F]">{group}</span><strong className="mt-3 block text-xl text-[#142B55]">{title}</strong><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p><span className="mt-4 inline-block text-sm font-bold text-[#142B55]">Xem các gói →</span></button>)}</div>
          <div className="flex flex-col gap-4 rounded-[24px] border border-[#142B55]/8 bg-white p-4 shadow-[0_14px_50px_rgba(20,43,85,.08)] md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
              {['Tất cả', 'Grooming', 'Spa', 'Daycare'].map(item => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-5 py-3 text-sm font-bold transition ${category === item ? 'bg-[#142B55] text-white' : 'bg-[#F3F7FA] text-[#526179] hover:bg-[#DCEEFF]'}`}>{item}</button>)}
            </div>
            <label className="flex min-w-0 items-center gap-3 rounded-full border border-[#142B55]/12 px-4 py-3 md:w-80"><Icon name="search" size={19} className="text-[#7F8A9D]" /><input className="w-full bg-transparent text-sm text-[#142B55] outline-none placeholder:text-[#929CAC]" value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm dịch vụ cho bé..." /></label>
          </div>
          <div className="mb-7 mt-10 flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-[.12em] text-[#FF765E]">{category === 'Tất cả' ? 'Tất cả dịch vụ' : category}</p><h2 className="mt-2 text-3xl font-extrabold tracking-[-.03em] text-[#142B55]">{filtered.length} gói chăm sóc có thể đặt</h2></div><span className="hidden text-sm text-[#778397] md:block">Giá có thể thay đổi theo cân nặng và tình trạng lông</span></div>
          {filtered.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filtered.map(s => <ServiceCard key={s.id} service={s} compact />)}</div> : <div className="rounded-3xl bg-[#F7FAFD] py-20 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#DCEEFF] text-[#142B55]"><Icon name="search" size={28} /></span><h3 className="mt-5 text-xl font-bold text-[#142B55]">Chưa tìm thấy dịch vụ phù hợp</h3><p className="mt-2 text-[#718096]">Thử một từ khóa khác hoặc xem tất cả dịch vụ nhé.</p></div>}
        </div>
      </section>
      <section className="pb-20">
        <div className="container-pd">
          <div className="relative overflow-hidden rounded-[32px] bg-[#142B55] px-6 py-12 text-white md:px-14 md:py-14">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[45px] border-white/5" />
            <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-2xl"><span className="text-sm font-bold uppercase tracking-[.14em] text-[#FF9A88]">Chưa biết chọn dịch vụ nào?</span><h2 className="mt-3 text-3xl font-extrabold tracking-[-.03em] md:text-4xl">Để PetDay tư vấn riêng cho bé nhé</h2><p className="mt-3 text-white/65">Chia sẻ giống, tuổi và thói quen của bé. Chuyên viên sẽ gợi ý trải nghiệm phù hợp nhất.</p></div>
              <button className="btn-coral shrink-0"><Icon name="phone" size={18} /> Gọi 1900 8668</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Footer() {
  return (
    <footer className="bg-[#0E2143] text-white">
      <div className="container-pd grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_.7fr_.7fr_1fr]">
        <div><Logo light /><p className="mt-5 max-w-sm text-sm leading-7 text-white/60">PetDay mang đến trải nghiệm chăm sóc chuyên nghiệp, an toàn và đầy yêu thương cho mọi người bạn bốn chân.</p></div>
        <div><h3 className="footer-title">Khám phá</h3><div className="footer-links"><button onClick={() => navigateTo('home')}>Trang chủ</button><button onClick={() => navigateTo('services')}>Dịch vụ</button><button onClick={()=>navigateTo("home")}>Về PetDay</button><button onClick={()=>{navigateTo("home");setTimeout(()=>document.getElementById("cam-nang")?.scrollIntoView({behavior:"smooth"}),50)}}>Cẩm nang</button></div></div>
        <div><h3 className="footer-title">Dịch vụ</h3><div className="footer-links"><button onClick={()=>navigateTo("services")}>Grooming</button><button onClick={()=>navigateTo("services")}>Spa thư giãn</button><button onClick={()=>navigateTo("services")}>Daycare</button><button onClick={()=>navigateTo("services")}>Đưa đón tận nơi</button></div></div>
        <div><h3 className="footer-title">Liên hệ</h3><div className="space-y-4 text-sm leading-6 text-white/65"><p className="flex gap-3"><Icon name="location" size={19} className="mt-1 shrink-0 text-[#FF765E]" /> 28 Nguyễn Văn Hưởng, Thảo Điền, TP. Thủ Đức</p><p className="flex gap-3"><Icon name="phone" size={18} className="shrink-0 text-[#FF765E]" /> 1900 8668</p><p className="flex gap-3"><Icon name="mail" size={18} className="shrink-0 text-[#FF765E]" /> hello@petday.vn</p></div></div>
      </div>
      <div className="border-t border-white/8"><div className="container-pd flex flex-col gap-2 py-5 text-xs text-white/40 sm:flex-row sm:justify-between"><span>© 2026 PetDay. Mọi quyền được bảo lưu.</span><span>Điều khoản sử dụng · Chính sách bảo mật · <a href="/#kiem-tra-he-thong" className="underline hover:text-white">Kiểm tra hệ thống</a></span></div></div>
    </footer>
  );
}

export default function App() {
  const getPage = (): Page => new URLSearchParams(window.location.search).has('reset_token') ? 'account' : window.location.hash === '#kiem-tra-he-thong' ? 'system' : window.location.hash === '#dich-vu' ? 'services' : window.location.hash === '#cua-hang' ? 'shop' : window.location.hash === '#dat-lich' ? 'booking' : window.location.hash === '#lich-hen' ? 'appointments' : window.location.hash === '#quan-tri' ? 'admin' : window.location.hash === '#tai-khoan' || window.location.hash === '#nghiep-vu-thuc' ? 'account' : 'home';
  const [page, setPage] = useState<Page>(getPage());
  const [article,setArticle] = useState<typeof careArticles[number]|null>(null);
  useEffect(()=>{const open=(event:Event)=>{const title=(event as CustomEvent<string>).detail;setArticle(careArticles.find(x=>x.title===title)||null)};window.addEventListener("petday:article",open);return ()=>window.removeEventListener("petday:article",open)},[]);
  useEffect(() => {
    const update = () => setPage(getPage());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return <div className="min-h-screen bg-white"><Header page={page} />{page === 'home' ? <HomePage /> : page === 'services' ? <ServicesPage /> : page === 'system' ? <SystemCheck /> : <Portal key={page} view={page as 'account'|'booking'|'appointments'|'admin'|'shop'} onGo={navigateTo} />}<Footer /><SupportWidget />{article&&<CareArticleReader article={article} onClose={()=>setArticle(null)}/>}</div>;
}
