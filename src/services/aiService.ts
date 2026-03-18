import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateProblem = async (difficulty: string, type: string, language: string = 'javascript', history: any[] = []) => {
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a coding challenge for a ${difficulty} level. 
      Language: ${language}.
      Type: ${type}. 
      User History: ${JSON.stringify(history)}.
      Return a JSON object with: 
      - title: A catchy name for the challenge.
      - description: Detailed explanation of the problem.
      - initialCode: Boilerplate code in ${language}.
      - testCases: An array of objects with 'input' and 'output' (strings).
      - solution: A reference solution in ${language}.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            initialCode: { type: Type.STRING },
            testCases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  input: { type: Type.STRING },
                  output: { type: Type.STRING }
                },
                required: ["input", "output"]
              }
            },
            solution: { type: Type.STRING }
          },
          required: ["title", "description", "initialCode", "testCases", "solution"]
        }
      }
    });
    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Failed to generate problem:", error);
    throw error;
  }
};

export const simulateExecution = async (code: string, language: string, input: string) => {
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Act as a code compiler/interpreter for ${language}. 
      Execute the following code with the provided input and return ONLY the output.
      If there's a syntax error or runtime error, describe it briefly.
      
      Code:
      ${code}
      
      Input:
      ${input}
      
      Output:`,
    });
    return result.text?.trim() || "No output";
  } catch (error) {
    console.error("Simulation failed:", error);
    return "Execution Error: AI simulation failed.";
  }
};

export const generateStructuredProblem = async (difficulty: string, language: string = 'javascript') => {
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Generate a structured coding challenge for a ${difficulty} level in ${language}.
      The challenge must have 4 stages:
      1. SYNTAX EXPLANATION: Explain required concepts for this problem.
      2. MINI DEMO: A small working example related to the problem.
      3. MAIN PROBLEM STATEMENT: The actual challenge.
      4. USER CODING AREA: Initial boilerplate.

      Return a JSON object with:
      - title: Catchy name.
      - syntaxExplanation: Step-by-step explanation (markdown).
      - miniDemo: { code: string, explanation: string, output: string }
      - problemStatement: The main question (markdown).
      - initialCode: Short template for the user.
      - testCases: Array of { input: string, output: string }.
      - solution: Correct code.
      - timeLimit: Number of minutes (5, 10, or 15).
      - xpReward: Number of XP.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            syntaxExplanation: { type: Type.STRING },
            miniDemo: {
              type: Type.OBJECT,
              properties: {
                code: { type: Type.STRING },
                explanation: { type: Type.STRING },
                output: { type: Type.STRING }
              },
              required: ["code", "explanation", "output"]
            },
            problemStatement: { type: Type.STRING },
            initialCode: { type: Type.STRING },
            testCases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  input: { type: Type.STRING },
                  output: { type: Type.STRING }
                },
                required: ["input", "output"]
              }
            },
            solution: { type: Type.STRING },
            timeLimit: { type: Type.NUMBER },
            xpReward: { type: Type.NUMBER }
          },
          required: ["title", "syntaxExplanation", "miniDemo", "problemStatement", "initialCode", "testCases", "solution", "timeLimit", "xpReward"]
        }
      }
    });
    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Failed to generate structured problem:", error);
    throw error;
  }
};

export const analyzePerformance = async (code: string, problem: string, stats: any) => {
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this coding performance for a gamified platform. 
      Code: ${code}
      Problem: ${problem}
      Stats: ${JSON.stringify(stats)}
      Provide a skill tag (e.g., "Logic Master"), a performance rating ("Good", "Super", "Excellent"), and one tip for improvement.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skillTag: { type: Type.STRING },
            rating: { type: Type.STRING },
            tip: { type: Type.STRING }
          },
          required: ["skillTag", "rating", "tip"]
        }
      }
    });
    
    const analysis = JSON.parse(result.text || "{}");
    return `${analysis.rating}! You are a ${analysis.skillTag}. Tip: ${analysis.tip}`;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    throw error;
  }
};
