# Du-an-cong-nghe

## Giới thiệu
Đây là phiên bản cải tiến của Urace v2 với nhiều tính năng mở rộng nhằm nâng cao trải nghiệm người dùng trong quá trình luyện tập và tham gia chạy bộ.
v1 ---see more in here---> [urace-app](https://github.com/ducanhdangcode/urace-app)

---

## Chức năng cải tiến

- Đăng nhập bên thứ 3
- Popup streak đăng nhập
- Rời nhóm / xóa thành viên khỏi nhóm
- Tự động tính quãng đường di chuyển
- Vẽ tuyến đường trên bản đồ
- Tạo tuyến đường chạy thi
- Giao diện sáng / tối
- Đa ngôn ngữ:
  - Tiếng Việt
  - English
  - 中文
- Liên kết với Health Connect

More features coming soon...

---

# Công nghệ sử dụng

## Backend
- Node.js
- Express.js

## Frontend
- React Native
- Expo

## Database
- MongoDB
- Redis
- Docker

---

# Cài đặt dự án

## Clone project

```bash
git clone <repo-url>
cd Du-an-cong-nghe
```

---

# Chạy Backend

## Chạy MongoDB

```bash
docker run -d -p 27017:27017 mongo
```

## Chạy Redis

```bash
docker run -d -p 6379:6379 redis
```

## Chạy server

```bash
npm run dev
```

---

# Chạy Frontend (Urace)

## Máy ảo Android

```bash
npx expo run:android
```

## Máy thật Android

```bash
npx expo run:android --device
```

---

# Triển khai

Ứng dụng được triển khai bằng Expo.

---

# Ghi chú

- Yêu cầu cài đặt:
  - Node.js
  - Docker
  - Android Studio
  - Expo CLI

- Đảm bảo máy đã bật:
  - Android Emulator hoặc
  - USB Debugging với máy thật
