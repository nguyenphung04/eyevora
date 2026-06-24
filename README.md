Eyevora
Hệ thống thương mại điện tử kinh doanh kính mắt, được xây dựng nhằm hỗ trợ khách hàng mua sắm trực tuyến và giúp quản trị viên quản lý hoạt động kinh doanh hiệu quả.

Dự án được phát triển với kiến trúc tách biệt Backend và Frontend:

- Backend: Spring Boot REST API
- Frontend: React + Vite
- Database: MySQL

---

# Tính năng nổi bật

## Xác thực và bảo mật

- Đăng ký tài khoản
- Xác thực OTP qua Email
- Đăng nhập bằng JWT
- Quên mật khẩu
- Đổi mật khẩu
- Phân quyền User / Admin

---

## Quản lý tài khoản

- Cập nhật thông tin cá nhân
- Xem lịch sử đơn hàng
- Theo dõi trạng thái đơn hàng
- Quản lý hồ sơ người dùng

---

## Quản lý sản phẩm

- Hiển thị danh sách sản phẩm
- Xem chi tiết sản phẩm
- Tìm kiếm sản phẩm
- Phân loại theo danh mục
- Hiển thị tồn kho theo sản phẩm

---

## Giỏ hàng

- Thêm sản phẩm vào giỏ hàng
- Cập nhật số lượng
- Xóa sản phẩm khỏi giỏ hàng
- Tính tổng tiền tự động

---

## Đặt hàng và thanh toán

- Tạo đơn hàng
- Thanh toán khi nhận hàng (COD)
- Thanh toán trực tuyến qua VNPay
- Theo dõi trạng thái đơn hàng
- Xem lịch sử mua hàng

---

## Đánh giá sản phẩm

- Chấm điểm sản phẩm
- Viết nhận xét
- Hiển thị đánh giá từ khách hàng
- Tính điểm đánh giá trung bình

---

## Voucher và khuyến mãi

- Áp dụng mã giảm giá
- Kiểm tra điều kiện sử dụng
- Tính toán giá trị giảm giá

---

## Chatbot tư vấn sản phẩm

- Hỗ trợ tìm kiếm sản phẩm
- Gợi ý sản phẩm theo nhu cầu khách hàng
- Tư vấn lựa chọn kính mắt

---

## Dashboard quản trị

- Thống kê doanh thu
- Thống kê đơn hàng
- Thống kê khách hàng
- Thống kê sản phẩm
- Hiển thị sản phẩm bán chạy
- Hiển thị sản phẩm sắp hết hàng

---

## Quản trị hệ thống

### Quản lý sản phẩm

- Thêm sản phẩm
- Cập nhật sản phẩm
- Kích hoạt / vô hiệu hóa sản phẩm
- Quản lý biến thể sản phẩm

### Quản lý danh mục

- Thêm danh mục
- Chỉnh sửa danh mục
- Quản lý trạng thái danh mục

### Quản lý người dùng

- Xem danh sách người dùng
- Khóa / mở khóa tài khoản

### Quản lý đơn hàng

- Xem danh sách đơn hàng
- Cập nhật trạng thái đơn hàng

### Quản lý voucher

- Tạo voucher
- Cập nhật voucher
- Kích hoạt / vô hiệu hóa voucher

---

# Công nghệ sử dụng

## Backend

- Java 17
- Spring Boot
- Spring Security
- JWT Authentication
- Spring Data JPA (Hibernate)
- MySQL
- Maven
- Cloudinary
- Java Mail Sender
- VNPay

## Frontend

- React
- Vite
- React Router DOM
- Axios
- Tailwind CSS
- React Toastify

---

# Cấu trúc dự án

eyevora/
│
├── backend/
│   ├── src/main/java
│   │   ├── controller
│   │   ├── service
│   │   ├── repository
│   │   ├── entity
│   │   ├── dto
│   │   └── security
│   │
│   └── src/main/resources
│
├── frontend/
│   ├── src
│   │   ├── api
│   │   ├── components
│   │   ├── context
│   │   ├── pages
│   │   └── assets
│   │
│   └── public
│
└── README.md

---

# Yêu cầu hệ thống

## Backend

- Java 17 trở lên
- Maven 3.9 trở lên
- MySQL 8 trở lên

## Frontend

- Node.js 18 trở lên
- npm 9 trở lên


#  Cấu hình dự án

Tại thư mục backend, sao chép file cấu hình mẫu:
application.properties.example

thành:

application.properties

Sau đó cập nhật các thông tin cần thiết

# Chạy Backend

cd backend

./mvnw spring-boot:run

Hoặc:

mvn spring-boot:run

Backend mặc định chạy tại:

http://localhost:8080

---

# Chạy Frontend

cd frontend

npm install

npm run dev

Frontend mặc định chạy tại:

http://localhost:5173
