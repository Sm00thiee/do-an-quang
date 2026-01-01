import "./custom.css";
import { IoIosCheckmarkCircle } from "react-icons/io";

function Company() {
  // Learning roadmap data
  const learningPath = [
    {
      id: 1,
      title: "Tìm hiểu cơ bản chuyên viên Marketing",
      subtitle: "Marketing • Cơ bản • 30 phút",
      topics: [
        "Tìm hiểu về Marketing (3 phút)",
        "Hoạt động cơ bản của Marketing 4P - 7P",
        "Nghiên cứu thị trường và Consumer Behavior", 
        "Branding và tầm Brand Identity, Brand Positioning",
        "Marketing Funnel: AIDA, TOFU - MOFU - BOFU"
      ],
      completed: true
    },
    {
      id: 2,
      title: "Kỹ năng cơ bản để trở thành Digital Marketing",
      subtitle: "Marketing • Cơ bản • 1 tiếng", 
      topics: [
        "Cơ bản về Marketing Facebook, TikTok, Instagram",
        "Content Writing & Copywriting",
        "SEO (tối ưu hóa công cụ tìm kiếm) Google Trends",
        "Google Analytics (Có trung... hay khác)",
        "Email Marketing - Automation",
        "Digital Ads (Facebook ads, Google ads)"
      ],
      completed: false
    },
    {
      id: 3,
      title: "Thực hành trong thực Marketing",
      subtitle: "Marketing • Thực hành • 2 tiếng",
      topics: [
        "Xác định target & xác định ROAS (Mục tiêu)",
        "Xây dựng (tạo) Google Content Calendar",
        "Lên kế hoạch cho dự án thực tế nâng cao",
        "Thực tế viết copy 1 tuần cho sản phẩm của bạn",
        "Có 1 campaign thử với cách lên kế hoạch",
        "Có tương tác với các chuyên gia trong lĩnh vực"
      ],
      completed: false
    },
    {
      id: 4,
      title: "Tìm việc & Nộp hồ sơ",
      subtitle: "Marketing • Thực hành • 1 tiếng",
      topics: [
        "Trao đổi làm tăng giá trị Skills của CV",
        "Xây dựng mạng lưới (kỹ thuật) CV",
        "Thực dụng này toàn bộ từ kết Portfolio Marketing",
        "Chuyên khoa Marketing ngày hôm nay",
        "Thay tăng CV nộp cho agency hoặc startups"
      ],
      completed: false
    },
    {
      id: 5,
      title: "Phát triển Career Path",
      subtitle: "Marketing • Nâng cao • 2 tiếng",
      topics: [
        "Xây dựng kế hoạch phát triển sự nghiệp",
        "Networking và xây dựng personal brand",
        "Continuous learning và skill development",
        "Leadership và team management",
        "Entrepreneurship và business mindset"
      ],
      completed: false
    }
  ];

  return (
    <>
      <div className="container-fluid bg-light py-4">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="d-flex align-items-center mb-4">
                <button className="btn btn-outline-secondary me-3">
                  ← 
                </button>
                <div>
                  <h4 className="mb-1 fw-bold">Lộ trình chi tiết trở thành Chuyên viên Marketing</h4>
                  <p className="text-muted mb-0">Marketing • Cơ bản • 30 phút</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div className="row">
          <div className="col-12">
            {learningPath.map((step, index) => (
              <div key={step.id} className="row mb-4">
                <div className="col-12">
                  <div className="d-flex">
                    {/* Timeline */}
                    <div className="me-4 d-flex flex-column align-items-center">
                      <div 
                        className={`rounded-circle d-flex align-items-center justify-content-center ${
                          step.completed ? 'bg-success text-white' : 'bg-primary text-white'
                        }`}
                        style={{ width: '32px', height: '32px', minWidth: '32px' }}
                      >
                        {step.completed ? (
                          <IoIosCheckmarkCircle size={20} />
                        ) : (
                          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{step.id}</span>
                        )}
                      </div>
                      {index < learningPath.length - 1 && (
                        <div 
                          className="bg-secondary"
                          style={{ width: '2px', height: '120px', marginTop: '8px' }}
                        ></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-fill">
                      <div className="bg-white rounded-3 shadow-sm border p-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="flex-fill">
                            <h5 className="mb-2 fw-bold text-dark">{step.title}</h5>
                            <p className="text-muted mb-0 small">{step.subtitle}</p>
                          </div>
                          <div className="ms-3">
                            <button className="btn btn-outline-primary btn-sm">
                              {step.completed ? 'Hoàn thành' : 'Bắt đầu học'}
                            </button>
                          </div>
                        </div>

                        <div className="border-top pt-3">
                          {step.topics.map((topic, topicIndex) => (
                            <div key={topicIndex} className="d-flex align-items-center mb-2">
                              <div 
                                className={`rounded-circle me-2 ${
                                  step.completed ? 'bg-success' : 'bg-light border'
                                }`}
                                style={{ width: '8px', height: '8px', minWidth: '8px' }}
                              ></div>
                              <span 
                                className={`small ${
                                  step.completed ? 'text-dark' : 'text-muted'
                                }`}
                                style={{ fontSize: '14px' }}
                              >
                                {topic}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default Company;