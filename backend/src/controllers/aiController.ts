import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { OpenAIService } from '../services/openaiService';
import { z } from 'zod';

const textRequestSchema = z.object({
  input: z.union([
    z.string(),
    z.array(
      z.object({
        role: z.enum(['user', 'assistant', 'developer']),
        content: z.any(),
      })
    ),
  ]),
  instructions: z.string().optional(),
  model: z.string().optional(),
  conversationId: z.string().optional(),
});

export const generateText = async (req: AuthRequest, res: Response) => {
  try {
    const { input, instructions, model, conversationId } =
      textRequestSchema.parse(req.body);

    const response = await OpenAIService.generateText(
      input,
      instructions,
      model
    );

    // Messages are saved by the frontend via conversationController
    // No need to save here to avoid duplicates

    res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const generateTextStream = async (req: AuthRequest, res: Response) => {
  try {
    const { input, instructions, model, conversationId } =
      textRequestSchema.parse(req.body);

    // Set SSE headers before any response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in nginx

    const stream = await OpenAIService.generateTextStream(
      input,
      instructions,
      model || 'gpt-4o'
    );

    let fullResponse = '';

    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullResponse += delta;
          res.write(`data: ${JSON.stringify({ delta, type: 'text' })}\n\n`);
        }

        // Check if this is the final chunk
        if (chunk.choices[0]?.finish_reason) {
          res.write(
            `data: ${JSON.stringify({ type: 'done', response: fullResponse })}\n\n`
          );

          // Messages are saved by the frontend via conversationController
          // No need to save here to avoid duplicates

          res.end();
          return;
        }
      }
    } catch (streamError: any) {
      console.error('Stream error:', streamError);
      res.write(
        `data: ${JSON.stringify({ type: 'error', error: streamError.message || 'Stream processing error' })}\n\n`
      );
      res.end();
      return;
    }
  } catch (error: any) {
    console.error('Stream controller error:', error);
    
    // If headers haven't been sent, send JSON error
    if (!res.headersSent) {
      // Check if it's a rate limit or quota error
      const statusCode = error.message?.includes('quota') || error.message?.includes('Rate limit') 
        ? 429 
        : error.message?.includes('Invalid OpenAI API key')
        ? 401
        : 400;
        
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Invalid request',
      });
    } else {
      // If headers are already sent (SSE), send error via SSE
      res.write(
        `data: ${JSON.stringify({ type: 'error', error: error.message || 'Invalid request' })}\n\n`
      );
      res.end();
    }
  }
};

export const analyzeImage = async (req: AuthRequest, res: Response) => {
  try {
    const { imageUrl, prompt, model } = req.body;

    if (!imageUrl || !prompt) {
      res.status(400).json({
        success: false,
        error: 'imageUrl and prompt are required',
      });
      return;
    }

    const response = await OpenAIService.analyzeImage(imageUrl, prompt, model);

    res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const generateImage = async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, model } = req.body;

    if (!prompt) {
      res.status(400).json({
        success: false,
        error: 'prompt is required',
      });
      return;
    }

    const response = await OpenAIService.generateImage(prompt, model);

    res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const textToSpeech = async (req: AuthRequest, res: Response) => {
  try {
    const { text, voice, model } = req.body;

    if (!text) {
      res.status(400).json({
        success: false,
        error: 'text is required',
      });
      return;
    }

    const audioBuffer = await OpenAIService.textToSpeech(
      text,
      voice || 'alloy',
      model || 'tts-1'
    );

    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const speechToText = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'Audio file is required',
      });
      return;
    }

    const transcription = await OpenAIService.speechToText(req.file.buffer);

    res.json({
      success: true,
      data: {
        text: transcription,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
