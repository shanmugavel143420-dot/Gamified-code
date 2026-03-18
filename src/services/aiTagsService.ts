import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface UserStats {
  wins: number;
  losses?: number;
  accuracy: number;
  avgSpeed: number;
  languages?: string[];
}

export const generateAITags = async (stats: UserStats) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze these coding game stats and generate 3 skill tags and 2 character tags.
      Stats:
      - Wins: ${stats.wins}
      - Accuracy: ${stats.accuracy}%
      - Avg Speed: ${stats.avgSpeed}s
      - Languages: ${stats.languages?.join(', ') || 'Various'}
      
      Skill tags should reflect technical prowess (e.g., "Python Pro", "Logic Master").
      Character tags should reflect playstyle (e.g., "The Strategist", "Speed Demon").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skillTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Technical skill badges"
            },
            characterTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Playstyle/Personality badges"
            }
          },
          required: ["skillTags", "characterTags"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating AI tags:", error);
    return {
      skillTags: ["Logic Master", "Code Ninja"],
      characterTags: ["The Strategist", "Speed Demon"]
    };
  }
};
