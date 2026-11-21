import * as XLSX from 'xlsx';
import { ParsedQuestionRow, QuestionImportResult, TestDifficulty } from '../types';

const HEADER_ALIASES: Record<string, string[]> = {
  questionText: [
    'question',
    'question text',
    'question_text',
    'question name',
    'question_name',
    'q',
    'prompt',
    'statement',
  ],
  optionA: ['option a', 'option_a', 'a', 'opt a', 'choice a', 'option1'],
  optionB: ['option b', 'option_b', 'b', 'opt b', 'choice b', 'option2'],
  optionC: ['option c', 'option_c', 'c', 'opt c', 'choice c', 'option3'],
  optionD: ['option d', 'option_d', 'd', 'opt d', 'choice d', 'option4'],
  correctAnswer: [
    'correct answer',
    'correct_answer',
    'answer',
    'correct',
    'correct option',
    'correct_option',
    'ans',
    'key',
  ],
  explanation: ['explanation', 'solution', 'rationale', 'notes', 'hint', 'answer explanation'],
  difficulty: ['difficulty', 'level', 'tier'],
  questionImageUrl: [
    'question image',
    'question_image',
    'question_image_url',
    'image',
    'image url',
    'image_url',
    'diagram',
  ],
};

function normalizeHeader(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function resolveFieldValue(rowObj: Record<string, unknown>, aliases: string[]): string {
  for (const key of Object.keys(rowObj)) {
    const norm = normalizeHeader(key);
    if (aliases.includes(norm)) {
      const val = rowObj[key];
      return val === null || val === undefined ? '' : String(val).trim();
    }
  }
  return '';
}

function normalizeCorrectAnswer(raw: string): 'A' | 'B' | 'C' | 'D' | '' {
  const upper = raw.trim().toUpperCase();
  if (upper === 'A' || upper === 'OPTION A' || upper === '1') return 'A';
  if (upper === 'B' || upper === 'OPTION B' || upper === '2') return 'B';
  if (upper === 'C' || upper === 'OPTION C' || upper === '3') return 'C';
  if (upper === 'D' || upper === 'OPTION D' || upper === '4') return 'D';
  return '';
}

function normalizeDifficulty(raw: string): { value: TestDifficulty; error?: string } {
  if (!raw.trim()) return { value: 'medium' };
  const lower = raw.trim().toLowerCase();
  if (lower === 'easy' || lower === 'e' || lower === 'basic' || lower === 'foundational') {
    return { value: 'easy' };
  }
  if (lower === 'medium' || lower === 'm' || lower === 'moderate' || lower === 'core') {
    return { value: 'medium' };
  }
  if (lower === 'hard' || lower === 'h' || lower === 'difficult' || lower === 'advanced') {
    return { value: 'hard' };
  }
  return {
    value: 'medium',
    error: `Invalid difficulty "${raw}" (expected Easy, Medium, or Hard).`,
  };
}

function isValidImageUrl(url: string): boolean {
  if (!url) return true;
  if (url.startsWith('data:image/')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Parses an uploaded CSV or Excel (.xlsx / .xls) file strictly in memory.
 * Validates every single row before saving and returns structured errors per row.
 */
export async function parseQuestionFileInMemory(file: File): Promise<QuestionImportResult> {
  const fileName = file.name || 'questions';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (!['csv', 'xlsx', 'xls'].includes(ext)) {
    return {
      fileName,
      totalRows: 0,
      validCount: 0,
      invalidCount: 0,
      rows: [],
      fileError: 'Unsupported file format. Please upload a .csv, .xlsx, or .xls file.',
    };
  }

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    if (!workbook.SheetNames.length) {
      return {
        fileName,
        totalRows: 0,
        validCount: 0,
        invalidCount: 0,
        rows: [],
        fileError: 'The uploaded workbook contains no sheets.',
      };
    }

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
      defval: '',
      raw: false,
    });

    if (!rawRows.length) {
      return {
        fileName,
        totalRows: 0,
        validCount: 0,
        invalidCount: 0,
        rows: [],
        fileError: 'No data rows found. Ensure row 1 contains headers and rows below contain questions.',
      };
    }

    const parsedRows: ParsedQuestionRow[] = [];

    rawRows.forEach((rawRow, idx) => {
      const rowNumber = idx + 2; // Excel/CSV 1-indexed with header on row 1
      const questionText = resolveFieldValue(rawRow, HEADER_ALIASES.questionText);
      const optionA = resolveFieldValue(rawRow, HEADER_ALIASES.optionA);
      const optionB = resolveFieldValue(rawRow, HEADER_ALIASES.optionB);
      const optionC = resolveFieldValue(rawRow, HEADER_ALIASES.optionC);
      const optionD = resolveFieldValue(rawRow, HEADER_ALIASES.optionD);
      const rawCorrect = resolveFieldValue(rawRow, HEADER_ALIASES.correctAnswer);
      const explanation = resolveFieldValue(rawRow, HEADER_ALIASES.explanation);
      const rawDifficulty = resolveFieldValue(rawRow, HEADER_ALIASES.difficulty);
      const questionImageUrl = resolveFieldValue(rawRow, HEADER_ALIASES.questionImageUrl);

      // Skip completely blank trailing lines
      if (!questionText && !optionA && !optionB && !optionC && !optionD && !rawCorrect) {
        return;
      }

      const errors: string[] = [];

      if (!questionText) errors.push('Question text is required.');
      if (!optionA) errors.push('Option A is required.');
      if (!optionB) errors.push('Option B is required.');
      if (!optionC) errors.push('Option C is required.');
      if (!optionD) errors.push('Option D is required.');

      const correctAnswer = normalizeCorrectAnswer(rawCorrect);
      if (!correctAnswer) {
        errors.push(
          rawCorrect
            ? `Correct Answer "${rawCorrect}" must be A, B, C, or D.`
            : 'Correct Answer (A/B/C/D) is required.'
        );
      }

      const diffResult = normalizeDifficulty(rawDifficulty);
      if (diffResult.error) {
        errors.push(diffResult.error);
      }

      if (questionImageUrl && !isValidImageUrl(questionImageUrl)) {
        errors.push('Question Image must be a valid https://, http://, or data:image/ URL.');
      }

      parsedRows.push({
        rowNumber,
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer: correctAnswer || 'A',
        explanation,
        difficulty: diffResult.value,
        questionImageUrl: questionImageUrl || undefined,
        isValid: errors.length === 0,
        errors,
      });
    });

    const validCount = parsedRows.filter((r) => r.isValid).length;
    const invalidCount = parsedRows.length - validCount;

    return {
      fileName,
      totalRows: parsedRows.length,
      validCount,
      invalidCount,
      rows: parsedRows,
    };
  } catch (err) {
    return {
      fileName,
      totalRows: 0,
      validCount: 0,
      invalidCount: 0,
      rows: [],
      fileError:
        err instanceof Error
          ? `Failed to parse file: ${err.message}`
          : 'Failed to parse uploaded spreadsheet.',
    };
  }
}

