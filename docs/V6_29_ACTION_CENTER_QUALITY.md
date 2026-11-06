# PetDay V6.29 – Action Center & UX Quality

## Thay đổi
- Gộp vùng giới thiệu hành trình lặp lại trong trang Lịch hẹn thành một khu vực **Việc cần theo dõi** có bốn thẻ ngắn: Chờ xác nhận, Chuẩn bị trước khi đến, Kiểm tra thanh toán, Chưa đánh giá.
- Nhấn vào thẻ mở đúng tab trong Lịch hẹn của tôi. Lịch chờ xác nhận được lọc bằng trạng thái; chuẩn bị trước khi đến lọc lịch sắp tới; thanh toán và đánh giá mở tab tương ứng.
- Các số liệu được tính từ danh sách lịch mà API trả về cho đúng tài khoản. Không có dữ liệu mẫu, không có giao dịch giả và không thêm mục menu.
- Không còn hai nút Đặt lịch mới nằm cạnh nhau ở phần đầu trang; làm gọn khối bố cục trên điện thoại.
- Tự xóa cảnh báo tải dữ liệu trước đó khi cả `/pets` và `/bookings` tải lại thành công.
- Tối ưu bàn phím, nhãn mô tả, hiệu ứng chuyển động giảm và trình bày thẻ responsive.

## Quy tắc nghiệp vụ
- Lịch **đã hủy** không bị nhắc thanh toán; lịch **đã hoàn tất nhưng chưa thanh toán** vẫn được nhắc kiểm tra thu tiền.
- Một lịch đã xác nhận, chưa đến ngày hẹn và chưa gửi hồ sơ trước khi đến mới được nhắc cập nhật hồ sơ.
- Một lịch hoàn tất chỉ được nhắc đánh giá nếu chưa có đánh giá.
- Trạng thái thanh toán chỉ thay đổi qua quy trình API và đối soát Admin hiện hữu.
- Đây là bộ đếm công việc ở frontend, không phải hệ thống notification tự động mới.

## Cài đặt
- Nâng từ V6.28, không có migration SQL mới. Database vẫn cần các migration từ 001 đến 020 theo trạng thái source trước đó.
- Sao chép riêng `server/.env` bản đang hoạt động, không copy `node_modules` hoặc làm lộ thông tin bí mật.
- Dừng process bản cũ đang dùng 4000/8443 rồi chạy `npm install` và `npm run dev` tương ứng trong root/server.

## Tiêu chí kiểm thử thủ công
1. Customer chưa có lịch: cả bốn thẻ đều là 0 và trang vẫn hiển thị nút tạo lịch.
2. Khách có lịch chờ duyệt: thẻ Chờ xác nhận tăng, nhấn sẽ thấy lịch tương ứng.
3. Lịch đã xác nhận, chưa có thông tin trước ngày đến: thẻ Chuẩn bị tăng; điền thành công và làm mới sẽ giảm.
4. Lịch chưa thanh toán: thẻ Thanh toán tăng và mở tab thanh toán; lịch đã hủy không bị tính.
5. Hoàn tất, chưa đánh giá: thẻ Đánh giá tăng, sau khi đánh giá thành công và làm mới sẽ giảm.
6. Admin vẫn thấy đúng các tab vận hành; nhân viên chỉ thấy dữ liệu phân công.
7. Trên mobile 375px không có thanh cuộn ngang bất thường; kiểm tra thao tác bằng bàn phím.

## Giới hạn xác minh
- Bộ unit test backend và rule bộ đếm chạy độc lập; chưa có frontend production build và E2E với PostgreSQL người dùng.
- Tài liệu các hệ thống khác chỉ dùng để tham khảo cách sắp đặt, không sao chép giao diện thương hiệu của họ.
