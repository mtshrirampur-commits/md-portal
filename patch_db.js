const fs = require('fs');
const dbPath = 'backend/db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. Add students 8, 9, 10
const newUsers = [
    { id: 8, username: 'student8', password: 'student123', role: 'student', name: 'Arjun Verma', batch: 'Class 8' },
    { id: 9, username: 'student9', password: 'student123', role: 'student', name: 'Riya Singh', batch: 'Class 9' },
    { id: 10, username: 'student10', password: 'student123', role: 'student', name: 'Karan Patel', batch: 'Class 10' }
];

for (const nu of newUsers) {
    if (!db.users.find(u => u.username === nu.username)) {
        db.users.push(nu);
    }
}

// 2. Add assignedBatch to existing exams if missing
for (const ex of db.exams) {
    if (!ex.assignedBatch) {
        ex.assignedBatch = 'All Batches';
    }
}

// 3. Add exam-4
const exam4 = {
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
            solutionExplanation: 'The focal length of a plane mirror is infinity as parallel rays of light reflecting off a plane mirror do not actually converge at any point.'
        },
        {
            id: 'q2',
            questionText: 'Which mirror is used as a rear-view mirror in vehicles?',
            options: ['Concave', 'Convex', 'Plane', 'Cylindrical'],
            correctOption: 1,
            marks: 10,
            solutionExplanation: 'Convex mirrors are used in vehicles because they always form an erect, virtual, and diminished image, providing a wider field of view.'
        }
    ]
};

if (!db.exams.find(e => e.id === 'exam-4')) {
    db.exams.push(exam4);
}

// 4. Add dpq-3
const dpq3 = {
    id: 'dpq-3',
    questionText: 'A car travels 100 km in 2 hours. What is its average speed?',
    subject: 'Physics',
    options: ['40 km/h', '50 km/h', '60 km/h', '100 km/h'],
    correctOption: 1,
    date: new Date().toLocaleDateString(),
    homeworkForBatch: 'Class 8',
    solutionExplanation: 'Speed = Distance / Time = 100 / 2 = 50 km/h.'
};

if (!db.dpqs.find(d => d.id === 'dpq-3')) {
    db.dpqs.push(dpq3);
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Successfully patched db.json!');
