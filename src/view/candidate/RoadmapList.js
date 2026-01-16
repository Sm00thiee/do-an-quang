import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    BsPlus,
    BsArrowRight,
    BsBook,
    BsLightbulb,
    BsBriefcase,
    BsPalette,
    BsGraphUp,
    BsTools,
    BsTrash,
    BsPencil,
    BsExclamationCircle
} from "react-icons/bs";
import { toast } from "react-toastify";
import roadmapApi from "../../api/roadmap";
import { fetchAllGeneratedLearningPaths } from "../../services/api";
import "./RoadmapList.css";
import { useCandidateAuthStore } from "../../stores/candidateAuthStore";

// Category Icons mapping
const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
        case 'marketing':
            return <BsGraphUp />;
        case 'design':
        case 'uiux':
        case 'graphic':
            return <BsPalette />;
        case 'it':
        case 'technology':
            return <BsTools />;
        default:
            return <BsBook />;
    }
};

// Category Colors mapping
const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
        case 'marketing':
            return '#0066FF';
        case 'design':
        case 'uiux':
            return '#8B5CF6';
        case 'graphic':
            return '#EC4899';
        case 'it':
        case 'technology':
            return '#10B981';
        default:
            return '#0066FF';
    }
};

function RoadmapList() {
    const navigate = useNavigate();
    const [roadmaps, setRoadmaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Auth state linking
    const isAuth = useCandidateAuthStore(state => state.isAuth);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('candidate_jwt');
        setIsLoggedIn(!!token || isAuth);
    }, [isAuth]);

    // Fetch roadmaps from API
    useEffect(() => {
        const fetchRoadmaps = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // First, try to fetch generated learning paths from chat
                const generatedPathsResponse = await fetchAllGeneratedLearningPaths();
                
                if (generatedPathsResponse.data && generatedPathsResponse.data.length > 0) {
                    console.log('[RoadmapList] Loaded generated learning paths:', generatedPathsResponse.data.length);
                    
                    // Transform generated learning paths to roadmap format
                    const transformedPaths = generatedPathsResponse.data.map(path => ({
                        id: path.id,
                        title: path.learning_path_name || path.field_name || 'Lộ trình học tập',
                        description: `Lộ trình học tập ${path.field_name || ''}`,
                        category: path.field_name || 'Learning',
                        progress: 0,
                        status: 'not_started',
                        icon: getCategoryIcon(path.field_name),
                        color: getCategoryColor(path.field_name),
                        columns: transformLearningPathDataToColumns(path.learning_path_data),
                        createdAt: path.created_at,
                        isGenerated: true
                    }));
                    
                    setRoadmaps(transformedPaths);
                    setLoading(false);
                    return;
                }
                
                // Check if user is logged in for regular roadmaps
                const token = localStorage.getItem('candidate_jwt');

                if (!token) {
                    // Use mock data for non-logged-in users
                    setRoadmaps(getMockRoadmaps());
                    setLoading(false);
                    return;
                }

                // Fallback to regular roadmaps API
                const response = await roadmapApi.getRoadmaps();

                if (response.success && response.data) {
                    // Transform API data to component format
                    const transformedData = response.data.map(roadmap => ({
                        id: roadmap.id,
                        title: roadmap.title,
                        description: roadmap.description,
                        category: roadmap.category,
                        progress: roadmap.progress || 0,
                        status: roadmap.status,
                        icon: getCategoryIcon(roadmap.category),
                        color: getCategoryColor(roadmap.category),
                        columns: transformSectionsToColumns(roadmap.roadmap_sections || []),
                        createdAt: roadmap.created_at
                    }));
                    setRoadmaps(transformedData);
                }
            } catch (err) {
                console.error('Error fetching roadmaps:', err);
                setError('Không thể tải danh sách lộ trình. Vui lòng thử lại.');
                // Fallback to mock data on error
                setRoadmaps(getMockRoadmaps());
            } finally {
                setLoading(false);
            }
        };

        fetchRoadmaps();
    }, []);

    // Transform API sections to columns format for UI
    const transformSectionsToColumns = (sections) => {
        return sections
            .sort((a, b) => a.order_index - b.order_index)
            .map((section, index) => ({
                id: String(index + 1),
                title: section.title,
                color: section.color || '#0066FF',
                icon: <BsBook />,
                items: (section.roadmap_lessons || [])
                    .sort((a, b) => a.order_index - b.order_index)
                    .map(lesson => ({
                        id: lesson.id,
                        text: lesson.title,
                        status: lesson.status
                    }))
            }));
    };

    // Transform generated learning path data to columns format for UI
    const transformLearningPathDataToColumns = (learningPathData) => {
        if (!learningPathData || !learningPathData.phases) {
            return [];
        }

        return learningPathData.phases.map((phase, phaseIndex) => ({
            id: String(phaseIndex + 1),
            title: phase.name || `Giai đoạn ${phaseIndex + 1}`,
            color: getCategoryColor(learningPathData.name),
            icon: <BsBook />,
            items: (phase.courses || []).map((course, courseIndex) => ({
                id: `${phaseIndex}-${courseIndex}`,
                text: course.name || course.title || `Bài ${courseIndex + 1}`,
                url: course.url,
                hours: course.hours,
                status: 'not_started'
            }))
        }));
    };

    // Mock data for demo/non-logged-in users
    const getMockRoadmaps = () => [
        {
            id: "demo-uiux",
            title: "UI/UX Design",
            description: "Lộ trình chi tiết trở thành UI/UX Designer chuyên nghiệp",
            icon: <BsPalette />,
            color: "#8B5CF6",
            progress: 0,
            columns: [
                {
                    id: "1",
                    title: "Nền tảng Design",
                    color: "#8B5CF6",
                    items: [
                        { text: "Design Principles" },
                        { text: "Color Theory" },
                        { text: "Typography" },
                        { text: "Layout & Grid" }
                    ]
                },
                {
                    id: "2",
                    title: "UX Research & Strategy",
                    color: "#8B5CF6",
                    items: [
                        { text: "User Research" },
                        { text: "Persona & Journey" },
                        { text: "Information Architecture" },
                        { text: "Wireframing" }
                    ]
                }
            ]
        },
        {
            id: "demo-marketing",
            title: "Chuyên viên Marketing",
            description: "Lộ trình phát triển sự nghiệp Marketing từ cơ bản đến chuyên sâu",
            icon: <BsGraphUp />,
            color: "#0066FF",
            progress: 30,
            columns: [
                {
                    id: "1",
                    title: "Nền tảng kiến thức Marketing",
                    icon: <BsBook />,
                    color: "#0066FF",
                    items: [
                        { id: "1.1", text: "Marketing căn bản & Marketing Mix (4P)" },
                        { id: "1.2", text: "Consumer Behavior & Insight" },
                        { id: "1.3", text: "Market Research" },
                        { id: "1.4", text: "Brand Positioning & Strategy" }
                    ]
                },
                {
                    id: "2",
                    title: "Kỹ năng & công cụ Digital Marketing",
                    icon: <BsTools />,
                    color: "#0066FF",
                    items: [
                        { id: "2.1", text: "SEO/SEM & Google Ads" },
                        { id: "2.2", text: "Social Media Marketing" },
                        { id: "2.3", text: "Content Marketing & Copywriting" },
                        { id: "2.4", text: "Email Marketing & Automation" }
                    ]
                },
                {
                    id: "3",
                    title: "Thiết kế & Công cụ bổ trợ",
                    icon: <BsLightbulb />,
                    color: "#10B981",
                    items: [
                        { id: "3.1", text: "Canva & Design Tools" },
                        { id: "3.2", text: "Video Marketing básico" }
                    ]
                },
                {
                    id: "4",
                    title: "Thực hành chiến dịch Marketing",
                    icon: <BsBriefcase />,
                    color: "#F59E0B",
                    items: [
                        { id: "4.1", text: "Campaign Planning & Execution" },
                        { id: "4.2", text: "Analytics & KPI Measurement" }
                    ]
                }
            ],
            finalStep: {
                title: "Xây dựng Portfolio & Kinh nghiệm thực tế",
                items: [
                    "Thực tập tại doanh nghiệp",
                    "Dự án cá nhân / Freelance",
                    "Xây dựng Personal Branding"
                ]
            }
        }
    ];

    const handleDeleteRoadmap = async (e, roadmapId) => {
        e.stopPropagation();

        if (!window.confirm('Bạn có chắc muốn xóa lộ trình này?')) {
            return;
        }

        try {
            await roadmapApi.deleteRoadmap(roadmapId);
            setRoadmaps(prev => prev.filter(r => r.id !== roadmapId));
            toast.success('Xóa lộ trình thành công');
        } catch (err) {
            console.error('Error deleting roadmap:', err);
            toast.error('Không thể xóa lộ trình. Vui lòng thử lại.');
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="roadmap-list-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Đang tải danh sách lộ trình...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="roadmap-list-container">
            {/* Header Section */}
            <div className="roadmap-list-header">
                <div className="header-left">
                    <h1 className="page-title">Danh sách lộ trình đã tạo</h1>
                    <p className="page-subtitle">Quản lý và theo dõi các lộ trình học tập của bạn</p>
                </div>
                <button
                    className="create-roadmap-btn"
                    onClick={() => navigate("/")}
                >
                    <BsPlus size={20} />
                    <span>Tạo lộ trình mới</span>
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-message">
                    <BsExclamationCircle />
                    <span>{error}</span>
                </div>
            )}

            {/* Login Prompt for non-logged-in users */}
            {!isLoggedIn && (
                <div className="login-prompt">
                    <BsExclamationCircle />
                    <span>Đăng nhập để lưu và quản lý lộ trình của bạn</span>
                    <button onClick={() => navigate('/login')}>Đăng nhập</button>
                </div>
            )}

            {/* Empty State */}
            {roadmaps.length === 0 && !loading && (
                <div className="empty-state">
                    <BsBook className="empty-icon" />
                    <h3>Chưa có lộ trình nào</h3>
                    <p>Bắt đầu tạo lộ trình học tập đầu tiên của bạn</p>
                    <button
                        className="create-roadmap-btn"
                        onClick={() => navigate("/")}
                    >
                        <BsPlus size={20} />
                        <span>Tạo lộ trình mới</span>
                    </button>
                </div>
            )}

            {/* Roadmap Cards */}
            <div className="roadmap-cards">
                {roadmaps.map((roadmap) => (
                    <div
                        key={roadmap.id}
                        className="roadmap-card"
                    >
                        {/* Card Header */}
                        <div className="roadmap-card-header">
                            <div className="roadmap-info">
                                <div
                                    className="roadmap-icon"
                                    style={{ backgroundColor: `${roadmap.color}15`, color: roadmap.color }}
                                >
                                    {roadmap.icon}
                                </div>
                                <div className="roadmap-text">
                                    <h3 className="roadmap-title">{roadmap.title}</h3>
                                    <p className="roadmap-desc">{roadmap.description}</p>
                                    {roadmap.progress > 0 && (
                                        <div className="roadmap-progress-mini">
                                            <div className="progress-bar-mini">
                                                <div
                                                    className="progress-fill-mini"
                                                    style={{
                                                        width: `${roadmap.progress}%`,
                                                        backgroundColor: roadmap.color
                                                    }}
                                                />
                                            </div>
                                            <span className="progress-text-mini">{roadmap.progress}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="card-header-actions">
                                {isLoggedIn && !roadmap.id.startsWith('demo-') && (
                                    <>
                                        <button
                                            className="card-action-btn edit"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/roadmap/${roadmap.id}/edit`);
                                            }}
                                            title="Chỉnh sửa"
                                        >
                                            <BsPencil />
                                        </button>
                                        <button
                                            className="card-action-btn delete"
                                            onClick={(e) => handleDeleteRoadmap(e, roadmap.id)}
                                            title="Xóa"
                                        >
                                            <BsTrash />
                                        </button>
                                    </>
                                )}
                                <button
                                    className="expand-detail-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/roadmap/${roadmap.id}`);
                                    }}
                                >
                                    Xem chi tiết lộ trình
                                    <BsArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RoadmapList;
