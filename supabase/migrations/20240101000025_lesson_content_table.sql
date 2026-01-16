-- Create lesson_content table to store lesson metadata including YouTube links
-- This table holds the mapping between lesson IDs and their associated content URLs

CREATE TABLE IF NOT EXISTS lesson_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'uiux-1', 'marketing-5', 'graphic-design-10'
    course_type VARCHAR(50) NOT NULL, -- 'marketing', 'uiux', 'graphic-design'
    lesson_number INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    markdown_file VARCHAR(200), -- e.g., 'uiux_01_uiux_design_la_gi.md'
    youtube_url VARCHAR(500), -- YouTube video URL
    pdf_url VARCHAR(500), -- Google Drive PDF URL (legacy)
    duration_hours DECIMAL(4,2) DEFAULT 2, -- Estimated learning time in hours
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_lesson_content_lesson_id ON lesson_content(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_content_course_type ON lesson_content(course_type);
CREATE INDEX IF NOT EXISTS idx_lesson_content_active ON lesson_content(is_active);

-- Enable RLS
ALTER TABLE lesson_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access to lesson content
CREATE POLICY "Allow public read access to lesson_content"
    ON lesson_content FOR SELECT
    TO public
    USING (is_active = true);

-- Allow authenticated users to read all lesson content
CREATE POLICY "Allow authenticated read access to lesson_content"
    ON lesson_content FOR SELECT
    TO authenticated
    USING (true);

-- Insert Marketing lessons
INSERT INTO lesson_content (lesson_id, course_type, lesson_number, title, markdown_file, youtube_url, duration_hours) VALUES
('marketing-1', 'marketing', 1, 'Marketing là gì?', 'marketing_01_marketing_la_gi.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('marketing-2', 'marketing', 2, 'Các loại hình Marketing', 'marketing_02_cac_loai_hinh_marketing.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('marketing-3', 'marketing', 3, 'Mục tiêu và giá trị của Marketing', 'marketing_03_muc_tieu_va_gia_tri_cua_marketing.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('marketing-4', 'marketing', 4, 'Quy trình Marketing cơ bản', 'marketing_04_quy_trinh_marketing_co_ban.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('marketing-5', 'marketing', 5, 'Marketing Mix – Mô hình 4P', 'marketing_05_marketing_mix_mo_hinh_4p.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('marketing-6', 'marketing', 6, 'Mô hình 7P trong Marketing dịch vụ', 'marketing_06_mo_hinh_7p_trong_marketing_dich_vu.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('marketing-7', 'marketing', 7, 'Lựa chọn chiến lược Marketing phù hợp', 'marketing_07_lua_chon_chien_luoc_marketing_phu_hop.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('marketing-8', 'marketing', 8, 'Ứng dụng Marketing Mix vào thực tế', 'marketing_08_ung_dung_marketing_mix_vao_thuc_te.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('marketing-9', 'marketing', 9, 'Digital Marketing cơ bản', 'marketing_09_digital_marketing_co_ban.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('marketing-10', 'marketing', 10, 'Content Marketing cơ bản', 'marketing_10_content_marketing_co_ban.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('marketing-11', 'marketing', 11, 'Social Media Marketing cơ bản', 'marketing_11_social_media_marketing_co_ban.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('marketing-12', 'marketing', 12, 'SEO cơ bản (Search Engine Optimization)', 'marketing_12_seo_co_ban_search_engine_optimization.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('marketing-13', 'marketing', 13, 'Email Marketing cơ bản', 'marketing_13_email_marketing_co_ban.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('marketing-14', 'marketing', 14, 'Marketing Analytics cơ bản', 'marketing_14_marketing_analytics_co_ban.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('marketing-15', 'marketing', 15, 'Chiến lược Marketing tích hợp', 'marketing_15_chien_luoc_marketing_tich_hop.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),

-- Insert UI/UX lessons with YouTube videos from playlist: https://www.youtube.com/playlist?list=PLUPeGakeL55FJhL9-AbPOnrRJXzIMQ7DX
('uiux-1', 'uiux', 1, 'UI/UX Design là gì?', 'uiux_01_uiux_design_la_gi.md', 'https://www.youtube.com/embed/YNeOB8AqCgs', 2),
('uiux-2', 'uiux', 2, 'Tư duy lấy người dùng làm trung tâm', 'uiux_02_tu_duy_lay_nguoi_dung_lam_trung_tam.md', 'https://www.youtube.com/embed/--6ABDok-AI', 2),
('uiux-3', 'uiux', 3, 'Quy trình thiết kế UI/UX', 'uiux_03_quy_trinh_thiet_ke_uiux.md', 'https://www.youtube.com/embed/NHP5uzfw-6c', 2),
('uiux-4', 'uiux', 4, 'Vai trò và kỹ năng của UI/UX Designer', 'uiux_04_vai_tro_va_ky_nang_cua_uiux_designer.md', 'https://www.youtube.com/embed/_A8V1lDoQMo', 2),
('uiux-5', 'uiux', 5, 'UX Research cơ bản', 'uiux_05_ux_research_co_ban.md', 'https://www.youtube.com/embed/Ctdya1_bnGc', 2),
('uiux-6', 'uiux', 6, 'Persona và User Journey', 'uiux_06_persona_va_user_journey.md', 'https://www.youtube.com/embed/bVx0jptsqrQ', 2),
('uiux-7', 'uiux', 7, 'Xác định vấn đề & Insight người dùng', 'uiux_07_xac_dinh_van_de_insight_nguoi_dung.md', 'https://www.youtube.com/embed/Uxxcl9TzB3g', 2),
('uiux-8', 'uiux', 8, 'Information Architecture (IA)', 'uiux_08_information_architecture_ia.md', 'https://www.youtube.com/embed/rUPj-1xPo1I', 2),
('uiux-9', 'uiux', 9, 'User Flow & Screen Map', 'uiux_09_user_flow_screen_map.md', 'https://www.youtube.com/embed/EOXhj15k8sw', 2),
('uiux-10', 'uiux', 10, 'Wireframe', 'uiux_10_wireframe.md', 'https://www.youtube.com/embed/jGUqWpnva-A', 2),
('uiux-11', 'uiux', 11, 'Nguyên lý thiết kế UI', 'uiux_11_nguyen_ly_thiet_ke_ui.md', 'https://www.youtube.com/embed/By-5_yxPZeA', 2),
('uiux-12', 'uiux', 12, 'Màu sắc & Typography', 'uiux_12_mau_sac_typography.md', 'https://www.youtube.com/embed/Zuy7WzvV9qc', 2),
('uiux-13', 'uiux', 13, 'Component & Design System', 'uiux_13_component_design_system.md', 'https://www.youtube.com/embed/ajIaoPKBcxI', 2),
('uiux-14', 'uiux', 14, 'Prototype & Công cụ thiết kế', 'uiux_14_prototype_cong_cu_thiet_ke.md', 'https://www.youtube.com/embed/j8lfwDldt_s', 2),
('uiux-15', 'uiux', 15, 'Usability Testing & Hoàn thiện thiết kế', 'uiux_15_usability_testing_hoan_thien_thiet_ke.md', 'https://www.youtube.com/embed/w8Mvjv9eFXk', 2),

-- Insert Graphic Design lessons
('graphic-design-1', 'graphic-design', 1, 'Graphic Design là gì?', 'graphic_design_01_graphic_design_la_gi.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('graphic-design-2', 'graphic-design', 2, 'Vai trò của Graphic Design trong truyền thông', 'graphic_design_02_vai_tro_cua_graphic_design_trong_truyen_thong.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('graphic-design-3', 'graphic-design', 3, 'Tư duy thiết kế (Design Thinking) trong Graphic Design', 'graphic_design_03_tu_duy_thiet_ke_design_thinking_trong_graphic_design.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('graphic-design-4', 'graphic-design', 4, 'Các nguyên lý cơ bản trong thiết kế đồ họa', 'graphic_design_04_cac_nguyen_ly_co_ban_trong_thiet_ke_do_hoa.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('graphic-design-5', 'graphic-design', 5, 'Màu sắc trong thiết kế đồ họa', 'graphic_design_05_mau_sac_trong_thiet_ke_do_hoa.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('graphic-design-6', 'graphic-design', 6, 'Typography trong thiết kế đồ họa', 'graphic_design_06_typography_trong_thiet_ke_do_hoa.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('graphic-design-7', 'graphic-design', 7, 'Bố cục (Layout) trong thiết kế đồ họa', 'graphic_design_07_bo_cuc_layout_trong_thiet_ke_do_hoa.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('graphic-design-8', 'graphic-design', 8, 'Hình ảnh & Yếu tố đồ họa trong thiết kế', 'graphic_design_08_hinh_anh_yeu_to_do_hoa_trong_thiet_ke.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('graphic-design-9', 'graphic-design', 9, 'Nhận diện thương hiệu (Brand Identity)', 'graphic_design_09_nhan_dien_thuong_hieu_brand_identity.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('graphic-design-10', 'graphic-design', 10, 'Thiết kế ấn phẩm truyền thông (Poster, Banner, Social Media)', 'graphic_design_10_thiet_ke_an_pham_truyen_thong_poster_banner_social_media.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('graphic-design-11', 'graphic-design', 11, 'Thiết kế bao bì (Packaging Design)', 'graphic_design_11_thiet_ke_bao_bi_packaging_design.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('graphic-design-12', 'graphic-design', 12, 'Thiết kế giao diện cơ bản cho Web/App (UI cơ bản cho Graphic Designer)', 'graphic_design_12_thiet_ke_giao_dien_co_ban_cho_web_app_ui_co_ban_cho_graphic_designer.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('graphic-design-13', 'graphic-design', 13, 'Quy trình làm việc & Tư duy của Graphic Designer chuyên nghiệp', 'graphic_design_13_quy_trinh_lam_viec_tu_duy_cua_graphic_designer_chuyen_nghiep.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('graphic-design-14', 'graphic-design', 14, 'Xây dựng Portfolio Graphic Design', 'graphic_design_14_xay_dung_portfolio_graphic_design.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
('graphic-design-15', 'graphic-design', 15, 'Định hướng nghề nghiệp & Phát triển sự nghiệp Graphic Design', 'graphic_design_15_dinh_huong_nghe_nghiep_phat_trien_su_nghiep_graphic_design.md', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2)
ON CONFLICT (lesson_id) DO UPDATE SET
    title = EXCLUDED.title,
    markdown_file = EXCLUDED.markdown_file,
    youtube_url = EXCLUDED.youtube_url,
    duration_hours = EXCLUDED.duration_hours,
    updated_at = NOW();

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lesson_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lesson_content_updated_at ON lesson_content;
CREATE TRIGGER trigger_lesson_content_updated_at
    BEFORE UPDATE ON lesson_content
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_content_updated_at();

-- Add comment to table
COMMENT ON TABLE lesson_content IS 'Stores lesson metadata including markdown file references and YouTube video URLs';
COMMENT ON COLUMN lesson_content.youtube_url IS 'YouTube embed URL for the lesson video. Update this with actual video URLs.';
