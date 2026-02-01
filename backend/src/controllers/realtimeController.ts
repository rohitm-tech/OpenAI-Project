import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { env } from '../config/env';

/**
 * Generate ephemeral client secret for Realtime API
 * This allows clients to connect directly to OpenAI Realtime API
 */
export const createRealtimeClientSecret = async (req: AuthRequest, res: Response) => {
  try {
    const { voice, instructions } = req.body;

    const sessionConfig = {
      session: {
        type: 'realtime' as const,
        model: 'gpt-realtime',
        instructions: instructions || 'You are a helpful assistant. Be conversational and natural.',
        audio: {
          output: {
            voice: voice || 'alloy',
          },
        },
      },
    };

    // Call OpenAI API directly to create client secret
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionConfig),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create client secret');
    }

    const data = await response.json();

    res.json({
      success: true,
      data: {
        clientSecret: data.value,
      },
    });
  } catch (error: any) {
    console.error('Error creating realtime client secret:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create realtime session',
    });
  }
};
