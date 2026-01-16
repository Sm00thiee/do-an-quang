// Shared CSV parsing utility for Supabase Edge Functions
// Handles CSV parsing in the Supabase environment with proper error handling

// TypeScript interfaces for course data structures
export interface CourseLesson {
  stt: number;
  lessonTitle: string;
  lessonUrl: string;
  studyTime: number; // in hours
}

export interface CourseCategory {
  name: string;
  lessons: CourseLesson[];
  totalStudyTime: number; // in hours
}

export interface LearningPath {
  id: string;
  name: string;
  field: 'Marketing' | 'UI/UX Design' | 'Graphic Design';
  categories: CourseCategory[];
  totalLessons: number;
  totalStudyTime: number; // in hours
}

export interface ParsedCSVData {
  learningPaths: LearningPath[];
  fields: string[];
  totalCourses: number;
  totalHours: number;
}

export interface CSVParserResponse {
  success: boolean;
  data?: ParsedCSVData;
  error?: string;
}

// Vietnamese field name mappings
export const VIETNAMESE_FIELD_MAPPINGS = {
  'marketing': 'Marketing',
  'ui/ux': 'UI/UX Design',
  'ui ux': 'UI/UX Design',
  'graphic design': 'Graphic Design',
  'thiết kế đồ họa': 'Graphic Design',
  'marketing kỹ thuật số': 'Marketing',
  'digital marketing': 'Marketing'
} as const;

// Vietnamese keywords for learning path detection
export const VIETNAMESE_LEARNING_PATH_KEYWORDS = [
  'lộ trình',
  'lo trinh',
  'tạo lộ trình',
  'tao lo trinh',
  'gợi ý lộ trình',
  'goi y lo trinh',
  'học tập',
  'hoc tap',
  'khóa học',
  'khoa hoc',
  'đào tạo',
  'dao tao',
  'chương trình học',
  'chuong trinh hoc',
  'nội dung học',
  'noi dung hoc',
  'bài học',
  'bai hoc',
  'curriculum',
  'syllabus',
  'learning path',
  'đường đi',
  'duong di',
  'con đường học tập',
  'con duong hoc tap',
  'học như thế nào',
  'hoc nhu the nao',
  'bắt đầu học',
  'bat dau hoc'
] as const;

export class CSVParser {
  private static instance: CSVParser;
  private cachedData: ParsedCSVData | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for backend

  private constructor() {}

  static getInstance(): CSVParser {
    if (!CSVParser.instance) {
      CSVParser.instance = new CSVParser();
    }
    return CSVParser.instance;
  }

