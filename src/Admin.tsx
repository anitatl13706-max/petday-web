import { useEffect, useMemo, useState } from 'react';
import { bookingTransitions, canTransition, loadActions, loadBookings, resetDemoBookings, subscribeBookings, transitionBooking, updateBookingCare, updateBookingPayment, type BookingAction, type BookingStatus, type PaymentStatus, type SharedBooking } from './bookingData';

type AdminTab = 'dashboard' | 'bookings' | 'services' | 'branches' | 'customers' | 'payments' | 'care';

type AdminService = {
  id: string;
  name: string;
  category: 'Grooming' | 'Spa' | 'Daycare';
  basePrice: number;
  duration: string;
  species: string[];
  maxWeight: number;
  weightFees: string;
  active: boolean;
};

type AdminBranch = {
  id: string;
  name: string;
  address: string;
  hours: string;
  capacity: number;
  closureDates: string;
  active: boolean;
};

const keys = {
  pets: 'petday_demo_pets_v1',
  services: 'petday_admin_services_v1',
  branches: 'petday_admin_branches_v1',
};

const defaultServices: AdminService[] = [
  { id: 'grooming', name: 'Grooming toàn diện', category: 'Grooming', basePrice: 180000, duration: '60–90 phút', species: ['Chó', 'Mèo'], maxWeight: 40, weightFees: '≤5kg: 0đ; 5–10kg: 50.000đ; 10–20kg: 100.000đ; >20kg: 160.000đ', active: true },
  { id: 'spa', name: 'Spa dưỡng lông', category: 'Spa', basePrice: 280000, duration: '75–100 phút', species: ['Chó', 'Mèo'], maxWeight: 40, weightFees: '≤5kg: 0đ; 5–10kg: 50.000đ; 10–20kg: 100.000đ; >20kg: 160.000đ', active: true },
  { id: 'daycare', name: 'Daycare cả ngày', category: 'Daycare', basePrice: 320000, duration: 'Tối đa 8 giờ', species: ['Chó'], maxWeight: 30, weightFees: 'Không áp dụng phụ phí cân nặng', active: true },
];

const defaultBranches: AdminBranch[] = [
  { id: 'thao-dien', name: 'PetDay Thảo Điền', address: '28 Nguyễn Văn Hưởng, TP. Thủ Đức (mẫu)', hours: '08:00–20:00', capacity: 3, closureDates: '', active: true },
  { id: 'phu-my-hung', name: 'PetDay Phú Mỹ Hưng', address: 'Khu Cảnh Viên, Quận 7 (mẫu)', hours: '08:00–20:00', capacity: 2, closureDates: '', active: true },
];

const money = (value: number) => `${value.toLocaleString('vi-VN')}đ`;
const dateText = (date: string) => date ? new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN') : 'Chưa có';

function readStorage<T>(key: string, fallback: T): { data: T; error: string } {
  try {
    const raw = localStorage.getItem(key);
    return { data: raw ? JSON.parse(raw) as T : fallback, error: '' };
  } catch {
    return { data: fallback, error: 'Không thể đọc dữ liệu demo trong trình duyệt. Hệ thống đang dùng dữ liệu mặc định.' };
  }
}

function statusClass(status: BookingStatus) {
  if (status === 'Hoàn tất') return 'bg-emerald-50 text-emerald-700';
  if (status === 'Đã hủy') return 'bg-red-50 text-red-700';
  if (status === 'Đang thực hiện') return 'bg-[#E9F4FF] text-[#1769A8]';
  if (status === 'Đã xác nhận') return 'bg-violet-50 text-violet-700';
  return 'bg-[#FFF1EE] text-[#D95A44]';
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="admin-empty"><span>—</span><h3>{title}</h3><p>{text}</p></div>;
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className="admin-stat"><span className={tone}>{value}</span><div><strong>{label}</strong><small>Từ dữ liệu đặt lịch demo</small></div></div>;
}

