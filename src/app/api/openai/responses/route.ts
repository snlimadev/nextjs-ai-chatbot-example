import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL_ID = process.env.OPENAI_MODEL_ID ?? 'gpt-4.1-nano';
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS) || 4096;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.input) {
      return NextResponse.json(
        { error: "The 'input' field is required." },
        { status: 400 }
      );
    }

    const res = await openai.responses.create({
      model: OPENAI_MODEL_ID,
      previous_response_id: data.lastResponseId,
      tools: [{ type: 'image_generation' }],
      input: data.input,
      max_output_tokens: MAX_OUTPUT_TOKENS
    });

    const imageData = res.output
      .filter((output) => output.type === 'image_generation_call')
      .map((output) => output.result);

    return NextResponse.json(
      {
        output: {
          id: res.id,
          text: imageData.length > 0
            ? `data:image/png;base64,${imageData[0]}` // Base64 image data URI
            : `\t${res.output_text}` // Start with a tab when it's not an image
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching response from OpenAI API: ', error);

    return NextResponse.json(
      { error: 'An error has occurred while processing the request.' },
      { status: 500 }
    );
  }
}