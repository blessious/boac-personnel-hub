import "dotenv/config";
import { PrismaClient } from "../prisma/generated/client";

export const prisma = new PrismaClient();
