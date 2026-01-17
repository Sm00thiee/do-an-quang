import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    BsCheckCircleFill,
    BsCircle,
    BsArrowLeft,
    BsDownload,
    BsExclamationCircle
} from "react-icons/bs";
import { toast } from "react-toastify";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import roadmapApi from "../../api/roadmap";
import { fetchAllGeneratedLearningPaths } from "../../services/api";
import { extractLessonIdFromTitle } from "../../services/courseContentService";
import "./Roadmap.css";
import RoadmapPDFViewer from "./RoadmapPDFViewer";
import LessonDetailDrawer from "./LessonDetailDrawer";
import { getLessonById } from "../../data/sampleLessons";

function RoadmapDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [expandedNodes, setExpandedNodes] = useState([]);
    const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false);
    const [isLessonDrawerOpen, setIsLessonDrawerOpen] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [roadmapData, setRoadmapData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [nodeStatuses, setNodeStatuses] = useState({});
    const [isDownloading, setIsDownloading] = useState(false);

    // Check if user is logged in
    useEffect(() => {
        const token = localStorage.getItem('candidate_jwt');
        setIsLoggedIn(!!token);
    }, []);

    // Load node statuses from localStorage
    useEffect(() => {
        if (id) {
            const savedStatuses = localStorage.getItem(`roadmap_statuses_${id}`);
            if (savedStatuses) {
                try {
                    setNodeStatuses(JSON.parse(savedStatuses));
                } catch (err) {
                    console.error('Error parsing saved statuses:', err);
                }
            }
        }
    }, [id]);

    // Save node statuses to localStorage whenever they change
    useEffect(() => {
        if (id && Object.keys(nodeStatuses).length > 0) {
            localStorage.setItem(`roadmap_statuses_${id}`, JSON.stringify(nodeStatuses));
            
            // Update progress percentage
            if (roadmapData?.nodes) {
                const totalNodes = roadmapData.nodes.length;
                const completedNodes = Object.values(nodeStatuses).filter(status => status === 'completed').length;
                const progress = Math.round((completedNodes / totalNodes) * 100);
                
                setRoadmapData(prev => ({
                    ...prev,
                    progress
                }));
            }
        }
    }, [nodeStatuses, id, roadmapData?.nodes?.length]);

    // Fetch roadmap data
    useEffect(() => {
        const fetchRoadmap = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // First, try to fetch from generated learning paths
                const generatedPathsResponse = await fetchAllGeneratedLearningPaths();
                
                if (generatedPathsResponse.data && generatedPathsResponse.data.length > 0) {
                    // Find the specific learning path by ID
                    const learningPath = generatedPathsResponse.data.find(path => path.id === id);
                    
                    if (learningPath) {
                        console.log('[RoadmapDetail] Found generated learning path:', learningPath);
                        const transformedData = transformGeneratedLearningPath(learningPath);
                        setRoadmapData(transformedData);
                        setLoading(false);
                        return;
                    }
                }
                
                // Fallback to regular roadmaps API
                const token = localStorage.getItem('candidate_jwt');

                // If demo roadmap or not logged in, use mock data
                if (id?.startsWith('demo-') || !token) {
                    setRoadmapData(getMockRoadmapData());
                    setLoading(false);
                    return;
                }

                const response = await roadmapApi.getRoadmapById(id);

                if (response.success && response.data) {
                    // Transform API data to component format
                    const transformedData = transformApiData(response.data);
                    setRoadmapData(transformedData);
                }
            } catch (err) {
                console.error('Error fetching roadmap:', err);
                setError('Không thể tải lộ trình. Vui lòng thử lại.');
                // Fallback to mock data
                setRoadmapData(getMockRoadmapData());
            } finally {
                setLoading(false);
            }
        };

        fetchRoadmap();
    }, [id]);

    // Transform API data to component format
    const transformApiData = (apiData) => {
        const sections = apiData.roadmap_sections || [];

        return {
            id: apiData.id,
            title: apiData.title,
            description: apiData.description,
            createdAt: new Date(apiData.created_at).toLocaleDateString('vi-VN'),
            progress: apiData.progress || 0,
            category: apiData.category,
            status: apiData.status,
            nodes: sections
                .sort((a, b) => a.order_index - b.order_index)
                .map((section, index) => {
                    const lessons = section.roadmap_lessons || [];
                    const completedLessons = lessons.filter(l => l.status === 'completed').length;

                    // Determine section status
                    let sectionStatus = 'pending';
                    if (completedLessons === lessons.length && lessons.length > 0) {
                        sectionStatus = 'completed';
                    } else if (completedLessons > 0) {
                        sectionStatus = 'in-progress';
                    }

                    return {
                        id: section.id,
                        title: section.title,
                        level: getLevelFromIndex(index),
                        duration: getDurationEstimate(lessons.length),
                        status: section.status || sectionStatus,
                        color: section.color,
                        skills: lessons.flatMap(lesson =>
                            (lesson.roadmap_skills || []).map(skill => skill.name)
                        ),
                        resources: lessons.flatMap(lesson =>
                            (lesson.roadmap_resources || []).map(resource => resource.title)
                        ),
                        lessons: lessons.map(lesson => ({
                            id: lesson.id,
                            title: lesson.title,
                            status: lesson.status,
                            content: lesson.content
                        }))
                    };
                })
        };
    };

    // Transform generated learning path to component format
    const transformGeneratedLearningPath = (learningPath) => {
        const learningPathData = learningPath.learning_path_data;
        
        console.log('[RoadmapDetail] Transforming learning path data:', learningPathData);
        
        if (!learningPathData || !learningPathData.categories) {
            console.log('[RoadmapDetail] No categories found, using mock data');
            return getMockRoadmapData();
        }

        const categories = learningPathData.categories || [];
        
        console.log('[RoadmapDetail] Found', categories.length, 'categories');
        
        const transformedData = {
            id: learningPath.id,
            title: learningPath.learning_path_name || learningPath.field_name || 'Lộ trình học tập',
            description: `Lộ trình học tập ${learningPath.field_name || ''}`,
            createdAt: new Date(learningPath.created_at).toLocaleDateString('vi-VN'),
            progress: 0,
            category: learningPath.field_name,
            status: 'not_started',
            nodes: categories.map((category, categoryIndex) => {
                const lessons = category.lessons || [];
                
                const nodeId = `category-${categoryIndex}`;
                
                return {
                    id: nodeId,
                    title: category.name || `Giai đoạn ${categoryIndex + 1}`,
                    level: getLevelFromIndex(categoryIndex),
                    duration: `${category.totalStudyTime || 0} giờ`,
                    status: 'pending',
                    skills: lessons.map(lesson => lesson.lessonTitle).slice(0, 4),
                    resources: lessons.map(lesson => lesson.lessonTitle),
                    lessons: lessons.map((lesson, lessonIndex) => ({
                        id: `${categoryIndex}-${lessonIndex}`,
                        title: lesson.lessonTitle || `Bài ${lessonIndex + 1}`,
                        url: lesson.lessonUrl,
                        hours: lesson.studyTime,
                        status: 'not_started'
                    }))
                };
            })
        };
        
        console.log('[RoadmapDetail] Transformed data:', transformedData);
        
        return transformedData;
    };

    // Helper functions
    const getLevelFromIndex = (index) => {
        const levels = ['Beginner', 'Beginner-Intermediate', 'Intermediate', 'Advanced', 'Senior'];
        return levels[Math.min(index, levels.length - 1)];
    };

    const getDurationEstimate = (lessonCount) => {
        if (lessonCount <= 2) return '1-2 tháng';
        if (lessonCount <= 4) return '2-3 tháng';
        if (lessonCount <= 6) return '3-4 tháng';
        return '4-6 tháng';
    };

    // Mock data for demo
    const getMockRoadmapData = () => ({
        id: 1,
        title: "Lộ trình Marketing Digital",
        description: "Lộ trình phát triển sự nghiệp từ Junior đến Senior Marketing",
        createdAt: "01/01/2026",
        progress: 30,
        nodes: [
            {
                id: "1",
                title: "Nền tảng Marketing Cơ bản",
                level: "Beginner",
                duration: "2-3 tháng",
                status: "completed",
                skills: [
                    "Marketing Mix (4P)",
                    "Consumer Behavior",
                    "Market Research",
                    "Brand Positioning",
                ],
                resources: [
                    "Khóa học Marketing Foundation",
                    "Sách Philip Kotler",
                ],
            },
            {
                id: "2",
                title: "Digital Marketing Fundamentals",
                level: "Beginner-Intermediate",
                duration: "3-4 tháng",
                status: "in-progress",
                skills: [
                    "SEO/SEM Basics",
                    "Google Analytics",
                    "Social Media Marketing",
                    "Email Marketing",
                ],
                resources: [
                    "Google Digital Garage",
                    "HubSpot Academy",
                ],
            },
            {
                id: "3",
                title: "Advanced Digital Marketing",
                level: "Intermediate",
                duration: "4-6 tháng",
                status: "pending",
                skills: [
                    "Google Ads Mastery",
                    "Facebook Ads",
                    "Content Strategy",
                    "Marketing Automation",
                ],
                resources: [
                    "Google Ads Certification",
                    "Facebook Blueprint",
                ],
            },
            {
                id: "4",
                title: "Data-Driven Marketing",
                level: "Advanced",
                duration: "3-4 tháng",
                status: "pending",
                skills: [
                    "Google Tag Manager",
                    "A/B Testing",
                    "Marketing Analytics",
                    "Customer Journey Mapping",
                ],
                resources: [
                    "Google Analytics Advanced",
                    "Data Analysis courses",
                ],
            },
            {
                id: "5",
                title: "Marketing Leadership",
                level: "Senior",
                duration: "6-12 tháng",
                status: "pending",
                skills: [
                    "Team Management",
                    "Budget Planning",
                    "Strategic Marketing",
                    "Growth Hacking",
                ],
                resources: [
                    "Leadership Training",
                    "Business Strategy courses",
                ],
            },
        ],
    });

    // Transform nodes to PDF sections format
    const getPdfData = () => {
        if (!roadmapData) return null;

        return {
            title: roadmapData.title,
            subtitle: roadmapData.description,
            createdDate: roadmapData.createdAt,
            sections: roadmapData.nodes.map(node => ({
                id: node.id,
                title: node.title,
                lessons: [
                    {
                        id: `${node.id}.1`,
                        title: `Kỹ năng cần đạt được - ${node.level}`,
                        content: [
                            {
                                heading: "Các kỹ năng chính",
                                description: `Thời gian học: ${node.duration}`,
                                items: node.skills.map(skill => ({
                                    title: skill,
                                    description: "Kỹ năng cần thiết cho giai đoạn này"
                                }))
                            },
                            {
                                heading: "Tài nguyên học tập",
                                description: "Các nguồn tài liệu được đề xuất:",
                                items: node.resources.map(resource => ({
                                    title: resource,
                                    description: "Tài liệu tham khảo chất lượng cao"
                                }))
                            }
                        ]
                    }
                ]
            }))
        };
    };

    const toggleNode = (nodeId) => {
        setExpandedNodes((prev) =>
            prev.includes(nodeId)
                ? prev.filter((id) => id !== nodeId)
                : [...prev, nodeId]
        );
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
                return <BsCheckCircleFill className="status-icon completed" />;
            case "in-progress":
                return <BsCheckCircleFill className="status-icon in-progress" />;
            default:
                return <BsCircle className="status-icon pending" />;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "completed":
                return "Hoàn thành";
            case "in-progress":
                return "Đang học";
            default:
                return "Chưa bắt đầu";
        }
    };

    /**
     * Convert Google Drive URL to direct download URL
     */
    const convertGoogleDriveUrl = (url) => {
        try {
            const match = url.match(/\/d\/([^/]+)/);
            if (match && match[1]) {
                const fileId = match[1];
                return `https://drive.google.com/uc?export=download&id=${fileId}`;
            }
            return url;
        } catch (error) {
            console.error('Error converting Google Drive URL:', error);
            return url;
        }
    };

    const handleDownloadPDF = async () => {
        if (isDownloading) return;
        
        try {
            setIsDownloading(true);
            toast.info("Đang chuẩn bị tải xuống...");
            
            // Create a new JSZip instance
            const zip = new JSZip();
            
            // Create a folder for the roadmap
            const roadmapFolder = zip.folder(roadmapData?.title || "Roadmap_Lessons");
            
            // Collect all PDF URLs from the roadmap
            const pdfUrls = [];
            
            if (roadmapData && roadmapData.nodes) {
                roadmapData.nodes.forEach((node, index) => {
                    if (node.resources) {
                        node.resources.forEach((resource, resourceIndex) => {
                            // For now, create entries for each resource
                            // In future, if resources have URLs, use them
                            pdfUrls.push({
                                url: null, // Resources don't have URLs yet in this structure
                                filename: `${index + 1}-${resourceIndex + 1}_${resource}.txt`,
                                title: resource,
                                nodeTitle: node.title
                            });
                        });
                    }
                });
            }
            
            if (pdfUrls.length === 0) {
                setIsDownloading(false);
                toast.warning("Không tìm thấy tài liệu nào trong lộ trình này.");
                return;
            }
            
            console.log(`Found ${pdfUrls.length} resources to download`);
            
            // Process each resource
            for (let i = 0; i < pdfUrls.length; i++) {
                const pdfInfo = pdfUrls[i];
                
                try {
                    if (pdfInfo.url) {
                        const downloadUrl = convertGoogleDriveUrl(pdfInfo.url);
                        const linkContent = `Tên tài liệu: ${pdfInfo.title}\n\nNode: ${pdfInfo.nodeTitle}\n\nLink tải trực tiếp:\n${downloadUrl}\n\nLink xem:\n${pdfInfo.url}\n\nLưu ý: Vui lòng nhấp vào link trên để tải file PDF.`;
                        roadmapFolder.file(pdfInfo.filename, linkContent);
                    } else {
                        // Create placeholder for resources without URLs
                        const content = `Tài nguyên: ${pdfInfo.title}\n\nNode: ${pdfInfo.nodeTitle}\n\nNội dung này chưa có link tải xuống.\nVui lòng tìm kiếm "${pdfInfo.title}" trên Google để tìm tài liệu liên quan.`;
                        roadmapFolder.file(pdfInfo.filename, content);
                    }
                } catch (error) {
                    console.error(`Failed to process ${pdfInfo.filename}:`, error);
                }
            }
            
            // Add a README file
            const readmeContent = `# ${roadmapData?.title || 'Roadmap'} - Tài liệu học tập\n\n` +
                `Tổng số tài nguyên: ${pdfUrls.length}\n\n` +
                `## Hướng dẫn:\n` +
                `Các file trong thư mục này chứa thông tin về tài nguyên học tập.\n` +
                `Vui lòng mở từng file để xem chi tiết và link tải xuống (nếu có).\n\n` +
                `## Danh sách tài nguyên:\n` +
                roadmapData.nodes.map((node, idx) => 
                    `${idx + 1}. ${node.title}\n   - ${node.resources.join('\n   - ')}\n`
                ).join('\n');
            
            roadmapFolder.file("README.txt", readmeContent);
            
            // Generate the ZIP file
            toast.info("Đang nén file...");
            const zipBlob = await zip.generateAsync({ 
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: { level: 6 }
            });
            
            // Save the ZIP file
            const filename = `${roadmapData?.title || 'Roadmap'}_Lessons.zip`;
            saveAs(zipBlob, filename);
            
            setIsDownloading(false);
            toast.success(`Đã tải xuống file ZIP với ${pdfUrls.length} tài nguyên!`);
        } catch (error) {
            console.error("Error creating ZIP file:", error);
            setIsDownloading(false);
            toast.error("Có lỗi xảy ra khi tạo file ZIP. Vui lòng thử lại.");
        }
    };

    const handleViewPDF = () => {
        setIsPDFViewerOpen(true);
    };

    const handleClosePDF = () => {
        setIsPDFViewerOpen(false);
    };

    const handleOpenLessonDrawer = (lessonKeyOrTitle) => {
        // Try to get lesson from sampleLessons first (for backwards compatibility)
        let lesson = getLessonById(lessonKeyOrTitle);
        
        // If not found in sampleLessons, create a basic lesson object
        if (!lesson) {
            // If lessonKeyOrTitle looks like a lesson key (e.g., "uiux-1"), use it as ID
            // Otherwise, treat it as a title and extract the ID
            let lessonId = lessonKeyOrTitle;
            let lessonTitle = lessonKeyOrTitle;
            
            // Check if it looks like a lesson key pattern (field-number)
            if (/^[a-z]+-\d+$/.test(lessonKeyOrTitle)) {
                lessonId = lessonKeyOrTitle;
                lessonTitle = lessonKeyOrTitle; // Will be replaced by fetched metadata
            } else {
                // It's a title, try to extract lesson ID from it
                lessonTitle = lessonKeyOrTitle;
                lessonId = lessonKeyOrTitle; // Let the drawer extract the proper ID
            }
            
            lesson = {
                id: lessonId,
                title: lessonTitle
            };
            
            console.log(`[RoadmapDetail] Created basic lesson object:`, lesson);
        }
        
        setSelectedLesson(lesson);
        setIsLessonDrawerOpen(true);
    };

    const handleCloseLessonDrawer = () => {
        setIsLessonDrawerOpen(false);
        setSelectedLesson(null);
    };

    const handleStartLearning = async (nodeId) => {
        try {
            // Update node status to in-progress
            setNodeStatuses(prev => ({
                ...prev,
                [nodeId]: 'in-progress'
            }));

            // Update roadmap data
            setRoadmapData(prev => ({
                ...prev,
                nodes: prev.nodes.map(n =>
                    n.id === nodeId
                        ? { ...n, status: 'in-progress' }
                        : n
                )
            }));

            toast.success('Đã bắt đầu học!');

            // If logged in and this is a real roadmap (not generated), update on server
            if (isLoggedIn && roadmapData?.nodes?.find(n => n.id === nodeId)?.lessons?.[0]?.id) {
                const node = roadmapData.nodes.find(n => n.id === nodeId);
                if (node?.lessons?.[0]) {
                    await roadmapApi.updateLessonStatus(node.lessons[0].id, 'in-progress');
                }
            }
        } catch (err) {
            console.error('Error starting learning:', err);
            toast.error('Không thể cập nhật. Vui lòng thử lại.');
        }
    };

    const handleMarkComplete = async (nodeId) => {
        try {
            // Update node status to completed
            setNodeStatuses(prev => ({
                ...prev,
                [nodeId]: 'completed'
            }));

            // Update roadmap data
            setRoadmapData(prev => ({
                ...prev,
                nodes: prev.nodes.map(n =>
                    n.id === nodeId
                        ? { ...n, status: 'completed' }
                        : n
                )
            }));

            toast.success('Đã đánh dấu hoàn thành!');

            // If logged in and this is a real roadmap (not generated), update on server
            if (isLoggedIn && roadmapData?.nodes?.find(n => n.id === nodeId)?.lessons?.[0]?.id) {
                const node = roadmapData.nodes.find(n => n.id === nodeId);
                if (node?.lessons?.[0]) {
                    await roadmapApi.updateLessonStatus(node.lessons[0].id, 'completed');
                }
            }
        } catch (err) {
            console.error('Error marking complete:', err);
            toast.error('Không thể cập nhật. Vui lòng thử lại.');
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="roadmap-detail-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Đang tải lộ trình...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !roadmapData) {
        return (
            <div className="roadmap-detail-container">
                <div className="error-state">
                    <BsExclamationCircle size={48} />
                    <h3>Không thể tải lộ trình</h3>
                    <p>{error}</p>
                    <button onClick={() => navigate('/roadmap')}>Quay lại danh sách</button>
                </div>
            </div>
        );
    }

    if (!roadmapData) return null;

    return (
        <div className="roadmap-detail-container">
            {/* Header */}
            <div className="roadmap-detail-header">
                <button className="back-btn" onClick={() => navigate("/roadmap")}>
                    <BsArrowLeft size={20} />
                    <span>Quay lại</span>
                </button>
                <div className="header-content">
                    <h1 className="roadmap-title">{roadmapData.title}</h1>
                    <p className="roadmap-description">{roadmapData.description}</p>
                    <div className="roadmap-meta">
                        <span className="meta-item">
                            📅 Tạo ngày: {roadmapData.createdAt}
                        </span>
                        <span className="meta-item">
                            📊 Tiến độ: {roadmapData.progress}%
                        </span>
                    </div>
                </div>
                <div className="header-actions">
                    <button 
                        className="export-btn" 
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                        style={{ opacity: isDownloading ? 0.6 : 1 }}
                    >
                        <BsDownload size={18} />
                        <span>{isDownloading ? 'Đang tải...' : 'Download PDF'}</span>
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="roadmap-progress-bar">
                <div className="progress-track">
                    <div
                        className="progress-fill"
                        style={{ width: `${roadmapData.progress}%` }}
                    />
                </div>
                <span className="progress-label">{roadmapData.progress}% hoàn thành</span>
            </div>

            {/* Roadmap Timeline */}
            <div className="roadmap-timeline">
                {roadmapData.nodes.map((node, index) => (
                    <div key={node.id} className="timeline-node-wrapper">
                        {/* Connecting Line */}
                        {index < roadmapData.nodes.length - 1 && (
                            <div className="timeline-connector" />
                        )}

                        {/* Node Card */}
                        <div
                            className={`timeline-node ${nodeStatuses[node.id] || node.status} ${expandedNodes.includes(node.id) ? "expanded" : ""
                                }`}
                            onClick={() => toggleNode(node.id)}
                        >
                            <div className="node-header">
                                <div className="node-status-indicator">
                                    {getStatusIcon(nodeStatuses[node.id] || node.status)}
                                </div>
                                <div className="node-main-info">
                                    <h3 className="node-title">{node.title}</h3>
                                    <div className="node-badges">
                                        <span className="badge badge-level">{node.level}</span>
                                        <span className="badge badge-duration">⏱ {node.duration}</span>
                                        <span className={`badge badge-status ${nodeStatuses[node.id] || node.status}`}>
                                            {getStatusLabel(nodeStatuses[node.id] || node.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedNodes.includes(node.id) && (
                                <div className="node-expanded-content">
                                    <div className="node-section">
                                        <h4 className="section-title">Kỹ năng cần đạt được:</h4>
                                        <ul className="skills-list">
                                            {node.skills.map((skill, idx) => (
                                                <li key={idx} className="skill-item">
                                                    <span className="skill-bullet">✓</span>
                                                    {skill}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="node-section">
                                        <h4 className="section-title">Tài nguyên học tập:</h4>
                                        <ul className="resources-list">
                                            {node.resources.map((resource, idx) => (
                                                <li 
                                                    key={idx} 
                                                    className="resource-item clickable"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Extract lesson ID from the resource title using the service function
                                                        // This will handle titles like "BÀI 1. UI/UX DESIGN LÀ GÌ?" correctly
                                                        const lessonId = extractLessonIdFromTitle(resource);
                                                        if (lessonId) {
                                                            console.log(`[RoadmapDetail] Opening lesson: ${lessonId} from resource: ${resource}`);
                                                            handleOpenLessonDrawer(lessonId);
                                                        } else {
                                                            console.warn(`[RoadmapDetail] Could not extract lesson ID from: ${resource}`);
                                                            // Fallback: pass the title directly
                                                            handleOpenLessonDrawer(resource);
                                                        }
                                                    }}
                                                >
                                                    <span className="resource-icon">📚</span>
                                                    {resource}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="node-actions">
                                        {(nodeStatuses[node.id] !== 'completed' && nodeStatuses[node.id] !== 'in-progress') && (
                                            <button 
                                                className="btn-primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStartLearning(node.id);
                                                }}
                                            >
                                                Bắt đầu học
                                            </button>
                                        )}
                                        {nodeStatuses[node.id] !== 'completed' && (
                                            <button
                                                className="btn-secondary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkComplete(node.id);
                                                }}
                                            >
                                                Đánh dấu hoàn thành
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* PDF Viewer Modal */}
            <RoadmapPDFViewer
                isOpen={isPDFViewerOpen}
                onClose={handleClosePDF}
                roadmapData={getPdfData()}
            />

            {/* Lesson Detail Drawer */}
            <LessonDetailDrawer
                isOpen={isLessonDrawerOpen}
                onClose={handleCloseLessonDrawer}
                lesson={selectedLesson}
                roadmapData={roadmapData}
            />
        </div>
    );
}

export default RoadmapDetail;
