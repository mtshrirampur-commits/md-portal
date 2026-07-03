import React from 'react';
import { api } from '../data.js';

function ExamScorecard({ exam, resultData, setIsReviewMode, onFinish, onLogout }) {
    // Calculate Topic-level Mastery for this exam
    const getExamTopicAnalytics = () => {
        if (!exam || !exam.questions || !resultData || !resultData.answers) return [];
        const topicStats = {};
        
        exam.questions.forEach((q, index) => {
            const topic = q.topic || 'General';
            if (!topicStats[topic]) {
                topicStats[topic] = {
                    topicName: topic,
                    totalQuestions: 0,
                    correctQuestions: 0
                };
            }
            topicStats[topic].totalQuestions += 1;
            const userAns = resultData.answers[index] !== undefined ? resultData.answers[index] : -1;
            if (userAns === q.correctOption) {
                topicStats[topic].correctQuestions += 1;
            }
        });
        
        return Object.values(topicStats).map(stat => {
            const accuracy = (stat.correctQuestions / stat.totalQuestions) * 100;
            return {
                ...stat,
                accuracy
            };
        });
    };

    return (
        <div style={{ padding: '40px 0' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
                <div className="glass-panel animate-fade-in" style={{ padding: '48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                        width: '84px',
                        height: '84px',
                        borderRadius: '50%',
                        background: resultData.passed ? 'var(--success-bg)' : 'var(--danger-bg)',
                        color: resultData.passed ? 'var(--success-color)' : 'var(--danger-color)',
                        margin: '0 auto 24px auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                        border: `2px solid ${resultData.passed ? 'var(--success-color)' : 'var(--danger-color)'}`
                    }}>
                        <i className={resultData.passed ? "fas fa-trophy" : "fas fa-times-circle"}></i>
                    </div>

                    <span className={`badge ${resultData.passed ? 'badge-success' : 'badge-danger'}`} style={{ marginBottom: '16px', fontSize: '1rem', padding: '8px 20px' }}>
                        {resultData.passed ? 'Excellent! Exam Passed' : 'Needs Improvement - Minimum Score Not Met'}
                    </span>

                    <h1 style={{ fontSize: '2.5rem', color: 'white', marginBottom: '16px' }}>
                        {exam.title}
                    </h1>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '32px',
                        padding: '24px 0',
                        borderTop: '1px solid var(--border-glass)',
                        borderBottom: '1px solid var(--border-glass)',
                        margin: '32px 0'
                    }}>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Secured Score</span>
                            <span style={{ fontSize: '2.5rem', fontWeight: '800', color: resultData.passed ? '#10b981' : '#ef4444', fontFamily: 'Outfit' }}>
                                {resultData.score} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/ {resultData.totalMarks}</span>
                            </span>
                        </div>
                        <div style={{ borderRight: '1px solid var(--border-glass)' }}></div>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Percentage</span>
                            <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', fontFamily: 'Outfit' }}>
                                {resultData.percentage.toFixed(1)}%
                            </span>
                        </div>
                        <div style={{ borderRight: '1px solid var(--border-glass)' }}></div>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Passing Target</span>
                            <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-muted)', fontFamily: 'Outfit' }}>
                                {exam.passingMarks} pts
                            </span>
                        </div>
                    </div>

                    {resultData.timeSpent && resultData.timeSpent.length > 0 && (
                        <div className="glass-panel animate-fade-in" style={{ marginTop: '32px', padding: '36px', textAlign: 'left', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fas fa-chart-bar" style={{ color: 'var(--primary-color)' }}></i> Question-Level Time Analytics
                            </h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                                <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)' }}>
                                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Time / Question</span>
                                    <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white', fontFamily: 'Outfit' }}>
                                        {(() => {
                                            const total = resultData.timeSpent.reduce((a, b) => a + b, 0);
                                            const avg = total / resultData.timeSpent.length;
                                            return `${Math.floor(avg / 60)}m ${Math.floor(avg % 60)}s`;
                                        })()}
                                    </span>
                                </div>
                                <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)' }}>
                                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time Spent Bottlenecks</span>
                                    <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444', fontFamily: 'Outfit' }}>
                                        {resultData.timeSpent.filter(t => t > 120).length} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>questions (&gt;2m)</span>
                                    </span>
                                </div>
                            </div>

                            {/* Visual Timeline Bar Chart */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {resultData.timeSpent.map((time, idx) => {
                                    const minutes = Math.floor(time / 60);
                                    const seconds = time % 60;
                                    const percent = Math.min((time / 180) * 100, 100);
                                    
                                    let barColor = '#10b981';
                                    let textColor = '#10b981';
                                    if (time > 120) {
                                        barColor = '#ef4444';
                                        textColor = '#ef4444';
                                    } else if (time > 45) {
                                        barColor = '#f59e0b';
                                        textColor = '#f59e0b';
                                    }

                                    return (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <span style={{ width: '40px', fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.6)' }}>Q{idx + 1}</span>
                                            <div style={{ flex: 1, height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${percent}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 1s ease' }}></div>
                                            </div>
                                            <span style={{ width: '70px', textAlign: 'right', fontSize: '0.9rem', fontWeight: '600', color: textColor, fontFamily: 'monospace' }}>
                                                {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {/* Topic-Level conceptual feedback */}
                    {(() => {
                        const topicAnalytics = getExamTopicAnalytics();
                        if (topicAnalytics.length === 0) return null;
                        
                        const weakTopics = topicAnalytics.filter(t => t.accuracy < 50);
                        const strongTopics = topicAnalytics.filter(t => t.accuracy >= 70);
                        
                        return (
                            <div className="glass-panel animate-fade-in" style={{ marginTop: '32px', padding: '36px', textAlign: 'left', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <i className="fas fa-bullseye text-gradient"></i> Conceptual Topic Breakdown
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
                                    Your accuracy performance mapped to distinct chapters in this test paper.
                                </p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '28px' }}>
                                    {topicAnalytics.map(t => {
                                        let barColor = 'var(--warning-color)';
                                        let statusColor = 'var(--warning-color)';
                                        if (t.accuracy >= 70) {
                                            barColor = 'var(--success-color)';
                                            statusColor = 'var(--success-color)';
                                        } else if (t.accuracy < 50) {
                                            barColor = 'var(--danger-color)';
                                            statusColor = 'var(--danger-color)';
                                        }
                                        
                                        return (
                                            <div key={t.topicName} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                    <span style={{ fontWeight: '600', color: 'white' }}>{t.topicName}</span>
                                                    <span style={{ fontWeight: 'bold', color: statusColor }}>{t.accuracy.toFixed(0)}% ({t.correctQuestions}/{t.totalQuestions} Qs)</span>
                                                </div>
                                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${t.accuracy}%`, height: '100%', background: barColor, borderRadius: '3px' }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Dynamic Advice/Guidance Box */}
                                <div style={{ background: 'rgba(255,255,255,0.01)', padding: '18px', borderRadius: '12px', borderLeft: `4px solid ${weakTopics.length > 0 ? 'var(--danger-color)' : 'var(--success-color)'}` }}>
                                    {weakTopics.length > 0 ? (
                                        <div>
                                            <h5 style={{ margin: '0 0 6px 0', color: 'var(--danger-color)', fontWeight: '700', fontSize: '0.95rem' }}>
                                                <i className="fas fa-exclamation-triangle" style={{ marginRight: '6px' }}></i> Concept Study Recommendation
                                            </h5>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                                You need to focus on <strong>{weakTopics.map(w => w.topicName).join(', ')}</strong> where accuracy was below 50%. We highly suggest reviewing the solutions to these specific questions in detail and working on related practice DPPs to build strength!
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <h5 style={{ margin: '0 0 6px 0', color: 'var(--success-color)', fontWeight: '700', fontSize: '0.95rem' }}>
                                                <i className="fas fa-graduation-cap" style={{ marginRight: '6px' }}></i> Excellent Conceptual Control!
                                            </h5>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                                Spectacular work! You have shown solid command across all exam topics. Continue this excellent academy momentum in upcoming challenges!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button 
                            onClick={() => setIsReviewMode(true)}
                            className="btn-primary"
                            style={{ padding: '16px 36px', fontSize: '1.1rem' }}
                        >
                            <i className="fas fa-clipboard-check"></i> Review Detailed Solutions
                        </button>
                        <button 
                            onClick={onFinish}
                            className="btn-secondary"
                            style={{ padding: '16px 36px', fontSize: '1.1rem' }}
                        >
                            <i className="fas fa-arrow-left"></i> Return to My Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UploadedExamTaking({ exam, currentUser, onFinish, onLogout, retrospectiveResult = null }) {
    // For OMR, we don't need a currentQuestionIndex for navigation, we show all questions in a list.
    const [selectedAnswers, setSelectedAnswers] = React.useState(() => {
        if (retrospectiveResult) {
            const answersMap = {};
            retrospectiveResult.answers.forEach((ans, idx) => {
                if (ans !== -1) answersMap[idx] = ans;
            });
            return answersMap;
        }
        return {};
    });

    const [timeLeft, setTimeLeft] = React.useState(exam.durationMinutes * 60);
    const [isSubmitted, setIsSubmitted] = React.useState(!!retrospectiveResult);
    const [resultData, setResultData] = React.useState(retrospectiveResult);
    const [isReviewMode, setIsReviewMode] = React.useState(!!retrospectiveResult);

    const [isStarted, setIsStarted] = React.useState(!!retrospectiveResult);
    const [warnings, setWarnings] = React.useState(0);
    const [showCheatWarning, setShowCheatWarning] = React.useState(false);
    const submitExamRef = React.useRef(null);

    const [mobileTab, setMobileTab] = React.useState('paper'); // 'paper' | 'bubble'

    // Timer effect
    React.useEffect(() => {
        if (!isStarted || isSubmitted || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitExam(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isStarted, timeLeft, isSubmitted]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleSelectOption = (qIndex, optionIndex) => {
        if (isSubmitted && !isReviewMode) return;
        if (isReviewMode) return;
        setSelectedAnswers(prev => ({
            ...prev,
            [qIndex]: optionIndex
        }));
    };

    const handleSubmitExam = async (isAutoSubmit = false) => {
        if (isSubmitted) return;
        if (!isAutoSubmit) {
            const unans = exam.questions.length - Object.keys(selectedAnswers).length;
            if (unans > 0 && !window.confirm(`You have ${unans} unanswered questions. Submit anyway?`)) {
                return;
            }
        }

        let totalScore = 0;
        const answersArray = [];

        exam.questions.forEach((q, index) => {
            const userAns = selectedAnswers[index] !== undefined ? selectedAnswers[index] : -1;
            answersArray.push(userAns);
            if (userAns === q.correctOption) {
                totalScore += q.marks;
            }
        });

        const percentage = Number((totalScore / exam.totalMarks * 100).toFixed(2));
        const passed = totalScore >= exam.passingMarks;

        const newResult = {
            id: 'res-' + Date.now(),
            studentId: currentUser.id,
            studentName: currentUser.name,
            examId: exam.id,
            examTitle: exam.title,
            score: totalScore,
            totalMarks: exam.totalMarks,
            percentage: percentage,
            passed: passed,
            date: new Date().toLocaleDateString(),
            answers: answersArray
        };

        try {
            const savedResult = await api.submitResult(newResult);
            setResultData(savedResult);
            setIsSubmitted(true);
            try { document.exitFullscreen().catch(() => {}); } catch(e) {}
        } catch (err) {
            console.error('Failed to submit exam result:', err);
            setResultData(newResult);
            setIsSubmitted(true);
            try { document.exitFullscreen().catch(() => {}); } catch(e) {}
        }
    };

    submitExamRef.current = handleSubmitExam;
    React.useEffect(() => {
        if (!isStarted || isSubmitted || isReviewMode) return;

        let lastInfractionTime = 0;
        const triggerWarning = (reason) => {
            const now = Date.now();
            if (now - lastInfractionTime < 1000) return;
            lastInfractionTime = now;

            setWarnings(prev => {
                const newWarnings = prev + 1;
                if (newWarnings > 3) {
                    if (submitExamRef.current) submitExamRef.current(true);
                    try { document.exitFullscreen().catch(() => {}); } catch(e) {}
                    alert(`Maximum warnings exceeded. ${reason}. The exam has been automatically submitted.`);
                } else {
                    setShowCheatWarning(true);
                }
                return newWarnings;
            });
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                triggerWarning("Navigating away from the examination window");
            }
        };

        const handleBlur = () => {
            if (!showCheatWarning) {
                triggerWarning("Losing browser focus");
            }
        };

        const handleFullscreenChange = () => {
            const isFullscreenNow = !!(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            );
            if (!isFullscreenNow) {
                triggerWarning("Exiting fullscreen mode");
            }
        };

        const preventDefaultAction = (e) => e.preventDefault();
        const handleKeyDown = (e) => {
            const isCtrl = e.ctrlKey || e.metaKey;
            if (
                e.key === 'F12' ||
                (isCtrl && ['c', 'v', 'x', 'u', 's'].includes(e.key.toLowerCase())) ||
                (isCtrl && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
            ) {
                e.preventDefault();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        
        document.addEventListener("contextmenu", preventDefaultAction);
        document.addEventListener("selectstart", preventDefaultAction);
        document.addEventListener("copy", preventDefaultAction);
        document.addEventListener("cut", preventDefaultAction);
        document.addEventListener("paste", preventDefaultAction);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            
            document.removeEventListener("contextmenu", preventDefaultAction);
            document.removeEventListener("selectstart", preventDefaultAction);
            document.removeEventListener("copy", preventDefaultAction);
            document.removeEventListener("cut", preventDefaultAction);
            document.removeEventListener("paste", preventDefaultAction);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isStarted, isSubmitted, isReviewMode, showCheatWarning]);

    if (isSubmitted && resultData && !isReviewMode) {
        return <ExamScorecard exam={exam} resultData={resultData} setIsReviewMode={setIsReviewMode} onFinish={onFinish} onLogout={onLogout} />;
    }

    if (!isStarted) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 9999, background: 'var(--bg-gradient)', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
                <div className="glass-panel animate-fade-in" style={{ padding: '48px', maxWidth: '600px', width: '90%', textAlign: 'center', border: '1px solid var(--border-glass)' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', border: '2px solid var(--primary-color)', color: 'var(--primary-color)', margin: '0 auto 24px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                        <i className="fas fa-shield-alt"></i>
                    </div>
                    
                    <h2 style={{ fontSize: '2rem', color: 'white', marginBottom: '16px', fontWeight: '800' }}>
                        Security Verification Check
                    </h2>
                    
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '32px', lineHeight: '1.6' }}>
                        To ensure exam integrity, this examination requires advanced proctoring. Please review the security rules below before starting:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', marginBottom: '40px', background: 'rgba(255, 255, 255, 0.02)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <i className="fas fa-expand" style={{ color: '#10b981', fontSize: '1.2rem', marginTop: '4px' }}></i>
                            <div>
                                <strong style={{ color: 'white', display: 'block' }}>Mandatory Fullscreen Mode</strong>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>The exam must be taken in fullscreen. Exiting fullscreen triggers a warning strike.</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <i className="fas fa-eye" style={{ color: '#3b82f6', fontSize: '1.2rem', marginTop: '4px' }}></i>
                            <div>
                                <strong style={{ color: 'white', display: 'block' }}>Active Window Focus</strong>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Interacting with other apps, opening notifications, or switching tabs logs a warning strike.</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <i className="fas fa-ban" style={{ color: '#f59e0b', fontSize: '1.2rem', marginTop: '4px' }}></i>
                            <div>
                                <strong style={{ color: 'white', display: 'block' }}>Copy-Paste & Right-Click Blocked</strong>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Text copying, selection, and developers console tools are fully disabled.</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            document.documentElement.requestFullscreen()
                                .then(() => setIsStarted(true))
                                .catch(() => {
                                    setIsStarted(true);
                                });
                        }}
                        className="btn-primary hover-scale"
                        style={{ padding: '16px 40px', fontSize: '1.2rem', width: '100%', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                        <i className="fas fa-play"></i> Agree & Start Exam (Enter Fullscreen)
                    </button>
                </div>
            </div>
        );
    }

    const isImage = exam.fileUrl && (exam.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) != null);
    const isWord = exam.fileUrl && (exam.fileUrl.match(/\.(doc|docx)$/i) != null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 9999, background: 'var(--bg-gradient)', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
            {showCheatWarning && warnings <= 3 && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ padding: '40px', maxWidth: '500px', textAlign: 'center', border: '2px solid #ef4444', background: '#111827' }}>
                        <i className="fas fa-exclamation-triangle" style={{ fontSize: '4rem', color: '#ef4444', marginBottom: '20px' }}></i>
                        <h2 style={{ color: 'white', marginBottom: '16px' }}>Warning {warnings} of 3</h2>
                        <p style={{ color: '#9ca3af', fontSize: '1.1rem', marginBottom: '24px' }}>
                            Navigating away from the examination window is strictly prohibited. If you exceed 3 warnings, your exam will be automatically submitted.
                        </p>
                        <button 
                            onClick={() => {
                                setShowCheatWarning(false);
                                try { document.documentElement.requestFullscreen().catch(() => {}); } catch(e) {}
                            }} 
                            className="btn-primary" 
                            style={{ background: '#ef4444', border: 'none', padding: '12px 32px' }}
                        >
                            Re-Enter Fullscreen & Resume
                        </button>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid var(--border-glass)', borderRadius: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{exam.title}</h2>
                    {isReviewMode && <span className="badge badge-warning" style={{ padding: '6px 12px' }}>Review Studio</span>}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div className="glass-panel" style={{ padding: '8px 20px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '10px', background: timeLeft <= 300 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)', border: timeLeft <= 300 ? '1px solid #ef4444' : '1px solid var(--border-glass)' }}>
                        <i className="fas fa-clock" style={{ color: timeLeft <= 300 ? '#ef4444' : '#3b82f6' }}></i>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'monospace', color: timeLeft <= 300 ? '#ef4444' : 'white' }}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Mobile Tab Selector - OMR Mode */}
            <div className="exam-mobile-tabs" style={{ display: 'none', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-glass)' }}>
                <button 
                    onClick={() => setMobileTab('paper')}
                    style={{
                        flex: 1,
                        padding: '14px',
                        background: mobileTab === 'paper' ? 'var(--primary-gradient)' : 'transparent',
                        color: 'white',
                        border: 'none',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <i className="fas fa-file-alt"></i> Question Paper
                </button>
                <button 
                    onClick={() => setMobileTab('bubble')}
                    style={{
                        flex: 1,
                        padding: '14px',
                        background: mobileTab === 'bubble' ? 'var(--primary-gradient)' : 'transparent',
                        color: 'white',
                        border: 'none',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <i className="fas fa-list-ol"></i> Bubble Sheet ({Object.keys(selectedAnswers).length}/{exam.questions.length})
                </button>
            </div>

            <div className={`exam-workspace exam-show-${mobileTab}`} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left side: Document Viewer */}
                <div className="exam-left-pane" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-glass)' }}>
                    <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden' }}>
                        <div style={{ background: '#1e293b', padding: '12px 20px', fontWeight: 'bold', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0' }}>
                            <i className="fas fa-file-alt" style={{ color: '#3b82f6' }}></i> Question Paper Viewer
                        </div>
                        {isWord ? (
                            <div style={{ padding: '60px 20px', textAlign: 'center', background: '#f8fafc', color: '#334155', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-file-word" style={{ fontSize: '4rem', color: '#2563eb', marginBottom: '20px' }}></i>
                                <h3 style={{ marginBottom: '12px', fontSize: '1.5rem' }}>Word Document Reference</h3>
                                <p style={{ marginBottom: '24px', color: '#64748b' }}>Please download this document to view the questions.</p>
                                <a href={exam.fileUrl} download className="btn-primary" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', padding: '12px 32px', borderRadius: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-download"></i> Download Document
                                </a>
                            </div>
                        ) : isImage ? (
                            <div style={{ overflow: 'auto', textAlign: 'center', padding: '20px', flex: 1, background: '#fff' }}>
                                <img src={exam.fileUrl} alt="Exam Paper" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
                            </div>
                        ) : (
                            <iframe src={exam.fileUrl} style={{ width: '100%', height: '100%', border: 'none', flex: 1, background: '#fff' }} title="Exam Paper" />
                        )}
                    </div>
                </div>

                {/* Right side: OMR Bubble Sheet */}
                <div className="exam-right-pane" style={{ width: '400px', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border-glass)' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fas fa-list-ol" style={{ color: 'var(--primary-color)' }}></i> OMR Answer Sheet
                        </h3>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {exam.questions.map((q, qIndex) => {
                                const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
                                const optionsCount = q.options && q.options.length > 0 ? q.options.length : 4; 
                                
                                return (
                                    <div key={qIndex} className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                            <strong style={{ fontSize: '1.1rem' }}>Q{qIndex + 1}.</strong>
                                            <span className="badge badge-primary">{q.marks} Marks</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start' }}>
                                            {Array.from({ length: optionsCount }).map((_, optIdx) => {
                                                const isSelected = selectedAnswers[qIndex] === optIdx;
                                                let bg = 'rgba(255,255,255,0.05)';
                                                let border = '2px solid rgba(255,255,255,0.2)';
                                                let color = 'white';
                                                
                                                if (isReviewMode) {
                                                    if (q.correctOption === optIdx) {
                                                        bg = '#10b981'; border = '2px solid #10b981';
                                                    } else if (isSelected && q.correctOption !== optIdx) {
                                                        bg = '#ef4444'; border = '2px solid #ef4444';
                                                    }
                                                } else if (isSelected) {
                                                    bg = '#3b82f6'; border = '2px solid #3b82f6';
                                                }

                                                return (
                                                    <button
                                                        key={optIdx}
                                                        onClick={() => handleSelectOption(qIndex, optIdx)}
                                                        disabled={isReviewMode}
                                                        style={{
                                                            width: '40px', height: '40px', borderRadius: '50%',
                                                            background: bg, border: border, color: color,
                                                            cursor: isReviewMode ? 'default' : 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontWeight: 'bold', transition: 'all 0.2s'
                                                        }}
                                                        className={!isReviewMode ? "hover-scale" : ""}
                                                    >
                                                        {labels[optIdx]}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    <div style={{ padding: '20px', borderTop: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.3)', marginBottom: window.innerWidth <= 768 ? '20px' : '0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '12px' }}>
                            <span>Attempted</span>
                            <span>{Object.keys(selectedAnswers).length} / {exam.questions.length}</span>
                        </div>
                        {!isReviewMode ? (
                            <button 
                                onClick={() => handleSubmitExam(false)}
                                className="btn-primary"
                                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', background: 'var(--success-color)', borderRadius: '12px' }}
                            >
                                <i className="fas fa-check-double"></i> Submit Exam
                            </button>
                        ) : (
                            <button 
                                onClick={onFinish}
                                className="btn-primary"
                                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '12px' }}
                            >
                                <i className="fas fa-sign-out-alt"></i> Exit Review
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function NTAExamTaking({ exam, currentUser, onFinish, onLogout, retrospectiveResult = null }) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
    const [selectedAnswers, setSelectedAnswers] = React.useState(() => {
        if (retrospectiveResult) {
            const answersMap = {};
            retrospectiveResult.answers.forEach((ans, idx) => {
                if (ans !== -1) answersMap[idx] = ans;
            });
            return answersMap;
        }
        return {};
    });
    
    const [questionStatuses, setQuestionStatuses] = React.useState(() => {
        const statuses = {};
        for(let i = 0; i < exam.questions.length; i++) {
            if (retrospectiveResult) {
                statuses[i] = (retrospectiveResult.answers[i] !== -1) ? 'answered' : 'not_answered';
            } else {
                statuses[i] = 'not_visited';
            }
        }
        if (!retrospectiveResult) {
            statuses[0] = 'not_answered';
        }
        return statuses;
    });

    const [timeLeft, setTimeLeft] = React.useState(exam.durationMinutes * 60);
    const [isSubmitted, setIsSubmitted] = React.useState(!!retrospectiveResult);
    const [resultData, setResultData] = React.useState(retrospectiveResult);
    const [isReviewMode, setIsReviewMode] = React.useState(!!retrospectiveResult);
    const [showSummaryModal, setShowSummaryModal] = React.useState(false);

    const [warnings, setWarnings] = React.useState(0);
    const [showCheatWarning, setShowCheatWarning] = React.useState(false);
    const submitExamRef = React.useRef(null);

    const [isStarted, setIsStarted] = React.useState(!!retrospectiveResult);
    const [timeSpent, setTimeSpent] = React.useState(() => {
        return new Array(exam.questions.length).fill(0);
    });

    const [isPaletteOpen, setIsPaletteOpen] = React.useState(false); // Mobile CBT Drawer state

    // Timer effect
    React.useEffect(() => {
        if (!isStarted || isSubmitted || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitExam(true);
                    return 0;
                }
                return prev - 1;
            });
            setTimeSpent(prev => {
                const next = [...prev];
                if (next[currentQuestionIndex] !== undefined) {
                    next[currentQuestionIndex] += 1;
                }
                return next;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isStarted, timeLeft, isSubmitted, currentQuestionIndex]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleSelectOption = (optionIndex) => {
        if (isSubmitted && !isReviewMode) return;
        if (isReviewMode) return;
        setSelectedAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: optionIndex
        }));
    };

    const advanceToNext = (newStatuses) => {
        if (currentQuestionIndex < exam.questions.length - 1) {
            const nextIdx = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIdx);
            if (newStatuses[nextIdx] === 'not_visited') {
                setQuestionStatuses({
                    ...newStatuses,
                    [nextIdx]: 'not_answered'
                });
            } else {
                setQuestionStatuses(newStatuses);
            }
        } else {
            setQuestionStatuses(newStatuses);
        }
    };

    const handleSaveAndNext = () => {
        const isAns = selectedAnswers[currentQuestionIndex] !== undefined;
        const newStatuses = { ...questionStatuses, [currentQuestionIndex]: isAns ? 'answered' : 'not_answered' };
        advanceToNext(newStatuses);
    };

    const handleClearResponse = () => {
        const newAnswers = { ...selectedAnswers };
        delete newAnswers[currentQuestionIndex];
        setSelectedAnswers(newAnswers);
    };

    const handleSaveAndMarkReview = () => {
        const isAns = selectedAnswers[currentQuestionIndex] !== undefined;
        if (!isAns) {
            alert('Please select an option to Save and Mark for Review.');
            return;
        }
        const newStatuses = { ...questionStatuses, [currentQuestionIndex]: 'answered_marked' };
        advanceToNext(newStatuses);
    };

    const handleMarkReviewAndNext = () => {
        const isAns = selectedAnswers[currentQuestionIndex] !== undefined;
        const newStatuses = { ...questionStatuses, [currentQuestionIndex]: isAns ? 'answered_marked' : 'marked' };
        advanceToNext(newStatuses);
    };

    const jumpToQuestion = (idx) => {
        if (isSubmitted && !isReviewMode) return;
        const newStatuses = { ...questionStatuses };
        if (!isReviewMode && newStatuses[idx] === 'not_visited') {
            newStatuses[idx] = 'not_answered';
        }
        setQuestionStatuses(newStatuses);
        setCurrentQuestionIndex(idx);
        setIsPaletteOpen(false); // Close palette drawer on mobile selection
    };

    const handleSubmitExam = async (isAutoSubmit = false) => {
        if (isSubmitted) return;
        setShowSummaryModal(false);

        let totalScore = 0;
        const answersArray = [];

        exam.questions.forEach((q, index) => {
            const userAns = selectedAnswers[index] !== undefined ? selectedAnswers[index] : -1;
            answersArray.push(userAns);
            if (userAns === q.correctOption) {
                totalScore += q.marks;
            }
        });

        const percentage = Number((totalScore / exam.totalMarks * 100).toFixed(2));
        const passed = totalScore >= exam.passingMarks;

        const newResult = {
            id: 'res-' + Date.now(),
            studentId: currentUser.id,
            studentName: currentUser.name,
            examId: exam.id,
            examTitle: exam.title,
            score: totalScore,
            totalMarks: exam.totalMarks,
            percentage: percentage,
            passed: passed,
            date: new Date().toLocaleDateString(),
            answers: answersArray,
            timeSpent: timeSpent
        };

        try {
            const savedResult = await api.submitResult(newResult);
            setResultData(savedResult);
            setIsSubmitted(true);
            try { document.exitFullscreen().catch(() => {}); } catch(e) {}
        } catch (err) {
            console.error('Failed to submit exam result:', err);
            setResultData(newResult);
            setIsSubmitted(true);
            try { document.exitFullscreen().catch(() => {}); } catch(e) {}
        }
    };

    submitExamRef.current = handleSubmitExam;
    React.useEffect(() => {
        if (!isStarted || isSubmitted || isReviewMode) return;

        let lastInfractionTime = 0;
        const triggerWarning = (reason) => {
            const now = Date.now();
            if (now - lastInfractionTime < 1000) return;
            lastInfractionTime = now;

            setWarnings(prev => {
                const newWarnings = prev + 1;
                if (newWarnings > 3) {
                    if (submitExamRef.current) submitExamRef.current(true);
                    try { document.exitFullscreen().catch(() => {}); } catch(e) {}
                    alert(`Maximum warnings exceeded. ${reason}. The exam has been automatically submitted.`);
                } else {
                    setShowCheatWarning(true);
                }
                return newWarnings;
            });
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                triggerWarning("Navigating away from the examination window");
            }
        };

        const handleBlur = () => {
            if (!showCheatWarning) {
                triggerWarning("Losing browser focus");
            }
        };

        const handleFullscreenChange = () => {
            const isFullscreenNow = !!(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            );
            if (!isFullscreenNow) {
                triggerWarning("Exiting fullscreen mode");
            }
        };

        const preventDefaultAction = (e) => e.preventDefault();
        const handleKeyDown = (e) => {
            const isCtrl = e.ctrlKey || e.metaKey;
            if (
                e.key === 'F12' ||
                (isCtrl && ['c', 'v', 'x', 'u', 's'].includes(e.key.toLowerCase())) ||
                (isCtrl && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
            ) {
                e.preventDefault();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        
        document.addEventListener("contextmenu", preventDefaultAction);
        document.addEventListener("selectstart", preventDefaultAction);
        document.addEventListener("copy", preventDefaultAction);
        document.addEventListener("cut", preventDefaultAction);
        document.addEventListener("paste", preventDefaultAction);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            
            document.removeEventListener("contextmenu", preventDefaultAction);
            document.removeEventListener("selectstart", preventDefaultAction);
            document.removeEventListener("copy", preventDefaultAction);
            document.removeEventListener("cut", preventDefaultAction);
            document.removeEventListener("paste", preventDefaultAction);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isStarted, isSubmitted, isReviewMode, showCheatWarning]);

    if (isSubmitted && resultData && !isReviewMode) {
        return <ExamScorecard exam={exam} resultData={resultData} setIsReviewMode={setIsReviewMode} onFinish={onFinish} onLogout={onLogout} />;
    }

    if (!isStarted) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 9999, background: '#eef2f6', color: '#333', fontFamily: 'Arial, sans-serif' }}>
                <div style={{ background: 'white', padding: '48px', maxWidth: '600px', width: '90%', textAlign: 'center', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #ddd' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#ebf5ff', border: '2px solid #337ab7', color: '#337ab7', margin: '0 auto 24px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                        <i className="fas fa-shield-alt"></i>
                    </div>
                    
                    <h2 style={{ fontSize: '2rem', color: '#333', marginBottom: '16px', fontWeight: 'bold' }}>
                        Security Verification Check
                    </h2>
                    
                    <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '32px', lineHeight: '1.6' }}>
                        To ensure exam integrity, this examination requires advanced proctoring. Please review the security rules below before starting:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', marginBottom: '40px', background: '#f9f9f9', padding: '24px', borderRadius: '8px', border: '1px solid #eee' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <i className="fas fa-expand" style={{ color: '#5cb85c', fontSize: '1.2rem', marginTop: '4px' }}></i>
                            <div>
                                <strong style={{ color: '#333', display: 'block' }}>Mandatory Fullscreen Mode</strong>
                                <span style={{ color: '#666', fontSize: '0.9rem' }}>The exam must be taken in fullscreen. Exiting fullscreen triggers a warning strike.</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <i className="fas fa-eye" style={{ color: '#337ab7', fontSize: '1.2rem', marginTop: '4px' }}></i>
                            <div>
                                <strong style={{ color: '#333', display: 'block' }}>Active Window Focus</strong>
                                <span style={{ color: '#666', fontSize: '0.9rem' }}>Interacting with other apps, opening notifications, or switching tabs logs a warning strike.</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <i className="fas fa-ban" style={{ color: '#f0ad4e', fontSize: '1.2rem', marginTop: '4px' }}></i>
                            <div>
                                <strong style={{ color: '#333', display: 'block' }}>Copy-Paste & Right-Click Blocked</strong>
                                <span style={{ color: '#666', fontSize: '0.9rem' }}>Text copying, selection, and developers console tools are fully disabled.</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            document.documentElement.requestFullscreen()
                                .then(() => setIsStarted(true))
                                .catch(() => {
                                    setIsStarted(true);
                                });
                        }}
                        style={{ padding: '16px 40px', fontSize: '1.2rem', width: '100%', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#5cb85c', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        <i className="fas fa-play"></i> Agree & Start Exam (Enter Fullscreen)
                    </button>
                </div>
            </div>
        );
    }

    const counts = { not_visited: 0, not_answered: 0, answered: 0, marked: 0, answered_marked: 0 };
    Object.values(questionStatuses).forEach(status => {
        counts[status] = (counts[status] || 0) + 1;
    });

    const activeQuestion = exam.questions[currentQuestionIndex];

    const ntaStyles = {
        container: { display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 9999, background: '#eef2f6', color: '#333', fontFamily: 'Arial, sans-serif' },
        header: { display: 'flex', justifyContent: 'space-between', padding: '10px 20px', background: '#2c3e50', color: 'white', borderBottom: '4px solid #f39c12', alignItems: 'center' },
        mainArea: { display: 'flex', flex: 1, overflow: 'hidden' },
        leftPane: { flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #ccc', background: 'white' },
        rightPane: { width: '320px', display: 'flex', flexDirection: 'column', background: '#e6f0fa', borderLeft: '2px solid #aec2d8' },
        qHeader: { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #ccc', background: '#dce7f3' },
        qBody: { flex: 1, padding: '20px', overflowY: 'auto', fontSize: '1.1rem' },
        bottomBar: { padding: '10px 20px', background: '#dce7f3', borderTop: '1px solid #ccc', display: 'flex', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' },
        btnSaveNext: { background: '#5cb85c', color: 'white', border: '1px solid #4cae4c', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
        btnSaveMark: { background: '#f0ad4e', color: 'white', border: '1px solid #eea236', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
        btnMarkNext: { background: '#337ab7', color: 'white', border: '1px solid #2e6da4', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
        btnClear: { background: '#fff', color: '#333', border: '1px solid #ccc', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' },
        submitBtn: { background: '#d9534f', color: 'white', border: 'none', padding: '12px', width: '100%', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold', marginTop: 'auto' },
        paletteItem: { width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', cursor: 'pointer', margin: '4px', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', color: 'white' }
    };

    return (
        <div className="nta-container" style={ntaStyles.container}>
            {showCheatWarning && warnings <= 3 && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel" style={{ padding: '40px', maxWidth: '500px', textAlign: 'center', border: '2px solid #ef4444', background: '#111827' }}>
                        <i className="fas fa-exclamation-triangle" style={{ fontSize: '4rem', color: '#ef4444', marginBottom: '20px' }}></i>
                        <h2 style={{ color: 'white', marginBottom: '16px' }}>Warning {warnings} of 3</h2>
                        <p style={{ color: '#9ca3af', fontSize: '1.1rem', marginBottom: '24px' }}>
                            Navigating away from the examination window is strictly prohibited. If you exceed 3 warnings, your exam will be automatically submitted.
                        </p>
                        <button 
                            onClick={() => {
                                setShowCheatWarning(false);
                                try { document.documentElement.requestFullscreen().catch(() => {}); } catch(e) {}
                            }} 
                            className="btn-primary" 
                            style={{ background: '#ef4444', border: 'none', padding: '12px 32px' }}
                        >
                            Re-Enter Fullscreen & Resume
                        </button>
                    </div>
                </div>
            )}
            <div style={ntaStyles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{exam.title}</h2>
                    {isReviewMode && <span style={{ background: '#f39c12', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', color: '#fff' }}>Review Mode</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    
                    {/* Mobile Grid Toggle Trigger */}
                    <button 
                        className="show-on-mobile-block"
                        onClick={() => setIsPaletteOpen(true)}
                        style={{
                            display: 'none',
                            background: 'rgba(255, 255, 255, 0.15)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            marginRight: '8px'
                        }}
                    >
                        <i className="fas fa-th"></i> Grid
                    </button>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: '#bbb' }}>Time Left</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: timeLeft <= 300 ? '#e74c3c' : 'white' }}>{formatTime(timeLeft)}</div>
                    </div>
                    
                    <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: '#ecf0f1', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2c3e50' }}>
                            <i className="fas fa-user"></i>
                        </div>
                        <span style={{ fontWeight: 'bold' }}>{currentUser.name}</span>
                    </div>
                </div>
            </div>

            <div style={ntaStyles.mainArea}>
                <div className="nta-left-pane" style={ntaStyles.leftPane}>
                    <div style={ntaStyles.qHeader}>
                        <h3 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>Question No. {currentQuestionIndex + 1}</h3>
                        <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>Marks: {activeQuestion.marks}</span>
                    </div>
                    
                    <div style={ntaStyles.qBody}>
                        <p style={{ fontSize: '1.2rem', marginBottom: '30px', fontWeight: '500' }}>{activeQuestion.questionText}</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {activeQuestion.options.map((opt, idx) => {
                                const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                                
                                let bg = 'white';
                                let border = '1px solid #ccc';
                                if (isReviewMode) {
                                    if (activeQuestion.correctOption === idx) {
                                        bg = '#d4edda'; border = '2px solid #28a745';
                                    } else if (isSelected && activeQuestion.correctOption !== idx) {
                                        bg = '#f8d7da'; border = '2px solid #dc3545';
                                    }
                                } else if (isSelected) {
                                    bg = '#e9f5ff'; border = '2px solid #337ab7';
                                }

                                return (
                                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: border, background: bg, borderRadius: '4px', cursor: isReviewMode ? 'default' : 'pointer' }}>
                                        <input 
                                            type="radio" 
                                            name={`q-${currentQuestionIndex}`}
                                            checked={isSelected}
                                            onChange={() => handleSelectOption(idx)}
                                            disabled={isReviewMode}
                                            style={{ transform: 'scale(1.2)' }}
                                        />
                                        <span style={{ fontSize: '1.1rem' }}>{opt}</span>
                                        {isReviewMode && activeQuestion.correctOption === idx && <i className="fas fa-check" style={{ color: '#28a745', marginLeft: 'auto' }}></i>}
                                        {isReviewMode && isSelected && activeQuestion.correctOption !== idx && <i className="fas fa-times" style={{ color: '#dc3545', marginLeft: 'auto' }}></i>}
                                    </label>
                                );
                            })}
                        </div>

                        {isReviewMode && (
                            <div style={{ marginTop: '30px', padding: '20px', background: '#d1ecf1', border: '1px solid #bee5eb', borderRadius: '4px', color: '#0c5460' }}>
                                <h4 style={{marginTop: 0}}><i className="fas fa-lightbulb"></i> Solution Explanation</h4>
                                <p style={{ whiteSpace: 'pre-line', margin: 0, marginTop: '10px' }}>{activeQuestion.solutionExplanation || 'No explanation provided.'}</p>
                            </div>
                        )}
                    </div>

                    {/* Standard control actions footer bar */}
                    {!isReviewMode ? (
                        <div style={ntaStyles.bottomBar}>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button style={ntaStyles.btnSaveNext} onClick={handleSaveAndNext}>Save & Next</button>
                                <button style={ntaStyles.btnClear} onClick={handleClearResponse}>Clear</button>
                                <button style={ntaStyles.btnSaveMark} onClick={handleSaveAndMarkReview}>Save & Mark Review</button>
                                <button style={ntaStyles.btnMarkNext} onClick={handleMarkReviewAndNext}>Mark Review & Next</button>
                            </div>
                        </div>
                    ) : (
                        <div style={ntaStyles.bottomBar}>
                             <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'space-between' }}>
                                <button 
                                    style={ntaStyles.btnClear} 
                                    onClick={() => jumpToQuestion(Math.max(0, currentQuestionIndex - 1))}
                                    disabled={currentQuestionIndex === 0}
                                >
                                    &lt;&lt; Previous
                                </button>
                                <button 
                                    style={ntaStyles.btnSaveNext} 
                                    onClick={() => jumpToQuestion(Math.min(exam.questions.length - 1, currentQuestionIndex + 1))}
                                    disabled={currentQuestionIndex === exam.questions.length - 1}
                                >
                                    Next &gt;&gt;
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Grid Drawer Backdrop Overlay */}
                <div 
                    className={`nta-grid-overlay ${isPaletteOpen ? 'open' : ''}`}
                    onClick={() => setIsPaletteOpen(false)}
                />

                {/* Right side Question palette pane */}
                <div className={`nta-right-pane ${isPaletteOpen ? 'open' : ''}`} style={ntaStyles.rightPane}>
                    {/* Mobile Close Button */}
                    <div className="show-on-mobile-flex" style={{ display: 'none', justifyContent: 'flex-end', padding: '10px 15px', background: '#dce7f3', borderBottom: '1px solid #ccc' }}>
                        <button 
                            onClick={() => setIsPaletteOpen(false)}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        >
                            <i className="fas fa-times"></i> Close Grid
                        </button>
                    </div>

                    <div style={{ padding: '15px', background: 'white', borderBottom: '1px solid #ccc' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '25px', height: '25px', background: '#fff', border: '1px solid #ccc', clipPath: ntaStyles.paletteItem.clipPath, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{counts.not_visited}</div>
                                <span>Not Visited</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '25px', height: '25px', background: '#d9534f', clipPath: ntaStyles.paletteItem.clipPath, color:'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{counts.not_answered}</div>
                                <span>Not Answered</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '25px', height: '25px', background: '#5cb85c', clipPath: ntaStyles.paletteItem.clipPath, color:'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{counts.answered}</div>
                                <span>Answered</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '25px', height: '25px', background: '#8e44ad', borderRadius: '50%', color:'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{counts.marked}</div>
                                <span>Mark for Review</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', gridColumn: '1 / span 2' }}>
                                <div style={{ width: '25px', height: '25px', background: '#8e44ad', borderRadius: '50%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color:'white' }}>
                                    <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '6px', height: '6px', background: '#5cb85c', borderRadius: '50%' }}></div>
                                </div>
                                <span>Answered & Marked for Review</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ padding: '10px', background: '#dce7f3', fontWeight: 'bold', color: '#333' }}>
                        Choose a Question
                    </div>
                    
                    <div style={{ padding: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px', overflowY: 'auto', flex: 1, background: '#e6f0fa', alignContent: 'flex-start' }}>
                        {exam.questions.map((_, idx) => {
                            const status = questionStatuses[idx];
                            let bg = '#fff';
                            let color = '#333';
                            let border = '1px solid #ccc';
                            let shape = ntaStyles.paletteItem.clipPath;
                            let hasDot = false;

                            if (status === 'not_answered') { bg = '#d9534f'; color = 'white'; border = 'none'; }
                            else if (status === 'answered') { bg = '#5cb85c'; color = 'white'; border = 'none'; }
                            else if (status === 'marked') { bg = '#8e44ad'; color = 'white'; border = 'none'; shape = 'circle(50% at 50% 50%)'; }
                            else if (status === 'answered_marked') { bg = '#8e44ad'; color = 'white'; border = 'none'; shape = 'circle(50% at 50% 50%)'; hasDot = true; }

                            return (
                                <div 
                                    key={idx}
                                    onClick={() => jumpToQuestion(idx)}
                                    style={{
                                        width: '40px', height: '40px', background: bg, color: color, border: border, 
                                        clipPath: shape, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                        cursor: 'pointer', fontWeight: 'bold', position: 'relative',
                                        boxShadow: currentQuestionIndex === idx ? '0 0 0 2px #337ab7 inset' : 'none'
                                    }}
                                >
                                    {idx + 1}
                                    {hasDot && <div style={{ position: 'absolute', bottom: '6px', right: '6px', width: '8px', height: '8px', background: '#5cb85c', borderRadius: '50%' }}></div>}
                                </div>
                            );
                        })}
                    </div>

                    {!isReviewMode ? (
                        <button style={ntaStyles.submitBtn} onClick={() => setShowSummaryModal(true)}>
                            Submit Exam
                        </button>
                    ) : (
                        <button style={{...ntaStyles.submitBtn, background: '#337ab7'}} onClick={onFinish}>
                            Exit Review
                        </button>
                    )}
                </div>
            </div>

            {showSummaryModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <div style={{ background: 'white', width: '90%', maxWidth: '500px', borderRadius: '8px', overflow: 'hidden', color: '#333', fontFamily: 'Arial' }}>
                        <div style={{ background: '#2c3e50', color: 'white', padding: '15px 20px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            Exam Summary
                        </div>
                        <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <p style={{ marginBottom: '20px' }}>Please review your exam summary before final submission:</p>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ border: '1px solid #ccc', padding: '10px' }}>No. of Questions</td>
                                        <td style={{ border: '1px solid #ccc', padding: '10px', fontWeight: 'bold' }}>{exam.questions.length}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '1px solid #ccc', padding: '10px', color: '#5cb85c', fontWeight: 'bold' }}>Answered</td>
                                        <td style={{ border: '1px solid #ccc', padding: '10px', fontWeight: 'bold' }}>{counts.answered + counts.answered_marked}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '1px solid #ccc', padding: '10px', color: '#d9534f', fontWeight: 'bold' }}>Not Answered</td>
                                        <td style={{ border: '1px solid #ccc', padding: '10px', fontWeight: 'bold' }}>{counts.not_answered}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '1px solid #ccc', padding: '10px', color: '#8e44ad', fontWeight: 'bold' }}>Marked for Review</td>
                                        <td style={{ border: '1px solid #ccc', padding: '10px', fontWeight: 'bold' }}>{counts.marked}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '1px solid #ccc', padding: '10px', color: '#8e44ad', fontWeight: 'bold' }}>Answered & Marked for Review</td>
                                        <td style={{ border: '1px solid #ccc', padding: '10px', fontWeight: 'bold' }}>{counts.answered_marked}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '1px solid #ccc', padding: '10px', color: '#777', fontWeight: 'bold' }}>Not Visited</td>
                                        <td style={{ border: '1px solid #ccc', padding: '10px', fontWeight: 'bold' }}>{counts.not_visited}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <p style={{ color: '#d9534f', fontWeight: 'bold', margin: 0 }}>Are you sure you want to submit for final marking?</p>
                        </div>
                        <div style={{ padding: '15px 20px', background: '#f5f5f5', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #ccc' }}>
                            <button onClick={() => setShowSummaryModal(false)} style={{ padding: '10px 20px', border: '1px solid #ccc', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>No, Go Back</button>
                            <button onClick={() => handleSubmitExam(false)} style={{ padding: '10px 20px', border: 'none', background: '#5cb85c', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Yes, Submit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

window.ExamTaking = function(props) {
    if (props.exam && props.exam.fileUrl) {
        return <UploadedExamTaking {...props} />;
    }
    return <NTAExamTaking {...props} />;
};
