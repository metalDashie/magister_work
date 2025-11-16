import { z } from 'zod';
export declare enum UserRole {
    USER = "user",
    ADMIN = "admin",
    MANAGER = "manager"
}
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodNativeEnum<typeof UserRole>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    email: string;
    id: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    phone?: string | undefined;
}, {
    email: string;
    id: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    phone?: string | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
export declare const CreateUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    phone?: string | undefined;
}, {
    email: string;
    password: string;
    phone?: string | undefined;
}>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginDto = z.infer<typeof LoginSchema>;
