import axios from "axios";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export interface GeminiModel {
  name: string;
  version: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
  temperature?: number;
  topP?: number;
  topK?: number;
}

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

const GeminiService = {
  getAvailableModels: async (): Promise<GeminiModel[]> => {
    if (!API_KEY) {
      console.warn("Gemini API Key is missing. Please check your .env file.");
      return [];
    }

    try {
      const response = await axios.get(`${BASE_URL}/models`, {
        params: { key: API_KEY },
      });

      const models = response.data.models || [];
      // Filter for models that support content generation (chat)
      return models.filter(
        (m: GeminiModel) =>
          m.supportedGenerationMethods.includes("generateContent") &&
          // Prefer 'gemini' models and avoid specific tuning or legacy ones if needed
          m.name.includes("gemini"),
      );
    } catch (error) {
      console.error("Error fetching Gemini models:", error);
      throw error;
    }
  },

  chatWithModel: async (
    modelName: string,
    history: ChatMessage[],
  ): Promise<string> => {
    if (!API_KEY) {
      throw new Error("Gemini API Key is missing.");
    }

    const resourceName = modelName.startsWith("models/")
      ? modelName
      : `models/${modelName}`;

    try {
      const contents = history.map((msg) => ({
        role: msg.role,
        parts: msg.parts,
      }));

      const response = await axios.post(
        `${BASE_URL}/${resourceName}:generateContent`,
        {
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100000,
          },
        },
        {
          params: { key: API_KEY },
        },
      );

      const candidates = response.data.candidates;
      if (candidates && candidates.length > 0) {
        const content = candidates[0].content;
        if (content && content.parts && content.parts.length > 0) {
          return content.parts[0].text;
        }
      }

      return "No response generated.";
    } catch (error: any) {
      console.error(
        "Error chatting with Gemini:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },
};

export default GeminiService;
