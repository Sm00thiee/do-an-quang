-- Seed Data for Simplified CourseAiChat Schema
-- This file seeds the database with initial data for fields, courses, learning paths, and sample data

-- Insert initial fields (3-5 example fields)
INSERT INTO fields (name, description, is_active) VALUES
('Web Development', 'Learn modern web development technologies including HTML, CSS, JavaScript, and popular frameworks', true),
('Data Science', 'Master data analysis, machine learning, and artificial intelligence concepts and tools', true),
('Mobile Development', 'Build native and cross-platform mobile applications for iOS and Android', true),
('Cloud Computing', 'Learn cloud platforms, DevOps, and infrastructure management', true),
('UI/UX Design', 'Design beautiful and functional user interfaces and user experiences', true);

-- Insert courses across different fields (5-10 example courses)
-- Web Development Courses
INSERT INTO courses (title, description, field_id, is_active) 
SELECT 
    'HTML & CSS Fundamentals',
    'Learn the building blocks of web development with HTML5 and CSS3',
    f.id,
    true
FROM fields f WHERE f.name = 'Web Development';

INSERT INTO courses (title, description, field_id, is_active) 
SELECT 
    'JavaScript Essentials',
    'Master JavaScript programming from basics to advanced concepts',
    f.id,
    true
FROM fields f WHERE f.name = 'Web Development';

INSERT INTO courses (title, description, field_id, is_active) 
SELECT 
    'React Development',
    'Build modern single-page applications with React.js',
    f.id,
    true
FROM fields f WHERE f.name = 'Web Development';

-- Data Science Courses
INSERT INTO courses (title, description, field_id, is_active) 
SELECT 
    'Python for Data Science',
    'Learn Python programming with focus on data analysis and visualization',
    f.id,
    true
FROM fields f WHERE f.name = 'Data Science';

INSERT INTO courses (title, description, field_id, is_active) 
SELECT 
    'Machine Learning Basics',
    'Introduction to machine learning algorithms and practical applications',
    f.id,
    true
FROM fields f WHERE f.name = 'Data Science';

-- Mobile Development Courses
INSERT INTO courses (title, description, field_id, is_active) 
SELECT 
    'React Native Development',
    'Build cross-platform mobile apps using React Native',
    f.id,
    true
FROM fields f WHERE f.name = 'Mobile Development';

INSERT INTO courses (title, description, field_id, is_active) 
SELECT 
    'Flutter Fundamentals',
    'Create beautiful mobile apps with Flutter and Dart',
    f.id,
    true
FROM fields f WHERE f.name = 'Mobile Development';

-- Cloud Computing Courses
INSERT INTO courses (title, description, field_id, is_active) 
SELECT 
    'AWS Cloud Practitioner',
    'Learn Amazon Web Services fundamentals and cloud computing concepts',
    f.id,
    true
FROM fields f WHERE f.name = 'Cloud Computing';

-- UI/UX Design Courses
INSERT INTO courses (title, description, field_id, is_active) 
SELECT 
    'Figma for UI Design',
    'Master Figma for creating stunning user interfaces and prototypes',
    f.id,
    true
FROM fields f WHERE f.name = 'UI/UX Design';

-- Insert learning paths (2-3 example learning paths combining courses)
-- Learning Path 1: Full Stack Web Development
INSERT INTO learning_paths (name, description, is_active) VALUES
('Full Stack Web Development', 'Complete path to become a full stack web developer from frontend to backend', true);

-- Add courses to Full Stack Web Development learning path
INSERT INTO learning_path_courses (learning_path_id, course_id, sort_order)
SELECT 
    lp.id,
    c.id,
    1
FROM learning_paths lp, courses c, fields f
WHERE lp.name = 'Full Stack Web Development' 
  AND c.title = 'HTML & CSS Fundamentals'
  AND f.name = 'Web Development'
  AND c.field_id = f.id;

INSERT INTO learning_path_courses (learning_path_id, course_id, sort_order)
SELECT 
    lp.id,
    c.id,
    2
FROM learning_paths lp, courses c, fields f
WHERE lp.name = 'Full Stack Web Development' 
  AND c.title = 'JavaScript Essentials'
  AND f.name = 'Web Development'
  AND c.field_id = f.id;

INSERT INTO learning_path_courses (learning_path_id, course_id, sort_order)
SELECT 
    lp.id,
    c.id,
    3
