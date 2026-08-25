/**
 * Clean form data for API submission while preserving nested object structure
 * This is important for MongoDB schemas that expect nested objects even when some fields are empty
 */
export function cleanFormData(obj: unknown, isNested = false): unknown {
    if (obj === null || obj === undefined) return undefined;

    if (Array.isArray(obj)) {
        // Always return arrays, even empty ones
        return obj.map((v) => cleanFormData(v, true)).filter((v) => v !== undefined);
    }

    if (typeof obj !== 'object') {
        // Remove empty strings but keep other falsy values like 0 or false
        if (obj === '') return undefined;
        return obj;
    }

    const cleaned: Record<string, unknown> = {};
    const objAsRecord = obj as Record<string, unknown>;

    for (const key in objAsRecord) {
        if (Object.prototype.hasOwnProperty.call(objAsRecord, key)) {
            const value = cleanFormData(objAsRecord[key], true);
            if (value !== undefined) {
                cleaned[key] = value;
            }
        }
    }

    // For nested objects (like personalInfo, employment, address, emergencyContact),
    // preserve the structure even if empty. This prevents MongoDB from storing null
    // for the entire nested object when some fields are missing.
    if (isNested) {
        return cleaned;
    }

    // Only remove completely empty objects at the root level
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}
