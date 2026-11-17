import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8")
const app = read("../../src/App.tsx")
const portal = read("../../src/Portal.tsx")
const toast = read("../../src/ToastProvider.tsx")
const api = read("../../src/apiFetch.ts")
const main = read("../../src/main.tsx")

test("about badge shows ten years without changing its layout classes", () => {
  assert.match(app, />10<\/strong><span[^>]+>năm đồng hành/)
  assert.doesNotMatch(app, />—<\/strong><span[^>]+>năm đồng hành/)
})

test("booking Taxi note and customer mandatory-deposit note are removed", () => {
  assert.doesNotMatch(portal, /Pet Taxi là tiện ích đi kèm lịch hẹn, không quản lý/)
  assert.doesNotMatch(portal, /Cọc bắt buộc:/)
  assert.match(portal, /Tổng tiền/)
  assert.match(portal, /Đã thu/)
  assert.match(portal, /Còn lại/)
})

test("one global accessible toast replaces the portal top banners", () => {
  assert.match(main, /<ToastProvider><App \/><\/ToastProvider>/)
  assert.match(toast, /fixed left-1\/2/)
  assert.match(toast, /max-w-\[460px\]/)
  assert.match(toast, /role=\{isError \? "alert" : "status"\}/)
  assert.match(toast, /window\.setTimeout\(\(\) => setLeaving\(true\), 4500\)/)
  assert.match(toast, /window\.clearTimeout\(fadeTimer\)/)
  assert.match(toast, /aria-label="Đóng thông báo"/)
  assert.doesNotMatch(portal, /className="rounded-xl bg-red-50 p-4 font-medium text-red-700"/)
})

test("API feedback is sanitized for customers and retains technical console logging", () => {
  assert.match(toast, /HTTP\\s\+\\d\+/)
  assert.match(toast, /Vui lòng chọn khung giờ khác/)
  assert.match(api, /console\.error\('\[PetDay API\]'/)
  assert.match(api, /showToast\(cleanToastMessage\(technical\), 'error'\)/)
  assert.match(api, /showToast\(body\?\.message \|\| 'Thao tác đã được thực hiện thành công\.'/)
})
