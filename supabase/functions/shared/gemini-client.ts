// Gemini API Client for Supabase Edge Functions
// Handles communication with Google's Gemini API

export interface GeminiResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

export class GeminiClient {
  private config: GeminiConfig;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string, config: Partial<GeminiConfig> = {}) {
    this.config = {
      apiKey,
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.8,
      topK: 40,
      ...config
    };
  }

  /**
   * Generate a response from Gemini API
   */
  async generateResponse(
    prompt: string,
    fieldId?: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<GeminiResponse> {
    try {
      const requestBody = this.buildRequestBody(prompt, conversationHistory);
      const response = await fetch(`${this.baseUrl}/models/${this.config.model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.config.apiKey,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated from Gemini API');
      }

      const candidate = data.candidates[0];
      const content = candidate.content?.parts?.[0]?.text || '';
      
      if (!content) {
        throw new Error('Empty response from Gemini API');
      }

      return {
        content,
        tokensUsed: this.extractTokenUsage(data),
        model: this.config.model!
      };

    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  /**
   * Build request body for Gemini API
   */
  private buildRequestBody(
    prompt: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ) {
    const contents = [];

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      for (const message of conversationHistory) {
        contents.push({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }]
        });
      }
    }

    // Add current prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    return {
      contents,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
        topP: this.config.topP,
        topK: this.config.topK,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };
  }

  /**
   * Extract token usage from API response
   */
  private extractTokenUsage(data: any): number {
    // Gemini API doesn't provide detailed token usage in the same way as OpenAI
    // We'll estimate based on response length for now
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return Math.ceil(responseText.length / 4); // Rough estimate: 1 token ≈ 4 characters
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'x-goog-api-key': this.config.apiKey,
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Gemini API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'x-goog-api-key': this.config.apiKey,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models
        .filter((model: any) => model.name.includes('gemini'))
        .map((model: any) => model.name.split('/').pop());
    } catch (error) {
      console.error('Failed to fetch available models:', error);
      return [this.config.model!]; // Return default model on error
    }
  }

  /**
   * Generate a field-specific prompt
   */
  generateFieldSpecificPrompt(message: string, fieldId?: string): string {
    if (!fieldId) {
      return message;
    }

    // Field-specific context prompts
    const fieldPrompts: Record<string, string> = {
      'technology': 'As a technology expert, provide detailed and accurate information about technology-related topics. Include practical examples and current best practices.',
      'science': 'As a science educator, explain scientific concepts clearly and accurately. Use analogies and real-world examples to make complex topics understandable.',
      'mathematics': 'As a mathematics tutor, provide step-by-step explanations for mathematical problems. Show your work and explain the reasoning behind each step.',
      'business': 'As a business consultant, provide practical business advice and insights. Consider real-world applications and current market trends.',
      'arts': 'As an arts and humanities expert, provide thoughtful analysis and creative insights. Consider historical context and cultural significance.',
      'health': 'As a health and wellness advisor, provide evidence-based health information. Always emphasize the importance of consulting healthcare professionals for medical advice.',
      'education': 'As an education specialist, provide clear explanations and learning strategies. Focus on effective study methods and educational best practices.'
    };

    const fieldPrompt = fieldPrompts[fieldId] || '';
    
    return fieldPrompt ? `${fieldPrompt}\n\nUser question: ${message}` : message;
  }
}

/**
 * Create a Gemini client instance with environment configuration
 */
export function createGeminiClient(): GeminiClient {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  const config: Partial<GeminiConfig> = {
    model: Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash-exp',
    temperature: parseFloat(Deno.env.get('GEMINI_TEMPERATURE') || '0.7'),
    maxTokens: parseInt(Deno.env.get('GEMINI_MAX_TOKENS') || '2048'),
    topP: parseFloat(Deno.env.get('GEMINI_TOP_P') || '0.8'),
    topK: parseInt(Deno.env.get('GEMINI_TOP_K') || '40'),
  };

  return new GeminiClient(apiKey, config);
}