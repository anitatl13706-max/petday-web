import { useEffect, useMemo, useRef, useState } from 'react';
import { createBooking, loadBookings, submitBookingReview, subscribeBookings, type BookingLineItem, type NewBooking, type SharedBooking } from './bookingData';

type Species = 'Chó' | 'Mèo';
type Pet = {
  id: string;
  name: string;
  species: Species;
  breed: string;
  age: number;
  weight: number;
  coat: 'Ngắn' | 'Dài' | 'Xoăn' | 'Không rõ';
  notes: string;
  sample?: boolean;
};

type ServiceKey = 'grooming' | 'spa' | 'daycare';
const money = (value: number) => `${value.toLocaleString('vi-VN')}đ`;
const storage = {
  pets: 'petday_demo_pets_v1',
};

const samplePet: Pet = {
  id: 'pet-demo-bo',
  name: 'Bơ',
  species: 'Chó',
  breed: 'Poodle',
  age: 3,
  weight: 6.5,
  coat: 'Xoăn',
  notes: 'Hơi nhạy cảm với tiếng máy sấy.',
  sample: true,
};

const serviceRules = {
  grooming: { name: 'Grooming toàn diện', category: 'Grooming', base: 180000, duration: '60–90 phút', description: 'Tắm, sấy, vệ sinh cơ bản và chải lông.', species: ['Chó', 'Mèo'] as Species[], maxWeight: 40, capacityUnits: 1 },
  spa: { name: 'Spa dưỡng lông', category: 'Spa', base: 280000, duration: '75–100 phút', description: 'Làm sạch dịu nhẹ, ủ dưỡng và massage thư giãn.', species: ['Chó', 'Mèo'] as Species[], maxWeight: 40, capacityUnits: 2 },
  daycare: { name: 'Daycare cả ngày', category: 'Daycare', base: 320000, duration: 'Tối đa 8 giờ', description: 'Vui chơi có giám sát, nghỉ ngơi và cập nhật hình ảnh.', species: ['Chó'] as Species[], maxWeight: 30, capacityUnits: 2 },
} satisfies Record<ServiceKey, { name: string; category: string; base: number; duration: string; description: string; species: Species[]; maxWeight: number; capacityUnits: number }>;

const weightRules = [
  { max: 5, label: 'Đến 5 kg', fee: 0 },
  { max: 10, label: 'Trên 5–10 kg', fee: 50000 },
  { max: 20, label: 'Trên 10–20 kg', fee: 100000 },
  { max: Infinity, label: 'Trên 20 kg', fee: 160000 },
];

const addOnRules = [
  { id: 'nails', name: 'Mài móng êm', price: 50000, services: ['grooming', 'spa'] as ServiceKey[] },
  { id: 'teeth', name: 'Vệ sinh răng miệng', price: 60000, services: ['grooming', 'spa', 'daycare'] as ServiceKey[] },
  { id: 'paw', name: 'Dưỡng bàn chân', price: 70000, services: ['grooming', 'spa'] as ServiceKey[] },
  { id: 'photo', name: 'Bộ ảnh trong ngày', price: 40000, services: ['daycare'] as ServiceKey[] },
];

const demoProducts = [
  { id: 'shampoo', name: 'Sữa tắm dịu nhẹ PetDay', species: ['Chó', 'Mèo'] as Species[], price: 165000, stock: 4, image: 'https://images.unsplash.com/photo-1704307068094-c2c88c467014?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=500' },
  { id: 'brush', name: 'Lược chải lông mềm', species: ['Mèo'] as Species[], price: 120000, stock: 3, image: 'https://images.unsplash.com/photo-1635859714497-32ae659dc82e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=500' },
  { id: 'treat', name: 'Bánh thưởng huấn luyện', species: ['Chó'] as Species[], price: 89000, stock: 5, image: 'https://images.unsplash.com/photo-1747577672101-f4cd34bcedd4?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=500' },
];

const branches = [
  { id: 'thao-dien', name: 'PetDay Thảo Điền', address: '28 Nguyễn Văn Hưởng, TP. Thủ Đức' },
  { id: 'phu-my-hung', name: 'PetDay Phú Mỹ Hưng', address: 'Khu Cảnh Viên, Quận 7' },
];

const timeSlots = [
  { time: '08:30', capacity: 3 },
  { time: '10:00', capacity: 2 },
  { time: '13:30', capacity: 3 },
  { time: '15:00', capacity: 2 },
  { time: '17:30', capacity: 2 },
];

function getStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function inputDate(days = 1) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function mockReserved(branch: string, date: string, slot: string) {
  const seed = [...`${branch}${date}${slot}`].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const capacity = timeSlots.find(item => item.time === slot)?.capacity ?? 1;
  return seed % capacity;
}

function isServiceCompatible(key: ServiceKey, pet?: Pet) {
  if (!pet) return false;
  const rule = serviceRules[key];
  return rule.species.includes(pet.species) && pet.weight <= rule.maxWeight;
}

function slotState(branch: string, date: string, slot: string, service: ServiceKey) {
  const config = timeSlots.find(item => item.time === slot);
  if (!config) return { available: false, remaining: 0, reason: 'Khung giờ không hợp lệ' };
  const branchCapacity = branch === 'phu-my-hung' ? Math.max(2, config.capacity - 1) : config.capacity;
  const scheduleAllowed = service !== 'daycare' || ['08:30', '10:00'].includes(slot);
  const closingAllowed = service !== 'spa' || slot !== '17:30';
  if (!scheduleAllowed || !closingAllowed) return { available: false, remaining: 0, reason: 'Không phù hợp thời lượng dịch vụ' };
  const occupied = mockReserved(branch, date, slot);
  const units = serviceRules[service].capacityUnits;
  return {
    available: occupied + units <= branchCapacity,
    remaining: Math.max(0, branchCapacity - occupied),
    reason: occupied + units <= branchCapacity ? '' : 'Đã đủ công suất mẫu',
  };
}

function FieldError({ children }: { children?: string }) {
  return children ? <p className="mt-1.5 text-xs font-semibold text-red-600">{children}</p> : null;
}

