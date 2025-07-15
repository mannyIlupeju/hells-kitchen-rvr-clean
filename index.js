"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const SubscriberRoutes_1 = __importDefault(require("./src/presentation/routes/SubscriberRoutes"));
const app = (0, express_1.default)();
// More permissive CORS for development
app.use((0, cors_1.default)({
    origin: true, // Allow all origins for debugging
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
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
app.use('/api/rvr', SubscriberRoutes_1.default);
app.listen(5001, () => {
    console.log("Backend server running on http://localhost:5001");
    console.log("Test routes:");
    console.log("  GET  http://localhost:5001/test");
    console.log("  POST http://localhost:5001/test-post");
    console.log("  POST http://localhost:5001/api/rvr/registerSubscriber");
});
