/**
 * Edge Function client for chat backend
 * Modeled after CourseAiChat/src/services/edgeFunctionClient.ts but adapted to JS
 */

import { supabaseChat, CHAT_EDGE_FUNCTIONS_URL } from './supabase';

// Fallback base URL if env not set (mainly for dev)
const EDGE_FUNCTION_BASE_URL = CHAT_EDGE_FUNCTIONS_URL || '';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30000;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // Base delay in ms

// Edge Function names (keep in sync with backend)
export const EDGE_FUNCTIONS = {
    CHAT_SUBMIT: 'chat-submit',
    CHAT_STATUS: 'chat-status',
    CHAT_PROCESS: 'chat-process',
};

export class EdgeFunctionError extends Error {
    constructor(message, status, code, details) {
        super(message);
        this.name = 'EdgeFunctionError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getRetryDelay = (attempt) => {
    const exponentialDelay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, 10000);
};

export class EdgeFunctionClient {
    constructor(baseUrl, timeout) {
        this.baseUrl = baseUrl || EDGE_FUNCTION_BASE_URL;
        this.timeout = timeout || REQUEST_TIMEOUT;
    }

    /**
     * Low-level request wrapper with Supabase auth and error handling
     * @param {string} functionName
     * @param {RequestInit} options
     * @returns {Promise<{data:any|null,error:string|null,status:number}>}
     */
    async makeRequest(functionName, options = {}) {
        if (!this.baseUrl) {
            return {
                data: null,
                error: 'CHAT_EDGE_FUNCTIONS_URL is not configured',
                status: 500,
            };
        }

        const url = `${this.baseUrl.replace(/\/$/, '')}/${functionName}`;

        try {
            // Get auth session from chat Supabase instance if available
            let accessToken = '';
            if (supabaseChat && supabaseChat.auth) {
                try {
                    const { data, error: sessionError } = await supabaseChat.auth.getSession();
                    if (sessionError) {
                        throw sessionError;
                    }
                    accessToken = data?.session?.access_token || '';
                } catch (authErr) {
                    // For anonymous chat we can still try with anon key header
                    // but expose error message in response
                    console.warn('EdgeFunctionClient auth error:', authErr);
                }
            }

            const headers = {
                'Content-Type': 'application/json',
                ...(process.env.REACT_APP_CHAT_SUPABASE_ANON_KEY
                    ? {
                          apikey: process.env.REACT_APP_CHAT_SUPABASE_ANON_KEY,
                          Authorization: accessToken
                              ? `Bearer ${accessToken}`
                              : `Bearer ${process.env.REACT_APP_CHAT_SUPABASE_ANON_KEY}`,
                      }
                    : {}),
                ...options.headers,
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            let response;
            try {
                response = await fetch(url, {
                    ...options,
                    headers,
                    signal: controller.signal,
                });
            } finally {
                clearTimeout(timeoutId);
            }

            if (!response.ok) {
                let message = `HTTP ${response.status}: ${response.statusText}`;
                let details = null;
                try {
                    const data = await response.json();
                    message = data.error || data.message || message;
                    details = data;
                } catch (_) {
                    // ignore JSON parse errors
                }

                throw new EdgeFunctionError(message, response.status, `HTTP_${response.status}`, details);
            }

            // Check if response is streaming (SSE format)
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
                // Return the response object so we can read the stream
                return { 
                    data: { 
                        success: true, 
                        message: 'Streaming response initiated',
                        streaming: true,
                        stream: response // Return the actual response for stream reading
                    }, 
                    error: null, 
                    status: response.status 
                };
            }

            const data = await response.json();
            return { data, error: null, status: response.status };
        } catch (error) {
            if (error instanceof EdgeFunctionError) {
                return {
                    data: null,
                    error: error.message,
                    status: error.status || 500,
                };
            }

            if (error && error.name === 'AbortError') {
                return {
                    data: null,
                    error: 'Request timeout',
                    status: 408,
                };
            }

            return {
                data: null,
                error: error instanceof Error ? error.message : 'Unknown error',
                status: 500,
            };
        }
    }

