# Nextstep Recruitment Web Application

## 📋 Tổng quan
Ứng dụng tuyển dụng với các tính năng:
- Quản lý công việc cho ứng viên và nhà tuyển dụng
- Chatbot AI hỗ trợ định hướng nghề nghiệp
- Quản lý hồ sơ ứng viên
- Tìm kiếm và lưu việc làm

## 🚀 Cài đặt và Chạy

### Yêu cầu
- Node.js >= 14.x
- Backend API server (chạy trên port 3001)
- npm hoặc yarn

### Bước 1: Clone project
```bash
git clone <repository-url>
cd do-an-quang
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình môi trường
Tạo file `.env.local` trong thư mục gốc:
```env
# API Configuration - Local Development
REACT_APP_API_URL=http://localhost:3001/

# Supabase Configuration (for Chat feature)
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_SUPABASE_EDGE_FUNCTIONS_URL=your_edge_functions_url

# Email JS Configuration
REACT_APP_EMAILJS_SERVICE_ID=your_service_id
REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id
REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key
```

### Bước 4: Chạy backend API
⚠️ **Quan trọng**: Backend server phải chạy trước khi start frontend!

Backend server cần chạy trên `http://localhost:3001`

### Bước 5: Chạy ứng dụng
```bash
npm start
```

Ứng dụng sẽ mở tại `http://localhost:3000`

## 🔧 Các sửa đổi gần đây

### 1. Trang Saved Jobs (/candidate/saved-jobs)
**Vấn đề đã sửa:**
- ✅ Trang hiển thị đúng layout và navigation
- ✅ Thêm loading state khi fetch data
- ✅ Cải thiện error handling với thông báo chi tiết
- ✅ Thêm nút "Thử lại" khi có lỗi
- ✅ Hiển thị thông báo khi không kết nối được backend

**File đã sửa:**
- `src/view/candidate/management/SavedJobs.js`

### 2. Trang Applied Jobs (/candidate/applied-jobs)
**Cải tiến:**
- ✅ Thêm loading state
- ✅ Cải thiện error handling
- ✅ Thêm nút retry
- ✅ Hiển thị thông báo chi tiết cho các lỗi network/API

**File đã sửa:**
- `src/view/candidate/management/AppliedJobs.js`

### 3. Error Handling Improvements
Các thành phần đã được cải thiện với:
- **Network errors**: Hiển thị thông báo rõ ràng khi không kết nối được backend
- **404 errors**: Thông báo API endpoint không tồn tại
- **401 errors**: Yêu cầu đăng nhập lại
- **Loading states**: Spinner và thông báo loading
- **Retry mechanism**: Nút thử lại khi có lỗi

## 📁 Cấu trúc thư mục

```
src/
├── api/              # API clients và axios instances
│   ├── candidate.js
│   ├── candidateAxios.js
│   ├── savedJobsApi.js
│   └── ...
├── components/       # Reusable components
├── contexts/         # React contexts
├── hooks/            # Custom hooks
├── services/         # Business logic services
├── stores/           # Zustand stores (state management)
├── view/             # Page components
│   ├── candidate/
│   │   └── management/
│   │       ├── SavedJobs.js
│   │       └── AppliedJobs.js
│   ├── employer/
│   └── admin/
└── utils/            # Utility functions
```

## 🐛 Xử lý lỗi thường gặp

### 1. Lỗi 404 - API không tồn tại
**Nguyên nhân**: Backend server không chạy hoặc endpoint không đúng

**Giải pháp**:
```bash
# Kiểm tra backend đang chạy trên port 3001
curl http://localhost:3001/api/candidates/getCurrent

# Hoặc kiểm tra trong browser
# Mở http://localhost:3001
```

### 2. Lỗi Network Error
**Nguyên nhân**: Không kết nối được với backend server

**Giải pháp**:
1. Đảm bảo backend đang chạy
2. Kiểm tra biến môi trường `REACT_APP_API_URL`
3. Kiểm tra CORS settings ở backend

### 3. Lỗi 401 - Unauthorized
**Nguyên nhân**: Token hết hạn hoặc không hợp lệ

**Giải pháp**:
- Đăng nhập lại
- Clear localStorage và đăng nhập lại:
```javascript
localStorage.clear()
// Sau đó refresh page
```

## 🔐 Authentication

Ứng dụng sử dụng JWT tokens lưu trong localStorage:
- `candidate_jwt` - Token cho ứng viên
- `employer_jwt` - Token cho nhà tuyển dụng  
- `admin_jwt` - Token cho admin

## 📝 Test Accounts

Xem file `TEST_ACCOUNTS.md` để biết thông tin tài khoản test.

## 🚢 Deploy

### Deploy Frontend lên Vercel
Xem hướng dẫn chi tiết trong file `DEPLOY_VERCEL.md`

### Deploy Backend
Backend cần được deploy riêng (ví dụ: Render, Railway, Heroku)

## 📚 Technologies

- **Frontend**: React 18.2
- **State Management**: Zustand, Redux Toolkit
- **Styling**: Bootstrap 5, CSS
- **API Client**: Axios
- **Routing**: React Router v6
- **Chat**: Supabase, Socket.IO
- **UI Components**: React Bootstrap, React Icons
- **Forms**: React Hook Form, Yup
- **Markdown**: React Markdown
- **i18n**: react-i18next

## 🤝 Contributing

1. Tạo branch mới cho feature/bugfix
2. Commit changes với message rõ ràng
3. Push và tạo Pull Request
4. Đợi code review

## 📄 License

Private project - All rights reserved

## 📞 Contact

Để biết thêm thông tin, vui lòng liên hệ team phát triển.
