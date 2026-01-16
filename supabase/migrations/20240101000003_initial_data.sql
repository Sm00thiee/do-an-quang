-- Initial Data Migration for CourseAiChat
-- This file seeds the database with initial data for fields and some sample learning paths

-- Insert initial fields
INSERT INTO fields (name, description, icon_url, sort_order) VALUES
('Technology', 'Learn programming, software development, and IT skills', 'https://picsum.photos/seed/technology/200/200.jpg', 1),
('Business', 'Develop business acumen and entrepreneurial skills', 'https://picsum.photos/seed/business/200/200.jpg', 2),
('Design', 'Master design principles and creative tools', 'https://picsum.photos/seed/design/200/200.jpg', 3),
('Marketing', 'Learn digital marketing and brand management', 'https://picsum.photos/seed/marketing/200/200.jpg', 4),
('Data Science', 'Explore data analysis and machine learning', 'https://picsum.photos/seed/datascience/200/200.jpg', 5);

-- Insert learning paths for Technology field
INSERT INTO learning_paths (field_id, name, description, difficulty_level, estimated_duration_hours, sort_order) 
SELECT 
    f.id,
    'Web Development Fundamentals',
    'Learn the basics of HTML, CSS, and JavaScript to build modern websites',
    'beginner',
    40,
    1
FROM fields f WHERE f.name = 'Technology';

INSERT INTO learning_paths (field_id, name, description, difficulty_level, estimated_duration_hours, sort_order) 
SELECT 
    f.id,
    'Advanced React Development',
    'Master React.js and build complex single-page applications',
    'advanced',
    60,
    2
FROM fields f WHERE f.name = 'Technology';

INSERT INTO learning_paths (field_id, name, description, difficulty_level, estimated_duration_hours, sort_order) 
SELECT 
    f.id,
    'Backend Development with Node.js',
    'Build scalable server-side applications with Node.js and Express',
    'intermediate',
    50,
    3
FROM fields f WHERE f.name = 'Technology';

-- Insert learning paths for Business field
INSERT INTO learning_paths (field_id, name, description, difficulty_level, estimated_duration_hours, sort_order) 
SELECT 
    f.id,
    'Business Fundamentals',
    'Essential business concepts and strategies for entrepreneurs',
    'beginner',
    30,
    1
FROM fields f WHERE f.name = 'Business';

INSERT INTO learning_paths (field_id, name, description, difficulty_level, estimated_duration_hours, sort_order) 
SELECT 
    f.id,
    'Digital Marketing Strategy',
    'Learn to create effective digital marketing campaigns',
    'intermediate',
    35,
    2
FROM fields f WHERE f.name = 'Business';

INSERT INTO learning_paths (field_id, name, description, difficulty_level, estimated_duration_hours, sort_order) 
SELECT 
    f.id,
    'Financial Management',
    'Master financial planning and business finance',
    'advanced',
    45,
    3
FROM fields f WHERE f.name = 'Business';

-- Insert learning paths for Design field
INSERT INTO learning_paths (field_id, name, description, difficulty_level, estimated_duration_hours, sort_order) 
SELECT 
    f.id,
    'UI/UX Design Basics',
    'Introduction to user interface and user experience design',
    'beginner',
    25,
    1
FROM fields f WHERE f.name = 'Design';

INSERT INTO learning_paths (field_id, name, description, difficulty_level, estimated_duration_hours, sort_order) 
SELECT 
    f.id,
    'Advanced Graphic Design',
    'Master professional graphic design techniques and tools',
    'advanced',
    40,
    2
FROM fields f WHERE f.name = 'Design';

-- Insert learning paths for Marketing field
INSERT INTO learning_paths (field_id, name, description, difficulty_level, estimated_duration_hours, sort_order) 
SELECT 
    f.id,
    'Social Media Marketing',
    'Build effective social media strategies for businesses',
    'beginner',
    20,
    1
FROM fields f WHERE f.name = 'Marketing';

