
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.0.0
 * Query Engine version: 5dbef10bdbfb579e07d35cc85fb1518d357cb99e
 */
Prisma.prismaVersion = {
  client: "6.0.0",
  engine: "5dbef10bdbfb579e07d35cc85fb1518d357cb99e"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AgencyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  address: 'address',
  contactNo: 'contactNo',
  logoBase64: 'logoBase64'
};

exports.Prisma.DepartmentScalarFieldEnum = {
  id: 'id',
  name: 'name'
};

exports.Prisma.PositionScalarFieldEnum = {
  id: 'id',
  title: 'title'
};

exports.Prisma.SalaryGradeScalarFieldEnum = {
  id: 'id',
  grade: 'grade',
  step: 'step',
  amount: 'amount'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  username: 'username',
  password: 'password',
  role: 'role',
  name: 'name'
};

exports.Prisma.EmployeeScalarFieldEnum = {
  id: 'id',
  firstName: 'firstName',
  lastName: 'lastName',
  middleName: 'middleName',
  nameExtension: 'nameExtension',
  dateOfBirth: 'dateOfBirth',
  placeOfBirth: 'placeOfBirth',
  sex: 'sex',
  civilStatus: 'civilStatus',
  height: 'height',
  weight: 'weight',
  bloodType: 'bloodType',
  gsisNo: 'gsisNo',
  pagibigNo: 'pagibigNo',
  philhealthNo: 'philhealthNo',
  sssNo: 'sssNo',
  tinNo: 'tinNo',
  agencyEmployeeNo: 'agencyEmployeeNo',
  citizenship: 'citizenship',
  residentialAddress: 'residentialAddress',
  permanentAddress: 'permanentAddress',
  telephoneNo: 'telephoneNo',
  mobileNo: 'mobileNo',
  email: 'email',
  departmentId: 'departmentId',
  positionId: 'positionId',
  status: 'status',
  dateHired: 'dateHired',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FamilyBackgroundScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  spouseFirstName: 'spouseFirstName',
  spouseLastName: 'spouseLastName',
  spouseMiddleName: 'spouseMiddleName',
  spouseOccupation: 'spouseOccupation',
  spouseEmployer: 'spouseEmployer',
  spouseBusinessAddress: 'spouseBusinessAddress',
  spouseTelephone: 'spouseTelephone',
  fatherFirstName: 'fatherFirstName',
  fatherLastName: 'fatherLastName',
  fatherMiddleName: 'fatherMiddleName',
  motherMaidenFirst: 'motherMaidenFirst',
  motherMaidenLast: 'motherMaidenLast',
  motherMaidenMiddle: 'motherMaidenMiddle'
};

exports.Prisma.ChildRecordScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  name: 'name',
  dateOfBirth: 'dateOfBirth'
};

exports.Prisma.EducationalBackgroundScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  level: 'level',
  schoolName: 'schoolName',
  degreeCourse: 'degreeCourse',
  yearGraduated: 'yearGraduated',
  highestLevelEarned: 'highestLevelEarned',
  dateFrom: 'dateFrom',
  dateTo: 'dateTo',
  scholarships: 'scholarships'
};

exports.Prisma.CivilServiceEligibilityScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  careerService: 'careerService',
  rating: 'rating',
  dateOfExamination: 'dateOfExamination',
  placeOfExamination: 'placeOfExamination',
  licenseNo: 'licenseNo',
  licenseValidity: 'licenseValidity'
};

exports.Prisma.WorkExperienceScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  dateFrom: 'dateFrom',
  dateTo: 'dateTo',
  positionTitle: 'positionTitle',
  departmentAgencyCompany: 'departmentAgencyCompany',
  monthlySalary: 'monthlySalary',
  salaryGrade: 'salaryGrade',
  statusOfAppointment: 'statusOfAppointment',
  isGovService: 'isGovService'
};

exports.Prisma.VoluntaryWorkScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  organizationName: 'organizationName',
  organizationAddress: 'organizationAddress',
  dateFrom: 'dateFrom',
  dateTo: 'dateTo',
  numberOfHours: 'numberOfHours',
  positionNature: 'positionNature'
};

exports.Prisma.TrainingProgramScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  titleOfLearning: 'titleOfLearning',
  dateFrom: 'dateFrom',
  dateTo: 'dateTo',
  numberOfHours: 'numberOfHours',
  typeOfId: 'typeOfId',
  sponsoredBy: 'sponsoredBy'
};

exports.Prisma.OtherInformationScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  specialSkills: 'specialSkills',
  nonAcademicDistinctions: 'nonAcademicDistinctions',
  membershipInAssoc: 'membershipInAssoc'
};

