import { useEffect, useState } from "react"

type ToastTone = "error" | "success" | "warning"
type ToastDetail = { message: string; tone?: ToastTone }
type ActiveToast = ToastDetail & { id: number }

const TOAST_EVENT = "petday:toast"

export function cleanToastMessage(value: unknown) {
  const original = String(value || "").trim()
  let message = original
    .replace(/\s*\[\s*\/[^,\]]+\s*,\s*HTTP\s+\d+\s*\]\s*$/i, "")
    .replace(/\s*[([]?HTTP\s+\d+[)\]]?\.?\s*$/i, "")
    .trim()
  if (/Thú cưng đã có lịch trùng thời gian/i.test(message)) {
    message = "Thú cưng đã có lịch trùng thời gian. Vui lòng chọn khung giờ khác."
  }
  if (/Truy vấn database gặp lỗi thiếu bảng\/cột/i.test(message)) message = "Chưa thể tải dữ liệu. Vui lòng liên hệ quản trị viên để kiểm tra cấu hình database."
  return message || "Không thể hoàn tất thao tác. Vui lòng thử lại."
}

export function showToast(message: unknown, tone: ToastTone = "error") {
  window.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST_EVENT, {
      detail: { message: cleanToastMessage(message), tone },
    }),
  )
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const receive = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail
      if (!detail?.message) return
      setLeaving(false)
      setToast({
        id: Date.now() + Math.random(),
        message: cleanToastMessage(detail.message),
        tone: detail.tone || "error",
      })
    }
    window.addEventListener(TOAST_EVENT, receive)
    return () => window.removeEventListener(TOAST_EVENT, receive)
  }, [])

  useEffect(() => {
    if (!toast) return
    const fadeTimer = window.setTimeout(() => setLeaving(true), 4500)
    const removeTimer = window.setTimeout(() => setToast(null), 5000)
    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(removeTimer)
    }
  }, [toast?.id])

  const isError = toast?.tone === "error"
  const isWarning = toast?.tone === "warning"
  return (
    <>
      {children}
      {toast && (
        <div
          className={
            "petday-toast pointer-events-none fixed left-1/2 top-[5.5rem] z-[70] w-[calc(100%-2rem)] max-w-[460px] -translate-x-1/2 md:top-[7.25rem] " +
            (leaving ? "petday-toast--leaving" : "")
          }
        >
          <div
            role={isError ? "alert" : "status"}
            aria-live={isError ? "assertive" : "polite"}
            className={
              "pointer-events-auto flex items-start gap-3 rounded-2xl border p-3 pl-4 shadow-[0_14px_40px_rgba(20,43,85,.18)] backdrop-blur-sm " +
              (isError
                ? "border-red-200 bg-red-50/95 text-red-800"
                : isWarning
                  ? "border-amber-200 bg-amber-50/95 text-amber-900"
                  : "border-emerald-200 bg-emerald-50/95 text-emerald-800")
            }
          >
            <svg
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isError || isWarning ? (
                <>
                  <path d="M10.3 2.9 1.8 17.1A2 2 0 0 0 3.5 20h17a2 2 0 0 0 1.7-2.9L13.7 2.9a2 2 0 0 0-3.4 0Z" />
                  <path d="M12 9v4M12 17h.01" />
                </>
              ) : (
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8 12 2.5 2.5L16 9" />
                </>
              )}
            </svg>
            <p className="min-w-0 flex-1 text-sm font-bold leading-6">
              {toast.message}
            </p>
            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() => setToast(null)}
              className="-my-2 -mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-xl transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6 18 18M18 6 6 18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
