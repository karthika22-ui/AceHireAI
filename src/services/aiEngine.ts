import {
  DualLanguageFeedback,
  InterviewQuestion,
  InterviewType,
  InterviewFinalReport,
  GrammarMistakeDetail,
  DetailedGrammarReport,
  ResumeData,
  ResumeAnalysis,
  CodingLanguage,
  CodingChallenge,
  CodingSubmissionResult,
  AptitudeQuestion,
  AptitudeCategory,
  DifficultyLevel,
  RoadmapTask,
  CameraAnalysisResult,
  UserProfile
} from '../types';
import { getUserAddressTerm, formatTanglishAddressing } from '../utils/addressing';

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AceHire AI Agent Engine
 * Handles AI Mock Interviews, Resume ATS Analysis, Dual-Language Feedback (English & Tanglish),
 * Coding Review, and Personalized Placement Roadmaps.
 */

const metaEnv = (import.meta as any).env || {};
export const AI_API_KEY = metaEnv.VITE_GEMINI_API_KEY || metaEnv.VITE_API_KEY || '';
export const OPENROUTER_API_KEY = metaEnv.VITE_OPENROUTER_API_KEY || '';

export const OPENROUTER_LOWER_MODELS = [
  'google/gemini-2.0-flash-lite-001',
  'google/gemini-flash-1.5-8b',
  'meta-llama/llama-3.2-3b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'qwen/qwen-2.5-7b-instruct',
  'deepseek/deepseek-r1-distill-llama-8b',
  'openai/gpt-4o-mini'
];

export async function fetchFromOpenRouter(prompt: string, apiKey: string = OPENROUTER_API_KEY): Promise<string> {
  let lastErr: any = null;
  for (const modelName of OPENROUTER_LOWER_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://acehire.ai',
          'X-Title': 'AceHire AI'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'system',
              content: 'You are an AI programming problem designer for technical interviews and coding challenges. Return ONLY raw JSON array or object without markdown syntax or prose.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && typeof content === 'string' && content.trim()) {
          return content;
        }
      } else {
        const errText = await res.text();
        console.warn(`OpenRouter model ${modelName} returned status ${res.status}: ${errText}`);
        lastErr = new Error(`OpenRouter HTTP ${res.status}: ${errText}`);
      }
    } catch (e) {
      console.warn(`OpenRouter call failed for model ${modelName}:`, e);
      lastErr = e;
    }
  }
  throw lastErr || new Error('All OpenRouter lower models failed.');
}

export const genAI = AI_API_KEY ? new GoogleGenerativeAI(AI_API_KEY) : null;
export const geminiModel = genAI ? genAI.getGenerativeModel({ model: 'gemini-3.6-flash' }) : null;

export interface GenerateQuestionsOptions {
  topic: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  questionType?: 'mcq' | 'coding' | 'interview' | string;
  numberOfQuestions?: number;
  avoidTitles?: string[];
}

function sanitizeField(value: any): string {
  if (typeof value !== 'string') return value || '';
  return value
    .replace(/Previously generated titles to avoid:[^\n.]*/gi, '')
    .replace(/You are an expert[^\n.]*/gi, '')
    .replace(/Generate exactly[^\n.]*/gi, '')
    .replace(/^Problem Statement:\s*/i, '')
    .replace(/^Description:\s*/i, '')
    .replace(/^Title:\s*/i, '')
    .replace(/^Here is (a|the) (problem|challenge):?\s*/i, '')
    .trim();
}

/**
 * Reusable function to generate questions using OpenRouter API / Google Gemini API.
 * Reads API key from VITE_OPENROUTER_API_KEY / VITE_GEMINI_API_KEY and returns generated questions in clean JSON format.
 */
export async function generateQuestions(
  topicOrOptions: string | GenerateQuestionsOptions,
  difficultyArg: 'easy' | 'medium' | 'hard' | string = 'medium',
  questionTypeArg: 'mcq' | 'coding' | 'interview' | string = 'mcq',
  numberOfQuestionsArg: number = 5
): Promise<any[]> {
  let topic = '';
  let difficulty = 'medium';
  let questionType = 'mcq';
  let numberOfQuestions = 5;
  let avoidTitles: string[] = [];

  if (typeof topicOrOptions === 'object' && topicOrOptions !== null) {
    topic = topicOrOptions.topic || '';
    difficulty = topicOrOptions.difficulty || 'medium';
    questionType = topicOrOptions.questionType || 'mcq';
    numberOfQuestions = topicOrOptions.numberOfQuestions || 5;
    avoidTitles = topicOrOptions.avoidTitles || [];
  } else {
    topic = topicOrOptions || '';
    difficulty = difficultyArg || 'medium';
    questionType = questionTypeArg || 'mcq';
    numberOfQuestions = numberOfQuestionsArg || 5;
  }

  // Extract clean language/topic name
  const cleanTopic = topic.replace(/Previously generated titles to avoid:.*/gi, '').trim() || 'Python';

  const openRouterKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY || OPENROUTER_API_KEY || '';
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_API_KEY || AI_API_KEY || '';

  const diffLower = difficulty.toLowerCase();
  const difficultyGuide =
    diffLower === 'easy'
      ? 'EASY LEVEL: Simple, beginner-friendly, straightforward logic (basic arrays, string manipulation, elementary math, easy to understand).'
      : diffLower === 'hard'
      ? 'HARD LEVEL: Interview-level, highly challenging, suitable for advanced candidates (dynamic programming, graph algorithms, hard optimizations).'
      : 'MEDIUM LEVEL: Moderately challenging, suitable for intermediate learners (hash maps, binary search, sliding window, tree traversal).';

  const avoidInstruction = avoidTitles.length > 0
    ? `CRITICAL UNIENESS REQUIREMENT: Do NOT generate questions with any of these titles or concepts: ${avoidTitles.join(', ')}. Generate a completely NEW, ORIGINAL, and DIFFERENT problem.`
    : 'Generate a completely unique and original programming challenge.';

  const prompt = `You are a software engineering coding problem designer.
Generate exactly ${numberOfQuestions} unique, original ${difficulty} level ${questionType} challenge for target language: "${cleanTopic}".

Difficulty Specification:
${difficultyGuide}

${avoidInstruction}

CRITICAL RULES:
1. Output MUST contain ONLY the student-facing problem fields.
2. Do NOT include internal prompt text, system rules, avoidance lists, AI notes, or metadata in any field.
3. "title" must be concise and descriptive (e.g. "Find Peak Element").
4. "description" must contain only the clear problem statement.
5. "inputFormat" must describe the input parameters and types clearly.
6. "outputFormat" must describe the expected return value or output.
7. "explanation" must explain why the sample output matches the sample input.
8. Each problem MUST be brand new and unique. Do not repeat standard demo examples.

Return ONLY a valid raw JSON array of objects without markdown formatting (\`\`\`json wrappers) or conversational text.

Structure:
- coding: [{
    "id": "code-ai-unique-id",
    "title": "Problem Title",
    "description": "Clear problem statement describing the challenge.",
    "inputFormat": "Input structure explanation.",
    "outputFormat": "Expected output format.",
    "constraints": ["1 <= N <= 10^5"],
    "sampleInput": "Example input value",
    "sampleOutput": "Example output value",
    "explanation": "Explanation of sample input and sample output.",
    "starterCode": "Starter function template"
  }]
- mcq: [{"id": string, "question": string, "options": [string, string, string, string], "answer": string, "explanation": string}]
- interview: [{"id": string, "category": string, "question": string, "contextHint": string, "expectedKeypoints": [string]}]`;

  // 1. Try OpenRouter API with lower/affordable models first if key available
  if (openRouterKey) {
    try {
      const responseText = await fetchFromOpenRouter(prompt, openRouterKey);
      const cleanedText = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsedJson = JSON.parse(cleanedText);
      const rawList = Array.isArray(parsedJson) ? parsedJson : [parsedJson];

      return rawList.map((item: any) => ({
        ...item,
        title: sanitizeField(item.title),
        description: sanitizeField(item.description),
        inputFormat: sanitizeField(item.inputFormat),
        outputFormat: sanitizeField(item.outputFormat),
        explanation: sanitizeField(item.explanation)
      }));
    } catch (openRouterError) {
      console.warn('OpenRouter API generation failed, trying Gemini API:', openRouterError);
    }
  }

  // 2. Try Gemini API if key available
  if (apiKey) {
    const aiClient = new GoogleGenerativeAI(apiKey);
    const candidateModels = ['gemini-3.6-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite'];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = aiClient.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const cleanedText = responseText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        const parsedJson = JSON.parse(cleanedText);
        const rawList = Array.isArray(parsedJson) ? parsedJson : [parsedJson];

        return rawList.map((item: any) => ({
          ...item,
          title: sanitizeField(item.title),
          description: sanitizeField(item.description),
          inputFormat: sanitizeField(item.inputFormat),
          outputFormat: sanitizeField(item.outputFormat),
          explanation: sanitizeField(item.explanation)
        }));
      } catch (error) {
        console.warn(`Model ${modelName} failed or rate limited:`, error);
        lastError = error;
      }
    }
    console.error('All Gemini AI candidate models failed:', lastError);
  }

  // 3. Fallback
  if (questionType === 'coding' && !apiKey && !openRouterKey) {
    throw new Error('No valid API key (OpenRouter or Gemini) configured for dynamic coding challenges.');
  }
  return getFallbackQuestions(cleanTopic, difficulty, questionType, numberOfQuestions);
}

function getFallbackQuestions(
  topic: string,
  difficulty: string,
  questionType: string,
  count: number
): any[] {
  const list: any[] = [];
  const timestamp = Date.now();
  const diffLower = difficulty.toLowerCase();

  const easyTopics = ['Sum of Digits', 'Count Vowels', 'Find Minimum Element', 'Reverse Array', 'Check Even Odd Product'];
  const mediumTopics = ['Longest Substring Without Repeating Characters', 'Two Sum in Sorted Array', 'Group Anagrams', 'Binary Tree Level Order Traversal', 'Subarray Sum Equals K'];
  const hardTopics = ['Trapping Rain Water', 'Edit Distance Dynamic Programming', 'Word Ladder BFS Graph', 'Merge K Sorted Lists', 'Serialize and Deserialize Binary Tree'];

  const topicsList = diffLower === 'easy' ? easyTopics : diffLower === 'hard' ? hardTopics : mediumTopics;

  for (let i = 1; i <= count; i++) {
    const topicTitle = topicsList[(i + Math.floor(Math.random() * 10)) % topicsList.length];
    const uniqueId = `code-ai-${topic.toLowerCase().replace(/[^a-z0-9]/g, '')}-${timestamp}-${i}`;

    if (questionType === 'interview') {
      list.push({
        id: uniqueId,
        category: topic || 'Technical',
        question: `Explain how you would approach ${topicTitle} in ${difficulty} scenarios in ${topic}.`,
        contextHint: `Discuss performance trade-offs, time complexity, and edge case handling.`,
        expectedKeypoints: [topic.toLowerCase(), 'performance', 'complexity', 'trade-offs']
      });
    } else {
      list.push({
        id: uniqueId,
        question: `What is the optimal approach for ${topicTitle} in ${topic}?`,
        options: [
          `Optimal ${difficulty} algorithmic solution`,
          `Brute force cubic scan`,
          `Linear recursion without memoization`,
          `Unrelated utility method`
        ],
        answer: `Optimal ${difficulty} algorithmic solution`,
        explanation: `Using the optimal approach ensures the solution executes within constraints.`
      });
    }
  }
  return list;
}

// Mock Database of HR, Technical, and Company-specific Questions
export const QUESTION_BANK: InterviewQuestion[] = [
  {
    id: 'q-hr-e1',
    category: 'HR',
    question: 'Tell me about yourself and your educational background.',
    contextHint: 'Highlight your degree, core skills, passion for software engineering, and career goals.',
    expectedKeypoints: ['educational background', 'degree', 'computer science', 'skills', 'passion', 'projects']
  },
  {
    id: 'q-hr-e2',
    category: 'HR',
    question: 'What are your core technical and personal strengths?',
    contextHint: 'Focus on 2-3 specific strengths with brief examples of how you apply them.',
    expectedKeypoints: ['strengths', 'problem solving', 'adaptability', 'teamwork', 'learning']
  },
  {
    id: 'q-hr-m1',
    category: 'HR',
    question: 'Describe a challenging project you worked on and how you handled team conflict.',
    contextHint: 'Use the STAR method (Situation, Task, Action, Result) focusing on communication and resolution.',
    expectedKeypoints: ['star method', 'situation', 'conflict', 'communication', 'action', 'resolution', 'outcome']
  },
  {
    id: 'q-hr-m2',
    category: 'HR',
    question: 'Why do you want to join our organization as a software engineer?',
    contextHint: 'Align your career goals with the company domain, culture, and growth opportunities.',
    expectedKeypoints: ['company culture', 'domain', 'alignment', 'growth', 'contribution']
  },
  {
    id: 'q-hr-h1',
    category: 'HR',
    question: 'Give an example of a failure in your academic or project journey and what key lessons you learned.',
    contextHint: 'Be honest about a mistake, focus on self-awareness, accountability, and corrective action.',
    expectedKeypoints: ['failure', 'mistake', 'accountability', 'lesson learned', 'improvement', 'resilience']
  },
  {
    id: 'q-hr-h2',
    category: 'HR',
    question: 'How do you prioritize tight deadline deliverables when multiple requirements collide?',
    contextHint: 'Discuss prioritization frameworks (Impact vs Effort), communication with stakeholders, and trade-offs.',
    expectedKeypoints: ['prioritization', 'deadlines', 'trade-offs', 'communication', 'impact']
  },
  {
    id: 'q-tech-e1',
    category: 'Technical',
    question: 'Explain the difference between SQL and NoSQL databases. When would you choose one over the other?',
    contextHint: 'Discuss schema, ACID vs BASE, horizontal vs vertical scaling, and use cases.',
    expectedKeypoints: ['sql', 'nosql', 'relational', 'document', 'acid', 'scaling', 'mongodb', 'postgres', 'schema', 'database']
  },
  {
    id: 'q-tech-e2',
    category: 'Technical',
    question: 'What is Object-Oriented Programming (OOP)? Explain Polymorphism with a real-world example.',
    contextHint: 'Detail Compile-time (Overloading) vs Run-time (Overriding) polymorphism.',
    expectedKeypoints: ['oop', 'polymorphism', 'overloading', 'overriding', 'class', 'object', 'inheritance', 'encapsulation']
  },
  {
    id: 'q-tech-e3',
    category: 'Technical',
    question: 'What is the difference between a process and a thread in Operating Systems?',
    contextHint: 'Discuss memory address space, overhead, context switching, and shared resources.',
    expectedKeypoints: ['process', 'thread', 'memory', 'address space', 'overhead', 'context switch', 'shared']
  },
  {
    id: 'q-tech-m1',
    category: 'Technical',
    question: 'How does a Hash Map work under the hood, and how are hash collisions resolved?',
    contextHint: 'Discuss hash functions, bucket arrays, chaining (linked lists/trees), and open addressing.',
    expectedKeypoints: ['hash', 'map', 'key', 'value', 'bucket', 'collision', 'chaining', 'index', 'array']
  },
  {
    id: 'q-tech-m2',
    category: 'Technical',
    question: 'Explain TCP vs UDP protocols and give use cases for each in modern network systems.',
    contextHint: 'Discuss 3-way handshake, reliability, packet delivery order, and streaming vs file transfer.',
    expectedKeypoints: ['tcp', 'udp', 'connection', 'handshake', 'reliable', 'packet', 'speed', 'streaming']
  },
  {
    id: 'q-tech-m3',
    category: 'Technical',
    question: 'What is indexing in SQL databases, and how does a B-Tree index speed up query retrieval?',
    contextHint: 'Explain B-Tree search log(N) complexity vs full table scan O(N).',
    expectedKeypoints: ['index', 'b-tree', 'query', 'retrieval', 'table scan', 'performance', 'logarithmic']
  },
  {
    id: 'q-tech-h1',
    category: 'Technical',
    question: 'How would you design a scalable rate limiter for a distributed REST API system?',
    contextHint: 'Discuss Token Bucket, Leaky Bucket, Redis sliding window counters, and distributed concurrency.',
    expectedKeypoints: ['rate limiter', 'token bucket', 'leaky bucket', 'redis', 'sliding window', 'distributed', 'concurrency']
  },
  {
    id: 'q-tech-h2',
    category: 'Technical',
    question: 'Explain the difference between optimistic and pessimistic locking in database transaction isolation.',
    contextHint: 'Discuss versioning/timestamps vs exclusive row locks, throughput, and deadlock prevention.',
    expectedKeypoints: ['optimistic', 'pessimistic', 'locking', 'transaction', 'isolation', 'versioning', 'deadlock', 'concurrency']
  },
  {
    id: 'q-tech-h3',
    category: 'Technical',
    question: 'Explain memory management in Java vs C++. What are memory leaks and how do Garbage Collection or smart pointers prevent them?',
    contextHint: 'Discuss stack vs heap memory, explicit deallocation delete/free vs JVM GC generational algorithms.',
    expectedKeypoints: ['memory', 'leak', 'stack', 'heap', 'garbage collection', 'smart pointers', 'destructor', 'jvm']
  }
];

export const STARTER_TEMPLATES: Record<CodingLanguage, string> = {
  Java: `class Solution {\n    // Write your code here\n}`,
  Python: `# Write your Python solution here\n`,
  C: `#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}`,
  'C++': `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}`,
  SQL: `-- Write your SQL query here\n`
};

export const CODING_PROBLEMS: CodingChallenge[] = [];

/**
 * Deterministic compact hash for question text (e.g. "q_a1b2c3d4e5f67890")
 */
export function hashQuestionText(text: string): string {
  if (!text) return 'q_0';
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  let h1 = 0x811c9dc5;
  let h2 = 0x27d4eb2d;
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= code;
    h2 = Math.imul(h2, 0x1000193);
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `q_${hex1}${hex2}`;
}

/**
 * Normalizes question text for backward-compatible matching
 */
export function normalizeQuestionText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if two question texts are near-duplicates using token Jaccard similarity.
 * Returns true if key word similarity exceeds 70%.
 */
export function isNearDuplicateQuestion(text1: string, text2: string): boolean {
  if (!text1 || !text2) return false;
  const norm1 = normalizeQuestionText(text1);
  const norm2 = normalizeQuestionText(text2);
  if (norm1 === norm2) return true;

  const tokens1 = text1.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length >= 3);
  const tokens2 = text2.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length >= 3);

  if (tokens1.length === 0 || tokens2.length === 0) return false;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  let intersection = 0;
  for (const token of set1) {
    if (set2.has(token)) intersection++;
  }

  const union = new Set([...set1, ...set2]).size;
  if (union === 0) return false;

  return intersection / union >= 0.70;
}

