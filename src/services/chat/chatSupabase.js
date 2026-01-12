/**
 * Dedicated Supabase Client for Chat Feature
 * Re-exports the chat Supabase instance from the main supabase.js configuration
 * This ensures we use the existing dual-instance setup
 */

// Import from main Supabase configuration which already handles dual instances
import { supabaseChat as chatSupabase, CHAT_EDGE_FUNCTIONS_URL } from '../supabase';

export { chatSupabase, CHAT_EDGE_FUNCTIONS_URL };



/**
 * Check if Chat Supabase is properly configured
 * @returns {boolean}
 */
export function isChatSupabaseConfigured() {
  return chatSupabase !== null;
}

/**
 * Get the Edge Functions URL
 * @returns {string}
 */
export function getChatEdgeFunctionsUrl() {
  return CHAT_EDGE_FUNCTIONS_URL || 'http://localhost:54321/functions/v1';
}
