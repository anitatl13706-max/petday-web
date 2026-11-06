export type BookingStatus = 'Đang chờ xác nhận' | 'Đã xác nhận' | 'Đang thực hiện' | 'Hoàn tất' | 'Đã hủy';
export type PaymentStatus = 'Chưa thanh toán' | 'Thanh toán mô phỏng thành công' | 'Thanh toán thất bại (mô phỏng)' | 'Đã hoàn tiền (mô phỏng)';
export type LineItemType = 'base' | 'weight' | 'addon' | 'taxi' | 'product' | 'discount';

export type BookingLineItem = {
  type: LineItemType;
  label: string;
  amount: number;
};

export type SharedBooking = {
  code: string;
  createdAt: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  owner: { name: string; phone: string; email: string };
  pet: { id: string; name: string; species: string; breed: string; age: number; weight: number; notes: string; coat?: string };
  service: string;
  duration: string;
  addons: string[];
  products: { name: string; quantity: number }[];
  taxi: boolean;
  branch: string;
  date: string;
  slot: string;
  payment: string;
  lineItems: BookingLineItem[];
  total: number;
  careCompletion?: {
    notes: string;
    careDate: string;
    pet: { id: string; name: string; species: string; breed: string; age: number; weight: number };
  };
  review?: { rating: number; comment: string; createdAt: string };
};

export type NewBooking = Omit<SharedBooking, 'code' | 'createdAt' | 'status' | 'careCompletion' | 'review'>;

export type BookingAction = {
  id: string;
  bookingCode: string;
  label: string;
  createdAt: string;
};

export const BOOKING_STORAGE_KEY = 'petday_demo_bookings_v1';
export const ACTION_STORAGE_KEY = 'petday_demo_booking_actions_v1';
export const BOOKING_EVENT = 'petday-bookings-updated';

export const bookingTransitions: Record<BookingStatus, BookingStatus[]> = {
  'Đang chờ xác nhận': ['Đã xác nhận', 'Đã hủy'],
  'Đã xác nhận': ['Đang thực hiện', 'Đã hủy'],
  'Đang thực hiện': ['Hoàn tất'],
  'Hoàn tất': [],
  'Đã hủy': [],
};

function lineType(label: string): LineItemType {
  const value = label.toLowerCase();
  if (value.includes('cân nặng')) return 'weight';
  if (value.includes('taxi')) return 'taxi';
  if (value.includes('giảm')) return 'discount';
  if (value.includes('dịch vụ chính')) return 'base';
  return 'addon';
}

function completeLineItems(raw: any): BookingLineItem[] {
  const legacy = (raw.lineItems ?? raw.charges ?? []).map((item: any) => ({
    type: item.type ?? ((raw.products ?? []).some((product: any) => String(item.label ?? '').includes(product.name)) ? 'product' : lineType(item.label ?? '')),
    label: item.label || 'Hạng mục từ bản ghi cũ',
    amount: Number(item.amount ?? item.value ?? 0),
  })) as BookingLineItem[];
  if (!legacy.length) {
    legacy.push({ type: 'base', label: 'Giá tổng từ bản ghi demo cũ', amount: Number(raw.total ?? 0) });
  }
  const required: { type: LineItemType; label: string }[] = [
    { type: 'base', label: 'Dịch vụ chính' },
    { type: 'weight', label: 'Điều chỉnh cân nặng' },
    { type: 'addon', label: 'Dịch vụ thêm' },
    { type: 'taxi', label: 'Pet Taxi' },
    { type: 'product', label: 'Sản phẩm mua kèm' },
    { type: 'discount', label: 'Giảm giá' },
  ];
  required.forEach(item => {
    if (!legacy.some(line => line.type === item.type)) legacy.push({ ...item, amount: 0 });
  });
  return legacy;
}

