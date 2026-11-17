import {
  summariseBookingPayment,
  PAYMENT_STAGE_LABELS,
} from "./paymentAccounting.mjs"
import { backendAssetUrl } from "./apiFetch"
import { apiFetch } from "./apiFetch"
import { CareEventImageGallery, CareImagePicker, CareImageUploadError, uploadCareEventImages } from "./CareEventImages"
import {
  AdminServicePrices,
  StandaloneRetailShop,
  AdminStandaloneOrders,
} from "./BusinessExpansion"
import {
  RetailPicker,
  AdminRetailCatalog,
  type RetailItem,
  type RetailChoice,
} from "./RetailBooking"
import { suggestServiceNames } from "./serviceRecommendations"
import { servicePackages, hasBookableService } from "./servicePackages"
import AdminCustomersReviews from "./AdminCustomersReviews"
import BookingReceipt from "./BookingReceipt"
import FinanceWorkbench from "./FinanceWorkbench"
import BookingFinancialSnapshot from "./BookingFinancialSnapshot"
import TaxiLegPanel from "./TaxiLegPanel"
import { CustomerBankNotices, AdminBankNotices } from "./BankTransferWorkflow"
import { showToast } from "./ToastProvider"
import { AdminRetailPayments } from "./UnifiedPaymentCenter"
import { ExceptionRefundCenter } from "./ExceptionRefundCenter"
import DailyOperations from "./DailyOperations"
import ShiftHandover from "./ShiftHandover"
import OperationsPriorities from "./OperationsPriorities"
import BookingJourney from "./BookingJourney"
import AutoPolicyFinancePanel from "./AutoPolicyFinancePanel"
import { matchesBookingFilters, matchesBookingGroup, matchesBookingPeriod } from "./bookingFilterRules.mjs"
import { compareDisplayBookings } from "./bookingDisplayPriority.mjs"
import StaffWorkspace from "./StaffWorkspace"
import StaffPlanner from "./StaffPlanner"
import PreArrivalCard from "./PreArrivalCard"
import { exportBookingsCsv } from "./bookingExport"
import { useEffect, useRef, useState } from "react"
import CareCompletionDialog from "./CareCompletionDialog"
const BASE = "/api"
const C =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[#142B55] outline-none focus:ring-2 focus:ring-[#FF765E]/40"
const B =
  "rounded-xl bg-[#142B55] px-5 py-3 font-bold text-white disabled:opacity-45"
const money = (n: number) => Number(n).toLocaleString("vi-VN") + "đ"
const incompleteReasonLabels: Record<string,string> = {
  pet_health: "Sức khỏe thú cưng", pet_behavior: "Thú cưng không hợp tác hoặc mất an toàn",
  customer_request: "Khách yêu cầu dừng giữa chừng", equipment: "Sự cố thiết bị",
  staff_issue: "Sự cố nhân sự", force_majeure: "Bất khả kháng", other: "Lý do khác",
}
function readIncompleteNote(value: unknown) {
  const raw=String(value||"")
  const separator=raw.indexOf(" | ")
  const code=separator>=0?raw.slice(0,separator):raw
  const label=Object.prototype.hasOwnProperty.call(incompleteReasonLabels,code)?incompleteReasonLabels[code]:""
  return {reason:label||"Chưa phân loại",note:label?(separator>=0?raw.slice(separator+3):""):raw}
}
const quoteNeedsPrepayment = (quote: any) =>
  Boolean(quote?.prepaymentRequired ?? quote?.firstUse)
function CalendarClockIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v5"/><path d="M12 21H5a2 2 0 0 1-2-2V6"/><circle cx="17" cy="17" r="4"/><path d="M17 15v2l1.5 1"/></svg>
}
function CalendarXIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v6M3 6v13a2 2 0 0 0 2 2h7"/><path d="m16 16 5 5M21 16l-5 5"/></svg>
}
const isAutoConfirmedStatus = (status: string) => status === "Đã xác nhận"
const needsFirstUseDeposit = (b: Booking) =>
  Number(
    (b.lineItems || []).find((x: any) => x.type === "first_use_deposit")
      ?.requiredAmount || 0,
  ) > Number(b.depositPaid || 0)
const customerFacingStatus = (b: Booking) =>
  b.paymentHoldExpired ? "Hết hạn giữ chỗ" :
  b.noShowReason
    ? "Khách không đến"
    : b.status === "Không hoàn thành"
      ? "Không hoàn thành"
      : (b.careCompleted || b.status === "Hoàn tất") && b.paymentStatus !== "Đã thanh toán" && (b.status === "Đang thực hiện" || b.status === "Hoàn tất")
        ? "Chăm sóc xong · chờ thanh toán"
        : b.status === "Đang chờ xác nhận"
          ? b.paymentMethod === "bank_transfer" ||
            b.paymentPlan === "FULL_PREPAY"
            ? "Chờ thanh toán toàn bộ"
            : "Chờ cọc 20%"
          : isAutoConfirmedStatus(b.status)
            ? "Đã xác nhận"
            : b.status
const firstUseDepositDue = (b: Booking) =>
  Math.max(
    0,
    Number(
      b.lineItems?.find((x: any) => x.type === "first_use_deposit")
        ?.requiredAmount || 0,
    ) - Number(b.collectedPaid || 0),
  )
const customerPaymentStatus = (b: Booking) => {
  const p = summariseBookingPayment(b)
  return PAYMENT_STAGE_LABELS[(p.stage as keyof typeof PAYMENT_STAGE_LABELS)]
}
const formatPaymentDate = (v?: string) =>
  v ? new Date(v).toLocaleString("vi-VN") : "Chưa ghi nhận"
// Display preview only: the server recalculates the authoritative policy from
// the timestamp at which the cancellation request is actually recorded.
// Amount eligible for the care-cancellation policy: not Taxi and not take-home goods.
// Discounts are conservatively assigned to the service portion first.
function careRefundBase(b: any) {
  const paid = Number(b.total) || 0
  const separated = (Array.isArray(b.lineItems) ? b.lineItems : [])
    .filter((l: any) => l.type === "taxi" || l.type === "retail")
    .reduce((n: number, l: any) => n + Math.max(0, Number(l.amount) || 0), 0)
  return Math.max(0, paid - separated)
}
function cancellationPreview(
  date: string,
  slot: string,
  total: number,
  paid = 0,
  rescheduled = false,
  depositOnly = false,
) {
  const ms = Date.parse(
    date.slice(0, 10) + "T" + slot.slice(0, 5) + ":00+07:00",
  )
  const hours = (ms - Date.now()) / 3600000
  if (!Number.isFinite(hours) || hours <= 0)
    return {
      window: "started",
      label: "Đã đến giờ hẹn · liên hệ PetDay",
      amount: 0,
    }
  if (rescheduled)
    return {
      window: "rescheduled",
      label: "Đã đổi theo yêu cầu khách · hủy không hoàn tiền",
      amount: 0,
    }
  if (paid <= 0)
    return {
      window: "unpaid",
      label: "Chưa thanh toán · không phát sinh hoàn tiền",
      amount: 0,
    }
  if (depositOnly)
    return {
      window: "deposit",
      label: "Chỉ mới cọc 20% · cọc không được hoàn khi khách hủy",
      amount: 0,
    }
  if (hours <= 1)
    return {
      window: "late",
      label: "Còn tối đa 1 giờ · liên hệ nhân viên, không tự hủy",
      amount: 0,
    }
  return {
    window: "full",
    label:
      "Thanh toán đủ · hủy trước hơn 1 giờ · dự kiến hoàn 80% tổng tiền thực thu (gồm Pet Taxi nếu có)",
    amount: Math.round(Math.min(total, paid) * 0.8),
  }
}

const serviceBenefits: Record<string, string[]> = {
  "Grooming vệ sinh nhanh": [
    "Làm sạch bàn chân",
    "Chải lông cơ bản",
    "Không bao gồm tắm toàn thân",
  ],
  "Grooming cơ bản": ["Tắm và sấy", "Chải lông", "Vệ sinh tai và móng cơ bản"],
  "Grooming toàn diện": [
    "Tắm và sấy",
    "Gỡ rối lông nhẹ",
    "Tai, móng và bàn chân",
  ],
  "Grooming tạo kiểu": [
    "Tư vấn dáng lông theo loài",
    "Tỉa lông phù hợp, ưu tiên an toàn",
    "Kiểm tra tình trạng lông",
  ],
  "Spa dịu nhẹ": ["Làm sạch nhẹ", "Sấy nhẹ", "Không thay thế chăm sóc y tế"],
  "Spa thư giãn": ["Tắm dịu nhẹ", "Massage thư giãn", "Sấy và chải lông"],
  "Spa dưỡng lông": ["Tắm sạch", "Dưỡng lông", "Gỡ rối nhẹ và sấy"],
  "Spa phục hồi lông": [
    "Kiểm tra lông khô xơ",
    "Ủ dưỡng chuyên sâu",
    "Không thay thế điều trị thú y",
  ],
  "Daycare nửa ngày": [
    "Trông giữ có giám sát",
    "Giờ nghỉ",
    "Hoạt động phù hợp",
  ],
  "Daycare cả ngày": [
    "Chọn ngày đến – ngày về",
    "Tính theo giờ phục vụ",
    "Có thể thêm Spa/Grooming",
  ],
}

const tomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}
type User = {
  id: number
  email: string
  fullName: string
  role: "customer" | "admin" | "staff"
}
type Pet = {
  id: number
  name: string
  species: string
  breed: string
  age: number
  weight: number
  notes: string
  gender?: string
  photoUrl?: string
  coat?: string
}
type Booking = {
  intakeEmergencyPhone?: string
  intakeHealthAlerts?: string
  intakeCareInstructions?: string
  intakeUpdatedAt?: string
  code: string
  petId?: number
  noShowReason?: string
  noShowAt?: string
  paymentHoldExpired?: boolean
  date: string
  slot: string
  status: string
  paymentStatus: string
  paymentMethod?: string
  paymentPlan?: string | null
  bankPaid?: number
  cashPaid?: number
  depositApplied?: number
  customerNote?: string
  collectedPaid?: number
  depositPaid?: number
  latestPaymentAt?: string
  createdAt?: string
  service: string
  branch: string
  total: number
  petName: string
  ownerName: string
  assignedStaff?: string
  assignedStaffId?: number
  careNotes?: string
  careDate?: string
  rating?: number
  comment?: string
  taxiStatus?: string
  taxiZone?: string
  taxiAddress?: string
  taxiPhone?: string
  taxiFee?: number
  taxiDirection?: string
  taxiReturnState?: string | null
  taxiReturnAddress?: string
  taxiReturnCompletedAt?: string
  careCompleted?: boolean
  petHandedOver?: boolean
  lineItems?: {
    type?: string
    label: string
    amount: number
    requiredAmount?: number
  }[]
}
async function api(
  path: string,
  method = "GET",
  payload?: object,
  token?: string,
) {
  const r = await apiFetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  })
  const out = await r
    .json()
    .catch(() => ({ error: "Không đọc được phản hồi máy chủ" }))
  if (!r.ok) {
    const message = out.error || "Không thể hoàn tất yêu cầu."
    console.error("[PetDay API]", { path, status: r.status, error: message })
    throw Error(message)
  }
  return out
}
export default function Portal({
  view,
  onGo,
}: {
  view: "account" | "booking" | "appointments" | "admin" | "shop"
  onGo: (page: any) => void
}) {
  const [token, setToken] = useState(() =>
    new URLSearchParams(window.location.search).has("reset_token")
      ? ""
      : sessionStorage.getItem("petday_token_v3") ||
        sessionStorage.getItem("petday_api_token") ||
        "",
  )
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [authMode, setAuthMode] =
    useState<"register" | "login" | "forgot" | "reset">(
      new URLSearchParams(window.location.search).has("reset_token")
        ? "reset"
        : new URLSearchParams(window.location.search).has("forgot")
          ? "forgot"
          : "login",
    )
  const [resetToken] = useState(
    () => new URLSearchParams(window.location.search).get("reset_token") || "",
  )
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer">(
    "cash",
  )
  const [prepaymentChoice, setPrepaymentChoice] = useState<"deposit" | "full">(
    "deposit",
  )
  const [paymentChoiceOpen, setPaymentChoiceOpen] = useState(false)
  const [paymentPopupCode, setPaymentPopupCode] = useState<string | null>(null)
  const [bookingNotesOpen, setBookingNotesOpen] = useState(false)
  const [bookingNote, setBookingNote] = useState("")
  const [replyDraft, setReplyDraft] = useState<Record<number, string>>({})
  const [myRequests, setMyRequests] = useState<{
    id: number
    question: string
    status: string
    reply_text?: string
  }[]>([])
  const [fullName, setFullName] = useState(""),
    [email, setEmail] = useState(""),
    [loginIdentifier, setLoginIdentifier] = useState(""),
    [registrationPhone, setRegistrationPhone] = useState(""),
    [password, setPassword] = useState("")
  const [pets, setPets] = useState<Pet[]>([]),
    [bookings, setBookings] = useState<Booking[]>([])
  const [name, setName] = useState(""),
    [species, setSpecies] = useState("Chó"),
    [breed, setBreed] = useState(""),
    [gender, setGender] = useState("Chưa xác định"),
    [coat, setCoat] = useState("Chưa xác định"),
    [age, setAge] = useState(""),
    [weight, setWeight] = useState(""),
    [notes, setNotes] = useState(""),
    [photoUrl, setPhotoUrl] = useState(""),
    [editingPet, setEditingPet] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [liveServicePrices, setLiveServicePrices] =
    useState<Record<string, number>>({})
  const [activeServiceNames, setActiveServiceNames] = useState<string[]>(
    servicePackages.map((x) => x.name),
  )
  const [retailProducts, setRetailProducts] = useState<RetailItem[]>([])
  const [retailChosen, setRetailChosen] = useState<RetailChoice[]>([])
  const [taxiDirection, setTaxiDirection] =
    useState<"pickup" | "return" | "round_trip">("pickup")
  const [taxiReturnAddress, setTaxiReturnAddress] = useState("")
  const [taxiEnabled, setTaxiEnabled] = useState(false)
  const [taxiZone, setTaxiZone] = useState<"nearby" | "extended">("nearby")
  const [taxiAddress, setTaxiAddress] = useState("")
  const [taxiPhone, setTaxiPhone] = useState("")
  const [serviceCategory, setServiceCategory] =
    useState<"Grooming" | "Spa" | "Daycare">("Grooming")
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [addOnCatalog, setAddOnCatalog] = useState<Record<string, {
    label: string
    amount: number
    services: string[]
  }>>({})
  const [closures, setClosures] = useState<any[]>([])
  const [closureDraft, setClosureDraft] = useState({
    branch: "PetDay Thảo Điền",
    date: tomorrow(),
    slot: "08:00",
    reason: "",
  })
  const [promoCode, setPromoCode] = useState("")
  const [promoPreview, setPromoPreview] = useState<any>(null)
  const [payOptions, setPayOptions] = useState<any>(null)
  const [quote, setQuote] = useState<any>(null)
  const [accountPrepaymentPolicy, setAccountPrepaymentPolicy] = useState<{
    prepaymentRequired: boolean
    reason: string
  } | null>(null)
  const requiresPrepayment = quote
    ? quoteNeedsPrepayment(quote)
    : Boolean(accountPrepaymentPolicy?.prepaymentRequired)
  const [profileName, setProfileName] = useState("")
  const [defaultAddress, setDefaultAddress] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [defaultDeliveryZone, setDefaultDeliveryZone] =
    useState<"inner_hcm" | "outer_hcm">("inner_hcm")
  const [cancellations, setCancellations] = useState<any[]>([])
  const [cancelReasons, setCancelReasons] = useState<Record<string, string>>({})
  const [noShowNotes, setNoShowNotes] = useState<Record<string, string>>({})
  const [cancelNotes, setCancelNotes] = useState<Record<number, string>>({})
  const [cancelExceptions, setCancelExceptions] =
    useState<Record<number, string>>({})
  const [adminCancelOrigin, setAdminCancelOrigin] =
    useState<Record<string, "customer_assisted" | "provider_unavailable">>({})
  const [adminCancelReason, setAdminCancelReason] =
    useState<Record<string, string>>({})
  const [adminCancelException, setAdminCancelException] =
    useState<Record<string, string>>({})
  const [cancelActionErrors, setCancelActionErrors] =
    useState<Record<number, string>>({})
  const [reschedules, setReschedules] = useState<any[]>([]),
    [newDates, setNewDates] = useState<Record<string, string>>({}),
    [newSlots, setNewSlots] = useState<Record<string, string>>({}),
    [changeReasons, setChangeReasons] = useState<Record<string, string>>({})
  const [petId, setPetId] = useState(0),
    [service, setService] = useState(() => {
      const n =
        sessionStorage.getItem("petday_service_prefill") || "Grooming toàn diện"
      sessionStorage.removeItem("petday_service_prefill")
      return hasBookableService(n) ? n : "Grooming toàn diện"
    }),
    [branch, setBranch] = useState("PetDay Thảo Điền"),
    [date, setDate] = useState(tomorrow),
    [slot, setSlot] = useState("08:00"),
    [daycarePickupTime, setDaycarePickupTime] = useState(""),
    [daycareEndDate, setDaycareEndDate] = useState(tomorrow),
    [step, setStep] = useState(1)
  const [companionService, setCompanionService] = useState("")
  const [dayAvailability, setDayAvailability] = useState<{
      slot: string
      remaining: number
      available: boolean
      reason?: string | null
    }[]>([]),
    [dayLoading, setDayLoading] = useState(false),
    [dayError, setDayError] = useState("")
  const [availability, setAvailability] = useState<{
      available: boolean
      remaining: number
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("")
  const [adminOverview, setAdminOverview] = useState<any>(null)
  useEffect(() => {
    if (error) showToast(error, "error")
  }, [error])
  useEffect(() => {
    if (notice) showToast(notice, "success")
  }, [notice])
  const [adminTab, setAdminTab] =
    useState<"today" | "appointments" | "staff" | "people" | "products" | "orders" | "finance" | "support">(
      "today",
    )
  const [customerTab, setCustomerTab] =
    useState<"schedule" | "payments" | "refunds" | "reviews">("schedule")
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null)
  const [paymentExpandedCode, setPaymentExpandedCode] = useState<string | null>(
    () => sessionStorage.getItem("petday_payment_focus_booking"),
  )
  const [adminBankOpen, setAdminBankOpen] = useState(false)
  const [bookingSearch, setBookingSearch] = useState("")
  const [bookingPeriod, setBookingPeriod] = useState("all")
  const [bookingPetFilter, setBookingPetFilter] = useState("all")
  const [bookingFilter, setBookingFilter] = useState(
    view === "appointments" ? "all" : "processing",
  )
  const [financeScope, setFinanceScope] =
    useState<"todo" | "history" | "settings">("todo")
  const [financePanel, setFinancePanel] =
    useState<"payments" | "shop" | "refunds">("payments")
  const [focusedBookingAction, setFocusedBookingAction] = useState<{
    code: string
    action: "reschedule" | "cancel"
  } | null>(null)
  const bookingActionDialogRef = useRef<HTMLDivElement>(null)
  const bookingActionBusyRef = useRef(busy)
  useEffect(() => {
    bookingActionBusyRef.current = busy
  }, [busy])
  useEffect(() => {
    if (!focusedBookingAction) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const focusTimer = window.setTimeout(() => {
      bookingActionDialogRef.current
        ?.querySelector<HTMLElement>("[data-dialog-initial-focus]")
        ?.focus({ preventScroll: true })
    }, 0)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !bookingActionBusyRef.current) {
        event.preventDefault()
        setFocusedBookingAction(null)
        return
      }
      if (event.key !== "Tab") return
      const focusable = Array.from(
        bookingActionDialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || [],
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus({ preventScroll: true })
    }
  }, [focusedBookingAction])
  const [adminRescheduleOrigin, setAdminRescheduleOrigin] =
    useState<Record<string, "provider" | "customer">>({})
  const [bookingOrder, setBookingOrder] =
    useState<"created-newest" | "created-oldest" | "priority" | "newest" | "oldest">(
      view === "appointments" ? "created-newest" : "priority",
    )
  useEffect(() => {
    if (view === "appointments") {
      setBookingFilter("all")
      setBookingOrder("created-newest")
    } else if (view === "admin") {
      setBookingFilter("processing")
      setBookingOrder("priority")
    }
  }, [view])
  const [filterBranch, setFilterBranch] = useState("all")
  const [filterStart, setFilterStart] = useState("")
  const [filterEnd, setFilterEnd] = useState("")
  const [bankDraft, setBankDraft] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  })
  const [passwordCurrent, setPasswordCurrent] = useState(""),
    [passwordNew, setPasswordNew] = useState(""),
    [passwordConfirm, setPasswordConfirm] = useState("")
  const [resetConfirm, setResetConfirm] = useState("")
  const [notifications, setNotifications] = useState<any[]>([]),
    [paymentRefs, setPaymentRefs] = useState<Record<string, string>>({}),
    [paymentNotes, setPaymentNotes] = useState<Record<string, string>>({})
  const [financeSearchCode, setFinanceSearchCode] = useState("")
  const [paymentAudit, setPaymentAudit] = useState<any[]>([]),
    [promotions, setPromotions] = useState<any[]>([])
  const [refunds, setRefunds] = useState<any[]>([]),
    [finance, setFinance] = useState<any>(null),
    [refundReasons, setRefundReasons] = useState<Record<string, string>>({}),
    [refundNotes, setRefundNotes] = useState<Record<number, string>>({}),
    [refundRefs, setRefundRefs] = useState<Record<number, string>>({}),
    [refundAmounts, setRefundAmounts] = useState<Record<number, string>>({})
  const [timelineOpen, setTimelineOpen] = useState<string | null>(null),
    [timelineData, setTimelineData] = useState<Record<string, any[]>>({})
  const [incompleteOpen,setIncompleteOpen] = useState<string|null>(null)
  const [completionDialog,setCompletionDialog] = useState<{code:string;charge:number;collected:number;outstanding:number;choice:"received"|"unpaid"|null}|null>(null)
  const [incompleteReasons, setIncompleteReasons] =
    useState<Record<string, string>>({})
  const [incompleteNotes, setIncompleteNotes] =
    useState<Record<string, string>>({})
  const [milestoneNotes, setMilestoneNotes] = useState<Record<string, string>>(
    {},
  )
  const [milestoneImages, setMilestoneImages] = useState<Record<string, File[]>>({})
  const [milestoneImageRetries, setMilestoneImageRetries] = useState<Record<string, {eventId:number} | undefined>>({})
  const [reminderPreview, setReminderPreview] = useState<any>(null)
  const [queueDate, setQueueDate] = useState(""),
    [queueStatus, setQueueStatus] = useState("all"),
    [queueRows, setQueueRows] = useState<any[]>([]),
    [queueLoading, setQueueLoading] = useState(false)
  const [newPromo, setNewPromo] = useState({
    code: "",
    discountType: "percent",
    discountValue: "10",
    minOrder: "0",
    maxPerCustomer: "1",
    startsAt: "",
    endsAt: "",
  })
  const [consultations, setConsultations] = useState<{
    id: number
    contact_name: string
    contact_email: string
    question: string
    status: string
    reply_text?: string
    created_at: string
  }[]>([])
  const [careText, setCareText] = useState<Record<string, string>>({}),
    [reviewText, setReviewText] = useState<Record<string, string>>({}),
    [rating, setRating] = useState<Record<string, number>>({})
  useEffect(() => {
    if (defaultAddress) setTaxiAddress((old) => old || defaultAddress)
    if (contactPhone) setTaxiPhone((old) => old || contactPhone)
  }, [defaultAddress, contactPhone])
  async function reload(t = token) {
    if (!t) return
    // Authenticate independently of optional business tables: never discard a valid login because a migration is missing.
    const u = await api("/me", "GET", undefined, t)
    setUser({ id: u.id, email: u.email, fullName: u.full_name, role: u.role })
    setProfileName(u.full_name)
    setDefaultAddress(u.defaultAddress || "")
    setContactPhone(
      /^(0[0-9]{9}|\+84[0-9]{9})$/.test(String(u.contactPhone || ""))
        ? u.contactPhone
        : "",
    )
    setDefaultDeliveryZone(
      u.defaultDeliveryZone === "outer_hcm" ? "outer_hcm" : "inner_hcm",
    )
    if (u.role === "admin")
      api("/admin/overview", "GET", undefined, t)
        .then(setAdminOverview)
        .catch(() => {})
    const [pResult, bResult] = await Promise.allSettled([
      api("/pets", "GET", undefined, t),
      api("/bookings", "GET", undefined, t),
    ])
    if (pResult.status === "fulfilled") {
      const p = pResult.value
      setPets(p)
      if (p.length)
        setPetId((prev) => (p.some((v: Pet) => v.id === prev) ? prev : p[0].id))
    } else {
      setPets([])
      setError(
        "Không tải được hồ sơ thú cưng: " +
          String(pResult.reason?.message || pResult.reason),
      )
    }
    if (bResult.status === "fulfilled") {
      setBookings(bResult.value)
      if (pResult.status === "fulfilled") setError("")
    } else {
      setBookings([])
      setError(
        "Không tải được lịch hẹn: " +
          String(bResult.reason?.message || bResult.reason) +
          ". Kiểm tra SQL migration.",
      )
    }
    if (u.role === "customer" || u.role === "admin")
      api("/reschedule-requests", "GET", undefined, t)
        .then(setReschedules)
        .catch(() => {})
    if (u.role === "customer" || u.role === "admin")
      api("/cancellation-requests", "GET", undefined, t)
        .then(setCancellations)
        .catch(() => {})
    if (u.role === "customer") {
      setQuote(null)
      api("/me/prepayment-policy", "GET", undefined, t)
        .then(setAccountPrepaymentPolicy)
        .catch(() => setAccountPrepaymentPolicy(null))
      api("/my/refunds", "GET", undefined, t)
        .then(setRefunds)
        .catch(() => {})
      api("/my/consultations", "GET", undefined, t)
        .then(setMyRequests)
        .catch(() => {})
      api("/my/notifications", "GET", undefined, t)
        .then(setNotifications)
        .catch(() => {})
    }
    if (u.role === "admin") {
      api("/admin/refunds", "GET", undefined, t)
        .then(setRefunds)
        .catch(() => {})
      api("/admin/finance/summary", "GET", undefined, t)
        .then(setFinance)
        .catch(() => {})
      api("/admin/payment-settings", "GET", undefined, t)
        .then((v) => {
          if (v.bankTransfer) setBankDraft(v.bankTransfer)
        })
        .catch(() => {})
      api("/admin/promotions", "GET", undefined, t)
        .then(setPromotions)
        .catch(() => {})
      api("/admin/payments/audit", "GET", undefined, t)
        .then(setPaymentAudit)
        .catch(() => {})
    }
  }
  useEffect(() => {
    if (token)
      reload(token)
        .catch(() => {
          sessionStorage.removeItem("petday_token_v3")
          sessionStorage.removeItem("petday_api_token")
          setToken("")
          setUser(null)
        })
        .finally(() => setLoading(false))
  }, [])
  useEffect(() => {
    if (resetToken) {
      const u = new URL(window.location.href)
      u.searchParams.delete("reset_token")
      window.history.replaceState(
        null,
        "",
        u.pathname + (u.search || "") + u.hash,
      )
    }
  }, [resetToken])
  // Additional-service flow: pick a second package, but create a second independently verified booking.
  useEffect(() => {
    if (view !== "booking" || !pets.length) return
    const raw = sessionStorage.getItem("petday_additional_service_draft")
    if (!raw) return
    sessionStorage.removeItem("petday_additional_service_draft")
    try {
      const b = JSON.parse(raw)
      if (!pets.some((p) => p.id === b.petId)) return
      setPetId(b.petId)
      setService("Grooming cơ bản")
      setBranch(b.branch)
      setDate(
        typeof b.date === "string" && b.date >= tomorrow()
          ? b.date
          : tomorrow(),
      )
      setSlot("08:00")
      setStep(2)
      setRetailChosen([])
      setSelectedAddOns([])
      setPromoCode("")
      setPromoPreview(null)
      setPaymentMethod("cash")
      setPrepaymentChoice("deposit")
      setTaxiEnabled(false)
    } catch {}
  }, [view, pets])
  // Restore requested rebooking after navigation even when Portal remounts between routes.
  useEffect(() => {
    if (view !== "booking" || !pets.length) return
    const draft = sessionStorage.getItem("petday_rebook_draft")
    if (!draft) return
    sessionStorage.removeItem("petday_rebook_draft")
    try {
      const b = JSON.parse(draft)
      if (!pets.some((p) => p.id === b.petId)) return
      if (!hasBookableService(b.service)) return
      setPetId(b.petId)
      setService(b.service)
      setBranch(b.branch)
      setDate(tomorrow())
      setSlot("08:00")
      setStep(2)
      setSelectedAddOns([])
      setRetailChosen([])
      setPromoCode("")
      setPromoPreview(null)
      setPaymentMethod("cash")
      setPrepaymentChoice("deposit")
      setTaxiEnabled(false)
      setTaxiAddress("")
      setTaxiPhone("")
    } catch {
      /* Malformed saved draft is ignored. */
    }
  }, [view, pets])
  useEffect(() => {
    setAvailability(null)
  }, [petId, service, branch, date, slot])
  useEffect(() => {
    if (
      view !== "booking" ||
      step !== 3 ||
      !token ||
      servicePackages.find((p) => p.name === service)?.category === "Daycare"
    )
      return
    let cancelled = false
    setDayLoading(true)
    setDayError("")
    setDayAvailability([])
    setQuote(null)
    api(
      "/availability/day?" + new URLSearchParams({ branch, date, service }),
      "GET",
      undefined,
      token,
    )
      .then((result) => {
        if (!cancelled) setDayAvailability(result.slots || [])
      })
      .catch((err) => {
        if (!cancelled)
          setDayError(
            err instanceof Error ? err.message : "Không tải được khung giờ.",
          )
      })
      .finally(() => {
        if (!cancelled) setDayLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [
    view,
    step,
    token,
    branch,
    date,
    service,
    servicePackages.find((p) => p.name === service)?.category,
  ])
  useEffect(() => {
    if (
      view !== "booking" ||
      step !== 3 ||
      !dayAvailability.length ||
      servicePackages.find((p) => p.name === service)?.category === "Daycare"
    )
      return
    if (!dayAvailability.some((x) => x.slot === slot && x.available)) {
      const first = dayAvailability.find((x) => x.available)
      if (first) setSlot(first.slot)
    }
  }, [
    view,
    step,
    dayAvailability,
    slot,
    servicePackages.find((p) => p.name === service)?.category,
  ])

  useEffect(() => {
    setPromoPreview(null)
  }, [
    petId,
    service,
    slot,
    daycarePickupTime,
    daycareEndDate,
    companionService,
    selectedAddOns,
    taxiEnabled,
    taxiZone,
    taxiDirection,
    retailChosen,
  ])
  useEffect(() => {
    const item = servicePackages.find((x) => x.name === service)
    if (item && item.category !== serviceCategory)
      setServiceCategory(item.category as "Grooming" | "Spa" | "Daycare")
  }, [service])
  useEffect(() => {
    if (token)
      api("/retail/products", "GET", undefined, token)
        .then(setRetailProducts)
        .catch(() => setRetailProducts([]))
  }, [token])
  useEffect(() => {
    api("/payment/options")
      .then(setPayOptions)
      .catch(() => {})
    api("/catalog", "GET", undefined, token)
      .then((x) => {
        setAddOnCatalog(x.addOns || {})
        setLiveServicePrices(
          Object.fromEntries(
            Object.entries(x.services || {}).map(([n, v]: any) => [
              n,
              Number(v.base || 0),
            ]),
          ),
        )
        setActiveServiceNames(Object.keys(x.services || {}))
      })
      .catch(() => {})
  }, [token])
  useEffect(() => {
    if (!token || !petId) {
      setQuote(null)
      return
    }
    let cancelled = false
    api(
      "/quote?" +
        new URLSearchParams({
          petId: String(petId),
          service,
          slot,
          daycarePickupTime,
          daycareEndDate,
          date,
          companionService,
          addOns: selectedAddOns.join(","),
          taxiZone: taxiEnabled ? taxiZone : "none",
          taxiDirection,
          retail: JSON.stringify(retailChosen),
        }),
      "GET",
      undefined,
      token,
    )
      .then((q) => {
        if (!cancelled) {
          setQuote(q)
          setAccountPrepaymentPolicy({
            prepaymentRequired: quoteNeedsPrepayment(q),
            reason: q.prepaymentReason || "",
          })
        }
      })
      .catch(() => {
        if (!cancelled) setQuote(null)
      })
    return () => {
      cancelled = true
    }
  }, [
    token,
    petId,
    service,
    slot,
    daycarePickupTime,
    daycareEndDate,
    companionService,
    selectedAddOns,
    taxiEnabled,
    taxiZone,
    taxiDirection,
    retailChosen,
    accountPrepaymentPolicy?.prepaymentRequired,
  ])
  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra")
    } finally {
      setBusy(false)
    }
  }
  async function saveBank() {
    await run(async () => {
      const result = await api(
        "/admin/payment-settings",
        "PUT",
        bankDraft,
        token,
      )
      setBankDraft(result.bankTransfer)
      setPayOptions(await api("/payment/options"))
      setNotice(
        "Đã lưu tài khoản nhận chuyển khoản. Khách có thể chọn phương thức chuyển khoản cho lịch mới.",
      )
    })
  }
  async function changePassword() {
    await run(async () => {
      if (passwordNew !== passwordConfirm)
        throw Error("Mật khẩu mới xác nhận chưa khớp.")
      if (passwordNew.length < 8) throw Error("Mật khẩu mới tối thiểu 8 ký tự.")
      const r = await api(
        "/me/change-password",
        "POST",
        { currentPassword: passwordCurrent, newPassword: passwordNew },
        token,
      )
      setPasswordCurrent("")
      setPasswordNew("")
      setPasswordConfirm("")
      setNotice(r.message)
    })
  }
  async function changeBookingPayment(
    code: string,
    paymentMethod: "cash" | "bank_transfer",
  ) {
    await run(async () => {
      await api(
        `/bookings/${code}/payment-method`,
        "PATCH",
        { paymentMethod },
        token,
      )
      await reload()
      setNotice("Đã cập nhật phương thức thanh toán cho " + code)
    })
  }
  async function saveProfile() {
    await run(async () => {
      const u = await api(
        "/me",
        "PATCH",
        {
          fullName: profileName,
          defaultAddress,
          contactPhone,
          defaultDeliveryZone,
        },
        token,
      )
      setUser({ id: u.id, email: u.email, fullName: u.full_name, role: u.role })
      setNotice("Đã cập nhật thông tin cá nhân.")
    })
  }
  function logout() {
    sessionStorage.removeItem("petday_token_v3")
    sessionStorage.removeItem("petday_api_token")
    setToken("")
    setUser(null)
    setPets([])
    setBookings([])
    onGo("home")
  }
  async function submitAuth() {
    await run(async () => {
      if (authMode === "forgot") {
        try {
          const out = await api("/auth/forgot-password", "POST", { email })
          setNotice(out.message)
        } catch (e) {
          if (String(e).includes("503"))
            throw Error(
              "Email khôi phục chưa gửi được. Cần cấu hình SMTP trong server/.env và khởi động lại backend; xem /api/health/features.",
            )
          throw e
        }
        return
      }
      if (authMode === "reset") {
        if (!resetToken)
          throw Error(
            "Liên kết đặt lại mật khẩu không hợp lệ. Hãy yêu cầu liên kết mới.",
          )
        if (password !== resetConfirm)
          throw Error("Hai lần nhập mật khẩu mới chưa khớp.")
        const out = await api("/auth/reset-password", "POST", {
          token: resetToken,
          password,
        })
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.hash,
        )
        setAuthMode("login")
        setPassword("")
        setNotice(out.message)
        return
      }
      if (authMode === "register") {
        await api("/auth/register", "POST", {
          fullName,
          email,
          password,
          phone: registrationPhone,
        })
      }
      const result = await api("/auth/login", "POST", {
        identifier: authMode === "register" ? email : loginIdentifier,
        password,
      })
      sessionStorage.setItem("petday_token_v3", result.token)
      setToken(result.token)
      await reload(result.token)
      setPassword("")
      onGo("home")
    })
  }
  function editPet(p: Pet) {
    setEditingPet(p.id)
    setName(p.name)
    setSpecies(p.species)
    setBreed(p.breed || "")
    setGender(p.gender || "Chưa xác định")
    setCoat(p.coat || "Chưa xác định")
    setAge(String(p.age))
    setWeight(String(p.weight))
    setNotes(p.notes || "")
    setPhotoUrl(p.photoUrl || "")
  }
  function clearPetForm() {
    setEditingPet(null)
    setName("")
    setSpecies("Chó")
    setBreed("")
    setGender("Chưa xác định")
    setCoat("Chưa xác định")
    setAge("")
    setWeight("")
    setNotes("")
    setPhotoUrl("")
  }
  async function uploadPhoto(file: File) {
    setError("")
    setNotice("")
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Chỉ chấp nhận JPG, PNG, WebP tối đa 5 MB.")
      return
    }
    if (!token) {
      setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tải ảnh.")
      return
    }
    setUploading(true)
    try {
      const r = await apiFetch("/api/pets/photo", {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          Authorization: `Bearer ${token}`,
        },
        body: file,
      })
      const out = await r.json().catch(() => ({
        error:
          "Server trả về phản hồi không đúng định dạng JSON. Kiểm tra proxy /api và terminal backend.",
      }))
      if (!r.ok)
        throw Error(
          (out.error || "Không tải được ảnh") + " [HTTP " + r.status + "]",
        )
      if (!out.url || !/^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(out.url))
        throw Error("Đường dẫn ảnh trả về không hợp lệ.")
      setPhotoUrl(out.url)
      setNotice(
        "Đã tải ảnh lên thành công. Bấm " +
          (editingPet ? "“Lưu thay đổi”" : "“Thêm thú cưng”") +
          " để gắn ảnh vào hồ sơ.",
      )
    } catch (e) {
      setError(
        "Tải ảnh thất bại: " +
          (e instanceof Error ? e.message : "Không thể kết nối API") +
          ". Nếu lỗi tiếp diễn, xem Network → /api/pets/photo.",
      )
    } finally {
      setUploading(false)
    }
  }
  async function deletePet(p: Pet) {
    const hasHistory = bookings.some((b) => b.petId === p.id)
    const action = hasHistory ? "lưu trữ" : "xóa"
    if (
      !window.confirm(
        `${hasHistory ? "Lưu trữ" : "Xóa"} hồ sơ ${p.name}? ${
          hasHistory
            ? "Hồ sơ sẽ ẩn khỏi danh sách đặt lịch, nhưng lịch sử vẫn được bảo toàn."
            : "Hồ sơ chưa có lịch sử sẽ được xóa vĩnh viễn."
        }`,
      )
    )
      return
    await run(async () => {
      await api(
        `/pets/${p.id}${hasHistory ? "/archive" : ""}`,
        hasHistory ? "PATCH" : "DELETE",
        undefined,
        token,
      )
      if (editingPet === p.id) clearPetForm()
      if (petId === p.id) setPetId(0)
      await reload()
      setNotice(`Đã ${action} hồ sơ ${p.name}.`)
    })
  }
  async function addPet() {
    await run(async () => {
      const payload = {
        name,
        species,
        breed,
        gender,
        coat,
        age: Number(age),
        weight: Number(weight),
        notes,
        photoUrl,
      }
      await api(
        editingPet ? `/pets/${editingPet}` : "/pets",
        editingPet ? "PUT" : "POST",
        payload,
        token,
      )
      await reload()
      clearPetForm()
      setNotice(
        editingPet ? "Đã cập nhật hồ sơ thú cưng." : "Đã tạo hồ sơ thú cưng.",
      )
    })
  }
  async function checkAvailability() {
    await run(async () => {
      if (currentPackage?.category === "Daycare") {
        const start = Number(slot.slice(0, 2)) * 60 + Number(slot.slice(3))
        const end =
          Number(daycarePickupTime.slice(0, 2)) * 60 +
          Number(daycarePickupTime.slice(3))
        if (daycareEndDate && date && Date.parse(daycareEndDate) - Date.parse(date) > 6 * 86400000) throw Error("Daycare chỉ được đặt tối đa 7 ngày, tính cả ngày đến.")
        if (
          !daycarePickupTime ||
          start < 480 ||
          !daycareEndDate ||
          daycareEndDate < date ||
          end > 1200 ||
          (daycareEndDate === date && end - start < 60)
        )
          throw Error(
            "Daycare yêu cầu chọn giờ đến và giờ về hợp lệ trong 08:00–20:00.",
          )
      }
      const r = await api(
        "/availability?" +
          new URLSearchParams({
            branch,
            date,
            slot,
            service,
            ...(currentPackage?.category === "Daycare"
              ? { endTime: daycarePickupTime, endDate: daycareEndDate }
              : {}),
          }),
        "GET",
        undefined,
        token,
      )
      setAvailability(r)
      if (!r.available)
        throw Error(
          r.reason || "Khung giờ này đã hết chỗ. Vui lòng chọn khung giờ khác.",
        )
      setStep(4)
    })
  }
  async function verifyPromotion() {
    await run(async () => {
      if (!petId) throw Error("Chọn thú cưng trước khi kiểm tra ưu đãi.")
      const r = await api(
        "/promotions/verify?" +
          new URLSearchParams({
            code: promoCode,
            petId: String(petId),
            service,
            slot,
            daycarePickupTime,
            daycareEndDate,
            date,
            companionService,
            addOns: selectedAddOns.join(","),
            taxiZone: taxiEnabled ? taxiZone : "none",
            taxiDirection,
            retail: JSON.stringify(retailChosen),
          }),
        "GET",
        undefined,
        token,
      )
      setPromoPreview(r)
      setNotice(
        "Đã áp dụng mã ưu đãi dự kiến. Hệ thống sẽ xác minh lại khi đặt lịch.",
      )
    })
  }
  async function book() {
    await run(async () => {
      if (promoCode.trim() && !promoPreview)
        throw Error(
          "Vui lòng bấm Áp dụng để kiểm tra mã ưu đãi trước khi đặt lịch.",
        )
      if (
        paymentMethod === "bank_transfer" &&
        !payOptions?.bankTransfer?.enabled
      )
        throw Error("Chưa cấu hình tài khoản nhận chuyển khoản.")
      const r = await api(
        "/bookings",
        "POST",
        {
          petId,
          service,
          branch,
          date,
          slot,
          daycarePickupTime:
            currentPackage?.category === "Daycare"
              ? daycarePickupTime || undefined
              : undefined,
          daycareEndDate:
            currentPackage?.category === "Daycare" ? daycareEndDate : undefined,
          companionService:
            currentPackage?.category === "Daycare"
              ? companionService || undefined
              : undefined,
          addOns: selectedAddOns,
          retail: retailChosen,
          taxi: taxiEnabled
            ? {
                enabled: true,
                zone: taxiZone,
                address: taxiAddress,
                phone: taxiPhone,
                direction: taxiDirection,
                returnAddress: taxiReturnAddress || taxiAddress,
              }
            : undefined,
          paymentMethod,
          prepaymentChoice: requiresPrepayment
            ? paymentMethod === "bank_transfer"
              ? "full"
              : prepaymentChoice
            : undefined,
          customerNote: bookingNote.trim(),
          promoCode:
            promoPreview?.code === promoCode.trim().toUpperCase()
              ? promoPreview.code
              : "",
          idempotencyKey: crypto.randomUUID(),
        },
        token,
      )
      await reload()
      setPaymentChoiceOpen(false)
      setNotice(
        r.status === "Đang chờ xác nhận"
          ? `Lịch ${r.code} đang chờ thanh toán ${
              paymentMethod === "bank_transfer" || prepaymentChoice === "full"
                ? "toàn bộ"
                : "cọc 20%"
            } qua QR và xác minh. Chưa được xác nhận lịch.`
          : `Đã xác nhận lịch ${r.code}. Thanh toán được theo dõi riêng.`,
      )
      const needsQr =
        paymentMethod === "bank_transfer" ||
        r.line_items?.some((x: any) => x.type === "first_use_deposit")
      if (needsQr) {
        sessionStorage.setItem("petday_payment_focus_booking", String(r.code))
        setCustomerTab("schedule")
        setPaymentExpandedCode(String(r.code))
        setBookingFilter("all")
        setPaymentPopupCode(String(r.code))
      }
      setStep(1)
      setBookingNote("")
      setSelectedAddOns([])
      setRetailChosen([])
      setTaxiEnabled(false)
      setTaxiAddress("")
      setTaxiPhone("")
      if (!needsQr) onGo("appointments")
    })
  }
  function confirmBooking() {
    if (paymentMethod === "bank_transfer" || requiresPrepayment) {
      setPaymentChoiceOpen(true)
      return
    }
    void book()
  }
  async function loadReschedules() {
    await run(async () => {
      setReschedules(await api("/reschedule-requests", "GET", undefined, token))
    })
  }
  async function requestReschedule(code: string) {
    const booking = bookings.find((b) => b.code === code)
    const date = newDates[code] || ""
    const slot = newSlots[code] || "08:00"
    if (
      booking &&
      date === booking.date.slice(0, 10) &&
      slot === booking.slot.slice(0, 5)
    ) {
      setError(
        "Ngày và giờ mới đang trùng với lịch hẹn hiện tại. Vui lòng chọn thời gian khác để tiếp tục.",
      )
      return
    }
    await run(async () => {
      await api(
        `/bookings/${code}/reschedule`,
        "POST",
        { date, slot, reason: changeReasons[code] || "" },
        token,
      )
      setReschedules(await api("/reschedule-requests", "GET", undefined, token))
      await reload()
      setChangeReasons((v) => ({ ...v, [code]: "" }))
      setNotice(
        "Đã ghi nhận thao tác đổi lịch. Trước hơn 1 giờ, lịch mới tự cập nhật nếu còn chỗ; sát giờ sẽ chuyển sang hỗ trợ.",
      )
      setFocusedBookingAction(null)
    })
  }
  async function proposeAdminReschedule(code: string) {
    await run(async () => {
      const date = newDates[code] || "",
        slot = newSlots[code] || "08:00",
        rawReason = (changeReasons[code] || "").trim()
      const reason =
        (adminRescheduleOrigin[code] === "customer"
          ? "Khách yêu cầu: "
          : "PetDay điều chỉnh: ") + rawReason
      await api(
        `/bookings/${code}/reschedule`,
        "POST",
        { date, slot, reason },
        token,
      )
      setReschedules(await api("/reschedule-requests", "GET", undefined, token))
      await reload()
      setNotice(
        "Đã cập nhật lịch ngay theo chính sách, có lưu lý do và thông báo cho khách.",
      )
    })
  }
  async function decideMyProposal(
    id: number,
    decision: "approved" | "rejected",
  ) {
    await run(async () => {
      await api(`/my/reschedule-proposals/${id}`, "PATCH", { decision }, token)
      await reload()
      setNotice(
        decision === "approved"
          ? "Đã đồng ý đổi lịch, thời gian mới được cập nhật."
          : "Đã từ chối đề xuất, lịch cũ vẫn có hiệu lực.",
      )
    })
  }
  async function decideReschedule(
    id: number,
    decision: "approved" | "rejected",
  ) {
    await run(async () => {
      const result = await api(
        `/admin/reschedule-requests/${id}`,
        "PATCH",
        { decision },
        token,
      )
      await reload()
      setNotice(
        decision === "approved"
          ? `${
              result.repaired ? "Đã đồng bộ" : "Đã duyệt"
            } lịch ${result.bookingCode} sang ${result.bookingDate} lúc ${result.bookingSlot}.`
          : "Đã từ chối yêu cầu đổi lịch; thời gian lịch hẹn giữ nguyên.",
      )
    })
  }
  async function askCancellation(code: string) {
    await run(async () => {
      const reason = (cancelReasons[code] || "").trim()
      if (reason.length < 10)
        throw Error("Vui lòng nhập lý do hủy tối thiểu 10 ký tự.")
      await api(
        "/bookings/" + encodeURIComponent(code) + "/cancellation-request",
        "POST",
        { reason },
        token,
      )
      setCancellations(
        await api("/cancellation-requests", "GET", undefined, token),
      )
      await reload()
      setCancelReasons((x) => ({ ...x, [code]: "" }))
      setNotice(
        "Hệ thống đã xử lý hủy theo chính sách. Nếu đủ điều kiện, khoản hoàn được ghi nhận tự động; trạng thái chuyển tiền được theo dõi riêng.",
      )
      setFocusedBookingAction(null)
    })
  }
  async function resolveCancellation(
    id: number,
    decision: "approved" | "rejected",
  ) {
    const note = (cancelNotes[id] || "").trim()
    if (note.length < 8) {
      setCancelActionErrors((v) => ({
        ...v,
        [id]: "Cần ghi rõ lý do xử lý (ít nhất 8 ký tự).",
      }))
      return
    }
    const request = cancellations.find((x) => String(x.id) === String(id))
    const overrideText = (cancelExceptions[id] || "").trim()
    const exceptionRefundAmount =
      overrideText === "" ? undefined : Number(overrideText)
    if (
      exceptionRefundAmount !== undefined &&
      (!Number.isSafeInteger(exceptionRefundAmount) ||
        exceptionRefundAmount < 0 ||
        exceptionRefundAmount > Number(request?.total))
    ) {
      setCancelActionErrors((v) => ({
        ...v,
        [id]: "Số tiền hoàn ngoại lệ không hợp lệ hoặc vượt số đã thu.",
      }))
      return
    }
    if (
      decision === "approved" &&
      !window.confirm(
        "Chấp thuận hủy lịch theo chính sách hiển thị? Số tiền hoàn (nếu có) chỉ tạo hồ sơ CHỜ duyệt hoàn, không tự chuyển tiền.",
      )
    )
      return
    setBusy(true)
    setError("")
    setNotice("")
    setCancelActionErrors((v) => ({ ...v, [id]: "" }))
    try {
      await api(
        "/admin/cancellation-requests/" + id,
        "PATCH",
        {
          decision,
          note,
          ...(decision === "approved" && exceptionRefundAmount !== undefined
            ? { exceptionRefundAmount }
            : {}),
        },
        token,
      )
      // Remove the successfully processed request locally, even if an unrelated
      // optional dashboard API fails while refreshing.
      setCancellations((rows) =>
        rows.map((r) =>
          String(r.id) === String(id)
            ? { ...r, status: decision, adminNote: note }
            : r,
        ),
      )
      setNotice(
        decision === "approved"
          ? "Đã duyệt hủy lịch. Nếu đã thu tiền, kiểm tra khoản hoàn tại lịch đã hủy."
          : "Đã từ chối yêu cầu hủy và lưu lý do.",
      )
      await reload().catch((e) =>
        setError(
          "Đã xử lý yêu cầu, nhưng cập nhật dữ liệu gặp lỗi: " +
            String(e?.message || e),
        ),
      )
    } catch (e) {
      setCancelActionErrors((v) => ({
        ...v,
        [id]:
          "Không lưu được quyết định hủy: " +
          (e instanceof Error ? e.message : "Lỗi kết nối Backend") +
          ". Trạng thái chưa thay đổi.",
      }))
    } finally {
      setBusy(false)
    }
  }
  async function requestRefund(code: string) {
    await run(async () => {
      const reason = (refundReasons[code] || "").trim()
      if (reason.length < 10)
        throw Error("Vui lòng mô tả lý do ít nhất 10 ký tự.")
      await api(
        "/bookings/" + encodeURIComponent(code) + "/refund-request",
        "POST",
        { reason },
        token,
      )
      setRefunds(await api("/my/refunds", "GET", undefined, token))
      setRefundReasons((v) => ({ ...v, [code]: "" }))
      setNotice(
        "Đã gửi yêu cầu. Nhân viên sẽ kiểm tra và phản hồi trong tài khoản.",
      )
    })
  }
  async function decideRefund(
    id: number,
    decision: "approve" | "reject" | "complete",
  ) {
    await run(async () => {
      const note = (refundNotes[id] || "").trim(),
        reference = (refundRefs[id] || "").trim()
      if (decision === "reject" && note.length < 8)
        throw Error("Nhập lý do từ chối ít nhất 8 ký tự.")
      const refund = refunds.find((x) => x.id === id)
      const amountText = (refundAmounts[id] || "").trim()
      const amount = amountText ? Number(amountText) : Number(refund?.amount)
      if (
        decision === "approve" &&
        (!Number.isSafeInteger(amount) ||
          amount <= 0 ||
          amount > Number(refund?.total))
      )
        throw Error("Số tiền hoàn không hợp lệ hoặc vượt quá tiền đã thu.")
      if (
        decision === "approve" &&
        amount < Number(refund?.total) &&
        note.length < 8
      )
        throw Error("Hoàn một phần cần ghi rõ lý do ít nhất 8 ký tự.")
      if (decision === "complete" && reference.length < 4)
        throw Error(
          "Cần mã tham chiếu hoàn tiền thực tế hoặc số phiếu thu/chi.",
        )
      if (
        decision === "complete" &&
        !window.confirm(
          "Xác nhận tiền đã HOÀN thực tế cho khách? Thao tác này sẽ cập nhật sổ đối soát.",
        )
      )
        return
      await api(
        "/admin/refunds/" + id,
        "PATCH",
        {
          decision,
          note,
          ...(decision === "complete"
            ? { reference }
            : decision === "approve"
              ? { amount }
              : {}),
        },
        token,
      )
      await reload()
      setNotice(
        decision === "complete"
          ? "Đã ghi nhận xử lý hoàn tiền và lưu mã đối soát."
          : decision === "approve"
            ? "Đã duyệt hoàn tiền. Chỉ xác nhận hoàn tất sau khi thực hiện hoàn tiền."
            : "Đã từ chối yêu cầu hoàn tiền và gửi lý do cho khách.",
      )
    })
  }
  async function recordPayment(
    code: string,
    method: string,
    paymentStatus: "Chưa thanh toán" | "Đã thanh toán",
  ) {
    await run(async () => {
      if (
        paymentStatus === "Đã thanh toán" &&
        method === "bank_transfer" &&
        !paymentRefs[code]?.trim()
      )
        throw Error("Cần nhập mã giao dịch ngân hàng đã đối soát.")
      if (paymentStatus === "Chưa thanh toán" && !paymentNotes[code]?.trim())
        throw Error("Nhập lý do điều chỉnh trạng thái thanh toán.")
      await api(
        `/admin/bookings/${code}/payment`,
        "PATCH",
        {
          paymentStatus,
          reference: paymentRefs[code] || "",
          note: paymentNotes[code] || "",
        },
        token,
      )
      await reload()
      setNotice("Đã cập nhật thanh toán và lưu nhật ký đối soát.")
    })
  }
  async function refreshPromos() {
    setPromotions(await api("/admin/promotions", "GET", undefined, token))
  }
  async function createPromo() {
    await run(async () => {
      const payload = {
        ...newPromo,
        discountValue: Number(newPromo.discountValue),
        minOrder: Number(newPromo.minOrder),
        maxPerCustomer: Number(newPromo.maxPerCustomer),
        startsAt: new Date(newPromo.startsAt).toISOString(),
        endsAt: new Date(newPromo.endsAt).toISOString(),
      }
      await api("/admin/promotions", "POST", payload, token)
      await refreshPromos()
      setNewPromo((v) => ({ ...v, code: "" }))
      setNotice("Đã tạo mã ưu đãi.")
    })
  }
  async function reloadTimeline(code: string) {
    await run(async () => {
      const result = await api(
        "/bookings/" + encodeURIComponent(code) + "/timeline",
        "GET",
        undefined,
        token,
      )
      setTimelineData((x) => ({ ...x, [code]: result.events }))
      setTimelineOpen(code)
    })
  }
  async function showTimeline(code: string) {
    if (timelineOpen === code) {
      setTimelineOpen(null)
      return
    }
    await run(async () => {
      const result = await api(
        "/bookings/" + encodeURIComponent(code) + "/timeline",
        "GET",
        undefined,
        token,
      )
      setTimelineData((x) => ({ ...x, [code]: result.events }))
      setTimelineOpen(code)
    })
  }
  async function loadReminderPreview() {
    await run(async () =>
      setReminderPreview(
        await api("/admin/reminders/preview", "GET", undefined, token),
      ),
    )
  }
  async function sendReminders() {
    await run(async () => {
      const r = await api("/admin/reminders/send", "POST", {}, token)
      setReminderPreview(
        await api("/admin/reminders/preview", "GET", undefined, token),
      )
      setNotice(
        `Đã tạo ${r.sent} thông báo nhắc lịch trong tài khoản khách. Không gửi SMS hoặc email.`,
      )
    })
  }
  // Fetch authoritative settlement, including legacy financial history if present.
  async function openCareCompletion(booking:Booking) {
    if (busy || milestoneImageRetries[booking.code]) return
    if (booking.paymentMethod !== "cash" || booking.paymentPlan === "FULL_PREPAY") {
      await postMilestone(booking.code,"check_out")
      return
    }
    await run(async()=>{
      const q=await api("/admin/bookings/"+encodeURIComponent(booking.code)+"/settlement","GET",undefined,token)
      if (!Number.isSafeInteger(q.outstanding)||q.outstanding<0) throw Error("Không xác định được số tiền còn phải thu.")
      setCompletionDialog({code:booking.code,charge:Number(q.charge),collected:Number(q.collected),outstanding:q.outstanding,choice:null})
    })
  }
  // Previously completed care with unpaid cash: collect later without creating another checkout milestone.
  async function collectRemainingCareCash(booking:Booking){
    if(busy)return
    await run(async()=>{
      const path="/admin/bookings/"+encodeURIComponent(booking.code)
      const q=await api(path+"/settlement","GET",undefined,token)
      if(!Number.isSafeInteger(q.outstanding)||q.outstanding<=0){await reload();setNotice("Không còn khoản tiền cần thu. Vui lòng kiểm tra trạng thái thanh toán.");return}
      if(!window.confirm("Xác nhận đã thực nhận đủ "+money(q.outstanding)+" tiền mặt còn lại cho lịch "+booking.code+"?"))return
      const result=await api(path+"/receipts","POST",{amount:q.outstanding,method:"cash",note:"Thu tiền mặt còn lại sau khi chăm sóc xong"},token)
      await reload()
      setNotice(result.remaining===0?"Đã ghi nhận thực thu và hoàn tất lịch hẹn.":"Đã ghi nhận thực thu. Còn phải thu "+money(result.remaining)+".")
    })
  }
  async function postMilestone(
    code: string,
    eventType: "pet_arrived" | "check_in" | "care_update" | "ready" | "check_out" | "pet_handed_over",
    checkoutChoice?: {received:boolean;outstanding:number},
  ) {
    const closeWithoutPayment = checkoutChoice?.received === false && checkoutChoice.outstanding > 0
    const note = (milestoneNotes[code] || "").trim()
    if (note.length > 1200) {
      setError("Ghi chú chăm sóc tối đa 1200 ký tự.")
      return
    }
    let handoffSource: "customer" | "taxi" | undefined
    if (eventType === "pet_handed_over") {
      if (
        !window.confirm(
          "Xác nhận thú cưng đã được bàn giao trực tiếp cho khách hoặc người nhận? Chỉ bấm khi pet thực sự được nhận, không dùng thay cho Taxi chiều về đang chạy.",
        )
      )
        return
      if (note.length < 3) {
        setError(
          "Nhập tên người nhận hoặc nội dung đối chiếu ít nhất 3 ký tự trước khi bàn giao.",
        )
        return
      }
    }
    if (eventType === "pet_arrived") {
      // One step for all arrivals; Pet Taxi is coordinated separately.
      handoffSource = "customer"
      if (note.length < 3) {
        setError(
          "Nhập ghi chú xác minh đúng thú cưng, ví dụ: Đã đối chiếu hồ sơ pet và người bàn giao.",
        )
        return
      }
      if (
        !window.confirm(
          "Xác nhận thú cưng thực sự có mặt và đã bàn giao cho nhân viên? Thao tác này đồng thời bắt đầu dịch vụ.",
        )
      )
        return
    }
    let cashReceived = false
    if (eventType === "check_out") {
      const booking = bookings.find((x) => x.code === code)
      const cashPlan = booking?.paymentMethod === "cash" && booking?.paymentPlan !== "FULL_PREPAY"
      if (cashPlan && !checkoutChoice) {
        // All Admin cash finishes use the single explicit settlement dialog.
        if(booking)await openCareCompletion(booking)
        return
      }
      if(cashPlan && checkoutChoice?.received === true && checkoutChoice.outstanding > 0) cashReceived = true
    }
    await run(async () => {
      const created = await api(
        "/admin/bookings/" + encodeURIComponent(code) + "/milestone",
        "POST",
        {
          eventType,
          note,
          ...(handoffSource ? { handoffSource } : {}),
          ...(eventType === "check_out" ? { cashReceived, closeWithoutPayment, ...(checkoutChoice ? {expectedCashAmount:checkoutChoice.outstanding}: {}) } : {}),
        },
        token,
      )
      let imageError = ""
      let failedImages:File[] = []
      const selectedImages = milestoneImages[code] || []
      if (selectedImages.length) {
        try {
          await uploadCareEventImages(code, Number(created.id), selectedImages, token)
        } catch (uploadError) {
          imageError = uploadError instanceof Error ? uploadError.message : "Không tải được ảnh chăm sóc."
          failedImages = uploadError instanceof CareImageUploadError ? uploadError.failedFiles : selectedImages
        }
      }
      setMilestoneNotes((x) => ({ ...x, [code]: "" }))
      setMilestoneImages((x) => ({ ...x, [code]: failedImages }))
      setMilestoneImageRetries((x) => ({...x,[code]:failedImages.length?{eventId:Number(created.id)}:undefined}))
      const result = await api(
        "/bookings/" + encodeURIComponent(code) + "/timeline",
        "GET",
        undefined,
        token,
      )
      setTimelineData((x) => ({ ...x, [code]: result.events }))
      setTimelineOpen(code)
      await reload()
      if (imageError) setError("Đã lưu mốc chăm sóc nhưng có ảnh chưa tải được: " + imageError)
      else setNotice(selectedImages.length ? `Đã lưu mốc chăm sóc và ${selectedImages.length} ảnh.` : "Đã lưu mốc chăm sóc vào PostgreSQL và tạo thông báo cho khách.")
    })
  }
  async function retryMilestoneImages(code:string){
    const retry=milestoneImageRetries[code],files=milestoneImages[code]||[]
    if(!retry||!files.length)return
    await run(async()=>{
      try{
        await uploadCareEventImages(code,retry.eventId,files,token)
        setMilestoneImages(current=>({...current,[code]:[]}))
        setMilestoneImageRetries(current=>({...current,[code]:undefined}))
        await reloadTimeline(code)
        setNotice(`Đã tải lại thành công ${files.length} ảnh vào mốc chăm sóc đã lưu.`)
      }catch(uploadError){
        const failed=uploadError instanceof CareImageUploadError?uploadError.failedFiles:files
        setMilestoneImages(current=>({...current,[code]:failed}))
        setError(uploadError instanceof Error?uploadError.message:"Không tải lại được ảnh chăm sóc.")
      }
    })
  }
  async function markNoShow(code: string) {
    const booking = bookings.find((b) => b.code === code)
    if (!booking) {
      setError("Không tìm thấy lịch hẹn để xử lý.")
      return
    }
    const reason = (noShowNotes[code] || "").trim()
    if (reason.length < 8) {
      setError(
        "Vui lòng nhập lý do khách không đến ít nhất 8 ký tự ngay trong thẻ lịch.",
      )
      return
    }
    if (
      !window.confirm(
        "Ghi nhận No-show chỉ khi đã qua thời gian nhận pet (Grooming/Spa: 15 phút; Daycare: 30 phút), khách chưa đến và đã xác minh. Tiếp tục?",
      )
    )
      return
    await run(async () => {
      await api(
        "/admin/bookings/" + encodeURIComponent(code) + "/no-show",
        "POST",
        { reason },
        token,
      )
      await reload()
      setNoShowNotes((v) => ({ ...v, [code]: "" }))
      setNotice(
        "Đã đóng lịch do khách không đến. Lịch chuyển Đã hủy, yêu cầu hủy đang chờ (nếu có) được xử lý và khách được thông báo.",
      )
    })
  }
  function bookAgain(b: Booking) {
    if (!b.petId || !pets.some((p) => p.id === Number(b.petId))) {
      setError(
        "Hồ sơ thú cưng cũ không còn trong danh sách hiện tại. Hãy vào trang Đặt lịch và chọn lại thú cưng để tiếp tục.",
      )
      onGo("booking")
      return
    }
    sessionStorage.setItem(
      "petday_rebook_draft",
      JSON.stringify({
        petId: Number(b.petId),
        service: b.service,
        branch: b.branch,
      }),
    )
    setPetId(Number(b.petId))
    setService(b.service)
    setBranch(b.branch)
    // Always recheck future availability, quote, discounts and method; never copy the old payment status.
    setDate(tomorrow())
    setSlot("08:00")
    setStep(2)
    setSelectedAddOns([])
    setPromoCode("")
    setPromoPreview(null)
    setPaymentMethod("cash")
    setPrepaymentChoice("deposit")
    setTaxiEnabled(false)
    setTaxiAddress("")
    setTaxiPhone("")
    setAvailability(null)
    onGo("booking")
  }
  // Book another service for the same pet as a separate appointment.
  // Use the full existing booking wizard so capacity, price and payment are independently verified.
  function bookAdditionalService(b: Booking) {
    // Start a fresh booking rather than copying the date or service of an old appointment.
    const selectedId = Number(b.petId || 0)
    const validPet = pets.find((p) => p.id === selectedId)
    sessionStorage.removeItem("petday_payment_focus_booking")
    sessionStorage.removeItem("petday_additional_service_draft")
    setPetId(validPet?.id || 0)
    setStep(validPet ? 2 : 1)
    setServiceCategory("Grooming")
    setService("")
    setBranch(b.branch || "PetDay Thảo Điền")
    setDate(tomorrow())
    setSlot("08:00")
    setBookingNote("")
    setSelectedAddOns([])
    setRetailChosen([])
    setPromoCode("")
    setPromoPreview(null)
    setPaymentMethod("bank_transfer")
    setPrepaymentChoice("full")
    setTaxiEnabled(false)
    setTaxiAddress("")
    setTaxiPhone("")
    setAvailability(null)
    setQuote(null)
    onGo("booking")
  }
  async function loadClosures() {
    await run(async () => {
      setClosures(await api("/admin/blocked-slots", "GET", undefined, token))
    })
  }
  async function saveClosure() {
    await run(async () => {
      await api("/admin/blocked-slots", "POST", closureDraft, token)
      setClosureDraft((x) => ({ ...x, reason: "" }))
      setClosures(await api("/admin/blocked-slots", "GET", undefined, token))
      setNotice(
        "Đã khóa khung giờ trống. Khách sẽ không thể tạo lịch mới vào giờ này.",
      )
    })
  }
  async function deleteClosure(id: number) {
    await run(async () => {
      await api("/admin/blocked-slots/" + id, "DELETE", undefined, token)
      setClosures(await api("/admin/blocked-slots", "GET", undefined, token))
      setNotice("Đã mở lại khung giờ.")
    })
  }
  async function loadQueue() {
    setQueueLoading(true)
    setError("")
    try {
      const query = new URLSearchParams({
        status: queueStatus,
        ...(queueDate ? { date: queueDate } : {}),
      })
      setQueueRows(await api("/admin/queue?" + query, "GET", undefined, token))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được hàng đợi.")
    } finally {
      setQueueLoading(false)
    }
  }
  async function loadConsultations() {
    await run(async () => {
      setConsultations(
        await api("/admin/consultations", "GET", undefined, token),
      )
    })
  }
  async function adminCancelBooking(b: Booking) {
    const cancellationOrigin = adminCancelOrigin[b.code] || "customer_assisted"
    const cancellationReason = (adminCancelReason[b.code] || "").trim()
    if (cancellationReason.length < 10) {
      setError("Vui lòng ghi rõ lý do hủy ít nhất 10 ký tự.")
      return
    }
    const exceptionRefundAmount = undefined // V6.120: no manual refund override on ordinary cancellation.
    const policy = cancellationPreview(
      b.date,
      b.slot,
      Number(b.total || 0),
      Number(b.collectedPaid || 0),
      reschedules.some(
        (r) =>
          r.bookingCode === b.code &&
          r.status === "approved" &&
          Number(r.requestedBy) === Number(r.customerId),
      ),
      Number(b.collectedPaid || 0) > 0 &&
        Number(b.collectedPaid || 0) < Number(b.total || 0),
    )
    const caption =
      cancellationOrigin === "provider_unavailable"
        ? "PetDay chủ động hủy: hoàn dự kiến 100% khoản đã thu."
        : "Admin hủy hộ khách: áp dụng quy định hủy/hoàn đã cập nhật (" +
          policy.label +
          ")."
    if (!window.confirm(caption + " Tiếp tục hủy lịch " + b.code + "?")) return
    await update(
      "/bookings/" + encodeURIComponent(b.code) + "/status",
      "PATCH",
      {
        status: "Đã hủy",
        cancellationOrigin,
        cancellationReason,
        ...(exceptionRefundAmount !== undefined
          ? { exceptionRefundAmount }
          : {}),
      },
    )
  }
  async function update(path: string, method: string, data?: object) {
    await run(async () => {
      await api(path, method, data, token)
      await reload()
      setNotice("Đã cập nhật thông tin thành công.")
    })
  }
  useEffect(() => {
    const focus = () => {
      const target = sessionStorage.getItem("petday_focus_section")
      if (!target) return
      if (view === "admin" && user?.role === "admin") {
        const map: Record<string, typeof adminTab> = {
          "admin-bookings": "appointments",
          "admin-reschedules": "appointments",
          "admin-consultations": "support",
          "admin-refunds": "appointments",
          "admin-overview-kpis": "today",
        }
        if (map[target]) {
          setAdminTab(map[target])
          sessionStorage.removeItem("petday_focus_section")
          return
        }
      }
      if (view === "appointments" && user?.role === "customer") {
        const tabs: Record<string, typeof customerTab> = {
          "appointments-list": "schedule",
          "customer-payments": "schedule",
          "customer-refunds": "schedule",
          "customer-reviews": "reviews",
        }
        if (tabs[target]) {
          setCustomerTab(tabs[target])
          sessionStorage.removeItem("petday_focus_section")
          window.scrollTo({ top: 160, behavior: "smooth" })
          return
        }
      }
      const element = document.getElementById(target)
      if (element) {
        sessionStorage.removeItem("petday_focus_section")
        setTimeout(
          () => element.scrollIntoView({ behavior: "smooth", block: "start" }),
          80,
        )
      }
    }
    const id = setTimeout(focus, 180)
    window.addEventListener("petday:focus", focus)
    return () => {
      clearTimeout(id)
      window.removeEventListener("petday:focus", focus)
    }
  }, [view, user, bookings, consultations, reschedules])
  const daycareMaxEndDate = (() => { const d = new Date(date + "T00:00:00Z"); if (!Number.isFinite(d.getTime())) return date; d.setUTCDate(d.getUTCDate() + 6); return d.toISOString().slice(0, 10) })()
  const todayLocal = new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Ho_Chi_Minh",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())
  const bookingStats = {
    today: bookings.filter(b=>b.date===todayLocal).length,
    confirmed: bookings.filter(b=>matchesBookingGroup(b,"confirmed")).length,
    active: bookings.filter(b=>matchesBookingGroup(b,"active")).length,
    done: bookings.filter(b=>matchesBookingGroup(b,"done")).length,
  }
  const visibleBookings = bookings
    .filter((b) => {
      const q = bookingSearch.trim().toLocaleLowerCase("vi-VN")
      const matches =
        !q ||
        [b.code, b.petName, b.ownerName, b.service, b.branch].some((x) =>
          String(x || "")
            .toLocaleLowerCase("vi-VN")
            .includes(q),
        )
      const matchesStatus = bookingFilter === "refund"
        ? refunds.some(r=>r.code===b.code && Number(r.amount)>0)
        : matchesBookingGroup(b,bookingFilter)
      return (
        matches &&
        matchesStatus &&
        matchesBookingPeriod(b,bookingPeriod,todayLocal) &&
        (view !== "appointments" ||
          bookingPetFilter === "all" ||
          String(b.petId) === bookingPetFilter) &&
        matchesBookingFilters(b, {
          branch: filterBranch,
          start: filterStart,
          end: filterEnd,
        })
      )
    })
    .sort((a, b) => {
      // Customer bookings are ordered by the original booking creation time, NOT appointment date.
      // Rescheduling changes the appointment date without changing createdAt.
      if (
        bookingOrder === "created-newest" ||
        bookingOrder === "created-oldest"
      ) {
        const created = (x: Booking) => {
          const parsed = Date.parse(String(x.createdAt || ""))
          return Number.isFinite(parsed) ? parsed : 0
        }
        const delta =
          bookingOrder === "created-newest"
            ? created(b) - created(a)
            : created(a) - created(b)
        return delta || String(b.code).localeCompare(String(a.code))
      }
      if (bookingOrder === "priority")
        return compareDisplayBookings(
          a,
          b,
          view === "admin" ? "admin" : "customer",
        )
      const time = (x: Booking) => `${x.date || ""}T${x.slot || "00:00"}`
      const byTime =
        bookingOrder === "newest"
          ? time(b).localeCompare(time(a))
          : time(a).localeCompare(time(b))
      return byTime || String(a.code).localeCompare(String(b.code))
    })
  const selectedPet = pets.find((p) => p.id === petId)
  const recommendedServices = suggestServiceNames(selectedPet)
  const currentPackage = servicePackages.find((x) => x.name === service)
  const base = liveServicePrices[service] ?? currentPackage?.price ?? 0
  const extra =
    currentPackage?.category === "Daycare" || !selectedPet
      ? 0
      : selectedPet.weight <= 5
        ? 0
        : selectedPet.weight <= 10
          ? 50000
          : selectedPet.weight <= 20
            ? 100000
            : 160000
  const estimate = base + extra
  const careSubtotal = Array.isArray(quote?.lines)
    ? quote.lines.reduce((total: number, line: any) => {
        const amount = Number(line?.amount || 0)
        return amount > 0 &&
          !["taxi", "retail", "first_use_deposit", "schedule"].includes(
            line?.type,
          )
          ? total + amount
          : total
      }, 0)
    : 0
  const depositPreview = requiresPrepayment
    ? Math.ceil(
        Math.max(
          0,
          (careSubtotal || Number(quote?.depositRequired || 0) * 5) -
            Number(promoPreview?.discount || 0),
        ) / 5,
      )
    : 0
  const card = "rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
  // Keep action visibility aligned with server business rules; the API remains authoritative.
  const appointmentStartMs = (b: Booking) =>
    Date.parse(
      String(b.date).slice(0, 10) +
        "T" +
        String(b.slot || "08:00").slice(0, 5) +
        ":00+07:00",
    )
  const beforeAppointment = (b: Booking) =>
    Number.isFinite(appointmentStartMs(b)) && appointmentStartMs(b) > Date.now()
  // Taxi is an add-on and never affects booking reschedule eligibility.
  const rescheduleUnavailable = (b: Booking) =>
    !["Đang chờ xác nhận", "Đã xác nhận"].includes(b.status) ||
    !Number.isFinite(appointmentStartMs(b)) ||
    b.careCompleted ||
    b.petHandedOver ||
    reschedules.some(
      (r) => r.bookingCode === b.code && r.status === "pending",
    ) ||
    cancellations.some(
      (r) => r.bookingCode === b.code && r.status === "pending",
    )
  const canAdminPropose = (b: Booking) =>
    b.status === "Đã xác nhận" && !rescheduleUnavailable(b)
  const canCustomerReschedule = (b: Booking) =>
    !rescheduleUnavailable(b) &&
    beforeAppointment(b) &&
    b.status === "Đã xác nhận" &&
    !reschedules.some(
      (r) =>
        r.bookingCode === b.code &&
        r.status === "approved" &&
        (Number(r.requestedBy) === Number(user?.id) ||
          String(r.reason || "").startsWith("Khách yêu cầu:")),
    )
  const canCustomerCancelRequest = (b: Booking) =>
    ["Đang chờ xác nhận", "Đã xác nhận"].includes(b.status) &&
    appointmentStartMs(b) - Date.now() > 3600000 &&
    !b.careCompleted &&
    !b.petHandedOver &&
    !cancellations.some(
      (r) => r.bookingCode === b.code && r.status === "pending",
    )
  const canAdminCancel = (b: Booking) =>
    ["Đang chờ xác nhận", "Đã xác nhận"].includes(b.status) &&
    !b.careCompleted &&
    !b.petHandedOver &&
    !cancellations.some(
      (r) => r.bookingCode === b.code && r.status === "pending",
    )
  const focusBookingAction = (
    code: string,
    action: "reschedule" | "cancel",
  ) => {
    setCustomerTab("schedule")
    const booking = bookings.find((item) => item.code === code)
    if (action === "reschedule" && booking) {
      setNewSlots((current) =>
        current[code]
          ? current
          : { ...current, [code]: booking.slot.slice(0, 5) },
      )
    }
    setFocusedBookingAction({ code, action })
  }
  const actionBooking = focusedBookingAction
    ? bookings.find((item) => item.code === focusedBookingAction.code) || null
    : null
  const actionStartRemaining = actionBooking
    ? appointmentStartMs(actionBooking) - Date.now()
    : 0
  const actionAssisted = actionStartRemaining <= 3600000
  const actionLimited = actionStartRemaining <= 3 * 3600000
  const actionMaxDate = actionBooking
    ? actionLimited
      ? new Date(
          Date.parse(actionBooking.date.slice(0, 10) + "T00:00:00Z") + 86400000,
        )
          .toISOString()
          .slice(0, 10)
      : new Date(Date.now() + 7 * 86400000 + 7 * 3600000)
          .toISOString()
          .slice(0, 10)
    : todayLocal
  const actionWasCustomerRescheduled = actionBooking
    ? reschedules.some(
        (item) =>
          item.bookingCode === actionBooking.code &&
          item.status === "approved" &&
          Number(item.requestedBy) === Number(item.customerId),
      )
    : false
  const actionCancellationPolicy = actionBooking
    ? cancellationPreview(
        actionBooking.date,
        actionBooking.slot,
        Number(actionBooking.total || 0),
        Number(actionBooking.collectedPaid || 0),
        actionWasCustomerRescheduled,
        Number(actionBooking.collectedPaid || 0) > 0 &&
          Number(actionBooking.collectedPaid || 0) <
            Number(actionBooking.total || 0),
      )
    : null
  const actionNewDate = actionBooking
    ? newDates[actionBooking.code] || ""
    : ""
  const actionNewSlot = actionBooking
    ? newSlots[actionBooking.code] || actionBooking.slot.slice(0, 5)
    : "08:00"
  const actionNewTimeInPast = Boolean(
    actionNewDate &&
      Date.parse(actionNewDate + "T" + actionNewSlot + ":00+07:00") <=
        Date.now(),
  )

  return (
    <main className="min-h-[65vh] bg-[#F5F8FD] py-10">
      {completionDialog && <CareCompletionDialog quote={completionDialog} busy={busy} onChoice={choice=>setCompletionDialog(prev=>prev?{...prev,choice}:null)} onCancel={()=>setCompletionDialog(null)} onConfirm={()=>{
        const q=completionDialog
        if(q.outstanding>0&&!q.choice)return
        setCompletionDialog(null)
        void postMilestone(q.code,"check_out",{received:q.choice==="received",outstanding:q.outstanding})
      }}/>}
      <div
        className={
          "container-pd max-w-6xl space-y-6 " +
          (view === "admin" && user?.role === "admin"
            ? "petday-admin-mode"
            : "")
        }
        data-admin-tab={adminTab}
        data-customer-tab={customerTab}
        data-view={view}
      >
        {loading ? (
          <div className="py-14 text-center text-slate-600">
            Đang tải tài khoản...
          </div>
        ) : !user ? (
          <div className="petday-auth-card mx-auto max-w-lg rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-widest text-[#FF765E]">
              Tài khoản PetDay
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-[#142B55]">
              {authMode === "login"
                ? "Chào mừng trở lại"
                : authMode === "register"
                  ? "Tạo tài khoản"
                  : authMode === "forgot"
                    ? "Lấy lại mật khẩu"
                    : "Đặt lại mật khẩu"}
            </h1>
            <p className="my-5 text-slate-500">
              {view === "booking"
                ? "Đăng nhập để đặt lịch và lưu lịch sử chăm sóc thú cưng."
                : "Quản lý thú cưng và lịch hẹn an toàn trong một tài khoản."}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                submitAuth()
              }}
              className="space-y-4"
            >
              {authMode === "register" && (
                <label className="block text-sm font-semibold">
                  Họ và tên
                  <input
                    required
                    minLength={2}
                    className={C + " mt-2"}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </label>
              )}
              <label
                className={
                  "block text-sm font-semibold " +
                  (authMode === "reset" ? "hidden" : "")
                }
              >
                {authMode === "login" ? "Email hoặc số điện thoại" : "Email"}
                <input
                  required={authMode !== "reset"}
                  type={authMode === "login" ? "text" : "email"}
                  autoComplete={authMode === "login" ? "username" : "email"}
                  className={C + " mt-2"}
                  value={authMode === "login" ? loginIdentifier : email}
                  onChange={(e) =>
                    authMode === "login"
                      ? setLoginIdentifier(e.target.value)
                      : setEmail(e.target.value)
                  }
                  placeholder={
                    authMode === "login" ? "Email hoặc 0xxxxxxxxx" : ""
                  }
                />
              </label>
              {authMode === "register" && (
                <label className="block text-sm font-semibold">
                  Số điện thoại liên hệ *
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    maxLength={24}
                    className={C + " mt-2"}
                    value={registrationPhone}
                    onChange={(e) => setRegistrationPhone(e.target.value)}
                    placeholder="09xxxxxxxx hoặc +849xxxxxxxx"
                  />
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    Dùng để liên hệ và đăng nhập bằng mật khẩu. OTP xác minh
                    chưa được kích hoạt trong bản này.
                  </span>
                </label>
              )}
              <label
                className={
                  "block text-sm font-semibold " +
                  (authMode === "forgot" ? "hidden" : "")
                }
              >
                {authMode === "reset" ? "Mật khẩu mới" : "Mật khẩu"}
                <input
                  required={authMode !== "forgot"}
                  minLength={
                    authMode === "register" || authMode === "reset" ? 8 : 1
                  }
                  type="password"
                  className={C + " mt-2"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              {authMode === "reset" && (
                <label className="block text-sm font-semibold">
                  Nhập lại mật khẩu mới
                  <input
                    type="password"
                    className={C + " mt-2"}
                    minLength={8}
                    value={resetConfirm}
                    onChange={(e) => setResetConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <span className="mt-1 block text-xs text-slate-500">
                    Liên kết dùng một lần, có hiệu lực tối đa 30 phút.
                  </span>
                </label>
              )}
              <button
                type="submit"
                className={B + " w-full"}
                disabled={
                  busy ||
                  (authMode === "reset" &&
                    (!resetConfirm || resetConfirm !== password))
                }
              >
                {busy
                  ? "Đang xử lý..."
                  : authMode === "login"
                    ? "Đăng nhập"
                    : authMode === "register"
                      ? "Đăng ký"
                      : authMode === "forgot"
                        ? "Gửi hướng dẫn qua email"
                        : "Đổi mật khẩu"}
              </button>
            </form>
            {authMode === "forgot" && (
              <div className="mt-5 rounded-2xl border border-[#DDE9F8] bg-[#F2F7FC] p-4 text-sm text-[#142B55]">
                <strong>Khôi phục tài khoản qua email</strong>
                <p className="mt-2 text-slate-600">
                  1. Nhập email đã đăng ký PetDay.
                </p>
                <p className="mt-1 text-slate-600">
                  2. Mở thư PetDay và nhấn liên kết trong vòng 30 phút.
                </p>
                <p className="mt-1 text-slate-600">
                  3. Tạo mật khẩu mới, sau đó đăng nhập lại.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Không nhận được thư? Kiểm tra mục Spam hoặc liên hệ hỗ trợ.
                  Chỉ gửi email khi máy chủ được cấu hình SMTP hợp lệ. Nếu hiện
                  HTTP 503, kiểm tra /api/health/features và
                  server/.env.example.
                </p>
              </div>
            )}
            <button
              className="mt-4 text-sm font-semibold text-[#142B55] underline"
              onClick={() => {
                setError("")
                setResetConfirm("")
                setPassword("")
                setAuthMode(authMode === "login" ? "register" : "login")
              }}
            >
              {authMode === "login"
                ? "Chưa có tài khoản? Đăng ký ngay"
                : "Trở về đăng nhập"}
            </button>
            {authMode === "login" && (
              <button
                type="button"
                className="ml-4 text-sm font-semibold text-[#142B55] underline"
                onClick={() => {
                  setAuthMode("forgot")
                  setError("")
                }}
              >
                Quên mật khẩu?
              </button>
            )}
            {authMode === "forgot" && (
              <p className="mt-3 text-xs text-slate-500">
                Cần cấu hình máy chủ email SMTP để hệ thống gửi liên kết đặt
                lại. Không hiển thị mã bí mật trên màn hình.
              </p>
            )}
          </div>
        ) : (
          <>
            {view !== "shop" && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[#142B55] px-7 py-6 text-white">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#FFB19D]">
                    PETDAY CARE
                  </p>
                  <h1 className="mt-1 text-2xl font-extrabold">
                    {view === "booking"
                      ? "Đặt lịch chăm sóc"
                      : view === "appointments"
                        ? "Lịch hẹn của tôi"
                        : view === "admin"
                          ? "Trung tâm quản lý PetDay"
                          : view === "shop"
                            ? "Cửa hàng PetDay"
                            : "Tài khoản của tôi"}
                  </h1>
                  <p className="mt-1 text-sm text-white/70">
                    Xin chào, {user.fullName}
                  </p>
                </div>
              </div>
            )}
            {view === "account" && user.role === "customer" && (
              <nav
                aria-label="Mục tài khoản"
                className="flex flex-wrap gap-2 rounded-2xl border border-[#DDE9F8] bg-white p-3 shadow-sm"
              >
                {[
                  ["Hồ sơ", "account-profile"],
                  ["Thú cưng", "account-pets"],
                  ["Bảo mật", "account-settings"],
                  ["Thông báo", "account-notifications"],
                  ["Hỗ trợ", "customer-consultations"],
                ].map(([label, id]) => (
                  <button
                    type="button"
                    key={id}
                    className="rounded-xl border border-[#E0E8F2] px-4 py-2 text-sm font-semibold text-[#142B55] hover:bg-[#EFF5FF]"
                    onClick={() =>
                      document
                        .getElementById(id)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                  >
                    {label}
                  </button>
                ))}
              </nav>
            )}
            {view === "account" && user.role === "customer" && (
              <section
                aria-label="Điều hướng tài khoản"
                className="petday-customer-shortcuts grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              >
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("account-pets")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="rounded-2xl border border-[#DDE9F6] bg-white p-5 text-left shadow-sm transition hover:border-[#FF765E]"
                >
                  <span className="text-2xl">🐾</span>
                  <strong className="mt-2 block text-[#142B55]">
                    Thú cưng của tôi
                  </strong>
                  <span className="mt-1 block text-xs text-slate-500">
                    {pets.length} hồ sơ · Quản lý thông tin
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onGo("booking")}
                  className="rounded-2xl bg-[#142B55] p-5 text-left text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#203D71]"
                >
                  <span className="text-2xl">✦</span>
                  <strong className="mt-2 block">Đặt lịch chăm sóc</strong>
                  <span className="mt-1 block text-xs text-white/75">
                    Chọn dịch vụ & khung giờ →
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onGo("appointments")}
                  className="rounded-2xl border border-[#F6D8D1] bg-[#FFF5F2] p-5 text-left shadow-sm transition hover:border-[#FF765E]"
                >
                  <span className="text-2xl">▣</span>
                  <strong className="mt-2 block text-[#142B55]">
                    Theo dõi lịch hẹn
                  </strong>
                  <span className="mt-1 block text-xs text-slate-600">
                    {bookings.length} lịch · Thanh toán & đánh giá
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onGo("shop")}
                  className="rounded-2xl border border-[#DDE9F6] bg-white p-5 text-left shadow-sm transition hover:border-[#FF765E]"
                >
                  <span className="text-2xl">🛍️</span>
                  <strong className="mt-2 block text-[#142B55]">
                    Cửa hàng thú cưng
                  </strong>
                  <span className="mt-1 block text-xs text-slate-500">
                    Mua hàng độc lập · nhận hoặc giao tận nơi
                  </span>
                </button>
              </section>
            )}
            {view === "admin" && user.role === "customer" ? (
              <section className={card}>
                <h2 className="text-xl font-bold">Không có quyền truy cập</h2>
                <p className="mt-2 text-slate-500">
                  Chỉ quản trị viên có quyền quản lý lịch hẹn. Tài khoản khách
                  hàng không thể sử dụng trang này.
                </p>
                <button className={B + " mt-4"} onClick={() => onGo("account")}>
                  Về tài khoản
                </button>
              </section>
            ) : view === "account" && user.role === "staff" ? (
              <section className={card}>
                <h2 className="text-xl font-bold">Khu vực nhân viên</h2>
                <p className="my-3 text-slate-500">
                  Xem lịch được phân công và cập nhật chăm sóc tại nơi làm việc.
                </p>
                <button className={B} onClick={() => onGo("admin")}>
                  Mở lịch làm việc →
                </button>
              </section>
            ) : view === "account" && user.role === "admin" ? (
              <section className={card}>
                <h2 className="text-2xl font-bold text-[#142B55]">
                  Tài khoản quản trị
                </h2>
                <p className="my-3 text-slate-600">
                  Quản lý lịch hẹn, nhân viên, đơn hàng và hoạt động PetDay tại
                  một nơi.
                </p>
                <button className={B} onClick={() => onGo("admin")}>
                  Mở trang quản trị →
                </button>
              </section>
            ) : view === "account" ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <section
                  id="account-profile"
                  className={card + " scroll-mt-32"}
                >
                  <h2 className="mb-4 text-xl font-extrabold text-[#142B55]">
                    Hồ sơ của bạn
                  </h2>
                  <p>
                    <strong>Họ tên:</strong> {user.fullName}
                  </p>
                  <p className="mt-2">
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p className="mt-2">
                    <strong>Vai trò:</strong>{" "}
                    {user.role === "admin" ? "Quản trị viên" : "Khách hàng"}
                  </p>
                  <div className="mt-5 space-y-3 rounded-2xl border border-[#DDE9F8] bg-[#F7FAFF] p-4">
                    <h3 className="font-extrabold text-[#142B55]">
                      Thông tin liên hệ & địa chỉ mặc định
                    </h3>
                    <label className="block text-sm font-semibold">
                      Họ tên
                      <input
                        className={C + " mt-1"}
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        maxLength={120}
                      />
                    </label>
                    <label className="block text-sm font-semibold">
                      Số điện thoại liên hệ
                      <input
                        className={C + " mt-1"}
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="09xxxxxxxx"
                        maxLength={20}
                      />
                    </label>
                    <label className="block text-sm font-semibold">
                      Địa chỉ mặc định
                      <textarea
                        className={C + " mt-1"}
                        rows={2}
                        value={defaultAddress}
                        onChange={(e) => setDefaultAddress(e.target.value)}
                        maxLength={250}
                        placeholder="Số nhà, đường, phường/xã, TP.HCM"
                      />
                    </label>
                    <label className="block text-sm font-semibold">
                      Khu vực giao hàng mặc định
                      <select
                        className={C + " mt-1"}
                        value={defaultDeliveryZone}
                        onChange={(e) =>
                          setDefaultDeliveryZone(
                            e.target.value as "inner_hcm" | "outer_hcm",
                          )
                        }
                      >
                        <option value="inner_hcm">TP.HCM nội thành</option>
                        <option value="outer_hcm">Ngoại thành / khu xa</option>
                      </select>
                    </label>
                    <p className="text-xs text-slate-500">
                      Địa chỉ được gợi ý khi giao hàng hoặc đặt Pet Taxi. Bạn
                      luôn có thể sửa riêng cho từng lần đặt; đơn cũ không thay
                      đổi.
                    </p>
                    <button
                      type="button"
                      className={B}
                      disabled={
                        busy ||
                        !profileName.trim() ||
                        (defaultAddress.trim().length > 0 &&
                          defaultAddress.trim().length < 12)
                      }
                      onClick={saveProfile}
                    >
                      Lưu hồ sơ & địa chỉ
                    </button>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button className={B} onClick={() => onGo("appointments")}>
                      Xem lịch hẹn
                    </button>
                    {user.role === "admin" && (
                      <button className={B} onClick={() => onGo("admin")}>
                        Quản trị
                      </button>
                    )}
                  </div>
                </section>
                <section id="account-pets" className={card + " scroll-mt-32"}>
                  <h2 className="mb-3 text-xl font-extrabold text-[#142B55]">
                    Thú cưng của tôi
                  </h2>
                  <div className="space-y-3">
                    {pets.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-4 rounded-2xl border border-[#DDE9F8] bg-[#F2F7FC] p-3"
                      >
                        <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#DCEEFF] text-4xl">
                          <span aria-hidden="true">
                            {p.species === "Mèo" ? "🐱" : "🐶"}
                          </span>
                          {p.photoUrl && (
                            <img
                              src={backendAssetUrl(p.photoUrl)}
                              alt={"Ảnh " + p.name}
                              className="absolute inset-0 h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                              onLoad={(e) => {
                                e.currentTarget.style.display = "block"
                              }}
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-extrabold text-[#142B55]">
                            {p.name} ♡
                          </div>
                          <div className="text-sm text-slate-600">
                            {p.species} · {p.breed || "Chưa xác định giống"} ·{" "}
                            {p.gender || "Chưa xác định giới tính"}
                          </div>
                          <div className="text-sm text-slate-600">
                            {p.age} tuổi · {p.weight} kg ·{" "}
                            {p.coat || "Chưa xác định lông"}
                          </div>
                          {p.notes && (
                            <p className="mt-1 text-xs text-slate-500">
                              Lưu ý: {p.notes}
                            </p>
                          )}
                          <details className="mt-2 rounded-xl bg-white p-2 text-xs">
                            <summary className="cursor-pointer font-semibold text-[#142B55]">
                              Lịch sử lịch hẹn / chăm sóc (
                              {bookings.filter((b) => b.petId === p.id).length})
                            </summary>
                            <div className="mt-2 max-h-36 space-y-2 overflow-y-auto">
                              {bookings
                                .filter((b) => b.petId === p.id)
                                .map((b) => (
                                  <p
                                    key={b.code}
                                    className="border-b pb-2 text-slate-600"
                                  >
                                    <strong>{b.service}</strong> · {b.date} ·{" "}
                                    {b.status}
                                    <span className="block">{b.branch}</span>
                                  </p>
                                ))}
                              {!bookings.some((b) => b.petId === p.id) && (
                                <p className="text-slate-500">
                                  Chưa có lần chăm sóc nào.
                                </p>
                              )}
                            </div>
                          </details>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            className="rounded-xl border border-[#142B55] px-3 py-2 text-xs font-bold text-[#142B55]"
                            onClick={() => editPet(p)}
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            className="rounded-xl border border-[#FF765E]/50 px-3 py-2 text-xs font-semibold text-[#B54837] disabled:opacity-40"
                            onClick={() => deletePet(p)}
                          >
                            {bookings.some((b) => b.petId === p.id)
                              ? "Lưu trữ hồ sơ"
                              : "Xóa hồ sơ"}
                          </button>
                        </div>
                      </div>
                    ))}
                    {!pets.length && (
                      <p className="text-slate-500">Chưa có hồ sơ thú cưng.</p>
                    )}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      addPet()
                    }}
                    className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
                  >
                    <h3 className="col-span-2 text-lg font-bold text-[#142B55]">
                      {editingPet ? "Chỉnh sửa hồ sơ" : "Thêm thú cưng mới"}
                    </h3>
                    <label className="text-sm font-medium">
                      Tên thú cưng
                      <input
                        required
                        className={C + " mt-1"}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Loài
                      <select
                        className={C + " mt-1"}
                        value={species}
                        onChange={(e) => setSpecies(e.target.value)}
                      >
                        <option>Chó</option>
                        <option>Mèo</option>
                      </select>
                    </label>
                    <label className="text-sm font-medium">
                      Giới tính
                      <select
                        className={C + " mt-1"}
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      >
                        <option>Chưa xác định</option>
                        <option>Đực</option>
                        <option>Cái</option>
                      </select>
                    </label>
                    <label className="text-sm font-medium">
                      Giống
                      <input
                        className={C + " mt-1"}
                        value={breed}
                        onChange={(e) => setBreed(e.target.value)}
                        placeholder="Ví dụ: Poodle"
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Đặc điểm lông
                      <select
                        className={C + " mt-1"}
                        value={coat}
                        onChange={(e) => setCoat(e.target.value)}
                      >
                        <option>Chưa xác định</option>
                        <option>Lông ngắn</option>
                        <option>Lông dài</option>
                        <option>Lông xoăn</option>
                        <option>Lông kép</option>
                        <option>Lông thưa / ít lông</option>
                        <option>Không lông</option>
                      </select>
                    </label>
                    <label className="text-sm font-medium">
                      Tuổi (năm)
                      <input
                        required
                        type="number"
                        min="0"
                        max="40"
                        step="0.5"
                        className={C + " mt-1"}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Cân nặng (kg)
                      <input
                        required
                        type="number"
                        min="0.1"
                        max="80"
                        step="0.1"
                        className={C + " mt-1"}
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Lưu ý chăm sóc
                      <input
                        className={C + " mt-1"}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </label>
                    <div className="rounded-2xl border border-[#DDE9F8] bg-[#EDF5FC] p-4 sm:col-span-2">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#DCEEFF] text-4xl">
                          <span aria-hidden="true">
                            {species === "Mèo" ? "🐱" : "🐶"}
                          </span>
                          {photoUrl && (
                            <img
                              src={backendAssetUrl(photoUrl)}
                              alt="Xem trước ảnh thú cưng"
                              className="absolute inset-0 h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                              onLoad={(e) => {
                                e.currentTarget.style.display = "block"
                              }}
                            />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="font-bold text-[#142B55]">
                            Ảnh đại diện thú cưng
                          </p>
                          <p className="text-xs text-slate-500">
                            JPG, PNG hoặc WebP · tối đa 5 MB
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <label className="cursor-pointer rounded-xl bg-[#142B55] px-4 py-2 text-sm font-bold text-white">
                              {uploading
                                ? "Đang tải ảnh..."
                                : photoUrl
                                  ? "Đổi ảnh"
                                  : "Tải ảnh lên"}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                disabled={uploading}
                                className="sr-only"
                                onChange={(e) => {
                                  const f = e.target.files?.[0]
                                  if (f) uploadPhoto(f)
                                  e.target.value = ""
                                }}
                              />
                            </label>
                            {photoUrl && (
                              <button
                                type="button"
                                className="rounded-xl border border-[#142B55]/30 bg-white px-4 py-2 text-sm"
                                onClick={() => setPhotoUrl("")}
                              >
                                Xóa ảnh khỏi hồ sơ
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Sau khi chọn ảnh, nhấn{" "}
                        {editingPet ? "“Lưu thay đổi”" : "“Thêm thú cưng”"} để
                        gắn ảnh vào hồ sơ.
                      </p>
                    </div>
                    <button disabled={busy} className={B + " sm:col-span-2"}>
                      {editingPet ? "Lưu thay đổi" : "Thêm thú cưng"}
                    </button>
                    {editingPet && (
                      <button
                        type="button"
                        onClick={clearPetForm}
                        className="rounded-xl border px-4 py-3 sm:col-span-2"
                      >
                        Hủy chỉnh sửa
                      </button>
                    )}
                  </form>
                </section>
              </div>
            ) : view === "booking" ? (
              <section className={card}>
                <div className="mb-7 grid grid-cols-4 gap-2">
                  {["Thú cưng", "Dịch vụ", "Lịch hẹn", "Xác nhận tự động"].map(
                    (s, i) => (
                      <div
                        key={s}
                        className={
                          "rounded-xl px-2 py-3 text-center text-xs font-bold sm:text-sm " +
                          (step === i + 1
                            ? "bg-[#142B55] text-white"
                            : "bg-[#EDF5FC] text-[#142B55]")
                        }
                      >
                        {i + 1}. {s}
                      </div>
                    ),
                  )}
                </div>
                {step === 1 ? (
                  <div className="max-w-xl space-y-4">
                    <h2 className="text-2xl font-extrabold text-[#142B55]">
                      Chọn thú cưng
                    </h2>
                    {!pets.length ? (
                      <>
                        <p>Để đặt lịch, hãy tạo hồ sơ thú cưng trước.</p>
                        <button className={B} onClick={() => onGo("account")}>
                          Tạo hồ sơ thú cưng
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-slate-500">
                          Chọn người bạn bốn chân sẽ sử dụng dịch vụ. Giá và
                          dịch vụ phù hợp sẽ được tính theo hồ sơ đã lưu.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {pets.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              aria-pressed={petId === p.id}
                              onClick={() => setPetId(p.id)}
                              className={
                                "flex min-h-28 items-center gap-4 rounded-2xl border-2 p-4 text-left transition " +
                                (petId === p.id
                                  ? "border-[#FF765E] bg-[#FFF5F1] shadow-sm"
                                  : "border-[#DDE9F8] bg-white hover:border-[#8BAAD0]")
                              }
                            >
                              <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#DCEEFF] text-3xl">
                                <span
                                  aria-hidden="true"
                                  className="absolute text-4xl"
                                >
                                  {p.species === "Mèo" ? "🐱" : "🐶"}
                                </span>
                                {p.photoUrl && (
                                  <img
                                    src={backendAssetUrl(p.photoUrl)}
                                    alt={"Ảnh " + p.name}
                                    className="relative h-full w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none"
                                    }}
                                  />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-extrabold text-[#142B55]">
                                  {p.name} {petId === p.id ? "✓" : ""}
                                </div>
                                <div className="text-sm text-slate-600">
                                  {p.species} · {p.breed || "Chưa rõ giống"}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {p.age} tuổi · {p.weight} kg ·{" "}
                                  {p.coat || "Chưa xác định lông"}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            className="rounded-xl border border-[#142B55] px-4 py-3 font-bold text-[#142B55]"
                            onClick={() => onGo("account")}
                          >
                            + Thêm / sửa thú cưng
                          </button>
                          <button
                            className={B}
                            disabled={!petId}
                            onClick={() => setStep(2)}
                          >
                            Tiếp tục chọn dịch vụ →
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : step === 2 ? (
                  <div className="max-w-5xl space-y-5">
                    <div className="rounded-3xl bg-gradient-to-r from-[#EFF6FE] to-[#FFF3EF] p-5 sm:p-6">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#DB6B56]">
                        PetDay · Chăm sóc theo nhu cầu
                      </span>
                      <h2 className="mt-1 text-2xl font-extrabold text-[#142B55]">
                        Chọn dịch vụ chăm sóc
                      </h2>
                      <p className="mt-2 text-sm text-[#58708D]">
                        Chọn một gói chính, xem quyền lợi và điều kiện, sau đó
                        chọn thời gian phù hợp.
                      </p>
                    </div>
                    <p className="text-sm text-slate-600">
                      Chọn nhóm chăm sóc và gói phù hợp với thú cưng. Giá dự
                      kiến sẽ được kiểm tra lại khi đặt lịch.
                    </p>
                    <div
                      className="flex flex-wrap gap-2"
                      role="group"
                      aria-label="Nhóm dịch vụ"
                    >
                      {(["Grooming", "Spa", "Daycare"] as const).map(
                        (category) => (
                          <button
                            type="button"
                            key={category}
                            aria-pressed={serviceCategory === category}
                            onClick={() => {
                              setServiceCategory(category)
                              const candidate = servicePackages.find(
                                (p) =>
                                  activeServiceNames.includes(p.name) &&
                                  p.category === category &&
                                  (category !== "Daycare" ||
                                    p.name === "Daycare cả ngày") &&
                                  p.species.some(
                                    (s) => s === selectedPet?.species,
                                  ),
                              )
                              if (candidate) {
                                setService(candidate.name)
                                setCompanionService("")
                                setDaycarePickupTime("")
                                setDaycareEndDate(date)
                                setSelectedAddOns([])
                                setRetailChosen([])
                                setSlot("08:00")
                              }
                            }}
                            className={
                              "group relative flex min-w-[160px] flex-1 items-center gap-3 overflow-hidden rounded-2xl border-2 p-2.5 text-left text-sm font-extrabold transition sm:flex-none " +
                              (serviceCategory === category
                                ? "border-[#142B55] bg-[#142B55] text-white shadow-sm"
                                : "border-[#DFE8F4] bg-[#F6F9FD] text-[#142B55] hover:border-[#AABFD8]")
                            }
                          >
                            <img
                              src={
                                "/services/" + category.toLowerCase() + ".webp"
                              }
                              alt={"Hình " + category}
                              className="h-16 w-20 rounded-xl object-cover sm:h-20 sm:w-24"
                            />
                            <span className="flex flex-col">
                              <span className="text-base">{category}</span>
                              <span className="mt-1 text-[11px] font-medium opacity-75">
                                {category === "Grooming"
                                  ? "Tắm & cắt tỉa"
                                  : category === "Spa"
                                    ? "Thư giãn & dưỡng lông"
                                    : "Trông giữ ban ngày"}
                              </span>
                            </span>{" "}
                            <span className="ml-1 text-xs opacity-75">
                              (
                              {
                                servicePackages.filter(
                                  (p) =>
                                    activeServiceNames.includes(p.name) &&
                                    p.category === category &&
                                    (category !== "Daycare" ||
                                      p.name === "Daycare cả ngày"),
                                ).length
                              }
                              )
                            </span>
                          </button>
                        ),
                      )}
                    </div>
                    <div className="rounded-xl bg-[#F2F7FC] p-3 text-sm text-[#142B55]">
                      Chọn <strong>1 gói chính</strong> cho mỗi lịch. Riêng
                      Daycare được chọn thêm một gói Grooming hoặc Spa ngay
                      trong lần đặt. Các chăm sóc cộng thêm khác là tùy chọn.
                    </div>
                    {currentPackage?.category === "Daycare" && (
                      <div className="rounded-2xl border border-[#DDE9F8] bg-white p-4">
                        <label className="block text-sm font-bold text-[#142B55]">
                          Chọn thêm tối đa 1 gói Grooming hoặc Spa (tùy chọn)
                          <select
                            value={companionService}
                            onChange={(e) =>
                              setCompanionService(e.target.value)
                            }
                            className={C + " mt-2"}
                          >
                            <option value="">Không chọn thêm dịch vụ</option>
                            {servicePackages
                              .filter(
                                (x) =>
                                  activeServiceNames.includes(x.name) &&
                                  ["Grooming", "Spa"].includes(x.category) &&
                                  x.species.includes(
                                    selectedPet?.species as any,
                                  ) &&
                                  x.duration <= currentPackage.duration,
                              )
                              .map((x) => (
                                <option key={x.name} value={x.name}>
                                  {x.name} ·{" "}
                                  {money(liveServicePrices[x.name] ?? x.price)}
                                </option>
                              ))}
                          </select>
                        </label>
                        <p className="mt-2 text-xs text-slate-500">
                          Dịch vụ bổ sung thực hiện trong thời gian Daycare,
                          được tính riêng trong tổng tiền. Hệ thống kiểm tra lại
                          thời lượng và giá ở backend.
                        </p>
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {servicePackages
                        .filter(
                          (item) =>
                            activeServiceNames.includes(item.name) &&
                            item.category === serviceCategory &&
                            (serviceCategory !== "Daycare" ||
                              item.name === "Daycare cả ngày"),
                        )
                        .map((item) => (
                          <button
                            type="button"
                            key={item.name}
                            onClick={() => {
                              setService(item.name)
                              setCompanionService("")
                              setDaycarePickupTime("")
                              setDaycareEndDate(date)
                              setSelectedAddOns([])
                              setRetailChosen([])
                              setSlot("08:00")
                            }}
                            disabled={
                              !item.species.some(
                                (s) => s === selectedPet?.species,
                              )
                            }
                            aria-pressed={service === item.name}
                            className={
                              "flex h-full flex-col rounded-2xl border-2 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 " +
                              (service === item.name
                                ? "border-[#FF765E] bg-[#FFF5F1]"
                                : "border-[#DDE9F8] bg-white hover:border-[#9DB9D7]")
                            }
                          >
                            <div className="flex items-start justify-between">
                              <span className="flex items-center gap-2 text-xs font-bold text-[#4B6481]">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#FF765E]" />
                                {item.category}
                              </span>
                              <span className="text-xs text-slate-500">
                                {service === item.name
                                  ? "✓ Đã chọn"
                                  : recommendedServices.includes(item.name)
                                    ? "★ Gợi ý"
                                    : item.category}
                              </span>
                            </div>
                            <strong className="mt-2 block text-[#142B55]">
                              {item.category === "Daycare"
                                ? "Daycare linh hoạt · 40.000đ/giờ"
                                : item.name}
                            </strong>
                            <p className="mt-1 text-xs leading-5 text-slate-600">
                              {item.description}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {(serviceBenefits[item.name] || []).map(
                                (benefit) => (
                                  <span
                                    key={benefit}
                                    className="rounded-full border border-[#DEE7F3] bg-[#F6F9FE] px-2.5 py-1 text-[11px] font-medium text-[#456080]"
                                  >
                                    ✓ {benefit}
                                  </span>
                                ),
                              )}
                            </div>
                            <p className="mt-2 text-[11px] text-slate-500">
                              Phù hợp: {item.species.join(", ")}
                            </p>
                            <p className="mt-auto pt-5 text-base font-extrabold text-[#142B55]">
                              Từ{" "}
                              {money(
                                liveServicePrices[item.name] ?? item.price,
                              )}
                            </p>
                            <p className="mt-2 text-xs font-semibold text-[#142B55]">
                              {item.duration >= 240
                                ? item.duration === 480
                                  ? "Cả ngày"
                                  : "Nửa ngày"
                                : `Khoảng ${item.duration} phút`}
                            </p>
                          </button>
                        ))}
                    </div>
                    {selectedPet &&
                      currentPackage &&
                      (() => {
                        const maxWeight =
                          currentPackage.category === "Daycare" ? 30 : 40
                        const speciesMatch = currentPackage.species.some(
                          (x) => x === selectedPet.species,
                        )
                        const weightOk =
                          Number(selectedPet.weight) > 0 &&
                          Number(selectedPet.weight) <= maxWeight
                        const ageOk =
                          currentPackage.category !== "Daycare" ||
                          Number(selectedPet.age) >= 1
                        const ready = speciesMatch && weightOk && ageOk
                        return (
                          <section
                            aria-label="Điều kiện sử dụng dịch vụ"
                            className="overflow-hidden rounded-2xl border border-[#DCE7F4] bg-white shadow-sm"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7EDF5] bg-[#F7F9FC] px-4 py-4 sm:px-5">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-[#718199]">
                                  Thông tin cần biết
                                </p>
                                <h3 className="mt-1 text-lg font-extrabold text-[#142B55]">
                                  Điều kiện sử dụng
                                </h3>
                                <p className="text-sm text-[#60718A]">
                                  {currentPackage.name}
                                </p>
                              </div>
                              <span
                                className={
                                  "rounded-full px-3 py-1.5 text-xs font-bold " +
                                  (ready
                                    ? "bg-[#E7F5ED] text-[#236748]"
                                    : "bg-[#FFF0E7] text-[#AD542A]")
                                }
                              >
                                {ready
                                  ? "✓ Đủ điều kiện cơ bản"
                                  : "Cần kiểm tra lại"}
                              </span>
                            </div>
                            <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
                              <div className="rounded-xl bg-[#F5F8FC] p-3">
                                <p className="text-xs font-medium text-[#64748B]">
                                  Loài được phục vụ
                                </p>
                                <p className="mt-1 font-bold text-[#142B55]">
                                  {currentPackage.species.join(" / ")}
                                </p>
                              </div>
                              <div className="rounded-xl bg-[#F5F8FC] p-3">
                                <p className="text-xs font-medium text-[#64748B]">
                                  Cân nặng tối đa
                                </p>
                                <p className="mt-1 font-bold text-[#142B55]">
                                  {maxWeight} kg
                                </p>
                              </div>
                              <div className="rounded-xl bg-[#F5F8FC] p-3">
                                <p className="text-xs font-medium text-[#64748B]">
                                  Hồ sơ đang chọn
                                </p>
                                <p className="mt-1 font-bold text-[#142B55]">
                                  {selectedPet.species} · {selectedPet.weight}{" "}
                                  kg
                                </p>
                                <p className="text-xs text-[#60718A]">
                                  {selectedPet.age} tuổi
                                </p>
                              </div>
                            </div>
                            <div
                              className={
                                "mx-4 mb-4 rounded-xl px-4 py-3 text-sm leading-6 sm:mx-5 sm:mb-5 " +
                                (ready
                                  ? "bg-[#EFF8F3] text-[#275F48]"
                                  : "bg-[#FFF4EC] text-[#9B4D2B]")
                              }
                            >
                              {ready
                                ? "Hồ sơ phù hợp điều kiện cơ bản. Nhân viên sẽ xác minh sức khỏe và lịch trống trước khi xác nhận."
                                : !speciesMatch
                                  ? "Gói này chưa áp dụng cho loài thú cưng đã chọn. Vui lòng chọn gói hoặc thú cưng khác."
                                  : !weightOk
                                    ? "Cân nặng chưa phù hợp. Vui lòng cập nhật hồ sơ hoặc chọn dịch vụ khác."
                                    : "Daycare nhận thú cưng từ đủ 1 tuổi. Vui lòng chọn gói khác nếu chưa đủ tuổi."}
                              {currentPackage.name === "Grooming tạo kiểu" && (
                                <p className="mt-2 border-t border-current/10 pt-2 text-xs">
                                  <strong>Lưu ý theo loài:</strong> Chó được tư
                                  vấn kiểu cắt phù hợp với giống và dáng lông.
                                  Mèo ưu tiên tỉa vệ sinh, chỉnh lông nhẹ; không
                                  cạo sát hoặc tạo kiểu gây căng thẳng. Nhân
                                  viên kiểm tra tình trạng lông và mức độ hợp
                                  tác trước khi thực hiện.
                                </p>
                              )}
                            </div>
                          </section>
                        )
                      })()}
                    {!activeServiceNames.includes(service) && (
                      <p
                        className="text-sm font-semibold text-amber-800"
                        role="alert"
                      >
                        Gói đang chọn đã tạm ngừng nhận lịch. Vui lòng chọn gói
                        khác đang mở.
                      </p>
                    )}
                    {selectedPet &&
                      currentPackage &&
                      !currentPackage.species.includes(selectedPet.species) && (
                        <p
                          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                          role="alert"
                        >
                          {currentPackage.category === "Daycare"
                            ? "Daycare hiện nhận chó và mèo đủ điều kiện."
                            : `Gói ${currentPackage.name} không áp dụng cho ${selectedPet.species.toLowerCase()}.`}{" "}
                          Vui lòng chọn gói phù hợp hoặc thú cưng khác.
                        </p>
                      )}
                    <div className="rounded-2xl border border-[#DDE9F8] bg-white p-4">
                      <h3 className="font-extrabold text-[#142B55]">
                        Chăm sóc thêm (không bắt buộc)
                      </h3>
                      <p className="mb-3 mt-1 text-sm text-slate-600">
                        Các dịch vụ chưa bao gồm trong gói. Chọn tối đa 3 mục;
                        tổng tiền tự cập nhật.
                      </p>
                      <div className="space-y-2">
                        {Object.entries(addOnCatalog)
                          .filter(([id, item]) =>
                            item.services.includes(service),
                          )
                          .map(([id, item]) => (
                            <label
                              key={id}
                              className="flex cursor-pointer items-center justify-between gap-3 border-b border-[#E5EBF3] px-1 py-3 text-sm last:border-b-0 hover:bg-[#F9FBFE]"
                            >
                              <span className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedAddOns.includes(id)}
                                  disabled={
                                    !selectedAddOns.includes(id) &&
                                    selectedAddOns.length >= 3
                                  }
                                  onChange={(e) =>
                                    setSelectedAddOns((x) =>
                                      e.target.checked
                                        ? [...x, id]
                                        : x.filter((y) => y !== id),
                                    )
                                  }
                                />
                                {item.label}
                              </span>
                              <strong>{money(item.amount)}</strong>
                            </label>
                          ))}
                        {!Object.entries(addOnCatalog).some(([id, item]) =>
                          item.services.includes(service),
                        ) && (
                          <p className="text-xs text-slate-500">
                            Gói này đã bao gồm các chăm sóc phù hợp; không cần
                            mua thêm.
                          </p>
                        )}
                      </div>
                    </div>
                    <RetailPicker
                      items={retailProducts}
                      chosen={retailChosen}
                      onChange={setRetailChosen}
                      service={service}
                      species={selectedPet?.species || "Chó"}
                      onShop={() => onGo("shop")}
                    />
                    <p className="rounded-xl bg-[#F2F7FC] p-4">
                      Giá dự kiến gồm mục cộng thêm:{" "}
                      <strong>{money(quote?.total ?? estimate)}</strong>
                      <br />
                      <span className="text-xs text-slate-500">
                        Giá dịch vụ cơ bản cộng phụ phí cân nặng: đến 5 kg +0đ;
                        trên 5–10 kg +50.000đ; trên 10–20 kg +100.000đ; trên 20
                        kg +160.000đ (Daycare không tính phụ phí cân nặng). Giá
                        được máy chủ kiểm tra lại khi đặt lịch.
                      </span>
                      {quote?.lines?.length > 0 && (
                        <div className="mt-2 space-y-1 border-t border-slate-200 pt-2">
                          {quote.lines.map((line: any, i: number) => (
                            <div
                              key={i}
                              className="flex justify-between text-sm"
                            >
                              <span>{line.label}</span>
                              <span>{money(line.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="rounded-xl border px-4 py-3"
                        onClick={() => setStep(1)}
                      >
                        ← Quay lại
                      </button>
                      <button
                        className={B}
                        disabled={
                          !activeServiceNames.includes(service) ||
                          !selectedPet ||
                          !currentPackage ||
                          !currentPackage.species.some(
                            (s) => s === selectedPet.species,
                          ) ||
                          selectedPet.weight >
                            (currentPackage.category === "Daycare" ? 30 : 40) ||
                          (currentPackage.category === "Daycare" &&
                            selectedPet.age < 1)
                        }
                        onClick={() => setStep(3)}
                      >
                        Tiếp tục →
                      </button>
                    </div>
                  </div>
                ) : step === 3 ? (
                  <div className="max-w-5xl space-y-5">
                    <h2 className="text-2xl font-extrabold text-[#142B55]">
                      Chọn chi nhánh và thời gian
                    </h2>
                    <label className="block text-sm font-semibold">
                      Chi nhánh
                      <select
                        className={C + " mt-2"}
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                      >
                        <option>PetDay Thảo Điền</option>
                        <option>PetDay Phú Mỹ Hưng</option>
                      </select>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-sm font-semibold">
                        Ngày đến
                        <input
                          className={C + " mt-2"}
                          type="date"
                          min={tomorrow()}
                          value={date}
                          onChange={(e) => {
                            setDate(e.target.value)
                            if (daycareEndDate < e.target.value || Date.parse(daycareEndDate) - Date.parse(e.target.value) > 6 * 86400000)
                              setDaycareEndDate(e.target.value)
                          }}
                        />
                      </label>
                      {currentPackage?.category === "Daycare" && (
                        <label className="text-sm font-semibold">
                          Ngày về
                          <input
                            className={C + " mt-2"}
                            type="date"
                            min={date}
                            max={daycareMaxEndDate}
                            value={daycareEndDate}
                            onChange={(e) => setDaycareEndDate(e.target.value)}
                          />
                        </label>
                      )}
                      <div className="min-w-0 text-sm font-semibold">
                        Khung giờ phục vụ
                        <div className="mt-2 rounded-xl border border-[#DDE9F8] bg-white px-3 py-3 text-sm text-[#142B55]">
                          {dayLoading
                            ? "Đang kiểm tra khung giờ…"
                            : dayAvailability.length
                              ? `${dayAvailability.filter((x) => x.available).length} giờ có thể chọn`
                              : "Chưa có thông tin giờ trống"}
                        </div>
                      </div>
                    </div>
                    <div className="petday-slot-panel rounded-2xl border border-[#E0EAF7] bg-[#F7FAFF] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-extrabold text-[#142B55]">
                            Chọn khung giờ phục vụ
                          </h3>
                          <p className="text-xs font-normal text-slate-600">
                            Cập nhật theo ngày và chi nhánh. Chỗ được kiểm tra
                            lại khi gửi lịch.
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#142B55]">
                          {date}
                        </span>
                      </div>
                      {dayError ? (
                        <div
                          role="alert"
                          className="rounded-xl bg-red-50 p-3 text-xs text-red-700"
                        >
                          {dayError}{" "}
                          <span className="font-medium">
                            Vui lòng chọn lại ngày hoặc chi nhánh.
                          </span>
                        </div>
                      ) : null}
                      {currentPackage?.category === "Daycare" ? (
                        <div className="rounded-xl bg-white p-4">
                          <p className="mb-3 text-sm text-slate-600">
                            Daycare chỉ có một gói, chọn ngày đến/ngày về và giờ
                            đến/giờ về. Phí 40.000đ/giờ phục vụ trong
                            08:00–20:00; tối đa 7 ngày. Không tính hoặc cung cấp
                            lưu trú qua đêm.
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block text-sm font-bold text-[#142B55]">
                              Giờ đến
                              <input
                                type="time"
                                min="08:00"
                                max="19:00"
                                step={60}
                                className={C + " mt-2"}
                                value={slot}
                                onChange={(e) => {
                                  setSlot(e.target.value)
                                  setDaycarePickupTime("")
                                }}
                              />
                            </label>
                            <label className="block text-sm font-bold text-[#142B55]">
                              Giờ về
                              <input
                                type="time"
                                min="09:00"
                                max="20:00"
                                step={60}
                                className={C + " mt-2"}
                                value={daycarePickupTime}
                                onChange={(e) =>
                                  setDaycarePickupTime(e.target.value)
                                }
                              />
                            </label>
                          </div>
                          <p className="mt-3 text-sm font-semibold text-[#142B55]">
                            Dự kiến{" "}
                            {daycarePickupTime
                              ? Math.max(
                                  0,
                                  daycareEndDate === date
                                    ? (Number(daycarePickupTime.slice(0, 2)) *
                                        60 +
                                        Number(daycarePickupTime.slice(3)) -
                                        Number(slot.slice(0, 2)) * 60 -
                                        Number(slot.slice(3))) /
                                        60
                                    : ((new Date(
                                        daycareEndDate + "T00:00:00Z",
                                      ).getTime() -
                                        new Date(
                                          date + "T00:00:00Z",
                                        ).getTime()) /
                                        86400000 -
                                        1) *
                                        12 +
                                        (1200 -
                                          Number(slot.slice(0, 2)) * 60 -
                                          Number(slot.slice(3))) /
                                          60 +
                                        (Number(daycarePickupTime.slice(0, 2)) *
                                          60 +
                                          Number(daycarePickupTime.slice(3)) -
                                          480) /
                                          60,
                                ).toLocaleString("vi-VN", {
                                  maximumFractionDigits: 2,
                                })
                              : "—"}{" "}
                            giờ · giá được tính trên báo giá của hệ thống.
                          </p>
                        </div>
                      ) : dayLoading ? (
                        <p
                          role="status"
                          className="py-4 text-sm text-slate-500"
                        >
                          Đang tải khung giờ…
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {dayAvailability.map((x) => (
                            <button
                              type="button"
                              key={x.slot}
                              disabled={!x.available}
                              aria-pressed={slot === x.slot && x.available}
                              title={x.reason || ""}
                              onClick={() => {
                                setSlot(x.slot)
                                setDaycarePickupTime("")
                              }}
                              className={
                                "petday-slot-option rounded-xl border-2 px-3 py-3 text-left transition " +
                                (!x.available
                                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                  : slot === x.slot
                                    ? "border-[#FF765E] bg-[#FFF0EB] text-[#142B55] shadow-sm"
                                    : "border-[#E0EAF7] bg-white text-[#142B55] hover:border-[#9CB8D7]")
                              }
                            >
                              <span className="block font-extrabold">
                                {x.slot}
                              </span>
                              <span className="mt-1 block text-xs font-medium">
                                {x.available
                                  ? `Còn ${x.remaining} đơn vị chỗ`
                                  : x.reason?.startsWith("Tạm")
                                    ? "Tạm khóa"
                                    : "Đã đầy"}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {currentPackage?.category !== "Daycare" &&
                        !dayLoading &&
                        !dayError &&
                        !dayAvailability.some((x) => x.available) && (
                          <p className="mt-3 text-sm text-amber-800">
                            Ngày này không còn giờ phù hợp. Bé vui lòng chọn
                            ngày hoặc chi nhánh khác.
                          </p>
                        )}
                    </div>
                    <fieldset className="petday-taxi-option space-y-3 rounded-2xl border border-[#E0EAF7] bg-[#F7FAFF] p-4">
                      <legend className="px-2 text-sm font-extrabold text-[#142B55]">
                        Phương án đưa đón · Pet Taxi (tùy chọn)
                      </legend>
                      <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={taxiEnabled}
                          onChange={(e) => setTaxiEnabled(e.target.checked)}
                        />{" "}
                        Thêm Pet Taxi (nhân viên sẽ liên hệ thống nhất đưa đón)
                      </label>
                      {taxiEnabled && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <p className="mb-2 text-xs font-bold text-[#142B55]">
                              Chọn hình thức Pet Taxi
                            </p>
                            <div className="grid gap-2 sm:grid-cols-3">
                              {([
                                {
                                  value: "pickup",
                                  title: "Chiều đón",
                                  desc: "Nhà → PetDay",
                                },
                                {
                                  value: "return",
                                  title: "Chiều trả",
                                  desc: "PetDay → Nhà",
                                },
                                {
                                  value: "round_trip",
                                  title: "Đón và trả",
                                  desc: "Hai chiều",
                                },
                              ] as const).map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  aria-pressed={taxiDirection === option.value}
                                  onClick={() => setTaxiDirection(option.value)}
                                  className={
                                    "rounded-xl border-2 p-3 text-left transition " +
                                    (taxiDirection === option.value
                                      ? "border-[#142B55] bg-[#F0F5FC]"
                                      : "border-[#DDE9F8] bg-white")
                                  }
                                >
                                  <span className="block text-sm font-bold text-[#142B55]">
                                    {option.title}
                                  </span>
                                  <span className="mt-1 block text-xs text-slate-500">
                                    {option.desc}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <label className="text-xs font-bold text-[#142B55]">
                            Ước tính khoảng cách từ chi nhánh (tối đa 10 km)
                            <select
                              className={C + " mt-1"}
                              value={taxiZone}
                              onChange={(e) =>
                                setTaxiZone(
                                  e.target.value as "nearby" | "extended",
                                )
                              }
                            >
                              <option value="nearby">
                                Dự kiến trong 5 km · 70.000đ
                              </option>
                              <option value="extended">
                                Dự kiến trên 5 đến 10 km · 120.000đ
                              </option>
                            </select>
                            <span className="mt-2 block text-xs font-normal leading-5 text-slate-600">
                              Khoảng cách tính theo đường đi thực tế, không phải
                              bán kính đường chim bay. Đây là mức khách tự ước
                              tính; PetDay chưa tự tính tuyến đường. Ngoài 10
                              km: chưa nhận Pet Taxi. Nhân viên sẽ liên hệ để
                              thống nhất địa chỉ và phí.
                            </span>
                          </label>
                          <label className="text-xs font-bold text-[#142B55]">
                            Số điện thoại
                            <input
                              className={C + " mt-1"}
                              type="tel"
                              maxLength={20}
                              placeholder="09xxxxxxxx"
                              value={taxiPhone}
                              onChange={(e) => setTaxiPhone(e.target.value)}
                            />
                          </label>
                          <label className="text-xs font-bold text-[#142B55] sm:col-span-2">
                            Địa chỉ{" "}
                            {taxiDirection === "return"
                              ? "đưa về"
                              : "đón thú cưng"}
                            <textarea
                              className={C + " mt-1"}
                              rows={2}
                              maxLength={250}
                              placeholder="Số nhà, đường, phường/xã, khu vực"
                              value={taxiAddress}
                              onChange={(e) => setTaxiAddress(e.target.value)}
                            />
                          </label>
                          {taxiDirection === "round_trip" && (
                            <label className="text-xs font-bold text-[#142B55] sm:col-span-2">
                              Địa chỉ đưa thú cưng về (bỏ trống nếu giống địa
                              chỉ đón)
                              <textarea
                                className={C + " mt-1"}
                                rows={2}
                                maxLength={250}
                                value={taxiReturnAddress}
                                onChange={(e) =>
                                  setTaxiReturnAddress(e.target.value)
                                }
                                placeholder="Địa chỉ trả thú cưng"
                              />
                            </label>
                          )}
                          {taxiAddress.trim().length > 0 &&
                            taxiAddress.trim().length < 12 && (
                              <p
                                className="sm:col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"
                                role="alert"
                              >
                                Địa chỉ đón cần ít nhất 12 ký tự. Hãy nhập số
                                nhà, đường và phường/xã.
                              </p>
                            )}
                          {taxiPhone.trim().length > 0 &&
                            !/^(0|\+84)[0-9]{9}$/.test(taxiPhone.trim()) && (
                              <p
                                className="sm:col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"
                                role="alert"
                              >
                                Số liên hệ phải có 10 chữ số bắt đầu bằng 0 hoặc
                                +84 theo sau 9 chữ số.
                              </p>
                            )}
                        </div>
                      )}
                    </fieldset>
                    <div className="flex gap-2">
                      <button
                        className="rounded-xl border px-4 py-3"
                        onClick={() => setStep(2)}
                      >
                        ← Quay lại
                      </button>
                      <button
                        disabled={
                          busy ||
                          (currentPackage?.category !== "Daycare" &&
                            (dayLoading ||
                              !dayAvailability.some(
                                (x) => x.slot === slot && x.available,
                              )))
                        }
                        className={B}
                        onClick={checkAvailability}
                      >
                        Tiếp tục xác nhận →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-5xl space-y-5">
                    <h2 className="text-2xl font-extrabold text-[#142B55]">
                      Kiểm tra và xác nhận
                    </h2>
                    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                      <div className="space-y-3 rounded-2xl bg-[#F2F7FC] p-5">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#FF765E]">
                          Thông tin đặt lịch
                        </p>
                        <p>
                          <strong>Thú cưng:</strong> {selectedPet?.name}
                        </p>
                        <p>
                          <strong>Dịch vụ:</strong> {service}
                        </p>
                        {currentPackage?.category === "Daycare" &&
                          companionService && (
                            <p>
                              <strong>Gói kèm Daycare:</strong>{" "}
                              {companionService}
                            </p>
                          )}
                        {selectedAddOns.length > 0 && (
                          <p>
                            <strong>Chăm sóc cộng thêm:</strong>{" "}
                            {selectedAddOns
                              .map((id) => addOnCatalog[id]?.label)
                              .join(", ")}
                          </p>
                        )}
                        <p>
                          <strong>Chi nhánh:</strong> {branch}
                        </p>
                        <p>
                          <strong>Thời gian:</strong> {date} · {slot}
                          {currentPackage?.category === "Daycare"
                            ? " → " + daycareEndDate + " · " + daycarePickupTime
                            : ""}
                        </p>
                        {taxiEnabled && (
                          <p>
                            <strong>Tiện ích Pet Taxi:</strong>{" "}
                            {taxiDirection === "round_trip"
                              ? "Đón và đưa về"
                              : taxiDirection === "return"
                                ? "Đưa thú cưng về nhà"
                                : "Đón thú cưng đến cơ sở"}{" "}
                            ·{" "}
                            {taxiZone === "nearby"
                              ? "Khu vực gần"
                              : "Khu vực mở rộng"}{" "}
                            · {taxiAddress} · {taxiPhone}
                          </p>
                        )}
                        <p>
                          <strong>Trạng thái:</strong> Hệ thống tự xác nhận khi
                          đáp ứng điều kiện thanh toán/cọc
                        </p>
                        <fieldset className="space-y-2 rounded-xl border bg-white p-3">
                          <legend className="font-semibold">
                            Phương thức thanh toán
                          </legend>
                          <label className="flex min-h-12 items-center gap-3 rounded-lg p-2">
                            <input
                              type="radio"
                              checked={paymentMethod === "cash"}
                              onChange={() => {
                                setPaymentMethod("cash")
                                setPrepaymentChoice("deposit")
                              }}
                            />{" "}
                            Tiền mặt tại cơ sở
                          </label>
                          <label
                            className={
                              "flex min-h-12 items-center gap-3 rounded-lg p-2 " +
                              (!payOptions?.bankTransfer?.enabled
                                ? "cursor-not-allowed bg-amber-50 text-amber-900"
                                : "cursor-pointer hover:bg-blue-50")
                            }
                          >
                            <input
                              type="radio"
                              disabled={!payOptions?.bankTransfer?.enabled}
                              checked={paymentMethod === "bank_transfer"}
                              onChange={() => {
                                setPaymentMethod("bank_transfer")
                                setPrepaymentChoice("full")
                              }}
                            />{" "}
                            <span>
                              Chuyển khoản ngân hàng{" "}
                              <span className="text-xs">
                                {payOptions?.bankTransfer?.enabled
                                  ? "(Đối soát giao dịch)"
                                  : "(Chưa mở)"}
                              </span>
                            </span>
                          </label>
                          <label className="block pt-2 text-sm font-semibold text-[#142B55]">
                            Ghi chú cho lịch hẹn (không bắt buộc)
                            <textarea
                              className={C + " mt-2 min-h-24"}
                              rows={3}
                              maxLength={500}
                              value={bookingNote}
                              onChange={(e) => setBookingNote(e.target.value)}
                              placeholder="Ví dụ: bé nhạy cảm với tiếng ồn, gọi trước khi đến, lưu ý về thời gian nhận pet..."
                            />
                            <span className="mt-1 block text-right text-xs font-normal text-slate-500">
                              {bookingNote.length}/500 ký tự · PetDay sẽ lưu
                              cùng lịch hẹn.
                            </span>
                          </label>
                          {!payOptions?.bankTransfer?.enabled && (
                            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                              Hiện chưa hỗ trợ chuyển khoản cho lịch này. Vui
                              lòng chọn tiền mặt hoặc liên hệ PetDay để được hỗ
                              trợ thanh toán.
                            </p>
                          )}
                          {paymentMethod === "bank_transfer" &&
                            payOptions?.bankTransfer?.enabled && (
                              <div className="rounded-xl border border-[#D3E3F5] bg-gradient-to-br from-[#F0F6FF] to-white p-5 text-sm shadow-sm">
                                <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-[#4B6483]">
                                  Thông tin thanh toán
                                </p>
                                <p>
                                  <strong>Ngân hàng:</strong>{" "}
                                  {payOptions.bankTransfer.bankName}
                                </p>
                                <p>
                                  <strong>Chủ tài khoản:</strong>{" "}
                                  {payOptions.bankTransfer.accountHolder}
                                </p>
                                <p>
                                  <strong>Số tài khoản:</strong>{" "}
                                  {payOptions.bankTransfer.accountNumber}
                                </p>
                                <p className="mt-2 text-xs font-semibold">
                                  {payOptions?.bankTransfer?.demo
                                    ? "Thanh toán thử nghiệm: không chuyển tiền thật. Quản trị chỉ xác nhận trong hệ thống."
                                    : "Sau khi tạo lịch, dùng mã lịch làm nội dung chuyển khoản. Hệ thống KHÔNG tự xác nhận đã nhận tiền."}
                                </p>
                              </div>
                            )}
                          {!payOptions?.bankTransfer?.demo && (
                            <p className="text-xs text-slate-500">
                              Chuyển khoản chỉ hoàn tất khi nhân viên đối soát
                              số tiền thực nhận.
                            </p>
                          )}
                        </fieldset>
                        <div className="border-t pt-3">
                          <p className="text-lg font-extrabold text-[#142B55]">
                            {promoPreview
                              ? "Giá sau ưu đãi dự kiến: " +
                                money(promoPreview.total)
                              : "Giá dự kiến: " +
                                money(quote?.total ?? estimate)}
                          </p>
                          {quote?.lines?.map((item: any, i: number) => (
                            <p
                              className="mt-1 flex justify-between gap-3 text-xs text-slate-600"
                              key={i}
                            >
                              <span>{item.label}</span>
                              <span>{money(item.amount)}</span>
                            </p>
                          ))}
                          {promoPreview && (
                            <p className="mt-1 text-xs font-semibold text-[#C94B36]">
                              Giảm {money(promoPreview.discount)} theo mã{" "}
                              {promoPreview.code} (sẽ kiểm tra lại)
                            </p>
                          )}
                        </div>
                      </div>
                      <aside className="h-fit overflow-hidden rounded-2xl border border-[#DDE9F8] bg-white">
                        <button
                          type="button"
                          className="flex min-h-14 w-full items-center justify-between gap-4 p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#142B55]"
                          aria-expanded={bookingNotesOpen}
                          aria-controls="booking-notes-content"
                          onClick={() => setBookingNotesOpen((open) => !open)}
                        >
                          <span>
                            <span className="block font-extrabold text-[#142B55]">
                              Lưu ý khi đặt lịch
                            </span>
                            <span className="mt-1 block text-sm leading-5 text-slate-600">
                              Vui lòng đọc chính sách thanh toán, hủy lịch và
                              chăm sóc thú cưng.
                            </span>
                          </span>
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            fill="none"
                            className={
                              "h-5 w-5 shrink-0 text-[#142B55] transition-transform duration-200 motion-reduce:transition-none " +
                              (bookingNotesOpen ? "rotate-180" : "")
                            }
                          >
                            <path
                              d="m5 7.5 5 5 5-5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <div
                          id="booking-notes-content"
                          aria-hidden={!bookingNotesOpen}
                          className={
                            "grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none " +
                            (bookingNotesOpen
                              ? "grid-rows-[1fr] opacity-100"
                              : "grid-rows-[0fr] opacity-0")
                          }
                        >
                          <div className="min-h-0 overflow-hidden">
                            <ol className="list-decimal space-y-4 border-t border-[#E6EDF6] px-5 py-5 pl-10 text-sm leading-6 text-slate-600">
                              <li className="pl-1">
                                <strong className="block text-[#142B55]">
                                  Xác nhận và thanh toán
                                </strong>
                                Lịch hẹn được xác nhận khi đáp ứng điều kiện
                                thanh toán. Khách hàng thuộc diện yêu cầu đặt
                                cọc có thể thanh toán trước tối thiểu 20% phí
                                chăm sóc hoặc toàn bộ giá trị lịch theo phương
                                án được cung cấp. Khách chọn chuyển khoản cần
                                thanh toán đủ giá trị lịch trước khi xác nhận.
                              </li>
                              <li className="pl-1">
                                <strong className="block text-[#142B55]">
                                  Thay đổi và hủy lịch
                                </strong>
                                Nếu cần thay đổi hoặc hủy lịch, vui lòng thực
                                hiện theo thời hạn và chính sách áp dụng của
                                PetDay. Tiền cọc và khoản đã thanh toán được xử
                                lý theo nguyên nhân, thời điểm hủy và điều kiện
                                hoàn tiền.
                              </li>
                              <li className="pl-1">
                                <strong className="block text-[#142B55]">
                                  Đến đúng giờ hẹn
                                </strong>
                                Vui lòng đưa thú cưng đến đúng thời gian đã đặt.
                                Trường hợp không đến và không thông báo có thể
                                bị ghi nhận No-show, ảnh hưởng đến điều kiện đặt
                                lịch lần tiếp theo.
                              </li>
                              <li className="pl-1">
                                <strong className="block text-[#142B55]">
                                  Dịch vụ cộng thêm
                                </strong>
                                Các tiện ích như Pet Taxi, Grooming hoặc Spa bổ
                                sung sẽ được tính vào chi phí theo lựa chọn thực
                                tế. Pet Taxi là dịch vụ cộng thêm, không mặc
                                định được miễn hoặc giảm phí.
                              </li>
                              <li className="pl-1">
                                <strong className="block text-[#142B55]">
                                  An toàn và sức khỏe thú cưng
                                </strong>
                                Khách hàng cần cung cấp thông tin sức khỏe và
                                tình trạng thú cưng chính xác. PetDay có thể tạm
                                dừng hoặc không tiếp tục dịch vụ nếu phát sinh
                                nguy cơ ảnh hưởng đến an toàn của thú cưng hoặc
                                nhân viên.
                              </li>
                              <li className="pl-1">
                                <strong className="block text-[#142B55]">
                                  Chi phí và phát sinh
                                </strong>
                                Tổng chi phí được hiển thị trước khi xác nhận.
                                Mọi khoản phát sinh phải được thông báo rõ ràng
                                và được khách hàng đồng ý trước khi áp dụng.
                              </li>
                            </ol>
                          </div>
                        </div>
                      </aside>
                    </div>
                    <p className="text-sm text-slate-500">
                      {availability?.available
                        ? currentPackage?.category === "Daycare"
                          ? "Daycare nhận lịch trong giờ hoạt động; hệ thống vẫn kiểm tra ngày giờ và lịch trùng của thú cưng khi xác nhận."
                          : "Khung giờ còn chỗ tại thời điểm kiểm tra. Hệ thống sẽ kiểm tra lại khi gửi đặt lịch."
                        : "Vui lòng kiểm tra lại khung giờ."}
                    </p>
                    <div className="mt-4 rounded-2xl border border-[#DDE9F8] bg-white p-4">
                      <label className="block text-sm font-bold">
                        Mã ưu đãi (nếu có)
                      </label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <input
                          className={C + " flex-1"}
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value.toUpperCase())
                            setPromoPreview(null)
                          }}
                          placeholder="Nhập mã được PetDay cung cấp"
                        />
                        <button
                          type="button"
                          className="rounded-xl border px-4 py-2 text-sm font-semibold"
                          onClick={verifyPromotion}
                          disabled={busy || !promoCode.trim()}
                        >
                          Áp dụng
                        </button>
                      </div>
                      {promoPreview && (
                        <p className="mt-2 text-sm text-[#142B55]">
                          Giảm {money(promoPreview.discount)} · Tổng sau ưu đãi{" "}
                          {money(promoPreview.total)}
                        </p>
                      )}
                    </div>
                    {taxiEnabled &&
                      (taxiAddress.trim().length < 12 ||
                        !/^(0|\+84)[0-9]{9}$/.test(taxiPhone.trim())) && (
                        <p
                          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                          role="alert"
                        >
                          Để xác nhận lịch có Pet Taxi, hãy quay lại bước 3 và
                          nhập địa chỉ đón đầy đủ (ít nhất 12 ký tự) cùng số
                          điện thoại hợp lệ.
                        </p>
                      )}
                    {!availability?.available && (
                      <p
                        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                        role="alert"
                      >
                        Khung giờ chưa được xác nhận còn chỗ. Quay lại bước 3 để
                        kiểm tra lại.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        className="rounded-xl border px-4 py-3"
                        onClick={() => setStep(3)}
                      >
                        ← Quay lại
                      </button>
                      <button
                        className={B}
                        disabled={
                          busy ||
                          !availability?.available ||
                          (taxiEnabled &&
                            (taxiAddress.trim().length < 12 ||
                              !/^(0|\+84)[0-9]{9}$/.test(taxiPhone.trim()))) ||
                          (paymentMethod === "bank_transfer" &&
                            !payOptions?.bankTransfer?.enabled)
                        }
                        onClick={confirmBooking}
                      >
                        Xác nhận đặt lịch
                      </button>
                    </div>
                  </div>
                )}
              </section>
            ) : null}
            {view === "admin" && user.role === "staff" && (
              <>
                <nav
                  aria-label="Phân hệ dành cho nhân viên"
                  className="rounded-2xl border border-[#DDE9F8] bg-white p-4 text-sm font-bold text-[#142B55]"
                >
                  Lịch được giao &nbsp; / &nbsp; Tiến trình chăm sóc &nbsp; /
                  &nbsp; Tài khoản nhân viên
                </nav>
                <StaffWorkspace
                  token={token}
                  bookings={bookings}
                  refresh={async () => {
                    await reload()
                  }}
                />
              </>
            )}
            {view === "admin" && user.role === "admin" && (
              <nav
                aria-label="Phân hệ quản trị"
                className="petday-admin-tabs sticky top-16 z-30 flex flex-wrap gap-2 rounded-2xl border border-[#DDE9F8] bg-white/95 p-2 shadow-sm backdrop-blur-xl"
              >
                {([
                  ["today", "Tổng quan", "☷"],
                  ["appointments", "Lịch hẹn", "▦"],
                  ["orders", "Đơn cửa hàng", "▤"],
                  ["products", "Sản phẩm & kho", "▣"],
                  ["people", "Khách hàng", "♙"],
                  ["support", "CSKH & ưu đãi", "✦"],
                ] as const).map(([id, label, symbol]) => (
                  <button
                    key={id}
                    type="button"
                    aria-current={adminTab === id ? "page" : undefined}
                    onClick={() => {
                      setAdminTab(id)
                      if (id === "appointments") {
                        setBookingFilter("processing")
                        setBookingSearch("")
                      }
                      if (id === "finance") {
                        setFinanceScope("todo")
                        setFinancePanel("payments")
                      }
                      window.scrollTo({ top: 180, behavior: "smooth" })
                    }}
                    className={
                      "rounded-xl px-3 py-2.5 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-[#FF765E] " +
                      (adminTab === id
                        ? "bg-[#142B55] text-white shadow-md"
                        : "text-[#526078] hover:bg-[#EDF5FC]")
                    }
                  >
                    {symbol} <span className="ml-1">{label}</span>
                  </button>
                ))}
              </nav>
            )}
            {view === "admin" &&
              user.role === "admin" &&
              adminTab === "people" && (
                <details className="rounded-3xl border border-[#DFE8F4] bg-white shadow-sm">
                  <summary className="cursor-pointer px-6 py-4 font-extrabold text-[#142B55]">
                    Quản lý khách hàng · Tra cứu hồ sơ
                  </summary>
                  <AdminCustomersReviews token={token} mode="customers" />
                </details>
              )}
            {false &&
              view === "admin" &&
              user.role === "admin" &&
              adminTab === "staff" && (
                <div id="admin-staff-planner" className="scroll-mt-32">
                  <StaffPlanner
                    token={token}
                    bookings={bookings}
                    onAssigned={async () => {
                      await reload()
                    }}
                  />
                </div>
              )}
            {false &&
              view === "admin" &&
              user.role === "admin" &&
              adminTab === "finance" && (
                <nav
                  className="flex flex-wrap gap-2 rounded-2xl border border-[#DCE6F4] bg-white p-3"
                  aria-label="Nhóm công việc tài chính"
                >
                  {([
                    ["todo", "Theo dõi"],
                    ["history", "Lịch sử"],
                    ["settings", "Thiết lập"],
                  ] as const).map(([id, label]) => (
                    <button
                      type="button"
                      key={id}
                      aria-pressed={financeScope === id}
                      onClick={() => setFinanceScope(id)}
                      className={
                        "rounded-xl px-4 py-2.5 text-sm font-bold " +
                        (financeScope === id
                          ? "bg-[#142B55] text-white"
                          : "border border-[#DCE6F4] text-[#142B55]")
                      }
                    >
                      {label}
                    </button>
                  ))}
                </nav>
              )}
            {false &&
              view === "admin" &&
              user?.role === "admin" &&
              adminTab === "finance" &&
              financeScope !== "settings" && (
                <section
                  className="rounded-3xl border border-[#DDE9F8] bg-white p-4 sm:p-5"
                  aria-label="Chọn nghiệp vụ tài chính"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-extrabold text-[#142B55]">
                        {financeScope === "todo"
                          ? "Quản lý thu chi"
                          : "Tra cứu giao dịch đã xử lý"}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {financeScope === "todo"
                          ? "Theo dõi giao dịch, khoản thực thu và khoản hoàn theo chính sách."
                          : "Các khoản đã thu và đã hoàn được lưu, không xuất hiện trong hàng đợi."}
                      </p>
                    </div>
                  </div>
                  <div
                    className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[#EFF5FC] p-1.5"
                    role="tablist"
                    aria-label="Loại công việc tài chính"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={financePanel === "payments"}
                      className={
                        "rounded-xl px-3 py-3 text-sm font-bold transition " +
                        (financePanel === "payments"
                          ? "bg-[#142B55] text-white shadow-sm"
                          : "text-[#385178] hover:bg-white")
                      }
                      onClick={() => setFinancePanel("payments")}
                    >
                      {financeScope === "todo" ? "Dịch vụ" : "Đã thu dịch vụ"}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={financePanel === "shop"}
                      className={
                        "rounded-xl px-3 py-3 text-sm font-bold transition " +
                        (financePanel === "shop"
                          ? "bg-[#142B55] text-white shadow-sm"
                          : "text-[#385178] hover:bg-white")
                      }
                      onClick={() => setFinancePanel("shop")}
                    >
                      Cửa hàng
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={financePanel === "refunds"}
                      className={
                        "rounded-xl px-3 py-3 text-sm font-bold transition " +
                        (financePanel === "refunds"
                          ? "bg-[#142B55] text-white shadow-sm"
                          : "text-[#385178] hover:bg-white")
                      }
                      onClick={() => setFinancePanel("refunds")}
                    >
                      {financeScope === "todo" ? "Hoàn tiền" : "Đã hoàn"}
                    </button>
                  </div>
                </section>
              )}
            {view === "admin" &&
              user.role === "admin" &&
              adminTab === "support" && (
                <details
                  defaultOpen
                  className="petday-admin-disclosure rounded-3xl border border-[#DFE8F4] bg-white shadow-sm"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-base font-extrabold text-[#142B55] sm:px-7">
                    Cấu hình chuyển khoản · Tài khoản nhận tiền{" "}
                    <span aria-hidden="true">⌄</span>
                  </summary>
                  <section
                    id="admin-bank-settings"
                    className={card + " scroll-mt-32"}
                  >
                    <h2 className="text-xl font-extrabold text-[#142B55]">
                      Thiết lập nhận chuyển khoản
                    </h2>
                    {payOptions?.bankTransfer?.demo && (
                      <p className="mt-2 text-xs text-slate-500">
                        Đang sử dụng thanh toán mô phỏng · Không chuyển tiền
                        thật.
                      </p>
                    )}
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <label className="text-sm font-semibold">
                        Tên ngân hàng
                        <input
                          className={C + " mt-2"}
                          maxLength={100}
                          value={bankDraft.bankName}
                          onChange={(e) =>
                            setBankDraft((v) => ({
                              ...v,
                              bankName: e.target.value,
                            }))
                          }
                          placeholder="Ví dụ: Vietcombank"
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        Số tài khoản
                        <input
                          className={C + " mt-2"}
                          inputMode="numeric"
                          maxLength={25}
                          value={bankDraft.accountNumber}
                          onChange={(e) =>
                            setBankDraft((v) => ({
                              ...v,
                              accountNumber: e.target.value,
                            }))
                          }
                          placeholder="6–25 chữ số"
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        Chủ tài khoản
                        <input
                          className={C + " mt-2"}
                          maxLength={120}
                          value={bankDraft.accountHolder}
                          onChange={(e) =>
                            setBankDraft((v) => ({
                              ...v,
                              accountHolder: e.target.value,
                            }))
                          }
                          placeholder="Đúng tên trên tài khoản"
                        />
                      </label>
                    </div>
                    <button
                      className={B + " mt-4"}
                      disabled={
                        busy ||
                        payOptions?.bankTransfer?.demo ||
                        !bankDraft.bankName.trim() ||
                        !/^\d{6,25}$/.test(bankDraft.accountNumber) ||
                        !bankDraft.accountHolder.trim()
                      }
                      onClick={saveBank}
                    >
                      Lưu tài khoản nhận tiền
                    </button>
                  </section>
                </details>
              )}
            {view === "admin" &&
              user.role === "admin" &&
              adminTab === "today" && (
                <DailyOperations
                  bookings={bookings}
                  onOpenBooking={(code) => {
                    setAdminTab("appointments")
                    setBookingFilter("all")
                    setBookingPeriod("all")
                    setFilterStart("")
                    setFilterEnd("")
                    setBookingSearch(code)
                    setTimeout(
                      () =>
                        document
                          .getElementById("admin-bookings")
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          }),
                      90,
                    )
                  }}
                  onOpenFinance={() => {
                    setAdminTab("appointments")
                    setBookingFilter("pending")
                    setBookingPeriod("all")
                    setFilterStart("")
                    setFilterEnd("")
                    setBookingSearch("")
                    setTimeout(
                      () =>
                        document
                          .getElementById("admin-bookings")
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          }),
                      90,
                    )
                  }}
                />
              )}
            {view === "appointments" && user.role === "customer" && (
              <section
                className="petday-next-visit rounded-3xl p-6"
                aria-label="Lịch gần nhất"
              >
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[.13em] text-[#D65F47]">
                    TỔNG QUAN CỦA BẠN
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold text-[#142B55]">
                    {bookings.some(
                      (x) =>
                        [
                          "Đang chờ xác nhận",
                          "Đã xác nhận",
                          "Đang thực hiện",
                        ].includes(x.status) && x.date >= todayLocal,
                    )
                      ? "Lịch chăm sóc sắp tới"
                      : "Sẵn sàng cho lần chăm sóc tiếp theo?"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {(() => {
                      const next = bookings
                        .filter(
                          (x) =>
                            [
                              "Đang chờ xác nhận",
                              "Đã xác nhận",
                              "Đang thực hiện",
                            ].includes(x.status) && x.date >= todayLocal,
                        )
                        .sort((a, b) =>
                          (a.date + a.slot).localeCompare(b.date + b.slot),
                        )[0]
                      return next
                        ? `${next.petName} · ${next.service} · ${next.date} lúc ${next.slot} · ${customerFacingStatus(next)}`
                        : "Chưa có lịch đang chờ hoặc đang thực hiện."
                    })()}
                  </p>
                </div>
                <button
                  type="button"
                  className="petday-next-cta"
                  onClick={() => onGo("booking")}
                >
                  + Đặt lịch mới
                </button>
              </section>
            )}
            {view === "appointments" &&
              user.role === "customer" &&
              paymentExpandedCode && (
                <CustomerBankNotices
                  token={token}
                  bookings={bookings.filter(
                    (b) => b.code === paymentExpandedCode,
                  )}
                  focusCode={paymentExpandedCode}
                  onDemoConfirmed={async (message) => {
                    setNotice(message)
                    await reload()
                  }}
                />
              )}
            {false &&
              view === "admin" &&
              user.role === "admin" &&
              adminTab === "appointments" && (
                <section
                  aria-label="Hỗ trợ các trường hợp ngoại lệ"
                  className="rounded-3xl border border-[#DDE9F8] bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-[#E16E58]">
                        ƯU TIÊN XỬ LÝ
                      </p>
                      <h2 className="mt-1 text-xl font-extrabold text-[#142B55]">
                        Hỗ trợ các trường hợp ngoại lệ
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Chỉ những yêu cầu sát giờ hoặc cần xác minh ngoại lệ mới
                        chuyển cho nhân viên. Các lịch hợp lệ được tự xác nhận.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#EDF4FC] px-3 py-2 text-xs font-bold text-[#142B55]">
                        Đổi lịch:{" "}
                        {
                          reschedules.filter((r) => r.status === "pending")
                            .length
                        }
                      </span>
                      <span className="rounded-full bg-[#EDF4FC] px-3 py-2 text-xs font-bold text-[#142B55]">
                        Hủy lịch:{" "}
                        {
                          cancellations.filter((r) => r.status === "pending")
                            .length
                        }
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {reschedules.some(
                      (r) =>
                        r.status === "pending" ||
                        (r.status === "approved" &&
                          r.currentDate &&
                          (r.currentDate !== r.proposedDate?.slice(0, 10) ||
                            r.currentSlot !== r.proposedSlot)),
                    ) || cancellations.some((r) => r.status === "pending") ? (
                      null
                    ) : (
                      <p className="rounded-xl bg-[#F2F7FC] px-4 py-3 text-sm text-slate-600">
                        Không có yêu cầu đổi hoặc hủy lịch đang chờ. Chuyển
                        xuống danh sách lịch hẹn để xử lý lịch mới.
                      </p>
                    )}
                  </div>
                </section>
              )}
            {(view === "appointments" ||
              (view === "admin" && adminTab === "appointments")) && (
              <section
                id={view === "admin" ? "admin-bookings" : "appointments-list"}
                className={card + " scroll-mt-32"}
              >
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#E06E57]">
                      {view === "admin"
                        ? "VẬN HÀNH HẰNG NGÀY"
                        : "THEO DÕI DỊCH VỤ"}
                    </p>
                    <h2 className="mt-1 text-xl font-extrabold text-[#142B55]">
                      {view === "admin"
                        ? "Quản lý lịch hẹn"
                        : "Lịch hẹn của tôi"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {view === "admin"
                        ? "Ưu tiên lịch đang chăm sóc, và sắp bắt đầu; chi tiết mở khi cần."
                        : "Lịch vừa đặt gần đây nhất hiển thị trước, bất kể ngày sử dụng dịch vụ."}
                    </p>
                  </div>
                  <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                    {view === "admin" && user.role === "admin" && (
                      <button
                        type="button"
                        onClick={() => exportBookingsCsv(visibleBookings)}
                        disabled={!visibleBookings.length}
                        title="Tải danh sách lịch đang hiển thị ra CSV để đối chiếu, không chứa email hay số điện thoại"
                        className="rounded-xl border border-[#D9E5F3] bg-[#F0F6FC] px-4 py-2 text-sm font-bold text-[#142B55] hover:bg-white disabled:opacity-50"
                      >
                        ↓ Xuất CSV ({visibleBookings.length})
                      </button>
                    )}
                    <button
                      onClick={() => run(() => reload())}
                      className="rounded-xl border border-[#D9E5F3] bg-white px-4 py-2 text-sm font-bold text-[#142B55] hover:bg-[#F0F6FC]"
                    >
                      ↻ Làm mới
                    </button>
                  </div>
                </div>

                <div
                  className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4"
                  aria-label="Thống kê lịch hẹn"
                >
                  {([
                    ["today", "Hôm nay", bookingStats.today],
                    ["confirmed", "Đã xác nhận", bookingStats.confirmed],
                    ["active", "Đang phục vụ", bookingStats.active],
                    ["done", "Hoàn tất", bookingStats.done],
                  ] as const).map(([key, label, count]) => (
                    <button
                      type="button"
                      key={key}
                      aria-pressed={key === "today" ? bookingPeriod === "today" : bookingFilter === key}
                      onClick={() => {if(key === "today"){setBookingPeriod(bookingPeriod === "today" ? "all" : "today");setFilterStart("");setFilterEnd("")}else setBookingFilter(bookingFilter === key ? "all" : key)}}
                      className={
                        "petday-stat-tile rounded-2xl border p-4 text-left transition " +
                        ((key === "today" ? bookingPeriod === "today" : bookingFilter === key)
                          ? "border-[#142B55] bg-[#EEF4FC] shadow-sm"
                          : "border-[#E4EBF6] bg-[#FBFDFF] hover:border-[#A9BED9]")
                      }
                    >
                      <span className="block text-xs font-semibold text-slate-500">
                        {label}
                      </span>
                      <strong className="mt-2 block text-2xl font-extrabold text-[#142B55]">
                        {count}
                      </strong>
                    </button>
                  ))}
                </div>
                {view === "admin" && (
                  <div
                    className="mb-4 flex flex-wrap gap-2"
                    role="group"
                    aria-label="Nhóm lịch hẹn"
                  >
                    {([
                      ["processing", "Đang xử lý"],
                      ["confirmed", "Đã xác nhận"],
                      ["active", "Đang phục vụ"],
                      ["pending", "Chờ thanh toán"],
                      ["done", "Hoàn tất"],
                      ["incomplete", "Không hoàn thành"],
                      ["cancelled", "Đã hủy"],
                      ["no-show", "No-show"],
                    ] as const).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={bookingFilter === key}
                        onClick={() => {
                          setBookingFilter(key)
                          setBookingOrder(
                            key === "processing" ||
                              key === "pending" ||
                              key === "active"
                              ? "oldest"
                              : "newest",
                          )
                        }}
                        className={
                          "rounded-xl border px-3 py-2 text-sm font-bold " +
                          (bookingFilter === key
                            ? "border-[#142B55] bg-[#142B55] text-white"
                            : "border-[#DDE8F6] bg-white text-[#142B55]")
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mb-5 grid items-end gap-3 rounded-2xl border border-[#E4EBF6] bg-[#F7FAFF] p-4 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(140px,1fr))]">
                  <label className="text-xs font-bold text-[#142B55]">
                    {view === "admin"
                      ? "Tìm mã, thú cưng, khách hoặc dịch vụ"
                      : "Tìm mã lịch, thú cưng hoặc dịch vụ"}
                    <input
                      type="search"
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      placeholder="Ví dụ: PD-001, Poodle, Spa..."
                      className={C + " mt-2"}
                    />
                  </label>
                  <label className="text-xs font-bold text-[#142B55]">
                    Trạng thái
                    <select
                      value={bookingFilter}
                      onChange={(e) => setBookingFilter(e.target.value)}
                      className={C + " mt-2"}
                    >
                      {view === "admin" && (
                        <option value="processing">
                          Đang xử lý (mặc định Admin)
                        </option>
                      )}
                      <option value="all">Tất cả lịch hẹn</option>
                      <option value="cancelled">Đã hủy</option>
                      {view === "admin" && (
                        <option value="no-show">No-show</option>
                      )}
                      <option value="confirmed">Đã xác nhận</option>
                      <option value="active">Đang phục vụ</option>
                      <option value="done">Hoàn tất</option>
                      <option value="incomplete">Không hoàn thành</option>
                      <option value="pending">Chờ thanh toán</option>
                      {view === "appointments" && (
                        <>
                          <option value="refund">Hoàn tiền</option>
                        </>
                      )}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-[#142B55]">
                    Thời gian
                    <select value={bookingPeriod} onChange={e=>{setBookingPeriod(e.target.value); if(e.target.value!=="custom"){setFilterStart("");setFilterEnd("")}}} className={C+" mt-2"}>
                      <option value="all">Tất cả ngày</option>
                      <option value="today">Lịch hôm nay</option>
                      <option value="upcoming">Lịch sắp tới</option>
                      {view === "admin" && <option value="custom">Khoảng ngày tùy chọn</option>}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-[#142B55]">
                    Sắp xếp
                    <select
                      value={bookingOrder}
                      onChange={(e) =>
                        setBookingOrder(
                          e.target
                            .value as "created-newest" | "created-oldest" | "priority" | "newest" | "oldest",
                        )
                      }
                      className={C + " mt-2"}
                    >
                      {view === "appointments" && (
                        <>
                          <option value="created-newest">Mới đặt nhất</option>
                          <option value="created-oldest">Đặt lâu nhất</option>
                        </>
                      )}
                      {view === "admin" && (
                        <option value="priority">Ưu tiên xử lý</option>
                      )}
                      <option value="oldest">Ngày hẹn gần nhất</option>
                      <option value="newest">Ngày hẹn xa nhất</option>
                    </select>
                  </label>
                </div>
                {view === "appointments" && (
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <label className="text-xs font-bold text-[#142B55]">
                      Thú cưng
                      <select
                        className={C + " mt-2"}
                        value={bookingPetFilter}
                        onChange={(e) => setBookingPetFilter(e.target.value)}
                      >
                        <option value="all">Tất cả thú cưng</option>
                        {pets.map((p) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="rounded-xl border border-[#CBD9EB] bg-white px-4 py-2 text-sm font-bold text-[#142B55]"
                      onClick={() => {
                        setBookingSearch("")
                        setBookingFilter("all")
                        setBookingPetFilter("all")
                        setBookingPeriod("all")
                        setBookingOrder("created-newest")
                      }}
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                )}
                {view === "admin" && (
                  <details open={bookingPeriod === "custom" || undefined} className="petday-advanced-filters mb-5 rounded-2xl border border-[#E4EBF6] bg-white p-4">
                    <summary className="cursor-pointer text-sm font-extrabold text-[#142B55]">
                      Bộ lọc nâng cao · chi nhánh và khoảng ngày
                    </summary>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <label className="text-xs font-bold text-[#142B55]">
                        Chi nhánh
                        <select
                          className={C + " mt-2"}
                          value={filterBranch}
                          onChange={(e) => setFilterBranch(e.target.value)}
                        >
                          <option value="all">Tất cả chi nhánh</option>
                          {Array.from(new Set(bookings.map((b) => b.branch)))
                            .sort()
                            .map((branch) => (
                              <option value={branch} key={branch}>
                                {branch}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="text-xs font-bold text-[#142B55]">
                        Từ ngày
                        <input
                          className={C + " mt-2"}
                          type="date"
                          value={filterStart}
                          max={filterEnd || undefined}
                          onChange={(e) => {setFilterStart(e.target.value);setBookingPeriod("custom")}}
                        />
                      </label>
                      <label className="text-xs font-bold text-[#142B55]">
                        Đến ngày
                        <input
                          className={C + " mt-2"}
                          type="date"
                          value={filterEnd}
                          min={filterStart || undefined}
                          onChange={(e) => {setFilterEnd(e.target.value);setBookingPeriod("custom")}}
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        CSV chỉ xuất những lịch đang thỏa mãn tất cả bộ lọc.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterBranch("all")
                          setFilterStart("")
                          setFilterEnd("")
                          setBookingPeriod("all")
                        }}
                        className="rounded-xl border border-[#CBDCF0] px-3 py-2 text-xs font-bold text-[#142B55]"
                      >
                        Xóa bộ lọc nâng cao
                      </button>
                    </div>
                  </details>
                )}
                {bookings.length > 0 && (
                  <p
                    className="mb-3 text-sm font-medium text-slate-500"
                    role="status"
                  >
                    Hiển thị {visibleBookings.length}/{bookings.length} lịch hẹn
                  </p>
                )}
                {bookings.length === 0 ? (
                  <div className="rounded-xl bg-[#F2F7FC] p-7 text-center text-slate-500">
                    Chưa có lịch hẹn nào.
                    {view === "appointments" && (
                      <button
                        className={B + " ml-3"}
                        onClick={() => onGo("booking")}
                      >
                        Đặt lịch
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    className={
                      view === "admin"
                        ? "grid gap-3"
                        : "grid gap-4 xl:grid-cols-2"
                    }
                  >
                    {visibleBookings.length === 0 && (
                      <div className="xl:col-span-2 rounded-2xl border border-dashed border-[#C9D9EB] bg-[#F7FAFF] p-8 text-center">
                        <p className="font-bold text-[#142B55]">
                          Không tìm thấy lịch phù hợp
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          Thử từ khóa khác hoặc đặt lại bộ lọc.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setBookingSearch("")
                            setBookingFilter("all")
                            setFilterBranch("all")
                            setFilterStart("")
                            setFilterEnd("")
                          }}
                          className="mt-4 rounded-xl bg-[#142B55] px-5 py-2 text-sm font-bold text-white"
                        >
                          Xóa bộ lọc
                        </button>
                      </div>
                    )}
                    {visibleBookings.map((b) => (
                      <article
                        className="petday-booking-card space-y-2 rounded-2xl border border-[#E1EAF5] bg-white p-4"
                        key={b.code}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-col gap-1">
                            <strong className="text-[#142B55]">{b.code}</strong>
                            {bookingOrder === "priority" && (
                              <span className="text-[11px] font-medium text-[#536B8D]">
                                {b.status === "Đang thực hiện"
                                  ? b.careCompleted
                                    ? "Ưu tiên · Chăm sóc xong"
                                    : "Ưu tiên · Đang chăm sóc"
                                  : b.status === "Đang chờ xác nhận"
                                    ? "Cần thanh toán ban đầu"
                                    : b.status === "Đã xác nhận"
                                      ? "Lịch sắp diễn ra"
                                      : b.status === "Hoàn tất"
                                        ? "Lịch sử · Hoàn tất"
                                        : b.status === "Đã hủy"
                                          ? "Lịch sử · Đã hủy"
                                          : ""}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {view === "appointments" &&
                              user.role === "customer" && (
                                <button
                                  type="button"
                                  onClick={() => setReceiptBooking(b)}
                                  className="rounded-xl border border-[#DDE9F8] bg-white px-3 py-2 text-xs font-bold text-[#142B55] hover:border-[#FF765E]"
                                >
                                  In phiếu hẹn
                                </button>
                              )}
                            <span
                              className={
                                "petday-status-badge inline-flex shrink-0 items-center justify-center whitespace-nowrap " +
                                (customerFacingStatus(b) === "Hoàn tất"
                                  ? "is-complete"
                                  : customerFacingStatus(b) === "Đã hủy" ||
                                      customerFacingStatus(b) ===
                                        "Khách không đến" ||
                                      customerFacingStatus(b) ===
                                        "Không hoàn thành"
                                    ? "is-cancelled"
                                    : customerFacingStatus(b) ===
                                          "Đang thực hiện" ||
                                        customerFacingStatus(b) ===
                                          "Đang phục vụ"
                                      ? "is-progress"
                                      : customerFacingStatus(b) ===
                                          "Đã xác nhận"
                                        ? "is-confirmed"
                                        : "is-neutral")
                              }
                            >
                              {customerFacingStatus(b)}
                            </span>
                          </div>
                        </div>
                        <p>
                          <strong>{b.service}</strong> · {b.petName}
                        </p>
                        {view === "appointments" &&
                          user.role === "customer" &&
                          b.status !== "Đang chờ xác nhận" && (
                            <BookingJourney
                              status={b.status}
                              paymentStatus={b.paymentStatus}
                              careCompleted={b.careCompleted}
                            />
                          )}
                        {view === "appointments" &&
                          user.role === "customer" &&
                          b.status === "Đang chờ xác nhận" &&
                          firstUseDepositDue(b) > 0 &&
                          b.paymentMethod === "cash" &&
                          b.paymentPlan !== "FULL_PREPAY" && (
                            <div className="rounded-xl border border-[#C9DCEF] bg-[#F1F7FF] p-3">
                              <p className="text-sm font-bold text-[#142B55]">
                                Cọc 20% cần thanh toán:{" "}
                                {money(firstUseDepositDue(b))}
                              </p>
                              <p className="mt-1 text-xs text-slate-600">
                                Sau khi ghi nhận đủ cọc qua QR, lịch sẽ tự xác
                                nhận. Phần còn lại thanh toán theo phương án đã
                                chọn.
                              </p>
                              <button
                                type="button"
                                className="mt-3 rounded-xl bg-[#142B55] px-4 py-2.5 text-sm font-bold text-white"
                                onClick={() => {
                                  sessionStorage.setItem(
                                    "petday_payment_focus_booking",
                                    b.code,
                                  )
                                  setBookingFilter("all")
                                  setCustomerTab("schedule")
                                  setPaymentExpandedCode(b.code)
                                  setTimeout(
                                    () =>
                                      document
                                        .getElementById(
                                          "petday-payment-" + b.code,
                                        )
                                        ?.scrollIntoView({
                                          behavior: "smooth",
                                          block: "center",
                                        }),
                                    180,
                                  )
                                }}
                              >
                                Thanh toán cọc {money(firstUseDepositDue(b))}{" "}
                                bằng QR
                              </button>
                            </div>
                          )}
                        {view === "admin" && (
                          <p className="text-sm">Khách hàng: {b.ownerName}</p>
                        )}
                        <p className="text-sm text-slate-600">
                          {b.branch} · {b.date} · {b.slot}
                        </p>
                        <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#F4F7FC] p-3 text-xs">
                          <div>
                            <span className="block text-slate-500">
                              Tổng tiền
                            </span>
                            <strong className="text-[#142B55]">
                              {money(b.total)}
                            </strong>
                          </div>
                          <div>
                            <span className="block text-slate-500">Đã thu</span>
                            <strong className="text-[#142B55]">
                              {money(
                                Math.min(
                                  Number(b.total),
                                  Number(b.collectedPaid || 0),
                                ),
                              )}
                            </strong>
                          </div>
                          <div>
                            <span className="block text-slate-500">
                              {b.status === "Đã hủy"
                                ? "Không còn phải thu"
                                : b.status === "Không hoàn thành" ? "Chờ đối soát" : "Còn lại"}
                            </span>
                            <strong className="text-[#142B55]">
                              {b.status === "Không hoàn thành" ? "—" : money(
                                b.status === "Đã hủy"
                                  ? 0
                                  : Math.max(
                                      0,
                                      Number(b.total) -
                                        Number(b.collectedPaid || 0),
                                    ),
                              )}
                            </strong>
                          </div>
                        </div>
                        {Array.isArray(b.lineItems) &&
                          b.lineItems.some(
                            (item: any) => item.type === "addon",
                          ) && (
                            <div className="rounded-xl bg-[#F2F7FC] px-3 py-2 text-xs text-slate-600">
                              <strong className="text-[#142B55]">
                                Dịch vụ cộng thêm
                              </strong>
                              {b.lineItems
                                .filter((item: any) => item.type === "addon")
                                .map((item: any, i: number) => (
                                  <p
                                    className="mt-1 flex justify-between gap-2"
                                    key={i}
                                  >
                                    <span>{item.label}</span>
                                    <span>{money(item.amount)}</span>
                                  </p>
                                ))}
                            </div>
                          )}
                        {b.status === "Không hoàn thành" && (
                          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                            Dịch vụ đã dừng trước khi hoàn tất. PetDay sẽ liên
                            hệ để hỗ trợ xử lý chi phí, thanh toán hoặc hoàn tiền (nếu có).
                          </p>
                        )}
                        {b.noShowReason && (
                          <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-orange-900">
                            <strong>Khách không đến lịch</strong>
                            <p className="mt-1">{b.noShowReason}</p>
                            <p className="mt-1">
                              Không tự phát sinh phí hoặc đánh dấu đã thanh
                              toán.
                            </p>
                          </div>
                        )}
                        <p className="text-sm text-slate-500">
                          Thanh toán:{" "}
                          {b.paymentMethod === "bank_transfer"
                            ? "Chuyển khoản"
                            : "Tiền mặt"}{" "}
                          · {customerPaymentStatus(b)}
                        </p>
                        {view === "appointments" &&
                          user.role === "customer" && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                type="button"
                                className="rounded-xl bg-[#142B55] px-4 py-2.5 text-sm font-semibold text-white"
                                onClick={() => bookAdditionalService(b)}
                              >
                                + Đặt thêm dịch vụ khác
                              </button>
                            </div>
                          )}
                        {b.status === "Đã hủy" &&
                          refunds
                            .filter((r) => r.code === b.code)
                            .map((r) => (
                              <div
                                key={r.id}
                                className="rounded-xl border border-[#C9DCF0] bg-[#F1F7FF] p-3 text-sm"
                                aria-label={"Thông tin hoàn tiền " + b.code}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <strong className="text-[#142B55]">
                                    Hoàn tiền · {money(r.amount)}
                                  </strong>
                                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#142B55]">
                                    {r.status === "completed" &&
                                    !String(r.refundReference || "").startsWith(
                                      "TEST-",
                                    ) &&
                                    Boolean(r.refundReference)
                                      ? "Đã hoàn tiền"
                                      : r.status === "rejected"
                                        ? "Không hoàn"
                                        : "Đã xác định khoản hoàn"}
                                  </span>
                                </div>
                                <p className="mt-2 text-xs text-slate-600">
                                  Ngày hẹn: {r.appointmentDate || b.date} ·{" "}
                                  {r.appointmentSlot || b.slot}
                                </p>
                                {r.reason && (
                                  <p className="mt-1 text-xs text-slate-600">
                                    Lý do:{" "}
                                    {r.reason.replace(
                                      /^Tự xử lý theo chính sách V6\.120:\s*/,
                                      "",
                                    )}
                                  </p>
                                )}
                                {r.completedAt && (
                                  <p className="mt-1 text-xs text-slate-600">
                                    Ngày xác nhận hoàn:{" "}
                                    {new Date(r.completedAt).toLocaleString(
                                      "vi-VN",
                                    )}
                                  </p>
                                )}
                              </div>
                            ))}
                        <details className="mt-3 rounded-xl border border-[#DFE8F4] bg-[#FAFCFF] p-3">
                          <summary className="cursor-pointer text-sm font-bold text-[#142B55]">
                            {view === "admin"
                              ? "Xem chi tiết lịch, Taxi và thao tác"
                              : "Xem chi tiết: ghi chú, Taxi, nhật ký và đổi/hủy lịch"}
                          </summary>
                          <div className="mt-3 space-y-3">
                            {b.latestPaymentAt && (
                              <p className="text-xs text-slate-500">
                                Ghi nhận thu gần nhất:{" "}
                                {formatPaymentDate(b.latestPaymentAt)}
                              </p>
                            )}
                            {b.customerNote && (
                              <p className="rounded-xl bg-[#F6F9FC] p-3 text-sm text-[#142B55]">
                                <strong>Ghi chú khách hàng:</strong>{" "}
                                {b.customerNote}
                              </p>
                            )}
                            {view === "appointments" &&
                              b.status !== "Đã hủy" &&
                              b.status !== "Không hoàn thành" &&
                              b.status !== "Hoàn tất" &&
                              Number(b.total) >
                                Number(b.collectedPaid || 0) && (
                                <div className="rounded-xl border border-[#DDE9F8] bg-white p-3 text-sm">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-semibold text-[#142B55]">
                                      Thanh toán lịch {b.code}
                                    </p>
                                    {(b.paymentMethod === "bank_transfer" ||
                                      (b.status === "Đang chờ xác nhận" &&
                                        firstUseDepositDue(b) > 0)) && (
                                      <button
                                        type="button"
                                        className="rounded-lg border border-[#142B55] px-3 py-2 text-xs font-bold text-[#142B55]"
                                        onClick={() =>
                                          setPaymentExpandedCode((v) =>
                                            v === b.code ? null : b.code,
                                          )
                                        }
                                      >
                                        {paymentExpandedCode === b.code
                                          ? "Ẩn thanh toán QR"
                                          : "Mở thanh toán QR"}
                                      </button>
                                    )}
                                  </div>
                                  <p className="mt-2 text-xs text-slate-600">
                                    {b.paymentMethod === "cash" &&
                                    firstUseDepositDue(b) <= 0
                                      ? "Thanh toán tiền mặt khi dùng dịch vụ. Không cần quét QR."
                                      : "Số tiền cần thanh toán được tính từ biên nhận đã xác nhận."}
                                  </p>
                                  {paymentExpandedCode === b.code && (
                                    <p className="mt-2 text-xs font-semibold text-[#142B55]">
                                      Mã QR của lịch này đang hiển thị ở phần
                                      thanh toán phía trên.
                                    </p>
                                  )}
                                </div>
                              )}
                            {Number(b.taxiFee || 0) > 0 && (view === "admin" || view === "appointments") && (
                              <TaxiLegPanel code={b.code} token={token} role={user.role} bookingStatus={b.status} careCompleted={Boolean(b.careCompleted)} onUpdated={reload} />
                            )}
                            {view === "appointments" && (
                              <PreArrivalCard
                                key={b.code}
                                booking={b}
                                token={token}
                                onSaved={async () => {
                                  await reload()
                                }}
                              />
                            )}
                            {view === "admin" && b.intakeUpdatedAt && (
                              <div className="petday-intake-summary rounded-xl border border-[#E1EAF5] bg-[#F6F9FF] p-3 text-sm">
                                <strong className="text-[#142B55]">
                                  Lưu ý khách gửi trước khi đến
                                </strong>
                                <p className="mt-2">
                                  Liên hệ khẩn cấp: {b.intakeEmergencyPhone}
                                </p>
                                {b.intakeHealthAlerts && (
                                  <p className="mt-1 whitespace-pre-wrap">
                                    Sức khỏe / dị ứng: {b.intakeHealthAlerts}
                                  </p>
                                )}
                                {b.intakeCareInstructions && (
                                  <p className="mt-1 whitespace-pre-wrap">
                                    Yêu cầu chăm sóc: {b.intakeCareInstructions}
                                  </p>
                                )}
                              </div>
                            )}
                            {view === "admin" && ["Đã xác nhận","Đang thực hiện"].includes(b.status) && (
                              <p className="text-xs text-slate-500">
                                Tiếp nhận & bắt đầu → Hoàn tất chăm sóc. Hệ
                                thống có thể tự hoàn tất cuối ngày; tiền mặt chỉ
                                ghi nhận khi thực thu.
                              </p>
                            )}
                            {false && view === "admin" && (
                              <div className="space-y-2 rounded-xl border border-[#DDE9F8] p-3">
                                <p className="text-xs font-bold">
                                  Đối soát thanh toán
                                </p>
                                <input
                                  className={C}
                                  value={paymentRefs[b.code] || ""}
                                  onChange={(e) =>
                                    setPaymentRefs((x) => ({
                                      ...x,
                                      [b.code]: e.target.value,
                                    }))
                                  }
                                  placeholder={
                                    b.paymentMethod === "bank_transfer"
                                      ? "Mã giao dịch ngân hàng (bắt buộc khi xác nhận)"
                                      : "Mã biên nhận (nếu có)"
                                  }
                                />
                                <input
                                  className={C}
                                  value={paymentNotes[b.code] || ""}
                                  onChange={(e) =>
                                    setPaymentNotes((x) => ({
                                      ...x,
                                      [b.code]: e.target.value,
                                    }))
                                  }
                                  placeholder="Ghi chú / lý do điều chỉnh"
                                />
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    className="rounded-lg border px-3 py-2 text-xs"
                                    disabled={
                                      busy ||
                                      b.paymentStatus === "Đã thanh toán"
                                    }
                                    onClick={() =>
                                      recordPayment(
                                        b.code,
                                        b.paymentMethod || "cash",
                                        "Đã thanh toán",
                                      )
                                    }
                                  >
                                    Xác nhận đã nhận tiền
                                  </button>
                                  <button
                                    className="rounded-lg border px-3 py-2 text-xs"
                                    disabled={
                                      busy ||
                                      b.paymentStatus === "Chưa thanh toán"
                                    }
                                    onClick={() =>
                                      recordPayment(
                                        b.code,
                                        b.paymentMethod || "cash",
                                        "Chưa thanh toán",
                                      )
                                    }
                                  >
                                    Điều chỉnh chưa thanh toán
                                  </button>
                                </div>
                              </div>
                            )}
                            {view === "admin" && (
                              <div className="rounded-xl bg-[#F3F7FC] p-3 text-xs text-[#142B55]">
                                <p className="mb-2 font-bold">
                                  Tiến trình sử dụng dịch vụ
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    "Đã xác nhận",
                                    "Đang thực hiện",
                                    b.status === "Không hoàn thành" ? "Không hoàn thành" : "Hoàn tất",
                                  ].map((st, i) => {
                                    const current =
                                      b.status === "Đang chờ xác nhận"
                                        ? b.paymentMethod === "bank_transfer" ||
                                          b.paymentPlan === "FULL_PREPAY"
                                          ? "Chờ thanh toán toàn bộ"
                                          : "Chờ cọc 20%"
                                        : b.status === "Đang thực hiện" &&
                                            b.careCompleted
                                          ? "Đang thực hiện"
                                          : b.status
                                    const order = [
                                      "Đã xác nhận",
                                      "Đang thực hiện",
                                      b.status === "Không hoàn thành" ? "Không hoàn thành" : "Hoàn tất",
                                    ]
                                    return (
                                      <span
                                        key={st}
                                        className={
                                          "rounded-full px-2 py-1 " +
                                          (current === st
                                            ? st === "Không hoàn thành" ? "bg-red-100 text-red-800" : "bg-[#142B55] text-white"
                                            : order.indexOf(String(current)) > i
                                              ? "bg-[#DCEEFF]"
                                              : "bg-white text-slate-400")
                                        }
                                      >
                                        {i + 1}. {st}
                                      </span>
                                    )
                                  })}
                                </div>
                                {b.status === "Đã hủy" && (
                                  <p className="mt-2 font-bold text-red-600">
                                    {b.noShowReason
                                      ? "Lịch đã đóng vì khách không đến."
                                      : b.paymentHoldExpired ? "Lịch hết hạn giữ chỗ do chưa thanh toán." : "Lịch đã hủy."}
                                  </p>
                                )}
                                {b.status === "Đang thực hiện" &&
                                  b.careCompleted &&
                                  !b.petHandedOver && (
                                    <p className="mt-2 font-bold text-amber-800">
                                      Chăm sóc đã xong. Nếu còn công nợ, Admin
                                      cần ghi nhận khoản thực thu; Pet Taxi là
                                      tiện ích đi kèm.
                                    </p>
                                  )}
                                {b.status === "Hoàn tất" && !b.rating && (
                                  <p className="mt-2">
                                    Dịch vụ đã hoàn tất. Bạn có thể gửi đánh giá
                                    ở phần bên dưới.
                                  </p>
                                )}
                              </div>
                            )}
                            <div className="rounded-xl border border-[#DDE9F8] bg-white p-3">
                              <button
                                type="button"
                                className="w-full text-left text-sm font-bold text-[#142B55]"
                                onClick={() => showTimeline(b.code)}
                                aria-expanded={timelineOpen === b.code}
                              >
                                🕒{" "}
                                {view === "admin" && ["Đã xác nhận", "Đang thực hiện"].includes(b.status)
                                  ? "Thao tác & nhật ký chăm sóc"
                                  : "Nhật ký chăm sóc"}{" "}
                                {timelineOpen === b.code ? "−" : "+"}
                              </button>
                              {timelineOpen === b.code && (
                                <div className="mt-3 space-y-3 border-t pt-3">
                                  {(timelineData[b.code] || []).length ? (
                                    (timelineData[b.code] || []).map(
                                      (e: any) => (
                                        <div
                                          key={e.id}
                                          className="flex flex-col gap-3 border-l-2 border-[#FF765E] pl-3 text-sm sm:flex-row sm:items-start sm:justify-between"
                                        >
                                          <div className="min-w-0 flex-1"><strong>
                                            {({
                                              pet_arrived:
                                                "Đã tiếp nhận pet tại cơ sở",
                                              check_in: "Đã bắt đầu dịch vụ",
                                              care_update: "Cập nhật chăm sóc",
                                              ready: "Sẵn sàng bàn giao",
                                              check_out: "Đã hoàn tất chăm sóc",
                                              pet_handed_over:
                                                "Đã bàn giao pet cho khách",
                                              incomplete:
                                                "Dịch vụ không hoàn thành",
                                            } as Record<string, string>)[
                                              e.eventType
                                            ] || e.eventType}
                                          </strong>
                                          <p className="text-xs text-slate-500">
                                            {new Date(
                                              e.createdAt,
                                            ).toLocaleString("vi-VN")}{" "}
                                            · Ghi nhận:{" "}
                                            {e.recordedBy || e.staffName}
                                          </p>
                                          {e.eventType === "incomplete" ? <div className="mt-2 rounded-lg bg-amber-50 p-2 text-amber-950"><p><strong>Lý do:</strong> {readIncompleteNote(e.note).reason}</p><p className="mt-1 whitespace-pre-wrap"><strong>Ghi chú:</strong> {readIncompleteNote(e.note).note || "Chưa có ghi chú"}</p></div> : <p className="mt-1 whitespace-pre-wrap text-slate-700">{e.note}</p>}</div>
                                          <CareEventImageGallery images={e.images || []} legacyPhotoUrl={e.photoUrl} token={token}/>
                                        </div>
                                      ),
                                    )
                                  ) : (
                                    <p className="text-xs text-slate-500">
                                      Chưa có bản ghi chăm sóc; Admin sẽ cập
                                      nhật khi tiếp nhận thú cưng.
                                    </p>
                                  )}
                                  {view === "admin" &&
                                    ["Đã xác nhận", "Đang thực hiện"].includes(
                                      b.status,
                                    ) && (
                                      <div className="space-y-2 rounded-xl bg-[#F2F7FC] p-3">
                                        <label className="block text-xs font-bold">
                                          Ghi chú thao tác / tình trạng thú cưng
                                          (không bắt buộc)
                                          <textarea
                                            maxLength={1200}
                                            rows={2}
                                            className={C + " mt-1"}
                                            value={milestoneNotes[b.code] || ""}
                                            onChange={(ev) =>
                                              setMilestoneNotes((x) => ({
                                                ...x,
                                                [b.code]: ev.target.value,
                                              }))
                                            }
                                            placeholder="Nhập ghi chú về tình trạng thú cưng..."
                                          />
                                        </label>
                                        {!milestoneImageRetries[b.code] && <CareImagePicker files={milestoneImages[b.code] || []} onChange={(files)=>setMilestoneImages(current=>({...current,[b.code]:files}))} onError={setError} disabled={busy}/>}

                                        <div className="flex flex-wrap gap-2">
                                          {b.status === "Đã xác nhận" && (
                                            <>
                                              <button
                                                disabled={
                                                  busy || Boolean(milestoneImageRetries[b.code]) ||
                                                  !!(
                                                    timelineData[b.code] || []
                                                  ).some(
                                                    (e: any) =>
                                                      e.eventType ===
                                                        "pet_arrived" ||
                                                      e.eventType ===
                                                        "check_in",
                                                  )
                                                }
                                                type="button"
                                                className={B + " text-xs"}
                                                onClick={() =>
                                                  postMilestone(
                                                    b.code,
                                                    "pet_arrived",
                                                  )
                                                }
                                              >
                                                ✓ Tiếp nhận & bắt đầu chăm sóc
                                              </button>
                                              <button
                                                type="button"
                                                className="rounded-lg border border-[#142B55] px-3 py-2 text-xs"
                                                onClick={() =>
                                                  reloadTimeline(b.code)
                                                }
                                              >
                                                Làm mới nhật ký
                                              </button>
                                            </>
                                          )}
                                          {b.status === "Đang thực hiện" &&
                                            !b.careCompleted && (
                                              <>
                                                <button
                                                  disabled={busy||Boolean(milestoneImageRetries[b.code])}
                                                  type="button"
                                                  className={B + " text-xs"}
                                                  onClick={() => void openCareCompletion(b)}
                                                >
                                                  Hoàn tất chăm sóc
                                                </button>
                                                {user.role === "admin" && <button type="button" disabled={busy||Boolean(milestoneImageRetries[b.code])} aria-expanded={incompleteOpen===b.code} onClick={()=>setIncompleteOpen(v=>v===b.code?null:b.code)} className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-800">Không hoàn thành</button>}
                                                <button
                                                  disabled={busy||Boolean(milestoneImageRetries[b.code])}
                                                  type="button"
                                                  className="rounded-lg border border-[#142B55] bg-white px-3 py-2 text-xs font-bold"
                                                  onClick={() =>
                                                    postMilestone(
                                                      b.code,
                                                      "care_update",
                                                    )
                                                  }
                                                >
                                                  + Ghi chú chăm sóc
                                                </button>
                                              </>
                                            )}
                                          {b.status === "Đang thực hiện" &&
                                            b.careCompleted && (
                                              <div className="w-full space-y-2">
                                                <p className="rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-900">
                                                  Chăm sóc đã hoàn tất. Nếu còn tiền mặt chưa thu, xác nhận thực thu trong mục Thanh toán & hóa đơn.
                                                </p>
                                                {(!b.taxiReturnState ||
                                                  [
                                                    "cancelled",
                                                    "customer_self",
                                                    "provider_fault",
                                                    "no_show",
                                                  ].includes(
                                                    b.taxiReturnState,
                                                  )) &&
                                                  false && (
                                                    <button
                                                      disabled={busy}
                                                      type="button"
                                                      className={B + " text-xs"}
                                                      onClick={() =>
                                                        postMilestone(
                                                          b.code,
                                                          "pet_handed_over",
                                                        )
                                                      }
                                                    >
                                                      ✓ Xác nhận khách đã nhận
                                                      pet trực tiếp
                                                    </button>
                                                  )}
                                              </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                          Xác nhận thực thu khi hoàn tất lịch thanh toán tiền mặt.
                                        </p>
                                      </div>
                                    )}
                                  {b.status === "Không hoàn thành" && !(timelineData[b.code]||[]).some((e:any)=>e.eventType==="incomplete") && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><p>Chưa có lý do dừng dịch vụ được lưu trong nhật ký.</p>{view === "admin" && user.role === "admin" && <button type="button" className="mt-2 rounded-lg border border-amber-400 bg-white px-3 py-2 font-bold" onClick={()=>setIncompleteOpen(v=>v===b.code?null:b.code)}>Bổ sung lý do đã xác minh</button>}</div>}
                        {view === "admin" &&
                          user.role === "admin" &&
                          ((b.status === "Đang thực hiện" && !b.careCompleted) || (b.status === "Không hoàn thành" && !(timelineData[b.code]||[]).some((e:any)=>e.eventType==="incomplete"))) && incompleteOpen===b.code && (
                            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
                              <p className="text-sm font-extrabold text-amber-950">{b.status === "Không hoàn thành" ? "Bổ sung lý do dừng dịch vụ" : "Ghi nhận dừng dịch vụ"}</p>
                              <p className="mt-2 text-xs text-amber-900">
                                {b.status === "Không hoàn thành" ? "Chỉ bổ sung lý do đã được xác minh cho lịch cũ. Hệ thống lưu thời điểm bổ sung hiện tại." : "Chỉ dùng khi dịch vụ phải dừng giữa chừng, không dùng cho công nợ. Không tự ghi thu hoặc hoàn tiền."}
                              </p>
                              <label className="mt-3 block text-xs font-bold">
                                Lý do dừng
                                <select
                                  className={C + " mt-1"}
                                  value={incompleteReasons[b.code] || ""}
                                  onChange={(e) =>
                                    setIncompleteReasons((v) => ({
                                      ...v,
                                      [b.code]: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Chọn lý do</option>
                                  <option value="pet_health">
                                    Sức khỏe thú cưng
                                  </option>
                                  <option value="pet_behavior">
                                    Thú cưng không hợp tác hoặc mất an toàn
                                  </option>
                                  <option value="customer_request">
                                    Khách yêu cầu dừng giữa chừng
                                  </option>
                                  <option value="equipment">
                                    Sự cố thiết bị
                                  </option>
                                  <option value="staff_issue">
                                    Sự cố nhân sự
                                  </option>
                                  <option value="force_majeure">
                                    Bất khả kháng
                                  </option>
                                  <option value="other">Lý do khác</option>
                                </select>
                              </label>
                              <label className="mt-3 block text-xs font-bold">
                                Ghi chú bắt buộc
                                <textarea
                                  className={C + " mt-1"}
                                  rows={3}
                                  maxLength={1200}
                                  placeholder="Mô tả tình huống, phần đã thực hiện, phương án liên hệ khách (ít nhất 10 ký tự)"
                                  value={incompleteNotes[b.code] || ""}
                                  onChange={(e) =>
                                    setIncompleteNotes((v) => ({
                                      ...v,
                                      [b.code]: e.target.value,
                                    }))
                                  }
                                />
                              </label>
                              {b.status === "Không hoàn thành" && <CareImagePicker files={milestoneImages[b.code] || []} onChange={(files)=>setMilestoneImages(current=>({...current,[b.code]:files}))} onError={setError} disabled={busy}/>}
                              {b.status !== "Không hoàn thành" && <p className="mt-2 text-xs text-slate-600">Ảnh đã chọn ở trên sẽ được đính kèm mốc dừng dịch vụ.</p>}
                              <button
                                type="button"
                                className="mt-3 rounded-xl bg-amber-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                                disabled={
                                  busy || Boolean(milestoneImageRetries[b.code]) ||
                                  !incompleteReasons[b.code] ||
                                  (incompleteNotes[b.code] || "").trim()
                                    .length < 10
                                }
                                onClick={async () => {
                                  if (
                                    !window.confirm(
                                      b.status === "Không hoàn thành" ? "Bổ sung lý do đã xác minh cho lịch cũ?" : "Xác nhận dừng dịch vụ trước khi hoàn tất? Không tự thay đổi thanh toán.",
                                    )
                                  )
                                    return
                                  await run(async () => {
                                    const created = await api(
                                      "/admin/bookings/" +
                                        encodeURIComponent(b.code) +
                                        "/incomplete",
                                      "POST",
                                      {
                                        reason: incompleteReasons[b.code],
                                        note: incompleteNotes[b.code].trim(),
                                        supplement: b.status === "Không hoàn thành",
                                      },
                                      token,
                                    )
                                    const files = milestoneImages[b.code] || []
                                    let failed:File[] = []
                                    let imageError = ""
                                    if(files.length){
                                      try { await uploadCareEventImages(b.code, Number(created.id), files, token) }
                                      catch(error){ failed = error instanceof CareImageUploadError ? error.failedFiles : files; imageError = error instanceof Error ? error.message : "Không tải được ảnh." }
                                    }
                                    setMilestoneImages(x=>({...x,[b.code]:failed}))
                                    setMilestoneImageRetries(x=>({...x,[b.code]:failed.length?{eventId:Number(created.id)}:undefined}))
                                    setIncompleteReasons(x=>({...x,[b.code]:""}))
                                    setIncompleteNotes(x=>({...x,[b.code]:""}))
                                    setMilestoneNotes(x=>({...x,[b.code]:""}))
                                    setIncompleteOpen(null)
                                    await reload()
                                    const updated = await api("/bookings/"+encodeURIComponent(b.code)+"/timeline","GET",undefined,token)
                                    setTimelineData(x=>({...x,[b.code]:updated.events}))
                                    setTimelineOpen(b.code)
                                    if(imageError){setError("Đã lưu lý do, nhưng ảnh chưa tải lên: "+imageError);return}
                                    setNotice(
                                      "Đã ghi nhận Không hoàn thành và thông báo khách hàng. Thanh toán/hoàn tiền cần xử lý riêng.",
                                    )
                                  })
                                }}
                              >
                                {b.status === "Không hoàn thành" ? "Lưu lý do bổ sung" : "Xác nhận Không hoàn thành"}
                              </button>
                            </div>
                          )}

                                        {milestoneImageRetries[b.code]&&<div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><p>Ảnh vẫn được giữ trên trình duyệt và chưa được ghi nhận trên server.</p><CareImagePicker files={milestoneImages[b.code] || []} onChange={(files)=>{setMilestoneImages(x=>({...x,[b.code]:files}));if(!files.length)setMilestoneImageRetries(x=>({...x,[b.code]:undefined}))}} onError={setError} disabled={busy}/><button type="button" disabled={busy||!(milestoneImages[b.code]||[]).length} onClick={()=>void retryMilestoneImages(b.code)} className="mt-2 min-h-11 rounded-xl bg-[#142B55] px-4 py-2 font-bold text-white disabled:opacity-45">{busy?"Đang tải lại...":"Thử tải lại ảnh"}</button></div>}
                                </div>
                              )}
                            </div>
                            {view === "admin" && b.paymentMethod === "cash" && b.paymentPlan !== "FULL_PREPAY" && b.paymentStatus !== "Đã thanh toán" && ((b.status === "Đang thực hiện" && b.careCompleted) || b.status === "Hoàn tất") && (
                              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                                <strong>Chăm sóc xong · Chờ thanh toán</strong>
                                <p className="mt-1 text-xs">Nhân viên liên hệ khách để thu khoản còn thiếu. Khi đã nhận đủ tiền mặt, xác nhận thực thu tại đây.</p>
                                <button type="button" disabled={busy} onClick={()=>void collectRemainingCareCash(b)} className={B+" mt-2 text-xs"}>Xác nhận thu đủ tiền còn lại</button>
                              </div>
                            )}
                            {view === "admin" && (b.status === "Không hoàn thành" ? <details className="rounded-xl border border-[#DDE9F8] bg-white p-3"><summary className="cursor-pointer text-sm font-bold text-[#142B55]">Thanh toán & hóa đơn</summary><p className="mt-2 text-sm text-slate-600">Thực thu: {money(Number(b.collectedPaid||0))}. Chi phí cuối cùng chưa quyết toán.</p></details> : <BookingFinancialSnapshot code={b.code} token={token} />)}
                            {b.careNotes && (
                              <p className="rounded-xl bg-blue-50 p-3 text-sm">
                                Nhật ký chăm sóc: {b.careNotes}
                              </p>
                            )}
                            {b.rating && (
                              <p className="text-sm">
                                Đánh giá {b.rating}/5 · {b.comment}
                              </p>
                            )}
                            {view === "appointments" ? (
                              <>
                                {false &&
                                  ["Đang chờ xác nhận", "Đã xác nhận"].includes(
                                    b.status,
                                  ) && (
                                    <div className="space-y-3 rounded-xl bg-[#F2F7FC] p-4">
                                      <h3 className="text-sm font-extrabold text-[#142B55]">
                                        Gửi đề nghị đổi ngày / giờ
                                      </h3>
                                      <p className="text-xs text-slate-500">
                                        Lịch cũ được giữ nguyên đến khi nhân
                                        viên duyệt. Mỗi lịch chỉ có một yêu cầu
                                        đang chờ.
                                      </p>
                                      <div className="grid gap-2 sm:grid-cols-2">
                                        <label className="text-xs">
                                          Ngày mới
                                          <input
                                            type="date"
                                            min={tomorrow()}
                                            className={C + " mt-1"}
                                            value={newDates[b.code] || ""}
                                            onChange={(e) =>
                                              setNewDates((x) => ({
                                                ...x,
                                                [b.code]: e.target.value,
                                              }))
                                            }
                                          />
                                        </label>
                                        <label className="text-xs">
                                          Khung giờ mới
                                          <select
                                            className={C + " mt-1"}
                                            value={newSlots[b.code] || "08:00"}
                                            onChange={(e) =>
                                              setNewSlots((x) => ({
                                                ...x,
                                                [b.code]: e.target.value,
                                              }))
                                            }
                                          >
                                            {[
                                              "08:00",
                                              "09:30",
                                              "11:00",
                                              "12:30",
                                              "14:00",
                                              "15:30",
                                              "17:00",
                                              "18:30",
                                            ].map((x) => (
                                              <option key={x}>{x}</option>
                                            ))}
                                          </select>
                                        </label>
                                      </div>
                                      <label className="text-xs">
                                        Lý do đổi lịch
                                        <textarea
                                          className={C + " mt-1"}
                                          maxLength={500}
                                          value={changeReasons[b.code] || ""}
                                          onChange={(e) =>
                                            setChangeReasons((x) => ({
                                              ...x,
                                              [b.code]: e.target.value,
                                            }))
                                          }
                                          placeholder="Ví dụ: Cần đổi giờ vì lịch công việc"
                                        />
                                      </label>
                                      <button
                                        className={B}
                                        disabled={
                                          busy ||
                                          !newDates[b.code] ||
                                          (changeReasons[b.code] || "").trim()
                                            .length < 5
                                        }
                                        onClick={() =>
                                          requestReschedule(b.code)
                                        }
                                      >
                                        {appointmentStartMs(b) - Date.now() <=
                                        3600000
                                          ? "Gửi nhân viên xem xét"
                                          : "Xác nhận đổi lịch tự động"}
                                      </button>
                                    </div>
                                  )}
                                {view === "appointments" &&
                                  ["Hoàn tất", "Đã hủy"].includes(b.status) && (
                                    <button
                                      className="rounded-xl border border-[#142B55] px-4 py-2 text-sm font-semibold text-[#142B55]"
                                      disabled={busy}
                                      onClick={() => bookAgain(b)}
                                    >
                                      Đặt lại dịch vụ
                                    </button>
                                  )}
                                {view === "appointments" &&
                                  user.role === "customer" &&
                                  (canCustomerReschedule(b) ||
                                    canCustomerCancelRequest(b)) && (
                                    <div className="flex flex-wrap items-center justify-start gap-2.5">
                                      {canCustomerReschedule(b) && (
                                        <button
                                          type="button"
                                          disabled={busy}
                                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#162E59] px-[18px] py-[11px] text-sm font-semibold text-white transition-colors hover:bg-[#102445] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF765E] disabled:cursor-not-allowed disabled:opacity-45"
                                          onClick={() =>
                                            focusBookingAction(
                                              b.code,
                                              "reschedule",
                                            )
                                          }
                                        >
                                          <CalendarClockIcon />
                                          Đổi lịch
                                        </button>
                                      )}
                                      {canCustomerCancelRequest(b) && (
                                        <button
                                          type="button"
                                          disabled={busy}
                                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#F9C4B9] bg-[#FFF2EF] px-[18px] py-[11px] text-sm font-semibold text-[#C9513D] transition-colors hover:bg-[#FFE5DE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9513D] disabled:cursor-not-allowed disabled:opacity-45"
                                          onClick={() =>
                                            focusBookingAction(b.code, "cancel")
                                          }
                                        >
                                          <CalendarXIcon />
                                          Hủy lịch
                                        </button>
                                      )}
                                    </div>
                                  )}
                                {b.status === "Hoàn tất" && !b.rating && (
                                  <div className="space-y-2 border-t pt-3">
                                    <p className="font-semibold">
                                      Đánh giá dịch vụ
                                    </p>
                                    <div
                                      role="radiogroup"
                                      aria-label="Chọn số sao đánh giá"
                                      className="flex flex-wrap items-center gap-1"
                                    >
                                      {[1, 2, 3, 4, 5].map((score) => (
                                        <button
                                          key={score}
                                          type="button"
                                          role="radio"
                                          aria-checked={
                                            (rating[b.code] || 5) === score
                                          }
                                          aria-label={`${score} sao`}
                                          title={`${score} sao`}
                                          className={`rounded-lg px-1.5 py-1 text-3xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#142B55] ${
                                            score <= (rating[b.code] || 5)
                                              ? "text-amber-500"
                                              : "text-slate-300"
                                          }`}
                                          onClick={() =>
                                            setRating((v) => ({
                                              ...v,
                                              [b.code]: score,
                                            }))
                                          }
                                        >
                                          ★
                                        </button>
                                      ))}
                                      <span className="ml-2 text-sm font-semibold text-[#142B55]">
                                        {rating[b.code] || 5}/5 sao
                                      </span>
                                    </div>
                                    <textarea
                                      className={C}
                                      value={reviewText[b.code] || ""}
                                      onChange={(e) =>
                                        setReviewText((v) => ({
                                          ...v,
                                          [b.code]: e.target.value,
                                        }))
                                      }
                                      placeholder="Chia sẻ trải nghiệm chăm sóc"
                                    />
                                    <button
                                      className={B}
                                      disabled={
                                        busy || !reviewText[b.code]?.trim()
                                      }
                                      onClick={() =>
                                        update(
                                          `/bookings/${b.code}/review`,
                                          "POST",
                                          {
                                            rating: rating[b.code] || 5,
                                            comment: reviewText[b.code],
                                          },
                                        )
                                      }
                                    >
                                      Gửi đánh giá
                                    </button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="space-y-2 border-t pt-3">
                                {b.status === "Đang chờ xác nhận" &&
                                  b.paymentMethod === "bank_transfer" &&
                                  b.paymentStatus !== "Đã thanh toán" && (
                                    <p className="text-xs text-slate-500">
                                      Khoản chuyển khoản được theo dõi tại mục
                                      Thanh toán; lịch vẫn được giữ chỗ theo
                                      chính sách.
                                    </p>
                                  )}
                                {(canAdminPropose(b) || canAdminCancel(b) || (b.status === "Đã xác nhận" && b.date < todayLocal && !b.noShowAt)) && <details className="rounded-xl border border-[#DDE9F8] bg-white p-3"><summary className="cursor-pointer text-sm font-bold text-[#142B55]">Tác vụ khác</summary><div className="space-y-2">                            {view === "admin" &&
                              user.role === "admin" &&
                              canAdminPropose(b) && (
                                <details
                                  id={"admin-proposal-" + b.code}
                                  className="mt-3 rounded-xl border border-[#DDE9F8] bg-[#F7FAFF] p-3"
                                >
                                  <summary className="cursor-pointer text-sm font-bold text-[#142B55]">
                                    Đổi lịch trực tiếp
                                  </summary>
                                  <p className="mt-2 text-xs text-slate-600">
                                    Admin chọn giờ còn chỗ, nhập lý do (bắt
                                    buộc). Hệ thống cập nhật trực tiếp và thông
                                    báo khách. Pet Taxi đi kèm được nhân viên
                                    liên hệ sắp xếp lại khi cần.
                                  </p>
                                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                    <label className="text-xs font-bold">
                                      Ngày đề xuất
                                      <input
                                        type="date"
                                        min={todayLocal}
                                        className={C + " mt-1"}
                                        value={newDates[b.code] || ""}
                                        onChange={(e) =>
                                          setNewDates((v) => ({
                                            ...v,
                                            [b.code]: e.target.value,
                                          }))
                                        }
                                      />
                                    </label>
                                    <label className="text-xs font-bold">
                                      Giờ đề xuất
                                      <select
                                        className={C + " mt-1"}
                                        value={newSlots[b.code] || "08:00"}
                                        onChange={(e) =>
                                          setNewSlots((v) => ({
                                            ...v,
                                            [b.code]: e.target.value,
                                          }))
                                        }
                                      >
                                        {[
                                          "08:00",
                                          "09:30",
                                          "11:00",
                                          "12:30",
                                          "14:00",
                                          "15:30",
                                          "17:00",
                                          "18:30",
                                        ].map((h) => (
                                          <option key={h}>{h}</option>
                                        ))}
                                      </select>
                                    </label>
                                  </div>
                                  <label className="mt-2 block text-xs font-bold">
                                    Nguồn yêu cầu
                                    <select
                                      className={C + " mt-1"}
                                      value={
                                        adminRescheduleOrigin[b.code] ||
                                        "provider"
                                      }
                                      onChange={(e) =>
                                        setAdminRescheduleOrigin((v) => ({
                                          ...v,
                                          [b.code]: e.target
                                            .value as "provider" | "customer",
                                        }))
                                      }
                                    >
                                      <option value="provider">
                                        PetDay chủ động đổi
                                      </option>
                                      <option value="customer">
                                        Đổi theo yêu cầu khách
                                      </option>
                                    </select>
                                  </label>
                                  <label className="mt-2 block text-xs font-bold">
                                    Lý do thay đổi (bắt buộc)
                                    <textarea
                                      className={C + " mt-1 min-h-16"}
                                      value={changeReasons[b.code] || ""}
                                      maxLength={500}
                                      onChange={(e) =>
                                        setChangeReasons((v) => ({
                                          ...v,
                                          [b.code]: e.target.value,
                                        }))
                                      }
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    className={B + " mt-2"}
                                    disabled={
                                      busy ||
                                      !newDates[b.code] ||
                                      (changeReasons[b.code] || "").trim()
                                        .length < 5 ||
                                      (newDates[b.code] ===
                                        b.date.slice(0, 10) &&
                                        (newSlots[b.code] || "08:00") ===
                                          b.slot.slice(0, 5))
                                    }
                                    onClick={() =>
                                      proposeAdminReschedule(b.code)
                                    }
                                  >
                                    Xác nhận đổi lịch ngay
                                  </button>
                                </details>
                              )}
                                {b.status === "Đã xác nhận" && b.date < todayLocal &&
                                  !b.noShowAt &&
                                  b.taxiStatus !== "completed" &&
                                  view === "admin" && (
                                    <details className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
                                      <summary className="cursor-pointer text-sm font-bold text-orange-900">
                                        Xác minh khách không đến (dự phòng)
                                      </summary>
                                      <p className="text-xs font-semibold text-orange-900">
                                        Hệ thống tự ghi nhận No-show cuối ngày nếu chưa tiếp nhận thú cưng. Chỉ dùng thao tác này khi cần xử lý dự phòng theo chính sách.
                                      </p>
                                      <input
                                        className={C + " mt-2"}
                                        aria-label={"Lý do vắng mặt " + b.code}
                                        placeholder="Lý do xác minh khách vắng mặt (ít nhất 8 ký tự)"
                                        value={noShowNotes[b.code] || ""}
                                        onChange={(e) =>
                                          setNoShowNotes((v) => ({
                                            ...v,
                                            [b.code]: e.target.value,
                                          }))
                                        }
                                      />
                                      <button
                                        className="mt-2 rounded-xl border border-orange-300 px-4 py-2 text-sm text-orange-800"
                                        disabled={
                                          busy ||
                                          Date.now() <
                                            Date.parse(
                                              String(b.date).slice(0, 10) +
                                                "T23:59:59.999+07:00",
                                            )
                                        }
                                        onClick={() => markNoShow(b.code)}
                                      >
                                        Ghi nhận khách không đến
                                      </button>
                                      <p className="mt-2 text-xs text-orange-800">
                                        Chỉ đóng lịch sau khi kết thúc ngày hẹn,
                                        nếu thú cưng chưa được tiếp nhận. Taxi
                                        không gặp khách không đồng nghĩa pet
                                        vắng mặt tại cơ sở.
                                      </p>
                                    </details>
                                  )}
                                {canAdminCancel(b) && (
                                  <details className="mt-3 space-y-2 rounded-xl border border-orange-200 bg-orange-50 p-4">
                                    <summary className="cursor-pointer text-sm font-bold text-orange-900">
                                      Hủy lịch
                                    </summary>
                                    <p className="text-sm font-bold text-[#142B55]">
                                      Admin hủy lịch · chọn nguyên nhân
                                    </p>
                                    <label className="block text-xs font-semibold">
                                      Nguồn hủy
                                      <select
                                        className={C + " mt-1"}
                                        value={
                                          adminCancelOrigin[b.code] ||
                                          "customer_assisted"
                                        }
                                        onChange={(e) =>
                                          setAdminCancelOrigin((v) => ({
                                            ...v,
                                            [b.code]: e.target
                                              .value as "customer_assisted" | "provider_unavailable",
                                          }))
                                        }
                                      >
                                        <option value="customer_assisted">
                                          Hủy hộ theo yêu cầu của khách · theo
                                          mốc thời gian
                                        </option>
                                        <option value="provider_unavailable">
                                          PetDay không thể phục vụ · hoàn 100%
                                          khoản đã thu
                                        </option>
                                      </select>
                                    </label>
                                    <p className="text-xs text-slate-700">
                                      {(adminCancelOrigin[b.code] ||
                                        "customer_assisted") ===
                                      "customer_assisted"
                                        ? cancellationPreview(
                                            b.date,
                                            b.slot,
                                            Number(b.total || 0),
                                            Number(b.collectedPaid || 0),
                                            reschedules.some(
                                              (r) =>
                                                r.bookingCode === b.code &&
                                                r.status === "approved" &&
                                                Number(r.requestedBy) ===
                                                  Number(r.customerId),
                                            ),
                                            Number(b.collectedPaid || 0) > 0 &&
                                              Number(b.collectedPaid || 0) <
                                                Number(b.total || 0),
                                          ).label
                                        : "PetDay chủ động hủy vì không thể phục vụ: hoàn 100% khoản đã thực thu của đơn, gồm Pet Taxi. Chỉ ghi đã hoàn sau khi xác minh tiền thực trả."}
                                    </p>
                                    <label className="block text-xs font-semibold">
                                      Lý do thực tế (bắt buộc)
                                      <textarea
                                        className={C + " mt-1"}
                                        maxLength={800}
                                        rows={2}
                                        placeholder="Ghi rõ lý do hủy và thông tin đối chiếu"
                                        value={adminCancelReason[b.code] || ""}
                                        onChange={(e) =>
                                          setAdminCancelReason((v) => ({
                                            ...v,
                                            [b.code]: e.target.value,
                                          }))
                                        }
                                      />
                                    </label>

                                    <button
                                      className="rounded-xl border border-rose-300 bg-white px-4 py-3 text-sm font-semibold text-rose-800 disabled:opacity-40"
                                      disabled={
                                        busy ||
                                        (adminCancelReason[b.code] || "").trim()
                                          .length < 10
                                      }
                                      onClick={() => adminCancelBooking(b)}
                                    >
                                      Xác nhận hủy lịch theo nguyên nhân
                                    </button>
                                    <p className="text-xs text-slate-600">
                                      Nếu khách đã gửi yêu cầu hủy đang chờ, hãy
                                      vào Duyệt yêu cầu hủy lịch; không dùng
                                      luồng này để bỏ qua xét duyệt.
                                    </p>
                                  </details>
                                )}
</div></details>}
                                {b.status === "Hoàn tất" && (
                                  <div className="space-y-2">
                                    <label className="block text-sm font-semibold">
                                      Nhật ký chăm sóc
                                      <textarea
                                        className={C + " mt-1"}
                                        value={careText[b.code] || ""}
                                        onChange={(e) =>
                                          setCareText((v) => ({
                                            ...v,
                                            [b.code]: e.target.value,
                                          }))
                                        }
                                        placeholder="Mô tả các công việc đã thực hiện và tình trạng thú cưng"
                                      />
                                    </label>
                                    <button
                                      className={B}
                                      disabled={
                                        busy || !careText[b.code]?.trim()
                                      }
                                      onClick={() =>
                                        update(
                                          `/bookings/${b.code}/care`,
                                          "PUT",
                                          {
                                            notes: careText[b.code],
                                            careDate: new Date()
                                              .toISOString()
                                              .slice(0, 10),
                                          },
                                        )
                                      }
                                    >
                                      Lưu nhật ký chăm sóc
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </details>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
            {view === "appointments" && user.role === "customer" && (
              <>
                <section
                  id="customer-reviews"
                  hidden
                  className={card + " scroll-mt-32"}
                >
                  <h2 className="text-xl font-extrabold text-[#142B55]">
                    Đánh giá dịch vụ
                  </h2>
                  <p className="my-2 text-sm text-slate-500">
                    Sau khi nhân viên hoàn tất dịch vụ, khách có thể đánh giá
                    một lần cho mỗi lịch. Biểu mẫu gửi đánh giá nằm trong chi
                    tiết lịch hoàn tất.
                  </p>
                  {bookings
                    .filter((b) => b.status === "Hoàn tất" || b.rating)
                    .map((b) => (
                      <div key={b.code} className="my-2 rounded-xl border p-4">
                        <strong>{b.service}</strong> · {b.petName}{" "}
                        <span className="text-sm text-slate-500">
                          ({b.code})
                        </span>
                        <p className="mt-2 text-sm">
                          {b.rating
                            ? `Đã đánh giá: ${b.rating}/5 sao — ${b.comment || ""}`
                            : "Có thể gửi đánh giá tại chi tiết lịch hẹn"}
                        </p>
                      </div>
                    ))}
                  {!bookings.some(
                    (b) => b.status === "Hoàn tất" || b.rating,
                  ) && (
                    <p className="text-sm text-slate-500">
                      Chưa có dịch vụ hoàn tất đủ điều kiện đánh giá.
                    </p>
                  )}
                </section>
              </>
            )}
            {view === "account" && user.role === "customer" && (
              <>
                <section
                  id="account-settings"
                  className={card + " scroll-mt-32"}
                >
                  <h2 className="text-xl font-extrabold text-[#142B55]">
                    Cài đặt tài khoản
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Cập nhật tên ở mục Hồ sơ cá nhân. Email đăng nhập chỉ được
                    thay đổi sau khi xác minh; chức năng đổi email chưa mở để
                    bảo vệ tài khoản.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      className="rounded-xl border border-[#142B55]/20 px-4 py-3 text-left text-sm font-semibold"
                      onClick={() => {
                        sessionStorage.removeItem("petday_token_v3")
                        sessionStorage.removeItem("petday_api_token")
                        window.location.href =
                          window.location.pathname + "?forgot=1#tai-khoan"
                      }}
                    >
                      Đặt lại mật khẩu qua email ↗
                    </button>
                    <button
                      className="rounded-xl border border-[#142B55]/20 px-4 py-3 text-left text-sm font-semibold"
                      onClick={logout}
                    >
                      Đăng xuất tài khoản ↗
                    </button>
                  </div>
                  <div className="mt-5 rounded-xl border border-[#DDE9F8] p-4">
                    <h3 className="font-bold text-[#142B55]">
                      Đổi mật khẩu khi đã đăng nhập
                    </h3>
                    <p className="my-2 text-xs text-slate-600">
                      Không cần SMTP; chỉ đổi khi xác thực mật khẩu hiện tại.
                    </p>
                    <div className="grid gap-2 md:grid-cols-3">
                      <input
                        className={C}
                        type="password"
                        autoComplete="current-password"
                        placeholder="Mật khẩu hiện tại"
                        value={passwordCurrent}
                        onChange={(e) => setPasswordCurrent(e.target.value)}
                      />
                      <input
                        className={C}
                        type="password"
                        autoComplete="new-password"
                        placeholder="Mật khẩu mới (ít nhất 8 ký tự)"
                        value={passwordNew}
                        onChange={(e) => setPasswordNew(e.target.value)}
                      />
                      <input
                        className={C}
                        type="password"
                        autoComplete="new-password"
                        placeholder="Nhập lại mật khẩu mới"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                      />
                    </div>
                    <button
                      className={B + " mt-3"}
                      disabled={
                        busy ||
                        !passwordCurrent ||
                        passwordNew.length < 8 ||
                        !passwordConfirm
                      }
                      onClick={changePassword}
                    >
                      Lưu mật khẩu mới
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Liên kết đặt lại mật khẩu chỉ hoạt động khi SMTP của máy chủ
                    được cấu hình và xác minh.
                  </p>
                </section>
                <section
                  id="account-notifications"
                  className={card + " scroll-mt-32"}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-extrabold text-[#142B55]">
                        Thông báo
                      </h2>
                      <p className="text-sm text-slate-500">
                        Thông báo mới nhất hiển thị trước.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-xl border px-4 py-2 text-sm"
                        onClick={() =>
                          api("/my/notifications", "GET", undefined, token)
                            .then(setNotifications)
                            .catch((e) => setError(e.message))
                        }
                      >
                        Làm mới
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border px-4 py-2 text-sm disabled:opacity-40"
                        disabled={!notifications.some((n) => n.readAt)}
                        onClick={() => {
                          if (!window.confirm("Xóa tất cả thông báo đã đọc?"))
                            return
                          api(
                            "/my/notifications/read",
                            "DELETE",
                            undefined,
                            token,
                          )
                            .then(() =>
                              api("/my/notifications", "GET", undefined, token),
                            )
                            .then(setNotifications)
                            .catch((e) => setError(e.message))
                        }}
                      >
                        Xóa đã đọc
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {[...notifications]
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime() ||
                          Number(b.id) - Number(a.id),
                      )
                      .map((n) => (
                        <article
                          key={n.id}
                          className={
                            "rounded-xl border p-4 " +
                            (n.readAt
                              ? "bg-white"
                              : "border-[#FFB19D] bg-[#FFF5F1]")
                          }
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <strong>{n.title}</strong>
                              <p className="mt-1 text-sm text-slate-600">
                                {n.body}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {new Date(n.createdAt).toLocaleString("vi-VN")}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                              {!n.readAt && (
                                <button
                                  type="button"
                                  className="rounded-lg border px-3 py-2 text-xs"
                                  onClick={() =>
                                    api(
                                      `/my/notifications/${n.id}/read`,
                                      "PATCH",
                                      {},
                                      token,
                                    )
                                      .then(() =>
                                        api(
                                          "/my/notifications",
                                          "GET",
                                          undefined,
                                          token,
                                        ),
                                      )
                                      .then(setNotifications)
                                      .catch((e) => setError(e.message))
                                  }
                                >
                                  Đã đọc
                                </button>
                              )}
                              <button
                                type="button"
                                className="rounded-lg border px-3 py-2 text-xs"
                                onClick={() =>
                                  api(
                                    `/my/notifications/${n.id}`,
                                    "DELETE",
                                    undefined,
                                    token,
                                  )
                                    .then(() =>
                                      api(
                                        "/my/notifications",
                                        "GET",
                                        undefined,
                                        token,
                                      ),
                                    )
                                    .then(setNotifications)
                                    .catch((e) => setError(e.message))
                                }
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    {!notifications.length && (
                      <p className="text-sm text-slate-500">
                        Chưa có thông báo.
                      </p>
                    )}
                  </div>
                </section>
              </>
            )}
            {view === "account" && user.role === "customer" && (
              <section
                id="customer-consultations"
                className={card + " scroll-mt-32"}
              >
                <h2 className="text-xl font-bold text-[#142B55]">
                  Hỗ trợ khách hàng
                </h2>
                <p className="my-2 text-sm text-slate-500">
                  Gửi câu hỏi qua nút “Nhân viên tư vấn” ở góc màn hình; tại đây
                  bạn xem tình trạng xử lý và phản hồi của nhân viên.
                </p>
                {myRequests.length ? (
                  myRequests.map((x) => (
                    <article key={x.id} className="my-3 rounded-xl border p-4">
                      <p className="text-xs text-slate-500">
                        Yêu cầu #{x.id} ·{" "}
                        {x.status === "closed"
                          ? "Đã phản hồi"
                          : x.status === "in_progress"
                            ? "Đang xử lý"
                            : "Mới"}
                      </p>
                      <p className="my-2 font-semibold">{x.question}</p>
                      <p className="rounded-xl bg-[#EDF5FC] p-3 text-sm">
                        {x.reply_text || "Nhân viên chưa phản hồi."}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    Chưa có câu hỏi nào. Chọn “Nhân viên tư vấn” ở góc phải để
                    gửi yêu cầu; phản hồi sẽ xuất hiện tại đây.
                  </p>
                )}
              </section>
            )}
            {view === "admin" &&
              user.role === "admin" &&
              adminTab === "today" && (
                <section
                  className={card + " scroll-mt-32"}
                  id="admin-overview-kpis"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-extrabold text-[#142B55]">
                        Tổng quan hoạt động PetDay
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Số liệu thời điểm tải trang, lấy trực tiếp từ
                        PostgreSQL.
                      </p>
                    </div>
                    <button
                      className="rounded-xl border px-4 py-2 text-sm"
                      onClick={() =>
                        api("/admin/overview", "GET", undefined, token)
                          .then(setAdminOverview)
                          .catch((e) => setError(e.message))
                      }
                    >
                      Cập nhật KPI
                    </button>
                  </div>
                  {adminOverview ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        ["Tổng lịch", adminOverview.bookings.total],
                        ["Chờ thanh toán trước", adminOverview.bookings.pending],
                        ["Đang thực hiện", adminOverview.bookings.in_progress],
                        ["Hoàn tất", adminOverview.bookings.completed],
                        ["Chờ thanh toán", adminOverview.bookings.unpaid],
                        ["Tư vấn cần xử lý", adminOverview.consultations.open],
                        ["Đề nghị đổi lịch", adminOverview.reschedules.pending],
                        [
                          "Đã thu (ghi nhận)",
                          money(adminOverview.bookings.collected),
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={String(label)}
                          className="rounded-2xl border border-[#DDE9F8] bg-[#F3F8FE] p-4"
                        >
                          <p className="text-sm text-slate-500">{label}</p>
                          <p className="mt-2 text-2xl font-extrabold text-[#142B55]">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      Chưa có dữ liệu KPI. Bấm Cập nhật KPI sau khi đăng nhập.
                    </p>
                  )}
                </section>
              )}
            {view === "admin" &&
              user.role === "admin" &&
              adminTab === "support" && (
                <details className="petday-admin-disclosure rounded-3xl border border-[#DFE8F4] bg-white shadow-sm">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-base font-extrabold text-[#142B55] sm:px-7">
                    Quản lý mã ưu đãi <span aria-hidden="true">⌄</span>
                  </summary>
                  <section
                    className={card + " scroll-mt-32"}
                    id="admin-promotions"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-extrabold text-[#142B55]">
                          Ưu đãi
                        </h2>
                        <p className="text-sm text-slate-500">
                          Tạo mã dùng thật. Hệ thống kiểm tra điều kiện trước
                          khi áp dụng.
                        </p>
                      </div>
                      <button
                        className="rounded-xl border px-3 py-2 text-sm"
                        onClick={() =>
                          refreshPromos().catch((e) => setError(e.message))
                        }
                      >
                        Tải lại
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <label className="text-sm">
                        Mã ưu đãi
                        <input
                          className={C + " mt-1"}
                          placeholder="VD: PETDAY10"
                          value={newPromo.code}
                          onChange={(e) =>
                            setNewPromo((v) => ({
                              ...v,
                              code: e.target.value.toUpperCase(),
                            }))
                          }
                        />
                      </label>
                      <label className="text-sm">
                        Loại giảm
                        <select
                          className={C + " mt-1"}
                          value={newPromo.discountType}
                          onChange={(e) =>
                            setNewPromo((v) => ({
                              ...v,
                              discountType: e.target.value,
                            }))
                          }
                        >
                          <option value="percent">Theo %</option>
                          <option value="fixed">Số tiền cố định</option>
                        </select>
                      </label>
                      <label className="text-sm">
                        Giá trị
                        <input
                          type="number"
                          min="1"
                          className={C + " mt-1"}
                          value={newPromo.discountValue}
                          onChange={(e) =>
                            setNewPromo((v) => ({
                              ...v,
                              discountValue: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="text-sm">
                        Đơn tối thiểu (đ)
                        <input
                          type="number"
                          min="0"
                          className={C + " mt-1"}
                          value={newPromo.minOrder}
                          onChange={(e) =>
                            setNewPromo((v) => ({
                              ...v,
                              minOrder: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="text-sm">
                        Giới hạn mỗi khách
                        <input
                          type="number"
                          min="1"
                          className={C + " mt-1"}
                          value={newPromo.maxPerCustomer}
                          onChange={(e) =>
                            setNewPromo((v) => ({
                              ...v,
                              maxPerCustomer: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="text-sm">
                        Bắt đầu
                        <input
                          type="datetime-local"
                          className={C + " mt-1"}
                          value={newPromo.startsAt}
                          onChange={(e) =>
                            setNewPromo((v) => ({
                              ...v,
                              startsAt: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="text-sm">
                        Kết thúc
                        <input
                          type="datetime-local"
                          className={C + " mt-1"}
                          value={newPromo.endsAt}
                          onChange={(e) =>
                            setNewPromo((v) => ({
                              ...v,
                              endsAt: e.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>
                    <button
                      className={B + " mt-3"}
                      disabled={
                        busy ||
                        !newPromo.code ||
                        !newPromo.startsAt ||
                        !newPromo.endsAt
                      }
                      onClick={createPromo}
                    >
                      Tạo mã ưu đãi
                    </button>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {promotions.map((x) => (
                        <div
                          key={x.id}
                          className="flex items-center justify-between rounded-xl border p-3"
                        >
                          <div>
                            <strong>{x.code}</strong>
                            <p className="text-xs text-slate-500">
                              {x.discount_value}
                              {x.discount_type === "percent" ? "%" : "đ"} ·{" "}
                              {x.active ? "Đang bật" : "Đã tắt"}
                            </p>
                          </div>
                          <button
                            className="rounded-lg border px-3 py-2 text-xs"
                            onClick={() =>
                              api(
                                `/admin/promotions/${x.id}`,
                                "PATCH",
                                { active: !x.active },
                                token,
                              )
                                .then(refreshPromos)
                                .catch((e) => setError(e.message))
                            }
                          >
                            {x.active ? "Tắt mã" : "Bật mã"}
                          </button>
                        </div>
                      ))}
                      {!promotions.length && (
                        <p className="text-sm text-slate-500">
                          Chưa phát hành mã nào.
                        </p>
                      )}
                    </div>
                  </section>
                </details>
              )}
            {false &&
              view === "admin" &&
              user.role === "admin" &&
              adminTab === "finance" &&
              financeScope === "history" && (
                <details className="petday-admin-disclosure rounded-3xl border border-[#DFE8F4] bg-white shadow-sm">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-base font-extrabold text-[#142B55] sm:px-7">
                    Yêu cầu hoàn tiền <span aria-hidden="true">⌄</span>
                  </summary>
                  <section
                    className={card + " scroll-mt-32"}
                    id="admin-refunds"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-extrabold text-[#142B55]">
                          Đối soát & yêu cầu hoàn tiền
                        </h2>
                        <p className="text-sm text-slate-600">
                          Duyệt yêu cầu riêng với thao tác ghi nhận tiền đã hoàn
                          thực tế. Không kết nối ngân hàng tự động.
                        </p>
                      </div>
                      <button
                        className="rounded-xl border px-4 py-2 text-sm"
                        onClick={() => {
                          api("/admin/refunds", "GET", undefined, token)
                            .then(setRefunds)
                            .catch((e) => setError(e.message))
                          api("/admin/finance/summary", "GET", undefined, token)
                            .then(setFinance)
                            .catch(() => {})
                        }}
                      >
                        Làm mới
                      </button>
                    </div>
                    {finance && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          {
                            name: "Tổng tiền đã ghi nhận",
                            value: money(finance.grossReceived),
                          },
                          {
                            name: "Hoàn thực tế",
                            value: money(finance.refunded),
                          },
                          {
                            name: "Thu ròng dự kiến",
                            value: money(finance.netReceived),
                          },
                          {
                            name: "Yêu cầu chờ xử lý",
                            value: finance.pendingRefunds,
                          },
                        ].map((x) => (
                          <div
                            key={x.name}
                            className="rounded-2xl bg-[#F2F7FC] p-4"
                          >
                            <p className="text-xs text-slate-500">{x.name}</p>
                            <strong className="mt-1 block text-lg text-[#142B55]">
                              {x.value}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      Số liệu cộng dồn từ xác nhận thủ công trong PostgreSQL,
                      không phải sao kê ngân hàng hoặc doanh thu kế toán.
                    </p>
                    <div className="mt-4 space-y-3">
                      {refunds.map((r) => (
                        <article
                          key={r.id}
                          className="rounded-2xl border border-[#DDE9F8] p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <strong>
                              {r.code} · {r.customerName}
                            </strong>
                            <span className="text-sm font-bold">
                              {money(r.amount)} · {r.status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm">{r.reason}</p>
                          {r.refundReference && (
                            <p className="text-sm">
                              Đã đối soát: {r.refundReference}
                            </p>
                          )}
                          <label className="mt-3 block text-xs font-semibold">
                            Ghi chú xử lý
                            <input
                              className={C + " mt-1"}
                              value={refundNotes[r.id] || ""}
                              onChange={(e) =>
                                setRefundNotes((v) => ({
                                  ...v,
                                  [r.id]: e.target.value,
                                }))
                              }
                              placeholder="Lý do từ chối / ghi chú khi duyệt"
                            />
                          </label>
                          {r.status === "approved" && (
                            <label className="mt-2 block text-xs font-semibold">
                              Mã chuyển hoàn hoặc mã phiếu chi
                              <input
                                className={C + " mt-1"}
                                value={refundRefs[r.id] || ""}
                                onChange={(e) =>
                                  setRefundRefs((v) => ({
                                    ...v,
                                    [r.id]: e.target.value,
                                  }))
                                }
                                placeholder="Nhập sau khi hoàn tiền thực tế"
                              />
                            </label>
                          )}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {r.status === "pending" && (
                              <>
                                <button
                                  className={B}
                                  disabled={busy}
                                  onClick={() => decideRefund(r.id, "approve")}
                                >
                                  Duyệt yêu cầu
                                </button>
                                <button
                                  className="rounded-xl border border-red-300 px-4 py-2 text-sm text-red-700"
                                  disabled={busy}
                                  onClick={() => decideRefund(r.id, "reject")}
                                >
                                  Từ chối có lý do
                                </button>
                              </>
                            )}
                            {r.status === "approved" && (
                              <button
                                className={B}
                                disabled={
                                  busy ||
                                  (refundRefs[r.id] || "").trim().length < 4
                                }
                                onClick={() => decideRefund(r.id, "complete")}
                              >
                                Xác nhận đã hoàn tiền thực tế
                              </button>
                            )}
                          </div>
                        </article>
                      ))}
                      {!refunds.length && (
                        <p className="text-sm text-slate-500">
                          Chưa có yêu cầu hoàn tiền.
                        </p>
                      )}
                    </div>
                  </section>
                </details>
              )}
            {false &&
              view === "admin" &&
              user.role === "admin" &&
              adminTab === "finance" &&
              financeScope === "todo" &&
              financePanel === "shop" && (
                <AdminRetailPayments
                  token={token}
                  onConfirmed={async () => {
                    await reload()
                    setNotice("Đã xác nhận thanh toán cửa hàng.")
                  }}
                />
              )}
            {false &&
              view === "admin" &&
              user.role === "admin" &&
              !payOptions?.bankTransfer?.demo &&
              adminTab === "finance" &&
              financeScope !== "settings" &&
              financePanel === "refunds" && (
                <section
                  className="rounded-3xl border border-[#DDE9F8] bg-white p-4 shadow-sm sm:p-6"
                  aria-label="Quản lý hoàn tiền thống nhất"
                >
                  <h2 className="text-lg font-extrabold text-[#142B55]">
                    Hồ sơ hoàn tiền
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Chưa thu: trừ trên hóa đơn. Đã thu dư: tạo hồ sơ hoàn. Duyệt
                    và xác nhận hoàn là hai bước riêng.
                  </p>
                  <div className="mt-3">
                    <ExceptionRefundCenter token={token} scope={financeScope} />
                  </div>
                </section>
              )}

            {false &&
              view === "admin" &&
              user.role === "admin" &&
              adminTab === "finance" &&
              financeScope !== "settings" &&
              (financePanel === "payments" || financePanel === "refunds") && (
                <AutoPolicyFinancePanel
                  token={token}
                  bookings={bookings}
                  category={financePanel}
                  onUpdated={() => reload()}
                />
              )}
            {false &&
              view === "admin" &&
              user?.role === "admin" &&
              adminTab === "finance" &&
              financeScope === "history" &&
              financePanel === "shop" && (
                <section className="rounded-2xl border border-[#DDE9F8] bg-white p-6 text-sm text-slate-600">
                  Đơn cửa hàng đã thanh toán được tra cứu tại{" "}
                  <button
                    type="button"
                    className="font-bold text-[#142B55] underline"
                    onClick={() => setAdminTab("orders")}
                  >
                    Đơn cửa hàng
                  </button>
                  . Không hiển thị lại các đơn đã kết thúc trong hàng đợi thu
                  tiền.
                </section>
              )}
            {view === "admin" &&
              user.role === "admin" &&
              adminTab === "support" && <AdminServicePrices token={token} />}
            {view === "admin" &&
              user.role === "admin" &&
              adminTab === "products" && <AdminRetailCatalog token={token} />}
            {view === "admin" &&
              user.role === "admin" &&
              adminTab === "orders" && <AdminStandaloneOrders token={token} />}
            {view === "admin" &&
              user.role === "admin" &&
              !payOptions?.bankTransfer?.demo &&
              adminTab === "finance" &&
              financeScope !== "settings" &&
              financePanel === "payments" && (
                <FinanceWorkbench
                  scope={financeScope}
                  bookings={bookings}
                  busy={busy}
                  token={token}
                  searchCode={financeSearchCode}
                  onUpdated={reload}
                  onRecord={async (
                    code,
                    method,
                    paymentStatus,
                    reference,
                    note,
                  ) => {
                    setBusy(true)
                    setError("")
                    try {
                      await api(
                        `/admin/bookings/${code}/payment`,
                        "PATCH",
                        { paymentStatus, reference, note },
                        token,
                      )
                      await reload()
                      setNotice(
                        "Đã ghi nhận khoản thu và cập nhật nhật ký đối soát.",
                      )
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Không thể xác nhận thanh toán.",
                      )
                      throw err
                    } finally {
                      setBusy(false)
                    }
                  }}
                />
              )}
            {false &&
              view === "admin" &&
              user.role === "admin" &&
              adminTab === "finance" &&
              financeScope === "history" &&
              financePanel === "payments" && (
                <details className="petday-admin-disclosure rounded-3xl border border-[#DFE8F4] bg-white shadow-sm">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-base font-extrabold text-[#142B55] sm:px-7">
                    Nhật ký đối soát <span aria-hidden="true">⌄</span>
                  </summary>
                  <section
                    className={card + " scroll-mt-32"}
                    id="admin-payment-audit"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-xl font-extrabold text-[#142B55]">
                        Nhật ký đối soát
                      </h2>
                      <button
                        className="rounded-xl border px-3 py-2 text-sm"
                        onClick={() =>
                          api("/admin/payments/audit", "GET", undefined, token)
                            .then(setPaymentAudit)
                            .catch((e) => setError(e.message))
                        }
                      >
                        Làm mới
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Ghi nhận thao tác nhân viên, không phải xác nhận tự động
                      từ ngân hàng.
                    </p>
                    <div className="mt-3 space-y-2">
                      {paymentAudit.slice(0, 30).map((x) => (
                        <div
                          key={x.id}
                          className="rounded-xl bg-[#F2F7FC] p-3 text-sm"
                        >
                          <strong>{x.code}</strong> · {x.previousStatus} →{" "}
                          {x.newStatus}
                          <p className="text-xs text-slate-500">
                            {x.reference && `Mã đối soát: ${x.reference} · `}
                            {x.note || ""} · {x.adminName} ·{" "}
                            {new Date(x.createdAt).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      ))}
                      {!paymentAudit.length && (
                        <p className="text-sm text-slate-500">
                          Chưa có thao tác đối soát.
                        </p>
                      )}
                    </div>
                  </section>
                </details>
              )}
            {false &&
              view === "admin" &&
              user.role === "admin" &&
              adminTab === "support" && (
                <details className="rounded-3xl border border-[#DFE8F4] bg-white shadow-sm">
                  <summary className="cursor-pointer px-6 py-4 font-extrabold text-[#142B55]">
                    Kiểm duyệt đánh giá khách hàng
                  </summary>
                  <AdminCustomersReviews token={token} mode="reviews" />
                </details>
              )}
            {view === "admin" &&
              user.role === "admin" &&
              adminTab === "support" && (
                <section
                  id="admin-consultations"
                  className={card + " scroll-mt-32"}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-extrabold text-[#142B55]">
                        Hộp thư yêu cầu tư vấn
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Tiếp nhận và phản hồi câu hỏi khách gửi qua nút “Nhân
                        viên tư vấn”. Đây là phiếu yêu cầu, không phải trò
                        chuyện trực tuyến.
                      </p>
                    </div>
                    <button className={B} onClick={loadConsultations}>
                      Tải yêu cầu tư vấn
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {consultations.map((c) => (
                      <article key={c.id} className="rounded-xl border p-4">
                        <p className="font-bold">
                          #{c.id} · {c.contact_name} · {c.contact_email}
                        </p>
                        <p className="my-2 whitespace-pre-wrap text-sm">
                          {c.question}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">
                            Trạng thái: {c.status}
                          </span>
                          <select
                            className="rounded-lg border p-2 text-sm"
                            value={c.status}
                            onChange={(e) => {
                              const status = e.target.value
                              update(`/admin/consultations/${c.id}`, "PATCH", {
                                status,
                              })
                                .then(() =>
                                  api(
                                    "/admin/consultations",
                                    "GET",
                                    undefined,
                                    token,
                                  ).then(setConsultations),
                                )
                                .catch(() => {})
                            }}
                          >
                            <option value="new">Mới</option>
                            <option value="in_progress">Đang xử lý</option>
                            <option value="closed">Đã đóng</option>
                          </select>
                        </div>
                        <label className="mt-3 block text-sm font-semibold">
                          Phản hồi cho khách
                          <textarea
                            className={C + " mt-2"}
                            rows={3}
                            value={replyDraft[c.id] ?? c.reply_text ?? ""}
                            onChange={(e) =>
                              setReplyDraft((v) => ({
                                ...v,
                                [c.id]: e.target.value,
                              }))
                            }
                            placeholder="Nội dung trả lời..."
                          />
                        </label>
                        <button
                          className={B + " mt-2"}
                          disabled={
                            busy ||
                            !(replyDraft[c.id] ?? c.reply_text ?? "").trim()
                          }
                          onClick={() =>
                            run(async () => {
                              await api(
                                `/admin/consultations/${c.id}`,
                                "PATCH",
                                {
                                  status: "closed",
                                  replyText: replyDraft[c.id] ?? c.reply_text,
                                },
                                token,
                              )
                              setConsultations(
                                await api(
                                  "/admin/consultations",
                                  "GET",
                                  undefined,
                                  token,
                                ),
                              )
                              setNotice(
                                "Đã lưu phản hồi, khách hàng có thể xem trong tài khoản.",
                              )
                            })
                          }
                        >
                          Gửi phản hồi và đóng yêu cầu
                        </button>
                      </article>
                    ))}
                    {consultations.length === 0 && (
                      <p className="text-sm text-slate-500">
                        Nhấn “Tải yêu cầu tư vấn” để xem danh sách.
                      </p>
                    )}
                  </div>
                </section>
              )}
          </>
        )}
        {view === "shop" && user?.role === "customer" && (
          <StandaloneRetailShop token={token} />
        )}
        {view === "shop" && user?.role === "admin" && (
          <section className={card + " space-y-4"}>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#E57362]">
              Không gian quản trị
            </span>
            <h2 className="text-2xl font-extrabold text-[#142B55]">
              Cửa hàng công khai và quản trị bán hàng là hai khu vực riêng
            </h2>
            <p className="text-sm leading-7 text-slate-600">
              Tài khoản quản trị dùng để quản lý sản phẩm, tồn kho và đối soát
              đơn hàng. Để kiểm tra luồng mua hàng thực tế, hãy đăng nhập bằng
              một tài khoản khách hàng TEST riêng. Không tạo đơn mua dưới danh
              tính Admin.
            </p>
            <button type="button" className={B} onClick={() => onGo("admin")}>
              Vào quản trị đơn hàng →
            </button>
          </section>
        )}
        {view === "shop" && user?.role === "staff" && (
          <section className={card}>
            <h2 className="text-xl font-extrabold text-[#142B55]">
              Cửa hàng PetDay
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Tài khoản nhân viên sử dụng khu vực công việc để xử lý đơn hàng.
              Vui lòng mở Không gian làm việc.
            </p>
            <button
              type="button"
              className={B + " mt-4"}
              onClick={() => onGo("admin")}
            >
              Mở không gian làm việc
            </button>
          </section>
        )}
        {paymentChoiceOpen && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0B1830]/60 p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !busy)
                setPaymentChoiceOpen(false)
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-choice-title"
              className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#DB6B56]">
                    Xác nhận lịch hẹn
                  </p>
                  <h2
                    id="payment-choice-title"
                    className="mt-1 text-2xl font-extrabold text-[#142B55]"
                  >
                    Lựa chọn thanh toán
                  </h2>
                </div>
                <button
                  type="button"
                  className="min-h-11 rounded-xl border border-[#D6E2F0] px-4 text-sm font-bold text-[#142B55]"
                  onClick={() => setPaymentChoiceOpen(false)}
                  disabled={busy}
                >
                  Đóng
                </button>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {paymentMethod === "bank_transfer"
                  ? "Chuyển khoản ngân hàng yêu cầu thanh toán toàn bộ giá trị lịch trước khi xác nhận."
                  : "Để xác nhận lịch hẹn, bạn cần thanh toán trước một phần hoặc toàn bộ giá trị dịch vụ."}
              </p>
              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                >
                  {error}
                </p>
              )}
              <div className="mt-5 rounded-2xl bg-[#F2F7FC] p-4 text-sm text-[#142B55]">
                <p>
                  <strong>Tổng giá trị lịch:</strong>{" "}
                  {money(promoPreview?.total ?? quote?.total ?? estimate)}
                </p>
                {paymentMethod === "cash" && requiresPrepayment && (
                  <p className="mt-1">
                    <strong>Mức cọc tối thiểu:</strong> {money(depositPreview)}
                  </p>
                )}
              </div>
              {paymentMethod === "cash" && requiresPrepayment && (
                <fieldset className="mt-5 space-y-3">
                  <legend className="sr-only">Chọn mức thanh toán trước</legend>
                  <label
                    className={
                      "flex min-h-16 cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition " +
                      (prepaymentChoice === "deposit"
                        ? "border-[#142B55] bg-[#F2F7FC]"
                        : "border-[#DDE7F3] bg-white hover:border-[#9FB5CF]")
                    }
                  >
                    <input
                      className="mt-1"
                      type="radio"
                      name="payment-choice-dialog"
                      checked={prepaymentChoice === "deposit"}
                      onChange={() => setPrepaymentChoice("deposit")}
                    />
                    <span>
                      <strong className="block text-[#142B55]">
                        Đặt cọc tối thiểu 20%
                      </strong>
                      <span className="mt-1 block text-sm leading-6 text-slate-600">
                        Cọc {money(depositPreview)} qua QR; phần còn lại thanh
                        toán bằng tiền mặt tại cơ sở.
                      </span>
                    </span>
                  </label>
                  <label
                    className={
                      "flex min-h-16 cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition " +
                      (prepaymentChoice === "full"
                        ? "border-[#142B55] bg-[#F2F7FC]"
                        : "border-[#DDE7F3] bg-white hover:border-[#9FB5CF]")
                    }
                  >
                    <input
                      className="mt-1"
                      type="radio"
                      name="payment-choice-dialog"
                      checked={prepaymentChoice === "full"}
                      onChange={() => setPrepaymentChoice("full")}
                    />
                    <span>
                      <strong className="block text-[#142B55]">
                        Thanh toán toàn bộ
                      </strong>
                      <span className="mt-1 block text-sm leading-6 text-slate-600">
                        Thanh toán{" "}
                        {money(promoPreview?.total ?? quote?.total ?? estimate)}
                        qua QR trước khi lịch được xác nhận.
                      </span>
                    </span>
                  </label>
                </fieldset>
              )}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="min-h-12 rounded-xl border border-[#142B55] px-5 font-bold text-[#142B55]"
                  onClick={() => setPaymentChoiceOpen(false)}
                  disabled={busy}
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  className={B + " min-h-12"}
                  onClick={() => void book()}
                  disabled={busy}
                >
                  {busy ? "Đang tạo lịch..." : "Tiếp tục thanh toán bằng QR"}
                </button>
              </div>
            </section>
          </div>
        )}
        {focusedBookingAction && actionBooking && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0B1830]/60 p-3 sm:p-5"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !busy)
                setFocusedBookingAction(null)
            }}
          >
            <div
              ref={bookingActionDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="booking-action-title"
              aria-describedby="booking-action-description"
              className="relative z-[100] max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
            >
              <div className="flex items-start justify-between gap-4 border-b border-[#E1EAF5] pb-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#E06E57]">
                    QUẢN LÝ LỊCH HẸN
                  </p>
                  <h2
                    id="booking-action-title"
                    className="mt-1 text-2xl font-extrabold text-[#142B55]"
                  >
                    {focusedBookingAction.action === "reschedule"
                      ? "Đổi lịch"
                      : "Hủy lịch"}
                  </h2>
                  <p
                    id="booking-action-description"
                    className="mt-1 text-sm text-slate-600"
                  >
                    {actionBooking.code} · {actionBooking.petName}
                  </p>
                </div>
                <button
                  type="button"
                  data-dialog-initial-focus
                  aria-label="Đóng cửa sổ quản lý lịch"
                  disabled={busy}
                  onClick={() => setFocusedBookingAction(null)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#D7E2F0] text-[#142B55] transition-colors hover:bg-[#F2F6FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF765E] disabled:opacity-40"
                >
                  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6 18 18M18 6 6 18" /></svg>
                </button>
              </div>

              <div className="mt-5 grid gap-3 rounded-2xl bg-[#F4F8FD] p-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Dịch vụ</span>
                  <strong className="mt-1 block text-[#142B55]">{actionBooking.service}</strong>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500">Chi nhánh</span>
                  <strong className="mt-1 block text-[#142B55]">{actionBooking.branch}</strong>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500">Ngày giờ hiện tại</span>
                  <strong className="mt-1 block text-[#142B55]">{actionBooking.date} · {actionBooking.slot}</strong>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500">Trạng thái</span>
                  <strong className="mt-1 block text-[#142B55]">{customerFacingStatus(actionBooking)}</strong>
                </div>
              </div>

              {focusedBookingAction.action === "reschedule" ? (
                <form
                  className="mt-5 space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void requestReschedule(actionBooking.code)
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-bold text-[#142B55]">
                      Ngày mới
                      <input
                        type="date"
                        required
                        min={todayLocal}
                        max={actionMaxDate}
                        className={C + " mt-1"}
                        value={actionNewDate}
                        onChange={(event) =>
                          setNewDates((current) => ({
                            ...current,
                            [actionBooking.code]: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="text-sm font-bold text-[#142B55]">
                      Khung giờ mới
                      <select
                        className={C + " mt-1"}
                        value={actionNewSlot}
                        onChange={(event) =>
                          setNewSlots((current) => ({
                            ...current,
                            [actionBooking.code]: event.target.value,
                          }))
                        }
                      >
                        {["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30"].map((hour) => (
                          <option
                            key={hour}
                            value={hour}
                            disabled={Boolean(
                              actionNewDate &&
                                Date.parse(actionNewDate + "T" + hour + ":00+07:00") <= Date.now(),
                            )}
                          >
                            {hour}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="block text-sm font-bold text-[#142B55]">
                    Lý do đổi lịch
                    <textarea
                      required
                      minLength={5}
                      maxLength={500}
                      rows={3}
                      className={C + " mt-1"}
                      placeholder="Nhập lý do đổi lịch, ít nhất 5 ký tự"
                      value={changeReasons[actionBooking.code] || ""}
                      onChange={(event) =>
                        setChangeReasons((current) => ({
                          ...current,
                          [actionBooking.code]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="rounded-xl border border-[#D7E4F3] bg-[#F7FAFE] p-3 text-xs leading-5 text-slate-600">
                    <strong className="block text-[#142B55]">Điều kiện thay đổi</strong>
                    {actionAssisted
                      ? "Còn tối đa 1 giờ: yêu cầu được chuyển cho PetDay hỗ trợ và lịch hiện tại giữ nguyên cho đến khi xử lý."
                      : actionLimited
                        ? "Còn hơn 1 đến 3 giờ: chỉ có thể chọn ngày hẹn hiện tại hoặc ngày kế tiếp."
                        : "Còn hơn 3 giờ: có thể chọn lịch trống trong phạm vi 7 ngày tới."}
                    <span className="mt-1 block">Khoản đã thanh toán được giữ nguyên; thao tác đổi lịch không tự ghi thêm khoản thu.</span>
                  </div>
                  {actionNewDate === actionBooking.date.slice(0, 10) &&
                    actionNewSlot === actionBooking.slot.slice(0, 5) && (
                      <p role="alert" className="text-sm font-semibold text-amber-700">
                        Ngày và giờ mới đang trùng với lịch hiện tại.
                      </p>
                    )}
                  {actionNewTimeInPast && (
                    <p role="alert" className="text-sm font-semibold text-red-700">
                      Không thể đổi lịch sang thời gian đã qua.
                    </p>
                  )}
                  <div className="flex flex-col-reverse gap-2.5 border-t border-[#E1EAF5] pt-4 sm:flex-row sm:justify-end">
                    <button type="button" disabled={busy} onClick={() => setFocusedBookingAction(null)} className="min-h-11 rounded-xl border border-[#C8D7E9] px-[18px] py-[11px] text-sm font-semibold text-[#142B55] disabled:opacity-40">Quay lại</button>
                    <button
                      type="submit"
                      disabled={
                        busy ||
                        !actionNewDate ||
                        actionNewTimeInPast ||
                        (changeReasons[actionBooking.code] || "").trim().length < 5 ||
                        (actionNewDate === actionBooking.date.slice(0, 10) &&
                          actionNewSlot === actionBooking.slot.slice(0, 5))
                      }
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#162E59] px-[18px] py-[11px] text-sm font-semibold text-white transition-colors hover:bg-[#102445] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <CalendarClockIcon />
                      {busy ? "Đang đổi lịch..." : "Xác nhận đổi lịch"}
                    </button>
                  </div>
                </form>
              ) : (
                <form
                  className="mt-5 space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (!window.confirm("Xác nhận hủy lịch này? Thao tác không thể hoàn tác.")) return
                    void askCancellation(actionBooking.code)
                  }}
                >
                  <div className="grid gap-3 rounded-2xl border border-[#F3D4CC] bg-[#FFF8F6] p-4 text-sm sm:grid-cols-3">
                    <div><span className="text-xs font-semibold text-slate-500">Thanh toán</span><strong className="mt-1 block text-[#142B55]">{actionBooking.paymentStatus}</strong></div>
                    <div><span className="text-xs font-semibold text-slate-500">Đã thu</span><strong className="mt-1 block text-[#142B55]">{money(Number(actionBooking.collectedPaid || 0))}</strong></div>
                    <div><span className="text-xs font-semibold text-slate-500">Hoàn dự kiến</span><strong className="mt-1 block text-[#C9513D]">{money(Number(actionCancellationPolicy?.amount || 0))}</strong></div>
                  </div>
                  <p className="rounded-xl bg-[#F5F8FD] p-3 text-xs font-semibold leading-5 text-[#142B55]">
                    {actionCancellationPolicy?.label}. Mức cuối cùng do backend tính tại thời điểm gửi yêu cầu. Khoản hoàn chỉ được ghi nhận để đối soát, không tự chuyển tiền.
                  </p>
                  <label className="block text-sm font-bold text-[#142B55]">
                    Lý do hủy lịch
                    <textarea
                      required
                      minLength={10}
                      maxLength={800}
                      rows={4}
                      className={C + " mt-1"}
                      placeholder="Nhập lý do hủy lịch, ít nhất 10 ký tự"
                      value={cancelReasons[actionBooking.code] || ""}
                      onChange={(event) =>
                        setCancelReasons((current) => ({
                          ...current,
                          [actionBooking.code]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="flex flex-col-reverse gap-2.5 border-t border-[#E1EAF5] pt-4 sm:flex-row sm:justify-end">
                    <button type="button" disabled={busy} onClick={() => setFocusedBookingAction(null)} className="min-h-11 rounded-xl border border-[#C8D7E9] px-[18px] py-[11px] text-sm font-semibold text-[#142B55] disabled:opacity-40">Quay lại</button>
                    <button
                      type="submit"
                      disabled={busy || (cancelReasons[actionBooking.code] || "").trim().length < 10}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#F9C4B9] bg-[#FFF2EF] px-[18px] py-[11px] text-sm font-semibold text-[#C9513D] transition-colors hover:bg-[#FFE5DE] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <CalendarXIcon />
                      {busy ? "Đang hủy lịch..." : "Xác nhận hủy lịch"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        {paymentPopupCode && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0B1830]/60 p-3 sm:p-5">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-qr-title"
              className="max-h-[94dvh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-[#F7FAFE] p-4 shadow-2xl sm:p-6"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2
                  id="payment-qr-title"
                  className="text-xl font-extrabold text-[#142B55]"
                >
                  Thanh toán lịch {paymentPopupCode}
                </h2>
                <button
                  type="button"
                  className="min-h-11 rounded-xl border border-[#142B55] bg-white px-4 text-sm font-bold text-[#142B55]"
                  onClick={() => {
                    setPaymentPopupCode(null)
                    onGo("appointments")
                  }}
                >
                  Quay lại lịch hẹn
                </button>
              </div>
              <CustomerBankNotices
                token={token}
                bookings={bookings.filter(
                  (item) => item.code === paymentPopupCode,
                )}
                focusCode={paymentPopupCode}
                onDemoConfirmed={async (message) => {
                  setNotice(message)
                  setPaymentPopupCode(null)
                  await reload()
                  onGo("appointments")
                }}
              />
            </section>
          </div>
        )}
        {receiptBooking && (
          <BookingReceipt
            booking={receiptBooking}
            onClose={() => setReceiptBooking(null)}
          />
        )}
      </div>
    </main>
  )
}
