import React, { useState } from 'react';
import { BsCalendar3, BsClock, BsGeoAlt, BsPerson, BsX, BsPlus } from 'react-icons/bs';
import './InterviewScheduler.css';

function InterviewScheduler({ candidate, onSchedule, onClose }) {
    const [interviewData, setInterviewData] = useState({
        date: '',
        time: '',
        duration: '60',
        location: 'online',
        customLocation: '',
        interviewers: [''],
        notes: '',
        meetingLink: ''
    });

    const handleAddInterviewer = () => {
        setInterviewData({
            ...interviewData,
            interviewers: [...interviewData.interviewers, '']
        });
    };

    const handleRemoveInterviewer = (index) => {
        const newInterviewers = interviewData.interviewers.filter((_, i) => i !== index);
        setInterviewData({
            ...interviewData,
            interviewers: newInterviewers
        });
    };

    const handleInterviewerChange = (index, value) => {
        const newInterviewers = [...interviewData.interviewers];
        newInterviewers[index] = value;
        setInterviewData({
            ...interviewData,
            interviewers: newInterviewers
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!interviewData.date || !interviewData.time) {
            alert('Vui lòng chọn ngày và giờ phỏng vấn');
            return;
        }

        if (interviewData.location === 'custom' && !interviewData.customLocation) {
            alert('Vui lòng nhập địa điểm phỏng vấn');
            return;
        }

        try {
            if (onSchedule) {
                await onSchedule({
                    ...interviewData,
                    candidateId: candidate?.id,
                    candidateName: candidate?.name,
                    candidateEmail: candidate?.email
                });
            }
            alert('Đã lên lịch phỏng vấn thành công');
            if (onClose) onClose();
        } catch (error) {
            console.error('Error scheduling interview:', error);
            alert('Có lỗi xảy ra khi lên lịch phỏng vấn');
        }
    };

    return (
        <div className="interview-scheduler-overlay" onClick={onClose}>
            <div className="interview-scheduler-modal" onClick={(e) => e.stopPropagation()}>
                <div className="scheduler-header">
                    <div>
                        <h2>Lên lịch phỏng vấn</h2>
                        {candidate && (
                            <p className="candidate-info">
                                Ứng viên: <strong>{candidate.name}</strong> - {candidate.position}
                            </p>
                        )}
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <BsX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="scheduler-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>
                                <BsCalendar3 /> Ngày phỏng vấn <span className="required">*</span>
                            </label>
                            <input
                                type="date"
                                value={interviewData.date}
                                onChange={(e) => setInterviewData({ ...interviewData, date: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                <BsClock /> Giờ phỏng vấn <span className="required">*</span>
                            </label>
                            <input
                                type="time"
                                value={interviewData.time}
                                onChange={(e) => setInterviewData({ ...interviewData, time: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Thời lượng</label>
                        <select
                            value={interviewData.duration}
                            onChange={(e) => setInterviewData({ ...interviewData, duration: e.target.value })}
                        >
                            <option value="30">30 phút</option>
                            <option value="45">45 phút</option>
                            <option value="60">1 giờ</option>
                            <option value="90">1.5 giờ</option>
                            <option value="120">2 giờ</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>
                            <BsGeoAlt /> Hình thức
                        </label>
                        <select
                            value={interviewData.location}
                            onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })}
                        >
                            <option value="online">Phỏng vấn trực tuyến</option>
                            <option value="office">Tại văn phòng</option>
                            <option value="custom">Địa điểm khác</option>
                        </select>
                    </div>

                    {interviewData.location === 'online' && (
                        <div className="form-group">
                            <label>Link cuộc họp</label>
                            <input
                                type="url"
                                value={interviewData.meetingLink}
                                onChange={(e) => setInterviewData({ ...interviewData, meetingLink: e.target.value })}
                                placeholder="https://meet.google.com/xxx-yyyy-zzz"
                            />
                        </div>
                    )}

                    {interviewData.location === 'custom' && (
                        <div className="form-group">
                            <label>Địa điểm cụ thể</label>
                            <input
                                type="text"
                                value={interviewData.customLocation}
                                onChange={(e) => setInterviewData({ ...interviewData, customLocation: e.target.value })}
                                placeholder="Nhập địa chỉ phỏng vấn"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>
                            <BsPerson /> Người phỏng vấn
                        </label>
                        {interviewData.interviewers.map((interviewer, index) => (
                            <div key={index} className="interviewer-input-group">
                                <input
                                    type="email"
                                    value={interviewer}
                                    onChange={(e) => handleInterviewerChange(index, e.target.value)}
                                    placeholder="Email người phỏng vấn"
                                />
                                {interviewData.interviewers.length > 1 && (
                                    <button
                                        type="button"
                                        className="remove-interviewer-btn"
                                        onClick={() => handleRemoveInterviewer(index)}
                                    >
                                        <BsX />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            className="add-interviewer-btn"
                            onClick={handleAddInterviewer}
                        >
                            <BsPlus /> Thêm người phỏng vấn
                        </button>
                    </div>

                    <div className="form-group">
                        <label>Ghi chú</label>
                        <textarea
                            value={interviewData.notes}
                            onChange={(e) => setInterviewData({ ...interviewData, notes: e.target.value })}
                            placeholder="Thêm ghi chú về buổi phỏng vấn..."
                            rows="4"
                        />
                    </div>

                    <div className="scheduler-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Hủy
                        </button>
                        <button type="submit" className="btn-schedule">
                            <BsCalendar3 /> Lên lịch phỏng vấn
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default InterviewScheduler;
