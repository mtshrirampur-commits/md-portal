require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static frontend files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// Mongoose Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mtshrirampur_db_user:wXA9Dw4uXyNBILFU@cluster0.71smihn.mongodb.net/mdportal?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schemas
const userSchema = new mongoose.Schema({ id: String, username: String, password: String, role: String, name: String, batch: String, subject: String }, { strict: false });
const User = mongoose.model('User', userSchema);

const examSchema = new mongoose.Schema({ id: String, title: String, subject: String, durationMinutes: Number, totalMarks: Number, passingMarks: Number, description: String, assignedBatch: String, scheduledDate: String, fileUrl: String, fileType: String, questions: Array }, { strict: false });
const Exam = mongoose.model('Exam', examSchema);

const resultSchema = new mongoose.Schema({ id: String, examId: String, studentId: String, examTitle: String, studentName: String, score: Number, totalMarks: Number, percentage: Number, passed: Boolean, date: String, answers: Object, timeSpent: Array }, { strict: false });
const Result = mongoose.model('Result', resultSchema);

const dpqSchema = new mongoose.Schema({ id: String, questionText: String, subject: String, options: Array, correctOption: Number, date: String, homeworkForBatch: String, solutionExplanation: String, fileUrl: String, fileType: String }, { strict: false });
const Dpq = mongoose.model('Dpq', dpqSchema);

const dpqAttemptSchema = new mongoose.Schema({ id: String, dpqId: String, studentId: String, selectedOption: Number, correct: Boolean, date: String }, { strict: false });
const DpqAttempt = mongoose.model('DpqAttempt', dpqAttemptSchema);

const pypSchema = new mongoose.Schema({ id: String, exam: String, year: Number, session: String, subject: String, icon: String, color: String, badge: String, url: String }, { strict: false });
const Pyp = mongoose.model('Pyp', pypSchema);

const settingSchema = new mongoose.Schema({ key: String, data: Object }, { strict: false });
const Setting = mongoose.model('Setting', settingSchema);

const messageSchema = new mongoose.Schema({
    id: String,
    senderId: String,
    senderName: String,
    senderRole: String,
    receiverId: String,
    receiverName: String,
    receiverRole: String,
    text: String,
    fileUrl: String,
    fileName: String,
    fileType: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: 604800 } // Auto-delete after 7 days
}, { strict: false });
const Message = mongoose.model('Message', messageSchema);

