function Admin({ currentUser, onSettingsChange }) {
    const [exams, setExams] = React.useState([]);
    const [results, setResults] = React.useState([]);
    const [activeTab, setActiveTab] = React.useState('overview'); // 'overview' | 'create_exam' | 'create_dpq' | 'results' | 'teachers' | 'messages'
    const [users, setUsers] = React.useState([]);
    const [dpqs, setDpqs] = React.useState([]);
    const [dpqAttempts, setDpqAttempts] = React.useState([]);
    const [pyps, setPyps] = React.useState([]);
    const [messages, setMessages] = React.useState([]);
    const [successMessage, setSuccessMessage] = React.useState('');

    // Admin exam listing states
    const [adminExamSearch, setAdminExamSearch] = React.useState('');
    const [adminExamSubjectFilter, setAdminExamSubjectFilter] = React.useState('all');
    const [adminExamSortKey, setAdminExamSortKey] = React.useState('date'); // 'date' | 'title' | 'marks'
    const [adminExamViewMode, setAdminExamViewMode] = React.useState('table'); // 'table' | 'grid'

    React.useEffect(() => {
        async function loadAdminData() {
            try {
                const [fetchedExams, fetchedResults, fetchedUsers, fetchedDpqs, fetchedAttempts, fetchedPyps, fetchedSettings, fetchedMessages] = await Promise.all([
                    api.getExams(),
                    api.getResults(),
                    api.getUsers(),
                    api.getDpqs(),
                    api.getDpqAttempts(),
                    api.getPyps(),
                    api.getSettings(),
                    api.getMessages()
                ]);
                setExams(fetchedExams);
                setResults(fetchedResults);
                setUsers(fetchedUsers);
                setDpqs(fetchedDpqs);
                setDpqAttempts(fetchedAttempts);
                setPyps(fetchedPyps);
                setMessages(fetchedMessages || []);
            } catch (err) {
                console.error('Failed to load admin data:', err);
            }
        }
        loadAdminData();
    }, []);

    // Staff/Teacher management states
    const [newTeacherName, setNewTeacherName] = React.useState('');
    const [newTeacherUsername, setNewTeacherUsername] = React.useState('');
    const [newTeacherPassword, setNewTeacherPassword] = React.useState('');
    const [newTeacherSubject, setNewTeacherSubject] = React.useState('Physics');

    // Student management states
    const [newStudentName, setNewStudentName] = React.useState('');
    const [newStudentUsername, setNewStudentUsername] = React.useState('');
    const [newStudentPassword, setNewStudentPassword] = React.useState('');
    const [newStudentBatch, setNewStudentBatch] = React.useState('JEE Advanced 2026');
    const [studentFilter, setStudentFilter] = React.useState('All');
    const [resultBatchFilter, setResultBatchFilter] = React.useState('All');
    
    const [settings, setSettings] = React.useState({
        instituteName: "MAHESH & DHUMAL ACADEMICS",
        contactNumbers: "",
        topAchievers: []
    });

    React.useEffect(() => {
        async function loadSettings() {
            try {
                const s = await api.getSettings();
                setSettings(s);
            } catch (err) {}
        }
        loadSettings();
    }, []);

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        try {
            const updated = await api.updateSettings(settings);
            setSuccessMessage('Site Settings updated successfully!');
            setTimeout(() => setSuccessMessage(''), 5000);
            if (onSettingsChange) onSettingsChange(updated);
        } catch (err) {
            alert('Failed to update settings');
        }
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault();
        if (!newStudentName.trim() || !newStudentUsername.trim() || !newStudentPassword.trim()) {
            alert('Please fill out all fields.');
            return;
        }

        const usernameLower = newStudentUsername.trim().toLowerCase();
        if (users.some(u => u.username.toLowerCase() === usernameLower)) {
            alert('Username already exists. Please choose a unique username.');
            return;
        }

        const newStudent = {
            id: Date.now(),
            name: newStudentName.trim(),
            username: usernameLower,
            password: newStudentPassword,
            role: 'student',
            batch: newStudentBatch
        };

        try {
            const savedStudent = await api.createUser(newStudent);
            setUsers(prev => [...prev, savedStudent]);
            setSuccessMessage(`Successfully created Student login for ${newStudentName.trim()} (${newStudentBatch})!`);

            setNewStudentName('');
            setNewStudentUsername('');
            setNewStudentPassword('');
            setNewStudentBatch('JEE Advanced 2026');

            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (err) {
            alert('Failed to save student to backend.');
        }
    };

    const handleCreateTeacher = async (e) => {
        e.preventDefault();
        if (!newTeacherName.trim() || !newTeacherUsername.trim() || !newTeacherPassword.trim()) {
            alert('Please fill out all fields.');
            return;
        }

        const usernameLower = newTeacherUsername.trim().toLowerCase();
        if (users.some(u => u.username.toLowerCase() === usernameLower)) {
            alert('Username already exists. Please choose a unique username.');
            return;
        }

        const newTeacher = {
            id: Date.now(),
            name: newTeacherName.trim(),
            username: usernameLower,
            password: newTeacherPassword,
            role: 'teacher',
            subject: newTeacherSubject
        };

        try {
            const savedTeacher = await api.createUser(newTeacher);
            setUsers(prev => [...prev, savedTeacher]);
            setSuccessMessage(`Successfully created Teacher login for ${newTeacherName.trim()} (${newTeacherSubject})!`);

            // Reset fields
            setNewTeacherName('');
            setNewTeacherUsername('');
            setNewTeacherPassword('');
            setNewTeacherSubject('Physics');

            setTimeout(() => setSuccessMessage(''), 5000);
            setActiveTab('overview');
        } catch (err) {
            alert('Failed to save teacher to backend.');
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (window.confirm(`Are you sure you want to delete user account "${userName}"?`)) {
            try {
                await api.deleteUser(userId);
                setUsers(prev => prev.filter(u => u.id !== userId));
            } catch (err) {
                alert('Failed to delete user from backend.');
            }
        }
    };

    // New DPQ Form State
    const [newDpqText, setNewDpqText] = React.useState('');
    const [newDpqSubject, setNewDpqSubject] = React.useState('Physics');
    const [newDpqOptions, setNewDpqOptions] = React.useState(['', '', '', '']);
    const [newDpqCorrect, setNewDpqCorrect] = React.useState(0);
    const [newDpqBatch, setNewDpqBatch] = React.useState('All Batches');
    const [newDpqSolution, setNewDpqSolution] = React.useState('');

    const handleNewDpqOptionChange = (idx, val) => {
        setNewDpqOptions(prev => {
            const copy = [...prev];
            copy[idx] = val;
            return copy;
        });
    };

    const handleCreateDpqSubmit = async (e) => {
        e.preventDefault();
        if (newDpqOptions.some(o => !o.trim())) {
            alert('Please complete all 4 options.');
            return;
        }

        const newDpq = {
            id: 'dpq-' + Date.now(),
            questionText: newDpqText.trim(),
            subject: newDpqSubject,
            options: newDpqOptions.map(o => o.trim()),
            correctOption: Number(newDpqCorrect),
            date: new Date().toLocaleDateString(),
            homeworkForBatch: newDpqBatch,
            solutionExplanation: newDpqSolution.trim(),
            fileUrl: adminDpqFileUrl,
            fileType: adminDpqFileType
        };

        try {
            const savedDpq = await api.createDpq(newDpq);
            setDpqs(prev => [savedDpq, ...prev]);
            setSuccessMessage('Successfully published new Daily Practice Problem! It is now live for targeted students.');

            setNewDpqText('');
            setNewDpqOptions(['', '', '', '']);
            setNewDpqCorrect(0);
            setNewDpqSolution('');
            setAdminDpqCreationMode('manual');
            setAdminDpqFileUrl('');
            setAdminDpqFileType('');

            setTimeout(() => setSuccessMessage(''), 5000);
            setActiveTab('overview');
        } catch (err) {
            alert('Failed to publish Daily Practice Problem to server.');
        }
    };

    // New exam form state
    const [newExamTitle, setNewExamTitle] = React.useState('');
    const [newExamSubject, setNewExamSubject] = React.useState('Physics');
    const [newExamDuration, setNewExamDuration] = React.useState(15);
    const [newExamTotalMarks, setNewExamTotalMarks] = React.useState(30);
    const [newExamPassingMarks, setNewExamPassingMarks] = React.useState(15);
    const [newExamDesc, setNewExamDesc] = React.useState('');
    const [questions, setQuestions] = React.useState([
        { questionText: '', options: ['', '', '', ''], correctOption: 0, marks: 10, solutionExplanation: '' }
    ]);

    // File upload states for Admin Exam creation
    const [adminExamCreationMode, setAdminExamCreationMode] = React.useState('manual');
    const [adminExamFileUrl, setAdminExamFileUrl] = React.useState('');
    const [adminExamFileType, setAdminExamFileType] = React.useState('');
    const [isAdminExamUploading, setIsAdminExamUploading] = React.useState(false);
    const [adminExamUploadNumQs, setAdminExamUploadNumQs] = React.useState(10);

    // File upload states for Admin DPQ creation
    const [adminDpqCreationMode, setAdminDpqCreationMode] = React.useState('manual');
    const [adminDpqFileUrl, setAdminDpqFileUrl] = React.useState('');
    const [adminDpqFileType, setAdminDpqFileType] = React.useState('');
    const [isAdminDpqUploading, setIsAdminDpqUploading] = React.useState(false);

    const handleAdminFileUpload = async (e, target) => {
        const file = e.target.files[0];
        if (!file) return;
        const setUploading = target === 'exam' ? setIsAdminExamUploading : setIsAdminDpqUploading;
        setUploading(true);
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
                const ext = file.name.split('.').pop().toLowerCase();
                if (target === 'exam') {
                    setAdminExamFileUrl(resData.url);
                    setAdminExamFileType(ext);
                } else {
                    setAdminDpqFileUrl(resData.url);
                    setAdminDpqFileType(ext);
                }
                setUploading(false);
                setSuccessMessage('File uploaded successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            };
        } catch (err) {
            console.error(err);
            alert('Failed to upload file');
            setUploading(false);
        }
    };

    const generateAdminUploadQuestions = () => {
        const num = Number(adminExamUploadNumQs);
        const newQs = [];
        for (let i = 0; i < num; i++) {
            newQs.push({
                questionText: `Question ${i + 1} (See uploaded paper)`,
                options: ['A', 'B', 'C', 'D'],
                correctOption: 0,
                marks: Math.floor(newExamTotalMarks / num) || 1,
                solutionExplanation: 'Refer to the uploaded answer key or paper for details.'
            });
        }
        setQuestions(newQs);
    };

    // New PYP Form State
    const [newPypExam, setNewPypExam] = React.useState('JEE Main');
    const [newPypYear, setNewPypYear] = React.useState(2024);
    const [newPypSession, setNewPypSession] = React.useState('');
    const [newPypSubject, setNewPypSubject] = React.useState('PCM');
    const [newPypFileUrl, setNewPypFileUrl] = React.useState('');
    const [newPypFileType, setNewPypFileType] = React.useState('');
    const [isPypUploading, setIsPypUploading] = React.useState(false);

    const handlePypFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsPypUploading(true);
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
                const ext = file.name.split('.').pop().toLowerCase();
                setNewPypFileUrl(resData.url);
                setNewPypFileType(ext);
                setIsPypUploading(false);
                setSuccessMessage('PYQ File uploaded successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            };
        } catch (err) {
            console.error(err);
            alert('Failed to upload PYQ file');
            setIsPypUploading(false);
        }
    };

    const handleCreatePypSubmit = async (e) => {
        e.preventDefault();
        if (!newPypFileUrl) {
            alert('Please upload a file before saving the PYQ.');
            return;
        }

        let icon = 'fa-file-pdf';
        let color = '#3b82f6';
        let badge = 'Academy Upload';

        if (newPypExam === 'JEE Main') { icon = 'fa-square-root-variable'; color = '#6366f1'; }
        if (newPypExam === 'JEE Advanced') { icon = 'fa-graduation-cap'; color = '#8b5cf6'; }
        if (newPypExam === 'NEET') { icon = 'fa-stethoscope'; color = '#10b981'; }
        if (newPypExam === 'MHT-CET') { icon = 'fa-building-columns'; color = '#f59e0b'; }

        const newPyp = {
            id: 'pyp-' + Date.now(),
            exam: newPypExam,
            year: Number(newPypYear),
            session: newPypSession.trim() || 'General',
            subject: newPypSubject.trim() || 'General',
            icon: icon,
            color: color,
            badge: badge,
            url: newPypFileUrl
        };

        try {
            const savedPyp = await api.createPyp(newPyp);
            setPyps(prev => [savedPyp, ...prev]);
            setSuccessMessage('Successfully uploaded Previous Year Question!');
            setNewPypYear(new Date().getFullYear());
            setNewPypSession('');
            setNewPypFileUrl('');
            setNewPypFileType('');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (err) {
            alert('Failed to save PYQ to server.');
        }
    };

    const handleDeletePyp = async (id) => {
        if (window.confirm('Are you sure you want to delete this Previous Year Question?')) {
            try {
                await api.deletePyp(id);
                setPyps(prev => prev.filter(p => p.id !== id));
            } catch (err) {
                alert('Failed to delete PYQ.');
            }
        }
    };

    const handleAddQuestion = () => {
        setQuestions(prev => [
            ...prev,
            { questionText: '', options: ['', '', '', ''], correctOption: 0, marks: 10, solutionExplanation: '' }
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

        const newExam = {
            id: 'exam-' + Date.now(),
            title: newExamTitle.trim(),
            subject: newExamSubject,
            durationMinutes: Number(newExamDuration),
            totalMarks: Number(newExamTotalMarks),
            passingMarks: Number(newExamPassingMarks),
            description: newExamDesc.trim() || 'Coaching examination evaluation test.',
            fileUrl: adminExamFileUrl,
            fileType: adminExamFileType,
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
            setSuccessMessage('Successfully created new test! It is now live for all enrolled students.');

            setNewExamTitle('');
            setNewExamDesc('');
            setAdminExamCreationMode('manual');
            setAdminExamFileUrl('');
            setAdminExamFileType('');
            setQuestions([{ questionText: '', options: ['', '', '', ''], correctOption: 0, marks: 10, solutionExplanation: '' }]);

            setTimeout(() => setSuccessMessage(''), 5000);
            setActiveTab('overview');
        } catch (err) {
            alert('Failed to save the new exam to server.');
        }
    };

    // Calculate metrics
    const totalSubmissions = results.length;
    const avgScore = totalSubmissions > 0 ? (results.reduce((acc, r) => acc + r.percentage, 0) / totalSubmissions).toFixed(1) : 0;
    const passingRate = totalSubmissions > 0 ? ((results.filter(r => r.passed).length / totalSubmissions) * 100).toFixed(1) : 0;

    const filteredResults = results.filter(r => {
        if (resultBatchFilter === 'All') return true;
        const student = users.find(u => u.id === r.studentId);
        return student && student.batch === resultBatchFilter;
    });

    return (
        <div style={{ padding: '40px 0' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
                {/* Header Banner */}
                <div className="glass-panel" style={{ padding: '36px', marginBottom: '36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <span className="badge" style={{ background: 'rgba(168,85,247,0.2)', color: '#a855f7' }}>
                                <i className="fas fa-crown" style={{ marginRight: '6px' }}></i> Director Portal
                            </span>
                        </div>
                        <h1 style={{ fontSize: '2.2rem', color: 'white', marginBottom: '8px' }}>
                            Coaching Management Dashboard
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                            Monitor student test performances, generate evaluation metrics, and author new online examinations.
                        </p>
                    </div>

                    {/* Action Navigation Tabs */}
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
                            <i className="fas fa-chart-pie" style={{ marginRight: '8px' }}></i> System Overview
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
                            <i className="fas fa-plus-circle" style={{ marginRight: '8px' }}></i> Create New Exam
                        </button>
                        <button 
                            onClick={() => setActiveTab('create_dpq')}
                            style={{
                                background: activeTab === 'create_dpq' ? 'var(--primary-gradient)' : 'transparent',
                                color: activeTab === 'create_dpq' ? 'white' : 'var(--text-muted)',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i className="fas fa-pencil-alt" style={{ marginRight: '8px' }}></i> Create Practice Problem
                        </button>
                        <button 
                            onClick={() => setActiveTab('results')}
                            style={{
                                background: activeTab === 'results' ? 'var(--primary-gradient)' : 'transparent',
                                color: activeTab === 'results' ? 'white' : 'var(--text-muted)',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i className="fas fa-user-graduate" style={{ marginRight: '8px' }}></i> Student Results ({totalSubmissions})
                        </button>
                        <button 
                            onClick={() => setActiveTab('students')}
                            style={{
                                background: activeTab === 'students' ? 'var(--primary-gradient)' : 'transparent',
                                color: activeTab === 'students' ? 'white' : 'var(--text-muted)',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i className="fas fa-users" style={{ marginRight: '8px' }}></i> Manage Students
                        </button>
                        <button 
                            onClick={() => setActiveTab('teachers')}
                            style={{
                                background: activeTab === 'teachers' ? 'var(--primary-gradient)' : 'transparent',
                                color: activeTab === 'teachers' ? 'white' : 'var(--text-muted)',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i className="fas fa-chalkboard-teacher" style={{ marginRight: '8px' }}></i> Manage Teachers
                        </button>
                        <button 
                            onClick={() => setActiveTab('manage_pyps')}
                            style={{
                                background: activeTab === 'manage_pyps' ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' : 'transparent',
                                color: activeTab === 'manage_pyps' ? 'white' : 'var(--text-muted)',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i className="fas fa-book-open" style={{ marginRight: '8px' }}></i> Manage PYQs
                        </button>
                        <button 
                            onClick={() => setActiveTab('settings')}
                            style={{
                                background: activeTab === 'settings' ? 'var(--primary-gradient)' : 'transparent',
                                color: activeTab === 'settings' ? 'white' : 'var(--text-muted)',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <i className="fas fa-cog" style={{ marginRight: '8px' }}></i> Platform Settings
                        </button>
                        <button 
                            onClick={() => setActiveTab('messages')}
                            style={{
                                background: activeTab === 'messages' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                                color: activeTab === 'messages' ? 'white' : 'var(--text-muted)',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <i className="fas fa-comments" style={{ marginRight: '8px' }}></i> Message Monitor
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
                        boxShadow: '0 0 25px rgba(16,185,129,0.3)'
                    }}>
                        <i className="fas fa-check-circle" style={{ fontSize: '1.4rem' }}></i>
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                    <div>
                        {/* Overall Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '48px' }}>
                            <div className="glass-panel" style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                                    <i className="fas fa-book-open"></i>
                                </div>
                                <div>
                                    <span style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'Outfit', color: 'white', display: 'block', lineHeight: '1.1' }}>
                                        {exams.length}
                                    </span>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Active Exams</span>
                                </div>
                            </div>

                            <div className="glass-panel" style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                                    <i className="fas fa-tasks"></i>
                                </div>
                                <div>
                                    <span style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'Outfit', color: 'white', display: 'block', lineHeight: '1.1' }}>
                                        {totalSubmissions}
                                    </span>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Total Attempts</span>
                                </div>
                            </div>

                            <div className="glass-panel" style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                                    <i className="fas fa-chart-line"></i>
                                </div>
                                <div>
                                    <span style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'Outfit', color: 'white', display: 'block', lineHeight: '1.1' }}>
                                        {avgScore}%
                                    </span>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Average Score</span>
                                </div>
                            </div>

                            <div className="glass-panel" style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                                    <i className="fas fa-check-double"></i>
                                </div>
                                <div>
                                    <span style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'Outfit', color: 'white', display: 'block', lineHeight: '1.1' }}>
                                        {passingRate}%
                                    </span>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Pass Rate</span>
                                </div>
                            </div>
                        </div>

                        {/* Exam Directory list */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                                <h2 style={{ fontSize: '1.8rem', color: 'white', margin: 0 }}>Manage Existing Exams</h2>
                                <button onClick={() => setActiveTab('create_exam')} className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.95rem' }}>
                                    <i className="fas fa-plus"></i> Add New Exam
                                </button>
                            </div>

                            <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                                {/* Search and Filter Inputs */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1, minWidth: '300px' }}>
                                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                                        <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                                        <input 
                                            type="text" 
                                            className="input-premium" 
                                            placeholder="Search exams..." 
                                            value={adminExamSearch}
                                            onChange={e => setAdminExamSearch(e.target.value)}
                                            style={{ paddingLeft: '40px', paddingRight: '14px', height: '42px', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <select 
                                        className="input-premium" 
                                        value={adminExamSubjectFilter} 
                                        onChange={e => setAdminExamSubjectFilter(e.target.value)}
                                        style={{ width: '160px', height: '42px', fontSize: '0.9rem', padding: '0 12px', background: '#111827' }}
                                    >
                                        <option value="all">All Subjects</option>
                                        {Array.from(new Set(exams.map(e => e.subject).filter(Boolean))).map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                    <select 
                                        className="input-premium" 
                                        value={adminExamSortKey} 
                                        onChange={e => setAdminExamSortKey(e.target.value)}
                                        style={{ width: '160px', height: '42px', fontSize: '0.9rem', padding: '0 12px', background: '#111827' }}
                                    >
                                        <option value="date">Sort by Date</option>
                                        <option value="title">Sort by Name</option>
                                        <option value="marks">Sort by Marks</option>
                                        <option value="questions">Sort by Questions</option>
                                    </select>
                                </div>
                                {/* View Toggle Buttons */}
                                <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                                    <button 
                                        onClick={() => setAdminExamViewMode('table')} 
                                        style={{ border: 'none', background: adminExamViewMode === 'table' ? 'var(--primary-gradient)' : 'transparent', color: 'white', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}
                                    >
                                        <i className="fas fa-list"></i> Table View
                                    </button>
                                    <button 
                                        onClick={() => setAdminExamViewMode('grid')} 
                                        style={{ border: 'none', background: adminExamViewMode === 'grid' ? 'var(--primary-gradient)' : 'transparent', color: 'white', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}
                                    >
                                        <i className="fas fa-th-large"></i> Grid View
                                    </button>
                                </div>
                            </div>

                            {(() => {
                                // Filter exams
                                const filteredExams = exams.filter(exam => {
                                    const matchSearch = exam.title.toLowerCase().includes(adminExamSearch.toLowerCase()) || 
                                                        (exam.description && exam.description.toLowerCase().includes(adminExamSearch.toLowerCase()));
                                    const matchSubject = adminExamSubjectFilter === 'all' || exam.subject === adminExamSubjectFilter;
                                    return matchSearch && matchSubject;
                                });

                                // Sort exams
                                const sortedExams = [...filteredExams].sort((a, b) => {
                                    if (adminExamSortKey === 'title') {
                                        return a.title.localeCompare(b.title);
                                    } else if (adminExamSortKey === 'marks') {
                                        return b.totalMarks - a.totalMarks;
                                    } else if (adminExamSortKey === 'questions') {
                                        return b.questions.length - a.questions.length;
                                    } else {
                                        return b.id.localeCompare(a.id);
                                    }
                                });

                                return (
                                    <>
                                        {adminExamViewMode === 'table' ? (
                                            <div className="glass-panel" style={{ overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                                                <div style={{ overflowX: 'auto' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                                                        <thead>
                                                            <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-glass)' }}>
                                                                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Exam Details</th>
                                                                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', width: '140px' }}>Subject</th>
                                                                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', width: '120px' }}>Questions</th>
                                                                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', width: '110px' }}>Marks</th>
                                                                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', width: '180px' }}>Batch</th>
                                                                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', width: '140px' }}>Submissions</th>
                                                                <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', width: '140px' }}>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {sortedExams.map(exam => {
                                                                const examResults = results.filter(r => r.examId === exam.id);
                                                                return (
                                                                    <tr key={exam.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                                                        <td style={{ padding: '16px 20px' }}>
                                                                            <strong style={{ color: 'white', fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>{exam.title}</strong>
                                                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{exam.description}</span>
                                                                        </td>
                                                                        <td style={{ padding: '16px 20px' }}>
                                                                            <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}>{exam.subject}</span>
                                                                        </td>
                                                                        <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                                            <i className="fas fa-question-circle" style={{ marginRight: '6px', color: '#a855f7' }}></i> {exam.questions ? exam.questions.length : 0} Qs
                                                                        </td>
                                                                        <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                                            <i className="fas fa-award" style={{ marginRight: '6px', color: '#f59e0b' }}></i> {exam.totalMarks} pts
                                                                        </td>
                                                                        <td style={{ padding: '16px 20px', color: 'white', fontSize: '0.88rem' }}>
                                                                            {exam.assignedBatch || 'All Batches'}
                                                                        </td>
                                                                        <td style={{ padding: '16px 20px', color: 'white', fontSize: '0.88rem' }}>
                                                                            <span className="badge badge-success">{examResults.length} submissions</span>
                                                                        </td>
                                                                        <td style={{ padding: '16px 20px' }}>
                                                                            <button 
                                                                                onClick={async () => {
                                                                                    if (window.confirm(`Delete exam "${exam.title}"?`)) {
                                                                                        try {
                                                                                            await api.deleteExam(exam.id);
                                                                                            setExams(prev => prev.filter(e => e.id !== exam.id));
                                                                                        } catch (err) {
                                                                                            alert('Failed to delete exam.');
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                className="btn-danger"
                                                                                style={{ padding: '6px 12px', fontSize: '0.8rem', minHeight: '32px' }}
                                                                            >
                                                                                <i className="fas fa-trash"></i> Delete
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            {sortedExams.length === 0 && (
                                                                <tr>
                                                                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                                        <i className="fas fa-search" style={{ fontSize: '2rem', marginBottom: '12px', display: 'block', color: 'rgba(255,255,255,0.1)' }}></i>
                                                                        No exams match your search filters.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                                                {sortedExams.map(exam => {
                                                    const examResults = results.filter(r => r.examId === exam.id);
                                                    return (
                                                        <div key={exam.id} className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                            <div>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                                                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>{exam.subject}</span>
                                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                                        <i className="fas fa-question-circle"></i> {exam.questions.length} questions
                                                                    </span>
                                                                </div>
                                                                <h3 style={{ fontSize: '1.35rem', color: 'white', marginBottom: '12px' }}>{exam.title}</h3>
                                                                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '24px' }}>{exam.description}</p>
                                                            </div>

                                                            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <div>
                                                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Submissions</span>
                                                                    <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>{examResults.length} students</span>
                                                                </div>
                                                                <button 
                                                                    onClick={async () => {
                                                                        if (window.confirm(`Delete exam "${exam.title}"?`)) {
                                                                            try {
                                                                                await api.deleteExam(exam.id);
                                                                                setExams(prev => prev.filter(e => e.id !== exam.id));
                                                                            } catch (err) {
                                                                                alert('Failed to delete exam.');
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="btn-danger"
                                                                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                                                                >
                                                                    <i className="fas fa-trash"></i> Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {sortedExams.length === 0 && (
                                                    <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                                                        <i className="fas fa-search" style={{ fontSize: '2rem', marginBottom: '12px', display: 'block', color: 'rgba(255,255,255,0.1)' }}></i>
                                                        No exams match your search filters.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        {/* DPQ Directory List */}
                        <div style={{ marginTop: '48px', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.8rem', color: 'white' }}>Manage Daily Practice Problems</h2>
                                <button onClick={() => setActiveTab('create_dpq')} className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.95rem', background: 'var(--secondary-gradient)', boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)' }}>
                                    <i className="fas fa-plus"></i> Add New DPP
                                </button>
                            </div>

                            {dpqs.length === 0 ? (
                                <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No Daily Practice Problems published yet.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                                    {dpqs.map(dpq => {
                                        const attempts = dpqAttempts.filter(a => a.dpqId === dpq.id);
                                        return (
                                            <div key={dpq.id} className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                                        <span className="badge" style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6' }}>{dpq.subject}</span>
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                            Batch: <strong style={{ color: 'white' }}>{dpq.homeworkForBatch}</strong>
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: '1.05rem', color: 'white', fontWeight: '600', marginBottom: '12px', lineHeight: '1.4' }}>{dpq.questionText}</p>
                                                    <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                                        Date: {dpq.date}
                                                    </span>
                                                </div>

                                                <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div>
                                                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Submissions</span>
                                                        <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>{attempts.length} attempts</span>
                                                    </div>
                                                    <button 
                                                        onClick={async () => {
                                                            if (window.confirm('Delete this practice problem?')) {
                                                                try {
                                                                    await api.deleteDpq(dpq.id);
                                                                    setDpqs(prev => prev.filter(d => d.id !== dpq.id));
                                                                } catch (err) {
                                                                    alert('Failed to delete practice problem.');
                                                                }
                                                            }
                                                        }}
                                                        className="btn-danger"
                                                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                                                    >
                                                        <i className="fas fa-trash"></i> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 2: CREATE EXAM FORM */}
                {activeTab === 'create_exam' && (
                    <div className="glass-panel animate-fade-in" style={{ padding: '48px', maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '2rem', color: 'white', marginBottom: '8px' }}>Create Online Examination</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Design a new test with automated grading and instant publication.</p>
                        </div>

                        <form onSubmit={handleCreateExamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div>
                                <label className="input-label">Exam Title</label>
                                <input 
                                    type="text"
                                    className="input-premium"
                                    placeholder="e.g. JEE Advanced Mock Test - Thermodynamics"
                                    value={newExamTitle}
                                    onChange={e => setNewExamTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label className="input-label">Subject</label>
                                    <select 
                                        className="input-premium"
                                        value={newExamSubject}
                                        onChange={e => setNewExamSubject(e.target.value)}
                                        style={{ background: '#111827', cursor: 'pointer' }}
                                    >
                                        <option value="Physics">Physics</option>
                                        <option value="Mathematics">Mathematics</option>
                                        <option value="Chemistry">Chemistry</option>
                                        <option value="Biology">Biology</option>
                                    </select>
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
                                        required
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
                                    <button type="button" onClick={() => setAdminExamCreationMode('manual')} className={adminExamCreationMode === 'manual' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 16px', borderRadius: '8px' }}>Manual Entry</button>
                                    <button type="button" onClick={() => setAdminExamCreationMode('upload')} className={adminExamCreationMode === 'upload' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 16px', borderRadius: '8px' }}>Upload Paper (PDF/Word/Image)</button>
                                </div>

                                {adminExamCreationMode === 'upload' && (
                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '28px', borderRadius: '20px', border: '1px solid var(--border-glass)', marginBottom: '32px' }}>
                                        <h4 style={{ color: 'white', marginBottom: '16px' }}><i className="fas fa-cloud-upload-alt" style={{ marginRight: '8px', color: '#a855f7' }}></i>Upload Question Paper</h4>
                                        <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => handleAdminFileUpload(e, 'exam')} style={{ color: 'white', marginBottom: '16px', width: '100%' }} />
                                        {isAdminExamUploading && <span style={{ color: 'var(--text-muted)' }}><i className="fas fa-spinner fa-spin"></i> Uploading...</span>}
                                        {adminExamFileUrl && <div style={{ color: 'var(--success-color)', marginBottom: '16px' }}><i className="fas fa-check-circle"></i> File ready: {adminExamFileUrl}</div>}

                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'end' }}>
                                            <div>
                                                <label className="input-label">Total Questions in Paper</label>
                                                <input type="number" className="input-premium" value={adminExamUploadNumQs} onChange={e => setAdminExamUploadNumQs(e.target.value)} min="1" />
                                            </div>
                                            <button type="button" onClick={generateAdminUploadQuestions} className="btn-secondary" style={{ padding: '12px 24px' }}>Generate Answer Key Grid</button>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '1.5rem', color: 'white' }}>{adminExamCreationMode === 'manual' ? `Test Questions (${questions.length})` : `Answer Key Grid (${questions.length})`}</h3>
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
                                                         style={{ width: '150px' }}
                                                         min="1"
                                                         value={q.marks}
                                                         onChange={e => handleQuestionChange(qIdx, 'marks', e.target.value)}
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
                                <i className="fas fa-cloud-upload-alt"></i> Publish Examination
                            </button>
                        </form>
                    </div>
                )}

                {/* TAB 3: CREATE DAILY PRACTICE QUESTION */}
                {activeTab === 'create_dpq' && (
                    <div className="glass-panel animate-fade-in" style={{ padding: '48px', maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '2rem', color: 'white', marginBottom: '8px' }}>Publish Practice Problem</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Publish a single concept question (homework or daily challenge) for specific student batches.</p>
                        </div>

                        <form onSubmit={handleCreateDpqSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* Mode Toggle */}
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                                <button type="button" onClick={() => setAdminDpqCreationMode('manual')} className={adminDpqCreationMode === 'manual' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 16px', borderRadius: '8px' }}>Manual Entry</button>
                                <button type="button" onClick={() => setAdminDpqCreationMode('upload')} className={adminDpqCreationMode === 'upload' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 16px', borderRadius: '8px' }}>Upload Paper (PDF/Word/Image)</button>
                            </div>

                            {adminDpqCreationMode === 'upload' && (
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '28px', borderRadius: '20px', border: '1px solid var(--border-glass)' }}>
                                    <h4 style={{ color: 'white', marginBottom: '16px' }}><i className="fas fa-cloud-upload-alt" style={{ marginRight: '8px', color: '#60a5fa' }}></i>Upload DPP Question Sheet</h4>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>Upload a PDF, Image, or Word file containing the practice problem(s).</p>
                                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => handleAdminFileUpload(e, 'dpq')} style={{ color: 'white', marginBottom: '16px', width: '100%' }} />
                                    {isAdminDpqUploading && <span style={{ color: 'var(--text-muted)' }}><i className="fas fa-spinner fa-spin"></i> Uploading...</span>}
                                    {adminDpqFileUrl && <div style={{ color: 'var(--success-color)', marginTop: '8px' }}><i className="fas fa-check-circle"></i> File uploaded successfully</div>}
                                </div>
                            )}

                            <div>
                                <label className="input-label">Question Text</label>
                                <textarea 
                                    rows="4"
                                    className="input-premium"
                                    placeholder={adminDpqCreationMode === 'upload' ? 'Briefly describe the uploaded problem (e.g. Solve Q1-Q5 from the sheet)...' : 'Enter the practice question description here...'}
                                    value={newDpqText}
                                    onChange={e => setNewDpqText(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label className="input-label">Subject</label>
                                    <select 
                                        className="input-premium"
                                        value={newDpqSubject}
                                        onChange={e => setNewDpqSubject(e.target.value)}
                                        style={{ background: '#111827', cursor: 'pointer' }}
                                    >
                                        <option value="Physics">Physics</option>
                                        <option value="Mathematics">Mathematics</option>
                                        <option value="Chemistry">Chemistry</option>
                                        <option value="Biology">Biology</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Target Batch / Class</label>
                                    <select 
                                        className="input-premium"
                                        value={newDpqBatch}
                                        onChange={e => setNewDpqBatch(e.target.value)}
                                        style={{ background: '#111827', cursor: 'pointer' }}
                                    >
                                        <option value="All Batches">All Batches</option>
                                        <option value="JEE Advanced 2026">JEE Advanced 2026</option>
                                        <option value="NEET Aspirants 2026">NEET Aspirants 2026</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="input-label">Multiple Choice Options (Select radio for correct answer)</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {newDpqOptions.map((optText, optIdx) => (
                                        <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.4)', padding: '12px 16px', borderRadius: '12px', border: newDpqCorrect === optIdx ? '1px solid #10b981' : '1px solid transparent' }}>
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
                                                required
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
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-primary" style={{ padding: '20px', fontSize: '1.2rem', justifyContent: 'center', marginTop: '16px', background: 'var(--secondary-gradient)', boxShadow: '0 0 25px rgba(59, 130, 246, 0.4)' }}>
                                <i className="fas fa-paper-plane"></i> Publish Practice Problem
                            </button>
                        </form>
                    </div>
                )}

                {/* TAB 3: STUDENT RESULTS */}
                {activeTab === 'results' && (
                    <div>
                            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.8rem', color: 'white' }}>Student Examination Submissions</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Detailed scorecard records for all enrolled batch students.</p>
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
                                        <option value="Class 8">Class 8</option>
                                        <option value="Class 9">Class 9</option>
                                        <option value="Class 10">Class 10</option>
                                        <option value="JEE Advanced 2026">JEE Advanced 2026</option>
                                        <option value="NEET Aspirants 2026">NEET Aspirants 2026</option>
                                        <option value="MHT-CET 2026">MHT-CET 2026</option>
                                    </select>
                                </div>
                            </div>

                            {filteredResults.length === 0 ? (
                                <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <i className="fas fa-inbox" style={{ fontSize: '3rem', marginBottom: '16px', color: 'rgba(255,255,255,0.2)' }}></i>
                                    <h3 style={{ color: 'white', marginBottom: '8px' }}>No student test submissions found</h3>
                                    <p>When students in this batch complete tests, their results will populate here.</p>
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
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredResults.map(res => (
                                                <tr key={res.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                                    <td style={{ padding: '20px 24px', fontWeight: '700', color: 'white' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--secondary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', fontSize: '0.85rem' }}>
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
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: MANAGE STUDENTS */}
                {activeTab === 'students' && (
                    <div>
                        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h2 style={{ fontSize: '1.8rem', color: 'white' }}>Manage Students</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Provision student accounts and manage batches (JEE, NEET, MHT-CET).</p>
                            </div>
                            <div>
                                <label style={{ color: 'var(--text-muted)', marginRight: '12px' }}>Filter by Batch:</label>
                                <select 
                                    className="input-premium"
                                    value={studentFilter}
                                    onChange={e => setStudentFilter(e.target.value)}
                                    style={{ background: '#111827', width: 'auto', display: 'inline-block' }}
                                >
                                    <option value="All">All Students</option>
                                    <option value="Class 8">Class 8</option>
                                    <option value="Class 9">Class 9</option>
                                    <option value="Class 10">Class 10</option>
                                    <option value="JEE">JEE Batch</option>
                                    <option value="NEET">NEET Batch</option>
                                    <option value="MHT-CET">MHT-CET Batch</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
                            {/* Bulk Upload Card */}
                            <div className="glass-panel" style={{ padding: '32px', gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(59,130,246,0.05) 100%)', border: '1px solid rgba(16,185,129,0.3)' }}>
                                <h3 style={{ fontSize: '1.35rem', color: 'white', marginBottom: '8px' }}>
                                    <i className="fas fa-file-excel text-gradient" style={{ marginRight: '8px', color: '#10b981' }}></i> Bulk Upload Students via Excel
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                                    Upload an Excel (.xlsx) or CSV file with columns: <strong style={{color:'white'}}>Name, Username, Password, Batch</strong>
                                </p>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <input type="file" id="bulkUploadFile" accept=".xlsx,.csv" style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            try {
                                                const data = await file.arrayBuffer();
                                                const wb = XLSX.read(data);
                                                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                                                let successCount = 0, failCount = 0;
                                                for (const row of rows) {
                                                    const name = row['Name'] || row['name'];
                                                    const username = row['Username'] || row['username'];
                                                    const password = row['Password'] || row['password'];
                                                    const batch = row['Batch'] || row['batch'] || 'Class 10';
                                                    if (!name || !username || !password) { failCount++; continue; }
                                                    try {
                                                        await api.createUser({ name, username, password, batch, role: 'student' });
                                                        successCount++;
                                                    } catch { failCount++; }
                                                }
                                                const freshUsers = await api.getUsers();
                                                setUsers(freshUsers);
                                                alert(`✅ Bulk Upload Done!\n${successCount} students created successfully.\n${failCount} rows skipped (missing fields).`);
                                                e.target.value = '';
                                            } catch (err) {
                                                alert('Failed to read Excel file. Make sure it has columns: Name, Username, Password, Batch');
                                            }
                                        }}
                                    />
                                    <label htmlFor="bulkUploadFile" className="btn-primary" style={{ cursor: 'pointer', padding: '12px 24px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}>
                                        <i className="fas fa-upload"></i> Choose Excel File & Upload
                                    </label>
                                    <a href="data:text/csv;charset=utf-8,Name,Username,Password,Batch%0AJohn Doe,john123,pass123,Class 10%0AJane Smith,jane123,pass456,JEE Advanced 2026" download="student_template.csv" className="btn-secondary" style={{ padding: '12px 24px', fontSize: '0.9rem' }}>
                                        <i className="fas fa-download"></i> Download Template
                                    </a>
                                </div>
                            </div>

                            {/* Create Student Form */}
                            <div className="glass-panel" style={{ padding: '32px' }}>
                                <h3 style={{ fontSize: '1.35rem', color: 'white', marginBottom: '24px' }}>
                                    <i className="fas fa-user-plus text-gradient" style={{ marginRight: '8px' }}></i> Create Student Account
                                </h3>

                                <form onSubmit={handleCreateStudent} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label className="input-label">Full Name</label>
                                        <input 
                                            type="text"
                                            className="input-premium"
                                            placeholder="e.g. Rahul Sharma"
                                            value={newStudentName}
                                            onChange={e => setNewStudentName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="input-label">Username</label>
                                        <input 
                                            type="text"
                                            className="input-premium"
                                            placeholder="e.g. rahul_sharma"
                                            value={newStudentUsername}
                                            onChange={e => setNewStudentUsername(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="input-label">Password</label>
                                        <input 
                                            type="password"
                                            className="input-premium"
                                            placeholder="••••••••"
                                            value={newStudentPassword}
                                            onChange={e => setNewStudentPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="input-label">Assigned Batch</label>
                                        <select 
                                            className="input-premium"
                                            value={newStudentBatch}
                                            onChange={e => setNewStudentBatch(e.target.value)}
                                            style={{ background: '#111827', cursor: 'pointer' }}
                                        >
                                            <option value="Class 8">Class 8</option>
                                            <option value="Class 9">Class 9</option>
                                            <option value="Class 10">Class 10</option>
                                            <option value="JEE Advanced 2026">JEE Advanced 2026</option>
                                            <option value="NEET Aspirants 2026">NEET Aspirants 2026</option>
                                            <option value="MHT-CET 2026">MHT-CET 2026</option>
                                        </select>
                                    </div>

                                    <button type="submit" className="btn-primary" style={{ padding: '14px', justifyContent: 'center', marginTop: '8px' }}>
                                        <i className="fas fa-user-check"></i> Provision Account
                                    </button>
                                </form>
                            </div>

                            {/* List of Students */}
                            <div className="glass-panel" style={{ padding: '32px' }}>
                                <h3 style={{ fontSize: '1.35rem', color: 'white', marginBottom: '24px' }}>
                                    <i className="fas fa-list-ul text-gradient" style={{ marginRight: '8px' }}></i> Active Students
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {users.filter(u => u.role === 'student' && (studentFilter === 'All' || (u.batch && u.batch.includes(studentFilter)))).length === 0 ? (
                                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                                            No student accounts found for this batch.
                                        </div>
                                    ) : (
                                        users.filter(u => u.role === 'student' && (studentFilter === 'All' || (u.batch && u.batch.includes(studentFilter)))).map(t => (
                                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
                                                <div>
                                                    <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: '600' }}>{t.name}</h4>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Username: <code>{t.username}</code></span>
                                                    <span className="badge" style={{ display: 'inline-block', marginTop: '6px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '4px 10px', fontSize: '0.75rem' }}>
                                                        <i className="fas fa-graduation-cap"></i> {t.batch || 'Unassigned'}
                                                    </span>
                                                </div>

                                                <button 
                                                    onClick={() => handleDeleteUser(t.id, t.name)}
                                                    className="btn-danger"
                                                    style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                                                >
                                                    <i className="fas fa-trash-alt"></i> Remove
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 5: MANAGE TEACHERS */}
                {activeTab === 'teachers' && (
                    <div>
                        <div style={{ marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.8rem', color: 'white' }}>Manage Academy Instructors</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Provision and monitor teacher accounts for targeted subject performance tracking.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
                            {/* Create Teacher Form */}
                            <div className="glass-panel" style={{ padding: '32px' }}>
                                <h3 style={{ fontSize: '1.35rem', color: 'white', marginBottom: '24px' }}>
                                    <i className="fas fa-user-plus text-gradient" style={{ marginRight: '8px' }}></i> Create Teacher Account
                                </h3>

                                <form onSubmit={handleCreateTeacher} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label className="input-label">Full Name</label>
                                        <input 
                                            type="text"
                                            className="input-premium"
                                            placeholder="e.g. Dr. Ramesh Kumar"
                                            value={newTeacherName}
                                            onChange={e => setNewTeacherName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="input-label">Username</label>
                                        <input 
                                            type="text"
                                            className="input-premium"
                                            placeholder="e.g. ramesh_physics"
                                            value={newTeacherUsername}
                                            onChange={e => setNewTeacherUsername(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="input-label">Password</label>
                                        <input 
                                            type="password"
                                            className="input-premium"
                                            placeholder="••••••••"
                                            value={newTeacherPassword}
                                            onChange={e => setNewTeacherPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="input-label">Assigned Subject</label>
                                        <select 
                                            className="input-premium"
                                            value={newTeacherSubject}
                                            onChange={e => setNewTeacherSubject(e.target.value)}
                                        >
                                            <option value="Physics">Physics</option>
                                            <option value="Chemistry">Chemistry</option>
                                            <option value="Mathematics">Mathematics</option>
                                            <option value="Biology">Biology</option>
                                        </select>
                                    </div>

                                    <button type="submit" className="btn-primary" style={{ padding: '14px', justifyContent: 'center', marginTop: '8px' }}>
                                        <i className="fas fa-user-check"></i> Provision Account
                                    </button>
                                </form>
                            </div>

                            {/* List of Teachers */}
                            <div className="glass-panel" style={{ padding: '32px' }}>
                                <h3 style={{ fontSize: '1.35rem', color: 'white', marginBottom: '24px' }}>
                                    <i className="fas fa-list-ul text-gradient" style={{ marginRight: '8px' }}></i> Active Instructors
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {users.filter(u => u.role === 'teacher').length === 0 ? (
                                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                                            No teacher accounts provisioned yet.
                                        </div>
                                    ) : (
                                        users.filter(u => u.role === 'teacher').map(t => {
                                            const teacherExams = exams.filter(e => e.subject.toLowerCase() === t.subject.toLowerCase()).length;
                                            const teacherDpqs = dpqs.filter(d => d.subject.toLowerCase() === t.subject.toLowerCase()).length;
                                            const teacherResults = results.filter(r => {
                                                const exam = exams.find(e => e.id === r.examId);
                                                return exam && exam.subject.toLowerCase() === t.subject.toLowerCase();
                                            });
                                            const avgScore = teacherResults.length > 0 
                                                ? (teacherResults.reduce((acc, r) => acc + r.percentage, 0) / teacherResults.length).toFixed(1) 
                                                : 0;
                                            const passRate = teacherResults.length > 0 
                                                ? ((teacherResults.filter(r => r.passed).length / teacherResults.length) * 100).toFixed(1) 
                                                : 0;

                                            return (
                                                <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                                        <div>
                                                            <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: '600' }}>{t.name}</h4>
                                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Username: <code>{t.username}</code></span>
                                                            <span className="badge" style={{ display: 'inline-block', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', padding: '4px 10px', fontSize: '0.75rem' }}>
                                                                <i className="fas fa-book-open"></i> {t.subject}
                                                            </span>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleDeleteUser(t.id, t.name)}
                                                            className="btn-danger"
                                                            style={{ padding: '8px 12px', fontSize: '0.8rem', alignSelf: 'flex-start' }}
                                                        >
                                                            <i className="fas fa-trash-alt"></i> Remove
                                                        </button>
                                                    </div>
                                                    
                                                    {/* Performance Metrics Grid */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600', letterSpacing: '0.5px' }}>Exams Created</div>
                                                            <div style={{ color: '#60a5fa', fontSize: '1.25rem', fontWeight: '700' }}>{teacherExams}</div>
                                                        </div>
                                                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600', letterSpacing: '0.5px' }}>DPPs Created</div>
                                                            <div style={{ color: '#a855f7', fontSize: '1.25rem', fontWeight: '700' }}>{teacherDpqs}</div>
                                                        </div>
                                                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600', letterSpacing: '0.5px' }}>Avg Student Score</div>
                                                            <div style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: '700' }}>{avgScore}%</div>
                                                        </div>
                                                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600', letterSpacing: '0.5px' }}>Student Pass Rate</div>
                                                            <div style={{ color: '#f59e0b', fontSize: '1.25rem', fontWeight: '700' }}>{passRate}%</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 6: MANAGE PYPS */}
                {activeTab === 'manage_pyps' && (
                    <div className="animate-fade-in">
                        <div style={{ marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.8rem', color: 'white' }}>Manage Previous Year Questions</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Upload actual past papers as PDFs for students to access directly within the platform.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px', alignItems: 'start' }}>
                            {/* Create PYP Form */}
                            <div className="glass-panel" style={{ padding: '32px' }}>
                                <h3 style={{ fontSize: '1.35rem', color: 'white', marginBottom: '24px' }}>
                                    <i className="fas fa-cloud-upload-alt text-gradient" style={{ marginRight: '8px' }}></i> Upload New Paper
                                </h3>

                                <form onSubmit={handleCreatePypSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label className="input-label">Select Exam</label>
                                        <select 
                                            className="input-premium"
                                            value={newPypExam}
                                            onChange={e => setNewPypExam(e.target.value)}
                                        >
                                            <option value="JEE Main">JEE Main</option>
                                            <option value="JEE Advanced">JEE Advanced</option>
                                            <option value="NEET">NEET</option>
                                            <option value="MHT-CET">MHT-CET</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="input-label">Year of Exam</label>
                                        <input 
                                            type="number"
                                            className="input-premium"
                                            min="2000" max="2030"
                                            value={newPypYear}
                                            onChange={e => setNewPypYear(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="input-label">Session / Shift Description</label>
                                        <input 
                                            type="text"
                                            className="input-premium"
                                            placeholder="e.g. Session 1 (Jan) Shift 1"
                                            value={newPypSession}
                                            onChange={e => setNewPypSession(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="input-label">Subject Group</label>
                                        <input 
                                            type="text"
                                            className="input-premium"
                                            placeholder="e.g. PCM"
                                            value={newPypSubject}
                                            onChange={e => setNewPypSubject(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="input-label">Upload Question Paper PDF</label>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <label className="btn-secondary" style={{ padding: '12px 20px', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                                                {isPypUploading ? (
                                                    <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                                                ) : (
                                                    <><i className="fas fa-file-pdf"></i> Browse File</>
                                                )}
                                                <input type="file" style={{ display: 'none' }} accept=".pdf" onChange={handlePypFileUpload} disabled={isPypUploading} />
                                            </label>
                                        </div>
                                        {newPypFileUrl && (
                                            <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                                <i className="fas fa-check-circle"></i> File uploaded and ready to save.
                                            </div>
                                        )}
                                    </div>

                                    <button type="submit" className="btn-primary" disabled={isPypUploading || !newPypFileUrl} style={{ padding: '14px', justifyContent: 'center', marginTop: '8px', opacity: (isPypUploading || !newPypFileUrl) ? 0.6 : 1 }}>
                                        <i className="fas fa-save"></i> Publish Paper
                                    </button>
                                </form>
                            </div>

                            {/* List of PYPs */}
                            <div className="glass-panel" style={{ padding: '32px' }}>
                                <h3 style={{ fontSize: '1.35rem', color: 'white', marginBottom: '24px' }}>
                                    <i className="fas fa-archive text-gradient" style={{ marginRight: '8px' }}></i> Uploaded Papers ({pyps.length})
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
                                    {pyps.length === 0 ? (
                                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                                            No papers uploaded yet.
                                        </div>
                                    ) : (
                                        pyps.map(pyp => (
                                            <div key={pyp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(0,0,0,0.2)', border: `1px solid ${pyp.color}40`, borderLeft: `4px solid ${pyp.color}`, borderRadius: '12px' }}>
                                                <div>
                                                    <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: '600' }}>
                                                        {pyp.exam} {pyp.year}
                                                    </h4>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>{pyp.session} • {pyp.subject}</span>
                                                    <a href={pyp.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.8rem', color: '#60a5fa', textDecoration: 'none' }}>
                                                        <i className="fas fa-external-link-alt"></i> View File
                                                    </a>
                                                </div>

                                                <button 
                                                    onClick={() => handleDeletePyp(pyp.id)}
                                                    className="btn-danger"
                                                    style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 7: SITE SETTINGS */}
                {activeTab === 'settings' && (
                    <div className="animate-fade-in">
                        <div style={{ marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.8rem', color: 'white' }}>Site Settings</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Update institute branding and home page showcases.</p>
                        </div>

                        <div className="glass-panel" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
                            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <label className="input-label">Institute Name</label>
                                    <input 
                                        type="text"
                                        className="input-premium"
                                        value={settings.instituteName}
                                        onChange={e => setSettings({...settings, instituteName: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Contact Numbers (Footer)</label>
                                    <input 
                                        type="text"
                                        className="input-premium"
                                        placeholder="e.g. 9730411900, 9730811900"
                                        value={settings.contactNumbers}
                                        onChange={e => setSettings({...settings, contactNumbers: e.target.value})}
                                    />
                                </div>
                                
                                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '24px', marginTop: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h3 style={{ color: 'white', margin: 0 }}>Top Achievers</h3>
                                        <button 
                                            type="button" 
                                            className="btn-secondary" 
                                            onClick={() => setSettings({
                                                ...settings, 
                                                topAchievers: [...(settings.topAchievers||[]), { name: '', rank: '', description: '' }]
                                            })}
                                            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                                        >
                                            <i className="fas fa-plus"></i> Add Achiever
                                        </button>
                                    </div>
                                    
                                    {(settings.topAchievers || []).map((achiever, idx) => (
                                        <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', position: 'relative' }}>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    const copy = [...settings.topAchievers];
                                                    copy.splice(idx, 1);
                                                    setSettings({...settings, topAchievers: copy});
                                                }}
                                                style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }}
                                            >
                                                <i className="fas fa-times-circle"></i>
                                            </button>
                                            <div style={{ flex: '1 1 200px' }}>
                                                <label className="input-label" style={{ fontSize: '0.8rem' }}>Name</label>
                                                <input 
                                                    type="text" 
                                                    className="input-premium" 
                                                    style={{ padding: '10px' }}
                                                    value={achiever.name}
                                                    onChange={e => {
                                                        const copy = [...settings.topAchievers];
                                                        copy[idx].name = e.target.value;
                                                        setSettings({...settings, topAchievers: copy});
                                                    }}
                                                    placeholder="Student Name"
                                                />
                                            </div>
                                            <div style={{ flex: '1 1 200px' }}>
                                                <label className="input-label" style={{ fontSize: '0.8rem' }}>Rank / Score</label>
                                                <input 
                                                    type="text" 
                                                    className="input-premium" 
                                                    style={{ padding: '10px' }}
                                                    value={achiever.rank}
                                                    onChange={e => {
                                                        const copy = [...settings.topAchievers];
                                                        copy[idx].rank = e.target.value;
                                                        setSettings({...settings, topAchievers: copy});
                                                    }}
                                                    placeholder="e.g. AIR 150 - JEE Advanced"
                                                />
                                            </div>
                                            <div style={{ flex: '1 1 100%' }}>
                                                <label className="input-label" style={{ fontSize: '0.8rem' }}>Description / Quote</label>
                                                <input 
                                                    type="text" 
                                                    className="input-premium" 
                                                    style={{ padding: '10px' }}
                                                    value={achiever.description}
                                                    onChange={e => {
                                                        const copy = [...settings.topAchievers];
                                                        copy[idx].description = e.target.value;
                                                        setSettings({...settings, topAchievers: copy});
                                                    }}
                                                    placeholder="Short quote or achievement detail"
                                                />
                                            </div>
                                            <div style={{ flex: '1 1 100%' }}>
                                                <label className="input-label" style={{ fontSize: '0.8rem' }}>Achiever Image</label>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <label className="btn-secondary" style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                        <i className="fas fa-camera"></i> Upload Image
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            style={{ display: 'none' }} 
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (!file) return;
                                                                const reader = new FileReader();
                                                                reader.readAsDataURL(file);
                                                                reader.onload = async () => {
                                                                    try {
                                                                        const response = await fetch('/api/upload', {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ filename: file.name, data: reader.result })
                                                                        });
                                                                        const resData = await response.json();
                                                                        const copy = [...settings.topAchievers];
                                                                        copy[idx].imageUrl = resData.url;
                                                                        setSettings({...settings, topAchievers: copy});
                                                                    } catch (err) {
                                                                        alert('Failed to upload image.');
                                                                    }
                                                                };
                                                            }} 
                                                        />
                                                    </label>
                                                    {achiever.imageUrl && (
                                                        <img src={achiever.imageUrl} alt="preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3b82f6' }} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!settings.topAchievers || settings.topAchievers.length === 0) && (
                                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>No achievers added yet.</div>
                                    )}
                                </div>

                                <button type="submit" className="btn-primary" style={{ padding: '16px', justifyContent: 'center', marginTop: '16px' }}>
                                    <i className="fas fa-save"></i> Save Settings
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                {/* TAB 8: MESSAGE MONITOR */}
                {activeTab === 'messages' && (
                    <div className="animate-fade-in">
                        <div style={{ marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.8rem', color: 'white' }}>System-Wide Message Monitor</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Monitor all active student-teacher doubt communications. Messages auto-delete after 7 days.</p>
                        </div>
                        <div className="glass-panel" style={{ padding: '24px' }}>
                            {messages.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No messages have been sent yet.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {messages.map(msg => (
                                        <div key={msg.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{msg.senderName} ({msg.senderRole}) <i className="fas fa-arrow-right mx-2"></i> {msg.receiverName} ({msg.receiverRole})</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(msg.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p style={{ color: 'white', margin: '0 0 12px 0' }}>{msg.text}</p>
                                            {msg.fileUrl && (
                                                <div>
                                                    <a href={msg.fileUrl} target="_blank" className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.85rem', display: 'inline-block' }}>
                                                        <i className="fas fa-paperclip"></i> View Attached {msg.fileType === 'image' ? 'Image' : 'Document'}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
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
                    <i className="fas fa-home"></i>
                    <span>Overview</span>
                </button>
                <button 
                    onClick={() => setActiveTab('create_exam')}
                    className={`mobile-bottom-nav-item ${activeTab === 'create_exam' ? 'active' : ''}`}
                >
                    <i className="fas fa-edit"></i>
                    <span>Exams</span>
                </button>
                <button 
                    onClick={() => setActiveTab('create_dpq')}
                    className={`mobile-bottom-nav-item ${activeTab === 'create_dpq' ? 'active' : ''}`}
                >
                    <i className="fas fa-plus-circle"></i>
                    <span>DPPs</span>
                </button>
                <button 
                    onClick={() => setActiveTab('results')}
                    className={`mobile-bottom-nav-item ${activeTab === 'results' ? 'active' : ''}`}
                >
                    <i className="fas fa-poll"></i>
                    <span>Results</span>
                </button>
                <button 
                    onClick={() => setActiveTab('students')}
                    className={`mobile-bottom-nav-item ${(activeTab === 'students' || activeTab === 'teachers' || activeTab === 'settings' || activeTab === 'messages' || activeTab === 'manage_pyps') ? 'active' : ''}`}
                >
                    <i className="fas fa-users-cog"></i>
                    <span>Control</span>
                </button>
            </div>
        </div>
    );
}