INSERT INTO learning_paths (field_id, name, description, difficulty_level, estimated_duration_hours, sort_order) 
SELECT 
    f.id,
    'Content Marketing Mastery',
    'Create compelling content that drives engagement and conversions',
    'intermediate',
    30,
    2
FROM fields f WHERE f.name = 'Marketing';

-- Insert learning paths for Data Science field
INSERT INTO learning_paths (field_id, name, description, difficulty_level, estimated_duration_hours, sort_order) 
SELECT 
    f.id,
    'Data Analysis Fundamentals',
    'Learn to analyze data and derive meaningful insights',
    'beginner',
    35,
    1
FROM fields f WHERE f.name = 'Data Science';

INSERT INTO learning_paths (field_id, name, description, difficulty_level, estimated_duration_hours, sort_order) 
SELECT 
    f.id,
    'Machine Learning Basics',
    'Introduction to machine learning algorithms and applications',
    'intermediate',
    50,
    2
FROM fields f WHERE f.name = 'Data Science';

INSERT INTO learning_paths (field_id, name, description, difficulty_level, estimated_duration_hours, sort_order) 
SELECT 
    f.id,
    'Advanced Deep Learning',
    'Master neural networks and deep learning frameworks',
    'advanced',
    70,
    3
FROM fields f WHERE f.name = 'Data Science';

-- Insert sample courses for Web Development Fundamentals
INSERT INTO courses (learning_path_id, name, description, course_url, duration_hours, difficulty_level, instructor_name, price, currency, sort_order)
SELECT 
    lp.id,
    'HTML & CSS Basics',
    'Learn the fundamentals of HTML and CSS to structure and style web pages',
    'https://example.com/html-css-basics',
    10,
    'beginner',
    'John Smith',
    29.99,
    'USD',
    1
FROM learning_paths lp 
JOIN fields f ON lp.field_id = f.id 
WHERE f.name = 'Technology' AND lp.name = 'Web Development Fundamentals';

INSERT INTO courses (learning_path_id, name, description, course_url, duration_hours, difficulty_level, instructor_name, price, currency, sort_order)
SELECT 
    lp.id,
    'JavaScript Fundamentals',
    'Master JavaScript programming for interactive web development',
    'https://example.com/javascript-fundamentals',
    15,
    'beginner',
    'Sarah Johnson',
    39.99,
    'USD',
    2
FROM learning_paths lp 
JOIN fields f ON lp.field_id = f.id 
WHERE f.name = 'Technology' AND lp.name = 'Web Development Fundamentals';

INSERT INTO courses (learning_path_id, name, description, course_url, duration_hours, difficulty_level, instructor_name, price, currency, sort_order)
SELECT 
    lp.id,
    'Responsive Web Design',
    'Create websites that work perfectly on all devices and screen sizes',
    'https://example.com/responsive-design',
    15,
    'beginner',
    'Mike Chen',
    34.99,
    'USD',
    3
FROM learning_paths lp 
JOIN fields f ON lp.field_id = f.id 
WHERE f.name = 'Technology' AND lp.name = 'Web Development Fundamentals';

-- Insert sample courses for Advanced React Development
INSERT INTO courses (learning_path_id, name, description, course_url, duration_hours, difficulty_level, instructor_name, price, currency, sort_order)
SELECT 
    lp.id,
    'React Components and Props',
    'Deep dive into React components and how to pass data between them',
    'https://example.com/react-components',
    20,
    'advanced',
    'David Wilson',
    49.99,
    'USD',
    1
FROM learning_paths lp 
JOIN fields f ON lp.field_id = f.id 
WHERE f.name = 'Technology' AND lp.name = 'Advanced React Development';

INSERT INTO courses (learning_path_id, name, description, course_url, duration_hours, difficulty_level, instructor_name, price, currency, sort_order)
SELECT 
    lp.id,
    'State Management with Redux',
    'Master Redux for complex state management in React applications',
    'https://example.com/react-redux',
    25,
    'advanced',
    'Emily Davis',
    59.99,
    'USD',
    2
FROM learning_paths lp 
JOIN fields f ON lp.field_id = f.id 
WHERE f.name = 'Technology' AND lp.name = 'Advanced React Development';