  /**
   * Parse CSV string into structured data
   */
  parseCSV(csvContent: string): ParsedCSVData {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV file must contain header and at least one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const learningPathMap = new Map<string, LearningPath>();
      let totalCourses = 0;
      let totalHours = 0;

      // Track current context for continuation rows
      let currentLearningPath: string | null = null;
      let currentCategory: string | null = null;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = this.parseCSVLine(line);
        if (values.length < 6) continue;

        const [stt, learningPathName, categoryName, lessonTitle, lessonUrl, studyTimeStr] = values;

        // Validate essential data
        if (!lessonTitle || !lessonUrl) {
          console.warn(`Skipping row ${i}: Missing lesson title or URL`);
          continue;
        }

        // Validate and parse study time
        const studyTime = this.validateStudyTime(studyTimeStr);
        if (studyTime === null) {
          console.warn(`Skipping row ${i}: Invalid study time "${studyTimeStr}"`);
          continue;
        }

        // Validate Google Drive URL
        if (!this.validateGoogleDriveUrl(lessonUrl)) {
          console.warn(`Skipping row ${i}: Invalid Google Drive URL "${lessonUrl}"`);
          continue;
        }

        const sttNum = parseInt(stt) || 0;

        // Handle continuation rows - use previous values if current is empty
        const effectiveLearningPath = learningPathName || currentLearningPath;
        const effectiveCategory = categoryName || currentCategory;
        
        // Only update current values when non-empty
        if (learningPathName) currentLearningPath = learningPathName;
        if (categoryName) currentCategory = categoryName;

        if (!effectiveLearningPath) {
          console.warn(`Skipping row ${i}: No learning path context`);
          continue;
        }

        // Get or create learning path
        let learningPath = learningPathMap.get(effectiveLearningPath);
        if (!learningPath) {
          learningPath = {
            id: this.generateId(effectiveLearningPath),
            name: effectiveLearningPath,
            field: this.mapToField(effectiveLearningPath),
            categories: [],
            totalLessons: 0,
            totalStudyTime: 0
          };
          learningPathMap.set(effectiveLearningPath, learningPath);
        }

        // Get or create category
        let category = learningPath.categories.find(cat => cat.name === effectiveCategory);
        if (!category && effectiveCategory) {
          category = {
            name: effectiveCategory,
            lessons: [],
            totalStudyTime: 0
          };
          learningPath.categories.push(category);
        }

        // Add lesson to category
        if (category) {
          const lesson: CourseLesson = {
            stt: sttNum,
            lessonTitle: lessonTitle.trim(),
            lessonUrl: lessonUrl.trim(),
            studyTime
          };
          category.lessons.push(lesson);
          category.totalStudyTime += studyTime;
        }

        totalCourses++;
        totalHours += studyTime;
      }

      // Calculate totals for each learning path
      const learningPaths = Array.from(learningPathMap.values()).map(path => {
        path.totalLessons = path.categories.reduce((sum, cat) => sum + cat.lessons.length, 0);
        path.totalStudyTime = path.categories.reduce((sum, cat) => sum + cat.totalStudyTime, 0);
        return path;
      });

      const fields = [...new Set(learningPaths.map(path => path.field))];

