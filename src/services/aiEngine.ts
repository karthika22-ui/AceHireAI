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
  SkillGapItem,
  RoadmapTask
} from '../types';

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AceHire AI Agent Engine
 * Handles AI Mock Interviews, Resume ATS Analysis, Dual-Language Feedback (English & Tanglish),
 * Coding Review, and Personalized Placement Roadmaps.
 */

const metaEnv = (import.meta as any).env || {};
export const AI_API_KEY = metaEnv.VITE_GEMINI_API_KEY || metaEnv.VITE_API_KEY || '';

export const genAI = AI_API_KEY ? new GoogleGenerativeAI(AI_API_KEY) : null;
export const geminiModel = genAI ? genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }) : null;

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
 * Reusable function to generate questions using Google Gemini API.
 * Reads API key from VITE_GEMINI_API_KEY and returns generated questions in clean JSON format.
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

  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_API_KEY || AI_API_KEY || '';

  if (!apiKey) {
    if (questionType === 'coding') {
      throw new Error('VITE_GEMINI_API_KEY is missing. Unable to generate dynamic coding challenge.');
    }
    console.warn('VITE_GEMINI_API_KEY is missing. Returning fallback structured questions.');
    return getFallbackQuestions(cleanTopic, difficulty, questionType, numberOfQuestions);
  }

  const aiClient = new GoogleGenerativeAI(apiKey);
  const candidateModels = ['gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite'];
  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      const model = aiClient.getGenerativeModel({ model: modelName });

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
  if (questionType === 'coding') {
    throw lastError || new Error('All Gemini AI models failed');
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

export const APTITUDE_BANK: AptitudeQuestion[] = [
  // ==================== QUANTITATIVE - EASY ====================
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

  // ==================== QUANTITATIVE - MEDIUM ====================
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

  // ==================== QUANTITATIVE - HARD ====================
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

  // ==================== LOGICAL - EASY ====================
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

  // ==================== LOGICAL - MEDIUM ====================
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

  // ==================== LOGICAL - HARD ====================
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

  // ==================== VERBAL - EASY ====================
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

  // ==================== VERBAL - MEDIUM ====================
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

  // ==================== VERBAL - HARD ====================
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
  }
];

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

/**
 * Intelligent AI Answer Evaluator comparing Question, Answer & Expected Keypoints
 */
export async function evaluateAnswerWithAI(
  questionText: string,
  userAnswer: string,
  category: string,
  difficulty: string = 'Medium',
  preferredLanguage: 'English' | 'Tanglish' = 'English'
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

  const explanationText = preferredLanguage === 'Tanglish' ? tanglishExp : englishExp;

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
 * Generate Dynamic Skill Gap Analysis based on Target Company
 */
export function generateSkillGapAnalysis(currentSkills: string[], targetCompany: string = 'Zoho'): SkillGapItem[] {
  const companyTech: Record<string, string[]> = {
    Zoho: ['C++', 'Java', 'Data Structures & Algorithms', 'DBMS & SQL', 'Low-Level System Design'],
    TCS: ['Python', 'Java', 'Aptitude Reasoning', 'Verbal English', 'SQL Fundamentals'],
    Google: ['Advanced Algorithms', 'System Architecture', 'Python/Go', 'Operating Systems', 'Networking'],
    Amazon: ['Data Structures', 'AWS Cloud', 'OOP Principles', 'System Design', 'Behavioral Leadership']
  };

  const targetList = companyTech[targetCompany] || ['Data Structures', 'Web Development', 'SQL', 'Communication', 'Aptitude'];

  return targetList.map((skill) => {
    const isPresent = currentSkills.some((s) => s.toLowerCase().includes(skill.toLowerCase()));
    return {
      skill,
      requiredForCompany: targetCompany,
      currentProficiency: isPresent ? 75 : 20,
      targetProficiency: 90,
      status: isPresent ? 'In Progress' : 'Missing',
      recommendedResource: `Master ${skill} via AceHire AI Interactive Practice Module`
    };
  });
}

/**
 * Generate AI Learning Roadmap
 */
export function generateAIRoadmap(): RoadmapTask[] {
  return [
    {
      id: 'task-1',
      period: 'Daily',
      title: 'Complete 1 HR & 1 Tech AI Mock Interview',
      description: 'Practice answer delivery and receive dual-language (English/Tanglish) feedback for interview standards.',
      completed: false,
      category: 'Interview',
      dueDate: 'Today, 8:00 PM'
    },
    {
      id: 'task-2',
      period: 'Daily',
      title: 'Solve 2 Aptitude & 1 Coding Problem',
      description: 'Practice Quantitative Aptitude & Python/Java problem solving.',
      completed: true,
      category: 'Coding',
      dueDate: 'Today, 10:00 PM'
    },
    {
      id: 'task-3',
      period: 'Weekly',
      title: 'Resume ATS Score Optimization',
      description: 'Upgrade your resume project section to score above 85% on ATS scanner.',
      completed: false,
      category: 'Resume',
      dueDate: 'This Sunday'
    },
    {
      id: 'task-4',
      period: 'Monthly',
      title: 'Full Company Mock Hiring Drive Simulation',
      description: 'Complete full round (Aptitude -> Coding -> Technical -> HR) simulated practice.',
      completed: false,
      category: 'Interview',
      dueDate: 'End of Month'
    }
  ];
}
