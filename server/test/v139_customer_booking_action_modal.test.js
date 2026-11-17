import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const portal = readFileSync(
  new URL("../../src/Portal.tsx", import.meta.url),
  "utf8",
)

test("customer reschedule and cancellation use one selected-action modal", () => {
  assert.match(
    portal,
    /useState<\{\s*code: string\s*action: "reschedule" \| "cancel"/,
  )
  assert.match(portal, /focusedBookingAction && actionBooking && \(/)
  assert.match(portal, /role="dialog"/)
  assert.match(portal, /aria-modal="true"/)
  assert.doesNotMatch(portal, /const requestPanels =/)
  assert.doesNotMatch(portal, /Yêu cầu hủy lịch đã xác nhận/)
  assert.doesNotMatch(portal, /id=\{"reschedule-booking-"/)
  assert.doesNotMatch(portal, /id=\{"cancel-booking-"/)
})

test("booking card actions use requested labels, icons and colors", () => {
  assert.match(portal, /function CalendarClockIcon\(\)/)
  assert.match(portal, /function CalendarXIcon\(\)/)
  assert.match(portal, /bg-\[#162E59\]/)
  assert.match(portal, /bg-\[#FFF2EF\]/)
  assert.match(portal, /border-\[#F9C4B9\]/)
  assert.match(portal, /text-\[#C9513D\]/)
  assert.match(portal, /gap-2\.5/)
  assert.doesNotMatch(portal, />\s*Hủy lịch theo chính sách\s*</)
})

test("modal preserves keyboard focus and supports Escape without scrolling", () => {
  assert.match(portal, /bookingActionDialogRef/)
  assert.match(portal, /event\.key === "Escape"/)
  assert.match(portal, /event\.key !== "Tab"/)
  assert.match(portal, /previouslyFocused\?\.focus\(\{ preventScroll: true \}\)/)
  assert.match(portal, /document\.body\.style\.overflow = "hidden"/)
  const opener = portal.slice(
    portal.indexOf("const focusBookingAction"),
    portal.indexOf("const actionBooking"),
  )
  assert.doesNotMatch(opener, /scrollIntoView/)
})

test("existing APIs and server-authoritative policy remain in use", () => {
  assert.match(portal, /`\/bookings\/\$\{code\}\/reschedule`/)
  assert.match(portal, /\/cancellation-request"/)
  assert.match(portal, /cancellationPreview\(/)
  assert.match(portal, /beforeAppointment\(b\)/)
  assert.match(portal, /actionNewTimeInPast/)
  assert.match(portal, /Không thể đổi lịch sang thời gian đã qua/)
  assert.match(portal, /setFocusedBookingAction\(null\)/)
  assert.match(portal, /window\.confirm\("Xác nhận hủy lịch này\? Thao tác không thể hoàn tác\."\)/)
  assert.match(portal, /disabled=\{busy/)
})
