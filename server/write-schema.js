const fs = require('fs');
const schema = `datasource db {
  provider = "mysql"
}

generator client {
  provider = "prisma-client-js"
}

// =======================
// MASTER DATA & SETTINGS
// =======================

model Agency {
  id        String   @id @default(uuid())
  name      String
  tagline   String?
  logoUrl   String?
  iconUrl   String?
  bannerUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Department {
  id        String     @id @default(uuid())
  name      String     @unique
  employees Employee[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model Position {
  id        String     @id @default(uuid())
  title     String     @unique
  employees Employee[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model SalaryGrade {
  id        String   @id @default(uuid())
  ordinance String
  grade     Int
  step      Int
  amount    Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([ordinance, grade, step])
}

model User {
  id           String    @id @default(uuid())
  username     String    @unique
  passwordHash String
  name         String?
  role         String
  employeeId   String?   @unique
  employee     Employee? @relation(fields: [employeeId], references: [id])
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

// =======================
// EMPLOYEE CORE
// =======================

model Employee {
  id                 String             @id @default(uuid())
  refId              String             @unique
  lastname           String
  firstname          String
  middlename         String
  nameExt            String?
  departmentId       String
  department         Department         @relation(fields: [departmentId], references: [id])
  positionId         String
  position           Position           @relation(fields: [positionId], references: [id])
  status             String
  level              String
  statusClass        String
  dateEmployed       DateTime
  empStatus          String
  itemNo             String?
  veteransCode       String?
  bankAccountId      String?
  cardSerialNo       String?
  placeOfBirth       String?
  birthday           DateTime
  gender             String
  civilStatus        String
  citizenship        String
  height             String?
  heightUnit         String?
  weight             String?
  weightUnit         String?
  bloodType          String?
  sss                String?
  gsis               String?
  pagibig            String?
  tin                String?
  philhealth         String?
  ctcNo              String?
  ctcPlaceIssued     String?
  ctcDateIssued      String?
  cellphoneNo        String?
  email              String?
  residentialAddress String?
  residentialZipcode String?
  residentialTelNo   String?
  permanentAddress   String?
  permanentZipcode   String?
  permanentTelNo     String?
  dateSeparated      DateTime?
  photoUrl           String?
  user               User?
  family             FamilyRecord?
  children           ChildRecord[]
  education          EducationRecord[]
  civilService       CivilServiceRecord[]
  workExperience     WorkRecord[]
  organizations      OrgRecord[]
  trainings          TrainingRecord[]
  salaryRecords      SalaryRecord[]
  serviceRecords     ServiceRecord[]
  leaveRecords       LeaveRecord[]
  ipcrRecords        IPCRRecord[]
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
}

// =======================
// 201 FILE SUB-RECORDS
// =======================

model FamilyRecord {
  id                     String   @id @default(uuid())
  employeeId             String   @unique
  employee               Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  spouseLastname         String?
  spouseFirstname        String?
  spouseMiddlename       String?
  spouseOccupation       String?
  spouseEmployer         String?
  spouseBusinessTel      String?
  spouseBusinessAddress  String?
  fatherLastname         String?
  fatherFirstname        String?
  fatherMiddlename       String?
  motherLastname         String?
  motherFirstname        String?
  motherMiddlename       String?
}

model ChildRecord {
  id         String   @id @default(uuid())
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  lastname   String
  firstname  String
  middlename String?
  gender     String
  birthday   DateTime
}

model EducationRecord {
  id            String   @id @default(uuid())
  employeeId    String
  employee      Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  level         String
  school        String
  degree        String?
  yearFrom      String?
  yearTo        String?
  yearGraduated String?
  scholarship   String?
}

model CivilServiceRecord {
  id          String   @id @default(uuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  type        String
  place       String?
  date        DateTime?
  rating      String?
  license     String?
  dateRelease DateTime?
}

model WorkRecord {
  id         String   @id @default(uuid())
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  position   String
  company    String
  status     String?
  dateFrom   DateTime?
  dateTo     DateTime?
  salary     String?
  govEmp     String   // "YES" or "NO"
}

model OrgRecord {
  id         String   @id @default(uuid())
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  name       String
  position   String?
  address    String?
  yearFrom   String?
  yearTo     String?
  hours      String?
}

model TrainingRecord {
  id          String   @id @default(uuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  name        String
  conductedBy String?
  yearFrom    String?
  yearTo      String?
  hours       String?
  fileUrl     String?
}

model SalaryRecord {
  id          String   @id @default(uuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  date        DateTime
  description String?
  ordinance   String
  grade       Int
  step        Int
  tax         String?
  amount      Float
  gross       Float
  type        String   // e.g., "Step Increment" | "Not Step Increment"
  pera        Float    @default(0)
  rata        Float    @default(0)
  cata        Float    @default(0)
}

model ServiceRecord {
  id           String   @id @default(uuid())
  employeeId   String
  employee     Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  from         DateTime
  to           DateTime?
  status       String
  salary       String?
  designation  String
  department   String
  assignment   String?
  branch       String?
  leave        String?
  sepDate      DateTime?
  sepCause     String?
}

model IPCRRecord {
  id         String   @id @default(uuid())
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  month      String
  from       DateTime
  to         DateTime
  remarks    String?
  grades     String?
  fileUrl    String?
}

// =======================
// LEAVE MANAGEMENT
// =======================

model LeaveRecord {
  id          String   @id @default(uuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  type        String
  period      String
  particulars String?
  vlEarned    Float    @default(0)
  vlAbsWP     Float    @default(0)
  vlBalance   Float    @default(0)
  vlAbsWOP    Float    @default(0)
  slEarned    Float    @default(0)
  slAbsWP     Float    @default(0)
  slBalance   Float    @default(0)
  slAbsWOP    Float    @default(0)
  dateAction  DateTime
}
`;
fs.writeFileSync('prisma/schema.prisma', schema, { encoding: 'utf8' });