    /**
     * Request with retry and exponential backoff
     * @param {string} functionName
     * @param {RequestInit} options
     */
    async makeRequestWithRetry(functionName, options = {}, maxRetries = MAX_RETRIES) {
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const result = await this.makeRequest(functionName, options);

            if (result.data && !result.error) {
                return result;
            }

            // For 4xx errors, don't retry
            if (result.status >= 400 && result.status < 500) {
                return result;
            }

            lastError = new EdgeFunctionError(
                result.error || 'Request failed',
                result.status,
                'REQUEST_ERROR',
            );

            if (attempt < maxRetries) {
                await delay(getRetryDelay(attempt));
            }
        }

        return {
            data: null,
            error: lastError?.message || 'Request failed after retries',
            status: lastError?.status || 500,
        };
    }

    /**
     * Submit a chat message and handle streaming response
     * @param {{session_id:string,field_id?:string,message:string,conversation_history?:Array}} request
     * @param {{onChunk?:(chunk:string)=>void,onDone?:(data:any)=>void,onError?:(error:string)=>void}} callbacks
     */
    async submitChat(request, callbacks = {}) {
        const result = await this.makeRequest(EDGE_FUNCTIONS.CHAT_SUBMIT, {
            method: 'POST',
            body: JSON.stringify(request),
        });

        // If it's a streaming response, read the stream
        if (result.data?.streaming && result.data?.stream) {
            const response = result.data.stream;
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                
                                if (data.type === 'chunk' && callbacks.onChunk) {
                                    callbacks.onChunk(data.content);
                                } else if (data.type === 'done' && callbacks.onDone) {
                                    callbacks.onDone(data);
                                } else if (data.type === 'error' && callbacks.onError) {
                                    callbacks.onError(data.error);
                                }
                            } catch (e) {
                                console.error('[EdgeFunctionClient] Error parsing SSE data:', e, 'Line:', line);
                            }
                        }
                    }
                }

                // Return success for streaming responses
                return { data: { success: true, streaming: true }, error: null, status: 200 };
            } catch (streamError) {
                console.error('[EdgeFunctionClient] Stream reading error:', streamError);
                if (callbacks.onError) {
                    callbacks.onError(streamError.message || 'Stream error');
                }
                return { 
                    data: null, 
                    error: streamError.message || 'Stream reading failed', 
                    status: 500 
                };
            }
        }

        return result;
    }

    /**
     * Get job status by jobId
     * @param {{jobId:string}} request
     */
    async getChatStatus(request) {
        return this.makeRequestWithRetry(EDGE_FUNCTIONS.CHAT_STATUS, {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    /**
     * Process a chat job (if you expose worker/admin function)
     * @param {{jobId:string,force?:boolean}} request
     */
    async processChat(request) {
        return this.makeRequestWithRetry(EDGE_FUNCTIONS.CHAT_PROCESS, {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    /**
     * Poll job status until completion or timeout
     * @param {string} jobId
     * @param {(job:any)=>void} onUpdate
     * @param {number} pollInterval
     * @param {number} maxPollTime
     */
    async pollJobStatus(jobId, onUpdate, pollInterval = 2000, maxPollTime = 60000) {
        const start = Date.now();
        while (Date.now() - start < maxPollTime) {
            const res = await this.getChatStatus({ jobId });
            if (res.error) {
                throw new EdgeFunctionError(res.error, res.status, 'POLLING_ERROR');
            }
            if (!res.data || !res.data.job) {
                throw new EdgeFunctionError('No data received from status check', 500, 'NO_DATA');
            }

            const job = res.data.job;
            if (onUpdate) onUpdate(job);

            if (job.status === 'completed' || job.status === 'failed') {
                return job;
            }

            await delay(pollInterval);
        }

        throw new EdgeFunctionError('Job polling timed out', 408, 'POLLING_TIMEOUT', {
            jobId,
            maxPollTime,
        });
    }
}

export const edgeFunctionClient = new EdgeFunctionClient();

// Convenience exports (similar API to CourseAiChat)
export const submitChat = (request) => edgeFunctionClient.submitChat(request);
export const getChatStatus = (request) => edgeFunctionClient.getChatStatus(request);
export const processChat = (request) => edgeFunctionClient.processChat(request);
export const pollJobStatus = (jobId, onUpdate, pollInterval, maxPollTime) =>
    edgeFunctionClient.pollJobStatus(jobId, onUpdate, pollInterval, maxPollTime);