function DemoNotice({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-[#B9D8F4] bg-[#EDF7FF] px-4 py-3 text-sm leading-6 text-[#425A78]"><strong className="text-[#142B55]">Dữ liệu demo:</strong> {children}</div>;
}

function PetForm({ initial, onSave, onCancel }: { initial?: Pet; onSave: (pet: Pet) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Omit<Pet, 'id'>>({
    name: initial?.name ?? '',
    species: initial?.species ?? 'Chó',
    breed: initial?.breed ?? '',
    age: initial?.age ?? 1,
    weight: initial?.weight ?? 1,
    coat: initial?.coat ?? 'Không rõ',
    notes: initial?.notes ?? '',
  });
  const [touched, setTouched] = useState(false);
  const errors = {
    name: !form.name.trim() ? 'Vui lòng nhập tên thú cưng.' : '',
    breed: !form.breed.trim() ? 'Vui lòng nhập giống thú cưng.' : '',
    age: !Number.isFinite(Number(form.age)) || Number(form.age) < 0 || Number(form.age) > 30 ? 'Tuổi phải từ 0 đến 30.' : '',
    weight: !Number.isFinite(Number(form.weight)) || Number(form.weight) <= 0 || Number(form.weight) > 100 ? 'Cân nặng phải lớn hơn 0 và không quá 100 kg.' : '',
  };
  const valid = !Object.values(errors).some(Boolean);
  const update = <K extends keyof typeof form>(key: K, value: typeof form[K]) => setForm(current => ({ ...current, [key]: value }));
  return (
    <div className="rounded-[24px] border border-[#142B55]/10 bg-[#F8FAFC] p-5">
      <div className="mb-5 flex items-center justify-between"><div><h3 className="text-lg font-bold text-[#142B55]">{initial ? 'Chỉnh sửa hồ sơ' : 'Thêm thú cưng mới'}</h3><p className="mt-1 text-xs text-[#778397]">Các trường có dấu * là bắt buộc.</p></div><button onClick={onCancel} className="text-sm font-bold text-[#68758B]">Đóng</button></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="booking-field"><span>Tên của bé *</span><input value={form.name} onChange={event => update('name', event.target.value)} placeholder="Ví dụ: Bơ" /><FieldError>{touched ? errors.name : ''}</FieldError></label>
        <label className="booking-field"><span>Loài *</span><select value={form.species} onChange={event => update('species', event.target.value as Species)}><option>Chó</option><option>Mèo</option></select></label>
        <label className="booking-field"><span>Giống *</span><input value={form.breed} onChange={event => update('breed', event.target.value)} placeholder="Ví dụ: Poodle" /><FieldError>{touched ? errors.breed : ''}</FieldError></label>
        <label className="booking-field"><span>Kiểu lông</span><select value={form.coat} onChange={event => update('coat', event.target.value as Pet['coat'])}><option>Không rõ</option><option>Ngắn</option><option>Dài</option><option>Xoăn</option></select></label>
        <label className="booking-field"><span>Tuổi *</span><input type="number" min="0" max="30" value={form.age} onChange={event => update('age', Number(event.target.value))} /><FieldError>{touched ? errors.age : ''}</FieldError></label>
        <label className="booking-field"><span>Cân nặng (kg) *</span><input type="number" min="0.1" max="100" step="0.1" value={form.weight} onChange={event => update('weight', Number(event.target.value))} /><FieldError>{touched ? errors.weight : ''}</FieldError></label>
        <label className="booking-field sm:col-span-2"><span>Lưu ý chăm sóc (không bắt buộc)</span><textarea rows={3} value={form.notes} onChange={event => update('notes', event.target.value)} placeholder="Dị ứng, tính cách, vùng nhạy cảm..." /></label>
      </div>
      <div className="mt-5 flex justify-end gap-3"><button className="btn-outline" onClick={onCancel}>Hủy</button><button className="btn-navy" onClick={() => { setTouched(true); if (valid) onSave({ ...form, id: initial?.id ?? `pet-${Date.now()}`, sample: false }); }}>Lưu hồ sơ</button></div>
    </div>
  );
}

function PriceSummary({ rows, discount, total }: { rows: { label: string; value: number; note?: string }[]; discount: number; total: number }) {
  return (
    <aside className="sticky top-28 rounded-[24px] border border-[#142B55]/10 bg-white p-5 shadow-[0_12px_40px_rgba(20,43,85,.08)]">
      <div className="flex items-center justify-between"><h3 className="font-bold text-[#142B55]">Tạm tính đặt lịch</h3><span className="rounded-full bg-[#FFF1EE] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E96049]">Demo</span></div>
      <div className="mt-4 space-y-3">
        {rows.length ? rows.map((row, index) => <div key={`${row.label}-${index}`} className="flex items-start justify-between gap-4 text-sm"><div><span className="text-[#526078]">{row.label}</span>{row.note && <small className="mt-0.5 block text-[10px] text-[#919AAB]">{row.note}</small>}</div><strong className="whitespace-nowrap text-[#142B55]">{money(row.value)}</strong></div>) : <p className="text-sm leading-6 text-[#7B8799]">Chọn thú cưng và dịch vụ để xem chi tiết giá.</p>}
        <div className={`flex justify-between text-sm ${discount > 0 ? 'text-emerald-700' : 'text-[#8994A5]'}`}><span>Giảm giá hợp lệ</span><strong>{discount > 0 ? `−${money(discount)}` : money(0)}</strong></div>
      </div>
      <div className="mt-5 flex items-end justify-between border-t border-[#142B55]/10 pt-4"><span className="text-sm font-semibold text-[#526078]">Tổng dự kiến</span><strong className="text-2xl text-[#FF765E]">{money(total)}</strong></div>
      <p className="mt-3 text-[11px] leading-5 text-[#7A879B]">Giá được tính theo quy tắc mẫu và chỉ được chốt khi bạn xác nhận. PetDay không xử lý thanh toán thật trong prototype.</p>
    </aside>
  );
}

export function BookingWizard({ onNavigate }: { onNavigate: (page: 'home' | 'services' | 'booking' | 'appointments') => void }) {
  const [step, setStep] = useState(1);
  const [pets, setPets] = useState<Pet[]>(() => getStored(storage.pets, [samplePet]));
  const [selectedPetId, setSelectedPetId] = useState(() => getStored<Pet[]>(storage.pets, [samplePet])[0]?.id ?? '');
  const [editingPet, setEditingPet] = useState<Pet | null | 'new'>(null);
  const [serviceNotice, setServiceNotice] = useState('');
  const prefill = localStorage.getItem('petday_booking_prefill');
  const initialService: ServiceKey = prefill === 'Spa' ? 'spa' : prefill === 'Daycare' ? 'daycare' : 'grooming';
  const [service, setService] = useState<ServiceKey>(initialService);
  const [addons, setAddons] = useState<string[]>([]);
  const [productQty, setProductQty] = useState<Record<string, number>>({});
  const [branch, setBranch] = useState(branches[0].id);
  const storedDate = localStorage.getItem('petday_booking_date');
  const [date, setDate] = useState(storedDate && storedDate >= inputDate(1) ? storedDate : inputDate(1));
  const [slot, setSlot] = useState('');
  const [taxi, setTaxi] = useState(false);
  const [zone, setZone] = useState('');
  const [address, setAddress] = useState('');
  const [promo, setPromo] = useState('');
  const [payment, setPayment] = useState<'facility' | 'online'>('facility');
  const [paymentCode, setPaymentCode] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SharedBooking | null>(null);
  const submittingRef = useRef(false);

  const pet = pets.find(item => item.id === selectedPetId);
  const weightRule = weightRules.find(rule => (pet?.weight ?? 0) <= rule.max) ?? weightRules[0];
  const availableAddons = addOnRules.filter(item => item.services.includes(service));
  const selectedProducts = demoProducts.filter(product => (productQty[product.id] ?? 0) > 0);
  const recommendedProducts = demoProducts.filter(product => pet && product.species.includes(pet.species));
  const taxiFee = !taxi ? 0 : zone === 'noi-khu' ? 70000 : zone === 'lan-can' ? 110000 : 0;
  const outsideZone = taxi && zone === 'ngoai-vung';
  const weightAdjustment = service === 'daycare' ? 0 : weightRule.fee;
  const servicePrice = serviceRules[service].base + weightAdjustment;
  const addonsTotal = addOnRules.filter(item => addons.includes(item.id)).reduce((sum, item) => sum + item.price, 0);
  const productsTotal = selectedProducts.reduce((sum, product) => sum + product.price * (productQty[product.id] ?? 0), 0);
  const subtotal = servicePrice + addonsTotal + taxiFee + productsTotal;
  const discount = promo.trim().toUpperCase() === 'PETDAY10' ? Math.min(50000, Math.round((servicePrice + addonsTotal) * .1)) : 0;
  const total = subtotal - discount;

  const priceRows = [
    pet && { label: `Dịch vụ chính · ${serviceRules[service].name}`, value: serviceRules[service].base, note: 'Giá cơ sở demo' },
    pet && { label: `Điều chỉnh cân nặng · ${weightRule.label}`, value: weightAdjustment, note: service === 'daycare' ? 'Daycare không áp dụng phụ phí cân nặng' : 'Quy tắc demo theo hồ sơ đã chọn' },
    ...addOnRules.filter(item => addons.includes(item.id)).map(item => ({ label: item.name, value: item.price })),
    taxi && { label: 'Pet Taxi hai chiều', value: taxiFee, note: outsideZone ? 'Ngoài vùng demo — không thể xác nhận' : zone === 'noi-khu' ? 'Vùng nội khu demo' : zone === 'lan-can' ? 'Vùng lân cận demo' : 'Chưa chọn vùng demo' },
    ...selectedProducts.map(product => ({ label: `${product.name} × ${productQty[product.id]}`, value: product.price * productQty[product.id] })),
  ].filter(Boolean) as { label: string; value: number; note?: string }[];

  const recommendation = useMemo(() => {
    if (!pet) return null;
    if (!(Object.keys(serviceRules) as ServiceKey[]).some(key => isServiceCompatible(key, pet))) return { key: null, service: 'Cần tư vấn trước khi đặt', reason: `Cân nặng ${pet.weight} kg của ${pet.name} nằm ngoài giới hạn cấu hình demo hiện tại, nên hệ thống không tự đề xuất dịch vụ.` };
    if (pet.notes.toLowerCase().includes('nhạy cảm') || pet.notes.toLowerCase().includes('da')) return { key: 'spa' as ServiceKey, service: 'Spa dưỡng lông', reason: `Hồ sơ của ${pet.name} có lưu ý về da hoặc sự nhạy cảm, vì vậy quy trình spa demo với thao tác nhẹ nhàng được ưu tiên gợi ý.` };
    if (pet.coat === 'Dài' || pet.coat === 'Xoăn') return { key: 'grooming' as ServiceKey, service: 'Grooming toàn diện', reason: `${pet.name} có bộ lông ${pet.coat.toLowerCase()}, nên việc chải gỡ và vệ sinh định kỳ có thể phù hợp hơn.` };
    if (pet.species === 'Chó' && pet.age >= 1 && pet.age <= 8 && pet.weight <= serviceRules.daycare.maxWeight) return { key: 'daycare' as ServiceKey, service: 'Daycare cả ngày', reason: `${pet.name} là chó trưởng thành trong giới hạn cân nặng demo; hoạt động có giám sát có thể phù hợp để duy trì vận động.` };
    return { key: 'grooming' as ServiceKey, service: 'Grooming toàn diện', reason: `Grooming là gợi ý chăm sóc cơ bản dựa trên loài, độ tuổi và kiểu lông đang lưu trong hồ sơ của ${pet.name}.` };
  }, [pet]);

  const currentSlotState = slotState(branch, date, slot, service);
  const slotAvailable = Boolean(slot && currentSlotState.available);
  const dateValid = Boolean(date && date >= inputDate(1));
  const taxiValid = !taxi || (Boolean(address.trim()) && Boolean(zone) && !outsideZone);
  const stockValid = selectedProducts.every(product => (productQty[product.id] ?? 0) <= product.stock);
  const paymentValid = payment === 'facility' || paymentCode === '4242';
  const canProceed = step === 1 ? Boolean(pet) : step === 2 ? Boolean(service && pet && isServiceCompatible(service, pet) && stockValid) : step === 3 ? Boolean(branch && dateValid && slotAvailable && taxiValid) : accepted && paymentValid;

  useEffect(() => {
    if (!pet || isServiceCompatible(service, pet)) return;
    const fallback = (Object.keys(serviceRules) as ServiceKey[]).find(key => isServiceCompatible(key, pet));
    if (fallback) {
      setService(fallback);
      setAddons([]);
      setSlot('');
      setServiceNotice(`Dịch vụ trước đó không còn phù hợp sau khi cập nhật hồ sơ của ${pet.name}. PetDay đã chuyển sang ${serviceRules[fallback].name} và bỏ các dịch vụ thêm không tương thích.`);
    }
  }, [pet, service]);

  const savePet = (nextPet: Pet) => {
    const next = pets.some(item => item.id === nextPet.id) ? pets.map(item => item.id === nextPet.id ? nextPet : item) : [...pets, nextPet];
    setPets(next);
    setSelectedPetId(nextPet.id);
    localStorage.setItem(storage.pets, JSON.stringify(next));
    setEditingPet(null);
  };

  const toggleAddon = (id: string) => setAddons(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const changeService = (next: ServiceKey) => {
    if (!pet || !isServiceCompatible(next, pet)) return;
    const removed = addons.filter(id => !addOnRules.find(item => item.id === id)?.services.includes(next)).length;
    setService(next);
    setAddons(current => current.filter(id => addOnRules.find(item => item.id === id)?.services.includes(next)));
    setSlot('');
    setServiceNotice(removed > 0 ? `Đã bỏ ${removed} dịch vụ thêm không tương thích với ${serviceRules[next].name}.` : `Đã cập nhật dịch vụ chính. Khung giờ được làm mới theo thời lượng ${serviceRules[next].duration}.`);
  };
  const setQuantity = (id: string, quantity: number, stock: number) => setProductQty(current => ({ ...current, [id]: Math.max(0, Math.min(quantity, stock)) }));

  const confirm = () => {
    if (submittingRef.current) return;
    setConfirmError('');
    if (!pet || !canProceed || !slotAvailable) {
      setConfirmError('Vui lòng kiểm tra lại các thông tin bắt buộc trước khi xác nhận.');
      return;
    }
    const recheckedSlot = slotState(branch, date, slot, service);
    if (!recheckedSlot.available) {
      setConfirmError('Khung giờ mẫu này vừa hết chỗ. Vui lòng quay lại chọn giờ khác.');
      return;
    }
    if (!window.confirm('Xác nhận tạo lịch hẹn mẫu với các thông tin đã kiểm tra?')) return;
    submittingRef.current = true;
    setSubmitting(true);
    const lineItems: BookingLineItem[] = [
      { type: 'base', label: `Dịch vụ chính · ${serviceRules[service].name}`, amount: serviceRules[service].base },
      { type: 'weight', label: `Điều chỉnh cân nặng · ${weightRule.label}`, amount: weightAdjustment },
      ...addOnRules.filter(item => addons.includes(item.id)).map(item => ({ type: 'addon' as const, label: item.name, amount: item.price })),
      { type: 'taxi', label: 'Pet Taxi', amount: taxiFee },
      ...selectedProducts.map(product => ({ type: 'product' as const, label: `${product.name} × ${productQty[product.id]}`, amount: product.price * productQty[product.id] })),
      { type: 'discount', label: 'Giảm giá demo', amount: -discount },
    ];
    const record: NewBooking = {
      owner: { name: 'Tài khoản demo', phone: '', email: '' },
      pet,
      service: serviceRules[service].name,
      duration: serviceRules[service].duration,
      addons: addOnRules.filter(item => addons.includes(item.id)).map(item => item.name),
      products: selectedProducts.map(product => ({ name: product.name, quantity: productQty[product.id] })),
      taxi,
      branch: branches.find(item => item.id === branch)?.name ?? '',
      date,
      slot,
      payment: payment === 'facility' ? 'Thanh toán tại cơ sở' : 'Thanh toán online mô phỏng',
      paymentStatus: payment === 'facility' ? 'Chưa thanh toán' : 'Thanh toán mô phỏng thành công',
      lineItems,
      total,
    };
    try {
      const created = createBooking(record);
      localStorage.removeItem('petday_booking_prefill');
      localStorage.removeItem('petday_booking_date');
      setSuccess(created);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      submittingRef.current = false;
      setSubmitting(false);
      setConfirmError('Không thể lưu lịch hẹn. Vui lòng kiểm tra quyền lưu trữ của trình duyệt và thử lại.');
    }
  };

  if (success) {
    return (
      <main className="min-h-[70vh] bg-[#F6F9FC] py-16">
        <div className="container-pd">
          <div className="mx-auto max-w-2xl rounded-[32px] bg-white p-7 text-center shadow-[0_18px_60px_rgba(20,43,85,.1)] md:p-12">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#DDF7E9] text-3xl text-emerald-700">✓</div>
            <span className="mt-6 inline-flex rounded-full bg-[#FFF1EE] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#E86049]">Đang chờ xác nhận</span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-[-.035em] text-[#142B55] md:text-4xl">PetDay đã ghi nhận yêu cầu mẫu</h1>
            <p className="mx-auto mt-4 max-w-lg leading-7 text-[#68758B]">Đây là xác nhận trong prototype, chưa tạo lịch giữ chỗ thật và chưa phát sinh giao dịch thanh toán.</p>
            <div className="mx-auto mt-7 max-w-sm rounded-2xl bg-[#F4F8FC] p-5"><span className="text-xs font-bold uppercase tracking-wider text-[#7C889A]">Mã đặt lịch mẫu</span><strong className="mt-2 block text-2xl tracking-[.08em] text-[#142B55]">{success.code}</strong><span className="mt-3 block text-xs text-[#68758B]">Thanh toán: {success.paymentStatus}</span></div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><button className="btn-navy" onClick={() => onNavigate('appointments')}>Xem lịch hẹn của tôi</button><button className="btn-outline" onClick={() => onNavigate('home')}>Về trang chủ</button></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#F6F9FC] pb-20">
      <section className="border-b border-[#142B55]/8 bg-white py-10">
        <div className="container-pd">
          <p className="text-sm font-semibold text-[#7A879A]"><button onClick={() => onNavigate('home')}>Trang chủ</button><span className="mx-2">/</span><span className="text-[#142B55]">Đặt lịch</span></p>
          <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><span className="eyebrow">Đặt lịch chăm sóc</span><h1 className="mt-3 text-3xl font-extrabold tracking-[-.04em] text-[#142B55] md:text-5xl">Ngày vui của bé bắt đầu tại đây</h1><p className="mt-3 text-[#68758B]">Toàn bộ lịch, giá, tồn kho, taxi và thanh toán trong luồng này là dữ liệu demo.</p></div><button className="btn-outline shrink-0" onClick={() => onNavigate('appointments')}>Lịch hẹn của tôi</button></div>
          <div className="booking-stepper mt-9">
            {['Hồ sơ thú cưng', 'Dịch vụ & sản phẩm', 'Lịch & Pet Taxi', 'Xem lại'].map((label, index) => {
              const number = index + 1;
              const status = step > number ? 'completed' : step === number ? 'active' : 'upcoming';
              return <div key={label} className={`booking-step ${status}`}><div className="booking-step-track"><span>{step > number ? '✓' : number}</span>{number < 4 && <i />}</div><strong>{label}</strong></div>;
            })}
          </div>
        </div>
      </section>

      <section className="container-pd mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-[28px] border border-[#142B55]/8 bg-white p-5 shadow-[0_10px_40px_rgba(20,43,85,.05)] md:p-8">
          {step === 1 && (
            <div>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><span className="step-kicker">Bước 1/4</span><h2 className="booking-title">Chọn hồ sơ thú cưng</h2><p className="booking-copy">Thông tin chính xác giúp PetDay áp dụng đúng quy tắc giá demo và gợi ý phù hợp.</p></div><button className="btn-outline shrink-0" onClick={() => setEditingPet('new')}>+ Thêm thú cưng</button></div>
              <DemoNotice>Hồ sơ “Bơ” được tạo sẵn để minh họa và có nhãn mẫu. Bạn có thể chỉnh sửa hoặc thêm hồ sơ mới.</DemoNotice>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {pets.map(item => <div key={item.id} className={`select-card ${selectedPetId === item.id ? 'selected' : ''}`} role="button" tabIndex={0} onClick={() => setSelectedPetId(item.id)} onKeyDown={event => event.key === 'Enter' && setSelectedPetId(item.id)}>
                  <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#DCEEFF] text-xl font-extrabold text-[#142B55]">{item.name.trim().charAt(0).toLocaleUpperCase('vi-VN') || '?'}</span><div><strong className="text-[#142B55]">{item.name}</strong><span className="mt-1 block text-xs text-[#778397]">{item.species} · {item.breed}</span></div></div>{item.sample && <span className="demo-tag">Mẫu</span>}</div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[#526078]"><span>{item.age} tuổi</span><span>{item.weight} kg</span><span>Lông {item.coat.toLowerCase()}</span></div>
                  <p className="mt-3 text-xs leading-5 text-[#7B8799]"><strong className="text-[#59677D]">Lưu ý chăm sóc:</strong> {item.notes || 'Không có lưu ý.'}</p>
                  <button className="mt-4 text-xs font-bold text-[#FF765E]" onClick={event => { event.stopPropagation(); setEditingPet(item); }}>Chỉnh sửa hồ sơ</button>
                </div>)}
              </div>
              {editingPet && <div className="mt-6"><PetForm initial={editingPet === 'new' ? undefined : editingPet} onSave={savePet} onCancel={() => setEditingPet(null)} /></div>}
            </div>
          )}

          {step === 2 && (
            <div>
              <span className="step-kicker">Bước 2/4</span><h2 className="booking-title">Chọn dịch vụ chính</h2><p className="booking-copy">Mỗi lịch hẹn chọn một dịch vụ chính. Giá dưới đây là mức mẫu và tự cập nhật theo cân nặng của bé.</p>
              {recommendation && <div className="mb-6 rounded-2xl border border-[#FF765E]/20 bg-[#FFF7F5] p-4"><strong className="text-sm text-[#142B55]">Gợi ý từ hồ sơ của {pet?.name}: {recommendation.service}</strong><p className="mt-1 text-xs leading-5 text-[#68758B]">{recommendation.reason} {recommendation.key === null ? 'Vui lòng cập nhật hồ sơ hoặc liên hệ tư vấn trước khi tiếp tục.' : service !== recommendation.key ? `Bạn đang chọn ${serviceRules[service].name}; gợi ý này chỉ mang tính tham khảo và không tự thay đổi lựa chọn.` : 'Lựa chọn hiện tại trùng với gợi ý hồ sơ.'} Đây không phải tư vấn AI hoặc chẩn đoán y khoa.</p></div>}
              {serviceNotice && <div className="mb-5 rounded-xl bg-[#EDF7FF] px-4 py-3 text-xs font-semibold leading-5 text-[#425A78]">{serviceNotice}</div>}
              <div className="grid gap-4 md:grid-cols-3">
                {(Object.entries(serviceRules) as [ServiceKey, typeof serviceRules[ServiceKey]][]).map(([key, item]) => {
                  const compatible = isServiceCompatible(key, pet);
                  return <button key={key} disabled={!compatible} className={`select-card text-left disabled:cursor-not-allowed disabled:opacity-45 ${service === key ? 'selected' : ''}`} onClick={() => changeService(key)}><span className="demo-tag">{item.category}</span><h3 className="mt-4 font-bold text-[#142B55]">{item.name}</h3><p className="mt-2 min-h-16 text-xs leading-5 text-[#748095]">{item.description}</p><div className="mt-4 border-t border-[#142B55]/8 pt-3"><strong className="block text-[#FF765E]">Từ {money(item.base)} · Mẫu</strong><span className="mt-1 block text-[11px] text-[#7A879A]">{item.duration} · {item.species.join(', ')} · tối đa {item.maxWeight} kg</span>{!compatible && <span className="mt-2 block text-[10px] font-bold text-red-600">Không phù hợp với loài hoặc cân nặng trong hồ sơ.</span>}</div></button>;
                })}
              </div>
              <div className="mt-6 rounded-2xl bg-[#F6F9FC] p-4 text-sm leading-6 text-[#526078]"><strong className="text-[#142B55]">Quy tắc cân nặng demo:</strong> đến 5 kg không phụ phí; trên 5–10 kg +50.000đ; trên 10–20 kg +100.000đ; trên 20 kg +160.000đ. Daycare dùng giá mẫu cố định.</div>

              <h3 className="mt-8 text-lg font-bold text-[#142B55]">Dịch vụ thêm <span className="font-normal text-[#7D899B]">(không bắt buộc)</span></h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {availableAddons.map(item => <label key={item.id} className={`option-row ${addons.includes(item.id) ? 'selected' : ''}`}><input type="checkbox" checked={addons.includes(item.id)} onChange={() => toggleAddon(item.id)} /><span><strong>{item.name}</strong><small>+{money(item.price)} · Giá demo</small></span></label>)}
              </div>

              <div className="mt-9 flex items-end justify-between gap-4"><div><h3 className="text-lg font-bold text-[#142B55]">Sản phẩm gợi ý</h3><p className="mt-1 text-xs text-[#7D899B]">Tùy chọn mua kèm, không ảnh hưởng việc đặt dịch vụ.</p></div><span className="demo-tag">Tồn kho mẫu</span></div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {recommendedProducts.map(product => {
                  const quantity = productQty[product.id] ?? 0;
                  return <article key={product.id} className="flex gap-4 rounded-2xl border border-[#142B55]/9 p-3"><img src={product.image} alt={product.name} className="h-24 w-24 rounded-xl object-cover" /><div className="min-w-0 flex-1"><h4 className="text-sm font-bold text-[#142B55]">{product.name}</h4><p className="mt-1 text-xs text-[#7B8799]">{money(product.price)} · Còn {product.stock} mẫu</p><div className="mt-3 flex items-center gap-2"><button className="quantity-btn" onClick={() => setQuantity(product.id, quantity - 1, product.stock)} disabled={quantity === 0}>−</button><span className="w-6 text-center text-sm font-bold">{quantity}</span><button className="quantity-btn" onClick={() => setQuantity(product.id, quantity + 1, product.stock)} disabled={quantity >= product.stock}>+</button></div>{quantity >= product.stock && <FieldError>Đã đạt tồn kho mẫu tối đa.</FieldError>}</div></article>;
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <span className="step-kicker">Bước 3/4</span><h2 className="booking-title">Chọn lịch và Pet Taxi</h2><p className="booking-copy">Các khung giờ và sức chứa bên dưới chỉ dùng để minh họa luồng đặt lịch.</p>
              <DemoNotice>Hệ thống sẽ kiểm tra lại sức chứa mô phỏng trước khi xác nhận. Lựa chọn này không giữ chỗ ngoài đời thực.</DemoNotice>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="booking-field"><span>Chi nhánh *</span><select value={branch} onChange={event => { setBranch(event.target.value); setSlot(''); }}>{branches.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><small>Địa chỉ mẫu: {branches.find(item => item.id === branch)?.address}</small></label>
                <label className="booking-field"><span>Ngày sử dụng dịch vụ *</span><input type="date" min={inputDate(1)} value={date} onChange={event => { setDate(event.target.value); setSlot(''); }} /><small>Không thể chọn ngày trong quá khứ hoặc hôm nay.</small>{!dateValid && <FieldError>Vui lòng chọn một ngày hợp lệ từ ngày mai trở đi.</FieldError>}</label>
              </div>
              <h3 className="mt-7 text-sm font-bold text-[#142B55]">Khung giờ khả dụng mẫu *</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {timeSlots.map(item => {
                  const state = slotState(branch, date, item.time, service);
                  return <button key={item.time} disabled={!state.available || !dateValid} onClick={() => setSlot(item.time)} className={`slot-btn ${slot === item.time ? 'selected' : ''} ${!state.available || !dateValid ? 'unavailable' : ''}`}><strong>{item.time}</strong><small>{!dateValid ? 'Ngày không hợp lệ' : state.available ? `Còn ${state.remaining} đơn vị công suất mẫu` : state.reason}</small></button>;
                })}
              </div>

              <div className="mt-8 rounded-[22px] border border-[#142B55]/9 p-5">
                <label className="flex cursor-pointer items-start gap-3"><input className="mt-1 h-5 w-5 accent-[#FF765E]" type="checkbox" checked={taxi} onChange={event => setTaxi(event.target.checked)} /><span><strong className="block text-[#142B55]">Thêm Pet Taxi hai chiều</strong><small className="mt-1 block leading-5 text-[#778397]">Dịch vụ và điều phối tài xế chỉ là mô phỏng, không phát sinh chuyến đi thật.</small></span></label>
                {taxi && <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="booking-field"><span>Vùng phục vụ mẫu *</span><select value={zone} onChange={event => setZone(event.target.value)}><option value="">Chọn vùng</option><option value="noi-khu">Nội khu Thảo Điền / Phú Mỹ Hưng · 70.000đ</option><option value="lan-can">Khu vực lân cận · 110.000đ</option><option value="ngoai-vung">Ngoài vùng demo</option></select>{outsideZone && <FieldError>Địa chỉ ngoài vùng phục vụ demo, chưa thể đặt Pet Taxi.</FieldError>}</label>
                  <div className="rounded-xl bg-[#F2F7FC] p-3 text-xs text-[#142B55]">Taxi theo ngày sử dụng dịch vụ. PetDay xác nhận giờ điều phối sau khi duyệt lịch; không cần chọn ngày hoặc giờ Taxi riêng.</div>
                  <label className="booking-field sm:col-span-2"><span>Địa chỉ đón *</span><textarea rows={3} value={address} onChange={event => setAddress(event.target.value)} placeholder="Số nhà, tên đường, phường/xã..." />{!address.trim() && <FieldError>Vui lòng nhập địa chỉ nếu chọn Pet Taxi.</FieldError>}</label>
                </div>}
              </div>
            </div>
          )}

          {step === 4 && pet && (
            <div>
              <span className="step-kicker">Bước 4/4</span><h2 className="booking-title">Xem lại và xác nhận</h2><p className="booking-copy">Giá không thay đổi sau bước này trừ khi bạn quay lại điều chỉnh lựa chọn.</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="review-card"><span>Thú cưng</span><strong>{pet.name} · {pet.species}</strong><p>{pet.breed}, {pet.age} tuổi, {pet.weight} kg</p></div>
                <div className="review-card"><span>Lịch hẹn mẫu</span><strong>{branches.find(item => item.id === branch)?.name}</strong><p>{new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN')} lúc {slot}</p></div>
                <div className="review-card"><span>Dịch vụ</span><strong>{serviceRules[service].name}</strong><p>{serviceRules[service].duration}{addons.length ? ` · ${addons.length} dịch vụ thêm` : ''}</p></div>
                <div className="review-card"><span>Tiện ích</span><strong>{taxi ? 'Có Pet Taxi mẫu' : 'Không dùng Pet Taxi'}</strong><p>{selectedProducts.length ? `${selectedProducts.length} sản phẩm mua kèm` : 'Không có sản phẩm mua kèm'}</p></div>
              </div>
              <div className="mt-6 rounded-2xl border border-[#142B55]/9 p-5">
                <h3 className="font-bold text-[#142B55]">Mã ưu đãi demo</h3>
                <div className="mt-3 flex gap-3"><input className="form-control" value={promo} onChange={event => setPromo(event.target.value)} placeholder="Thử mã PETDAY10" /><button className="btn-outline shrink-0">Áp dụng</button></div>
                {promo && promo.trim().toUpperCase() !== 'PETDAY10' && <FieldError>Mã không tồn tại trong dữ liệu demo.</FieldError>}
                {discount > 0 && <p className="mt-2 text-xs font-semibold text-emerald-700">Đã áp dụng ưu đãi mẫu 10%, tối đa 50.000đ.</p>}
              </div>
              <div className="mt-6">
                <h3 className="font-bold text-[#142B55]">Phương thức thanh toán *</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className={`option-row ${payment === 'facility' ? 'selected' : ''}`}><input type="radio" name="payment" checked={payment === 'facility'} onChange={() => setPayment('facility')} /><span><strong>Thanh toán tại cơ sở</strong><small>Không thanh toán trong prototype</small></span></label>
                  <label className={`option-row ${payment === 'online' ? 'selected' : ''}`}><input type="radio" name="payment" checked={payment === 'online'} onChange={() => setPayment('online')} /><span><strong>Thanh toán online mô phỏng</strong><small>Không xử lý giao dịch thật</small></span></label>
                </div>
                {payment === 'online' && <label className="booking-field mt-4"><span>Mã kiểm thử thanh toán *</span><input value={paymentCode} onChange={event => setPaymentCode(event.target.value)} placeholder="Nhập 4242 để mô phỏng thành công" /><small>Chỉ mã 4242 được xem là thành công trong prototype.</small>{paymentCode && !paymentValid && <FieldError>Thanh toán mô phỏng thất bại. Hãy dùng mã kiểm thử 4242.</FieldError>}</label>}
              </div>
              <div className="mt-6 rounded-2xl bg-[#FFF8F5] p-5 text-sm leading-6 text-[#5E6C82]"><strong className="text-[#142B55]">Điều kiện hủy mẫu:</strong> Yêu cầu thay đổi hoặc hủy nên được gửi trước giờ hẹn ít nhất 4 giờ. Chính sách này chỉ dùng minh họa và không tạo cam kết dịch vụ thực tế.</div>
              <div className="mt-6 rounded-2xl border border-[#142B55]/9 p-5"><h3 className="font-bold text-[#142B55]">Chi tiết chi phí mẫu</h3><div className="mt-4 space-y-3">{priceRows.map((row, index) => <div key={`${row.label}-${index}`} className="flex justify-between gap-4 text-sm"><span className="text-[#5E6C82]">{row.label}</span><strong className="whitespace-nowrap text-[#142B55]">{money(row.value)}</strong></div>)}<div className="flex justify-between text-sm text-emerald-700"><span>Giảm giá hợp lệ</span><strong>{discount ? `−${money(discount)}` : money(0)}</strong></div><div className="flex justify-between border-t border-[#142B55]/10 pt-3"><strong className="text-[#142B55]">Tổng dự kiến</strong><strong className="text-xl text-[#FF765E]">{money(total)}</strong></div></div></div>
              <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#526078]"><input className="mt-1 h-5 w-5 accent-[#FF765E]" type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} /><span>Tôi đã kiểm tra thông tin và hiểu đây là quy trình đặt lịch, thanh toán, Pet Taxi và sức chứa <strong>mô phỏng</strong>.</span></label>
              {confirmError && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{confirmError}</div>}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-[#142B55]/9 pt-6">
            <button className="btn-outline" onClick={() => step === 1 ? onNavigate('home') : setStep(step - 1)}>{step === 1 ? 'Hủy' : 'Quay lại'}</button>
            {step < 4 ? <button className="btn-coral disabled:cursor-not-allowed disabled:opacity-40" disabled={!canProceed} onClick={() => { setStep(step + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Tiếp tục →</button> : <button className="btn-coral disabled:cursor-not-allowed disabled:opacity-40" disabled={!canProceed || submitting} onClick={confirm}>{submitting ? 'Đang ghi nhận...' : 'Xác nhận đặt lịch mẫu'}</button>}
          </div>
        </div>
        <PriceSummary rows={priceRows} discount={discount} total={total} />
      </section>
    </main>
  );
}

export function AppointmentsPage({ onNavigate }: { onNavigate: (page: 'home' | 'services' | 'booking' | 'appointments') => void }) {
  const [bookings, setBookings] = useState<SharedBooking[]>(() => loadBookings());
  const [reviewing, setReviewing] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');
  useEffect(() => subscribeBookings(setBookings), []);
  const saveReview = (code: string) => {
    if (!comment.trim()) {
      setReviewError('Vui lòng nhập nội dung đánh giá mẫu.');
      return;
    }
    if (!window.confirm(`Xác nhận gửi đánh giá ${rating}/5? Đánh giá chỉ được gửi một lần.`)) return;
    try {
      setBookings(submitBookingReview(code, rating, comment));
      setReviewing('');
      setComment('');
      setReviewError('');
      setReviewNotice(`Đã ghi nhận đánh giá cho lịch ${code}.`);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Không thể lưu đánh giá. Vui lòng thử lại.');
    }
  };
  return (
    <main className="min-h-[65vh] bg-[#F6F9FC] py-14">
      <div className="container-pd">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><span className="eyebrow">Tài khoản mẫu</span><h1 className="mt-3 text-3xl font-extrabold tracking-[-.04em] text-[#142B55] md:text-5xl">Lịch hẹn của tôi</h1><p className="mt-3 text-[#68758B]">Các lịch bên dưới chỉ được lưu trên trình duyệt này.</p></div><button className="btn-coral" onClick={() => onNavigate('booking')}>+ Đặt lịch mới</button></div>
        <div className="mt-8"><DemoNotice>Trạng thái và mã đặt lịch là dữ liệu prototype, không đại diện cho lịch hẹn đã được PetDay xác nhận ngoài thực tế.</DemoNotice></div>
        {reviewNotice && <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"><span>{reviewNotice}</span><button onClick={() => setReviewNotice('')}>Đóng</button></div>}
        {bookings.length === 0 ? <div className="mt-8 rounded-[28px] bg-white px-6 py-16 text-center shadow-[0_10px_40px_rgba(20,43,85,.05)]"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#DCEEFF] text-2xl">＋</div><h2 className="mt-5 text-xl font-bold text-[#142B55]">Chưa có lịch hẹn mẫu</h2><p className="mt-2 text-sm text-[#748095]">Tạo lịch đầu tiên để kiểm tra toàn bộ trải nghiệm prototype.</p><button className="btn-navy mt-6" onClick={() => onNavigate('booking')}>Bắt đầu đặt lịch</button></div> :
          <div className="mt-8 grid gap-5">{bookings.map(booking => <article key={booking.code} className="rounded-[24px] border border-[#142B55]/8 bg-white p-5 shadow-[0_8px_30px_rgba(20,43,85,.05)] md:p-7"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-[#FFF1EE] px-3 py-1.5 text-xs font-bold text-[#E86049]">{booking.status}</span><span className="rounded-full bg-[#F1F5F8] px-3 py-1.5 text-xs font-bold text-[#59677D]">{booking.paymentStatus ?? 'Chưa thanh toán'}</span><span className="text-xs font-bold text-[#7B8799]">{booking.code}</span></div><h2 className="mt-4 text-xl font-bold text-[#142B55]">{booking.service} cho bé {booking.pet.name}</h2><p className="mt-2 text-sm text-[#66748A]">{booking.branch} (địa chỉ mẫu) · {new Date(`${booking.date}T00:00:00`).toLocaleDateString('vi-VN')} lúc {booking.slot}</p></div><strong className="text-xl text-[#142B55]">{money(booking.total)}</strong></div><div className="mt-5 grid gap-3 border-t border-[#142B55]/8 pt-5 text-sm text-[#59677D] sm:grid-cols-3"><p><span className="block text-xs text-[#8B95A5]">Thời lượng</span>{booking.duration}</p><p><span className="block text-xs text-[#8B95A5]">Phương thức mẫu</span>{booking.payment}</p><p><span className="block text-xs text-[#8B95A5]">Pet Taxi</span>{booking.taxi ? 'Có, dữ liệu mẫu' : 'Không'}</p></div>
            {booking.status === 'Hoàn tất' && <div className="mt-5 rounded-2xl bg-[#F6F9FC] p-4"><span className="text-[10px] font-bold uppercase tracking-wider text-[#7D899B]">Nhật ký sau dịch vụ</span><p className="mt-2 text-sm leading-6 text-[#59677D]">{booking.careCompletion?.notes || 'PetDay chưa thêm nhật ký chăm sóc mẫu.'}</p>{booking.careCompletion && <p className="mt-1 text-xs text-[#8490A1]">Ngày chăm sóc: {new Date(`${booking.careCompletion.careDate}T00:00:00`).toLocaleDateString('vi-VN')} · {booking.careCompletion.pet.name}, {booking.careCompletion.pet.breed}</p>}{booking.review ? <div className="mt-4 border-t border-[#142B55]/8 pt-4"><strong className="text-sm text-[#142B55]">Đánh giá của bạn: {booking.review.rating}/5</strong><p className="mt-1 text-sm text-[#68758B]">{booking.review.comment}</p></div> : reviewing === booking.code ? <div className="mt-4 border-t border-[#142B55]/8 pt-4"><div className="grid gap-3 sm:grid-cols-[120px_1fr]"><label className="booking-field"><span>Điểm mẫu</span><div role="radiogroup" aria-label="Chọn điểm đánh giá" className="flex gap-1">{[1,2,3,4,5].map(score=><button key={score} type="button" role="radio" aria-checked={rating===score} aria-label={`${score} sao`} title={`${score} sao`} className={`rounded px-1 text-2xl ${score<=rating?'text-amber-500':'text-slate-300'}`} onClick={()=>setRating(score)}>★</button>)}</div></label><label className="booking-field"><span>Chia sẻ trải nghiệm mẫu *</span><input value={comment} onChange={event => setComment(event.target.value)} placeholder="Nội dung đánh giá..." /></label></div>{reviewError && <p className="mt-2 text-xs font-semibold text-red-600">{reviewError}</p>}<div className="mt-3 flex justify-end gap-2"><button className="btn-outline" onClick={() => { setReviewing(''); setReviewError(''); }}>Hủy</button><button className="btn-navy" onClick={() => saveReview(booking.code)}>Gửi đánh giá</button></div></div> : <button className="btn-outline mt-4" onClick={() => { setReviewing(booking.code); setRating(5); setComment(''); }}>Đánh giá ngay</button>}</div>}
          </article>)}</div>}
      </div>
    </main>
  );
}