export function normalizeBooking(raw: any): SharedBooking {
  const careCompletion = raw.careCompletion ?? (raw.careRecord ? {
    notes: raw.careRecord,
    careDate: raw.date ?? '',
    pet: {
      id: raw.pet?.id ?? '',
      name: raw.pet?.name ?? 'Chưa có tên',
      species: raw.pet?.species ?? 'Chưa cung cấp',
      breed: raw.pet?.breed ?? 'Chưa cung cấp',
      age: Number(raw.pet?.age ?? 0),
      weight: Number(raw.pet?.weight ?? 0),
    },
  } : undefined);
  return {
    code: raw.code ?? `PD-CU-${Date.now().toString(36).toUpperCase()}`,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    status: raw.status ?? 'Đang chờ xác nhận',
    paymentStatus: raw.paymentStatus ?? 'Chưa thanh toán',
    owner: {
      name: raw.owner?.name || 'Tài khoản demo',
      phone: raw.owner?.phone || '',
      email: raw.owner?.email || '',
    },
    pet: {
      id: raw.pet?.id ?? '',
      name: raw.pet?.name ?? 'Chưa có tên',
      species: raw.pet?.species ?? 'Chưa cung cấp',
      breed: raw.pet?.breed ?? 'Chưa cung cấp',
      age: Number(raw.pet?.age ?? 0),
      weight: Number(raw.pet?.weight ?? 0),
      notes: raw.pet?.notes ?? '',
      coat: raw.pet?.coat,
    },
    service: raw.service ?? 'Chưa cung cấp',
    duration: raw.duration ?? 'Chưa cung cấp',
    addons: Array.isArray(raw.addons) ? raw.addons : [],
    products: Array.isArray(raw.products) ? raw.products : [],
    taxi: Boolean(raw.taxi),
    branch: raw.branch ?? 'Chưa cung cấp',
    date: raw.date ?? '',
    slot: raw.slot ?? '',
    payment: raw.payment ?? 'Chưa cung cấp',
    lineItems: completeLineItems(raw),
    total: Number(raw.total ?? 0),
    careCompletion,
    review: raw.review ? { ...raw.review, createdAt: raw.review.createdAt ?? raw.createdAt ?? new Date().toISOString() } : undefined,
  };
}

export function loadBookings(): SharedBooking[] {
  try {
    const raw = localStorage.getItem(BOOKING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const unique = new Map<string, SharedBooking>();
    parsed.map(normalizeBooking).forEach(booking => {
      if (!unique.has(booking.code)) unique.set(booking.code, booking);
    });
    return [...unique.values()];
  } catch {
    return [];
  }
}

export function loadActions(): BookingAction[] {
  try {
    const raw = localStorage.getItem(ACTION_STORAGE_KEY);
    return raw ? JSON.parse(raw) as BookingAction[] : [];
  } catch {
    return [];
  }
}

export function saveBookings(bookings: SharedBooking[], actionLabel?: string, bookingCode = '') {
  if (new Set(bookings.map(booking => booking.code)).size !== bookings.length) {
    throw new Error('Không thể lưu vì mã đặt lịch bị trùng.');
  }
  localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookings));
  if (actionLabel) {
    const actions = loadActions();
    const action: BookingAction = { id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, bookingCode, label: actionLabel, createdAt: new Date().toISOString() };
    localStorage.setItem(ACTION_STORAGE_KEY, JSON.stringify([action, ...actions].slice(0, 30)));
  }
  window.dispatchEvent(new CustomEvent(BOOKING_EVENT));
}

export function subscribeBookings(callback: (bookings: SharedBooking[]) => void) {
  const update = () => callback(loadBookings());
  window.addEventListener(BOOKING_EVENT, update);
  window.addEventListener('storage', update);
  return () => {
    window.removeEventListener(BOOKING_EVENT, update);
    window.removeEventListener('storage', update);
  };
}

export function canTransition(from: BookingStatus, to: BookingStatus) {
  return bookingTransitions[from]?.includes(to) ?? false;
}

