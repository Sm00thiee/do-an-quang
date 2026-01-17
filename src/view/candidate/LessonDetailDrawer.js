import React, { useState, useEffect } from "react";
import { BsX } from "react-icons/bs";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import { fetchLessonMarkdown, fetchLessonMetadata, getLessonFileName, extractLessonIdFromTitle } from "../../services/courseContentService";
import "./LessonDetailDrawer.css";

/**
 * LessonDetailDrawer Component
 * Displays lesson details in a right-side drawer with:
 * - Title and description
 * - Markdown content from Supabase storage
 * - YouTube video embed
 * - Related resources with chips (Article, Course, Official Web)
 * - Download PDF button (downloads all roadmap lessons as ZIP)
 */
function LessonDetailDrawer({ isOpen, onClose, lesson, roadmapData }) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState("");
    const [markdownContent, setMarkdownContent] = useState(null);
    const [lessonMetadata, setLessonMetadata] = useState(null);
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [contentError, setContentError] = useState(null);
    
    // Fetch lesson metadata and markdown content when lesson changes
    useEffect(() => {
        const loadLessonContent = async () => {
            if (!lesson) {
                setMarkdownContent(null);
                setLessonMetadata(null);
                return;
            }

            // Get lesson ID - either from lesson object or extract from title
            let lessonId = lesson.id;
            if (!lessonId && lesson.title) {
                lessonId = extractLessonIdFromTitle(lesson.title);
                console.log(`[LessonDrawer] Extracted lesson ID from title: ${lessonId}`);
            }

            if (!lessonId) {
                console.warn(`[LessonDrawer] Could not determine lesson ID for: ${lesson.title}`);
                setMarkdownContent(null);
                setLessonMetadata(null);
                return;
            }

            setIsLoadingContent(true);
            setContentError(null);

            try {
                // Fetch lesson metadata from database (includes title, YouTube URL, PDF URL, etc.)
                const metadata = await fetchLessonMetadata(lessonId);
                setLessonMetadata(metadata);
                console.log(`[LessonDrawer] Lesson metadata:`, metadata);

                // Get markdown file name - from metadata or fallback to mapping
                const fileName = metadata?.markdown_file || getLessonFileName(lessonId);
                
                if (!fileName) {
                    console.warn(`[LessonDrawer] No markdown file mapping for lesson: ${lessonId}`);
                    setMarkdownContent(null);
                    setIsLoadingContent(false);
                    return;
                }

                console.log(`[LessonDrawer] Loading markdown for lesson: ${lessonId}`);
                const content = await fetchLessonMarkdown(fileName);
                setMarkdownContent(content);
            } catch (error) {
                console.error(`[LessonDrawer] Error loading lesson content:`, error);
                setContentError(error.message);
            } finally {
                setIsLoadingContent(false);
            }
        };

        if (isOpen) {
            loadLessonContent();
        }
    }, [lesson, lesson?.id, lesson?.title, isOpen]);
    
    if (!isOpen || !lesson) return null;

    /**
     * Convert Google Drive URL to direct download URL
     * From: https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
     * To: https://drive.google.com/uc?export=download&id=FILE_ID
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
            setDownloadProgress("Đang chuẩn bị...");
            console.log("Preparing to download PDFs as ZIP...");
            
            // Create a new JSZip instance
            const zip = new JSZip();
            
            // Create a folder for the roadmap
            const roadmapFolder = zip.folder(roadmapData?.title || "Roadmap_Lessons");
            
            // Collect all PDF URLs from the roadmap
            const pdfUrls = [];
            
            if (roadmapData && roadmapData.nodes) {
                roadmapData.nodes.forEach((node, index) => {
                    if (node.lessons) {
                        node.lessons.forEach((lessonItem, lessonIndex) => {
                            if (lessonItem.url) {
                                pdfUrls.push({
                                    url: lessonItem.url,
                                    filename: `${index + 1}-${lessonIndex + 1}_${lessonItem.title}.pdf`
                                });
                            }
                        });
                    }
                });
            }
            
            // Also check for phases structure (generated learning paths)
            if (roadmapData && roadmapData.phases) {
                roadmapData.phases.forEach((phase, phaseIndex) => {
                    if (phase.courses) {
                        phase.courses.forEach((course, courseIndex) => {
                            if (course.link) {
                                pdfUrls.push({
                                    url: course.link,
                                    filename: `${phaseIndex + 1}-${courseIndex + 1}_${course.title}.pdf`
                                });
                            }
                        });
                    }
                });
            }
            
            if (pdfUrls.length === 0) {
                setIsDownloading(false);
                setDownloadProgress("");
                alert("Không tìm thấy file PDF nào trong lộ trình này.");
                return;
            }
            
            console.log(`Found ${pdfUrls.length} PDFs to download`);
            setDownloadProgress(`Đã tìm thấy ${pdfUrls.length} bài học...`);
            
            // Download each PDF and add to ZIP
            let successCount = 0;
            let failCount = 0;
            
            for (let i = 0; i < pdfUrls.length; i++) {
                const pdfInfo = pdfUrls[i];
                setDownloadProgress(`Đang xử lý ${i + 1}/${pdfUrls.length}: ${pdfInfo.filename}`);
                
                try {
                    console.log(`Processing: ${pdfInfo.filename}`);
                    const downloadUrl = convertGoogleDriveUrl(pdfInfo.url);
                    
                    // Fetch the PDF file
                    const response = await fetch(downloadUrl, {
                        mode: 'no-cors' // This will limit what we can do but allows cross-origin requests
                    });
                    
                    // Due to CORS restrictions, we'll create a text file with the link instead
                    // In a production environment, you'd need a backend proxy to download these files
                    const linkContent = `Tên bài học: ${pdfInfo.filename}\n\nLink tải trực tiếp:\n${downloadUrl}\n\nLink xem:\n${pdfInfo.url}\n\nLưu ý: Vui lòng nhấp vào link trên để tải file PDF.`;
                    
                    roadmapFolder.file(
                        pdfInfo.filename.replace('.pdf', '.txt'),
                        linkContent
                    );
                    
                    successCount++;
                } catch (error) {
                    console.error(`Failed to process ${pdfInfo.filename}:`, error);
                    failCount++;
                    
                    // Add error info file
                    const errorContent = `Lỗi khi tải: ${pdfInfo.filename}\n\nLink gốc:\n${pdfInfo.url}\n\nVui lòng tải thủ công từ link trên.`;
                    roadmapFolder.file(
                        pdfInfo.filename.replace('.pdf', '_ERROR.txt'),
                        errorContent
                    );
                }
            }
            
            setDownloadProgress("Đang tạo file README...");
            
            // Add a README file with instructions
            const readmeContent = `# ${roadmapData?.title || 'Roadmap'} - Tài liệu học tập\n\n` +
                `Tổng số bài học: ${pdfUrls.length}\n` +
                `Tải thành công: ${successCount}\n` +
                `Lỗi: ${failCount}\n\n` +
                `## Hướng dẫn:\n` +
                `Do hạn chế của trình duyệt với Google Drive, các file được lưu dưới dạng link.\n` +
                `Vui lòng mở các file .txt và nhấp vào link để tải PDF.\n\n` +
                `## Hoặc tải nhanh tất cả:\n` +
                pdfUrls.map((pdf, idx) => `${idx + 1}. ${pdf.filename}\n   ${convertGoogleDriveUrl(pdf.url)}\n`).join('\n');
            
            roadmapFolder.file("README.txt", readmeContent);
            
            // Generate the ZIP file
            setDownloadProgress("Đang nén file...");
            console.log("Generating ZIP file...");
            const zipBlob = await zip.generateAsync({ 
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: { level: 6 }
            });
            
            // Save the ZIP file
            setDownloadProgress("Hoàn tất!");
            const filename = `${roadmapData?.title || 'Roadmap'}_Lessons.zip`;
            saveAs(zipBlob, filename);
            
            console.log("ZIP file generated successfully!");
            setTimeout(() => {
                setIsDownloading(false);
                setDownloadProgress("");
                alert(`Đã tạo file ZIP với ${successCount} link tải PDF!\n\nLưu ý: Do hạn chế bảo mật, vui lòng mở các file .txt trong ZIP và nhấp vào link để tải PDF.`);
            }, 500);
        } catch (error) {
            console.error("Error creating ZIP file:", error);
            setIsDownloading(false);
            setDownloadProgress("");
            alert("Có lỗi xảy ra khi tạo file ZIP. Vui lòng thử lại.");
        }
    };

    const handleResourceClick = (resource) => {
        if (resource.url) {
            window.open(resource.url, '_blank');
        }
    };

    // Extract YouTube video ID from URL
    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        
        // Handle different YouTube URL formats
        let videoId = null;
        
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
        } else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('embed/')[1]?.split('?')[0];
        }
        
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    };

    const getChipClass = (type) => {
        switch (type) {
            case 'Article':
                return 'chip-article';
            case 'Course':
                return 'chip-course';
            case 'Official Web':
                return 'chip-official';
            default:
                return 'chip-default';
        }
    };

    return (
        <div className="lesson-drawer-overlay" onClick={onClose}>
            <div className="lesson-drawer-container" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="lesson-drawer-header">
                    <button 
                        className="download-pdf-btn" 
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                        style={{ opacity: isDownloading ? 0.6 : 1, cursor: isDownloading ? 'wait' : 'pointer' }}
                    >
                        {isDownloading ? 'Đang tải...' : 'Download PDF'}
                    </button>
                    <button className="drawer-close-btn" onClick={onClose} disabled={isDownloading}>
                        <BsX size={32} />
                    </button>
                </div>
                
                {/* Progress Indicator */}
                {isDownloading && downloadProgress && (
                    <div style={{
                        padding: '12px 20px',
                        background: '#EFF5FF',
                        borderBottom: '1px solid #E4E7EC',
                        color: '#0066FF',
                        fontSize: '14px',
                        fontWeight: '500',
                        textAlign: 'center'
                    }}>
                        {downloadProgress}
                    </div>
                )}

                {/* Content - Scrollable */}
                <div className="lesson-drawer-content">
                    {/* Title */}
                    <div className="lesson-title-section">
                        <h2 className="lesson-title">{lessonMetadata?.title || lesson.title}</h2>
                    </div>

                    {/* Introduction */}
                    {(lessonMetadata?.description || lesson.introduction) && (
                        <div className="lesson-intro-section">
                            <p className="lesson-intro">{lessonMetadata?.description || lesson.introduction}</p>
                        </div>
                    )}

                    {/* Markdown Content from Supabase */}
                    {isLoadingContent && (
                        <div className="lesson-content-loading">
                            <p>Đang tải nội dung...</p>
                        </div>
                    )}

                    {contentError && (
                        <div className="lesson-content-error">
                            <p>Không thể tải nội dung bài học. Vui lòng thử lại sau.</p>
                            <p style={{ fontSize: '14px', color: '#666' }}>{contentError}</p>
                        </div>
                    )}

                    {markdownContent && !isLoadingContent && (
                        <div className="lesson-markdown-section">
                            <MarkdownRenderer content={markdownContent} />
                        </div>
                    )}

                    {/* Fallback: Display old content sections if markdown not available */}
                    {!markdownContent && !isLoadingContent && !contentError && lesson.contentSections && lesson.contentSections.map((section, index) => (
                        <div key={index} className="lesson-content-section">
                            <h3 className="section-heading">{section.heading}</h3>
                            {section.description && (
                                <div className="section-description">
                                    <p>{section.description}</p>
                                </div>
                            )}
                            {section.items && section.items.length > 0 && (
                                <ul className="section-items-list">
                                    {section.items.map((item, idx) => (
                                        <li key={idx} className="section-item">
                                            {typeof item === 'string' ? (
                                                <span>{item}</span>
                                            ) : (
                                                <>
                                                    <strong>{item.title}:</strong> {item.description}
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}

                    {/* Video Section - Use metadata YouTube URL */}
                    {lessonMetadata?.youtube_url && (
                        <div className="lesson-video-section">
                            <div className="video-wrapper">
                                <iframe
                                    src={getYouTubeEmbedUrl(lessonMetadata.youtube_url)}
                                    title={lessonMetadata?.title || lesson.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="video-iframe"
                                />
                            </div>
                        </div>
                    )}

                    {/* Resources Divider - Use metadata or fallback to lesson resources */}
                    {((lessonMetadata?.resources && lessonMetadata.resources.length > 0) || (lesson.resources && lesson.resources.length > 0)) && (
                        <>
                            <div className="resources-divider">
                                <div className="divider-line"></div>
                                <div className="divider-chip">
                                    <span>❤️ Free Resources</span>
                                </div>
                                <div className="divider-line"></div>
                            </div>

                            {/* Resources List */}
                            <div className="resources-section">
                                {(lessonMetadata?.resources || lesson.resources || []).map((resource, index) => (
                                    <div 
                                        key={index} 
                                        className="resource-item"
                                        onClick={() => handleResourceClick(resource)}
                                    >
                                        <div className={`resource-chip ${getChipClass(resource.type)}`}>
                                            {resource.type}
                                        </div>
                                        <span className="resource-link">{resource.title}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LessonDetailDrawer;