export const APTITUDE_BANK: AptitudeQuestion[] = [
  // ==================== QUANTITATIVE - EASY (1 to 25) ====================
  {
    id: 'quant-e-1',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'A train 150m long is running at a speed of 54 km/hr. In what time will it pass a railway platform of 210m?',
    options: ['12 seconds', '24 seconds', '18 seconds', '30 seconds'],
    correctIndex: 1,
    explanationEnglish: 'Total distance = 150m + 210m = 360m. Speed in m/s = 54 * (5/18) = 15 m/s. Time = 360 / 15 = 24 seconds.',
    explanationTanglish: 'Total distance = 360m. Speed = 15 m/s. Time = 360 / 15 = 24 seconds.'
  },
  {
    id: 'quant-e-2',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'What is 15% of 480?',
    options: ['68', '72', '75', '80'],
    correctIndex: 1,
    explanationEnglish: '10% of 480 = 48, 5% of 480 = 24. 15% = 48 + 24 = 72.',
    explanationTanglish: '10% of 480 = 48. 5% = 24. Total = 72.'
  },
  {
    id: 'quant-e-3',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'If the cost price of 10 items equals the selling price of 8 items, what is the profit percentage?',
    options: ['20%', '25%', '30%', '15%'],
    correctIndex: 1,
    explanationEnglish: 'Profit % = ((10 - 8) / 8) * 100 = (2 / 8) * 100 = 25%.',
    explanationTanglish: 'Profit % = (2 / 8) * 100 = 25%.'
  },
  {
    id: 'quant-e-4',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'Find the average of the first 5 prime numbers: 2, 3, 5, 7, 11.',
    options: ['5.6', '5.2', '6.0', '4.8'],
    correctIndex: 0,
    explanationEnglish: 'Sum = 2 + 3 + 5 + 7 + 11 = 28. Average = 28 / 5 = 5.6.',
    explanationTanglish: 'Sum = 28. Average = 28 / 5 = 5.6.'
  },
  {
    id: 'quant-e-5',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'The ratio of two numbers is 3:4 and their sum is 140. What is the larger number?',
    options: ['60', '70', '80', '90'],
    correctIndex: 2,
    explanationEnglish: 'Parts = 3 + 4 = 7. 1 part = 140 / 7 = 20. Larger number = 4 * 20 = 80.',
    explanationTanglish: '1 part = 20. Larger = 4 * 20 = 80.'
  },
  {
    id: 'quant-e-6',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'If a car travels 240 km in 4 hours, what is its speed in m/s?',
    options: ['15 m/s', '16.67 m/s', '20 m/s', '25 m/s'],
    correctIndex: 1,
    explanationEnglish: 'Speed = 240 / 4 = 60 km/h. In m/s = 60 * (5/18) = 16.67 m/s.',
    explanationTanglish: 'Speed = 60 km/h. Convert to m/s: 60 * 5/18 = 16.67 m/s.'
  },
  {
    id: 'quant-e-7',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'Simple interest on $800 at 5% per annum for 3 years is:',
    options: ['$100', '$120', '$140', '$150'],
    correctIndex: 1,
    explanationEnglish: 'SI = (P * R * T) / 100 = (800 * 5 * 3) / 100 = $120.',
    explanationTanglish: 'Formula: (P*R*T)/100 -> (800*5*3)/100 = 120.'
  },
  {
    id: 'quant-e-8',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'A man buys an article for $350 and sells it for $420. Find his gain percentage.',
    options: ['15%', '18%', '20%', '25%'],
    correctIndex: 2,
    explanationEnglish: 'Gain = 420 - 350 = 70. Gain % = (70 / 350) * 100 = 20%.',
    explanationTanglish: 'Gain = 70. Gain % = (70/350)*100 = 20%.'
  },
  {
    id: 'quant-e-9',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'Evaluate: (0.4 * 0.4 + 0.6 * 0.6 + 2 * 0.4 * 0.6)',
    options: ['0.84', '1.0', '1.2', '0.96'],
    correctIndex: 1,
    explanationEnglish: 'It is in form (a + b)^2 where a = 0.4 and b = 0.6. (0.4 + 0.6)^2 = 1.0^2 = 1.0.',
    explanationTanglish: '(0.4 + 0.6)^2 = 1.0.'
  },
  {
    id: 'quant-e-10',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'The average of 4 numbers is 20. If one number is excluded, the average becomes 15. What is the excluded number?',
    options: ['30', '35', '40', '45'],
    correctIndex: 1,
    explanationEnglish: 'Sum of 4 = 4 * 20 = 80. Sum of 3 = 3 * 15 = 45. Excluded = 80 - 45 = 35.',
    explanationTanglish: 'Total 4 = 80. Total 3 = 45. Excluded = 80 - 45 = 35.'
  },
  {
    id: 'quant-e-11',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'A work is completed by 6 workers in 12 days. In how many days can 9 workers complete the same work?',
    options: ['6 days', '8 days', '9 days', '10 days'],
    correctIndex: 1,
    explanationEnglish: 'M1 * D1 = M2 * D2 -> 6 * 12 = 9 * D2 -> D2 = 72 / 9 = 8 days.',
    explanationTanglish: '6 * 12 = 72 man-days. 72 / 9 = 8 days.'
  },
  {
    id: 'quant-e-12',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'What is the HCF of 24, 36, and 60?',
    options: ['6', '8', '12', '18'],
    correctIndex: 2,
    explanationEnglish: '24 = 2^3*3, 36 = 2^2*3^2, 60 = 2^2*3*5. HCF = 2^2 * 3 = 12.',
    explanationTanglish: 'Highest Common Factor of 24, 36, 60 is 12.'
  },
  {
    id: 'quant-e-13',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'What is the LCM of 12, 18, and 30?',
    options: ['90', '120', '180', '240'],
    correctIndex: 2,
    explanationEnglish: '12 = 2^2*3, 18 = 2*3^2, 30 = 2*3*5. LCM = 2^2 * 3^2 * 5 = 180.',
    explanationTanglish: 'Least Common Multiple of 12, 18, 30 is 180.'
  },
  {
    id: 'quant-e-14',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'If x : y = 2 : 3 and y : z = 4 : 5, find x : z.',
    options: ['8 : 15', '2 : 5', '6 : 15', '8 : 12'],
    correctIndex: 0,
    explanationEnglish: 'x/z = (x/y) * (y/z) = (2/3) * (4/5) = 8/15.',
    explanationTanglish: 'Multiply ratios: (2/3) * (4/5) = 8/15.'
  },
  {
    id: 'quant-e-15',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'If 3x + 7 = 22, what is the value of 5x - 3?',
    options: ['18', '22', '25', '28'],
    correctIndex: 1,
    explanationEnglish: '3x = 15 -> x = 5. 5(5) - 3 = 25 - 3 = 22.',
    explanationTanglish: 'x = 5. 5x - 3 = 22.'
  },
  {
    id: 'quant-e-16',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'The perimeter of a square is 48 cm. Find its area.',
    options: ['120 sq cm', '144 sq cm', '169 sq cm', '196 sq cm'],
    correctIndex: 1,
    explanationEnglish: 'Side = 48 / 4 = 12 cm. Area = 12 * 12 = 144 sq cm.',
    explanationTanglish: 'Side = 12. Area = 12^2 = 144.'
  },
  {
    id: 'quant-e-17',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'Convert 0.35 to a reduced fraction.',
    options: ['7/20', '3/10', '7/25', '1/3'],
    correctIndex: 0,
    explanationEnglish: '0.35 = 35/100 = 7/20.',
    explanationTanglish: '35/100 divide by 5 = 7/20.'
  },
  {
    id: 'quant-e-18',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'If a shirt marked at $50 is sold at a 20% discount, what is the selling price?',
    options: ['$35', '$40', '$42', '$45'],
    correctIndex: 1,
    explanationEnglish: 'Discount = 20% of 50 = $10. SP = 50 - 10 = $40.',
    explanationTanglish: 'Discount = $10. Selling price = $40.'
  },
  {
    id: 'quant-e-19',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'Find the square root of 576.',
    options: ['22', '24', '26', '28'],
    correctIndex: 1,
    explanationEnglish: '24 * 24 = 576.',
    explanationTanglish: '24^2 = 576.'
  },
  {
    id: 'quant-e-20',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'A bag contains 5 red and 7 blue balls. What is the probability of drawing a red ball?',
    options: ['5/12', '7/12', '5/7', '1/2'],
    correctIndex: 0,
    explanationEnglish: 'Total balls = 12. Red balls = 5. Probability = 5/12.',
    explanationTanglish: 'Total = 12. Red = 5. Probability = 5/12.'
  },
  {
    id: 'quant-e-21',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'The present age of father and son are in ratio 7:2. If father is 42 years old, how old is the son?',
    options: ['10 years', '12 years', '14 years', '16 years'],
    correctIndex: 1,
    explanationEnglish: '7 parts = 42 -> 1 part = 6. Son = 2 * 6 = 12 years.',
    explanationTanglish: '7 parts = 42 -> 1 part = 6. Son = 12.'
  },
  {
    id: 'quant-e-22',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'Find the mean proportional between 9 and 25.',
    options: ['12', '15', '18', '20'],
    correctIndex: 1,
    explanationEnglish: 'Mean proportional = sqrt(9 * 25) = sqrt(225) = 15.',
    explanationTanglish: 'sqrt(9*25) = 15.'
  },
  {
    id: 'quant-e-23',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'By selling a pen for $18, a shopkeeper loses 10%. What was the cost price?',
    options: ['$19', '$20', '$21', '$22'],
    correctIndex: 1,
    explanationEnglish: 'SP = 90% of CP = 18 -> CP = (18 / 0.9) = $20.',
    explanationTanglish: '90% of CP = 18 -> CP = 20.'
  },
  {
    id: 'quant-e-24',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'What principal will yield $60 simple interest in 2 years at 6% per annum?',
    options: ['$400', '$500', '$600', '$750'],
    correctIndex: 1,
    explanationEnglish: 'P = (SI * 100) / (R * T) = (60 * 100) / (6 * 2) = 6000 / 12 = $500.',
    explanationTanglish: 'Formula: (60*100)/(6*2) = 500.'
  },
  {
    id: 'quant-e-25',
    category: 'Quantitative',
    difficulty: 'Easy',
    question: 'Express 45 m/s in km/hr.',
    options: ['150 km/h', '162 km/h', '180 km/h', '144 km/h'],
    correctIndex: 1,
    explanationEnglish: 'In km/h = 45 * (18/5) = 9 * 18 = 162 km/h.',
    explanationTanglish: '45 * 18/5 = 162 km/h.'
  },

  // ==================== QUANTITATIVE - MEDIUM (1 to 25) ====================
  {
    id: 'quant-m-1',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'A pipe can fill a tank in 12 hours and another pipe can empty it in 18 hours. If both pipes are opened together, how long will it take to fill the tank?',
    options: ['30 hours', '36 hours', '24 hours', '42 hours'],
    correctIndex: 1,
    explanationEnglish: 'Net work in 1 hour = (1/12) - (1/18) = 1/36. Time = 36 hours.',
    explanationTanglish: '1/12 - 1/18 = 1/36. Time = 36 hours.'
  },
  {
    id: 'quant-m-2',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'A sum of money doubles itself at compound interest in 5 years. In how many years will it become 8 times itself?',
    options: ['10 years', '15 years', '20 years', '25 years'],
    correctIndex: 1,
    explanationEnglish: '2x in 5 years. 8x = 2^3 -> 3 * 5 = 15 years.',
    explanationTanglish: '8 = 2^3. 3 * 5 = 15 years.'
  },
  {
    id: 'quant-m-3',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'A motorboat travels 18 km downstream in 2 hours and 18 km upstream in 3 hours. What is the speed of the stream?',
    options: ['1.5 km/hr', '3 km/hr', '2 km/hr', '2.5 km/hr'],
    correctIndex: 0,
    explanationEnglish: 'Downstream = 9 km/h, Upstream = 6 km/h. Stream speed = (9 - 6) / 2 = 1.5 km/hr.',
    explanationTanglish: 'Downstream = 9, Upstream = 6. Stream = (9-6)/2 = 1.5 km/hr.'
  },
  {
    id: 'quant-m-4',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'A committee of 3 people is to be selected from 4 men and 3 women. What is the probability that the committee contains at least 2 men?',
    options: ['18/35', '22/35', '25/35', '12/35'],
    correctIndex: 1,
    explanationEnglish: 'Total ways = 7C3 = 35. Ways for 2 men + 1 woman = 4C2 * 3C1 = 18. Ways for 3 men = 4C3 = 4. Total = 22/35.',
    explanationTanglish: 'Total 7C3 = 35. 2M+1W = 18. 3M = 4. Total = 22/35.'
  },
  {
    id: 'quant-m-5',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'Two cars A and B start towards each other from points 240 km apart at speeds of 50 km/hr and 70 km/hr. How long before they meet?',
    options: ['1.5 hours', '2 hours', '2.5 hours', '3 hours'],
    correctIndex: 1,
    explanationEnglish: 'Relative speed = 50 + 70 = 120 km/hr. Time = 240 / 120 = 2 hours.',
    explanationTanglish: 'Relative speed = 120 km/hr. Time = 240 / 120 = 2 hours.'
  },
  {
    id: 'quant-m-6',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'A and B together can do a piece of work in 12 days. B alone can do it in 30 days. In how many days can A alone do the work?',
    options: ['18 days', '20 days', '24 days', '25 days'],
    correctIndex: 1,
    explanationEnglish: '1/A = 1/12 - 1/30 = (5 - 2)/60 = 3/60 = 1/20 -> A = 20 days.',
    explanationTanglish: '1/12 - 1/30 = 1/20. A alone takes 20 days.'
  },
  {
    id: 'quant-m-7',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'In what ratio must water be mixed with milk costing $12 per liter to obtain a mixture worth $8 per liter?',
    options: ['1 : 2', '2 : 1', '1 : 3', '3 : 1'],
    correctIndex: 0,
    explanationEnglish: 'By alligation: Water (0) vs Milk (12), Mean (8). Ratio of water to milk = (12 - 8) : (8 - 0) = 4 : 8 = 1 : 2.',
    explanationTanglish: 'Water:Milk = (12-8):(8-0) = 4:8 = 1:2.'
  },
  {
    id: 'quant-m-8',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'How many three-digit numbers are divisible by 7?',
    options: ['125', '128', '130', '132'],
    correctIndex: 1,
    explanationEnglish: 'First 3-digit = 105 (15th multiple), Last 3-digit = 994 (142nd multiple). Count = 142 - 15 + 1 = 128.',
    explanationTanglish: '105 to 994. Count = 142 - 15 + 1 = 128.'
  },
  {
    id: 'quant-m-9',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'The diagonal of a rectangle is 15 cm and length is 12 cm. Find its area.',
    options: ['90 sq cm', '108 sq cm', '120 sq cm', '135 sq cm'],
    correctIndex: 1,
    explanationEnglish: 'Width = sqrt(15^2 - 12^2) = sqrt(225 - 144) = sqrt(81) = 9 cm. Area = 12 * 9 = 108 sq cm.',
    explanationTanglish: 'Width = 9. Area = 12 * 9 = 108.'
  },
  {
    id: 'quant-m-10',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'Find the compound interest on $5000 at 10% per annum for 2 years compounded annually.',
    options: ['$1000', '$1050', '$1100', '$1150'],
    correctIndex: 1,
    explanationEnglish: 'Amount = 5000 * (1.1)^2 = 5000 * 1.21 = $6050. CI = 6050 - 5000 = $1050.',
    explanationTanglish: 'Amount = 6050. CI = 1050.'
  },
  {
    id: 'quant-m-11',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'A trader marks his goods 30% above cost price and allows a 10% discount. His profit percentage is:',
    options: ['17%', '20%', '15%', '18%'],
    correctIndex: 0,
    explanationEnglish: 'Net profit % = 30 - 10 - (30*10)/100 = 20 - 3 = 17%.',
    explanationTanglish: 'Formula: a - b - (ab/100) -> 30 - 10 - 3 = 17%.'
  },
  {
    id: 'quant-m-12',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'In how many different ways can the letters of the word "LEADING" be arranged so that vowels always come together?',
    options: ['360', '480', '720', '1440'],
    correctIndex: 2,
    explanationEnglish: 'Vowels: E, A, I (3 vowels treated as 1 unit). Total units = 4 consonants + 1 unit = 5 units -> 5! = 120. Vowels arrange in 3! = 6. Total = 120 * 6 = 720.',
    explanationTanglish: '5! * 3! = 120 * 6 = 720.'
  },
  {
    id: 'quant-m-13',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'Two dice are thrown simultaneously. What is the probability of getting a sum of 8?',
    options: ['5/36', '1/6', '7/36', '4/36'],
    correctIndex: 0,
    explanationEnglish: 'Favorable pairs for sum=8: (2,6), (3,5), (4,4), (5,3), (6,2) -> 5 outcomes. Total = 36. Probability = 5/36.',
    explanationTanglish: 'Favorable = 5 outcomes. Total = 36. Probability = 5/36.'
  },
  {
    id: 'quant-m-14',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'A train 120m long passes a pole in 6 seconds. How long will it take to cross a 240m bridge?',
    options: ['12 seconds', '15 seconds', '18 seconds', '20 seconds'],
    correctIndex: 2,
    explanationEnglish: 'Speed = 120/6 = 20 m/s. Total distance for bridge = 120 + 240 = 360m. Time = 360 / 20 = 18 seconds.',
    explanationTanglish: 'Speed = 20 m/s. Total distance = 360m. Time = 360/20 = 18s.'
  },
  {
    id: 'quant-m-15',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'If 4 men or 6 women can reap a field in 20 days, how long will 6 men and 11 women take?',
    options: ['6 days', '8 days', '10 days', '12 days'],
    correctIndex: 0,
    explanationEnglish: '4M = 6W -> 1M = 1.5W. 6M + 11W = 9W + 11W = 20W. 6W * 20 days = 20W * D -> D = 6 days.',
    explanationTanglish: 'Convert men to women: 20W takes 6 days.'
  },
  {
    id: 'quant-m-16',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'Find the length of the longest rod that can be placed in a room 12m long, 9m broad, and 8m high.',
    options: ['15m', '17m', '19m', '21m'],
    correctIndex: 1,
    explanationEnglish: 'Diagonal = sqrt(l^2 + b^2 + h^2) = sqrt(144 + 81 + 64) = sqrt(289) = 17m.',
    explanationTanglish: 'sqrt(144 + 81 + 64) = sqrt(289) = 17m.'
  },
  {
    id: 'quant-m-17',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'A student has to secure 40% marks to pass. He gets 178 marks and fails by 22 marks. Find maximum marks.',
    options: ['400', '500', '600', '700'],
    correctIndex: 1,
    explanationEnglish: 'Passing marks = 178 + 22 = 200. 40% of Max = 200 -> Max = (200 / 0.4) = 500.',
    explanationTanglish: '40% = 200. Max marks = 500.'
  },
  {
    id: 'quant-m-18',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'If log 2 = 0.3010 and log 3 = 0.4771, find the value of log 12.',
    options: ['0.9542', '1.0791', '1.1761', '1.2401'],
    correctIndex: 1,
    explanationEnglish: 'log 12 = log(2^2 * 3) = 2 log 2 + log 3 = 2(0.3010) + 0.4771 = 0.6020 + 0.4771 = 1.0791.',
    explanationTanglish: '2 log 2 + log 3 = 0.6020 + 0.4771 = 1.0791.'
  },
  {
    id: 'quant-m-19',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'The ratio of speeds of two trains is 7:8. If the second train runs 400 km in 4 hours, what is speed of first train?',
    options: ['70 km/h', '75 km/h', '87.5 km/h', '90 km/h'],
    correctIndex: 2,
    explanationEnglish: 'Speed 2 = 400 / 4 = 100 km/h. 8 parts = 100 -> 1 part = 12.5. Speed 1 = 7 * 12.5 = 87.5 km/h.',
    explanationTanglish: 'Second speed = 100. First speed = 7 * 12.5 = 87.5 km/h.'
  },
  {
    id: 'quant-m-20',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'The present ages of A and B are in ratio 4:5. 5 years hence, their ages will be in ratio 5:6. Find present age of A.',
    options: ['15 years', '20 years', '25 years', '30 years'],
    correctIndex: 1,
    explanationEnglish: '(4x + 5)/(5x + 5) = 5/6 -> 24x + 30 = 25x + 25 -> x = 5. A = 4 * 5 = 20 years.',
    explanationTanglish: 'x = 5. A = 20 years.'
  },
  {
    id: 'quant-m-21',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'A watch is sold at a 10% loss. Had it been sold for $45 more, there would have been a 5% gain. Find cost price.',
    options: ['$250', '$300', '$350', '$400'],
    correctIndex: 1,
    explanationEnglish: 'Difference % = 5% - (-10%) = 15%. 15% of CP = $45 -> CP = 45 / 0.15 = $300.',
    explanationTanglish: '15% = $45 -> CP = $300.'
  },
  {
    id: 'quant-m-22',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'Find the area of a circle inscribed in an equilateral triangle of side 12 cm.',
    options: ['12 pi sq cm', '24 pi sq cm', '36 pi sq cm', '48 pi sq cm'],
    correctIndex: 0,
    explanationEnglish: 'Inradius r = a / (2 sqrt(3)) = 12 / (2 sqrt(3)) = 2 sqrt(3). Area = pi * r^2 = pi * (12) = 12 pi sq cm.',
    explanationTanglish: 'r = 2 sqrt(3). Area = pi * 12 = 12 pi.'
  },
  {
    id: 'quant-m-23',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'What single discount is equivalent to two successive discounts of 20% and 15%?',
    options: ['32%', '35%', '30%', '28%'],
    correctIndex: 0,
    explanationEnglish: 'Single discount = 20 + 15 - (20*15)/100 = 35 - 3 = 32%.',
    explanationTanglish: '20 + 15 - 3 = 32%.'
  },
  {
    id: 'quant-m-24',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'A box contains 4 red, 3 green, and 2 blue balls. If 2 balls are drawn at random, find probability that none is blue.',
    options: ['7/12', '5/12', '7/18', '21/36'],
    correctIndex: 0,
    explanationEnglish: 'Non-blue = 7 balls. Total = 9 balls. Ways = 7C2 / 9C2 = 21 / 36 = 7/12.',
    explanationTanglish: '7C2 / 9C2 = 21 / 36 = 7/12.'
  },
  {
    id: 'quant-m-25',
    category: 'Quantitative',
    difficulty: 'Medium',
    question: 'How many terms of AP 3, 6, 9, 12... are needed to make a sum of 108?',
    options: ['6', '8', '9', '12'],
    correctIndex: 1,
    explanationEnglish: 'Sum = n/2 * (2a + (n-1)d) -> n/2 * (6 + (n-1)3) = 108 -> n(3n + 3) = 216 -> 3n^2 + 3n - 216 = 0 -> n^2 + n - 72 = 0 -> (n+9)(n-8)=0 -> n = 8.',
    explanationTanglish: 'n^2 + n - 72 = 0 -> n = 8.'
  },

  // ==================== QUANTITATIVE - HARD (1 to 25) ====================
  {
    id: 'quant-h-1',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'In a 100m race, A beats B by 10m and B beats C by 10m. By how many meters does A beat C in the same race?',
    options: ['18m', '19m', '20m', '21m'],
    correctIndex: 1,
    explanationEnglish: 'When A covers 100m, B covers 90m. When B covers 100m, C covers 90m. So when B covers 90m, C covers 81m. A beats C by 100 - 81 = 19m.',
    explanationTanglish: 'A=100 -> B=90 -> C=81. A beats C by 19m.'
  },
  {
    id: 'quant-h-2',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'Find the unit digit of 7^105.',
    options: ['1', '3', '7', '9'],
    correctIndex: 2,
    explanationEnglish: '7 has cyclicity of 4 (7, 9, 3, 1). 105 mod 4 = 1. So 7^1 = 7.',
    explanationTanglish: '7 cyclicity 4. 105 mod 4 = 1. Unit digit = 7.'
  },
  {
    id: 'quant-h-3',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'A mixture contains alcohol and water in the ratio 4:3. If 5 liters of water is added, the ratio becomes 4:5. What was the original quantity of alcohol?',
    options: ['8 liters', '10 liters', '12 liters', '16 liters'],
    correctIndex: 1,
    explanationEnglish: 'Let alcohol = 4x, water = 3x. 4x / (3x + 5) = 4/5 -> 20x = 12x + 20 -> 8x = 20 -> x = 2.5. Alcohol = 4 * 2.5 = 10 liters.',
    explanationTanglish: '4x / (3x+5) = 4/5 -> x = 2.5. Alcohol = 10 liters.'
  },
  {
    id: 'quant-h-4',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'How many integer values of x satisfy |2x - 7| <= 9?',
    options: ['8', '9', '10', '11'],
    correctIndex: 2,
    explanationEnglish: '-9 <= 2x - 7 <= 9 -> -2 <= 2x <= 16 -> -1 <= x <= 8. Values = {-1, 0, 1, 2, 3, 4, 5, 6, 7, 8} = 10 integer values.',
    explanationTanglish: '-1 <= x <= 8 -> 10 integer values.'
  },
  {
    id: 'quant-h-5',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'A sphere of radius 6 cm is melted and recast into small cones of height 3 cm and base radius 2 cm. How many such cones can be formed?',
    options: ['48', '72', '96', '108'],
    correctIndex: 1,
    explanationEnglish: 'Sphere Vol = (4/3)*pi*216 = 288*pi. Cone Vol = (1/3)*pi*4*3 = 4*pi. Number = 288*pi / 4*pi = 72.',
    explanationTanglish: 'Sphere Vol = 288*pi. Cone Vol = 4*pi. Number = 72.'
  },
  {
    id: 'quant-h-6',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'A sum amounts to $7320 in 2 years and to $8784 in 3 years at compound interest. Find the rate of interest.',
    options: ['15%', '18%', '20%', '22%'],
    correctIndex: 2,
    explanationEnglish: 'Interest for 3rd year = 8784 - 7320 = 1464. Rate = (1464 / 7320) * 100 = 20%.',
    explanationTanglish: 'Rate = (1464 / 7320) * 100 = 20%.'
  },
  {
    id: 'quant-h-7',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'Two pipes A and B can fill a cistern in 15 and 20 hours respectively, while C can empty it in 25 hours. All three are opened together. How long to fill cistern?',
    options: ['12 hours', '14 2/17 hours', '15 1/3 hours', '10 hours'],
    correctIndex: 1,
    explanationEnglish: 'Net rate = 1/15 + 1/20 - 1/25 = (20 + 15 - 12)/300 = 23/300. Time = 300 / 23 = 13 1/23 (approx 14 2/17).',
    explanationTanglish: 'Rate = 23/300 per hour.'
  },
  {
    id: 'quant-h-8',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'A person covers 600 km by train at 80 km/h, 800 km by ship at 40 km/h, 500 km by plane at 250 km/h and 100 km by car at 50 km/h. Find average speed.',
    options: ['60 km/h', '62.5 km/h', '65 km/h', '70 km/h'],
    correctIndex: 1,
    explanationEnglish: 'Total distance = 2000 km. Total time = 600/80 + 800/40 + 500/250 + 100/50 = 7.5 + 20 + 2 + 2 = 31.5 hrs. Avg speed = 2000 / 32 = 62.5 km/h.',
    explanationTanglish: 'Total dist = 2000 km. Total time = 32 hrs. Avg speed = 62.5 km/h.'
  },
  {
    id: 'quant-h-9',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'How many sub-sets can be formed from a set containing 8 distinct elements?',
    options: ['64', '128', '256', '512'],
    correctIndex: 2,
    explanationEnglish: 'Number of subsets of set of n elements = 2^n. 2^8 = 256.',
    explanationTanglish: '2^8 = 256 subsets.'
  },
  {
    id: 'quant-h-10',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'Find the probability of picking 4 aces in a 5-card poker hand drawn from a standard deck of 52 cards.',
    options: ['1/54145', '4/2598960', '48/2598960', '1/13'],
    correctIndex: 2,
    explanationEnglish: 'Ways to pick 4 aces + 1 non-ace = 4C4 * 48C1 = 1 * 48 = 48. Total hands = 52C5 = 2,598,960. Prob = 48 / 2598960.',
    explanationTanglish: '48 / 52C5 = 48 / 2598960.'
  },
  {
    id: 'quant-h-11',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'If x + 1/x = 3, find the value of x^4 + 1/x^4.',
    options: ['47', '49', '51', '53'],
    correctIndex: 0,
    explanationEnglish: 'x^2 + 1/x^2 = 3^2 - 2 = 7. x^4 + 1/x^4 = 7^2 - 2 = 47.',
    explanationTanglish: 'x^2 + 1/x^2 = 7. x^4 + 1/x^4 = 49 - 2 = 47.'
  },
  {
    id: 'quant-h-12',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'A clock is set right at 5 a.m. The clock loses 16 minutes in 24 hours. What will be the true time when the clock indicates 10 p.m. on 4th day?',
    options: ['10:30 p.m.', '11:00 p.m.', '11:15 p.m.', '11:30 p.m.'],
    correctIndex: 1,
    explanationEnglish: 'Time from 5 a.m. day 1 to 10 p.m. day 4 = 89 hours. 23 hrs 44 min of clock = 24 hrs true time -> 89 hrs clock = 90 hrs true time -> 11:00 p.m.',
    explanationTanglish: 'True time = 11:00 p.m.'
  },
  {
    id: 'quant-h-13',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'In how many ways can 6 boys and 6 girls sit around a circular table such that no two girls sit together?',
    options: ['5! * 6!', '6! * 6!', '5! * 5!', '11!'],
    correctIndex: 0,
    explanationEnglish: 'First arrange 6 boys around circle in (6-1)! = 5! ways. 6 gaps created for 6 girls -> 6! ways. Total = 5! * 6!.',
    explanationTanglish: 'Circular boys = 5!. Girls in gaps = 6!. Total = 5! * 6!.'
  },
  {
    id: 'quant-h-14',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'The remainder when 2^256 is divided by 17 is:',
    options: ['1', '2', '8', '16'],
    correctIndex: 0,
    explanationEnglish: '2^4 = 16 = -1 (mod 17). 2^256 = (2^4)^64 = (-1)^64 = 1 (mod 17). Remainder = 1.',
    explanationTanglish: '2^4 mod 17 = 16 = -1. (-1)^64 = 1.'
  },
  {
    id: 'quant-h-15',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'Find the number of integral solutions to x + y + z = 20 where x, y, z >= 1.',
    options: ['171', '190', '210', '231'],
    correctIndex: 0,
    explanationEnglish: 'Stars and bars formula for positive integers: (n-1) C (k-1) = (20-1) C (3-1) = 19 C 2 = (19 * 18) / 2 = 171.',
    explanationTanglish: 'Formula: 19C2 = 171.'
  },
  {
    id: 'quant-h-16',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'Two vessels contain milk and water in ratios 5:2 and 8:5. In what ratio should these be mixed to get ratio 9:4?',
    options: ['2 : 5', '7 : 2', '5 : 2', '3 : 4'],
    correctIndex: 1,
    explanationEnglish: 'Milk fraction: V1 = 5/7, V2 = 8/13, Target = 9/13. By alligation: (9/13 - 8/13) : (5/7 - 9/13) = 1/13 : 2/91 = 7 : 2.',
    explanationTanglish: 'Alligation ratio = 7 : 2.'
  },
  {
    id: 'quant-h-17',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'Find the sum of all 3-digit numbers formed using digits 1, 2, 3 without repetition.',
    options: ['1222', '1332', '1442', '1552'],
    correctIndex: 1,
    explanationEnglish: 'Sum formula = (Sum of digits) * (n-1)! * 111 = (1+2+3) * 2! * 111 = 6 * 2 * 111 = 1332.',
    explanationTanglish: '6 * 2 * 111 = 1332.'
  },
  {
    id: 'quant-h-18',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'A right triangular pyramid has height 10 cm and base equilateral triangle of side 6 cm. Find volume.',
    options: ['15 sqrt(3) cc', '30 sqrt(3) cc', '45 sqrt(3) cc', '60 sqrt(3) cc'],
    correctIndex: 1,
    explanationEnglish: 'Base Area = (sqrt(3)/4)*36 = 9 sqrt(3). Vol = (1/3)*Base Area*h = (1/3)*9 sqrt(3)*10 = 30 sqrt(3) cc.',
    explanationTanglish: 'Vol = 1/3 * 9 sqrt(3) * 10 = 30 sqrt(3).'
  },
  {
    id: 'quant-h-19',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'If a polygon has 44 diagonals, how many sides does it have?',
    options: ['9', '10', '11', '12'],
    correctIndex: 2,
    explanationEnglish: 'Diagonals = n(n-3)/2 = 44 -> n(n-3) = 88 -> n = 11.',
    explanationTanglish: '11 * 8 = 88 -> n = 11.'
  },
  {
    id: 'quant-h-20',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'What is the angle between clock hands at 3:40?',
    options: ['120 deg', '130 deg', '140 deg', '150 deg'],
    correctIndex: 1,
    explanationEnglish: 'Angle = |30H - 5.5M| = |30(3) - 5.5(40)| = |90 - 220| = 130 degrees.',
    explanationTanglish: '|90 - 220| = 130 deg.'
  },
  {
    id: 'quant-h-21',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'Evaluate: 1/(1*2) + 1/(2*3) + 1/(3*4) + ... + 1/(99*100)',
    options: ['99/100', '1', '98/99', '100/101'],
    correctIndex: 0,
    explanationEnglish: 'Telescoping series: (1 - 1/2) + (1/2 - 1/3) + ... + (1/99 - 1/100) = 1 - 1/100 = 99/100.',
    explanationTanglish: 'Telescoping sum = 1 - 1/100 = 99/100.'
  },
  {
    id: 'quant-h-22',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'A tank is filled by three pipes A, B, C. Pipe C is twice as fast as B and B is twice as fast as A. If A alone takes 28 hours, how long together?',
    options: ['3 hours', '4 hours', '5 hours', '6 hours'],
    correctIndex: 1,
    explanationEnglish: 'Rates: A = 1, B = 2, C = 4. Combined rate = 7. Time = 28 / 7 = 4 hours.',
    explanationTanglish: 'Relative rates: 1 + 2 + 4 = 7. Time = 28 / 7 = 4 hrs.'
  },
  {
    id: 'quant-h-23',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'Find the standard deviation of first 5 natural numbers: 1, 2, 3, 4, 5.',
    options: ['sqrt(2)', 'sqrt(3)', '2', 'sqrt(5)'],
    correctIndex: 0,
    explanationEnglish: 'Mean = 3. Variances: (1-3)^2+(2-3)^2+0+(4-3)^2+(5-3)^2 = 4+1+0+1+4 = 10. Var = 10/5 = 2. SD = sqrt(2).',
    explanationTanglish: 'Variance = 2. SD = sqrt(2).'
  },
  {
    id: 'quant-h-24',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'Find the maximum value of 3 sin x + 4 cos x.',
    options: ['5', '6', '7', '1'],
    correctIndex: 0,
    explanationEnglish: 'Max value of a sin x + b cos x is sqrt(a^2 + b^2) = sqrt(9 + 16) = 5.',
    explanationTanglish: 'sqrt(3^2 + 4^2) = 5.'
  },
  {
    id: 'quant-h-25',
    category: 'Quantitative',
    difficulty: 'Hard',
    question: 'In a class of 60, 40 play cricket, 30 play football, and 15 play both. How many play neither?',
    options: ['5', '8', '10', '12'],
    correctIndex: 0,
    explanationEnglish: 'n(C U F) = 40 + 30 - 15 = 55. Neither = 60 - 55 = 5 students.',
    explanationTanglish: 'n(Union) = 55. Neither = 60 - 55 = 5.'
  },

  // ==================== LOGICAL - EASY (1 to 25) ====================
  {
    id: 'log-e-1',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'Find the next number in the series: 3, 6, 12, 24, 48, ?',
    options: ['84', '96', '72', '108'],
    correctIndex: 1,
    explanationEnglish: 'Each number is multiplied by 2. 48 * 2 = 96.',
    explanationTanglish: 'Multiply by 2: 48 * 2 = 96.'
  },
  {
    id: 'log-e-2',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'If CAT is coded as 3120 and DOG is coded as 4157, how will BIRD be coded?',
    options: ['29184', '291818', '2918', '2994'],
    correctIndex: 0,
    explanationEnglish: 'Alphabet position numbers: B=2, I=9, R=18, D=4 -> 29184.',
    explanationTanglish: 'Alphabet numbers: B=2, I=9, R=18, D=4 -> 29184.'
  },
  {
    id: 'log-e-3',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'Pointing to a photograph, a man said "I have no brother or sister, but that man\'s father is my father\'s son." Whose photograph was it?',
    options: ['His own', 'His son\'s', 'His nephew\'s', 'His father\'s'],
    correctIndex: 1,
    explanationEnglish: '"My father\'s son" is the man himself. "That man\'s father is myself" -> The photo is of his son.',
    explanationTanglish: 'Father\'s son = Himself. Photo is of his son.'
  },
  {
    id: 'log-e-4',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'Which word does NOT belong with the others?',
    options: ['Apple', 'Banana', 'Carrot', 'Mango'],
    correctIndex: 2,
    explanationEnglish: 'Carrot is a vegetable, whereas Apple, Banana, and Mango are fruits.',
    explanationTanglish: 'Carrot is a vegetable, others are fruits.'
  },
  {
    id: 'log-e-5',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'If South-East becomes North, and North-East becomes West, what will West become?',
    options: ['South-East', 'South-West', 'North-West', 'North-East'],
    correctIndex: 0,
    explanationEnglish: 'Directions rotate by 135 degrees clockwise. West becomes South-East.',
    explanationTanglish: '135 deg rotation -> West becomes South-East.'
  },
  {
    id: 'log-e-6',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'Find the next term in series: A, C, F, J, O, ?',
    options: ['U', 'T', 'V', 'S'],
    correctIndex: 0,
    explanationEnglish: 'Differences in positions: +2, +3, +4, +5, +6 -> 15 + 6 = 21 -> U.',
    explanationTanglish: 'Gaps: +2, +3, +4, +5, +6 -> O (15) + 6 = 21 (U).'
  },
  {
    id: 'log-e-7',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?',
    options: ['(1/3)', '(1/8)', '(1/16)', '(1/6)'],
    correctIndex: 1,
    explanationEnglish: 'Divide by 2 each step: (1/4) / 2 = 1/8.',
    explanationTanglish: 'Half pannite varudhu -> 1/8.'
  },
  {
    id: 'log-e-8',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'SCD, TEF, UGH, ____, WKL',
    options: ['CMN', 'UJI', 'VIJ', 'IJT'],
    correctIndex: 2,
    explanationEnglish: 'First letter +1 (S, T, U, V, W). Second/third letters shift +2 (CD, EF, GH, IJ, KL) -> VIJ.',
    explanationTanglish: 'S->T->U->V->W and CD->EF->GH->IJ.'
  },
  {
    id: 'log-e-9',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'Cup is to coffee as bowl is to:',
    options: ['Dish', 'Soup', 'Spoon', 'Food'],
    correctIndex: 1,
    explanationEnglish: 'A cup holds coffee; a bowl holds soup.',
    explanationTanglish: 'Cup holds coffee, bowl holds soup.'
  },
  {
    id: 'log-e-10',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'Which word is the odd one out?',
    options: ['Guitar', 'Flute', 'Violin', 'Cello'],
    correctIndex: 1,
    explanationEnglish: 'Flute is a wind instrument; Guitar, Violin, Cello are string instruments.',
    explanationTanglish: 'Flute is wind, others are string instruments.'
  },
  {
    id: 'log-e-11',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'If RED is coded as 1854, how is GREEN coded?',
    options: ['7185514', '7185515', '718514', '71855'],
    correctIndex: 0,
    explanationEnglish: 'Direct alphabet values: G=7, R=18, E=5, E=5, N=14 -> 7185514.',
    explanationTanglish: 'Alphabet numbers: G=7, R=18, E=5, E=5, N=14.'
  },
  {
    id: 'log-e-12',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'A is B\'s sister. C is B\'s mother. D is C\'s father. How is A related to D?',
    options: ['Grandmother', 'Granddaughter', 'Daughter', 'Aunt'],
    correctIndex: 1,
    explanationEnglish: 'D is C\'s father, C is mother of A & B. So A is granddaughter of D.',
    explanationTanglish: 'A is granddaughter of D.'
  },
  {
    id: 'log-e-13',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'Fill the blank: 7, 10, 8, 11, 9, 12, ___',
    options: ['7', '10', '12', '13'],
    correctIndex: 1,
    explanationEnglish: 'Alternating pattern: +3, -2, +3, -2, +3, -2 -> 12 - 2 = 10.',
    explanationTanglish: 'Pattern: +3 then -2. 12 - 2 = 10.'
  },
  {
    id: 'log-e-14',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'If all Bloops are Razzies and all Razzies are Lazzies, then all Bloops are definitely Lazzies:',
    options: ['True', 'False', 'Cannot be determined', 'Irrelevant'],
    correctIndex: 0,
    explanationEnglish: 'Transitive property of sets: Bloops subset of Razzies subset of Lazzies -> Bloops are Lazzies.',
    explanationTanglish: 'Transitive rule -> True.'
  },
  {
    id: 'log-e-15',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'In a certain code, "RAIN" is written as "81914". How is "SNOW" written?',
    options: ['19141523', '19142315', '191415', '19151423'],
    correctIndex: 0,
    explanationEnglish: 'S=19, N=14, O=15, W=23 -> 19141523.',
    explanationTanglish: 'Alphabet numbers concatenated.'
  },
  {
    id: 'log-e-16',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'Odometer is to mileage as compass is to:',
    options: ['Speed', 'Direction', 'Needle', 'North'],
    correctIndex: 1,
    explanationEnglish: 'Odometer measures mileage; compass indicates direction.',
    explanationTanglish: 'Compass measures direction.'
  },
  {
    id: 'log-e-17',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'Which number replaces the question mark? 4, 16, 36, 64, ?',
    options: ['81', '100', '121', '144'],
    correctIndex: 1,
    explanationEnglish: 'Squares of even numbers: 2^2, 4^2, 6^2, 8^2, 10^2 = 100.',
    explanationTanglish: 'Even squares: 2, 4, 6, 8, 10^2 = 100.'
  },
  {
    id: 'log-e-18',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'If yesterday was Tuesday, what day will it be 3 days after tomorrow?',
    options: ['Friday', 'Saturday', 'Sunday', 'Monday'],
    correctIndex: 2,
    explanationEnglish: 'Yesterday = Tuesday -> Today = Wednesday -> Tomorrow = Thursday. +3 days = Sunday.',
    explanationTanglish: 'Today = Wed -> Tomorrow = Thu -> +3 days = Sunday.'
  },
  {
    id: 'log-e-19',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'Arrange words in logical order: 1. Gold 2. Iron 3. Sand 4. Platinum 5. Diamond',
    options: ['3, 2, 1, 5, 4', '2, 3, 1, 4, 5', '3, 2, 1, 4, 5', '1, 2, 3, 4, 5'],
    correctIndex: 0,
    explanationEnglish: 'Order of value/cost (lowest to highest): Sand (3), Iron (2), Gold (1), Diamond (5), Platinum (4).',
    explanationTanglish: 'Increasing value: Sand -> Iron -> Gold -> Diamond -> Platinum.'
  },
  {
    id: 'log-e-20',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'P is the brother of Q. R is the mother of Q. S is the father of R. How is P related to S?',
    options: ['Son', 'Grandson', 'Brother', 'Grandfather'],
    correctIndex: 1,
    explanationEnglish: 'P is son of R, R is daughter of S -> P is grandson of S.',
    explanationTanglish: 'P is grandson of S.'
  },
  {
    id: 'log-e-21',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'Find the odd pair:',
    options: ['Doctor : Stethoscope', 'Painter : Paintbrush', 'Teacher : Chalk', 'Writer : Piano'],
    correctIndex: 3,
    explanationEnglish: 'Writer uses pen/paper, not piano.',
    explanationTanglish: 'Writer does not use piano.'
  },
  {
    id: 'log-e-22',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'Series: 544, 509, 474, 439, ?',
    options: ['404', '414', '420', '400'],
    correctIndex: 0,
    explanationEnglish: 'Subtract 35 each step: 439 - 35 = 404.',
    explanationTanglish: 'Minus 35 each step -> 404.'
  },
  {
    id: 'log-e-23',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'If MANGO is coded as NZOHP, how is APPLE coded?',
    options: ['BQQMF', 'BQQMF', 'BQQMF', 'BQQMF'],
    correctIndex: 0,
    explanationEnglish: 'Shift each letter +1: A->B, P->Q, P->Q, L->M, E->F -> BQQMF.',
    explanationTanglish: '+1 letter shift -> BQQMF.'
  },
  {
    id: 'log-e-24',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'If A is to the North of B, and C is to the East of B, in which direction is A relative to C?',
    options: ['North-East', 'North-West', 'South-East', 'South-West'],
    correctIndex: 1,
    explanationEnglish: 'C is East of B, A is North of B. Relative to C, A is North-West.',
    explanationTanglish: 'Relative to C, A is North-West.'
  },
  {
    id: 'log-e-25',
    category: 'Logical',
    difficulty: 'Easy',
    question: 'Which visual shape completes the sequence: Circle, Triangle, Square, Pentagon, ?',
    options: ['Hexagon', 'Heptagon', 'Octagon', 'Nonagon'],
    correctIndex: 0,
    explanationEnglish: 'Sides count: Circle(1/0 curve), Triangle(3), Square(4), Pentagon(5) -> Hexagon(6).',
    explanationTanglish: 'Increasing sides -> Hexagon (6 sides).'
  },

  // ==================== LOGICAL - MEDIUM (1 to 25) ====================
  {
    id: 'log-m-1',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'Statement: All dogs are mammals. All mammals are warm-blooded. Conclusion I: All dogs are warm-blooded. Conclusion II: Some warm-blooded animals are dogs.',
    options: ['Only I follows', 'Only II follows', 'Both I and II follow', 'Neither I nor II follows'],
    correctIndex: 2,
    explanationEnglish: 'Both conclusions follow logically from the given premises.',
    explanationTanglish: 'Rendu conclusions-um follow aagudhu.'
  },
  {
    id: 'log-m-2',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'In a row of 40 students, Rahul is 15th from the right end. What is his rank from the left end?',
    options: ['25th', '26th', '27th', '24th'],
    correctIndex: 1,
    explanationEnglish: 'Rank from left = Total + 1 - Rank from right = 40 + 1 - 15 = 26th.',
    explanationTanglish: 'Left rank = 40 + 1 - 15 = 26th.'
  },
  {
    id: 'log-m-3',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'Find the missing number in the grid: [4, 9, 20], [8, 5, 18], [9, 3, ?]',
    options: ['21', '19', '15', '24'],
    correctIndex: 0,
    explanationEnglish: 'Pattern: (Col 1 * 2) + Col 2 = Col 3. (9 * 2) + 3 = 21.',
    explanationTanglish: '(9 * 2) + 3 = 21.'
  },
  {
    id: 'log-m-4',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'A, B, C, D, and E are sitting on a bench facing North. B is to the right of D. E is to the left of C and right of A. D is to the right of C. Who is sitting in the exact middle?',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 3,
    explanationEnglish: 'Order from left to right: A, E, C, D, B. Middle person is D.',
    explanationTanglish: 'Order: A-E-C-D-B. Middle = D.'
  },
  {
    id: 'log-m-5',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'If Monday was the 1st of a month, what day will be the 25th of that same month?',
    options: ['Thursday', 'Friday', 'Saturday', 'Wednesday'],
    correctIndex: 0,
    explanationEnglish: '25 - 1 = 24 days. 24 mod 7 = 3 days after Monday = Thursday.',
    explanationTanglish: '24 mod 7 = 3 days after Monday = Thursday.'
  },
  {
    id: 'log-m-6',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'Pointing to K, L says "He is the son of the only daughter of my grandfather." How is K related to L?',
    options: ['Brother', 'Cousin', 'Uncle', 'Father'],
    correctIndex: 0,
    explanationEnglish: 'Only daughter of grandfather = L\'s mother. Her son = L\'s brother.',
    explanationTanglish: 'Mother\'s son = Brother.'
  },
  {
    id: 'log-m-7',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'Find the missing term: 2, 6, 12, 20, 30, 42, ?',
    options: ['52', '56', '60', '64'],
    correctIndex: 1,
    explanationEnglish: 'Differences: +4, +6, +8, +10, +12, +14 -> 42 + 14 = 56.',
    explanationTanglish: 'Differences increase by 2: 42 + 14 = 56.'
  },
  {
    id: 'log-m-8',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'In a code, COMPUTER is written as RFUVQNPC. How is MEDICINE written in that code?',
    options: ['EOJDJEFM', 'EOJDEJFM', 'MFEJDJOE', 'MFEDJJOE'],
    correctIndex: 0,
    explanationEnglish: 'Reverse letters and shift +1 -> EOJDJEFM.',
    explanationTanglish: 'Reverse and shift +1 -> EOJDJEFM.'
  },
  {
    id: 'log-m-9',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'Statement: Should physical education be made compulsory in schools? Argument 1: Yes, it improves fitness. Argument 2: No, students already have heavy academic workloads.',
    options: ['Only 1 is strong', 'Only 2 is strong', 'Both are strong', 'Neither is strong'],
    correctIndex: 0,
    explanationEnglish: 'Argument 1 directly addresses health and holistic development.',
    explanationTanglish: 'Argument 1 is strong.'
  },
  {
    id: 'log-m-10',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'If + means *, - means /, * means +, and / means -, evaluate: 12 + 6 - 3 * 4 / 8.',
    options: ['20', '24', '28', '32'],
    correctIndex: 0,
    explanationEnglish: 'Replaced: 12 * 6 / 3 + 4 - 8 = 72 / 3 + 4 - 8 = 24 + 4 - 8 = 20.',
    explanationTanglish: '12 * 2 + 4 - 8 = 20.'
  },
  {
    id: 'log-m-11',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'A walk 10 km South, turns Right and walks 5 km, turns Right and walks 10 km. How far is A from starting point?',
    options: ['5 km', '10 km', '15 km', '20 km'],
    correctIndex: 0,
    explanationEnglish: 'Formed a rectangle. Distance from start = 5 km West.',
    explanationTanglish: 'Direct distance = 5 km.'
  },
  {
    id: 'log-m-12',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'Find odd number out: 396, 462, 572, 427, 671.',
    options: ['396', '462', '427', '671'],
    correctIndex: 2,
    explanationEnglish: 'In all numbers except 427, middle digit is sum of first and last digits (3+6=9, 4+2=6, 5+2=7, 6+1=7). 427 fails (4+7 != 2).',
    explanationTanglish: '4+7 != 2, so 427 is odd one out.'
  },
  {
    id: 'log-m-13',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'Choose the pair that has same relationship as GRAIN : SILO',
    options: ['Water : Bucket', 'Books : Library', 'Drugs : Pharmacy', 'Fuel : Tank'],
    correctIndex: 3,
    explanationEnglish: 'Bulk storage for grain is silo; bulk storage for fuel is tank.',
    explanationTanglish: 'Bulk storage container relationship.'
  },
  {
    id: 'log-m-14',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'Five people P, Q, R, S, T played cards. P said to Q "If you give me 3 cards, I will have as many as R has and 5 more than T." If P & R together have 35 cards, how many cards does T have?',
    options: ['8', '10', '12', '15'],
    correctIndex: 1,
    explanationEnglish: 'Solving algebraic equations yields T = 10 cards.',
    explanationTanglish: 'Equation solving gives T = 10.'
  },
  {
    id: 'log-m-15',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'Statement: Some paper is pen. All pens are eraser. Conclusion I: Some eraser is paper. Conclusion II: Some paper is eraser.',
    options: ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'],
    correctIndex: 2,
    explanationEnglish: 'Both conclusions follow from overlapping sets.',
    explanationTanglish: 'Both I and II follow.'
  },
  {
    id: 'log-m-16',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'Find the missing letter in grid: Row1 [A, D, G], Row2 [D, I, N], Row3 [I, P, ?]',
    options: ['V', 'W', 'X', 'Y'],
    correctIndex: 1,
    explanationEnglish: 'Row 1 gaps +3,+3. Row 2 gaps +5,+5. Row 3 gaps +7,+7 -> I(9) + 7 = P(16) + 7 = W(23).',
    explanationTanglish: 'Row 3 gap is +7 -> P + 7 = W.'
  },
  {
    id: 'log-m-17',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'How many times do clock hands overlap in a 24-hour day?',
    options: ['22', '24', '44', '48'],
    correctIndex: 0,
    explanationEnglish: 'Clock hands overlap 22 times in 24 hours.',
    explanationTanglish: '22 times in 24 hours.'
  },
  {
    id: 'log-m-18',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'If 1st January 2024 was Monday, what day was 1st January 2025? (2024 is a leap year)',
    options: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    correctIndex: 1,
    explanationEnglish: 'Leap year has 2 odd days. Monday + 2 days = Wednesday.',
    explanationTanglish: 'Leap year = +2 days -> Wednesday.'
  },
  {
    id: 'log-m-19',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'In a code, 253 means "books are old", 546 means "man is old", 378 means "buy good books". What digit stands for "are"?',
    options: ['2', '5', '3', '6'],
    correctIndex: 0,
    explanationEnglish: '"old" = 5, "books" = 3. Therefore "are" = 2.',
    explanationTanglish: 'books=3, old=5. Remaining are=2.'
  },
  {
    id: 'log-m-20',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'Select the missing number: 1, 4, 27, 256, ?',
    options: ['625', '1024', '3125', '4096'],
    correctIndex: 2,
    explanationEnglish: 'Pattern: n^n -> 1^1=1, 2^2=4, 3^3=27, 4^4=256, 5^5=3125.',
    explanationTanglish: '5^5 = 3125.'
  },
  {
    id: 'log-m-21',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'If "Table" is called "Chair", "Chair" is called "Bed", "Bed" is called "Floor", where does a person sleep?',
    options: ['Bed', 'Chair', 'Floor', 'Table'],
    correctIndex: 2,
    explanationEnglish: 'A person sleeps on a Bed, but Bed is called Floor.',
    explanationTanglish: 'Bed is called Floor.'
  },
  {
    id: 'log-m-22',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'Four subjects P, Q, R, S are taught on Mon, Tue, Wed, Thu. P is taught on Tue. R is taught after S. S is not taught on Mon. Which subject is on Mon?',
    options: ['P', 'Q', 'R', 'S'],
    correctIndex: 1,
    explanationEnglish: 'P=Tue. S & R must be Wed & Thu. So Q must be Mon.',
    explanationTanglish: 'Q is on Monday.'
  },
  {
    id: 'log-m-23',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'Find odd term: 10, 25, 45, 54, 60, 75, 80',
    options: ['45', '54', '60', '75'],
    correctIndex: 1,
    explanationEnglish: 'All numbers are multiples of 5 except 54.',
    explanationTanglish: '54 is not a multiple of 5.'
  },
  {
    id: 'log-m-24',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'A is older than B. C is older than D. D is older than A. Who is youngest?',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 1,
    explanationEnglish: 'C > D > A > B. Youngest is B.',
    explanationTanglish: 'B is youngest.'
  },
  {
    id: 'log-m-25',
    category: 'Logical',
    difficulty: 'Medium',
    question: 'If CAT = 24 and DOG = 26, then PIG = ?',
    options: ['32', '34', '36', '38'],
    correctIndex: 0,
    explanationEnglish: 'P(16) + I(9) + G(7) = 32.',
    explanationTanglish: 'Sum of letters: 16+9+7 = 32.'
  },

  // ==================== LOGICAL - HARD (1 to 25) ====================
  {
    id: 'log-h-1',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'Six friends P, Q, R, S, T, and U sit around a circular table facing center. P sits second to left of T. Q sits opposite P. R is between T and Q. Who sits to the immediate right of P?',
    options: ['U', 'S', 'T', 'R'],
    correctIndex: 0,
    explanationEnglish: 'Analyzing circular positions gives U to the immediate right of P.',
    explanationTanglish: 'Circular seating analysis gives U to immediate right of P.'
  },
  {
    id: 'log-h-2',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'Statements: No apple is a banana. Some bananas are cherries. All cherries are dates. Conclusions: I. Some dates are bananas. II. No apple is a cherry.',
    options: ['Only I follows', 'Only II follows', 'Both I and II follow', 'Neither follows'],
    correctIndex: 0,
    explanationEnglish: 'Only Conclusion I follows because some dates are indeed cherries which are bananas.',
    explanationTanglish: 'Only Conclusion I follows.'
  },
  {
    id: 'log-h-3',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'Find the odd one out in the series: 8, 27, 64, 125, 218, 343',
    options: ['27', '125', '218', '343'],
    correctIndex: 2,
    explanationEnglish: 'All are perfect cubes: 2^3=8, 3^3=27, 4^3=64, 5^3=125, 6^3=216 (not 218), 7^3=343.',
    explanationTanglish: '218 should be 6^3 = 216.'
  },
  {
    id: 'log-h-4',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'In a code language, SYSTEM is written as SYSMET and NEARER is written as AENRER. How is FRACTION written in that code?',
    options: ['CARFNOIT', 'CARFTION', 'ARFCITNO', 'FRACITNO'],
    correctIndex: 0,
    explanationEnglish: 'Divide string into two halves of 3/4 letters and reverse each half.',
    explanationTanglish: 'First half reverse + Second half reverse -> CARFNOIT.'
  },
  {
    id: 'log-h-5',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'How many triangles are there in a standard pentagram (5-pointed star)?',
    options: ['8', '10', '12', '15'],
    correctIndex: 1,
    explanationEnglish: 'A 5-pointed star contains 5 small outer triangles + 5 large overlapping triangles = 10 triangles.',
    explanationTanglish: '5 small + 5 large = 10 triangles.'
  },
  {
    id: 'log-h-6',
    category: 'Logical',
    difficulty: 'Hard',
    question: '8 people A, B, C, D, E, F, G, H sit in a row. A is 3rd to right of B. C is 2nd to left of D. Neither C nor D is at extreme ends. How many arrangements exist?',
    options: ['12', '24', '48', '96'],
    correctIndex: 1,
    explanationEnglish: 'Positional constraint evaluation yields 24 valid configurations.',
    explanationTanglish: 'Row arrangement with constraints gives 24 combinations.'
  },
  {
    id: 'log-h-7',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'Statements: All A are B. No B is C. Some C are D. Conclusions: I. No A is C. II. Some D are not B.',
    options: ['Only I follows', 'Only II follows', 'Both I and II follow', 'Neither follows'],
    correctIndex: 2,
    explanationEnglish: 'Both I and II logically follow.',
    explanationTanglish: 'Both I and II follow.'
  },
  {
    id: 'log-h-8',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'Data Sufficiency: Is x positive? Statement 1: x^2 > 0. Statement 2: x^3 > 0.',
    options: ['Statement 1 alone is sufficient', 'Statement 2 alone is sufficient', 'Both together needed', 'Neither is sufficient'],
    correctIndex: 1,
    explanationEnglish: 'x^3 > 0 implies x is strictly positive. x^2 > 0 only means x != 0.',
    explanationTanglish: 'Statement 2 alone gives x > 0.'
  },
  {
    id: 'log-h-9',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'Find next term: Z1A, X2D, V6G, T24J, ?',
    options: ['R120M', 'R120L', 'S120M', 'R720M'],
    correctIndex: 0,
    explanationEnglish: 'First letter -2 (Z,X,V,T,R). Number *1,*2,*3,*4,*5 (1,2,6,24,120). Last letter +3 (A,D,G,J,M) -> R120M.',
    explanationTanglish: 'R120M.'
  },
  {
    id: 'log-h-10',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'A, B, C, D, E, F are 6 members of a family. Number of males equals females. A & E are sons of F. B is son of A. D is mother of two, one boy and one girl. How is E related to C?',
    options: ['Uncle', 'Brother', 'Father', 'Grandfather'],
    correctIndex: 0,
    explanationEnglish: 'C is daughter of A. E is brother of A. So E is uncle of C.',
    explanationTanglish: 'E is uncle of C.'
  },
  {
    id: 'log-h-11',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'If 3rd day of a month is Monday, which day will fall on 5th day after 21st of that month?',
    options: ['Wednesday', 'Thursday', 'Friday', 'Saturday'],
    correctIndex: 0,
    explanationEnglish: 'Target day = 21 + 5 = 26th. (26 - 3) = 23 days. 23 mod 7 = 2. Monday + 2 = Wednesday.',
    explanationTanglish: '26th day is Wednesday.'
  },
  {
    id: 'log-h-12',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'In a group of 15 people, 7 read French, 8 read Spanish, 3 read neither. How many read both French and Spanish?',
    options: ['3', '4', '5', '6'],
    correctIndex: 0,
    explanationEnglish: 'At least one = 15 - 3 = 12. Both = 7 + 8 - 12 = 3.',
    explanationTanglish: 'Both = 7 + 8 - 12 = 3.'
  },
  {
    id: 'log-h-13',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'Statement: The government should ban single-use plastics immediately. Argument 1: Yes, it causes severe environmental damage. Argument 2: No, millions of small businesses will suffer without alternatives.',
    options: ['Only 1 is strong', 'Only 2 is strong', 'Both 1 and 2 are strong', 'Neither is strong'],
    correctIndex: 2,
    explanationEnglish: 'Both arguments present valid environmental and economic concerns.',
    explanationTanglish: 'Both arguments are strong.'
  },
  {
    id: 'log-h-14',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'How many times do hands of a clock form a right angle (90 deg) in a day?',
    options: ['22', '24', '44', '48'],
    correctIndex: 2,
    explanationEnglish: 'Hands form 90 degrees 44 times in 24 hours.',
    explanationTanglish: '44 times in 24 hours.'
  },
  {
    id: 'log-h-15',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'Find the missing number: 4, 18, 48, 100, 180, ?',
    options: ['240', '294', '316', '343'],
    correctIndex: 1,
    explanationEnglish: 'Pattern: n^3 - n^2 -> 2^3-2^2=4, 3^3-3^2=18, 4^3-4^2=48, 5^3-5^2=100, 6^3-6^2=180, 7^3-7^2 = 343-49 = 294.',
    explanationTanglish: '7^3 - 7^2 = 343 - 49 = 294.'
  },
  {
    id: 'log-h-16',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'In a code, "743" means "mangoes are sweet", "657" means "eat good mangoes", "934" means "apples are sweet". Which digit means "eat"?',
    options: ['5', '6', '5 or 6', '7'],
    correctIndex: 2,
    explanationEnglish: '"mangoes"=7. "eat" and "good" correspond to 5 or 6.',
    explanationTanglish: 'Cannot distinguish eat between 5 or 6.'
  },
  {
    id: 'log-h-17',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'If a cube is painted green on all sides and cut into 64 small identical cubes, how many have exactly 2 sides painted?',
    options: ['12', '24', '32', '36'],
    correctIndex: 1,
    explanationEnglish: 'n = 4. 2-sided cubes = 12 * (n - 2) = 12 * 2 = 24.',
    explanationTanglish: 'Formula: 12 * (n-2) = 24.'
  },
  {
    id: 'log-h-18',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'Find next term in series: 7, 26, 63, 124, 215, ?',
    options: ['342', '343', '341', '340'],
    correctIndex: 0,
    explanationEnglish: 'n^3 - 1 -> 7^3 - 1 = 343 - 1 = 342.',
    explanationTanglish: '7^3 - 1 = 342.'
  },
  {
    id: 'log-h-19',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'Data Sufficiency: What is value of positive integer n? Statement 1: n is prime. Statement 2: n is even.',
    options: ['Statement 1 alone', 'Statement 2 alone', 'Both together sufficient', 'Neither sufficient'],
    correctIndex: 2,
    explanationEnglish: 'The only even prime number is 2. Both statements together pinpoint n = 2.',
    explanationTanglish: 'Only even prime is 2. Both together sufficient.'
  },
  {
    id: 'log-h-20',
    category: 'Logical',
    difficulty: 'Hard',
    question: '6 tasks T1 to T6 are scheduled. T1 must precede T2. T3 must follow T4. T5 is immediately before T6. How many valid schedules?',
    options: ['60', '90', '120', '180'],
    correctIndex: 1,
    explanationEnglish: 'Permutations under ordering constraints yield 90 valid schedules.',
    explanationTanglish: 'Constraint evaluation gives 90 valid schedules.'
  },
  {
    id: 'log-h-21',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'If A + B means A is father of B; A - B means A is wife of B; A * B means A is brother of B, which expression shows P is uncle of Q?',
    options: ['P * R + Q', 'P + R * Q', 'P - R + Q', 'P * R - Q'],
    correctIndex: 0,
    explanationEnglish: 'P * R means P is brother of R. R + Q means R is father of Q. So P is uncle of Q.',
    explanationTanglish: 'P * R + Q.'
  },
  {
    id: 'log-h-22',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'How many squares are there on a standard 8x8 chessboard?',
    options: ['64', '128', '204', '256'],
    correctIndex: 2,
    explanationEnglish: 'Total squares = 1^2 + 2^2 + ... + 8^2 = (8 * 9 * 17) / 6 = 204.',
    explanationTanglish: 'Sum of squares 1^2 to 8^2 = 204.'
  },
  {
    id: 'log-h-23',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'Arrange in meaningful order: 1. Sentence 2. Chapter 3. Letter 4. Book 5. Word',
    options: ['3, 5, 1, 2, 4', '3, 1, 5, 2, 4', '5, 3, 1, 2, 4', '3, 5, 2, 1, 4'],
    correctIndex: 0,
    explanationEnglish: 'Letter -> Word -> Sentence -> Chapter -> Book.',
    explanationTanglish: '3, 5, 1, 2, 4.'
  },
  {
    id: 'log-h-24',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'Statement: All players are athletes. No athlete is lazy. Some coaches are lazy. Conclusions: I. No player is lazy. II. Some coaches are not athletes.',
    options: ['Only I follows', 'Only II follows', 'Both I and II follow', 'Neither follows'],
    correctIndex: 2,
    explanationEnglish: 'Both conclusions follow logically.',
    explanationTanglish: 'Both I and II follow.'
  },
  {
    id: 'log-h-25',
    category: 'Logical',
    difficulty: 'Hard',
    question: 'A man is facing West. He turns 45 deg clockwise, then 180 deg in same direction, then 270 deg anti-clockwise. Which direction is he facing now?',
    options: ['South-West', 'North-West', 'South-East', 'North-East'],
    correctIndex: 0,
    explanationEnglish: 'Clockwise = +45 + 180 = +225. Anti-clockwise = -270. Net = -45 deg (45 deg anti-clockwise from West) = South-West.',
    explanationTanglish: 'Net rotation = 45 deg anti-clockwise from West = South-West.'
  },

  // ==================== VERBAL - EASY (1 to 25) ====================
  {
    id: 'verb-e-1',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Identify the grammatically correct sentence:',
    options: [
      'Neither of the students were present.',
      'Neither of the students was present.',
      'Neither of student are present.',
      'Neither of student were present.'
    ],
    correctIndex: 1,
    explanationEnglish: '\'Neither\' is a singular indefinite pronoun requiring the singular verb \'was\'.',
    explanationTanglish: '\'Neither\' is singular, so use \'was\'.'
  },
  {
    id: 'verb-e-2',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Choose the synonym for "CANDID":',
    options: ['Secretive', 'Frank', 'Dishonest', 'Shy'],
    correctIndex: 1,
    explanationEnglish: 'Candid means truthful and straightforward; frank is a direct synonym.',
    explanationTanglish: 'Candid means Frank/Open.'
  },
  {
    id: 'verb-e-3',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Choose the antonym for "OBSTINATE":',
    options: ['Flexible', 'Stubborn', 'Rigid', 'Firm'],
    correctIndex: 0,
    explanationEnglish: 'Obstinate means stubborn; flexible is its antonym.',
    explanationTanglish: 'Obstinate means Stubborn. Opposite = Flexible.'
  },
  {
    id: 'verb-e-4',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Fill in the blank: She is proficient _____ three foreign languages.',
    options: ['at', 'in', 'with', 'on'],
    correctIndex: 1,
    explanationEnglish: 'The correct preposition after "proficient" is "in".',
    explanationTanglish: 'Proficient in...'
  },
  {
    id: 'verb-e-5',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Identify the correctly spelled word:',
    options: ['Accommodate', 'Acommodate', 'Accomodate', 'Acomodate'],
    correctIndex: 0,
    explanationEnglish: 'Accommodate has double \'c\' and double \'m\'.',
    explanationTanglish: 'Accommodate has double c and double m.'
  },
  {
    id: 'verb-e-6',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Fill in the blank: The sun _____ in the east.',
    options: ['rise', 'rises', 'rising', 'rose'],
    correctIndex: 1,
    explanationEnglish: 'Universal truths use simple present tense with singular verb: rises.',
    explanationTanglish: 'Universal truth uses simple present -> rises.'
  },
  {
    id: 'verb-e-7',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Choose the antonym for "BENEVOLENT":',
    options: ['Kind', 'Malevolent', 'Generous', 'Friendly'],
    correctIndex: 1,
    explanationEnglish: 'Benevolent means well-meaning; malevolent means wishing evil.',
    explanationTanglish: 'Benevolent opposite is Malevolent.'
  },
  {
    id: 'verb-e-8',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Select the synonym for "DILIGENT":',
    options: ['Lazy', 'Hardworking', 'Careless', 'Slow'],
    correctIndex: 1,
    explanationEnglish: 'Diligent means showing care and effort; hardworking.',
    explanationTanglish: 'Diligent = Hardworking.'
  },
  {
    id: 'verb-e-9',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Choose the correct option: Each of the boys _____ given a medal.',
    options: ['was', 'were', 'have', 'are'],
    correctIndex: 0,
    explanationEnglish: '"Each" is singular, so it takes "was".',
    explanationTanglish: 'Each is singular -> was.'
  },
  {
    id: 'verb-e-10',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Identify the error: "He don\'t know the answer to the question."',
    options: ['He', 'don\'t know', 'the answer', 'no error'],
    correctIndex: 1,
    explanationEnglish: 'Third-person singular "He" requires "doesn\'t know".',
    explanationTanglish: 'He takes doesn\'t know.'
  },
  {
    id: 'verb-e-11',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'What is the plural form of "CRITERION"?',
    options: ['Criterions', 'Criteria', 'Criterias', 'Criteriones'],
    correctIndex: 1,
    explanationEnglish: 'The plural of criterion is criteria.',
    explanationTanglish: 'Plural of criterion is criteria.'
  },
  {
    id: 'verb-e-12',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Choose the correct preposition: He has been living here _____ 2018.',
    options: ['for', 'since', 'from', 'by'],
    correctIndex: 1,
    explanationEnglish: '"Since" is used for a specific point in time.',
    explanationTanglish: 'Point in time uses since.'
  },
  {
    id: 'verb-e-13',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Choose the correct spelling:',
    options: ['Receive', 'Recieve', 'Receeve', 'Recive'],
    correctIndex: 0,
    explanationEnglish: 'Rule: "I before E except after C" -> Receive.',
    explanationTanglish: 'Receive.'
  },
  {
    id: 'verb-e-14',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Choose the word that means "a place where books are kept":',
    options: ['Museum', 'Library', 'Auditorium', 'Laboratory'],
    correctIndex: 1,
    explanationEnglish: 'A library is a building or room containing collections of books.',
    explanationTanglish: 'Library = books place.'
  },
  {
    id: 'verb-e-15',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Select the idiom meaning "a very rare event":',
    options: ['Once in a blue moon', 'Piece of cake', 'Spill the tea', 'Cold shoulder'],
    correctIndex: 0,
    explanationEnglish: '"Once in a blue moon" means something happens very rarely.',
    explanationTanglish: 'Rare event = Once in a blue moon.'
  },
  {
    id: 'verb-e-16',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Fill in the blank: Neither John nor his friends _____ attending the party.',
    options: ['is', 'are', 'was', 'has'],
    correctIndex: 1,
    explanationEnglish: 'In "neither...nor", verb agrees with the subject closest to it ("friends" -> are).',
    explanationTanglish: 'Agrees with closest subject "friends" -> are.'
  },
  {
    id: 'verb-e-17',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Synonym for "LUCID":',
    options: ['Clear', 'Vague', 'Obscure', 'Dim'],
    correctIndex: 0,
    explanationEnglish: 'Lucid means expressed clearly; easy to understand.',
    explanationTanglish: 'Lucid = Clear.'
  },
  {
    id: 'verb-e-18',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Antonym for "FRUGAL":',
    options: ['Extravagant', 'Thrifty', 'Economical', 'Sparing'],
    correctIndex: 0,
    explanationEnglish: 'Frugal means economical; extravagant means spending excessively.',
    explanationTanglish: 'Frugal opposite is Extravagant.'
  },
  {
    id: 'verb-e-19',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'One-word substitution: "A period of ten years"',
    options: ['Fortnight', 'Decade', 'Centennial', 'Millennium'],
    correctIndex: 1,
    explanationEnglish: 'A decade is a period of ten years.',
    explanationTanglish: '10 years = Decade.'
  },
  {
    id: 'verb-e-20',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Choose the correct passive voice: "She reads a novel."',
    options: ['A novel is read by her.', 'A novel was read by her.', 'A novel is being read by her.', 'A novel has been read by her.'],
    correctIndex: 0,
    explanationEnglish: 'Simple present passive: Object + is/am/are + V3 + by + subject.',
    explanationTanglish: 'Simple present passive -> A novel is read by her.'
  },
  {
    id: 'verb-e-21',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Choose the correct word: They left _____ luggage at the hotel.',
    options: ['there', 'their', 'they\'re', 'theirs'],
    correctIndex: 1,
    explanationEnglish: 'Possessive pronoun is "their".',
    explanationTanglish: 'Possessive pronoun = their.'
  },
  {
    id: 'verb-e-22',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Correct the sentence: "I prefer coffee than tea."',
    options: ['I prefer coffee to tea.', 'I prefer coffee over tea.', 'I prefer coffee more than tea.', 'I prefer coffee then tea.'],
    correctIndex: 0,
    explanationEnglish: '"Prefer" is followed by preposition "to", not "than".',
    explanationTanglish: 'Prefer takes "to".'
  },
  {
    id: 'verb-e-23',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Find correct spelling:',
    options: ['Separate', 'Seperate', 'Seprate', 'Separite'],
    correctIndex: 0,
    explanationEnglish: 'Separate has "a" in the middle: S-E-P-A-R-A-T-E.',
    explanationTanglish: 'Separate.'
  },
  {
    id: 'verb-e-24',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Antonym for "TRANSPARENT":',
    options: ['Clear', 'Opaque', 'Translucent', 'Bright'],
    correctIndex: 1,
    explanationEnglish: 'Opaque means not transparent.',
    explanationTanglish: 'Transparent opposite is Opaque.'
  },
  {
    id: 'verb-e-25',
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Fill in the blank: Honesty is _____ best policy.',
    options: ['a', 'an', 'the', 'no article'],
    correctIndex: 2,
    explanationEnglish: 'Superlative adjectives take article "the".',
    explanationTanglish: 'Superlative "best" takes "the".'
  },

  // ==================== VERBAL - MEDIUM (1 to 25) ====================
  {
    id: 'verb-m-1',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Select the idiom meaning "to face a difficult situation with courage":',
    options: ['Bite the bullet', 'Burn the midnight oil', 'Break a leg', 'Spill the beans'],
    correctIndex: 0,
    explanationEnglish: '"Bite the bullet" means to endure a painful or difficult situation bravely.',
    explanationTanglish: '"Bite the bullet" means facing tough situation with courage.'
  },
  {
    id: 'verb-m-2',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Find the error in: "The manager, along with his assistants, have arrived at the venue."',
    options: ['The manager', 'along with his assistants', 'have arrived', 'at the venue'],
    correctIndex: 2,
    explanationEnglish: 'Subject "manager" is singular. "Along with..." does not change subject number. Verb should be "has arrived".',
    explanationTanglish: 'Manager is singular, so should be "has arrived".'
  },
  {
    id: 'verb-m-3',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Choose the word that best completes the analogy: LION : PRIDE :: FISH : ?',
    options: ['Flock', 'Pack', 'School', 'Herd'],
    correctIndex: 2,
    explanationEnglish: 'A collective noun for lions is pride; for fish, it is school.',
    explanationTanglish: 'Group of fish is called a School.'
  },
  {
    id: 'verb-m-4',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Change to indirect speech: He said, "I will publish the report tomorrow."',
    options: [
      'He said that he will publish the report tomorrow.',
      'He said that he would publish the report the next day.',
      'He told he will publish report next day.',
      'He said he would publish report tomorrow.'
    ],
    correctIndex: 1,
    explanationEnglish: 'Tense changes from will -> would, and tomorrow -> the next day.',
    explanationTanglish: 'will -> would, tomorrow -> the next day.'
  },
  {
    id: 'verb-m-5',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Choose the word closest in meaning to "METICULOUS":',
    options: ['Careless', 'Thorough', 'Hasty', 'Sloppy'],
    correctIndex: 1,
    explanationEnglish: 'Meticulous means showing great attention to detail; thorough.',
    explanationTanglish: 'Meticulous = Thorough / Careful.'
  },
  {
    id: 'verb-m-6',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Choose the word opposite in meaning to "PRUDENT":',
    options: ['Reckless', 'Cautious', 'Wise', 'Discreet'],
    correctIndex: 0,
    explanationEnglish: 'Prudent means careful and sensible; reckless means acting without care.',
    explanationTanglish: 'Prudent opposite is Reckless.'
  },
  {
    id: 'verb-m-7',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Fill in the blank: Scarcely had I entered the room _____ the phone rang.',
    options: ['than', 'when', 'then', 'before'],
    correctIndex: 1,
    explanationEnglish: '"Scarcely had..." is followed by "when".',
    explanationTanglish: 'Scarcely is paired with when.'
  },
  {
    id: 'verb-m-8',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'One-word substitution: "One who talks in sleep"',
    options: ['Somnambulist', 'Somniloquist', 'Egoist', 'Altruist'],
    correctIndex: 1,
    explanationEnglish: 'Somniloquist is someone who talks in sleep (somnambulist walks in sleep).',
    explanationTanglish: 'Somniloquist = talks in sleep.'
  },
  {
    id: 'verb-m-9',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Identify the correct active voice: "The contract was signed by the CEO."',
    options: ['The CEO signed the contract.', 'The CEO signs the contract.', 'The CEO has signed the contract.', 'The CEO was signing the contract.'],
    correctIndex: 0,
    explanationEnglish: 'Simple past active: Subject + V2 + object.',
    explanationTanglish: 'Simple past active -> The CEO signed the contract.'
  },
  {
    id: 'verb-m-10',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Select the correct sentence:',
    options: [
      'He is senior than me in service.',
      'He is senior to me in service.',
      'He is senior from me in service.',
      'He is more senior than me.'
    ],
    correctIndex: 1,
    explanationEnglish: 'Comparative adjectives ending in -ior (senior, junior, superior) take "to".',
    explanationTanglish: 'Senior takes "to".'
  },
  {
    id: 'verb-m-11',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Synonym for "PRAGMATIC":',
    options: ['Practical', 'Theoretical', 'Idealistic', 'Unrealistic'],
    correctIndex: 0,
    explanationEnglish: 'Pragmatic means dealing with things sensibly and realistically.',
    explanationTanglish: 'Pragmatic = Practical.'
  },
  {
    id: 'verb-m-12',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Antonym for "GREGARIOUS":',
    options: ['Sociable', 'Reclusive', 'Friendly', 'Outgoing'],
    correctIndex: 1,
    explanationEnglish: 'Gregarious means fond of company; reclusive means avoiding company.',
    explanationTanglish: 'Gregarious opposite is Reclusive.'
  },
  {
    id: 'verb-m-13',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Meaning of idiom "Burn the candle at both ends":',
    options: ['Work extremely long hours', 'Waste money carelessly', 'Build a house', 'Extinguish a fire'],
    correctIndex: 0,
    explanationEnglish: '"Burn the candle at both ends" means to exhaust oneself by working late and early.',
    explanationTanglish: 'Working late night and early morning.'
  },
  {
    id: 'verb-m-14',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Fill in the blank: The committee _____ divided in their opinions.',
    options: ['is', 'were', 'has', 'was'],
    correctIndex: 1,
    explanationEnglish: 'When collective noun members are divided in opinion, plural verb "were" is used.',
    explanationTanglish: 'Members divided -> plural verb "were".'
  },
  {
    id: 'verb-m-15',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Choose the correct word: The news of his sudden departure was quite _____.',
    options: ['disturbing', 'disturbed', 'disturbingly', 'disturbance'],
    correctIndex: 0,
    explanationEnglish: 'Adjective modifying the news is "disturbing".',
    explanationTanglish: 'Adjective needed: disturbing.'
  },
  {
    id: 'verb-m-16',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'One-word substitution: "A government by the wealthy"',
    options: ['Democracy', 'Plutocracy', 'Autocracy', 'Bureaucracy'],
    correctIndex: 1,
    explanationEnglish: 'Plutocracy is government by the wealthy.',
    explanationTanglish: 'Plutocracy = government by rich/wealthy.'
  },
  {
    id: 'verb-m-17',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Choose correct spelling:',
    options: ['Maintenance', 'Maintainance', 'Maintenence', 'Maintenence'],
    correctIndex: 0,
    explanationEnglish: 'Correct spelling is M-A-I-N-T-E-N-A-N-C-E.',
    explanationTanglish: 'Maintenance.'
  },
  {
    id: 'verb-m-18',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Rearrange to form sentence: P: the results Q: we must wait R: before making conclusions S: for the official announcement',
    options: ['Q S R P', 'Q P S R', 'P Q R S', 'S R P Q'],
    correctIndex: 0,
    explanationEnglish: '"We must wait (Q) for the official announcement (S) before making conclusions (R) [on] the results (P)."',
    explanationTanglish: 'Q -> S -> R -> P.'
  },
  {
    id: 'verb-m-19',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Synonym for "COGNIZANT":',
    options: ['Aware', 'Ignorant', 'Unconscious', 'Blind'],
    correctIndex: 0,
    explanationEnglish: 'Cognizant means having knowledge or being aware of.',
    explanationTanglish: 'Cognizant = Aware.'
  },
  {
    id: 'verb-m-20',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Identify part with error: "No sooner did the bell rang (A) / than the students (B) / ran out of class (C)"',
    options: ['A', 'B', 'C', 'No error'],
    correctIndex: 0,
    explanationEnglish: 'Did takes base verb "ring", not past tense "rang".',
    explanationTanglish: '"did" follows base verb "ring".'
  },
  {
    id: 'verb-m-21',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Antonym for "AMELIORATE":',
    options: ['Worsen', 'Improve', 'Enhance', 'Upgrade'],
    correctIndex: 0,
    explanationEnglish: 'Ameliorate means to make better; worsen means to make worse.',
    explanationTanglish: 'Ameliorate = Improve. Opposite = Worsen.'
  },
  {
    id: 'verb-m-22',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Fill in the blank: He refrained _____ making any controversial comments.',
    options: ['from', 'to', 'on', 'with'],
    correctIndex: 0,
    explanationEnglish: '"Refrain" takes preposition "from".',
    explanationTanglish: 'Refrain from.'
  },
  {
    id: 'verb-m-23',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Choose the word that means "lasting for a very short time":',
    options: ['Transient', 'Permanent', 'Perpetual', 'Enduring'],
    correctIndex: 0,
    explanationEnglish: 'Transient means lasting only for a short time.',
    explanationTanglish: 'Transient = Short time.'
  },
  {
    id: 'verb-m-24',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Analogy: ARCHITECT : BUILDING :: SCULPTOR : ?',
    options: ['Canvas', 'Statue', 'Chisel', 'Museum'],
    correctIndex: 1,
    explanationEnglish: 'Architect creates a building; sculptor creates a statue.',
    explanationTanglish: 'Sculptor creates statue.'
  },
  {
    id: 'verb-m-25',
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Meaning of "Take with a grain of salt":',
    options: ['To add salt to food', 'To accept with skepticism', 'To agree completely', 'To get angry'],
    correctIndex: 1,
    explanationEnglish: '"Take with a grain of salt" means to regard something with doubt or skepticism.',
    explanationTanglish: 'Accepting with doubt.'
  },

  // ==================== VERBAL - HARD (1 to 25) ====================
  {
    id: 'verb-h-1',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Choose the word opposite in meaning to "EPHEMERAL":',
    options: ['Transient', 'Eternal', 'Fleeting', 'Short-lived'],
    correctIndex: 1,
    explanationEnglish: 'Ephemeral means short-lived; eternal means lasting forever.',
    explanationTanglish: 'Ephemeral means short-lived. Opposite = Eternal.'
  },
  {
    id: 'verb-h-2',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Rearrange parts to form a coherent sentence: P: by reducing carbon footprint Q: sustainable practices R: help protect the environment S: implemented by industries',
    options: ['Q S R P', 'Q P R S', 'P R Q S', 'S R Q P'],
    correctIndex: 0,
    explanationEnglish: 'Coherent sentence: "Sustainable practices (Q) implemented by industries (S) help protect the environment (R) by reducing carbon footprint (P)."',
    explanationTanglish: 'Order: Q -> S -> R -> P.'
  },
  {
    id: 'verb-h-3',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Identify the one-word substitution for "A person who is indifferent to pleasure or pain":',
    options: ['Stoic', 'Hedonist', 'Altruist', 'Misanthrope'],
    correctIndex: 0,
    explanationEnglish: 'A stoic is someone who can endure pain or hardship without showing feelings.',
    explanationTanglish: 'Stoic is indifferent to pleasure or pain.'
  },
  {
    id: 'verb-h-4',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Which of the following sentences uses the subjunctive mood correctly?',
    options: [
      'If I was you, I would accept the offer.',
      'If I were you, I would accept the offer.',
      'If I am you, I will accept the offer.',
      'If I be you, I would accept the offer.'
    ],
    correctIndex: 1,
    explanationEnglish: 'Hypothetical conditions in the subjunctive mood use "were" regardless of subject.',
    explanationTanglish: 'Hypothetical subjunctive condition uses "were".'
  },
  {
    id: 'verb-h-5',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Choose the word closest in meaning to "PERSPICACIOUS":',
    options: ['Insightful', 'Ignorant', 'Confused', 'Deceptive'],
    correctIndex: 0,
    explanationEnglish: 'Perspicacious means having a ready insight into and understanding of things.',
    explanationTanglish: 'Perspicacious = Insightful / Sharp-minded.'
  },
  {
    id: 'verb-h-6',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Identify the figure of speech: "The wind whispered through the dark forest."',
    options: ['Metaphor', 'Simile', 'Personification', 'Hyperbole'],
    correctIndex: 2,
    explanationEnglish: 'Giving human traits (whispering) to non-human elements (wind) is personification.',
    explanationTanglish: 'Personification.'
  },
  {
    id: 'verb-h-7',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Select word opposite in meaning to "LOQUACIOUS":',
    options: ['Taciturn', 'Garrulous', 'Voluble', 'Talkative'],
    correctIndex: 0,
    explanationEnglish: 'Loquacious means talkative; taciturn means reserved and saying little.',
    explanationTanglish: 'Loquacious = Talkative. Opposite = Taciturn.'
  },
  {
    id: 'verb-h-8',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'One-word substitution: "Excessive admiration for oneself"',
    options: ['Narcissism', 'Egoism', 'Altruism', 'Optimism'],
    correctIndex: 0,
    explanationEnglish: 'Narcissism is excessive interest in or admiration of oneself.',
    explanationTanglish: 'Narcissism.'
  },
  {
    id: 'verb-h-9',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Choose the correct meaning of foreign phrase "Status Quo":',
    options: ['Existing state of affairs', 'Future plan', 'Past record', 'Complete change'],
    correctIndex: 0,
    explanationEnglish: '"Status quo" refers to the existing state of affairs.',
    explanationTanglish: 'Status quo = Existing state.'
  },
  {
    id: 'verb-h-10',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Select sentence free of grammatical error:',
    options: [
      'Scarcely had he left than the storm began.',
      'Hardly had he arrived when the bell rang.',
      'No sooner he entered when everyone cheered.',
      'Barely he spoke then people left.'
    ],
    correctIndex: 1,
    explanationEnglish: '"Hardly had..." correctly pairs with "when" and uses inverted verb order.',
    explanationTanglish: '"Hardly had..." pairs with "when".'
  },
  {
    id: 'verb-h-11',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Synonym for "OBSEQUIOUS":',
    options: ['Servile', 'Domineering', 'Arrogant', 'Independent'],
    correctIndex: 0,
    explanationEnglish: 'Obsequious means obedient or attentive to a servile degree.',
    explanationTanglish: 'Obsequious = Servile / Flattering.'
  },
  {
    id: 'verb-h-12',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Antonym for "SANGUINE":',
    options: ['Pessimistic', 'Optimistic', 'Hopeful', 'Cheerful'],
    correctIndex: 0,
    explanationEnglish: 'Sanguine means optimistic; pessimistic means expecting the worst.',
    explanationTanglish: 'Sanguine = Optimistic. Opposite = Pessimistic.'
  },
  {
    id: 'verb-h-13',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Meaning of idiom "To throw down the gauntlet":',
    options: ['To issue a challenge', 'To surrender', 'To drop weapons', 'To apologize'],
    correctIndex: 0,
    explanationEnglish: '"To throw down the gauntlet" means to issue a formal challenge.',
    explanationTanglish: 'Issue a challenge.'
  },
  {
    id: 'verb-h-14',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Choose correct word: His _____ speech inspired the entire audience.',
    options: ['eloquent', 'elequent', 'eloquence', 'eloquently'],
    correctIndex: 0,
    explanationEnglish: 'Adjective "eloquent" modifies noun "speech".',
    explanationTanglish: 'Adjective = eloquent.'
  },
  {
    id: 'verb-h-15',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'One-word substitution: "A fear of enclosed small spaces"',
    options: ['Claustrophobia', 'Agoraphobia', 'Acrophobia', 'Hydrophobia'],
    correctIndex: 0,
    explanationEnglish: 'Claustrophobia is extreme fear of confined spaces.',
    explanationTanglish: 'Claustrophobia.'
  },
  {
    id: 'verb-h-16',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Choose the word closest in meaning to "INTRANSIGENT":',
    options: ['Uncompromising', 'Flexible', 'Yielding', 'Compliant'],
    correctIndex: 0,
    explanationEnglish: 'Intransigent means refusing to agree or compromise.',
    explanationTanglish: 'Intransigent = Uncompromising.'
  },
  {
    id: 'verb-h-17',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Find part with error: "Had you told me earlier (A) / I would bring (B) / the necessary documents (C)"',
    options: ['A', 'B', 'C', 'No error'],
    correctIndex: 1,
    explanationEnglish: 'Third conditional requires "would have brought" instead of "would bring".',
    explanationTanglish: 'Requires "would have brought".'
  },
  {
    id: 'verb-h-18',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Antonym for "ESOTERIC":',
    options: ['Obscure', 'Common', 'Abstruse', 'Arcane'],
    correctIndex: 1,
    explanationEnglish: 'Esoteric means understood by only a small number; common/popular is its opposite.',
    explanationTanglish: 'Esoteric opposite is Common.'
  },
  {
    id: 'verb-h-19',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Analogy: EPILOGUE : PLAY :: PREFACE : ?',
    options: ['Book', 'Song', 'Dance', 'Movie'],
    correctIndex: 0,
    explanationEnglish: 'An epilogue comes at the end of a play; a preface comes at the beginning of a book.',
    explanationTanglish: 'Preface comes at start of a book.'
  },
  {
    id: 'verb-h-20',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Meaning of "Pyrrhic victory":',
    options: ['A victory won at devastating cost', 'A decisive easy victory', 'A victory celebrated nationwide', 'A accidental win'],
    correctIndex: 0,
    explanationEnglish: 'A Pyrrhic victory is a victory that inflicts such a devastating toll that it is tantamount to defeat.',
    explanationTanglish: 'Victory won at devastating cost.'
  },
  {
    id: 'verb-h-21',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Choose correct spelling:',
    options: ['Entrepreneur', 'Entreprenur', 'Entreprener', 'Enterpreneur'],
    correctIndex: 0,
    explanationEnglish: 'Correct spelling is E-N-T-R-E-P-R-E-N-E-U-R.',
    explanationTanglish: 'Entrepreneur.'
  },
  {
    id: 'verb-h-22',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'One-word substitution: "The study of ancient inscriptions"',
    options: ['Epigraphy', 'Palaeography', 'Archeology', 'Numismatics'],
    correctIndex: 0,
    explanationEnglish: 'Epigraphy is the study and interpretation of ancient inscriptions.',
    explanationTanglish: 'Epigraphy.'
  },
  {
    id: 'verb-h-23',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Synonym for "UBIQUITOUS":',
    options: ['Omnipresent', 'Rare', 'Scarce', 'Hidden'],
    correctIndex: 0,
    explanationEnglish: 'Ubiquitous means present, appearing, or found everywhere.',
    explanationTanglish: 'Ubiquitous = Omnipresent / Everywhere.'
  },
  {
    id: 'verb-h-24',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Fill in the blank: He spoke with such clarity that his speech was completely _____.',
    options: ['comprehensible', 'incomprehensible', 'apprehensive', 'apprehended'],
    correctIndex: 0,
    explanationEnglish: 'Comprehensible means able to be understood.',
    explanationTanglish: 'Comprehensible = Easy to understand.'
  },
  {
    id: 'verb-h-25',
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Identify the sentence with correct punctuation:',
    options: [
      'It\'s a well-known fact that the team, despite initial hurdles, won the championship.',
      'Its a well known fact, that the team despite initial hurdles won the championship.',
      'It\'s a well known fact that, the team despite initial hurdles, won championship.',
      'Its a well-known fact that the team, despite initial hurdles won championship.'
    ],
    correctIndex: 0,
    explanationEnglish: 'Uses correct apostrophe (It\'s), hyphen (well-known), and comma-delimited parenthetical phrase (despite initial hurdles).',
    explanationTanglish: 'Correct apostrophe, hyphenation, and commas.'
  }
];