FROM learning_paths lp, courses c, fields f
WHERE lp.name = 'Full Stack Web Development' 
  AND c.title = 'React Development'
  AND f.name = 'Web Development'
  AND c.field_id = f.id;

-- Learning Path 2: Data Science Fundamentals
INSERT INTO learning_paths (name, description, is_active) VALUES
('Data Science Fundamentals', 'Learn the essential skills for data science and machine learning', true);

-- Add courses to Data Science Fundamentals learning path
INSERT INTO learning_path_courses (learning_path_id, course_id, sort_order)
SELECT 
    lp.id,
    c.id,
    1
FROM learning_paths lp, courses c, fields f
WHERE lp.name = 'Data Science Fundamentals' 
  AND c.title = 'Python for Data Science'
  AND f.name = 'Data Science'
  AND c.field_id = f.id;

INSERT INTO learning_path_courses (learning_path_id, course_id, sort_order)
SELECT 
    lp.id,
    c.id,
    2
FROM learning_paths lp, courses c, fields f
WHERE lp.name = 'Data Science Fundamentals' 
  AND c.title = 'Machine Learning Basics'
  AND f.name = 'Data Science'
  AND c.field_id = f.id;

-- Learning Path 3: Mobile App Development
INSERT INTO learning_paths (name, description, is_active) VALUES
('Mobile App Development', 'Complete path to build mobile applications for iOS and Android', true);

-- Add courses to Mobile App Development learning path
INSERT INTO learning_path_courses (learning_path_id, course_id, sort_order)
SELECT 
    lp.id,
    c.id,
    1
FROM learning_paths lp, courses c, fields f
WHERE lp.name = 'Mobile App Development' 
  AND c.title = 'React Native Development'
  AND f.name = 'Mobile Development'
  AND c.field_id = f.id;

INSERT INTO learning_path_courses (learning_path_id, course_id, sort_order)
SELECT 
    lp.id,
    c.id,
    2
FROM learning_paths lp, courses c, fields f
WHERE lp.name = 'Mobile App Development' 
  AND c.title = 'Flutter Fundamentals'
  AND f.name = 'Mobile Development'
  AND c.field_id = f.id;

-- Insert sample chat sessions
INSERT INTO chat_sessions (session_id, field_id, question_count) VALUES
('session_001', (SELECT id FROM fields WHERE name = 'Web Development'), 3),
('session_002', (SELECT id FROM fields WHERE name = 'Data Science'), 5),
('session_003', (SELECT id FROM fields WHERE name = 'Mobile Development'), 0);

-- Insert sample chat messages
INSERT INTO chat_messages (chat_session_id, role, content)
SELECT 
    cs.id,
    'user',
    'What is the best way to learn web development?'
FROM chat_sessions cs WHERE cs.session_id = 'session_001';

INSERT INTO chat_messages (chat_session_id, role, content)
SELECT 
    cs.id,
    'assistant',
    'I recommend starting with HTML & CSS fundamentals, then moving to JavaScript, and finally learning a framework like React. Would you like me to suggest a specific learning path?'
FROM chat_sessions cs WHERE cs.session_id = 'session_001';

INSERT INTO chat_messages (chat_session_id, role, content)
SELECT 
    cs.id,
    'user',
    'Yes, please show me the Full Stack Web Development path'
FROM chat_sessions cs WHERE cs.session_id = 'session_001';

INSERT INTO chat_messages (chat_session_id, role, content)
SELECT 
    cs.id,
    'assistant',
    'The Full Stack Web Development path includes: 1) HTML & CSS Fundamentals, 2) JavaScript Essentials, and 3) React Development. This will give you a solid foundation in modern web development.'
FROM chat_sessions cs WHERE cs.session_id = 'session_001';

INSERT INTO chat_messages (chat_session_id, role, content)
SELECT 
    cs.id,
    'user',
    'How long does it take to complete this path?'
FROM chat_sessions cs WHERE cs.session_id = 'session_001';

INSERT INTO chat_messages (chat_session_id, role, content)
SELECT 
    cs.id,
    'assistant',
    'Typically, the Full Stack Web Development path takes 3-6 months to complete if you study consistently. Each course builds upon the previous one, so it''s important to master each concept before moving forward.'
FROM chat_sessions cs WHERE cs.session_id = 'session_001';