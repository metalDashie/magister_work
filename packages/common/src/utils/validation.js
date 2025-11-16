"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateData = validateData;
exports.validateDataSafe = validateDataSafe;
exports.formatZodError = formatZodError;
function validateData(schema, data) {
    return schema.parse(data);
}
function validateDataSafe(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
}
function formatZodError(error) {
    const formatted = {};
    error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!formatted[path]) {
            formatted[path] = [];
        }
        formatted[path].push(err.message);
    });
    return formatted;
}
//# sourceMappingURL=validation.js.map