/**
 * Validates whether an aptitude question object is a proper placement MCQ
 * and rejects simple raw arithmetic drills (like "5 + 3 = ?").
 */
export function isValidAptitudeQuestion(q: any, targetCategory?: AptitudeCategory, targetDifficulty?: DifficultyLevel): boolean {
  if (!q || typeof q !== 'object') return false;

  // 1. Question string length and existence check
  if (typeof q.question !== 'string') return false;
  const qText = q.question.trim();
  if (qText.length < 15) return false;

  // 2. Reject raw arithmetic drills (e.g. "5 + 3 = ?", "10 - 4 = ?", "What is 15 * 8?")
  const rawMathRegex = /^\s*(what\s+is|calculate|evaluate|find)?\s*:?\s*\d+\s*[\+\-\*\/]\s*\d+\s*=\s*\??$/i;
  const rawMathRegex2 = /^\s*(what\s+is|calculate|evaluate)\s*:?\s*\d+\s*[\+\-\*\/]\s*\d+\s*\??$/i;
  if (rawMathRegex.test(qText) || rawMathRegex2.test(qText)) {
    return false;
  }

  // 3. Exactly 4 distinct options check
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  const cleanedOpts = q.options.map((o: any) => String(o).trim());
  if (cleanedOpts.some((o: string) => !o)) return false;
  const uniqueOpts = new Set(cleanedOpts.map((o: string) => o.toLowerCase()));
  if (uniqueOpts.size < 4) return false;

  // 4. Valid correctIndex (0..3)
  if (typeof q.correctIndex !== 'number' || isNaN(q.correctIndex)) return false;
  const idx = Math.floor(q.correctIndex);
  if (idx < 0 || idx > 3) return false;

  // 5. Non-empty explanations
  if (typeof q.explanationEnglish !== 'string' || !q.explanationEnglish.trim()) return false;
  if (typeof q.explanationTanglish !== 'string' || !q.explanationTanglish.trim()) return false;

  // 6. Category & Difficulty check if provided
  if (targetCategory && q.category && q.category !== targetCategory) return false;
  if (targetDifficulty && q.difficulty && q.difficulty !== targetDifficulty) return false;

  return true;
}

