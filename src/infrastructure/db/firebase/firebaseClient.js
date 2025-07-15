"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = exports.db = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
exports.admin = firebase_admin_1.default;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (!firebase_admin_1.default.apps.length) {
    try {
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: (_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n'),
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
        });
        console.log('✅ Firebase Admin initialized successfully');
    }
    catch (error) {
        console.error('❌ Firebase Admin initialization failed:', error);
        throw error;
    }
}
const db = firebase_admin_1.default.firestore();
exports.db = db;
