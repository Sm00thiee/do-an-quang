-- Sample Data Migration
-- Initialize database with sample fields and learning paths

-- Insert sample fields of study
INSERT INTO fields (id, name, description) VALUES
    ('91ebc1d8-4ca0-4704-9d13-8600afa1293a', 'Web Development', 'Learn to build modern websites and web applications using HTML, CSS, JavaScript, and popular frameworks'),
    ('fb9f8ce3-e7e0-4be2-bfab-0d6c158be661', 'Cloud Computing', 'Master cloud platforms like AWS, Azure, and Google Cloud for scalable infrastructure'),
    ('a7f3c2d1-5b9e-4a2c-8d6f-1e4a9b7c3f5d', 'Data Science', 'Analyze data, build machine learning models, and extract insights from complex datasets'),
    ('b8e4d3f2-6c0a-5b3d-9e7f-2f5b0c8d4a6e', 'Artificial Intelligence', 'Explore AI, deep learning, neural networks, and natural language processing'),
    ('c9f5e4a3-7d1b-6c4e-0f8f-3a6c1d9e5f7f', 'Cybersecurity', 'Protect systems, networks, and data from digital attacks and security threats'),
    ('d0a6f5b4-8e2c-7d5f-1a9f-4b7d2e0f6f8a', 'Mobile Development', 'Build native and cross-platform mobile apps for iOS and Android'),
    ('e1b7a6c5-9f3d-8e6a-2b0f-5c8e3f1a7f9b', 'DevOps', 'Streamline software development with CI/CD, automation, and infrastructure as code'),
    ('f2c8b7d6-0a4e-9f7b-3c1f-6d9f4a2b8f0c', 'UI/UX Design', 'Create intuitive and beautiful user interfaces and experiences');

-- Insert sample learning paths
INSERT INTO learning_paths (id, name, description) VALUES
    ('a1b2c3d4-e5f6-4a5b-8c9d-1e2f3a4b5c6d', 'Full Stack Web Developer', 'Comprehensive path to become a professional full-stack web developer, covering frontend, backend, and deployment'),
    ('b2c3d4e5-f6a7-5b6c-9d0e-2f3a4b5c6d7e', 'AWS Cloud Architect', 'Learn to design and deploy scalable, secure cloud infrastructure on Amazon Web Services'),
    ('c3d4e5f6-a7b8-6c7d-0e1f-3a4b5c6d7e8f', 'Data Science with Python', 'Master data analysis, visualization, and machine learning using Python and popular libraries'),
    ('d4e5f6a7-b8c9-7d8e-1f2a-4b5c6d7e8f9a', 'AI & Deep Learning Engineer', 'Deep dive into artificial intelligence, neural networks, and modern deep learning frameworks'),
    ('e5f6a7b8-c9d0-8e9f-2a3b-5c6d7e8f9a0b', 'React Native Mobile Developer', 'Build cross-platform mobile applications using React Native for iOS and Android'),
    ('f6a7b8c9-d0e1-9f0a-3b4c-6d7e8f9a0b1c', 'Ethical Hacker & Security Analyst', 'Learn penetration testing, security auditing, and how to protect systems from cyber threats'),
    ('a7b8c9d0-e1f2-0a1b-4c5d-7e8f9a0b1c2d', 'DevOps Engineer Track', 'Master CI/CD pipelines, containerization, orchestration, and infrastructure automation'),
    ('b8c9d0e1-f2a3-1b2c-5d6e-8f9a0b1c2d3e', 'UI/UX Designer Professional', 'Master user interface and experience design from research to high-fidelity prototypes');

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Sample data initialized: 8 fields and 8 learning paths added';
END $$;
