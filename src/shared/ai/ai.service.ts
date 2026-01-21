import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { GoogleGenAI } from "@google/genai";
import { secretConfig } from "config/secret.config";

@Injectable()
export class AiService {
  constructor() {}

  async sendToGemini(prompt: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: secretConfig.geminiApiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return response.candidates?.[0].content?.parts?.[0].text;
    } catch {
      throw new ServiceUnavailableException("ai response not recieved");
    }
  }
}
