/**
 * Unified Supabase Service Router
 * Automatically routes to the correct Supabase instance based on operation type
 */

import { supabaseMain, supabaseChat } from './supabase';

/**
 * Unified Supabase service router
 * Automatically routes to the correct instance based on operation type
 */
export class SupabaseService {
    /**
     * Get Supabase client for chat operations
     */
    static getChatClient() {
        return supabaseChat;
    }

    /**
     * Get Supabase client for main app operations
     */
    static getMainClient() {
        return supabaseMain;
    }

    /**
     * Get appropriate client based on table name
     */
    static getClientForTable(tableName) {
        const chatTables = [
            'chat_sessions',
            'chat_messages',
            'chat_jobs',
            'fields',
            'courses',
            'learning_paths',
            'learning_path_courses',
            'job_queue',
            'job_dependencies',
            'worker_status',
            'user_recommendation_interactions',
            'user_recommendation_feedback',
            'recommendation_analytics',
            'user_interest_tracking',
            'recommendation_triggers',
            'csv_exports',
            'generated_learning_paths'
        ];

        return chatTables.includes(tableName) 
            ? supabaseChat 
            : supabaseMain;
    }

    /**
     * Get client based on operation context
     * @param {string} context - 'chat' or 'main'
     */
    static getClient(context = 'main') {
        return context === 'chat' ? supabaseChat : supabaseMain;
    }
}
