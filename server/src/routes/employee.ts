import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

// GET all employees
router.get("/", async (req, res) => {
  try {
    const fullEmployees = await prisma.employee.findMany({
      include: {
        department: true,
        position: true,
      },
    });

    const formatted = fullEmployees.map((e) => ({
      ...e,
      departmentName: e.department?.name,
      positionTitle: e.position?.title,
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// GET single employee with all 201 file sub-records
router.get("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
       res.status(400).json({ error: "Invalid ID" });
       return;
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        position: true,
        family: true,
        children: true,
        education: true,
        civilService: true,
        workExperience: true,
        voluntaryWork: true,
        training: true,
        skills: true,
        leaves: true,
      },
    });

    if (!employee) {
       res.status(404).json({ error: "Not found" });
       return;
    }

    res.json({
      ...employee,
      departmentName: employee.department?.name,
      positionTitle: employee.position?.title,
    });
  } catch (error) {
    next(error);
  }
});

// POST check refId uniqueness or create new employee
router.post("/", async (req, res, next) => {
  try {
    const data = req.body;
    
    const newEmployee = await prisma.employee.create({
      data: {
        firstName: data.firstName || "Unknown",
        lastName: data.lastName || "Unknown",
        middleName: data.middleName || null,
        nameExtension: data.nameExtension || null,
        dateOfBirth: new Date(data.dateOfBirth || Date.now()),
        placeOfBirth: data.placeOfBirth || "Unknown",
        sex: data.sex || "Male",
        civilStatus: data.civilStatus || "Single",
        citizenship: data.citizenship || "Filipino",
        residentialAddress: data.residentialAddress || "Unknown",
        permanentAddress: data.permanentAddress || "Unknown",
        departmentId: parseInt(data.departmentId) || 1,
        positionId: parseInt(data.positionId) || 1,
        status: data.status || "ACTIVE",
      },
    });
    res.json(newEmployee);
  } catch (error) {
    next(error);
  }
});

export default router;
