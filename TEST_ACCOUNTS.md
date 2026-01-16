# Test Accounts

## Candidate Account

**Email:** nhanlq2013@gmail.com  
**Password:** asdasd123

**Purpose:** Testing candidate features including:
- Job search and filtering
- Job application
- Saved jobs management
- Applied jobs tracking
- Avatar menu dropdown
- Logout functionality

**Note:** This account has been validated for the recruitment feature implementation (Feature #7 - Avatar Menu).

---

## Testing Notes

### Avatar Menu Feature (Feature #7)
- ✅ Successfully implemented dropdown menu
- ✅ Menu items:
  - "Việc làm đã ứng tuyển" → `/candidate/applied-jobs`
  - "Việc đã lưu" → `/candidate/saved-jobs`
  - "Đăng xuất" → Clears auth and redirects to `/login`
- ✅ Design matches Figma specification (node-id: 8587-4020)
- ✅ Navigation links working correctly
- ✅ Logout functionality working (clears `candidate-auth-storage` from localStorage)

### Backend Status
- ⚠️ Backend API not running on port 3001
- Frontend displays properly but data fetch returns 404 errors
- Start backend server to test with real data

### Screenshots
- Avatar menu closed: `avatar-menu-dropdown.png`
- Navigation test: Successfully navigated to Applied Jobs page
