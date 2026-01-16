// Chat Submit - Streaming AI Response with Gemini SDK
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0';
import { csvParser, CSVParser, VIETNAMESE_LEARNING_PATH_KEYWORDS, VIETNAMESE_FIELD_MAPPINGS } from '../shared/csvParser.ts';

// Deno types for environment detection
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gemini API configuration
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = 'gemini-3-flash-preview';

// Field ID to CSV field name mapping
const fieldIdToCSVFieldMapping: Record<string, string> = {
  'ui-ux-design': 'UI/UX Design',
  'marketing': 'Marketing',
  'graphic-design': 'Graphic Design',
  'digital-marketing': 'Marketing',
  'thiết-kế-đồ-họa': 'Graphic Design'
};

// Normalize field ID to lowercase-with-dashes format
function normalizeFieldId(fieldId: string): string {
  return fieldId
    .toLowerCase()
    .replace(/[\/\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// Get field name for display from field_id
function getFieldDisplayName(fieldId: string): string {
  // Try to find in CSV mapping first
  if (fieldIdToCSVFieldMapping[fieldId]) {
    return fieldIdToCSVFieldMapping[fieldId];
  }
  
  // Convert field ID to display name (e.g., "ui-ux-design" -> "UI/UX Design")
  return fieldId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Field-specific prompts
const fieldPrompts: Record<string, string> = {
  'artificial-intelligence': 'With the role of an AI expert, provide detailed and accurate information about AI topics in Vietnamese. Include practical examples and current best practices. Please respond in Vietnamese.',
  'artifical-intelligence': 'With the role of an AI expert, provide detailed and accurate information about AI topics in Vietnamese. Include practical examples and current best practices. Please respond in Vietnamese.',
  'data-science': 'With the role of a data science educator, explain concepts clearly with real-world examples in Vietnamese. Focus on practical applications and analytical methods. Please respond in Vietnamese.',
  'web-development': 'With the role of a web development expert, provide practical advice on modern web technologies and best practices in Vietnamese. Please respond in Vietnamese.',
  'cloud-computing': 'With the role of a cloud computing specialist, explain cloud concepts and platforms with practical implementation guidance in Vietnamese. Please respond in Vietnamese.',
  'cybersecurity': 'With the role of a cybersecurity expert, provide information about security practices and threat protection in Vietnamese. Please respond in Vietnamese.',
  'devops': 'With the role of a DevOps specialist, explain CI/CD, automation, and infrastructure best practices in Vietnamese. Please respond in Vietnamese.',
  'mobile-development': 'With the role of a mobile development expert, provide guidance on mobile app development for iOS and Android in Vietnamese. Please respond in Vietnamese.',
  'ui-ux-design': 'With the role of a UI/UX design expert, provide insights on creating intuitive and beautiful user experiences in Vietnamese. Please respond in Vietnamese.',
  'uiux-design': 'With the role of a UI/UX design expert, provide insights on creating intuitive and beautiful user experiences in Vietnamese. Please respond in Vietnamese.',
  'marketing': 'With the role of a digital marketing expert, provide guidance on marketing strategies, campaigns, and best practices in Vietnamese. Please respond in Vietnamese.',
  'graphic-design': 'With the role of a graphic design expert, provide insights on design principles, tools, and creative processes in Vietnamese. Please respond in Vietnamese.'
};

async function* streamGeminiAPI(prompt: string, conversationHistory: any[] = []) {
  if (!GEMINI_API_KEY) {
    yield* streamFallbackResponse('Artificial Intelligence', prompt);
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 1.0, // Gemini 3 default
        maxOutputTokens: 2048,
        topP: 0.8,
        topK: 40,
      }
    });

    // Build chat history with context awareness
    const history = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Start chat with history - Gemini automatically maintains context
    const chat = model.startChat({ history });

    // Stream the response with the current prompt
    // The history is already in the chat context, so just send the new message
    const result = await chat.sendMessageStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error('Gemini SDK streaming error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack',
      type: typeof error,
      error: error
    });
    yield* streamFallbackResponse('this topic', prompt);
  }
}

