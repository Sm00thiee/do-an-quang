import React, { useState } from 'react';
import { BsX, BsFilePdf, BsPlayCircle, BsFileText } from 'react-icons/bs';
import './ChatLessonDrawer.css';

// Helper function to convert Google Drive links to embeddable format
const convertToEmbedUrl = (url) => {
  if (!url) return '';
  
  // Handle Google Drive links
  if (url.includes('drive.google.com')) {
    // Extract file ID from various Google Drive URL formats
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }
  
  // For direct PDF links, return as is
  return url;
};

// Helper function to detect content types
const getAvailableContentTypes = (lesson) => {
  const types = [];
  if (lesson.pdfUrl) types.push('pdf');
  if (lesson.videoUrl) types.push('video');
  if (lesson.content || lesson.sections?.length > 0) types.push('text');
  return types;
};

/**
 * ChatLessonDrawer Component
 * Displays lesson details in a right-side drawer for chat roadmap lessons
 */
function ChatLessonDrawer({ isOpen, onClose, lesson }) {
  const [activeTab, setActiveTab] = useState('pdf'); // pdf, video, text
  
  // Determine available content types
  const availableTypes = getAvailableContentTypes(lesson || {});
  
  // Set initial active tab to first available content type
  React.useEffect(() => {
    if (lesson && availableTypes.length > 0 && !availableTypes.includes(activeTab)) {
      setActiveTab(availableTypes[0]);
    }
  }, [lesson, availableTypes, activeTab]);

  if (!isOpen || !lesson) return null;

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
            <button 
              className="btn btn-outline-primary"
              onClick={() => {
                // TODO: Implement PDF download functionality
                alert('Download PDF functionality will be implemented');
              }}
            >
              Download PDF
            </button>
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
              {availableTypes.includes('pdf') && (
                <button
                  className={`tab-button ${activeTab === 'pdf' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pdf')}
                >
                  <BsFilePdf /> PDF
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
              {availableTypes.includes('text') && (
                <button
                  className={`tab-button ${activeTab === 'text' ? 'active' : ''}`}
                  onClick={() => setActiveTab('text')}
                >
                  <BsFileText /> Text Content
                </button>
              )}
            </div>
          )}

          {/* PDF Viewer Tab */}
          {activeTab === 'pdf' && lesson.pdfUrl && (
            <div className="drawer-pdf-viewer">
              <div className="pdf-viewer-container">
                <iframe
                  src={convertToEmbedUrl(lesson.pdfUrl)}
                  title="PDF Viewer"
                  className="pdf-iframe"
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Video Player Tab */}
          {activeTab === 'video' && lesson.videoUrl && (
            <div className="drawer-video-player">
              <div className="video-player-container">
                <iframe
                  src={lesson.videoUrl}
                  title="Video Player"
                  className="video-iframe"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Text Content Tab */}
          {activeTab === 'text' && (lesson.content || lesson.sections?.length > 0) && (
            <div className="drawer-text-content">
              {/* PDF Content - Main text content */}
              {lesson.content && (
                <div className="drawer-pdf-content">
                  <div className="pdf-content-text">
                    {typeof lesson.content === 'string' ? (
                      <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                    ) : (
                      lesson.content
                    )}
                  </div>
                </div>
              )}

              {/* Content Sections */}
              {lesson.sections && lesson.sections.map((section, index) => (
                <div key={index} className="drawer-section">
                  <h3 className="section-title">{section.title}</h3>
                  <div className="section-content">
                    {typeof section.content === 'string' ? (
                      <div dangerouslySetInnerHTML={{ __html: section.content }} />
                    ) : (
                      <p>{section.content}</p>
                    )}
                  </div>
                </div>
              ))}
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
