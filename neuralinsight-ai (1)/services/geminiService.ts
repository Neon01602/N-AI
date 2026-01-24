
import { GoogleGenAI, Type } from "@google/genai";
import { ModelArchitecture, FileMetadata } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeModelFile = async (file: FileMetadata, fileSnippet: string): Promise<ModelArchitecture> => {
  const prompt = `
    Analyze the following model file metadata and content snippet. 
    Predict the model architecture, its type, and its purpose.
    
    File Name: ${file.name}
    File Size: ${file.size} bytes
    File Type: ${file.type}
    Content Snippet: ${fileSnippet}

    Please provide a detailed architecture breakdown in JSON format. 
    For EACH layer, include:
    1. 'contribution': A specific sentence explaining how this layer contributes to the final model logic (e.g., "Extracts high-level spatial patterns" or "Performs final probability distribution").
    2. 'relativeImportance': A float between 0.1 and 1.0 indicating how 'active' or critical this layer is in the data flow.
    
    If you don't recognize the exact file content, use the file name (e.g., 'resnet50.h5', 'bert-base.pt') 
    to infer a high-quality standard architecture.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
                type: { 
                    type: Type.STRING,
                    description: "Must be one of: input, dense, convolution, pooling, dropout, output, normalization, activation"
                },
                neurons: { type: Type.INTEGER },
                activation: { type: Type.STRING },
                details: { type: Type.STRING },
                contribution: { type: Type.STRING },
                relativeImportance: { type: Type.NUMBER }
              },
              required: ["id", "name", "type", "neurons", "contribution", "relativeImportance"]
            }
          }
        },
        required: ["name", "type", "description", "layers", "totalParameters", "useCase"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return data as ModelArchitecture;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Invalid response format from AI analyzer.");
  }
};
