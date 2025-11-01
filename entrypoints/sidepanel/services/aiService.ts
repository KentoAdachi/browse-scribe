import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type AIProvider = "openai" | "gemini";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionParams {
  model: string;
  messages: ChatMessage[];
}

export interface AIService {
  chat(params: ChatCompletionParams): Promise<string>;
  listModels?(): Promise<string[]>;
}

export class OpenAIService implements AIService {
  private client: OpenAI;

  constructor(apiKey: string, baseUrl: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
      dangerouslyAllowBrowser: true,
    });
  }

  async chat(params: ChatCompletionParams): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: params.model,
      messages: params.messages,
    });

    return response.choices[0]?.message?.content || "";
  }

  async listModels(): Promise<string[]> {
    const response = await this.client.models.list();
    return response.data.map((m) => m.id);
  }
}

export class GeminiService implements AIService {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async chat(params: ChatCompletionParams): Promise<string> {
    const model = this.client.getGenerativeModel({ model: params.model });

    // Convert messages to Gemini format
    // Gemini doesn't have a separate system role, so we prepend system messages to the user content
    let prompt = "";
    const systemMessages = params.messages.filter((m) => m.role === "system");
    const userMessages = params.messages.filter((m) => m.role === "user");

    if (systemMessages.length > 0) {
      prompt = systemMessages.map((m) => m.content).join("\n\n") + "\n\n";
    }

    if (userMessages.length > 0) {
      prompt += userMessages.map((m) => m.content).join("\n\n");
    }

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  }

  async listModels(): Promise<string[]> {
    // Gemini models are predefined (list updated as of November 2025)
    // Note: This list may need updates as Google adds or removes models
    // Stable models
    return [
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-1.5-pro",
      // Experimental models (may become unavailable)
      "gemini-2.0-flash-exp",
      "gemini-exp-1206",
    ];
  }
}

export function createAIService(
  provider: AIProvider,
  apiKey: string,
  baseUrl?: string
): AIService {
  switch (provider) {
    case "openai":
      return new OpenAIService(apiKey, baseUrl || "https://api.openai.com/v1");
    case "gemini":
      return new GeminiService(apiKey);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
