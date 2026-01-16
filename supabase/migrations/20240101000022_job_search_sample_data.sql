-- Migration: Sample Data for Vietnamese Job Market
-- Description: Inserts realistic sample data for companies, jobs, and related entities

-- ============================================
-- 1. INSERT INDUSTRIES
-- ============================================
INSERT INTO public.industries (name, name_vi, description) VALUES
  ('technology', 'Công nghệ thông tin', 'Phát triển phần mềm, IT, Digital'),
  ('finance', 'Tài chính', 'Ngân hàng, Bảo hiểm, Đầu tư'),
  ('marketing', 'Marketing', 'Marketing, Truyền thông, Quảng cáo'),
  ('design', 'Thiết kế', 'UI/UX, Đồ họa, Sáng tạo'),
  ('education', 'Giáo dục', 'Đào tạo, Giảng dạy'),
  ('healthcare', 'Y tế', 'Chăm sóc sức khỏe, Dược phẩm'),
  ('manufacturing', 'Sản xuất', 'Sản xuất, Chế tạo'),
  ('retail', 'Bán lẻ', 'Bán lẻ, Thương mại'),
  ('real_estate', 'Bất động sản', 'Bất động sản, Xây dựng'),
  ('hospitality', 'Dịch vụ', 'Khách sạn, Nhà hàng, Du lịch')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. INSERT LOCATIONS
-- ============================================
INSERT INTO public.locations (city, district, full_address) VALUES
  ('Hà Nội', 'Thanh Xuân', 'Thanh Xuân, Hà Nội'),
  ('Hà Nội', 'Cầu Giấy', 'Cầu Giấy, Hà Nội'),
  ('Hà Nội', 'Hoàn Kiếm', 'Hoàn Kiếm, Hà Nội'),
  ('Hà Nội', 'Đống Đa', 'Đống Đa, Hà Nội'),
  ('Hà Nội', 'Ba Đình', 'Ba Đình, Hà Nội'),
  ('Hồ Chí Minh', 'Quận 1', 'Quận 1, Hồ Chí Minh'),
  ('Hồ Chí Minh', 'Quận 3', 'Quận 3, Hồ Chí Minh'),
  ('Hồ Chí Minh', 'Quận 7', 'Quận 7, Hồ Chí Minh'),
  ('Hồ Chí Minh', 'Bình Thạnh', 'Bình Thạnh, Hồ Chí Minh'),
  ('Đà Nẵng', 'Hải Châu', 'Hải Châu, Đà Nẵng'),
  ('Đà Nẵng', 'Thanh Khê', 'Thanh Khê, Đà Nẵng')
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. INSERT COMPANIES
-- ============================================

-- Get industry and location IDs for reference
DO $$
DECLARE
  tech_industry_id UUID;
  finance_industry_id UUID;
  design_industry_id UUID;
  education_industry_id UUID;
  
  hanoi_thanh_xuan_id UUID;
  hanoi_cau_giay_id UUID;
  hcm_q1_id UUID;
  hcm_q7_id UUID;
