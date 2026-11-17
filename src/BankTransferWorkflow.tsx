import { apiFetch } from "./apiFetch"
import PaymentQrPanel from "./PaymentQrPanel"
import { useEffect, useState } from "react"

type Booking = {
  code: string
  total: number
  paymentMethod?: string
  paymentPlan?: string | null
  paymentStatus: string
  status: string
  depositPaid?: number
  collectedPaid?: number
  lineItems?: {
    type?: string
    requiredAmount?: number
  }[]
}
const requiredDeposit = (b: Booking) =>
  Number(
    b.lineItems?.find((x) => x.type === "first_use_deposit")?.requiredAmount ||
      0,
  )
type BankRecipient = {
  enabled: boolean
  demo?: boolean
  bankName?: string
  accountHolder?: string
  accountNumber?: string
}
type Notice = {
  paymentPlan?: string | null
  depositRequired?: number
  depositPaid?: number
  paymentMethod?: string
  code: string
  customerReference?: string
  customerNote?: string
  senderBank?: string
  senderName?: string
  createdAt?: string
  updatedAt?: string
  paymentStatus: string
  customerName?: string
  total?: number
}
const cash = (n: number) => Number(n || 0).toLocaleString("vi-VN") + "đ"
async function request(
  path: string,
  token: string,
  method = "GET",
  body?: object,
) {
  const response = await apiFetch("/api" + path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok)
    throw new Error(data.error || data.message || "Lỗi API " + response.status)
  return data
}
export function CustomerBankNotices({
  token,
  bookings,
  focusCode,
  onDemoConfirmed,
}: {
  token: string
  bookings: Booking[]
  focusCode?: string
  onDemoConfirmed?: (message: string) => Promise<void> | void
}) {
  const [qrActive, setQrActive] = useState<Record<string, boolean>>({})
  const [bank, setBank] = useState<BankRecipient | null>(null)
  const [notices, setNotices] = useState<Notice[]>([])
  const [ref, setRef] = useState<Record<string, string>>({})
  const [note, setNote] = useState<Record<string, string>>({})
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState("")
  const refresh = () =>
    request("/my/transfer-notices", token)
      .then(setNotices)
      .catch((e) => setError(e.message))
  useEffect(() => {
    refresh()
    request("/payment/options", token)
      .then((x: any) => setBank(x.bankTransfer || null))
      .catch(() => setBank(null))
  }, [token])
  const pending = bookings
    .filter(
      (b) =>
        (b.paymentMethod === "bank_transfer" ||
          (b.paymentMethod === "cash" &&
            requiredDeposit(b) > 0 &&
            (b.paymentPlan === "FULL_PREPAY" ||
              requiredDeposit(b) > Number(b.depositPaid || 0)))) &&
        b.paymentStatus === "Chưa thanh toán" &&
        !["Đã hủy","Không hoàn thành","Hoàn tất"].includes(b.status),
    )
    .sort((a, b) => Number(b.code === focusCode) - Number(a.code === focusCode))
  useEffect(() => {
    if (!focusCode || !pending.some((b) => b.code === focusCode)) return
    const id = window.setTimeout(() => {
      document
        .getElementById("petday-payment-" + focusCode)
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
      sessionStorage.removeItem("petday_payment_focus_booking")
    }, 250)
    return () => window.clearTimeout(id)
  }, [focusCode, bookings.length])
  if (!pending.length) return null
  return (
    <section
      className="rounded-3xl border border-[#DDE9F8] bg-white p-4 shadow-sm sm:p-6"
      aria-label="Thanh toán lịch hẹn"
    >
      <div className="mb-4">
        <h2 className="text-xl font-extrabold text-[#142B55]">
          Thanh toán dịch vụ / cọc bằng mã QR
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Mỗi mã có hiệu lực 15 phút. Sau khi kiểm tra thông tin, xác nhận giao
          dịch theo chế độ đang dùng. Trong chế độ thử nghiệm, xác nhận sẽ tự
          cập nhật giao dịch MÔ PHỎNG. Không phát sinh chuyển tiền thật. Với
          giao dịch ngân hàng thật, PetDay vẫn cần đối soát.
        </p>
      </div>
      {error && (
        <p
          className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          className="mb-3 rounded-xl bg-blue-50 p-3 text-sm text-[#142B55]"
          role="status"
        >
          {message}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {pending.map((b) => {
          const found = notices.find((n) => n.code === b.code)
          return (
            <article
              key={b.code}
              id={"petday-payment-" + b.code}
              className="rounded-2xl border border-[#DDE9F6] bg-[#F8FAFE] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-[#142B55]">Lịch {b.code}</strong>
                <strong className="text-lg text-[#142B55]">
                  Còn lại:{" "}
                  {cash(Math.max(0, b.total - Number(b.collectedPaid || 0)))}
                </strong>
              </div>
              {b.paymentMethod === "cash" &&
                requiredDeposit(b) > Number(b.collectedPaid || 0) &&
                b.paymentPlan !== "FULL_PREPAY" && (
                  <p className="my-2 text-xs font-bold text-[#142B55]">
                    Cọc 20% còn thiếu:{" "}
                    {cash(
                      Math.max(
                        0,
                        requiredDeposit(b) - Number(b.collectedPaid || 0),
                      ),
                    )}
                    . Xác nhận QR TEST bên dưới để lịch tự chuyển sang Đã xác
                    nhận; phần còn lại thanh toán tiền mặt khi sử dụng dịch vụ.
                  </p>
                )}
              {(b.paymentMethod === "bank_transfer" ||
                b.paymentPlan === "FULL_PREPAY") && (
                <p className="my-2 rounded-xl border border-[#D3E3F5] bg-white p-3 text-sm font-semibold text-[#142B55]">
                  Thanh toán trước toàn bộ số tiền còn lại qua QR:{" "}
                  {cash(Math.max(0, b.total - Number(b.collectedPaid || 0)))}.
                  Lịch chỉ được xác nhận sau khi thanh toán đã được kiểm tra.
                </p>
              )}
              {Number(b.collectedPaid || 0) > 0 && (
                <p className="mb-2 text-sm font-semibold text-[#142B55]">
                  Đã ghi nhận: {cash(Number(b.collectedPaid || 0))} ·{" "}
                  {Number(b.collectedPaid || 0) < Number(b.total)
                    ? "Đã cọc / thanh toán một phần"
                    : "Đã thanh toán đủ"}
                </p>
              )}
              <PaymentQrPanel
                token={token}
                kind="booking"
                code={b.code}
                amount={
                  b.paymentMethod === "cash" && b.paymentPlan !== "FULL_PREPAY"
                    ? Math.max(
                        0,
                        requiredDeposit(b) - Number(b.collectedPaid || 0),
                      )
                    : Math.max(0, b.total - Number(b.collectedPaid || 0))
                }
                paymentChoice={
                  b.paymentMethod === "cash" && b.paymentPlan !== "FULL_PREPAY"
                    ? "deposit"
                    : "full"
                }
                onWindowChange={(active) =>
                  setQrActive((old) =>
                    old[b.code] === active ? old : { ...old, [b.code]: active },
                  )
                }
                onSessionIssued={() => {
                  setError("")
                  setMessage("")
                }}
              />
              {found && !(bank?.demo && Number(b.collectedPaid || 0) > 0) ? (
                <p className="mt-3 rounded-xl bg-[#E7F6EE] p-3 text-sm font-semibold text-[#166141]">
                  {bank?.demo
                    ? "Đã xác nhận chuyển khoản thử nghiệm; cập nhật để xem số tiền ghi nhận."
                    : "Đã báo chuyển khoản — đang chờ xác minh giao dịch thực tế, chưa ghi nhận đã thanh toán."}
                </p>
              ) : (
                <button
                  type="button"
                  disabled={!qrActive[b.code] || busy === b.code}
                  className="mt-3 w-full rounded-xl bg-[#142B55] px-4 py-3 font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={async () => {
                    setBusy(b.code)
                    setError("")
                    setMessage("")
                    try {
                      const r = await request(
                        "/bookings/" +
                          encodeURIComponent(b.code) +
                          "/transfer-notice",
                        token,
                        "POST",
                        {
                          senderBank: "Không áp dụng (mô phỏng)",
                          senderName: "Khách báo qua website",
                          customerReference: "",
                          customerNote:
                            "Khách bấm Tôi đã chuyển khoản trong phiên QR hợp lệ.",
                        },
                      )
                      const responseMessage =
                        r.message || "Đã ghi nhận thông báo."
                      setMessage(responseMessage)
                      await refresh()
                      if (r.demo && r.autoConfirmed) {
                        window.dispatchEvent(
                          new Event("petday:payment-updated"),
                        )
                        await onDemoConfirmed?.(responseMessage)
                      }
                    } catch (e) {
                      setError((e as Error).message)
                    } finally {
                      setBusy("")
                    }
                  }}
                >
                  {busy === b.code
                    ? "Đang gửi..."
                    : qrActive[b.code]
                      ? bank?.demo
                        ? "Xác nhận thanh toán thử nghiệm"
                        : "Tôi đã chuyển khoản · Chờ xác minh"
                      : "Tạo mã QR còn hiệu lực để tiếp tục"}
                </button>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
export function AdminBankNotices({
  token,
  onConfirmed,
}: {
  token: string
  onConfirmed: () => Promise<void> | void
}) {
  const [rows, setRows] = useState<Notice[]>([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [working, setWorking] = useState("")
  const [refs, setRefs] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [demo, setDemo] = useState(false)
  const refresh = async () => {
    setLoading(true)
    setError("")
    try {
      const [notices, opts] = await Promise.all([
        request("/admin/transfer-notices", token),
        request("/payment/options", token),
      ])
      setRows(notices)
      setDemo(Boolean(opts?.bankTransfer?.demo))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    refresh()
  }, [token])
  const pending = rows.filter(
    (x) =>
      x.paymentStatus === "Chưa thanh toán" &&
      !["Đã hủy","Không hoàn thành"].includes(x.bookingStatus) &&
      (x.paymentMethod !== "cash" ||
        Number(x.depositRequired || 0) > Number(x.depositPaid || 0)),
  )
  const submit = async (x: Notice) => {
    const reference = (refs[x.code] || "").trim()
    if (!demo && !reference) {
      setError("Cần nhập mã giao dịch đã kiểm tra trên sao kê ngân hàng.")
      return
    }
    if (
      !window.confirm(
        `Xác nhận đã ghi nhận ${cash(x.total || 0)} cho lịch ${x.code}? Khách tự khai báo không phải bằng chứng đã thanh toán.`,
      )
    )
      return
    setWorking(x.code)
    setError("")
    setSuccess("")
    try {
      if (x.paymentMethod === "cash" && Number(x.depositRequired) > 0) {
        await request(
          "/admin/bookings/" + encodeURIComponent(x.code) + "/receipts",
          token,
          "POST",
          {
            amount:
              x.paymentPlan === "FULL_PREPAY"
                ? Number(x.total || 0) - Number(x.depositPaid || 0)
                : Number(x.depositRequired) - Number(x.depositPaid || 0),
            method: "bank_transfer",
            reference: demo ? "TEST-DEP-" + x.code : reference,
            note:
              x.paymentPlan === "FULL_PREPAY"
                ? "Thanh toán toàn bộ trước dịch vụ đã được đối soát."
                : "Cọc 20% đã được đối soát.",
          },
        )
      } else {
        await request(
          "/admin/bookings/" + encodeURIComponent(x.code) + "/payment",
          token,
          "PATCH",
          {
            paymentStatus: "Đã thanh toán",
            reference: demo ? "TEST-" + x.code : reference,
            note:
              (demo ? "Đối soát mô phỏng trong PetDay. " : "") +
              ((notes[x.code] || "").trim() ||
                "Admin xác nhận thanh toán từ yêu cầu khách gửi."),
          },
        )
      }
      setSuccess(
        "Đã ghi nhận thanh toán cho " + x.code + ". Lịch sử đối soát đã lưu.",
      )
      await refresh()
      await onConfirmed()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setWorking("")
    }
  }
  return (
    <section
      className="rounded-3xl border border-[#DDE9F8] bg-white p-5 shadow-sm sm:p-7"
      aria-label="Chờ xác nhận chuyển khoản"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#E16E58]">
            ĐỐI SOÁT TẬP TRUNG
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-[#142B55]">
            Chờ xác nhận chuyển khoản ({pending.length})
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Xem thông tin người gửi, kiểm tra giao dịch và xác nhận ngay tại
            đây.
          </p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-[#D4E2F3] px-4 py-2 text-sm font-bold text-[#142B55]"
          onClick={refresh}
          disabled={loading || !!working}
        >
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>
      {demo && (
        <p className="mt-3 rounded-xl bg-[#FFF7E9] p-3 text-xs text-[#92601D]">
          Chế độ thử nghiệm: xác nhận chỉ cập nhật dữ liệu trong PetDay, không
          phải xác nhận tiền đã đến ngân hàng.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {success}
        </p>
      )}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {pending.map((x) => (
          <article
            key={x.code}
            className="rounded-2xl border border-[#DEE9F6] bg-[#F8FBFF] p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <strong className="text-lg text-[#142B55]">{x.code}</strong>
                <p className="text-sm text-slate-600">
                  {x.customerName || "Khách hàng"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Ngày khách báo chuyển:{" "}
                  {x.createdAt || x.updatedAt
                    ? new Date(x.createdAt || x.updatedAt || "").toLocaleString(
                        "vi-VN",
                        { dateStyle: "short", timeStyle: "short" },
                      )
                    : "—"}
                </p>
              </div>
              <strong className="text-lg text-[#142B55]">
                {cash(
                  x.paymentMethod === "cash" &&
                    x.paymentPlan !== "FULL_PREPAY" &&
                    x.depositRequired
                    ? Math.max(
                        0,
                        x.depositRequired - Number(x.depositPaid || 0),
                      )
                    : Math.max(
                        0,
                        Number(x.total || 0) - Number(x.depositPaid || 0),
                      ),
                )}
              </strong>
            </div>
            <div className="mt-3 rounded-xl bg-white p-3 text-sm leading-6 text-[#142B55]">
              <p>
                <span className="text-slate-500">Ngân hàng gửi: </span>
                <strong>{x.senderBank || "Chưa cung cấp"}</strong>
              </p>
              <p>
                <span className="text-slate-500">Người chuyển: </span>
                <strong>{x.senderName || "Chưa cung cấp"}</strong>
              </p>
              <p>
                <span className="text-slate-500">Mã khách báo: </span>
                {x.customerReference || "Không cung cấp"}
              </p>
              {x.customerNote && (
                <p>
                  <span className="text-slate-500">Ghi chú: </span>
                  {x.customerNote}
                </p>
              )}
            </div>
            {!demo && (
              <label className="mt-3 block text-sm font-semibold text-[#142B55]">
                Mã giao dịch đã đối soát *
                <input
                  className="mt-1 w-full rounded-xl border border-[#D5E2F0] bg-white px-3 py-2.5"
                  value={refs[x.code] || ""}
                  maxLength={120}
                  onChange={(e) =>
                    setRefs((v) => ({ ...v, [x.code]: e.target.value }))
                  }
                  placeholder="Nhập mã từ sao kê thực nhận"
                />
              </label>
            )}
            <label className="mt-3 block text-sm font-semibold text-[#142B55]">
              Ghi chú đối soát
              <input
                className="mt-1 w-full rounded-xl border border-[#D5E2F0] bg-white px-3 py-2.5"
                maxLength={300}
                value={notes[x.code] || ""}
                onChange={(e) =>
                  setNotes((v) => ({ ...v, [x.code]: e.target.value }))
                }
                placeholder="Thông tin kiểm tra (nếu có)"
              />
            </label>
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-[#142B55] px-4 py-3 text-sm font-bold text-white hover:bg-[#25457B] disabled:opacity-45"
              disabled={!!working || (!demo && !(refs[x.code] || "").trim())}
              onClick={() => submit(x)}
            >
              {working === x.code ? "Đang xác nhận..." : "Xác nhận thanh toán"}
            </button>
          </article>
        ))}
        {!pending.length && (
          <p className="col-span-full rounded-xl border border-dashed border-[#D4E2F3] p-6 text-center text-sm text-slate-500">
            Không có lịch chuyển khoản nào đang chờ đối soát.
          </p>
        )}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Khi đã đủ cọc/tiền, yêu cầu sẽ được cập nhật trong sổ thu. Sổ thu tiền
        và Nhật ký đối soát vẫn lưu toàn bộ kết quả.
      </p>
    </section>
  )
}