INSERT INTO courses (learning_path_id, name, description, course_url, duration_hours, difficulty_level, instructor_name, price, currency, sort_order)
SELECT 
    lp.id,
    'React Performance Optimization',
    'Learn advanced techniques to optimize React application performance',
    'https://example.com/react-performance',
    15,
    'advanced',
    'Alex Thompson',
    44.99,
    'USD',
    3
FROM learning_paths lp 
JOIN fields f ON lp.field_id = f.id 
WHERE f.name = 'Technology' AND lp.name = 'Advanced React Development';

-- Insert sample courses for Business Fundamentals
INSERT INTO courses (learning_path_id, name, description, course_url, duration_hours, difficulty_level, instructor_name, price, currency, sort_order)
SELECT 
    lp.id,
    'Business Planning Essentials',
    'Learn to create comprehensive business plans for success',
    'https://example.com/business-planning',
    15,
    'beginner',
    'Robert Martinez',
    39.99,
    'USD',
    1
FROM learning_paths lp 
JOIN fields f ON lp.field_id = f.id 
WHERE f.name = 'Business' AND lp.name = 'Business Fundamentals';

INSERT INTO courses (learning_path_id, name, description, course_url, duration_hours, difficulty_level, instructor_name, price, currency, sort_order)
SELECT 
    lp.id,
    'Marketing Strategies',
    'Essential marketing strategies for business growth',
    'https://example.com/marketing-strategies',
    10,
    'beginner',
    'Lisa Anderson',
    29.99,
    'USD',
    2
FROM learning_paths lp 
JOIN fields f ON lp.field_id = f.id 
WHERE f.name = 'Business' AND lp.name = 'Business Fundamentals';

-- Insert sample courses for UI/UX Design Basics
INSERT INTO courses (learning_path_id, name, description, course_url, duration_hours, difficulty_level, instructor_name, price, currency, sort_order)
SELECT 
    lp.id,
    'Design Principles',
    'Fundamental principles of good design',
    'https://example.com/design-principles',
    10,
    'beginner',
    'Jessica Taylor',
    34.99,
    'USD',
    1
FROM learning_paths lp 
JOIN fields f ON lp.field_id = f.id 
WHERE f.name = 'Design' AND lp.name = 'UI/UX Design Basics';

INSERT INTO courses (learning_path_id, name, description, course_url, duration_hours, difficulty_level, instructor_name, price, currency, sort_order)
SELECT 
    lp.id,
    'User Research Methods',
    'Learn how to conduct effective user research',
    'https://example.com/user-research',
    15,
    'beginner',
    'Michael Brown',
    44.99,
    'USD',
    2
FROM learning_paths lp 
JOIN fields f ON lp.field_id = f.id 
WHERE f.name = 'Design' AND lp.name = 'UI/UX Design Basics';

-- Insert sample courses for Data Analysis Fundamentals
INSERT INTO courses (learning_path_id, name, description, course_url, duration_hours, difficulty_level, instructor_name, price, currency, sort_order)
SELECT 
    lp.id,
    'Introduction to Data Analysis',
    'Get started with data analysis concepts and tools',
    'https://example.com/data-analysis-intro',
    15,
    'beginner',
    'Christopher Lee',
    39.99,
    'USD',
    1
FROM learning_paths lp 
JOIN fields f ON lp.field_id = f.id 
WHERE f.name = 'Data Science' AND lp.name = 'Data Analysis Fundamentals';

INSERT INTO courses (learning_path_id, name, description, course_url, duration_hours, difficulty_level, instructor_name, price, currency, sort_order)
SELECT 
    lp.id,
    'Data Visualization',
    'Learn to create compelling data visualizations',
    'https://example.com/data-visualization',
    20,
    'beginner',
    'Amanda White',
    49.99,
    'USD',
    2
FROM learning_paths lp 
JOIN fields f ON lp.field_id = f.id 
WHERE f.name = 'Data Science' AND lp.name = 'Data Analysis Fundamentals';