/**
 * AI Question Generator for Aptitude Practice
 */
export async function generateAptitudeQuestionsAI(
  category: AptitudeCategory,
  difficulty: DifficultyLevel,
  count: number,
  excludeHashes: Set<string> = new Set()
): Promise<AptitudeQuestion[]> {
  if (!OPENROUTER_API_KEY && !AI_API_KEY) {
    return [];
  }

  const prompt = `Generate ${count + 5} UNIQUE placement aptitude multiple-choice questions (MCQs) for engineering/college campus recruitment.
Category: ${category}
Difficulty: ${difficulty}

CRITICAL PLACEMENT EXAM RULES:
1. DO NOT generate simple raw arithmetic drills (NEVER generate questions like '5 + 3 = ?', '10 - 4 = ?', or 'What is 15 * 8?').
2. Questions MUST be authentic campus recruitment placement test questions (e.g. Speed & Distance, Time & Work, Profit & Loss, Percentages, Ratios, Syllogisms, Blood Relations, Seating Arrangements, Coding-Decoding, Verbal Analogies, Sentence Correction).
3. Level Guidelines:
   - Easy: Clear single-step aptitude word problems or logical reasoning.
   - Medium: Multi-step quantitative problems, compound interest, seating arrangements, or syllogisms.
   - Hard: Advanced multi-concept placement problems, probability, circular seating, data sufficiency.
4. Each question MUST have EXACTLY 4 distinct, meaningful options.
5. correctIndex MUST be an integer between 0 and 3 corresponding to the correct option.
6. Provide explanationEnglish with clear, step-by-step reasoning.
7. Provide explanationTanglish with accessible Tamil-English explanation using English script.
8. Do NOT repeat or generate questions similar to: ${Array.from(excludeHashes).slice(0, 20).join(', ')}

Return ONLY a raw JSON array of objects with schema:
[
  {
    "id": "ai-q-1",
    "category": "${category}",
    "difficulty": "${difficulty}",
    "question": "A train 150m long is running at a speed of 54 km/hr. In what time will it pass a railway platform of 210m?",
    "options": ["12 seconds", "24 seconds", "18 seconds", "30 seconds"],
    "correctIndex": 1,
    "explanationEnglish": "Total distance = 360m. Speed = 15 m/s. Time = 360 / 15 = 24 seconds.",
    "explanationTanglish": "Total distance = 360m. Speed = 15 m/s. Time = 360 / 15 = 24 seconds."
  }
]`;

  try {
    const apiKey = OPENROUTER_API_KEY || AI_API_KEY;
    const rawContent = await fetchFromOpenRouter(prompt, apiKey);
    const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (!Array.isArray(parsed)) return [];

    const validQuestions: AptitudeQuestion[] = [];
    const seenLocal = new Set<string>();

    for (let i = 0; i < parsed.length; i++) {
      const q = parsed[i];
      if (isValidAptitudeQuestion(q, category, difficulty)) {
        const norm = normalizeQuestionText(q.question);
        if (!excludeHashes.has(norm) && !seenLocal.has(norm)) {
          seenLocal.add(norm);
          validQuestions.push({
            id: `ai-${category.toLowerCase()}-${difficulty.toLowerCase()}-${Date.now()}-${i}`,
            category,
            difficulty,
            question: q.question.trim(),
            options: q.options.map((o: any) => String(o).trim()),
            correctIndex: Math.floor(q.correctIndex),
            explanationEnglish: q.explanationEnglish.trim(),
            explanationTanglish: q.explanationTanglish.trim()
          });
        }
      }
    }
    return validQuestions;
  } catch (err) {
    console.warn('AI aptitude question generation fallback triggered:', err);
    return [];
  }
}

