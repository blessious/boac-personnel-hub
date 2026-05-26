import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const agency = await prisma.agency.findFirst() || {
      name: "Default Agency",
      address: "123 Main St",
      contactNo: "N/A",
      tagline: "",
      logoUrl: "",
      iconUrl: "",
      bannerUrl: "",
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

router.post("/agency", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    let agency = await prisma.agency.findFirst();
    
    if (agency) {
      agency = await prisma.agency.update({
        where: { id: agency.id },
        data: {
          name: data.name !== undefined ? data.name : agency.name,
          address: data.address !== undefined ? data.address : agency.address,
          contactNo: data.contactNo !== undefined ? data.contactNo : agency.contactNo,
          tagline: data.tagline !== undefined ? data.tagline : agency.tagline,
          logoUrl: data.logoUrl !== undefined ? data.logoUrl : agency.logoUrl,
          iconUrl: data.iconUrl !== undefined ? data.iconUrl : agency.iconUrl,
          bannerUrl: data.bannerUrl !== undefined ? data.bannerUrl : agency.bannerUrl,
        }
      });
    } else {
      agency = await prisma.agency.create({
        data: {
          name: data.name || "Default Agency",
          address: data.address || "123 Main St",
          contactNo: data.contactNo || "N/A",
          tagline: data.tagline || "",
          logoUrl: data.logoUrl || "",
          iconUrl: data.iconUrl || "",
          bannerUrl: data.bannerUrl || "",
        }
      });
    }
    res.json(agency);
  } catch (error) {
    next(error);
  }
});

router.post("/departments", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name } = req.body;
    const dept = await prisma.department.create({
      data: { name }
    });
    res.json(dept);
  } catch (error) {
    next(error);
  }
});

router.post("/positions", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title } = req.body;
    const pos = await prisma.position.create({
      data: { title }
    });
    res.json(pos);
  } catch (error) {
    next(error);
  }
});

export default router;
