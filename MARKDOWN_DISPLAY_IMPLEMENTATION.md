# Markdown Content Display Implementation

## Overview
Successfully implemented markdown content display from Supabase storage bucket `course-files` instead of PDF files.

## Changes Made

### 1. Created Course Content Service
**File:** `src/services/courseContentService.js`

- `fetchLessonMarkdown(fileName)`: Fetches markdown content from Supabase storage
- `getLessonFileName(lessonId)`: Maps lesson IDs to markdown file names
- `listCourseFiles()`: Lists all files in the course-files bucket

**Lesson ID Mappings:**
- `marketing-1` → `marketing_01_marketing_la_gi.md`
- `marketing-2` → `marketing_02_cac_loai_hinh_marketing.md`
- `uiux-1` → `uiux_01_uiux_design_la_gi.md`
- `graphic-design-1` → `graphic_design_01_graphic_design_la_gi.md`
- ... (15 lessons for each category)

### 2. Enhanced Markdown Renderer
**File:** `src/components/MarkdownRenderer.js`

Added syntax highlighting support:
- Imported `rehype-highlight` plugin
- Added GitHub-style code highlighting CSS

### 3. Updated LessonDetailDrawer Component
**File:** `src/view/candidate/LessonDetailDrawer.js`

**New Features:**
- Fetches markdown content from Supabase on lesson open
- Displays markdown content with proper rendering
- Shows loading state while fetching
- Shows error state if fetch fails
- Falls back to old content sections if markdown unavailable

**New State:**
- `markdownContent`: Stores fetched markdown
- `isLoadingContent`: Loading indicator
- `contentError`: Error message

**CSS Updates:**
**File:** `src/view/candidate/LessonDetailDrawer.css`
- Added `.lesson-markdown-section` styling
- Added `.lesson-content-loading` styling
- Added `.lesson-content-error` styling

### 4. Updated ChatLessonDrawer Component
**File:** `src/components/ChatLessonDrawer.js`

**New Features:**
- Added "Nội dung" (Content) tab for markdown display
- Fetches markdown content from Supabase
- Prioritizes markdown over PDF in tab order
- Shows loading/error states

**CSS Updates:**
**File:** `src/components/ChatLessonDrawer.css`
- Added `.drawer-markdown-content` styling
- Added loading/error message styling

## File Structure

```
src/
├── services/
│   └── courseContentService.js (NEW)
├── components/
│   ├── MarkdownRenderer.js (UPDATED)
│   ├── MarkdownRenderer.css (existing)
│   ├── ChatLessonDrawer.js (UPDATED)
│   └── ChatLessonDrawer.css (UPDATED)
└── view/
    └── candidate/
        ├── LessonDetailDrawer.js (UPDATED)
        └── LessonDetailDrawer.css (UPDATED)
```

## How It Works

1. **User opens a lesson** in either LessonDetailDrawer or ChatLessonDrawer
2. **Component extracts lesson ID** (e.g., "marketing-1", "uiux-5")
3. **Service maps ID to filename** using `getLessonFileName()`
4. **Service fetches file from Supabase**:
   - Bucket: `course-files`
   - Uses chat Supabase client (`supabaseChat`)
   - Gets public URL and fetches content
5. **Component renders markdown** using MarkdownRenderer component
6. **MarkdownRenderer displays** with:
   - GFM (GitHub Flavored Markdown) support
   - Syntax highlighting for code blocks
   - Proper styling for headers, lists, tables, etc.

## Testing Instructions

### 1. Verify Supabase Configuration
Ensure your `.env` has correct Supabase chat credentials:
```
REACT_APP_CHAT_SUPABASE_URL=https://hdbgaxifsgrvlfsztvrm.supabase.co
REACT_APP_CHAT_SUPABASE_ANON_KEY=your-key-here
```

### 2. Check Bucket Permissions
In Supabase dashboard:
- Go to Storage → `course-files` bucket
- Ensure files are publicly accessible OR
- Ensure your anon key has read permissions

### 3. Test Markdown Display

**Test in LessonDetailDrawer:**
1. Navigate to a roadmap (e.g., Marketing, UI/UX, Graphic Design)
2. Click on any lesson
3. Verify:
   - ✅ "Đang tải nội dung..." shows initially
   - ✅ Markdown content displays correctly
   - ✅ Formatting is proper (headers, lists, bold, etc.)
   - ✅ Vietnamese characters display correctly
   - ✅ Error message shows if file not found

**Test in ChatLessonDrawer:**
1. Open AI chat
2. Ask for a specific lesson
3. Click on lesson link
4. Verify:
   - ✅ "Nội dung" tab appears first
   - ✅ Markdown loads and displays
   - ✅ Can switch between tabs (Nội dung, PDF, Video)

### 4. Check Console for Errors

Open browser DevTools and check for:
```
[CourseContent] Fetching markdown file: marketing_01_marketing_la_gi.md
[CourseContent] Public URL: https://...
[CourseContent] Successfully fetched XXX characters
```

### 5. Fallback Testing

Test with a lesson ID that doesn't have markdown:
- Should show old content sections OR
- Should show "Không tìm thấy nội dung bài học"

## Expected Behavior

### Success State:
- Markdown content loads within 1-2 seconds
- Content displays with proper formatting
- Vietnamese text renders correctly
- Code blocks have syntax highlighting
- Tables and lists display properly

### Loading State:
- Shows "Đang tải nội dung..." message
- Gray background with proper styling

### Error State:
- Shows "Không thể tải nội dung bài học. Vui lòng thử lại sau."
- Displays error message details
- User can close drawer and try again

## Troubleshooting

### Problem: "Supabase chat client not configured"
**Solution:** Check `.env` file has `REACT_APP_CHAT_SUPABASE_URL` and `REACT_APP_CHAT_SUPABASE_ANON_KEY`

### Problem: "Failed to fetch file: 404"
**Solution:** 
- Verify file exists in Supabase storage `course-files` bucket
- Check filename spelling matches exactly
- Ensure bucket is public or anon key has access

### Problem: Markdown not rendering
**Solution:**
- Check browser console for errors
- Verify `react-markdown` and plugins are installed
- Check if `markdownContent` state has data

### Problem: Vietnamese characters broken
**Solution:**
- Ensure files are saved as UTF-8
- Check Supabase returns correct encoding
- Verify fetch response is decoded as text

## Next Steps

1. ✅ Test with all lesson types (marketing, uiux, graphic-design)
2. ✅ Verify markdown rendering quality
3. Add more lesson ID mappings as needed
4. Consider caching markdown content for performance
5. Add markdown content to other lesson types if needed

## Benefits

✅ **Better Content Management**: Markdown files are easier to edit than PDFs
✅ **Better SEO**: Text content is searchable and indexable
✅ **Better UX**: Faster loading, responsive design, copy-paste friendly
✅ **Better Accessibility**: Screen readers can read markdown content
✅ **Version Control**: Markdown files can be tracked in git
✅ **Centralized Storage**: All content in Supabase, no external dependencies
