export const CARE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const CARE_IMAGE_MAX_PER_EVENT = 5;

const formats = {
  jpg: { mimeType: 'image/jpeg', extension: 'jpg' },
  png: { mimeType: 'image/png', extension: 'png' },
  webp: { mimeType: 'image/webp', extension: 'webp' },
};

export function inspectCareImage(buffer, claimedContentType = '') {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { error: 'Không đọc được ảnh. Chọn file JPG, PNG hoặc WebP.' };
  }
  if (buffer.length > CARE_IMAGE_MAX_BYTES) {
    return { error: 'Ảnh vượt quá dung lượng 5 MB.' };
  }
  const isJpg = buffer.length > 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  const isPng = buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp = buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  const format = isJpg ? formats.jpg : isPng ? formats.png : isWebp ? formats.webp : null;
  if (!format) return { error: 'Nội dung file không phải ảnh JPG, PNG hoặc WebP hợp lệ.' };
  const normalizedClaim = claimedContentType.split(';', 1)[0].trim().toLowerCase().replace('image/jpg', 'image/jpeg');
  if (normalizedClaim && normalizedClaim !== format.mimeType) {
    return { error: 'Định dạng khai báo không khớp với nội dung ảnh.' };
  }
  return format;
}

export function safeOriginalImageName(value = '') {
  let decoded = String(value).slice(0, 600);
  try { decoded = decodeURIComponent(decoded); } catch {}
  const leaf = decoded.split(/[\\/]/).pop() || 'anh-cham-soc';
  const cleaned = leaf.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 240);
  return cleaned || 'anh-cham-soc';
}
