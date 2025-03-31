import express from 'express';
import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

import Post from '../mongodb/models/post.js';

dotenv.config();

const router = express.Router();

// Verify Cloudinary configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('Missing Cloudinary configuration. Please check your .env file');
    process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Get all posts
router.route('/').get(async (req, res) => {
    try {
        const posts = await Post.find({});
        res.status(200).json({ success: true, data: posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch posts',
            error: error.message 
        });
    }
});

// Create a post
router.route('/').post(async (req, res) => {
    try {
        const { name, prompt, photo } = req.body;
        
        // Validate request body
        if (!name || !prompt || !photo) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, prompt and photo'
            });
        }

        // Log the attempt to upload
        console.log('Attempting to upload image to Cloudinary...');
        console.log('Using cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
        
        // Upload to Cloudinary
        const photoUrl = await cloudinary.uploader.upload(photo, {
            folder: 'dalle_clone',
        }).catch(error => {
            console.error('Cloudinary upload error:', error);
            throw new Error(`Cloudinary upload failed: ${error.message}`);
        });

        if (!photoUrl || !photoUrl.url) {
            throw new Error('Failed to get URL from Cloudinary');
        }

        console.log('Image uploaded successfully to:', photoUrl.url);

        // Create post in database
        console.log('Creating new post in database...');
        const newPost = await Post.create({
            name,
            prompt,
            photo: photoUrl.url,
        });

        console.log('Post created successfully with ID:', newPost._id);
        res.status(201).json({ success: true, data: newPost });
    } catch (error) {
        console.error('Error in post creation:', error);

        // Handle Cloudinary specific errors
        if (error.http_code === 401) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Cloudinary credentials'
            });
        }

        if (error.http_code === 400) {
            return res.status(400).json({
                success: false,
                message: 'Invalid image data'
            });
        }

        // Handle MongoDB errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid post data',
                error: error.message
            });
        }

        // Generic error response
        res.status(500).json({
            success: false,
            message: 'Failed to create post',
            error: error.message
        });
    }
});

export default router;