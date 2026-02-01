import OpenAI from 'openai';
import { env } from '../config/env';

const client = new OpenAI({ apiKey: env.openaiApiKey });

export class OpenAIService {
  /**
   * Generate text response using Responses API
   */
  static async generateText(
    input: string | Array<{ role: string; content: any }>,
    instructions?: string,
    model: string = 'gpt-5'
  ) {
    try {
      const response = await client.responses.create({
        model,
        input: typeof input === 'string' ? input : input,
        instructions,
      });

      return {
        text: response.output_text,
        output: response.output,
        id: response.id,
      };
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Generate text with streaming
   */
  static async generateTextStream(
    input: string | Array<{ role: string; content: any }>,
    instructions?: string,
    model: string = 'gpt-5'
  ) {
    try {
      const stream = await client.responses.create({
        model,
        input: typeof input === 'string' ? input : input,
        instructions,
        stream: true,
      });

      return stream;
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Analyze image
   */
  static async analyzeImage(
    imageUrl: string,
    prompt: string,
    model: string = 'gpt-4.1-mini'
  ) {
    try {
      const response = await client.responses.create({
        model,
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: prompt },
              {
                type: 'input_image',
                image_url: imageUrl,
              },
            ],
          },
        ],
      });

      return {
        text: response.output_text,
        output: response.output,
        id: response.id,
      };
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Generate image
   */
  static async generateImage(
    prompt: string,
    model: string = 'gpt-4.1-mini'
  ) {
    try {
      const response = await client.responses.create({
        model,
        input: prompt,
        tools: [{ type: 'image_generation' }],
      });

      const imageData = response.output
        .filter((output: any) => output.type === 'image_generation_call')
        .map((output: any) => output.result);

      if (imageData.length > 0) {
        return {
          imageBase64: imageData[0],
          id: response.id,
        };
      }

      throw new Error('No image generated');
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
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
   */
  static async chatWithAudio(
    audioBuffer: Buffer,
    textPrompt: string,
    model: string = 'gpt-audio'
  ) {
    try {
      const base64Audio = audioBuffer.toString('base64');

      const response = await client.chat.completions.create({
        model,
        modalities: ['text', 'audio'],
        audio: { voice: 'alloy', format: 'wav' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: textPrompt },
              {
                type: 'input_audio',
                input_audio: { data: base64Audio, format: 'webm' },
              },
            ],
          },
        ],
      });

      return {
        text: response.choices[0].message.content,
        audio: response.choices[0].message.audio,
      };
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}
