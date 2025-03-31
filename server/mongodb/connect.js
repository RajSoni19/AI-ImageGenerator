import mongoose from "mongoose";

const connectDB = async (url) => {
    try {
        if (!url) {
            throw new Error('MongoDB connection URL is not provided');
        }

        mongoose.set('strictQuery', true);
        
        const conn = await mongoose.connect(url);
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        console.error('Please check:');
        console.error('1. Your MongoDB connection string format');
        console.error('2. Your username and password are correct');
        console.error('3. Your IP address is whitelisted in MongoDB Atlas');
        console.error('4. Your MongoDB cluster is running');
        throw error;
    }
};

export default connectDB;