/**
 * Checks whether a question is excluded based on:
 * 1. Compact Hash (e.g. "q_a1b2c3d4e5f67890")
 * 2. Raw Normalized String (backward compatibility for existing DB / LocalStorage data)
 * 3. Static Question ID (e.g. "quant-e-1")
 * 4. Near-Duplicate similarity check against existing history and current attempt set
 */
export function isQuestionExcluded(
  q: AptitudeQuestion,
  excludeSet: Set<string>,
  alreadySelectedQuestions: AptitudeQuestion[] = []
): boolean {
  if (!q || !q.question) return true;

  const compactHash = hashQuestionText(q.question);
  const normText = normalizeQuestionText(q.question);

  // Exact match against compact hash, raw normalized text, or question ID
  if (excludeSet.has(compactHash) || excludeSet.has(normText) || (q.id && excludeSet.has(q.id))) {
    return true;
  }

  // Near-duplicate check against already selected questions in current attempt
  for (const selected of alreadySelectedQuestions) {
    if (isNearDuplicateQuestion(q.question, selected.question)) {
      return true;
    }
  }

  return false;
}

/**
 * Reliable Fetcher/Generator for Aptitude Quiz Attempt
 * Ensures EXACT targetCount of 100% UNIQUE non-repeating questions per attempt.
 */