export function generateSampleQuestionsCsv(): string {
  const headers = [
    'Question',
    'Option A',
    'Option B',
    'Option C',
    'Option D',
    'Correct Answer',
    'Explanation',
    'Difficulty',
    'Question Image',
  ];

  const sampleRows = [
    [
      'For any real symmetric matrix A, its eigenvalues are always:',
      'Purely imaginary',
      'Real numbers',
      'Strictly positive',
      'Zero or one',
      'B',
      'By the Spectral Theorem, every real symmetric matrix has exclusively real eigenvalues and orthogonal eigenvectors.',
      'Easy',
      '',
    ],
    [
      'In Principal Component Analysis (PCA), the first principal component points along the direction of:',
      'Minimum sample variance',
      'Maximum sample variance',
      'Zero covariance',
      'Mean vector only',
      'B',
      'The first principal component is the eigenvector corresponding to the largest eigenvalue of the covariance matrix, maximizing projected variance.',
      'Medium',
      '',
    ],
    [
      'If P(A) = 0.4, P(B) = 0.5, and A and B are independent events, what is P(A union B)?',
      '0.90',
      '0.20',
      '0.70',
      '0.60',
      'C',
      'For independent events, P(A ∩ B) = P(A)P(B) = 0.20. Therefore P(A ∪ B) = 0.4 + 0.5 - 0.2 = 0.70.',
      'Easy',
      '',
    ],
  ];

  const escapeCsv = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
  return [headers.map(escapeCsv).join(','), ...sampleRows.map((r) => r.map(escapeCsv).join(','))].join('\n');
}