BEGIN
  -- Get industry IDs
  SELECT id INTO tech_industry_id FROM public.industries WHERE name = 'technology';
  SELECT id INTO finance_industry_id FROM public.industries WHERE name = 'finance';
  SELECT id INTO design_industry_id FROM public.industries WHERE name = 'design';
  SELECT id INTO education_industry_id FROM public.industries WHERE name = 'education';
  
  -- Get location IDs
  SELECT id INTO hanoi_thanh_xuan_id FROM public.locations WHERE city = 'Hà Nội' AND district = 'Thanh Xuân';
  SELECT id INTO hanoi_cau_giay_id FROM public.locations WHERE city = 'Hà Nội' AND district = 'Cầu Giấy';
  SELECT id INTO hcm_q1_id FROM public.locations WHERE city = 'Hồ Chí Minh' AND district = 'Quận 1';
  SELECT id INTO hcm_q7_id FROM public.locations WHERE city = 'Hồ Chí Minh' AND district = 'Quận 7';

  -- Insert companies
  INSERT INTO public.companies (name, short_name, description, employee_count, industry_id, headquarters_location_id, website, email, phone, verified, founded_year) VALUES
    (
      'CÔNG TY CỔ PHẦN CÔNG NGHỆ ONUSLAB',
      'ONUS Labs',
      'ONUS Labs là công ty công nghệ blockchain hàng đầu Việt Nam, chuyên phát triển các giải pháp tài chính kỹ thuật số và ví điện tử.',
      '25 nhân viên',
      finance_industry_id,
      hanoi_thanh_xuan_id,
      'https://onuslab.com',
      'hr@onuslab.com',
      '024-1234-5678',
      true,
      2020
    ),
    (
      'CÔNG TY CỔ PHẦN SMARTOSC',
      'SmartOSC',
      'SmartOSC là đối tác hàng đầu về thương mại điện tử và chuyển đổi số, cung cấp các giải pháp công nghệ toàn diện.',
      '500-1000 nhân viên',
      tech_industry_id,
      hcm_q1_id,
      'https://smartosc.com',
      'careers@smartosc.com',
      '028-9876-5432',
      true,
      2006
    ),
    (
      'Ngân Hàng Thương Mại Cổ Phần Thịnh Vượng Và Phát Triển',
      'VPBank',
      'VPBank là ngân hàng thương mại cổ phần hàng đầu Việt Nam với mạng lưới chi nhánh rộng khắp cả nước.',
      '10000+ nhân viên',
      finance_industry_id,
      hanoi_cau_giay_id,
      'https://vpbank.com.vn',
      'tuyendung@vpbank.com.vn',
      '1900-545-422',
      true,
      1993
    ),
    (
      'Công Ty TNHH MTV Phong Việt',
      'Phong Việt',
      'Chuyên về sản xuất và kinh doanh nội thất, thiết kế 3D và thi công công trình.',
      '50-100 nhân viên',
      design_industry_id,
      hanoi_thanh_xuan_id,
      'https://phongviet.vn',
      'hr@phongviet.vn',
      '024-3456-7890',
      true,
      2015
    ),
    (
      'CÔNG TY CỔ PHẦN CÔNG NGHỆ SMART SCORE',
      'Smart Score',
      'Smart Score cung cấp các giải pháp đánh giá và quản lý hiệu suất dựa trên AI và Big Data.',
      '100-200 nhân viên',
      tech_industry_id,
      hcm_q7_id,
      'https://smartscore.vn',
      'contact@smartscore.vn',
      '028-1234-5678',
      true,
      2018
    ),
    (
      'CÔNG TY TNHH ATEC SYSTEM VIỆT NAM',
      'ATEC System',
      'Chuyên cung cấp giải pháp hệ thống IT và dịch vụ tư vấn công nghệ cho doanh nghiệp.',
      '50-100 nhân viên',
      tech_industry_id,
      hanoi_cau_giay_id,
      'https://atecsystem.vn',
      'recruitment@atecsystem.vn',
      '024-9876-5432',
      true,
      2012
    ),
    (
      'CÔNG TY TNHH MTV ABN INNOVATION',
      'ABN Innovation',
      'Công ty chuyên về phát triển phần mềm, security và giải pháp GRC (Governance, Risk, Compliance).',
      '200-500 nhân viên',
      tech_industry_id,
      hcm_q1_id,
      'https://abninnovation.com',
      'jobs@abninnovation.com',
      '028-2468-1357',
      true,
      2010
    ),
    (
      'CÔNG TY TNHH EVSELAB',
      'EVSELAB',
      'Chuyên nghiên cứu và phát triển các giải pháp sạc điện cho xe điện và công nghệ IoT.',
      '30-50 nhân viên',
      tech_industry_id,
      hanoi_thanh_xuan_id,
      'https://evselab.com',
      'hr@evselab.com',
      '024-5555-6666',
      true,
      2019
    ),
    (
      'CÔNG TY TNHH BORDER Z VIETNAM',
      'Border Z',
      'Công ty phần mềm Nhật Bản chuyên phát triển các sản phẩm công nghệ cao và offshore development.',
      '100-200 nhân viên',
      tech_industry_id,
      hcm_q1_id,
      'https://borderz.vn',
      'recruit@borderz.vn',
      '028-7777-8888',
      true,
      2016
    ),
    (
      'Công ty CP Giải pháp Thanh toán Việt',
      'VietPay Solutions',
      'Cung cấp giải pháp thanh toán điện tử, ví điện tử và gateway payment.',
      '200-300 nhân viên',
      finance_industry_id,
      hanoi_cau_giay_id,
      'https://vietpay.vn',
      'career@vietpay.vn',
      '024-3333-4444',
      true,
      2014
    ),
    (
      'Trường Đại học CMC',
      'CMC University',
      'Trường đại học chuyên đào tạo công nghệ thông tin, an ninh mạng và khoa học dữ liệu.',
      '100-200 nhân viên',
      education_industry_id,
      hanoi_thanh_xuan_id,
      'https://cmcuni.edu.vn',
      'tuyendung@cmcuni.edu.vn',
      '024-9999-8888',
      true,
      2017
    )
  ON CONFLICT DO NOTHING;

