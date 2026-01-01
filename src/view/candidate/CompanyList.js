import "./custom.css";
import { IoIosCheckmarkCircle } from "react-icons/io";

function CompanyList() {
  // Learning roadmap data
  const learningPath = [
    {
      id: 1,
      title: "Tìm hiểu cơ bản về Digital Marketing",
      subtitle: "Marketing • Cơ bản • 30 phút",
      topics: [
        "Kiến thức cơ bản của Marketing: 4P, 7P",
        "Hiểu về người tiêu dùng (Consumer Behavior)",
        "Nghiên cứu thị trường (Market Research)",
        "Branding và xây dựng Brand Identity, Brand Positioning",
        "Marketing Funnel: AIDA, TOFU - MOFU - BOFU"
      ],
      completed: true,
      buttonText: "Đã tiến hành học Marketing cơ bản"
    },
    {
      id: 2,
      title: "Kỹ năng cần có của một Digital Marketing",
      subtitle: "Marketing • Cơ bản • 1 giờ", 
      topics: [
        "Social Media Marketing (Facebook, TikTok, Instagram)",
        "Content Writing & Copywriting",
        "SEO (tối ưu website), Google Search Console",
        "Google Analytics (Có thống kê tích cả Việt)",
        "Email Marketing - Automation",
        "Digital Ads (Facebook ads, Google ads)"
      ],
      completed: false,
      buttonText: "Bắt đầu học Marketing cơ bản"
    },
    {
      id: 3,
      title: "Thực hành chuyên ngành Marketing",
      subtitle: "Marketing • Thực hành • 2 giờ",
      topics: [
        "Xác định insight & Xây dựng chiến lược tổng",
        "Xây dựng kế hoạch Content Calendar",
        "Sáng tạo nội dung cho dự án thực tế nâng cao",
        "Thích ứp có copy 1 chiến cho sản phẩm cần có",
        "Có 1 campaign thực với cách lên kế hoạch",
        "Có tương tác với các chuyên gia trong lĩnh vực"
      ],
      completed: false,
      buttonText: "Bắt đầu học thực hành"
    },
    {
      id: 4,
      title: "Kỹ năng Portfolio & hỗ trợ tìm việc làm cá",
      subtitle: "Marketing • Thực hành • 1 giờ",
      topics: [
        "Tạo bộ case study giải 1-2 caloii giấu nhỏ",
        "Ghi lại về tinh thần truyền thì tiếng Việt - tiếng Anh",
        "Thích hữu vùng toàn bộ từ kết Portfolio Marketing",
        "Cần chọn dạy tích Marketing ngành bộm nay",
        "Thực tạo tài quen tiếp với cá agency (người startup)"
      ],
      completed: false,
      buttonText: "Bắt đầu tạo Portfolio"
    }
  ];

  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      <div className="container">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex align-items-center mb-3">
              <button className="btn btn-link p-0 me-3 text-decoration-none">
                <i className="fas fa-arrow-left"></i>
              </button>
              <div>
                <h4 className="mb-1 fw-bold">Lộ trình chi tiết trở thành Chuyên viên Marketing</h4>
                <small className="text-muted">Lộ trình Marketing • Tất cả • 4.5 giờ học</small>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="text-center mb-4">
              <button className="btn btn-primary rounded-pill px-4 py-2">
                Bắt đầu học Marketing (5 chủng)
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="position-relative">
              {/* Center timeline line */}
              <div 
                className="position-absolute bg-secondary"
                style={{ 
                  left: '50%', 
                  top: '80px',
                  bottom: '80px',
                  width: '2px',
                  transform: 'translateX(-50%)',
                  zIndex: 1
                }}
              ></div>

              {learningPath.map((step, index) => (
                <div key={step.id} className="row mb-5 position-relative">
                  {/* Left side content (odd steps) */}
                  {index % 2 === 0 && (
                    <>
                      <div className="col-5">
                        <div className="bg-white rounded-3 shadow-sm border p-4 position-relative">
                          <h6 className="fw-bold mb-2 text-primary">{step.title}</h6>
                          <p className="small text-muted mb-3">{step.subtitle}</p>
                          
                          <div className="mb-3">
                            {step.topics.map((topic, topicIndex) => (
                              <div key={topicIndex} className="d-flex align-items-start mb-2">
                                <div 
                                  className={`rounded-circle me-2 mt-1 ${
                                    step.completed ? 'bg-success' : 'bg-light border'
                                  }`}
                                  style={{ width: '6px', height: '6px', minWidth: '6px' }}
                                ></div>
                                <span 
                                  className={`small ${
                                    step.completed ? 'text-dark' : 'text-muted'
                                  }`}
                                  style={{ fontSize: '13px' }}
                                >
                                  {topic}
                                </span>
                              </div>
                            ))}
                          </div>

                          <button className={`btn btn-sm w-100 ${step.completed ? 'btn-success' : 'btn-outline-primary'}`}>
                            {step.completed ? 'Hoàn thành' : step.buttonText}
                          </button>
                        </div>
                      </div>
                      
                      {/* Timeline circle */}
                      <div className="col-2 d-flex justify-content-center position-relative">
                        {/* Horizontal line to left card */}
                        <div 
                          className="position-absolute bg-primary"
                          style={{
                            right: '50%',
                            top: '80px',
                            width: 'calc(100% - 20px)',
                            height: '2px',
                            zIndex: 2
                          }}
                        ></div>
                        {/* Arrow head pointing to card */}
                        <div 
                          className="position-absolute"
                          style={{
                            left: '4%',
                            top: '76px',
                            width: '0',
                            height: '0',
                            borderTop: '5px solid transparent',
                            borderBottom: '5px solid transparent',
                            borderRight: '10px solid #0d6efd',
                            zIndex: 2
                          }}
                        ></div>
                        
                        <div 
                          className={`rounded-circle d-flex align-items-center justify-content-center position-relative ${
                            step.completed ? 'bg-success text-white' : 'bg-primary text-white'
                          }`}
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            marginTop: '60px',
                            zIndex: 3,
                            border: '3px solid white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                        >
                          {step.completed ? (
                            <IoIosCheckmarkCircle size={24} />
                          ) : (
                            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{step.id}</span>
                          )}
                        </div>
                      </div>

                      <div className="col-5"></div>
                    </>
                  )}

                  {/* Right side content (even steps) */}
                  {index % 2 === 1 && (
                    <>
                      <div className="col-5"></div>
                      
                      {/* Timeline circle */}
                      <div className="col-2 d-flex justify-content-center position-relative">
                        {/* Horizontal line to right card */}
                        <div 
                          className="position-absolute bg-primary"
                          style={{
                            left: '50%',
                            top: '80px',
                            width: 'calc(100% - 20px)',
                            height: '2px',
                            zIndex: 2
                          }}
                        ></div>
                        {/* Arrow head pointing to card */}
                        <div 
                          className="position-absolute"
                          style={{
                            right: '4%',
                            top: '76px',
                            width: '0',
                            height: '0',
                            borderTop: '5px solid transparent',
                            borderBottom: '5px solid transparent',
                            borderLeft: '10px solid #0d6efd',
                            zIndex: 2
                          }}
                        ></div>
                        
                        <div 
                          className={`rounded-circle d-flex align-items-center justify-content-center position-relative ${
                            step.completed ? 'bg-success text-white' : 'bg-primary text-white'
                          }`}
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            marginTop: '60px',
                            zIndex: 3,
                            border: '3px solid white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                        >
                          {step.completed ? (
                            <IoIosCheckmarkCircle size={24} />
                          ) : (
                            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{step.id}</span>
                          )}
                        </div>
                      </div>

                      <div className="col-5">
                        <div className="bg-white rounded-3 shadow-sm border p-4 position-relative">
                          <h6 className="fw-bold mb-2 text-primary">{step.title}</h6>
                          <p className="small text-muted mb-3">{step.subtitle}</p>
                          
                          <div className="mb-3">
                            {step.topics.map((topic, topicIndex) => (
                              <div key={topicIndex} className="d-flex align-items-start mb-2">
                                <div 
                                  className={`rounded-circle me-2 mt-1 ${
                                    step.completed ? 'bg-success' : 'bg-light border'
                                  }`}
                                  style={{ width: '6px', height: '6px', minWidth: '6px' }}
                                ></div>
                                <span 
                                  className={`small ${
                                    step.completed ? 'text-dark' : 'text-muted'
                                  }`}
                                  style={{ fontSize: '13px' }}
                                >
                                  {topic}
                                </span>
                              </div>
                            ))}
                          </div>

                          <button className={`btn btn-sm w-100 ${step.completed ? 'btn-success' : 'btn-outline-primary'}`}>
                            {step.completed ? 'Hoàn thành' : step.buttonText}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyList;