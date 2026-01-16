/**
 * Job Search Service
 * Handles all job search related operations with Supabase
 */

import { SupabaseService } from './supabaseService';

const supabase = SupabaseService.getMainClient();

export class JobSearchService {
    /**
     * Search for jobs with filters
     * @param {Object} filters - Search filters
     * @param {string} filters.search - Search query
     * @param {string} filters.location - Location ID
     * @param {number} filters.salaryMin - Minimum salary
     * @param {number} filters.salaryMax - Maximum salary
     * @param {string} filters.company - Company ID
     * @param {string} filters.experience - Experience level
     * @param {number} filters.page - Page number (default 1)
     * @param {number} filters.limit - Items per page (default 12)
     */
    static async searchJobs(filters = {}) {
        try {
            const {
                search = '',
                location = null,
                salaryMin = null,
                salaryMax = null,
                company = null,
                experience = null,
                page = 1,
                limit = 12
            } = filters;

            // Calculate offset
            const offset = (page - 1) * limit;

            // Build query
            let query = supabase
                .from('jobs')
                .select(`
                    *,
                    company:companies!inner(
                        id,
                        name,
                        short_name,
                        logo_url,
                        verified
                    ),
                    location:locations(
                        id,
                        city,
                        district,
                        full_address
                    )
                `, { count: 'exact' })
                .eq('status', 'active')
                .lte('published_at', new Date().toISOString())
                .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

            // Apply filters
            if (search && search.trim()) {
                query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
            }

            if (location) {
                query = query.eq('location_id', location);
            }

            if (salaryMin) {
                query = query.gte('salary_min', salaryMin);
            }

            if (salaryMax) {
                query = query.lte('salary_max', salaryMax);
            }

            if (company) {
                query = query.eq('company_id', company);
            }

            if (experience) {
                query = query.eq('experience_level', experience);
            }

            // Order and paginate
            query = query.order('published_at', { ascending: false });
            query = query.range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                success: true,
                data: data || [],
                total: count || 0,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit)
            };
        } catch (error) {
            console.error('Error searching jobs:', error);
            return {
                success: false,
                error: error.message,
                data: [],
                total: 0
            };
        }
    }

    /**
     * Get job by ID
     */
    static async getJobById(jobId) {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    company:companies!inner(
                        id,
                        name,
                        short_name,
                        logo_url,
                        banner_url,
                        description,
                        website,
                        email,
                        phone,
                        employee_count,
                        verified,
                        industry:industries(name, name_vi),
                        headquarters:locations(city, district, full_address)
                    ),
                    location:locations(
                        id,
                        city,
                        district,
                        full_address
                    )
                `)
                .eq('id', jobId)
                .single();

            if (error) throw error;

            // Increment view count
            await this.trackJobView(jobId);

            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('Error getting job:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Track job view
     */
    static async trackJobView(jobId, userId = null) {
        try {
            const { error } = await supabase
                .from('job_views')
                .insert({
                    job_id: jobId,
                    user_id: userId,
                    viewed_at: new Date().toISOString()
                });

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error tracking view:', error);
            return { success: false };
        }
    }

    /**
     * Save a job
     */
    static async saveJob(jobId, userId, notes = null) {
        try {
            const { data, error } = await supabase
                .from('saved_jobs')
                .insert({
                    job_id: jobId,
                    user_id: userId,
                    notes
                })
                .select()
                .single();

            if (error) {
                // Check if already saved (unique constraint violation)
                if (error.code === '23505') {
                    return {
                        success: false,
                        error: 'Job already saved'
                    };
                }
                throw error;
            }

            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('Error saving job:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Remove saved job
     */
    static async removeSavedJob(jobId, userId) {
        try {
            const { error } = await supabase
                .from('saved_jobs')
                .delete()
                .eq('job_id', jobId)
                .eq('user_id', userId);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Error removing saved job:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if job is saved
     */
    static async isJobSaved(jobId, userId) {
        try {
            const { data, error } = await supabase
                .from('saved_jobs')
                .select('id')
                .eq('job_id', jobId)
                .eq('user_id', userId)
                .maybeSingle();

            if (error) throw error;

            return {
                success: true,
                isSaved: !!data
            };
        } catch (error) {
            console.error('Error checking saved job:', error);
            return {
                success: false,
                isSaved: false
            };
        }
    }

    /**
     * Get saved jobs for user
     */
    static async getSavedJobs(userId, page = 1, limit = 12) {
        try {
            const offset = (page - 1) * limit;

            const { data, error, count } = await supabase
                .from('saved_jobs')
                .select(`
                    *,
                    job:jobs!inner(
                        *,
                        company:companies!inner(
                            id,
                            name,
                            short_name,
                            logo_url,
                            verified
                        ),
                        location:locations(
                            city,
                            district
                        )
                    )
                `, { count: 'exact' })
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return {
                success: true,
                data: data || [],
                total: count || 0,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit)
            };
        } catch (error) {
            console.error('Error getting saved jobs:', error);
            return {
                success: false,
                error: error.message,
                data: [],
                total: 0
            };
        }
    }

    /**
     * Apply for a job
     */
    static async applyForJob(jobId, userId, applicationData) {
        try {
            const {
                coverLetter,
                cvUrl,
                resumeData
            } = applicationData;

            const { data, error } = await supabase
                .from('job_applications')
                .insert({
                    job_id: jobId,
                    candidate_id: userId,
                    cover_letter: coverLetter,
                    cv_url: cvUrl,
                    resume_data: resumeData,
                    status: 'pending',
                    applied_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                // Check if already applied (unique constraint violation)
                if (error.code === '23505') {
                    return {
                        success: false,
                        error: 'Already applied to this job'
                    };
                }
                throw error;
            }

            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('Error applying for job:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get applications for user
     */
    static async getUserApplications(userId, page = 1, limit = 12) {
        try {
            const offset = (page - 1) * limit;

            const { data, error, count } = await supabase
                .from('job_applications')
                .select(`
                    *,
                    job:jobs!inner(
                        *,
                        company:companies!inner(
                            id,
                            name,
                            short_name,
                            logo_url,
                            verified
                        ),
                        location:locations(
                            city,
                            district
                        )
                    )
                `, { count: 'exact' })
                .eq('candidate_id', userId)
                .order('applied_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return {
                success: true,
                data: data || [],
                total: count || 0,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit)
            };
        } catch (error) {
            console.error('Error getting applications:', error);
            return {
                success: false,
                error: error.message,
                data: [],
                total: 0
            };
        }
    }

    /**
     * Check if user has applied to job
     */
    static async hasApplied(jobId, userId) {
        try {
            const { data, error } = await supabase
                .from('job_applications')
                .select('id, status')
                .eq('job_id', jobId)
                .eq('candidate_id', userId)
                .maybeSingle();

            if (error) throw error;

            return {
                success: true,
                hasApplied: !!data,
                application: data
            };
        } catch (error) {
            console.error('Error checking application:', error);
            return {
                success: false,
                hasApplied: false
            };
        }
    }

    /**
     * Get all locations for filter dropdown
     */
    static async getLocations() {
        try {
            const { data, error } = await supabase
                .from('locations')
                .select('id, city, district')
                .order('city');

            if (error) throw error;

            return {
                success: true,
                data: data || []
            };
        } catch (error) {
            console.error('Error getting locations:', error);
            return {
                success: false,
                data: []
            };
        }
    }

    /**
     * Get all industries for filter dropdown
     */
    static async getIndustries() {
        try {
            const { data, error } = await supabase
                .from('industries')
                .select('id, name, name_vi')
                .order('name_vi');

            if (error) throw error;

            return {
                success: true,
                data: data || []
            };
        } catch (error) {
            console.error('Error getting industries:', error);
            return {
                success: false,
                data: []
            };
        }
    }

    /**
     * Get featured companies
     */
    static async getFeaturedCompanies(limit = 3) {
        try {
            const { data, error } = await supabase
                .from('companies')
                .select(`
                    *,
                    industry:industries(name_vi),
                    headquarters:locations(city, district)
                `)
                .eq('verified', true)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return {
                success: true,
                data: data || []
            };
        } catch (error) {
            console.error('Error getting featured companies:', error);
            return {
                success: false,
                data: []
            };
        }
    }
}

export default JobSearchService;
