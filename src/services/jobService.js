/**
 * Job Service - Supabase Integration
 * Handles all job-related operations using Supabase directly
 */

import { supabaseMain } from './supabase';

/**
 * Get job by ID with all related data
 * @param {string} jobId - The UUID of the job
 * @returns {Promise<Object>} Job data with employer, jtype, jlevel, industries
 */
export const getJobById = async (jobId) => {
  try {
    const { data, error } = await supabaseMain
      .from('jobs')
      .select(`
        *,
        company:companies(
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
          industry:industries(id, name, name_vi)
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

    if (error) {
      console.error('Error fetching job:', error);
      throw error;
    }

    // Transform data to match expected format
    return {
      ...data,
      // Map new fields to old field names for backward compatibility
      jname: data.title,
      amount: data.positions_available || 1,
      min_salary: data.salary_min ? Math.round(data.salary_min / 1000000) : null,
      max_salary: data.salary_max ? Math.round(data.salary_max / 1000000) : null,
      address: data.location?.full_address || data.location?.city || 'Chưa cập nhật',
      yoe: extractYearsFromExperience(data.experience_level),
      employer: {
        ...data.company,
        name: data.company?.name || 'Chưa cập nhật',
        logo: data.company?.logo_url,
        image: data.company?.banner_url,
        scale: data.company?.employee_count,
        firstname: data.company?.name?.split(' ')[0] || '',
        lastname: data.company?.name?.split(' ').slice(1).join(' ') || '',
      },
      jtype: { name: data.work_type || 'Chưa cập nhật' },
      jlevel: { name: data.experience_level || 'Chưa cập nhật' },
      industries: data.company?.industry ? [data.company.industry] : [],
      description: data.description || 'Chưa cập nhật thông tin',
      requirements: data.requirements || 'Chưa cập nhật thông tin',
      benefits: data.benefits || 'Chưa cập nhật thông tin',
    };
  } catch (error) {
    console.error('Exception in getJobById:', error);
    throw error;
  }
};

/**
 * Extract years of experience from experience level string
 * @param {string} experienceLevel 
 * @returns {number|null}
 */
const extractYearsFromExperience = (experienceLevel) => {
  if (!experienceLevel) return null;
  const match = experienceLevel.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
};

/**
 * Check if user has applied to a job
 * @param {string} jobId - The UUID of the job
 * @param {string} candidateId - The UUID of the candidate
 * @returns {Promise<{value: boolean}>} Application status
 */
export const checkApplying = async (jobId, candidateId) => {
  try {
    if (!candidateId) {
      return { value: false };
    }

    const { data, error } = await supabaseMain
      .from('job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('candidate_id', candidateId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking application:', error);
      throw error;
    }

    return { value: !!data };
  } catch (error) {
    console.error('Exception in checkApplying:', error);
    return { value: false };
  }
};

/**
 * Check if user has saved a job
 * @param {string} jobId - The UUID of the job
 * @param {string} candidateId - The UUID of the candidate
 * @returns {Promise<{value: boolean}>} Saved status
 */
export const checkJobSaved = async (jobId, candidateId) => {
  try {
    if (!candidateId) {
      return { value: false };
    }

    const { data, error } = await supabaseMain
      .from('saved_jobs')
      .select('id')
      .eq('job_id', jobId)
      .eq('user_id', candidateId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking saved job:', error);
      throw error;
    }

    return { value: !!data };
  } catch (error) {
    console.error('Exception in checkJobSaved:', error);
    return { value: false };
  }
};

/**
 * Save or unsave a job
 * @param {string} jobId - The UUID of the job
 * @param {string} candidateId - The UUID of the candidate
 * @param {boolean} status - True to save, false to unsave
 * @returns {Promise<void>}
 */
export const processJobSaving = async (jobId, candidateId, status) => {
  try {
    if (status) {
      // Save job
      const { error } = await supabaseMain
        .from('saved_jobs')
        .insert({
          job_id: jobId,
          user_id: candidateId,
        });

      if (error && error.code !== '23505') { // Ignore duplicate key error
        throw error;
      }
    } else {
      // Unsave job
      const { error } = await supabaseMain
        .from('saved_jobs')
        .delete()
        .eq('job_id', jobId)
        .eq('user_id', candidateId);

      if (error) {
        throw error;
      }
    }
  } catch (error) {
    console.error('Exception in processJobSaving:', error);
    throw error;
  }
};

/**
 * Apply to a job
 * @param {string} jobId - The UUID of the job
 * @param {string} candidateId - The UUID of the candidate
 * @param {Object} applicationData - Application data (cv_url, cover_letter, etc.)
 * @returns {Promise<void>}
 */
export const applyToJob = async (jobId, candidateId, applicationData = {}) => {
  try {
    const { error } = await supabaseMain
      .from('job_applications')
      .insert({
        job_id: jobId,
        candidate_id: candidateId,
        status: 'pending',
        ...applicationData,
      });

    if (error) {
      throw error;
    }

    // Increment application count
    await supabaseMain.rpc('increment_job_applications', { job_id: jobId });
  } catch (error) {
    console.error('Exception in applyToJob:', error);
    throw error;
  }
};

/**
 * Get list of jobs with filters
 * @param {Object} params - Filter parameters
 * @returns {Promise<Array>} List of jobs
 */
export const getJobList = async (params = {}) => {
  try {
    let query = supabaseMain
      .from('jobs')
      .select(`
        *,
        company:companies(
          id,
          name,
          short_name,
          logo_url
        ),
        location:locations(
          id,
          city,
          district
        )
      `)
      .eq('status', 'active')
      .order('published_at', { ascending: false });

    // Apply filters
    if (params.keyword) {
      query = query.ilike('title', `%${params.keyword}%`);
    }

    if (params.location_id) {
      query = query.eq('location_id', params.location_id);
    }

    if (params.company_id) {
      query = query.eq('company_id', params.company_id);
    }

    // Pagination
    const page = params.page || 1;
    const limit = params.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getJobList:', error);
    throw error;
  }
};

export default {
  getJobById,
  checkApplying,
  checkJobSaved,
  processJobSaving,
  applyToJob,
  getJobList,
};
