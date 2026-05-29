function Navbar({ currentUser, onNavigate, currentPage, onLogout, onOpenLogin, instituteName }) {
    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: 'rgba(11, 15, 25, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-glass)',
            padding: '16px 0'
        }}>
            <div style={{
                maxWidth: '1280px',
                margin: '0 auto',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                {/* Brand Logo */}
                <div 
                    onClick={() => onNavigate('home')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        boxShadow: 'var(--glow-primary)',
                    }}>
                        <img src="logo.png" alt="M&D Academics Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                        <span style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '1.4rem',
                            fontWeight: '800',
                            letterSpacing: '-0.03em',
                            color: 'white'
                        }}>
                            {instituteName || 'M&DTEST.com'}
                        </span>
                        <span style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: '600'
                        }}>
                            Coaching Academy
                        </span>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--surface-glass)',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-glass)'
                }}>
                    <button 
                        onClick={() => onNavigate('home')}
                        style={{
                            background: currentPage === 'home' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                            color: currentPage === 'home' ? 'white' : 'var(--text-muted)',
                            border: 'none',
                            padding: '8px 18px',
                            borderRadius: '12px',
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <i className="fas fa-home" style={{ marginRight: '6px' }}></i> Home
                    </button>

                    {currentUser && currentUser.role === 'student' && (
                        <button 
                            onClick={() => onNavigate('dashboard')}
                            style={{
                                background: currentPage === 'dashboard' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                color: currentPage === 'dashboard' ? 'white' : 'var(--text-muted)',
                                border: 'none',
                                padding: '8px 18px',
                                borderRadius: '12px',
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <i className="fas fa-chart-line" style={{ marginRight: '6px' }}></i> My Dashboard
                        </button>
                    )}

                    {currentUser && currentUser.role === 'teacher' && (
                        <button 
                            onClick={() => onNavigate('teacher')}
                            style={{
                                background: currentPage === 'teacher' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                color: currentPage === 'teacher' ? 'white' : 'var(--text-muted)',
                                border: 'none',
                                padding: '8px 18px',
                                borderRadius: '12px',
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <i className="fas fa-chalkboard-teacher" style={{ marginRight: '6px' }}></i> Teacher Portal
                        </button>
                    )}

                    {currentUser && currentUser.role === 'admin' && (
                        <button 
                            onClick={() => onNavigate('admin')}
                            style={{
                                background: currentPage === 'admin' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                color: currentPage === 'admin' ? 'white' : 'var(--text-muted)',
                                border: 'none',
                                padding: '8px 18px',
                                borderRadius: '12px',
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <i className="fas fa-shield-alt" style={{ marginRight: '6px' }}></i> Admin Center
                        </button>
                    )}
                </nav>

                {/* User Section / Login */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {currentUser ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '50%',
                                    background: currentUser.role === 'admin' ? 'var(--primary-gradient)' : 'var(--secondary-gradient)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '700',
                                    color: 'white',
                                    fontSize: '1rem',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}>
                                    {currentUser.name.charAt(0)}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', fontSize: '0.95rem', lineHeight: '1.2' }}>
                                        {currentUser.name}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                        {currentUser.role}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={onLogout}
                                className="btn-secondary"
                                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                            >
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={onOpenLogin}
                            className="btn-primary"
                            style={{ padding: '10px 24px', fontSize: '0.95rem' }}
                        >
                            <i className="fas fa-user-lock"></i> Portal Login
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
