const INITIAL_USERS = [
    { id: 1, username: 'admin', password: 'password123', role: 'admin', name: 'Coaching Director' },
    { id: 2, username: 'student', password: 'student123', role: 'student', name: 'Rajesh Kumar', batch: 'JEE Advanced 2026' },
    { id: 3, username: 'priya', password: 'priya123', role: 'student', name: 'Priya Sharma', batch: 'NEET Aspirants 2026' },
    { id: 4, username: 'physics_teacher', password: 'physics123', role: 'teacher', name: 'Dr. H.C. Verma', subject: 'Physics' },
    { id: 5, username: 'chemistry_teacher', password: 'chemistry123', role: 'teacher', name: 'Dr. O.P. Tandon', subject: 'Chemistry' },
    { id: 6, username: 'math_teacher', password: 'math123', role: 'teacher', name: 'Prof. S.L. Loney', subject: 'Mathematics' },
    { id: 7, username: 'biology_teacher', password: 'biology123', role: 'teacher', name: 'Dr. Trueman', subject: 'Biology' },
    { id: 8, username: 'student8', password: 'student123', role: 'student', name: 'Arjun Verma', batch: 'Class 8' },
    { id: 9, username: 'student9', password: 'student123', role: 'student', name: 'Riya Singh', batch: 'Class 9' },
    { id: 10, username: 'student10', password: 'student123', role: 'student', name: 'Karan Patel', batch: 'Class 10' },
    { id: 11, username: 'mhtcet', password: 'student123', role: 'student', name: 'Aditya Deshmukh', batch: 'MHT-CET 2026' }
];

const INITIAL_PYPS = [];