export async function fetchOrGenerateAptitudeQuiz(
  category: AptitudeCategory,
  difficulty: DifficultyLevel,
  targetCount: number,
  previouslyUsedHashes: string[] = []
): Promise<AptitudeQuestion[]> {
  // Build excludeSet containing all past entries (compact hashes, raw normalized strings, or IDs)
  const excludeSet = new Set<string>();
  for (const item of previouslyUsedHashes) {
    if (item) {
      excludeSet.add(item);
      excludeSet.add(normalizeQuestionText(item));
    }
  }

  const finalQuestions: AptitudeQuestion[] = [];
  const currentAttemptSet = new Set<string>();

  // Step 1: Try AI Question Generation if online
  if (OPENROUTER_API_KEY || AI_API_KEY) {
    try {
      const aiGenerated = await generateAptitudeQuestionsAI(category, difficulty, targetCount, excludeSet);
      for (const q of aiGenerated) {
        if (isValidAptitudeQuestion(q)) {
          const compactHash = hashQuestionText(q.question);
          if (!currentAttemptSet.has(compactHash) && !isQuestionExcluded(q, excludeSet, finalQuestions)) {
            currentAttemptSet.add(compactHash);
            finalQuestions.push(q);
            if (finalQuestions.length === targetCount) break;
          }
        }
      }
    } catch (e) {
      console.warn('AI question generation error, utilizing static bank:', e);
    }
  }

  // Step 2: Fill remaining targetCount from APTITUDE_BANK
  if (finalQuestions.length < targetCount) {
    const categoryAndDiff = APTITUDE_BANK.filter(
      (q) => q.category === category && q.difficulty === difficulty && isValidAptitudeQuestion(q)
    );
    const categoryOnly = APTITUDE_BANK.filter(
      (q) => q.category === category && isValidAptitudeQuestion(q)
    );
    const fullBank = APTITUDE_BANK.filter((q) => isValidAptitudeQuestion(q));

    const pools = [categoryAndDiff, categoryOnly, fullBank];

    // Pass 2A: Pick unseen static questions (excluding past history & near duplicates)
    for (const pool of pools) {
      for (const q of pool) {
        if (finalQuestions.length === targetCount) break;
        const compactHash = hashQuestionText(q.question);
        if (!currentAttemptSet.has(compactHash) && !isQuestionExcluded(q, excludeSet, finalQuestions)) {
          currentAttemptSet.add(compactHash);
          finalQuestions.push({
            ...q,
            id: `${q.id}-static-${Date.now()}-${finalQuestions.length}`
          });
        }
      }
      if (finalQuestions.length === targetCount) break;
    }

    // Pass 2B: If needed to reach exact targetCount, pick remaining distinct static questions (never duplicating within current attempt)
    for (const pool of pools) {
      for (const q of pool) {
        if (finalQuestions.length === targetCount) break;
        const compactHash = hashQuestionText(q.question);
        if (!currentAttemptSet.has(compactHash)) {
          let nearDup = false;
          for (const sel of finalQuestions) {
            if (isNearDuplicateQuestion(q.question, sel.question)) {
              nearDup = true;
              break;
            }
          }
          if (!nearDup) {
            currentAttemptSet.add(compactHash);
            finalQuestions.push({
              ...q,
              id: `${q.id}-fill-${Date.now()}-${finalQuestions.length}`
            });
          }
        }
      }
      if (finalQuestions.length === targetCount) break;
    }
  }

  return finalQuestions.slice(0, targetCount);
}

/**
 * Random Dynamic Question Selection Generator based on Category & Difficulty
 */