// Data Migration Script from local db.json to MongoDB
async function migrateData() {
    try {
        const usersCount = await User.countDocuments();
        const dbPath = path.join(__dirname, 'db.json');
        
        if (fs.existsSync(dbPath)) {
            const dbContent = fs.readFileSync(dbPath, 'utf8').trim().replace(/^\uFEFF/, '');
            const dbJson = JSON.parse(dbContent);
            
            if (usersCount === 0) {
                console.log('Migrating data from db.json to MongoDB...');
                if (dbJson.users) await User.insertMany(dbJson.users.map(u => ({...u, id: u.id.toString()})));
                if (dbJson.exams) await Exam.insertMany(dbJson.exams);
                if (dbJson.results) await Result.insertMany(dbJson.results);
                if (dbJson.dpqs) await Dpq.insertMany(dbJson.dpqs);
                if (dbJson.dpq_attempts) await DpqAttempt.insertMany(dbJson.dpq_attempts);
                if (dbJson.pyps) await Pyp.insertMany(dbJson.pyps);
                if (dbJson.settings) await Setting.create({ key: 'global', data: dbJson.settings });
                console.log('Migration successful!');
            } else {
                console.log('Database already migrated. Verifying Thermodynamics exam and seed results...');
                // Ensure the thermodynamics exam is present in Atlas
                const existsExam = await Exam.findOne({ id: 'exam-thermo-shm' });
                if (!existsExam) {
                    const thermoExam = dbJson.exams.find(e => e.id === 'exam-thermo-shm');
                    if (thermoExam) {
                        await Exam.create(thermoExam);
                        console.log('Seeded Thermodynamics exam to MongoDB Atlas!');
                    }
                }
                
                // Ensure the seed results are present in Atlas
                const seedResultIds = ['res-thermo-shm-priya', 'res-thermo-shm-rajesh', 'res-thermo-shm-aditya'];
                for (const rId of seedResultIds) {
                    const existsRes = await Result.findOne({ id: rId });
                    if (!existsRes) {
                        const seedRes = dbJson.results.find(r => r.id === rId);
                        if (seedRes) {
                            await Result.create(seedRes);
                            console.log(`Seeded result ${rId} to MongoDB Atlas!`);
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error('Migration error:', err);
    }
}
mongoose.connection.once('open', migrateData);

// API Endpoints
// Users
app.get('/api/users', async (req, res) => res.json(await User.find({})));
app.post('/api/users', async (req, res) => {
    let user = req.body;
    if (!user.id) user.id = 'user-' + Date.now();
    else user.id = user.id.toString();
    await User.create(user);
    res.status(201).json(user);
});
app.put('/api/users/:id', async (req, res) => {
    const updated = await User.findOneAndUpdate(
        { id: req.params.id.toString() }, 
        { $set: req.body }, 
        { new: true }
    );
    res.json(updated);
});
app.delete('/api/users/:id', async (req, res) => {
    await User.findOneAndDelete({ id: req.params.id.toString() });
    res.json({ success: true });
});

// Exams
app.get('/api/exams', async (req, res) => res.json(await Exam.find({}).sort({ _id: -1 })));
app.post('/api/exams', async (req, res) => {
    let exam = req.body;
    if (!exam.id) exam.id = 'exam-' + Date.now();
    await Exam.create(exam);
    res.status(201).json(exam);
});
app.delete('/api/exams/:id', async (req, res) => {
    await Exam.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
});

// Results
app.get('/api/results', async (req, res) => res.json(await Result.find({}).sort({ _id: -1 })));
app.post('/api/results', async (req, res) => {
    let result = req.body;
    if (!result.id) result.id = 'res-' + Date.now();
    await Result.create(result);
    res.status(201).json(result);
});

// DPQs
app.get('/api/dpqs', async (req, res) => res.json(await Dpq.find({}).sort({ _id: -1 })));
app.post('/api/dpqs', async (req, res) => {
    let dpq = req.body;
    if (!dpq.id) dpq.id = 'dpq-' + Date.now();
    await Dpq.create(dpq);
    res.status(201).json(dpq);
});
app.delete('/api/dpqs/:id', async (req, res) => {
    await Dpq.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
});

// DPQ Attempts
app.get('/api/dpq_attempts', async (req, res) => res.json(await DpqAttempt.find({}).sort({ _id: -1 })));
app.post('/api/dpq_attempts', async (req, res) => {
    let attempt = req.body;
    if (!attempt.id) attempt.id = 'dpq-att-' + Date.now();
    await DpqAttempt.create(attempt);
    res.status(201).json(attempt);
});

// PYPs
app.get('/api/pyps', async (req, res) => res.json(await Pyp.find({}).sort({ _id: -1 })));
app.post('/api/pyps', async (req, res) => {
    let pyp = req.body;
    if (!pyp.id) pyp.id = 'pyp-' + Date.now();
    await Pyp.create(pyp);
    res.status(201).json(pyp);
});
app.delete('/api/pyps/:id', async (req, res) => {
    await Pyp.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
});

// Settings
app.get('/api/settings', async (req, res) => {
    const setting = await Setting.findOne({ key: 'global' });
    res.json(setting ? setting.data : {});
});
app.post('/api/settings', async (req, res) => {
    await Setting.findOneAndUpdate({ key: 'global' }, { key: 'global', data: req.body }, { upsert: true });
    res.json(req.body);
});

// Messages
app.get('/api/messages', async (req, res) => res.json(await Message.find({}).sort({ createdAt: -1 })));
app.get('/api/messages/:userId', async (req, res) => {
    const userId = req.params.userId.toString();
    res.json(await Message.find({ $or: [{ senderId: userId }, { receiverId: userId }] }).sort({ createdAt: 1 }));
});
app.post('/api/messages', async (req, res) => {
    let msg = req.body;
    if (!msg.id) msg.id = 'msg-' + Date.now();
    if (!msg.createdAt) msg.createdAt = new Date();
    await Message.create(msg);
    res.status(201).json(msg);
});
app.put('/api/messages/:id/read', async (req, res) => {
    await Message.findOneAndUpdate({ id: req.params.id }, { read: true });
    res.json({ success: true });
});

// Uploads (Fallback dummy upload endpoint returning static url or base64 if needed, but the frontend passes base64 currently. If the frontend handles base64, we just return what was sent or it's handled on client side)
app.post('/api/upload', (req, res) => {
    res.json({ url: req.body.data });
});

// Fallback route for SPA
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    } else {
        res.status(404).json({ error: 'API route not found' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Express API Server running at http://localhost:${PORT}`);
});
