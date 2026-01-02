import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BsEye,
    BsTrash
} from 'react-icons/bs';
import './CandidateManagement.css';

function CandidateManagement() {
    const navigate = useNavigate();
    const [loading] = useState(false);
    const [page, setPage] = useState(0);
    const itemsPerPage = 10;

    // Extended mock data - 25 candidates for realistic pagination
    const allCandidates = [
        { id: 1, name: 'Bailey Dupont', email: 'bailey.dupont@example.com', phone: '0912345678', position: 'FrontEnd Technical Lead', status: 'new', appliedDate: '2024-01-15' },
        { id: 2, name: 'Harumi Kobayashi', email: 'harumi.k@example.com', phone: '0987654321', position: 'Mobile Developer', status: 'approved', appliedDate: '2024-01-14' },
        { id: 3, name: 'Nguyễn Văn An', email: 'nguyenvanan@example.com', phone: '0901234567', position: 'Senior ReactJS Developer', status: 'new', appliedDate: '2024-01-13' },
        { id: 4, name: 'Trần Thị Bình', email: 'tranthib@example.com', phone: '0909876543', position: 'Digital Marketing Manager', status: 'rejected', appliedDate: '2024-01-12' },
        { id: 5, name: 'Lê Minh Cường', email: 'leminhcuong@example.com', phone: '0912312345', position: 'FrontEnd Technical Lead', status: 'approved', appliedDate: '2024-01-11' },
        { id: 6, name: 'Phạm Thu Hương', email: 'phamhuong@example.com', phone: '0938765432', position: 'Backend Developer', status: 'new', appliedDate: '2024-01-10' },
        { id: 7, name: 'Hoàng Văn Đức', email: 'hoangduc@example.com', phone: '0945678901', position: 'DevOps Engineer', status: 'approved', appliedDate: '2024-01-09' },
        { id: 8, name: 'Vũ Thị Mai', email: 'vumai@example.com', phone: '0956789012', position: 'UI/UX Designer', status: 'new', appliedDate: '2024-01-08' },
        { id: 9, name: 'Đỗ Minh Tuấn', email: 'dominhtuan@example.com', phone: '0967890123', position: 'QA Engineer', status: 'rejected', appliedDate: '2024-01-07' },
        { id: 10, name: 'Bùi Thảo Nguyên', email: 'buinguyen@example.com', phone: '0978901234', position: 'Product Manager', status: 'approved', appliedDate: '2024-01-06' },
        { id: 11, name: 'Trương Quốc Anh', email: 'truonganh@example.com', phone: '0989012345', position: 'Full Stack Developer', status: 'new', appliedDate: '2024-01-05' },
        { id: 12, name: 'Lý Hồng Vân', email: 'lyvan@example.com', phone: '0990123456', position: 'Data Analyst', status: 'new', appliedDate: '2024-01-04' },
        { id: 13, name: 'Đinh Tuấn Kiệt', email: 'dinhkiet@example.com', phone: '0901234568', position: 'System Admin', status: 'approved', appliedDate: '2024-01-03' },
        { id: 14, name: 'Ngô Lan Anh', email: 'ngoanh@example.com', phone: '0912345679', position: 'Content Writer', status: 'new', appliedDate: '2024-01-02' },
        { id: 15, name: 'Võ Đức Thắng', email: 'vothang@example.com', phone: '0923456780', position: 'Sales Executive', status: 'rejected', appliedDate: '2024-01-01' },
        { id: 16, name: 'Cao Thị Hạnh', email: 'caohanh@example.com', phone: '0934567891', position: 'HR Manager', status: 'approved', appliedDate: '2026-12-31' },
        { id: 17, name: 'Dương Minh Quân', email: 'duongquan@example.com', phone: '0945678902', position: 'Business Analyst', status: 'new', appliedDate: '2026-12-30' },
        { id: 18, name: 'Tô Thị Lan', email: 'tolan@example.com', phone: '0956789013', position: 'Graphic Designer', status: 'new', appliedDate: '2026-12-29' },
        { id: 19, name: 'Mai Hoàng Long', email: 'mailong@example.com', phone: '0967890124', position: 'Network Engineer', status: 'approved', appliedDate: '2026-12-28' },
        { id: 20, name: 'Phan Văn Hải', email: 'phanhai@example.com', phone: '0978901235', position: 'Security Specialist', status: 'new', appliedDate: '2026-12-27' },
        { id: 21, name: 'Lâm Thị Xuân', email: 'lamxuan@example.com', phone: '0989012346', position: 'Project Coordinator', status: 'rejected', appliedDate: '2026-12-26' },
        { id: 22, name: 'Chu Minh Hải', email: 'chuhai@example.com', phone: '0990123457', position: 'Software Tester', status: 'approved', appliedDate: '2026-12-25' },
        { id: 23, name: 'Quách Thị Hoa', email: 'quachhoa@example.com', phone: '0901234569', position: 'Customer Support', status: 'new', appliedDate: '2026-12-24' },
        { id: 24, name: 'Tăng Văn Phong', email: 'tangphong@example.com', phone: '0912345670', position: 'SEO Specialist', status: 'new', appliedDate: '2026-12-23' },
        { id: 25, name: 'Huỳnh Thị Ngọc', email: 'huynhngoc@example.com', phone: '0923456781', position: 'Social Media Manager', status: 'approved', appliedDate: '2026-12-22' }
    ];

    // Calculate pagination
    const totalPages = Math.ceil(allCandidates.length / itemsPerPage);
    const startIndex = page * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const candidates = allCandidates.slice(startIndex, endIndex);

    const handleViewDetail = (candidateId) => {
        console.log('View candidate:', candidateId);
    };

    const handleDelete = (candidateId) => {
        if (window.confirm('Bạn có chắc muốn xóa hồ sơ này?')) {
            console.log('Delete candidate:', candidateId);
            alert('Xóa hồ sơ thành công (Mock)');
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            new: { label: 'Mới', className: 'new' },
            approved: { label: 'Đã duyệt', className: 'approved' },
            rejected: { label: 'Từ chối', className: 'rejected' }
        };

        const statusInfo = statusMap[status] || statusMap.new;

        return (
            <span className={`candidate-status-badge ${statusInfo.className}`}>
                {statusInfo.label}
            </span>
        );
    };

    return (
        <div className="candidate-container">
            <div className="candidate-header">
                <div>
                    <h1 className="candidate-title">Quản lý hồ sơ ứng viên</h1>
                </div>
            </div>

            <div className="candidates-table-container">
                {loading ? (
                    <div className="candidate-loading-container">
                        <div className="candidate-spinner"></div>
                    </div>
                ) : candidates.length > 0 ? (
                    <>
                        <table className="candidates-table">
                            <thead>
                                <tr>
                                    <th>Họ và tên</th>
                                    <th>Email</th>
                                    <th>Số điện thoại</th>
                                    <th>Vị trí ứng tuyển</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidates.map((candidate) => (
                                    <tr key={candidate.id}>
                                        <td>
                                            <div
                                                className="candidate-name-cell"
                                                onClick={() => handleViewDetail(candidate.id)}
                                            >
                                                {candidate.name}
                                            </div>
                                        </td>
                                        <td>{candidate.email}</td>
                                        <td>{candidate.phone}</td>
                                        <td>{candidate.position}</td>
                                        <td>
                                            {getStatusBadge(candidate.status)}
                                        </td>
                                        <td>
                                            <div className="candidate-action-buttons">
                                                <button
                                                    className="candidate-action-btn"
                                                    onClick={() => handleViewDetail(candidate.id)}
                                                    title="Xem chi tiết"
                                                >
                                                    <BsEye />
                                                </button>
                                                <button
                                                    className="candidate-action-btn delete"
                                                    onClick={() => handleDelete(candidate.id)}
                                                    title="Xóa"
                                                >
                                                    <BsTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Real Pagination */}
                        {totalPages > 1 && (
                            <div className="candidate-pagination-container">
                                <div className="candidate-pagination-info">
                                    Hiển thị {startIndex + 1}-{Math.min(endIndex, allCandidates.length)} trong {allCandidates.length} ứng viên
                                </div>
                                <div className="candidate-pagination-buttons">
                                    <button
                                        className="candidate-pagination-btn"
                                        disabled={page === 0}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        &lt;
                                    </button>
                                    {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = idx;
                                        } else if (page < 3) {
                                            pageNum = idx;
                                        } else if (page > totalPages - 4) {
                                            pageNum = totalPages - 5 + idx;
                                        } else {
                                            pageNum = page - 2 + idx;
                                        }

                                        if (pageNum < 0 || pageNum >= totalPages) return null;

                                        return (
                                            <button
                                                key={pageNum}
                                                className={`candidate-pagination-btn ${page === pageNum ? 'active' : ''}`}
                                                onClick={() => setPage(pageNum)}
                                            >
                                                {pageNum + 1}
                                            </button>
                                        );
                                    })}
                                    <button
                                        className="candidate-pagination-btn"
                                        disabled={page === totalPages - 1}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        &gt;
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="candidate-empty-state">
                        <div className="candidate-empty-icon">👥</div>
                        <h3 className="candidate-empty-title">Chưa có ứng viên nào</h3>
                        <p className="candidate-empty-description">
                            Danh sách ứng viên sẽ hiển thị ở đây
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CandidateManagement;