const INITIAL_EXAMS = [
    {
        id: 'exam-thermo-shm',
        title: 'Physics Mock Test - Thermodynamics & SHM',
        subject: 'Physics',
        assignedBatch: 'JEE Advanced 2026',
        durationMinutes: 10,
        totalMarks: 40,
        passingMarks: 20,
        description: 'Comprehensive evaluation of Thermodynamics Laws and Simple Harmonic Motion fundamentals.',
        questions: [
            {
                id: 'q_thermo_1',
                questionText: 'Which of the following laws of thermodynamics defines the concept of temperature?',
                options: ['Zeroth Law', 'First Law', 'Second Law', 'Third Law'],
                correctOption: 0,
                marks: 10,
                topic: 'Thermodynamics',
                solutionExplanation: 'The Zeroth Law of Thermodynamics establishes the concept of temperature. It states that if two systems are each in thermal equilibrium with a third system, they are in thermal equilibrium with each other.'
            },
            {
                id: 'q_thermo_2',
                questionText: 'In an adiabatic process, the relation between pressure P and volume V is PV^γ = constant. The work done during adiabatic expansion is:',
                options: ['(P1V1 - P2V2) / (γ - 1)', '(P2V2 - P1V1) / (γ - 1)', 'P(V2 - V1)', 'nRT ln(V2/V1)'],
                correctOption: 0,
                marks: 10,
                topic: 'Thermodynamics',
                solutionExplanation: 'For an adiabatic process, work done W = ∫ P dV = (P1V1 - P2V2) / (γ - 1).'
            },
            {
                id: 'q_shm_1',
                questionText: 'For a particle executing simple harmonic motion (SHM), the relation between acceleration \'a\' and displacement \'x\' from mean position is:',
                options: ['a = -ω²x', 'a = -ωx', 'a = ω²x²', 'a = -ω²x²'],
                correctOption: 0,
                marks: 10,
                topic: 'Simple Harmonic Motion',
                solutionExplanation: 'In simple harmonic motion, the restoring force is proportional to displacement, so F = -kx => ma = -kx => a = -(k/m)x = -ω²x.'
            },
            {
                id: 'q_shm_2',
                questionText: 'The time period of a simple pendulum of length L at a place with gravitational acceleration g is given by:',
                options: ['2π √(L/g)', '2π √(g/L)', '1/(2π) √(L/g)', '2π (L/g)'],
                correctOption: 0,
                marks: 10,
                topic: 'Simple Harmonic Motion',
                solutionExplanation: 'The time period of a simple pendulum is T = 2π √(L/g).'
            }
        ]
    },
    {
        id: 'exam-1',
        title: 'Physics Full Mock Test - Electromagnetism',
        subject: 'Physics',
        assignedBatch: 'JEE Advanced 2026',
        durationMinutes: 5,
        totalMarks: 30,
        passingMarks: 15,
        description: 'Comprehensive test covering Gauss Law, Ampere Law, and Faraday Induction.',
        questions: [
            {
                id: 'q1',
                questionText: 'The magnetic field inside a long straight solenoid carrying current is:',
                options: ['Zero', 'Decreases as we move towards its end', 'Increases as we move towards its end', 'Uniform across all points inside'],
                correctOption: 3,
                marks: 10,
                topic: 'Electromagnetics',
                solutionExplanation: 'The magnetic field inside a long solenoid carrying current is uniform and constant. According to Ampere\'s Circuital Law, the field is given by B = μ₀nI, where n is the number of turns per unit length and I is the current. This field is approximately uniform inside the solenoid and parallel to its axis, except near the ends where the field lines diverge.'
            },
            {
                id: 'q2',
                questionText: 'According to Faraday\'s law of electromagnetic induction, an induced EMF is generated by:',
                options: ['Constant magnetic field', 'Changing magnetic flux', 'Static electric charge', 'Gravitational waves'],
                correctOption: 1,
                marks: 10,
                topic: 'Electromagnetic Induction',
                solutionExplanation: 'Faraday\'s Law of Induction states that a changing magnetic flux through a loop of wire induces an electromotive force (EMF) in the wire. Mathematically, EMF = -dΦ_B/dt, indicating that the magnitude of the induced EMF is directly proportional to the time rate of change of the magnetic flux Φ_B.'
            },
            {
                id: 'q3',
                questionText: 'SI unit of Magnetic Flux is:',
                options: ['Tesla', 'Weber', 'Henry', 'Gauss'],
                correctOption: 1,
                marks: 10,
                topic: 'Magnetic Flux',
                solutionExplanation: 'The SI unit of magnetic flux is the Weber (symbol: Wb). It is defined as the amount of flux that, linking a circuit of one turn, would produce in it an electromotive force of one volt if it were reduced to zero at a uniform rate in one second. 1 Weber is equal to 1 Tesla-square-meter (T·m²).'
            }
        ]
    },
    {
        id: 'exam-2',
        title: 'Advanced Mathematics - Calculus & Vectors',
        subject: 'Mathematics',
        assignedBatch: 'JEE Advanced 2026',
        durationMinutes: 10,
        totalMarks: 40,
        passingMarks: 20,
        description: 'Test your rigorous problem-solving skills in Definite Integration and 3D Vector Geometry.',
        questions: [
            {
                id: 'q1',
                questionText: 'What is the derivative of f(x) = x^x with respect to x?',
                options: ['x^x (1 + ln x)', 'x^(x-1)', 'x^x ln x', '1'],
                correctOption: 0,
                marks: 10,
                topic: 'Calculus',
                solutionExplanation: 'To differentiate f(x) = x^x, use logarithmic differentiation. Let y = x^x, then ln(y) = x ln(x). Differentiating both sides with respect to x gives: (1/y)(dy/dx) = ln(x) + x(1/x) = ln(x) + 1. Thus, dy/dx = y(1 + ln(x)) = x^x (1 + ln(x)).'
            },
            {
                id: 'q2',
                questionText: 'If two vectors A and B are perpendicular to each other, their dot product A.B is:',
                options: ['1', '0', '|A||B|', 'Infinite'],
                correctOption: 1,
                marks: 10,
                topic: 'Vector Geometry',
                solutionExplanation: 'The dot product (scalar product) of two vectors A and B is given by A · B = |A||B| cos(θ), where θ is the angle between them. If the vectors are perpendicular, θ = 90° and cos(90°) = 0, which makes the dot product exactly 0.'
            },
            {
                id: 'q3',
                questionText: 'The value of definite integral from 0 to pi/2 of sin(x)/(sin(x)+cos(x)) dx is:',
                options: ['pi/4', 'pi/2', '0', '1'],
                correctOption: 0,
                marks: 10,
                topic: 'Calculus',
                solutionExplanation: 'Let I = ∫[0 to π/2] (sin x / (sin x + cos x)) dx. Using the property ∫[a to b] f(x) dx = ∫[a to b] f(a+b-x) dx, we get I = ∫[0 to π/2] (sin(π/2-x) / (sin(π/2-x) + cos(π/2-x))) dx = ∫[0 to π/2] (cos x / (cos x + sin x)) dx. Adding the two expressions for I gives: 2I = ∫[0 to π/2] ((sin x + cos x) / (sin x + cos x)) dx = ∫[0 to π/2] 1 dx = π/2. Therefore, I = π/4.'
            },
            {
                id: 'q4',
                questionText: 'Which of the following functions is strictly increasing for all real x?',
                options: ['sin(x)', 'x^3 + x', 'x^2', 'e^(-x)'],
                correctOption: 1,
                marks: 10,
                topic: 'Calculus',
                solutionExplanation: 'A function f(x) is strictly increasing if its derivative f\'(x) > 0 for all x. Let\'s find the derivative for f(x) = x³ + x. f\'(x) = 3x² + 1. Since x² is always non-negative, 3x² + 1 >= 1 > 0 for all real x. Thus, x³ + x is strictly increasing. Others are not strictly increasing everywhere: sin(x) oscillates, x² decreases for x<0, and e^(-x) is strictly decreasing.'
            }
        ]
    },
    {
        id: 'exam-3',
        title: 'Organic Reaction Mechanisms & Stereochemistry',
        subject: 'Chemistry',
        assignedBatch: 'JEE Advanced 2026',
        durationMinutes: 5,
        totalMarks: 30,
        passingMarks: 15,
        description: 'Crucial organic chemistry concepts focusing on SN1, SN2 reactions and optical isomerism.',
        questions: [
            {
                id: 'q1',
                questionText: 'SN2 reaction at an asymmetric carbon of a compound always gives:',
                options: ['Retention of configuration', 'Racemic mixture', 'Inversion of configuration', 'No reaction'],
                correctOption: 2,
                marks: 10,
                topic: 'Reaction Mechanisms',
                solutionExplanation: 'An SN2 (Substitution Nucleophilic Bimolecular) reaction involves a backside attack by the nucleophile on the carbon atom holding the leaving group. This backside attack leads to a complete inversion of stereochemical configuration at the asymmetric carbon (commonly known as Walden Inversion).'
            },
            {
                id: 'q2',
                questionText: 'Which of the following carbocations is the most stable?',
                options: ['Methyl carbocation', 'Primary carbocation', 'Secondary carbocation', 'Tertiary (3°) benzyl carbocation'],
                correctOption: 3,
                marks: 10,
                topic: 'Organic Concepts',
                solutionExplanation: 'The stability of carbocations increases in the order: Methyl < Primary < Secondary < Tertiary. Furthermore, resonance structures stabilize a carbocation. A tertiary (3°) benzyl carbocation has both the positive charge on a tertiary carbon (3° alkyl stabilization) and is adjacent to a benzene ring, allowing the positive charge to be delocalized extensively throughout the π-system of the aromatic ring, making it extremely stable.'
            },
            {
                id: 'q3',
                questionText: 'Molecules that are non-superimposable mirror images of each other are called:',
                options: ['Diastereomers', 'Enantiomers', 'Mesomers', 'Tautomers'],
                correctOption: 1,
                marks: 10,
                topic: 'Stereochemistry',
                solutionExplanation: 'Enantiomers are stereoisomers that are non-superimposable mirror images of one another. They possess identical physical properties (like boiling point, melting point, density) in an achiral environment, but differ in the direction in which they rotate plane-polarized light and in their interactions with other chiral molecules.'
            }
        ]
    },
    {
        id: 'exam-4',
        title: 'Class 10 Physics - Light Reflection & Refraction',
        subject: 'Physics',
        assignedBatch: 'Class 10',
        durationMinutes: 5,
        totalMarks: 20,
        passingMarks: 10,
        description: 'Mock test for Class 10 board preparation.',
        questions: [
            {
                id: 'q1',
                questionText: 'The focal length of a plane mirror is:',
                options: ['Zero', 'Negative', 'Positive', 'Infinity'],
                correctOption: 3,
                marks: 10,
                topic: 'Optics',
                solutionExplanation: 'The focal length of a plane mirror is infinity as parallel rays of light reflecting off a plane mirror do not actually converge at any point.'
            },
            {
                id: 'q2',
                questionText: 'Which mirror is used as a rear-view mirror in vehicles?',
                options: ['Concave', 'Convex', 'Plane', 'Cylindrical'],
                correctOption: 1,
                marks: 10,
                topic: 'Optics',
                solutionExplanation: 'Convex mirrors are used in vehicles because they always form an erect, virtual, and diminished image, providing a wider field of view.'
            }
        ]
    }
];

