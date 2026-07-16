function Dashboard({ currentUser, onStartExam, onStartReview }) {
    const [exams, setExams] = React.useState([]);
    const [results, setResults] = React.useState([]);
    const [dpqs, setDpqs] = React.useState([]);
    const [dpqAttempts, setDpqAttempts] = React.useState([]);
    const [allResults, setAllResults] = React.useState([]);
    const [pyps, setPyps] = React.useState([]);
    const [messages, setMessages] = React.useState([]);
    const [users, setUsers] = React.useState([]);
    const [allExams, setAllExams] = React.useState([]);
    
    React.useEffect(() => {
        async function loadDashboardData() {
            try {
                const [fetchedExams, fetchedResults, fetchedDpqs, fetchedAttempts, fetchedPyps, fetchedMessages, fetchedUsers] = await Promise.all([
                    api.getExams(),
                    api.getResults(),
                    api.getDpqs(),
                    api.getDpqAttempts(),
                    api.getPyps(),
                    api.getMessagesForUser(currentUser.id),
                    api.getUsers()
                ]);
                setAllExams(fetchedExams);
                setExams(fetchedExams.filter(e => e.assignedBatch === currentUser.batch));
                setAllResults(fetchedResults);
                setResults(fetchedResults.filter(r => r.studentId === currentUser.id));
                setDpqs(fetchedDpqs.filter(d => d.homeworkForBatch === currentUser.batch));
                setDpqAttempts(fetchedAttempts);
                setPyps(fetchedPyps);
                setMessages(fetchedMessages || []);
                setUsers(fetchedUsers.filter(u => u.role === 'teacher'));
            } catch (err) {
                console.error('Failed to load student dashboard data:', err);
            }
        }
        loadDashboardData();

        // Real-time polling: refresh messages every 30 seconds
        const msgInterval = setInterval(async () => {
            try {
                const fresh = await api.getMessagesForUser(currentUser.id);
                setMessages(fresh || []);
            } catch (e) { /* silent fail */ }
        }, 30000);

        return () => clearInterval(msgInterval);
    }, [currentUser.id, currentUser.batch]);
    
    // UI states for DPQ modal/drawer
    const [activeDpq, setActiveDpq] = React.useState(null);
    const [selectedDpqOption, setSelectedDpqOption] = React.useState(null);
    const [isDpqSubmitted, setIsDpqSubmitted] = React.useState(false);

    // Navigation Tab state
    const [activeTab, setActiveTab] = React.useState('tests'); // 'tests' | 'analytics' | 'leaderboard' | 'pyp' | 'doubts'

    // Filtering, sorting and view modes for tests
    const [testViewMode, setTestViewMode] = React.useState('table'); // 'table' | 'grid'
    const [testSearch, setTestSearch] = React.useState('');
    const [testSubjectFilter, setTestSubjectFilter] = React.useState('all');
    const [testSortKey, setTestSortKey] = React.useState('date');
    // Test-Specific Leaderboard states
    const [leaderboardMode, setLeaderboardMode] = React.useState('cumulative'); // 'cumulative' | 'test'
    const [selectedLeaderboardExamId, setSelectedLeaderboardExamId] = React.useState('exam-thermo-shm');

    // Unread message count
    const unreadCount = messages.filter(m => m.receiverId == currentUser.id && m.read === false).length;

    const handleOpenDoubts = async () => {
        setActiveTab('doubts');
        // Mark all received messages as read
        const unread = messages.filter(m => m.receiverId == currentUser.id && m.read === false);
        for (const msg of unread) {
            await api.markMessageRead(msg.id);
        }
        setMessages(prev => prev.map(m => m.receiverId == currentUser.id ? { ...m, read: true } : m));
    };

    // Previous Year Papers state
    const [pypExamFilter, setPypExamFilter] = React.useState('all');
    const [pypYearFilter, setPypYearFilter] = React.useState('all');

    const filteredPapers = pyps.filter(p => {
        const examMatch = pypExamFilter === 'all' || p.exam === pypExamFilter;
        const yearMatch = pypYearFilter === 'all' || String(p.year) === pypYearFilter;
        return examMatch && yearMatch;
    });

    const handleDpqSubmit = async (dpq) => {
        if (selectedDpqOption === null) {
            alert('Please select an option.');
            return;
        }
        const isCorrect = selectedDpqOption === dpq.correctOption;
        const newAttempt = {
            id: 'dpq-att-' + Date.now(),
            dpqId: dpq.id,
            studentId: currentUser.id,
            selectedOption: selectedDpqOption,
            correct: isCorrect,
            date: new Date().toISOString()
        };
        try {
            const savedAttempt = await api.submitDpqAttempt(newAttempt);
            setDpqAttempts(prev => [savedAttempt, ...prev]);
            setIsDpqSubmitted(true);
        } catch (err) {
            alert('Failed to submit attempt');
        }
    };

    const [messageText, setMessageText] = React.useState('');
    const [selectedTeacherId, setSelectedTeacherId] = React.useState('');
    const [messageFile, setMessageFile] = React.useState(null);
    const [messageFileType, setMessageFileType] = React.useState('');

    const handleSendMessage = async () => {
        if (!selectedTeacherId) return alert('Please select a teacher.');
        if (!messageText && !messageFile) return alert('Please enter a message or upload a file.');
        try {
            const teacher = users.find(u => u.id === selectedTeacherId);
            const newMsg = {
                senderId: currentUser.id,
                senderName: currentUser.name,
                senderRole: 'student',
                receiverId: teacher.id,
                receiverName: teacher.name,
                receiverRole: 'teacher',
                text: messageText,
                fileUrl: messageFile,
                fileType: messageFileType
            };
            const saved = await api.sendMessage(newMsg);
            setMessages(prev => [...prev, saved]);
            setMessageText('');
            setMessageFile(null);
            setMessageFileType('');
        } catch (err) {
            alert('Failed to send message');
        }
    };

    const handleOpenDpq = (dpq) => {
        setActiveDpq(dpq);
        const pastAttempt = dpqAttempts.find(a => a.dpqId === dpq.id && a.studentId === currentUser.id);
        if (pastAttempt) {
            setSelectedDpqOption(pastAttempt.selectedOption);
            setIsDpqSubmitted(true);
        } else {
            setSelectedDpqOption(null);
            setIsDpqSubmitted(false);
        }
    };

    // Calculate Subject Analytics
    const getSubjectAnalytics = () => {
        const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
        return subjects.map(sub => {
            const subResults = results.filter(res => {
                const exam = exams.find(e => e.id === res.examId);
                return exam && exam.subject === sub;
            });

            const attempts = subResults.length;
            const avgPercentage = attempts > 0 
                ? subResults.reduce((acc, curr) => acc + curr.percentage, 0) / attempts 
                : 0;

            let color = '#a855f7';
            let gradient = 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)';
            let icon = 'fa-atom';

            if (sub === 'Physics') {
                color = '#6366f1';
                gradient = 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)';
                icon = 'fa-atom';
            } else if (sub === 'Chemistry') {
                color = '#3b82f6';
                gradient = 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)';
                icon = 'fa-flask';
            } else if (sub === 'Mathematics') {
                color = '#d946ef';
                gradient = 'linear-gradient(135deg, #d946ef 0%, #ec4899 100%)';
                icon = 'fa-calculator';
            } else if (sub === 'Biology') {
                color = '#10b981';
                gradient = 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)';
                icon = 'fa-dna';
            }

            return {
                subject: sub,
                attempts,
                avgPercentage,
                color,
                gradient,
                icon
            };
        });
    };

    // Generate Dynamic Leaderboard
    const getLeaderboard = () => {
        
        // Group results by studentName
        const studentMap = {};
        allResults.forEach(res => {
            if (!studentMap[res.studentName]) {
                studentMap[res.studentName] = {
                    name: res.studentName,
                    completedCount: 0,
                    totalPercentageSum: 0,
                    highestScore: 0
                };
            }
            studentMap[res.studentName].completedCount += 1;
            studentMap[res.studentName].totalPercentageSum += res.percentage;
            if (res.percentage > studentMap[res.studentName].highestScore) {
                studentMap[res.studentName].highestScore = res.percentage;
            }
        });

        const leaderboardList = Object.values(studentMap).map(student => {
            const avgPercentage = student.totalPercentageSum / student.completedCount;
            let badge = 'Aspirant';
            let badgeStyle = { background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' };

            if (avgPercentage >= 90) {
                badge = 'Elite Scholar';
                badgeStyle = { background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success-color)', border: '1px solid rgba(16, 185, 129, 0.4)' };
            } else if (avgPercentage >= 75) {
                badge = 'High Achiever';
                badgeStyle = { background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.4)' };
            } else if (avgPercentage >= 50) {
                badge = 'Rising Star';
                badgeStyle = { background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning-color)', border: '1px solid rgba(245, 158, 11, 0.4)' };
            }

            return {
                name: student.name,
                completedCount: student.completedCount,
                avgPercentage,
                badge,
                badgeStyle
            };
        });

        // Sort by average percentage descending
        return leaderboardList.sort((a, b) => b.avgPercentage - a.avgPercentage);
    };

    // Calculate Topic-Level Analytics & Study Guidance
    const getTopicAnalytics = () => {
        const topicStats = {};
        
        results.forEach(res => {
            // Find exam details
            const exam = allExams.find(e => e.id === res.examId);
            if (!exam || !exam.questions) return;
            
            // Loop through questions and compare student's answer
            exam.questions.forEach((q, qIndex) => {
                const topic = q.topic || 'General';
                if (!topicStats[topic]) {
                    topicStats[topic] = {
                        topicName: topic,
                        totalQuestions: 0,
                        correctQuestions: 0,
                        totalMarks: 0,
                        securedMarks: 0
                    };
                }
                
                const userAns = res.answers && res.answers[qIndex] !== undefined ? res.answers[qIndex] : -1;
                const isCorrect = userAns === q.correctOption;
                
                topicStats[topic].totalQuestions += 1;
                if (isCorrect) {
                    topicStats[topic].correctQuestions += 1;
                    topicStats[topic].securedMarks += q.marks || 10;
                }
                topicStats[topic].totalMarks += q.marks || 10;
            });
        });
        
        const topicsList = Object.values(topicStats).map(stat => {
            const accuracy = stat.totalQuestions > 0 
                ? (stat.correctQuestions / stat.totalQuestions * 100) 
                : 0;
            return {
                ...stat,
                accuracy
            };
        });
        
        // Sort by accuracy descending
        topicsList.sort((a, b) => b.accuracy - a.accuracy);
        
        const strongTopics = topicsList.filter(t => t.accuracy >= 70);
        const weakTopics = topicsList.filter(t => t.accuracy < 50);
        
        return {
            allTopics: topicsList,
            strongTopics,
            weakTopics
        };
    };

    // Calculate Test-Specific Leaderboard rankings
    const getTestLeaderboard = (examId) => {
        if (!examId) return [];
        const examResults = allResults.filter(r => r.examId === examId);
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

    // Calculate aggregated metrics for current student
    const totalAttempted = results.length;
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = totalAttempted - passedCount;
    const avgScorePercentage = totalAttempted > 0 
        ? results.reduce((acc, curr) => acc + curr.percentage, 0) / totalAttempted 
        : 0;
    const highestPercentage = totalAttempted > 0 
        ? Math.max(...results.map(r => r.percentage)) 
        : 0;

    return (
        <div style={{ padding: '40px 0' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
                
                {/* Welcome Hero Card */}
                <div className="glass-panel" style={{
                    padding: '40px',
                    marginBottom: '32px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-50%',
                        right: '-10%',
                        width: '500px',
                        height: '500px',
                        background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(0,0,0,0) 70%)',
                        zIndex: 0
                    }} />
                    
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <span className="badge badge-success">
                                    <i className="fas fa-check-circle" style={{ marginRight: '6px' }}></i> Active Student
                                </span>
                                {currentUser.batch && (
                                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                                        <i className="fas fa-users" style={{ marginRight: '6px' }}></i> {currentUser.batch}
                                    </span>
                                )}
                            </div>
                            <h1 style={{ fontSize: '2.5rem', color: 'white', marginBottom: '8px' }}>
                                Welcome back, <span className="text-gradient">{currentUser.name}</span>!
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px' }}>
                                Your coaching evaluation center. Complete pending tests to improve your academic readiness and competitive ranking.
                            </p>
                        </div>

                        {/* Summary Metrics */}
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div className="glass-panel" style={{ padding: '20px 28px', textAlign: 'center', background: 'rgba(0,0,0,0.4)' }}>
                                <span style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'Outfit', color: '#a855f7' }}>
                                    {exams.length}
                                </span>
                                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Total Tests
                                </span>
                            </div>
                            <div className="glass-panel" style={{ padding: '20px 28px', textAlign: 'center', background: 'rgba(0,0,0,0.4)' }}>
                                <span style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'Outfit', color: '#10b981' }}>
                                    {results.length}
                                </span>
                                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Completed
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub-Navigation Tab Bar */}
                <div className="hide-on-mobile" style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '40px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '8px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-glass)',
                    maxWidth: 'fit-content'
                }}>
                    <button 
                        onClick={() => setActiveTab('tests')} 
                        className={activeTab === 'tests' ? 'btn-primary' : 'btn-secondary'}
                        style={{ padding: '12px 24px', borderRadius: '12px', border: activeTab === 'tests' ? 'none' : '1px solid transparent' }}
                    >
                        <i className="fas fa-file-alt"></i> Tests & DPPs
                    </button>
                    <button 
                        onClick={() => setActiveTab('analytics')} 
                        className={activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}
                        style={{ padding: '12px 24px', borderRadius: '12px', border: activeTab === 'analytics' ? 'none' : '1px solid transparent' }}
                    >
                        <i className="fas fa-chart-pie"></i> Performance & Analytics
                    </button>
                    <button 
                        onClick={() => setActiveTab('leaderboard')} 
                        className={activeTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}
                        style={{ padding: '12px 24px', borderRadius: '12px', border: activeTab === 'leaderboard' ? 'none' : '1px solid transparent' }}
                    >
                        <i className="fas fa-trophy"></i> Academy Leaderboard
                    </button>
                    <button 
                        onClick={() => setActiveTab('pyp')} 
                        className={activeTab === 'pyp' ? 'btn-primary' : 'btn-secondary'}
                        style={{ padding: '12px 24px', borderRadius: '12px', border: activeTab === 'pyp' ? 'none' : '1px solid transparent', background: activeTab === 'pyp' ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' : '' }}
                    >
                        <i className="fas fa-book-open"></i> Previous Year Questions
                    </button>
                    <button 
                        onClick={handleOpenDoubts}
                        className={activeTab === 'doubts' ? 'btn-primary' : 'btn-secondary'}
                        style={{ padding: '12px 24px', borderRadius: '12px', border: activeTab === 'doubts' ? 'none' : '1px solid transparent', background: activeTab === 'doubts' ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' : '', position: 'relative' }}
                    >
                        <i className="fas fa-question-circle"></i> Doubts & Chat
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

                {/* TAB 1: TESTS & DPPS */}
                {activeTab === 'tests' && (
                    <div className="animate-fade-in">
                        {/* Available Tests Section */}
                        <div style={{ marginBottom: '56px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.8rem', color: 'white' }}>Available Online Tests</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Select a test below when you are ready to begin.</p>
                                </div>
                                <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '8px 16px' }}>
                                    <i className="fas fa-clock" style={{ marginRight: '6px' }}></i> Timed Evaluations
                                </span>
                            </div>

                            <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                                {/* Search and Filter Inputs */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1, minWidth: '300px' }}>
                                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                                        <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                                        <input 
                                            type="text" 
                                            className="input-premium" 
                                            placeholder="Search tests..." 
                                            value={testSearch}
                                            onChange={e => setTestSearch(e.target.value)}
                                            style={{ paddingLeft: '40px', paddingRight: '14px', height: '42px', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <select 
                                        className="input-premium" 
                                        value={testSubjectFilter} 
                                        onChange={e => setTestSubjectFilter(e.target.value)}
                                        style={{ width: '160px', height: '42px', fontSize: '0.9rem', padding: '0 12px', background: '#111827' }}
                                    >
                                        <option value="all">All Subjects</option>
                                        {Array.from(new Set(exams.map(e => e.subject).filter(Boolean))).map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                    <select 
                                        className="input-premium" 
                                        value={testSortKey} 
                                        onChange={e => setTestSortKey(e.target.value)}
                                        style={{ width: '160px', height: '42px', fontSize: '0.9rem', padding: '0 12px', background: '#111827' }}
                                    >
                                        <option value="date">Sort by Date</option>
                                        <option value="title">Sort by Name</option>
                                        <option value="marks">Sort by Marks</option>
                                        <option value="duration">Sort by Duration</option>
                                    </select>
                                </div>
                                {/* View Toggle Buttons */}
                                <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                                    <button 
                                        onClick={() => setTestViewMode('table')} 
                                        style={{ border: 'none', background: testViewMode === 'table' ? 'var(--primary-gradient)' : 'transparent', color: 'white', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}
                                    >
                                        <i className="fas fa-list"></i> Table View
                                    </button>
                                    <button 
                                        onClick={() => setTestViewMode('grid')} 
                                        style={{ border: 'none', background: testViewMode === 'grid' ? 'var(--primary-gradient)' : 'transparent', color: 'white', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}
                                    >
                                        <i className="fas fa-th-large"></i> Grid View
                                    </button>
                                </div>
                            </div>

                            {(() => {
                                const now = new Date();
                                
                                // Filter exams
                                const filteredExams = exams.filter(exam => {
                                    const matchSearch = exam.title.toLowerCase().includes(testSearch.toLowerCase()) || 
                                                        (exam.description && exam.description.toLowerCase().includes(testSearch.toLowerCase()));
                                    const matchSubject = testSubjectFilter === 'all' || exam.subject === testSubjectFilter;
                                    return matchSearch && matchSubject;
                                });

                                // Sort exams
                                const sortedExams = [...filteredExams].sort((a, b) => {
                                    if (testSortKey === 'title') {
                                        return a.title.localeCompare(b.title);
                                    } else if (testSortKey === 'marks') {
                                        return b.totalMarks - a.totalMarks;
                                    } else if (testSortKey === 'duration') {
                                        return b.durationMinutes - a.durationMinutes;
                                    } else {
                                        const dateA = a.scheduledDate ? new Date(a.scheduledDate) : new Date(0);
                                        const dateB = b.scheduledDate ? new Date(b.scheduledDate) : new Date(0);
                                        return dateB - dateA;
                                    }
                                });

                                const activeExams = [];
                                const upcomingExams = [];
                                sortedExams.forEach(e => {
                                    if (e.scheduledDate && new Date(e.scheduledDate) > now) {
                                        upcomingExams.push(e);
                                    } else {
                                        activeExams.push(e);
                                    }
                                });

                                return (
                                    <>
                                        {testViewMode === 'table' ? (
                                            <div className="glass-panel" style={{ overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                                                <div style={{ overflowX: 'auto' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                                                        <thead>
                                                            <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-glass)' }}>
                                                                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Test Details</th>
                                                                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', width: '140px' }}>Subject</th>
                                                                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', width: '120px' }}>Duration</th>
                                                                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', width: '110px' }}>Marks</th>
                                                                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', width: '220px' }}>Status</th>
                                                                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', width: '180px' }}>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {/* Render upcoming first if any */}
                                                            {upcomingExams.map(exam => (
                                                                <tr key={exam.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                    <td style={{ padding: '18px 20px' }}>
                                                                        <strong style={{ color: '#fbbf24', fontSize: '1rem', display: 'block', marginBottom: '4px' }}>{exam.title}</strong>
                                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{exam.description}</span>
                                                                    </td>
                                                                    <td style={{ padding: '18px 20px' }}>
                                                                        <span className="badge" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>{exam.subject}</span>
                                                                    </td>
                                                                    <td style={{ padding: '18px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                                        <i className="fas fa-stopwatch" style={{ marginRight: '6px' }}></i> {exam.durationMinutes} mins
                                                                    </td>
                                                                    <td style={{ padding: '18px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                                        <i className="fas fa-award" style={{ marginRight: '6px' }}></i> {exam.totalMarks} pts
                                                                    </td>
                                                                    <td style={{ padding: '18px 20px' }}>
                                                                        <span style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <i className="fas fa-calendar-alt"></i> Scheduled
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ padding: '18px 20px' }}>
                                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                                            Starts {new Date(exam.scheduledDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {/* Render active exams */}
                                                            {activeExams.map(exam => {
                                                                const pastAttempt = results.find(r => r.examId === exam.id);
                                                                return (
                                                                    <tr key={exam.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: pastAttempt ? 'rgba(0,0,0,0.1)' : 'transparent' }}>
                                                                        <td style={{ padding: '18px 20px' }}>
                                                                            <strong style={{ color: 'white', fontSize: '1rem', display: 'block', marginBottom: '4px' }}>{exam.title}</strong>
                                                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{exam.description}</span>
                                                                        </td>
                                                                        <td style={{ padding: '18px 20px' }}>
                                                                            <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}>{exam.subject}</span>
                                                                        </td>
                                                                        <td style={{ padding: '18px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                                            <i className="fas fa-stopwatch" style={{ marginRight: '6px', color: '#a855f7' }}></i> {exam.durationMinutes} mins
                                                                        </td>
                                                                        <td style={{ padding: '18px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                                            <i className="fas fa-award" style={{ marginRight: '6px', color: '#f59e0b' }}></i> {exam.totalMarks} pts
                                                                        </td>
                                                                        <td style={{ padding: '18px 20px' }}>
                                                                            {pastAttempt ? (
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                    <i className="fas fa-check-circle" style={{ color: pastAttempt.passed ? '#10b981' : '#ef4444' }}></i>
                                                                                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: pastAttempt.passed ? '#10b981' : '#ef4444' }}>
                                                                                        {pastAttempt.score}/{pastAttempt.totalMarks} ({pastAttempt.passed ? 'Passed' : 'Failed'})
                                                                                    </span>
                                                                                </div>
                                                                            ) : (
                                                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                                                                    Not Attempted
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td style={{ padding: '18px 20px' }}>
                                                                            <button 
                                                                                onClick={() => onStartExam(exam)}
                                                                                className="btn-primary"
                                                                                style={{ padding: '8px 16px', fontSize: '0.85rem', minHeight: '36px', borderRadius: '8px', width: '100%', justifyContent: 'center' }}
                                                                            >
                                                                                <i className="fas fa-play-circle" style={{ marginRight: '4px' }}></i> {pastAttempt ? 'Retake' : 'Start Exam'}
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            {sortedExams.length === 0 && (
                                                                <tr>
                                                                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                                        <i className="fas fa-search" style={{ fontSize: '2rem', marginBottom: '12px', display: 'block', color: 'rgba(255,255,255,0.1)' }}></i>
                                                                        No tests match your search filters.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {upcomingExams.length > 0 && (
                                                    <div style={{ marginBottom: '40px' }}>
                                                        <h3 style={{ fontSize: '1.4rem', color: '#fbbf24', marginBottom: '16px' }}><i className="fas fa-calendar-alt"></i> Upcoming Scheduled Tests</h3>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                                                            {upcomingExams.map(exam => (
                                                                <div key={exam.id} className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                                                                    <div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                                                            <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>{exam.subject}</span>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                                                <span><i className="fas fa-stopwatch" style={{ color: '#a855f7' }}></i> {exam.durationMinutes}m</span>
                                                                                <span><i className="fas fa-award" style={{ color: '#f59e0b' }}></i> {exam.totalMarks} pts</span>
                                                                            </div>
                                                                        </div>
                                                                        <h3 style={{ fontSize: '1.35rem', color: 'white', marginBottom: '12px', lineHeight: '1.3' }}>{exam.title}</h3>
                                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px' }}>{exam.description}</p>
                                                                    </div>
                                                                    <div>
                                                                        <button disabled className="btn-secondary" style={{ width: '100%', padding: '14px', fontSize: '1.05rem', justifyContent: 'center', opacity: 0.7, cursor: 'not-allowed' }}>
                                                                            <i className="fas fa-lock"></i> Available on {new Date(exam.scheduledDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {activeExams.length > 0 && (
                                                    <div>
                                                        <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '16px' }}>Active Tests</h3>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                                                            {activeExams.map(exam => {
                                                                const pastAttempt = results.find(r => r.examId === exam.id);
                                                                return (
                                                                    <div key={exam.id} className="glass-panel glass-panel-hover" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                                        <div>
                                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                                                                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                                                                                    {exam.subject}
                                                                                </span>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                                                    <span><i className="fas fa-stopwatch" style={{ color: '#a855f7' }}></i> {exam.durationMinutes}m</span>
                                                                                    <span><i className="fas fa-award" style={{ color: '#f59e0b' }}></i> {exam.totalMarks} pts</span>
                                                                                </div>
                                                                            </div>
                                            
                                                                            <h3 style={{ fontSize: '1.35rem', color: 'white', marginBottom: '12px', lineHeight: '1.3' }}>
                                                                                {exam.title}
                                                                            </h3>
                                                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px' }}>
                                                                                {exam.description}
                                                                            </p>
                                                                        </div>
                                            
                                                                        <div>
                                                                            {pastAttempt ? (
                                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', marginBottom: '16px' }}>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                        <i className="fas fa-check-circle" style={{ color: pastAttempt.passed ? '#10b981' : '#ef4444' }}></i>
                                                                                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Last Score: {pastAttempt.score}/{pastAttempt.totalMarks}</span>
                                                                                    </div>
                                                                                    <span className={`badge ${pastAttempt.passed ? 'badge-success' : 'badge-danger'}`}>
                                                                                        {pastAttempt.passed ? 'Passed' : 'Failed'}
                                                                                    </span>
                                                                                </div>
                                                                            ) : null}
                                            
                                                                            <button 
                                                                                onClick={() => onStartExam(exam)}
                                                                                className="btn-primary"
                                                                                style={{ width: '100%', padding: '14px', fontSize: '1.05rem', justifyContent: 'center' }}
                                                                            >
                                                                                <i className="fas fa-play-circle"></i> {pastAttempt ? 'Retake Examination' : 'Start Examination Now'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {activeExams.length === 0 && upcomingExams.length === 0 && (
                                                    <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                        <i className="fas fa-clipboard-list" style={{ fontSize: '3rem', marginBottom: '16px', color: 'rgba(255,255,255,0.2)' }}></i>
                                                        <h3 style={{ color: 'white', marginBottom: '8px' }}>No exams available</h3>
                                                        <p>There are no active or scheduled tests for your batch currently.</p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        {/* Daily Practice Problems (DPP) Section */}
                        <div style={{ marginBottom: '56px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.8rem', color: 'white' }}>Daily Practice Problems (DPP)</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Solve daily homework sheets and practice challenges to test your concepts.</p>
                                </div>
                                <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '8px 16px' }}>
                                    <i className="fas fa-pencil-alt" style={{ marginRight: '6px' }}></i> Today's Challenge
                                </span>
                            </div>

                            {dpqs.length === 0 ? (
                                <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <i className="fas fa-tasks" style={{ fontSize: '3rem', marginBottom: '16px', color: 'rgba(255,255,255,0.2)' }}></i>
                                    <h3 style={{ color: 'white', marginBottom: '8px' }}>No Practice Problems Available</h3>
                                    <p>Check back later for homework sheets and concept challenges.</p>
                                </div>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                    gap: '24px'
                                }}>
                                    {dpqs.map(dpq => {
                                        const attempt = dpqAttempts.find(a => a.dpqId === dpq.id && a.studentId === currentUser.id);
                                        const isSolved = !!attempt;

                                        return (
                                            <div key={dpq.id} className="glass-panel glass-panel-hover" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                                        <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                                                            {dpq.subject}
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {isSolved ? (
                                                                attempt.correct ? (
                                                                    <span className="badge badge-success"><i className="fas fa-check"></i> Correct</span>
                                                                ) : (
                                                                    <span className="badge badge-danger"><i className="fas fa-times"></i> Incorrect</span>
                                                                )
                                                            ) : (
                                                                <span className="badge badge-warning"><i className="fas fa-hourglass-start"></i> Pending</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '12px', lineHeight: '1.4', fontWeight: '600' }}>
                                                        {dpq.questionText}
                                                    </h3>
                                                    <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: dpq.fileUrl ? '8px' : '24px' }}>
                                                        Published Date: {dpq.date}
                                                    </span>
                                                    {dpq.fileUrl && (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#34d399', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '6px', marginBottom: '24px' }}>
                                                            <i className="fas fa-paperclip"></i> File Attached ({dpq.fileType ? dpq.fileType.toUpperCase() : 'FILE'})
                                                        </span>
                                                    )}
                                                </div>

                                                <button 
                                                    onClick={() => handleOpenDpq(dpq)}
                                                    className={isSolved ? "btn-secondary" : "btn-primary"}
                                                    style={{ width: '100%', padding: '14px', fontSize: '1.05rem', justifyContent: 'center', background: isSolved ? 'rgba(255,255,255,0.05)' : 'var(--secondary-gradient)', border: isSolved ? '1px solid var(--border-glass)' : 'none' }}
                                                >
                                                    <i className={isSolved ? "fas fa-eye" : "fas fa-pencil-alt"}></i> {isSolved ? 'View Concept Explanation' : 'Attempt Question Now'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Past Results / History */}
                        <div>
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.8rem', color: 'white' }}>Performance History</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Review your previous attempts and academic scores.</p>
                            </div>

                            {results.length === 0 ? (
                                <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <i className="fas fa-folder-open" style={{ fontSize: '3rem', marginBottom: '16px', color: 'rgba(255,255,255,0.2)' }}></i>
                                    <h3 style={{ color: 'white', marginBottom: '8px' }}>No completed tests yet</h3>
                                    <p>Once you take an exam, your scores and detailed analytics will appear here.</p>
                                </div>
                            ) : (
                                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-glass)' }}>
                                                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Test Title</th>
                                                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Attempt Date</th>
                                                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Score Secured</th>
                                                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Percentage</th>
                                                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                                                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {results.map(res => (
                                                    <tr key={res.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                                        <td style={{ padding: '20px 24px', fontWeight: '600', color: 'white' }}>{res.examTitle}</td>
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
                                                                onClick={() => {
                                                                    const exam = exams.find(e => e.id === res.examId);
                                                                    if (exam) {
                                                                        onStartReview(exam, res);
                                                                    } else {
                                                                        alert('This exam details are no longer available in the active directory.');
                                                                    }
                                                                }}
                                                                className="btn-secondary"
                                                                style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px' }}
                                                            >
                                                                <i className="fas fa-clipboard-check"></i> Review answers
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 2: MY PERFORMANCE & ANALYTICS */}
                {activeTab === 'analytics' && (
                    <div className="animate-fade-in">
                        {/* Overall Analytics Grid Cards */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '24px',
                            marginBottom: '40px'
                        }}>
                            {/* Card 1: Exams Attempted */}
                            <div className="glass-panel" style={{ padding: '32px', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Tests Attempted</span>
                                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(168,85,247,0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        <i className="fas fa-file-signature"></i>
                                    </div>
                                </div>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', fontFamily: 'Outfit', lineHeight: '1.1' }}>{totalAttempted}</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    <span style={{ color: 'var(--success-color)', fontWeight: '600' }}><i className="fas fa-check"></i> {passedCount} Passed</span> &middot; <span style={{ color: 'var(--danger-color)', fontWeight: '600' }}>{failedCount} Failed</span>
                                </p>
                            </div>

                            {/* Card 2: Average Percentage */}
                            <div className="glass-panel" style={{ padding: '32px', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Average Score</span>
                                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        <i className="fas fa-percentage"></i>
                                    </div>
                                </div>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', fontFamily: 'Outfit', lineHeight: '1.1' }}>
                                    {avgScorePercentage.toFixed(1)}%
                                </h3>
                                <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${avgScorePercentage}%`, height: '100%', background: 'var(--primary-gradient)' }}></div>
                                </div>
                            </div>

                            {/* Card 3: Best Score */}
                            <div className="glass-panel" style={{ padding: '32px', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Highest Performance</span>
                                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        <i className="fas fa-trophy"></i>
                                    </div>
                                </div>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', fontFamily: 'Outfit', lineHeight: '1.1' }}>
                                    {highestPercentage.toFixed(1)}%
                                </h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    Your peak academy benchmark
                                </p>
                            </div>
                        </div>

                        {/* Subject Analytics & Radar Gauges */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '32px', marginBottom: '48px' }}>
                            {/* Visual Subject Strength Gauges */}
                            <div className="glass-panel" style={{ padding: '40px' }}>
                                <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <i className="fas fa-chart-bar" style={{ color: '#a855f7' }}></i> Subject Strength Analysis
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '32px' }}>
                                    Aggregated performance calculated from your scores in each syllabus department.
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
                                    {getSubjectAnalytics().map(subData => {
                                        return (
                                            <div key={subData.subject} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                                {/* Premium CSS-Only Gauge */}
                                                <div style={{
                                                    position: 'relative',
                                                    width: '120px',
                                                    height: '120px',
                                                    borderRadius: '50%',
                                                    background: `conic-gradient(${subData.color} ${subData.avgPercentage * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginBottom: '16px',
                                                    boxShadow: `0 0 25px rgba(${subData.avgPercentage > 0 ? '168,85,247,0.1' : '0,0,0,0'})`
                                                }}>
                                                    <div style={{
                                                        width: '98px',
                                                        height: '98px',
                                                        borderRadius: '50%',
                                                        background: '#0b0f19',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white', fontFamily: 'Outfit' }}>
                                                            {subData.attempts > 0 ? `${subData.avgPercentage.toFixed(0)}%` : 'N/A'}
                                                        </span>
                                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                            {subData.attempts} {subData.attempts === 1 ? 'test' : 'tests'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <h4 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <i className={`fas ${subData.icon}`} style={{ color: subData.color }}></i> {subData.subject}
                                                </h4>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {subData.attempts > 0 ? 'Department strength rating' : 'Unvisited department'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Performance Insights & Tips */}
                            <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <i className="fas fa-lightbulb" style={{ color: '#f59e0b' }}></i> Diagnostic Faculty Insights
                                    </h3>
                                    
                                    {totalAttempted === 0 ? (
                                        <div style={{ color: 'var(--text-muted)', padding: '24px 0' }}>
                                            <i className="fas fa-clipboard-list" style={{ fontSize: '2.5rem', marginBottom: '12px' }}></i>
                                            <p>No test data available yet. Attempt a mock test to generate diagnostic study recommendations from coaching faculty.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: '16px', borderLeft: '4px solid #10b981' }}>
                                                <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '1.25rem', marginTop: '3px' }}></i>
                                                <div>
                                                    <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '4px' }}>Peak Subject Accolade</h4>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                                                        {(() => {
                                                            const sortedAn = getSubjectAnalytics().sort((a,b) => b.avgPercentage - a.avgPercentage);
                                                            if (sortedAn[0] && sortedAn[0].avgPercentage > 0) {
                                                                return `You are performing excellently in ${sortedAn[0].subject} with a department average of ${sortedAn[0].avgPercentage.toFixed(1)}%! Keep up the phenomenal conceptual mastery.`;
                                                            }
                                                            return "Keep attempting mock evaluations to track your peak performing subject areas.";
                                                        })()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: '16px', borderLeft: '4px solid #a855f7' }}>
                                                <i className="fas fa-chart-line" style={{ color: '#a855f7', fontSize: '1.25rem', marginTop: '3px' }}></i>
                                                <div>
                                                    <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '4px' }}>Current Passing Rate</h4>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                                                        You have cleared <strong>{passedCount} out of {totalAttempted}</strong> mock exams. Your cumulative passing conversion is <strong>{((passedCount / totalAttempted) * 100).toFixed(0)}%</strong>.
                                                    </p>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: '16px', borderLeft: '4px solid #ef4444' }}>
                                                <i className="fas fa-exclamation-triangle" style={{ color: '#ef4444', fontSize: '1.25rem', marginTop: '3px' }}></i>
                                                <div>
                                                    <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '4px' }}>Focus Recommendations</h4>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                                                        {(() => {
                                                            const needWork = getSubjectAnalytics().filter(s => s.attempts > 0).sort((a,b) => a.avgPercentage - b.avgPercentage);
                                                            if (needWork[0] && needWork[0].avgPercentage < 75) {
                                                                return `Based on scores, ${needWork[0].subject} requires additional reinforcement (Department Average: ${needWork[0].avgPercentage.toFixed(1)}%). Re-study concept formulas and review historical solutions in your performance list.`;
                                                            }
                                                            return "Excellent work. All your attempted subjects average above 75%. Try tackling the latest advanced faculty-published mocks!";
                                                        })()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '16px', marginTop: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(168,85,247,0.2)' }}>
                                    <div style={{ fontSize: '1.5rem', color: '#a855f7' }}>
                                        <i className="fas fa-graduation-cap"></i>
                                    </div>
                                    <p style={{ color: 'white', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
                                        <strong>Pro Tip:</strong> Re-taking an exam updates your status but archives all older results. Use the <strong>"Review answers"</strong> button to study the conceptual solutions retrospectively without overwriting your progress history!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Topic-Level Analytics & Focus Recommendations */}
                        {totalAttempted > 0 && (
                            <div className="glass-panel" style={{ padding: '40px', marginTop: '32px' }}>
                                <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <i className="fas fa-bullseye text-gradient"></i> Topic Mastery & Study Recommendations
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '28px' }}>
                                    Granular conceptual feedback compiled across all mock exam questions to target syllabus weak points.
                                </p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
                                    {/* Topic Accuracy Progress List */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h4 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                                            <i className="fas fa-layer-group" style={{ marginRight: '8px', color: '#a855f7' }}></i> Concept Accuracy Breakdown
                                        </h4>
                                        {getTopicAnalytics().allTopics.length === 0 ? (
                                            <p style={{ color: 'var(--text-muted)' }}>No topic-level data available.</p>
                                        ) : (
                                            getTopicAnalytics().allTopics.map(tStat => {
                                                let barColor = 'var(--warning-color)';
                                                let badgeClass = 'badge-warning';
                                                if (tStat.accuracy >= 70) {
                                                    barColor = 'var(--success-color)';
                                                    badgeClass = 'badge-success';
                                                } else if (tStat.accuracy < 50) {
                                                    barColor = 'var(--danger-color)';
                                                    badgeClass = 'badge-danger';
                                                }
                                                
                                                return (
                                                    <div key={tStat.topicName} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: '600', color: 'white' }}>{tStat.topicName}</span>
                                                            <span className={`badge ${badgeClass}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                                                                {tStat.accuracy.toFixed(0)}% Accuracy ({tStat.correctQuestions}/{tStat.totalQuestions} Qs)
                                                            </span>
                                                        </div>
                                                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${tStat.accuracy}%`, height: '100%', background: barColor, borderRadius: '4px' }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    
                                    {/* Actionable Suggestions Card */}
                                    <div className="glass-panel" style={{ padding: '28px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)' }}>
                                        <h4 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <i className="fas fa-graduation-cap" style={{ color: '#10b981' }}></i> Personalized Study Guidance
                                        </h4>
                                        {(() => {
                                            const { strongTopics, weakTopics } = getTopicAnalytics();
                                            
                                            if (strongTopics.length === 0 && weakTopics.length === 0) {
                                                return (
                                                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                                                        Keep completing mock tests to generate personalized study recommendations.
                                                    </p>
                                                );
                                            }
                                            
                                            let strongText = strongTopics.map(t => t.topicName).join(', ');
                                            let weakText = weakTopics.map(t => t.topicName).join(', ');
                                            
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {strongTopics.length > 0 && (
                                                        <div style={{ background: 'rgba(16,185,129,0.05)', borderLeft: '4px solid var(--success-color)', padding: '16px', borderRadius: '8px' }}>
                                                            <h5 style={{ margin: '0 0 6px 0', color: 'var(--success-color)', fontWeight: '700' }}>
                                                                <i className="fas fa-trophy" style={{ marginRight: '6px' }}></i> Concept Strengths
                                                            </h5>
                                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>
                                                                You have shown excellent mastery in <strong>{strongText}</strong> with accuracy above 70%. Excellent conceptual command!
                                                            </p>
                                                        </div>
                                                    )}
                                                    
                                                    {weakTopics.length > 0 ? (
                                                        <div style={{ background: 'rgba(239,68,68,0.05)', borderLeft: '4px solid var(--danger-color)', padding: '16px', borderRadius: '8px' }}>
                                                            <h5 style={{ margin: '0 0 6px 0', color: 'var(--danger-color)', fontWeight: '700' }}>
                                                                <i className="fas fa-exclamation-triangle" style={{ marginRight: '6px' }}></i> Suggested Focus Areas
                                                            </h5>
                                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', lineHeight: '1.4' }}>
                                                                Based on evaluations, <strong>{currentUser.name}</strong>, you need to reinforce <strong>{weakText}</strong>. 
                                                                We highly recommend reviewing detailed solution guides, revising class notes, and taking related DPP assignments to rebuild strength.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div style={{ background: 'rgba(59,130,246,0.05)', borderLeft: '4px solid #3b82f6', padding: '16px', borderRadius: '8px' }}>
                                                            <h5 style={{ margin: '0 0 6px 0', color: '#3b82f6', fontWeight: '700' }}>
                                                                <i className="fas fa-thumbs-up" style={{ marginRight: '6px' }}></i> Focus Recommendation
                                                            </h5>
                                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>
                                                                Amazing job! You have no critical weak topics (accuracy &lt; 50%). Keep maintaining this high academy standard across all chapters!
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: ACADEMY LEADERBOARD */}
                {activeTab === 'leaderboard' && (
                    <div className="animate-fade-in">
                        <div className="glass-panel" style={{ padding: '40px', marginBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.8rem', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <i className="fas fa-trophy text-gradient"></i> Academy Leaderboard
                                    </h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
                                        Track competitive rankings and review test standings across classes and chapters.
                                    </p>
                                </div>
                                <span className="badge badge-success" style={{ padding: '8px 16px' }}>
                                    <i className="fas fa-bolt"></i> Live Standings
                                </span>
                            </div>

                            {/* Mode Toggle Tabs */}
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border-glass)', maxWidth: 'fit-content' }}>
                                <button 
                                    onClick={() => setLeaderboardMode('cumulative')} 
                                    className={leaderboardMode === 'cumulative' ? 'btn-primary' : 'btn-secondary'}
                                    style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}
                                >
                                    <i className="fas fa-users" style={{ marginRight: '6px' }}></i> Cumulative Rankings
                                </button>
                                <button 
                                    onClick={() => setLeaderboardMode('test')} 
                                    className={leaderboardMode === 'test' ? 'btn-primary' : 'btn-secondary'}
                                    style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}
                                >
                                    <i className="fas fa-file-alt" style={{ marginRight: '6px' }}></i> Test-Specific Standings
                                </button>
                            </div>

                            {/* Test Selector Dropdown */}
                            {leaderboardMode === 'test' && (
                                <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-glass)', maxWidth: 'fit-content' }}>
                                    <label style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.95rem' }}>Select Mock Test:</label>
                                    <select 
                                        className="input-premium" 
                                        value={selectedLeaderboardExamId} 
                                        onChange={e => setSelectedLeaderboardExamId(e.target.value)}
                                        style={{ width: 'auto', background: '#0b0f19', display: 'inline-block', minWidth: '280px', margin: 0, padding: '10px 16px' }}
                                    >
                                        {allExams.filter(e => allResults.some(r => r.examId === e.id)).map(e => (
                                            <option key={e.id} value={e.id}>{e.title}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Fetch and Segment Rank Data */}
                            {(() => {
                                const activeData = leaderboardMode === 'cumulative' 
                                    ? getLeaderboard() 
                                    : getTestLeaderboard(selectedLeaderboardExamId);

                                if (activeData.length === 0) {
                                    return (
                                        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                                            <i className="fas fa-info-circle" style={{ fontSize: '2.5rem', marginBottom: '12px' }}></i>
                                            <p style={{ margin: 0 }}>No submission records available for this standings view.</p>
                                        </div>
                                    );
                                }

                                const podium = activeData.slice(0, 3);
                                const tableData = activeData; // We can list all of them in the table, or only index > 2. Let's list all of them but give a highly prominent podium block above it!

                                return (
                                    <div>
                                        {/* Beautiful Leaderboard Podium Grid */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'flex-end',
                                            gap: '24px',
                                            margin: '24px 0 48px 0',
                                            flexWrap: 'wrap-reverse'
                                        }}>
                                            {/* 2nd place */}
                                            {podium[1] && (
                                                <div className="podium-card rank-2nd animate-fade-in" style={{
                                                    background: 'rgba(255, 255, 255, 0.02)',
                                                    border: '1px solid rgba(226, 232, 240, 0.2)',
                                                    borderRadius: '20px',
                                                    padding: '24px',
                                                    width: '200px',
                                                    textAlign: 'center',
                                                    minHeight: '180px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
                                                    position: 'relative'
                                                }}>
                                                    <div style={{ fontSize: '2.2rem', color: '#cbd5e1', marginBottom: '8px' }}>
                                                        <i className="fas fa-award"></i>
                                                    </div>
                                                    <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{podium[1].name}</h4>
                                                    <span style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>2nd Place</span>
                                                    <span style={{ color: '#a855f7', fontWeight: '800', fontSize: '1rem', marginTop: '12px', display: 'block', fontFamily: 'Outfit' }}>
                                                        {podium[1].score !== undefined ? `${podium[1].score}/${podium[1].totalMarks} pts` : `${podium[1].avgPercentage.toFixed(1)}%`}
                                                    </span>
                                                </div>
                                            )}

                                            {/* 1st place */}
                                            {podium[0] && (
                                                <div className="podium-card rank-1st animate-fade-in" style={{
                                                    background: 'rgba(255, 255, 255, 0.03)',
                                                    border: '1px solid rgba(251, 191, 36, 0.4)',
                                                    borderRadius: '20px',
                                                    padding: '32px 24px',
                                                    width: '220px',
                                                    textAlign: 'center',
                                                    minHeight: '220px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 0 30px rgba(251, 191, 36, 0.15)',
                                                    position: 'relative',
                                                    zIndex: 2
                                                }}>
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '-20px',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                                        borderRadius: '50%',
                                                        width: '40px',
                                                        height: '40px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#111827',
                                                        fontSize: '1.25rem',
                                                        boxShadow: '0 0 15px rgba(245,158,11,0.5)',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        <i className="fas fa-crown"></i>
                                                    </div>
                                                    <h3 style={{ color: 'white', margin: '12px 0 4px 0', fontSize: '1.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{podium[0].name}</h3>
                                                    <span style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: 'extrabold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>1st Place</span>
                                                    <span style={{ color: '#10b981', fontWeight: '800', fontSize: '1.2rem', marginTop: '12px', display: 'block', fontFamily: 'Outfit' }}>
                                                        {podium[0].score !== undefined ? `${podium[0].score}/${podium[0].totalMarks} pts` : `${podium[0].avgPercentage.toFixed(1)}%`}
                                                    </span>
                                                </div>
                                            )}

                                            {/* 3rd place */}
                                            {podium[2] && (
                                                <div className="podium-card rank-3rd animate-fade-in" style={{
                                                    background: 'rgba(255, 255, 255, 0.02)',
                                                    border: '1px solid rgba(180, 83, 9, 0.2)',
                                                    borderRadius: '20px',
                                                    padding: '24px',
                                                    width: '200px',
                                                    textAlign: 'center',
                                                    minHeight: '160px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
                                                    position: 'relative'
                                                }}>
                                                    <div style={{ fontSize: '2rem', color: '#b45309', marginBottom: '8px' }}>
                                                        <i className="fas fa-medal"></i>
                                                    </div>
                                                    <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{podium[2].name}</h4>
                                                    <span style={{ color: '#b45309', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>3rd Place</span>
                                                    <span style={{ color: '#a855f7', fontWeight: '800', fontSize: '1rem', marginTop: '12px', display: 'block', fontFamily: 'Outfit' }}>
                                                        {podium[2].score !== undefined ? `${podium[2].score}/${podium[2].totalMarks} pts` : `${podium[2].avgPercentage.toFixed(1)}%`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Standings List Table */}
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                <thead>
                                                    <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-glass)' }}>
                                                        <th style={{ padding: '18px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', width: '100px' }}>Rank</th>
                                                        <th style={{ padding: '18px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Candidate Name</th>
                                                        {leaderboardMode === 'cumulative' ? (
                                                            <>
                                                                <th style={{ padding: '18px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Completed Tests</th>
                                                                <th style={{ padding: '18px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Average Score</th>
                                                                <th style={{ padding: '18px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Scholar Category</th>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <th style={{ padding: '18px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Marks Secured</th>
                                                                <th style={{ padding: '18px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Percentage</th>
                                                                <th style={{ padding: '18px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Passing Status</th>
                                                            </>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tableData.map((student, index) => {
                                                        const rank = index + 1;
                                                        
                                                        // Special visual highlights for Top 3 Ranks
                                                        let rankText = rank;
                                                        let rankStyle = {
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: '800',
                                                            fontSize: '1rem',
                                                            color: 'white',
                                                            background: 'rgba(255,255,255,0.05)'
                                                        };
                                                        let rowStyle = {
                                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                            transition: 'all 0.2s ease'
                                                        };

                                                        if (rank === 1) {
                                                            rankText = <i className="fas fa-crown"></i>;
                                                            rankStyle.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
                                                            rankStyle.color = '#111827';
                                                            rankStyle.boxShadow = '0 0 15px rgba(245, 158, 11, 0.4)';
                                                            rowStyle.background = 'rgba(245, 158, 11, 0.03)';
                                                        } else if (rank === 2) {
                                                            rankText = '2';
                                                            rankStyle.background = 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)';
                                                            rankStyle.color = '#111827';
                                                            rankStyle.boxShadow = '0 0 12px rgba(226, 232, 240, 0.2)';
                                                        } else if (rank === 3) {
                                                            rankText = '3';
                                                            rankStyle.background = 'linear-gradient(135deg, #b45309 0%, #78350f 100%)';
                                                            rankStyle.boxShadow = '0 0 12px rgba(180, 83, 9, 0.2)';
                                                        }

                                                        // Highlight active user row
                                                        const isCurrentUser = student.name === currentUser.name;
                                                        if (isCurrentUser) {
                                                            rowStyle.border = '2px solid rgba(168, 85, 247, 0.4)';
                                                            rowStyle.background = 'rgba(168, 85, 247, 0.05)';
                                                        }

                                                        return (
                                                            <tr 
                                                                key={student.name} 
                                                                style={rowStyle} 
                                                                onMouseOver={(e) => { e.currentTarget.style.background = isCurrentUser ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255,255,255,0.03)'; }} 
                                                                onMouseOut={(e) => { e.currentTarget.style.background = isCurrentUser ? 'rgba(168, 85, 247, 0.05)' : 'transparent'; }}
                                                            >
                                                                <td style={{ padding: '18px 24px' }}>
                                                                    <div style={rankStyle}>{rankText}</div>
                                                                </td>
                                                                <td style={{ padding: '18px 24px', fontWeight: '600', color: 'white' }}>
                                                                    {student.name} {isCurrentUser && <span className="badge badge-success" style={{ marginLeft: '8px', fontSize: '0.65rem', padding: '3px 8px' }}>You</span>}
                                                                </td>
                                                                {leaderboardMode === 'cumulative' ? (
                                                                    <>
                                                                        <td style={{ padding: '18px 24px', textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)' }}>
                                                                            {student.completedCount}
                                                                        </td>
                                                                        <td style={{ padding: '18px 24px', fontWeight: '800', fontSize: '1.05rem', color: '#a855f7', fontFamily: 'Outfit' }}>
                                                                            {student.avgPercentage.toFixed(1)}%
                                                                        </td>
                                                                        <td style={{ padding: '18px 24px' }}>
                                                                            <span className="badge" style={student.badgeStyle}>
                                                                                {student.badge}
                                                                            </span>
                                                                        </td>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <td style={{ padding: '18px 24px', textAlign: 'center', fontWeight: '600', color: 'white' }}>
                                                                            {student.score} / {student.totalMarks}
                                                                        </td>
                                                                        <td style={{ padding: '18px 24px', fontWeight: '800', fontSize: '1.05rem', color: '#a855f7', fontFamily: 'Outfit' }}>
                                                                            {student.percentage.toFixed(1)}%
                                                                        </td>
                                                                        <td style={{ padding: '18px 24px' }}>
                                                                            <span className={`badge ${student.passed ? 'badge-success' : 'badge-danger'}`} style={{ padding: '4px 12px' }}>
                                                                                {student.passed ? 'Passed' : 'Failed'}
                                                                            </span>
                                                                        </td>
                                                                    </>
                                                                )}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>

            {/* DPQ Active Solving Modal */}
            {activeDpq && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px'
                }}>
                    <div className="glass-panel animate-fade-in" style={{
                        maxWidth: '680px',
                        width: '100%',
                        padding: '40px',
                        position: 'relative',
                        boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                        border: '1px solid var(--border-glass)'
                    }}>
                        {/* Close button */}
                        <button 
                            onClick={() => setActiveDpq(null)}
                            style={{
                                position: 'absolute',
                                top: '24px',
                                right: '24px',
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: 'none',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            <i className="fas fa-times"></i>
                        </button>

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>{activeDpq.subject}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target Batch: {activeDpq.homeworkForBatch}</span>
                            {activeDpq.fileUrl && <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}><i className="fas fa-paperclip"></i> Attachment</span>}
                        </div>

                        {/* Uploaded File Viewer */}
                        {activeDpq.fileUrl && (
                            <div style={{ marginBottom: '24px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                                {activeDpq.fileType === 'pdf' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>If the PDF doesn't load below:</span>
                                            <a href={activeDpq.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem', textDecoration: 'none', borderRadius: '20px' }}>
                                                <i className="fas fa-external-link-alt"></i> Open PDF in New Tab
                                            </a>
                                        </div>
                                        <iframe src={activeDpq.fileUrl} width="100%" height="400" style={{ border: 'none', background: 'white' }}></iframe>
                                    </div>
                                ) : ['jpg', 'jpeg', 'png'].includes(activeDpq.fileType) ? (
                                    <div style={{ background: 'white', padding: '12px', maxHeight: '450px', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                                        <img src={activeDpq.fileUrl} alt="DPP Question Paper" style={{ maxWidth: '100%', objectFit: 'contain' }} />
                                    </div>
                                ) : (
                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <i className="fas fa-file-word" style={{ fontSize: '2.5rem', color: '#2b579a' }}></i>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ color: 'white', margin: '0 0 4px 0' }}>Word Document Attached</h4>
                                            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Download to view the full question paper.</p>
                                        </div>
                                        <a href={activeDpq.fileUrl} download className="btn-primary" style={{ padding: '10px 20px', textDecoration: 'none', fontSize: '0.9rem' }}>
                                            <i className="fas fa-download"></i> Download
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Question text */}
                        <h2 style={{ fontSize: '1.4rem', color: 'white', lineHeight: '1.5', marginBottom: '32px', fontWeight: '600' }}>
                            {activeDpq.questionText}
                        </h2>

                        {/* Options */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                            {activeDpq.options.map((optText, idx) => {
                                const isSelected = selectedDpqOption === idx;
                                
                                // Styling depending on submission status
                                let borderStyle = '1px solid var(--border-glass)';
                                let bgStyle = 'rgba(0,0,0,0.3)';
                                let iconColor = 'var(--text-muted)';
                                
                                if (isDpqSubmitted) {
                                    if (idx === activeDpq.correctOption) {
                                        borderStyle = '2px solid #10b981';
                                        bgStyle = 'rgba(16, 185, 129, 0.15)';
                                        iconColor = '#10b981';
                                    } else if (isSelected) {
                                        borderStyle = '2px solid #ef4444';
                                        bgStyle = 'rgba(239, 68, 68, 0.15)';
                                        iconColor = '#ef4444';
                                    }
                                } else if (isSelected) {
                                    borderStyle = '2px solid #3b82f6';
                                    bgStyle = 'rgba(59, 130, 246, 0.15)';
                                    iconColor = '#3b82f6';
                                }

                                return (
                                    <div 
                                        key={idx}
                                        onClick={() => { if (!isDpqSubmitted) setSelectedDpqOption(idx); }}
                                        style={{
                                            padding: '16px 20px',
                                            borderRadius: '12px',
                                            background: bgStyle,
                                            border: borderStyle,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            cursor: isDpqSubmitted ? 'default' : 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            border: isSelected || (isDpqSubmitted && idx === activeDpq.correctOption) ? `6px solid ${iconColor}` : '2px solid var(--text-muted)',
                                            background: 'transparent',
                                            flexShrink: 0
                                        }} />
                                        <span style={{ fontSize: '1.05rem', color: isSelected || (isDpqSubmitted && idx === activeDpq.correctOption) ? 'white' : 'var(--text-main)' }}>
                                            {optText}
                                        </span>
                                        {isDpqSubmitted && idx === activeDpq.correctOption && (
                                            <i className="fas fa-check-circle" style={{ marginLeft: 'auto', color: '#10b981', fontSize: '1.2rem' }}></i>
                                        )}
                                        {isDpqSubmitted && isSelected && idx !== activeDpq.correctOption && (
                                            <i className="fas fa-times-circle" style={{ marginLeft: 'auto', color: '#ef4444', fontSize: '1.2rem' }}></i>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Solution section / Submit button */}
                        {isDpqSubmitted ? (
                            <div className="animate-fade-in" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', padding: '24px', borderRadius: '16px' }}>
                                <h4 style={{ color: '#60a5fa', fontSize: '0.95rem', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '700' }}>
                                    <i className="fas fa-lightbulb"></i> Concept & Solution Explanation:
                                </h4>
                                <p style={{ color: 'var(--text-main)', fontSize: '1rem', lineHeight: '1.5', margin: 0 }}>
                                    {activeDpq.solutionExplanation}
                                </p>
                            </div>
                        ) : (
                            <button 
                                onClick={() => handleDpqSubmit(activeDpq)}
                                className="btn-primary"
                                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', justifyContent: 'center', background: 'var(--secondary-gradient)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}
                            >
                                Submit Answer
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 4: PREVIOUS YEAR QUESTIONS */}
            {activeTab === 'pyp' && (
                <div className="animate-fade-in">
                    {/* Hero Banner */}
                    <div className="glass-panel" style={{
                        padding: '40px',
                        marginBottom: '36px',
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(239,68,68,0.1) 50%, rgba(99,102,241,0.15) 100%)',
                        border: '1px solid rgba(245,158,11,0.3)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position:'absolute', top:'-60px', right:'-40px', width:'300px', height:'300px', background:'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', zIndex:0 }} />
                        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'24px' }}>
                            <div>
                                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
                                    <span className="badge" style={{ background:'rgba(245,158,11,0.2)', color:'#fbbf24', border:'1px solid rgba(245,158,11,0.4)', padding:'8px 16px' }}>
                                        <i className="fas fa-archive" style={{ marginRight:'6px' }}></i> Official Archives
                                    </span>
                                    <span className="badge" style={{ background:'rgba(99,102,241,0.2)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.4)', padding:'8px 16px' }}>
                                        <i className="fas fa-shield-alt" style={{ marginRight:'6px' }}></i> Verified Sources
                                    </span>
                                </div>
                                <h2 style={{ fontSize:'2rem', color:'white', marginBottom:'8px' }}>Previous Year Questions</h2>
                                <p style={{ color:'var(--text-muted)', fontSize:'1rem', maxWidth:'550px' }}>
                                    Curated from official NTA &amp; CET Cell portals. JEE Main (2018â€“2024), JEE Advanced (2018â€“2024), NEET (2020â€“2024), MHT-CET (2022â€“2024).
                                </p>
                            </div>
                            <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
                                {[
                                    { label:'JEE Main', count:7, color:'#6366f1' },
                                    { label:'JEE Advanced', count:7, color:'#8b5cf6' },
                                    { label:'NEET', count:5, color:'#10b981' },
                                    { label:'MHT-CET', count:3, color:'#f59e0b' },
                                ].map(stat => (
                                    <div key={stat.label} className="glass-panel" style={{ padding:'16px 20px', textAlign:'center', background:'rgba(0,0,0,0.3)', minWidth:'80px' }}>
                                        <span style={{ fontSize:'1.8rem', fontWeight:'800', fontFamily:'Outfit', color:stat.color, display:'block' }}>{stat.count}</span>
                                        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{stat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div style={{ display:'flex', gap:'16px', marginBottom:'32px', flexWrap:'wrap', alignItems:'center' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                            <i className="fas fa-filter" style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}></i>
                            <span style={{ color:'var(--text-muted)', fontSize:'0.9rem', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em' }}>Filter:</span>
                        </div>
                        {/* Exam Filter */}
                        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                            {['all','JEE Main','JEE Advanced','NEET','MHT-CET'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setPypExamFilter(f)}
                                    className={pypExamFilter === f ? 'btn-primary' : 'btn-secondary'}
                                    style={{ padding:'8px 18px', fontSize:'0.85rem', borderRadius:'10px',
                                        background: pypExamFilter === f ?
                                            (f==='JEE Main' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' :
                                             f==='JEE Advanced' ? 'linear-gradient(135deg,#8b5cf6,#a855f7)' :
                                             f==='NEET' ? 'linear-gradient(135deg,#10b981,#14b8a6)' :
                                             f==='MHT-CET' ? 'linear-gradient(135deg,#f59e0b,#ef4444)' :
                                             'var(--primary-gradient)') : '',
                                        border: pypExamFilter === f ? 'none' : '1px solid var(--border-glass)'
                                    }}
                                >
                                    {f === 'all' ? 'All Exams' : f}
                                </button>
                            ))}
                        </div>
                        {/* Year Filter */}
                        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginLeft:'8px' }}>
                            <span style={{ color:'var(--text-muted)', fontSize:'0.85rem', padding:'8px 0' }}>Year:</span>
                            {['all','2024','2023','2022','2021','2020','2019','2018'].map(y => (
                                <button
                                    key={y}
                                    onClick={() => setPypYearFilter(y)}
                                    className={pypYearFilter === y ? 'btn-primary' : 'btn-secondary'}
                                    style={{ padding:'8px 14px', fontSize:'0.82rem', borderRadius:'8px',
                                        border: pypYearFilter === y ? 'none' : '1px solid var(--border-glass)'
                                    }}
                                >
                                    {y === 'all' ? 'All' : y}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Results Count */}
                    <div style={{ marginBottom:'24px', display:'flex', alignItems:'center', gap:'12px' }}>
                        <span style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>
                            Showing <strong style={{ color:'white' }}>{filteredPapers.length}</strong> paper{filteredPapers.length !== 1 ? 's' : ''}
                        </span>
                        {(pypExamFilter !== 'all' || pypYearFilter !== 'all') && (
                            <button
                                onClick={() => { setPypExamFilter('all'); setPypYearFilter('all'); }}
                                style={{ background:'rgba(255,255,255,0.05)', border:'1px solid var(--border-glass)', color:'var(--text-muted)', padding:'4px 12px', borderRadius:'8px', cursor:'pointer', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:'6px' }}
                            >
                                <i className="fas fa-times"></i> Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Papers Grid */}
                    {filteredPapers.length === 0 ? (
                        <div className="glass-panel" style={{ padding:'48px', textAlign:'center', color:'var(--text-muted)' }}>
                            <i className="fas fa-search" style={{ fontSize:'3rem', marginBottom:'16px', color:'rgba(255,255,255,0.15)' }}></i>
                            <h3 style={{ color:'white', marginBottom:'8px' }}>No papers found</h3>
                            <p>Try adjusting the exam or year filter above.</p>
                        </div>
                    ) : (
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'24px' }}>
                            {filteredPapers.map(paper => (
                                <div key={paper.id} className="glass-panel glass-panel-hover" style={{ padding:'28px', display:'flex', flexDirection:'column', justifyContent:'space-between', borderTop:`3px solid ${paper.color}`, position:'relative', overflow:'hidden' }}>
                                    {/* BG glow */}
                                    <div style={{ position:'absolute', top:'-40px', right:'-30px', width:'160px', height:'160px', background:`radial-gradient(circle, ${paper.color}20 0%, transparent 70%)`, zIndex:0 }} />
                                    <div style={{ position:'relative', zIndex:1 }}>
                                        {/* Header row */}
                                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                                <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:`${paper.color}20`, border:`1px solid ${paper.color}40`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                    <i className={`fas ${paper.icon}`} style={{ color:paper.color, fontSize:'1.1rem' }}></i>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:'600' }}>{paper.exam}</div>
                                                    <div style={{ fontSize:'1.4rem', fontWeight:'800', fontFamily:'Outfit', color:'white', lineHeight:'1.1' }}>{paper.year}</div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize:'0.72rem', background:`${paper.color}18`, color:paper.color, border:`1px solid ${paper.color}35`, padding:'4px 10px', borderRadius:'6px', fontWeight:'600' }}>
                                                {paper.badge}
                                            </span>
                                        </div>

                                        {/* Details */}
                                        <div style={{ marginBottom:'20px', display:'flex', flexDirection:'column', gap:'8px' }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'0.88rem', color:'var(--text-muted)' }}>
                                                <i className="fas fa-layer-group" style={{ color:paper.color, width:'14px' }}></i>
                                                <span>{paper.session}</span>
                                            </div>
                                            <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'0.88rem', color:'var(--text-muted)' }}>
                                                <i className="fas fa-book" style={{ color:paper.color, width:'14px' }}></i>
                                                <span>Subjects: {paper.subject}</span>
                                            </div>
                                            <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'0.88rem', color:'var(--text-muted)' }}>
                                                <i className="fas fa-external-link-alt" style={{ color:paper.color, width:'14px' }}></i>
                                                <span>Opens on official portal</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <a
                                        href={paper.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                                            padding:'14px 20px',
                                            borderRadius:'12px',
                                            background:`linear-gradient(135deg, ${paper.color} 0%, ${paper.color}cc 100%)`,
                                            color:'white',
                                            textDecoration:'none',
                                            fontWeight:'700',
                                            fontSize:'0.95rem',
                                            transition:'all 0.2s',
                                            boxShadow:`0 4px 20px ${paper.color}30`,
                                            marginTop:'4px'
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 30px ${paper.color}50`; }}
                                        onMouseOut={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 4px 20px ${paper.color}30`; }}
                                    >
                                        <i className="fas fa-arrow-up-right-from-square"></i>
                                        Access {paper.year} Papers
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Info Note */}
                    <div style={{ marginTop:'40px', padding:'20px 24px', background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:'14px', display:'flex', alignItems:'flex-start', gap:'14px' }}>
                        <i className="fas fa-circle-info" style={{ color:'#818cf8', fontSize:'1.2rem', marginTop:'2px', flexShrink:0 }}></i>
                        <div>
                            <p style={{ color: 'white', fontWeight: '600', marginBottom: '4px', fontSize: '0.95rem' }}>How to access the papers</p>
                            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.88rem', lineHeight: '1.6' }}>
                                Click <strong style={{ color:'#818cf8' }}>"Access Papers"</strong> to open the official NTA or CET Cell portal in a new tab. Navigate to the <em>Question Paper</em> / <em>Downloads</em> section on that site and select the year &amp; session. Papers are freely available on the official websites without login for past years.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {/* TAB 5: DOUBTS & CHAT */}
            {activeTab === 'doubts' && (
                <div className="animate-fade-in">
                    <div className="glass-panel" style={{ padding: '40px', marginBottom: '36px' }}>
                        <h2 style={{ fontSize: '2rem', color: 'white', marginBottom: '8px' }}>Ask a Doubt</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px', marginBottom: '24px' }}>
                            Connect directly with your academy's subject teachers. Ask questions, get detailed explanations, and receive image/PDF solutions.
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
                            {/* Send Message Form */}
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px' }}>
                                <h3 style={{ color: 'white', marginTop: 0, marginBottom: '20px' }}>New Question</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Select Teacher</label>
                                        <select className="input-premium" value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}>
                                            <option value="">-- Choose Instructor --</option>
                                            {users.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Your Doubt</label>
                                        <textarea className="input-premium" placeholder="Explain what you need help with..." value={messageText} onChange={e => setMessageText(e.target.value)} rows="4"></textarea>
                                    </div>
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Attach File (Optional)</label>
                                        <input type="file" id="studentFile" style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx" onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onloadend = () => { setMessageFile(reader.result); setMessageFileType(file.type.startsWith('image/') ? 'image' : 'document'); };
                                            reader.readAsDataURL(file);
                                        }} />
                                        <label htmlFor="studentFile" className="btn-secondary" style={{ cursor: 'pointer', display: 'block', textAlign: 'center' }}>
                                            <i className="fas fa-upload"></i> {messageFile ? 'File Attached' : 'Upload Image/PDF'}
                                        </label>
                                    </div>
                                    <button className="btn-primary" onClick={handleSendMessage} style={{ marginTop: '8px' }}>
                                        <i className="fas fa-paper-plane"></i> Send Message
                                    </button>
                                </div>
                            </div>

                            {/* Message History */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
                                <h3 style={{ color: 'white', marginTop: 0, marginBottom: '4px' }}>Doubt History</h3>
                                {messages.length === 0 ? (
                                    <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}>
                                        <i className="fas fa-comments" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.1)', marginBottom: '16px' }}></i>
                                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>You haven't asked any doubts yet.</p>
                                    </div>
                                ) : (
                                    messages.map(msg => (
                                        <div key={msg.id} style={{ background: msg.senderId === currentUser.id ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', alignSelf: msg.senderId === currentUser.id ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', gap: '16px' }}>
                                                <span style={{ color: 'white', fontWeight: 'bold' }}>{msg.senderId === currentUser.id ? 'You' : msg.senderName + ' (' + msg.senderRole + ')'}</span>
                                                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>{new Date(msg.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p style={{ margin: 0, color: 'white', fontSize: '0.95rem' }}>{msg.text}</p>
                                            {msg.fileUrl && (
                                                <div style={{ marginTop: '12px' }}>
                                                    <a href={msg.fileUrl} target="_blank" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'inline-block', background: 'rgba(0,0,0,0.3)', border: 'none' }}>
                                                        <i className="fas fa-paperclip"></i> View Attached {msg.fileType === 'image' ? 'Image' : 'Document'}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation Bar - Visible only on Mobile */}
            <div className="mobile-bottom-nav">
                <button 
                    onClick={() => setActiveTab('tests')}
                    className={`mobile-bottom-nav-item ${activeTab === 'tests' ? 'active' : ''}`}
                >
                    <i className="fas fa-file-alt"></i>
                    <span>Tests</span>
                </button>
                <button 
                    onClick={() => setActiveTab('analytics')}
                    className={`mobile-bottom-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                >
                    <i className="fas fa-chart-pie"></i>
                    <span>Analytics</span>
                </button>
                <button 
                    onClick={() => setActiveTab('leaderboard')}
                    className={`mobile-bottom-nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`}
                >
                    <i className="fas fa-trophy"></i>
                    <span>Trophy</span>
                </button>
                <button 
                    onClick={() => setActiveTab('pyp')}
                    className={`mobile-bottom-nav-item ${activeTab === 'pyp' ? 'active' : ''}`}
                >
                    <i className="fas fa-book-open"></i>
                    <span>PYQs</span>
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
