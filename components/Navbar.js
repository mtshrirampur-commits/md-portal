function Navbar({ currentUser, onNavigate, currentPage, onLogout, onOpenLogin, instituteName }) {
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

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
            <div className="navbar-inner" style={{
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

                {/* Navigation Links - Hidden on Mobile */}
                <nav className="hide-on-mobile" style={{
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

                {/* User Section / Login - Hidden on Mobile */}
                <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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

                {/* Mobile Avatar / Login Trigger - Visible only on Mobile */}
                <div className="mobile-trigger-container" style={{ display: 'none' }}>
                    {currentUser ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div 
                                onClick={() => setIsDrawerOpen(true)}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: currentUser.role === 'admin' ? 'var(--primary-gradient)' : 'var(--secondary-gradient)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '700',
                                    color: 'white',
                                    fontSize: '0.95rem',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {currentUser.name.charAt(0)}
                            </div>
                            <button 
                                onClick={onLogout}
                                className="btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '0.75rem', minHeight: '32px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={onOpenLogin}
                            className="btn-primary"
                            style={{ padding: '8px 14px', fontSize: '0.85rem', minHeight: '36px' }}
                        >
                            <i className="fas fa-user-lock"></i> Login
                        </button>
                    )}
                </div>
            </div>

            {/* Slide-out Mobile Side-Drawer Menu */}
            <div 
                className={`mobile-drawer-overlay ${isDrawerOpen ? 'open' : ''}`}
                onClick={() => setIsDrawerOpen(false)}
            />
            <div className={`mobile-drawer-content ${isDrawerOpen ? 'open' : ''}`}>
                <button 
                    className="mobile-drawer-close"
                    onClick={() => setIsDrawerOpen(false)}
                >
                    <i className="fas fa-times"></i>
                </button>

                {currentUser && (
                    <div className="mobile-drawer-profile">
                        <div className="mobile-drawer-avatar" style={{ background: currentUser.role === 'admin' ? 'var(--primary-gradient)' : 'var(--secondary-gradient)' }}>
                            {currentUser.name.charAt(0)}
                        </div>
                        <h3 className="mobile-drawer-name">{currentUser.name}</h3>
                        <span className="mobile-drawer-role" style={{ color: currentUser.role === 'admin' ? '#a855f7' : '#3b82f6' }}>
                            {currentUser.role}
                        </span>
                        {currentUser.batch && (
                            <div className="mobile-drawer-batch">
                                <i className="fas fa-users" style={{ marginRight: '6px' }}></i>
                                {currentUser.batch}
                            </div>
                        )}
                        {currentUser.subject && (
                            <div className="mobile-drawer-batch">
                                <i className="fas fa-book-open" style={{ marginRight: '6px' }}></i>
                                {currentUser.subject}
                            </div>
                        )}
                    </div>
                )}

                <nav className="mobile-drawer-nav">
                    <button 
                        onClick={() => { onNavigate('home'); setIsDrawerOpen(false); }}
                        className={`mobile-drawer-link ${currentPage === 'home' ? 'active' : ''}`}
                    >
                        <i className="fas fa-home"></i> Home
                    </button>

                    {currentUser && currentUser.role === 'student' && (
                        <button 
                            onClick={() => { onNavigate('dashboard'); setIsDrawerOpen(false); }}
                            className={`mobile-drawer-link ${currentPage === 'dashboard' ? 'active' : ''}`}
                        >
                            <i className="fas fa-chart-line"></i> My Dashboard
                        </button>
                    )}

                    {currentUser && currentUser.role === 'teacher' && (
                        <button 
                            onClick={() => { onNavigate('teacher'); setIsDrawerOpen(false); }}
                            className={`mobile-drawer-link ${currentPage === 'teacher' ? 'active' : ''}`}
                        >
                            <i className="fas fa-chalkboard-teacher"></i> Teacher Portal
                        </button>
                    )}

                    {currentUser && currentUser.role === 'admin' && (
                        <button 
                            onClick={() => { onNavigate('admin'); setIsDrawerOpen(false); }}
                            className={`mobile-drawer-link ${currentPage === 'admin' ? 'active' : ''}`}
                        >
                            <i className="fas fa-shield-alt"></i> Admin Center
                        </button>
                    )}

                    {currentUser && (
                        <button 
                            onClick={() => { onLogout(); setIsDrawerOpen(false); }}
                            className="mobile-drawer-link"
                            style={{ marginTop: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                        >
                            <i className="fas fa-sign-out-alt"></i> Logout
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
}
