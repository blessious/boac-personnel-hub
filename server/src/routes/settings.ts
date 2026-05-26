import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const agency = await prisma.agency.findFirst() || {
      name: "Default Agency",
      address: "123 Main St",
      contactNo: "N/A",
      logoBase64: "", // Placeholder
    };

    const departments = await prisma.department.findMany();
    const positions = await prisma.position.findMany();
    const salaryGrades = await prisma.salaryGrade.findMany();

    // Map departments
    const dMap = departments.map((d: any) => d.name);
    const pMap = positions.map((p: any) => p.title);

    res.json({
      agency,
      departments: dMap,
      positions: pMap,
      salaryGrades,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
