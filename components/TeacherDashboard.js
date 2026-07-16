function TeacherDashboard({ currentUser }) {
    const [exams, setExams] = React.useState([]);
    const [results, setResults] = React.useState([]);
    const [dpqs, setDpqs] = React.useState([]);
    const [dpqAttempts, setDpqAttempts] = React.useState([]);
    const [users, setUsers] = React.useState([]);
    const [messages, setMessages] = React.useState([]);
    const [resultBatchFilter, setResultBatchFilter] = React.useState('All');
    const [settings, setSettings] = React.useState({ batches: [] });

    React.useEffect(() => {
        async function loadTeacherData() {
            try {
                const [fetchedExams, fetchedResults, fetchedDpqs, fetchedAttempts, fetchedUsers, fetchedMessages, fetchedSettings] = await Promise.all([
                    api.getExams(),
                    api.getResults(),
                    api.getDpqs(),
                    api.getDpqAttempts(),
                    api.getUsers(),
                    api.getMessagesForUser(currentUser.id),
                    api.getSettings()
                ]);
                setExams(fetchedExams);
                setResults(fetchedResults);
                setDpqs(fetchedDpqs);
                setDpqAttempts(fetchedAttempts);
                setUsers(fetchedUsers);
                setMessages(fetchedMessages || []);
                setSettings(fetchedSettings || { batches: [] });
            } catch (err) {
                console.error('Failed to load teacher dashboard data:', err);
            }
        }
        loadTeacherData();

        // Real-time polling: refresh messages every 30 seconds
        const msgInterval = setInterval(async () => {
            try {
                const fresh = await api.getMessagesForUser(currentUser.id);
                setMessages(fresh || []);
            } catch (e) { /* silent fail */ }
        }, 30000);

        return () => clearInterval(msgInterval);
    }, []);

    const [activeTab, setActiveTab] = React.useState('overview'); // 'overview' | 'publish_dpq' | 'student_grades' | 'doubts'
    const [successMessage, setSuccessMessage] = React.useState('');

    // Test-Specific Leaderboard states for Teacher
    const [selectedGradeExamId, setSelectedGradeExamId] = React.useState('exam-thermo-shm');
    const [expandedStudentResultId, setExpandedStudentResultId] = React.useState(null);

    // Unread message count for teacher
    const unreadCount = messages.filter(m => m.receiverId == currentUser.id && m.read === false).length;

    const handleOpenDoubts = async () => {
        setActiveTab('doubts');
        const unread = messages.filter(m => m.receiverId == currentUser.id && m.read === false);
        for (const msg of unread) {
            await api.markMessageRead(msg.id);
        }
        setMessages(prev => prev.map(m => m.receiverId == currentUser.id ? { ...m, read: true } : m));
    };

    // Filtered data for teacher's subject
    const subject = currentUser.subject; // e.g. 'Physics', 'Chemistry', 'Mathematics', 'Biology'
    const subjectExams = exams.filter(e => e.subject.toLowerCase() === subject.toLowerCase());
    const subjectDpqs = dpqs.filter(d => d.subject.toLowerCase() === subject.toLowerCase());
    const subjectResults = results.filter(r => {
        const exam = exams.find(e => e.id === r.examId);
        return exam && exam.subject.toLowerCase() === subject.toLowerCase();
    }).filter(r => {
        if (resultBatchFilter === 'All') return true;
        const student = users.find(u => u.id === r.studentId);
        return student && student.batch === resultBatchFilter;
    });

    // Subject metrics
    const totalSubjectAttempts = subjectResults.length;
    const avgSubjectScore = totalSubjectAttempts > 0 
        ? (subjectResults.reduce((acc, r) => acc + r.percentage, 0) / totalSubjectAttempts).toFixed(1) 
        : 0;
    const subjectPassingRate = totalSubjectAttempts > 0 
        ? ((subjectResults.filter(r => r.passed).length / totalSubjectAttempts) * 100).toFixed(1) 
        : 0;

    // Calculate Test-Specific Leaderboard rankings for Teacher
    const getTestLeaderboard = (examId) => {
        if (!examId) return [];
        const examResults = results.filter(r => r.examId === examId);
        const studentMap = {};
        
        examResults.forEach(res => {
            const currentBest = studentMap[res.studentId];
            if (!currentBest || res.score > currentBest.score) {
                studentMap[res.studentId] = {
                    name: res.studentName,
                    score: res.score,
                    totalMarks: res.totalMarks,
                    percentage: res.percentage,
                    passed: res.passed,
                    date: res.date
                };
            }
        });
        
        return Object.values(studentMap).sort((a, b) => b.score - a.score);
    };

    // Calculate Student Topic Analytics for a specific result
    const getStudentTopicAnalytics = (res) => {
        if (!res) return [];
        const exam = exams.find(e => e.id === res.examId);
        if (!exam || !exam.questions) return [];
        
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
            const userAns = res.answers && res.answers[index] !== undefined ? res.answers[index] : -1;
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

    // Form state for publishing new DPP (restricted to teacher's subject)
    const [newDpqText, setNewDpqText] = React.useState('');
    const [newDpqOptions, setNewDpqOptions] = React.useState(['', '', '', '']);
    const [newDpqCorrect, setNewDpqCorrect] = React.useState(0);
    const [newDpqBatches, setNewDpqBatches] = React.useState([settings?.batches?.[0] || '']);
    const [newDpqSolution, setNewDpqSolution] = React.useState('');
    const [dpqUploadNumQuestions, setDpqUploadNumQuestions] = React.useState(10);
    const [dpqQuestions, setDpqQuestions] = React.useState([]);
    const [dpqCreationMode, setDpqCreationMode] = React.useState('manual');
    const [dpqFileUrl, setDpqFileUrl] = React.useState('');
    const [dpqFileType, setDpqFileType] = React.useState('');
    const [isDpqUploading, setIsDpqUploading] = React.useState(false);

    const [dpqAnsFileUrl, setDpqAnsFileUrl] = React.useState('');
    const [dpqAnsFileType, setDpqAnsFileType] = React.useState('');

    const handleDpqFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsDpqUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result;
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: file.name, data: base64 })
                });
                const resData = await response.json();
                setDpqFileUrl(resData.url);
                const ext = file.name.split('.').pop().toLowerCase();
                setDpqFileType(ext);
                setIsDpqUploading(false);
                setSuccessMessage('DPP file uploaded successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            };
        } catch (err) {
            console.error(err);
            alert('Failed to upload file');
            setIsDpqUploading(false);
        }
    };

    const handleDpqAnsFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsDpqUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result;
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: file.name, data: base64 })
                });
                const resData = await response.json();
                setDpqAnsFileUrl(resData.url);
                const ext = file.name.split('.').pop().toLowerCase();
                setDpqAnsFileType(ext);
                setIsDpqUploading(false);
                setSuccessMessage('DPP Answer Key uploaded successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            };
        } catch (err) {
            console.error(err);
            alert('Failed to upload answer key');
            setIsDpqUploading(false);
        }
    };

    const handleNewDpqOptionChange = (idx, val) => {
        setNewDpqOptions(prev => {
            const copy = [...prev];
            copy[idx] = val;
            return copy;
        });
    };

    const [replyText, setReplyText] = React.useState('');
    const [replyFile, setReplyFile] = React.useState(null);
    const [replyFileType, setReplyFileType] = React.useState('');

    const handleReply = async (studentId, studentName) => {
        if (!replyText && !replyFile) return alert('Please enter a reply or upload a file.');
        try {
            const newMsg = {
                senderId: currentUser.id,
                senderName: currentUser.name,
                senderRole: 'teacher',
                receiverId: studentId,
                receiverName: studentName,
                receiverRole: 'student',
                text: replyText,
                fileUrl: replyFile,
                fileType: replyFileType
            };
            const saved = await api.sendMessage(newMsg);
            setMessages(prev => [...prev, saved]);
            setReplyText('');
            setReplyFile(null);
            setReplyFileType('');
        } catch (err) {
            alert('Failed to send reply');
        }
    };

    const generateDpqUploadQuestions = () => {
        const num = Number(dpqUploadNumQuestions);
        const newQs = [];
        for (let i = 0; i < num; i++) {
            newQs.push({
                options: ['A', 'B', 'C', 'D'],
                correctOption: 0
            });
        }
        setDpqQuestions(newQs);
    };

    const handleDpqQuestionChange = (qIdx, optIdx) => {
        setDpqQuestions(prev => {
            const copy = [...prev];
            copy[qIdx].correctOption = optIdx;
            return copy;
        });
    };

    const handleCreateDpqSubmit = async (e) => {
        e.preventDefault();
        if (dpqCreationMode === 'manual' && newDpqOptions.some(o => !o.trim())) {
            alert('Please fill in all 4 options.');
            return;
        }

        const optionsProvided = !newDpqOptions.some(o => !o.trim());

        if (newDpqBatches.length === 0) {
            alert('Please select at least one batch.');
            return;
        }

        const newDpq = {
            id: 'dpq-' + Date.now(),
            questionText: newDpqText.trim(),
            subject: subject, // Locked to teacher's subject
            options: optionsProvided ? newDpqOptions.map(o => o.trim()) : [],
            correctOption: optionsProvided ? Number(newDpqCorrect) : -1,
            date: new Date().toLocaleDateString(),
            homeworkForBatches: newDpqBatches,
            solutionExplanation: newDpqSolution.trim(),
            fileUrl: dpqFileUrl,
            fileType: dpqFileType,
            ansUrl: dpqAnsFileUrl,
            ansFileType: dpqAnsFileType,
            questions: dpqCreationMode === 'upload' ? dpqQuestions : []
        };

        try {
            const savedDpq = await api.createDpq(newDpq);
            setDpqs(prev => [savedDpq, ...prev]);
            setSuccessMessage(`Successfully published new ${subject} Practice Problem!`);

            // Reset form
            setNewDpqText('');
            setNewDpqOptions(['', '', '', '']);
            setNewDpqCorrect(0);
            setNewDpqSolution('');
            setDpqCreationMode('manual');
            setDpqFileUrl('');
            setDpqFileType('');
            setDpqAnsFileUrl('');
            setDpqAnsFileType('');

            setTimeout(() => setSuccessMessage(''), 5000);
            setActiveTab('overview');
        } catch (err) {
            alert('Failed to publish the Daily Practice Problem.');
        }
    };

    // New exam form states (restricted to teacher's subject)
    const [newExamTitle, setNewExamTitle] = React.useState('');
    const [newExamScheduledDateStr, setNewExamScheduledDateStr] = React.useState('');
    const [newExamScheduledTimeStr, setNewExamScheduledTimeStr] = React.useState('');
    const [newExamDuration, setNewExamDuration] = React.useState(15);
    const [newExamTotalMarks, setNewExamTotalMarks] = React.useState(30);
    const [newExamPassingMarks, setNewExamPassingMarks] = React.useState(15);
    const [newExamDesc, setNewExamDesc] = React.useState('');
    const [newExamBatches, setNewExamBatches] = React.useState([settings?.batches?.[0] || '']);
    const [creationMode, setCreationMode] = React.useState('manual');
    const [examFileUrl, setExamFileUrl] = React.useState('');
    const [examFileType, setExamFileType] = React.useState('');
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadNumQuestions, setUploadNumQuestions] = React.useState(10);
    const [questions, setQuestions] = React.useState([
        { questionText: '', options: ['', '', '', ''], correctOption: 0, marks: 10, solutionExplanation: '' }
    ]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result;
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: file.name, data: base64 })
                });
                const resData = await response.json();
                setExamFileUrl(resData.url);
                const ext = file.name.split('.').pop().toLowerCase();
                setExamFileType(ext);
                setIsUploading(false);
                setSuccessMessage('File uploaded successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            };
        } catch (err) {
            console.error(err);
            alert('Failed to upload file');
            setIsUploading(false);
        }
    };
    
    const generateUploadQuestions = () => {
        const num = Number(uploadNumQuestions);
        const newQs = [];
        for (let i = 0; i < num; i++) {
            newQs.push({
                questionText: `Question ${i + 1} (See uploaded paper)`,
                options: ['A', 'B', 'C', 'D'],
                correctOption: 0,
                marks: Math.floor(newExamTotalMarks / num) || 1,
                solutionExplanation: 'Refer to the uploaded answer key or paper for details.',
                topic: 'General'
            });
        }
        setQuestions(newQs);
    };

    const handleAddQuestion = () => {
        setQuestions(prev => [
            ...prev,
            { questionText: '', options: ['', '', '', ''], correctOption: 0, marks: 10, solutionExplanation: '', topic: '' }
        ]);
    };

    const handleQuestionChange = (qIdx, field, val) => {
        setQuestions(prev => {
            const copy = [...prev];
            copy[qIdx][field] = val;
            return copy;
        });
    };

    const handleOptionChange = (qIdx, optIdx, val) => {
        setQuestions(prev => {
            const copy = [...prev];
            copy[qIdx].options[optIdx] = val;
            return copy;
        });
    };

    const handleCreateExamSubmit = async (e) => {
        e.preventDefault();

        // Validate
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.questionText.trim()) {
                alert(`Please enter question text for question #${i + 1}`);
                return;
            }
            if (q.options.some(o => !o.trim())) {
                alert(`Please complete all 4 options for question #${i + 1}`);
                return;
            }
        }

        if (newExamBatches.length === 0) return alert('Please select at least one batch.');

        const newExam = {
            id: 'exam-' + Date.now(),
            title: newExamTitle.trim(),
            subject: subject, // Locked to teacher's subject
            assignedBatches: newExamBatches,
            durationMinutes: Number(newExamDuration),
            totalMarks: Number(newExamTotalMarks),
            passingMarks: Number(newExamPassingMarks),
            description: newExamDesc.trim() || `${subject} evaluation test.`,
            fileUrl: examFileUrl,
            fileType: examFileType,
            scheduledDate: newExamScheduledDateStr ? new Date(`${newExamScheduledDateStr}T${newExamScheduledTimeStr || '00:00'}`).toISOString() : '',
            questions: questions.map((q, i) => ({
                id: 'q_' + i + '_' + Date.now(),
                questionText: q.questionText.trim(),
                options: q.options.map(o => o.trim()),
                correctOption: Number(q.correctOption),
                marks: Number(q.marks),
                solutionExplanation: q.solutionExplanation.trim() || 'No explanation provided.'
            }))
        };

        try {
            const savedExam = await api.createExam(newExam);
            setExams(prev => [savedExam, ...prev]);
            setSuccessMessage(`Successfully created new ${subject} test! It is now live for all enrolled students.`);

            // Reset form
            setNewExamTitle('');
            setNewExamScheduledDateStr('');
            setNewExamScheduledTimeStr('');
            setNewExamDesc('');
            setNewExamBatch(settings?.batches?.[0] || '');
            setCreationMode('manual');
            setExamFileUrl('');
            setExamFileType('');
            setQuestions([{ questionText: '', options: ['', '', '', ''], correctOption: 0, marks: 10, solutionExplanation: '' }]);

            setTimeout(() => setSuccessMessage(''), 5000);
            setActiveTab('overview');
        } catch (err) {
            alert('Failed to save the new exam.');
        }
    };

    const handleDeleteDpq = async (dpqId) => {
        if (window.confirm('Are you sure you want to delete this Daily Practice Problem?')) {
            try {
                await api.deleteDpq(dpqId);
                setDpqs(prev => prev.filter(d => d.id !== dpqId));
            } catch (err) {
                alert('Failed to delete Daily Practice Problem.');
            }
        }
    };

    return (
        <div style={{ padding: '40px 0' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
                
                {/* Header Welcome Card */}
                <div className="glass-panel" style={{ padding: '36px', marginBottom: '36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                                <i className="fas fa-graduation-cap" style={{ marginRight: '6px' }}></i> Faculty Dashboard
                            </span>
                            <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc' }}>
                                <i className="fas fa-book-open" style={{ marginRight: '6px' }}></i> {subject} Department
                            </span>
                        </div>
                        <h1 style={{ fontSize: '2.2rem', color: 'white', marginBottom: '8px' }}>
                            Welcome, {currentUser.name}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                            Review student responses, publish custom curriculum assignments, and manage {subject} practice questions.
                        </p>
                    </div>

                    {/* Navigation tabs */}
                    <div className="hide-on-mobile" style={{ display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
                        <button 
                            onClick={() => setActiveTab('overview')}
                            style={{
                                background: activeTab === 'overview' ? 'var(--primary-gradient)' : 'transparent',
                                color: activeTab === 'overview' ? 'white' : 'var(--text-muted)',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i className="fas fa-chart-line" style={{ marginRight: '8px' }}></i> Overview
                        </button>
                        <button 
                            onClick={() => setActiveTab('create_exam')}
                            style={{
                                background: activeTab === 'create_exam' ? 'var(--primary-gradient)' : 'transparent',
                                color: activeTab === 'create_exam' ? 'white' : 'var(--text-muted)',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i className="fas fa-plus-circle" style={{ marginRight: '8px' }}></i> Create Exam
                        </button>
                        <button 
                            onClick={() => setActiveTab('publish_dpq')}
                            style={{
                                background: activeTab === 'publish_dpq' ? 'var(--primary-gradient)' : 'transparent',
                                color: activeTab === 'publish_dpq' ? 'white' : 'var(--text-muted)',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i className="fas fa-pencil-alt" style={{ marginRight: '8px' }}></i> Publish DPP
                        </button>
                        <button 
                            onClick={() => setActiveTab('student_grades')}
                            style={{
                                background: activeTab === 'student_grades' ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' : 'transparent',
                                color: activeTab === 'student_grades' ? 'white' : 'var(--text-muted)',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                            <i className="fas fa-graduation-cap" style={{ marginRight: '8px' }}></i> Grades
                        </button>
                        <button 
                            onClick={handleOpenDoubts}
                            style={{
                                background: activeTab === 'doubts' ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' : 'transparent',
                                color: activeTab === 'doubts' ? 'white' : 'var(--text-muted)',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                position: 'relative'
                            }}>
                            <i className="fas fa-question-circle" style={{ marginRight: '8px' }}></i> Student Doubts
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    right: '-6px',
                                    background: '#ef4444',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    fontSize: '0.72rem',
                                    fontWeight: '800',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 8px rgba(239,68,68,0.8)',
                                    animation: 'pulse 1.5s infinite'
                                }}>{unreadCount}</span>
                            )}
                        </button>
                    </div>
                </div>

                {successMessage && (
                    <div style={{
                        background: 'var(--success-bg)',
                        border: '1px solid var(--success-color)',
                        padding: '16px 24px',
                        borderRadius: '16px',
                        color: 'var(--success-color)',
                        marginBottom: '32px',
                        fontSize: '1.05rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)'
                    }}>
                        <i className="fas fa-check-circle" style={{ fontSize: '1.4rem' }}></i>
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                    <div>
                        {/* Metrics Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                            <div className="glass-panel" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Subject Exams</span>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                                        <i className="fas fa-file-invoice"></i>
                                    </div>
                                </div>
                                <span style={{ display: 'block', fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{subjectExams.length}</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Created Mock Examinations</span>
                            </div>

                            <div className="glass-panel" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>DPPs Published</span>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                                        <i className="fas fa-pencil-alt"></i>
                                    </div>
                                </div>
                                <span style={{ display: 'block', fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{subjectDpqs.length}</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Daily concept questions</span>
                            </div>

                            <div className="glass-panel" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Avg Student Score</span>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                                        <i className="fas fa-percentage"></i>
                                    </div>
                                </div>
                                <span style={{ display: 'block', fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{avgSubjectScore}%</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mean evaluation percentage</span>
                            </div>

                            <div className="glass-panel" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Department Passing Rate</span>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                                        <i className="fas fa-check-double"></i>
                                    </div>
                                </div>
                                <span style={{ display: 'block', fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{subjectPassingRate}%</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Passing rate benchmark</span>
                            </div>
                        </div>

                        {/* Subject mock exams and active DPP lists */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px' }}>
                            {/* Subject Exams */}
                            <div className="glass-panel" style={{ padding: '32px' }}>
                                <h3 style={{ fontSize: '1.35rem', color: 'white', marginBottom: '20px' }}>
                                    <i className="fas fa-file-alt text-gradient" style={{ marginRight: '8px' }}></i> Mock Exams ({subjectExams.length})
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {subjectExams.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                                            No mock exams created for {subject} yet.
                                        </div>
                                    ) : (
                                        subjectExams.map(exam => {
                                            const attempts = results.filter(r => r.examId === exam.id);
                                            return (
                                                <div key={exam.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '12px', gap: '16px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: '600' }}>{exam.title}</h4>
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Duration: {exam.durationMinutes}m | {exam.questions.length} Questions</span>
                                                        {exam.scheduledDate && (
                                                            <div style={{ fontSize: '0.85rem', color: '#fbbf24', marginTop: '4px' }}>
                                                                <i className="fas fa-calendar-alt"></i> Scheduled: {new Date(exam.scheduledDate).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontSize: '0.8rem' }}>
                                                            {attempts.length} Submissions
                                                        </span>
                                                        <button 
                                                            onClick={async () => {
                                                                if (window.confirm(`Are you sure you want to delete exam "${exam.title}"?`)) {
                                                                    try {
                                                                        await api.deleteExam(exam.id);
                                                                        setExams(prev => prev.filter(e => e.id !== exam.id));
                                                                    } catch (err) {
                                                                        alert('Failed to delete exam.');
                                                                    }
                                                                }
                                                            }}
                                                            className="btn-danger"
                                                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                                        >
                                                            <i className="fas fa-trash-alt"></i> Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Subject DPPs */}
                            <div className="glass-panel" style={{ padding: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '1.35rem', color: 'white', margin: 0 }}>
                                        <i className="fas fa-pencil-alt text-gradient" style={{ marginRight: '8px' }}></i> Active Daily Problems ({subjectDpqs.length})
                                    </h3>
                                    <button onClick={() => setActiveTab('publish_dpq')} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                                        <i className="fas fa-plus"></i> New DPP
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {subjectDpqs.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                                            No practice problems published yet.
                                        </div>
                                    ) : (
                                        subjectDpqs.map(dpq => {
                                            const attempts = dpqAttempts.filter(a => a.dpqId === dpq.id);
                                            return (
                                                <div key={dpq.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
                                                    <div style={{ flex: 1, marginRight: '16px' }}>
                                                        <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '600', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{dpq.questionText}</h4>
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target: {dpq.homeworkForBatches ? dpq.homeworkForBatches.join(', ') : dpq.homeworkForBatch} | Solved: {attempts.length} students</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDeleteDpq(dpq.id)}
                                                        className="btn-danger"
                                                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                                    >
                                                        <i className="fas fa-trash-alt"></i> Delete
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: PUBLISH DPP */}
                {activeTab === 'publish_dpq' && (
                    <div className="glass-panel" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
                        <h3 style={{ fontSize: '1.6rem', color: 'white', marginBottom: '8px' }}>
                            <i className="fas fa-file-medical text-gradient" style={{ marginRight: '8px' }}></i> Create Daily Practice Problem
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '32px' }}>
                            Publish conceptual homework questions locked specifically to your assigned subject: <strong>{subject}</strong>.
                        </p>

                        <form onSubmit={handleCreateDpqSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Mode Toggle */}
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                                <button type="button" onClick={() => setDpqCreationMode('manual')} className={dpqCreationMode === 'manual' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 16px', borderRadius: '8px' }}>Manual Entry</button>
                                <button type="button" onClick={() => setDpqCreationMode('upload')} className={dpqCreationMode === 'upload' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 16px', borderRadius: '8px' }}>Upload Paper (PDF/Word/Image)</button>
                            </div>

                            {/* Upload Section */}
                            {dpqCreationMode === 'upload' && (
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '28px', borderRadius: '20px', border: '1px solid var(--border-glass)' }}>
                                    <h4 style={{ color: 'white', marginBottom: '16px' }}><i className="fas fa-cloud-upload-alt" style={{ marginRight: '8px', color: '#60a5fa' }}></i>Upload DPP Question Sheet</h4>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>Upload a PDF, Image, or Word file containing the practice problem(s). Students will see it alongside the answer options.</p>
                                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleDpqFileUpload} style={{ color: 'white', marginBottom: '16px', width: '100%' }} />
                                    {isDpqUploading && <span style={{ color: 'var(--text-muted)' }}><i className="fas fa-spinner fa-spin"></i> Uploading...</span>}
                                    {dpqFileUrl && <div style={{ color: 'var(--success-color)', marginTop: '8px' }}><i className="fas fa-check-circle"></i> File uploaded successfully</div>}
                                    
                                    <h4 style={{ color: 'white', marginBottom: '16px', marginTop: '24px' }}><i className="fas fa-key" style={{ marginRight: '8px', color: '#10b981' }}></i>Upload Answer Key (Optional)</h4>
                                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleDpqAnsFileUpload} style={{ color: 'white', marginBottom: '16px', width: '100%' }} />
                                    {dpqAnsFileUrl && <div style={{ color: 'var(--success-color)', marginTop: '8px' }}><i className="fas fa-check-circle"></i> Answer Key uploaded successfully</div>}

                                    <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                                        <h4 style={{ color: 'white', marginBottom: '16px' }}><i className="fas fa-list-ol" style={{ marginRight: '8px', color: '#f59e0b' }}></i>Multiple Questions (Optional)</h4>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>If your uploaded paper has multiple questions, enter the number of questions to generate an answer grid for students to fill.</p>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                                            <input type="number" className="input-premium" style={{ width: '100px' }} value={dpqUploadNumQuestions} onChange={e => setDpqUploadNumQuestions(e.target.value)} min="1" />
                                            <button type="button" onClick={generateDpqUploadQuestions} className="btn-secondary" style={{ padding: '12px 24px' }}>Generate Answer Grid</button>
                                        </div>

                                        {dpqQuestions.length > 0 && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginTop: '16px' }}>
                                                {dpqQuestions.map((q, qIdx) => (
                                                    <div key={qIdx} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                        <div style={{ color: 'white', marginBottom: '8px', fontWeight: 'bold' }}>Q{qIdx + 1}</div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            {q.options.map((opt, optIdx) => (
                                                                <label key={optIdx} style={{ color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                                                                    <input 
                                                                        type="radio" 
                                                                        name={`dpq_upload_q_${qIdx}`}
                                                                        checked={q.correctOption === optIdx}
                                                                        onChange={() => handleDpqQuestionChange(qIdx, optIdx)}
                                                                    />
                                                                    {opt}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="input-label">Daily Question Text</label>
                                <textarea 
                                    rows="4" 
                                    className="input-premium"
                                    placeholder={dpqCreationMode === 'upload' ? 'Briefly describe the uploaded problem (e.g. Solve Q1-Q5 from the uploaded sheet)...' : 'Type the concept problem statement here...'}
                                    value={newDpqText}
                                    onChange={e => setNewDpqText(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <label className="input-label">Assigned Batches</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                                        {(settings?.batches || []).map(b => (
                                            <label key={b} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', cursor: 'pointer' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={newDpqBatches.includes(b)}
                                                    onChange={e => {
                                                        if (e.target.checked) setNewDpqBatches(prev => [...prev, b]);
                                                        else setNewDpqBatches(prev => prev.filter(x => x !== b));
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                {b}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">Locked Subject Department</label>
                                    <input 
                                        type="text" 
                                        className="input-premium" 
                                        value={subject} 
                                        disabled 
                                        style={{ background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed', color: '#c084fc', fontWeight: '700' }}
                                    />
                                </div>
                            </div>

                            {dpqCreationMode === 'manual' && (
                                <>
                                    <div>
                                        <label className="input-label" style={{ marginBottom: '16px' }}>Provide MCQ Options (Select the Radio Button corresponding to the correct answer)</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {newDpqOptions.map((optText, optIdx) => (
                                                <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.2)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                                                    <input 
                                                        type="radio" 
                                                        name="dpq_correct_option"
                                                        checked={newDpqCorrect === optIdx}
                                                        onChange={() => setNewDpqCorrect(optIdx)}
                                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                    />
                                                    <input 
                                                        type="text"
                                                        className="input-premium"
                                                        style={{ padding: '8px 12px', background: 'transparent', border: 'none' }}
                                                        placeholder={`Option ${optIdx + 1}`}
                                                        value={optText}
                                                        onChange={e => handleNewDpqOptionChange(optIdx, e.target.value)}
                                                        required={dpqCreationMode === 'manual'}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="input-label">Detailed Solution Explanation (Shown after answer submission)</label>
                                        <textarea 
                                            rows="4"
                                            className="input-premium"
                                            placeholder="Provide step-by-step mathematical or conceptual hints and full solution..."
                                            value={newDpqSolution}
                                            onChange={e => setNewDpqSolution(e.target.value)}
                                            required={dpqCreationMode === 'manual'}
                                        />
                                    </div>
                                </>
                            )}

                            <button type="submit" className="btn-primary" style={{ padding: '16px', fontSize: '1.1rem', justifyContent: 'center', marginTop: '16px', background: 'var(--secondary-gradient)', boxShadow: '0 0 25px rgba(59, 130, 246, 0.4)' }}>
                                <i className="fas fa-paper-plane"></i> Publish {subject} Practice Problem
                            </button>
                        </form>
                    </div>
                )}

                {/* TAB 4: CREATE EXAM FORM */}
                {activeTab === 'create_exam' && (
                    <div className="glass-panel animate-fade-in" style={{ padding: '48px', maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '2rem', color: 'white', marginBottom: '8px' }}>Create {subject} Online Examination</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Design a new test with automated grading and instant publication locked to your subject department.</p>
                        </div>

                        <form onSubmit={handleCreateExamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div>
                                <label className="input-label">Exam Title</label>
                                <input 
                                    type="text"
                                    className="input-premium"
                                    placeholder={`e.g. JEE Advanced Mock Test - ${subject}`}
                                    value={newExamTitle}
                                    onChange={e => setNewExamTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label className="input-label">Assigned Batches</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                                        {(settings?.batches || []).map(b => (
                                            <label key={b} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', cursor: 'pointer' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={newExamBatches.includes(b)}
                                                    onChange={e => {
                                                        if (e.target.checked) setNewExamBatches(prev => [...prev, b]);
                                                        else setNewExamBatches(prev => prev.filter(x => x !== b));
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                {b}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">Subject (Locked)</label>
                                    <input 
                                        type="text"
                                        className="input-premium"
                                        value={subject}
                                        disabled
                                        style={{ background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed', color: '#c084fc', fontWeight: '700' }}
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Duration (Minutes)</label>
                                    <input 
                                        type="number"
                                        className="input-premium"
                                        min="1"
                                        max="180"
                                        value={newExamDuration}
                                        onChange={e => setNewExamDuration(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label className="input-label">Scheduled Date (Optional)</label>
                                    <input 
                                        type="date"
                                        className="input-premium"
                                        value={newExamScheduledDateStr}
                                        onChange={e => setNewExamScheduledDateStr(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Scheduled Time (Optional)</label>
                                    <input 
                                        type="time"
                                        className="input-premium"
                                        value={newExamScheduledTimeStr}
                                        onChange={e => setNewExamScheduledTimeStr(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label className="input-label">Total Marks</label>
                                    <input 
                                        type="number"
                                        className="input-premium"
                                        min="1"
                                        value={newExamTotalMarks}
                                        onChange={e => setNewExamTotalMarks(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Passing Marks Requirement</label>
                                    <input 
                                        type="number"
                                        className="input-premium"
                                        min="1"
                                        value={newExamPassingMarks}
                                        onChange={e => setNewExamPassingMarks(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="input-label">Description & Instructions</label>
                                <textarea 
                                    rows="3"
                                    className="input-premium"
                                    placeholder="Provide clear guidelines and syllabus topics covered in this examination."
                                    value={newExamDesc}
                                    onChange={e => setNewExamDesc(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Multiple Choice Questions Section */}
                            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '32px' }}>
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                                    <button type="button" onClick={() => setCreationMode('manual')} className={creationMode === 'manual' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 16px', borderRadius: '8px' }}>Manual Entry</button>
                                    <button type="button" onClick={() => setCreationMode('upload')} className={creationMode === 'upload' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 16px', borderRadius: '8px' }}>Upload Paper (PDF/Word/Image)</button>
                                </div>
                                
                                {creationMode === 'upload' && (
                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '28px', borderRadius: '20px', border: '1px solid var(--border-glass)', marginBottom: '32px' }}>
                                        <h4 style={{ color: 'white', marginBottom: '16px' }}>Upload Question Paper</h4>
                                        <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileUpload} style={{ color: 'white', marginBottom: '16px', width: '100%' }} />
                                        {isUploading && <span style={{ color: 'var(--text-muted)', marginLeft: '12px' }}>Uploading...</span>}
                                        {examFileUrl && <div style={{ color: 'var(--success-color)', marginBottom: '16px' }}><i className="fas fa-check-circle"></i> File ready: {examFileUrl}</div>}
                                        
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'end' }}>
                                            <div>
                                                <label className="input-label">Total Questions in Paper</label>
                                                <input type="number" className="input-premium" value={uploadNumQuestions} onChange={e => setUploadNumQuestions(e.target.value)} min="1" />
                                            </div>
                                            <button type="button" onClick={generateUploadQuestions} className="btn-secondary" style={{ padding: '12px 24px' }}>Generate Answer Key Grid</button>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '1.5rem', color: 'white' }}>{creationMode === 'manual' ? `Test Questions (${questions.length})` : `Answer Key Grid (${questions.length})`}</h3>
                                    <button 
                                        type="button"
                                        onClick={handleAddQuestion}
                                        className="btn-secondary"
                                        style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                    >
                                        <i className="fas fa-plus"></i> Add Another Question
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    {questions.map((q, qIdx) => (
                                        <div key={qIdx} style={{ background: 'rgba(0,0,0,0.3)', padding: '28px', borderRadius: '20px', border: '1px solid var(--border-glass)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                                <span className="badge" style={{ background: 'var(--primary-gradient)', color: 'white' }}>Question #{qIdx + 1}</span>
                                                {questions.length > 1 && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setQuestions(prev => prev.filter((_, idx) => idx !== qIdx))}
                                                        style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '1rem' }}
                                                    >
                                                        <i className="fas fa-trash"></i> Remove Question
                                                    </button>
                                                )}
                                            </div>

                                            <div style={{ marginBottom: '20px' }}>
                                                <label className="input-label">Question Text</label>
                                                <input 
                                                    type="text"
                                                    className="input-premium"
                                                    placeholder="Enter question statement..."
                                                    value={q.questionText}
                                                    onChange={e => handleQuestionChange(qIdx, 'questionText', e.target.value)}
                                                    disabled={creationMode === 'upload'}
                                                    required
                                                />
                                            </div>

                                            <div style={{ marginBottom: '24px' }}>
                                                <label className="input-label">Options (Select radio button for correct answer)</label>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                    {q.options.map((optText, optIdx) => (
                                                        <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.4)', padding: '12px 16px', borderRadius: '12px', border: q.correctOption === optIdx ? '1px solid #10b981' : '1px solid transparent' }}>
                                                            <input 
                                                                type="radio" 
                                                                name={`correct_opt_${qIdx}`}
                                                                checked={q.correctOption === optIdx}
                                                                onChange={() => handleQuestionChange(qIdx, 'correctOption', optIdx)}
                                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                            />
                                                            <input 
                                                                type="text"
                                                                className="input-premium"
                                                                style={{ padding: '8px 12px', background: 'transparent', border: 'none' }}
                                                                placeholder={`Option ${optIdx + 1}`}
                                                                value={optText}
                                                                onChange={e => handleOptionChange(qIdx, optIdx, e.target.value)}
                                                                disabled={creationMode === 'upload'}
                                                                required
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                                    <div>
                                                        <label className="input-label">Marks for this question</label>
                                                        <input 
                                                            type="number"
                                                            className="input-premium"
                                                            style={{ width: '130px' }}
                                                            min="1"
                                                            value={q.marks}
                                                            onChange={e => handleQuestionChange(qIdx, 'marks', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="input-label">Topic / Concept</label>
                                                        <input 
                                                            type="text"
                                                            className="input-premium"
                                                            style={{ width: '220px' }}
                                                            placeholder="e.g. Thermodynamics, Friction"
                                                            value={q.topic || ''}
                                                            onChange={e => handleQuestionChange(qIdx, 'topic', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: '300px' }}>
                                                        <label className="input-label">Solution Explanation</label>
                                                        <textarea 
                                                            rows="2"
                                                            className="input-premium"
                                                            placeholder="Provide detailed solution or steps shown after submission..."
                                                            value={q.solutionExplanation || ''}
                                                            onChange={e => handleQuestionChange(qIdx, 'solutionExplanation', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" style={{ padding: '20px', fontSize: '1.2rem', justifyContent: 'center', marginTop: '16px' }}>
                                <i className="fas fa-cloud-upload-alt"></i> Publish {subject} Examination
                            </button>
                        </form>
                    </div>
                )}

                {/* TAB 3: STUDENT GRADES */}
                {activeTab === 'student_grades' && (
                    <div>
                        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h2 style={{ fontSize: '1.8rem', color: 'white' }}>Student overall performance in {subject}</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Track score records, submission percentages, and passing rate statuses for mock evaluations.</p>
                            </div>
                            <div>
                                <label style={{ color: 'var(--text-muted)', marginRight: '12px' }}>Filter by Batch:</label>
                                <select 
                                    className="input-premium"
                                    value={resultBatchFilter}
                                    onChange={e => setResultBatchFilter(e.target.value)}
                                    style={{ background: '#111827', width: 'auto', display: 'inline-block' }}
                                >
                                    <option value="All">All Batches</option>
                                    {(settings?.batches || []).map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Test-Specific Leaderboard for Teachers */}
                        <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.3rem', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                                        <i className="fas fa-trophy text-gradient"></i> Mock Evaluation Leaderboard
                                    </h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
                                        View the 1st, 2nd, and 3rd podium finishers for a specific test.
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <label style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>Select Test:</label>
                                    <select 
                                        className="input-premium" 
                                        value={selectedGradeExamId} 
                                        onChange={e => setSelectedGradeExamId(e.target.value)}
                                        style={{ width: 'auto', background: '#0b0f19', display: 'inline-block', minWidth: '240px', padding: '8px 16px', margin: 0 }}
                                    >
                                        {subjectExams.filter(e => results.some(r => r.examId === e.id)).map(e => (
                                            <option key={e.id} value={e.id}>{e.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {(() => {
                                const rankData = getTestLeaderboard(selectedGradeExamId);
                                if (rankData.length === 0) {
                                    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', margin: 0 }}>No submissions recorded for this test.</p>;
                                }
                                const podium = rankData.slice(0, 3);
                                return (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap-reverse', margin: '12px 0' }}>
                                        {podium[1] && (
                                            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px 20px', borderRadius: '16px', textAlign: 'center', width: '170px' }}>
                                                <div style={{ fontSize: '1.8rem', color: '#cbd5e1', marginBottom: '6px' }}><i className="fas fa-award"></i></div>
                                                <h5 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{podium[1].name}</h5>
                                                <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 'bold' }}>2nd Place</span>
                                                <span style={{ display: 'block', fontSize: '0.85rem', color: '#a855f7', fontWeight: '700', marginTop: '6px' }}>{podium[1].score}/{podium[1].totalMarks} pts ({podium[1].percentage.toFixed(1)}%)</span>
                                            </div>
                                        )}
                                        {podium[0] && (
                                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(251,191,36,0.3)', padding: '24px 20px', borderRadius: '16px', textAlign: 'center', width: '195px', boxShadow: '0 0 20px rgba(251,191,36,0.1)' }}>
                                                <div style={{ fontSize: '2.5rem', color: '#fbbf24', marginBottom: '8px' }}><i className="fas fa-crown"></i></div>
                                                <h5 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{podium[0].name}</h5>
                                                <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 'extrabold' }}>1st Place</span>
                                                <span style={{ display: 'block', fontSize: '0.95rem', color: '#10b981', fontWeight: '800', marginTop: '6px' }}>{podium[0].score}/{podium[0].totalMarks} pts ({podium[0].percentage.toFixed(1)}%)</span>
                                            </div>
                                        )}
                                        {podium[2] && (
                                            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(180,83,9,0.15)', padding: '16px 20px', borderRadius: '16px', textAlign: 'center', width: '170px' }}>
                                                <div style={{ fontSize: '1.6rem', color: '#b45309', marginBottom: '6px' }}><i className="fas fa-medal"></i></div>
                                                <h5 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{podium[2].name}</h5>
                                                <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 'bold' }}>3rd Place</span>
                                                <span style={{ display: 'block', fontSize: '0.85rem', color: '#a855f7', fontWeight: '700', marginTop: '6px' }}>{podium[2].score}/{podium[2].totalMarks} pts ({podium[2].percentage.toFixed(1)}%)</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        {subjectResults.length === 0 ? (
                            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <i className="fas fa-inbox" style={{ fontSize: '3rem', marginBottom: '16px', color: 'rgba(255,255,255,0.2)' }}></i>
                                <h3 style={{ color: 'white', marginBottom: '8px' }}>No mock exam attempts in your subject yet</h3>
                                <p>When students take mock tests belonging to {subject}, their records and overall scores will render here.</p>
                            </div>
                        ) : (
                            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-glass)' }}>
                                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Student Name</th>
                                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Exam Title</th>
                                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Attempt Date</th>
                                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Score Secured</th>
                                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Percentage</th>
                                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', width: '150px' }}>Diagnostics</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subjectResults.map(res => (
                                                <React.Fragment key={res.id}>
                                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                                        <td style={{ padding: '20px 24px', fontWeight: '700', color: 'white' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', fontSize: '0.85rem' }}>
                                                                    {res.studentName.charAt(0)}
                                                                </div>
                                                                {res.studentName}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '20px 24px', fontWeight: '600', color: '#818cf8' }}>{res.examTitle}</td>
                                                        <td style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>{res.date}</td>
                                                        <td style={{ padding: '20px 24px', fontWeight: '700', fontSize: '1.05rem', color: '#a855f7' }}>{res.score} / {res.totalMarks}</td>
                                                        <td style={{ padding: '20px 24px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <span style={{ fontWeight: '600' }}>{res.percentage.toFixed(1)}%</span>
                                                                <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${res.percentage}%`, height: '100%', background: res.passed ? 'var(--success-color)' : 'var(--danger-color)' }} />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '20px 24px' }}>
                                                            <span className={`badge ${res.passed ? 'badge-success' : 'badge-danger'}`}>
                                                                {res.passed ? 'Passed' : 'Failed'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '20px 24px' }}>
                                                            <button 
                                                                onClick={() => setExpandedStudentResultId(expandedStudentResultId === res.id ? null : res.id)}
                                                                className="btn-secondary" 
                                                                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: 0 }}
                                                            >
                                                                <i className={`fas ${expandedStudentResultId === res.id ? 'fa-chevron-up' : 'fa-chart-pie'}`}></i>
                                                                {expandedStudentResultId === res.id ? 'Hide' : 'Analysis'}
                                                            </button>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Topic Performance Details Row */}
                                                    {expandedStudentResultId === res.id && (
                                                        <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                                                            <td colSpan="7" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <div className="glass-panel animate-fade-in" style={{ padding: '24px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)' }}>
                                                                    <h4 style={{ color: 'white', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <i className="fas fa-bullseye text-gradient"></i> Topic-Level Diagnostics for {res.studentName}
                                                                    </h4>
                                                                    
                                                                    {(() => {
                                                                        const topicStats = getStudentTopicAnalytics(res);
                                                                        if (topicStats.length === 0) {
                                                                            return <p style={{ color: 'var(--text-muted)', margin: 0 }}>No topic-level data found for this test.</p>;
                                                                        }
                                                                        
                                                                        const weakTopics = topicStats.filter(t => t.accuracy < 50);
                                                                        const strongTopics = topicStats.filter(t => t.accuracy >= 70);
                                                                        
                                                                        return (
                                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                                                                                {/* Breakdown */}
                                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                                                    {topicStats.map(t => {
                                                                                        let barColor = 'var(--warning-color)';
                                                                                        if (t.accuracy >= 70) barColor = 'var(--success-color)';
                                                                                        else if (t.accuracy < 50) barColor = 'var(--danger-color)';
                                                                                        
                                                                                        return (
                                                                                            <div key={t.topicName}>
                                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                                                                                    <span style={{ fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>{t.topicName}</span>
                                                                                                    <span style={{ fontWeight: 'bold', color: barColor }}>{t.accuracy.toFixed(0)}% ({t.correctQuestions}/{t.totalQuestions} Qs)</span>
                                                                                                </div>
                                                                                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                                                                                    <div style={{ width: `${t.accuracy}%`, height: '100%', background: barColor }}></div>
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                                
                                                                                {/* Dynamic diagnostic advice */}
                                                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block' }}>Faculty Diagnostics & Recommendations</span>
                                                                                    {strongTopics.length > 0 && (
                                                                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
                                                                                            <i className="fas fa-check-circle" style={{ color: 'var(--success-color)', marginRight: '6px' }}></i>
                                                                                            <strong>Good in:</strong> {strongTopics.map(t => t.topicName).join(', ')}. Solid understanding of core concepts.
                                                                                        </p>
                                                                                    )}
                                                                                    {weakTopics.length > 0 ? (
                                                                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
                                                                                            <i className="fas fa-exclamation-triangle" style={{ color: 'var(--danger-color)', marginRight: '6px' }}></i>
                                                                                            <strong>Poor in:</strong> {weakTopics.map(t => t.topicName).join(', ')}. Recommend focus session and revision of formulas.
                                                                                        </p>
                                                                                    ) : (
                                                                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--success-color)' }}>
                                                                                            <i className="fas fa-star" style={{ marginRight: '6px' }}></i>
                                                                                            Exceptional effort! No conceptual weaknesses identified.
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 5: STUDENT DOUBTS */}
                {activeTab === 'doubts' && (
                    <div className="animate-fade-in">
                        <div style={{ marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.8rem', color: 'white' }}>Student Doubts & Messaging</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Reply to student questions with explanations or photo solutions.</p>
                        </div>
                        <div className="glass-panel" style={{ padding: '24px', display: 'grid', gap: '20px' }}>
                            {messages.filter(m => m.receiverId === currentUser.id || m.senderId === currentUser.id).length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>No doubts received yet.</p>
                            ) : (
                                Array.from(new Set(messages.map(m => m.senderId === currentUser.id ? m.receiverId : m.senderId))).map(studentId => {
                                    const studentName = messages.find(m => m.senderId === studentId || m.receiverId === studentId)?.senderId === studentId ? messages.find(m => m.senderId === studentId).senderName : messages.find(m => m.receiverId === studentId).receiverName;
                                    const thread = messages.filter(m => (m.senderId === studentId && m.receiverId === currentUser.id) || (m.senderId === currentUser.id && m.receiverId === studentId)).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
                                    return (
                                        <div key={studentId} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px' }}>
                                            <h4 style={{ color: 'white', marginTop: 0, marginBottom: '16px' }}><i className="fas fa-user-graduate"></i> Chat with {studentName}</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '12px', marginBottom: '16px' }}>
                                                {thread.map(msg => (
                                                    <div key={msg.id} style={{ alignSelf: msg.senderId === currentUser.id ? 'flex-end' : 'flex-start', background: msg.senderId === currentUser.id ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', maxWidth: '80%' }}>
                                                        <p style={{ margin: 0, color: 'white', fontSize: '0.95rem' }}>{msg.text}</p>
                                                        {msg.fileUrl && (
                                                            <div style={{ marginTop: '8px' }}>
                                                                <a href={msg.fileUrl} target="_blank" style={{ color: 'white', textDecoration: 'underline', fontSize: '0.85rem' }}><i className="fas fa-paperclip"></i> View Attached File</a>
                                                            </div>
                                                        )}
                                                        <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{new Date(msg.createdAt).toLocaleString()}</small>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                                                <textarea className="input-premium" placeholder="Type your reply to the student..." value={replyText} onChange={e => setReplyText(e.target.value)} rows="3"></textarea>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <input type="file" id="replyFile" style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx" onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => { setReplyFile(reader.result); setReplyFileType(file.type.startsWith('image/') ? 'image' : 'document'); };
                                                        reader.readAsDataURL(file);
                                                    }} />
                                                    <label htmlFor="replyFile" className="btn-secondary" style={{ cursor: 'pointer', padding: '8px 16px', fontSize: '0.85rem', margin: 0 }}>
                                                        <i className="fas fa-upload"></i> {replyFile ? 'File Attached' : 'Attach Solution (Image/PDF)'}
                                                    </label>
                                                    <button className="btn-primary" onClick={() => handleReply(studentId, studentName)} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                                                        <i className="fas fa-paper-plane"></i> Send Reply
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Bottom Navigation Bar - Visible only on Mobile */}
            <div className="mobile-bottom-nav">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`mobile-bottom-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                >
                    <i className="fas fa-chart-line"></i>
                    <span>Overview</span>
                </button>
                <button 
                    onClick={() => setActiveTab('create_exam')}
                    className={`mobile-bottom-nav-item ${activeTab === 'create_exam' ? 'active' : ''}`}
                >
                    <i className="fas fa-plus-circle"></i>
                    <span>Exam</span>
                </button>
                <button 
                    onClick={() => setActiveTab('publish_dpq')}
                    className={`mobile-bottom-nav-item ${activeTab === 'publish_dpq' ? 'active' : ''}`}
                >
                    <i className="fas fa-pencil-alt"></i>
                    <span>DPP</span>
                </button>
                <button 
                    onClick={() => setActiveTab('student_grades')}
                    className={`mobile-bottom-nav-item ${activeTab === 'student_grades' ? 'active' : ''}`}
                >
                    <i className="fas fa-graduation-cap"></i>
                    <span>Grades</span>
                </button>
                <button 
                    onClick={handleOpenDoubts}
                    className={`mobile-bottom-nav-item ${activeTab === 'doubts' ? 'active' : ''}`}
                >
                    <i className="fas fa-question-circle"></i>
                    <span>Doubts</span>
                    {unreadCount > 0 && (
                        <span className="mobile-bottom-nav-badge">{unreadCount}</span>
                    )}
                </button>
            </div>
        </div>
    );
}
