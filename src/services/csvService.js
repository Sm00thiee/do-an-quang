/**
 * CSV Service - Learning Path Data Parsing
 * Ported from CourseAiChat/course-ai-chat/src/services/courseDataService.ts
 * Handles parsing of course-list.csv for learning path recommendations
 */

// Vietnamese field name mappings
export const VIETNAMESE_FIELD_MAPPINGS = {
  'marketing': 'Marketing',
  'ui/ux': 'UI/UX Design',
  'ui ux': 'UI/UX Design',
  'ui/ux design': 'UI/UX Design',
  'uiux': 'UI/UX Design',
  'ux': 'UI/UX Design',
  'ui': 'UI/UX Design',
  'graphic design': 'Graphic Design',
  'graphic': 'Graphic Design',
  'thiết kế đồ họa': 'Graphic Design',
  'thiết kế': 'Graphic Design',
  'đồ họa': 'Graphic Design',
  'marketing kỹ thuật số': 'Marketing',
  'digital marketing': 'Marketing'
};

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
  'bat dau hoc',
  'roadmap',
  'học gì',
  'hoc gi'
];

class CSVService {
  constructor() {
    this.cachedData = null;
    this.lastFetchTime = 0;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Parse CSV line handling quoted values and commas within quotes
   */
  parseCSVLine(line) {
    const result = [];
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
  mapToField(learningPathName) {
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
  generateId(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  /**
   * Validate Google Drive URL format
   */
  validateGoogleDriveUrl(url) {
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
  validateStudyTime(timeStr) {
    const time = parseFloat(timeStr);
    if (isNaN(time) || time < 0 || time > 24) {
      return null;
    }
    return time;
  }

  /**
   * Parse CSV string into structured data
   */
  parseCSV(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must contain header and at least one data row');
    }

    const learningPathMap = new Map();
    let totalCourses = 0;
    let totalHours = 0;

    // Track current context for continuation rows
    let currentLearningPath = null;
    let currentCategory = null;

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
        const lesson = {
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
  }

  /**
   * Load CSV from file
   */
  async loadCSVFromFile() {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cachedData && (now - this.lastFetchTime < this.CACHE_DURATION)) {
      console.log('[csvService] Returning cached CSV data');
      return this.cachedData;
    }

    try {
      console.log('[csvService] Loading CSV from /Course/course-list.csv');
      const response = await fetch('/Course/course-list.csv');
      
      if (!response.ok) {
        throw new Error(`Failed to load CSV: ${response.statusText}`);
      }
      
      const csvContent = await response.text();
      const parsedData = this.parseCSV(csvContent);
      
      // Cache the data
      this.cachedData = parsedData;
      this.lastFetchTime = now;
      
      console.log('[csvService] CSV loaded successfully:', {
        learningPaths: parsedData.learningPaths.length,
        fields: parsedData.fields.length,
        totalCourses: parsedData.totalCourses,
        totalHours: parsedData.totalHours
      });
      
      return parsedData;
    } catch (error) {
      console.error('[csvService] Error loading CSV:', error);
      throw error;
    }
  }

  /**
   * Get learning paths by field name
   */
  async getLearningPathsByField(fieldName) {
    try {
      const data = await this.loadCSVFromFile();
      
      // Normalize field name for comparison
      const normalizedField = fieldName.toLowerCase();
      
      // Find matching field using Vietnamese mappings
      const mappedField = VIETNAMESE_FIELD_MAPPINGS[normalizedField] || fieldName;
      
      const paths = data.learningPaths.filter(path => 
        path.field.toLowerCase() === mappedField.toLowerCase() ||
        path.field.toLowerCase() === normalizedField
      );
      
      console.log(`[csvService] Found ${paths.length} paths for field "${fieldName}"`);
      return paths;
    } catch (error) {
      console.error('[csvService] Error getting learning paths by field:', error);
      return [];
    }
  }

  /**
   * Detect if message is requesting a learning path
   */
  isLearningPathRequest(message) {
    const lowerMessage = message.toLowerCase();
    return VIETNAMESE_LEARNING_PATH_KEYWORDS.some(keyword => 
      lowerMessage.includes(keyword)
    );
  }

  /**
   * Detect field from message
   */
  detectFieldFromMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check each field mapping
    for (const [key, value] of Object.entries(VIETNAMESE_FIELD_MAPPINGS)) {
      if (lowerMessage.includes(key)) {
        return value;
      }
    }
    
    return null;
  }

  /**
   * Format learning path for display
   */
  formatLearningPathForDisplay(learningPath) {
    if (!learningPath) return '';
    
    let output = `📚 **${learningPath.name}**\n\n`;
    output += `⏱️ Tổng thời gian: ${learningPath.totalStudyTime} giờ\n`;
    output += `📖 Tổng số bài học: ${learningPath.totalLessons} bài\n\n`;
    output += `---\n\n`;
    
    learningPath.categories.forEach((category, catIndex) => {
      output += `### ${catIndex + 1}. ${category.name}\n`;
      output += `⏱️ ${category.totalStudyTime} giờ\n\n`;
      
      category.lessons.forEach((lesson, lessonIndex) => {
        output += `**Bài ${lesson.stt}. ${lesson.lessonTitle}**\n`;
        output += `🔗 [Xem bài học](${lesson.lessonUrl})\n`;
        output += `⏱️ ${lesson.studyTime} giờ\n\n`;
      });
      
      output += `---\n\n`;
    });
    
    return output;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cachedData = null;
    this.lastFetchTime = 0;
    console.log('[csvService] Cache cleared');
  }
}

// Export singleton instance
export const csvService = new CSVService();
export default csvService;
