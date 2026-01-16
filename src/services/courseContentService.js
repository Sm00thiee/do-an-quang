/**
 * Course Content Service
 * Handles fetching and processing course content from Supabase storage and database
 */

import { supabaseChat } from './supabase';

/**
 * Fetch lesson metadata from database
 * @param {string} lessonId - The lesson identifier (e.g., "uiux-1", "marketing-5")
 * @returns {Promise<Object|null>} - Lesson metadata including youtube_url, markdown_file, etc.
 */
export const fetchLessonMetadata = async (lessonId) => {
    try {
        if (!supabaseChat) {
            throw new Error('Supabase chat client not configured');
        }

        console.log(`[CourseContent] Fetching lesson metadata for: ${lessonId}`);

        const { data, error } = await supabaseChat
            .from('lesson_content')
            .select('*')
            .eq('lesson_id', lessonId)
            .eq('is_active', true)
            .single();

        if (error) {
            console.error(`[CourseContent] Error fetching lesson metadata:`, error);
            return null;
        }

        console.log(`[CourseContent] Found lesson metadata:`, data);
        return data;
    } catch (error) {
        console.error(`[CourseContent] Error fetching lesson metadata:`, error);
        return null;
    }
};

/**
 * Fetch markdown content from course-files bucket
 * @param {string} fileName - The markdown file name (e.g., "marketing_01_marketing_la_gi.md")
 * @returns {Promise<string>} - The markdown content as text
 */
export const fetchLessonMarkdown = async (fileName) => {
    try {
        if (!supabaseChat) {
            throw new Error('Supabase chat client not configured');
        }

        console.log(`[CourseContent] Fetching markdown file: ${fileName}`);

        // Get public URL for the file
        const { data: urlData } = supabaseChat
            .storage
            .from('course-files')
            .getPublicUrl(fileName);

        if (!urlData || !urlData.publicUrl) {
            throw new Error(`Failed to get public URL for file: ${fileName}`);
        }

        console.log(`[CourseContent] Public URL: ${urlData.publicUrl}`);

        // Fetch the markdown content
        const response = await fetch(urlData.publicUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }

        const content = await response.text();
        console.log(`[CourseContent] Successfully fetched ${content.length} characters`);
        
        return content;
    } catch (error) {
        console.error(`[CourseContent] Error fetching markdown:`, error);
        throw error;
    }
};

/**
 * Extract lesson ID from title by parsing lesson number pattern
 * @param {string} lessonTitle - The lesson title from chat (e.g., "Bài 2. BÀI 1. UI/UX DESIGN LÀ GÌ?")
 * @returns {string|null} - Extracted lesson ID or null
 */
export const extractLessonIdFromTitle = (lessonTitle) => {
    if (!lessonTitle) return null;
    
    console.log(`[CourseContent] Extracting lesson ID from title: ${lessonTitle}`);
    
    // Try to extract lesson number from title
    // Pattern 1: "Bài X. BÀI Y. TITLE" - the Y from uppercase "BÀI" is the real lesson number
    // Pattern 2: Just "BÀI Y. TITLE" - uppercase BÀI indicates the actual lesson
    // We need case-sensitive match for uppercase "BÀI" to distinguish from "Bài"
    const upperCasePattern = lessonTitle.match(/BÀI\s*(\d+)\./);
    let lessonNumber = upperCasePattern ? parseInt(upperCasePattern[1]) : null;
    
    // Fallback: if no uppercase BÀI found, try "Bài X." pattern (case-insensitive)
    if (!lessonNumber) {
        const fallbackPattern = lessonTitle.match(/Bài\s*(\d+)\./i);
        lessonNumber = fallbackPattern ? parseInt(fallbackPattern[1]) : null;
    }
    
    if (!lessonNumber) {
        console.log(`[CourseContent] Could not extract lesson number from: ${lessonTitle}`);
        return null;
    }
    
    console.log(`[CourseContent] Extracted lesson number: ${lessonNumber}`);
    
    // Determine the course type from the title
    const titleLower = lessonTitle.toLowerCase();
    
    if (titleLower.includes('ui/ux') || titleLower.includes('uiux') || 
        titleLower.includes('giao diện') || titleLower.includes('wireframe') ||
        titleLower.includes('prototype') || titleLower.includes('persona') ||
        titleLower.includes('design system') || titleLower.includes('typography') ||
        titleLower.includes('user flow') || titleLower.includes('information architecture') ||
        titleLower.includes('usability') || titleLower.includes('ux research') ||
        titleLower.includes('user journey') || titleLower.includes('người dùng làm trung tâm')) {
        return `uiux-${lessonNumber}`;
    }
    
    if (titleLower.includes('marketing') || titleLower.includes('seo') ||
        titleLower.includes('content') || titleLower.includes('social media') ||
        titleLower.includes('email marketing') || titleLower.includes('digital') ||
        titleLower.includes('4p') || titleLower.includes('7p') ||
        titleLower.includes('analytics')) {
        return `marketing-${lessonNumber}`;
    }
    
    if (titleLower.includes('graphic') || titleLower.includes('thiết kế đồ họa') ||
        titleLower.includes('logo') || titleLower.includes('brand identity') ||
        titleLower.includes('poster') || titleLower.includes('packaging') ||
        titleLower.includes('banner') || titleLower.includes('portfolio')) {
        return `graphic-design-${lessonNumber}`;
    }
    
    console.log(`[CourseContent] Could not determine course type for: ${lessonTitle}`);
    return null;
};