END $$;

-- ============================================
-- 4. INSERT JOBS
-- ============================================

DO $$
DECLARE
  company_onuslab_id UUID;
  company_smartosc_id UUID;
  company_vpbank_id UUID;
  company_phongviet_id UUID;
  company_smartscore_id UUID;
  company_atec_id UUID;
  company_abn_id UUID;
  company_evselab_id UUID;
  company_borderz_id UUID;
  company_vietpay_id UUID;
  company_cmc_id UUID;
  
  loc_hanoi_id UUID;
  loc_hcm_id UUID;
BEGIN
  -- Get company IDs
  SELECT id INTO company_onuslab_id FROM public.companies WHERE short_name = 'ONUS Labs';
  SELECT id INTO company_smartosc_id FROM public.companies WHERE short_name = 'SmartOSC';
  SELECT id INTO company_vpbank_id FROM public.companies WHERE short_name = 'VPBank';
  SELECT id INTO company_phongviet_id FROM public.companies WHERE short_name = 'Phong Việt';
  SELECT id INTO company_smartscore_id FROM public.companies WHERE short_name = 'Smart Score';
  SELECT id INTO company_atec_id FROM public.companies WHERE short_name = 'ATEC System';
  SELECT id INTO company_abn_id FROM public.companies WHERE short_name = 'ABN Innovation';
  SELECT id INTO company_evselab_id FROM public.companies WHERE short_name = 'EVSELAB';
  SELECT id INTO company_borderz_id FROM public.companies WHERE short_name = 'Border Z';
  SELECT id INTO company_vietpay_id FROM public.companies WHERE short_name = 'VietPay Solutions';
  SELECT id INTO company_cmc_id FROM public.companies WHERE short_name = 'CMC University';
  
  -- Get location IDs
  SELECT id INTO loc_hanoi_id FROM public.locations WHERE city = 'Hà Nội' LIMIT 1;
  SELECT id INTO loc_hcm_id FROM public.locations WHERE city = 'Hồ Chí Minh' LIMIT 1;

  -- Insert jobs
  INSERT INTO public.jobs (
    company_id, title, description, requirements, benefits, responsibilities,
    salary_min, salary_max, salary_display, location_id, work_type, work_mode,
    experience_level, education_level, positions_available, required_skills,
    status, published_at, expires_at
  ) VALUES
    -- Job 1: UI/UX Designer
    (
      company_onuslab_id,
      'UI/UX Designer (Web/Mobile App)',
      'Chúng tôi đang tìm kiếm UI/UX Designer tài năng để tham gia thiết kế các sản phẩm fintech sáng tạo. Bạn sẽ được làm việc với đội ngũ trẻ trung, năng động và có cơ hội phát triển kỹ năng thiết kế chuyên nghiệp.',
      E'- Tốt nghiệp chuyên ngành Thiết kế đồ họa, Mỹ thuật hoặc tương đương\n- Ít nhất 1 năm kinh nghiệm làm UI/UX Designer\n- Thành thạo Figma, Adobe XD, Sketch\n- Có kiến thức về HTML/CSS là lợi thế\n- Kỹ năng giao tiếp tốt, tinh thần trách nhiệm cao',
      E'- Lương cạnh tranh 7-12 triệu + thưởng theo dự án\n- Tăng lương định kỳ 2 lần/năm\n- Bảo hiểm đầy đủ theo luật\n- Du lịch hàng năm, teambuilding\n- Môi trường làm việc trẻ trung, năng động',
      E'- Thiết kế giao diện web và mobile app\n- Tạo wireframe, prototype, mockup\n- Nghiên cứu UX và tối ưu trải nghiệm người dùng\n- Phối hợp với đội ngũ developer để hiện thực hóa thiết kế',
      7000000,
      12000000,
      '7-12 triệu',
      loc_hanoi_id,
      'Full-time',
      'Hybrid',
      'Junior',
      'Bachelor',
      2,
      '["Figma", "Adobe XD", "UI Design", "UX Research", "Prototyping"]'::jsonb,
      'active',
      NOW(),
      NOW() + INTERVAL '30 days'
    ),
    -- Job 2: Windows Trading System Developer
    (
      company_smartosc_id,
      'Home Trading System Developer - Windows',
      'Phát triển hệ thống giao dịch chứng khoán trên nền tảng Windows. Yêu cầu có kinh nghiệm về C++, .NET và kiến thức về thị trường chứng khoán.',
      E'- Tốt nghiệp Đại học chuyên ngành CNTT\n- 3+ năm kinh nghiệm lập trình C++/C#\n- Có kinh nghiệm với WPF, WinForms\n- Hiểu biết về thị trường chứng khoán là lợi thế\n- Khả năng đọc hiểu tài liệu tiếng Anh tốt',
      E'- Lương 22-45 triệu\n- Thưởng dự án, tháng 13\n- Làm việc với công nghệ hiện đại\n- Cơ hội thăng tiến rõ ràng\n- Team building, du lịch',
      E'- Phát triển và maintain hệ thống trading\n- Tích hợp API với sàn chứng khoán\n- Optimize performance và bảo mật\n- Code review và mentor junior',
      22000000,
      45000000,
      '22 - 45 triệu',
      loc_hcm_id,
      'Full-time',
      'On-site',
      'Senior',
      'Bachelor',
      1,
      '["C++", "C#", ".NET", "WPF", "Financial Systems", "Trading Systems"]'::jsonb,
      'active',
      NOW(),
      NOW() + INTERVAL '45 days'
    ),
    -- Job 3: Senior App Developer
    (
      company_vpbank_id,
      'Chuyên Viên Cao Cấp Phát Triển Ứng Dụng',
      'Phát triển các ứng dụng mobile banking cho hàng triệu người dùng. Tham gia vào các dự án digital transformation lớn của ngân hàng.',
      E'- Đại học chuyên ngành CNTT\n- 5+ năm kinh nghiệm mobile development\n- Thành thạo iOS (Swift) hoặc Android (Kotlin)\n- Có kinh nghiệm với React Native/Flutter\n- Kinh nghiệm làm việc với banking/fintech',
      E'- Lương 7-12 triệu VND + bonus\n- Chế độ đãi ngộ tốt của ngân hàng\n- Bảo hiểm cao cấp\n- Đào tạo chuyên sâu\n- Môi trường chuyên nghiệp',
      E'- Phát triển tính năng mới cho app\n- Đảm bảo performance và security\n- Review code và mentor team\n- Làm việc với các team khác',
      7000000,
      12000000,
      '7-12 triệu',
      loc_hanoi_id,
      'Full-time',
      'On-site',
      'Senior',
      'Bachelor',
      3,
      '["iOS", "Android", "Swift", "Kotlin", "React Native", "Mobile Security"]'::jsonb,
      'active',
      NOW(),
      NOW() + INTERVAL '60 days'
    ),
    -- Job 4: 3D Designer
    (
      company_phongviet_id,
      'Nhân Viên Thiết Kế 3D - 1 Năm Kinh Nghiệm',
      'Thiết kế 3D cho các dự án nội thất, kiến trúc. Môi trường làm việc sáng tạo với nhiều dự án thú vị.',
      E'- Tốt nghiệp chuyên ngành liên quan\n- 1 năm kinh nghiệm thiết kế 3D\n- Thành thạo 3ds Max, SketchUp, V-Ray\n- Có khả năng render ảnh chất lượng cao\n- Yêu thích thiết kế nội thất',
      E'- Lương 7-12 triệu\n- Thưởng theo dự án\n- Tăng lương theo năng lực\n- Được đào tạo kỹ năng\n- Môi trường sáng tạo',
      E'- Thiết kế 3D nội thất, kiến trúc\n- Render hình ảnh chất lượng cao\n- Phối hợp với kiến trúc sư\n- Chỉnh sửa theo yêu cầu khách hàng',
      7000000,
      12000000,
      '7-12 triệu',
      loc_hanoi_id,
      'Full-time',
      'On-site',
      'Junior',
      'Associate',
      2,
      '["3ds Max", "SketchUp", "V-Ray", "AutoCAD", "3D Rendering"]'::jsonb,
      'active',
      NOW(),
      NOW() + INTERVAL '30 days'
    ),
    -- Job 5: UI/UX Designer (Smart Score)
    (
      company_smartscore_id,
      'UI/UX Designer (Web/Mobile App)',
      'Thiết kế các sản phẩm AI-powered analytics. Làm việc với công nghệ tiên tiến và đội ngũ chuyên nghiệp.',
      E'- 2+ năm kinh nghiệm UI/UX\n- Portfolio ấn tượng\n- Thành thạo Figma, Adobe suite\n- Hiểu về design system\n- Có kinh nghiệm B2B product',
      E'- Lương 7-12 triệu\n- Bonus theo performance\n- Flexible working time\n- Modern workspace\n- Learning budget',
      E'- Thiết kế product từ A-Z\n- Tạo design system\n- User research và testing\n- Collaborate với team',
      7000000,
      12000000,
      '7-12 triệu',
      loc_hcm_id,
      'Full-time',
      'Hybrid',
      'Mid',
      'Bachelor',
      1,
      '["Figma", "UI/UX", "Design System", "User Research", "Prototyping"]'::jsonb,
      'active',
      NOW(),
      NOW() + INTERVAL '30 days'
    ),
    -- Job 6: IT Staff
    (
      company_atec_id,
      'Nhân Viên IT',
      'Hỗ trợ IT cho công ty, quản lý hệ thống mạng và thiết bị. Phù hợp cho người mới bắt đầu sự nghiệp IT.',
      E'- Tốt nghiệp CĐ/ĐH CNTT\n- Có kinh nghiệm IT support\n- Biết về network, hardware\n- Khả năng troubleshooting tốt\n- Cẩn thận, trách nhiệm',
      E'- Lương 7-12 triệu\n- Training on job\n- Career path rõ ràng\n- Team friendly\n- Insurance đầy đủ',
      E'- Support user về IT\n- Quản lý thiết bị, mạng\n- Maintenance hệ thống\n- Document process',
      7000000,
      12000000,
      '7-12 triệu',
      loc_hanoi_id,
      'Full-time',
      'On-site',
      'Junior',
      'Associate',
      1,
      '["IT Support", "Network", "Windows Server", "Troubleshooting"]'::jsonb,
      'active',
      NOW(),
      NOW() + INTERVAL '30 days'
    ),
    -- Job 7: GRC Analyst
    (
      company_abn_id,
      'GRC Analyst (Governance, Risk, Compliance)',
      'Phân tích và đảm bảo tuân thủ các tiêu chuẩn bảo mật, quản trị rủi ro cho doanh nghiệp.',
      E'- Đại học chuyên ngành liên quan\n- 2+ năm kinh nghiệm GRC\n- Hiểu về ISO 27001, SOC 2\n- Có certification (CISA, CISM) là lợi thế\n- Tiếng Anh tốt',
      E'- Lương 7-12 triệu\n- Bonus năm\n- Sponsored certification\n- Professional environment\n- Career growth',
      E'- Audit compliance\n- Risk assessment\n- Policy development\n- Training staff',
      7000000,
      12000000,
      '7-12 triệu',
      loc_hcm_id,
      'Full-time',
      'Hybrid',
      'Mid',
      'Bachelor',
      1,
      '["GRC", "ISO 27001", "Risk Management", "Compliance", "Audit"]'::jsonb,
      'active',
      NOW(),
      NOW() + INTERVAL '45 days'
    ),
    -- Job 8: Embedded Firmware Engineer
    (
      company_evselab_id,
      'Kỹ Sư Lập Trình Nhúng Firmware Điện Tử',
      'Phát triển firmware cho các thiết bị sạc xe điện. Công việc thú vị với công nghệ xanh.',
      E'- Đại học điện tử, tự động hóa\n- 2+ năm embedded programming\n- Thành thạo C/C++\n- Kinh nghiệm với MCU, RTOS\n- Am hiểu điện tử công suất',
      E'- Lương 7-12 triệu\n- Làm công nghệ mới\n- Đào tạo chuyên sâu\n- Team passionate\n- Modern lab',
      E'- Develop firmware cho EV charger\n- Test và debug\n- Optimize performance\n- Document code',
      7000000,
      12000000,
      '7-12 triệu',
      loc_hanoi_id,
      'Full-time',
      'On-site',
      'Mid',
      'Bachelor',
      2,
      '["C/C++", "Embedded", "Firmware", "RTOS", "MCU", "Power Electronics"]'::jsonb,
      'active',
      NOW(),
      NOW() + INTERVAL '30 days'
    ),
    -- Job 9: IT Security Manager
    (
      company_smartosc_id,
      'IT Security Manager',
      'Quản lý an ninh mạng cho công ty, đảm bảo bảo mật thông tin và hệ thống.',
      E'- Đại học CNTT/An toàn thông tin\n- 5+ năm security experience\n- Có certificate CISSP, CEH\n- Kinh nghiệm quản lý team\n- Tiếng Anh thành thạo',
      E'- Lương 7-12 triệu\n- Leadership role\n- Bonus attractive\n- International environment\n- Career advancement',
      E'- Manage security team\n- Implement security policy\n- Incident response\n- Security audit',
      7000000,
      12000000,
      '7-12 triệu',
      loc_hcm_id,
      'Full-time',
      'On-site',
      'Lead',
      'Bachelor',
      1,
      '["Information Security", "CISSP", "CEH", "Security Management", "Incident Response"]'::jsonb,
      'active',
      NOW(),
      NOW() + INTERVAL '60 days'
    ),
    -- Job 10: BrSE / Product Manager
    (
      company_borderz_id,
      'BrSE / Product Manager',
      'Bridge SE làm việc với khách hàng Nhật, quản lý sản phẩm và điều phối team.',
      E'- Đại học CNTT\n- 3+ năm BrSE/PM\n- Tiếng Nhật N2 trở lên\n- Có kinh nghiệm offshore\n- Leadership skill',
      E'- Lương 7-12 triệu\n- Onsite Nhật Bản\n- Japanese training\n- Premium insurance\n- Bonus attractive',
      E'- Bridge với khách Nhật\n- Manage product backlog\n- Lead development team\n- Quality control',
      7000000,
      12000000,
      '7-12 triệu',
      loc_hcm_id,
      'Full-time',
      'Hybrid',
      'Senior',
      'Bachelor',
      2,
      '["BrSE", "Japanese N2", "Product Management", "Agile", "Offshore"]'::jsonb,
      'active',
      NOW(),
      NOW() + INTERVAL '45 days'
    ),
    -- Job 11: iOS Developer
    (
      company_vietpay_id,
      'Lập Trình Viên IOS (Swift, Objective-C)',
      'Phát triển ứng dụng thanh toán di động cho hàng triệu người dùng.',
      E'- 3+ năm iOS development\n- Thành thạo Swift, Objective-C\n- Kinh nghiệm payment gateway\n- Hiểu về security\n- App Store deployment',
      E'- Lương 7-12 triệu\n- Bonus performance\n- Fintech experience\n- Modern tech stack\n- Health insurance',
      E'- Develop iOS app\n- Integrate payment APIs\n- Unit testing\n- Code review',
      7000000,
      12000000,
      '7-12 triệu',
      loc_hanoi_id,
      'Full-time',
      'Hybrid',
      'Senior',
      'Bachelor',
      2,
      '["iOS", "Swift", "Objective-C", "Payment Integration", "Mobile Security"]'::jsonb,
      'active',
      NOW(),
      NOW() + INTERVAL '30 days'
    ),
    -- Job 12: IT Lecturer
    (
      company_cmc_id,
      'Giảng Viên Công Nghệ Thông Tin/ Khoa Học Máy Tính',
      'Giảng dạy các môn CNTT cho sinh viên đại học. Môi trường giáo dục hiện đại.',
      E'- Thạc sĩ CNTT trở lên\n- Kinh nghiệm giảng dạy\n- Có kinh nghiệm thực tế\n- Kỹ năng trình bày tốt\n- Passion for education',
      E'- Lương 7-12 triệu\n- Stable job\n- Academic environment\n- Research opportunities\n- Benefits full',
      E'- Giảng dạy môn CNTT\n- Soạn giáo trình\n- Hướng dẫn đồ án\n- Nghiên cứu khoa học',
      7000000,
      12000000,
      '7-12 triệu',
      loc_hanoi_id,
      'Full-time',
      'On-site',
      'Mid',
      'Master',
      3,
      '["Teaching", "Computer Science", "Programming", "Research", "Curriculum Development"]'::jsonb,
      'active',
      NOW(),
      NOW() + INTERVAL '60 days'
    );

END $$;

-- ============================================
-- 5. VERIFY DATA
-- ============================================

-- Count records
DO $$
BEGIN
  RAISE NOTICE 'Industries: %', (SELECT COUNT(*) FROM public.industries);
  RAISE NOTICE 'Locations: %', (SELECT COUNT(*) FROM public.locations);
  RAISE NOTICE 'Companies: %', (SELECT COUNT(*) FROM public.companies);
  RAISE NOTICE 'Jobs: %', (SELECT COUNT(*) FROM public.jobs);
END $$;
