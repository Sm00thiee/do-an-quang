import { useState, useRef } from "react";
import {
    BsX,
    BsDownload,
    BsPrinter,
    BsShare,
    BsZoomIn,
    BsZoomOut,
    BsArrowLeft,
    BsArrowRight,
    BsBook,
    BsCheckCircleFill
} from "react-icons/bs";
import "./RoadmapPDFViewer.css";

function RoadmapPDFViewer({ isOpen, onClose, roadmapData }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(100);
    const contentRef = useRef(null);

    // Default roadmap data if not provided
    const defaultData = {
        title: "Chuyên viên Marketing",
        subtitle: "Lộ trình phát triển sự nghiệp Marketing từ cơ bản đến chuyên sâu",
        createdDate: "01/01/2026",
        sections: [
            {
                id: "1",
                title: "Nền tảng kiến thức Marketing",
                lessons: [
                    {
                        id: "1.1",
                        title: "Khái niệm cơ bản của Marketing: 4P, 7P",
                        content: [
                            {
                                heading: "1. Marketing Mix 4P",
                                description: "Marketing Mix 4P là một mô hình tiếp thị cơ bản được phát triển bởi Neil Borden và được phổ biến bởi E. Jerome McCarthy vào những năm 1960.",
                                items: [
                                    {
                                        title: "Product (Sản phẩm)",
                                        description: "Sản phẩm hoặc dịch vụ mà doanh nghiệp cung cấp để đáp ứng nhu cầu của khách hàng."
                                    },
                                    {
                                        title: "Price (Giá cả)",
                                        description: "Chiến lược định giá sản phẩm/dịch vụ, bao gồm các yếu tố như chi phí, giá trị cảm nhận, và giá đối thủ cạnh tranh."
                                    },
                                    {
                                        title: "Place (Phân phối)",
                                        description: "Kênh phân phối và địa điểm bán hàng để đưa sản phẩm đến tay người tiêu dùng."
                                    },
                                    {
                                        title: "Promotion (Xúc tiến)",
                                        description: "Các hoạt động quảng bá, truyền thông để thu hút và thuyết phục khách hàng."
                                    }
                                ]
                            },
                            {
                                heading: "2. Marketing Mix 7P (Mở rộng)",
                                description: "Mô hình 7P bổ sung thêm 3 yếu tố cho ngành dịch vụ:",
                                items: [
                                    {
                                        title: "People (Con người)",
                                        description: "Nhân viên và khách hàng tham gia vào quá trình cung cấp dịch vụ."
                                    },
                                    {
                                        title: "Process (Quy trình)",
                                        description: "Các quy trình và hệ thống để cung cấp dịch vụ một cách nhất quán."
                                    },
                                    {
                                        title: "Physical Evidence (Bằng chứng vật lý)",
                                        description: "Môi trường và các yếu tố hữu hình mà khách hàng trải nghiệm."
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "1.2",
                        title: "Consumer Behavior & Insight",
                        content: [
                            {
                                heading: "1. Hành vi người tiêu dùng",
                                description: "Nghiên cứu cách thức và lý do người tiêu dùng đưa ra quyết định mua hàng.",
                                items: [
                                    {
                                        title: "Nhận biết nhu cầu",
                                        description: "Khách hàng nhận ra sự khác biệt giữa trạng thái hiện tại và mong muốn."
                                    },
                                    {
                                        title: "Tìm kiếm thông tin",
                                        description: "Thu thập thông tin về các lựa chọn có sẵn."
                                    },
                                    {
                                        title: "Đánh giá các lựa chọn",
                                        description: "So sánh các sản phẩm/dịch vụ dựa trên tiêu chí cá nhân."
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: "2",
                title: "Kỹ năng & công cụ Digital Marketing",
                lessons: [
                    {
                        id: "2.1",
                        title: "SEO/SEM & Google Ads",
                        content: [
                            {
                                heading: "1. Search Engine Optimization (SEO)",
                                description: "Tối ưu hóa website để tăng thứ hạng trên công cụ tìm kiếm.",
                                items: [
                                    {
                                        title: "On-page SEO",
                                        description: "Tối ưu nội dung, thẻ meta, cấu trúc URL."
                                    },
                                    {
                                        title: "Off-page SEO",
                                        description: "Xây dựng backlinks và uy tín domain."
                                    },
                                    {
                                        title: "Technical SEO",
                                        description: "Tối ưu tốc độ, mobile-friendly, sitemap."
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    };

    const data = roadmapData || defaultData;

    // Calculate total pages based on sections
    const totalPages = data.sections?.reduce((acc, section) =>
        acc + (section.lessons?.length || 0), 1) || 1;

    if (!isOpen) return null;

    const handleDownloadPDF = () => {
        // Create printable content
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${data.title} - Lộ trình học tập</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Inter', sans-serif; 
                        padding: 40px;
                        color: #101828;
                        line-height: 1.6;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 40px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #E4E7EC;
                    }
                    .header h1 { 
                        font-size: 28px; 
                        color: #0066FF;
                        margin-bottom: 8px;
                    }
                    .header p { font-size: 14px; color: #475467; }
                    .section { margin-bottom: 32px; }
                    .section-title { 
                        font-size: 20px;
                        font-weight: 700;
                        color: #0066FF;
                        margin-bottom: 16px;
                        padding: 12px 16px;
                        background: #EFF5FF;
                        border-radius: 8px;
                    }
                    .lesson { margin-bottom: 24px; padding-left: 16px; }
                    .lesson-title { 
                        font-size: 16px;
                        font-weight: 600;
                        margin-bottom: 12px;
                    }
                    .content-block { margin-bottom: 16px; }
                    .content-heading { 
                        font-size: 14px;
                        font-weight: 600;
                        margin-bottom: 8px;
                    }
                    .content-desc { 
                        font-size: 13px;
                        color: #475467;
                        margin-bottom: 8px;
                    }
                    .items-list { 
                        list-style: none;
                        padding-left: 20px;
                    }
                    .items-list li { 
                        margin-bottom: 8px;
                        font-size: 13px;
                    }
                    .items-list li strong { color: #101828; }
                    .items-list li span { color: #475467; }
                    @media print {
                        body { padding: 20px; }
                        .section { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${data.title}</h1>
                    <p>${data.subtitle}</p>
                    <p>Ngày tạo: ${data.createdDate}</p>
                </div>
                ${data.sections?.map(section => `
                    <div class="section">
                        <div class="section-title">${section.id}. ${section.title}</div>
                        ${section.lessons?.map(lesson => `
                            <div class="lesson">
                                <div class="lesson-title">${lesson.id}. ${lesson.title}</div>
                                ${lesson.content?.map(block => `
                                    <div class="content-block">
                                        <div class="content-heading">${block.heading}</div>
                                        <div class="content-desc">${block.description}</div>
                                        <ul class="items-list">
                                            ${block.items?.map(item => `
                                                <li>
                                                    <strong>• ${item.title}:</strong>
                                                    <span> ${item.description}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                `).join('')}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    const handlePrint = () => {
        handleDownloadPDF();
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 10, 150));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 10, 50));
    };

    return (
        <div className="pdf-viewer-overlay" onClick={onClose}>
            <div className="pdf-viewer-container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="pdf-viewer-header">
                    <div className="pdf-header-left">
                        <BsBook className="pdf-icon" />
                        <div className="pdf-title-info">
                            <h2 className="pdf-title">{data.title}</h2>
                            <p className="pdf-subtitle">{data.subtitle}</p>
                        </div>
                    </div>
                    <div className="pdf-header-actions">
                        <button className="pdf-action-btn" onClick={handleZoomOut} title="Thu nhỏ">
                            <BsZoomOut />
                        </button>
                        <span className="zoom-level">{zoom}%</span>
                        <button className="pdf-action-btn" onClick={handleZoomIn} title="Phóng to">
                            <BsZoomIn />
                        </button>
                        <div className="pdf-divider"></div>
                        <button className="pdf-action-btn" onClick={handlePrint} title="In">
                            <BsPrinter />
                        </button>
                        <button className="pdf-action-btn primary" onClick={handleDownloadPDF} title="Tải PDF">
                            <BsDownload />
                            <span>Tải PDF</span>
                        </button>
                        <button className="pdf-close-btn" onClick={onClose} title="Đóng">
                            <BsX />
                        </button>
                    </div>
                </div>

                {/* Document Content */}
                <div className="pdf-viewer-content" ref={contentRef}>
                    <div className="pdf-document" style={{ transform: `scale(${zoom / 100})` }}>
                        {/* Document Header */}
                        <div className="document-header">
                            <div className="document-logo">
                                <span className="logo-text">NEXTSTEP</span>
                            </div>
                            <h1 className="document-title">{data.title}</h1>
                            <p className="document-subtitle">{data.subtitle}</p>
                            <div className="document-meta">
                                <span>Ngày tạo: {data.createdDate}</span>
                            </div>
                        </div>

                        {/* Document Sections */}
                        <div className="document-body">
                            {data.sections?.map((section, sectionIndex) => (
                                <div key={section.id} className="document-section">
                                    <div className="section-header">
                                        <span className="section-number">{section.id}</span>
                                        <h2 className="section-title">{section.title}</h2>
                                    </div>

                                    {section.lessons?.map((lesson) => (
                                        <div key={lesson.id} className="document-lesson">
                                            <div className="lesson-header">
                                                <BsCheckCircleFill className="lesson-check" />
                                                <h3 className="lesson-title">{lesson.id}. {lesson.title}</h3>
                                            </div>

                                            <div className="lesson-content">
                                                {lesson.content?.map((block, blockIndex) => (
                                                    <div key={blockIndex} className="content-block">
                                                        <h4 className="content-heading">{block.heading}</h4>
                                                        <p className="content-description">{block.description}</p>

                                                        {block.items && (
                                                            <ul className="content-items">
                                                                {block.items.map((item, itemIndex) => (
                                                                    <li key={itemIndex} className="content-item">
                                                                        <strong>{item.title}:</strong>
                                                                        <span>{item.description}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* Document Footer */}
                        <div className="document-footer">
                            <p>Được tạo bởi NextStep - Nền tảng phát triển sự nghiệp</p>
                            <p>© 2026 NextStep. All rights reserved.</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Footer */}
                <div className="pdf-viewer-footer">
                    <div className="page-navigation">
                        <button
                            className="page-nav-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            <BsArrowLeft />
                        </button>
                        <span className="page-info">
                            Trang {currentPage} / {totalPages}
                        </span>
                        <button
                            className="page-nav-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            <BsArrowRight />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RoadmapPDFViewer;
