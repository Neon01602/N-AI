import { GoogleGenAI, Type } from "@google/genai";
import { ModelArchitecture, FileMetadata } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY is not defined");
}

const ai = new GoogleGenAI({ apiKey });

export const analyzeModelFile = async (
  file: FileMetadata,
  fileSnippet: string
): Promise<ModelArchitecture> => {

  const prompt = `
Analyze the following model file metadata and content snippet.
Predict the model architecture, its type, and its purpose.

File Name: ${file.name}
File Size: ${file.size} bytes
File Type: ${file.type}
Content Snippet: ${fileSnippet}

Provide a detailed architecture breakdown in JSON format.

For EACH layer include:
- contribution
- relativeImportance (0.1 → 1.0)

If file content is unknown, infer from the name.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING },
            description: { type: Type.STRING },
            totalParameters: { type: Type.STRING },
            useCase: { type: Type.STRING },
            layers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  neurons: { type: Type.INTEGER },
                  activation: { type: Type.STRING },
                  details: { type: Type.STRING },
                  contribution: { type: Type.STRING },
                  relativeImportance: { type: Type.NUMBER }
                },
                required: [
                  "id",
                  "name",
                  "type",
                  "neurons",
                  "contribution",
                  "relativeImportance"
                ]
              }
            }
          },
          required: [
            "name",
            "type",
            "description",
            "layers",
            "totalParameters",
            "useCase"
          ]
        }
      }
    });

    const rawText =
      response.text ||
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "{}";

    return JSON.parse(rawText) as ModelArchitecture;

  } catch (err) {
    console.error("Gemini analysis failed:", err);
    throw new Error("AI analysis unavailable");
  }
};
