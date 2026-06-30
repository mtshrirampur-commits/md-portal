function App() {
    const [currentUser, setCurrentUser] = React.useState(() => {
        const saved = sessionStorage.getItem('apex_current_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [currentPage, setCurrentPage] = React.useState('home'); // 'home' | 'dashboard' | 'admin' | 'exam'
    const [activeExam, setActiveExam] = React.useState(null);
    const [showLogin, setShowLogin] = React.useState(false);
    const [reviewResult, setReviewResult] = React.useState(null);
    const [settings, setSettings] = React.useState({
        instituteName: "M&DTEST.com",
        contactNumbers: "",
        topAchievers: [],
        batches: ["Class 8 CBSE", "Class 8 STB", "Class 9 CBSE", "Class 9 STB", "Class 10 CBSE", "Class 10 STB", "11th JEE", "11th NEET", "11th MHT-CET", "12th JEE", "12th NEET", "12th MHT-CET"]
    });

    React.useEffect(() => {
        api.getSettings().then(data => {
            if (data) {
                if (!data.batches) {
                    data.batches = ["Class 8 CBSE", "Class 8 STB", "Class 9 CBSE", "Class 9 STB", "Class 10 CBSE", "Class 10 STB", "11th JEE", "11th NEET", "11th MHT-CET", "12th JEE", "12th NEET", "12th MHT-CET"];
                }
                setSettings(data);
            }
        });
    }, []);

    const handleLogin = (user) => {
        setCurrentUser(user);
        sessionStorage.setItem('apex_current_user', JSON.stringify(user));
        setShowLogin(false);
        if (user.role === 'admin') {
            setCurrentPage('admin');
        } else if (user.role === 'teacher') {
            setCurrentPage('teacher');
        } else {
            setCurrentPage('dashboard');
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        sessionStorage.removeItem('apex_current_user');
        setCurrentPage('home');
        setActiveExam(null);
        setReviewResult(null);
    };

    const handleStartExam = (exam) => {
        setActiveExam(exam);
        setReviewResult(null);
        setCurrentPage('exam');
    };

    const handleStartReview = (exam, result) => {
        setActiveExam(exam);
        setReviewResult(result);
        setCurrentPage('exam');
    };

    const handleFinishExam = () => {
        setActiveExam(null);
        setReviewResult(null);
        setCurrentPage('dashboard');
    };

    const handleNavigate = (page) => {
        if (page === 'dashboard' && (!currentUser || currentUser.role !== 'student')) {
            setShowLogin(true);
            return;
        }
        if (page === 'admin' && (!currentUser || currentUser.role !== 'admin')) {
            setShowLogin(true);
            return;
        }
        if (page === 'teacher' && (!currentUser || currentUser.role !== 'teacher')) {
            setShowLogin(true);
            return;
        }
        setCurrentPage(page);
    };

    return (
        <div>
            <Navbar 
                currentUser={currentUser}
                currentPage={currentPage}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                onOpenLogin={() => setShowLogin(true)}
                instituteName={settings.instituteName}
            />

            <main>
                {currentPage === 'home' && (
                    <div style={{ padding: '60px 0' }}>
                        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
                            {/* Hero Section */}
                            <div style={{ textAlign: 'center', marginBottom: '80px', position: 'relative' }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '-20%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '700px',
                                    height: '400px',
                                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(0,0,0,0) 70%)',
                                    zIndex: 0,
                                    pointerEvents: 'none'
                                }} />

                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid var(--border-glass)', marginBottom: '24px', padding: '8px 24px', fontSize: '0.9rem' }}>
                                        <i className="fas fa-rocket text-gradient" style={{ marginRight: '8px' }}></i> Next-Gen Academic Testing Platform
                                    </span>

                                    <h1 style={{ fontSize: '4.5rem', fontWeight: '800', lineHeight: '1.1', color: 'white', marginBottom: '24px', maxWidth: '900px', margin: '0 auto 24px auto' }}>
                                        Master Your Exams with <span className="text-gradient">Precision Analytics</span>
                                    </h1>

                                    <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
                                        State-of-the-art online exam platform built for rigorous coaching academies. Time-tested MCQ simulations, immediate scoring, and deep performance insights.
                                    </p>

                                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                                        {currentUser ? (
                                            <button 
                                                onClick={() => handleNavigate(currentUser.role === 'admin' ? 'admin' : 'dashboard')}
                                                className="btn-primary"
                                                style={{ padding: '18px 36px', fontSize: '1.1rem' }}
                                            >
                                                <i className="fas fa-tachometer-alt"></i> Go to Your Portal
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => setShowLogin(true)}
                                                className="btn-primary"
                                                style={{ padding: '18px 36px', fontSize: '1.1rem' }}
                                            >
                                                <i className="fas fa-sign-in-alt"></i> Student / Director Login
                                            </button>
                                        )}
                                        <a 
                                            href="#features"
                                            className="btn-secondary"
                                            style={{ padding: '18px 36px', fontSize: '1.1rem' }}
                                        >
                                            <i className="fas fa-star"></i> Explore Features
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Top Achievers Showcase */}
                            {settings.topAchievers && settings.topAchievers.length > 0 && (
                                <div style={{ marginBottom: '80px' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                                        <h2 style={{ fontSize: '2.5rem', color: 'white', marginBottom: '12px' }}>Our Top Achievers</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Celebrating excellence and hard work.</p>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                                        {settings.topAchievers.map((achiever, idx) => (
                                            <div key={idx} className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
                                                {achiever.imageUrl ? (
                                                    <img src={achiever.imageUrl} alt={achiever.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 16px auto', border: '3px solid var(--primary-color)', boxShadow: 'var(--glow-primary)', display: 'block' }} />
                                                ) : (
                                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px auto', boxShadow: 'var(--glow-primary)' }}>
                                                        <i className="fas fa-user-graduate"></i>
                                                    </div>
                                                )}
                                                <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '8px' }}>{achiever.name}</h3>
                                                <div style={{ color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '8px' }}>{achiever.rank}</div>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontStyle: 'italic' }}>"{achiever.description}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Features Grid */}
                            <div id="features" style={{ marginBottom: '80px' }}>
                                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                                    <h2 style={{ fontSize: '2.5rem', color: 'white', marginBottom: '12px' }}>Why {settings.instituteName} Portal?</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Engineered for high-performing educators and competitive candidates.</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                                    <div className="glass-panel glass-panel-hover" style={{ padding: '36px' }}>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: '24px', boxShadow: 'var(--glow-primary)' }}>
                                            <i className="fas fa-stopwatch"></i>
                                        </div>
                                        <h3 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '12px' }}>Timed Exam Simulations</h3>
                                        <p style={{ color: 'var(--text-muted)' }}>Experience exact test pressures with automatic submission triggers and precise remaining time tickers.</p>
                                    </div>

                                    <div className="glass-panel glass-panel-hover" style={{ padding: '36px' }}>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--secondary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: '24px', boxShadow: '0 0 25px rgba(59, 130, 246, 0.4)' }}>
                                            <i className="fas fa-bolt"></i>
                                        </div>
                                        <h3 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '12px' }}>Instant Automated Scoring</h3>
                                        <p style={{ color: 'var(--text-muted)' }}>Zero manual grading delay. Students instantly review correct answer keys, secured marks, and pass/fail statuses.</p>
                                    </div>

                                    <div className="glass-panel glass-panel-hover" style={{ padding: '36px' }}>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: '24px', boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)' }}>
                                            <i className="fas fa-brain"></i>
                                        </div>
                                        <h3 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '12px' }}>Director Authoring Studio</h3>
                                        <p style={{ color: 'var(--text-muted)' }}>Coaching administrators can effortlessly create new tests, define passing benchmarks, and monitor batch test metrics.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Demo Info Box */}
                            <div className="glass-panel" style={{ padding: '48px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '28px' }}>
                                    <div>
                                        <span className="badge" style={{ background: 'var(--primary-gradient)', color: 'white', marginBottom: '12px' }}>
                                            <i className="fas fa-key"></i> Instant Trial Access
                                        </span>
                                        <h2 style={{ fontSize: '2.2rem', color: 'white', marginBottom: '12px' }}>Ready to test the platform right now?</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '650px' }}>
                                            You can instantly test both roles. Click Login and use the <strong>Admin</strong>, <strong>Teacher</strong>, or <strong>Student</strong> auto-fill buttons!
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setShowLogin(true)}
                                        className="btn-primary"
                                        style={{ padding: '18px 36px', fontSize: '1.15rem' }}
                                    >
                                        <i className="fas fa-user-lock"></i> Open Security Portal
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentPage === 'dashboard' && currentUser && currentUser.role === 'student' && (
                    <Dashboard 
                        currentUser={currentUser}
                        onStartExam={handleStartExam}
                        onStartReview={handleStartReview}
                    />
                )}

                {currentPage === 'admin' && currentUser && currentUser.role === 'admin' && (
                    <Admin currentUser={currentUser} onSettingsChange={(s) => setSettings(s)} />
                )}

                {currentPage === 'teacher' && currentUser && currentUser.role === 'teacher' && (
                    <TeacherDashboard currentUser={currentUser} settings={settings} />
                )}

                {currentPage === 'exam' && activeExam && currentUser && (
                    <ExamTaking 
                        exam={activeExam}
                        currentUser={currentUser}
                        onFinish={handleFinishExam}
                        onLogout={handleLogout}
                        retrospectiveResult={reviewResult}
                    />
                )}
            </main>

            {/* Footer */}
            <footer style={{
                borderTop: '1px solid var(--border-glass)',
                padding: '48px 0',
                background: '#0b0f19',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                marginTop: '80px'
            }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.1rem' }}>
                            <i className="fas fa-graduation-cap"></i>
                        </div>
                        <span style={{ fontFamily: 'Outfit', fontWeight: '800', color: 'white', fontSize: '1.2rem' }}>
                            {settings.instituteName} Platform
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span>&copy; {new Date().getFullYear()} {settings.instituteName}. All rights reserved.</span>
                        {settings.contactNumbers && (
                            <span style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                                <i className="fas fa-phone" style={{ marginRight: '8px' }}></i>
                                Contact: {settings.contactNumbers}
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '20px', fontSize: '1.5rem' }}>
                        <a href="https://www.instagram.com/maheshtutorials_shrirampur/" target="_blank" rel="noopener noreferrer" style={{ color: '#E1306C', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                            <i className="fab fa-instagram"></i>
                        </a>
                        <a href="https://www.facebook.com/mahesh.tutorials.2025/" target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                            <i className="fab fa-facebook"></i>
                        </a>
                    </div>
                </div>
            </footer>

            {showLogin && (
                <Login 
                    onLogin={handleLogin}
                    onClose={() => setShowLogin(false)}
                    instituteName={settings.instituteName}
                />
            )}
        </div>
    );
}
