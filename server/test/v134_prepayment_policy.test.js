import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const code = readFileSync(new URL("../src/server.js", import.meta.url), "utf8")
const portal = readFileSync(
  new URL("../../src/Portal.tsx", import.meta.url),
  "utf8",
)
const bank = readFileSync(
  new URL("../../src/BankTransferWorkflow.tsx", import.meta.url),
  "utf8",
)

test("bank transfer rejects 20 percent choice at booking and QR endpoints", () => {
  assert.match(
    code,
    /paymentMethod==='bank_transfer'&&b\.prepaymentChoice==='deposit'/,
  )
  assert.match(
    code,
    /payment_method==='bank_transfer'&&d\.paymentChoice==='deposit'/,
  )
  assert.match(code, /paymentMethod:order\.payment_method,paymentPlan:order\.payment_plan/)
})

test("booking saves requested cash prepayment plan and starts pending", () => {
  assert.match(
    code,
    /const paymentPlan=b\.paymentMethod==='bank_transfer'\?'FULL_PREPAY'/,
  )
  assert.match(code, /payment_plan=\$2,status=\$3/)
  assert.match(code, /paymentPending\?'Đang chờ xác nhận':'Đã xác nhận'/)
})

test("verified receipt condition is full for transfer and optional cash full", () => {
  assert.match(
    code,
    /booking\.payment_method==='bank_transfer'\|\|booking\.payment_plan==='FULL_PREPAY'/,
  )
  assert.match(
    code,
    /r\.rows\[0\]\.payment_method==='bank_transfer'\|\|r\.rows\[0\]\.payment_plan==='FULL_PREPAY'/,
  )
  assert.match(
    code,
    /SELECT id,customer_id,code,payment_method,payment_plan,payment_status,status,total,line_items FROM bookings/,
  )
  assert.match(code, /const expectedAmount=bookingQrAmount/)
})

test("customer UI opens payment choices only for eligible cash bookings", () => {
  assert.match(portal, /paymentChoiceOpen &&/)
  assert.match(portal, /paymentMethod === "cash" && requiresPrepayment/)
  assert.match(portal, /quote\?\.prepaymentRequired \?\? quote\?\.firstUse/)
  assert.match(portal, /setPrepaymentChoice\("deposit"\)/)
  assert.match(portal, /paymentMethod === "bank_transfer"/)
  assert.doesNotMatch(portal, /Phương án thanh toán trước/)
  assert.doesNotMatch(bank, /paymentChoice\[b\.code\]/)
})

test("changing an unpaid payment plan invalidates an unreported QR session", () => {
  assert.match(
    code,
    /SELECT reported_at FROM payment_qr_sessions WHERE kind='booking' AND code=\$1 FOR UPDATE/,
  )
  assert.match(
    code,
    /DELETE FROM payment_qr_sessions WHERE kind='booking' AND code=\$1/,
  )
  assert.match(code, /if\(qrSession\.rows\[0\]\?\.reported_at\)/)
})

test("demo settlement is gated, idempotent, and does not trust a client amount", () => {
  assert.match(code, /if\(process\.env\.PETDAY_DEMO_PAYMENT==='true'\)/)
  assert.match(code, /const amount=Number\(windowCheck\.rows\[0\]\?\.requested_amount\)/)
  assert.match(code, /SELECT \* FROM payment_qr_sessions[^\n]+FOR UPDATE/)
  assert.match(code, /UPDATE payment_qr_sessions SET reported_at=now\(\)/)
  assert.match(code, /reference='DEMO-'\+b\.code\+'-'\+windowCheck\.rows\[0\]\.issued_at/)
  assert.match(code, /Trạng thái vẫn là Chưa thanh toán/)
  assert.doesNotMatch(bank, /requestedAmount|paymentAmount\s*:/)
})

test("demo success refreshes booking state without a hard page reload", () => {
  assert.match(bank, /onDemoConfirmed\?\.\(responseMessage\)/)
  assert.doesNotMatch(bank, /window\.location\.reload/)
  assert.match(portal, /onDemoConfirmed=\{async \(message\) =>/)
  assert.match(code, /Xác nhận thanh toán thử nghiệm thành công/)
})

test("issuing a valid replacement QR clears a stale confirmation error", () => {
  const qrPanel = readFileSync(
    new URL("../../src/PaymentQrPanel.tsx", import.meta.url),
    "utf8",
  )
  assert.match(qrPanel, /onSessionIssued\?\.\(\)/)
  assert.match(bank, /onSessionIssued=\{\(\) =>/)
  assert.match(bank, /setError\(""\)/)
})

test("customer QR UI removes demo transfer instructions and collapses booking notes", () => {
  assert.doesNotMatch(
    bank,
    /QR chỉ dùng để tham chiếu trong PetDay\. Chế độ thử nghiệm tự cập nhật/,
  )
  assert.doesNotMatch(bank, /Chuyển cọc theo hướng dẫn của PetDay/)
  assert.match(portal, /Lưu ý khi đặt lịch/)
  assert.match(portal, /aria-expanded=\{bookingNotesOpen\}/)
  assert.match(portal, /setBookingNotesOpen\(\(open\) => !open\)/)
})
