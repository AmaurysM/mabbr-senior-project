import { authClient } from "../lib/auth-client";
import { signUpSchema } from "../lib/zod";
import { PrismaClient } from "@prisma/client";
import { ErrorContext } from "better-auth/client";
import { z } from "zod";

// user emails: sophie@gmail.com
/*
daniel@gmail.com
emma@gmail.com
lucas@gmail.com
olivia@gmail.com
nathan@gmail.com
james@gmail.com
hannah@gmail.com
ethan@gmail.com
isabella@gmail.com
alexander@gmail.com
mia@gmail.com
david@gmail.com
charlotte@gmail.com
benjamin@gmail.com
ava@gmail.com
henry@gmail.com
amelia@gmail.com
sebastian@gmail.com
madison@gmail.com
elijah@gmail.com
scarlett@gmail.com
matthew@gmail.com
chloe@gmail.com
daniela@gmail.com
*/

const prisma = new PrismaClient();

type User = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export const seedUserArray: User[] = [
    { name: "Sophie", email: "sophie@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Daniel", email: "daniel@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Emma", email: "emma@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Lucas", email: "lucas@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Olivia", email: "olivia@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Nathan", email: "nathan@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "James", email: "james@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Hannah", email: "hannah@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Ethan", email: "ethan@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Isabella", email: "isabella@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Alexander", email: "alexander@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Mia", email: "mia@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "David", email: "david@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Charlotte", email: "charlotte@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Benjamin", email: "benjamin@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Ava", email: "ava@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Henry", email: "henry@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Amelia", email: "amelia@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Sebastian", email: "sebastian@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Madison", email: "madison@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Elijah", email: "elijah@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Scarlett", email: "scarlett@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Matthew", email: "matthew@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Chloe", email: "chloe@gmail.com", password: "password123", confirmPassword: "password123" },
    { name: "Daniela", email: "daniela@gmail.com", password: "password123", confirmPassword: "password123" }
];

const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    try {
        await authClient.signUp.email(
            {
                email: values.email,
                password: values.password,
                name: values.name,
            },
            {
                onError: (ctx: ErrorContext) => {
                    throw new Error(`Could not create user ${values.email}: ${ctx}`);
                },
            }
        );
        console.log(`User ${values.email} created successfully.`);
    } catch (error) {
        console.error(error);
    }
};

async function seedUsers() {
    try {
        for (const user of seedUserArray) {
            const parsedUser = signUpSchema.safeParse(user);
            if (!parsedUser.success) {
                console.error(`Invalid user data for ${user.email}:`, parsedUser.error.format());
                continue;
            }

            await handleSignUp(parsedUser.data); 
        }
        console.log("Users seeded successfully!");
    } catch (error) {
        console.error("Error seeding Users:", error);
    } finally {
        await prisma.$disconnect();
    }
}

seedUsers();
