/**
 * Supabase Client Configuration
 * Dual Supabase instance support:
 * - Main app instance: Jobs, candidates, employers, etc.
 * - Chat backend instance: AI Chatbot functionality
 */

import { createClient } from '@supabase/supabase-js';

// Main app Supabase client (existing)
const mainSupabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const mainSupabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabaseMain = createClient(mainSupabaseUrl, mainSupabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    global: {
        headers: {
            'x-application-name': 'recruitment-web-main'
        }
    }
});

// Chat backend Supabase client (new)
const chatSupabaseUrl = process.env.REACT_APP_CHAT_SUPABASE_URL || '';
const chatSupabaseAnonKey = process.env.REACT_APP_CHAT_SUPABASE_ANON_KEY || '';

// Only create chat client if credentials are provided
export const supabaseChat = (chatSupabaseUrl && chatSupabaseAnonKey) 
    ? createClient(chatSupabaseUrl, chatSupabaseAnonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        global: {
            headers: {
                'x-application-name': 'recruitment-web-chat'
            }
        }
    })
    : null; // Return null if not configured

// Export chat edge functions URL
export const CHAT_EDGE_FUNCTIONS_URL = process.env.REACT_APP_CHAT_SUPABASE_EDGE_FUNCTIONS_URL ||
    (chatSupabaseUrl ? `${chatSupabaseUrl}/functions/v1` : '');

// Debug: Log chat Supabase configuration status (development only)
if (process.env.NODE_ENV === 'development') {
    console.log('[Chat Supabase Config]', {
        hasUrl: !!chatSupabaseUrl,
        hasKey: !!chatSupabaseAnonKey,
        isConfigured: !!supabaseChat,
        edgeFunctionsUrl: CHAT_EDGE_FUNCTIONS_URL,
        url: chatSupabaseUrl,
        keyPreview: chatSupabaseAnonKey ? `${chatSupabaseAnonKey.substring(0, 20)}...` : 'none'
    });
    
    // Warn if key looks invalid
    if (chatSupabaseAnonKey && chatSupabaseAnonKey.length < 100) {
        console.warn('[Chat Supabase Config] API key seems too short. Please verify your REACT_APP_CHAT_SUPABASE_ANON_KEY in .env');
    }
}

// Legacy export for backward compatibility (defaults to main)
export const supabase = supabaseMain;
export const EDGE_FUNCTIONS_URL = process.env.REACT_APP_SUPABASE_EDGE_FUNCTIONS_URL ||
    `${mainSupabaseUrl}/functions/v1`;