async function* streamFallbackResponse(fieldName: string, message: string) {
  const text = `Xin lỗi, nhưng hiện tại tôi không thể kết nối với dịch vụ AI của mình. Tuy nhiên, tôi rất muốn giúp bạn tìm hiểu về ${fieldName}!\n\nCâu hỏi của bạn: "${message}"\n\nTrong khi tôi đang kết nối lại, đây là một số tài nguyên hữu ích:\n- Tài liệu hướng dẫn và các bài học chính thức\n- Các khóa học trực tuyến và chứng chỉ\n- Diễn đàn cộng đồng và các cuộc thảo luận\n\nVui lòng thử đặt câu hỏi của bạn lại một lát nữa, hoặc tự do khám phá các chủ đề khác trong nền tảng học tập của chúng tôi.`;
  
  // Stream the fallback text word by word
  const words = text.split(' ');
  for (const word of words) {
    yield word + ' ';
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { session_id, message, field_id, field_name, conversation_history = [] } = await req.json();
    
    console.log('[Edge Function] Processing streaming request with context:', {
      session_id,
      field_id,
      messageLength: message?.length,
      historyLength: conversation_history.length,
      hasContext: conversation_history.length > 0,
      assistantMessages: conversation_history.filter((m: any) => m.role === 'assistant').length,
      userMessages: conversation_history.filter((m: any) => m.role === 'user').length,
      contextSummary: conversation_history.length > 0
        ? `${conversation_history.length} previous messages`
        : 'No previous context',
      history: conversation_history.map((m: any) => ({
        role: m.role,
        contentPreview: m.content?.substring(0, 50) + '...'
      }))
    });

    // Check if this is a learning path request
    const isLearningPathRequest = VIETNAMESE_LEARNING_PATH_KEYWORDS.some(keyword =>
      message.toLowerCase().includes(keyword)
    );

    // If it's a learning path request, handle it with CSV data
    if (isLearningPathRequest) {
      console.log('[Edge Function] Learning path request detected, processing with CSV data', {
        message: message.substring(0, 100),
        field_id,
        keywords_matched: VIETNAMESE_LEARNING_PATH_KEYWORDS.filter(k => message.toLowerCase().includes(k))
      });
      
      try {
        // Load CSV data with proper path resolution
        let csvPath: string;
        if (Deno.env.get('DENO_DEPLOYMENT_ID')) {
          // Production environment
          csvPath = './Course/course-list.csv';
        } else {
          // Development environment
          csvPath = '../../Course/course-list.csv';
        }
        
        const csvResponse = await csvParser.loadCSVFromPath(csvPath);
        
        console.log('[Edge Function] CSV load response:', {
          success: csvResponse.success,
          hasData: !!csvResponse.data,
          error: csvResponse.error,
          learningPathsCount: csvResponse.data?.learningPaths?.length || 0
        });
        
        if (csvResponse.success && csvResponse.data) {
          let learningPaths = [];
          
          // Map field_id to CSV field name if available
          const csvFieldName = fieldIdToCSVFieldMapping[field_id] || null;
          
          // Extract field name from message as fallback
          const fieldNameFromMessage = CSVParser.extractFieldNameFromMessage(message);
          
          // Priority: selected field (field_id) > extracted field name > all paths
          const targetField = csvFieldName || fieldNameFromMessage;
          
          console.log('[Edge Function] Field resolution for learning path:', {
            field_id,
            csvFieldName,
            fieldNameFromMessage,
            targetField,
            willFilterByField: !!targetField,
            priorityUsed: csvFieldName ? 'selected_field' : (fieldNameFromMessage ? 'extracted_field' : 'all_paths')
          });
          
          if (targetField) {
            learningPaths = csvParser.getLearningPathsByField(csvResponse.data, targetField);
          } else {
            // If no specific field mentioned, return all paths
            learningPaths = csvResponse.data.learningPaths;
          }
          
          console.log('[Edge Function] Learning paths found:', {
            count: learningPaths.length,
            paths: learningPaths.map(p => ({ name: p.name, field: p.field }))
          });
          
          // Generate learning path response
          const learningPathResponse = csvParser.generateLearningPathResponse(learningPaths);
          
          // Create a readable stream for Server-Sent Events with learning path data
          const stream = new ReadableStream({
            async start(controller) {
              const encoder = new TextEncoder();
              
              try {
                // Stream the learning path response
                const chunks = learningPathResponse.split(' ');
                for (const chunk of chunks) {
                  const data = JSON.stringify({
                    type: 'chunk',
                    content: chunk + ' ',
                    model: 'csv-learning-path'
                  });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  // Small delay to simulate streaming
                  await new Promise(resolve => setTimeout(resolve, 50));
                }
                
                // Send completion event
                const doneData = JSON.stringify({
                  type: 'done',
                  job_id: crypto.randomUUID(),
                  full_response: learningPathResponse,
                  tokens_used: Math.ceil(learningPathResponse.length / 4),
                  model: 'csv-learning-path',
                  context_messages: conversation_history.length,
                  has_context: conversation_history.length > 0,
                  is_learning_path: true
                });
                controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
                
                controller.close();
              } catch (error) {
                console.error('Learning path streaming error:', error);
                const errorData = JSON.stringify({
                  type: 'error',
                  error: error instanceof Error ? error.message : 'Unknown error'
                });
                controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
                controller.close();
              }
            }
          });

          return new Response(stream, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            }
          });
        } else {
          console.error('Failed to load CSV data:', csvResponse.error);
          // Fall through to normal AI response with error message
        }
      } catch (error) {
        console.error('Error processing learning path request:', error);
        // Fall through to normal AI response
      }
    }

    // Generate field-specific prompt with context awareness
    const normalizedFieldId = normalizeFieldId(field_id);
    const fieldPrompt = fieldPrompts[normalizedFieldId] || '';
    // Use field_name from request if available, otherwise convert field_id
    const fieldDisplayName = field_name || getFieldDisplayName(normalizedFieldId);
    let prompt = message;
    
    // Count only assistant messages (not user messages) to determine if this is truly the first interaction
    const assistantMessageCount = conversation_history.filter((m: any) => m.role === 'assistant').length;
    
    console.log('[Edge Function] Field context setup:', {
      original_field_id: field_id,
      normalizedFieldId,
      fieldDisplayName,
      hasFieldPrompt: !!fieldPrompt,
      assistantMessageCount,
      isFirstInteraction: assistantMessageCount === 0
    });
    
    // Always include field context to ensure AI knows the current topic
    // This is especially important for the first message or field-related questions
    if (fieldPrompt) {
      if (assistantMessageCount === 0) {
        // First interaction: Provide full context about the field
        prompt = `${fieldPrompt}\n\nĐây là câu hỏi đầu tiên của người dùng trong lĩnh vực ${fieldDisplayName}. Người dùng muốn tìm hiểu về chủ đề này.\n\nCâu hỏi người dùng: ${message}`;
      } else {
        // Continuing conversation: Remind the AI of their role and field
        prompt = `${fieldPrompt}\n\nBạn đang tư vấn về lĩnh vực ${fieldDisplayName}.\n\nCâu hỏi tiếp theo của người dùng: ${message}`;
      }
    } else {
      // If no specific field prompt found, still provide context about the field
      if (assistantMessageCount === 0) {
        prompt = `Bạn là một trợ lý AI hỗ trợ học tập trong lĩnh vực ${fieldDisplayName}. Đây là câu hỏi đầu tiên của người dùng. Hãy trả lời bằng tiếng Việt.\n\nCâu hỏi người dùng: ${message}`;
      } else {
        prompt = `Bạn đang tư vấn về lĩnh vực ${fieldDisplayName}. Hãy trả lời bằng tiếng Việt.\n\nCâu hỏi tiếp theo của người dùng: ${message}`;
      }
    }

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          let fullResponse = '';
          
          // Stream the response with conversation history
          for await (const chunk of streamGeminiAPI(prompt, conversation_history)) {
            fullResponse += chunk;
            
            // Send as Server-Sent Event
            const data = JSON.stringify({
              type: 'chunk',
              content: chunk,
              model: GEMINI_MODEL
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          
          // Send completion event
          const doneData = JSON.stringify({
            type: 'done',
            job_id: crypto.randomUUID(),
            full_response: fullResponse,
            tokens_used: Math.ceil(fullResponse.length / 4),
            model: GEMINI_MODEL,
            context_messages: conversation_history.length,
            has_context: conversation_history.length > 0
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
          
          console.log('[Edge Function] Response completed with context:', {
            session_id,
            responseLength: fullResponse.length,
            contextMessages: conversation_history.length,
            hasContext: conversation_history.length > 0
          });
          
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          console.error('Stream error details:', {
            message: error instanceof Error ? error.message : 'Unknown',
            stack: error instanceof Error ? error.stack : 'No stack',
            type: typeof error
          });
          
          // Get error message without any regex operations
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          const errorData = JSON.stringify({
            type: 'error',
            error: errorMessage
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(
      JSON.stringify({
        error: errorMessage || 'Lỗi máy chủ nội bộ',
        details: errorDetails
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
