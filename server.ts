import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import {
  extractTextFromPdf,
  extractTextFromImageOcr,
  parseStudentsFromRawText,
  normalizeDepartment,
  normalizeAcademicYear,
  checkEnrollmentAmbiguity,
  ExtractedStudentResult,
} from './src/server/documentParser.js';
import { getDb } from './src/server/database/db.js';
import { runDatabaseMigration } from './src/server/database/migration.js';
import { apiRouter } from './src/server/routes/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for resilient Gemini API calls with exponential backoff and seamless model fallback
async function generateContentWithFallback(ai: GoogleGenAI, params: any, options: { maxRetries?: number } = {}) {
  // Try default gemini-3.7-flash first, then fallback to gemini-flash-latest and gemini-3.1-flash-lite if 503/high demand occurs
  const modelsToTry = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  const maxRetries = options.maxRetries ?? 2;
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err || '');
        const isUnavailableOrRateLimited =
          errStr.includes('503') ||
          errStr.includes('UNAVAILABLE') ||
          errStr.includes('429') ||
          errStr.includes('RESOURCE_EXHAUSTED') ||
          errStr.includes('high demand') ||
          errStr.includes('try again later');

        if (isUnavailableOrRateLimited && attempt < maxRetries) {
          const delayMs = (attempt + 1) * 800;
          console.log(`[Gemini API] Model ${model} is experiencing high demand (503/429). Retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }

        if (isUnavailableOrRateLimited) {
          console.warn(`[Gemini API] Model ${model} unavailable after retries, switching to fallback model...`);
          break; // Move to next model in modelsToTry
        }

        // For non-503 fatal errors (e.g. bad schema/args), throw directly
        throw err;
      }
    }
  }

  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite database and run migration/seeding if needed
  try {
    await getDb();
    await runDatabaseMigration();
    console.log('EURO Unit Test SQLite Database ("euro_unit_test.db") initialized and ready.');
  } catch (dbErr) {
    console.error('Database initialization warning:', dbErr);
  }

  // Allow larger payload for document/image base64 uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), db: 'euro_unit_test.db' });
  });

  // Mount SQLite Database REST API routes
  app.use('/api', apiRouter);

  // Server-side Gemini AI Academic Advisor endpoint
  app.post('/api/ai/analyze-student', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const { studentName, department, year, overallPercentage, rating, trend, improvementDelta, subjects } = req.body;

      if (!apiKey) {
        return res.json({
          success: false,
          fallback: true,
          analysis: `${studentName} from ${department} (${year}) has achieved an overall average of ${overallPercentage}% (${rating}). The student's progress between Unit 1 and Unit 2 is ${trend} (${improvementDelta >= 0 ? '+' : ''}${improvementDelta}%). To maintain academic excellence, targeted mentoring in weaker subjects is strongly recommended.`,
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are a Senior Academic Dean and Faculty Counselor at an Engineering College.
Analyze the following student's Unit 1 and Unit 2 examination performance and provide a concise (3-4 sentences), highly actionable, encouraging, and pedagogically sound academic recommendation.

Student Profile:
- Name: ${studentName}
- Department: ${department}
- Academic Year: ${year}
- Overall Average: ${overallPercentage}% (${rating})
- Progress Trend: ${trend} (${improvementDelta >= 0 ? '+' : ''}${improvementDelta}% between Unit 1 and Unit 2)
- Subject Breakdown:
${JSON.stringify(subjects, null, 2)}

Provide specific recommendations: highlight their strongest subject, pinpoint subjects requiring revision/remedial lab sessions, and provide guidance for the upcoming final semester examinations.`;

      const response = await generateContentWithFallback(ai, {
        contents: prompt,
      });

      const text = response.text || '';
      res.json({
        success: true,
        analysis: text.trim(),
      });
    } catch (err: any) {
      console.error('Gemini analysis error:', err);
      res.status(500).json({
        success: false,
        error: err.message,
        analysis: 'Automated evaluation: Focus on regular revision, problem-solving tutorials, and lab practice for improved semester performance.',
      });
    }
  });

  // Server-side AI Marks Scanner (Extracts marks sheet table from photo/PDF)
  app.post('/api/marks/extract-from-document', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const { fileBase64, mimeType, programming, defaultDepartment, academicYear, defaultYear, courseTitle, maxMarks = 30 } = req.body;
      const selectedProg = programming || defaultDepartment || 'Computer Engineering';
      const selectedYear = academicYear || defaultYear || '2nd Year';

      if (!fileBase64) {
        return res.status(400).json({
          success: false,
          extractedMarks: [],
          message: 'No marks sheet document provided.',
        });
      }

      // Clean base64 string
      let rawBase64 = fileBase64;
      let detectedMime = mimeType || 'image/jpeg';

      if (fileBase64.includes(';base64,')) {
        const parts = fileBase64.split(';base64,');
        const mimeMatch = parts[0].match(/data:(.*)/);
        if (mimeMatch && mimeMatch[1]) {
          detectedMime = mimeMatch[1];
        }
        rawBase64 = parts[1];
      }

      if (detectedMime === 'image/jpg') {
        detectedMime = 'image/jpeg';
      }

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });

          const systemInstruction = `You are a high-precision Academic Marks Sheet OCR & Tabular Data Extraction Engine for Engineering Colleges.
Your task is to parse the uploaded marks sheet image or document and extract student marks for Unit Test 1 and Unit Test 2.

STRICT EXTRACTION RULES:
1. Extract EVERY student row visible in the marks sheet.
2. "student_name": Full student name in Title Case.
3. "enrollment_number": Enrollment Number / PRN / Roll Number if visible (uppercase). If absent, return empty string "".
4. "unit_1_marks": Extracted Unit Test 1 marks as a number (0 to ${maxMarks}). If absent, illegible, or marked as 'AB'/'Absent', set to null.
5. "unit_2_marks": Extracted Unit Test 2 marks as a number (0 to ${maxMarks}). If absent, illegible, or marked as 'AB'/'Absent', set to null.
6. "programming": Programming branch name (e.g. "${selectedProg}").
7. "academic_year": Academic year if visible (e.g. "${selectedYear}").
8. "uncertain_fields": List of field names where the handwriting or print is fuzzy/unclear (e.g. ["unit_2_marks", "enrollment_number"]).
9. "uncertainty_reason": Explanation of why teacher review is required (e.g. "Digit 18 looks like 10 or 18").
10. VALIDATION: Never extract marks greater than ${maxMarks} or negative marks. If a mark looks like 35 for a max 30 test, flag it in uncertain_fields.`;

          const prompt = `Extract all student marks rows from this marks sheet document.
Target Course: "${courseTitle || 'Test Marks'}"
Maximum Marks: ${maxMarks}
Programming: "${selectedProg}"
Academic Year: "${selectedYear}"`;

          const response = await generateContentWithFallback(ai, {
            contents: {
              parts: [
                {
                  inlineData: {
                    data: rawBase64,
                    mimeType: detectedMime,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  extractedMarks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        student_name: { type: Type.STRING },
                        enrollment_number: { type: Type.STRING },
                        unit_1_marks: { type: Type.NUMBER, nullable: true },
                        unit_2_marks: { type: Type.NUMBER, nullable: true },
                        programming: { type: Type.STRING },
                        academic_year: { type: Type.STRING },
                        uncertain_fields: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        uncertainty_reason: { type: Type.STRING },
                      },
                      required: ['student_name'],
                    },
                  },
                  detectedCourse: { type: Type.STRING },
                  detectedProgramming: { type: Type.STRING },
                  detectedAcademicYear: { type: Type.STRING },
                },
                required: ['extractedMarks'],
              },
            },
          });

          const result = JSON.parse(response.text || '{}');
          if (Array.isArray(result.extractedMarks)) {
            return res.json({
              success: true,
              extractedMarks: result.extractedMarks,
              detectedCourse: result.detectedCourse || courseTitle,
              detectedProgramming: result.detectedProgramming || selectedProg,
              detectedAcademicYear: result.detectedAcademicYear || selectedYear,
              count: result.extractedMarks.length,
              engineUsed: 'gemini_multimodal_ocr',
            });
          }
        } catch (geminiErr: any) {
          console.warn('Gemini Marks OCR error, falling back to local extractor:', geminiErr.message);
        }
      }

      // Fallback empty result prompting teacher to enter manually if offline
      return res.json({
        success: false,
        extractedMarks: [],
        message: 'Could not automatically scan marks from this image. Please use manual entry or check network.',
      });
    } catch (err: any) {
      console.error('Marks OCR error:', err);
      res.status(500).json({
        success: false,
        extractedMarks: [],
        message: 'Error processing marks sheet: ' + err.message,
      });
    }
  });

  // Server-side Ask EURO AI (Versatile Academic & Performance Assistant)
  app.post('/api/ai/ask-performance', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const { question, programming, year, course, contextData, conversationHistory = [] } = req.body;

      if (!question) {
        return res.status(400).json({ success: false, answer: 'Please provide a question.' });
      }

      if (!apiKey) {
        // Intelligent local response logic for common academic and student queries
        const qLower = question.toLowerCase();
        const students = contextData?.students || [];

        if (qLower.includes('improve') || qLower.includes('progress') || qLower.includes('gain')) {
          const improving = [...students]
            .filter((s: any) => s.delta > 0)
            .sort((a: any, b: any) => b.delta - a.delta)
            .slice(0, 5);

          if (improving.length === 0) {
            return res.json({
              success: true,
              answer: `Based on the database records for **${programming}**, there are currently no students with recorded positive improvement between Unit Test 1 and Unit Test 2, or both tests have identical marks.`,
            });
          }

          let responseText = `### Top Improving Students in ${programming}:\n\n`;
          improving.forEach((s: any, idx: number) => {
            responseText += `${idx + 1}. **${s.name}** (${s.enrollmentNo || 'N/A'})\n   - Unit 1: **${s.u1}/30** ➔ Unit 2: **${s.u2}/30** (+${s.delta} marks, +${s.deltaPct}%)\n`;
          });
          return res.json({ success: true, answer: responseText });
        }

        if (qLower.includes('attention') || qLower.includes('weak') || qLower.includes('fail') || qLower.includes('below 15') || qLower.includes('concern') || qLower.includes('remedial')) {
          const attention = [...students]
            .filter((s: any) => s.avgPct < 50 || s.u1 < 12 || s.u2 < 12)
            .sort((a: any, b: any) => a.avg - b.avg)
            .slice(0, 5);

          if (attention.length === 0) {
            return res.json({
              success: true,
              answer: `Based on the database records for **${programming}**, all evaluated students are currently performing above the 50% threshold. No immediate critical interventions required.`,
            });
          }

          let responseText = `### Students Requiring Academic Attention in ${programming}:\n\n`;
          attention.forEach((s: any, idx: number) => {
            responseText += `${idx + 1}. **${s.name}** (${s.enrollmentNo || 'N/A'})\n   - Average: **${s.avg}/30** (${s.avgPct}% - ${s.rating})\n   - Breakdown: UT1: ${s.u1}/30, UT2: ${s.u2}/30\n`;
          });
          responseText += `\n**Pedagogical Guidance:** Schedule remedial tutorial batches twice a week with peer-assisted problem solving for these students.`;
          return res.json({ success: true, answer: responseText });
        }

        if (qLower.includes('top') || qLower.includes('rank') || qLower.includes('highest') || qLower.includes('best') || qLower.includes('topper')) {
          const top = [...students]
            .sort((a: any, b: any) => b.avg - a.avg)
            .slice(0, 5);

          let responseText = `### Top Performing Students in ${programming}:\n\n`;
          top.forEach((s: any, idx: number) => {
            responseText += `${idx + 1}. **${s.name}** (${s.enrollmentNo || 'N/A'})\n   - Overall Average: **${s.avg}/30** (${s.avgPct}% - **${s.rating}**)\n   - UT1: ${s.u1}/30, UT2: ${s.u2}/30\n`;
          });
          return res.json({ success: true, answer: responseText });
        }

        if (qLower.includes('continuous evaluation') || qLower.includes('unit test') || qLower.includes('msbte') || qLower.includes('scheme')) {
          return res.json({
            success: true,
            answer: `### Continuous Internal Evaluation (CIE) Guidelines:\n- **Unit Test Structure**: Two formal Unit Tests (UT1 and UT2) conducted per semester, typically out of 30 marks each.\n- **Weightage**: Marks are averaged and combined with micro-projects, lab performance, and attendance to compute final internal marks.\n- **Improvement Tracking**: Monitoring score delta between UT1 and UT2 helps identify learning bottlenecks early and implement targeted remedial tutorials.`,
          });
        }

        return res.json({
          success: true,
          answer: `Based on the database records for **${programming}** (${year || 'All Years'} - ${course || 'All Courses'}):\n- **Total Evaluated Students:** ${contextData?.evaluatedCount || students.length}\n- **Class UT1 Average:** ${contextData?.avgU1 || 0}/30\n- **Class UT2 Average:** ${contextData?.avgU2 || 0}/30\n- **Overall Class Average:** ${contextData?.overallAvg || 0}/30\n\nYou can ask about top performers, improving students, students needing remedial help, or general academic curriculum and teaching strategies.`,
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `You are "EURO AI", the intelligent academic and continuous evaluation advisor at RSIET Engineering College (Mandar Education Society).
You assist engineering faculty members with:
1. Analyzing student marks, unit test progressions, toppers, category distributions, and students needing remedial attention for the selected department/programming.
2. Academic and engineering concepts across Computer, Civil, Mechanical, and Electrical Engineering.
3. MSBTE polytechnic diploma curriculum standards, continuous internal evaluation schemes, course outcomes (COs), Bloom's taxonomy in question paper design, and rubric preparation.
4. Pedagogical and classroom management advice (e.g. organizing effective remedial tutorials, peer-mentoring, practical lab assessment).

CRITICAL INSTRUCTIONS:
- For student marks / college data queries: ALWAYS base answers on the provided context data and never invent imaginary student names or rolls.
- For general academic, engineering, or pedagogical queries: Answer with clear, well-structured, professional explanations using Markdown formatting.
- Maintain a respectful, concise, faculty-friendly, and helpful tone.`;

      // Build conversation turns if provided
      let formattedHistory = '';
      if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
        formattedHistory = conversationHistory
          .slice(-6)
          .map((m: any) => `${m.sender === 'user' ? 'Teacher' : 'EURO AI'}: ${m.text}`)
          .join('\n');
      }

      const prompt = `${formattedHistory ? `Previous Conversation:\n${formattedHistory}\n\n` : ''}Teacher Question: "${question}"

Selected Filter Context:
- Target Programming/Department: ${programming}
- Academic Year: ${year || 'All'}
- Course/Subject: ${course || 'All'}

Database Statistics for Target Scope:
${JSON.stringify(contextData, null, 2)}

Provide a direct, thorough, and well-structured response:`;

      const response = await generateContentWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      return res.json({
        success: true,
        answer: (response.text || '').trim(),
      });
    } catch (err: any) {
      console.error('Ask EURO AI error:', err);
      res.status(500).json({
        success: false,
        answer: 'I encountered an error querying the academic assistant: ' + err.message,
      });
    }
  });

  // Server-side Document / Image OCR & Student Extraction Endpoint
  app.post('/api/students/extract-from-document', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const { fileBase64, mimeType, defaultDepartment, defaultYear, fileName } = req.body;

      if (!fileBase64) {
        return res.status(400).json({
          success: false,
          students: [],
          rawText: '',
          message: 'No document file data provided.',
        });
      }

      // Clean base64 string
      let rawBase64 = fileBase64;
      let detectedMime = mimeType || 'image/jpeg';

      if (fileBase64.includes(';base64,')) {
        const parts = fileBase64.split(';base64,');
        const mimeMatch = parts[0].match(/data:(.*)/);
        if (mimeMatch && mimeMatch[1]) {
          detectedMime = mimeMatch[1];
        }
        rawBase64 = parts[1];
      }

      if (detectedMime === 'image/jpg') {
        detectedMime = 'image/jpeg';
      }

      const fileBuffer = Buffer.from(rawBase64, 'base64');
      const isPdf = detectedMime.includes('pdf') || (fileName && fileName.toLowerCase().endsWith('.pdf'));

      let rawExtractedText = '';
      let pageCount = 1;
      let engineUsed = 'none';
      let extractedStudents: ExtractedStudentResult[] = [];

      // If PDF, first extract selectable text across all pages
      if (isPdf) {
        const pdfData = await extractTextFromPdf(fileBuffer);
        rawExtractedText = pdfData.text;
        pageCount = pdfData.pageCount;
      }

      // 1. Try Gemini Multimodal Extraction if API key is present
      if (apiKey) {
        try {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });

          const systemInstruction = `You are a high-precision Academic Document and Roster OCR & Table Parsing Engine for Engineering Colleges.
Your task is to parse the uploaded document (scanned image, digital PDF, screenshot, roster table) and extract EVERY individual student record VISIBLY PRESENT in the file.

STRICT ACCURACY RULES:
1. Extract ONLY TWO fields per student:
   - "student_name": Full name of the student in Title Case (e.g. "Vedika Salekar", "Rahul Patil"). Remove serial numbers (1, 2, 3) or titles (Mr./Ms./Miss), but preserve the full name.
   - "enrollment_number": Exact Enrollment Number / PRN (e.g. "24110980114", "24110980115"). Ensure standard uppercase characters.
2. DO NOT extract Roll Numbers, Departments, Programs, Academic Years, Divisions, Genders, Emails, or Phone Numbers.
3. NEVER invent, hallucinate, or generate sample students. Extract ONLY the students that are literally visible in the file.
4. DO NOT omit any student rows. Extract all students visible across all pages.
5. "uncertain_fields": List ["enrollment_number"] if there is OCR ambiguity (e.g. 0 vs O, 1 vs I).
6. "uncertainty_reason": Brief explanation if any field is uncertain.
7. "raw_extracted_text": Return the verbatim text transcription read from the document.`;

          const prompt = `Extract all student records from this uploaded document. Extract ONLY Student Name and Enrollment Number / PRN for each student.
Document Name: "${fileName || 'uploaded_roster'}"
MIME Type: "${detectedMime}"

Return JSON matching the schema with the exact list of extracted students.`;

          const response = await generateContentWithFallback(ai, {
            contents: {
              parts: [
                {
                  inlineData: {
                    data: rawBase64,
                    mimeType: detectedMime,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  students: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        student_name: {
                          type: Type.STRING,
                          description: 'Full name of the student (e.g. Vedika Salekar)',
                        },
                        enrollment_number: {
                          type: Type.STRING,
                          description: 'Unique enrollment number or PRN (e.g. 24110980114)',
                        },
                        uncertain_fields: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: 'List of fields with OCR ambiguity',
                        },
                        uncertainty_reason: {
                          type: Type.STRING,
                          description: 'Explanation if uncertain',
                        },
                      },
                      required: ['student_name', 'enrollment_number'],
                    },
                  },
                  raw_extracted_text: {
                    type: Type.STRING,
                    description: 'Verbatim text read from the document',
                  },
                },
                required: ['students'],
              },
            },
          });

          const responseJson = JSON.parse(response.text || '{}');
          if (Array.isArray(responseJson.students) && responseJson.students.length > 0) {
            extractedStudents = responseJson.students;
            if (responseJson.raw_extracted_text) {
              rawExtractedText = responseJson.raw_extracted_text;
            }
            engineUsed = 'gemini_multimodal_ocr';
          }
        } catch (geminiErr: any) {
          console.warn('Gemini extraction failed or rate limited, falling back to local text/OCR parser:', geminiErr.message);
        }
      }

      // 2. Fallback / Complementary: If no students extracted yet, run local PDF text parser or Tesseract OCR
      if (extractedStudents.length === 0) {
        if (!isPdf && !rawExtractedText) {
          // Perform local Tesseract OCR on image
          rawExtractedText = await extractTextFromImageOcr(fileBuffer);
          engineUsed = 'tesseract_ocr';
        } else if (isPdf) {
          engineUsed = 'pdf_text_parser';
        }

        if (rawExtractedText && rawExtractedText.trim().length > 0) {
          extractedStudents = parseStudentsFromRawText(rawExtractedText);
        }
      }

      // 3. Normalize and enrich all extracted records
      const normalizedStudents: ExtractedStudentResult[] = extractedStudents.map((s) => {
        const cleanEnrollment = String(s.enrollment_number || '').trim().toUpperCase();
        const cleanName = String(s.student_name || '').trim();

        const uncertainFields = Array.isArray(s.uncertain_fields) ? [...s.uncertain_fields] : [];
        let uncertaintyReason = s.uncertainty_reason || '';

        // Check for enrollment character confusions
        const ambiguity = checkEnrollmentAmbiguity(cleanEnrollment);
        if (ambiguity.isUncertain && !uncertainFields.includes('enrollment_number')) {
          uncertainFields.push('enrollment_number');
          uncertaintyReason = uncertaintyReason
            ? `${uncertaintyReason}. ${ambiguity.reason}`
            : ambiguity.reason;
        }

        return {
          student_name: cleanName,
          enrollment_number: cleanEnrollment,
          uncertain_fields: uncertainFields,
          uncertainty_reason: uncertaintyReason,
        };
      }).filter((s) => s.student_name.length > 0 && s.enrollment_number.length > 0);

      const hasResults = normalizedStudents.length > 0;

      return res.json({
        success: hasResults,
        students: normalizedStudents,
        count: normalizedStudents.length,
        rawText: rawExtractedText,
        pageCount: isPdf ? pageCount : 1,
        engineUsed,
        message: hasResults
          ? `Successfully extracted ${normalizedStudents.length} student(s) from ${fileName || 'document'}.`
          : 'Unable to confidently extract student details from this file.',
      });
    } catch (err: any) {
      console.error('OCR Extraction error:', err);
      return res.status(500).json({
        success: false,
        students: [],
        rawText: '',
        error: err.message,
        message: 'Unable to extract student details from this file: ' + (err.message || 'Unknown error'),
      });
    }
  });

  // Explicit 404 handler for unmatched API routes to ensure JSON response instead of HTML SPA fallback
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API route ${req.method} ${req.originalUrl} not found`,
    });
  });

  // Global Express error handler ensuring JSON responses for API errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express Global API Error:', err);
    if (res.headersSent) {
      return next(err);
    }
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Academic Management System running on http://localhost:${PORT}`);
  });
}

startServer();