const INITIAL_RESULTS = [
    {
        id: 'res-thermo-shm-priya',
        studentId: 3,
        studentName: 'Priya Sharma',
        examId: 'exam-thermo-shm',
        examTitle: 'Physics Mock Test - Thermodynamics & SHM',
        score: 40,
        totalMarks: 40,
        percentage: 100,
        passed: true,
        date: new Date(Date.now() - 86400000).toLocaleDateString(),
        answers: [0, 0, 0, 0] // Q1 correct, Q2 correct, Q3 correct, Q4 correct
    },
    {
        id: 'res-thermo-shm-rajesh',
        studentId: 2,
        studentName: 'Rajesh Kumar',
        examId: 'exam-thermo-shm',
        examTitle: 'Physics Mock Test - Thermodynamics & SHM',
        score: 20,
        totalMarks: 40,
        percentage: 50,
        passed: true,
        date: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
        answers: [0, 0, 1, 1] // Q1 correct, Q2 correct, Q3 incorrect, Q4 incorrect (good at thermo, poor at SHM)
    },
    {
        id: 'res-thermo-shm-aditya',
        studentId: 11,
        studentName: 'Aditya Deshmukh',
        examId: 'exam-thermo-shm',
        examTitle: 'Physics Mock Test - Thermodynamics & SHM',
        score: 10,
        totalMarks: 40,
        percentage: 25,
        passed: false,
        date: new Date(Date.now() - 86400000 * 3).toLocaleDateString(),
        answers: [1, 2, 0, 3] // Q1 incorrect, Q2 incorrect, Q3 correct, Q4 incorrect (poor at thermo, decent at SHM)
    },
    {
        id: 'res-1',
        studentId: 2,
        studentName: 'Rajesh Kumar',
        examId: 'exam-1',
        examTitle: 'Physics Full Mock Test - Electromagnetism',
        score: 20,
        totalMarks: 30,
        percentage: 66.67,
        passed: true,
        date: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
        answers: [3, 1, 0] // Q1 correct, Q2 correct, Q3 incorrect
    },
    {
        id: 'res-2',
        studentId: 3,
        studentName: 'Priya Sharma',
        examId: 'exam-1',
        examTitle: 'Physics Full Mock Test - Electromagnetism',
        score: 30,
        totalMarks: 30,
        percentage: 100,
        passed: true,
        date: new Date(Date.now() - 86400000).toLocaleDateString(),
        answers: [3, 1, 1]
    }
];

