import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const portal = readFileSync(new URL("../../src/Portal.tsx", import.meta.url), "utf8")
const snapshot = readFileSync(
  new URL("../../src/BookingFinancialSnapshot.tsx", import.meta.url),
  "utf8",
)
const server = readFileSync(new URL("../src/server.js", import.meta.url), "utf8")

test("refund workspace is read-only, with no separate taxi refund actions", () => {
  assert.match(portal, /AutoPolicyFinancePanel/)
  assert.match(portal, /financePanel === "refunds"/)
  assert.match(portal, /false\s*&&[\s\S]*?financePanel === "refunds"\s*&&\s*\(\s*<section/)
  assert.doesNotMatch(portal, /<BookingSettlementPanel token=/)
})

test("customer completed service review uses clickable stars and existing post endpoint", () => {
  assert.match(
    portal,
    /role="radiogroup"\s*aria-label="Chọn số sao đánh giá"/,
  )
  assert.match(
    portal,
    /update\(\s*`\/bookings\/\$\{b\.code\}\/review`,\s*"POST"/,
  )
})

test("schema diagnostic checks real settlement columns and invoice explains 503", () => {
  assert.match(server, /pet_taxi_legs:\['id','booking_id','leg','fee','state','refund_due'\]/)
  assert.match(server, /taxi_refund_requests:\['id','taxi_leg_id','booking_id','amount','status','refund_reference'\]/)
  assert.match(snapshot, /Kết quả \/api\/health\/schema chỉ kiểm tra một số bảng\/cột/)
})