function ServiceEditor({ initial, onSave, onCancel }: { initial?: AdminService; onSave: (service: AdminService) => void; onCancel: () => void }) {
  const [form, setForm] = useState<AdminService>(initial ?? { id: `service-${Date.now()}`, name: '', category: 'Grooming', basePrice: 0, duration: '', species: ['Chó'], maxWeight: 30, weightFees: '', active: true });
  const [submitted, setSubmitted] = useState(false);
  const valid = form.name.trim() && form.basePrice >= 0 && form.duration.trim() && form.species.length && form.maxWeight > 0 && form.weightFees.trim();
  const toggleSpecies = (species: string) => setForm(current => ({ ...current, species: current.species.includes(species) ? current.species.filter(item => item !== species) : [...current.species, species] }));
  return <div className="admin-form-panel">
    <div className="admin-form-head"><div><h3>{initial ? 'Chỉnh sửa dịch vụ mẫu' : 'Thêm dịch vụ mẫu'}</h3><p>Giá và quy tắc dưới đây chỉ dùng trong prototype quản trị.</p></div><button onClick={onCancel}>Đóng</button></div>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="admin-field"><span>Tên dịch vụ *</span><input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
      <label className="admin-field"><span>Danh mục *</span><select value={form.category} onChange={event => setForm({ ...form, category: event.target.value as AdminService['category'] })}><option>Grooming</option><option>Spa</option><option>Daycare</option></select></label>
      <label className="admin-field"><span>Giá cơ sở demo *</span><input type="number" min="0" value={form.basePrice} onChange={event => setForm({ ...form, basePrice: Number(event.target.value) })} /></label>
      <label className="admin-field"><span>Thời lượng *</span><input value={form.duration} onChange={event => setForm({ ...form, duration: event.target.value })} placeholder="Ví dụ: 60–90 phút" /></label>
      <label className="admin-field"><span>Giới hạn cân nặng (kg) *</span><input type="number" min="1" value={form.maxWeight} onChange={event => setForm({ ...form, maxWeight: Number(event.target.value) })} /></label>
      <div className="admin-field"><span>Loài áp dụng *</span><div className="flex h-12 items-center gap-5"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.species.includes('Chó')} onChange={() => toggleSpecies('Chó')} /> Chó</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.species.includes('Mèo')} onChange={() => toggleSpecies('Mèo')} /> Mèo</label></div></div>
      <label className="admin-field md:col-span-2"><span>Quy tắc giá theo cân nặng *</span><textarea rows={3} value={form.weightFees} onChange={event => setForm({ ...form, weightFees: event.target.value })} /></label>
    </div>
    {submitted && !valid && <p className="admin-error">Vui lòng nhập đầy đủ các trường bắt buộc và dùng giá trị hợp lệ.</p>}
    <div className="mt-5 flex justify-end gap-3"><button className="admin-btn secondary" onClick={onCancel}>Hủy</button><button className="admin-btn primary" onClick={() => { setSubmitted(true); if (valid) onSave(form); }}>Lưu cấu hình mẫu</button></div>
  </div>;
}

function BranchEditor({ initial, onSave, onCancel }: { initial?: AdminBranch; onSave: (branch: AdminBranch) => void; onCancel: () => void }) {
  const [form, setForm] = useState<AdminBranch>(initial ?? { id: `branch-${Date.now()}`, name: '', address: '', hours: '08:00–20:00', capacity: 1, closureDates: '', active: true });
  const [submitted, setSubmitted] = useState(false);
  const valid = form.name.trim() && form.address.trim() && form.hours.trim() && form.capacity > 0;
  return <div className="admin-form-panel">
    <div className="admin-form-head"><div><h3>{initial ? 'Chỉnh sửa chi nhánh mẫu' : 'Thêm chi nhánh mẫu'}</h3><p>Lịch mở cửa và sức chứa không đại diện cho vận hành thực tế.</p></div><button onClick={onCancel}>Đóng</button></div>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="admin-field"><span>Tên chi nhánh *</span><input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
      <label className="admin-field"><span>Địa chỉ mẫu *</span><input value={form.address} onChange={event => setForm({ ...form, address: event.target.value })} /></label>
      <label className="admin-field"><span>Giờ mở cửa *</span><input value={form.hours} onChange={event => setForm({ ...form, hours: event.target.value })} /></label>
      <label className="admin-field"><span>Công suất mỗi khung giờ *</span><input type="number" min="1" value={form.capacity} onChange={event => setForm({ ...form, capacity: Number(event.target.value) })} /></label>
      <label className="admin-field md:col-span-2"><span>Ngày đóng cửa mẫu</span><input value={form.closureDates} onChange={event => setForm({ ...form, closureDates: event.target.value })} placeholder="YYYY-MM-DD, cách nhau bằng dấu phẩy" /></label>
    </div>
    {submitted && !valid && <p className="admin-error">Vui lòng nhập đầy đủ thông tin và công suất lớn hơn 0.</p>}
    <div className="mt-5 flex justify-end gap-3"><button className="admin-btn secondary" onClick={onCancel}>Hủy</button><button className="admin-btn primary" onClick={() => { setSubmitted(true); if (valid) onSave(form); }}>Lưu chi nhánh mẫu</button></div>
  </div>;
}

