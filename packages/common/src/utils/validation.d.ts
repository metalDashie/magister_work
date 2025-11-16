import { z } from 'zod';
export declare function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T;
export declare function validateDataSafe<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: true;
    data: T;
} | {
    success: false;
    error: z.ZodError;
};
export declare function formatZodError(error: z.ZodError): Record<string, string[]>;
