import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

// Get leave globally or for a specific employee
router.get("/", async (req, res, next) => {
  const { employeeId } = req.query;
  try {
    const leaves = employeeId
      ? await prisma.leaveRecord.findMany({ where: { employeeId: parseInt(employeeId as string) } })
      : await prisma.leaveRecord.findMany({ include: { employee: true } });

    res.json(leaves);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const leave = await prisma.leaveRecord.create({
      data: {
        employeeId: parseInt(req.body.employeeId),
        type: req.body.type || "SICK",
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        status: req.body.status || "PENDING",
        reason: req.body.reason || null
      },
    });
    res.json(leave);
  } catch (error) {
    next(error);
  }
});

export default router;
