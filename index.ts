import express from "express";
import cors from 'cors';
import SubscriberRoutes from './src/presentation/routes/SubscriberRoutes';


const app = express();

// More permissive CORS for development
app.use(cors({
    origin: true, // Allow all origins for debugging
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Add some debugging middleware
app.use((req, res, next) => {
    // console.log(`=== REQUEST RECEIVED ===`);
    // console.log(`${req}`)
    // console.log(`${req.method} ${req.path}`);
    // console.log(`Origin: ${req.headers.origin}`);
    // console.log(`User-Agent: ${req.headers['user-agent']}`);
    // console.log(`Content-Type: ${req.headers['content-type']}`);
    // console.log(`Body:`, req.body);
    // console.log(`=======================`);
    next();
});

// Test route
app.get('/test', (req, res) => {
    // console.log('Test route hit!');
    res.json({ message: 'Backend is working!' });
});

// Test POST route
app.post('/test-post', (req, res) => {
    // console.log('Test POST route hit!');
    // console.log('Body:', req.body);
    res.json({ message: 'POST test successful!', received: req.body });
});

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the backend API!' });
});

app.use('/api/rvr', SubscriberRoutes)

app.listen(5001, () => {
    console.log("Backend server running on http://localhost:5001")
    console.log("Test routes:")
    console.log("  GET  http://localhost:5001/test")
    console.log("  POST http://localhost:5001/test-post")
    console.log("  POST http://localhost:5001/api/rvr/registerSubscriber")
})