const INITIAL_DPQS = [
    {
        id: 'dpq-1',
        questionText: 'A particle moves along a straight line such that its displacement at any time t is given by s = t^3 - 6t^2 + 3t + 4 meters. The velocity when the acceleration is zero is:',
        subject: 'Physics',
        options: ['3 m/s', '-9 m/s', '-12 m/s', '42 m/s'],
        correctOption: 1,
        date: new Date().toLocaleDateString(),
        homeworkForBatch: 'JEE Advanced 2026',
        solutionExplanation: 'Displacement s = t^3 - 6t^2 + 3t + 4. Velocity v = ds/dt = 3t^2 - 12t + 3. Acceleration a = dv/dt = 6t - 12. Acceleration is zero when 6t - 12 = 0 => t = 2s. Velocity at t=2 is v = 3(2)^2 - 12(2) + 3 = 12 - 24 + 3 = -9 m/s.'
    },
    {
        id: 'dpq-2',
        questionText: 'If log_10(x^2 - 6x + 45) = 2, then the values of x are:',
        subject: 'Mathematics',
        options: ['10, -5', '11, -5', '9, -3', 'none of these'],
        correctOption: 1,
        date: new Date().toLocaleDateString(),
        homeworkForBatch: 'JEE Advanced 2026',
        solutionExplanation: 'log_10(x^2 - 6x + 45) = 2 => x^2 - 6x + 45 = 10^2 = 100 => x^2 - 6x - 55 = 0 => (x - 11)(x + 5) = 0 => x = 11 or x = -5.'
    },
    {
        id: 'dpq-3',
        questionText: 'A car travels 100 km in 2 hours. What is its average speed?',
        subject: 'Physics',
        options: ['40 km/h', '50 km/h', '60 km/h', '100 km/h'],
        correctOption: 1,
        date: new Date().toLocaleDateString(),
        homeworkForBatch: 'Class 8',
        solutionExplanation: 'Speed = Distance / Time = 100 / 2 = 50 km/h.'
    }
];

