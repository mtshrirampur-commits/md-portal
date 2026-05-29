function Login({ onLogin, onClose, instituteName }) {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const users = await api.getUsers();
            const user = users.find(u => u.username === username.trim() && u.password === password);

            if (user) {
                onLogin(user);
            } else {
                setError('Invalid username or password. Please verify your credentials.');
            }
        } catch (err) {
            setError('Failed to authenticate. Please check connection and try again.');
        }
    };

    const handleQuickFill = (u, p) => {
        setUsername(u);
        setPassword(p);
        setError('');
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in" style={{ padding: '40px' }}>
                <button 
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '24px',
                        right: '24px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: 'var(--text-muted)',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                >
                    <i className="fas fa-times"></i>
                </button>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        background: 'var(--primary-gradient)',
                        margin: '0 auto 16px auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        color: 'white',
                        boxShadow: 'var(--glow-primary)'
                    }}>
                        <i className="fas fa-user-shield"></i>
                    </div>
                    <h2 style={{ fontSize: '1.8rem', color: 'white', marginBottom: '8px' }}>
                        Welcome to <span className="text-gradient">{instituteName || 'M&DTEST.com'}</span>
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Enter your username and password to access your exam portal.
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'var(--danger-bg)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        color: 'var(--danger-color)',
                        marginBottom: '24px',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <i className="fas fa-exclamation-circle" style={{ fontSize: '1.2rem' }}></i>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label className="input-label" htmlFor="username">
                            <i className="fas fa-user" style={{ marginRight: '8px' }}></i> Username
                        </label>
                        <input 
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input-premium"
                            placeholder="Enter username (e.g. admin / student)"
                            required
                        />
                    </div>

                    <div>
                        <label className="input-label" htmlFor="password">
                            <i className="fas fa-lock" style={{ marginRight: '8px' }}></i> Password
                        </label>
                        <input 
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-premium"
                            placeholder="••••••••••••"
                            required
                        />
                    </div>

                    <button 
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '10px' }}
                    >
                        <i className="fas fa-sign-in-alt"></i> Secure Login
                    </button>
                </form>

                {/* Quick Demo Helpers for User Assessment */}
                <div style={{
                    marginTop: '32px',
                    paddingTop: '24px',
                    borderTop: '1px solid var(--border-glass)'
                }}>
                    <span style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '12px',
                        textAlign: 'center'
                    }}>
                        Demo Access Credentials
                    </span>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button 
                            type="button"
                            onClick={() => handleQuickFill('admin', 'password123')}
                            style={{
                                background: 'rgba(99, 102, 241, 0.15)',
                                border: '1px solid rgba(99, 102, 241, 0.4)',
                                color: '#a855f7',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                        >
                            <i className="fas fa-user-cog"></i> Admin Demo
                        </button>

                        <button 
                            type="button"
                            onClick={() => handleQuickFill('student', 'student123')}
                            style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                color: '#10b981',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
                        >
                            <i className="fas fa-user-graduate"></i> JEE/NEET/CET Student
                        </button>

                        <button 
                            type="button"
                            onClick={() => handleQuickFill('student10', 'student123')}
                            style={{
                                background: 'rgba(236, 72, 153, 0.15)',
                                border: '1px solid rgba(236, 72, 153, 0.4)',
                                color: '#f472b6',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(236, 72, 153, 0.25)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(236, 72, 153, 0.15)'}
                        >
                            <i className="fas fa-child"></i> School Student
                        </button>



                        <button 
                            type="button"
                            onClick={() => handleQuickFill('physics_teacher', 'physics123')}
                            style={{
                                background: 'rgba(168, 85, 247, 0.15)',
                                border: '1px solid rgba(168, 85, 247, 0.4)',
                                color: '#c084fc',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.25)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)'}
                        >
                            <i className="fas fa-chalkboard-teacher"></i> Teacher Demo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
