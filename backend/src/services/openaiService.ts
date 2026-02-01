import OpenAI from 'openai';
import { env } from '../config/env';

// Validate API key before creating client
if (!env.openaiApiKey || env.openaiApiKey.trim() === '') {
  console.error('❌ ERROR: OPENAI_API_KEY is not set in environment variables!');
  console.error('   Please add OPENAI_API_KEY to your .env file in the backend directory.');
  throw new Error('OpenAI API key is missing. Please set OPENAI_API_KEY in your .env file.');
}

const client = new OpenAI({ apiKey: env.openaiApiKey });

export class OpenAIService {
  /**
   * Generate text response using Chat Completions API
   * Automatically falls back to gpt-3.5-turbo if gpt-4o is unavailable
   */
  static async generateText(
    input: string | Array<{ role: string; content: any }>,
    instructions?: string,
    model: string = 'gpt-4o'
  ) {
    // Convert input to messages format for Chat Completions API
    let messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    
    if (typeof input === 'string') {
      messages = [{ role: 'user', content: input }];
    } else {
      messages = input.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      }));
    }

    // Add system instruction if provided
    if (instructions) {
      messages.unshift({ role: 'system', content: instructions });
    }

    // Try the requested model first, fallback to gpt-3.5-turbo if quota issue
    const modelsToTry = model === 'gpt-4o' ? ['gpt-4o', 'gpt-3.5-turbo'] : [model];

    for (const modelToTry of modelsToTry) {
      try {
        const response = await client.chat.completions.create({
          model: modelToTry,
          messages,
        });

        return {
          text: response.choices[0]?.message?.content || '',
          output: response,
          id: response.id,
        };
      } catch (error: any) {
        console.error(`OpenAI API error with model ${modelToTry}:`, error);
        
        // If this is the last model to try, throw the error
        if (modelToTry === modelsToTry[modelsToTry.length - 1]) {
          // Handle rate limiting and quota errors
          if (error.status === 429) {
            if (error.code === 'insufficient_quota' || error.error?.code === 'insufficient_quota') {
              throw new Error('OpenAI API quota exceeded. Please check: 1) Your billing settings at https://platform.openai.com/account/billing, 2) Spending limits, 3) Model access permissions. If you have credits, ensure they are activated and the API key has access to the requested model.');
            } else {
              // Rate limit (too many requests)
              const retryAfter = error.headers?.['retry-after'] || '60';
              throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
            }
          }
          
          // Handle authentication errors
          if (error.status === 401) {
            throw new Error('Invalid OpenAI API key. Please check your API key in the .env file.');
          }
          
          throw new Error(`OpenAI API error: ${error.message || error.error?.message || 'Unknown error'}`);
        }
        
        // If quota error and we have a fallback model, try the next one
        if (error.status === 429 && (error.code === 'insufficient_quota' || error.error?.code === 'insufficient_quota')) {
          console.log(`Model ${modelToTry} unavailable due to quota, trying fallback model...`);
          continue;
        }
        
        // For other errors, throw immediately
        throw error;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Failed to generate text with any available model');
  }

  /**
   * Generate text with streaming using Chat Completions API
   * Automatically falls back to gpt-3.5-turbo if gpt-4o is unavailable
   */
  static async generateTextStream(
    input: string | Array<{ role: string; content: any }>,
    instructions?: string,
    model: string = 'gpt-4o'
  ) {
    // Convert input to messages format for Chat Completions API
    let messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    
    if (typeof input === 'string') {
      messages = [{ role: 'user', content: input }];
    } else {
      messages = input.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      }));
    }

    // Add system instruction if provided
    if (instructions) {
      messages.unshift({ role: 'system', content: instructions });
    }

    // Try the requested model first, fallback to gpt-3.5-turbo if quota issue
    const modelsToTry = model === 'gpt-4o' ? ['gpt-4o', 'gpt-3.5-turbo'] : [model];

    for (const modelToTry of modelsToTry) {
      try {
        const stream = await client.chat.completions.create({
          model: modelToTry,
          messages,
          stream: true,
        });

        return stream;
      } catch (error: any) {
        console.error(`OpenAI streaming error with model ${modelToTry}:`, error);
        
        // If this is the last model to try, throw the error
        if (modelToTry === modelsToTry[modelsToTry.length - 1]) {
          // Handle rate limiting and quota errors
          if (error.status === 429) {
            if (error.code === 'insufficient_quota' || error.error?.code === 'insufficient_quota') {
              throw new Error('OpenAI API quota exceeded. Please check: 1) Your billing settings at https://platform.openai.com/account/billing, 2) Spending limits, 3) Model access permissions. If you have credits, ensure they are activated and the API key has access to the requested model.');
            } else {
              // Rate limit (too many requests)
              const retryAfter = error.headers?.['retry-after'] || '60';
              throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
            }
          }
          
          // Handle authentication errors
          if (error.status === 401) {
            throw new Error('Invalid OpenAI API key. Please check your API key in the .env file.');
          }
          
          throw new Error(`OpenAI API error: ${error.message || error.error?.message || 'Unknown error'}`);
        }
        
        // If quota error and we have a fallback model, try the next one
        if (error.status === 429 && (error.code === 'insufficient_quota' || error.error?.code === 'insufficient_quota')) {
          console.log(`Model ${modelToTry} unavailable due to quota, trying fallback model...`);
          continue;
        }
        
        // For other errors, throw immediately
        throw error;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Failed to create stream with any available model');
  }

  /**
   * Analyze image using Chat Completions API with vision
   * Supports multiple vision-capable models with fallback
   */
  static async analyzeImage(
    imageUrl: string,
    prompt: string,
    model: string = 'gpt-4o'
  ) {
    // List of vision-capable models to try (in order of preference)
    const visionModels = model === 'gpt-4o' 
      ? ['gpt-4o', 'gpt-4-turbo', 'gpt-4-vision-preview']
      : [model];

    for (const modelToTry of visionModels) {
      try {
        const response = await client.chat.completions.create({
          model: modelToTry,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
          max_tokens: 1000, // Limit response length
        });

        return {
          text: response.choices[0]?.message?.content || '',
          output: response,
          id: response.id,
        };
      } catch (error: any) {
        console.error(`OpenAI image analysis error with model ${modelToTry}:`, error);
        
        // If this is the last model to try, throw the error
        if (modelToTry === visionModels[visionModels.length - 1]) {
          // Handle rate limiting and quota errors
          if (error.status === 429) {
            if (error.code === 'insufficient_quota' || error.error?.code === 'insufficient_quota') {
              throw new Error('OpenAI API quota exceeded for vision models. Please check your billing and model access.');
            } else {
              const retryAfter = error.headers?.['retry-after'] || '60';
              throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
            }
          }
          
          // Handle model not found or not available
          if (error.status === 404 || error.message?.includes('not found')) {
            throw new Error(`Vision model ${modelToTry} is not available. Please check your API access.`);
          }
          
          throw new Error(`OpenAI API error: ${error.message || error.error?.message || 'Unknown error'}`);
        }
        
        // If quota error and we have a fallback model, try the next one
        if (error.status === 429 && (error.code === 'insufficient_quota' || error.error?.code === 'insufficient_quota')) {
          console.log(`Model ${modelToTry} unavailable due to quota, trying fallback vision model...`);
          continue;
        }
        
        // For other errors, try next model
        if (modelToTry !== visionModels[visionModels.length - 1]) {
          console.log(`Model ${modelToTry} failed, trying next vision model...`);
          continue;
        }
        
        throw error;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Failed to analyze image with any available vision model');
  }

  /**
   * Generate image using DALL-E API or Responses API
   * Tries DALL-E first, falls back to Responses API with gpt-4.1-mini
   */
  static async generateImage(
    prompt: string,
    model: string = 'dall-e-3'
  ) {
    // Try DALL-E API first
    try {
      const response = await client.images.generate({
        model: model as 'dall-e-2' | 'dall-e-3',
        prompt,
        n: 1,
        size: model === 'dall-e-3' ? '1024x1024' : '512x512',
      });

      if (response.data && response.data.length > 0) {
        return {
          imageUrl: response.data[0].url || '',
          revisedPrompt: response.data[0].revised_prompt,
          id: response.data[0].url || '',
        };
      }

      throw new Error('No image generated');
    } catch (error: any) {
      console.error('DALL-E image generation error:', error);
      
      // Fallback to Responses API with gpt-4.1-mini
      try {
        console.log('Trying Responses API with gpt-4.1-mini for image generation...');
        const response = await client.responses.create({
          model: 'gpt-4.1-mini',
          input: prompt,
          tools: [{ type: 'image_generation' }],
        });

        const imageData = response.output
          .filter((output: any) => output.type === 'image_generation_call')
          .map((output: any) => output.result);

        if (imageData.length > 0) {
          // The result is base64 encoded
          const imageBase64 = imageData[0];
          return {
            imageUrl: `data:image/png;base64,${imageBase64}`,
            revisedPrompt: prompt,
            id: `img_${Date.now()}`,
          };
        }

        throw new Error('No image generated from Responses API');
      } catch (fallbackError: any) {
        console.error('Responses API image generation error:', fallbackError);
        throw new Error(`OpenAI API error: ${error.message || error.error?.message || fallbackError.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Generate audio from text (Text-to-Speech)
   */
  static async textToSpeech(
    text: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy',
    model: string = 'tts-1'
  ) {
    try {
      const mp3 = await client.audio.speech.create({
        model,
        voice,
        input: text,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      return buffer;
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Transcribe audio to text (Speech-to-Text)
   */
  static async speechToText(
    audioBuffer: Buffer,
    model: string = 'whisper-1'
  ) {
    try {
      const file = new File([audioBuffer], 'audio.webm', {
        type: 'audio/webm',
      });

      const transcription = await client.audio.transcriptions.create({
        file,
        model,
      });

      return transcription.text;
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Chat with audio input/output
   * Note: Audio input/output in chat is not yet widely available in the standard API
   * This is a placeholder for future implementation
   */
  static async chatWithAudio(
    audioBuffer: Buffer,
    textPrompt: string,
    model: string = 'gpt-4o'
  ) {
    try {
      // First transcribe the audio
      const transcription = await this.speechToText(audioBuffer);
      
      // Then use the transcription with the text prompt
      const combinedPrompt = textPrompt 
        ? `${textPrompt}\n\nTranscribed audio: ${transcription}`
        : transcription;

      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: combinedPrompt,
          },
        ],
      });

      const textResponse = response.choices[0]?.message?.content || '';

      // Optionally convert response to speech
      const audioResponse = await this.textToSpeech(textResponse);

      return {
        text: textResponse,
        audio: audioResponse,
      };
    } catch (error: any) {
      console.error('OpenAI audio chat error:', error);
      throw new Error(`OpenAI API error: ${error.message || error.error?.message || 'Unknown error'}`);
    }
  }
}