function bookingCode(bookings: SharedBooking[]) {
  const existing = new Set(bookings.map(booking => booking.code));
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replaceAll('-', '').slice(0, 8)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.slice(-8);
    const code = `PD-${random.toUpperCase()}`;
    if (!existing.has(code)) return code;
  }
  throw new Error('Không thể tạo mã đặt lịch duy nhất. Vui lòng thử lại.');
}

function localDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function createBooking(input: NewBooking) {
  const bookings = loadBookings();
  const record: SharedBooking = {
    ...input,
    code: bookingCode(bookings),
    createdAt: new Date().toISOString(),
    status: 'Đang chờ xác nhận',
  };
  saveBookings([record, ...bookings], 'Khách hàng tạo lịch hẹn mẫu', record.code);
  return record;
}

export function transitionBooking(code: string, nextStatus: BookingStatus) {
  const bookings = loadBookings();
  const target = bookings.find(booking => booking.code === code);
  if (!target) throw new Error('Không tìm thấy lịch hẹn cần cập nhật.');
  if (!canTransition(target.status, nextStatus)) {
    throw new Error(`Không thể chuyển từ “${target.status}” sang “${nextStatus}”.`);
  }
  const next = bookings.map(booking => {
    if (booking.code !== code) return booking;
    const careCompletion = nextStatus === 'Hoàn tất'
      ? booking.careCompletion ?? {
        notes: `Lịch hẹn ${booking.service} đã được đánh dấu hoàn tất.`,
        careDate: localDate(),
        pet: {
          id: booking.pet.id,
          name: booking.pet.name,
          species: booking.pet.species,
          breed: booking.pet.breed,
          age: booking.pet.age,
          weight: booking.pet.weight,
        },
      }
      : booking.careCompletion;
    return { ...booking, status: nextStatus, careCompletion };
  });
  saveBookings(next, `Quản trị chuyển trạng thái sang “${nextStatus}”`, code);
  return next;
}

export function updateBookingPayment(code: string, paymentStatus: PaymentStatus) {
  const bookings = loadBookings();
  if (!bookings.some(booking => booking.code === code)) throw new Error('Không tìm thấy lịch hẹn cần cập nhật.');
  const next = bookings.map(booking => booking.code === code ? { ...booking, paymentStatus } : booking);
  saveBookings(next, `Quản trị cập nhật thanh toán: ${paymentStatus}`, code);
  return next;
}

export function updateBookingCare(code: string, careCompletion: NonNullable<SharedBooking['careCompletion']>) {
  const bookings = loadBookings();
  const target = bookings.find(booking => booking.code === code);
  if (!target) throw new Error('Không tìm thấy lịch hẹn cần cập nhật.');
  if (target.status !== 'Hoàn tất') throw new Error('Chỉ lịch đã hoàn tất mới được cập nhật nhật ký chăm sóc.');
  const next = bookings.map(booking => booking.code === code ? { ...booking, careCompletion } : booking);
  saveBookings(next, 'Nhân viên cập nhật hồ sơ hoàn tất chăm sóc', code);
  return next;
}

export function submitBookingReview(code: string, rating: number, comment: string) {
  const bookings = loadBookings();
  const target = bookings.find(booking => booking.code === code);
  if (!target) throw new Error('Không tìm thấy lịch hẹn cần đánh giá.');
  if (target.status !== 'Hoàn tất') throw new Error('Chỉ lịch đã hoàn tất mới có thể gửi đánh giá.');
  if (target.review) throw new Error('Mỗi lịch hoàn tất chỉ được gửi một đánh giá.');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Điểm đánh giá phải từ 1 đến 5.');
  if (!comment.trim()) throw new Error('Vui lòng nhập nội dung đánh giá mẫu.');
  const next = bookings.map(booking => booking.code === code
    ? { ...booking, review: { rating, comment: comment.trim(), createdAt: new Date().toISOString() } }
    : booking);
  saveBookings(next, 'Khách hàng gửi đánh giá mẫu', code);
  return next;
}

export function resetDemoBookings() {
  localStorage.removeItem(BOOKING_STORAGE_KEY);
  localStorage.removeItem(ACTION_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(BOOKING_EVENT));
}