export function AdminDashboard({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const serviceLoad = readStorage<AdminService[]>(keys.services, defaultServices);
  const branchLoad = readStorage<AdminBranch[]>(keys.branches, defaultBranches);
  const [bookings, setBookings] = useState<SharedBooking[]>(() => loadBookings());
  const [actions, setActions] = useState<BookingAction[]>(() => loadActions());
  const [services, setServices] = useState(serviceLoad.data);
  const [branches, setBranches] = useState(branchLoad.data);
  const [error, setError] = useState(serviceLoad.error || branchLoad.error);
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [editingService, setEditingService] = useState<AdminService | 'new' | null>(null);
  const [editingBranch, setEditingBranch] = useState<AdminBranch | 'new' | null>(null);
  const [careCode, setCareCode] = useState('');
  const [careNote, setCareNote] = useState('');
  const [careDate, setCareDate] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 250);
    const unsubscribe = subscribeBookings(next => { setBookings(next); setActions(loadActions()); });
    return () => { window.clearTimeout(timer); unsubscribe(); };
  }, []);

  const persistServices = (next: AdminService[]) => { localStorage.setItem(keys.services, JSON.stringify(next)); setServices(next); };
  const persistBranches = (next: AdminBranch[]) => { localStorage.setItem(keys.branches, JSON.stringify(next)); setBranches(next); };

  const filteredBookings = useMemo(() => bookings.filter(item => `${item.code} ${item.pet?.name} ${item.owner?.name ?? ''} ${item.service}`.toLowerCase().includes(query.toLowerCase())), [bookings, query]);
  const selected = bookings.find(item => item.code === selectedCode);
  const pets = readStorage<any[]>(keys.pets, []).data;
  const customerMap = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; email: string; bookings: SharedBooking[] }>();
    bookings.forEach(item => {
      const owner = item.owner;
      const key = owner.email || owner.phone || owner.name;
      const current = map.get(key) ?? { ...owner, bookings: [] };
      current.bookings.push(item);
      map.set(key, current);
    });
    return [...map.values()];
  }, [bookings]);

  const updateStatus = (booking: SharedBooking, next: BookingStatus) => {
    if (!canTransition(booking.status, next)) {
      setError(`Không thể chuyển từ “${booking.status}” sang “${next}”.`);
      return;
    }
    const message = next === 'Đã hủy'
      ? `Xác nhận hủy lịch mẫu ${booking.code}? Hành động này không thể hoàn tác trong luồng trạng thái.`
      : `Xác nhận chuyển lịch ${booking.code} từ “${booking.status}” sang “${next}”?`;
    if (!window.confirm(message)) return;
    try {
      setBookings(transitionBooking(booking.code, next));
      setActions(loadActions());
      setError('');
      setNotice(`Đã chuyển lịch ${booking.code} sang “${next}”.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Không thể lưu thay đổi trạng thái.');
    }
  };

  const updatePayment = (code: string, paymentStatus: PaymentStatus) => {
    if (!window.confirm(`Xác nhận cập nhật trạng thái thanh toán của lịch ${code} thành “${paymentStatus}”? Trạng thái lịch hẹn sẽ không thay đổi.`)) return;
    try {
      setBookings(updateBookingPayment(code, paymentStatus));
      setActions(loadActions());
      setError('');
      setNotice(`Đã cập nhật thanh toán của lịch ${code}.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Không thể lưu thay đổi thanh toán.');
    }
  };

  const navItems: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: '▦' },
    { id: 'bookings', label: 'Lịch hẹn', icon: '◷' },
    { id: 'services', label: 'Dịch vụ', icon: '✦' },
    { id: 'branches', label: 'Chi nhánh & lịch', icon: '⌖' },
    { id: 'customers', label: 'Khách hàng & thú cưng', icon: '◎' },
    { id: 'payments', label: 'Thanh toán mẫu', icon: '₫' },
    { id: 'care', label: 'Chăm sóc & đánh giá', icon: '♡' },
  ];

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#F4F7FA]"><div className="text-center"><span className="admin-loader" /><p className="mt-4 text-sm font-semibold text-[#66748A]">Đang tải dữ liệu quản trị demo...</p></div></div>;

  return <div className="min-h-screen bg-[#F4F7FA] lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
    <aside className="admin-sidebar">
      <div className="flex items-center gap-3 px-5 py-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-lg font-black text-[#142B55]">P</span><div><strong className="block text-xl">Pet<span className="text-[#FF8A75]">Day</span></strong><small className="text-white/50">Trung tâm quản trị</small></div></div>
      <div className="mx-4 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs leading-5 text-white/65"><strong className="block text-white">Chế độ DEMO</strong>Không phải dữ liệu vận hành hoặc thanh toán thật.</div>
      <nav className="admin-nav">{navItems.map(item => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => { setTab(item.id); setSelectedCode(''); setQuery(''); }}><span>{item.icon}</span>{item.label}</button>)}</nav>
      <div className="mt-auto p-4"><div className="rounded-2xl bg-white/8 p-3"><span className="text-[10px] font-bold uppercase tracking-wider text-white/45">Vai trò thử nghiệm</span><strong className="mt-1 block text-sm">Quản trị viên DEMO</strong><button className="mt-3 w-full rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#142B55]" onClick={onExit}>Chuyển sang giao diện khách</button></div></div>
    </aside>

    <main className="min-w-0">
      <header className="admin-topbar"><div><span className="text-xs font-bold uppercase tracking-wider text-[#FF765E]">Trung tâm chăm sóc PetDay</span><h1>{navItems.find(item => item.id === tab)?.label}</h1></div><div className="flex items-center gap-3"><span className="hidden rounded-full bg-[#EAF4FC] px-3 py-2 text-xs font-bold text-[#365776] sm:block">Dữ liệu mẫu</span><div className="grid h-10 w-10 place-items-center rounded-full bg-[#142B55] text-sm font-bold text-white">QT</div></div></header>
      <div className="admin-mobile-nav">{navItems.map(item => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => { setTab(item.id); setQuery(''); }}>{item.label}</button>)}</div>
      <div className="admin-workspace">
        {error && <div className="admin-alert"><span>{error}</span><button onClick={() => setError('')}>Đóng</button></div>}
        {notice && <div className="mb-5 flex items-center justify-between rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"><span>{notice}</span><button onClick={() => setNotice('')}>Đóng</button></div>}

        {tab === 'dashboard' && <div>
          <div className="admin-page-head"><div><h2>Tình hình đặt lịch</h2><p>Các số liệu được tính trực tiếp từ bản ghi đặt lịch trong trình duyệt này.</p></div><button className="admin-btn primary" onClick={() => setTab('bookings')}>Quản lý lịch hẹn</button></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Tổng lịch hẹn" value={bookings.length} tone="bg-[#EAF4FC] text-[#1769A8]" />
            <StatCard label="Chờ xác nhận" value={bookings.filter(item => item.status === 'Đang chờ xác nhận').length} tone="bg-[#FFF1EE] text-[#D95A44]" />
            <StatCard label="Đã hoàn tất" value={bookings.filter(item => item.status === 'Hoàn tất').length} tone="bg-emerald-50 text-emerald-700" />
            <StatCard label="Đã hủy" value={bookings.filter(item => item.status === 'Đã hủy').length} tone="bg-red-50 text-red-700" />
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
            <section className="admin-card"><div className="admin-card-head"><div><h3>Lịch hẹn gần đây</h3><p>Cập nhật theo dữ liệu khách vừa tạo.</p></div></div>{bookings.length ? <div className="admin-list">{bookings.slice(0, 5).map(item => <button key={item.code} onClick={() => { setSelectedCode(item.code); setTab('bookings'); }}><div><strong>{item.pet?.name ?? 'Chưa có tên'} · {item.service}</strong><span>{item.code} · {dateText(item.date)} lúc {item.slot}</span></div><span className={`status-pill ${statusClass(item.status)}`}>{item.status}</span></button>)}</div> : <EmptyState title="Chưa có lịch hẹn" text="Lịch do khách tạo trong Booking Wizard sẽ xuất hiện tại đây." />}</section>
            <section className="admin-card"><div className="admin-card-head"><div><h3>Thanh toán mẫu</h3><p>Tách biệt với trạng thái lịch.</p></div></div><div className="space-y-4">{(['Chưa thanh toán', 'Thanh toán mô phỏng thành công', 'Thanh toán thất bại (mô phỏng)', 'Đã hoàn tiền (mô phỏng)'] as PaymentStatus[]).map(status => <div key={status} className="flex items-center justify-between text-sm"><span className="text-[#66748A]">{status}</span><strong className="text-[#142B55]">{bookings.filter(item => (item.paymentStatus ?? 'Chưa thanh toán') === status).length}</strong></div>)}</div></section>
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <section className="admin-card"><div className="admin-card-head"><div><h3>Phân bổ trạng thái</h3><p>Không bao gồm doanh thu giả định.</p></div></div><div className="space-y-3">{(['Đang chờ xác nhận', 'Đã xác nhận', 'Đang thực hiện', 'Hoàn tất', 'Đã hủy'] as BookingStatus[]).map(status => <div key={status} className="flex items-center justify-between text-xs"><span className={`status-pill ${statusClass(status)}`}>{status}</span><strong className="text-[#142B55]">{bookings.filter(item => item.status === status).length}</strong></div>)}</div></section>
            <section className="admin-card"><div className="admin-card-head"><div><h3>Lịch sắp tới</h3><p>Theo ngày hẹn trong bản ghi demo.</p></div></div>{bookings.filter(item => !['Hoàn tất', 'Đã hủy'].includes(item.status) && item.date >= new Date().toISOString().slice(0, 10)).sort((a, b) => `${a.date}${a.slot}`.localeCompare(`${b.date}${b.slot}`)).slice(0, 4).map(item => <button key={item.code} className="mb-3 block w-full text-left" onClick={() => { setSelectedCode(item.code); setTab('bookings'); }}><strong className="block text-xs text-[#142B55]">{item.pet.name} · {item.service}</strong><span className="mt-1 block text-[10px] text-[#7D899B]">{dateText(item.date)} lúc {item.slot}</span></button>)}{!bookings.some(item => !['Hoàn tất', 'Đã hủy'].includes(item.status) && item.date >= new Date().toISOString().slice(0, 10)) && <p className="text-xs text-[#8490A1]">Chưa có lịch sắp tới.</p>}</section>
            <section className="admin-card"><div className="admin-card-head"><div><h3>Hoạt động gần đây</h3><p>Lịch sử thao tác trên dữ liệu mẫu.</p></div></div>{actions.length ? <div className="space-y-3">{actions.slice(0, 5).map(action => <div key={action.id} className="border-l-2 border-[#DCEEFF] pl-3"><strong className="block text-[11px] text-[#142B55]">{action.label}</strong><span className="mt-1 block text-[9px] text-[#8A95A5]">{action.bookingCode || 'Hệ thống'} · {new Date(action.createdAt).toLocaleString('vi-VN')}</span></div>)}</div> : <p className="text-xs text-[#8490A1]">Chưa có hoạt động quản trị.</p>}</section>
          </div>
          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 p-5 sm:flex-row sm:items-center"><div><strong className="text-sm text-red-800">Đặt lại dữ liệu lịch hẹn DEMO</strong><p className="mt-1 text-xs text-red-600">Xóa lịch hẹn và lịch sử thao tác trên trình duyệt này. Hồ sơ thú cưng không bị xóa.</p></div><button className="admin-btn danger" onClick={() => { if (!window.confirm('Bạn có chắc muốn xóa toàn bộ lịch hẹn và lịch sử thao tác DEMO? Hành động này không thể hoàn tác.')) return; resetDemoBookings(); setBookings([]); setActions([]); setSelectedCode(''); }}>Đặt lại DEMO</button></div>
        </div>}

        {tab === 'bookings' && <div>
          <div className="admin-page-head"><div><h2>Quản lý lịch hẹn</h2><p>Tìm kiếm, xem chi tiết và cập nhật trạng thái mẫu.</p></div><label className="admin-search"><span>⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm mã, khách, thú cưng, dịch vụ..." /></label></div>
          {!filteredBookings.length ? <EmptyState title="Không tìm thấy lịch hẹn" text={bookings.length ? 'Thử từ khóa khác.' : 'Hãy tạo một lịch từ giao diện khách hàng để bắt đầu.'} /> :
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]"><div className="admin-card overflow-hidden p-0"><div className="overflow-x-auto"><table className="admin-table"><thead><tr><th>Mã mẫu</th><th>Khách & thú cưng</th><th>Dịch vụ</th><th>Lịch</th><th>Trạng thái</th></tr></thead><tbody>{filteredBookings.map(item => <tr key={item.code} className={selectedCode === item.code ? 'selected' : ''} onClick={() => setSelectedCode(item.code)}><td><strong>{item.code}</strong></td><td>{item.owner?.name ?? 'Khách hàng demo'}<small>{item.pet?.name} · {item.pet?.species}</small></td><td>{item.service}<small>{money(item.total)}</small></td><td>{dateText(item.date)}<small>{item.slot} · {item.branch}</small></td><td><span className={`status-pill ${statusClass(item.status)}`}>{item.status}</span></td></tr>)}</tbody></table></div></div>
              {selected ? <aside className="admin-detail"><div className="flex items-start justify-between"><div><span className="demo-badge">Chi tiết mẫu</span><h3 className="mt-3">{selected.code}</h3></div><button onClick={() => setSelectedCode('')}>×</button></div>
                <div className="detail-section"><span>Khách hàng</span><strong>{selected.owner.name}</strong><p>Điện thoại: {selected.owner.phone || 'Chưa cung cấp'} · Email: {selected.owner.email || 'Chưa cung cấp'}</p></div>
                <div className="detail-section"><span>Thú cưng</span><strong>{selected.pet.name} · {selected.pet.species} · {selected.pet.breed}</strong><p>{selected.pet.age} tuổi, {selected.pet.weight} kg. Lưu ý: {selected.pet.notes || 'Không có'}.</p></div>
                <div className="detail-section"><span>Dịch vụ & lịch</span><strong>{selected.service}</strong><p>{selected.addons?.length ? selected.addons.join(', ') : 'Không có add-on'} · {selected.duration}</p><p>{selected.branch} (mẫu), {dateText(selected.date)} lúc {selected.slot}</p></div>
                <div className="detail-section"><span>Sản phẩm & Pet Taxi</span><strong>{selected.products?.length ? selected.products.map(item => `${item.name} × ${item.quantity}`).join(', ') : 'Không có sản phẩm'}</strong><p>{selected.taxi ? 'Có Pet Taxi mẫu' : 'Không dùng Pet Taxi'}</p></div>
                <div className="detail-section"><span>Chi phí chi tiết</span>{selected.lineItems.map((line, index) => <div key={`${line.type}-${index}`} className="flex justify-between gap-3 text-sm"><p>{line.label}</p><strong>{money(line.amount)}</strong></div>)}<div className="mt-2 flex justify-between border-t border-[#142B55]/10 pt-2"><strong>Tổng cuối cùng</strong><strong>{money(selected.total)}</strong></div></div>
                <div className="detail-section"><span>Trạng thái lịch</span><div className="mt-2 flex flex-wrap gap-2">{bookingTransitions[selected.status].map(next => <button key={next} className={`admin-btn small ${next === 'Đã hủy' ? 'danger' : 'secondary'}`} onClick={() => updateStatus(selected, next)}>{next === 'Đã hủy' ? 'Hủy lịch' : `Chuyển: ${next}`}</button>)}{!bookingTransitions[selected.status].length && <p>Không còn bước chuyển hợp lệ.</p>}</div></div>
                <div className="detail-section"><span>Thanh toán độc lập</span><select className="mt-2 w-full rounded-xl border border-[#142B55]/12 p-3 text-sm" value={selected.paymentStatus ?? 'Chưa thanh toán'} onChange={event => updatePayment(selected.code, event.target.value as PaymentStatus)}><option>Chưa thanh toán</option><option>Thanh toán mô phỏng thành công</option><option>Thanh toán thất bại (mô phỏng)</option><option>Đã hoàn tiền (mô phỏng)</option></select><p className="mt-2">Không xử lý tiền thật hoặc ký quỹ.</p></div>
              </aside> : <div className="admin-detail grid min-h-72 place-items-center text-center"><div><strong>Chọn một lịch hẹn</strong><p className="mt-2 text-sm text-[#778397]">Chi tiết và thao tác trạng thái sẽ xuất hiện tại đây.</p></div></div>}
            </div>}
        </div>}

        {tab === 'services' && <div>
          <div className="admin-page-head"><div><h2>Cấu hình dịch vụ</h2><p>Danh mục và giá quản trị đều là cấu hình mẫu.</p></div><button className="admin-btn primary" onClick={() => setEditingService('new')}>+ Thêm dịch vụ</button></div>
          {editingService && <div className="mb-6"><ServiceEditor initial={editingService === 'new' ? undefined : editingService} onCancel={() => setEditingService(null)} onSave={service => { const next = services.some(item => item.id === service.id) ? services.map(item => item.id === service.id ? service : item) : [...services, service]; persistServices(next); setEditingService(null); }} /></div>}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{services.map(service => <article key={service.id} className="admin-card"><div className="flex items-start justify-between"><span className="demo-badge">{service.category}</span><span className={`status-pill ${service.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{service.active ? 'Đang hiển thị' : 'Đã ẩn'}</span></div><h3 className="mt-4">{service.name}</h3><strong className="mt-2 block text-xl text-[#142B55]">{money(service.basePrice)} <small className="text-[10px] font-normal text-[#8490A1]">mẫu</small></strong><div className="mt-4 space-y-2 text-xs leading-5 text-[#69768A]"><p>{service.duration} · {service.species.join(', ')}</p><p>Tối đa {service.maxWeight} kg</p><p>{service.weightFees}</p></div><div className="mt-5 flex gap-2 border-t border-[#142B55]/8 pt-4"><button className="admin-btn secondary small" onClick={() => setEditingService(service)}>Chỉnh sửa</button><button className="admin-btn secondary small" onClick={() => persistServices(services.map(item => item.id === service.id ? { ...item, active: !item.active } : item))}>{service.active ? 'Ẩn dịch vụ' : 'Hiện dịch vụ'}</button></div></article>)}</div>
        </div>}

        {tab === 'branches' && <div>
          <div className="admin-page-head"><div><h2>Chi nhánh và lịch hoạt động</h2><p>Quản lý giờ mở cửa, công suất và ngày đóng cửa mẫu.</p></div><button className="admin-btn primary" onClick={() => setEditingBranch('new')}>+ Thêm chi nhánh</button></div>
          {editingBranch && <div className="mb-6"><BranchEditor initial={editingBranch === 'new' ? undefined : editingBranch} onCancel={() => setEditingBranch(null)} onSave={branch => { const next = branches.some(item => item.id === branch.id) ? branches.map(item => item.id === branch.id ? branch : item) : [...branches, branch]; persistBranches(next); setEditingBranch(null); }} /></div>}
          <div className="grid gap-5 lg:grid-cols-2">{branches.map(branch => <article key={branch.id} className="admin-card"><div className="flex items-start justify-between"><div><span className="demo-badge">Chi nhánh mẫu</span><h3 className="mt-3">{branch.name}</h3></div><span className={`status-pill ${branch.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{branch.active ? 'Đang mở' : 'Tạm ẩn'}</span></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="detail-section m-0"><span>Địa chỉ</span><p>{branch.address}</p></div><div className="detail-section m-0"><span>Giờ mở cửa mẫu</span><strong>{branch.hours}</strong></div><div className="detail-section m-0"><span>Công suất mẫu</span><strong>{branch.capacity} lượt / khung giờ</strong></div><div className="detail-section m-0"><span>Ngày đóng cửa</span><p>{branch.closureDates || 'Chưa cấu hình'}</p></div></div><div className="mt-5 flex gap-2"><button className="admin-btn secondary small" onClick={() => setEditingBranch(branch)}>Chỉnh sửa lịch</button><button className="admin-btn secondary small" onClick={() => persistBranches(branches.map(item => item.id === branch.id ? { ...item, active: !item.active } : item))}>{branch.active ? 'Tạm ẩn' : 'Kích hoạt'}</button></div></article>)}</div>
        </div>}

        {tab === 'customers' && <div>
          <div className="admin-page-head"><div><h2>Khách hàng và thú cưng</h2><p>Chỉ xem trong vai trò quản trị demo; chỉnh sửa hồ sơ bị giới hạn quyền.</p></div><label className="admin-search"><span>⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm khách hàng..." /></label></div>
          {!customerMap.length ? <EmptyState title="Chưa có khách hàng" text="Khách hàng sẽ được tổng hợp từ lịch hẹn mẫu." /> : <div className="grid gap-5 lg:grid-cols-2">{customerMap.filter(customer => `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(query.toLowerCase())).map(customer => <article key={customer.email + customer.phone + customer.name} className="admin-card"><div className="flex items-start justify-between"><div><span className="demo-badge">Tài khoản mẫu</span><h3 className="mt-3">{customer.name}</h3><p className="mt-1 text-xs text-[#718095]">Điện thoại: {customer.phone || 'Chưa cung cấp'} · Email: {customer.email || 'Chưa cung cấp'}</p></div><button className="admin-btn secondary small" disabled title="Yêu cầu quyền quản trị viên cấp cao">Chỉnh sửa bị khóa</button></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="review-card"><span>Lịch hẹn</span><strong>{customer.bookings.length}</strong></div><div className="review-card"><span>Thú cưng trên trình duyệt</span><strong>{pets.length}</strong></div></div><div className="mt-5"><span className="text-[10px] font-bold uppercase tracking-wider text-[#8A95A5]">Thú cưng</span><div className="mt-2 flex flex-wrap gap-2">{pets.length ? pets.map(pet => <span key={pet.id} className="rounded-full bg-[#EDF5FC] px-3 py-2 text-xs font-semibold text-[#365776]">{pet.name} · {pet.species} · {pet.breed}</span>) : <p className="text-sm text-[#7B8799]">Chưa có hồ sơ thú cưng.</p>}</div></div></article>)}</div>}
        </div>}

        {tab === 'payments' && <div>
          <div className="admin-page-head"><div><h2>Bản ghi thanh toán mẫu</h2><p>Trạng thái thanh toán độc lập với tiến trình thực hiện dịch vụ.</p></div></div>
          {!bookings.length ? <EmptyState title="Chưa có bản ghi thanh toán" text="Dữ liệu xuất hiện sau khi khách tạo lịch mẫu." /> : <div className="admin-card overflow-hidden p-0"><div className="overflow-x-auto"><table className="admin-table"><thead><tr><th>Mã lịch</th><th>Khách hàng</th><th>Phương thức</th><th>Số tiền mẫu</th><th>Trạng thái thanh toán</th></tr></thead><tbody>{bookings.map(item => <tr key={item.code}><td><strong>{item.code}</strong></td><td>{item.owner?.name ?? 'Khách hàng demo'}</td><td>{item.payment}</td><td>{money(item.total)}</td><td><select className="rounded-lg border border-[#142B55]/12 p-2 text-xs" value={item.paymentStatus ?? 'Chưa thanh toán'} onChange={event => updatePayment(item.code, event.target.value as PaymentStatus)}><option>Chưa thanh toán</option><option>Thanh toán mô phỏng thành công</option><option>Thanh toán thất bại (mô phỏng)</option><option>Đã hoàn tiền (mô phỏng)</option></select></td></tr>)}</tbody></table></div></div>}
          <div className="mt-5 rounded-2xl border border-[#B9D8F4] bg-[#EDF7FF] p-4 text-sm leading-6 text-[#425A78]"><strong className="text-[#142B55]">Lưu ý DEMO:</strong> Không có giao dịch, ký quỹ, hoàn tiền hoặc đối soát thật được thực hiện.</div>
        </div>}

        {tab === 'care' && <div>
          <div className="admin-page-head"><div><h2>Nhật ký chăm sóc và đánh giá</h2><p>Chỉ lịch đã hoàn tất mới được tạo nhật ký và nhận đánh giá mẫu.</p></div></div>
          {!bookings.some(item => item.status === 'Hoàn tất') ? <EmptyState title="Chưa có dịch vụ hoàn tất" text="Chuyển một lịch qua đúng chuỗi trạng thái để mở nhật ký chăm sóc và đánh giá." /> : <div className="grid gap-5 xl:grid-cols-2">{bookings.filter(item => item.status === 'Hoàn tất').map(item => <article key={item.code} className="admin-card"><div className="flex items-start justify-between"><div><span className="demo-badge">Đủ điều kiện</span><h3 className="mt-3">{item.service} · bé {item.pet.name}</h3><p className="mt-1 text-xs text-[#718095]">{item.code} · {dateText(item.date)}</p></div><span className={`status-pill ${statusClass(item.status)}`}>{item.status}</span></div>
            {careCode === item.code ? <div className="mt-5 space-y-4"><label className="admin-field"><span>Ghi chú hoàn tất *</span><textarea rows={3} value={careNote} onChange={event => setCareNote(event.target.value)} placeholder="Ghi nhận tình trạng lông, hành vi, lưu ý sau dịch vụ..." /></label><label className="admin-field"><span>Ngày chăm sóc *</span><input type="date" value={careDate} onChange={event => setCareDate(event.target.value)} /></label>{(!careNote.trim() || !careDate) && <p className="admin-error">Cần nhập ghi chú và ngày chăm sóc trước khi lưu.</p>}<div className="flex justify-end gap-2"><button className="admin-btn secondary small" onClick={() => setCareCode('')}>Hủy</button><button className="admin-btn primary small" onClick={() => { if (!careNote.trim() || !careDate || !window.confirm(`Xác nhận lưu nhật ký chăm sóc cho lịch ${item.code}?`)) return; const completion = { notes: careNote.trim(), careDate, pet: { id: item.pet.id, name: item.pet.name, species: item.pet.species, breed: item.pet.breed, age: item.pet.age, weight: item.pet.weight } }; try { setBookings(updateBookingCare(item.code, completion)); setActions(loadActions()); setNotice(`Đã lưu nhật ký chăm sóc cho lịch ${item.code}.`); setError(''); setCareCode(''); setCareNote(''); setCareDate(''); } catch (error) { setError(error instanceof Error ? error.message : 'Không thể lưu nhật ký chăm sóc.'); } }}>Lưu hồ sơ hoàn tất</button></div></div> :
              <div className="mt-5"><div className="detail-section m-0"><span>Hồ sơ hoàn tất chăm sóc</span><p>{item.careCompletion?.notes || 'Chưa có ghi chú hoàn tất.'}</p>{item.careCompletion && <p>Ngày chăm sóc: {dateText(item.careCompletion.careDate)} · {item.careCompletion.pet.name}, {item.careCompletion.pet.breed}, {item.careCompletion.pet.weight} kg</p>}</div><div className="detail-section"><span>Đánh giá sau hoàn tất</span><p>{item.review ? `${item.review.rating}/5 · ${item.review.comment}` : 'Khách chưa gửi đánh giá mẫu.'}</p></div><button className="admin-btn secondary small" onClick={() => { setCareCode(item.code); setCareNote(item.careCompletion?.notes ?? ''); setCareDate(item.careCompletion?.careDate ?? item.date); }}>{item.careCompletion ? 'Cập nhật hồ sơ hoàn tất' : 'Tạo hồ sơ hoàn tất'}</button></div>}
          </article>)}</div>}
        </div>}
      </div>
    </main>
  </div>;
}