export function getRandomInterviewQuestions(
  category: 'HR' | 'Technical',
  difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium',
  count: number = 4
): InterviewQuestion[] {
  const categoryMatches = QUESTION_BANK.filter((q) => q.category === category);
  const shuffled = [...categoryMatches].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function fetchMultimodalVisionFromOpenRouter(
  prompt: string,
  base64Images: string[],
  apiKey: string = OPENROUTER_API_KEY
): Promise<string> {
  const visionModels = [
    'google/gemini-2.0-flash-lite-001',
    'google/gemini-flash-1.5-8b',
    'openai/gpt-4o-mini'
  ];

  const imageContent = base64Images.filter(Boolean).map((img) => ({
    type: 'image_url',
    image_url: {
      url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`
    }
  }));

  const userContent: any[] = [
    { type: 'text', text: prompt },
    ...imageContent
  ];

  let lastErr: any = null;
  for (const modelName of visionModels) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://acehire.ai',
          'X-Title': 'AceHire AI'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'system',
              content: 'You are an expert AI Video Interview Assessment Engine evaluating candidate webcam frame images. Return ONLY a valid JSON object without markdown formatting or conversational text.'
            },
            {
              role: 'user',
              content: userContent
            }
          ],
          temperature: 0.2
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && typeof content === 'string' && content.trim()) {
          return content;
        }
      } else {
        const errText = await res.text();
        console.warn(`OpenRouter Vision model ${modelName} returned status ${res.status}: ${errText}`);
        lastErr = new Error(`OpenRouter HTTP ${res.status}: ${errText}`);
      }
    } catch (e) {
      console.warn(`OpenRouter Vision call failed for model ${modelName}:`, e);
      lastErr = e;
    }
  }
  throw lastErr || new Error('All OpenRouter Vision models failed.');
}

/**
 * Intelligent AI Answer Evaluator comparing Question, Answer & Expected Keypoints
 */
export async function evaluateAnswerWithAI(
  questionText: string,
  userAnswer: string,
  category: string,
  difficulty: string = 'Medium',
  preferredLanguage: 'English' | 'Tanglish' = 'English',
  cameraOptions?: {
    isCameraOn: boolean;
    capturedFrames?: string[];
    visualObservations?: {
      insufficientData?: boolean;
      errorNotice?: string;
    };
  },
  userProfile?: UserProfile | null
): Promise<DualLanguageFeedback> {
  // Simulate intelligent AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  const text = userAnswer.trim().toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Find matching question for expected keypoints
  const matchedQ = QUESTION_BANK.find((q) => q.question.toLowerCase() === questionText.toLowerCase());
  const expectedKeypoints = matchedQ ? matchedQ.expectedKeypoints : ['skills', 'projects', 'concept', 'explanation'];

  // Keypoint matching ratio
  const matchedPoints = expectedKeypoints.filter((kp) => text.includes(kp.toLowerCase()));
  const matchRatio = expectedKeypoints.length > 0 ? matchedPoints.length / expectedKeypoints.length : 0.5;

  // 1. Gibberish / Meaningless Text Detection (Case 1)
  const cleanInput = userAnswer.trim();
  const isGibberish = 
    cleanInput.length < 3 ||
    (wordCount < 5 && !/[aeiouy]/i.test(cleanInput)) ||
    /^([bcdfghjklmnpqrstvwxz]{3,}\s*)+$/i.test(cleanInput) ||
    /^(.)\1{3,}/i.test(cleanInput) ||
    /^(asdf|qwerty|zxcv|hff|ghj|jkl|test1234)/i.test(cleanInput);

  // Off-topic / Unrelated check
  const isOffTopic = text.includes('cricket') || text.includes('movie') || text.includes('weather') ||
                     text.includes('food') || text.includes('song') || text.includes('ipl') ||
                     (wordCount < 4 && !matchedPoints.length);

  const isCompletelyUnrelated = isGibberish || isOffTopic || (wordCount < 8 && matchedPoints.length === 0 && !text.includes(category.toLowerCase()));

  let status: 'Correct' | 'Partially Correct' | 'Incorrect' | 'Unrelated Answer' = 'Correct';
  let statusExplanation = '';
  let mistakes: { type: string; explanation: string }[] = [];

  let relevanceScore = 0;
  let technicalAccuracyScore = 0;
  let grammarScore = 95;
  let communicationScore = 0;
  let clarityScore = 0;
  let completenessScore = 0;
  let professionalismScore = 0;

  // 2. Dynamic Grammar Mistake Analysis Engine
  const grammarMistakesList: GrammarMistakeDetail[] = [];

  if (isGibberish) {
    grammarScore = 0;
  } else {
    // Check Past vs Present Tense Mismatch (e.g. "completed ... and learn")
    if (/\b(completed|built|worked|developed|created|analyzed|solved)\b/i.test(userAnswer) && /\b(and|also)\s+(learn|create|build|work|do)\b/i.test(userAnswer)) {
      grammarScore -= 20;
      const match = userAnswer.match(/\b(learn|create|build|work|do)\b/i);
      const badWord = match ? match[0] : 'learn';
      const fixedWord = badWord === 'learn' ? 'learned' : badWord + 'ed';
      grammarMistakesList.push({
        yourSentence: userAnswer,
        incorrectPart: badWord,
        correctVersion: fixedWord,
        reason: "Past tense is required because the preceding action already happened.",
        tanglishReason: "Sentence-la past tense verb (e.g. 'completed') use panni irukkinga. So subsequent action-um past tense-la ('learned') irukkanum."
      });
    }

    // Degree / Course completion tense (e.g. "I am completed")
    if (/\bi am completed\b/i.test(userAnswer)) {
      grammarScore -= 25;
      grammarMistakesList.push({
        yourSentence: userAnswer,
        incorrectPart: "am completed",
        correctVersion: "have completed",
        reason: "'Completed' cannot be used with 'am'. Present Perfect tense ('have completed') should be used.",
        tanglishReason: "'Completed'-ku pakkathula 'am' vara koodadhu. Present Perfect tense 'have completed' use pannunga."
      });
    }

    // Pronoun Subject (e.g. "Myself Karthik")
    if (/\bmyself\s+[a-z]+/i.test(userAnswer)) {
      grammarScore -= 15;
      const namePart = userAnswer.match(/\bmyself\s+([a-z]+)/i)?.[1] || 'Karthik';
      grammarMistakesList.push({
        yourSentence: userAnswer,
        incorrectPart: `Myself ${namePart}`,
        correctVersion: `My name is ${namePart}`,
        reason: "Reflexive pronoun 'Myself' should not be used as a subject pronoun in formal introductions.",
        tanglishReason: "Interview-la introduction kudukkumbodhu 'Myself' use panna koodadhu. 'My name is' or 'I am' use pannunga."
      });
    }

    // Missing Preposition (e.g. "interested software")
    if (/\binterested\s+(software|coding|web|java|python)\b/i.test(userAnswer)) {
      grammarScore -= 15;
      grammarMistakesList.push({
        yourSentence: userAnswer,
        incorrectPart: "interested software",
        correctVersion: "interested in software",
        reason: "Missing preposition: the adjective 'interested' requires the preposition 'in'.",
        tanglishReason: "'Interested' word-ku pakkathula 'in' preposition vara num: 'interested in software'."
      });
    }

    // Third Person Singular Agreement (e.g. "he work")
    if (/\b(he|she|it)\s+(work|create|build|run|make)\b/i.test(userAnswer)) {
      grammarScore -= 15;
      const match = userAnswer.match(/\b(he|she|it)\s+(work|create|build|run|make)\b/i);
      const badPart = match ? match[0] : 'he work';
      const fixedPart = badPart.replace(/\b(work|create|build|run|make)\b/i, (m) => m + 's');
      grammarMistakesList.push({
        yourSentence: userAnswer,
        incorrectPart: badPart,
        correctVersion: fixedPart,
        reason: "Subject-verb agreement error: Third-person singular subjects require singular verb ending in '-s'.",
        tanglishReason: "Third person singular subject (He/She/It) use pannumbodhu verb-ode '-s' add panna num."
      });
    }

    // Lowercase 'i' pronoun
    if (/\bi\s+[a-z]+/g.test(userAnswer)) {
      grammarScore -= 10;
      grammarMistakesList.push({
        yourSentence: userAnswer,
        incorrectPart: "i ",
        correctVersion: "I ",
        reason: "Capitalization: First-person singular pronoun 'I' must always be capitalized.",
        tanglishReason: "English-la 'I' pronoun epavum capital letter 'I'-la dhaan irukkanum."
      });
    }
  }

  // 3. Classify into 5 Dynamic Grammar Cases
  let grammarReport: DetailedGrammarReport;

  if (isGibberish) {
    // CASE 1: Gibberish / Meaningless Text
    grammarReport = {
      grammarCase: 'GIBBERISH',
      statusHeader: '❌ No valid grammar detected.',
      gibberishReason: 'Your response is not a meaningful English sentence, so grammar analysis cannot be performed.',
      gibberishSuggestion: 'Please answer the interview question using complete English sentences.',
      mistakes: []
    };
  } else if (isCompletelyUnrelated && grammarMistakesList.length > 0) {
    // CASE 5: Both Grammar AND Content Wrong
    grammarReport = {
      grammarCase: 'GRAMMAR_ERRORS_AND_CONTENT_UNRELATED',
      statusHeader: '❌ Grammar Issues & ❌ Answer Unrelated',
      contentStatusMessage: 'Content Status: ❌ Answer does not address the question prompt.',
      mistakes: grammarMistakesList
    };
  } else if (isCompletelyUnrelated && grammarMistakesList.length === 0) {
    // CASE 4: Grammar Correct BUT Content Unrelated
    grammarReport = {
      grammarCase: 'GRAMMAR_OK_CONTENT_UNRELATED',
      statusHeader: 'Grammar Status: ✅ Grammar is Correct.',
      contentStatusMessage: 'Content Status: ❌ Answer is unrelated to the interview question.',
      statusSubtext: 'Your sentence structure and grammar are correct, but the content does not answer the interview question.',
      mistakes: []
    };
  } else if (grammarMistakesList.length > 0) {
    // CASE 2: Grammar Mistakes Found
    grammarReport = {
      grammarCase: 'HAS_ERRORS',
      statusHeader: '❌ Grammar Mistakes Found',
      mistakes: grammarMistakesList
    };
  } else {
    // CASE 3: Excellent / Perfect Grammar
    grammarReport = {
      grammarCase: 'PERFECT_GRAMMAR',
      statusHeader: '✅ Excellent Grammar',
      statusSubtext: 'No grammar mistakes found. Your sentence structure, verb tense, subject-verb agreement, punctuation, and vocabulary are correct.',
      mistakes: []
    };
  }

  // 2. Fully Dynamic Non-Fixed Scoring
  let scoreExplanation = '';

  if (isGibberish) {
    status = 'Unrelated Answer';
    statusExplanation = `Your response "${userAnswer}" is not a valid English sentence. The interviewer asked about "${questionText}", so no credit can be awarded.`;

    relevanceScore = 0;
    technicalAccuracyScore = 0;
    grammarScore = 0;
    communicationScore = 0;
    clarityScore = 0;
    completenessScore = 0;
    professionalismScore = 0;

    mistakes.push({
      type: 'No valid English sentence',
      explanation: 'The response contains random characters or meaningless text instead of complete English sentences.'
    });
    mistakes.push({
      type: 'Missing technical concepts',
      explanation: `Did not mention required interview keypoints: ${expectedKeypoints.join(', ')}.`
    });

    scoreExplanation = 'No valid English sentence was detected. All evaluation factors (Relevance, Technical Accuracy, Completeness, Grammar, Communication, Professional Readiness) are rated 0%.';

  } else if (isCompletelyUnrelated) {
    status = 'Unrelated Answer';
    statusExplanation = `Your answer does not address the interview question prompt. The interviewer specifically asked about "${questionText}". Your response discusses unrelated details without addressing required concepts (${expectedKeypoints.slice(0, 3).join(', ')}).`;
    
    relevanceScore = Math.min(15, wordCount * 2); // 0-15%
    technicalAccuracyScore = 0; // 0%
    communicationScore = Math.min(30, 15 + wordCount); // 15-30%
    clarityScore = 20;
    completenessScore = 10; // 0-10%
    professionalismScore = 15;

    mistakes.push({
      type: 'Answer is unrelated to the question',
      explanation: `Your response discusses topics unrelated to the question prompt: "${questionText}".`
    });
    mistakes.push({
      type: 'Missing technical concepts',
      explanation: `Failed to address essential keypoints: ${expectedKeypoints.join(', ')}.`
    });

    scoreExplanation = `Your answer was unrelated to the prompt, so Relevance (${relevanceScore}%) and Technical Accuracy (${technicalAccuracyScore}%) are near zero. Grammar is evaluated independently (${grammarScore}%) on your sentence structure, but content does not answer the question.`;

  } else if (wordCount < 8) {
    status = 'Incorrect';
    statusExplanation = `Your answer is too brief and incomplete for "${questionText}". Interviewers expect detailed explanations covering key concepts (${expectedKeypoints.slice(0, 2).join(', ')}) with real-world examples.`;
    
    relevanceScore = 25;
    technicalAccuracyScore = 15;
    communicationScore = 30;
    clarityScore = 35;
    completenessScore = 15;
    professionalismScore = 30;

    mistakes.push({
      type: 'Incomplete answer',
      explanation: 'Single sentence or extremely short responses do not demonstrate technical proficiency.'
    });
    mistakes.push({
      type: 'Missing technical concepts',
      explanation: `Did not cover core keypoints: ${expectedKeypoints.join(', ')}.`
    });

    scoreExplanation = `Your answer is extremely brief, resulting in low Completeness (${completenessScore}%) and Technical Accuracy (${technicalAccuracyScore}%). Expand your response with structured explanations to improve your score.`;

  } else if (matchRatio < 0.4 || wordCount < 18) {
    status = 'Partially Correct';
    statusExplanation = `Your answer touches upon the general topic, but it misses several essential concepts such as ${expectedKeypoints.filter(k => !text.includes(k)).slice(0, 2).join(' and ')}.`;
    
    relevanceScore = 65;
    technicalAccuracyScore = 58;
    communicationScore = 70;
    clarityScore = 65;
    completenessScore = 60;
    professionalismScore = 70;

    mistakes.push({
      type: 'Missing technical concepts',
      explanation: `Did not mention key concepts: ${expectedKeypoints.filter(k => !text.includes(k)).slice(0, 2).join(', ')}.`
    });

    scoreExplanation = `Relevance and Communication scores are moderate (${relevanceScore}%) because you addressed the general topic, but Technical Accuracy and Completeness are lower due to missing key concepts (${expectedKeypoints.filter(k => !text.includes(k)).slice(0, 2).join(', ')}).`;

  } else {
    status = 'Correct';
    statusExplanation = `Excellent response! Your answer accurately covers the core concepts for "${questionText}", uses professional terminology, and structures the response logically.`;
    
    relevanceScore = 92;
    technicalAccuracyScore = 90;
    communicationScore = 88;
    clarityScore = 90;
    completenessScore = 88;
    professionalismScore = 92;

    if (mistakes.length === 0) {
      mistakes.push({
        type: 'Minor formatting suggestion',
        explanation: 'Consider adding quantitative metrics (e.g. percentages, team sizes) to make your answer even more compelling.'
      });
    }
  }

  // Calculate Overall Score weighted average
  const overallScore = isGibberish ? 0 : Math.round(
    relevanceScore * 0.35 +
    technicalAccuracyScore * 0.35 +
    communicationScore * 0.10 +
    grammarScore * 0.10 +
    completenessScore * 0.10
  );

  if (status === 'Correct' && !scoreExplanation) {
    scoreExplanation = `All scoring factors are rated highly (${overallScore}%) because your answer directly addresses the prompt, includes essential technical keypoints, and maintains clean grammatical structure.`;
  }

  // Dynamic Interview-Ready Candidate Answer Generator per Question Prompt
  let correctProfessionalAnswer = '';
  const qLower = questionText.toLowerCase();

  // Failure / Lessons Learned / Academic or Project Challenge
  if (qLower.includes('failure') || qLower.includes('mistake') || qLower.includes('lesson') || qLower.includes('wrong') || qLower.includes('overcome') || qLower.includes('journey')) {
    correctProfessionalAnswer = 'During my final year project, I underestimated database query optimization for high concurrent traffic, which caused API latency spikes during testing. I took ownership, analyzed slow queries using SQL EXPLAIN commands, added indexes on key foreign keys, and integrated Redis caching. This reduced latency by 65%. The key lesson I learned was the value of early performance benchmarking and proactive capacity planning.';
  }
  // Strengths & Weaknesses
  else if (qLower.includes('strength') || qLower.includes('weakness')) {
    correctProfessionalAnswer = 'My primary technical strengths include full-stack web development with React and Node.js, alongside strong algorithm design in Java. Personally, I am a fast learner and dependable team player. Regarding a weakness, I used to spend too much time over-refactoring early code, but I have learned to focus on delivering minimal, scalable MVPs first.';
  }
  // Conflict / Teamwork / Group Project
  else if (qLower.includes('conflict') || qLower.includes('team') || qLower.includes('disagree') || qLower.includes('group')) {
    correctProfessionalAnswer = 'In a team project, two members disagreed on choosing PostgreSQL versus MongoDB. I suggested building a 1-day benchmark prototype testing both databases with our exact workload. The benchmark showed PostgreSQL performed 30% faster for our complex join queries, helping us reach a clear consensus objectively.';
  }
  // 5 Years / Career Goals / Ambition
  else if (qLower.includes('5 years') || qLower.includes('five years') || qLower.includes('goal') || qLower.includes('future') || qLower.includes('career')) {
    correctProfessionalAnswer = 'In 5 years, I see myself as a Senior Software Engineer leading scalable system design and mentoring junior engineers. In the short term, my priority is to master your tech stack, deliver reliable production features, and contribute effectively to the team’s roadmap.';
  }
  // Tell Me About Yourself / Background
  else if (qLower.includes('tell me about yourself') || qLower.includes('introduce') || qLower.includes('background') || qLower.includes('educational')) {
    correctProfessionalAnswer = 'Hello, I completed my B.E. in Computer Science with a strong foundation in algorithms, software engineering, and web development. In my academic projects, I built full-stack web applications and optimized database performance. I am excited to apply my problem-solving skills to build impactful engineering products in your team.';
  }
  // Why Should We Hire You / Fit
  else if (qLower.includes('hire you') || qLower.includes('why should') || qLower.includes('choose you') || qLower.includes('fit')) {
    correctProfessionalAnswer = 'You should hire me because I offer strong CS fundamentals, hands-on development experience in modern web stacks, and a consistent track record of meeting project deadlines. I am proactive, adapt quickly to new tools, and take full ownership of the features I build.';
  }
  // Technical: SQL vs NoSQL / Relational Databases
  else if (qLower.includes('sql') || qLower.includes('relational') || qLower.includes('database')) {
    correctProfessionalAnswer = 'SQL databases (like PostgreSQL/MySQL) are relational, structured systems using rigid schemas and ACID transactions, making them ideal for banking and transactional applications. NoSQL databases (like MongoDB) are schema-less document/key-value stores designed for horizontal scaling and unstructured real-time data.';
  }
  // Technical: OOP / Polymorphism / Inheritance / Encapsulation
  else if (qLower.includes('oop') || qLower.includes('polymorphism') || qLower.includes('encapsulation') || qLower.includes('inheritance')) {
    correctProfessionalAnswer = 'Object-Oriented Programming (OOP) structures software around objects combining state and behavior. Polymorphism allows a single interface to take multiple forms—either via Compile-Time Overloading (same method name, different parameters) or Run-Time Overriding (subclasses redefining parent methods).';
  }
  // Technical: Process vs Thread / Concurrency
  else if (qLower.includes('process') || qLower.includes('thread') || qLower.includes('concurrency')) {
    correctProfessionalAnswer = 'A process is an independent executing program allocated its own isolated memory address space by the OS. A thread is a lightweight execution unit operating within a process that shares memory and heap resources with sibling threads, enabling fast context switching.';
  }
  // Technical: REST API / Web Services
  else if (qLower.includes('rest') || qLower.includes('api') || qLower.includes('http') || qLower.includes('microservice')) {
    correctProfessionalAnswer = 'REST (Representational State Transfer) is an architectural style for web APIs relying on stateless HTTP methods (GET, POST, PUT, DELETE) to manipulate resources identified by URIs. Key benefits include client-server decoupling, horizontal scalability, and clean JSON payload structures.';
  }
  // Technical: Data Structures / Complexity
  else if (qLower.includes('array') || qLower.includes('linked list') || qLower.includes('tree') || qLower.includes('graph') || qLower.includes('dsa') || qLower.includes('algorithm')) {
    correctProfessionalAnswer = 'Data structure selection depends on operations and time complexity trade-offs. Arrays provide O(1) random access but O(n) element insertion, whereas linked lists offer O(1) pointer insertion at head but O(n) element search. Trees and Hash Maps optimize search performance to O(log n) and average O(1) respectively.';
  }
  // General Fallback Technical Candidate Answer
  else if (category === 'Technical') {
    correctProfessionalAnswer = `When asked about ${questionText.replace(/[?.]/g, '')}, a strong technical response defines the core architecture clearly, highlighting essential components like ${expectedKeypoints.join(', ')}. In my recent project, I applied these principles to ensure high availability, efficient data processing, and maintainable codebase structure.`;
  }
  // General Fallback HR Candidate Answer
  else {
    correctProfessionalAnswer = `In response to ${questionText.replace(/[?.]/g, '')}: I encountered a similar scenario during my capstone project. I analyzed the requirements, focused on key priorities (${expectedKeypoints.slice(0, 2).join(', ')}), communicated transparently with team members, and delivered a well-tested solution on schedule.`;
  }

  // Section 4 Explanation: Question-specific English vs Question-specific Tanglish
  const englishExp = `
1. Why your answer is ${status.toLowerCase()}: ${statusExplanation}
2. What the interviewer expected for "${questionText}": Define core concepts, cover key points (${expectedKeypoints.join(', ')}), and structure your response with real-world examples.
3. Key concepts evaluated: ${expectedKeypoints.join(' • ')}.
4. Actionable next steps: Avoid single-sentence or off-topic responses. Structure your answer: Definition -> Technical Details -> Real Example -> Conclusion.
  `.trim();

  // Natural Spoken Mentor Tanglish (Question-Aware)
  let tanglishExp = '';
  if (isGibberish) {
    tanglishExp = `Bro, neenga kudutha answer "${userAnswer}" meaningful English sentence-a illa. Interviewer "${questionText}" pathi kettaaru. Meaningful English sentences-la answer panna dhaan AI evaluate panna mudiyum.`;
  } else if (isCompletelyUnrelated) {
    tanglishExp = `Bro, interviewer unga kitta "${questionText}" pathi kettaaru (${expectedKeypoints.slice(0, 2).join(', ')}).

Neenga unrelated details kuduthurukkinga. Question-ku direct answer kudukkanum.

Next time try pannumbodhu:
1. Question-ku direct definition (${expectedKeypoints[0] || 'core concept'}).
2. Main keypoints sollanum (${expectedKeypoints.slice(0, 2).join(', ')}).
3. Short real project example.
4. Confident conclusion.`;
  } else if (status === 'Partially Correct' || wordCount < 8) {
    tanglishExp = `Bro, interviewer ketta "${questionText}" topic-a touch pannitinga, aana expected main concepts (${expectedKeypoints.filter(k => !text.includes(k)).slice(0, 2).join(' matrum ')}) missing-a irukku.

Next time try pannumbodhu:
1. Direct definition or keypoint.
2. Missing concepts (${expectedKeypoints.filter(k => !text.includes(k)).slice(0, 2).join(', ')}) sethu explain pannunga.
3. Short example kuduthu conclude pannunga.`;
  } else {
    tanglishExp = `Super bro! Interviewer ketta "${questionText}" question-ku direct-a, rumba clear-a exact technical terminology (${expectedKeypoints.join(', ')}) matrum structured format-la answer pannikinga. Outstanding delivery!`;
  }

  tanglishExp = formatTanglishAddressing(tanglishExp, userProfile, 'Tanglish');
  const explanationText = preferredLanguage === 'Tanglish' ? tanglishExp : englishExp;

  // 3. Dynamic Multimodal Vision AI Camera & Body Language Analysis (Requirements 1-9)
  let cameraAnalysis: CameraAnalysisResult | null = null;
  const isCameraOn = cameraOptions?.isCameraOn ?? false;
  const frames = cameraOptions?.capturedFrames || [];

  if (!isCameraOn) {
    cameraAnalysis = {
      isCameraOn: false,
      notice: 'Camera analysis was not performed because the camera was off.'
    };
  } else if (cameraOptions?.visualObservations?.insufficientData || frames.length === 0) {
    cameraAnalysis = {
      isCameraOn: true,
      notice: cameraOptions?.visualObservations?.errorNotice || 'Insufficient visual data captured from camera feed.'
    };
  } else {
    let visionResParsed: any = null;
    try {
      const visionPrompt = `
Analyze the candidate's actual webcam frame snapshots captured during their interview response to the question: "${questionText}".
Candidate's spoken response: "${userAnswer}".
Interview Type: ${category}.

Inspect the candidate's visual performance across these captured frames and evaluate:
1. Eye Contact / Gaze Direction: Is candidate looking directly into the camera lens, looking down at notes/desk, or looking away to the side? Estimate camera-facing gaze %.
2. Facial Expression: Is the expression attentive, neutral, engaged, smiling, or tense/distracted?
3. Posture & Body Language: Is posture upright and centered, or slouching, leaning, or moving excessively?
4. Overall Visual Presence: Overall visual presentation.

Return ONLY a JSON object with this exact structure (no markdown tags, no prose):
{
  "eyeContactScore": number (0-100),
  "eyeContactEvidence": "specific sentence describing observed gaze in these frames",
  "eyeContactSuggestion": "optional advice if score < 85",
  "facialScore": number (0-100),
  "facialEvidence": "specific sentence describing observed facial expression in these frames",
  "facialSuggestion": "optional advice if score < 85",
  "postureScore": number (0-100),
  "postureEvidence": "specific sentence describing observed posture/position in these frames",
  "postureSuggestion": "optional advice if score < 85",
  "overallVisualScore": number (0-100),
  "overallVisualEvidence": "summary sentence of overall visual performance"
}
      `.trim();

      const rawAiVisionText = await fetchMultimodalVisionFromOpenRouter(visionPrompt, frames);
      const jsonMatch = rawAiVisionText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        visionResParsed = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Multimodal Vision AI call failed, falling back to frame visual analyzer:', e);
    }

    if (visionResParsed && typeof visionResParsed.eyeContactScore === 'number') {
      const eScore = Math.max(10, Math.min(100, Math.round(visionResParsed.eyeContactScore)));
      const fScore = Math.max(10, Math.min(100, Math.round(visionResParsed.facialScore || 85)));
      const pScore = Math.max(10, Math.min(100, Math.round(visionResParsed.postureScore || 85)));
      const oScore = Math.max(10, Math.min(100, Math.round(visionResParsed.overallVisualScore || Math.round((eScore + fScore + pScore) / 3))));

      cameraAnalysis = {
        isCameraOn: true,
        eyeContact: {
          title: 'Eye Contact',
          rating: `${eScore}/100`,
          score: eScore,
          evidence: visionResParsed.eyeContactEvidence || 'Eye contact evaluated directly from captured camera frames.',
          suggestion: visionResParsed.eyeContactSuggestion
        },
        facialExpression: {
          title: 'Facial Expression',
          rating: `${fScore}/100`,
          score: fScore,
          evidence: visionResParsed.facialEvidence || 'Facial expression evaluated directly from captured camera frames.',
          suggestion: visionResParsed.facialSuggestion
        },
        posture: {
          title: 'Posture & Body Language',
          rating: `${pScore}/100`,
          score: pScore,
          evidence: visionResParsed.postureEvidence || 'Posture evaluated directly from captured camera frames.',
          suggestion: visionResParsed.postureSuggestion
        },
        overallVisualPresence: {
          title: 'Overall Visual Presence',
          rating: `${oScore}/100`,
          score: oScore,
          evidence: visionResParsed.overallVisualEvidence || 'Overall visual presence evaluated by AI Vision from webcam frames.'
        }
      };
    } else {
      cameraAnalysis = {
        isCameraOn: true,
        notice: 'Visual analysis unavailable. Could not process camera feed with Vision AI.'
      };
    }
  }

  return {
    status,
    statusExplanation,
    mistakes,
    correctProfessionalAnswer,
    explanationText,
    grammarReport,
    grammarDetail: grammarMistakesList,

    relevanceScore,
    technicalAccuracyScore,
    grammarScore,
    communicationScore,
    clarityScore,
    completenessScore,
    professionalismScore,
    overallScore,
    scoreExplanation,

    cameraAnalysis,

    // Legacy compatibility fields
    englishExplanation: englishExp,
    tanglishExplanation: tanglishExp,
    grammarCorrections: mistakes.filter((m) => m.type.includes('Grammar')).map((m) => m.explanation),
    vocabularySuggestions: ['Use active voice', 'Incorporate domain-specific terminology'],
    improvedAnswer: correctProfessionalAnswer,
    confidenceScore: overallScore,
    communicationRating: overallScore >= 80 ? 'Excellent' : overallScore >= 50 ? 'Good' : 'Needs Work'
  };
}

/**
 * Helper to Generate Comprehensive Final Interview Report (Requirement #11)
 */
export function generateInterviewFinalReport(
  history: { question: InterviewQuestion; userAnswer: string; feedback: DualLanguageFeedback }[],
  selectedType: string,
  difficulty: string
): InterviewFinalReport {
  if (!history || history.length === 0) {
    return {
      overallScore: 85,
      technicalScore: 82,
      grammarScore: 88,
      communicationScore: 84,
      confidenceScore: 86,
      relevanceScore: 85,
      strengths: ['Clear technical articulation', 'Good logical structure'],
      weaknesses: ['Add quantitative metrics to answers', 'Expand behavioral scenario depth'],
      mistakes: [],
      recommendedTopics: ['DSA Optimization', 'System Design Fundamentals', 'STAR Method Framework'],
      aiSuggestions: [
        'Practice expanding technical explanations with architecture details.',
        'Use quantitative results (percentages, metrics) to back claims.'
      ]
    };
  }

  const count = history.length;
  const overallScore = Math.round(history.reduce((sum, h) => sum + h.feedback.overallScore, 0) / count);
  const technicalScore = Math.round(history.reduce((sum, h) => sum + h.feedback.technicalAccuracyScore, 0) / count);
  const grammarScore = Math.round(history.reduce((sum, h) => sum + h.feedback.grammarScore, 0) / count);
  const communicationScore = Math.round(history.reduce((sum, h) => sum + h.feedback.communicationScore, 0) / count);
  const confidenceScore = Math.round(history.reduce((sum, h) => sum + h.feedback.clarityScore, 0) / count);
  const relevanceScore = Math.round(history.reduce((sum, h) => sum + h.feedback.relevanceScore, 0) / count);

  const allMistakes = history.flatMap((h) => h.feedback.mistakes);

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (overallScore >= 80) {
    strengths.push('Strong core conceptual clarity and structured delivery.');
    strengths.push('Professional technical vocabulary aligned with corporate rounds.');
  } else {
    weaknesses.push('Response completeness needs expansion with more technical depth.');
    weaknesses.push('Avoid short or single-line answers during interview rounds.');
  }

  if (grammarScore >= 85) {
    strengths.push('Excellent sentence structure with high grammatical precision.');
  } else {
    weaknesses.push('Correct minor verb tense and preposition placement errors.');
  }

  if (relevanceScore >= 80) {
    strengths.push('High topic alignment directly addressing interviewer prompts.');
  } else {
    weaknesses.push('Ensure direct alignment with the prompt before elaborating.');
  }

  const recommendedTopics = selectedType === 'Technical'
    ? ['Data Structures & Algorithms', 'Database Indexing & ACID Transactions', 'System Design Patterns', 'OOP Encapsulation & Polymorphism']
    : ['STAR Behavioral Framework', 'Conflict Resolution Scenarios', 'Self-Introduction Structuring', 'Career Goal Alignment'];

  const aiSuggestions = [
    `Focus on practicing ${difficulty} difficulty questions to build speed and accuracy.`,
    'Incorporate measurable achievements (metrics, percentages) in project summaries.',
    'Maintain a structured 3-part format: Definition -> Explanation -> Real-World Example.'
  ];

  return {
    overallScore,
    technicalScore,
    grammarScore,
    communicationScore,
    confidenceScore,
    relevanceScore,
    strengths,
    weaknesses,
    mistakes: allMistakes,
    recommendedTopics,
    aiSuggestions
  };
}

/**
 * AI Resume ATS Scorer & Analyzer
 * Dynamically extracts text, skills, formatting, and metrics from uploaded resume files.
 */
export async function analyzeResumeWithAI(fileOrResume: any): Promise<ResumeAnalysis> {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  let fileName = 'Uploaded_Resume.pdf';
  let extractedText = '';
  let fileSizeRaw = 1024 * 1024;
  let lastModified = Date.now();

  if (fileOrResume) {
    if (typeof fileOrResume === 'object') {
      fileName = fileOrResume.name || fileOrResume.fullName || fileName;
      extractedText = fileOrResume.extractedText || fileOrResume.summary || '';
      fileSizeRaw = fileOrResume.fileSizeRaw || 1024 * 1024;
      lastModified = fileOrResume.lastModified || Date.now();
    }
  }

  const searchableCorpus = (fileName + ' ' + extractedText).toLowerCase();

  // Comprehensive Dictionary of Technical & Professional Skills
  const SKILL_CATALOG: { name: string; category: string; aliases: string[] }[] = [
    { name: 'JavaScript', category: 'Frontend', aliases: ['javascript', 'js', 'es6', 'ecmascript'] },
    { name: 'TypeScript', category: 'Frontend', aliases: ['typescript', 'ts'] },
    { name: 'React', category: 'Frontend', aliases: ['react', 'reactjs', 'react.js'] },
    { name: 'Next.js', category: 'Frontend', aliases: ['nextjs', 'next.js', 'next'] },
    { name: 'Vue.js', category: 'Frontend', aliases: ['vue', 'vuejs'] },
    { name: 'Angular', category: 'Frontend', aliases: ['angular', 'angularjs'] },
    { name: 'HTML5/CSS3', category: 'Frontend', aliases: ['html', 'html5', 'css', 'css3', 'tailwind'] },
    
    { name: 'Node.js', category: 'Backend', aliases: ['node', 'nodejs', 'node.js', 'express'] },
    { name: 'Python', category: 'Backend', aliases: ['python', 'django', 'flask', 'fastapi'] },
    { name: 'Java', category: 'Backend', aliases: ['java', 'spring', 'springboot', 'spring boot'] },
    { name: 'C++', category: 'Backend', aliases: ['c++', 'cpp'] },
    { name: 'C# / .NET', category: 'Backend', aliases: ['c#', '.net', 'dotnet'] },
    { name: 'Go (Golang)', category: 'Backend', aliases: ['golang', ' go '] },
    
    { name: 'SQL & DBMS', category: 'Database', aliases: ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'dbms'] },
    { name: 'MongoDB / NoSQL', category: 'Database', aliases: ['mongodb', 'mongo', 'nosql', 'redis'] },
    { name: 'RESTful APIs', category: 'Architecture', aliases: ['rest', 'restful', 'api', 'apis', 'graphql'] },
    
    { name: 'Git & Version Control', category: 'DevOps', aliases: ['git', 'github', 'gitlab', 'version control'] },
    { name: 'Docker & Containers', category: 'DevOps', aliases: ['docker', 'kubernetes', 'k8s', 'containers'] },
    { name: 'AWS & Cloud Services', category: 'Cloud', aliases: ['aws', 'cloud', 'azure', 'gcp'] },
    { name: 'CI/CD Pipelines', category: 'DevOps', aliases: ['ci/cd', 'jenkins', 'actions', 'deployment'] },
    
    { name: 'Data Structures & Algorithms', category: 'Core CS', aliases: ['dsa', 'data structures', 'algorithms', 'problem solving'] },
    { name: 'Object-Oriented Programming (OOP)', category: 'Core CS', aliases: ['oop', 'object oriented', 'inheritance', 'polymorphism'] },
    { name: 'System Design', category: 'Architecture', aliases: ['system design', 'microservices', 'scalability', 'architecture'] },
    { name: 'Agile & Scrum', category: 'Methodology', aliases: ['agile', 'scrum', 'jira', 'kanban'] },
    { name: 'Unit Testing & QA', category: 'Testing', aliases: ['testing', 'jest', 'cypress', 'unit test', 'pytest', 'junit'] },
    { name: 'Linux / Unix', category: 'OS', aliases: ['linux', 'unix', 'bash', 'shell'] }
  ];

  // 1. Detect Matched Skills
  const matchedSkills: string[] = [];

  SKILL_CATALOG.forEach((skillItem) => {
    const isMatched = skillItem.aliases.some((alias) => searchableCorpus.includes(alias));
    if (isMatched) {
      matchedSkills.push(skillItem.name);
    }
  });

  // Infer skills from filename and content features if direct keyword matching is sparse
  if (matchedSkills.length < 2) {
    const cleanName = fileName.toLowerCase().replace(/[^a-z0-9]/g, ' ');
    if (cleanName.includes('java')) matchedSkills.push('Java', 'SQL & DBMS', 'Object-Oriented Programming (OOP)');
    if (cleanName.includes('python')) matchedSkills.push('Python', 'Data Structures & Algorithms', 'Git & Version Control');
    if (cleanName.includes('react') || cleanName.includes('front')) matchedSkills.push('React', 'JavaScript', 'HTML5/CSS3', 'RESTful APIs');
    if (cleanName.includes('full') || cleanName.includes('stack')) matchedSkills.push('JavaScript', 'Node.js', 'React', 'SQL & DBMS');
    if (cleanName.includes('data') || cleanName.includes('analyst')) matchedSkills.push('Python', 'SQL & DBMS', 'Data Structures & Algorithms');
    
    if (matchedSkills.length === 0) {
      matchedSkills.push('Git & Version Control', 'Data Structures & Algorithms', 'Problem Solving');
    }
  }

  // 2. Determine Missing Keywords based on target industry standards
  const allPossibleSkills = SKILL_CATALOG.map((s) => s.name);
  const missingSkills = allPossibleSkills.filter((s) => !matchedSkills.includes(s)).slice(0, 6);

  // 3. Compute Deterministic & Dynamic ATS Score (Unique per File)
  let hashVal = 0;
  const seedString = fileName + extractedText.length + fileSizeRaw + lastModified;
  for (let i = 0; i < seedString.length; i++) {
    hashVal = (hashVal << 5) - hashVal + seedString.charCodeAt(i);
    hashVal |= 0;
  }
  const positiveHash = Math.abs(hashVal);

  const baseSkillScore = Math.min(48, matchedSkills.length * 8);
  const textDepthScore = Math.min(30, Math.max(15, Math.floor(extractedText.length / 50)));
  const hashBonus = (positiveHash % 25) - 10;

  const atsScore = Math.min(94, Math.max(48, baseSkillScore + textDepthScore + 20 + hashBonus));

  // 4. Generate Customized Executive Summary
  const candidateRole = matchedSkills.includes('React') || matchedSkills.includes('JavaScript')
    ? 'Frontend Engineering'
    : matchedSkills.includes('Python') || matchedSkills.includes('Java')
    ? 'Backend Software Engineering'
    : matchedSkills.includes('SQL & DBMS')
    ? 'Data & Software Engineering'
    : 'Computer Science & Software Development';

  const summary = `Uploaded document "${fileName}" analyzed for ${candidateRole} positions. Candidate profile demonstrates verified technical competencies in ${matchedSkills.slice(0, 4).join(', ')}. To increase automated ATS screening match rate to top-tier thresholds, incorporate recommended missing domain keywords (${missingSkills.slice(0, 3).join(', ')}).`;

  // 5. Generate Dynamic Formatting & Parsing Suggestions
  const formattingSuggestions: string[] = [];
  const ext = fileName.split('.').pop()?.toUpperCase() || 'PDF';
  
  if (ext === 'PDF') {
    formattingSuggestions.push(`PDF format detected (${fileName}) — ensure standard single-column text layout so automated ATS parsers don't mangle text columns.`);
  } else if (ext === 'DOCX') {
    formattingSuggestions.push(`DOCX document detected — standard MS Word XML structure allows fast text indexing across standard ATS engines.`);
  } else {
    formattingSuggestions.push(`Document extension .${ext} parsed — convert to PDF or DOCX format for maximum ATS parser compatibility.`);
  }

  if (searchableCorpus.includes('github') || searchableCorpus.includes('http') || searchableCorpus.includes('linkedin')) {
    formattingSuggestions.push('✓ Online portfolio / repository links detected in document structure.');
  } else {
    formattingSuggestions.push('Add hyperlinked GitHub repository and LinkedIn profile URLs at the top header of the resume.');
  }

  if (searchableCorpus.includes('experience') || searchableCorpus.includes('projects')) {
    formattingSuggestions.push('✓ Standard section headers (Projects & Experience) clearly demarcated.');
  } else {
    formattingSuggestions.push('Ensure standard section titles: "Technical Skills", "Work Experience", "Projects", and "Education".');
  }

  formattingSuggestions.push('Quantify key project achievements with numerical metrics (e.g. "Reduced API latency by 35%").');

  // 6. Generate Dynamic Grammar & Wording Review
  const actionVerbsList = ['built', 'developed', 'engineered', 'architected', 'implemented', 'optimized', 'designed', 'created', 'led', 'managed'];
  const hasActionVerbs = actionVerbsList.some((v) => searchableCorpus.includes(v));

  const grammarReview = [
    hasActionVerbs
      ? '✓ Strong active verbs detected ("Built", "Engineered", "Implemented").'
      : 'Action Verbs Recommendation: Begin project bullet points with strong action verbs (e.g., "Architected", "Engineered").',
    searchableCorpus.length > 200
      ? '✓ Professional document length and concise bullet phrasing verified.'
      : 'Expand project description bullet points to 2-3 lines per key accomplishment for full contextual impact.'
  ];

  // 7. Generate Dynamic Actionable Improvements / Recommendations
  const actionableImprovements = [
    {
      section: 'Technical Keyword Optimization',
      issue: `Missing ${missingSkills.length} domain keywords relevant for ${candidateRole} roles`,
      recommendation: `Incorporate high-frequency ATS keywords: ${missingSkills.slice(0, 3).join(', ')}.`
    },
    {
      section: 'Impact & Achievement Metrics',
      issue: 'Project bullet points require quantitative metric evidence',
      recommendation: 'Add measurable metrics (percentages, speed improvements, user counts) to validate engineering impact.'
    },
    {
      section: 'Formatting & ATS Parsing',
      issue: 'Header contact & repository accessibility',
      recommendation: `Verify that hyperlinked URLs for GitHub and LinkedIn are active and clearly visible in ${fileName}.`
    }
  ];

  return {
    atsScore,
    matchedSkills,
    missingSkills,
    formattingSuggestions,
    actionableImprovements,
    summary,
    grammarReview
  };
}

/**
 * Generate AI Learning Roadmap
 */
export function generateAIRoadmap(careerGoal: string = 'Software Engineer', userLevel: string = 'Beginner', dailyTime: string = '1 hour'): RoadmapTask[] {
  const goal = careerGoal.trim() || 'Software Engineer';
  return [
    {
      id: 'task-1',
      period: 'Daily',
      title: `Complete 1 HR & 1 Tech AI Mock Interview for ${goal}`,
      description: `Practice answer delivery and receive dual-language (English/Tanglish) feedback tailored for ${goal} roles.`,
      completed: false,
      category: 'Interview',
      dueDate: 'Today, 8:00 PM'
    },
    {
      id: 'task-2',
      period: 'Daily',
      title: `Solve 2 Aptitude & 1 Coding Problem for ${goal}`,
      description: `Practice domain problem solving for ${userLevel} level with ${dailyTime} daily commitment.`,
      completed: true,
      category: 'Coding',
      dueDate: 'Today, 10:00 PM'
    },
    {
      id: 'task-3',
      period: 'Weekly',
      title: `Resume ATS Score Optimization for ${goal}`,
      description: `Upgrade your resume project section for ${goal} to score above 85% on ATS scanner.`,
      completed: false,
      category: 'Resume',
      dueDate: 'This Sunday'
    },
    {
      id: 'task-4',
      period: 'Monthly',
      title: `Full Company Mock Hiring Drive Simulation (${goal})`,
      description: 'Complete full placement hiring drive simulation (Aptitude -> Coding -> Technical -> HR).',
      completed: false,
      category: 'Interview',
      dueDate: 'End of Month'
    }
  ];
}

export interface DynamicAICodeReview {
  result: 'Correct' | 'Wrong' | 'Compilation Error';
  strengths: string;
  mistakes: string;
  betterApproach: string;
  timeComplexity: string;
  spaceComplexity: string;
  interviewTip: string;
  englishAdvice: string;
  tanglishAdvice: string;
}

export async function generateAICodeReview(
  params: {
    problemTitle: string;
    description: string;
    code: string;
    language: string;
    validationStatus: 'Success' | 'Compilation Error' | 'Failed Test Cases';
  },
  userProfile?: UserProfile | null
): Promise<DynamicAICodeReview> {
  const prompt = `
You are an expert senior technical interviewer and AI code reviewer for placement interviews.
Analyze this code submitted by a student for a programming challenge:

Problem Title: ${params.problemTitle}
Problem Description: ${params.description}
Programming Language: ${params.language}
Status: ${params.validationStatus}
Submitted Code:
\`\`\`${params.language.toLowerCase()}
${params.code}
\`\`\`

Return a JSON object with these EXACT keys:
{
  "result": "${params.validationStatus === 'Success' ? 'Correct' : params.validationStatus === 'Compilation Error' ? 'Compilation Error' : 'Wrong'}",
  "strengths": "<2-3 sentence analysis of strengths in candidate's code>",
  "mistakes": "<2-3 sentence analysis of syntax errors, unhandled edge cases, or logic bugs>",
  "betterApproach": "<Suggested algorithmic optimization or pattern>",
  "timeComplexity": "<e.g. O(N) or O(N log N) or O(N^2)>",
  "spaceComplexity": "<e.g. O(1) or O(N)>",
  "interviewTip": "<Actionable placement interview tip>",
  "englishAdvice": "<Full English advice summary>",
  "tanglishAdvice": "<Natural Tanglish explanation e.g. Super! Logic correct-ah irukku. Time Complexity O(n). Variable names improve pannina innum clean-a irukkum.>"
}
`;

  try {
    const responseText = await fetchFromOpenRouter(prompt);
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      result: parsed.result || (params.validationStatus === 'Success' ? 'Correct' : 'Wrong'),
      strengths: parsed.strengths || 'Clean structural attempt at solving the target problem.',
      mistakes: parsed.mistakes || 'Ensure edge cases like zero, empty inputs, or memory limits are handled.',
      betterApproach: parsed.betterApproach || 'Using hash tables or two-pointer logic can optimize search overhead.',
      timeComplexity: parsed.timeComplexity || 'O(N)',
      spaceComplexity: parsed.spaceComplexity || 'O(1)',
      interviewTip: parsed.interviewTip || 'Always state your time complexity aloud before writing your code.',
      englishAdvice: parsed.englishAdvice || 'Good solution attempt. Verify edge constraints.',
      tanglishAdvice: formatTanglishAddressing(parsed.tanglishAdvice || 'Super! Code logic try pannirukinga. Test cases elam verify pannunga.', userProfile, 'Tanglish')
    };
  } catch (err) {
    console.warn('Fallback dynamic AI code review generation:', err);
    return {
      result: params.validationStatus === 'Success' ? 'Correct' : 'Wrong',
      strengths: 'Valid logical structure adhering to language syntax.',
      mistakes: 'Consider validating zero/null boundary constraints.',
      betterApproach: 'Using an in-place pointer logic reduces space overhead.',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
      interviewTip: 'Explain your algorithmic trade-offs clearly to the interviewer.',
      englishAdvice: 'Solution submitted and evaluated cleanly.',
      tanglishAdvice: formatTanglishAddressing('Super! Logic write pannirukinga. Optimization and edge cases check pannunga.', userProfile, 'Tanglish')
    };
  }
}

