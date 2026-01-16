/**
 * Sample Lesson Data for Marketing Roadmap
 * This data structure matches the LessonDetailDrawer component and ChatLessonDrawer
 */

export const sampleLessons = {
    "uiux-design": {
        id: "uiux-1",
        title: "Thiết Kế UI/UX: Tạo Nên Trải Nghiệm Người Dùng Tuyệt Vời",
        introduction: '"Thiết kế UI/UX là quá trình tạo ra những sản phẩm kỹ thuật số không chỉ đẹp mắt mà còn dễ sử dụng, mang lại trải nghiệm tuyệt vời cho người dùng. Đó là sự kết hợp giữa hình thức và cảm xúc, giữa tính thẩm mỹ và tính hữu dụng."',
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        pdfUrl: "https://drive.google.com/file/d/1qjGKV9mh30E9d--sXTXNwXPlU5f8AGla/view?usp=drive_link",
        content: `<h2>Giới thiệu về UI/UX Design</h2>
<p>Thiết kế UI/UX là quá trình tạo ra những sản phẩm kỹ thuật số không chỉ đẹp mắt mà còn dễ sử dụng, mang lại trải nghiệm tuyệt vời cho người dùng.</p>

<h3>UI (User Interface - Giao Diện Người Dùng)</h3>
<p><strong>Tập trung vào:</strong> Hình thức và cách thức tương tác trực quan của sản phẩm.</p>
<ul>
<li><strong>Bố cục (Layout):</strong> Sắp xếp các thành phần trên màn hình sao cho hợp lý và dễ nhìn.</li>
<li><strong>Màu sắc và phông chữ:</strong> Lựa chọn màu sắc và phông chữ phù hợp với thương hiệu.</li>
<li><strong>Hình ảnh và biểu tượng:</strong> Sử dụng hình ảnh và icons để truyền tải thông tin trực quan.</li>
<li><strong>Các yếu tố tương tác:</strong> Nút bấm, thanh trượt, menu được thiết kế dễ sử dụng.</li>
</ul>

<h3>UX (User Experience - Trải Nghiệm Người Dùng)</h3>
<p><strong>Tập trung vào:</strong> Cảm xúc và trải nghiệm tổng thể của người dùng.</p>
<ul>
<li><strong>Tính hữu dụng:</strong> Sản phẩm dễ sử dụng và đáp ứng nhu cầu.</li>
<li><strong>Tính khả dụng:</strong> Có thể được sử dụng bởi tất cả mọi người.</li>
<li><strong>Tính hấp dẫn:</strong> Tạo cảm xúc tích cực cho người dùng.</li>
<li><strong>Tính hữu ích:</strong> Mang lại giá trị thực sự.</li>
</ul>

<blockquote>"Design is not just what it looks like and feels like. Design is how it works." - Steve Jobs</blockquote>`,
        contentSections: [
            {
                heading: "UI/UX là gì?",
                description: "UI (User Interface) tập trung vào hình thức và giao diện. UX (User Experience) tập trung vào trải nghiệm người dùng.",
                items: [
                    "Bố cục và màu sắc",
                    "Tính hữu dụng và khả dụng",
                    "Trải nghiệm tổng thể"
                ]
            },
            {
                heading: "Các nguyên tắc thiết kế",
                description: "Những nguyên tắc cơ bản trong thiết kế UI/UX:",
                items: [
                    "Tính nhất quán (Consistency)",
                    "Phản hồi (Feedback)",
                    "Đơn giản hóa (Simplicity)",
                    "Khả năng truy cập (Accessibility)"
                ]
            }
        ],
        resources: [
            {
                type: "Article",
                title: "UI/UX Design Fundamentals",
                url: "https://example.com/uiux-fundamentals"
            },
            {
                type: "Course",
                title: "Google UX Design Certificate",
                url: "https://www.coursera.org/google-certificates/ux-design"
            }
        ]
    },
    "marketing-4p-7p": {
        id: "marketing-1",
        title: "Khái niệm cơ bản của Marketing: 4P, 7P",
        introduction: "Marketing Mix là nền tảng cơ bản của mọi chiến lược marketing. Hiểu rõ 4P và 7P sẽ giúp bạn xây dựng chiến lược marketing hiệu quả.",
        videoUrl: "https://www.youtube.com/embed/sample123",
        pdfUrl: "https://drive.google.com/file/d/1example123/view",
        content: `<h2>Marketing Mix: 4P và 7P</h2>
<p>Marketing Mix là tập hợp các công cụ marketing để đạt được mục tiêu trong thị trường mục tiêu.</p>

<h3>Marketing Mix 4P (Mô hình truyền thống)</h3>

<h4>1. Product (Sản phẩm)</h4>
<p>Sản phẩm hoặc dịch vụ đáp ứng nhu cầu khách hàng.</p>
<ul>
<li><strong>Chất lượng sản phẩm:</strong> Độ bền, tính năng, thiết kế</li>
<li><strong>Thương hiệu:</strong> Tên, logo, nhận diện</li>
<li><strong>Dịch vụ:</strong> Bảo hành, hỗ trợ khách hàng</li>
</ul>

<h4>2. Price (Giá cả)</h4>
<p>Chiến lược định giá sản phẩm/dịch vụ.</p>
<ul>
<li><strong>Chiến lược:</strong> Penetration pricing, skimming</li>
<li><strong>Chiết khấu:</strong> Giảm giá, khuyến mãi</li>
<li><strong>Thanh toán:</strong> Trả góp, online</li>
</ul>

<h4>3. Place (Phân phối)</h4>
<p>Kênh phân phối và địa điểm bán hàng.</p>
<ul>
<li><strong>Kênh:</strong> Trực tiếp, gián tiếp, đa kênh</li>
<li><strong>Vị trí:</strong> Cửa hàng, showroom, online</li>
<li><strong>Logistics:</strong> Vận chuyển, kho bãi</li>
</ul>

<h4>4. Promotion (Xúc tiến)</h4>
<p>Các hoạt động quảng bá, truyền thông.</p>
<ul>
<li><strong>Quảng cáo:</strong> TV, radio, online ads</li>
<li><strong>PR:</strong> Quan hệ công chúng</li>
<li><strong>Sales promotion:</strong> Khuyến mãi, voucher</li>
</ul>

<h3>Marketing Mix 7P (Mở rộng cho dịch vụ)</h3>

<h4>5. People (Con người)</h4>
<p>Nhân viên và khách hàng trong quá trình cung cấp dịch vụ.</p>

<h4>6. Process (Quy trình)</h4>
<p>Các quy trình và hệ thống cung cấp dịch vụ nhất quán.</p>

<h4>7. Physical Evidence (Bằng chứng vật lý)</h4>
<p>Môi trường và các yếu tố hữu hình khách hàng trải nghiệm.</p>

<blockquote>"Thành công trong marketing đến từ việc phối hợp hài hòa tất cả các P với nhau."</blockquote>`,
        contentSections: [
            {
                heading: "Marketing Mix 4P",
                description: "Bốn yếu tố cơ bản:",
                items: [
                    {
                        title: "Product",
                        description: "Sản phẩm đáp ứng nhu cầu"
                    },
                    {
                        title: "Price",
                        description: "Chiến lược định giá"
                    },
                    {
                        title: "Place",
                        description: "Kênh phân phối"
                    },
                    {
                        title: "Promotion",
                        description: "Quảng bá truyền thông"
                    }
                ]
            },
            {
                heading: "Marketing Mix 7P",
                description: "Mở rộng cho dịch vụ:",
                items: [
                    {
                        title: "People",
                        description: "Con người"
                    },
                    {
                        title: "Process",
                        description: "Quy trình"
                    },
                    {
                        title: "Physical Evidence",
                        description: "Bằng chứng vật lý"
                    }
                ]
            }
        ],
        resources: [
            {
                type: "Article",
                title: "Marketing Mix 4P - Nền tảng cơ bản",
                url: "https://example.com/marketing-4p"
            },
            {
                type: "Course",
                title: "Marketing Fundamentals (Coursera)",
                url: "https://www.coursera.org/learn/marketing-fundamentals"
            }
        ]
    },
    "consumer-behavior": {
        id: "marketing-2",
        title: "Hành vi người tiêu dùng (Consumer Behavior)",
        introduction: "Hiểu được hành vi người tiêu dùng là chìa khóa để xây dựng chiến lược marketing hiệu quả.",
        pdfUrl: "https://drive.google.com/file/d/1example456/view",
        videoUrl: "https://www.youtube.com/embed/sample456",
        content: `<h2>Hành vi người tiêu dùng (Consumer Behavior)</h2>
<p>Consumer Behavior là nghiên cứu về các quá trình lựa chọn, sử dụng và loại bỏ sản phẩm/dịch vụ của người tiêu dùng.</p>

<h3>Quy trình ra quyết định mua hàng</h3>
<p>5 bước quan trọng:</p>

<h4>1. Nhận biết nhu cầu (Need Recognition)</h4>
<p>Khách hàng nhận ra sự khác biệt giữa trạng thái hiện tại và mong muốn.</p>
<ul>
<li><strong>Kích thích nội tại:</strong> Đói, khát, mệt mỏi</li>
<li><strong>Kích thích bên ngoài:</strong> Quảng cáo, xu hướng</li>
</ul>

<h4>2. Tìm kiếm thông tin (Information Search)</h4>
<p>Thu thập thông tin về các lựa chọn.</p>
<ul>
<li><strong>Tìm kiếm nội bộ:</strong> Dựa vào kinh nghiệm</li>
<li><strong>Tìm kiếm bên ngoài:</strong> Google, social media, review</li>
</ul>

<h4>3. Đánh giá các lựa chọn</h4>
<p>So sánh các sản phẩm/dịch vụ dựa trên tiêu chí cá nhân.</p>

<h4>4. Quyết định mua hàng</h4>
<p>Lựa chọn sản phẩm phù hợp nhất và thực hiện mua.</p>

<h4>5. Đánh giá sau mua</h4>
<p>Cảm nhận về sản phẩm sau khi sử dụng.</p>
<ul>
<li><strong>Satisfaction:</strong> Đáp ứng hoặc vượt mong đợi</li>
<li><strong>Dissatisfaction:</strong> Không đáp ứng mong đợi</li>
</ul>

<h3>Các yếu tố ảnh hưởng</h3>
<ul>
<li><strong>Văn hóa:</strong> Giá trị, niềm tin, phong tục</li>
<li><strong>Xã hội:</strong> Gia đình, nhóm tham khảo</li>
<li><strong>Cá nhân:</strong> Tuổi tác, thu nhập, phong cách sống</li>
<li><strong>Tâm lý:</strong> Động cơ, nhận thức, thái độ</li>
</ul>

<blockquote>"Hiểu khách hàng không chỉ là biết họ muốn gì, mà là hiểu tại sao họ muốn điều đó."</blockquote>`,
        contentSections: [
            {
                heading: "Quy trình ra quyết định",
                description: "5 bước:",
                items: [
                    {
                        title: "Nhận biết nhu cầu",
                        description: "Khách hàng nhận ra nhu cầu"
                    },
                    {
                        title: "Tìm kiếm thông tin",
                        description: "Thu thập thông tin về sản phẩm"
                    },
                    {
                        title: "Đánh giá lựa chọn",
                        description: "So sánh các sản phẩm"
                    },
                    {
                        title: "Quyết định mua",
                        description: "Thực hiện mua hàng"
                    },
                    {
                        title: "Đánh giá sau mua",
                        description: "Cảm nhận về sản phẩm"
                    }
                ]
            },
            {
                heading: "Yếu tố ảnh hưởng",
                description: "Các yếu tố tác động đến quyết định:",
                items: [
                    "Văn hóa và xã hội",
                    "Cá nhân (tuổi tác, thu nhập)",
                    "Tâm lý (động cơ, thái độ)",
                    "Tình huống (thời gian, địa điểm)"
                ]
            }
        ],
        resources: [
            {
                type: "Article",
                title: "Hiểu về Consumer Behavior",
                url: "https://example.com/consumer-behavior"
            },
            {
                type: "Course",
                title: "Consumer Behavior Course",
                url: "https://www.udemy.com/course/consumer-behavior/"
            }
        ]
    }
};

// Helper function to get lesson by ID or title
export const getLessonById = (lessonIdOrTitle) => {
    // First try direct lookup by ID
    if (sampleLessons[lessonIdOrTitle]) {
        return formatLessonForDrawer(sampleLessons[lessonIdOrTitle]);
    }
    
    // Try to match by title
    const normalizedInput = lessonIdOrTitle.toLowerCase().trim();
    
    // Look through all lessons
    for (const [key, lesson] of Object.entries(sampleLessons)) {
        const normalizedTitle = lesson.title.toLowerCase();
        
        // Check if title contains the input or vice versa
        if (normalizedTitle.includes(normalizedInput) || normalizedInput.includes(normalizedTitle)) {
            return formatLessonForDrawer(lesson);
        }
    }
    
    return null; // No match found
};

// Format lesson data for the ChatLessonDrawer component
export const formatLessonForDrawer = (lesson) => {
    if (!lesson) return null;
    
    // Convert contentSections to sections format expected by drawer
    const sections = lesson.contentSections ? lesson.contentSections.map(section => {
        let contentHtml = '';
        
        if (section.description) {
            contentHtml += `<p>${section.description}</p>`;
        }
        
        if (section.items && Array.isArray(section.items)) {
            contentHtml += '<ul>';
            section.items.forEach(item => {
                if (typeof item === 'string') {
                    contentHtml += `<li>${item}</li>`;
                } else if (item.title) {
                    contentHtml += `<li><strong>${item.title}:</strong> ${item.description || ''}</li>`;
                }
            });
            contentHtml += '</ul>';
        }
        
        return {
            title: section.heading,
            content: contentHtml
        };
    }) : [];
    
    return {
        pdfUrl: lesson.pdfUrl, // Add PDF URL for viewer
        ...lesson,
        description: lesson.introduction,
        content: lesson.content, // Add the main PDF content
        sections: sections,
        resources: lesson.resources || []
    };
};
