# Deploy Frontend lên Vercel

## 1. Tạo tài khoản Vercel

1. Truy cập https://vercel.com
2. Đăng ký bằng GitHub (khuyến nghị)

## 2. Import Project

1. Click **"Add New..."** → **"Project"**
2. Chọn **"Import Git Repository"**
3. Chọn repository `recruitment_web`

## 3. Cấu hình Project

| Field | Value |
|-------|-------|
| **Project Name** | `nextstep-recruitment` |
| **Framework Preset** | Create React App |
| **Root Directory** | `frontend` |

## 4. Environment Variables

Thêm các biến môi trường sau:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://nextstep-api.onrender.com` |

⚠️ **Lưu ý**: URL API phải là URL backend sau khi deploy lên Render!

## 5. Deploy

1. Click **"Deploy"**
2. Chờ build hoàn thành (khoảng 2-3 phút)
3. Sau khi deploy xong, bạn sẽ có URL như: `https://nextstep-recruitment.vercel.app`

## 6. Cập nhật CORS ở Backend

Sau khi có URL frontend, quay lại Render và cập nhật:
- `CORS_ORIGIN` = `https://nextstep-recruitment.vercel.app`

## Auto Deploy

- Mỗi lần bạn push code lên GitHub, Vercel sẽ tự động deploy lại!
- Preview deployments cho mỗi Pull Request

## Custom Domain (Tùy chọn)

1. Vào **Settings** → **Domains**
2. Thêm domain của bạn
3. Cập nhật DNS theo hướng dẫn