      return {
        learningPaths,
        fields,
        totalCourses,
        totalHours
      };
    } catch (error) {
      console.error('Error parsing CSV:', error);
      throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse CSV line handling quoted values and commas within quotes
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Map learning path name to field
   */
  private mapToField(learningPathName: string): 'Marketing' | 'UI/UX Design' | 'Graphic Design' {
    const normalized = learningPathName.toLowerCase();
    
    if (normalized.includes('marketing')) {
      return 'Marketing';
    } else if (normalized.includes('ui/ux') || normalized.includes('ui ux')) {
      return 'UI/UX Design';
    } else if (normalized.includes('graphic')) {
      return 'Graphic Design';
    }
    
    // Default fallback
    return 'Marketing';
  }

  /**
   * Generate ID from name
   */
  private generateId(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  /**
   * Validate Google Drive URL format
   */
  private validateGoogleDriveUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'drive.google.com' &&
             urlObj.pathname.includes('/file/d/') &&
             urlObj.searchParams.has('usp');
    } catch {
      return false;
    }
  }

  /**
   * Validate study time value
   */
  private validateStudyTime(timeStr: string): number | null {
    const time = parseFloat(timeStr);
    if (isNaN(time) || time < 0 || time > 24) {
      return null;
    }
    return time;
  }

  /**
   * Load CSV data from file path (for Supabase environment)
   */
  async loadCSVFromPath(filePath: string): Promise<CSVParserResponse> {
    try {
      const now = Date.now();
      
      // Return cached data if still valid
      if (this.cachedData && (now - this.lastFetchTime) < this.CACHE_DURATION) {
        console.log('[CSV Parser] Returning cached data');
        return {
          success: true,
          data: this.cachedData
        };
      }

      // Determine the correct path based on environment
      let csvPath = filePath;
      if (Deno.env.get('DENO_DEPLOYMENT_ID')) {
        // Production environment - use relative path from function directory
        csvPath = './Course/course-list.csv';
      } else {
        // Development environment - use the provided path or default
        csvPath = filePath || '../../Course/course-list.csv';
      }

      console.log('[CSV Parser] Attempting to load CSV from:', csvPath);

      // Use Deno.readTextFile for Deno environment
      let csvContent: string;
      
      try {
        csvContent = await Deno.readTextFile(csvPath);
        console.log('[CSV Parser] Successfully loaded CSV from:', csvPath);
      } catch (fileError) {
        console.error('[CSV Parser] Failed to load from primary path:', csvPath, fileError);
        
        // Try alternative paths for different deployment scenarios
        const alternativePaths = [
          './Course/course-list.csv',
          '../../Course/course-list.csv',
          '../Course/course-list.csv',
          './course-list.csv',
          '../shared/Course/course-list.csv'
        ];
        
        let loaded = false;
        for (const altPath of alternativePaths) {
          try {
            csvContent = await Deno.readTextFile(altPath);
            loaded = true;
            console.log('[CSV Parser] Successfully loaded CSV from alternative path:', altPath);
            break;
          } catch {
            console.log('[CSV Parser] Failed to load from:', altPath);
            continue;
          }
        }
        
        if (!loaded) {
          const errorMsg = `CSV file not found at any of the attempted paths: ${[csvPath, ...alternativePaths].join(', ')}`;
          console.error('[CSV Parser]', errorMsg);
          throw new Error(errorMsg);
        }
      }
      
      console.log('[CSV Parser] CSV content loaded, length:', csvContent.length);
      this.cachedData = this.parseCSV(csvContent);
      this.lastFetchTime = now;
      
      console.log('[CSV Parser] Successfully parsed CSV data:', {
        learningPathsCount: this.cachedData.learningPaths.length,
        fields: this.cachedData.fields,
        totalCourses: this.cachedData.totalCourses
      });
      
      return {
        success: true,
        data: this.cachedData
      };
    } catch (error) {
      console.error('[CSV Parser] Error loading CSV from path:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Parse CSV content directly from string
   */
  parseCSVFromString(csvContent: string): CSVParserResponse {
    try {
      const data = this.parseCSV(csvContent);
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error parsing CSV from string:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get learning paths by field name
   */
  getLearningPathsByField(data: ParsedCSVData, fieldName: string): LearningPath[] {
    // Normalize field name using Vietnamese mappings
    const normalizedField = fieldName.toLowerCase();
    const mappedField = VIETNAMESE_FIELD_MAPPINGS[normalizedField as keyof typeof VIETNAMESE_FIELD_MAPPINGS] || fieldName;
    
    return data.learningPaths.filter(path => 
      path.field.toLowerCase() === mappedField.toLowerCase() ||
      path.name.toLowerCase().includes(normalizedField)
    );
  }

  /**
   * Get learning path by ID
   */
  getLearningPathById(data: ParsedCSVData, id: string): LearningPath | null {
    return data.learningPaths.find(path => path.id === id) || null;
  }

  /**
   * Search learning paths by keyword
   */
  searchLearningPaths(data: ParsedCSVData, keyword: string): LearningPath[] {
    const normalizedKeyword = keyword.toLowerCase();
    
    return data.learningPaths.filter(path => {
      // Search in path name
      if (path.name.toLowerCase().includes(normalizedKeyword)) {
        return true;
      }
      
      // Search in field
      if (path.field.toLowerCase().includes(normalizedKeyword)) {
        return true;
      }
      
      // Search in category names
      if (path.categories.some(cat => cat.name.toLowerCase().includes(normalizedKeyword))) {
        return true;
      }
      
      // Search in lesson titles
      if (path.categories.some(cat => 
        cat.lessons.some(lesson => lesson.lessonTitle.toLowerCase().includes(normalizedKeyword))
      )) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Generate structured learning path response for chat
   */
  generateLearningPathResponse(paths: LearningPath[]): string {
    if (paths.length === 0) {
      return 'Xin lỗi, tôi không tìm thấy lộ trình học tập phù hợp. Vui lòng thử với lĩnh vực khác như Marketing, UI/UX Design, hoặc Graphic Design.';
    }

    let responseText = `Tôi đã tìm thấy ${paths.length} lộ trình học tập:\n\n`
    
    paths.forEach((path, index) => {
      responseText += `## ${index + 1}. ${path.name}\n`
      responseText += `**Lĩnh vực:** ${path.field}\n`
      responseText += `**Tổng thời gian học:** ${path.totalStudyTime} giờ\n`
      responseText += `**Số bài học:** ${path.totalLessons}\n\n`
      
      path.categories.forEach(category => {
        responseText += `### ${category.name}\n`
        responseText += `**Thời gian:** ${category.totalStudyTime} giờ\n\n`
        
        category.lessons.forEach(lesson => {
          responseText += `- [${lesson.lessonTitle}](${lesson.lessonUrl}) (${lesson.studyTime} giờ)\n`
        })
        responseText += '\n'
      })
      
      responseText += '---\n\n'
    })

    return responseText;
  }

  /**
   * Check if user is asking for learning path information (Vietnamese keywords)
   */
  static isLearningPathRequest(message: string): boolean {
    const normalizedMessage = message.toLowerCase();
    return VIETNAMESE_LEARNING_PATH_KEYWORDS.some(keyword => 
      normalizedMessage.includes(keyword)
    );
  }

  /**
   * Extract field name from user message
   */
  static extractFieldNameFromMessage(message: string): string | null {
    const normalizedMessage = message.toLowerCase();
    
    // Check for Vietnamese field mappings
    for (const [key, value] of Object.entries(VIETNAMESE_FIELD_MAPPINGS)) {
      if (normalizedMessage.includes(key)) {
        return value;
      }
    }
    
    // Check for exact field names
    const fields = ['Marketing', 'UI/UX Design', 'Graphic Design'];
    for (const field of fields) {
      if (normalizedMessage.includes(field.toLowerCase())) {
        return field;
      }
    }
    
    return null;
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cachedData = null;
    this.lastFetchTime = 0;
  }

  /**
   * Get summary statistics
   */
  getStatistics(data: ParsedCSVData): { 
    totalPaths: number; 
    totalCourses: number; 
    totalHours: number; 
    fields: string[] 
  } {
    return {
      totalPaths: data.learningPaths.length,
      totalCourses: data.totalCourses,
      totalHours: data.totalHours,
      fields: data.fields
    };
  }
}

// Export singleton instance
export const csvParser = CSVParser.getInstance();

// Utility functions for edge functions
export async function handleCSVRequest(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const fieldName = url.searchParams.get('field');
    const keyword = url.searchParams.get('search');
    const id = url.searchParams.get('id');

    // Load CSV data
    const csvResponse = await csvParser.loadCSVFromPath('./Course/course-list.csv');
    if (!csvResponse.success || !csvResponse.data) {
      return new Response(
        JSON.stringify({ error: csvResponse.error || 'Failed to load CSV data' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = csvResponse.data;
    let result: any;

    switch (action) {
      case 'all':
        result = { success: true, data: data.learningPaths };
        break;
      case 'field':
        if (!fieldName) {
          result = { success: false, error: 'Field parameter is required' };
        } else {
          const paths = csvParser.getLearningPathsByField(data, fieldName);
          result = { success: true, data: paths };
        }
        break;
      case 'search':
        if (!keyword) {
          result = { success: false, error: 'Search parameter is required' };
        } else {
          const paths = csvParser.searchLearningPaths(data, keyword);
          result = { success: true, data: paths };
        }
        break;
      case 'id':
        if (!id) {
          result = { success: false, error: 'ID parameter is required' };
        } else {
          const path = csvParser.getLearningPathById(data, id);
          result = { success: true, data: path };
        }
        break;
      case 'stats':
        result = { success: true, data: csvParser.getStatistics(data) };
        break;
      default:
        result = { success: false, error: 'Invalid action parameter' };
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error handling CSV request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}