exports.Prisma.LeaveRecordScalarFieldEnum = {
  id: 'id',
  employeeId: 'employeeId',
  type: 'type',
  startDate: 'startDate',
  endDate: 'endDate',
  status: 'status',
  reason: 'reason',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.AgencyOrderByRelevanceFieldEnum = {
  name: 'name',
  address: 'address',
  contactNo: 'contactNo',
  logoBase64: 'logoBase64'
};

exports.Prisma.DepartmentOrderByRelevanceFieldEnum = {
  name: 'name'
};

exports.Prisma.PositionOrderByRelevanceFieldEnum = {
  title: 'title'
};

exports.Prisma.UserOrderByRelevanceFieldEnum = {
  username: 'username',
  password: 'password',
  role: 'role',
  name: 'name'
};

exports.Prisma.EmployeeOrderByRelevanceFieldEnum = {
  firstName: 'firstName',
  lastName: 'lastName',
  middleName: 'middleName',
  nameExtension: 'nameExtension',
  placeOfBirth: 'placeOfBirth',
  sex: 'sex',
  civilStatus: 'civilStatus',
  bloodType: 'bloodType',
  gsisNo: 'gsisNo',
  pagibigNo: 'pagibigNo',
  philhealthNo: 'philhealthNo',
  sssNo: 'sssNo',
  tinNo: 'tinNo',
  agencyEmployeeNo: 'agencyEmployeeNo',
  citizenship: 'citizenship',
  residentialAddress: 'residentialAddress',
  permanentAddress: 'permanentAddress',
  telephoneNo: 'telephoneNo',
  mobileNo: 'mobileNo',
  email: 'email',
  status: 'status'
};

exports.Prisma.FamilyBackgroundOrderByRelevanceFieldEnum = {
  spouseFirstName: 'spouseFirstName',
  spouseLastName: 'spouseLastName',
  spouseMiddleName: 'spouseMiddleName',
  spouseOccupation: 'spouseOccupation',
  spouseEmployer: 'spouseEmployer',
  spouseBusinessAddress: 'spouseBusinessAddress',
  spouseTelephone: 'spouseTelephone',
  fatherFirstName: 'fatherFirstName',
  fatherLastName: 'fatherLastName',
  fatherMiddleName: 'fatherMiddleName',
  motherMaidenFirst: 'motherMaidenFirst',
  motherMaidenLast: 'motherMaidenLast',
  motherMaidenMiddle: 'motherMaidenMiddle'
};

exports.Prisma.ChildRecordOrderByRelevanceFieldEnum = {
  name: 'name'
};

exports.Prisma.EducationalBackgroundOrderByRelevanceFieldEnum = {
  level: 'level',
  schoolName: 'schoolName',
  degreeCourse: 'degreeCourse',
  yearGraduated: 'yearGraduated',
  highestLevelEarned: 'highestLevelEarned',
  scholarships: 'scholarships'
};

exports.Prisma.CivilServiceEligibilityOrderByRelevanceFieldEnum = {
  careerService: 'careerService',
  placeOfExamination: 'placeOfExamination',
  licenseNo: 'licenseNo'
};

exports.Prisma.WorkExperienceOrderByRelevanceFieldEnum = {
  positionTitle: 'positionTitle',
  departmentAgencyCompany: 'departmentAgencyCompany',
  salaryGrade: 'salaryGrade',
  statusOfAppointment: 'statusOfAppointment'
};

exports.Prisma.VoluntaryWorkOrderByRelevanceFieldEnum = {
  organizationName: 'organizationName',
  organizationAddress: 'organizationAddress',
  positionNature: 'positionNature'
};

exports.Prisma.TrainingProgramOrderByRelevanceFieldEnum = {
  titleOfLearning: 'titleOfLearning',
  typeOfId: 'typeOfId',
  sponsoredBy: 'sponsoredBy'
};

exports.Prisma.OtherInformationOrderByRelevanceFieldEnum = {
  specialSkills: 'specialSkills',
  nonAcademicDistinctions: 'nonAcademicDistinctions',
  membershipInAssoc: 'membershipInAssoc'
};

exports.Prisma.LeaveRecordOrderByRelevanceFieldEnum = {
  type: 'type',
  status: 'status',
  reason: 'reason'
};


exports.Prisma.ModelName = {
  Agency: 'Agency',
  Department: 'Department',
  Position: 'Position',
  SalaryGrade: 'SalaryGrade',
  User: 'User',
  Employee: 'Employee',
  FamilyBackground: 'FamilyBackground',
  ChildRecord: 'ChildRecord',
  EducationalBackground: 'EducationalBackground',
  CivilServiceEligibility: 'CivilServiceEligibility',
  WorkExperience: 'WorkExperience',
  VoluntaryWork: 'VoluntaryWork',
  TrainingProgram: 'TrainingProgram',
  OtherInformation: 'OtherInformation',
  LeaveRecord: 'LeaveRecord'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
