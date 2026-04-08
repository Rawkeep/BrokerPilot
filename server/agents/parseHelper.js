/**
 * Shared utility for extracting and validating JSON from AI responses.
 *
 * Handles common patterns:
 * - Raw JSON
 * - JSON wrapped in markdown code fences (```json ... ```)
 * - JSON with leading/trailing whitespace or text
 */

/**
 * Extract JSON string from AI response content, stripping markdown fences.
 * @param {string} content - Raw AI response text
 * @returns {string} Cleaned JSON string
 */
export function extractJSON(content) {
  let cleaned = content.trim();

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // If still not starting with { or [, try to find the first JSON object
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    const jsonStart = cleaned.indexOf('{');
    if (jsonStart !== -1) {
      cleaned = cleaned.slice(jsonStart);
    }
  }

  return cleaned;
}

/**
 * Parse AI response content and validate with a Zod schema.
 * @param {string} content - Raw AI response text
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {object} Validated and parsed object
 * @throws {Error} If JSON extraction or Zod validation fails
 */
export function parseJSONFromAI(content, schema) {
  const jsonStr = extractJSON(content);

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error(`Failed to parse AI response as JSON: ${err.message}`);
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`AI response validation failed: ${issues}`);
  }

  return result.data;
}
