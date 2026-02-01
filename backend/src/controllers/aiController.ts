import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { OpenAIService } from '../services/openaiService';
import { Conversation } from '../models/Conversation';
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

    // Save to conversation if conversationId provided
    if (conversationId && req.userId) {
      await Conversation.findByIdAndUpdate(conversationId, {
        $push: {
          messages: {
            role: 'user',
            content: typeof input === 'string' ? input : JSON.stringify(input),
            type: 'text',
            timestamp: new Date(),
          },
        },
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        $push: {
          messages: {
            role: 'assistant',
            content: response.text,
            type: 'text',
            timestamp: new Date(),
          },
        },
      });
    }

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

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await OpenAIService.generateTextStream(
      input,
      instructions,
      model
    );

    let fullResponse = '';

    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        const delta = (event as any).delta;
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ delta, type: 'text' })}\n\n`);
      } else if (event.type === 'response.completed') {
        const response = (event as any).response;
        res.write(
          `data: ${JSON.stringify({ type: 'done', response })}\n\n`
        );

        // Save to conversation
        if (conversationId && req.userId) {
          await Conversation.findByIdAndUpdate(conversationId, {
            $push: {
              messages: {
                role: 'user',
                content:
                  typeof input === 'string' ? input : JSON.stringify(input),
                type: 'text',
                timestamp: new Date(),
              },
            },
          });

          await Conversation.findByIdAndUpdate(conversationId, {
            $push: {
              messages: {
                role: 'assistant',
                content: fullResponse,
                type: 'text',
                timestamp: new Date(),
              },
            },
          });
        }

        res.end();
      } else if (event.type === 'response.error') {
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: (event as any).error })}\n\n`
        );
        res.end();
      }
    }
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
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