const INITIAL_DPQ_ATTEMPTS = [];

// Helper functions for LocalStorage management (deprecated in favor of REST APIs, kept as temporary offline fallbacks)
const getStorage = (key, initialValue) => {
    const data = localStorage.getItem(key);
    if (!data) {
        localStorage.setItem(key, JSON.stringify(initialValue));
        return initialValue;
    }
    try {
        return JSON.parse(data);
    } catch (e) {
        return initialValue;
    }
};

const saveStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// Modern Async REST API Service
const API_BASE = '/api';

const api = {
    async getUsers() {
        try {
            const response = await fetch(`${API_BASE}/users`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch users, falling back to local store:', error);
            return getStorage('apex_users', INITIAL_USERS);
        }
    },
    async createUser(user) {
        try {
            const response = await fetch(`${API_BASE}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const newUser = await response.json();
            const users = getStorage('apex_users', INITIAL_USERS);
            saveStorage('apex_users', [...users, newUser]);
            return newUser;
        } catch (error) {
            console.warn('Failed to save user to backend, saving to local store:', error);
            const users = getStorage('apex_users', INITIAL_USERS);
            const newUser = { ...user, id: user.id || Date.now() };
            saveStorage('apex_users', [...users, newUser]);
            return newUser;
        }
    },
    async updateUser(id, updates) {
        try {
            const response = await fetch(`${API_BASE}/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const updatedUser = await response.json();
            const users = getStorage('apex_users', INITIAL_USERS);
            saveStorage('apex_users', users.map(u => u.id === id ? { ...u, ...updates } : u));
            return updatedUser;
        } catch (error) {
            console.warn('Failed to update user on backend, updating local store:', error);
            const users = getStorage('apex_users', INITIAL_USERS);
            saveStorage('apex_users', users.map(u => u.id === id ? { ...u, ...updates } : u));
            return { id, ...updates };
        }
    },
    async deleteUser(id) {
        try {
            const response = await fetch(`${API_BASE}/users/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const deleted = await response.json();
            const users = getStorage('apex_users', INITIAL_USERS);
            saveStorage('apex_users', users.filter(u => u.id !== id));
            return deleted;
        } catch (error) {
            console.warn('Failed to delete user from backend, deleting from local store:', error);
            const users = getStorage('apex_users', INITIAL_USERS);
            const filtered = users.filter(u => u.id !== id);
            saveStorage('apex_users', filtered);
            return { id };
        }
    },
    async getExams() {
        try {
            const response = await fetch(`${API_BASE}/exams`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch exams, falling back to local store:', error);
            return getStorage('apex_exams', INITIAL_EXAMS);
        }
    },
    async createExam(exam) {
        try {
            const response = await fetch(`${API_BASE}/exams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(exam)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const newExam = await response.json();
            // Sync local storage as fallback
            const exams = getStorage('apex_exams', INITIAL_EXAMS);
            saveStorage('apex_exams', [newExam, ...exams]);
            return newExam;
        } catch (error) {
            console.warn('Failed to save exam to backend, saving to local store:', error);
            const exams = getStorage('apex_exams', INITIAL_EXAMS);
            const newExam = { ...exam, id: exam.id || 'exam-' + Date.now() };
            saveStorage('apex_exams', [newExam, ...exams]);
            return newExam;
        }
    },
    async deleteExam(id) {
        try {
            const response = await fetch(`${API_BASE}/exams/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const deleted = await response.json();
            const exams = getStorage('apex_exams', INITIAL_EXAMS);
            saveStorage('apex_exams', exams.filter(e => e.id !== id));
            return deleted;
        } catch (error) {
            console.warn('Failed to delete exam from backend, deleting from local store:', error);
            const exams = getStorage('apex_exams', INITIAL_EXAMS);
            const filtered = exams.filter(e => e.id !== id);
            saveStorage('apex_exams', filtered);
            return { id };
        }
    },
    async getResults() {
        try {
            const response = await fetch(`${API_BASE}/results`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch results, falling back to local store:', error);
            return getStorage('apex_results', INITIAL_RESULTS);
        }
    },
    async submitResult(result) {
        try {
            const response = await fetch(`${API_BASE}/results`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const newResult = await response.json();
            const results = getStorage('apex_results', INITIAL_RESULTS);
            saveStorage('apex_results', [newResult, ...results]);
            return newResult;
        } catch (error) {
            console.warn('Failed to submit result to backend, saving to local store:', error);
            const results = getStorage('apex_results', INITIAL_RESULTS);
            const newResult = { ...result, id: result.id || 'res-' + Date.now() };
            saveStorage('apex_results', [newResult, ...results]);
            return newResult;
        }
    },
    async getDpqs() {
        try {
            const response = await fetch(`${API_BASE}/dpqs`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch dpqs, falling back to local store:', error);
            return getStorage('apex_dpqs', INITIAL_DPQS);
        }
    },
    async createDpq(dpq) {
        try {
            const response = await fetch(`${API_BASE}/dpqs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dpq)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const newDpq = await response.json();
            const dpqs = getStorage('apex_dpqs', INITIAL_DPQS);
            saveStorage('apex_dpqs', [newDpq, ...dpqs]);
            return newDpq;
        } catch (error) {
            console.warn('Failed to save dpq to backend, saving to local store:', error);
            const dpqs = getStorage('apex_dpqs', INITIAL_DPQS);
            const newDpq = { ...dpq, id: dpq.id || 'dpq-' + Date.now() };
            saveStorage('apex_dpqs', [newDpq, ...dpqs]);
            return newDpq;
        }
    },
    async deleteDpq(id) {
        try {
            const response = await fetch(`${API_BASE}/dpqs/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const deleted = await response.json();
            const dpqs = getStorage('apex_dpqs', INITIAL_DPQS);
            saveStorage('apex_dpqs', dpqs.filter(d => d.id !== id));
            return deleted;
        } catch (error) {
            console.warn('Failed to delete dpq from backend, deleting from local store:', error);
            const dpqs = getStorage('apex_dpqs', INITIAL_DPQS);
            const filtered = dpqs.filter(d => d.id !== id);
            saveStorage('apex_dpqs', filtered);
            return { id };
        }
    },
    async getDpqAttempts() {
        try {
            const response = await fetch(`${API_BASE}/dpq_attempts`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch dpq attempts, falling back to local store:', error);
            return getStorage('apex_dpq_attempts', INITIAL_DPQ_ATTEMPTS);
        }
    },
    async submitDpqAttempt(attempt) {
        try {
            const response = await fetch(`${API_BASE}/dpq_attempts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(attempt)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const newAttempt = await response.json();
            const attempts = getStorage('apex_dpq_attempts', INITIAL_DPQ_ATTEMPTS);
            saveStorage('apex_dpq_attempts', [newAttempt, ...attempts]);
            return newAttempt;
        } catch (error) {
            console.warn('Failed to submit dpq attempt to backend, saving to local store:', error);
            const attempts = getStorage('apex_dpq_attempts', INITIAL_DPQ_ATTEMPTS);
            const newAttempt = { ...attempt, id: attempt.id || 'dpq-att-' + Date.now() };
            saveStorage('apex_dpq_attempts', [newAttempt, ...attempts]);
            return newAttempt;
        }
    },
    async getPyps() {
        try {
            const response = await fetch(`${API_BASE}/pyps`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch pyps, falling back to local store:', error);
            return getStorage('apex_pyps', INITIAL_PYPS);
        }
    },
    async createPyp(pyp) {
        try {
            const response = await fetch(`${API_BASE}/pyps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pyp)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const newPyp = await response.json();
            const pyps = getStorage('apex_pyps', INITIAL_PYPS);
            saveStorage('apex_pyps', [newPyp, ...pyps]);
            return newPyp;
        } catch (error) {
            console.warn('Failed to save pyp to backend, saving to local store:', error);
            const pyps = getStorage('apex_pyps', INITIAL_PYPS);
            const newPyp = { ...pyp, id: pyp.id || 'pyp-' + Date.now() };
            saveStorage('apex_pyps', [newPyp, ...pyps]);
            return newPyp;
        }
    },
    async deletePyp(id) {
        try {
            const response = await fetch(`${API_BASE}/pyps/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const deleted = await response.json();
            const pyps = getStorage('apex_pyps', INITIAL_PYPS);
            saveStorage('apex_pyps', pyps.filter(p => p.id !== id));
            return deleted;
        } catch (error) {
            console.warn('Failed to delete pyp from backend, deleting from local store:', error);
            const pyps = getStorage('apex_pyps', INITIAL_PYPS);
            const filtered = pyps.filter(p => p.id !== id);
            saveStorage('apex_pyps', filtered);
            return { id };
        }
    },
    async getSettings() {
        try {
            const response = await fetch(`${API_BASE}/settings`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch settings:', error);
            return {
                instituteName: "MAHESH & DHUMAL ACADEMICS",
                contactNumbers: "9730411900, 9730811900",
                topAchievers: []
            };
        }
    },
    async updateSettings(settings) {
        try {
            const response = await fetch(`${API_BASE}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.warn('Failed to update settings:', error);
            return settings;
        }
    },
    async getMessages() {
        try {
            const response = await fetch(`${API_BASE}/messages`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch messages:', error);
            return [];
        }
    },
    async getMessagesForUser(userId) {
        try {
            const response = await fetch(`${API_BASE}/messages/${userId}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch messages for user:', error);
            return [];
        }
    },
    async sendMessage(msg) {
        try {
            const response = await fetch(`${API_BASE}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(msg)
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.warn('Failed to send message:', error);
            return msg;
        }
    },
    async markMessageRead(id) {
        try {
            const response = await fetch(`${API_BASE}/messages/${id}/read`, { method: 'PUT' });
            return await response.json();
        } catch (error) {
            console.warn('Failed to mark message read:', error);
            return { success: false };
        }
    }
};
