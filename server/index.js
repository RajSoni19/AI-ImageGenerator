import express from 'express';
import * as dotenv from 'dotenv';
// import { ApolloServer } from 'apollo-server-express';
import cors from 'cors';

import connectDB from './mongodb/connect.js';
import postRoutes from './routes/postRoutes.js';
import dalleRoutes from './routes/dalleRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/v1/post', postRoutes);
app.use('/api/v1/dalle', dalleRoutes);

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Hello from AI!' });
});

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');
        
        // Start server
        app.listen(8000, () => {
            console.log('Server is running on http://localhost:8000');
            console.log('API endpoints:');
            console.log('- POST /api/v1/dalle - Generate images');
            console.log('- GET/POST /api/v1/post - Handle community posts');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

startServer();