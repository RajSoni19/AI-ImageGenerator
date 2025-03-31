import express from 'express';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const router = express.Router();

// Verify API key is set
if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in environment variables');
    process.exit(1);
}

console.log('Initializing OpenAI client...');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

router.route('/').get((req, res) => {
    res.status(200).json({ message: 'Hello from DALL-E!' });
});

router.route('/').post(async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log('Received prompt:', prompt);

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a prompt'
            });
        }

        // Verify API key before making the request
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-...') {
            throw new Error('Invalid OpenAI API key configuration');
        }

        console.log('Generating image with DALL-E...');
        
        const aiResponse = await openai.images.generate({
            model: "dall-e-2",
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            response_format: 'b64_json',
            quality: "standard",
        }).catch(error => {
            console.error('OpenAI API Error:', {
                error: error.message,
                type: error.type,
                code: error.code,
                param: error.param
            });
            throw error;
        });

        if (!aiResponse.data || aiResponse.data.length === 0) {
            throw new Error('No image data received from OpenAI');
        }

        const image = aiResponse.data[0].b64_json;
        console.log('Image generated successfully');
        
        res.status(200).json({
            success: true,
            photo: image
        });
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            status: error.status,
            type: error.type,
            code: error.code
        });

        // Handle billing-related errors
        if (error.message.includes('Billing') || error.message.includes('billing') || 
            error.message.includes('quota') || error.message.includes('limit')) {
            return res.status(400).json({
                success: false,
                message: 'OpenAI API billing limit reached. Please check your OpenAI account billing settings at https://platform.openai.com/account/billing'
            });
        }

        // Handle rate limit errors
        if (error.name === 'RateLimitError' || error.code === 'rate_limit_exceeded') {
            return res.status(429).json({
                success: false,
                message: 'Rate limit exceeded. Please try again later.'
            });
        }

        // Handle authentication errors
        if (error.name === 'AuthenticationError' || error.code === 'invalid_api_key') {
            return res.status(401).json({
                success: false,
                message: 'Invalid API key. Please check your OpenAI API key configuration.'
            });
        }

        // Handle validation errors
        if (error.name === 'BadRequestError' || error.type === 'invalid_request_error') {
            return res.status(400).json({
                success: false,
                message: error.message || 'Invalid request parameters'
            });
        }

        // Handle all other errors
        res.status(500).json({
            success: false,
            message: 'Failed to generate image. Please check server logs for details.',
            error: {
                message: error.message,
                type: error.type,
                code: error.code
            }
        });
    }
});

export default router;