/**
 * Get markdown file name from lesson ID
 * @param {string} lessonId - Lesson identifier (e.g., "marketing-1", "uiux-5")
 * @returns {string} - The markdown file name
 */
export const getLessonFileName = (lessonId) => {
    // Convert lesson ID to file name format
    // e.g., "marketing-1" -> "marketing_01_marketing_la_gi.md"
    // This is a mapping function - you may need to adjust based on your data structure
    
    // For now, we'll use a simple mapping
    const lessonMap = {
        'marketing-1': 'marketing_01_marketing_la_gi.md',
        'marketing-2': 'marketing_02_cac_loai_hinh_marketing.md',
        'marketing-3': 'marketing_03_muc_tieu_va_gia_tri_cua_marketing.md',
        'marketing-4': 'marketing_04_quy_trinh_marketing_co_ban.md',
        'marketing-5': 'marketing_05_marketing_mix_mo_hinh_4p.md',
        'marketing-6': 'marketing_06_mo_hinh_7p_trong_marketing_dich_vu.md',
        'marketing-7': 'marketing_07_lua_chon_chien_luoc_marketing_phu_hop.md',
        'marketing-8': 'marketing_08_ung_dung_marketing_mix_vao_thuc_te.md',
        'marketing-9': 'marketing_09_digital_marketing_co_ban.md',
        'marketing-10': 'marketing_10_content_marketing_co_ban.md',
        'marketing-11': 'marketing_11_social_media_marketing_co_ban.md',
        'marketing-12': 'marketing_12_seo_co_ban_search_engine_optimization.md',
        'marketing-13': 'marketing_13_email_marketing_co_ban.md',
        'marketing-14': 'marketing_14_marketing_analytics_co_ban.md',
        'marketing-15': 'marketing_15_chien_luoc_marketing_tich_hop.md',
        'uiux-1': 'uiux_01_uiux_design_la_gi.md',
        'uiux-2': 'uiux_02_tu_duy_lay_nguoi_dung_lam_trung_tam.md',
        'uiux-3': 'uiux_03_quy_trinh_thiet_ke_uiux.md',
        'uiux-4': 'uiux_04_vai_tro_va_ky_nang_cua_uiux_designer.md',
        'uiux-5': 'uiux_05_ux_research_co_ban.md',
        'uiux-6': 'uiux_06_persona_va_user_journey.md',
        'uiux-7': 'uiux_07_xac_dinh_van_de_insight_nguoi_dung.md',
        'uiux-8': 'uiux_08_information_architecture_ia.md',
        'uiux-9': 'uiux_09_user_flow_screen_map.md',
        'uiux-10': 'uiux_10_wireframe.md',
        'uiux-11': 'uiux_11_nguyen_ly_thiet_ke_ui.md',
        'uiux-12': 'uiux_12_mau_sac_typography.md',
        'uiux-13': 'uiux_13_component_design_system.md',
        'uiux-14': 'uiux_14_prototype_cong_cu_thiet_ke.md',
        'uiux-15': 'uiux_15_usability_testing_hoan_thien_thiet_ke.md',
        'graphic-design-1': 'graphic_design_01_graphic_design_la_gi.md',
        'graphic-design-2': 'graphic_design_02_vai_tro_cua_graphic_design_trong_truyen_thong.md',
        'graphic-design-3': 'graphic_design_03_tu_duy_thiet_ke_design_thinking_trong_graphic_design.md',
        'graphic-design-4': 'graphic_design_04_cac_nguyen_ly_co_ban_trong_thiet_ke_do_hoa.md',
        'graphic-design-5': 'graphic_design_05_mau_sac_trong_thiet_ke_do_hoa.md',
        'graphic-design-6': 'graphic_design_06_typography_trong_thiet_ke_do_hoa.md',
        'graphic-design-7': 'graphic_design_07_bo_cuc_layout_trong_thiet_ke_do_hoa.md',
        'graphic-design-8': 'graphic_design_08_hinh_anh_yeu_to_do_hoa_trong_thiet_ke.md',
        'graphic-design-9': 'graphic_design_09_nhan_dien_thuong_hieu_brand_identity.md',
        'graphic-design-10': 'graphic_design_10_thiet_ke_an_pham_truyen_thong_poster_banner_social_media.md',
        'graphic-design-11': 'graphic_design_11_thiet_ke_bao_bi_packaging_design.md',
        'graphic-design-12': 'graphic_design_12_thiet_ke_giao_dien_co_ban_cho_web_app_ui_co_ban_cho_graphic_designer.md',
        'graphic-design-13': 'graphic_design_13_quy_trinh_lam_viec_tu_duy_cua_graphic_designer_chuyen_nghiep.md',
        'graphic-design-14': 'graphic_design_14_xay_dung_portfolio_graphic_design.md',
        'graphic-design-15': 'graphic_design_15_dinh_huong_nghe_nghiep_phat_trien_su_nghiep_graphic_design.md',
    };

    return lessonMap[lessonId] || null;
};

/**
 * List all markdown files in the course-files bucket
 * @returns {Promise<Array>} - Array of file objects
 */
export const listCourseFiles = async () => {
    try {
        if (!supabaseChat) {
            throw new Error('Supabase chat client not configured');
        }

        const { data, error } = await supabaseChat
            .storage
            .from('course-files')
            .list();

        if (error) {
            throw error;
        }

        console.log(`[CourseContent] Found ${data.length} files in course-files bucket`);
        return data;
    } catch (error) {
        console.error('[CourseContent] Error listing course files:', error);
        throw error;
    }
};
