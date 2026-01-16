import React, { useState, useEffect } from 'react';
import { BsX, BsPlayCircle, BsFileText } from 'react-icons/bs';
import MarkdownRenderer from './MarkdownRenderer';
import { fetchLessonMarkdown, fetchLessonMetadata, getLessonFileName, extractLessonIdFromTitle } from '../services/courseContentService';
import './ChatLessonDrawer.css';

// Helper function to convert YouTube links to embeddable format
const convertToYouTubeEmbed = (url) => {
  if (!url) return '';
  
  // Already an embed URL
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  // Handle youtube.com/watch?v=VIDEO_ID format
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  
  // Handle youtu.be/VIDEO_ID format
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }
  
  return url;
};

// Helper function to detect content types
const getAvailableContentTypes = (hasMarkdown, hasVideo) => {
  const types = [];
  if (hasMarkdown) types.push('markdown');
  if (hasVideo) types.push('video');
  return types;
};

/**
 * ChatLessonDrawer Component
 * Displays lesson details in a right-side drawer for chat roadmap lessons
 * Supports markdown content and YouTube videos from Supabase
 */
function ChatLessonDrawer({ isOpen, onClose, lesson }) {
  const [activeTab, setActiveTab] = useState('markdown');
  const [markdownContent, setMarkdownContent] = useState(null);
  const [lessonMetadata, setLessonMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Fetch lesson content when lesson changes
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
        console.log(`[ChatLessonDrawer] Extracted lesson ID from title: ${lessonId}`);
      }

      if (!lessonId) {
        console.warn(`[ChatLessonDrawer] Could not determine lesson ID for: ${lesson.title}`);
        setMarkdownContent(null);
        setLessonMetadata(null);
        return;
      }

      setIsLoading(true);

      try {
        // Fetch lesson metadata from database (includes YouTube URL)
        const metadata = await fetchLessonMetadata(lessonId);
        setLessonMetadata(metadata);
        console.log(`[ChatLessonDrawer] Lesson metadata:`, metadata);

        // Get markdown file name - from metadata or fallback to mapping
        const fileName = metadata?.markdown_file || getLessonFileName(lessonId);
        
        if (!fileName) {
          console.warn(`[ChatLessonDrawer] No markdown file for lesson: ${lessonId}`);
          setMarkdownContent(null);
          setIsLoading(false);
          return;
        }

        console.log(`[ChatLessonDrawer] Loading markdown for lesson: ${lessonId}`);
        const content = await fetchLessonMarkdown(fileName);
        setMarkdownContent(content);
      } catch (error) {
        console.error(`[ChatLessonDrawer] Error loading lesson content:`, error);
        setMarkdownContent(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadLessonContent();
    }
  }, [lesson, lesson?.id, lesson?.title, isOpen]);
  
  // Determine available content types based on what we have
  const hasVideo = !!(lessonMetadata?.youtube_url);
  const availableTypes = getAvailableContentTypes(!!markdownContent, hasVideo);
  
  // Set initial active tab to first available content type
  React.useEffect(() => {
    if (isLoading) return; // Don't switch tabs while loading content
    if (lesson && availableTypes.length > 0 && !availableTypes.includes(activeTab)) {
      setActiveTab(availableTypes[0]);
    }
  }, [lesson, availableTypes, activeTab, isLoading]);

  if (!isOpen || !lesson) return null;

  // Get PDF URL from lesson data
  const getPdfUrl = () => {
    // Try pdfUrl property first
    if (lesson.pdfUrl) return lesson.pdfUrl;
    
    // Try to find Article resource
    const articleResource = lesson.resources?.find(r => r.type?.toLowerCase() === 'article');
    if (articleResource?.url) return articleResource.url;
    
    // Try pdf_url from metadata
    if (lessonMetadata?.pdf_url) return lessonMetadata.pdf_url;
    
    return null;
  };

  // Handle PDF download
  const handleDownloadPDF = () => {
    const pdfUrl = getPdfUrl();
    if (isDownloading || !pdfUrl) return;
    
    setIsDownloading(true);
    
    try {
      // Convert Google Drive URL to direct download format if needed
      let downloadUrl = pdfUrl;
      
      // Convert Google Drive view URL to download URL
      const driveMatch = downloadUrl.match(/\/d\/([^/]+)/);
      if (driveMatch && driveMatch[1]) {
        const fileId = driveMatch[1];
        downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
      
      // Open download in new tab
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('[ChatLessonDrawer] Error downloading PDF:', error);
    } finally {
      setTimeout(() => setIsDownloading(false), 1000);
    }
  };

  // Resource type colors
  const getChipColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'article':
        return 'chip-article';
      case 'course':
        return 'chip-course';
      case 'official web':
      case 'official':
        return 'chip-official';
      default:
        return 'chip-article';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="chat-lesson-drawer-overlay" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="chat-lesson-drawer">
        <div className="chat-lesson-drawer-content">
          {/* Header */}
          <div className="drawer-header">
            {getPdfUrl() && (
              <button 
                className="btn-download-pdf"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
              >
                {isDownloading ? 'Đang tải...' : 'Download PDF'}
              </button>
            )}
            <button 
              className="btn-close-drawer"
              onClick={onClose}
              aria-label="Close"
            >
              <BsX size={32} />
            </button>
          </div>

          {/* Title */}
          <div className="drawer-title">
            <h2>{lesson.title}</h2>
          </div>

          {/* Description */}
          {lesson.description && (
            <div className="drawer-description">
              <p>{lesson.description}</p>
            </div>
          )}

          {/* Content Type Tabs */}
          {availableTypes.length > 1 && (
            <div className="content-tabs">
              {availableTypes.includes('markdown') && (
                <button
                  className={`tab-button ${activeTab === 'markdown' ? 'active' : ''}`}
                  onClick={() => setActiveTab('markdown')}
                >
                  <BsFileText /> Nội dung
                </button>
              )}
              {availableTypes.includes('video') && (
                <button
                  className={`tab-button ${activeTab === 'video' ? 'active' : ''}`}
                  onClick={() => setActiveTab('video')}
                >
                  <BsPlayCircle /> Video
                </button>
              )}
            </div>
          )}

          {/* Markdown Content Tab */}
          {activeTab === 'markdown' && (
            <div className="drawer-markdown-content">
              {isLoading && (
                <div className="loading-message">
                  <p>Đang tải nội dung...</p>
                </div>
              )}
              {!isLoading && markdownContent && (
                <MarkdownRenderer content={markdownContent} />
              )}
              {!isLoading && !markdownContent && (
                <div className="error-message">
                  <p>Không tìm thấy nội dung bài học.</p>
                </div>
              )}
            </div>
          )}

          {/* Video Player Tab - YouTube video from database */}
          {activeTab === 'video' && lessonMetadata?.youtube_url && (
            <div className="drawer-video-player">
              <div className="video-player-container">
                <iframe
                  src={convertToYouTubeEmbed(lessonMetadata.youtube_url)}
                  title="Video bài học"
                  className="video-iframe"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Resources Section (shown for all tabs) */}
          {lesson.resources && lesson.resources.length > 0 && (
            <>
              <div className="drawer-divider">
                <div className="divider-line" />
                <div className="divider-badge">
                  <span>Free Resources</span>
                </div>
                <div className="divider-line" />
              </div>

              <div className="drawer-resources">
                {lesson.resources.map((resource, index) => (
                  <div key={index} className="resource-item">
                    <span className={`resource-chip ${getChipColor(resource.type)}`}>
                      {resource.type}
                    </span>
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="resource-link"
                    >
                      {resource.title}
                    </a>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default ChatLessonDrawer;
