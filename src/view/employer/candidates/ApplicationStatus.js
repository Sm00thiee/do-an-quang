import React, { useState } from 'react';
import { BsCheckCircle, BsCircle, BsClock, BsXCircle } from 'react-icons/bs';
import './ApplicationStatus.css';

const APPLICATION_STAGES = [
    { id: 'applied', label: 'Đã ứng tuyển', icon: BsCircle },
    { id: 'resume_review', label: 'Duyệt hồ sơ', icon: BsClock },
    { id: 'interview', label: 'Phỏng vấn', icon: BsClock },
    { id: 'offer', label: 'Đề nghị', icon: BsClock },
    { id: 'hired', label: 'Đã tuyển', icon: BsCheckCircle },
    { id: 'rejected', label: 'Từ chối', icon: BsXCircle }
];

function ApplicationStatus({ application, onStatusChange }) {
    const [currentStage, setCurrentStage] = useState(application?.status || 'applied');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [notes, setNotes] = useState('');

    const handleStatusChange = async (newStatus) => {
        try {
            if (onStatusChange) {
                await onStatusChange(application.id, newStatus, notes);
            }
            setCurrentStage(newStatus);
            setShowStatusModal(false);
            setNotes('');
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Có lỗi xảy ra khi cập nhật trạng thái');
        }
    };

    const getStageStatus = (stageId) => {
        const stages = ['applied', 'resume_review', 'interview', 'offer', 'hired'];
        const rejectedStages = ['applied', 'resume_review', 'interview', 'rejected'];
        
        if (currentStage === 'rejected') {
            const rejectedIndex = rejectedStages.indexOf('rejected');
            const stageIndex = rejectedStages.indexOf(stageId);
            if (stageIndex < rejectedIndex) return 'completed';
            if (stageIndex === rejectedIndex) return 'rejected';
            return 'pending';
        }
        
        const currentIndex = stages.indexOf(currentStage);
        const stageIndex = stages.indexOf(stageId);
        
        if (stageIndex < currentIndex) return 'completed';
        if (stageIndex === currentIndex) return 'active';
        return 'pending';
    };

    const getStatusIcon = (stage) => {
        const status = getStageStatus(stage.id);
        const IconComponent = stage.icon;
        
        return (
            <div className={`status-icon ${status}`}>
                <IconComponent />
            </div>
        );
    };

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="application-status-container">
            <div className="status-header">
                <h3>Tiến trình ứng tuyển</h3>
                <button 
                    className="btn-change-status"
                    onClick={() => setShowStatusModal(true)}
                >
                    Cập nhật trạng thái
                </button>
            </div>

            <div className="status-timeline">
                {APPLICATION_STAGES.filter(stage => 
                    currentStage === 'rejected' 
                        ? ['applied', 'resume_review', 'interview', 'rejected'].includes(stage.id)
                        : stage.id !== 'rejected'
                ).map((stage, index, array) => (
                    <div key={stage.id} className="timeline-item">
                        <div className="timeline-node">
                            {getStatusIcon(stage)}
                            {index < array.length - 1 && (
                                <div className={`timeline-line ${
                                    getStageStatus(array[index + 1].id) !== 'pending' ? 'completed' : ''
                                }`} />
                            )}
                        </div>
                        <div className="timeline-content">
                            <div className={`timeline-label ${getStageStatus(stage.id)}`}>
                                {stage.label}
                            </div>
                            {application?.statusHistory?.[stage.id] && (
                                <div className="timeline-date">
                                    {formatDate(application.statusHistory[stage.id])}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {application?.timeline && application.timeline.length > 0 && (
                <div className="status-history">
                    <h4>Lịch sử thay đổi</h4>
                    <div className="history-list">
                        {application.timeline.map((item, index) => (
                            <div key={index} className="history-item">
                                <div className="history-dot"></div>
                                <div className="history-content">
                                    <div className="history-action">{item.action}</div>
                                    <div className="history-date">{formatDate(item.date)}</div>
                                    {item.notes && <div className="history-notes">{item.notes}</div>}
                                    <div className="history-user">Bởi: {item.user || 'Hệ thống'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showStatusModal && (
                <div className="status-modal-overlay" onClick={() => setShowStatusModal(false)}>
                    <div className="status-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Cập nhật trạng thái ứng tuyển</h3>
                            <button 
                                className="modal-close"
                                onClick={() => setShowStatusModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Chọn trạng thái mới</label>
                                <div className="status-options">
                                    {APPLICATION_STAGES.map(stage => (
                                        <button
                                            key={stage.id}
                                            className={`status-option ${currentStage === stage.id ? 'active' : ''}`}
                                            onClick={() => handleStatusChange(stage.id)}
                                        >
                                            <stage.icon />
                                            <span>{stage.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Ghi chú (không bắt buộc)</label>
                                <textarea
                                    className="form-textarea"
                                    rows="4"
                                    placeholder="Thêm ghi chú về quyết định này..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn-secondary"
                                onClick={() => setShowStatusModal(false)}
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ApplicationStatus;
