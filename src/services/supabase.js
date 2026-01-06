/**
 * Supabase Client Configuration
 * Kết nối với Supabase backend cho AI Chatbot
 */

import { createClient } from '@supabase/supabase-js';

// Lấy thông tin cấu hình từ environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Tạo Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    global: {
        headers: {
            'x-application-name': 'recruitment-web-chatbot'
        }
    }
});

// Export URL để sử dụng cho Edge Functions
export const EDGE_FUNCTIONS_URL = process.env.REACT_APP_SUPABASE_EDGE_FUNCTIONS_URL ||
    `${supabaseUrl}/functions/v1`;
