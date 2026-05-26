
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Agency
 * 
 */
export type Agency = $Result.DefaultSelection<Prisma.$AgencyPayload>
/**
 * Model Department
 * 
 */
export type Department = $Result.DefaultSelection<Prisma.$DepartmentPayload>
/**
 * Model Position
 * 
 */
export type Position = $Result.DefaultSelection<Prisma.$PositionPayload>
/**
 * Model SalaryGrade
 * 
 */
export type SalaryGrade = $Result.DefaultSelection<Prisma.$SalaryGradePayload>
/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Employee
 * 
 */
export type Employee = $Result.DefaultSelection<Prisma.$EmployeePayload>
/**
 * Model FamilyBackground
 * 
 */
export type FamilyBackground = $Result.DefaultSelection<Prisma.$FamilyBackgroundPayload>
/**
 * Model ChildRecord
 * 
 */
export type ChildRecord = $Result.DefaultSelection<Prisma.$ChildRecordPayload>
/**
 * Model EducationalBackground
 * 
 */
export type EducationalBackground = $Result.DefaultSelection<Prisma.$EducationalBackgroundPayload>
/**
 * Model CivilServiceEligibility
 * 
 */
export type CivilServiceEligibility = $Result.DefaultSelection<Prisma.$CivilServiceEligibilityPayload>
/**
 * Model WorkExperience
 * 
 */
export type WorkExperience = $Result.DefaultSelection<Prisma.$WorkExperiencePayload>
/**
 * Model VoluntaryWork
 * 
 */
export type VoluntaryWork = $Result.DefaultSelection<Prisma.$VoluntaryWorkPayload>
/**
 * Model TrainingProgram
 * 
 */
export type TrainingProgram = $Result.DefaultSelection<Prisma.$TrainingProgramPayload>
/**
 * Model OtherInformation
 * 
 */
export type OtherInformation = $Result.DefaultSelection<Prisma.$OtherInformationPayload>
/**
 * Model LeaveRecord
 * 
 */
export type LeaveRecord = $Result.DefaultSelection<Prisma.$LeaveRecordPayload>

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Agencies
 * const agencies = await prisma.agency.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Agencies
   * const agencies = await prisma.agency.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.agency`: Exposes CRUD operations for the **Agency** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Agencies
    * const agencies = await prisma.agency.findMany()
    * ```
    */
  get agency(): Prisma.AgencyDelegate<ExtArgs>;

  /**
   * `prisma.department`: Exposes CRUD operations for the **Department** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Departments
    * const departments = await prisma.department.findMany()
    * ```
    */
  get department(): Prisma.DepartmentDelegate<ExtArgs>;

  /**
   * `prisma.position`: Exposes CRUD operations for the **Position** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Positions
    * const positions = await prisma.position.findMany()
    * ```
    */
  get position(): Prisma.PositionDelegate<ExtArgs>;

  /**
   * `prisma.salaryGrade`: Exposes CRUD operations for the **SalaryGrade** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SalaryGrades
    * const salaryGrades = await prisma.salaryGrade.findMany()
    * ```
    */
  get salaryGrade(): Prisma.SalaryGradeDelegate<ExtArgs>;

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs>;

  /**
   * `prisma.employee`: Exposes CRUD operations for the **Employee** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Employees
    * const employees = await prisma.employee.findMany()
    * ```
    */
  get employee(): Prisma.EmployeeDelegate<ExtArgs>;

  /**
   * `prisma.familyBackground`: Exposes CRUD operations for the **FamilyBackground** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more FamilyBackgrounds
    * const familyBackgrounds = await prisma.familyBackground.findMany()
    * ```
    */
  get familyBackground(): Prisma.FamilyBackgroundDelegate<ExtArgs>;

  /**
   * `prisma.childRecord`: Exposes CRUD operations for the **ChildRecord** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ChildRecords
    * const childRecords = await prisma.childRecord.findMany()
    * ```
    */
  get childRecord(): Prisma.ChildRecordDelegate<ExtArgs>;

  /**
   * `prisma.educationalBackground`: Exposes CRUD operations for the **EducationalBackground** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EducationalBackgrounds
    * const educationalBackgrounds = await prisma.educationalBackground.findMany()
    * ```
    */
  get educationalBackground(): Prisma.EducationalBackgroundDelegate<ExtArgs>;

  /**
   * `prisma.civilServiceEligibility`: Exposes CRUD operations for the **CivilServiceEligibility** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CivilServiceEligibilities
    * const civilServiceEligibilities = await prisma.civilServiceEligibility.findMany()
    * ```
    */
  get civilServiceEligibility(): Prisma.CivilServiceEligibilityDelegate<ExtArgs>;

  /**
   * `prisma.workExperience`: Exposes CRUD operations for the **WorkExperience** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WorkExperiences
    * const workExperiences = await prisma.workExperience.findMany()
    * ```
    */
  get workExperience(): Prisma.WorkExperienceDelegate<ExtArgs>;

  /**
   * `prisma.voluntaryWork`: Exposes CRUD operations for the **VoluntaryWork** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more VoluntaryWorks
    * const voluntaryWorks = await prisma.voluntaryWork.findMany()
    * ```
    */
  get voluntaryWork(): Prisma.VoluntaryWorkDelegate<ExtArgs>;

  /**
   * `prisma.trainingProgram`: Exposes CRUD operations for the **TrainingProgram** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TrainingPrograms
    * const trainingPrograms = await prisma.trainingProgram.findMany()
    * ```
    */
  get trainingProgram(): Prisma.TrainingProgramDelegate<ExtArgs>;

  /**
   * `prisma.otherInformation`: Exposes CRUD operations for the **OtherInformation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more OtherInformations
    * const otherInformations = await prisma.otherInformation.findMany()
    * ```
    */
  get otherInformation(): Prisma.OtherInformationDelegate<ExtArgs>;

  /**
   * `prisma.leaveRecord`: Exposes CRUD operations for the **LeaveRecord** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more LeaveRecords
    * const leaveRecords = await prisma.leaveRecord.findMany()
    * ```
    */
  get leaveRecord(): Prisma.LeaveRecordDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.0.0
   * Query Engine version: 5dbef10bdbfb579e07d35cc85fb1518d357cb99e
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
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

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "agency" | "department" | "position" | "salaryGrade" | "user" | "employee" | "familyBackground" | "childRecord" | "educationalBackground" | "civilServiceEligibility" | "workExperience" | "voluntaryWork" | "trainingProgram" | "otherInformation" | "leaveRecord"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Agency: {
        payload: Prisma.$AgencyPayload<ExtArgs>
        fields: Prisma.AgencyFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AgencyFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgencyPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AgencyFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgencyPayload>
          }
          findFirst: {
            args: Prisma.AgencyFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgencyPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AgencyFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgencyPayload>
          }
          findMany: {
            args: Prisma.AgencyFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgencyPayload>[]
          }
          create: {
            args: Prisma.AgencyCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgencyPayload>
          }
          createMany: {
            args: Prisma.AgencyCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.AgencyDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgencyPayload>
          }
          update: {
            args: Prisma.AgencyUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgencyPayload>
          }
          deleteMany: {
            args: Prisma.AgencyDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AgencyUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.AgencyUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgencyPayload>
          }
          aggregate: {
            args: Prisma.AgencyAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAgency>
          }
          groupBy: {
            args: Prisma.AgencyGroupByArgs<ExtArgs>
            result: $Utils.Optional<AgencyGroupByOutputType>[]
          }
          count: {
            args: Prisma.AgencyCountArgs<ExtArgs>
            result: $Utils.Optional<AgencyCountAggregateOutputType> | number
          }
        }
      }
      Department: {
        payload: Prisma.$DepartmentPayload<ExtArgs>
        fields: Prisma.DepartmentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DepartmentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepartmentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DepartmentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepartmentPayload>
          }
          findFirst: {
            args: Prisma.DepartmentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepartmentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DepartmentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepartmentPayload>
          }
          findMany: {
            args: Prisma.DepartmentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepartmentPayload>[]
          }
          create: {
            args: Prisma.DepartmentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepartmentPayload>
          }
          createMany: {
            args: Prisma.DepartmentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.DepartmentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepartmentPayload>
          }
          update: {
            args: Prisma.DepartmentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepartmentPayload>
          }
          deleteMany: {
            args: Prisma.DepartmentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DepartmentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.DepartmentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepartmentPayload>
          }
          aggregate: {
            args: Prisma.DepartmentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDepartment>
          }
          groupBy: {
            args: Prisma.DepartmentGroupByArgs<ExtArgs>
            result: $Utils.Optional<DepartmentGroupByOutputType>[]
          }
          count: {
            args: Prisma.DepartmentCountArgs<ExtArgs>
            result: $Utils.Optional<DepartmentCountAggregateOutputType> | number
          }
        }
      }
      Position: {
        payload: Prisma.$PositionPayload<ExtArgs>
        fields: Prisma.PositionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PositionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PositionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload>
          }
          findFirst: {
            args: Prisma.PositionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PositionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload>
          }
          findMany: {
            args: Prisma.PositionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload>[]
          }
          create: {
            args: Prisma.PositionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload>
          }
          createMany: {
            args: Prisma.PositionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.PositionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload>
          }
          update: {
            args: Prisma.PositionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload>
          }
          deleteMany: {
            args: Prisma.PositionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PositionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PositionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PositionPayload>
          }
          aggregate: {
            args: Prisma.PositionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePosition>
          }
          groupBy: {
            args: Prisma.PositionGroupByArgs<ExtArgs>
            result: $Utils.Optional<PositionGroupByOutputType>[]
          }
          count: {
            args: Prisma.PositionCountArgs<ExtArgs>
            result: $Utils.Optional<PositionCountAggregateOutputType> | number
          }
        }
      }
      SalaryGrade: {
        payload: Prisma.$SalaryGradePayload<ExtArgs>
        fields: Prisma.SalaryGradeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SalaryGradeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalaryGradePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SalaryGradeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalaryGradePayload>
          }
          findFirst: {
            args: Prisma.SalaryGradeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalaryGradePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SalaryGradeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalaryGradePayload>
          }
          findMany: {
            args: Prisma.SalaryGradeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalaryGradePayload>[]
          }
          create: {
            args: Prisma.SalaryGradeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalaryGradePayload>
          }
          createMany: {
            args: Prisma.SalaryGradeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.SalaryGradeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalaryGradePayload>
          }
          update: {
            args: Prisma.SalaryGradeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalaryGradePayload>
          }
          deleteMany: {
            args: Prisma.SalaryGradeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SalaryGradeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SalaryGradeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalaryGradePayload>
          }
          aggregate: {
            args: Prisma.SalaryGradeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSalaryGrade>
          }
          groupBy: {
            args: Prisma.SalaryGradeGroupByArgs<ExtArgs>
            result: $Utils.Optional<SalaryGradeGroupByOutputType>[]
          }
          count: {
            args: Prisma.SalaryGradeCountArgs<ExtArgs>
            result: $Utils.Optional<SalaryGradeCountAggregateOutputType> | number
          }
        }
      }
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Employee: {
        payload: Prisma.$EmployeePayload<ExtArgs>
        fields: Prisma.EmployeeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EmployeeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmployeePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EmployeeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmployeePayload>
          }
          findFirst: {
            args: Prisma.EmployeeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmployeePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EmployeeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmployeePayload>
          }
          findMany: {
            args: Prisma.EmployeeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmployeePayload>[]
          }
          create: {
            args: Prisma.EmployeeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmployeePayload>
          }
          createMany: {
            args: Prisma.EmployeeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.EmployeeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmployeePayload>
          }
          update: {
            args: Prisma.EmployeeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmployeePayload>
          }
          deleteMany: {
            args: Prisma.EmployeeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EmployeeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.EmployeeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmployeePayload>
          }
          aggregate: {
            args: Prisma.EmployeeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEmployee>
          }
          groupBy: {
            args: Prisma.EmployeeGroupByArgs<ExtArgs>
            result: $Utils.Optional<EmployeeGroupByOutputType>[]
          }
          count: {
            args: Prisma.EmployeeCountArgs<ExtArgs>
            result: $Utils.Optional<EmployeeCountAggregateOutputType> | number
          }
        }
      }
      FamilyBackground: {
        payload: Prisma.$FamilyBackgroundPayload<ExtArgs>
        fields: Prisma.FamilyBackgroundFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FamilyBackgroundFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FamilyBackgroundPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FamilyBackgroundFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FamilyBackgroundPayload>
          }
          findFirst: {
            args: Prisma.FamilyBackgroundFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FamilyBackgroundPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FamilyBackgroundFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FamilyBackgroundPayload>
          }
          findMany: {
            args: Prisma.FamilyBackgroundFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FamilyBackgroundPayload>[]
          }
          create: {
            args: Prisma.FamilyBackgroundCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FamilyBackgroundPayload>
          }
          createMany: {
            args: Prisma.FamilyBackgroundCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.FamilyBackgroundDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FamilyBackgroundPayload>
          }
          update: {
            args: Prisma.FamilyBackgroundUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FamilyBackgroundPayload>
          }
          deleteMany: {
            args: Prisma.FamilyBackgroundDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FamilyBackgroundUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.FamilyBackgroundUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FamilyBackgroundPayload>
          }
          aggregate: {
            args: Prisma.FamilyBackgroundAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFamilyBackground>
          }
          groupBy: {
            args: Prisma.FamilyBackgroundGroupByArgs<ExtArgs>
            result: $Utils.Optional<FamilyBackgroundGroupByOutputType>[]
          }
          count: {
            args: Prisma.FamilyBackgroundCountArgs<ExtArgs>
            result: $Utils.Optional<FamilyBackgroundCountAggregateOutputType> | number
          }
        }
      }
      ChildRecord: {
        payload: Prisma.$ChildRecordPayload<ExtArgs>
        fields: Prisma.ChildRecordFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ChildRecordFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChildRecordPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ChildRecordFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChildRecordPayload>
          }
          findFirst: {
            args: Prisma.ChildRecordFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChildRecordPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ChildRecordFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChildRecordPayload>
          }
          findMany: {
            args: Prisma.ChildRecordFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChildRecordPayload>[]
          }
          create: {
            args: Prisma.ChildRecordCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChildRecordPayload>
          }
          createMany: {
            args: Prisma.ChildRecordCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.ChildRecordDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChildRecordPayload>
          }
          update: {
            args: Prisma.ChildRecordUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChildRecordPayload>
          }
          deleteMany: {
            args: Prisma.ChildRecordDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ChildRecordUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ChildRecordUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChildRecordPayload>
          }
          aggregate: {
            args: Prisma.ChildRecordAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateChildRecord>
          }
          groupBy: {
            args: Prisma.ChildRecordGroupByArgs<ExtArgs>
            result: $Utils.Optional<ChildRecordGroupByOutputType>[]
          }
          count: {
            args: Prisma.ChildRecordCountArgs<ExtArgs>
            result: $Utils.Optional<ChildRecordCountAggregateOutputType> | number
          }
        }
      }
      EducationalBackground: {
        payload: Prisma.$EducationalBackgroundPayload<ExtArgs>
        fields: Prisma.EducationalBackgroundFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EducationalBackgroundFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EducationalBackgroundPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EducationalBackgroundFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EducationalBackgroundPayload>
          }
          findFirst: {
            args: Prisma.EducationalBackgroundFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EducationalBackgroundPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EducationalBackgroundFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EducationalBackgroundPayload>
          }
          findMany: {
            args: Prisma.EducationalBackgroundFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EducationalBackgroundPayload>[]
          }
          create: {
            args: Prisma.EducationalBackgroundCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EducationalBackgroundPayload>
          }
          createMany: {
            args: Prisma.EducationalBackgroundCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.EducationalBackgroundDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EducationalBackgroundPayload>
          }
          update: {
            args: Prisma.EducationalBackgroundUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EducationalBackgroundPayload>
          }
          deleteMany: {
            args: Prisma.EducationalBackgroundDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EducationalBackgroundUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.EducationalBackgroundUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EducationalBackgroundPayload>
          }
          aggregate: {
            args: Prisma.EducationalBackgroundAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEducationalBackground>
          }
          groupBy: {
            args: Prisma.EducationalBackgroundGroupByArgs<ExtArgs>
            result: $Utils.Optional<EducationalBackgroundGroupByOutputType>[]
          }
          count: {
            args: Prisma.EducationalBackgroundCountArgs<ExtArgs>
            result: $Utils.Optional<EducationalBackgroundCountAggregateOutputType> | number
          }
        }
      }
      CivilServiceEligibility: {
        payload: Prisma.$CivilServiceEligibilityPayload<ExtArgs>
        fields: Prisma.CivilServiceEligibilityFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CivilServiceEligibilityFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CivilServiceEligibilityPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CivilServiceEligibilityFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CivilServiceEligibilityPayload>
          }
          findFirst: {
            args: Prisma.CivilServiceEligibilityFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CivilServiceEligibilityPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CivilServiceEligibilityFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CivilServiceEligibilityPayload>
          }
          findMany: {
            args: Prisma.CivilServiceEligibilityFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CivilServiceEligibilityPayload>[]
          }
          create: {
            args: Prisma.CivilServiceEligibilityCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CivilServiceEligibilityPayload>
          }
          createMany: {
            args: Prisma.CivilServiceEligibilityCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.CivilServiceEligibilityDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CivilServiceEligibilityPayload>
          }
          update: {
            args: Prisma.CivilServiceEligibilityUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CivilServiceEligibilityPayload>
          }
          deleteMany: {
            args: Prisma.CivilServiceEligibilityDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CivilServiceEligibilityUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CivilServiceEligibilityUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CivilServiceEligibilityPayload>
          }
          aggregate: {
            args: Prisma.CivilServiceEligibilityAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCivilServiceEligibility>
          }
          groupBy: {
            args: Prisma.CivilServiceEligibilityGroupByArgs<ExtArgs>
            result: $Utils.Optional<CivilServiceEligibilityGroupByOutputType>[]
          }
          count: {
            args: Prisma.CivilServiceEligibilityCountArgs<ExtArgs>
            result: $Utils.Optional<CivilServiceEligibilityCountAggregateOutputType> | number
          }
        }
      }
      WorkExperience: {
        payload: Prisma.$WorkExperiencePayload<ExtArgs>
        fields: Prisma.WorkExperienceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WorkExperienceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkExperiencePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WorkExperienceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkExperiencePayload>
          }
          findFirst: {
            args: Prisma.WorkExperienceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkExperiencePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WorkExperienceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkExperiencePayload>
          }
          findMany: {
            args: Prisma.WorkExperienceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkExperiencePayload>[]
          }
          create: {
            args: Prisma.WorkExperienceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkExperiencePayload>
          }
          createMany: {
            args: Prisma.WorkExperienceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.WorkExperienceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkExperiencePayload>
          }
          update: {
            args: Prisma.WorkExperienceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkExperiencePayload>
          }
          deleteMany: {
            args: Prisma.WorkExperienceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WorkExperienceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.WorkExperienceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkExperiencePayload>
          }
          aggregate: {
            args: Prisma.WorkExperienceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWorkExperience>
          }
          groupBy: {
            args: Prisma.WorkExperienceGroupByArgs<ExtArgs>
            result: $Utils.Optional<WorkExperienceGroupByOutputType>[]
          }
          count: {
            args: Prisma.WorkExperienceCountArgs<ExtArgs>
            result: $Utils.Optional<WorkExperienceCountAggregateOutputType> | number
          }
        }
      }
      VoluntaryWork: {
        payload: Prisma.$VoluntaryWorkPayload<ExtArgs>
        fields: Prisma.VoluntaryWorkFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VoluntaryWorkFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoluntaryWorkPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VoluntaryWorkFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoluntaryWorkPayload>
          }
          findFirst: {
            args: Prisma.VoluntaryWorkFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoluntaryWorkPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VoluntaryWorkFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoluntaryWorkPayload>
          }
          findMany: {
            args: Prisma.VoluntaryWorkFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoluntaryWorkPayload>[]
          }
          create: {
            args: Prisma.VoluntaryWorkCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoluntaryWorkPayload>
          }
          createMany: {
            args: Prisma.VoluntaryWorkCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.VoluntaryWorkDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoluntaryWorkPayload>
          }
          update: {
            args: Prisma.VoluntaryWorkUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoluntaryWorkPayload>
          }
          deleteMany: {
            args: Prisma.VoluntaryWorkDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VoluntaryWorkUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.VoluntaryWorkUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VoluntaryWorkPayload>
          }
          aggregate: {
            args: Prisma.VoluntaryWorkAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVoluntaryWork>
          }
          groupBy: {
            args: Prisma.VoluntaryWorkGroupByArgs<ExtArgs>
            result: $Utils.Optional<VoluntaryWorkGroupByOutputType>[]
          }
          count: {
            args: Prisma.VoluntaryWorkCountArgs<ExtArgs>
            result: $Utils.Optional<VoluntaryWorkCountAggregateOutputType> | number
          }
        }
      }
      TrainingProgram: {
        payload: Prisma.$TrainingProgramPayload<ExtArgs>
        fields: Prisma.TrainingProgramFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TrainingProgramFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrainingProgramPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TrainingProgramFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrainingProgramPayload>
          }
          findFirst: {
            args: Prisma.TrainingProgramFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrainingProgramPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TrainingProgramFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrainingProgramPayload>
          }
          findMany: {
            args: Prisma.TrainingProgramFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrainingProgramPayload>[]
          }
          create: {
            args: Prisma.TrainingProgramCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrainingProgramPayload>
          }
          createMany: {
            args: Prisma.TrainingProgramCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.TrainingProgramDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrainingProgramPayload>
          }
          update: {
            args: Prisma.TrainingProgramUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrainingProgramPayload>
          }
          deleteMany: {
            args: Prisma.TrainingProgramDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TrainingProgramUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TrainingProgramUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrainingProgramPayload>
          }
          aggregate: {
            args: Prisma.TrainingProgramAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTrainingProgram>
          }
          groupBy: {
            args: Prisma.TrainingProgramGroupByArgs<ExtArgs>
            result: $Utils.Optional<TrainingProgramGroupByOutputType>[]
          }
          count: {
            args: Prisma.TrainingProgramCountArgs<ExtArgs>
            result: $Utils.Optional<TrainingProgramCountAggregateOutputType> | number
          }
        }
      }
      OtherInformation: {
        payload: Prisma.$OtherInformationPayload<ExtArgs>
        fields: Prisma.OtherInformationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.OtherInformationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OtherInformationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.OtherInformationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OtherInformationPayload>
          }
          findFirst: {
            args: Prisma.OtherInformationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OtherInformationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.OtherInformationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OtherInformationPayload>
          }
          findMany: {
            args: Prisma.OtherInformationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OtherInformationPayload>[]
          }
          create: {
            args: Prisma.OtherInformationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OtherInformationPayload>
          }
          createMany: {
            args: Prisma.OtherInformationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.OtherInformationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OtherInformationPayload>
          }
          update: {
            args: Prisma.OtherInformationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OtherInformationPayload>
          }
          deleteMany: {
            args: Prisma.OtherInformationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.OtherInformationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.OtherInformationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OtherInformationPayload>
          }
          aggregate: {
            args: Prisma.OtherInformationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOtherInformation>
          }
          groupBy: {
            args: Prisma.OtherInformationGroupByArgs<ExtArgs>
            result: $Utils.Optional<OtherInformationGroupByOutputType>[]
          }
          count: {
            args: Prisma.OtherInformationCountArgs<ExtArgs>
            result: $Utils.Optional<OtherInformationCountAggregateOutputType> | number
          }
        }
      }
      LeaveRecord: {
        payload: Prisma.$LeaveRecordPayload<ExtArgs>
        fields: Prisma.LeaveRecordFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LeaveRecordFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaveRecordPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LeaveRecordFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaveRecordPayload>
          }
          findFirst: {
            args: Prisma.LeaveRecordFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaveRecordPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LeaveRecordFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaveRecordPayload>
          }
          findMany: {
            args: Prisma.LeaveRecordFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaveRecordPayload>[]
          }
          create: {
            args: Prisma.LeaveRecordCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaveRecordPayload>
          }
          createMany: {
            args: Prisma.LeaveRecordCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.LeaveRecordDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaveRecordPayload>
          }
          update: {
            args: Prisma.LeaveRecordUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaveRecordPayload>
          }
          deleteMany: {
            args: Prisma.LeaveRecordDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LeaveRecordUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.LeaveRecordUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaveRecordPayload>
          }
          aggregate: {
            args: Prisma.LeaveRecordAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLeaveRecord>
          }
          groupBy: {
            args: Prisma.LeaveRecordGroupByArgs<ExtArgs>
            result: $Utils.Optional<LeaveRecordGroupByOutputType>[]
          }
          count: {
            args: Prisma.LeaveRecordCountArgs<ExtArgs>
            result: $Utils.Optional<LeaveRecordCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type DepartmentCountOutputType
   */

  export type DepartmentCountOutputType = {
    employees: number
  }

  export type DepartmentCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    employees?: boolean | DepartmentCountOutputTypeCountEmployeesArgs
  }

  // Custom InputTypes
  /**
   * DepartmentCountOutputType without action
   */
  export type DepartmentCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DepartmentCountOutputType
     */
    select?: DepartmentCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * DepartmentCountOutputType without action
   */
  export type DepartmentCountOutputTypeCountEmployeesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EmployeeWhereInput
  }


  /**
   * Count Type PositionCountOutputType
   */

  export type PositionCountOutputType = {
    employees: number
  }

  export type PositionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    employees?: boolean | PositionCountOutputTypeCountEmployeesArgs
  }

  // Custom InputTypes
  /**
   * PositionCountOutputType without action
   */
  export type PositionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PositionCountOutputType
     */
    select?: PositionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PositionCountOutputType without action
   */
  export type PositionCountOutputTypeCountEmployeesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EmployeeWhereInput
  }


  /**
   * Count Type EmployeeCountOutputType
   */

  export type EmployeeCountOutputType = {
    children: number
    education: number
    civilService: number
    workExperience: number
    voluntaryWork: number
    training: number
    skills: number
    leaves: number
  }

  export type EmployeeCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    children?: boolean | EmployeeCountOutputTypeCountChildrenArgs
    education?: boolean | EmployeeCountOutputTypeCountEducationArgs
    civilService?: boolean | EmployeeCountOutputTypeCountCivilServiceArgs
    workExperience?: boolean | EmployeeCountOutputTypeCountWorkExperienceArgs
    voluntaryWork?: boolean | EmployeeCountOutputTypeCountVoluntaryWorkArgs
    training?: boolean | EmployeeCountOutputTypeCountTrainingArgs
    skills?: boolean | EmployeeCountOutputTypeCountSkillsArgs
    leaves?: boolean | EmployeeCountOutputTypeCountLeavesArgs
  }

  // Custom InputTypes
  /**
   * EmployeeCountOutputType without action
   */
  export type EmployeeCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmployeeCountOutputType
     */
    select?: EmployeeCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * EmployeeCountOutputType without action
   */
  export type EmployeeCountOutputTypeCountChildrenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChildRecordWhereInput
  }

  /**
   * EmployeeCountOutputType without action
   */
  export type EmployeeCountOutputTypeCountEducationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EducationalBackgroundWhereInput
  }

  /**
   * EmployeeCountOutputType without action
   */
  export type EmployeeCountOutputTypeCountCivilServiceArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CivilServiceEligibilityWhereInput
  }

  /**
   * EmployeeCountOutputType without action
   */
  export type EmployeeCountOutputTypeCountWorkExperienceArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkExperienceWhereInput
  }

  /**
   * EmployeeCountOutputType without action
   */
  export type EmployeeCountOutputTypeCountVoluntaryWorkArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VoluntaryWorkWhereInput
  }

  /**
   * EmployeeCountOutputType without action
   */
  export type EmployeeCountOutputTypeCountTrainingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TrainingProgramWhereInput
  }

  /**
   * EmployeeCountOutputType without action
   */
  export type EmployeeCountOutputTypeCountSkillsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OtherInformationWhereInput
  }

  /**
   * EmployeeCountOutputType without action
   */
  export type EmployeeCountOutputTypeCountLeavesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LeaveRecordWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Agency
   */

  export type AggregateAgency = {
    _count: AgencyCountAggregateOutputType | null
    _avg: AgencyAvgAggregateOutputType | null
    _sum: AgencySumAggregateOutputType | null
    _min: AgencyMinAggregateOutputType | null
    _max: AgencyMaxAggregateOutputType | null
  }

  export type AgencyAvgAggregateOutputType = {
    id: number | null
  }

  export type AgencySumAggregateOutputType = {
    id: number | null
  }

  export type AgencyMinAggregateOutputType = {
    id: number | null
    name: string | null
    address: string | null
    contactNo: string | null
    logoBase64: string | null
  }

  export type AgencyMaxAggregateOutputType = {
    id: number | null
    name: string | null
    address: string | null
    contactNo: string | null
    logoBase64: string | null
  }

  export type AgencyCountAggregateOutputType = {
    id: number
    name: number
    address: number
    contactNo: number
    logoBase64: number
    _all: number
  }


  export type AgencyAvgAggregateInputType = {
    id?: true
  }

  export type AgencySumAggregateInputType = {
    id?: true
  }

  export type AgencyMinAggregateInputType = {
    id?: true
    name?: true
    address?: true
    contactNo?: true
    logoBase64?: true
  }

  export type AgencyMaxAggregateInputType = {
    id?: true
    name?: true
    address?: true
    contactNo?: true
    logoBase64?: true
  }

  export type AgencyCountAggregateInputType = {
    id?: true
    name?: true
    address?: true
    contactNo?: true
    logoBase64?: true
    _all?: true
  }

  export type AgencyAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Agency to aggregate.
     */
    where?: AgencyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Agencies to fetch.
     */
    orderBy?: AgencyOrderByWithRelationInput | AgencyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AgencyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Agencies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Agencies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Agencies
    **/
    _count?: true | AgencyCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AgencyAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AgencySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AgencyMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AgencyMaxAggregateInputType
  }

  export type GetAgencyAggregateType<T extends AgencyAggregateArgs> = {
        [P in keyof T & keyof AggregateAgency]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAgency[P]>
      : GetScalarType<T[P], AggregateAgency[P]>
  }




  export type AgencyGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AgencyWhereInput
    orderBy?: AgencyOrderByWithAggregationInput | AgencyOrderByWithAggregationInput[]
    by: AgencyScalarFieldEnum[] | AgencyScalarFieldEnum
    having?: AgencyScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AgencyCountAggregateInputType | true
    _avg?: AgencyAvgAggregateInputType
    _sum?: AgencySumAggregateInputType
    _min?: AgencyMinAggregateInputType
    _max?: AgencyMaxAggregateInputType
  }

  export type AgencyGroupByOutputType = {
    id: number
    name: string
    address: string
    contactNo: string
    logoBase64: string | null
    _count: AgencyCountAggregateOutputType | null
    _avg: AgencyAvgAggregateOutputType | null
    _sum: AgencySumAggregateOutputType | null
    _min: AgencyMinAggregateOutputType | null
    _max: AgencyMaxAggregateOutputType | null
  }

  type GetAgencyGroupByPayload<T extends AgencyGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AgencyGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AgencyGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AgencyGroupByOutputType[P]>
            : GetScalarType<T[P], AgencyGroupByOutputType[P]>
        }
      >
    >


  export type AgencySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    address?: boolean
    contactNo?: boolean
    logoBase64?: boolean
  }, ExtArgs["result"]["agency"]>


  export type AgencySelectScalar = {
    id?: boolean
    name?: boolean
    address?: boolean
    contactNo?: boolean
    logoBase64?: boolean
  }


  export type $AgencyPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Agency"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
      address: string
      contactNo: string
      logoBase64: string | null
    }, ExtArgs["result"]["agency"]>
    composites: {}
  }

  type AgencyGetPayload<S extends boolean | null | undefined | AgencyDefaultArgs> = $Result.GetResult<Prisma.$AgencyPayload, S>

  type AgencyCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<AgencyFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: AgencyCountAggregateInputType | true
    }

  export interface AgencyDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Agency'], meta: { name: 'Agency' } }
    /**
     * Find zero or one Agency that matches the filter.
     * @param {AgencyFindUniqueArgs} args - Arguments to find a Agency
     * @example
     * // Get one Agency
     * const agency = await prisma.agency.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AgencyFindUniqueArgs>(args: SelectSubset<T, AgencyFindUniqueArgs<ExtArgs>>): Prisma__AgencyClient<$Result.GetResult<Prisma.$AgencyPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Agency that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {AgencyFindUniqueOrThrowArgs} args - Arguments to find a Agency
     * @example
     * // Get one Agency
     * const agency = await prisma.agency.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AgencyFindUniqueOrThrowArgs>(args: SelectSubset<T, AgencyFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AgencyClient<$Result.GetResult<Prisma.$AgencyPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Agency that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgencyFindFirstArgs} args - Arguments to find a Agency
     * @example
     * // Get one Agency
     * const agency = await prisma.agency.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AgencyFindFirstArgs>(args?: SelectSubset<T, AgencyFindFirstArgs<ExtArgs>>): Prisma__AgencyClient<$Result.GetResult<Prisma.$AgencyPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Agency that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgencyFindFirstOrThrowArgs} args - Arguments to find a Agency
     * @example
     * // Get one Agency
     * const agency = await prisma.agency.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AgencyFindFirstOrThrowArgs>(args?: SelectSubset<T, AgencyFindFirstOrThrowArgs<ExtArgs>>): Prisma__AgencyClient<$Result.GetResult<Prisma.$AgencyPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Agencies that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgencyFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Agencies
     * const agencies = await prisma.agency.findMany()
     * 
     * // Get first 10 Agencies
     * const agencies = await prisma.agency.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const agencyWithIdOnly = await prisma.agency.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AgencyFindManyArgs>(args?: SelectSubset<T, AgencyFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgencyPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Agency.
     * @param {AgencyCreateArgs} args - Arguments to create a Agency.
     * @example
     * // Create one Agency
     * const Agency = await prisma.agency.create({
     *   data: {
     *     // ... data to create a Agency
     *   }
     * })
     * 
     */
    create<T extends AgencyCreateArgs>(args: SelectSubset<T, AgencyCreateArgs<ExtArgs>>): Prisma__AgencyClient<$Result.GetResult<Prisma.$AgencyPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Agencies.
     * @param {AgencyCreateManyArgs} args - Arguments to create many Agencies.
     * @example
     * // Create many Agencies
     * const agency = await prisma.agency.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AgencyCreateManyArgs>(args?: SelectSubset<T, AgencyCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Agency.
     * @param {AgencyDeleteArgs} args - Arguments to delete one Agency.
     * @example
     * // Delete one Agency
     * const Agency = await prisma.agency.delete({
     *   where: {
     *     // ... filter to delete one Agency
     *   }
     * })
     * 
     */
    delete<T extends AgencyDeleteArgs>(args: SelectSubset<T, AgencyDeleteArgs<ExtArgs>>): Prisma__AgencyClient<$Result.GetResult<Prisma.$AgencyPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Agency.
     * @param {AgencyUpdateArgs} args - Arguments to update one Agency.
     * @example
     * // Update one Agency
     * const agency = await prisma.agency.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AgencyUpdateArgs>(args: SelectSubset<T, AgencyUpdateArgs<ExtArgs>>): Prisma__AgencyClient<$Result.GetResult<Prisma.$AgencyPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Agencies.
     * @param {AgencyDeleteManyArgs} args - Arguments to filter Agencies to delete.
     * @example
     * // Delete a few Agencies
     * const { count } = await prisma.agency.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AgencyDeleteManyArgs>(args?: SelectSubset<T, AgencyDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Agencies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgencyUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Agencies
     * const agency = await prisma.agency.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AgencyUpdateManyArgs>(args: SelectSubset<T, AgencyUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Agency.
     * @param {AgencyUpsertArgs} args - Arguments to update or create a Agency.
     * @example
     * // Update or create a Agency
     * const agency = await prisma.agency.upsert({
     *   create: {
     *     // ... data to create a Agency
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Agency we want to update
     *   }
     * })
     */
    upsert<T extends AgencyUpsertArgs>(args: SelectSubset<T, AgencyUpsertArgs<ExtArgs>>): Prisma__AgencyClient<$Result.GetResult<Prisma.$AgencyPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Agencies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgencyCountArgs} args - Arguments to filter Agencies to count.
     * @example
     * // Count the number of Agencies
     * const count = await prisma.agency.count({
     *   where: {
     *     // ... the filter for the Agencies we want to count
     *   }
     * })
    **/
    count<T extends AgencyCountArgs>(
      args?: Subset<T, AgencyCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AgencyCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Agency.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgencyAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AgencyAggregateArgs>(args: Subset<T, AgencyAggregateArgs>): Prisma.PrismaPromise<GetAgencyAggregateType<T>>

    /**
     * Group by Agency.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgencyGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AgencyGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AgencyGroupByArgs['orderBy'] }
        : { orderBy?: AgencyGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AgencyGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAgencyGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Agency model
   */
  readonly fields: AgencyFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Agency.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AgencyClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Agency model
   */ 
  interface AgencyFieldRefs {
    readonly id: FieldRef<"Agency", 'Int'>
    readonly name: FieldRef<"Agency", 'String'>
    readonly address: FieldRef<"Agency", 'String'>
    readonly contactNo: FieldRef<"Agency", 'String'>
    readonly logoBase64: FieldRef<"Agency", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Agency findUnique
   */
  export type AgencyFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agency
     */
    select?: AgencySelect<ExtArgs> | null
    /**
     * Filter, which Agency to fetch.
     */
    where: AgencyWhereUniqueInput
  }

  /**
   * Agency findUniqueOrThrow
   */
  export type AgencyFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agency
     */
    select?: AgencySelect<ExtArgs> | null
    /**
     * Filter, which Agency to fetch.
     */
    where: AgencyWhereUniqueInput
  }

  /**
   * Agency findFirst
   */
  export type AgencyFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agency
     */
    select?: AgencySelect<ExtArgs> | null
    /**
     * Filter, which Agency to fetch.
     */
    where?: AgencyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Agencies to fetch.
     */
    orderBy?: AgencyOrderByWithRelationInput | AgencyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Agencies.
     */
    cursor?: AgencyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Agencies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Agencies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Agencies.
     */
    distinct?: AgencyScalarFieldEnum | AgencyScalarFieldEnum[]
  }

  /**
   * Agency findFirstOrThrow
   */
  export type AgencyFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agency
     */
    select?: AgencySelect<ExtArgs> | null
    /**
     * Filter, which Agency to fetch.
     */
    where?: AgencyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Agencies to fetch.
     */
    orderBy?: AgencyOrderByWithRelationInput | AgencyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Agencies.
     */
    cursor?: AgencyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Agencies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Agencies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Agencies.
     */
    distinct?: AgencyScalarFieldEnum | AgencyScalarFieldEnum[]
  }

  /**
   * Agency findMany
   */
  export type AgencyFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agency
     */
    select?: AgencySelect<ExtArgs> | null
    /**
     * Filter, which Agencies to fetch.
     */
    where?: AgencyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Agencies to fetch.
     */
    orderBy?: AgencyOrderByWithRelationInput | AgencyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Agencies.
     */
    cursor?: AgencyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Agencies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Agencies.
     */
    skip?: number
    distinct?: AgencyScalarFieldEnum | AgencyScalarFieldEnum[]
  }

  /**
   * Agency create
   */
  export type AgencyCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agency
     */
    select?: AgencySelect<ExtArgs> | null
    /**
     * The data needed to create a Agency.
     */
    data: XOR<AgencyCreateInput, AgencyUncheckedCreateInput>
  }

  /**
   * Agency createMany
   */
  export type AgencyCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Agencies.
     */
    data: AgencyCreateManyInput | AgencyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Agency update
   */
  export type AgencyUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agency
     */
    select?: AgencySelect<ExtArgs> | null
    /**
     * The data needed to update a Agency.
     */
    data: XOR<AgencyUpdateInput, AgencyUncheckedUpdateInput>
    /**
     * Choose, which Agency to update.
     */
    where: AgencyWhereUniqueInput
  }

  /**
   * Agency updateMany
   */
  export type AgencyUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Agencies.
     */
    data: XOR<AgencyUpdateManyMutationInput, AgencyUncheckedUpdateManyInput>
    /**
     * Filter which Agencies to update
     */
    where?: AgencyWhereInput
  }

  /**
   * Agency upsert
   */
  export type AgencyUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agency
     */
    select?: AgencySelect<ExtArgs> | null
    /**
     * The filter to search for the Agency to update in case it exists.
     */
    where: AgencyWhereUniqueInput
    /**
     * In case the Agency found by the `where` argument doesn't exist, create a new Agency with this data.
     */
    create: XOR<AgencyCreateInput, AgencyUncheckedCreateInput>
    /**
     * In case the Agency was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AgencyUpdateInput, AgencyUncheckedUpdateInput>
  }

  /**
   * Agency delete
   */
  export type AgencyDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agency
     */
    select?: AgencySelect<ExtArgs> | null
    /**
     * Filter which Agency to delete.
     */
    where: AgencyWhereUniqueInput
  }

  /**
   * Agency deleteMany
   */
  export type AgencyDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Agencies to delete
     */
    where?: AgencyWhereInput
  }

  /**
   * Agency without action
   */
  export type AgencyDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Agency
     */
    select?: AgencySelect<ExtArgs> | null
  }


  /**
   * Model Department
   */

  export type AggregateDepartment = {
    _count: DepartmentCountAggregateOutputType | null
    _avg: DepartmentAvgAggregateOutputType | null
    _sum: DepartmentSumAggregateOutputType | null
    _min: DepartmentMinAggregateOutputType | null
    _max: DepartmentMaxAggregateOutputType | null
  }

  export type DepartmentAvgAggregateOutputType = {
    id: number | null
  }

  export type DepartmentSumAggregateOutputType = {
    id: number | null
  }

  export type DepartmentMinAggregateOutputType = {
    id: number | null
    name: string | null
  }

  export type DepartmentMaxAggregateOutputType = {
    id: number | null
    name: string | null
  }

  export type DepartmentCountAggregateOutputType = {
    id: number
    name: number
    _all: number
  }


  export type DepartmentAvgAggregateInputType = {
    id?: true
  }

  export type DepartmentSumAggregateInputType = {
    id?: true
  }

  export type DepartmentMinAggregateInputType = {
    id?: true
    name?: true
  }

  export type DepartmentMaxAggregateInputType = {
    id?: true
    name?: true
  }

  export type DepartmentCountAggregateInputType = {
    id?: true
    name?: true
    _all?: true
  }

  export type DepartmentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Department to aggregate.
     */
    where?: DepartmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Departments to fetch.
     */
    orderBy?: DepartmentOrderByWithRelationInput | DepartmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DepartmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Departments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Departments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Departments
    **/
    _count?: true | DepartmentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DepartmentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DepartmentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DepartmentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DepartmentMaxAggregateInputType
  }

  export type GetDepartmentAggregateType<T extends DepartmentAggregateArgs> = {
        [P in keyof T & keyof AggregateDepartment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDepartment[P]>
      : GetScalarType<T[P], AggregateDepartment[P]>
  }




  export type DepartmentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DepartmentWhereInput
    orderBy?: DepartmentOrderByWithAggregationInput | DepartmentOrderByWithAggregationInput[]
    by: DepartmentScalarFieldEnum[] | DepartmentScalarFieldEnum
    having?: DepartmentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DepartmentCountAggregateInputType | true
    _avg?: DepartmentAvgAggregateInputType
    _sum?: DepartmentSumAggregateInputType
    _min?: DepartmentMinAggregateInputType
    _max?: DepartmentMaxAggregateInputType
  }

  export type DepartmentGroupByOutputType = {
    id: number
    name: string
    _count: DepartmentCountAggregateOutputType | null
    _avg: DepartmentAvgAggregateOutputType | null
    _sum: DepartmentSumAggregateOutputType | null
    _min: DepartmentMinAggregateOutputType | null
    _max: DepartmentMaxAggregateOutputType | null
  }

  type GetDepartmentGroupByPayload<T extends DepartmentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DepartmentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DepartmentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DepartmentGroupByOutputType[P]>
            : GetScalarType<T[P], DepartmentGroupByOutputType[P]>
        }
      >
    >


  export type DepartmentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    employees?: boolean | Department$employeesArgs<ExtArgs>
    _count?: boolean | DepartmentCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["department"]>


  export type DepartmentSelectScalar = {
    id?: boolean
    name?: boolean
  }

  export type DepartmentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    employees?: boolean | Department$employeesArgs<ExtArgs>
    _count?: boolean | DepartmentCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $DepartmentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Department"
    objects: {
      employees: Prisma.$EmployeePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
    }, ExtArgs["result"]["department"]>
    composites: {}
  }

  type DepartmentGetPayload<S extends boolean | null | undefined | DepartmentDefaultArgs> = $Result.GetResult<Prisma.$DepartmentPayload, S>

  type DepartmentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<DepartmentFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: DepartmentCountAggregateInputType | true
    }

  export interface DepartmentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Department'], meta: { name: 'Department' } }
    /**
     * Find zero or one Department that matches the filter.
     * @param {DepartmentFindUniqueArgs} args - Arguments to find a Department
     * @example
     * // Get one Department
     * const department = await prisma.department.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DepartmentFindUniqueArgs>(args: SelectSubset<T, DepartmentFindUniqueArgs<ExtArgs>>): Prisma__DepartmentClient<$Result.GetResult<Prisma.$DepartmentPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Department that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {DepartmentFindUniqueOrThrowArgs} args - Arguments to find a Department
     * @example
     * // Get one Department
     * const department = await prisma.department.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DepartmentFindUniqueOrThrowArgs>(args: SelectSubset<T, DepartmentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DepartmentClient<$Result.GetResult<Prisma.$DepartmentPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Department that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepartmentFindFirstArgs} args - Arguments to find a Department
     * @example
     * // Get one Department
     * const department = await prisma.department.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DepartmentFindFirstArgs>(args?: SelectSubset<T, DepartmentFindFirstArgs<ExtArgs>>): Prisma__DepartmentClient<$Result.GetResult<Prisma.$DepartmentPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Department that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepartmentFindFirstOrThrowArgs} args - Arguments to find a Department
     * @example
     * // Get one Department
     * const department = await prisma.department.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DepartmentFindFirstOrThrowArgs>(args?: SelectSubset<T, DepartmentFindFirstOrThrowArgs<ExtArgs>>): Prisma__DepartmentClient<$Result.GetResult<Prisma.$DepartmentPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Departments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepartmentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Departments
     * const departments = await prisma.department.findMany()
     * 
     * // Get first 10 Departments
     * const departments = await prisma.department.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const departmentWithIdOnly = await prisma.department.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DepartmentFindManyArgs>(args?: SelectSubset<T, DepartmentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DepartmentPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Department.
     * @param {DepartmentCreateArgs} args - Arguments to create a Department.
     * @example
     * // Create one Department
     * const Department = await prisma.department.create({
     *   data: {
     *     // ... data to create a Department
     *   }
     * })
     * 
     */
    create<T extends DepartmentCreateArgs>(args: SelectSubset<T, DepartmentCreateArgs<ExtArgs>>): Prisma__DepartmentClient<$Result.GetResult<Prisma.$DepartmentPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Departments.
     * @param {DepartmentCreateManyArgs} args - Arguments to create many Departments.
     * @example
     * // Create many Departments
     * const department = await prisma.department.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DepartmentCreateManyArgs>(args?: SelectSubset<T, DepartmentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Department.
     * @param {DepartmentDeleteArgs} args - Arguments to delete one Department.
     * @example
     * // Delete one Department
     * const Department = await prisma.department.delete({
     *   where: {
     *     // ... filter to delete one Department
     *   }
     * })
     * 
     */
    delete<T extends DepartmentDeleteArgs>(args: SelectSubset<T, DepartmentDeleteArgs<ExtArgs>>): Prisma__DepartmentClient<$Result.GetResult<Prisma.$DepartmentPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Department.
     * @param {DepartmentUpdateArgs} args - Arguments to update one Department.
     * @example
     * // Update one Department
     * const department = await prisma.department.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DepartmentUpdateArgs>(args: SelectSubset<T, DepartmentUpdateArgs<ExtArgs>>): Prisma__DepartmentClient<$Result.GetResult<Prisma.$DepartmentPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Departments.
     * @param {DepartmentDeleteManyArgs} args - Arguments to filter Departments to delete.
     * @example
     * // Delete a few Departments
     * const { count } = await prisma.department.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DepartmentDeleteManyArgs>(args?: SelectSubset<T, DepartmentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Departments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepartmentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Departments
     * const department = await prisma.department.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DepartmentUpdateManyArgs>(args: SelectSubset<T, DepartmentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Department.
     * @param {DepartmentUpsertArgs} args - Arguments to update or create a Department.
     * @example
     * // Update or create a Department
     * const department = await prisma.department.upsert({
     *   create: {
     *     // ... data to create a Department
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Department we want to update
     *   }
     * })
     */
    upsert<T extends DepartmentUpsertArgs>(args: SelectSubset<T, DepartmentUpsertArgs<ExtArgs>>): Prisma__DepartmentClient<$Result.GetResult<Prisma.$DepartmentPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Departments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepartmentCountArgs} args - Arguments to filter Departments to count.
     * @example
     * // Count the number of Departments
     * const count = await prisma.department.count({
     *   where: {
     *     // ... the filter for the Departments we want to count
     *   }
     * })
    **/
    count<T extends DepartmentCountArgs>(
      args?: Subset<T, DepartmentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DepartmentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Department.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepartmentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DepartmentAggregateArgs>(args: Subset<T, DepartmentAggregateArgs>): Prisma.PrismaPromise<GetDepartmentAggregateType<T>>

    /**
     * Group by Department.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepartmentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DepartmentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DepartmentGroupByArgs['orderBy'] }
        : { orderBy?: DepartmentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DepartmentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDepartmentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Department model
   */
  readonly fields: DepartmentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Department.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DepartmentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    employees<T extends Department$employeesArgs<ExtArgs> = {}>(args?: Subset<T, Department$employeesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Department model
   */ 
  interface DepartmentFieldRefs {
    readonly id: FieldRef<"Department", 'Int'>
    readonly name: FieldRef<"Department", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Department findUnique
   */
  export type DepartmentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Department
     */
    select?: DepartmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DepartmentInclude<ExtArgs> | null
    /**
     * Filter, which Department to fetch.
     */
    where: DepartmentWhereUniqueInput
  }

  /**
   * Department findUniqueOrThrow
   */
  export type DepartmentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Department
     */
    select?: DepartmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DepartmentInclude<ExtArgs> | null
    /**
     * Filter, which Department to fetch.
     */
    where: DepartmentWhereUniqueInput
  }

  /**
   * Department findFirst
   */
  export type DepartmentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Department
     */
    select?: DepartmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DepartmentInclude<ExtArgs> | null
    /**
     * Filter, which Department to fetch.
     */
    where?: DepartmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Departments to fetch.
     */
    orderBy?: DepartmentOrderByWithRelationInput | DepartmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Departments.
     */
    cursor?: DepartmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Departments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Departments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Departments.
     */
    distinct?: DepartmentScalarFieldEnum | DepartmentScalarFieldEnum[]
  }

  /**
   * Department findFirstOrThrow
   */
  export type DepartmentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Department
     */
    select?: DepartmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DepartmentInclude<ExtArgs> | null
    /**
     * Filter, which Department to fetch.
     */
    where?: DepartmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Departments to fetch.
     */
    orderBy?: DepartmentOrderByWithRelationInput | DepartmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Departments.
     */
    cursor?: DepartmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Departments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Departments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Departments.
     */
    distinct?: DepartmentScalarFieldEnum | DepartmentScalarFieldEnum[]
  }

  /**
   * Department findMany
   */
  export type DepartmentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Department
     */
    select?: DepartmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DepartmentInclude<ExtArgs> | null
    /**
     * Filter, which Departments to fetch.
     */
    where?: DepartmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Departments to fetch.
     */
    orderBy?: DepartmentOrderByWithRelationInput | DepartmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Departments.
     */
    cursor?: DepartmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Departments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Departments.
     */
    skip?: number
    distinct?: DepartmentScalarFieldEnum | DepartmentScalarFieldEnum[]
  }

  /**
   * Department create
   */
  export type DepartmentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Department
     */
    select?: DepartmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DepartmentInclude<ExtArgs> | null
    /**
     * The data needed to create a Department.
     */
    data: XOR<DepartmentCreateInput, DepartmentUncheckedCreateInput>
  }

  /**
   * Department createMany
   */
  export type DepartmentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Departments.
     */
    data: DepartmentCreateManyInput | DepartmentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Department update
   */
  export type DepartmentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Department
     */
    select?: DepartmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DepartmentInclude<ExtArgs> | null
    /**
     * The data needed to update a Department.
     */
    data: XOR<DepartmentUpdateInput, DepartmentUncheckedUpdateInput>
    /**
     * Choose, which Department to update.
     */
    where: DepartmentWhereUniqueInput
  }

  /**
   * Department updateMany
   */
  export type DepartmentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Departments.
     */
    data: XOR<DepartmentUpdateManyMutationInput, DepartmentUncheckedUpdateManyInput>
    /**
     * Filter which Departments to update
     */
    where?: DepartmentWhereInput
  }

  /**
   * Department upsert
   */
  export type DepartmentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Department
     */
    select?: DepartmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DepartmentInclude<ExtArgs> | null
    /**
     * The filter to search for the Department to update in case it exists.
     */
    where: DepartmentWhereUniqueInput
    /**
     * In case the Department found by the `where` argument doesn't exist, create a new Department with this data.
     */
    create: XOR<DepartmentCreateInput, DepartmentUncheckedCreateInput>
    /**
     * In case the Department was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DepartmentUpdateInput, DepartmentUncheckedUpdateInput>
  }

  /**
   * Department delete
   */
  export type DepartmentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Department
     */
    select?: DepartmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DepartmentInclude<ExtArgs> | null
    /**
     * Filter which Department to delete.
     */
    where: DepartmentWhereUniqueInput
  }

  /**
   * Department deleteMany
   */
  export type DepartmentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Departments to delete
     */
    where?: DepartmentWhereInput
  }

  /**
   * Department.employees
   */
  export type Department$employeesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Employee
     */
    select?: EmployeeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmployeeInclude<ExtArgs> | null
    where?: EmployeeWhereInput
    orderBy?: EmployeeOrderByWithRelationInput | EmployeeOrderByWithRelationInput[]
    cursor?: EmployeeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EmployeeScalarFieldEnum | EmployeeScalarFieldEnum[]
  }

  /**
   * Department without action
   */
  export type DepartmentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Department
     */
    select?: DepartmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DepartmentInclude<ExtArgs> | null
  }


  /**
   * Model Position
   */

  export type AggregatePosition = {
    _count: PositionCountAggregateOutputType | null
    _avg: PositionAvgAggregateOutputType | null
    _sum: PositionSumAggregateOutputType | null
    _min: PositionMinAggregateOutputType | null
    _max: PositionMaxAggregateOutputType | null
  }

  export type PositionAvgAggregateOutputType = {
    id: number | null
  }

  export type PositionSumAggregateOutputType = {
    id: number | null
  }

  export type PositionMinAggregateOutputType = {
    id: number | null
    title: string | null
  }

  export type PositionMaxAggregateOutputType = {
    id: number | null
    title: string | null
  }

  export type PositionCountAggregateOutputType = {
    id: number
    title: number
    _all: number
  }


  export type PositionAvgAggregateInputType = {
    id?: true
  }

  export type PositionSumAggregateInputType = {
    id?: true
  }

  export type PositionMinAggregateInputType = {
    id?: true
    title?: true
  }

  export type PositionMaxAggregateInputType = {
    id?: true
    title?: true
  }

  export type PositionCountAggregateInputType = {
    id?: true
    title?: true
    _all?: true
  }

  export type PositionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Position to aggregate.
     */
    where?: PositionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Positions to fetch.
     */
    orderBy?: PositionOrderByWithRelationInput | PositionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PositionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Positions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Positions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Positions
    **/
    _count?: true | PositionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PositionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PositionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PositionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PositionMaxAggregateInputType
  }

  export type GetPositionAggregateType<T extends PositionAggregateArgs> = {
        [P in keyof T & keyof AggregatePosition]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePosition[P]>
      : GetScalarType<T[P], AggregatePosition[P]>
  }




  export type PositionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PositionWhereInput
    orderBy?: PositionOrderByWithAggregationInput | PositionOrderByWithAggregationInput[]
    by: PositionScalarFieldEnum[] | PositionScalarFieldEnum
    having?: PositionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PositionCountAggregateInputType | true
    _avg?: PositionAvgAggregateInputType
    _sum?: PositionSumAggregateInputType
    _min?: PositionMinAggregateInputType
    _max?: PositionMaxAggregateInputType
  }

  export type PositionGroupByOutputType = {
    id: number
    title: string
    _count: PositionCountAggregateOutputType | null
    _avg: PositionAvgAggregateOutputType | null
    _sum: PositionSumAggregateOutputType | null
    _min: PositionMinAggregateOutputType | null
    _max: PositionMaxAggregateOutputType | null
  }

  type GetPositionGroupByPayload<T extends PositionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PositionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PositionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PositionGroupByOutputType[P]>
            : GetScalarType<T[P], PositionGroupByOutputType[P]>
        }
      >
    >


  export type PositionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    employees?: boolean | Position$employeesArgs<ExtArgs>
    _count?: boolean | PositionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["position"]>


  export type PositionSelectScalar = {
    id?: boolean
    title?: boolean
  }

  export type PositionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    employees?: boolean | Position$employeesArgs<ExtArgs>
    _count?: boolean | PositionCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $PositionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Position"
    objects: {
      employees: Prisma.$EmployeePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      title: string
    }, ExtArgs["result"]["position"]>
    composites: {}
  }

  type PositionGetPayload<S extends boolean | null | undefined | PositionDefaultArgs> = $Result.GetResult<Prisma.$PositionPayload, S>

  type PositionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PositionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PositionCountAggregateInputType | true
    }

  export interface PositionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Position'], meta: { name: 'Position' } }
    /**
     * Find zero or one Position that matches the filter.
     * @param {PositionFindUniqueArgs} args - Arguments to find a Position
     * @example
     * // Get one Position
     * const position = await prisma.position.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PositionFindUniqueArgs>(args: SelectSubset<T, PositionFindUniqueArgs<ExtArgs>>): Prisma__PositionClient<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Position that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PositionFindUniqueOrThrowArgs} args - Arguments to find a Position
     * @example
     * // Get one Position
     * const position = await prisma.position.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PositionFindUniqueOrThrowArgs>(args: SelectSubset<T, PositionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PositionClient<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Position that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PositionFindFirstArgs} args - Arguments to find a Position
     * @example
     * // Get one Position
     * const position = await prisma.position.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PositionFindFirstArgs>(args?: SelectSubset<T, PositionFindFirstArgs<ExtArgs>>): Prisma__PositionClient<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Position that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PositionFindFirstOrThrowArgs} args - Arguments to find a Position
     * @example
     * // Get one Position
     * const position = await prisma.position.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PositionFindFirstOrThrowArgs>(args?: SelectSubset<T, PositionFindFirstOrThrowArgs<ExtArgs>>): Prisma__PositionClient<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Positions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PositionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Positions
     * const positions = await prisma.position.findMany()
     * 
     * // Get first 10 Positions
     * const positions = await prisma.position.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const positionWithIdOnly = await prisma.position.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PositionFindManyArgs>(args?: SelectSubset<T, PositionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Position.
     * @param {PositionCreateArgs} args - Arguments to create a Position.
     * @example
     * // Create one Position
     * const Position = await prisma.position.create({
     *   data: {
     *     // ... data to create a Position
     *   }
     * })
     * 
     */
    create<T extends PositionCreateArgs>(args: SelectSubset<T, PositionCreateArgs<ExtArgs>>): Prisma__PositionClient<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Positions.
     * @param {PositionCreateManyArgs} args - Arguments to create many Positions.
     * @example
     * // Create many Positions
     * const position = await prisma.position.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PositionCreateManyArgs>(args?: SelectSubset<T, PositionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Position.
     * @param {PositionDeleteArgs} args - Arguments to delete one Position.
     * @example
     * // Delete one Position
     * const Position = await prisma.position.delete({
     *   where: {
     *     // ... filter to delete one Position
     *   }
     * })
     * 
     */
    delete<T extends PositionDeleteArgs>(args: SelectSubset<T, PositionDeleteArgs<ExtArgs>>): Prisma__PositionClient<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Position.
     * @param {PositionUpdateArgs} args - Arguments to update one Position.
     * @example
     * // Update one Position
     * const position = await prisma.position.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PositionUpdateArgs>(args: SelectSubset<T, PositionUpdateArgs<ExtArgs>>): Prisma__PositionClient<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Positions.
     * @param {PositionDeleteManyArgs} args - Arguments to filter Positions to delete.
     * @example
     * // Delete a few Positions
     * const { count } = await prisma.position.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PositionDeleteManyArgs>(args?: SelectSubset<T, PositionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Positions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PositionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Positions
     * const position = await prisma.position.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PositionUpdateManyArgs>(args: SelectSubset<T, PositionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Position.
     * @param {PositionUpsertArgs} args - Arguments to update or create a Position.
     * @example
     * // Update or create a Position
     * const position = await prisma.position.upsert({
     *   create: {
     *     // ... data to create a Position
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Position we want to update
     *   }
     * })
     */
    upsert<T extends PositionUpsertArgs>(args: SelectSubset<T, PositionUpsertArgs<ExtArgs>>): Prisma__PositionClient<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Positions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PositionCountArgs} args - Arguments to filter Positions to count.
     * @example
     * // Count the number of Positions
     * const count = await prisma.position.count({
     *   where: {
     *     // ... the filter for the Positions we want to count
     *   }
     * })
    **/
    count<T extends PositionCountArgs>(
      args?: Subset<T, PositionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PositionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Position.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PositionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PositionAggregateArgs>(args: Subset<T, PositionAggregateArgs>): Prisma.PrismaPromise<GetPositionAggregateType<T>>

    /**
     * Group by Position.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PositionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PositionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PositionGroupByArgs['orderBy'] }
        : { orderBy?: PositionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PositionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPositionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Position model
   */
  readonly fields: PositionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Position.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PositionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    employees<T extends Position$employeesArgs<ExtArgs> = {}>(args?: Subset<T, Position$employeesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Position model
   */ 
  interface PositionFieldRefs {
    readonly id: FieldRef<"Position", 'Int'>
    readonly title: FieldRef<"Position", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Position findUnique
   */
  export type PositionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PositionInclude<ExtArgs> | null
    /**
     * Filter, which Position to fetch.
     */
    where: PositionWhereUniqueInput
  }

  /**
   * Position findUniqueOrThrow
   */
  export type PositionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PositionInclude<ExtArgs> | null
    /**
     * Filter, which Position to fetch.
     */
    where: PositionWhereUniqueInput
  }

  /**
   * Position findFirst
   */
  export type PositionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PositionInclude<ExtArgs> | null
    /**
     * Filter, which Position to fetch.
     */
    where?: PositionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Positions to fetch.
     */
    orderBy?: PositionOrderByWithRelationInput | PositionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Positions.
     */
    cursor?: PositionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Positions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Positions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Positions.
     */
    distinct?: PositionScalarFieldEnum | PositionScalarFieldEnum[]
  }

  /**
   * Position findFirstOrThrow
   */
  export type PositionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PositionInclude<ExtArgs> | null
    /**
     * Filter, which Position to fetch.
     */
    where?: PositionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Positions to fetch.
     */
    orderBy?: PositionOrderByWithRelationInput | PositionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Positions.
     */
    cursor?: PositionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Positions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Positions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Positions.
     */
    distinct?: PositionScalarFieldEnum | PositionScalarFieldEnum[]
  }

  /**
   * Position findMany
   */
  export type PositionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PositionInclude<ExtArgs> | null
    /**
     * Filter, which Positions to fetch.
     */
    where?: PositionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Positions to fetch.
     */
    orderBy?: PositionOrderByWithRelationInput | PositionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Positions.
     */
    cursor?: PositionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Positions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Positions.
     */
    skip?: number
    distinct?: PositionScalarFieldEnum | PositionScalarFieldEnum[]
  }

  /**
   * Position create
   */
  export type PositionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PositionInclude<ExtArgs> | null
    /**
     * The data needed to create a Position.
     */
    data: XOR<PositionCreateInput, PositionUncheckedCreateInput>
  }

  /**
   * Position createMany
   */
  export type PositionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Positions.
     */
    data: PositionCreateManyInput | PositionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Position update
   */
  export type PositionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PositionInclude<ExtArgs> | null
    /**
     * The data needed to update a Position.
     */
    data: XOR<PositionUpdateInput, PositionUncheckedUpdateInput>
    /**
     * Choose, which Position to update.
     */
    where: PositionWhereUniqueInput
  }

  /**
   * Position updateMany
   */
  export type PositionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Positions.
     */
    data: XOR<PositionUpdateManyMutationInput, PositionUncheckedUpdateManyInput>
    /**
     * Filter which Positions to update
     */
    where?: PositionWhereInput
  }

  /**
   * Position upsert
   */
  export type PositionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PositionInclude<ExtArgs> | null
    /**
     * The filter to search for the Position to update in case it exists.
     */
    where: PositionWhereUniqueInput
    /**
     * In case the Position found by the `where` argument doesn't exist, create a new Position with this data.
     */
    create: XOR<PositionCreateInput, PositionUncheckedCreateInput>
    /**
     * In case the Position was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PositionUpdateInput, PositionUncheckedUpdateInput>
  }

  /**
   * Position delete
   */
  export type PositionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PositionInclude<ExtArgs> | null
    /**
     * Filter which Position to delete.
     */
    where: PositionWhereUniqueInput
  }

  /**
   * Position deleteMany
   */
  export type PositionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Positions to delete
     */
    where?: PositionWhereInput
  }

  /**
   * Position.employees
   */
  export type Position$employeesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Employee
     */
    select?: EmployeeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmployeeInclude<ExtArgs> | null
    where?: EmployeeWhereInput
    orderBy?: EmployeeOrderByWithRelationInput | EmployeeOrderByWithRelationInput[]
    cursor?: EmployeeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EmployeeScalarFieldEnum | EmployeeScalarFieldEnum[]
  }

  /**
   * Position without action
   */
  export type PositionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Position
     */
    select?: PositionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PositionInclude<ExtArgs> | null
  }


  /**
   * Model SalaryGrade
   */

  export type AggregateSalaryGrade = {
    _count: SalaryGradeCountAggregateOutputType | null
    _avg: SalaryGradeAvgAggregateOutputType | null
    _sum: SalaryGradeSumAggregateOutputType | null
    _min: SalaryGradeMinAggregateOutputType | null
    _max: SalaryGradeMaxAggregateOutputType | null
  }

  export type SalaryGradeAvgAggregateOutputType = {
    id: number | null
    grade: number | null
    step: number | null
    amount: number | null
  }

  export type SalaryGradeSumAggregateOutputType = {
    id: number | null
    grade: number | null
    step: number | null
    amount: number | null
  }

  export type SalaryGradeMinAggregateOutputType = {
    id: number | null
    grade: number | null
    step: number | null
    amount: number | null
  }

  export type SalaryGradeMaxAggregateOutputType = {
    id: number | null
    grade: number | null
    step: number | null
    amount: number | null
  }

  export type SalaryGradeCountAggregateOutputType = {
    id: number
    grade: number
    step: number
    amount: number
    _all: number
  }


  export type SalaryGradeAvgAggregateInputType = {
    id?: true
    grade?: true
    step?: true
    amount?: true
  }

  export type SalaryGradeSumAggregateInputType = {
    id?: true
    grade?: true
    step?: true
    amount?: true
  }

  export type SalaryGradeMinAggregateInputType = {
    id?: true
    grade?: true
    step?: true
    amount?: true
  }

  export type SalaryGradeMaxAggregateInputType = {
    id?: true
    grade?: true
    step?: true
    amount?: true
  }

  export type SalaryGradeCountAggregateInputType = {
    id?: true
    grade?: true
    step?: true
    amount?: true
    _all?: true
  }

  export type SalaryGradeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalaryGrade to aggregate.
     */
    where?: SalaryGradeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalaryGrades to fetch.
     */
    orderBy?: SalaryGradeOrderByWithRelationInput | SalaryGradeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SalaryGradeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalaryGrades from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalaryGrades.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SalaryGrades
    **/
    _count?: true | SalaryGradeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SalaryGradeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SalaryGradeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SalaryGradeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SalaryGradeMaxAggregateInputType
  }

  export type GetSalaryGradeAggregateType<T extends SalaryGradeAggregateArgs> = {
        [P in keyof T & keyof AggregateSalaryGrade]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSalaryGrade[P]>
      : GetScalarType<T[P], AggregateSalaryGrade[P]>
  }




  export type SalaryGradeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalaryGradeWhereInput
    orderBy?: SalaryGradeOrderByWithAggregationInput | SalaryGradeOrderByWithAggregationInput[]
    by: SalaryGradeScalarFieldEnum[] | SalaryGradeScalarFieldEnum
    having?: SalaryGradeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SalaryGradeCountAggregateInputType | true
    _avg?: SalaryGradeAvgAggregateInputType
    _sum?: SalaryGradeSumAggregateInputType
    _min?: SalaryGradeMinAggregateInputType
    _max?: SalaryGradeMaxAggregateInputType
  }

  export type SalaryGradeGroupByOutputType = {
    id: number
    grade: number
    step: number
    amount: number
    _count: SalaryGradeCountAggregateOutputType | null
    _avg: SalaryGradeAvgAggregateOutputType | null
    _sum: SalaryGradeSumAggregateOutputType | null
    _min: SalaryGradeMinAggregateOutputType | null
    _max: SalaryGradeMaxAggregateOutputType | null
  }

  type GetSalaryGradeGroupByPayload<T extends SalaryGradeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SalaryGradeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SalaryGradeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SalaryGradeGroupByOutputType[P]>
            : GetScalarType<T[P], SalaryGradeGroupByOutputType[P]>
        }
      >
    >


  export type SalaryGradeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    grade?: boolean
    step?: boolean
    amount?: boolean
  }, ExtArgs["result"]["salaryGrade"]>


  export type SalaryGradeSelectScalar = {
    id?: boolean
    grade?: boolean
    step?: boolean
    amount?: boolean
  }


  export type $SalaryGradePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SalaryGrade"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      grade: number
      step: number
      amount: number
    }, ExtArgs["result"]["salaryGrade"]>
    composites: {}
  }

  type SalaryGradeGetPayload<S extends boolean | null | undefined | SalaryGradeDefaultArgs> = $Result.GetResult<Prisma.$SalaryGradePayload, S>

  type SalaryGradeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SalaryGradeFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SalaryGradeCountAggregateInputType | true
    }

  export interface SalaryGradeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SalaryGrade'], meta: { name: 'SalaryGrade' } }
    /**
     * Find zero or one SalaryGrade that matches the filter.
     * @param {SalaryGradeFindUniqueArgs} args - Arguments to find a SalaryGrade
     * @example
     * // Get one SalaryGrade
     * const salaryGrade = await prisma.salaryGrade.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SalaryGradeFindUniqueArgs>(args: SelectSubset<T, SalaryGradeFindUniqueArgs<ExtArgs>>): Prisma__SalaryGradeClient<$Result.GetResult<Prisma.$SalaryGradePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one SalaryGrade that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SalaryGradeFindUniqueOrThrowArgs} args - Arguments to find a SalaryGrade
     * @example
     * // Get one SalaryGrade
     * const salaryGrade = await prisma.salaryGrade.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SalaryGradeFindUniqueOrThrowArgs>(args: SelectSubset<T, SalaryGradeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SalaryGradeClient<$Result.GetResult<Prisma.$SalaryGradePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first SalaryGrade that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalaryGradeFindFirstArgs} args - Arguments to find a SalaryGrade
     * @example
     * // Get one SalaryGrade
     * const salaryGrade = await prisma.salaryGrade.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SalaryGradeFindFirstArgs>(args?: SelectSubset<T, SalaryGradeFindFirstArgs<ExtArgs>>): Prisma__SalaryGradeClient<$Result.GetResult<Prisma.$SalaryGradePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first SalaryGrade that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalaryGradeFindFirstOrThrowArgs} args - Arguments to find a SalaryGrade
     * @example
     * // Get one SalaryGrade
     * const salaryGrade = await prisma.salaryGrade.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SalaryGradeFindFirstOrThrowArgs>(args?: SelectSubset<T, SalaryGradeFindFirstOrThrowArgs<ExtArgs>>): Prisma__SalaryGradeClient<$Result.GetResult<Prisma.$SalaryGradePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more SalaryGrades that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalaryGradeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SalaryGrades
     * const salaryGrades = await prisma.salaryGrade.findMany()
     * 
     * // Get first 10 SalaryGrades
     * const salaryGrades = await prisma.salaryGrade.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const salaryGradeWithIdOnly = await prisma.salaryGrade.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SalaryGradeFindManyArgs>(args?: SelectSubset<T, SalaryGradeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalaryGradePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a SalaryGrade.
     * @param {SalaryGradeCreateArgs} args - Arguments to create a SalaryGrade.
     * @example
     * // Create one SalaryGrade
     * const SalaryGrade = await prisma.salaryGrade.create({
     *   data: {
     *     // ... data to create a SalaryGrade
     *   }
     * })
     * 
     */
    create<T extends SalaryGradeCreateArgs>(args: SelectSubset<T, SalaryGradeCreateArgs<ExtArgs>>): Prisma__SalaryGradeClient<$Result.GetResult<Prisma.$SalaryGradePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many SalaryGrades.
     * @param {SalaryGradeCreateManyArgs} args - Arguments to create many SalaryGrades.
     * @example
     * // Create many SalaryGrades
     * const salaryGrade = await prisma.salaryGrade.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SalaryGradeCreateManyArgs>(args?: SelectSubset<T, SalaryGradeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a SalaryGrade.
     * @param {SalaryGradeDeleteArgs} args - Arguments to delete one SalaryGrade.
     * @example
     * // Delete one SalaryGrade
     * const SalaryGrade = await prisma.salaryGrade.delete({
     *   where: {
     *     // ... filter to delete one SalaryGrade
     *   }
     * })
     * 
     */
    delete<T extends SalaryGradeDeleteArgs>(args: SelectSubset<T, SalaryGradeDeleteArgs<ExtArgs>>): Prisma__SalaryGradeClient<$Result.GetResult<Prisma.$SalaryGradePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one SalaryGrade.
     * @param {SalaryGradeUpdateArgs} args - Arguments to update one SalaryGrade.
     * @example
     * // Update one SalaryGrade
     * const salaryGrade = await prisma.salaryGrade.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SalaryGradeUpdateArgs>(args: SelectSubset<T, SalaryGradeUpdateArgs<ExtArgs>>): Prisma__SalaryGradeClient<$Result.GetResult<Prisma.$SalaryGradePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more SalaryGrades.
     * @param {SalaryGradeDeleteManyArgs} args - Arguments to filter SalaryGrades to delete.
     * @example
     * // Delete a few SalaryGrades
     * const { count } = await prisma.salaryGrade.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SalaryGradeDeleteManyArgs>(args?: SelectSubset<T, SalaryGradeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalaryGrades.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalaryGradeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SalaryGrades
     * const salaryGrade = await prisma.salaryGrade.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SalaryGradeUpdateManyArgs>(args: SelectSubset<T, SalaryGradeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one SalaryGrade.
     * @param {SalaryGradeUpsertArgs} args - Arguments to update or create a SalaryGrade.
     * @example
     * // Update or create a SalaryGrade
     * const salaryGrade = await prisma.salaryGrade.upsert({
     *   create: {
     *     // ... data to create a SalaryGrade
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SalaryGrade we want to update
     *   }
     * })
     */
    upsert<T extends SalaryGradeUpsertArgs>(args: SelectSubset<T, SalaryGradeUpsertArgs<ExtArgs>>): Prisma__SalaryGradeClient<$Result.GetResult<Prisma.$SalaryGradePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of SalaryGrades.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalaryGradeCountArgs} args - Arguments to filter SalaryGrades to count.
     * @example
     * // Count the number of SalaryGrades
     * const count = await prisma.salaryGrade.count({
     *   where: {
     *     // ... the filter for the SalaryGrades we want to count
     *   }
     * })
    **/
    count<T extends SalaryGradeCountArgs>(
      args?: Subset<T, SalaryGradeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SalaryGradeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SalaryGrade.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalaryGradeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SalaryGradeAggregateArgs>(args: Subset<T, SalaryGradeAggregateArgs>): Prisma.PrismaPromise<GetSalaryGradeAggregateType<T>>

    /**
     * Group by SalaryGrade.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalaryGradeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SalaryGradeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SalaryGradeGroupByArgs['orderBy'] }
        : { orderBy?: SalaryGradeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SalaryGradeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSalaryGradeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SalaryGrade model
   */
  readonly fields: SalaryGradeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SalaryGrade.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SalaryGradeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SalaryGrade model
   */ 
  interface SalaryGradeFieldRefs {
    readonly id: FieldRef<"SalaryGrade", 'Int'>
    readonly grade: FieldRef<"SalaryGrade", 'Int'>
    readonly step: FieldRef<"SalaryGrade", 'Int'>
    readonly amount: FieldRef<"SalaryGrade", 'Float'>
  }
    

  // Custom InputTypes
  /**
   * SalaryGrade findUnique
   */
  export type SalaryGradeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalaryGrade
     */
    select?: SalaryGradeSelect<ExtArgs> | null
    /**
     * Filter, which SalaryGrade to fetch.
     */
    where: SalaryGradeWhereUniqueInput
  }

  /**
   * SalaryGrade findUniqueOrThrow
   */
  export type SalaryGradeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalaryGrade
     */
    select?: SalaryGradeSelect<ExtArgs> | null
    /**
     * Filter, which SalaryGrade to fetch.
     */
    where: SalaryGradeWhereUniqueInput
  }

  /**
   * SalaryGrade findFirst
   */
  export type SalaryGradeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalaryGrade
     */
    select?: SalaryGradeSelect<ExtArgs> | null
    /**
     * Filter, which SalaryGrade to fetch.
     */
    where?: SalaryGradeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalaryGrades to fetch.
     */
    orderBy?: SalaryGradeOrderByWithRelationInput | SalaryGradeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalaryGrades.
     */
    cursor?: SalaryGradeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalaryGrades from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalaryGrades.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalaryGrades.
     */
    distinct?: SalaryGradeScalarFieldEnum | SalaryGradeScalarFieldEnum[]
  }

  /**
   * SalaryGrade findFirstOrThrow
   */
  export type SalaryGradeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalaryGrade
     */
    select?: SalaryGradeSelect<ExtArgs> | null
    /**
     * Filter, which SalaryGrade to fetch.
     */
    where?: SalaryGradeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalaryGrades to fetch.
     */
    orderBy?: SalaryGradeOrderByWithRelationInput | SalaryGradeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalaryGrades.
     */
    cursor?: SalaryGradeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalaryGrades from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalaryGrades.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalaryGrades.
     */
    distinct?: SalaryGradeScalarFieldEnum | SalaryGradeScalarFieldEnum[]
  }

  /**
   * SalaryGrade findMany
   */
  export type SalaryGradeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalaryGrade
     */
    select?: SalaryGradeSelect<ExtArgs> | null
    /**
     * Filter, which SalaryGrades to fetch.
     */
    where?: SalaryGradeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalaryGrades to fetch.
     */
    orderBy?: SalaryGradeOrderByWithRelationInput | SalaryGradeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SalaryGrades.
     */
    cursor?: SalaryGradeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalaryGrades from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalaryGrades.
     */
    skip?: number
    distinct?: SalaryGradeScalarFieldEnum | SalaryGradeScalarFieldEnum[]
  }

  /**
   * SalaryGrade create
   */
  export type SalaryGradeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalaryGrade
     */
    select?: SalaryGradeSelect<ExtArgs> | null
    /**
     * The data needed to create a SalaryGrade.
     */
    data: XOR<SalaryGradeCreateInput, SalaryGradeUncheckedCreateInput>
  }

  /**
   * SalaryGrade createMany
   */
  export type SalaryGradeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SalaryGrades.
     */
    data: SalaryGradeCreateManyInput | SalaryGradeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalaryGrade update
   */
  export type SalaryGradeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalaryGrade
     */
    select?: SalaryGradeSelect<ExtArgs> | null
    /**
     * The data needed to update a SalaryGrade.
     */
    data: XOR<SalaryGradeUpdateInput, SalaryGradeUncheckedUpdateInput>
    /**
     * Choose, which SalaryGrade to update.
     */
    where: SalaryGradeWhereUniqueInput
  }

  /**
   * SalaryGrade updateMany
   */
  export type SalaryGradeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SalaryGrades.
     */
    data: XOR<SalaryGradeUpdateManyMutationInput, SalaryGradeUncheckedUpdateManyInput>
    /**
     * Filter which SalaryGrades to update
     */
    where?: SalaryGradeWhereInput
  }

  /**
   * SalaryGrade upsert
   */
  export type SalaryGradeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalaryGrade
     */
    select?: SalaryGradeSelect<ExtArgs> | null
    /**
     * The filter to search for the SalaryGrade to update in case it exists.
     */
    where: SalaryGradeWhereUniqueInput
    /**
     * In case the SalaryGrade found by the `where` argument doesn't exist, create a new SalaryGrade with this data.
     */
    create: XOR<SalaryGradeCreateInput, SalaryGradeUncheckedCreateInput>
    /**
     * In case the SalaryGrade was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SalaryGradeUpdateInput, SalaryGradeUncheckedUpdateInput>
  }

  /**
   * SalaryGrade delete
   */
  export type SalaryGradeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalaryGrade
     */
    select?: SalaryGradeSelect<ExtArgs> | null
    /**
     * Filter which SalaryGrade to delete.
     */
    where: SalaryGradeWhereUniqueInput
  }

  /**
   * SalaryGrade deleteMany
   */
  export type SalaryGradeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalaryGrades to delete
     */
    where?: SalaryGradeWhereInput
  }

  /**
   * SalaryGrade without action
   */
  export type SalaryGradeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalaryGrade
     */
    select?: SalaryGradeSelect<ExtArgs> | null
  }


  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    id: number | null
  }

  export type UserSumAggregateOutputType = {
    id: number | null
  }

  export type UserMinAggregateOutputType = {
    id: number | null
    username: string | null
    password: string | null
    role: string | null
    name: string | null
  }

  export type UserMaxAggregateOutputType = {
    id: number | null
    username: string | null
    password: string | null
    role: string | null
    name: string | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    username: number
    password: number
    role: number
    name: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    id?: true
  }

  export type UserSumAggregateInputType = {
    id?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    username?: true
    password?: true
    role?: true
    name?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    username?: true
    password?: true
    role?: true
    name?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    username?: true
    password?: true
    role?: true
    name?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: number
    username: string
    password: string
    role: string
    name: string
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    password?: boolean
    role?: boolean
    name?: boolean
  }, ExtArgs["result"]["user"]>


  export type UserSelectScalar = {
    id?: boolean
    username?: boolean
    password?: boolean
    role?: boolean
    name?: boolean
  }


  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      username: string
      password: string
      role: string
      name: string
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */ 
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'Int'>
    readonly username: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
  }


  /**
   * Model Employee
   */

  export type AggregateEmployee = {
    _count: EmployeeCountAggregateOutputType | null
    _avg: EmployeeAvgAggregateOutputType | null
    _sum: EmployeeSumAggregateOutputType | null
    _min: EmployeeMinAggregateOutputType | null
    _max: EmployeeMaxAggregateOutputType | null
  }

  export type EmployeeAvgAggregateOutputType = {
    id: number | null
    height: number | null
    weight: number | null
    departmentId: number | null
    positionId: number | null
  }

  export type EmployeeSumAggregateOutputType = {
    id: number | null
    height: number | null
    weight: number | null
    departmentId: number | null
    positionId: number | null
  }

  export type EmployeeMinAggregateOutputType = {
    id: number | null
    firstName: string | null
    lastName: string | null
    middleName: string | null
    nameExtension: string | null
    dateOfBirth: Date | null
    placeOfBirth: string | null
    sex: string | null
    civilStatus: string | null
    height: number | null
    weight: number | null
    bloodType: string | null
    gsisNo: string | null
    pagibigNo: string | null
    philhealthNo: string | null
    sssNo: string | null
    tinNo: string | null
    agencyEmployeeNo: string | null
    citizenship: string | null
    residentialAddress: string | null
    permanentAddress: string | null
    telephoneNo: string | null
    mobileNo: string | null
    email: string | null
    departmentId: number | null
    positionId: number | null
    status: string | null
    dateHired: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EmployeeMaxAggregateOutputType = {
    id: number | null
    firstName: string | null
    lastName: string | null
    middleName: string | null
    nameExtension: string | null
    dateOfBirth: Date | null
    placeOfBirth: string | null
    sex: string | null
    civilStatus: string | null
    height: number | null
    weight: number | null
    bloodType: string | null
    gsisNo: string | null
    pagibigNo: string | null
    philhealthNo: string | null
    sssNo: string | null
    tinNo: string | null
    agencyEmployeeNo: string | null
    citizenship: string | null
    residentialAddress: string | null
    permanentAddress: string | null
    telephoneNo: string | null
    mobileNo: string | null
    email: string | null
    departmentId: number | null
    positionId: number | null
    status: string | null
    dateHired: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EmployeeCountAggregateOutputType = {
    id: number
    firstName: number
    lastName: number
    middleName: number
    nameExtension: number
    dateOfBirth: number
    placeOfBirth: number
    sex: number
    civilStatus: number
    height: number
    weight: number
    bloodType: number
    gsisNo: number
    pagibigNo: number
    philhealthNo: number
    sssNo: number
    tinNo: number
    agencyEmployeeNo: number
    citizenship: number
    residentialAddress: number
    permanentAddress: number
    telephoneNo: number
    mobileNo: number
    email: number
    departmentId: number
    positionId: number
    status: number
    dateHired: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type EmployeeAvgAggregateInputType = {
    id?: true
    height?: true
    weight?: true
    departmentId?: true
    positionId?: true
  }

  export type EmployeeSumAggregateInputType = {
    id?: true
    height?: true
    weight?: true
    departmentId?: true
    positionId?: true
  }

  export type EmployeeMinAggregateInputType = {
    id?: true
    firstName?: true
    lastName?: true
    middleName?: true
    nameExtension?: true
    dateOfBirth?: true
    placeOfBirth?: true
    sex?: true
    civilStatus?: true
    height?: true
    weight?: true
    bloodType?: true
    gsisNo?: true
    pagibigNo?: true
    philhealthNo?: true
    sssNo?: true
    tinNo?: true
    agencyEmployeeNo?: true
    citizenship?: true
    residentialAddress?: true
    permanentAddress?: true
    telephoneNo?: true
    mobileNo?: true
    email?: true
    departmentId?: true
    positionId?: true
    status?: true
    dateHired?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EmployeeMaxAggregateInputType = {
    id?: true
    firstName?: true
    lastName?: true
    middleName?: true
    nameExtension?: true
    dateOfBirth?: true
    placeOfBirth?: true
    sex?: true
    civilStatus?: true
    height?: true
    weight?: true
    bloodType?: true
    gsisNo?: true
    pagibigNo?: true
    philhealthNo?: true
    sssNo?: true
    tinNo?: true
    agencyEmployeeNo?: true
    citizenship?: true
    residentialAddress?: true
    permanentAddress?: true
    telephoneNo?: true
    mobileNo?: true
    email?: true
    departmentId?: true
    positionId?: true
    status?: true
    dateHired?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EmployeeCountAggregateInputType = {
    id?: true
    firstName?: true
    lastName?: true
    middleName?: true
    nameExtension?: true
    dateOfBirth?: true
    placeOfBirth?: true
    sex?: true
    civilStatus?: true
    height?: true
    weight?: true
    bloodType?: true
    gsisNo?: true
    pagibigNo?: true
    philhealthNo?: true
    sssNo?: true
    tinNo?: true
    agencyEmployeeNo?: true
    citizenship?: true
    residentialAddress?: true
    permanentAddress?: true
    telephoneNo?: true
    mobileNo?: true
    email?: true
    departmentId?: true
    positionId?: true
    status?: true
    dateHired?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type EmployeeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Employee to aggregate.
     */
    where?: EmployeeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Employees to fetch.
     */
    orderBy?: EmployeeOrderByWithRelationInput | EmployeeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EmployeeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Employees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Employees.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Employees
    **/
    _count?: true | EmployeeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EmployeeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EmployeeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EmployeeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EmployeeMaxAggregateInputType
  }

  export type GetEmployeeAggregateType<T extends EmployeeAggregateArgs> = {
        [P in keyof T & keyof AggregateEmployee]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEmployee[P]>
      : GetScalarType<T[P], AggregateEmployee[P]>
  }




  export type EmployeeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EmployeeWhereInput
    orderBy?: EmployeeOrderByWithAggregationInput | EmployeeOrderByWithAggregationInput[]
    by: EmployeeScalarFieldEnum[] | EmployeeScalarFieldEnum
    having?: EmployeeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EmployeeCountAggregateInputType | true
    _avg?: EmployeeAvgAggregateInputType
    _sum?: EmployeeSumAggregateInputType
    _min?: EmployeeMinAggregateInputType
    _max?: EmployeeMaxAggregateInputType
  }

  export type EmployeeGroupByOutputType = {
    id: number
    firstName: string
    lastName: string
    middleName: string | null
    nameExtension: string | null
    dateOfBirth: Date
    placeOfBirth: string
    sex: string
    civilStatus: string
    height: number | null
    weight: number | null
    bloodType: string | null
    gsisNo: string | null
    pagibigNo: string | null
    philhealthNo: string | null
    sssNo: string | null
    tinNo: string | null
    agencyEmployeeNo: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo: string | null
    mobileNo: string | null
    email: string | null
    departmentId: number
    positionId: number
    status: string
    dateHired: Date | null
    createdAt: Date
    updatedAt: Date
    _count: EmployeeCountAggregateOutputType | null
    _avg: EmployeeAvgAggregateOutputType | null
    _sum: EmployeeSumAggregateOutputType | null
    _min: EmployeeMinAggregateOutputType | null
    _max: EmployeeMaxAggregateOutputType | null
  }

  type GetEmployeeGroupByPayload<T extends EmployeeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EmployeeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EmployeeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EmployeeGroupByOutputType[P]>
            : GetScalarType<T[P], EmployeeGroupByOutputType[P]>
        }
      >
    >


  export type EmployeeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    firstName?: boolean
    lastName?: boolean
    middleName?: boolean
    nameExtension?: boolean
    dateOfBirth?: boolean
    placeOfBirth?: boolean
    sex?: boolean
    civilStatus?: boolean
    height?: boolean
    weight?: boolean
    bloodType?: boolean
    gsisNo?: boolean
    pagibigNo?: boolean
    philhealthNo?: boolean
    sssNo?: boolean
    tinNo?: boolean
    agencyEmployeeNo?: boolean
    citizenship?: boolean
    residentialAddress?: boolean
    permanentAddress?: boolean
    telephoneNo?: boolean
    mobileNo?: boolean
    email?: boolean
    departmentId?: boolean
    positionId?: boolean
    status?: boolean
    dateHired?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    department?: boolean | DepartmentDefaultArgs<ExtArgs>
    position?: boolean | PositionDefaultArgs<ExtArgs>
    children?: boolean | Employee$childrenArgs<ExtArgs>
    education?: boolean | Employee$educationArgs<ExtArgs>
    civilService?: boolean | Employee$civilServiceArgs<ExtArgs>
    workExperience?: boolean | Employee$workExperienceArgs<ExtArgs>
    voluntaryWork?: boolean | Employee$voluntaryWorkArgs<ExtArgs>
    training?: boolean | Employee$trainingArgs<ExtArgs>
    skills?: boolean | Employee$skillsArgs<ExtArgs>
    family?: boolean | Employee$familyArgs<ExtArgs>
    leaves?: boolean | Employee$leavesArgs<ExtArgs>
    _count?: boolean | EmployeeCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["employee"]>


  export type EmployeeSelectScalar = {
    id?: boolean
    firstName?: boolean
    lastName?: boolean
    middleName?: boolean
    nameExtension?: boolean
    dateOfBirth?: boolean
    placeOfBirth?: boolean
    sex?: boolean
    civilStatus?: boolean
    height?: boolean
    weight?: boolean
    bloodType?: boolean
    gsisNo?: boolean
    pagibigNo?: boolean
    philhealthNo?: boolean
    sssNo?: boolean
    tinNo?: boolean
    agencyEmployeeNo?: boolean
    citizenship?: boolean
    residentialAddress?: boolean
    permanentAddress?: boolean
    telephoneNo?: boolean
    mobileNo?: boolean
    email?: boolean
    departmentId?: boolean
    positionId?: boolean
    status?: boolean
    dateHired?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type EmployeeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    department?: boolean | DepartmentDefaultArgs<ExtArgs>
    position?: boolean | PositionDefaultArgs<ExtArgs>
    children?: boolean | Employee$childrenArgs<ExtArgs>
    education?: boolean | Employee$educationArgs<ExtArgs>
    civilService?: boolean | Employee$civilServiceArgs<ExtArgs>
    workExperience?: boolean | Employee$workExperienceArgs<ExtArgs>
    voluntaryWork?: boolean | Employee$voluntaryWorkArgs<ExtArgs>
    training?: boolean | Employee$trainingArgs<ExtArgs>
    skills?: boolean | Employee$skillsArgs<ExtArgs>
    family?: boolean | Employee$familyArgs<ExtArgs>
    leaves?: boolean | Employee$leavesArgs<ExtArgs>
    _count?: boolean | EmployeeCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $EmployeePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Employee"
    objects: {
      department: Prisma.$DepartmentPayload<ExtArgs>
      position: Prisma.$PositionPayload<ExtArgs>
      children: Prisma.$ChildRecordPayload<ExtArgs>[]
      education: Prisma.$EducationalBackgroundPayload<ExtArgs>[]
      civilService: Prisma.$CivilServiceEligibilityPayload<ExtArgs>[]
      workExperience: Prisma.$WorkExperiencePayload<ExtArgs>[]
      voluntaryWork: Prisma.$VoluntaryWorkPayload<ExtArgs>[]
      training: Prisma.$TrainingProgramPayload<ExtArgs>[]
      skills: Prisma.$OtherInformationPayload<ExtArgs>[]
      family: Prisma.$FamilyBackgroundPayload<ExtArgs> | null
      leaves: Prisma.$LeaveRecordPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      firstName: string
      lastName: string
      middleName: string | null
      nameExtension: string | null
      dateOfBirth: Date
      placeOfBirth: string
      sex: string
      civilStatus: string
      height: number | null
      weight: number | null
      bloodType: string | null
      gsisNo: string | null
      pagibigNo: string | null
      philhealthNo: string | null
      sssNo: string | null
      tinNo: string | null
      agencyEmployeeNo: string | null
      citizenship: string
      residentialAddress: string
      permanentAddress: string
      telephoneNo: string | null
      mobileNo: string | null
      email: string | null
      departmentId: number
      positionId: number
      status: string
      dateHired: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["employee"]>
    composites: {}
  }

  type EmployeeGetPayload<S extends boolean | null | undefined | EmployeeDefaultArgs> = $Result.GetResult<Prisma.$EmployeePayload, S>

  type EmployeeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<EmployeeFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: EmployeeCountAggregateInputType | true
    }

  export interface EmployeeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Employee'], meta: { name: 'Employee' } }
    /**
     * Find zero or one Employee that matches the filter.
     * @param {EmployeeFindUniqueArgs} args - Arguments to find a Employee
     * @example
     * // Get one Employee
     * const employee = await prisma.employee.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EmployeeFindUniqueArgs>(args: SelectSubset<T, EmployeeFindUniqueArgs<ExtArgs>>): Prisma__EmployeeClient<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Employee that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {EmployeeFindUniqueOrThrowArgs} args - Arguments to find a Employee
     * @example
     * // Get one Employee
     * const employee = await prisma.employee.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EmployeeFindUniqueOrThrowArgs>(args: SelectSubset<T, EmployeeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EmployeeClient<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Employee that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmployeeFindFirstArgs} args - Arguments to find a Employee
     * @example
     * // Get one Employee
     * const employee = await prisma.employee.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EmployeeFindFirstArgs>(args?: SelectSubset<T, EmployeeFindFirstArgs<ExtArgs>>): Prisma__EmployeeClient<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Employee that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmployeeFindFirstOrThrowArgs} args - Arguments to find a Employee
     * @example
     * // Get one Employee
     * const employee = await prisma.employee.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EmployeeFindFirstOrThrowArgs>(args?: SelectSubset<T, EmployeeFindFirstOrThrowArgs<ExtArgs>>): Prisma__EmployeeClient<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Employees that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmployeeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Employees
     * const employees = await prisma.employee.findMany()
     * 
     * // Get first 10 Employees
     * const employees = await prisma.employee.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const employeeWithIdOnly = await prisma.employee.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EmployeeFindManyArgs>(args?: SelectSubset<T, EmployeeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Employee.
     * @param {EmployeeCreateArgs} args - Arguments to create a Employee.
     * @example
     * // Create one Employee
     * const Employee = await prisma.employee.create({
     *   data: {
     *     // ... data to create a Employee
     *   }
     * })
     * 
     */
    create<T extends EmployeeCreateArgs>(args: SelectSubset<T, EmployeeCreateArgs<ExtArgs>>): Prisma__EmployeeClient<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Employees.
     * @param {EmployeeCreateManyArgs} args - Arguments to create many Employees.
     * @example
     * // Create many Employees
     * const employee = await prisma.employee.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EmployeeCreateManyArgs>(args?: SelectSubset<T, EmployeeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Employee.
     * @param {EmployeeDeleteArgs} args - Arguments to delete one Employee.
     * @example
     * // Delete one Employee
     * const Employee = await prisma.employee.delete({
     *   where: {
     *     // ... filter to delete one Employee
     *   }
     * })
     * 
     */
    delete<T extends EmployeeDeleteArgs>(args: SelectSubset<T, EmployeeDeleteArgs<ExtArgs>>): Prisma__EmployeeClient<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Employee.
     * @param {EmployeeUpdateArgs} args - Arguments to update one Employee.
     * @example
     * // Update one Employee
     * const employee = await prisma.employee.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EmployeeUpdateArgs>(args: SelectSubset<T, EmployeeUpdateArgs<ExtArgs>>): Prisma__EmployeeClient<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Employees.
     * @param {EmployeeDeleteManyArgs} args - Arguments to filter Employees to delete.
     * @example
     * // Delete a few Employees
     * const { count } = await prisma.employee.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EmployeeDeleteManyArgs>(args?: SelectSubset<T, EmployeeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Employees.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmployeeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Employees
     * const employee = await prisma.employee.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EmployeeUpdateManyArgs>(args: SelectSubset<T, EmployeeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Employee.
     * @param {EmployeeUpsertArgs} args - Arguments to update or create a Employee.
     * @example
     * // Update or create a Employee
     * const employee = await prisma.employee.upsert({
     *   create: {
     *     // ... data to create a Employee
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Employee we want to update
     *   }
     * })
     */
    upsert<T extends EmployeeUpsertArgs>(args: SelectSubset<T, EmployeeUpsertArgs<ExtArgs>>): Prisma__EmployeeClient<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Employees.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmployeeCountArgs} args - Arguments to filter Employees to count.
     * @example
     * // Count the number of Employees
     * const count = await prisma.employee.count({
     *   where: {
     *     // ... the filter for the Employees we want to count
     *   }
     * })
    **/
    count<T extends EmployeeCountArgs>(
      args?: Subset<T, EmployeeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EmployeeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Employee.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmployeeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EmployeeAggregateArgs>(args: Subset<T, EmployeeAggregateArgs>): Prisma.PrismaPromise<GetEmployeeAggregateType<T>>

    /**
     * Group by Employee.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmployeeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EmployeeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EmployeeGroupByArgs['orderBy'] }
        : { orderBy?: EmployeeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EmployeeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEmployeeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Employee model
   */
  readonly fields: EmployeeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Employee.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EmployeeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    department<T extends DepartmentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, DepartmentDefaultArgs<ExtArgs>>): Prisma__DepartmentClient<$Result.GetResult<Prisma.$DepartmentPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    position<T extends PositionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PositionDefaultArgs<ExtArgs>>): Prisma__PositionClient<$Result.GetResult<Prisma.$PositionPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    children<T extends Employee$childrenArgs<ExtArgs> = {}>(args?: Subset<T, Employee$childrenArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChildRecordPayload<ExtArgs>, T, "findMany"> | Null>
    education<T extends Employee$educationArgs<ExtArgs> = {}>(args?: Subset<T, Employee$educationArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EducationalBackgroundPayload<ExtArgs>, T, "findMany"> | Null>
    civilService<T extends Employee$civilServiceArgs<ExtArgs> = {}>(args?: Subset<T, Employee$civilServiceArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CivilServiceEligibilityPayload<ExtArgs>, T, "findMany"> | Null>
    workExperience<T extends Employee$workExperienceArgs<ExtArgs> = {}>(args?: Subset<T, Employee$workExperienceArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkExperiencePayload<ExtArgs>, T, "findMany"> | Null>
    voluntaryWork<T extends Employee$voluntaryWorkArgs<ExtArgs> = {}>(args?: Subset<T, Employee$voluntaryWorkArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VoluntaryWorkPayload<ExtArgs>, T, "findMany"> | Null>
    training<T extends Employee$trainingArgs<ExtArgs> = {}>(args?: Subset<T, Employee$trainingArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrainingProgramPayload<ExtArgs>, T, "findMany"> | Null>
    skills<T extends Employee$skillsArgs<ExtArgs> = {}>(args?: Subset<T, Employee$skillsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OtherInformationPayload<ExtArgs>, T, "findMany"> | Null>
    family<T extends Employee$familyArgs<ExtArgs> = {}>(args?: Subset<T, Employee$familyArgs<ExtArgs>>): Prisma__FamilyBackgroundClient<$Result.GetResult<Prisma.$FamilyBackgroundPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    leaves<T extends Employee$leavesArgs<ExtArgs> = {}>(args?: Subset<T, Employee$leavesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LeaveRecordPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Employee model
   */ 
  interface EmployeeFieldRefs {
    readonly id: FieldRef<"Employee", 'Int'>
    readonly firstName: FieldRef<"Employee", 'String'>
    readonly lastName: FieldRef<"Employee", 'String'>
    readonly middleName: FieldRef<"Employee", 'String'>
    readonly nameExtension: FieldRef<"Employee", 'String'>
    readonly dateOfBirth: FieldRef<"Employee", 'DateTime'>
    readonly placeOfBirth: FieldRef<"Employee", 'String'>
    readonly sex: FieldRef<"Employee", 'String'>
    readonly civilStatus: FieldRef<"Employee", 'String'>
    readonly height: FieldRef<"Employee", 'Float'>
    readonly weight: FieldRef<"Employee", 'Float'>
    readonly bloodType: FieldRef<"Employee", 'String'>
    readonly gsisNo: FieldRef<"Employee", 'String'>
    readonly pagibigNo: FieldRef<"Employee", 'String'>
    readonly philhealthNo: FieldRef<"Employee", 'String'>
    readonly sssNo: FieldRef<"Employee", 'String'>
    readonly tinNo: FieldRef<"Employee", 'String'>
    readonly agencyEmployeeNo: FieldRef<"Employee", 'String'>
    readonly citizenship: FieldRef<"Employee", 'String'>
    readonly residentialAddress: FieldRef<"Employee", 'String'>
    readonly permanentAddress: FieldRef<"Employee", 'String'>
    readonly telephoneNo: FieldRef<"Employee", 'String'>
    readonly mobileNo: FieldRef<"Employee", 'String'>
    readonly email: FieldRef<"Employee", 'String'>
    readonly departmentId: FieldRef<"Employee", 'Int'>
    readonly positionId: FieldRef<"Employee", 'Int'>
    readonly status: FieldRef<"Employee", 'String'>
    readonly dateHired: FieldRef<"Employee", 'DateTime'>
    readonly createdAt: FieldRef<"Employee", 'DateTime'>
    readonly updatedAt: FieldRef<"Employee", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Employee findUnique
   */
  export type EmployeeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Employee
     */
    select?: EmployeeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmployeeInclude<ExtArgs> | null
    /**
     * Filter, which Employee to fetch.
     */
    where: EmployeeWhereUniqueInput
  }

  /**
   * Employee findUniqueOrThrow
   */
  export type EmployeeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Employee
     */
    select?: EmployeeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmployeeInclude<ExtArgs> | null
    /**
     * Filter, which Employee to fetch.
     */
    where: EmployeeWhereUniqueInput
  }

  /**
   * Employee findFirst
   */
  export type EmployeeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Employee
     */
    select?: EmployeeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmployeeInclude<ExtArgs> | null
    /**
     * Filter, which Employee to fetch.
     */
    where?: EmployeeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Employees to fetch.
     */
    orderBy?: EmployeeOrderByWithRelationInput | EmployeeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Employees.
     */
    cursor?: EmployeeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Employees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Employees.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Employees.
     */
    distinct?: EmployeeScalarFieldEnum | EmployeeScalarFieldEnum[]
  }

  /**
   * Employee findFirstOrThrow
   */
  export type EmployeeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Employee
     */
    select?: EmployeeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmployeeInclude<ExtArgs> | null
    /**
     * Filter, which Employee to fetch.
     */
    where?: EmployeeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Employees to fetch.
     */
    orderBy?: EmployeeOrderByWithRelationInput | EmployeeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Employees.
     */
    cursor?: EmployeeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Employees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Employees.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Employees.
     */
    distinct?: EmployeeScalarFieldEnum | EmployeeScalarFieldEnum[]
  }

  /**
   * Employee findMany
   */
  export type EmployeeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Employee
     */
    select?: EmployeeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmployeeInclude<ExtArgs> | null
    /**
     * Filter, which Employees to fetch.
     */
    where?: EmployeeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Employees to fetch.
     */
    orderBy?: EmployeeOrderByWithRelationInput | EmployeeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Employees.
     */
    cursor?: EmployeeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Employees from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Employees.
     */
    skip?: number
    distinct?: EmployeeScalarFieldEnum | EmployeeScalarFieldEnum[]
  }

  /**
   * Employee create
   */
  export type EmployeeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Employee
     */
    select?: EmployeeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmployeeInclude<ExtArgs> | null
    /**
     * The data needed to create a Employee.
     */
    data: XOR<EmployeeCreateInput, EmployeeUncheckedCreateInput>
  }

  /**
   * Employee createMany
   */
  export type EmployeeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Employees.
     */
    data: EmployeeCreateManyInput | EmployeeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Employee update
   */
  export type EmployeeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Employee
     */
    select?: EmployeeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmployeeInclude<ExtArgs> | null
    /**
     * The data needed to update a Employee.
     */
    data: XOR<EmployeeUpdateInput, EmployeeUncheckedUpdateInput>
    /**
     * Choose, which Employee to update.
     */
    where: EmployeeWhereUniqueInput
  }

  /**
   * Employee updateMany
   */
  export type EmployeeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Employees.
     */
    data: XOR<EmployeeUpdateManyMutationInput, EmployeeUncheckedUpdateManyInput>
    /**
     * Filter which Employees to update
     */
    where?: EmployeeWhereInput
  }

  /**
   * Employee upsert
   */
  export type EmployeeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Employee
     */
    select?: EmployeeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmployeeInclude<ExtArgs> | null
    /**
     * The filter to search for the Employee to update in case it exists.
     */
    where: EmployeeWhereUniqueInput
    /**
     * In case the Employee found by the `where` argument doesn't exist, create a new Employee with this data.
     */
    create: XOR<EmployeeCreateInput, EmployeeUncheckedCreateInput>
    /**
     * In case the Employee was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EmployeeUpdateInput, EmployeeUncheckedUpdateInput>
  }

  /**
   * Employee delete
   */
  export type EmployeeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Employee
     */
    select?: EmployeeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmployeeInclude<ExtArgs> | null
    /**
     * Filter which Employee to delete.
     */
    where: EmployeeWhereUniqueInput
  }

  /**
   * Employee deleteMany
   */
  export type EmployeeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Employees to delete
     */
    where?: EmployeeWhereInput
  }

  /**
   * Employee.children
   */
  export type Employee$childrenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChildRecord
     */
    select?: ChildRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChildRecordInclude<ExtArgs> | null
    where?: ChildRecordWhereInput
    orderBy?: ChildRecordOrderByWithRelationInput | ChildRecordOrderByWithRelationInput[]
    cursor?: ChildRecordWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChildRecordScalarFieldEnum | ChildRecordScalarFieldEnum[]
  }

  /**
   * Employee.education
   */
  export type Employee$educationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EducationalBackground
     */
    select?: EducationalBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EducationalBackgroundInclude<ExtArgs> | null
    where?: EducationalBackgroundWhereInput
    orderBy?: EducationalBackgroundOrderByWithRelationInput | EducationalBackgroundOrderByWithRelationInput[]
    cursor?: EducationalBackgroundWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EducationalBackgroundScalarFieldEnum | EducationalBackgroundScalarFieldEnum[]
  }

  /**
   * Employee.civilService
   */
  export type Employee$civilServiceArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CivilServiceEligibility
     */
    select?: CivilServiceEligibilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CivilServiceEligibilityInclude<ExtArgs> | null
    where?: CivilServiceEligibilityWhereInput
    orderBy?: CivilServiceEligibilityOrderByWithRelationInput | CivilServiceEligibilityOrderByWithRelationInput[]
    cursor?: CivilServiceEligibilityWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CivilServiceEligibilityScalarFieldEnum | CivilServiceEligibilityScalarFieldEnum[]
  }

  /**
   * Employee.workExperience
   */
  export type Employee$workExperienceArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkExperience
     */
    select?: WorkExperienceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkExperienceInclude<ExtArgs> | null
    where?: WorkExperienceWhereInput
    orderBy?: WorkExperienceOrderByWithRelationInput | WorkExperienceOrderByWithRelationInput[]
    cursor?: WorkExperienceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: WorkExperienceScalarFieldEnum | WorkExperienceScalarFieldEnum[]
  }

  /**
   * Employee.voluntaryWork
   */
  export type Employee$voluntaryWorkArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoluntaryWork
     */
    select?: VoluntaryWorkSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoluntaryWorkInclude<ExtArgs> | null
    where?: VoluntaryWorkWhereInput
    orderBy?: VoluntaryWorkOrderByWithRelationInput | VoluntaryWorkOrderByWithRelationInput[]
    cursor?: VoluntaryWorkWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VoluntaryWorkScalarFieldEnum | VoluntaryWorkScalarFieldEnum[]
  }

  /**
   * Employee.training
   */
  export type Employee$trainingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrainingProgram
     */
    select?: TrainingProgramSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrainingProgramInclude<ExtArgs> | null
    where?: TrainingProgramWhereInput
    orderBy?: TrainingProgramOrderByWithRelationInput | TrainingProgramOrderByWithRelationInput[]
    cursor?: TrainingProgramWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TrainingProgramScalarFieldEnum | TrainingProgramScalarFieldEnum[]
  }

  /**
   * Employee.skills
   */
  export type Employee$skillsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OtherInformation
     */
    select?: OtherInformationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OtherInformationInclude<ExtArgs> | null
    where?: OtherInformationWhereInput
    orderBy?: OtherInformationOrderByWithRelationInput | OtherInformationOrderByWithRelationInput[]
    cursor?: OtherInformationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: OtherInformationScalarFieldEnum | OtherInformationScalarFieldEnum[]
  }

  /**
   * Employee.family
   */
  export type Employee$familyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FamilyBackground
     */
    select?: FamilyBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FamilyBackgroundInclude<ExtArgs> | null
    where?: FamilyBackgroundWhereInput
  }

  /**
   * Employee.leaves
   */
  export type Employee$leavesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaveRecord
     */
    select?: LeaveRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveRecordInclude<ExtArgs> | null
    where?: LeaveRecordWhereInput
    orderBy?: LeaveRecordOrderByWithRelationInput | LeaveRecordOrderByWithRelationInput[]
    cursor?: LeaveRecordWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LeaveRecordScalarFieldEnum | LeaveRecordScalarFieldEnum[]
  }

  /**
   * Employee without action
   */
  export type EmployeeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Employee
     */
    select?: EmployeeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmployeeInclude<ExtArgs> | null
  }


  /**
   * Model FamilyBackground
   */

  export type AggregateFamilyBackground = {
    _count: FamilyBackgroundCountAggregateOutputType | null
    _avg: FamilyBackgroundAvgAggregateOutputType | null
    _sum: FamilyBackgroundSumAggregateOutputType | null
    _min: FamilyBackgroundMinAggregateOutputType | null
    _max: FamilyBackgroundMaxAggregateOutputType | null
  }

  export type FamilyBackgroundAvgAggregateOutputType = {
    id: number | null
    employeeId: number | null
  }

  export type FamilyBackgroundSumAggregateOutputType = {
    id: number | null
    employeeId: number | null
  }

  export type FamilyBackgroundMinAggregateOutputType = {
    id: number | null
    employeeId: number | null
    spouseFirstName: string | null
    spouseLastName: string | null
    spouseMiddleName: string | null
    spouseOccupation: string | null
    spouseEmployer: string | null
    spouseBusinessAddress: string | null
    spouseTelephone: string | null
    fatherFirstName: string | null
    fatherLastName: string | null
    fatherMiddleName: string | null
    motherMaidenFirst: string | null
    motherMaidenLast: string | null
    motherMaidenMiddle: string | null
  }

  export type FamilyBackgroundMaxAggregateOutputType = {
    id: number | null
    employeeId: number | null
    spouseFirstName: string | null
    spouseLastName: string | null
    spouseMiddleName: string | null
    spouseOccupation: string | null
    spouseEmployer: string | null
    spouseBusinessAddress: string | null
    spouseTelephone: string | null
    fatherFirstName: string | null
    fatherLastName: string | null
    fatherMiddleName: string | null
    motherMaidenFirst: string | null
    motherMaidenLast: string | null
    motherMaidenMiddle: string | null
  }

  export type FamilyBackgroundCountAggregateOutputType = {
    id: number
    employeeId: number
    spouseFirstName: number
    spouseLastName: number
    spouseMiddleName: number
    spouseOccupation: number
    spouseEmployer: number
    spouseBusinessAddress: number
    spouseTelephone: number
    fatherFirstName: number
    fatherLastName: number
    fatherMiddleName: number
    motherMaidenFirst: number
    motherMaidenLast: number
    motherMaidenMiddle: number
    _all: number
  }


  export type FamilyBackgroundAvgAggregateInputType = {
    id?: true
    employeeId?: true
  }

  export type FamilyBackgroundSumAggregateInputType = {
    id?: true
    employeeId?: true
  }

  export type FamilyBackgroundMinAggregateInputType = {
    id?: true
    employeeId?: true
    spouseFirstName?: true
    spouseLastName?: true
    spouseMiddleName?: true
    spouseOccupation?: true
    spouseEmployer?: true
    spouseBusinessAddress?: true
    spouseTelephone?: true
    fatherFirstName?: true
    fatherLastName?: true
    fatherMiddleName?: true
    motherMaidenFirst?: true
    motherMaidenLast?: true
    motherMaidenMiddle?: true
  }

  export type FamilyBackgroundMaxAggregateInputType = {
    id?: true
    employeeId?: true
    spouseFirstName?: true
    spouseLastName?: true
    spouseMiddleName?: true
    spouseOccupation?: true
    spouseEmployer?: true
    spouseBusinessAddress?: true
    spouseTelephone?: true
    fatherFirstName?: true
    fatherLastName?: true
    fatherMiddleName?: true
    motherMaidenFirst?: true
    motherMaidenLast?: true
    motherMaidenMiddle?: true
  }

  export type FamilyBackgroundCountAggregateInputType = {
    id?: true
    employeeId?: true
    spouseFirstName?: true
    spouseLastName?: true
    spouseMiddleName?: true
    spouseOccupation?: true
    spouseEmployer?: true
    spouseBusinessAddress?: true
    spouseTelephone?: true
    fatherFirstName?: true
    fatherLastName?: true
    fatherMiddleName?: true
    motherMaidenFirst?: true
    motherMaidenLast?: true
    motherMaidenMiddle?: true
    _all?: true
  }

  export type FamilyBackgroundAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FamilyBackground to aggregate.
     */
    where?: FamilyBackgroundWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FamilyBackgrounds to fetch.
     */
    orderBy?: FamilyBackgroundOrderByWithRelationInput | FamilyBackgroundOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FamilyBackgroundWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FamilyBackgrounds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FamilyBackgrounds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned FamilyBackgrounds
    **/
    _count?: true | FamilyBackgroundCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: FamilyBackgroundAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: FamilyBackgroundSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FamilyBackgroundMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FamilyBackgroundMaxAggregateInputType
  }

  export type GetFamilyBackgroundAggregateType<T extends FamilyBackgroundAggregateArgs> = {
        [P in keyof T & keyof AggregateFamilyBackground]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFamilyBackground[P]>
      : GetScalarType<T[P], AggregateFamilyBackground[P]>
  }




  export type FamilyBackgroundGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FamilyBackgroundWhereInput
    orderBy?: FamilyBackgroundOrderByWithAggregationInput | FamilyBackgroundOrderByWithAggregationInput[]
    by: FamilyBackgroundScalarFieldEnum[] | FamilyBackgroundScalarFieldEnum
    having?: FamilyBackgroundScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FamilyBackgroundCountAggregateInputType | true
    _avg?: FamilyBackgroundAvgAggregateInputType
    _sum?: FamilyBackgroundSumAggregateInputType
    _min?: FamilyBackgroundMinAggregateInputType
    _max?: FamilyBackgroundMaxAggregateInputType
  }

  export type FamilyBackgroundGroupByOutputType = {
    id: number
    employeeId: number
    spouseFirstName: string | null
    spouseLastName: string | null
    spouseMiddleName: string | null
    spouseOccupation: string | null
    spouseEmployer: string | null
    spouseBusinessAddress: string | null
    spouseTelephone: string | null
    fatherFirstName: string
    fatherLastName: string
    fatherMiddleName: string | null
    motherMaidenFirst: string
    motherMaidenLast: string
    motherMaidenMiddle: string | null
    _count: FamilyBackgroundCountAggregateOutputType | null
    _avg: FamilyBackgroundAvgAggregateOutputType | null
    _sum: FamilyBackgroundSumAggregateOutputType | null
    _min: FamilyBackgroundMinAggregateOutputType | null
    _max: FamilyBackgroundMaxAggregateOutputType | null
  }

  type GetFamilyBackgroundGroupByPayload<T extends FamilyBackgroundGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FamilyBackgroundGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FamilyBackgroundGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FamilyBackgroundGroupByOutputType[P]>
            : GetScalarType<T[P], FamilyBackgroundGroupByOutputType[P]>
        }
      >
    >


  export type FamilyBackgroundSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    employeeId?: boolean
    spouseFirstName?: boolean
    spouseLastName?: boolean
    spouseMiddleName?: boolean
    spouseOccupation?: boolean
    spouseEmployer?: boolean
    spouseBusinessAddress?: boolean
    spouseTelephone?: boolean
    fatherFirstName?: boolean
    fatherLastName?: boolean
    fatherMiddleName?: boolean
    motherMaidenFirst?: boolean
    motherMaidenLast?: boolean
    motherMaidenMiddle?: boolean
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["familyBackground"]>


  export type FamilyBackgroundSelectScalar = {
    id?: boolean
    employeeId?: boolean
    spouseFirstName?: boolean
    spouseLastName?: boolean
    spouseMiddleName?: boolean
    spouseOccupation?: boolean
    spouseEmployer?: boolean
    spouseBusinessAddress?: boolean
    spouseTelephone?: boolean
    fatherFirstName?: boolean
    fatherLastName?: boolean
    fatherMiddleName?: boolean
    motherMaidenFirst?: boolean
    motherMaidenLast?: boolean
    motherMaidenMiddle?: boolean
  }

  export type FamilyBackgroundInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }

  export type $FamilyBackgroundPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "FamilyBackground"
    objects: {
      employee: Prisma.$EmployeePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      employeeId: number
      spouseFirstName: string | null
      spouseLastName: string | null
      spouseMiddleName: string | null
      spouseOccupation: string | null
      spouseEmployer: string | null
      spouseBusinessAddress: string | null
      spouseTelephone: string | null
      fatherFirstName: string
      fatherLastName: string
      fatherMiddleName: string | null
      motherMaidenFirst: string
      motherMaidenLast: string
      motherMaidenMiddle: string | null
    }, ExtArgs["result"]["familyBackground"]>
    composites: {}
  }

  type FamilyBackgroundGetPayload<S extends boolean | null | undefined | FamilyBackgroundDefaultArgs> = $Result.GetResult<Prisma.$FamilyBackgroundPayload, S>

  type FamilyBackgroundCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<FamilyBackgroundFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: FamilyBackgroundCountAggregateInputType | true
    }

  export interface FamilyBackgroundDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['FamilyBackground'], meta: { name: 'FamilyBackground' } }
    /**
     * Find zero or one FamilyBackground that matches the filter.
     * @param {FamilyBackgroundFindUniqueArgs} args - Arguments to find a FamilyBackground
     * @example
     * // Get one FamilyBackground
     * const familyBackground = await prisma.familyBackground.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FamilyBackgroundFindUniqueArgs>(args: SelectSubset<T, FamilyBackgroundFindUniqueArgs<ExtArgs>>): Prisma__FamilyBackgroundClient<$Result.GetResult<Prisma.$FamilyBackgroundPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one FamilyBackground that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {FamilyBackgroundFindUniqueOrThrowArgs} args - Arguments to find a FamilyBackground
     * @example
     * // Get one FamilyBackground
     * const familyBackground = await prisma.familyBackground.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FamilyBackgroundFindUniqueOrThrowArgs>(args: SelectSubset<T, FamilyBackgroundFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FamilyBackgroundClient<$Result.GetResult<Prisma.$FamilyBackgroundPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first FamilyBackground that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FamilyBackgroundFindFirstArgs} args - Arguments to find a FamilyBackground
     * @example
     * // Get one FamilyBackground
     * const familyBackground = await prisma.familyBackground.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FamilyBackgroundFindFirstArgs>(args?: SelectSubset<T, FamilyBackgroundFindFirstArgs<ExtArgs>>): Prisma__FamilyBackgroundClient<$Result.GetResult<Prisma.$FamilyBackgroundPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first FamilyBackground that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FamilyBackgroundFindFirstOrThrowArgs} args - Arguments to find a FamilyBackground
     * @example
     * // Get one FamilyBackground
     * const familyBackground = await prisma.familyBackground.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FamilyBackgroundFindFirstOrThrowArgs>(args?: SelectSubset<T, FamilyBackgroundFindFirstOrThrowArgs<ExtArgs>>): Prisma__FamilyBackgroundClient<$Result.GetResult<Prisma.$FamilyBackgroundPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more FamilyBackgrounds that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FamilyBackgroundFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all FamilyBackgrounds
     * const familyBackgrounds = await prisma.familyBackground.findMany()
     * 
     * // Get first 10 FamilyBackgrounds
     * const familyBackgrounds = await prisma.familyBackground.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const familyBackgroundWithIdOnly = await prisma.familyBackground.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FamilyBackgroundFindManyArgs>(args?: SelectSubset<T, FamilyBackgroundFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FamilyBackgroundPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a FamilyBackground.
     * @param {FamilyBackgroundCreateArgs} args - Arguments to create a FamilyBackground.
     * @example
     * // Create one FamilyBackground
     * const FamilyBackground = await prisma.familyBackground.create({
     *   data: {
     *     // ... data to create a FamilyBackground
     *   }
     * })
     * 
     */
    create<T extends FamilyBackgroundCreateArgs>(args: SelectSubset<T, FamilyBackgroundCreateArgs<ExtArgs>>): Prisma__FamilyBackgroundClient<$Result.GetResult<Prisma.$FamilyBackgroundPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many FamilyBackgrounds.
     * @param {FamilyBackgroundCreateManyArgs} args - Arguments to create many FamilyBackgrounds.
     * @example
     * // Create many FamilyBackgrounds
     * const familyBackground = await prisma.familyBackground.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FamilyBackgroundCreateManyArgs>(args?: SelectSubset<T, FamilyBackgroundCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a FamilyBackground.
     * @param {FamilyBackgroundDeleteArgs} args - Arguments to delete one FamilyBackground.
     * @example
     * // Delete one FamilyBackground
     * const FamilyBackground = await prisma.familyBackground.delete({
     *   where: {
     *     // ... filter to delete one FamilyBackground
     *   }
     * })
     * 
     */
    delete<T extends FamilyBackgroundDeleteArgs>(args: SelectSubset<T, FamilyBackgroundDeleteArgs<ExtArgs>>): Prisma__FamilyBackgroundClient<$Result.GetResult<Prisma.$FamilyBackgroundPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one FamilyBackground.
     * @param {FamilyBackgroundUpdateArgs} args - Arguments to update one FamilyBackground.
     * @example
     * // Update one FamilyBackground
     * const familyBackground = await prisma.familyBackground.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FamilyBackgroundUpdateArgs>(args: SelectSubset<T, FamilyBackgroundUpdateArgs<ExtArgs>>): Prisma__FamilyBackgroundClient<$Result.GetResult<Prisma.$FamilyBackgroundPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more FamilyBackgrounds.
     * @param {FamilyBackgroundDeleteManyArgs} args - Arguments to filter FamilyBackgrounds to delete.
     * @example
     * // Delete a few FamilyBackgrounds
     * const { count } = await prisma.familyBackground.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FamilyBackgroundDeleteManyArgs>(args?: SelectSubset<T, FamilyBackgroundDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FamilyBackgrounds.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FamilyBackgroundUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many FamilyBackgrounds
     * const familyBackground = await prisma.familyBackground.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FamilyBackgroundUpdateManyArgs>(args: SelectSubset<T, FamilyBackgroundUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one FamilyBackground.
     * @param {FamilyBackgroundUpsertArgs} args - Arguments to update or create a FamilyBackground.
     * @example
     * // Update or create a FamilyBackground
     * const familyBackground = await prisma.familyBackground.upsert({
     *   create: {
     *     // ... data to create a FamilyBackground
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the FamilyBackground we want to update
     *   }
     * })
     */
    upsert<T extends FamilyBackgroundUpsertArgs>(args: SelectSubset<T, FamilyBackgroundUpsertArgs<ExtArgs>>): Prisma__FamilyBackgroundClient<$Result.GetResult<Prisma.$FamilyBackgroundPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of FamilyBackgrounds.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FamilyBackgroundCountArgs} args - Arguments to filter FamilyBackgrounds to count.
     * @example
     * // Count the number of FamilyBackgrounds
     * const count = await prisma.familyBackground.count({
     *   where: {
     *     // ... the filter for the FamilyBackgrounds we want to count
     *   }
     * })
    **/
    count<T extends FamilyBackgroundCountArgs>(
      args?: Subset<T, FamilyBackgroundCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FamilyBackgroundCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a FamilyBackground.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FamilyBackgroundAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FamilyBackgroundAggregateArgs>(args: Subset<T, FamilyBackgroundAggregateArgs>): Prisma.PrismaPromise<GetFamilyBackgroundAggregateType<T>>

    /**
     * Group by FamilyBackground.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FamilyBackgroundGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FamilyBackgroundGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FamilyBackgroundGroupByArgs['orderBy'] }
        : { orderBy?: FamilyBackgroundGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FamilyBackgroundGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFamilyBackgroundGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the FamilyBackground model
   */
  readonly fields: FamilyBackgroundFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for FamilyBackground.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FamilyBackgroundClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    employee<T extends EmployeeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EmployeeDefaultArgs<ExtArgs>>): Prisma__EmployeeClient<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the FamilyBackground model
   */ 
  interface FamilyBackgroundFieldRefs {
    readonly id: FieldRef<"FamilyBackground", 'Int'>
    readonly employeeId: FieldRef<"FamilyBackground", 'Int'>
    readonly spouseFirstName: FieldRef<"FamilyBackground", 'String'>
    readonly spouseLastName: FieldRef<"FamilyBackground", 'String'>
    readonly spouseMiddleName: FieldRef<"FamilyBackground", 'String'>
    readonly spouseOccupation: FieldRef<"FamilyBackground", 'String'>
    readonly spouseEmployer: FieldRef<"FamilyBackground", 'String'>
    readonly spouseBusinessAddress: FieldRef<"FamilyBackground", 'String'>
    readonly spouseTelephone: FieldRef<"FamilyBackground", 'String'>
    readonly fatherFirstName: FieldRef<"FamilyBackground", 'String'>
    readonly fatherLastName: FieldRef<"FamilyBackground", 'String'>
    readonly fatherMiddleName: FieldRef<"FamilyBackground", 'String'>
    readonly motherMaidenFirst: FieldRef<"FamilyBackground", 'String'>
    readonly motherMaidenLast: FieldRef<"FamilyBackground", 'String'>
    readonly motherMaidenMiddle: FieldRef<"FamilyBackground", 'String'>
  }
    

  // Custom InputTypes
  /**
   * FamilyBackground findUnique
   */
  export type FamilyBackgroundFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FamilyBackground
     */
    select?: FamilyBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FamilyBackgroundInclude<ExtArgs> | null
    /**
     * Filter, which FamilyBackground to fetch.
     */
    where: FamilyBackgroundWhereUniqueInput
  }

  /**
   * FamilyBackground findUniqueOrThrow
   */
  export type FamilyBackgroundFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FamilyBackground
     */
    select?: FamilyBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FamilyBackgroundInclude<ExtArgs> | null
    /**
     * Filter, which FamilyBackground to fetch.
     */
    where: FamilyBackgroundWhereUniqueInput
  }

  /**
   * FamilyBackground findFirst
   */
  export type FamilyBackgroundFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FamilyBackground
     */
    select?: FamilyBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FamilyBackgroundInclude<ExtArgs> | null
    /**
     * Filter, which FamilyBackground to fetch.
     */
    where?: FamilyBackgroundWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FamilyBackgrounds to fetch.
     */
    orderBy?: FamilyBackgroundOrderByWithRelationInput | FamilyBackgroundOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FamilyBackgrounds.
     */
    cursor?: FamilyBackgroundWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FamilyBackgrounds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FamilyBackgrounds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FamilyBackgrounds.
     */
    distinct?: FamilyBackgroundScalarFieldEnum | FamilyBackgroundScalarFieldEnum[]
  }

  /**
   * FamilyBackground findFirstOrThrow
   */
  export type FamilyBackgroundFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FamilyBackground
     */
    select?: FamilyBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FamilyBackgroundInclude<ExtArgs> | null
    /**
     * Filter, which FamilyBackground to fetch.
     */
    where?: FamilyBackgroundWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FamilyBackgrounds to fetch.
     */
    orderBy?: FamilyBackgroundOrderByWithRelationInput | FamilyBackgroundOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FamilyBackgrounds.
     */
    cursor?: FamilyBackgroundWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FamilyBackgrounds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FamilyBackgrounds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FamilyBackgrounds.
     */
    distinct?: FamilyBackgroundScalarFieldEnum | FamilyBackgroundScalarFieldEnum[]
  }

  /**
   * FamilyBackground findMany
   */
  export type FamilyBackgroundFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FamilyBackground
     */
    select?: FamilyBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FamilyBackgroundInclude<ExtArgs> | null
    /**
     * Filter, which FamilyBackgrounds to fetch.
     */
    where?: FamilyBackgroundWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FamilyBackgrounds to fetch.
     */
    orderBy?: FamilyBackgroundOrderByWithRelationInput | FamilyBackgroundOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing FamilyBackgrounds.
     */
    cursor?: FamilyBackgroundWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FamilyBackgrounds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FamilyBackgrounds.
     */
    skip?: number
    distinct?: FamilyBackgroundScalarFieldEnum | FamilyBackgroundScalarFieldEnum[]
  }

  /**
   * FamilyBackground create
   */
  export type FamilyBackgroundCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FamilyBackground
     */
    select?: FamilyBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FamilyBackgroundInclude<ExtArgs> | null
    /**
     * The data needed to create a FamilyBackground.
     */
    data: XOR<FamilyBackgroundCreateInput, FamilyBackgroundUncheckedCreateInput>
  }

  /**
   * FamilyBackground createMany
   */
  export type FamilyBackgroundCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many FamilyBackgrounds.
     */
    data: FamilyBackgroundCreateManyInput | FamilyBackgroundCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * FamilyBackground update
   */
  export type FamilyBackgroundUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FamilyBackground
     */
    select?: FamilyBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FamilyBackgroundInclude<ExtArgs> | null
    /**
     * The data needed to update a FamilyBackground.
     */
    data: XOR<FamilyBackgroundUpdateInput, FamilyBackgroundUncheckedUpdateInput>
    /**
     * Choose, which FamilyBackground to update.
     */
    where: FamilyBackgroundWhereUniqueInput
  }

  /**
   * FamilyBackground updateMany
   */
  export type FamilyBackgroundUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update FamilyBackgrounds.
     */
    data: XOR<FamilyBackgroundUpdateManyMutationInput, FamilyBackgroundUncheckedUpdateManyInput>
    /**
     * Filter which FamilyBackgrounds to update
     */
    where?: FamilyBackgroundWhereInput
  }

  /**
   * FamilyBackground upsert
   */
  export type FamilyBackgroundUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FamilyBackground
     */
    select?: FamilyBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FamilyBackgroundInclude<ExtArgs> | null
    /**
     * The filter to search for the FamilyBackground to update in case it exists.
     */
    where: FamilyBackgroundWhereUniqueInput
    /**
     * In case the FamilyBackground found by the `where` argument doesn't exist, create a new FamilyBackground with this data.
     */
    create: XOR<FamilyBackgroundCreateInput, FamilyBackgroundUncheckedCreateInput>
    /**
     * In case the FamilyBackground was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FamilyBackgroundUpdateInput, FamilyBackgroundUncheckedUpdateInput>
  }

  /**
   * FamilyBackground delete
   */
  export type FamilyBackgroundDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FamilyBackground
     */
    select?: FamilyBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FamilyBackgroundInclude<ExtArgs> | null
    /**
     * Filter which FamilyBackground to delete.
     */
    where: FamilyBackgroundWhereUniqueInput
  }

  /**
   * FamilyBackground deleteMany
   */
  export type FamilyBackgroundDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FamilyBackgrounds to delete
     */
    where?: FamilyBackgroundWhereInput
  }

  /**
   * FamilyBackground without action
   */
  export type FamilyBackgroundDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FamilyBackground
     */
    select?: FamilyBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FamilyBackgroundInclude<ExtArgs> | null
  }


  /**
   * Model ChildRecord
   */

  export type AggregateChildRecord = {
    _count: ChildRecordCountAggregateOutputType | null
    _avg: ChildRecordAvgAggregateOutputType | null
    _sum: ChildRecordSumAggregateOutputType | null
    _min: ChildRecordMinAggregateOutputType | null
    _max: ChildRecordMaxAggregateOutputType | null
  }

  export type ChildRecordAvgAggregateOutputType = {
    id: number | null
    employeeId: number | null
  }

  export type ChildRecordSumAggregateOutputType = {
    id: number | null
    employeeId: number | null
  }

  export type ChildRecordMinAggregateOutputType = {
    id: number | null
    employeeId: number | null
    name: string | null
    dateOfBirth: Date | null
  }

  export type ChildRecordMaxAggregateOutputType = {
    id: number | null
    employeeId: number | null
    name: string | null
    dateOfBirth: Date | null
  }

  export type ChildRecordCountAggregateOutputType = {
    id: number
    employeeId: number
    name: number
    dateOfBirth: number
    _all: number
  }


  export type ChildRecordAvgAggregateInputType = {
    id?: true
    employeeId?: true
  }

  export type ChildRecordSumAggregateInputType = {
    id?: true
    employeeId?: true
  }

  export type ChildRecordMinAggregateInputType = {
    id?: true
    employeeId?: true
    name?: true
    dateOfBirth?: true
  }

  export type ChildRecordMaxAggregateInputType = {
    id?: true
    employeeId?: true
    name?: true
    dateOfBirth?: true
  }

  export type ChildRecordCountAggregateInputType = {
    id?: true
    employeeId?: true
    name?: true
    dateOfBirth?: true
    _all?: true
  }

  export type ChildRecordAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChildRecord to aggregate.
     */
    where?: ChildRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChildRecords to fetch.
     */
    orderBy?: ChildRecordOrderByWithRelationInput | ChildRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ChildRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChildRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChildRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ChildRecords
    **/
    _count?: true | ChildRecordCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ChildRecordAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ChildRecordSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ChildRecordMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ChildRecordMaxAggregateInputType
  }

  export type GetChildRecordAggregateType<T extends ChildRecordAggregateArgs> = {
        [P in keyof T & keyof AggregateChildRecord]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChildRecord[P]>
      : GetScalarType<T[P], AggregateChildRecord[P]>
  }




  export type ChildRecordGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChildRecordWhereInput
    orderBy?: ChildRecordOrderByWithAggregationInput | ChildRecordOrderByWithAggregationInput[]
    by: ChildRecordScalarFieldEnum[] | ChildRecordScalarFieldEnum
    having?: ChildRecordScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ChildRecordCountAggregateInputType | true
    _avg?: ChildRecordAvgAggregateInputType
    _sum?: ChildRecordSumAggregateInputType
    _min?: ChildRecordMinAggregateInputType
    _max?: ChildRecordMaxAggregateInputType
  }

  export type ChildRecordGroupByOutputType = {
    id: number
    employeeId: number
    name: string
    dateOfBirth: Date
    _count: ChildRecordCountAggregateOutputType | null
    _avg: ChildRecordAvgAggregateOutputType | null
    _sum: ChildRecordSumAggregateOutputType | null
    _min: ChildRecordMinAggregateOutputType | null
    _max: ChildRecordMaxAggregateOutputType | null
  }

  type GetChildRecordGroupByPayload<T extends ChildRecordGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ChildRecordGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ChildRecordGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChildRecordGroupByOutputType[P]>
            : GetScalarType<T[P], ChildRecordGroupByOutputType[P]>
        }
      >
    >


  export type ChildRecordSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    employeeId?: boolean
    name?: boolean
    dateOfBirth?: boolean
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["childRecord"]>


  export type ChildRecordSelectScalar = {
    id?: boolean
    employeeId?: boolean
    name?: boolean
    dateOfBirth?: boolean
  }

  export type ChildRecordInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }

  export type $ChildRecordPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ChildRecord"
    objects: {
      employee: Prisma.$EmployeePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      employeeId: number
      name: string
      dateOfBirth: Date
    }, ExtArgs["result"]["childRecord"]>
    composites: {}
  }

  type ChildRecordGetPayload<S extends boolean | null | undefined | ChildRecordDefaultArgs> = $Result.GetResult<Prisma.$ChildRecordPayload, S>

  type ChildRecordCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ChildRecordFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ChildRecordCountAggregateInputType | true
    }

  export interface ChildRecordDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ChildRecord'], meta: { name: 'ChildRecord' } }
    /**
     * Find zero or one ChildRecord that matches the filter.
     * @param {ChildRecordFindUniqueArgs} args - Arguments to find a ChildRecord
     * @example
     * // Get one ChildRecord
     * const childRecord = await prisma.childRecord.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ChildRecordFindUniqueArgs>(args: SelectSubset<T, ChildRecordFindUniqueArgs<ExtArgs>>): Prisma__ChildRecordClient<$Result.GetResult<Prisma.$ChildRecordPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ChildRecord that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ChildRecordFindUniqueOrThrowArgs} args - Arguments to find a ChildRecord
     * @example
     * // Get one ChildRecord
     * const childRecord = await prisma.childRecord.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ChildRecordFindUniqueOrThrowArgs>(args: SelectSubset<T, ChildRecordFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ChildRecordClient<$Result.GetResult<Prisma.$ChildRecordPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ChildRecord that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChildRecordFindFirstArgs} args - Arguments to find a ChildRecord
     * @example
     * // Get one ChildRecord
     * const childRecord = await prisma.childRecord.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ChildRecordFindFirstArgs>(args?: SelectSubset<T, ChildRecordFindFirstArgs<ExtArgs>>): Prisma__ChildRecordClient<$Result.GetResult<Prisma.$ChildRecordPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ChildRecord that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChildRecordFindFirstOrThrowArgs} args - Arguments to find a ChildRecord
     * @example
     * // Get one ChildRecord
     * const childRecord = await prisma.childRecord.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ChildRecordFindFirstOrThrowArgs>(args?: SelectSubset<T, ChildRecordFindFirstOrThrowArgs<ExtArgs>>): Prisma__ChildRecordClient<$Result.GetResult<Prisma.$ChildRecordPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ChildRecords that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChildRecordFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ChildRecords
     * const childRecords = await prisma.childRecord.findMany()
     * 
     * // Get first 10 ChildRecords
     * const childRecords = await prisma.childRecord.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const childRecordWithIdOnly = await prisma.childRecord.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ChildRecordFindManyArgs>(args?: SelectSubset<T, ChildRecordFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChildRecordPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ChildRecord.
     * @param {ChildRecordCreateArgs} args - Arguments to create a ChildRecord.
     * @example
     * // Create one ChildRecord
     * const ChildRecord = await prisma.childRecord.create({
     *   data: {
     *     // ... data to create a ChildRecord
     *   }
     * })
     * 
     */
    create<T extends ChildRecordCreateArgs>(args: SelectSubset<T, ChildRecordCreateArgs<ExtArgs>>): Prisma__ChildRecordClient<$Result.GetResult<Prisma.$ChildRecordPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ChildRecords.
     * @param {ChildRecordCreateManyArgs} args - Arguments to create many ChildRecords.
     * @example
     * // Create many ChildRecords
     * const childRecord = await prisma.childRecord.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ChildRecordCreateManyArgs>(args?: SelectSubset<T, ChildRecordCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a ChildRecord.
     * @param {ChildRecordDeleteArgs} args - Arguments to delete one ChildRecord.
     * @example
     * // Delete one ChildRecord
     * const ChildRecord = await prisma.childRecord.delete({
     *   where: {
     *     // ... filter to delete one ChildRecord
     *   }
     * })
     * 
     */
    delete<T extends ChildRecordDeleteArgs>(args: SelectSubset<T, ChildRecordDeleteArgs<ExtArgs>>): Prisma__ChildRecordClient<$Result.GetResult<Prisma.$ChildRecordPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ChildRecord.
     * @param {ChildRecordUpdateArgs} args - Arguments to update one ChildRecord.
     * @example
     * // Update one ChildRecord
     * const childRecord = await prisma.childRecord.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ChildRecordUpdateArgs>(args: SelectSubset<T, ChildRecordUpdateArgs<ExtArgs>>): Prisma__ChildRecordClient<$Result.GetResult<Prisma.$ChildRecordPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ChildRecords.
     * @param {ChildRecordDeleteManyArgs} args - Arguments to filter ChildRecords to delete.
     * @example
     * // Delete a few ChildRecords
     * const { count } = await prisma.childRecord.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ChildRecordDeleteManyArgs>(args?: SelectSubset<T, ChildRecordDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ChildRecords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChildRecordUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ChildRecords
     * const childRecord = await prisma.childRecord.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ChildRecordUpdateManyArgs>(args: SelectSubset<T, ChildRecordUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ChildRecord.
     * @param {ChildRecordUpsertArgs} args - Arguments to update or create a ChildRecord.
     * @example
     * // Update or create a ChildRecord
     * const childRecord = await prisma.childRecord.upsert({
     *   create: {
     *     // ... data to create a ChildRecord
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ChildRecord we want to update
     *   }
     * })
     */
    upsert<T extends ChildRecordUpsertArgs>(args: SelectSubset<T, ChildRecordUpsertArgs<ExtArgs>>): Prisma__ChildRecordClient<$Result.GetResult<Prisma.$ChildRecordPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ChildRecords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChildRecordCountArgs} args - Arguments to filter ChildRecords to count.
     * @example
     * // Count the number of ChildRecords
     * const count = await prisma.childRecord.count({
     *   where: {
     *     // ... the filter for the ChildRecords we want to count
     *   }
     * })
    **/
    count<T extends ChildRecordCountArgs>(
      args?: Subset<T, ChildRecordCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChildRecordCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ChildRecord.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChildRecordAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ChildRecordAggregateArgs>(args: Subset<T, ChildRecordAggregateArgs>): Prisma.PrismaPromise<GetChildRecordAggregateType<T>>

    /**
     * Group by ChildRecord.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChildRecordGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ChildRecordGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChildRecordGroupByArgs['orderBy'] }
        : { orderBy?: ChildRecordGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ChildRecordGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChildRecordGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ChildRecord model
   */
  readonly fields: ChildRecordFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ChildRecord.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ChildRecordClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    employee<T extends EmployeeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EmployeeDefaultArgs<ExtArgs>>): Prisma__EmployeeClient<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ChildRecord model
   */ 
  interface ChildRecordFieldRefs {
    readonly id: FieldRef<"ChildRecord", 'Int'>
    readonly employeeId: FieldRef<"ChildRecord", 'Int'>
    readonly name: FieldRef<"ChildRecord", 'String'>
    readonly dateOfBirth: FieldRef<"ChildRecord", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ChildRecord findUnique
   */
  export type ChildRecordFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChildRecord
     */
    select?: ChildRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChildRecordInclude<ExtArgs> | null
    /**
     * Filter, which ChildRecord to fetch.
     */
    where: ChildRecordWhereUniqueInput
  }

  /**
   * ChildRecord findUniqueOrThrow
   */
  export type ChildRecordFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChildRecord
     */
    select?: ChildRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChildRecordInclude<ExtArgs> | null
    /**
     * Filter, which ChildRecord to fetch.
     */
    where: ChildRecordWhereUniqueInput
  }

  /**
   * ChildRecord findFirst
   */
  export type ChildRecordFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChildRecord
     */
    select?: ChildRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChildRecordInclude<ExtArgs> | null
    /**
     * Filter, which ChildRecord to fetch.
     */
    where?: ChildRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChildRecords to fetch.
     */
    orderBy?: ChildRecordOrderByWithRelationInput | ChildRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChildRecords.
     */
    cursor?: ChildRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChildRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChildRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChildRecords.
     */
    distinct?: ChildRecordScalarFieldEnum | ChildRecordScalarFieldEnum[]
  }

  /**
   * ChildRecord findFirstOrThrow
   */
  export type ChildRecordFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChildRecord
     */
    select?: ChildRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChildRecordInclude<ExtArgs> | null
    /**
     * Filter, which ChildRecord to fetch.
     */
    where?: ChildRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChildRecords to fetch.
     */
    orderBy?: ChildRecordOrderByWithRelationInput | ChildRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChildRecords.
     */
    cursor?: ChildRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChildRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChildRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChildRecords.
     */
    distinct?: ChildRecordScalarFieldEnum | ChildRecordScalarFieldEnum[]
  }

  /**
   * ChildRecord findMany
   */
  export type ChildRecordFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChildRecord
     */
    select?: ChildRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChildRecordInclude<ExtArgs> | null
    /**
     * Filter, which ChildRecords to fetch.
     */
    where?: ChildRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChildRecords to fetch.
     */
    orderBy?: ChildRecordOrderByWithRelationInput | ChildRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ChildRecords.
     */
    cursor?: ChildRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChildRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChildRecords.
     */
    skip?: number
    distinct?: ChildRecordScalarFieldEnum | ChildRecordScalarFieldEnum[]
  }

  /**
   * ChildRecord create
   */
  export type ChildRecordCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChildRecord
     */
    select?: ChildRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChildRecordInclude<ExtArgs> | null
    /**
     * The data needed to create a ChildRecord.
     */
    data: XOR<ChildRecordCreateInput, ChildRecordUncheckedCreateInput>
  }

  /**
   * ChildRecord createMany
   */
  export type ChildRecordCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ChildRecords.
     */
    data: ChildRecordCreateManyInput | ChildRecordCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ChildRecord update
   */
  export type ChildRecordUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChildRecord
     */
    select?: ChildRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChildRecordInclude<ExtArgs> | null
    /**
     * The data needed to update a ChildRecord.
     */
    data: XOR<ChildRecordUpdateInput, ChildRecordUncheckedUpdateInput>
    /**
     * Choose, which ChildRecord to update.
     */
    where: ChildRecordWhereUniqueInput
  }

  /**
   * ChildRecord updateMany
   */
  export type ChildRecordUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ChildRecords.
     */
    data: XOR<ChildRecordUpdateManyMutationInput, ChildRecordUncheckedUpdateManyInput>
    /**
     * Filter which ChildRecords to update
     */
    where?: ChildRecordWhereInput
  }

  /**
   * ChildRecord upsert
   */
  export type ChildRecordUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChildRecord
     */
    select?: ChildRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChildRecordInclude<ExtArgs> | null
    /**
     * The filter to search for the ChildRecord to update in case it exists.
     */
    where: ChildRecordWhereUniqueInput
    /**
     * In case the ChildRecord found by the `where` argument doesn't exist, create a new ChildRecord with this data.
     */
    create: XOR<ChildRecordCreateInput, ChildRecordUncheckedCreateInput>
    /**
     * In case the ChildRecord was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChildRecordUpdateInput, ChildRecordUncheckedUpdateInput>
  }

  /**
   * ChildRecord delete
   */
  export type ChildRecordDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChildRecord
     */
    select?: ChildRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChildRecordInclude<ExtArgs> | null
    /**
     * Filter which ChildRecord to delete.
     */
    where: ChildRecordWhereUniqueInput
  }

  /**
   * ChildRecord deleteMany
   */
  export type ChildRecordDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChildRecords to delete
     */
    where?: ChildRecordWhereInput
  }

  /**
   * ChildRecord without action
   */
  export type ChildRecordDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChildRecord
     */
    select?: ChildRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChildRecordInclude<ExtArgs> | null
  }


  /**
   * Model EducationalBackground
   */

  export type AggregateEducationalBackground = {
    _count: EducationalBackgroundCountAggregateOutputType | null
    _avg: EducationalBackgroundAvgAggregateOutputType | null
    _sum: EducationalBackgroundSumAggregateOutputType | null
    _min: EducationalBackgroundMinAggregateOutputType | null
    _max: EducationalBackgroundMaxAggregateOutputType | null
  }

  export type EducationalBackgroundAvgAggregateOutputType = {
    id: number | null
    employeeId: number | null
  }

  export type EducationalBackgroundSumAggregateOutputType = {
    id: number | null
    employeeId: number | null
  }

  export type EducationalBackgroundMinAggregateOutputType = {
    id: number | null
    employeeId: number | null
    level: string | null
    schoolName: string | null
    degreeCourse: string | null
    yearGraduated: string | null
    highestLevelEarned: string | null
    dateFrom: Date | null
    dateTo: Date | null
    scholarships: string | null
  }

  export type EducationalBackgroundMaxAggregateOutputType = {
    id: number | null
    employeeId: number | null
    level: string | null
    schoolName: string | null
    degreeCourse: string | null
    yearGraduated: string | null
    highestLevelEarned: string | null
    dateFrom: Date | null
    dateTo: Date | null
    scholarships: string | null
  }

  export type EducationalBackgroundCountAggregateOutputType = {
    id: number
    employeeId: number
    level: number
    schoolName: number
    degreeCourse: number
    yearGraduated: number
    highestLevelEarned: number
    dateFrom: number
    dateTo: number
    scholarships: number
    _all: number
  }


  export type EducationalBackgroundAvgAggregateInputType = {
    id?: true
    employeeId?: true
  }

  export type EducationalBackgroundSumAggregateInputType = {
    id?: true
    employeeId?: true
  }

  export type EducationalBackgroundMinAggregateInputType = {
    id?: true
    employeeId?: true
    level?: true
    schoolName?: true
    degreeCourse?: true
    yearGraduated?: true
    highestLevelEarned?: true
    dateFrom?: true
    dateTo?: true
    scholarships?: true
  }

  export type EducationalBackgroundMaxAggregateInputType = {
    id?: true
    employeeId?: true
    level?: true
    schoolName?: true
    degreeCourse?: true
    yearGraduated?: true
    highestLevelEarned?: true
    dateFrom?: true
    dateTo?: true
    scholarships?: true
  }

  export type EducationalBackgroundCountAggregateInputType = {
    id?: true
    employeeId?: true
    level?: true
    schoolName?: true
    degreeCourse?: true
    yearGraduated?: true
    highestLevelEarned?: true
    dateFrom?: true
    dateTo?: true
    scholarships?: true
    _all?: true
  }

  export type EducationalBackgroundAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EducationalBackground to aggregate.
     */
    where?: EducationalBackgroundWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EducationalBackgrounds to fetch.
     */
    orderBy?: EducationalBackgroundOrderByWithRelationInput | EducationalBackgroundOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EducationalBackgroundWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EducationalBackgrounds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EducationalBackgrounds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EducationalBackgrounds
    **/
    _count?: true | EducationalBackgroundCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EducationalBackgroundAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EducationalBackgroundSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EducationalBackgroundMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EducationalBackgroundMaxAggregateInputType
  }

  export type GetEducationalBackgroundAggregateType<T extends EducationalBackgroundAggregateArgs> = {
        [P in keyof T & keyof AggregateEducationalBackground]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEducationalBackground[P]>
      : GetScalarType<T[P], AggregateEducationalBackground[P]>
  }




  export type EducationalBackgroundGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EducationalBackgroundWhereInput
    orderBy?: EducationalBackgroundOrderByWithAggregationInput | EducationalBackgroundOrderByWithAggregationInput[]
    by: EducationalBackgroundScalarFieldEnum[] | EducationalBackgroundScalarFieldEnum
    having?: EducationalBackgroundScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EducationalBackgroundCountAggregateInputType | true
    _avg?: EducationalBackgroundAvgAggregateInputType
    _sum?: EducationalBackgroundSumAggregateInputType
    _min?: EducationalBackgroundMinAggregateInputType
    _max?: EducationalBackgroundMaxAggregateInputType
  }

  export type EducationalBackgroundGroupByOutputType = {
    id: number
    employeeId: number
    level: string
    schoolName: string
    degreeCourse: string | null
    yearGraduated: string | null
    highestLevelEarned: string | null
    dateFrom: Date | null
    dateTo: Date | null
    scholarships: string | null
    _count: EducationalBackgroundCountAggregateOutputType | null
    _avg: EducationalBackgroundAvgAggregateOutputType | null
    _sum: EducationalBackgroundSumAggregateOutputType | null
    _min: EducationalBackgroundMinAggregateOutputType | null
    _max: EducationalBackgroundMaxAggregateOutputType | null
  }

  type GetEducationalBackgroundGroupByPayload<T extends EducationalBackgroundGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EducationalBackgroundGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EducationalBackgroundGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EducationalBackgroundGroupByOutputType[P]>
            : GetScalarType<T[P], EducationalBackgroundGroupByOutputType[P]>
        }
      >
    >


  export type EducationalBackgroundSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    employeeId?: boolean
    level?: boolean
    schoolName?: boolean
    degreeCourse?: boolean
    yearGraduated?: boolean
    highestLevelEarned?: boolean
    dateFrom?: boolean
    dateTo?: boolean
    scholarships?: boolean
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["educationalBackground"]>


  export type EducationalBackgroundSelectScalar = {
    id?: boolean
    employeeId?: boolean
    level?: boolean
    schoolName?: boolean
    degreeCourse?: boolean
    yearGraduated?: boolean
    highestLevelEarned?: boolean
    dateFrom?: boolean
    dateTo?: boolean
    scholarships?: boolean
  }

  export type EducationalBackgroundInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }

  export type $EducationalBackgroundPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EducationalBackground"
    objects: {
      employee: Prisma.$EmployeePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      employeeId: number
      level: string
      schoolName: string
      degreeCourse: string | null
      yearGraduated: string | null
      highestLevelEarned: string | null
      dateFrom: Date | null
      dateTo: Date | null
      scholarships: string | null
    }, ExtArgs["result"]["educationalBackground"]>
    composites: {}
  }

  type EducationalBackgroundGetPayload<S extends boolean | null | undefined | EducationalBackgroundDefaultArgs> = $Result.GetResult<Prisma.$EducationalBackgroundPayload, S>

  type EducationalBackgroundCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<EducationalBackgroundFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: EducationalBackgroundCountAggregateInputType | true
    }

  export interface EducationalBackgroundDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EducationalBackground'], meta: { name: 'EducationalBackground' } }
    /**
     * Find zero or one EducationalBackground that matches the filter.
     * @param {EducationalBackgroundFindUniqueArgs} args - Arguments to find a EducationalBackground
     * @example
     * // Get one EducationalBackground
     * const educationalBackground = await prisma.educationalBackground.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EducationalBackgroundFindUniqueArgs>(args: SelectSubset<T, EducationalBackgroundFindUniqueArgs<ExtArgs>>): Prisma__EducationalBackgroundClient<$Result.GetResult<Prisma.$EducationalBackgroundPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one EducationalBackground that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {EducationalBackgroundFindUniqueOrThrowArgs} args - Arguments to find a EducationalBackground
     * @example
     * // Get one EducationalBackground
     * const educationalBackground = await prisma.educationalBackground.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EducationalBackgroundFindUniqueOrThrowArgs>(args: SelectSubset<T, EducationalBackgroundFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EducationalBackgroundClient<$Result.GetResult<Prisma.$EducationalBackgroundPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first EducationalBackground that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EducationalBackgroundFindFirstArgs} args - Arguments to find a EducationalBackground
     * @example
     * // Get one EducationalBackground
     * const educationalBackground = await prisma.educationalBackground.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EducationalBackgroundFindFirstArgs>(args?: SelectSubset<T, EducationalBackgroundFindFirstArgs<ExtArgs>>): Prisma__EducationalBackgroundClient<$Result.GetResult<Prisma.$EducationalBackgroundPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first EducationalBackground that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EducationalBackgroundFindFirstOrThrowArgs} args - Arguments to find a EducationalBackground
     * @example
     * // Get one EducationalBackground
     * const educationalBackground = await prisma.educationalBackground.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EducationalBackgroundFindFirstOrThrowArgs>(args?: SelectSubset<T, EducationalBackgroundFindFirstOrThrowArgs<ExtArgs>>): Prisma__EducationalBackgroundClient<$Result.GetResult<Prisma.$EducationalBackgroundPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more EducationalBackgrounds that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EducationalBackgroundFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EducationalBackgrounds
     * const educationalBackgrounds = await prisma.educationalBackground.findMany()
     * 
     * // Get first 10 EducationalBackgrounds
     * const educationalBackgrounds = await prisma.educationalBackground.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const educationalBackgroundWithIdOnly = await prisma.educationalBackground.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EducationalBackgroundFindManyArgs>(args?: SelectSubset<T, EducationalBackgroundFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EducationalBackgroundPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a EducationalBackground.
     * @param {EducationalBackgroundCreateArgs} args - Arguments to create a EducationalBackground.
     * @example
     * // Create one EducationalBackground
     * const EducationalBackground = await prisma.educationalBackground.create({
     *   data: {
     *     // ... data to create a EducationalBackground
     *   }
     * })
     * 
     */
    create<T extends EducationalBackgroundCreateArgs>(args: SelectSubset<T, EducationalBackgroundCreateArgs<ExtArgs>>): Prisma__EducationalBackgroundClient<$Result.GetResult<Prisma.$EducationalBackgroundPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many EducationalBackgrounds.
     * @param {EducationalBackgroundCreateManyArgs} args - Arguments to create many EducationalBackgrounds.
     * @example
     * // Create many EducationalBackgrounds
     * const educationalBackground = await prisma.educationalBackground.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EducationalBackgroundCreateManyArgs>(args?: SelectSubset<T, EducationalBackgroundCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a EducationalBackground.
     * @param {EducationalBackgroundDeleteArgs} args - Arguments to delete one EducationalBackground.
     * @example
     * // Delete one EducationalBackground
     * const EducationalBackground = await prisma.educationalBackground.delete({
     *   where: {
     *     // ... filter to delete one EducationalBackground
     *   }
     * })
     * 
     */
    delete<T extends EducationalBackgroundDeleteArgs>(args: SelectSubset<T, EducationalBackgroundDeleteArgs<ExtArgs>>): Prisma__EducationalBackgroundClient<$Result.GetResult<Prisma.$EducationalBackgroundPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one EducationalBackground.
     * @param {EducationalBackgroundUpdateArgs} args - Arguments to update one EducationalBackground.
     * @example
     * // Update one EducationalBackground
     * const educationalBackground = await prisma.educationalBackground.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EducationalBackgroundUpdateArgs>(args: SelectSubset<T, EducationalBackgroundUpdateArgs<ExtArgs>>): Prisma__EducationalBackgroundClient<$Result.GetResult<Prisma.$EducationalBackgroundPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more EducationalBackgrounds.
     * @param {EducationalBackgroundDeleteManyArgs} args - Arguments to filter EducationalBackgrounds to delete.
     * @example
     * // Delete a few EducationalBackgrounds
     * const { count } = await prisma.educationalBackground.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EducationalBackgroundDeleteManyArgs>(args?: SelectSubset<T, EducationalBackgroundDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EducationalBackgrounds.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EducationalBackgroundUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EducationalBackgrounds
     * const educationalBackground = await prisma.educationalBackground.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EducationalBackgroundUpdateManyArgs>(args: SelectSubset<T, EducationalBackgroundUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one EducationalBackground.
     * @param {EducationalBackgroundUpsertArgs} args - Arguments to update or create a EducationalBackground.
     * @example
     * // Update or create a EducationalBackground
     * const educationalBackground = await prisma.educationalBackground.upsert({
     *   create: {
     *     // ... data to create a EducationalBackground
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EducationalBackground we want to update
     *   }
     * })
     */
    upsert<T extends EducationalBackgroundUpsertArgs>(args: SelectSubset<T, EducationalBackgroundUpsertArgs<ExtArgs>>): Prisma__EducationalBackgroundClient<$Result.GetResult<Prisma.$EducationalBackgroundPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of EducationalBackgrounds.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EducationalBackgroundCountArgs} args - Arguments to filter EducationalBackgrounds to count.
     * @example
     * // Count the number of EducationalBackgrounds
     * const count = await prisma.educationalBackground.count({
     *   where: {
     *     // ... the filter for the EducationalBackgrounds we want to count
     *   }
     * })
    **/
    count<T extends EducationalBackgroundCountArgs>(
      args?: Subset<T, EducationalBackgroundCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EducationalBackgroundCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EducationalBackground.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EducationalBackgroundAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EducationalBackgroundAggregateArgs>(args: Subset<T, EducationalBackgroundAggregateArgs>): Prisma.PrismaPromise<GetEducationalBackgroundAggregateType<T>>

    /**
     * Group by EducationalBackground.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EducationalBackgroundGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EducationalBackgroundGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EducationalBackgroundGroupByArgs['orderBy'] }
        : { orderBy?: EducationalBackgroundGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EducationalBackgroundGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEducationalBackgroundGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EducationalBackground model
   */
  readonly fields: EducationalBackgroundFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EducationalBackground.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EducationalBackgroundClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    employee<T extends EmployeeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EmployeeDefaultArgs<ExtArgs>>): Prisma__EmployeeClient<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EducationalBackground model
   */ 
  interface EducationalBackgroundFieldRefs {
    readonly id: FieldRef<"EducationalBackground", 'Int'>
    readonly employeeId: FieldRef<"EducationalBackground", 'Int'>
    readonly level: FieldRef<"EducationalBackground", 'String'>
    readonly schoolName: FieldRef<"EducationalBackground", 'String'>
    readonly degreeCourse: FieldRef<"EducationalBackground", 'String'>
    readonly yearGraduated: FieldRef<"EducationalBackground", 'String'>
    readonly highestLevelEarned: FieldRef<"EducationalBackground", 'String'>
    readonly dateFrom: FieldRef<"EducationalBackground", 'DateTime'>
    readonly dateTo: FieldRef<"EducationalBackground", 'DateTime'>
    readonly scholarships: FieldRef<"EducationalBackground", 'String'>
  }
    

  // Custom InputTypes
  /**
   * EducationalBackground findUnique
   */
  export type EducationalBackgroundFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EducationalBackground
     */
    select?: EducationalBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EducationalBackgroundInclude<ExtArgs> | null
    /**
     * Filter, which EducationalBackground to fetch.
     */
    where: EducationalBackgroundWhereUniqueInput
  }

  /**
   * EducationalBackground findUniqueOrThrow
   */
  export type EducationalBackgroundFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EducationalBackground
     */
    select?: EducationalBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EducationalBackgroundInclude<ExtArgs> | null
    /**
     * Filter, which EducationalBackground to fetch.
     */
    where: EducationalBackgroundWhereUniqueInput
  }

  /**
   * EducationalBackground findFirst
   */
  export type EducationalBackgroundFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EducationalBackground
     */
    select?: EducationalBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EducationalBackgroundInclude<ExtArgs> | null
    /**
     * Filter, which EducationalBackground to fetch.
     */
    where?: EducationalBackgroundWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EducationalBackgrounds to fetch.
     */
    orderBy?: EducationalBackgroundOrderByWithRelationInput | EducationalBackgroundOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EducationalBackgrounds.
     */
    cursor?: EducationalBackgroundWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EducationalBackgrounds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EducationalBackgrounds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EducationalBackgrounds.
     */
    distinct?: EducationalBackgroundScalarFieldEnum | EducationalBackgroundScalarFieldEnum[]
  }

  /**
   * EducationalBackground findFirstOrThrow
   */
  export type EducationalBackgroundFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EducationalBackground
     */
    select?: EducationalBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EducationalBackgroundInclude<ExtArgs> | null
    /**
     * Filter, which EducationalBackground to fetch.
     */
    where?: EducationalBackgroundWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EducationalBackgrounds to fetch.
     */
    orderBy?: EducationalBackgroundOrderByWithRelationInput | EducationalBackgroundOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EducationalBackgrounds.
     */
    cursor?: EducationalBackgroundWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EducationalBackgrounds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EducationalBackgrounds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EducationalBackgrounds.
     */
    distinct?: EducationalBackgroundScalarFieldEnum | EducationalBackgroundScalarFieldEnum[]
  }

  /**
   * EducationalBackground findMany
   */
  export type EducationalBackgroundFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EducationalBackground
     */
    select?: EducationalBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EducationalBackgroundInclude<ExtArgs> | null
    /**
     * Filter, which EducationalBackgrounds to fetch.
     */
    where?: EducationalBackgroundWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EducationalBackgrounds to fetch.
     */
    orderBy?: EducationalBackgroundOrderByWithRelationInput | EducationalBackgroundOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EducationalBackgrounds.
     */
    cursor?: EducationalBackgroundWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EducationalBackgrounds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EducationalBackgrounds.
     */
    skip?: number
    distinct?: EducationalBackgroundScalarFieldEnum | EducationalBackgroundScalarFieldEnum[]
  }

  /**
   * EducationalBackground create
   */
  export type EducationalBackgroundCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EducationalBackground
     */
    select?: EducationalBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EducationalBackgroundInclude<ExtArgs> | null
    /**
     * The data needed to create a EducationalBackground.
     */
    data: XOR<EducationalBackgroundCreateInput, EducationalBackgroundUncheckedCreateInput>
  }

  /**
   * EducationalBackground createMany
   */
  export type EducationalBackgroundCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EducationalBackgrounds.
     */
    data: EducationalBackgroundCreateManyInput | EducationalBackgroundCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EducationalBackground update
   */
  export type EducationalBackgroundUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EducationalBackground
     */
    select?: EducationalBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EducationalBackgroundInclude<ExtArgs> | null
    /**
     * The data needed to update a EducationalBackground.
     */
    data: XOR<EducationalBackgroundUpdateInput, EducationalBackgroundUncheckedUpdateInput>
    /**
     * Choose, which EducationalBackground to update.
     */
    where: EducationalBackgroundWhereUniqueInput
  }

  /**
   * EducationalBackground updateMany
   */
  export type EducationalBackgroundUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EducationalBackgrounds.
     */
    data: XOR<EducationalBackgroundUpdateManyMutationInput, EducationalBackgroundUncheckedUpdateManyInput>
    /**
     * Filter which EducationalBackgrounds to update
     */
    where?: EducationalBackgroundWhereInput
  }

  /**
   * EducationalBackground upsert
   */
  export type EducationalBackgroundUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EducationalBackground
     */
    select?: EducationalBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EducationalBackgroundInclude<ExtArgs> | null
    /**
     * The filter to search for the EducationalBackground to update in case it exists.
     */
    where: EducationalBackgroundWhereUniqueInput
    /**
     * In case the EducationalBackground found by the `where` argument doesn't exist, create a new EducationalBackground with this data.
     */
    create: XOR<EducationalBackgroundCreateInput, EducationalBackgroundUncheckedCreateInput>
    /**
     * In case the EducationalBackground was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EducationalBackgroundUpdateInput, EducationalBackgroundUncheckedUpdateInput>
  }

  /**
   * EducationalBackground delete
   */
  export type EducationalBackgroundDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EducationalBackground
     */
    select?: EducationalBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EducationalBackgroundInclude<ExtArgs> | null
    /**
     * Filter which EducationalBackground to delete.
     */
    where: EducationalBackgroundWhereUniqueInput
  }

  /**
   * EducationalBackground deleteMany
   */
  export type EducationalBackgroundDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EducationalBackgrounds to delete
     */
    where?: EducationalBackgroundWhereInput
  }

  /**
   * EducationalBackground without action
   */
  export type EducationalBackgroundDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EducationalBackground
     */
    select?: EducationalBackgroundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EducationalBackgroundInclude<ExtArgs> | null
  }


  /**
   * Model CivilServiceEligibility
   */

  export type AggregateCivilServiceEligibility = {
    _count: CivilServiceEligibilityCountAggregateOutputType | null
    _avg: CivilServiceEligibilityAvgAggregateOutputType | null
    _sum: CivilServiceEligibilitySumAggregateOutputType | null
    _min: CivilServiceEligibilityMinAggregateOutputType | null
    _max: CivilServiceEligibilityMaxAggregateOutputType | null
  }

  export type CivilServiceEligibilityAvgAggregateOutputType = {
    id: number | null
    employeeId: number | null
    rating: number | null
  }

  export type CivilServiceEligibilitySumAggregateOutputType = {
    id: number | null
    employeeId: number | null
    rating: number | null
  }

  export type CivilServiceEligibilityMinAggregateOutputType = {
    id: number | null
    employeeId: number | null
    careerService: string | null
    rating: number | null
    dateOfExamination: Date | null
    placeOfExamination: string | null
    licenseNo: string | null
    licenseValidity: Date | null
  }

  export type CivilServiceEligibilityMaxAggregateOutputType = {
    id: number | null
    employeeId: number | null
    careerService: string | null
    rating: number | null
    dateOfExamination: Date | null
    placeOfExamination: string | null
    licenseNo: string | null
    licenseValidity: Date | null
  }

  export type CivilServiceEligibilityCountAggregateOutputType = {
    id: number
    employeeId: number
    careerService: number
    rating: number
    dateOfExamination: number
    placeOfExamination: number
    licenseNo: number
    licenseValidity: number
    _all: number
  }


  export type CivilServiceEligibilityAvgAggregateInputType = {
    id?: true
    employeeId?: true
    rating?: true
  }

  export type CivilServiceEligibilitySumAggregateInputType = {
    id?: true
    employeeId?: true
    rating?: true
  }

  export type CivilServiceEligibilityMinAggregateInputType = {
    id?: true
    employeeId?: true
    careerService?: true
    rating?: true
    dateOfExamination?: true
    placeOfExamination?: true
    licenseNo?: true
    licenseValidity?: true
  }

  export type CivilServiceEligibilityMaxAggregateInputType = {
    id?: true
    employeeId?: true
    careerService?: true
    rating?: true
    dateOfExamination?: true
    placeOfExamination?: true
    licenseNo?: true
    licenseValidity?: true
  }

  export type CivilServiceEligibilityCountAggregateInputType = {
    id?: true
    employeeId?: true
    careerService?: true
    rating?: true
    dateOfExamination?: true
    placeOfExamination?: true
    licenseNo?: true
    licenseValidity?: true
    _all?: true
  }

  export type CivilServiceEligibilityAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CivilServiceEligibility to aggregate.
     */
    where?: CivilServiceEligibilityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CivilServiceEligibilities to fetch.
     */
    orderBy?: CivilServiceEligibilityOrderByWithRelationInput | CivilServiceEligibilityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CivilServiceEligibilityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CivilServiceEligibilities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CivilServiceEligibilities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CivilServiceEligibilities
    **/
    _count?: true | CivilServiceEligibilityCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CivilServiceEligibilityAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CivilServiceEligibilitySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CivilServiceEligibilityMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CivilServiceEligibilityMaxAggregateInputType
  }

  export type GetCivilServiceEligibilityAggregateType<T extends CivilServiceEligibilityAggregateArgs> = {
        [P in keyof T & keyof AggregateCivilServiceEligibility]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCivilServiceEligibility[P]>
      : GetScalarType<T[P], AggregateCivilServiceEligibility[P]>
  }




  export type CivilServiceEligibilityGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CivilServiceEligibilityWhereInput
    orderBy?: CivilServiceEligibilityOrderByWithAggregationInput | CivilServiceEligibilityOrderByWithAggregationInput[]
    by: CivilServiceEligibilityScalarFieldEnum[] | CivilServiceEligibilityScalarFieldEnum
    having?: CivilServiceEligibilityScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CivilServiceEligibilityCountAggregateInputType | true
    _avg?: CivilServiceEligibilityAvgAggregateInputType
    _sum?: CivilServiceEligibilitySumAggregateInputType
    _min?: CivilServiceEligibilityMinAggregateInputType
    _max?: CivilServiceEligibilityMaxAggregateInputType
  }

  export type CivilServiceEligibilityGroupByOutputType = {
    id: number
    employeeId: number
    careerService: string
    rating: number | null
    dateOfExamination: Date | null
    placeOfExamination: string | null
    licenseNo: string | null
    licenseValidity: Date | null
    _count: CivilServiceEligibilityCountAggregateOutputType | null
    _avg: CivilServiceEligibilityAvgAggregateOutputType | null
    _sum: CivilServiceEligibilitySumAggregateOutputType | null
    _min: CivilServiceEligibilityMinAggregateOutputType | null
    _max: CivilServiceEligibilityMaxAggregateOutputType | null
  }

  type GetCivilServiceEligibilityGroupByPayload<T extends CivilServiceEligibilityGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CivilServiceEligibilityGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CivilServiceEligibilityGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CivilServiceEligibilityGroupByOutputType[P]>
            : GetScalarType<T[P], CivilServiceEligibilityGroupByOutputType[P]>
        }
      >
    >


  export type CivilServiceEligibilitySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    employeeId?: boolean
    careerService?: boolean
    rating?: boolean
    dateOfExamination?: boolean
    placeOfExamination?: boolean
    licenseNo?: boolean
    licenseValidity?: boolean
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["civilServiceEligibility"]>


  export type CivilServiceEligibilitySelectScalar = {
    id?: boolean
    employeeId?: boolean
    careerService?: boolean
    rating?: boolean
    dateOfExamination?: boolean
    placeOfExamination?: boolean
    licenseNo?: boolean
    licenseValidity?: boolean
  }

  export type CivilServiceEligibilityInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }

  export type $CivilServiceEligibilityPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CivilServiceEligibility"
    objects: {
      employee: Prisma.$EmployeePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      employeeId: number
      careerService: string
      rating: number | null
      dateOfExamination: Date | null
      placeOfExamination: string | null
      licenseNo: string | null
      licenseValidity: Date | null
    }, ExtArgs["result"]["civilServiceEligibility"]>
    composites: {}
  }

  type CivilServiceEligibilityGetPayload<S extends boolean | null | undefined | CivilServiceEligibilityDefaultArgs> = $Result.GetResult<Prisma.$CivilServiceEligibilityPayload, S>

  type CivilServiceEligibilityCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CivilServiceEligibilityFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CivilServiceEligibilityCountAggregateInputType | true
    }

  export interface CivilServiceEligibilityDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CivilServiceEligibility'], meta: { name: 'CivilServiceEligibility' } }
    /**
     * Find zero or one CivilServiceEligibility that matches the filter.
     * @param {CivilServiceEligibilityFindUniqueArgs} args - Arguments to find a CivilServiceEligibility
     * @example
     * // Get one CivilServiceEligibility
     * const civilServiceEligibility = await prisma.civilServiceEligibility.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CivilServiceEligibilityFindUniqueArgs>(args: SelectSubset<T, CivilServiceEligibilityFindUniqueArgs<ExtArgs>>): Prisma__CivilServiceEligibilityClient<$Result.GetResult<Prisma.$CivilServiceEligibilityPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one CivilServiceEligibility that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {CivilServiceEligibilityFindUniqueOrThrowArgs} args - Arguments to find a CivilServiceEligibility
     * @example
     * // Get one CivilServiceEligibility
     * const civilServiceEligibility = await prisma.civilServiceEligibility.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CivilServiceEligibilityFindUniqueOrThrowArgs>(args: SelectSubset<T, CivilServiceEligibilityFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CivilServiceEligibilityClient<$Result.GetResult<Prisma.$CivilServiceEligibilityPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first CivilServiceEligibility that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CivilServiceEligibilityFindFirstArgs} args - Arguments to find a CivilServiceEligibility
     * @example
     * // Get one CivilServiceEligibility
     * const civilServiceEligibility = await prisma.civilServiceEligibility.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CivilServiceEligibilityFindFirstArgs>(args?: SelectSubset<T, CivilServiceEligibilityFindFirstArgs<ExtArgs>>): Prisma__CivilServiceEligibilityClient<$Result.GetResult<Prisma.$CivilServiceEligibilityPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first CivilServiceEligibility that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CivilServiceEligibilityFindFirstOrThrowArgs} args - Arguments to find a CivilServiceEligibility
     * @example
     * // Get one CivilServiceEligibility
     * const civilServiceEligibility = await prisma.civilServiceEligibility.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CivilServiceEligibilityFindFirstOrThrowArgs>(args?: SelectSubset<T, CivilServiceEligibilityFindFirstOrThrowArgs<ExtArgs>>): Prisma__CivilServiceEligibilityClient<$Result.GetResult<Prisma.$CivilServiceEligibilityPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more CivilServiceEligibilities that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CivilServiceEligibilityFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CivilServiceEligibilities
     * const civilServiceEligibilities = await prisma.civilServiceEligibility.findMany()
     * 
     * // Get first 10 CivilServiceEligibilities
     * const civilServiceEligibilities = await prisma.civilServiceEligibility.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const civilServiceEligibilityWithIdOnly = await prisma.civilServiceEligibility.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CivilServiceEligibilityFindManyArgs>(args?: SelectSubset<T, CivilServiceEligibilityFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CivilServiceEligibilityPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a CivilServiceEligibility.
     * @param {CivilServiceEligibilityCreateArgs} args - Arguments to create a CivilServiceEligibility.
     * @example
     * // Create one CivilServiceEligibility
     * const CivilServiceEligibility = await prisma.civilServiceEligibility.create({
     *   data: {
     *     // ... data to create a CivilServiceEligibility
     *   }
     * })
     * 
     */
    create<T extends CivilServiceEligibilityCreateArgs>(args: SelectSubset<T, CivilServiceEligibilityCreateArgs<ExtArgs>>): Prisma__CivilServiceEligibilityClient<$Result.GetResult<Prisma.$CivilServiceEligibilityPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many CivilServiceEligibilities.
     * @param {CivilServiceEligibilityCreateManyArgs} args - Arguments to create many CivilServiceEligibilities.
     * @example
     * // Create many CivilServiceEligibilities
     * const civilServiceEligibility = await prisma.civilServiceEligibility.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CivilServiceEligibilityCreateManyArgs>(args?: SelectSubset<T, CivilServiceEligibilityCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a CivilServiceEligibility.
     * @param {CivilServiceEligibilityDeleteArgs} args - Arguments to delete one CivilServiceEligibility.
     * @example
     * // Delete one CivilServiceEligibility
     * const CivilServiceEligibility = await prisma.civilServiceEligibility.delete({
     *   where: {
     *     // ... filter to delete one CivilServiceEligibility
     *   }
     * })
     * 
     */
    delete<T extends CivilServiceEligibilityDeleteArgs>(args: SelectSubset<T, CivilServiceEligibilityDeleteArgs<ExtArgs>>): Prisma__CivilServiceEligibilityClient<$Result.GetResult<Prisma.$CivilServiceEligibilityPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one CivilServiceEligibility.
     * @param {CivilServiceEligibilityUpdateArgs} args - Arguments to update one CivilServiceEligibility.
     * @example
     * // Update one CivilServiceEligibility
     * const civilServiceEligibility = await prisma.civilServiceEligibility.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CivilServiceEligibilityUpdateArgs>(args: SelectSubset<T, CivilServiceEligibilityUpdateArgs<ExtArgs>>): Prisma__CivilServiceEligibilityClient<$Result.GetResult<Prisma.$CivilServiceEligibilityPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more CivilServiceEligibilities.
     * @param {CivilServiceEligibilityDeleteManyArgs} args - Arguments to filter CivilServiceEligibilities to delete.
     * @example
     * // Delete a few CivilServiceEligibilities
     * const { count } = await prisma.civilServiceEligibility.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CivilServiceEligibilityDeleteManyArgs>(args?: SelectSubset<T, CivilServiceEligibilityDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CivilServiceEligibilities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CivilServiceEligibilityUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CivilServiceEligibilities
     * const civilServiceEligibility = await prisma.civilServiceEligibility.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CivilServiceEligibilityUpdateManyArgs>(args: SelectSubset<T, CivilServiceEligibilityUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one CivilServiceEligibility.
     * @param {CivilServiceEligibilityUpsertArgs} args - Arguments to update or create a CivilServiceEligibility.
     * @example
     * // Update or create a CivilServiceEligibility
     * const civilServiceEligibility = await prisma.civilServiceEligibility.upsert({
     *   create: {
     *     // ... data to create a CivilServiceEligibility
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CivilServiceEligibility we want to update
     *   }
     * })
     */
    upsert<T extends CivilServiceEligibilityUpsertArgs>(args: SelectSubset<T, CivilServiceEligibilityUpsertArgs<ExtArgs>>): Prisma__CivilServiceEligibilityClient<$Result.GetResult<Prisma.$CivilServiceEligibilityPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of CivilServiceEligibilities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CivilServiceEligibilityCountArgs} args - Arguments to filter CivilServiceEligibilities to count.
     * @example
     * // Count the number of CivilServiceEligibilities
     * const count = await prisma.civilServiceEligibility.count({
     *   where: {
     *     // ... the filter for the CivilServiceEligibilities we want to count
     *   }
     * })
    **/
    count<T extends CivilServiceEligibilityCountArgs>(
      args?: Subset<T, CivilServiceEligibilityCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CivilServiceEligibilityCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CivilServiceEligibility.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CivilServiceEligibilityAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CivilServiceEligibilityAggregateArgs>(args: Subset<T, CivilServiceEligibilityAggregateArgs>): Prisma.PrismaPromise<GetCivilServiceEligibilityAggregateType<T>>

    /**
     * Group by CivilServiceEligibility.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CivilServiceEligibilityGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CivilServiceEligibilityGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CivilServiceEligibilityGroupByArgs['orderBy'] }
        : { orderBy?: CivilServiceEligibilityGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CivilServiceEligibilityGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCivilServiceEligibilityGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CivilServiceEligibility model
   */
  readonly fields: CivilServiceEligibilityFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CivilServiceEligibility.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CivilServiceEligibilityClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    employee<T extends EmployeeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EmployeeDefaultArgs<ExtArgs>>): Prisma__EmployeeClient<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CivilServiceEligibility model
   */ 
  interface CivilServiceEligibilityFieldRefs {
    readonly id: FieldRef<"CivilServiceEligibility", 'Int'>
    readonly employeeId: FieldRef<"CivilServiceEligibility", 'Int'>
    readonly careerService: FieldRef<"CivilServiceEligibility", 'String'>
    readonly rating: FieldRef<"CivilServiceEligibility", 'Float'>
    readonly dateOfExamination: FieldRef<"CivilServiceEligibility", 'DateTime'>
    readonly placeOfExamination: FieldRef<"CivilServiceEligibility", 'String'>
    readonly licenseNo: FieldRef<"CivilServiceEligibility", 'String'>
    readonly licenseValidity: FieldRef<"CivilServiceEligibility", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CivilServiceEligibility findUnique
   */
  export type CivilServiceEligibilityFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CivilServiceEligibility
     */
    select?: CivilServiceEligibilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CivilServiceEligibilityInclude<ExtArgs> | null
    /**
     * Filter, which CivilServiceEligibility to fetch.
     */
    where: CivilServiceEligibilityWhereUniqueInput
  }

  /**
   * CivilServiceEligibility findUniqueOrThrow
   */
  export type CivilServiceEligibilityFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CivilServiceEligibility
     */
    select?: CivilServiceEligibilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CivilServiceEligibilityInclude<ExtArgs> | null
    /**
     * Filter, which CivilServiceEligibility to fetch.
     */
    where: CivilServiceEligibilityWhereUniqueInput
  }

  /**
   * CivilServiceEligibility findFirst
   */
  export type CivilServiceEligibilityFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CivilServiceEligibility
     */
    select?: CivilServiceEligibilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CivilServiceEligibilityInclude<ExtArgs> | null
    /**
     * Filter, which CivilServiceEligibility to fetch.
     */
    where?: CivilServiceEligibilityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CivilServiceEligibilities to fetch.
     */
    orderBy?: CivilServiceEligibilityOrderByWithRelationInput | CivilServiceEligibilityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CivilServiceEligibilities.
     */
    cursor?: CivilServiceEligibilityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CivilServiceEligibilities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CivilServiceEligibilities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CivilServiceEligibilities.
     */
    distinct?: CivilServiceEligibilityScalarFieldEnum | CivilServiceEligibilityScalarFieldEnum[]
  }

  /**
   * CivilServiceEligibility findFirstOrThrow
   */
  export type CivilServiceEligibilityFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CivilServiceEligibility
     */
    select?: CivilServiceEligibilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CivilServiceEligibilityInclude<ExtArgs> | null
    /**
     * Filter, which CivilServiceEligibility to fetch.
     */
    where?: CivilServiceEligibilityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CivilServiceEligibilities to fetch.
     */
    orderBy?: CivilServiceEligibilityOrderByWithRelationInput | CivilServiceEligibilityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CivilServiceEligibilities.
     */
    cursor?: CivilServiceEligibilityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CivilServiceEligibilities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CivilServiceEligibilities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CivilServiceEligibilities.
     */
    distinct?: CivilServiceEligibilityScalarFieldEnum | CivilServiceEligibilityScalarFieldEnum[]
  }

  /**
   * CivilServiceEligibility findMany
   */
  export type CivilServiceEligibilityFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CivilServiceEligibility
     */
    select?: CivilServiceEligibilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CivilServiceEligibilityInclude<ExtArgs> | null
    /**
     * Filter, which CivilServiceEligibilities to fetch.
     */
    where?: CivilServiceEligibilityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CivilServiceEligibilities to fetch.
     */
    orderBy?: CivilServiceEligibilityOrderByWithRelationInput | CivilServiceEligibilityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CivilServiceEligibilities.
     */
    cursor?: CivilServiceEligibilityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CivilServiceEligibilities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CivilServiceEligibilities.
     */
    skip?: number
    distinct?: CivilServiceEligibilityScalarFieldEnum | CivilServiceEligibilityScalarFieldEnum[]
  }

  /**
   * CivilServiceEligibility create
   */
  export type CivilServiceEligibilityCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CivilServiceEligibility
     */
    select?: CivilServiceEligibilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CivilServiceEligibilityInclude<ExtArgs> | null
    /**
     * The data needed to create a CivilServiceEligibility.
     */
    data: XOR<CivilServiceEligibilityCreateInput, CivilServiceEligibilityUncheckedCreateInput>
  }

  /**
   * CivilServiceEligibility createMany
   */
  export type CivilServiceEligibilityCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CivilServiceEligibilities.
     */
    data: CivilServiceEligibilityCreateManyInput | CivilServiceEligibilityCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CivilServiceEligibility update
   */
  export type CivilServiceEligibilityUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CivilServiceEligibility
     */
    select?: CivilServiceEligibilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CivilServiceEligibilityInclude<ExtArgs> | null
    /**
     * The data needed to update a CivilServiceEligibility.
     */
    data: XOR<CivilServiceEligibilityUpdateInput, CivilServiceEligibilityUncheckedUpdateInput>
    /**
     * Choose, which CivilServiceEligibility to update.
     */
    where: CivilServiceEligibilityWhereUniqueInput
  }

  /**
   * CivilServiceEligibility updateMany
   */
  export type CivilServiceEligibilityUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CivilServiceEligibilities.
     */
    data: XOR<CivilServiceEligibilityUpdateManyMutationInput, CivilServiceEligibilityUncheckedUpdateManyInput>
    /**
     * Filter which CivilServiceEligibilities to update
     */
    where?: CivilServiceEligibilityWhereInput
  }

  /**
   * CivilServiceEligibility upsert
   */
  export type CivilServiceEligibilityUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CivilServiceEligibility
     */
    select?: CivilServiceEligibilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CivilServiceEligibilityInclude<ExtArgs> | null
    /**
     * The filter to search for the CivilServiceEligibility to update in case it exists.
     */
    where: CivilServiceEligibilityWhereUniqueInput
    /**
     * In case the CivilServiceEligibility found by the `where` argument doesn't exist, create a new CivilServiceEligibility with this data.
     */
    create: XOR<CivilServiceEligibilityCreateInput, CivilServiceEligibilityUncheckedCreateInput>
    /**
     * In case the CivilServiceEligibility was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CivilServiceEligibilityUpdateInput, CivilServiceEligibilityUncheckedUpdateInput>
  }

  /**
   * CivilServiceEligibility delete
   */
  export type CivilServiceEligibilityDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CivilServiceEligibility
     */
    select?: CivilServiceEligibilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CivilServiceEligibilityInclude<ExtArgs> | null
    /**
     * Filter which CivilServiceEligibility to delete.
     */
    where: CivilServiceEligibilityWhereUniqueInput
  }

  /**
   * CivilServiceEligibility deleteMany
   */
  export type CivilServiceEligibilityDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CivilServiceEligibilities to delete
     */
    where?: CivilServiceEligibilityWhereInput
  }

  /**
   * CivilServiceEligibility without action
   */
  export type CivilServiceEligibilityDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CivilServiceEligibility
     */
    select?: CivilServiceEligibilitySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CivilServiceEligibilityInclude<ExtArgs> | null
  }


  /**
   * Model WorkExperience
   */

  export type AggregateWorkExperience = {
    _count: WorkExperienceCountAggregateOutputType | null
    _avg: WorkExperienceAvgAggregateOutputType | null
    _sum: WorkExperienceSumAggregateOutputType | null
    _min: WorkExperienceMinAggregateOutputType | null
    _max: WorkExperienceMaxAggregateOutputType | null
  }

  export type WorkExperienceAvgAggregateOutputType = {
    id: number | null
    employeeId: number | null
    monthlySalary: number | null
  }

  export type WorkExperienceSumAggregateOutputType = {
    id: number | null
    employeeId: number | null
    monthlySalary: number | null
  }

  export type WorkExperienceMinAggregateOutputType = {
    id: number | null
    employeeId: number | null
    dateFrom: Date | null
    dateTo: Date | null
    positionTitle: string | null
    departmentAgencyCompany: string | null
    monthlySalary: number | null
    salaryGrade: string | null
    statusOfAppointment: string | null
    isGovService: boolean | null
  }

  export type WorkExperienceMaxAggregateOutputType = {
    id: number | null
    employeeId: number | null
    dateFrom: Date | null
    dateTo: Date | null
    positionTitle: string | null
    departmentAgencyCompany: string | null
    monthlySalary: number | null
    salaryGrade: string | null
    statusOfAppointment: string | null
    isGovService: boolean | null
  }

  export type WorkExperienceCountAggregateOutputType = {
    id: number
    employeeId: number
    dateFrom: number
    dateTo: number
    positionTitle: number
    departmentAgencyCompany: number
    monthlySalary: number
    salaryGrade: number
    statusOfAppointment: number
    isGovService: number
    _all: number
  }


  export type WorkExperienceAvgAggregateInputType = {
    id?: true
    employeeId?: true
    monthlySalary?: true
  }

  export type WorkExperienceSumAggregateInputType = {
    id?: true
    employeeId?: true
    monthlySalary?: true
  }

  export type WorkExperienceMinAggregateInputType = {
    id?: true
    employeeId?: true
    dateFrom?: true
    dateTo?: true
    positionTitle?: true
    departmentAgencyCompany?: true
    monthlySalary?: true
    salaryGrade?: true
    statusOfAppointment?: true
    isGovService?: true
  }

  export type WorkExperienceMaxAggregateInputType = {
    id?: true
    employeeId?: true
    dateFrom?: true
    dateTo?: true
    positionTitle?: true
    departmentAgencyCompany?: true
    monthlySalary?: true
    salaryGrade?: true
    statusOfAppointment?: true
    isGovService?: true
  }

  export type WorkExperienceCountAggregateInputType = {
    id?: true
    employeeId?: true
    dateFrom?: true
    dateTo?: true
    positionTitle?: true
    departmentAgencyCompany?: true
    monthlySalary?: true
    salaryGrade?: true
    statusOfAppointment?: true
    isGovService?: true
    _all?: true
  }

  export type WorkExperienceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkExperience to aggregate.
     */
    where?: WorkExperienceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkExperiences to fetch.
     */
    orderBy?: WorkExperienceOrderByWithRelationInput | WorkExperienceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WorkExperienceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkExperiences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkExperiences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WorkExperiences
    **/
    _count?: true | WorkExperienceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WorkExperienceAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WorkExperienceSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WorkExperienceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WorkExperienceMaxAggregateInputType
  }

  export type GetWorkExperienceAggregateType<T extends WorkExperienceAggregateArgs> = {
        [P in keyof T & keyof AggregateWorkExperience]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWorkExperience[P]>
      : GetScalarType<T[P], AggregateWorkExperience[P]>
  }




  export type WorkExperienceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkExperienceWhereInput
    orderBy?: WorkExperienceOrderByWithAggregationInput | WorkExperienceOrderByWithAggregationInput[]
    by: WorkExperienceScalarFieldEnum[] | WorkExperienceScalarFieldEnum
    having?: WorkExperienceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WorkExperienceCountAggregateInputType | true
    _avg?: WorkExperienceAvgAggregateInputType
    _sum?: WorkExperienceSumAggregateInputType
    _min?: WorkExperienceMinAggregateInputType
    _max?: WorkExperienceMaxAggregateInputType
  }

  export type WorkExperienceGroupByOutputType = {
    id: number
    employeeId: number
    dateFrom: Date
    dateTo: Date | null
    positionTitle: string
    departmentAgencyCompany: string
    monthlySalary: number | null
    salaryGrade: string | null
    statusOfAppointment: string | null
    isGovService: boolean
    _count: WorkExperienceCountAggregateOutputType | null
    _avg: WorkExperienceAvgAggregateOutputType | null
    _sum: WorkExperienceSumAggregateOutputType | null
    _min: WorkExperienceMinAggregateOutputType | null
    _max: WorkExperienceMaxAggregateOutputType | null
  }

  type GetWorkExperienceGroupByPayload<T extends WorkExperienceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WorkExperienceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WorkExperienceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WorkExperienceGroupByOutputType[P]>
            : GetScalarType<T[P], WorkExperienceGroupByOutputType[P]>
        }
      >
    >


  export type WorkExperienceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    employeeId?: boolean
    dateFrom?: boolean
    dateTo?: boolean
    positionTitle?: boolean
    departmentAgencyCompany?: boolean
    monthlySalary?: boolean
    salaryGrade?: boolean
    statusOfAppointment?: boolean
    isGovService?: boolean
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workExperience"]>


  export type WorkExperienceSelectScalar = {
    id?: boolean
    employeeId?: boolean
    dateFrom?: boolean
    dateTo?: boolean
    positionTitle?: boolean
    departmentAgencyCompany?: boolean
    monthlySalary?: boolean
    salaryGrade?: boolean
    statusOfAppointment?: boolean
    isGovService?: boolean
  }

  export type WorkExperienceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }

  export type $WorkExperiencePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WorkExperience"
    objects: {
      employee: Prisma.$EmployeePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      employeeId: number
      dateFrom: Date
      dateTo: Date | null
      positionTitle: string
      departmentAgencyCompany: string
      monthlySalary: number | null
      salaryGrade: string | null
      statusOfAppointment: string | null
      isGovService: boolean
    }, ExtArgs["result"]["workExperience"]>
    composites: {}
  }

  type WorkExperienceGetPayload<S extends boolean | null | undefined | WorkExperienceDefaultArgs> = $Result.GetResult<Prisma.$WorkExperiencePayload, S>

  type WorkExperienceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<WorkExperienceFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: WorkExperienceCountAggregateInputType | true
    }

  export interface WorkExperienceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WorkExperience'], meta: { name: 'WorkExperience' } }
    /**
     * Find zero or one WorkExperience that matches the filter.
     * @param {WorkExperienceFindUniqueArgs} args - Arguments to find a WorkExperience
     * @example
     * // Get one WorkExperience
     * const workExperience = await prisma.workExperience.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WorkExperienceFindUniqueArgs>(args: SelectSubset<T, WorkExperienceFindUniqueArgs<ExtArgs>>): Prisma__WorkExperienceClient<$Result.GetResult<Prisma.$WorkExperiencePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one WorkExperience that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {WorkExperienceFindUniqueOrThrowArgs} args - Arguments to find a WorkExperience
     * @example
     * // Get one WorkExperience
     * const workExperience = await prisma.workExperience.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WorkExperienceFindUniqueOrThrowArgs>(args: SelectSubset<T, WorkExperienceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WorkExperienceClient<$Result.GetResult<Prisma.$WorkExperiencePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first WorkExperience that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkExperienceFindFirstArgs} args - Arguments to find a WorkExperience
     * @example
     * // Get one WorkExperience
     * const workExperience = await prisma.workExperience.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WorkExperienceFindFirstArgs>(args?: SelectSubset<T, WorkExperienceFindFirstArgs<ExtArgs>>): Prisma__WorkExperienceClient<$Result.GetResult<Prisma.$WorkExperiencePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first WorkExperience that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkExperienceFindFirstOrThrowArgs} args - Arguments to find a WorkExperience
     * @example
     * // Get one WorkExperience
     * const workExperience = await prisma.workExperience.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WorkExperienceFindFirstOrThrowArgs>(args?: SelectSubset<T, WorkExperienceFindFirstOrThrowArgs<ExtArgs>>): Prisma__WorkExperienceClient<$Result.GetResult<Prisma.$WorkExperiencePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more WorkExperiences that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkExperienceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WorkExperiences
     * const workExperiences = await prisma.workExperience.findMany()
     * 
     * // Get first 10 WorkExperiences
     * const workExperiences = await prisma.workExperience.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const workExperienceWithIdOnly = await prisma.workExperience.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WorkExperienceFindManyArgs>(args?: SelectSubset<T, WorkExperienceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkExperiencePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a WorkExperience.
     * @param {WorkExperienceCreateArgs} args - Arguments to create a WorkExperience.
     * @example
     * // Create one WorkExperience
     * const WorkExperience = await prisma.workExperience.create({
     *   data: {
     *     // ... data to create a WorkExperience
     *   }
     * })
     * 
     */
    create<T extends WorkExperienceCreateArgs>(args: SelectSubset<T, WorkExperienceCreateArgs<ExtArgs>>): Prisma__WorkExperienceClient<$Result.GetResult<Prisma.$WorkExperiencePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many WorkExperiences.
     * @param {WorkExperienceCreateManyArgs} args - Arguments to create many WorkExperiences.
     * @example
     * // Create many WorkExperiences
     * const workExperience = await prisma.workExperience.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WorkExperienceCreateManyArgs>(args?: SelectSubset<T, WorkExperienceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a WorkExperience.
     * @param {WorkExperienceDeleteArgs} args - Arguments to delete one WorkExperience.
     * @example
     * // Delete one WorkExperience
     * const WorkExperience = await prisma.workExperience.delete({
     *   where: {
     *     // ... filter to delete one WorkExperience
     *   }
     * })
     * 
     */
    delete<T extends WorkExperienceDeleteArgs>(args: SelectSubset<T, WorkExperienceDeleteArgs<ExtArgs>>): Prisma__WorkExperienceClient<$Result.GetResult<Prisma.$WorkExperiencePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one WorkExperience.
     * @param {WorkExperienceUpdateArgs} args - Arguments to update one WorkExperience.
     * @example
     * // Update one WorkExperience
     * const workExperience = await prisma.workExperience.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WorkExperienceUpdateArgs>(args: SelectSubset<T, WorkExperienceUpdateArgs<ExtArgs>>): Prisma__WorkExperienceClient<$Result.GetResult<Prisma.$WorkExperiencePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more WorkExperiences.
     * @param {WorkExperienceDeleteManyArgs} args - Arguments to filter WorkExperiences to delete.
     * @example
     * // Delete a few WorkExperiences
     * const { count } = await prisma.workExperience.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WorkExperienceDeleteManyArgs>(args?: SelectSubset<T, WorkExperienceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkExperiences.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkExperienceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WorkExperiences
     * const workExperience = await prisma.workExperience.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WorkExperienceUpdateManyArgs>(args: SelectSubset<T, WorkExperienceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one WorkExperience.
     * @param {WorkExperienceUpsertArgs} args - Arguments to update or create a WorkExperience.
     * @example
     * // Update or create a WorkExperience
     * const workExperience = await prisma.workExperience.upsert({
     *   create: {
     *     // ... data to create a WorkExperience
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WorkExperience we want to update
     *   }
     * })
     */
    upsert<T extends WorkExperienceUpsertArgs>(args: SelectSubset<T, WorkExperienceUpsertArgs<ExtArgs>>): Prisma__WorkExperienceClient<$Result.GetResult<Prisma.$WorkExperiencePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of WorkExperiences.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkExperienceCountArgs} args - Arguments to filter WorkExperiences to count.
     * @example
     * // Count the number of WorkExperiences
     * const count = await prisma.workExperience.count({
     *   where: {
     *     // ... the filter for the WorkExperiences we want to count
     *   }
     * })
    **/
    count<T extends WorkExperienceCountArgs>(
      args?: Subset<T, WorkExperienceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WorkExperienceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WorkExperience.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkExperienceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WorkExperienceAggregateArgs>(args: Subset<T, WorkExperienceAggregateArgs>): Prisma.PrismaPromise<GetWorkExperienceAggregateType<T>>

    /**
     * Group by WorkExperience.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkExperienceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WorkExperienceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WorkExperienceGroupByArgs['orderBy'] }
        : { orderBy?: WorkExperienceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WorkExperienceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorkExperienceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WorkExperience model
   */
  readonly fields: WorkExperienceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WorkExperience.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WorkExperienceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    employee<T extends EmployeeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EmployeeDefaultArgs<ExtArgs>>): Prisma__EmployeeClient<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WorkExperience model
   */ 
  interface WorkExperienceFieldRefs {
    readonly id: FieldRef<"WorkExperience", 'Int'>
    readonly employeeId: FieldRef<"WorkExperience", 'Int'>
    readonly dateFrom: FieldRef<"WorkExperience", 'DateTime'>
    readonly dateTo: FieldRef<"WorkExperience", 'DateTime'>
    readonly positionTitle: FieldRef<"WorkExperience", 'String'>
    readonly departmentAgencyCompany: FieldRef<"WorkExperience", 'String'>
    readonly monthlySalary: FieldRef<"WorkExperience", 'Float'>
    readonly salaryGrade: FieldRef<"WorkExperience", 'String'>
    readonly statusOfAppointment: FieldRef<"WorkExperience", 'String'>
    readonly isGovService: FieldRef<"WorkExperience", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * WorkExperience findUnique
   */
  export type WorkExperienceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkExperience
     */
    select?: WorkExperienceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkExperienceInclude<ExtArgs> | null
    /**
     * Filter, which WorkExperience to fetch.
     */
    where: WorkExperienceWhereUniqueInput
  }

  /**
   * WorkExperience findUniqueOrThrow
   */
  export type WorkExperienceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkExperience
     */
    select?: WorkExperienceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkExperienceInclude<ExtArgs> | null
    /**
     * Filter, which WorkExperience to fetch.
     */
    where: WorkExperienceWhereUniqueInput
  }

  /**
   * WorkExperience findFirst
   */
  export type WorkExperienceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkExperience
     */
    select?: WorkExperienceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkExperienceInclude<ExtArgs> | null
    /**
     * Filter, which WorkExperience to fetch.
     */
    where?: WorkExperienceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkExperiences to fetch.
     */
    orderBy?: WorkExperienceOrderByWithRelationInput | WorkExperienceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkExperiences.
     */
    cursor?: WorkExperienceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkExperiences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkExperiences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkExperiences.
     */
    distinct?: WorkExperienceScalarFieldEnum | WorkExperienceScalarFieldEnum[]
  }

  /**
   * WorkExperience findFirstOrThrow
   */
  export type WorkExperienceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkExperience
     */
    select?: WorkExperienceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkExperienceInclude<ExtArgs> | null
    /**
     * Filter, which WorkExperience to fetch.
     */
    where?: WorkExperienceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkExperiences to fetch.
     */
    orderBy?: WorkExperienceOrderByWithRelationInput | WorkExperienceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkExperiences.
     */
    cursor?: WorkExperienceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkExperiences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkExperiences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkExperiences.
     */
    distinct?: WorkExperienceScalarFieldEnum | WorkExperienceScalarFieldEnum[]
  }

  /**
   * WorkExperience findMany
   */
  export type WorkExperienceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkExperience
     */
    select?: WorkExperienceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkExperienceInclude<ExtArgs> | null
    /**
     * Filter, which WorkExperiences to fetch.
     */
    where?: WorkExperienceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkExperiences to fetch.
     */
    orderBy?: WorkExperienceOrderByWithRelationInput | WorkExperienceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WorkExperiences.
     */
    cursor?: WorkExperienceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkExperiences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkExperiences.
     */
    skip?: number
    distinct?: WorkExperienceScalarFieldEnum | WorkExperienceScalarFieldEnum[]
  }

  /**
   * WorkExperience create
   */
  export type WorkExperienceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkExperience
     */
    select?: WorkExperienceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkExperienceInclude<ExtArgs> | null
    /**
     * The data needed to create a WorkExperience.
     */
    data: XOR<WorkExperienceCreateInput, WorkExperienceUncheckedCreateInput>
  }

  /**
   * WorkExperience createMany
   */
  export type WorkExperienceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WorkExperiences.
     */
    data: WorkExperienceCreateManyInput | WorkExperienceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorkExperience update
   */
  export type WorkExperienceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkExperience
     */
    select?: WorkExperienceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkExperienceInclude<ExtArgs> | null
    /**
     * The data needed to update a WorkExperience.
     */
    data: XOR<WorkExperienceUpdateInput, WorkExperienceUncheckedUpdateInput>
    /**
     * Choose, which WorkExperience to update.
     */
    where: WorkExperienceWhereUniqueInput
  }

  /**
   * WorkExperience updateMany
   */
  export type WorkExperienceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WorkExperiences.
     */
    data: XOR<WorkExperienceUpdateManyMutationInput, WorkExperienceUncheckedUpdateManyInput>
    /**
     * Filter which WorkExperiences to update
     */
    where?: WorkExperienceWhereInput
  }

  /**
   * WorkExperience upsert
   */
  export type WorkExperienceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkExperience
     */
    select?: WorkExperienceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkExperienceInclude<ExtArgs> | null
    /**
     * The filter to search for the WorkExperience to update in case it exists.
     */
    where: WorkExperienceWhereUniqueInput
    /**
     * In case the WorkExperience found by the `where` argument doesn't exist, create a new WorkExperience with this data.
     */
    create: XOR<WorkExperienceCreateInput, WorkExperienceUncheckedCreateInput>
    /**
     * In case the WorkExperience was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WorkExperienceUpdateInput, WorkExperienceUncheckedUpdateInput>
  }

  /**
   * WorkExperience delete
   */
  export type WorkExperienceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkExperience
     */
    select?: WorkExperienceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkExperienceInclude<ExtArgs> | null
    /**
     * Filter which WorkExperience to delete.
     */
    where: WorkExperienceWhereUniqueInput
  }

  /**
   * WorkExperience deleteMany
   */
  export type WorkExperienceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkExperiences to delete
     */
    where?: WorkExperienceWhereInput
  }

  /**
   * WorkExperience without action
   */
  export type WorkExperienceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkExperience
     */
    select?: WorkExperienceSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkExperienceInclude<ExtArgs> | null
  }


  /**
   * Model VoluntaryWork
   */

  export type AggregateVoluntaryWork = {
    _count: VoluntaryWorkCountAggregateOutputType | null
    _avg: VoluntaryWorkAvgAggregateOutputType | null
    _sum: VoluntaryWorkSumAggregateOutputType | null
    _min: VoluntaryWorkMinAggregateOutputType | null
    _max: VoluntaryWorkMaxAggregateOutputType | null
  }

  export type VoluntaryWorkAvgAggregateOutputType = {
    id: number | null
    employeeId: number | null
    numberOfHours: number | null
  }

  export type VoluntaryWorkSumAggregateOutputType = {
    id: number | null
    employeeId: number | null
    numberOfHours: number | null
  }

  export type VoluntaryWorkMinAggregateOutputType = {
    id: number | null
    employeeId: number | null
    organizationName: string | null
    organizationAddress: string | null
    dateFrom: Date | null
    dateTo: Date | null
    numberOfHours: number | null
    positionNature: string | null
  }

  export type VoluntaryWorkMaxAggregateOutputType = {
    id: number | null
    employeeId: number | null
    organizationName: string | null
    organizationAddress: string | null
    dateFrom: Date | null
    dateTo: Date | null
    numberOfHours: number | null
    positionNature: string | null
  }

  export type VoluntaryWorkCountAggregateOutputType = {
    id: number
    employeeId: number
    organizationName: number
    organizationAddress: number
    dateFrom: number
    dateTo: number
    numberOfHours: number
    positionNature: number
    _all: number
  }


  export type VoluntaryWorkAvgAggregateInputType = {
    id?: true
    employeeId?: true
    numberOfHours?: true
  }

  export type VoluntaryWorkSumAggregateInputType = {
    id?: true
    employeeId?: true
    numberOfHours?: true
  }

  export type VoluntaryWorkMinAggregateInputType = {
    id?: true
    employeeId?: true
    organizationName?: true
    organizationAddress?: true
    dateFrom?: true
    dateTo?: true
    numberOfHours?: true
    positionNature?: true
  }

  export type VoluntaryWorkMaxAggregateInputType = {
    id?: true
    employeeId?: true
    organizationName?: true
    organizationAddress?: true
    dateFrom?: true
    dateTo?: true
    numberOfHours?: true
    positionNature?: true
  }

  export type VoluntaryWorkCountAggregateInputType = {
    id?: true
    employeeId?: true
    organizationName?: true
    organizationAddress?: true
    dateFrom?: true
    dateTo?: true
    numberOfHours?: true
    positionNature?: true
    _all?: true
  }

  export type VoluntaryWorkAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VoluntaryWork to aggregate.
     */
    where?: VoluntaryWorkWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VoluntaryWorks to fetch.
     */
    orderBy?: VoluntaryWorkOrderByWithRelationInput | VoluntaryWorkOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VoluntaryWorkWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VoluntaryWorks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VoluntaryWorks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned VoluntaryWorks
    **/
    _count?: true | VoluntaryWorkCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: VoluntaryWorkAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: VoluntaryWorkSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VoluntaryWorkMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VoluntaryWorkMaxAggregateInputType
  }

  export type GetVoluntaryWorkAggregateType<T extends VoluntaryWorkAggregateArgs> = {
        [P in keyof T & keyof AggregateVoluntaryWork]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVoluntaryWork[P]>
      : GetScalarType<T[P], AggregateVoluntaryWork[P]>
  }




  export type VoluntaryWorkGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VoluntaryWorkWhereInput
    orderBy?: VoluntaryWorkOrderByWithAggregationInput | VoluntaryWorkOrderByWithAggregationInput[]
    by: VoluntaryWorkScalarFieldEnum[] | VoluntaryWorkScalarFieldEnum
    having?: VoluntaryWorkScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VoluntaryWorkCountAggregateInputType | true
    _avg?: VoluntaryWorkAvgAggregateInputType
    _sum?: VoluntaryWorkSumAggregateInputType
    _min?: VoluntaryWorkMinAggregateInputType
    _max?: VoluntaryWorkMaxAggregateInputType
  }

  export type VoluntaryWorkGroupByOutputType = {
    id: number
    employeeId: number
    organizationName: string
    organizationAddress: string | null
    dateFrom: Date
    dateTo: Date | null
    numberOfHours: number | null
    positionNature: string
    _count: VoluntaryWorkCountAggregateOutputType | null
    _avg: VoluntaryWorkAvgAggregateOutputType | null
    _sum: VoluntaryWorkSumAggregateOutputType | null
    _min: VoluntaryWorkMinAggregateOutputType | null
    _max: VoluntaryWorkMaxAggregateOutputType | null
  }

  type GetVoluntaryWorkGroupByPayload<T extends VoluntaryWorkGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VoluntaryWorkGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VoluntaryWorkGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VoluntaryWorkGroupByOutputType[P]>
            : GetScalarType<T[P], VoluntaryWorkGroupByOutputType[P]>
        }
      >
    >


  export type VoluntaryWorkSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    employeeId?: boolean
    organizationName?: boolean
    organizationAddress?: boolean
    dateFrom?: boolean
    dateTo?: boolean
    numberOfHours?: boolean
    positionNature?: boolean
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["voluntaryWork"]>


  export type VoluntaryWorkSelectScalar = {
    id?: boolean
    employeeId?: boolean
    organizationName?: boolean
    organizationAddress?: boolean
    dateFrom?: boolean
    dateTo?: boolean
    numberOfHours?: boolean
    positionNature?: boolean
  }

  export type VoluntaryWorkInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }

  export type $VoluntaryWorkPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "VoluntaryWork"
    objects: {
      employee: Prisma.$EmployeePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      employeeId: number
      organizationName: string
      organizationAddress: string | null
      dateFrom: Date
      dateTo: Date | null
      numberOfHours: number | null
      positionNature: string
    }, ExtArgs["result"]["voluntaryWork"]>
    composites: {}
  }

  type VoluntaryWorkGetPayload<S extends boolean | null | undefined | VoluntaryWorkDefaultArgs> = $Result.GetResult<Prisma.$VoluntaryWorkPayload, S>

  type VoluntaryWorkCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<VoluntaryWorkFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: VoluntaryWorkCountAggregateInputType | true
    }

  export interface VoluntaryWorkDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['VoluntaryWork'], meta: { name: 'VoluntaryWork' } }
    /**
     * Find zero or one VoluntaryWork that matches the filter.
     * @param {VoluntaryWorkFindUniqueArgs} args - Arguments to find a VoluntaryWork
     * @example
     * // Get one VoluntaryWork
     * const voluntaryWork = await prisma.voluntaryWork.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VoluntaryWorkFindUniqueArgs>(args: SelectSubset<T, VoluntaryWorkFindUniqueArgs<ExtArgs>>): Prisma__VoluntaryWorkClient<$Result.GetResult<Prisma.$VoluntaryWorkPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one VoluntaryWork that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {VoluntaryWorkFindUniqueOrThrowArgs} args - Arguments to find a VoluntaryWork
     * @example
     * // Get one VoluntaryWork
     * const voluntaryWork = await prisma.voluntaryWork.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VoluntaryWorkFindUniqueOrThrowArgs>(args: SelectSubset<T, VoluntaryWorkFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VoluntaryWorkClient<$Result.GetResult<Prisma.$VoluntaryWorkPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first VoluntaryWork that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoluntaryWorkFindFirstArgs} args - Arguments to find a VoluntaryWork
     * @example
     * // Get one VoluntaryWork
     * const voluntaryWork = await prisma.voluntaryWork.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VoluntaryWorkFindFirstArgs>(args?: SelectSubset<T, VoluntaryWorkFindFirstArgs<ExtArgs>>): Prisma__VoluntaryWorkClient<$Result.GetResult<Prisma.$VoluntaryWorkPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first VoluntaryWork that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoluntaryWorkFindFirstOrThrowArgs} args - Arguments to find a VoluntaryWork
     * @example
     * // Get one VoluntaryWork
     * const voluntaryWork = await prisma.voluntaryWork.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VoluntaryWorkFindFirstOrThrowArgs>(args?: SelectSubset<T, VoluntaryWorkFindFirstOrThrowArgs<ExtArgs>>): Prisma__VoluntaryWorkClient<$Result.GetResult<Prisma.$VoluntaryWorkPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more VoluntaryWorks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoluntaryWorkFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all VoluntaryWorks
     * const voluntaryWorks = await prisma.voluntaryWork.findMany()
     * 
     * // Get first 10 VoluntaryWorks
     * const voluntaryWorks = await prisma.voluntaryWork.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const voluntaryWorkWithIdOnly = await prisma.voluntaryWork.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VoluntaryWorkFindManyArgs>(args?: SelectSubset<T, VoluntaryWorkFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VoluntaryWorkPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a VoluntaryWork.
     * @param {VoluntaryWorkCreateArgs} args - Arguments to create a VoluntaryWork.
     * @example
     * // Create one VoluntaryWork
     * const VoluntaryWork = await prisma.voluntaryWork.create({
     *   data: {
     *     // ... data to create a VoluntaryWork
     *   }
     * })
     * 
     */
    create<T extends VoluntaryWorkCreateArgs>(args: SelectSubset<T, VoluntaryWorkCreateArgs<ExtArgs>>): Prisma__VoluntaryWorkClient<$Result.GetResult<Prisma.$VoluntaryWorkPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many VoluntaryWorks.
     * @param {VoluntaryWorkCreateManyArgs} args - Arguments to create many VoluntaryWorks.
     * @example
     * // Create many VoluntaryWorks
     * const voluntaryWork = await prisma.voluntaryWork.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VoluntaryWorkCreateManyArgs>(args?: SelectSubset<T, VoluntaryWorkCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a VoluntaryWork.
     * @param {VoluntaryWorkDeleteArgs} args - Arguments to delete one VoluntaryWork.
     * @example
     * // Delete one VoluntaryWork
     * const VoluntaryWork = await prisma.voluntaryWork.delete({
     *   where: {
     *     // ... filter to delete one VoluntaryWork
     *   }
     * })
     * 
     */
    delete<T extends VoluntaryWorkDeleteArgs>(args: SelectSubset<T, VoluntaryWorkDeleteArgs<ExtArgs>>): Prisma__VoluntaryWorkClient<$Result.GetResult<Prisma.$VoluntaryWorkPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one VoluntaryWork.
     * @param {VoluntaryWorkUpdateArgs} args - Arguments to update one VoluntaryWork.
     * @example
     * // Update one VoluntaryWork
     * const voluntaryWork = await prisma.voluntaryWork.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VoluntaryWorkUpdateArgs>(args: SelectSubset<T, VoluntaryWorkUpdateArgs<ExtArgs>>): Prisma__VoluntaryWorkClient<$Result.GetResult<Prisma.$VoluntaryWorkPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more VoluntaryWorks.
     * @param {VoluntaryWorkDeleteManyArgs} args - Arguments to filter VoluntaryWorks to delete.
     * @example
     * // Delete a few VoluntaryWorks
     * const { count } = await prisma.voluntaryWork.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VoluntaryWorkDeleteManyArgs>(args?: SelectSubset<T, VoluntaryWorkDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VoluntaryWorks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoluntaryWorkUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many VoluntaryWorks
     * const voluntaryWork = await prisma.voluntaryWork.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VoluntaryWorkUpdateManyArgs>(args: SelectSubset<T, VoluntaryWorkUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one VoluntaryWork.
     * @param {VoluntaryWorkUpsertArgs} args - Arguments to update or create a VoluntaryWork.
     * @example
     * // Update or create a VoluntaryWork
     * const voluntaryWork = await prisma.voluntaryWork.upsert({
     *   create: {
     *     // ... data to create a VoluntaryWork
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the VoluntaryWork we want to update
     *   }
     * })
     */
    upsert<T extends VoluntaryWorkUpsertArgs>(args: SelectSubset<T, VoluntaryWorkUpsertArgs<ExtArgs>>): Prisma__VoluntaryWorkClient<$Result.GetResult<Prisma.$VoluntaryWorkPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of VoluntaryWorks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoluntaryWorkCountArgs} args - Arguments to filter VoluntaryWorks to count.
     * @example
     * // Count the number of VoluntaryWorks
     * const count = await prisma.voluntaryWork.count({
     *   where: {
     *     // ... the filter for the VoluntaryWorks we want to count
     *   }
     * })
    **/
    count<T extends VoluntaryWorkCountArgs>(
      args?: Subset<T, VoluntaryWorkCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VoluntaryWorkCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a VoluntaryWork.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoluntaryWorkAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VoluntaryWorkAggregateArgs>(args: Subset<T, VoluntaryWorkAggregateArgs>): Prisma.PrismaPromise<GetVoluntaryWorkAggregateType<T>>

    /**
     * Group by VoluntaryWork.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoluntaryWorkGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VoluntaryWorkGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VoluntaryWorkGroupByArgs['orderBy'] }
        : { orderBy?: VoluntaryWorkGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VoluntaryWorkGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVoluntaryWorkGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the VoluntaryWork model
   */
  readonly fields: VoluntaryWorkFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for VoluntaryWork.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VoluntaryWorkClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    employee<T extends EmployeeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EmployeeDefaultArgs<ExtArgs>>): Prisma__EmployeeClient<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the VoluntaryWork model
   */ 
  interface VoluntaryWorkFieldRefs {
    readonly id: FieldRef<"VoluntaryWork", 'Int'>
    readonly employeeId: FieldRef<"VoluntaryWork", 'Int'>
    readonly organizationName: FieldRef<"VoluntaryWork", 'String'>
    readonly organizationAddress: FieldRef<"VoluntaryWork", 'String'>
    readonly dateFrom: FieldRef<"VoluntaryWork", 'DateTime'>
    readonly dateTo: FieldRef<"VoluntaryWork", 'DateTime'>
    readonly numberOfHours: FieldRef<"VoluntaryWork", 'Float'>
    readonly positionNature: FieldRef<"VoluntaryWork", 'String'>
  }
    

  // Custom InputTypes
  /**
   * VoluntaryWork findUnique
   */
  export type VoluntaryWorkFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoluntaryWork
     */
    select?: VoluntaryWorkSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoluntaryWorkInclude<ExtArgs> | null
    /**
     * Filter, which VoluntaryWork to fetch.
     */
    where: VoluntaryWorkWhereUniqueInput
  }

  /**
   * VoluntaryWork findUniqueOrThrow
   */
  export type VoluntaryWorkFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoluntaryWork
     */
    select?: VoluntaryWorkSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoluntaryWorkInclude<ExtArgs> | null
    /**
     * Filter, which VoluntaryWork to fetch.
     */
    where: VoluntaryWorkWhereUniqueInput
  }

  /**
   * VoluntaryWork findFirst
   */
  export type VoluntaryWorkFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoluntaryWork
     */
    select?: VoluntaryWorkSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoluntaryWorkInclude<ExtArgs> | null
    /**
     * Filter, which VoluntaryWork to fetch.
     */
    where?: VoluntaryWorkWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VoluntaryWorks to fetch.
     */
    orderBy?: VoluntaryWorkOrderByWithRelationInput | VoluntaryWorkOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VoluntaryWorks.
     */
    cursor?: VoluntaryWorkWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VoluntaryWorks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VoluntaryWorks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VoluntaryWorks.
     */
    distinct?: VoluntaryWorkScalarFieldEnum | VoluntaryWorkScalarFieldEnum[]
  }

  /**
   * VoluntaryWork findFirstOrThrow
   */
  export type VoluntaryWorkFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoluntaryWork
     */
    select?: VoluntaryWorkSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoluntaryWorkInclude<ExtArgs> | null
    /**
     * Filter, which VoluntaryWork to fetch.
     */
    where?: VoluntaryWorkWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VoluntaryWorks to fetch.
     */
    orderBy?: VoluntaryWorkOrderByWithRelationInput | VoluntaryWorkOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VoluntaryWorks.
     */
    cursor?: VoluntaryWorkWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VoluntaryWorks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VoluntaryWorks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VoluntaryWorks.
     */
    distinct?: VoluntaryWorkScalarFieldEnum | VoluntaryWorkScalarFieldEnum[]
  }

  /**
   * VoluntaryWork findMany
   */
  export type VoluntaryWorkFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoluntaryWork
     */
    select?: VoluntaryWorkSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoluntaryWorkInclude<ExtArgs> | null
    /**
     * Filter, which VoluntaryWorks to fetch.
     */
    where?: VoluntaryWorkWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VoluntaryWorks to fetch.
     */
    orderBy?: VoluntaryWorkOrderByWithRelationInput | VoluntaryWorkOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing VoluntaryWorks.
     */
    cursor?: VoluntaryWorkWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VoluntaryWorks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VoluntaryWorks.
     */
    skip?: number
    distinct?: VoluntaryWorkScalarFieldEnum | VoluntaryWorkScalarFieldEnum[]
  }

  /**
   * VoluntaryWork create
   */
  export type VoluntaryWorkCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoluntaryWork
     */
    select?: VoluntaryWorkSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoluntaryWorkInclude<ExtArgs> | null
    /**
     * The data needed to create a VoluntaryWork.
     */
    data: XOR<VoluntaryWorkCreateInput, VoluntaryWorkUncheckedCreateInput>
  }

  /**
   * VoluntaryWork createMany
   */
  export type VoluntaryWorkCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many VoluntaryWorks.
     */
    data: VoluntaryWorkCreateManyInput | VoluntaryWorkCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VoluntaryWork update
   */
  export type VoluntaryWorkUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoluntaryWork
     */
    select?: VoluntaryWorkSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoluntaryWorkInclude<ExtArgs> | null
    /**
     * The data needed to update a VoluntaryWork.
     */
    data: XOR<VoluntaryWorkUpdateInput, VoluntaryWorkUncheckedUpdateInput>
    /**
     * Choose, which VoluntaryWork to update.
     */
    where: VoluntaryWorkWhereUniqueInput
  }

  /**
   * VoluntaryWork updateMany
   */
  export type VoluntaryWorkUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update VoluntaryWorks.
     */
    data: XOR<VoluntaryWorkUpdateManyMutationInput, VoluntaryWorkUncheckedUpdateManyInput>
    /**
     * Filter which VoluntaryWorks to update
     */
    where?: VoluntaryWorkWhereInput
  }

  /**
   * VoluntaryWork upsert
   */
  export type VoluntaryWorkUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoluntaryWork
     */
    select?: VoluntaryWorkSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoluntaryWorkInclude<ExtArgs> | null
    /**
     * The filter to search for the VoluntaryWork to update in case it exists.
     */
    where: VoluntaryWorkWhereUniqueInput
    /**
     * In case the VoluntaryWork found by the `where` argument doesn't exist, create a new VoluntaryWork with this data.
     */
    create: XOR<VoluntaryWorkCreateInput, VoluntaryWorkUncheckedCreateInput>
    /**
     * In case the VoluntaryWork was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VoluntaryWorkUpdateInput, VoluntaryWorkUncheckedUpdateInput>
  }

  /**
   * VoluntaryWork delete
   */
  export type VoluntaryWorkDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoluntaryWork
     */
    select?: VoluntaryWorkSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoluntaryWorkInclude<ExtArgs> | null
    /**
     * Filter which VoluntaryWork to delete.
     */
    where: VoluntaryWorkWhereUniqueInput
  }

  /**
   * VoluntaryWork deleteMany
   */
  export type VoluntaryWorkDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VoluntaryWorks to delete
     */
    where?: VoluntaryWorkWhereInput
  }

  /**
   * VoluntaryWork without action
   */
  export type VoluntaryWorkDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VoluntaryWork
     */
    select?: VoluntaryWorkSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoluntaryWorkInclude<ExtArgs> | null
  }


  /**
   * Model TrainingProgram
   */

  export type AggregateTrainingProgram = {
    _count: TrainingProgramCountAggregateOutputType | null
    _avg: TrainingProgramAvgAggregateOutputType | null
    _sum: TrainingProgramSumAggregateOutputType | null
    _min: TrainingProgramMinAggregateOutputType | null
    _max: TrainingProgramMaxAggregateOutputType | null
  }

  export type TrainingProgramAvgAggregateOutputType = {
    id: number | null
    employeeId: number | null
    numberOfHours: number | null
  }

  export type TrainingProgramSumAggregateOutputType = {
    id: number | null
    employeeId: number | null
    numberOfHours: number | null
  }

  export type TrainingProgramMinAggregateOutputType = {
    id: number | null
    employeeId: number | null
    titleOfLearning: string | null
    dateFrom: Date | null
    dateTo: Date | null
    numberOfHours: number | null
    typeOfId: string | null
    sponsoredBy: string | null
  }

  export type TrainingProgramMaxAggregateOutputType = {
    id: number | null
    employeeId: number | null
    titleOfLearning: string | null
    dateFrom: Date | null
    dateTo: Date | null
    numberOfHours: number | null
    typeOfId: string | null
    sponsoredBy: string | null
  }

  export type TrainingProgramCountAggregateOutputType = {
    id: number
    employeeId: number
    titleOfLearning: number
    dateFrom: number
    dateTo: number
    numberOfHours: number
    typeOfId: number
    sponsoredBy: number
    _all: number
  }


  export type TrainingProgramAvgAggregateInputType = {
    id?: true
    employeeId?: true
    numberOfHours?: true
  }

  export type TrainingProgramSumAggregateInputType = {
    id?: true
    employeeId?: true
    numberOfHours?: true
  }

  export type TrainingProgramMinAggregateInputType = {
    id?: true
    employeeId?: true
    titleOfLearning?: true
    dateFrom?: true
    dateTo?: true
    numberOfHours?: true
    typeOfId?: true
    sponsoredBy?: true
  }

  export type TrainingProgramMaxAggregateInputType = {
    id?: true
    employeeId?: true
    titleOfLearning?: true
    dateFrom?: true
    dateTo?: true
    numberOfHours?: true
    typeOfId?: true
    sponsoredBy?: true
  }

  export type TrainingProgramCountAggregateInputType = {
    id?: true
    employeeId?: true
    titleOfLearning?: true
    dateFrom?: true
    dateTo?: true
    numberOfHours?: true
    typeOfId?: true
    sponsoredBy?: true
    _all?: true
  }

  export type TrainingProgramAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TrainingProgram to aggregate.
     */
    where?: TrainingProgramWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TrainingPrograms to fetch.
     */
    orderBy?: TrainingProgramOrderByWithRelationInput | TrainingProgramOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TrainingProgramWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TrainingPrograms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TrainingPrograms.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TrainingPrograms
    **/
    _count?: true | TrainingProgramCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TrainingProgramAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TrainingProgramSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TrainingProgramMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TrainingProgramMaxAggregateInputType
  }

  export type GetTrainingProgramAggregateType<T extends TrainingProgramAggregateArgs> = {
        [P in keyof T & keyof AggregateTrainingProgram]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTrainingProgram[P]>
      : GetScalarType<T[P], AggregateTrainingProgram[P]>
  }




  export type TrainingProgramGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TrainingProgramWhereInput
    orderBy?: TrainingProgramOrderByWithAggregationInput | TrainingProgramOrderByWithAggregationInput[]
    by: TrainingProgramScalarFieldEnum[] | TrainingProgramScalarFieldEnum
    having?: TrainingProgramScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TrainingProgramCountAggregateInputType | true
    _avg?: TrainingProgramAvgAggregateInputType
    _sum?: TrainingProgramSumAggregateInputType
    _min?: TrainingProgramMinAggregateInputType
    _max?: TrainingProgramMaxAggregateInputType
  }

  export type TrainingProgramGroupByOutputType = {
    id: number
    employeeId: number
    titleOfLearning: string
    dateFrom: Date
    dateTo: Date | null
    numberOfHours: number | null
    typeOfId: string | null
    sponsoredBy: string | null
    _count: TrainingProgramCountAggregateOutputType | null
    _avg: TrainingProgramAvgAggregateOutputType | null
    _sum: TrainingProgramSumAggregateOutputType | null
    _min: TrainingProgramMinAggregateOutputType | null
    _max: TrainingProgramMaxAggregateOutputType | null
  }

  type GetTrainingProgramGroupByPayload<T extends TrainingProgramGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TrainingProgramGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TrainingProgramGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TrainingProgramGroupByOutputType[P]>
            : GetScalarType<T[P], TrainingProgramGroupByOutputType[P]>
        }
      >
    >


  export type TrainingProgramSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    employeeId?: boolean
    titleOfLearning?: boolean
    dateFrom?: boolean
    dateTo?: boolean
    numberOfHours?: boolean
    typeOfId?: boolean
    sponsoredBy?: boolean
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["trainingProgram"]>


  export type TrainingProgramSelectScalar = {
    id?: boolean
    employeeId?: boolean
    titleOfLearning?: boolean
    dateFrom?: boolean
    dateTo?: boolean
    numberOfHours?: boolean
    typeOfId?: boolean
    sponsoredBy?: boolean
  }

  export type TrainingProgramInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }

  export type $TrainingProgramPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TrainingProgram"
    objects: {
      employee: Prisma.$EmployeePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      employeeId: number
      titleOfLearning: string
      dateFrom: Date
      dateTo: Date | null
      numberOfHours: number | null
      typeOfId: string | null
      sponsoredBy: string | null
    }, ExtArgs["result"]["trainingProgram"]>
    composites: {}
  }

  type TrainingProgramGetPayload<S extends boolean | null | undefined | TrainingProgramDefaultArgs> = $Result.GetResult<Prisma.$TrainingProgramPayload, S>

  type TrainingProgramCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TrainingProgramFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TrainingProgramCountAggregateInputType | true
    }

  export interface TrainingProgramDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TrainingProgram'], meta: { name: 'TrainingProgram' } }
    /**
     * Find zero or one TrainingProgram that matches the filter.
     * @param {TrainingProgramFindUniqueArgs} args - Arguments to find a TrainingProgram
     * @example
     * // Get one TrainingProgram
     * const trainingProgram = await prisma.trainingProgram.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TrainingProgramFindUniqueArgs>(args: SelectSubset<T, TrainingProgramFindUniqueArgs<ExtArgs>>): Prisma__TrainingProgramClient<$Result.GetResult<Prisma.$TrainingProgramPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TrainingProgram that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TrainingProgramFindUniqueOrThrowArgs} args - Arguments to find a TrainingProgram
     * @example
     * // Get one TrainingProgram
     * const trainingProgram = await prisma.trainingProgram.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TrainingProgramFindUniqueOrThrowArgs>(args: SelectSubset<T, TrainingProgramFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TrainingProgramClient<$Result.GetResult<Prisma.$TrainingProgramPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TrainingProgram that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrainingProgramFindFirstArgs} args - Arguments to find a TrainingProgram
     * @example
     * // Get one TrainingProgram
     * const trainingProgram = await prisma.trainingProgram.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TrainingProgramFindFirstArgs>(args?: SelectSubset<T, TrainingProgramFindFirstArgs<ExtArgs>>): Prisma__TrainingProgramClient<$Result.GetResult<Prisma.$TrainingProgramPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TrainingProgram that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrainingProgramFindFirstOrThrowArgs} args - Arguments to find a TrainingProgram
     * @example
     * // Get one TrainingProgram
     * const trainingProgram = await prisma.trainingProgram.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TrainingProgramFindFirstOrThrowArgs>(args?: SelectSubset<T, TrainingProgramFindFirstOrThrowArgs<ExtArgs>>): Prisma__TrainingProgramClient<$Result.GetResult<Prisma.$TrainingProgramPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TrainingPrograms that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrainingProgramFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TrainingPrograms
     * const trainingPrograms = await prisma.trainingProgram.findMany()
     * 
     * // Get first 10 TrainingPrograms
     * const trainingPrograms = await prisma.trainingProgram.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const trainingProgramWithIdOnly = await prisma.trainingProgram.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TrainingProgramFindManyArgs>(args?: SelectSubset<T, TrainingProgramFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrainingProgramPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TrainingProgram.
     * @param {TrainingProgramCreateArgs} args - Arguments to create a TrainingProgram.
     * @example
     * // Create one TrainingProgram
     * const TrainingProgram = await prisma.trainingProgram.create({
     *   data: {
     *     // ... data to create a TrainingProgram
     *   }
     * })
     * 
     */
    create<T extends TrainingProgramCreateArgs>(args: SelectSubset<T, TrainingProgramCreateArgs<ExtArgs>>): Prisma__TrainingProgramClient<$Result.GetResult<Prisma.$TrainingProgramPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TrainingPrograms.
     * @param {TrainingProgramCreateManyArgs} args - Arguments to create many TrainingPrograms.
     * @example
     * // Create many TrainingPrograms
     * const trainingProgram = await prisma.trainingProgram.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TrainingProgramCreateManyArgs>(args?: SelectSubset<T, TrainingProgramCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a TrainingProgram.
     * @param {TrainingProgramDeleteArgs} args - Arguments to delete one TrainingProgram.
     * @example
     * // Delete one TrainingProgram
     * const TrainingProgram = await prisma.trainingProgram.delete({
     *   where: {
     *     // ... filter to delete one TrainingProgram
     *   }
     * })
     * 
     */
    delete<T extends TrainingProgramDeleteArgs>(args: SelectSubset<T, TrainingProgramDeleteArgs<ExtArgs>>): Prisma__TrainingProgramClient<$Result.GetResult<Prisma.$TrainingProgramPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TrainingProgram.
     * @param {TrainingProgramUpdateArgs} args - Arguments to update one TrainingProgram.
     * @example
     * // Update one TrainingProgram
     * const trainingProgram = await prisma.trainingProgram.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TrainingProgramUpdateArgs>(args: SelectSubset<T, TrainingProgramUpdateArgs<ExtArgs>>): Prisma__TrainingProgramClient<$Result.GetResult<Prisma.$TrainingProgramPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TrainingPrograms.
     * @param {TrainingProgramDeleteManyArgs} args - Arguments to filter TrainingPrograms to delete.
     * @example
     * // Delete a few TrainingPrograms
     * const { count } = await prisma.trainingProgram.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TrainingProgramDeleteManyArgs>(args?: SelectSubset<T, TrainingProgramDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TrainingPrograms.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrainingProgramUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TrainingPrograms
     * const trainingProgram = await prisma.trainingProgram.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TrainingProgramUpdateManyArgs>(args: SelectSubset<T, TrainingProgramUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TrainingProgram.
     * @param {TrainingProgramUpsertArgs} args - Arguments to update or create a TrainingProgram.
     * @example
     * // Update or create a TrainingProgram
     * const trainingProgram = await prisma.trainingProgram.upsert({
     *   create: {
     *     // ... data to create a TrainingProgram
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TrainingProgram we want to update
     *   }
     * })
     */
    upsert<T extends TrainingProgramUpsertArgs>(args: SelectSubset<T, TrainingProgramUpsertArgs<ExtArgs>>): Prisma__TrainingProgramClient<$Result.GetResult<Prisma.$TrainingProgramPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TrainingPrograms.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrainingProgramCountArgs} args - Arguments to filter TrainingPrograms to count.
     * @example
     * // Count the number of TrainingPrograms
     * const count = await prisma.trainingProgram.count({
     *   where: {
     *     // ... the filter for the TrainingPrograms we want to count
     *   }
     * })
    **/
    count<T extends TrainingProgramCountArgs>(
      args?: Subset<T, TrainingProgramCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TrainingProgramCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TrainingProgram.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrainingProgramAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TrainingProgramAggregateArgs>(args: Subset<T, TrainingProgramAggregateArgs>): Prisma.PrismaPromise<GetTrainingProgramAggregateType<T>>

    /**
     * Group by TrainingProgram.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrainingProgramGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TrainingProgramGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TrainingProgramGroupByArgs['orderBy'] }
        : { orderBy?: TrainingProgramGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TrainingProgramGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTrainingProgramGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TrainingProgram model
   */
  readonly fields: TrainingProgramFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TrainingProgram.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TrainingProgramClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    employee<T extends EmployeeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EmployeeDefaultArgs<ExtArgs>>): Prisma__EmployeeClient<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TrainingProgram model
   */ 
  interface TrainingProgramFieldRefs {
    readonly id: FieldRef<"TrainingProgram", 'Int'>
    readonly employeeId: FieldRef<"TrainingProgram", 'Int'>
    readonly titleOfLearning: FieldRef<"TrainingProgram", 'String'>
    readonly dateFrom: FieldRef<"TrainingProgram", 'DateTime'>
    readonly dateTo: FieldRef<"TrainingProgram", 'DateTime'>
    readonly numberOfHours: FieldRef<"TrainingProgram", 'Float'>
    readonly typeOfId: FieldRef<"TrainingProgram", 'String'>
    readonly sponsoredBy: FieldRef<"TrainingProgram", 'String'>
  }
    

  // Custom InputTypes
  /**
   * TrainingProgram findUnique
   */
  export type TrainingProgramFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrainingProgram
     */
    select?: TrainingProgramSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrainingProgramInclude<ExtArgs> | null
    /**
     * Filter, which TrainingProgram to fetch.
     */
    where: TrainingProgramWhereUniqueInput
  }

  /**
   * TrainingProgram findUniqueOrThrow
   */
  export type TrainingProgramFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrainingProgram
     */
    select?: TrainingProgramSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrainingProgramInclude<ExtArgs> | null
    /**
     * Filter, which TrainingProgram to fetch.
     */
    where: TrainingProgramWhereUniqueInput
  }

  /**
   * TrainingProgram findFirst
   */
  export type TrainingProgramFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrainingProgram
     */
    select?: TrainingProgramSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrainingProgramInclude<ExtArgs> | null
    /**
     * Filter, which TrainingProgram to fetch.
     */
    where?: TrainingProgramWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TrainingPrograms to fetch.
     */
    orderBy?: TrainingProgramOrderByWithRelationInput | TrainingProgramOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TrainingPrograms.
     */
    cursor?: TrainingProgramWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TrainingPrograms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TrainingPrograms.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TrainingPrograms.
     */
    distinct?: TrainingProgramScalarFieldEnum | TrainingProgramScalarFieldEnum[]
  }

  /**
   * TrainingProgram findFirstOrThrow
   */
  export type TrainingProgramFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrainingProgram
     */
    select?: TrainingProgramSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrainingProgramInclude<ExtArgs> | null
    /**
     * Filter, which TrainingProgram to fetch.
     */
    where?: TrainingProgramWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TrainingPrograms to fetch.
     */
    orderBy?: TrainingProgramOrderByWithRelationInput | TrainingProgramOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TrainingPrograms.
     */
    cursor?: TrainingProgramWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TrainingPrograms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TrainingPrograms.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TrainingPrograms.
     */
    distinct?: TrainingProgramScalarFieldEnum | TrainingProgramScalarFieldEnum[]
  }

  /**
   * TrainingProgram findMany
   */
  export type TrainingProgramFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrainingProgram
     */
    select?: TrainingProgramSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrainingProgramInclude<ExtArgs> | null
    /**
     * Filter, which TrainingPrograms to fetch.
     */
    where?: TrainingProgramWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TrainingPrograms to fetch.
     */
    orderBy?: TrainingProgramOrderByWithRelationInput | TrainingProgramOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TrainingPrograms.
     */
    cursor?: TrainingProgramWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TrainingPrograms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TrainingPrograms.
     */
    skip?: number
    distinct?: TrainingProgramScalarFieldEnum | TrainingProgramScalarFieldEnum[]
  }

  /**
   * TrainingProgram create
   */
  export type TrainingProgramCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrainingProgram
     */
    select?: TrainingProgramSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrainingProgramInclude<ExtArgs> | null
    /**
     * The data needed to create a TrainingProgram.
     */
    data: XOR<TrainingProgramCreateInput, TrainingProgramUncheckedCreateInput>
  }

  /**
   * TrainingProgram createMany
   */
  export type TrainingProgramCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TrainingPrograms.
     */
    data: TrainingProgramCreateManyInput | TrainingProgramCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TrainingProgram update
   */
  export type TrainingProgramUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrainingProgram
     */
    select?: TrainingProgramSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrainingProgramInclude<ExtArgs> | null
    /**
     * The data needed to update a TrainingProgram.
     */
    data: XOR<TrainingProgramUpdateInput, TrainingProgramUncheckedUpdateInput>
    /**
     * Choose, which TrainingProgram to update.
     */
    where: TrainingProgramWhereUniqueInput
  }

  /**
   * TrainingProgram updateMany
   */
  export type TrainingProgramUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TrainingPrograms.
     */
    data: XOR<TrainingProgramUpdateManyMutationInput, TrainingProgramUncheckedUpdateManyInput>
    /**
     * Filter which TrainingPrograms to update
     */
    where?: TrainingProgramWhereInput
  }

  /**
   * TrainingProgram upsert
   */
  export type TrainingProgramUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrainingProgram
     */
    select?: TrainingProgramSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrainingProgramInclude<ExtArgs> | null
    /**
     * The filter to search for the TrainingProgram to update in case it exists.
     */
    where: TrainingProgramWhereUniqueInput
    /**
     * In case the TrainingProgram found by the `where` argument doesn't exist, create a new TrainingProgram with this data.
     */
    create: XOR<TrainingProgramCreateInput, TrainingProgramUncheckedCreateInput>
    /**
     * In case the TrainingProgram was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TrainingProgramUpdateInput, TrainingProgramUncheckedUpdateInput>
  }

  /**
   * TrainingProgram delete
   */
  export type TrainingProgramDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrainingProgram
     */
    select?: TrainingProgramSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrainingProgramInclude<ExtArgs> | null
    /**
     * Filter which TrainingProgram to delete.
     */
    where: TrainingProgramWhereUniqueInput
  }

  /**
   * TrainingProgram deleteMany
   */
  export type TrainingProgramDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TrainingPrograms to delete
     */
    where?: TrainingProgramWhereInput
  }

  /**
   * TrainingProgram without action
   */
  export type TrainingProgramDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrainingProgram
     */
    select?: TrainingProgramSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrainingProgramInclude<ExtArgs> | null
  }


  /**
   * Model OtherInformation
   */

  export type AggregateOtherInformation = {
    _count: OtherInformationCountAggregateOutputType | null
    _avg: OtherInformationAvgAggregateOutputType | null
    _sum: OtherInformationSumAggregateOutputType | null
    _min: OtherInformationMinAggregateOutputType | null
    _max: OtherInformationMaxAggregateOutputType | null
  }

  export type OtherInformationAvgAggregateOutputType = {
    id: number | null
    employeeId: number | null
  }

  export type OtherInformationSumAggregateOutputType = {
    id: number | null
    employeeId: number | null
  }

  export type OtherInformationMinAggregateOutputType = {
    id: number | null
    employeeId: number | null
    specialSkills: string | null
    nonAcademicDistinctions: string | null
    membershipInAssoc: string | null
  }

  export type OtherInformationMaxAggregateOutputType = {
    id: number | null
    employeeId: number | null
    specialSkills: string | null
    nonAcademicDistinctions: string | null
    membershipInAssoc: string | null
  }

  export type OtherInformationCountAggregateOutputType = {
    id: number
    employeeId: number
    specialSkills: number
    nonAcademicDistinctions: number
    membershipInAssoc: number
    _all: number
  }


  export type OtherInformationAvgAggregateInputType = {
    id?: true
    employeeId?: true
  }

  export type OtherInformationSumAggregateInputType = {
    id?: true
    employeeId?: true
  }

  export type OtherInformationMinAggregateInputType = {
    id?: true
    employeeId?: true
    specialSkills?: true
    nonAcademicDistinctions?: true
    membershipInAssoc?: true
  }

  export type OtherInformationMaxAggregateInputType = {
    id?: true
    employeeId?: true
    specialSkills?: true
    nonAcademicDistinctions?: true
    membershipInAssoc?: true
  }

  export type OtherInformationCountAggregateInputType = {
    id?: true
    employeeId?: true
    specialSkills?: true
    nonAcademicDistinctions?: true
    membershipInAssoc?: true
    _all?: true
  }

  export type OtherInformationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OtherInformation to aggregate.
     */
    where?: OtherInformationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OtherInformations to fetch.
     */
    orderBy?: OtherInformationOrderByWithRelationInput | OtherInformationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: OtherInformationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OtherInformations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OtherInformations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned OtherInformations
    **/
    _count?: true | OtherInformationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: OtherInformationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: OtherInformationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OtherInformationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OtherInformationMaxAggregateInputType
  }

  export type GetOtherInformationAggregateType<T extends OtherInformationAggregateArgs> = {
        [P in keyof T & keyof AggregateOtherInformation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOtherInformation[P]>
      : GetScalarType<T[P], AggregateOtherInformation[P]>
  }




  export type OtherInformationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OtherInformationWhereInput
    orderBy?: OtherInformationOrderByWithAggregationInput | OtherInformationOrderByWithAggregationInput[]
    by: OtherInformationScalarFieldEnum[] | OtherInformationScalarFieldEnum
    having?: OtherInformationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OtherInformationCountAggregateInputType | true
    _avg?: OtherInformationAvgAggregateInputType
    _sum?: OtherInformationSumAggregateInputType
    _min?: OtherInformationMinAggregateInputType
    _max?: OtherInformationMaxAggregateInputType
  }

  export type OtherInformationGroupByOutputType = {
    id: number
    employeeId: number
    specialSkills: string | null
    nonAcademicDistinctions: string | null
    membershipInAssoc: string | null
    _count: OtherInformationCountAggregateOutputType | null
    _avg: OtherInformationAvgAggregateOutputType | null
    _sum: OtherInformationSumAggregateOutputType | null
    _min: OtherInformationMinAggregateOutputType | null
    _max: OtherInformationMaxAggregateOutputType | null
  }

  type GetOtherInformationGroupByPayload<T extends OtherInformationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OtherInformationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OtherInformationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OtherInformationGroupByOutputType[P]>
            : GetScalarType<T[P], OtherInformationGroupByOutputType[P]>
        }
      >
    >


  export type OtherInformationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    employeeId?: boolean
    specialSkills?: boolean
    nonAcademicDistinctions?: boolean
    membershipInAssoc?: boolean
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["otherInformation"]>


  export type OtherInformationSelectScalar = {
    id?: boolean
    employeeId?: boolean
    specialSkills?: boolean
    nonAcademicDistinctions?: boolean
    membershipInAssoc?: boolean
  }

  export type OtherInformationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }

  export type $OtherInformationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "OtherInformation"
    objects: {
      employee: Prisma.$EmployeePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      employeeId: number
      specialSkills: string | null
      nonAcademicDistinctions: string | null
      membershipInAssoc: string | null
    }, ExtArgs["result"]["otherInformation"]>
    composites: {}
  }

  type OtherInformationGetPayload<S extends boolean | null | undefined | OtherInformationDefaultArgs> = $Result.GetResult<Prisma.$OtherInformationPayload, S>

  type OtherInformationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<OtherInformationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: OtherInformationCountAggregateInputType | true
    }

  export interface OtherInformationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['OtherInformation'], meta: { name: 'OtherInformation' } }
    /**
     * Find zero or one OtherInformation that matches the filter.
     * @param {OtherInformationFindUniqueArgs} args - Arguments to find a OtherInformation
     * @example
     * // Get one OtherInformation
     * const otherInformation = await prisma.otherInformation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OtherInformationFindUniqueArgs>(args: SelectSubset<T, OtherInformationFindUniqueArgs<ExtArgs>>): Prisma__OtherInformationClient<$Result.GetResult<Prisma.$OtherInformationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one OtherInformation that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {OtherInformationFindUniqueOrThrowArgs} args - Arguments to find a OtherInformation
     * @example
     * // Get one OtherInformation
     * const otherInformation = await prisma.otherInformation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OtherInformationFindUniqueOrThrowArgs>(args: SelectSubset<T, OtherInformationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OtherInformationClient<$Result.GetResult<Prisma.$OtherInformationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first OtherInformation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OtherInformationFindFirstArgs} args - Arguments to find a OtherInformation
     * @example
     * // Get one OtherInformation
     * const otherInformation = await prisma.otherInformation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OtherInformationFindFirstArgs>(args?: SelectSubset<T, OtherInformationFindFirstArgs<ExtArgs>>): Prisma__OtherInformationClient<$Result.GetResult<Prisma.$OtherInformationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first OtherInformation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OtherInformationFindFirstOrThrowArgs} args - Arguments to find a OtherInformation
     * @example
     * // Get one OtherInformation
     * const otherInformation = await prisma.otherInformation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OtherInformationFindFirstOrThrowArgs>(args?: SelectSubset<T, OtherInformationFindFirstOrThrowArgs<ExtArgs>>): Prisma__OtherInformationClient<$Result.GetResult<Prisma.$OtherInformationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more OtherInformations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OtherInformationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all OtherInformations
     * const otherInformations = await prisma.otherInformation.findMany()
     * 
     * // Get first 10 OtherInformations
     * const otherInformations = await prisma.otherInformation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const otherInformationWithIdOnly = await prisma.otherInformation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends OtherInformationFindManyArgs>(args?: SelectSubset<T, OtherInformationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OtherInformationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a OtherInformation.
     * @param {OtherInformationCreateArgs} args - Arguments to create a OtherInformation.
     * @example
     * // Create one OtherInformation
     * const OtherInformation = await prisma.otherInformation.create({
     *   data: {
     *     // ... data to create a OtherInformation
     *   }
     * })
     * 
     */
    create<T extends OtherInformationCreateArgs>(args: SelectSubset<T, OtherInformationCreateArgs<ExtArgs>>): Prisma__OtherInformationClient<$Result.GetResult<Prisma.$OtherInformationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many OtherInformations.
     * @param {OtherInformationCreateManyArgs} args - Arguments to create many OtherInformations.
     * @example
     * // Create many OtherInformations
     * const otherInformation = await prisma.otherInformation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends OtherInformationCreateManyArgs>(args?: SelectSubset<T, OtherInformationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a OtherInformation.
     * @param {OtherInformationDeleteArgs} args - Arguments to delete one OtherInformation.
     * @example
     * // Delete one OtherInformation
     * const OtherInformation = await prisma.otherInformation.delete({
     *   where: {
     *     // ... filter to delete one OtherInformation
     *   }
     * })
     * 
     */
    delete<T extends OtherInformationDeleteArgs>(args: SelectSubset<T, OtherInformationDeleteArgs<ExtArgs>>): Prisma__OtherInformationClient<$Result.GetResult<Prisma.$OtherInformationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one OtherInformation.
     * @param {OtherInformationUpdateArgs} args - Arguments to update one OtherInformation.
     * @example
     * // Update one OtherInformation
     * const otherInformation = await prisma.otherInformation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends OtherInformationUpdateArgs>(args: SelectSubset<T, OtherInformationUpdateArgs<ExtArgs>>): Prisma__OtherInformationClient<$Result.GetResult<Prisma.$OtherInformationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more OtherInformations.
     * @param {OtherInformationDeleteManyArgs} args - Arguments to filter OtherInformations to delete.
     * @example
     * // Delete a few OtherInformations
     * const { count } = await prisma.otherInformation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends OtherInformationDeleteManyArgs>(args?: SelectSubset<T, OtherInformationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more OtherInformations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OtherInformationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many OtherInformations
     * const otherInformation = await prisma.otherInformation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends OtherInformationUpdateManyArgs>(args: SelectSubset<T, OtherInformationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one OtherInformation.
     * @param {OtherInformationUpsertArgs} args - Arguments to update or create a OtherInformation.
     * @example
     * // Update or create a OtherInformation
     * const otherInformation = await prisma.otherInformation.upsert({
     *   create: {
     *     // ... data to create a OtherInformation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the OtherInformation we want to update
     *   }
     * })
     */
    upsert<T extends OtherInformationUpsertArgs>(args: SelectSubset<T, OtherInformationUpsertArgs<ExtArgs>>): Prisma__OtherInformationClient<$Result.GetResult<Prisma.$OtherInformationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of OtherInformations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OtherInformationCountArgs} args - Arguments to filter OtherInformations to count.
     * @example
     * // Count the number of OtherInformations
     * const count = await prisma.otherInformation.count({
     *   where: {
     *     // ... the filter for the OtherInformations we want to count
     *   }
     * })
    **/
    count<T extends OtherInformationCountArgs>(
      args?: Subset<T, OtherInformationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OtherInformationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a OtherInformation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OtherInformationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends OtherInformationAggregateArgs>(args: Subset<T, OtherInformationAggregateArgs>): Prisma.PrismaPromise<GetOtherInformationAggregateType<T>>

    /**
     * Group by OtherInformation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OtherInformationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends OtherInformationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OtherInformationGroupByArgs['orderBy'] }
        : { orderBy?: OtherInformationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, OtherInformationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOtherInformationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the OtherInformation model
   */
  readonly fields: OtherInformationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for OtherInformation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OtherInformationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    employee<T extends EmployeeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EmployeeDefaultArgs<ExtArgs>>): Prisma__EmployeeClient<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the OtherInformation model
   */ 
  interface OtherInformationFieldRefs {
    readonly id: FieldRef<"OtherInformation", 'Int'>
    readonly employeeId: FieldRef<"OtherInformation", 'Int'>
    readonly specialSkills: FieldRef<"OtherInformation", 'String'>
    readonly nonAcademicDistinctions: FieldRef<"OtherInformation", 'String'>
    readonly membershipInAssoc: FieldRef<"OtherInformation", 'String'>
  }
    

  // Custom InputTypes
  /**
   * OtherInformation findUnique
   */
  export type OtherInformationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OtherInformation
     */
    select?: OtherInformationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OtherInformationInclude<ExtArgs> | null
    /**
     * Filter, which OtherInformation to fetch.
     */
    where: OtherInformationWhereUniqueInput
  }

  /**
   * OtherInformation findUniqueOrThrow
   */
  export type OtherInformationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OtherInformation
     */
    select?: OtherInformationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OtherInformationInclude<ExtArgs> | null
    /**
     * Filter, which OtherInformation to fetch.
     */
    where: OtherInformationWhereUniqueInput
  }

  /**
   * OtherInformation findFirst
   */
  export type OtherInformationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OtherInformation
     */
    select?: OtherInformationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OtherInformationInclude<ExtArgs> | null
    /**
     * Filter, which OtherInformation to fetch.
     */
    where?: OtherInformationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OtherInformations to fetch.
     */
    orderBy?: OtherInformationOrderByWithRelationInput | OtherInformationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OtherInformations.
     */
    cursor?: OtherInformationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OtherInformations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OtherInformations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OtherInformations.
     */
    distinct?: OtherInformationScalarFieldEnum | OtherInformationScalarFieldEnum[]
  }

  /**
   * OtherInformation findFirstOrThrow
   */
  export type OtherInformationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OtherInformation
     */
    select?: OtherInformationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OtherInformationInclude<ExtArgs> | null
    /**
     * Filter, which OtherInformation to fetch.
     */
    where?: OtherInformationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OtherInformations to fetch.
     */
    orderBy?: OtherInformationOrderByWithRelationInput | OtherInformationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OtherInformations.
     */
    cursor?: OtherInformationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OtherInformations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OtherInformations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OtherInformations.
     */
    distinct?: OtherInformationScalarFieldEnum | OtherInformationScalarFieldEnum[]
  }

  /**
   * OtherInformation findMany
   */
  export type OtherInformationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OtherInformation
     */
    select?: OtherInformationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OtherInformationInclude<ExtArgs> | null
    /**
     * Filter, which OtherInformations to fetch.
     */
    where?: OtherInformationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OtherInformations to fetch.
     */
    orderBy?: OtherInformationOrderByWithRelationInput | OtherInformationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing OtherInformations.
     */
    cursor?: OtherInformationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OtherInformations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OtherInformations.
     */
    skip?: number
    distinct?: OtherInformationScalarFieldEnum | OtherInformationScalarFieldEnum[]
  }

  /**
   * OtherInformation create
   */
  export type OtherInformationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OtherInformation
     */
    select?: OtherInformationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OtherInformationInclude<ExtArgs> | null
    /**
     * The data needed to create a OtherInformation.
     */
    data: XOR<OtherInformationCreateInput, OtherInformationUncheckedCreateInput>
  }

  /**
   * OtherInformation createMany
   */
  export type OtherInformationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many OtherInformations.
     */
    data: OtherInformationCreateManyInput | OtherInformationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * OtherInformation update
   */
  export type OtherInformationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OtherInformation
     */
    select?: OtherInformationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OtherInformationInclude<ExtArgs> | null
    /**
     * The data needed to update a OtherInformation.
     */
    data: XOR<OtherInformationUpdateInput, OtherInformationUncheckedUpdateInput>
    /**
     * Choose, which OtherInformation to update.
     */
    where: OtherInformationWhereUniqueInput
  }

  /**
   * OtherInformation updateMany
   */
  export type OtherInformationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update OtherInformations.
     */
    data: XOR<OtherInformationUpdateManyMutationInput, OtherInformationUncheckedUpdateManyInput>
    /**
     * Filter which OtherInformations to update
     */
    where?: OtherInformationWhereInput
  }

  /**
   * OtherInformation upsert
   */
  export type OtherInformationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OtherInformation
     */
    select?: OtherInformationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OtherInformationInclude<ExtArgs> | null
    /**
     * The filter to search for the OtherInformation to update in case it exists.
     */
    where: OtherInformationWhereUniqueInput
    /**
     * In case the OtherInformation found by the `where` argument doesn't exist, create a new OtherInformation with this data.
     */
    create: XOR<OtherInformationCreateInput, OtherInformationUncheckedCreateInput>
    /**
     * In case the OtherInformation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OtherInformationUpdateInput, OtherInformationUncheckedUpdateInput>
  }

  /**
   * OtherInformation delete
   */
  export type OtherInformationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OtherInformation
     */
    select?: OtherInformationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OtherInformationInclude<ExtArgs> | null
    /**
     * Filter which OtherInformation to delete.
     */
    where: OtherInformationWhereUniqueInput
  }

  /**
   * OtherInformation deleteMany
   */
  export type OtherInformationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OtherInformations to delete
     */
    where?: OtherInformationWhereInput
  }

  /**
   * OtherInformation without action
   */
  export type OtherInformationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OtherInformation
     */
    select?: OtherInformationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OtherInformationInclude<ExtArgs> | null
  }


  /**
   * Model LeaveRecord
   */

  export type AggregateLeaveRecord = {
    _count: LeaveRecordCountAggregateOutputType | null
    _avg: LeaveRecordAvgAggregateOutputType | null
    _sum: LeaveRecordSumAggregateOutputType | null
    _min: LeaveRecordMinAggregateOutputType | null
    _max: LeaveRecordMaxAggregateOutputType | null
  }

  export type LeaveRecordAvgAggregateOutputType = {
    id: number | null
    employeeId: number | null
  }

  export type LeaveRecordSumAggregateOutputType = {
    id: number | null
    employeeId: number | null
  }

  export type LeaveRecordMinAggregateOutputType = {
    id: number | null
    employeeId: number | null
    type: string | null
    startDate: Date | null
    endDate: Date | null
    status: string | null
    reason: string | null
    createdAt: Date | null
  }

  export type LeaveRecordMaxAggregateOutputType = {
    id: number | null
    employeeId: number | null
    type: string | null
    startDate: Date | null
    endDate: Date | null
    status: string | null
    reason: string | null
    createdAt: Date | null
  }

  export type LeaveRecordCountAggregateOutputType = {
    id: number
    employeeId: number
    type: number
    startDate: number
    endDate: number
    status: number
    reason: number
    createdAt: number
    _all: number
  }


  export type LeaveRecordAvgAggregateInputType = {
    id?: true
    employeeId?: true
  }

  export type LeaveRecordSumAggregateInputType = {
    id?: true
    employeeId?: true
  }

  export type LeaveRecordMinAggregateInputType = {
    id?: true
    employeeId?: true
    type?: true
    startDate?: true
    endDate?: true
    status?: true
    reason?: true
    createdAt?: true
  }

  export type LeaveRecordMaxAggregateInputType = {
    id?: true
    employeeId?: true
    type?: true
    startDate?: true
    endDate?: true
    status?: true
    reason?: true
    createdAt?: true
  }

  export type LeaveRecordCountAggregateInputType = {
    id?: true
    employeeId?: true
    type?: true
    startDate?: true
    endDate?: true
    status?: true
    reason?: true
    createdAt?: true
    _all?: true
  }

  export type LeaveRecordAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LeaveRecord to aggregate.
     */
    where?: LeaveRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LeaveRecords to fetch.
     */
    orderBy?: LeaveRecordOrderByWithRelationInput | LeaveRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LeaveRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LeaveRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LeaveRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned LeaveRecords
    **/
    _count?: true | LeaveRecordCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LeaveRecordAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LeaveRecordSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LeaveRecordMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LeaveRecordMaxAggregateInputType
  }

  export type GetLeaveRecordAggregateType<T extends LeaveRecordAggregateArgs> = {
        [P in keyof T & keyof AggregateLeaveRecord]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLeaveRecord[P]>
      : GetScalarType<T[P], AggregateLeaveRecord[P]>
  }




  export type LeaveRecordGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LeaveRecordWhereInput
    orderBy?: LeaveRecordOrderByWithAggregationInput | LeaveRecordOrderByWithAggregationInput[]
    by: LeaveRecordScalarFieldEnum[] | LeaveRecordScalarFieldEnum
    having?: LeaveRecordScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LeaveRecordCountAggregateInputType | true
    _avg?: LeaveRecordAvgAggregateInputType
    _sum?: LeaveRecordSumAggregateInputType
    _min?: LeaveRecordMinAggregateInputType
    _max?: LeaveRecordMaxAggregateInputType
  }

  export type LeaveRecordGroupByOutputType = {
    id: number
    employeeId: number
    type: string
    startDate: Date
    endDate: Date
    status: string
    reason: string | null
    createdAt: Date
    _count: LeaveRecordCountAggregateOutputType | null
    _avg: LeaveRecordAvgAggregateOutputType | null
    _sum: LeaveRecordSumAggregateOutputType | null
    _min: LeaveRecordMinAggregateOutputType | null
    _max: LeaveRecordMaxAggregateOutputType | null
  }

  type GetLeaveRecordGroupByPayload<T extends LeaveRecordGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LeaveRecordGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LeaveRecordGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LeaveRecordGroupByOutputType[P]>
            : GetScalarType<T[P], LeaveRecordGroupByOutputType[P]>
        }
      >
    >


  export type LeaveRecordSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    employeeId?: boolean
    type?: boolean
    startDate?: boolean
    endDate?: boolean
    status?: boolean
    reason?: boolean
    createdAt?: boolean
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["leaveRecord"]>


  export type LeaveRecordSelectScalar = {
    id?: boolean
    employeeId?: boolean
    type?: boolean
    startDate?: boolean
    endDate?: boolean
    status?: boolean
    reason?: boolean
    createdAt?: boolean
  }

  export type LeaveRecordInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    employee?: boolean | EmployeeDefaultArgs<ExtArgs>
  }

  export type $LeaveRecordPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "LeaveRecord"
    objects: {
      employee: Prisma.$EmployeePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      employeeId: number
      type: string
      startDate: Date
      endDate: Date
      status: string
      reason: string | null
      createdAt: Date
    }, ExtArgs["result"]["leaveRecord"]>
    composites: {}
  }

  type LeaveRecordGetPayload<S extends boolean | null | undefined | LeaveRecordDefaultArgs> = $Result.GetResult<Prisma.$LeaveRecordPayload, S>

  type LeaveRecordCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<LeaveRecordFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: LeaveRecordCountAggregateInputType | true
    }

  export interface LeaveRecordDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['LeaveRecord'], meta: { name: 'LeaveRecord' } }
    /**
     * Find zero or one LeaveRecord that matches the filter.
     * @param {LeaveRecordFindUniqueArgs} args - Arguments to find a LeaveRecord
     * @example
     * // Get one LeaveRecord
     * const leaveRecord = await prisma.leaveRecord.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LeaveRecordFindUniqueArgs>(args: SelectSubset<T, LeaveRecordFindUniqueArgs<ExtArgs>>): Prisma__LeaveRecordClient<$Result.GetResult<Prisma.$LeaveRecordPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one LeaveRecord that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {LeaveRecordFindUniqueOrThrowArgs} args - Arguments to find a LeaveRecord
     * @example
     * // Get one LeaveRecord
     * const leaveRecord = await prisma.leaveRecord.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LeaveRecordFindUniqueOrThrowArgs>(args: SelectSubset<T, LeaveRecordFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LeaveRecordClient<$Result.GetResult<Prisma.$LeaveRecordPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first LeaveRecord that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaveRecordFindFirstArgs} args - Arguments to find a LeaveRecord
     * @example
     * // Get one LeaveRecord
     * const leaveRecord = await prisma.leaveRecord.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LeaveRecordFindFirstArgs>(args?: SelectSubset<T, LeaveRecordFindFirstArgs<ExtArgs>>): Prisma__LeaveRecordClient<$Result.GetResult<Prisma.$LeaveRecordPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first LeaveRecord that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaveRecordFindFirstOrThrowArgs} args - Arguments to find a LeaveRecord
     * @example
     * // Get one LeaveRecord
     * const leaveRecord = await prisma.leaveRecord.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LeaveRecordFindFirstOrThrowArgs>(args?: SelectSubset<T, LeaveRecordFindFirstOrThrowArgs<ExtArgs>>): Prisma__LeaveRecordClient<$Result.GetResult<Prisma.$LeaveRecordPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more LeaveRecords that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaveRecordFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all LeaveRecords
     * const leaveRecords = await prisma.leaveRecord.findMany()
     * 
     * // Get first 10 LeaveRecords
     * const leaveRecords = await prisma.leaveRecord.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const leaveRecordWithIdOnly = await prisma.leaveRecord.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LeaveRecordFindManyArgs>(args?: SelectSubset<T, LeaveRecordFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LeaveRecordPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a LeaveRecord.
     * @param {LeaveRecordCreateArgs} args - Arguments to create a LeaveRecord.
     * @example
     * // Create one LeaveRecord
     * const LeaveRecord = await prisma.leaveRecord.create({
     *   data: {
     *     // ... data to create a LeaveRecord
     *   }
     * })
     * 
     */
    create<T extends LeaveRecordCreateArgs>(args: SelectSubset<T, LeaveRecordCreateArgs<ExtArgs>>): Prisma__LeaveRecordClient<$Result.GetResult<Prisma.$LeaveRecordPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many LeaveRecords.
     * @param {LeaveRecordCreateManyArgs} args - Arguments to create many LeaveRecords.
     * @example
     * // Create many LeaveRecords
     * const leaveRecord = await prisma.leaveRecord.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LeaveRecordCreateManyArgs>(args?: SelectSubset<T, LeaveRecordCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a LeaveRecord.
     * @param {LeaveRecordDeleteArgs} args - Arguments to delete one LeaveRecord.
     * @example
     * // Delete one LeaveRecord
     * const LeaveRecord = await prisma.leaveRecord.delete({
     *   where: {
     *     // ... filter to delete one LeaveRecord
     *   }
     * })
     * 
     */
    delete<T extends LeaveRecordDeleteArgs>(args: SelectSubset<T, LeaveRecordDeleteArgs<ExtArgs>>): Prisma__LeaveRecordClient<$Result.GetResult<Prisma.$LeaveRecordPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one LeaveRecord.
     * @param {LeaveRecordUpdateArgs} args - Arguments to update one LeaveRecord.
     * @example
     * // Update one LeaveRecord
     * const leaveRecord = await prisma.leaveRecord.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LeaveRecordUpdateArgs>(args: SelectSubset<T, LeaveRecordUpdateArgs<ExtArgs>>): Prisma__LeaveRecordClient<$Result.GetResult<Prisma.$LeaveRecordPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more LeaveRecords.
     * @param {LeaveRecordDeleteManyArgs} args - Arguments to filter LeaveRecords to delete.
     * @example
     * // Delete a few LeaveRecords
     * const { count } = await prisma.leaveRecord.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LeaveRecordDeleteManyArgs>(args?: SelectSubset<T, LeaveRecordDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LeaveRecords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaveRecordUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many LeaveRecords
     * const leaveRecord = await prisma.leaveRecord.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LeaveRecordUpdateManyArgs>(args: SelectSubset<T, LeaveRecordUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one LeaveRecord.
     * @param {LeaveRecordUpsertArgs} args - Arguments to update or create a LeaveRecord.
     * @example
     * // Update or create a LeaveRecord
     * const leaveRecord = await prisma.leaveRecord.upsert({
     *   create: {
     *     // ... data to create a LeaveRecord
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the LeaveRecord we want to update
     *   }
     * })
     */
    upsert<T extends LeaveRecordUpsertArgs>(args: SelectSubset<T, LeaveRecordUpsertArgs<ExtArgs>>): Prisma__LeaveRecordClient<$Result.GetResult<Prisma.$LeaveRecordPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of LeaveRecords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaveRecordCountArgs} args - Arguments to filter LeaveRecords to count.
     * @example
     * // Count the number of LeaveRecords
     * const count = await prisma.leaveRecord.count({
     *   where: {
     *     // ... the filter for the LeaveRecords we want to count
     *   }
     * })
    **/
    count<T extends LeaveRecordCountArgs>(
      args?: Subset<T, LeaveRecordCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LeaveRecordCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a LeaveRecord.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaveRecordAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LeaveRecordAggregateArgs>(args: Subset<T, LeaveRecordAggregateArgs>): Prisma.PrismaPromise<GetLeaveRecordAggregateType<T>>

    /**
     * Group by LeaveRecord.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaveRecordGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LeaveRecordGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LeaveRecordGroupByArgs['orderBy'] }
        : { orderBy?: LeaveRecordGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LeaveRecordGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLeaveRecordGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the LeaveRecord model
   */
  readonly fields: LeaveRecordFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for LeaveRecord.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LeaveRecordClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    employee<T extends EmployeeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EmployeeDefaultArgs<ExtArgs>>): Prisma__EmployeeClient<$Result.GetResult<Prisma.$EmployeePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the LeaveRecord model
   */ 
  interface LeaveRecordFieldRefs {
    readonly id: FieldRef<"LeaveRecord", 'Int'>
    readonly employeeId: FieldRef<"LeaveRecord", 'Int'>
    readonly type: FieldRef<"LeaveRecord", 'String'>
    readonly startDate: FieldRef<"LeaveRecord", 'DateTime'>
    readonly endDate: FieldRef<"LeaveRecord", 'DateTime'>
    readonly status: FieldRef<"LeaveRecord", 'String'>
    readonly reason: FieldRef<"LeaveRecord", 'String'>
    readonly createdAt: FieldRef<"LeaveRecord", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * LeaveRecord findUnique
   */
  export type LeaveRecordFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaveRecord
     */
    select?: LeaveRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveRecordInclude<ExtArgs> | null
    /**
     * Filter, which LeaveRecord to fetch.
     */
    where: LeaveRecordWhereUniqueInput
  }

  /**
   * LeaveRecord findUniqueOrThrow
   */
  export type LeaveRecordFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaveRecord
     */
    select?: LeaveRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveRecordInclude<ExtArgs> | null
    /**
     * Filter, which LeaveRecord to fetch.
     */
    where: LeaveRecordWhereUniqueInput
  }

  /**
   * LeaveRecord findFirst
   */
  export type LeaveRecordFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaveRecord
     */
    select?: LeaveRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveRecordInclude<ExtArgs> | null
    /**
     * Filter, which LeaveRecord to fetch.
     */
    where?: LeaveRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LeaveRecords to fetch.
     */
    orderBy?: LeaveRecordOrderByWithRelationInput | LeaveRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LeaveRecords.
     */
    cursor?: LeaveRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LeaveRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LeaveRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LeaveRecords.
     */
    distinct?: LeaveRecordScalarFieldEnum | LeaveRecordScalarFieldEnum[]
  }

  /**
   * LeaveRecord findFirstOrThrow
   */
  export type LeaveRecordFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaveRecord
     */
    select?: LeaveRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveRecordInclude<ExtArgs> | null
    /**
     * Filter, which LeaveRecord to fetch.
     */
    where?: LeaveRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LeaveRecords to fetch.
     */
    orderBy?: LeaveRecordOrderByWithRelationInput | LeaveRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LeaveRecords.
     */
    cursor?: LeaveRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LeaveRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LeaveRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LeaveRecords.
     */
    distinct?: LeaveRecordScalarFieldEnum | LeaveRecordScalarFieldEnum[]
  }

  /**
   * LeaveRecord findMany
   */
  export type LeaveRecordFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaveRecord
     */
    select?: LeaveRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveRecordInclude<ExtArgs> | null
    /**
     * Filter, which LeaveRecords to fetch.
     */
    where?: LeaveRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LeaveRecords to fetch.
     */
    orderBy?: LeaveRecordOrderByWithRelationInput | LeaveRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing LeaveRecords.
     */
    cursor?: LeaveRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LeaveRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LeaveRecords.
     */
    skip?: number
    distinct?: LeaveRecordScalarFieldEnum | LeaveRecordScalarFieldEnum[]
  }

  /**
   * LeaveRecord create
   */
  export type LeaveRecordCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaveRecord
     */
    select?: LeaveRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveRecordInclude<ExtArgs> | null
    /**
     * The data needed to create a LeaveRecord.
     */
    data: XOR<LeaveRecordCreateInput, LeaveRecordUncheckedCreateInput>
  }

  /**
   * LeaveRecord createMany
   */
  export type LeaveRecordCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many LeaveRecords.
     */
    data: LeaveRecordCreateManyInput | LeaveRecordCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LeaveRecord update
   */
  export type LeaveRecordUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaveRecord
     */
    select?: LeaveRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveRecordInclude<ExtArgs> | null
    /**
     * The data needed to update a LeaveRecord.
     */
    data: XOR<LeaveRecordUpdateInput, LeaveRecordUncheckedUpdateInput>
    /**
     * Choose, which LeaveRecord to update.
     */
    where: LeaveRecordWhereUniqueInput
  }

  /**
   * LeaveRecord updateMany
   */
  export type LeaveRecordUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update LeaveRecords.
     */
    data: XOR<LeaveRecordUpdateManyMutationInput, LeaveRecordUncheckedUpdateManyInput>
    /**
     * Filter which LeaveRecords to update
     */
    where?: LeaveRecordWhereInput
  }

  /**
   * LeaveRecord upsert
   */
  export type LeaveRecordUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaveRecord
     */
    select?: LeaveRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveRecordInclude<ExtArgs> | null
    /**
     * The filter to search for the LeaveRecord to update in case it exists.
     */
    where: LeaveRecordWhereUniqueInput
    /**
     * In case the LeaveRecord found by the `where` argument doesn't exist, create a new LeaveRecord with this data.
     */
    create: XOR<LeaveRecordCreateInput, LeaveRecordUncheckedCreateInput>
    /**
     * In case the LeaveRecord was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LeaveRecordUpdateInput, LeaveRecordUncheckedUpdateInput>
  }

  /**
   * LeaveRecord delete
   */
  export type LeaveRecordDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaveRecord
     */
    select?: LeaveRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveRecordInclude<ExtArgs> | null
    /**
     * Filter which LeaveRecord to delete.
     */
    where: LeaveRecordWhereUniqueInput
  }

  /**
   * LeaveRecord deleteMany
   */
  export type LeaveRecordDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LeaveRecords to delete
     */
    where?: LeaveRecordWhereInput
  }

  /**
   * LeaveRecord without action
   */
  export type LeaveRecordDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaveRecord
     */
    select?: LeaveRecordSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveRecordInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const AgencyScalarFieldEnum: {
    id: 'id',
    name: 'name',
    address: 'address',
    contactNo: 'contactNo',
    logoBase64: 'logoBase64'
  };

  export type AgencyScalarFieldEnum = (typeof AgencyScalarFieldEnum)[keyof typeof AgencyScalarFieldEnum]


  export const DepartmentScalarFieldEnum: {
    id: 'id',
    name: 'name'
  };

  export type DepartmentScalarFieldEnum = (typeof DepartmentScalarFieldEnum)[keyof typeof DepartmentScalarFieldEnum]


  export const PositionScalarFieldEnum: {
    id: 'id',
    title: 'title'
  };

  export type PositionScalarFieldEnum = (typeof PositionScalarFieldEnum)[keyof typeof PositionScalarFieldEnum]


  export const SalaryGradeScalarFieldEnum: {
    id: 'id',
    grade: 'grade',
    step: 'step',
    amount: 'amount'
  };

  export type SalaryGradeScalarFieldEnum = (typeof SalaryGradeScalarFieldEnum)[keyof typeof SalaryGradeScalarFieldEnum]


  export const UserScalarFieldEnum: {
    id: 'id',
    username: 'username',
    password: 'password',
    role: 'role',
    name: 'name'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const EmployeeScalarFieldEnum: {
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

  export type EmployeeScalarFieldEnum = (typeof EmployeeScalarFieldEnum)[keyof typeof EmployeeScalarFieldEnum]


  export const FamilyBackgroundScalarFieldEnum: {
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

  export type FamilyBackgroundScalarFieldEnum = (typeof FamilyBackgroundScalarFieldEnum)[keyof typeof FamilyBackgroundScalarFieldEnum]


  export const ChildRecordScalarFieldEnum: {
    id: 'id',
    employeeId: 'employeeId',
    name: 'name',
    dateOfBirth: 'dateOfBirth'
  };

  export type ChildRecordScalarFieldEnum = (typeof ChildRecordScalarFieldEnum)[keyof typeof ChildRecordScalarFieldEnum]


  export const EducationalBackgroundScalarFieldEnum: {
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

  export type EducationalBackgroundScalarFieldEnum = (typeof EducationalBackgroundScalarFieldEnum)[keyof typeof EducationalBackgroundScalarFieldEnum]


  export const CivilServiceEligibilityScalarFieldEnum: {
    id: 'id',
    employeeId: 'employeeId',
    careerService: 'careerService',
    rating: 'rating',
    dateOfExamination: 'dateOfExamination',
    placeOfExamination: 'placeOfExamination',
    licenseNo: 'licenseNo',
    licenseValidity: 'licenseValidity'
  };

  export type CivilServiceEligibilityScalarFieldEnum = (typeof CivilServiceEligibilityScalarFieldEnum)[keyof typeof CivilServiceEligibilityScalarFieldEnum]


  export const WorkExperienceScalarFieldEnum: {
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

  export type WorkExperienceScalarFieldEnum = (typeof WorkExperienceScalarFieldEnum)[keyof typeof WorkExperienceScalarFieldEnum]


  export const VoluntaryWorkScalarFieldEnum: {
    id: 'id',
    employeeId: 'employeeId',
    organizationName: 'organizationName',
    organizationAddress: 'organizationAddress',
    dateFrom: 'dateFrom',
    dateTo: 'dateTo',
    numberOfHours: 'numberOfHours',
    positionNature: 'positionNature'
  };

  export type VoluntaryWorkScalarFieldEnum = (typeof VoluntaryWorkScalarFieldEnum)[keyof typeof VoluntaryWorkScalarFieldEnum]


  export const TrainingProgramScalarFieldEnum: {
    id: 'id',
    employeeId: 'employeeId',
    titleOfLearning: 'titleOfLearning',
    dateFrom: 'dateFrom',
    dateTo: 'dateTo',
    numberOfHours: 'numberOfHours',
    typeOfId: 'typeOfId',
    sponsoredBy: 'sponsoredBy'
  };

  export type TrainingProgramScalarFieldEnum = (typeof TrainingProgramScalarFieldEnum)[keyof typeof TrainingProgramScalarFieldEnum]


  export const OtherInformationScalarFieldEnum: {
    id: 'id',
    employeeId: 'employeeId',
    specialSkills: 'specialSkills',
    nonAcademicDistinctions: 'nonAcademicDistinctions',
    membershipInAssoc: 'membershipInAssoc'
  };

  export type OtherInformationScalarFieldEnum = (typeof OtherInformationScalarFieldEnum)[keyof typeof OtherInformationScalarFieldEnum]


  export const LeaveRecordScalarFieldEnum: {
    id: 'id',
    employeeId: 'employeeId',
    type: 'type',
    startDate: 'startDate',
    endDate: 'endDate',
    status: 'status',
    reason: 'reason',
    createdAt: 'createdAt'
  };

  export type LeaveRecordScalarFieldEnum = (typeof LeaveRecordScalarFieldEnum)[keyof typeof LeaveRecordScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const AgencyOrderByRelevanceFieldEnum: {
    name: 'name',
    address: 'address',
    contactNo: 'contactNo',
    logoBase64: 'logoBase64'
  };

  export type AgencyOrderByRelevanceFieldEnum = (typeof AgencyOrderByRelevanceFieldEnum)[keyof typeof AgencyOrderByRelevanceFieldEnum]


  export const DepartmentOrderByRelevanceFieldEnum: {
    name: 'name'
  };

  export type DepartmentOrderByRelevanceFieldEnum = (typeof DepartmentOrderByRelevanceFieldEnum)[keyof typeof DepartmentOrderByRelevanceFieldEnum]


  export const PositionOrderByRelevanceFieldEnum: {
    title: 'title'
  };

  export type PositionOrderByRelevanceFieldEnum = (typeof PositionOrderByRelevanceFieldEnum)[keyof typeof PositionOrderByRelevanceFieldEnum]


  export const UserOrderByRelevanceFieldEnum: {
    username: 'username',
    password: 'password',
    role: 'role',
    name: 'name'
  };

  export type UserOrderByRelevanceFieldEnum = (typeof UserOrderByRelevanceFieldEnum)[keyof typeof UserOrderByRelevanceFieldEnum]


  export const EmployeeOrderByRelevanceFieldEnum: {
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

  export type EmployeeOrderByRelevanceFieldEnum = (typeof EmployeeOrderByRelevanceFieldEnum)[keyof typeof EmployeeOrderByRelevanceFieldEnum]


  export const FamilyBackgroundOrderByRelevanceFieldEnum: {
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

  export type FamilyBackgroundOrderByRelevanceFieldEnum = (typeof FamilyBackgroundOrderByRelevanceFieldEnum)[keyof typeof FamilyBackgroundOrderByRelevanceFieldEnum]


  export const ChildRecordOrderByRelevanceFieldEnum: {
    name: 'name'
  };

  export type ChildRecordOrderByRelevanceFieldEnum = (typeof ChildRecordOrderByRelevanceFieldEnum)[keyof typeof ChildRecordOrderByRelevanceFieldEnum]


  export const EducationalBackgroundOrderByRelevanceFieldEnum: {
    level: 'level',
    schoolName: 'schoolName',
    degreeCourse: 'degreeCourse',
    yearGraduated: 'yearGraduated',
    highestLevelEarned: 'highestLevelEarned',
    scholarships: 'scholarships'
  };

  export type EducationalBackgroundOrderByRelevanceFieldEnum = (typeof EducationalBackgroundOrderByRelevanceFieldEnum)[keyof typeof EducationalBackgroundOrderByRelevanceFieldEnum]


  export const CivilServiceEligibilityOrderByRelevanceFieldEnum: {
    careerService: 'careerService',
    placeOfExamination: 'placeOfExamination',
    licenseNo: 'licenseNo'
  };

  export type CivilServiceEligibilityOrderByRelevanceFieldEnum = (typeof CivilServiceEligibilityOrderByRelevanceFieldEnum)[keyof typeof CivilServiceEligibilityOrderByRelevanceFieldEnum]


  export const WorkExperienceOrderByRelevanceFieldEnum: {
    positionTitle: 'positionTitle',
    departmentAgencyCompany: 'departmentAgencyCompany',
    salaryGrade: 'salaryGrade',
    statusOfAppointment: 'statusOfAppointment'
  };

  export type WorkExperienceOrderByRelevanceFieldEnum = (typeof WorkExperienceOrderByRelevanceFieldEnum)[keyof typeof WorkExperienceOrderByRelevanceFieldEnum]


  export const VoluntaryWorkOrderByRelevanceFieldEnum: {
    organizationName: 'organizationName',
    organizationAddress: 'organizationAddress',
    positionNature: 'positionNature'
  };

  export type VoluntaryWorkOrderByRelevanceFieldEnum = (typeof VoluntaryWorkOrderByRelevanceFieldEnum)[keyof typeof VoluntaryWorkOrderByRelevanceFieldEnum]


  export const TrainingProgramOrderByRelevanceFieldEnum: {
    titleOfLearning: 'titleOfLearning',
    typeOfId: 'typeOfId',
    sponsoredBy: 'sponsoredBy'
  };

  export type TrainingProgramOrderByRelevanceFieldEnum = (typeof TrainingProgramOrderByRelevanceFieldEnum)[keyof typeof TrainingProgramOrderByRelevanceFieldEnum]


  export const OtherInformationOrderByRelevanceFieldEnum: {
    specialSkills: 'specialSkills',
    nonAcademicDistinctions: 'nonAcademicDistinctions',
    membershipInAssoc: 'membershipInAssoc'
  };

  export type OtherInformationOrderByRelevanceFieldEnum = (typeof OtherInformationOrderByRelevanceFieldEnum)[keyof typeof OtherInformationOrderByRelevanceFieldEnum]


  export const LeaveRecordOrderByRelevanceFieldEnum: {
    type: 'type',
    status: 'status',
    reason: 'reason'
  };

  export type LeaveRecordOrderByRelevanceFieldEnum = (typeof LeaveRecordOrderByRelevanceFieldEnum)[keyof typeof LeaveRecordOrderByRelevanceFieldEnum]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    
  /**
   * Deep Input Types
   */


  export type AgencyWhereInput = {
    AND?: AgencyWhereInput | AgencyWhereInput[]
    OR?: AgencyWhereInput[]
    NOT?: AgencyWhereInput | AgencyWhereInput[]
    id?: IntFilter<"Agency"> | number
    name?: StringFilter<"Agency"> | string
    address?: StringFilter<"Agency"> | string
    contactNo?: StringFilter<"Agency"> | string
    logoBase64?: StringNullableFilter<"Agency"> | string | null
  }

  export type AgencyOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    address?: SortOrder
    contactNo?: SortOrder
    logoBase64?: SortOrderInput | SortOrder
    _relevance?: AgencyOrderByRelevanceInput
  }

  export type AgencyWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: AgencyWhereInput | AgencyWhereInput[]
    OR?: AgencyWhereInput[]
    NOT?: AgencyWhereInput | AgencyWhereInput[]
    name?: StringFilter<"Agency"> | string
    address?: StringFilter<"Agency"> | string
    contactNo?: StringFilter<"Agency"> | string
    logoBase64?: StringNullableFilter<"Agency"> | string | null
  }, "id">

  export type AgencyOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    address?: SortOrder
    contactNo?: SortOrder
    logoBase64?: SortOrderInput | SortOrder
    _count?: AgencyCountOrderByAggregateInput
    _avg?: AgencyAvgOrderByAggregateInput
    _max?: AgencyMaxOrderByAggregateInput
    _min?: AgencyMinOrderByAggregateInput
    _sum?: AgencySumOrderByAggregateInput
  }

  export type AgencyScalarWhereWithAggregatesInput = {
    AND?: AgencyScalarWhereWithAggregatesInput | AgencyScalarWhereWithAggregatesInput[]
    OR?: AgencyScalarWhereWithAggregatesInput[]
    NOT?: AgencyScalarWhereWithAggregatesInput | AgencyScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Agency"> | number
    name?: StringWithAggregatesFilter<"Agency"> | string
    address?: StringWithAggregatesFilter<"Agency"> | string
    contactNo?: StringWithAggregatesFilter<"Agency"> | string
    logoBase64?: StringNullableWithAggregatesFilter<"Agency"> | string | null
  }

  export type DepartmentWhereInput = {
    AND?: DepartmentWhereInput | DepartmentWhereInput[]
    OR?: DepartmentWhereInput[]
    NOT?: DepartmentWhereInput | DepartmentWhereInput[]
    id?: IntFilter<"Department"> | number
    name?: StringFilter<"Department"> | string
    employees?: EmployeeListRelationFilter
  }

  export type DepartmentOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    employees?: EmployeeOrderByRelationAggregateInput
    _relevance?: DepartmentOrderByRelevanceInput
  }

  export type DepartmentWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    name?: string
    AND?: DepartmentWhereInput | DepartmentWhereInput[]
    OR?: DepartmentWhereInput[]
    NOT?: DepartmentWhereInput | DepartmentWhereInput[]
    employees?: EmployeeListRelationFilter
  }, "id" | "name">

  export type DepartmentOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    _count?: DepartmentCountOrderByAggregateInput
    _avg?: DepartmentAvgOrderByAggregateInput
    _max?: DepartmentMaxOrderByAggregateInput
    _min?: DepartmentMinOrderByAggregateInput
    _sum?: DepartmentSumOrderByAggregateInput
  }

  export type DepartmentScalarWhereWithAggregatesInput = {
    AND?: DepartmentScalarWhereWithAggregatesInput | DepartmentScalarWhereWithAggregatesInput[]
    OR?: DepartmentScalarWhereWithAggregatesInput[]
    NOT?: DepartmentScalarWhereWithAggregatesInput | DepartmentScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Department"> | number
    name?: StringWithAggregatesFilter<"Department"> | string
  }

  export type PositionWhereInput = {
    AND?: PositionWhereInput | PositionWhereInput[]
    OR?: PositionWhereInput[]
    NOT?: PositionWhereInput | PositionWhereInput[]
    id?: IntFilter<"Position"> | number
    title?: StringFilter<"Position"> | string
    employees?: EmployeeListRelationFilter
  }

  export type PositionOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    employees?: EmployeeOrderByRelationAggregateInput
    _relevance?: PositionOrderByRelevanceInput
  }

  export type PositionWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    title?: string
    AND?: PositionWhereInput | PositionWhereInput[]
    OR?: PositionWhereInput[]
    NOT?: PositionWhereInput | PositionWhereInput[]
    employees?: EmployeeListRelationFilter
  }, "id" | "title">

  export type PositionOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    _count?: PositionCountOrderByAggregateInput
    _avg?: PositionAvgOrderByAggregateInput
    _max?: PositionMaxOrderByAggregateInput
    _min?: PositionMinOrderByAggregateInput
    _sum?: PositionSumOrderByAggregateInput
  }

  export type PositionScalarWhereWithAggregatesInput = {
    AND?: PositionScalarWhereWithAggregatesInput | PositionScalarWhereWithAggregatesInput[]
    OR?: PositionScalarWhereWithAggregatesInput[]
    NOT?: PositionScalarWhereWithAggregatesInput | PositionScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Position"> | number
    title?: StringWithAggregatesFilter<"Position"> | string
  }

  export type SalaryGradeWhereInput = {
    AND?: SalaryGradeWhereInput | SalaryGradeWhereInput[]
    OR?: SalaryGradeWhereInput[]
    NOT?: SalaryGradeWhereInput | SalaryGradeWhereInput[]
    id?: IntFilter<"SalaryGrade"> | number
    grade?: IntFilter<"SalaryGrade"> | number
    step?: IntFilter<"SalaryGrade"> | number
    amount?: FloatFilter<"SalaryGrade"> | number
  }

  export type SalaryGradeOrderByWithRelationInput = {
    id?: SortOrder
    grade?: SortOrder
    step?: SortOrder
    amount?: SortOrder
  }

  export type SalaryGradeWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    grade?: number
    AND?: SalaryGradeWhereInput | SalaryGradeWhereInput[]
    OR?: SalaryGradeWhereInput[]
    NOT?: SalaryGradeWhereInput | SalaryGradeWhereInput[]
    step?: IntFilter<"SalaryGrade"> | number
    amount?: FloatFilter<"SalaryGrade"> | number
  }, "id" | "grade">

  export type SalaryGradeOrderByWithAggregationInput = {
    id?: SortOrder
    grade?: SortOrder
    step?: SortOrder
    amount?: SortOrder
    _count?: SalaryGradeCountOrderByAggregateInput
    _avg?: SalaryGradeAvgOrderByAggregateInput
    _max?: SalaryGradeMaxOrderByAggregateInput
    _min?: SalaryGradeMinOrderByAggregateInput
    _sum?: SalaryGradeSumOrderByAggregateInput
  }

  export type SalaryGradeScalarWhereWithAggregatesInput = {
    AND?: SalaryGradeScalarWhereWithAggregatesInput | SalaryGradeScalarWhereWithAggregatesInput[]
    OR?: SalaryGradeScalarWhereWithAggregatesInput[]
    NOT?: SalaryGradeScalarWhereWithAggregatesInput | SalaryGradeScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"SalaryGrade"> | number
    grade?: IntWithAggregatesFilter<"SalaryGrade"> | number
    step?: IntWithAggregatesFilter<"SalaryGrade"> | number
    amount?: FloatWithAggregatesFilter<"SalaryGrade"> | number
  }

  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: IntFilter<"User"> | number
    username?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    role?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    role?: SortOrder
    name?: SortOrder
    _relevance?: UserOrderByRelevanceInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    username?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    password?: StringFilter<"User"> | string
    role?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
  }, "id" | "username">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    role?: SortOrder
    name?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"User"> | number
    username?: StringWithAggregatesFilter<"User"> | string
    password?: StringWithAggregatesFilter<"User"> | string
    role?: StringWithAggregatesFilter<"User"> | string
    name?: StringWithAggregatesFilter<"User"> | string
  }

  export type EmployeeWhereInput = {
    AND?: EmployeeWhereInput | EmployeeWhereInput[]
    OR?: EmployeeWhereInput[]
    NOT?: EmployeeWhereInput | EmployeeWhereInput[]
    id?: IntFilter<"Employee"> | number
    firstName?: StringFilter<"Employee"> | string
    lastName?: StringFilter<"Employee"> | string
    middleName?: StringNullableFilter<"Employee"> | string | null
    nameExtension?: StringNullableFilter<"Employee"> | string | null
    dateOfBirth?: DateTimeFilter<"Employee"> | Date | string
    placeOfBirth?: StringFilter<"Employee"> | string
    sex?: StringFilter<"Employee"> | string
    civilStatus?: StringFilter<"Employee"> | string
    height?: FloatNullableFilter<"Employee"> | number | null
    weight?: FloatNullableFilter<"Employee"> | number | null
    bloodType?: StringNullableFilter<"Employee"> | string | null
    gsisNo?: StringNullableFilter<"Employee"> | string | null
    pagibigNo?: StringNullableFilter<"Employee"> | string | null
    philhealthNo?: StringNullableFilter<"Employee"> | string | null
    sssNo?: StringNullableFilter<"Employee"> | string | null
    tinNo?: StringNullableFilter<"Employee"> | string | null
    agencyEmployeeNo?: StringNullableFilter<"Employee"> | string | null
    citizenship?: StringFilter<"Employee"> | string
    residentialAddress?: StringFilter<"Employee"> | string
    permanentAddress?: StringFilter<"Employee"> | string
    telephoneNo?: StringNullableFilter<"Employee"> | string | null
    mobileNo?: StringNullableFilter<"Employee"> | string | null
    email?: StringNullableFilter<"Employee"> | string | null
    departmentId?: IntFilter<"Employee"> | number
    positionId?: IntFilter<"Employee"> | number
    status?: StringFilter<"Employee"> | string
    dateHired?: DateTimeNullableFilter<"Employee"> | Date | string | null
    createdAt?: DateTimeFilter<"Employee"> | Date | string
    updatedAt?: DateTimeFilter<"Employee"> | Date | string
    department?: XOR<DepartmentScalarRelationFilter, DepartmentWhereInput>
    position?: XOR<PositionScalarRelationFilter, PositionWhereInput>
    children?: ChildRecordListRelationFilter
    education?: EducationalBackgroundListRelationFilter
    civilService?: CivilServiceEligibilityListRelationFilter
    workExperience?: WorkExperienceListRelationFilter
    voluntaryWork?: VoluntaryWorkListRelationFilter
    training?: TrainingProgramListRelationFilter
    skills?: OtherInformationListRelationFilter
    family?: XOR<FamilyBackgroundNullableScalarRelationFilter, FamilyBackgroundWhereInput> | null
    leaves?: LeaveRecordListRelationFilter
  }

  export type EmployeeOrderByWithRelationInput = {
    id?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    middleName?: SortOrderInput | SortOrder
    nameExtension?: SortOrderInput | SortOrder
    dateOfBirth?: SortOrder
    placeOfBirth?: SortOrder
    sex?: SortOrder
    civilStatus?: SortOrder
    height?: SortOrderInput | SortOrder
    weight?: SortOrderInput | SortOrder
    bloodType?: SortOrderInput | SortOrder
    gsisNo?: SortOrderInput | SortOrder
    pagibigNo?: SortOrderInput | SortOrder
    philhealthNo?: SortOrderInput | SortOrder
    sssNo?: SortOrderInput | SortOrder
    tinNo?: SortOrderInput | SortOrder
    agencyEmployeeNo?: SortOrderInput | SortOrder
    citizenship?: SortOrder
    residentialAddress?: SortOrder
    permanentAddress?: SortOrder
    telephoneNo?: SortOrderInput | SortOrder
    mobileNo?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    departmentId?: SortOrder
    positionId?: SortOrder
    status?: SortOrder
    dateHired?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    department?: DepartmentOrderByWithRelationInput
    position?: PositionOrderByWithRelationInput
    children?: ChildRecordOrderByRelationAggregateInput
    education?: EducationalBackgroundOrderByRelationAggregateInput
    civilService?: CivilServiceEligibilityOrderByRelationAggregateInput
    workExperience?: WorkExperienceOrderByRelationAggregateInput
    voluntaryWork?: VoluntaryWorkOrderByRelationAggregateInput
    training?: TrainingProgramOrderByRelationAggregateInput
    skills?: OtherInformationOrderByRelationAggregateInput
    family?: FamilyBackgroundOrderByWithRelationInput
    leaves?: LeaveRecordOrderByRelationAggregateInput
    _relevance?: EmployeeOrderByRelevanceInput
  }

  export type EmployeeWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: EmployeeWhereInput | EmployeeWhereInput[]
    OR?: EmployeeWhereInput[]
    NOT?: EmployeeWhereInput | EmployeeWhereInput[]
    firstName?: StringFilter<"Employee"> | string
    lastName?: StringFilter<"Employee"> | string
    middleName?: StringNullableFilter<"Employee"> | string | null
    nameExtension?: StringNullableFilter<"Employee"> | string | null
    dateOfBirth?: DateTimeFilter<"Employee"> | Date | string
    placeOfBirth?: StringFilter<"Employee"> | string
    sex?: StringFilter<"Employee"> | string
    civilStatus?: StringFilter<"Employee"> | string
    height?: FloatNullableFilter<"Employee"> | number | null
    weight?: FloatNullableFilter<"Employee"> | number | null
    bloodType?: StringNullableFilter<"Employee"> | string | null
    gsisNo?: StringNullableFilter<"Employee"> | string | null
    pagibigNo?: StringNullableFilter<"Employee"> | string | null
    philhealthNo?: StringNullableFilter<"Employee"> | string | null
    sssNo?: StringNullableFilter<"Employee"> | string | null
    tinNo?: StringNullableFilter<"Employee"> | string | null
    agencyEmployeeNo?: StringNullableFilter<"Employee"> | string | null
    citizenship?: StringFilter<"Employee"> | string
    residentialAddress?: StringFilter<"Employee"> | string
    permanentAddress?: StringFilter<"Employee"> | string
    telephoneNo?: StringNullableFilter<"Employee"> | string | null
    mobileNo?: StringNullableFilter<"Employee"> | string | null
    email?: StringNullableFilter<"Employee"> | string | null
    departmentId?: IntFilter<"Employee"> | number
    positionId?: IntFilter<"Employee"> | number
    status?: StringFilter<"Employee"> | string
    dateHired?: DateTimeNullableFilter<"Employee"> | Date | string | null
    createdAt?: DateTimeFilter<"Employee"> | Date | string
    updatedAt?: DateTimeFilter<"Employee"> | Date | string
    department?: XOR<DepartmentScalarRelationFilter, DepartmentWhereInput>
    position?: XOR<PositionScalarRelationFilter, PositionWhereInput>
    children?: ChildRecordListRelationFilter
    education?: EducationalBackgroundListRelationFilter
    civilService?: CivilServiceEligibilityListRelationFilter
    workExperience?: WorkExperienceListRelationFilter
    voluntaryWork?: VoluntaryWorkListRelationFilter
    training?: TrainingProgramListRelationFilter
    skills?: OtherInformationListRelationFilter
    family?: XOR<FamilyBackgroundNullableScalarRelationFilter, FamilyBackgroundWhereInput> | null
    leaves?: LeaveRecordListRelationFilter
  }, "id">

  export type EmployeeOrderByWithAggregationInput = {
    id?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    middleName?: SortOrderInput | SortOrder
    nameExtension?: SortOrderInput | SortOrder
    dateOfBirth?: SortOrder
    placeOfBirth?: SortOrder
    sex?: SortOrder
    civilStatus?: SortOrder
    height?: SortOrderInput | SortOrder
    weight?: SortOrderInput | SortOrder
    bloodType?: SortOrderInput | SortOrder
    gsisNo?: SortOrderInput | SortOrder
    pagibigNo?: SortOrderInput | SortOrder
    philhealthNo?: SortOrderInput | SortOrder
    sssNo?: SortOrderInput | SortOrder
    tinNo?: SortOrderInput | SortOrder
    agencyEmployeeNo?: SortOrderInput | SortOrder
    citizenship?: SortOrder
    residentialAddress?: SortOrder
    permanentAddress?: SortOrder
    telephoneNo?: SortOrderInput | SortOrder
    mobileNo?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    departmentId?: SortOrder
    positionId?: SortOrder
    status?: SortOrder
    dateHired?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: EmployeeCountOrderByAggregateInput
    _avg?: EmployeeAvgOrderByAggregateInput
    _max?: EmployeeMaxOrderByAggregateInput
    _min?: EmployeeMinOrderByAggregateInput
    _sum?: EmployeeSumOrderByAggregateInput
  }

  export type EmployeeScalarWhereWithAggregatesInput = {
    AND?: EmployeeScalarWhereWithAggregatesInput | EmployeeScalarWhereWithAggregatesInput[]
    OR?: EmployeeScalarWhereWithAggregatesInput[]
    NOT?: EmployeeScalarWhereWithAggregatesInput | EmployeeScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Employee"> | number
    firstName?: StringWithAggregatesFilter<"Employee"> | string
    lastName?: StringWithAggregatesFilter<"Employee"> | string
    middleName?: StringNullableWithAggregatesFilter<"Employee"> | string | null
    nameExtension?: StringNullableWithAggregatesFilter<"Employee"> | string | null
    dateOfBirth?: DateTimeWithAggregatesFilter<"Employee"> | Date | string
    placeOfBirth?: StringWithAggregatesFilter<"Employee"> | string
    sex?: StringWithAggregatesFilter<"Employee"> | string
    civilStatus?: StringWithAggregatesFilter<"Employee"> | string
    height?: FloatNullableWithAggregatesFilter<"Employee"> | number | null
    weight?: FloatNullableWithAggregatesFilter<"Employee"> | number | null
    bloodType?: StringNullableWithAggregatesFilter<"Employee"> | string | null
    gsisNo?: StringNullableWithAggregatesFilter<"Employee"> | string | null
    pagibigNo?: StringNullableWithAggregatesFilter<"Employee"> | string | null
    philhealthNo?: StringNullableWithAggregatesFilter<"Employee"> | string | null
    sssNo?: StringNullableWithAggregatesFilter<"Employee"> | string | null
    tinNo?: StringNullableWithAggregatesFilter<"Employee"> | string | null
    agencyEmployeeNo?: StringNullableWithAggregatesFilter<"Employee"> | string | null
    citizenship?: StringWithAggregatesFilter<"Employee"> | string
    residentialAddress?: StringWithAggregatesFilter<"Employee"> | string
    permanentAddress?: StringWithAggregatesFilter<"Employee"> | string
    telephoneNo?: StringNullableWithAggregatesFilter<"Employee"> | string | null
    mobileNo?: StringNullableWithAggregatesFilter<"Employee"> | string | null
    email?: StringNullableWithAggregatesFilter<"Employee"> | string | null
    departmentId?: IntWithAggregatesFilter<"Employee"> | number
    positionId?: IntWithAggregatesFilter<"Employee"> | number
    status?: StringWithAggregatesFilter<"Employee"> | string
    dateHired?: DateTimeNullableWithAggregatesFilter<"Employee"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Employee"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Employee"> | Date | string
  }

  export type FamilyBackgroundWhereInput = {
    AND?: FamilyBackgroundWhereInput | FamilyBackgroundWhereInput[]
    OR?: FamilyBackgroundWhereInput[]
    NOT?: FamilyBackgroundWhereInput | FamilyBackgroundWhereInput[]
    id?: IntFilter<"FamilyBackground"> | number
    employeeId?: IntFilter<"FamilyBackground"> | number
    spouseFirstName?: StringNullableFilter<"FamilyBackground"> | string | null
    spouseLastName?: StringNullableFilter<"FamilyBackground"> | string | null
    spouseMiddleName?: StringNullableFilter<"FamilyBackground"> | string | null
    spouseOccupation?: StringNullableFilter<"FamilyBackground"> | string | null
    spouseEmployer?: StringNullableFilter<"FamilyBackground"> | string | null
    spouseBusinessAddress?: StringNullableFilter<"FamilyBackground"> | string | null
    spouseTelephone?: StringNullableFilter<"FamilyBackground"> | string | null
    fatherFirstName?: StringFilter<"FamilyBackground"> | string
    fatherLastName?: StringFilter<"FamilyBackground"> | string
    fatherMiddleName?: StringNullableFilter<"FamilyBackground"> | string | null
    motherMaidenFirst?: StringFilter<"FamilyBackground"> | string
    motherMaidenLast?: StringFilter<"FamilyBackground"> | string
    motherMaidenMiddle?: StringNullableFilter<"FamilyBackground"> | string | null
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }

  export type FamilyBackgroundOrderByWithRelationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    spouseFirstName?: SortOrderInput | SortOrder
    spouseLastName?: SortOrderInput | SortOrder
    spouseMiddleName?: SortOrderInput | SortOrder
    spouseOccupation?: SortOrderInput | SortOrder
    spouseEmployer?: SortOrderInput | SortOrder
    spouseBusinessAddress?: SortOrderInput | SortOrder
    spouseTelephone?: SortOrderInput | SortOrder
    fatherFirstName?: SortOrder
    fatherLastName?: SortOrder
    fatherMiddleName?: SortOrderInput | SortOrder
    motherMaidenFirst?: SortOrder
    motherMaidenLast?: SortOrder
    motherMaidenMiddle?: SortOrderInput | SortOrder
    employee?: EmployeeOrderByWithRelationInput
    _relevance?: FamilyBackgroundOrderByRelevanceInput
  }

  export type FamilyBackgroundWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    employeeId?: number
    AND?: FamilyBackgroundWhereInput | FamilyBackgroundWhereInput[]
    OR?: FamilyBackgroundWhereInput[]
    NOT?: FamilyBackgroundWhereInput | FamilyBackgroundWhereInput[]
    spouseFirstName?: StringNullableFilter<"FamilyBackground"> | string | null
    spouseLastName?: StringNullableFilter<"FamilyBackground"> | string | null
    spouseMiddleName?: StringNullableFilter<"FamilyBackground"> | string | null
    spouseOccupation?: StringNullableFilter<"FamilyBackground"> | string | null
    spouseEmployer?: StringNullableFilter<"FamilyBackground"> | string | null
    spouseBusinessAddress?: StringNullableFilter<"FamilyBackground"> | string | null
    spouseTelephone?: StringNullableFilter<"FamilyBackground"> | string | null
    fatherFirstName?: StringFilter<"FamilyBackground"> | string
    fatherLastName?: StringFilter<"FamilyBackground"> | string
    fatherMiddleName?: StringNullableFilter<"FamilyBackground"> | string | null
    motherMaidenFirst?: StringFilter<"FamilyBackground"> | string
    motherMaidenLast?: StringFilter<"FamilyBackground"> | string
    motherMaidenMiddle?: StringNullableFilter<"FamilyBackground"> | string | null
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }, "id" | "employeeId">

  export type FamilyBackgroundOrderByWithAggregationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    spouseFirstName?: SortOrderInput | SortOrder
    spouseLastName?: SortOrderInput | SortOrder
    spouseMiddleName?: SortOrderInput | SortOrder
    spouseOccupation?: SortOrderInput | SortOrder
    spouseEmployer?: SortOrderInput | SortOrder
    spouseBusinessAddress?: SortOrderInput | SortOrder
    spouseTelephone?: SortOrderInput | SortOrder
    fatherFirstName?: SortOrder
    fatherLastName?: SortOrder
    fatherMiddleName?: SortOrderInput | SortOrder
    motherMaidenFirst?: SortOrder
    motherMaidenLast?: SortOrder
    motherMaidenMiddle?: SortOrderInput | SortOrder
    _count?: FamilyBackgroundCountOrderByAggregateInput
    _avg?: FamilyBackgroundAvgOrderByAggregateInput
    _max?: FamilyBackgroundMaxOrderByAggregateInput
    _min?: FamilyBackgroundMinOrderByAggregateInput
    _sum?: FamilyBackgroundSumOrderByAggregateInput
  }

  export type FamilyBackgroundScalarWhereWithAggregatesInput = {
    AND?: FamilyBackgroundScalarWhereWithAggregatesInput | FamilyBackgroundScalarWhereWithAggregatesInput[]
    OR?: FamilyBackgroundScalarWhereWithAggregatesInput[]
    NOT?: FamilyBackgroundScalarWhereWithAggregatesInput | FamilyBackgroundScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"FamilyBackground"> | number
    employeeId?: IntWithAggregatesFilter<"FamilyBackground"> | number
    spouseFirstName?: StringNullableWithAggregatesFilter<"FamilyBackground"> | string | null
    spouseLastName?: StringNullableWithAggregatesFilter<"FamilyBackground"> | string | null
    spouseMiddleName?: StringNullableWithAggregatesFilter<"FamilyBackground"> | string | null
    spouseOccupation?: StringNullableWithAggregatesFilter<"FamilyBackground"> | string | null
    spouseEmployer?: StringNullableWithAggregatesFilter<"FamilyBackground"> | string | null
    spouseBusinessAddress?: StringNullableWithAggregatesFilter<"FamilyBackground"> | string | null
    spouseTelephone?: StringNullableWithAggregatesFilter<"FamilyBackground"> | string | null
    fatherFirstName?: StringWithAggregatesFilter<"FamilyBackground"> | string
    fatherLastName?: StringWithAggregatesFilter<"FamilyBackground"> | string
    fatherMiddleName?: StringNullableWithAggregatesFilter<"FamilyBackground"> | string | null
    motherMaidenFirst?: StringWithAggregatesFilter<"FamilyBackground"> | string
    motherMaidenLast?: StringWithAggregatesFilter<"FamilyBackground"> | string
    motherMaidenMiddle?: StringNullableWithAggregatesFilter<"FamilyBackground"> | string | null
  }

  export type ChildRecordWhereInput = {
    AND?: ChildRecordWhereInput | ChildRecordWhereInput[]
    OR?: ChildRecordWhereInput[]
    NOT?: ChildRecordWhereInput | ChildRecordWhereInput[]
    id?: IntFilter<"ChildRecord"> | number
    employeeId?: IntFilter<"ChildRecord"> | number
    name?: StringFilter<"ChildRecord"> | string
    dateOfBirth?: DateTimeFilter<"ChildRecord"> | Date | string
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }

  export type ChildRecordOrderByWithRelationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    name?: SortOrder
    dateOfBirth?: SortOrder
    employee?: EmployeeOrderByWithRelationInput
    _relevance?: ChildRecordOrderByRelevanceInput
  }

  export type ChildRecordWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: ChildRecordWhereInput | ChildRecordWhereInput[]
    OR?: ChildRecordWhereInput[]
    NOT?: ChildRecordWhereInput | ChildRecordWhereInput[]
    employeeId?: IntFilter<"ChildRecord"> | number
    name?: StringFilter<"ChildRecord"> | string
    dateOfBirth?: DateTimeFilter<"ChildRecord"> | Date | string
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }, "id">

  export type ChildRecordOrderByWithAggregationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    name?: SortOrder
    dateOfBirth?: SortOrder
    _count?: ChildRecordCountOrderByAggregateInput
    _avg?: ChildRecordAvgOrderByAggregateInput
    _max?: ChildRecordMaxOrderByAggregateInput
    _min?: ChildRecordMinOrderByAggregateInput
    _sum?: ChildRecordSumOrderByAggregateInput
  }

  export type ChildRecordScalarWhereWithAggregatesInput = {
    AND?: ChildRecordScalarWhereWithAggregatesInput | ChildRecordScalarWhereWithAggregatesInput[]
    OR?: ChildRecordScalarWhereWithAggregatesInput[]
    NOT?: ChildRecordScalarWhereWithAggregatesInput | ChildRecordScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"ChildRecord"> | number
    employeeId?: IntWithAggregatesFilter<"ChildRecord"> | number
    name?: StringWithAggregatesFilter<"ChildRecord"> | string
    dateOfBirth?: DateTimeWithAggregatesFilter<"ChildRecord"> | Date | string
  }

  export type EducationalBackgroundWhereInput = {
    AND?: EducationalBackgroundWhereInput | EducationalBackgroundWhereInput[]
    OR?: EducationalBackgroundWhereInput[]
    NOT?: EducationalBackgroundWhereInput | EducationalBackgroundWhereInput[]
    id?: IntFilter<"EducationalBackground"> | number
    employeeId?: IntFilter<"EducationalBackground"> | number
    level?: StringFilter<"EducationalBackground"> | string
    schoolName?: StringFilter<"EducationalBackground"> | string
    degreeCourse?: StringNullableFilter<"EducationalBackground"> | string | null
    yearGraduated?: StringNullableFilter<"EducationalBackground"> | string | null
    highestLevelEarned?: StringNullableFilter<"EducationalBackground"> | string | null
    dateFrom?: DateTimeNullableFilter<"EducationalBackground"> | Date | string | null
    dateTo?: DateTimeNullableFilter<"EducationalBackground"> | Date | string | null
    scholarships?: StringNullableFilter<"EducationalBackground"> | string | null
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }

  export type EducationalBackgroundOrderByWithRelationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    level?: SortOrder
    schoolName?: SortOrder
    degreeCourse?: SortOrderInput | SortOrder
    yearGraduated?: SortOrderInput | SortOrder
    highestLevelEarned?: SortOrderInput | SortOrder
    dateFrom?: SortOrderInput | SortOrder
    dateTo?: SortOrderInput | SortOrder
    scholarships?: SortOrderInput | SortOrder
    employee?: EmployeeOrderByWithRelationInput
    _relevance?: EducationalBackgroundOrderByRelevanceInput
  }

  export type EducationalBackgroundWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: EducationalBackgroundWhereInput | EducationalBackgroundWhereInput[]
    OR?: EducationalBackgroundWhereInput[]
    NOT?: EducationalBackgroundWhereInput | EducationalBackgroundWhereInput[]
    employeeId?: IntFilter<"EducationalBackground"> | number
    level?: StringFilter<"EducationalBackground"> | string
    schoolName?: StringFilter<"EducationalBackground"> | string
    degreeCourse?: StringNullableFilter<"EducationalBackground"> | string | null
    yearGraduated?: StringNullableFilter<"EducationalBackground"> | string | null
    highestLevelEarned?: StringNullableFilter<"EducationalBackground"> | string | null
    dateFrom?: DateTimeNullableFilter<"EducationalBackground"> | Date | string | null
    dateTo?: DateTimeNullableFilter<"EducationalBackground"> | Date | string | null
    scholarships?: StringNullableFilter<"EducationalBackground"> | string | null
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }, "id">

  export type EducationalBackgroundOrderByWithAggregationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    level?: SortOrder
    schoolName?: SortOrder
    degreeCourse?: SortOrderInput | SortOrder
    yearGraduated?: SortOrderInput | SortOrder
    highestLevelEarned?: SortOrderInput | SortOrder
    dateFrom?: SortOrderInput | SortOrder
    dateTo?: SortOrderInput | SortOrder
    scholarships?: SortOrderInput | SortOrder
    _count?: EducationalBackgroundCountOrderByAggregateInput
    _avg?: EducationalBackgroundAvgOrderByAggregateInput
    _max?: EducationalBackgroundMaxOrderByAggregateInput
    _min?: EducationalBackgroundMinOrderByAggregateInput
    _sum?: EducationalBackgroundSumOrderByAggregateInput
  }

  export type EducationalBackgroundScalarWhereWithAggregatesInput = {
    AND?: EducationalBackgroundScalarWhereWithAggregatesInput | EducationalBackgroundScalarWhereWithAggregatesInput[]
    OR?: EducationalBackgroundScalarWhereWithAggregatesInput[]
    NOT?: EducationalBackgroundScalarWhereWithAggregatesInput | EducationalBackgroundScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"EducationalBackground"> | number
    employeeId?: IntWithAggregatesFilter<"EducationalBackground"> | number
    level?: StringWithAggregatesFilter<"EducationalBackground"> | string
    schoolName?: StringWithAggregatesFilter<"EducationalBackground"> | string
    degreeCourse?: StringNullableWithAggregatesFilter<"EducationalBackground"> | string | null
    yearGraduated?: StringNullableWithAggregatesFilter<"EducationalBackground"> | string | null
    highestLevelEarned?: StringNullableWithAggregatesFilter<"EducationalBackground"> | string | null
    dateFrom?: DateTimeNullableWithAggregatesFilter<"EducationalBackground"> | Date | string | null
    dateTo?: DateTimeNullableWithAggregatesFilter<"EducationalBackground"> | Date | string | null
    scholarships?: StringNullableWithAggregatesFilter<"EducationalBackground"> | string | null
  }

  export type CivilServiceEligibilityWhereInput = {
    AND?: CivilServiceEligibilityWhereInput | CivilServiceEligibilityWhereInput[]
    OR?: CivilServiceEligibilityWhereInput[]
    NOT?: CivilServiceEligibilityWhereInput | CivilServiceEligibilityWhereInput[]
    id?: IntFilter<"CivilServiceEligibility"> | number
    employeeId?: IntFilter<"CivilServiceEligibility"> | number
    careerService?: StringFilter<"CivilServiceEligibility"> | string
    rating?: FloatNullableFilter<"CivilServiceEligibility"> | number | null
    dateOfExamination?: DateTimeNullableFilter<"CivilServiceEligibility"> | Date | string | null
    placeOfExamination?: StringNullableFilter<"CivilServiceEligibility"> | string | null
    licenseNo?: StringNullableFilter<"CivilServiceEligibility"> | string | null
    licenseValidity?: DateTimeNullableFilter<"CivilServiceEligibility"> | Date | string | null
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }

  export type CivilServiceEligibilityOrderByWithRelationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    careerService?: SortOrder
    rating?: SortOrderInput | SortOrder
    dateOfExamination?: SortOrderInput | SortOrder
    placeOfExamination?: SortOrderInput | SortOrder
    licenseNo?: SortOrderInput | SortOrder
    licenseValidity?: SortOrderInput | SortOrder
    employee?: EmployeeOrderByWithRelationInput
    _relevance?: CivilServiceEligibilityOrderByRelevanceInput
  }

  export type CivilServiceEligibilityWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: CivilServiceEligibilityWhereInput | CivilServiceEligibilityWhereInput[]
    OR?: CivilServiceEligibilityWhereInput[]
    NOT?: CivilServiceEligibilityWhereInput | CivilServiceEligibilityWhereInput[]
    employeeId?: IntFilter<"CivilServiceEligibility"> | number
    careerService?: StringFilter<"CivilServiceEligibility"> | string
    rating?: FloatNullableFilter<"CivilServiceEligibility"> | number | null
    dateOfExamination?: DateTimeNullableFilter<"CivilServiceEligibility"> | Date | string | null
    placeOfExamination?: StringNullableFilter<"CivilServiceEligibility"> | string | null
    licenseNo?: StringNullableFilter<"CivilServiceEligibility"> | string | null
    licenseValidity?: DateTimeNullableFilter<"CivilServiceEligibility"> | Date | string | null
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }, "id">

  export type CivilServiceEligibilityOrderByWithAggregationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    careerService?: SortOrder
    rating?: SortOrderInput | SortOrder
    dateOfExamination?: SortOrderInput | SortOrder
    placeOfExamination?: SortOrderInput | SortOrder
    licenseNo?: SortOrderInput | SortOrder
    licenseValidity?: SortOrderInput | SortOrder
    _count?: CivilServiceEligibilityCountOrderByAggregateInput
    _avg?: CivilServiceEligibilityAvgOrderByAggregateInput
    _max?: CivilServiceEligibilityMaxOrderByAggregateInput
    _min?: CivilServiceEligibilityMinOrderByAggregateInput
    _sum?: CivilServiceEligibilitySumOrderByAggregateInput
  }

  export type CivilServiceEligibilityScalarWhereWithAggregatesInput = {
    AND?: CivilServiceEligibilityScalarWhereWithAggregatesInput | CivilServiceEligibilityScalarWhereWithAggregatesInput[]
    OR?: CivilServiceEligibilityScalarWhereWithAggregatesInput[]
    NOT?: CivilServiceEligibilityScalarWhereWithAggregatesInput | CivilServiceEligibilityScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"CivilServiceEligibility"> | number
    employeeId?: IntWithAggregatesFilter<"CivilServiceEligibility"> | number
    careerService?: StringWithAggregatesFilter<"CivilServiceEligibility"> | string
    rating?: FloatNullableWithAggregatesFilter<"CivilServiceEligibility"> | number | null
    dateOfExamination?: DateTimeNullableWithAggregatesFilter<"CivilServiceEligibility"> | Date | string | null
    placeOfExamination?: StringNullableWithAggregatesFilter<"CivilServiceEligibility"> | string | null
    licenseNo?: StringNullableWithAggregatesFilter<"CivilServiceEligibility"> | string | null
    licenseValidity?: DateTimeNullableWithAggregatesFilter<"CivilServiceEligibility"> | Date | string | null
  }

  export type WorkExperienceWhereInput = {
    AND?: WorkExperienceWhereInput | WorkExperienceWhereInput[]
    OR?: WorkExperienceWhereInput[]
    NOT?: WorkExperienceWhereInput | WorkExperienceWhereInput[]
    id?: IntFilter<"WorkExperience"> | number
    employeeId?: IntFilter<"WorkExperience"> | number
    dateFrom?: DateTimeFilter<"WorkExperience"> | Date | string
    dateTo?: DateTimeNullableFilter<"WorkExperience"> | Date | string | null
    positionTitle?: StringFilter<"WorkExperience"> | string
    departmentAgencyCompany?: StringFilter<"WorkExperience"> | string
    monthlySalary?: FloatNullableFilter<"WorkExperience"> | number | null
    salaryGrade?: StringNullableFilter<"WorkExperience"> | string | null
    statusOfAppointment?: StringNullableFilter<"WorkExperience"> | string | null
    isGovService?: BoolFilter<"WorkExperience"> | boolean
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }

  export type WorkExperienceOrderByWithRelationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrderInput | SortOrder
    positionTitle?: SortOrder
    departmentAgencyCompany?: SortOrder
    monthlySalary?: SortOrderInput | SortOrder
    salaryGrade?: SortOrderInput | SortOrder
    statusOfAppointment?: SortOrderInput | SortOrder
    isGovService?: SortOrder
    employee?: EmployeeOrderByWithRelationInput
    _relevance?: WorkExperienceOrderByRelevanceInput
  }

  export type WorkExperienceWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: WorkExperienceWhereInput | WorkExperienceWhereInput[]
    OR?: WorkExperienceWhereInput[]
    NOT?: WorkExperienceWhereInput | WorkExperienceWhereInput[]
    employeeId?: IntFilter<"WorkExperience"> | number
    dateFrom?: DateTimeFilter<"WorkExperience"> | Date | string
    dateTo?: DateTimeNullableFilter<"WorkExperience"> | Date | string | null
    positionTitle?: StringFilter<"WorkExperience"> | string
    departmentAgencyCompany?: StringFilter<"WorkExperience"> | string
    monthlySalary?: FloatNullableFilter<"WorkExperience"> | number | null
    salaryGrade?: StringNullableFilter<"WorkExperience"> | string | null
    statusOfAppointment?: StringNullableFilter<"WorkExperience"> | string | null
    isGovService?: BoolFilter<"WorkExperience"> | boolean
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }, "id">

  export type WorkExperienceOrderByWithAggregationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrderInput | SortOrder
    positionTitle?: SortOrder
    departmentAgencyCompany?: SortOrder
    monthlySalary?: SortOrderInput | SortOrder
    salaryGrade?: SortOrderInput | SortOrder
    statusOfAppointment?: SortOrderInput | SortOrder
    isGovService?: SortOrder
    _count?: WorkExperienceCountOrderByAggregateInput
    _avg?: WorkExperienceAvgOrderByAggregateInput
    _max?: WorkExperienceMaxOrderByAggregateInput
    _min?: WorkExperienceMinOrderByAggregateInput
    _sum?: WorkExperienceSumOrderByAggregateInput
  }

  export type WorkExperienceScalarWhereWithAggregatesInput = {
    AND?: WorkExperienceScalarWhereWithAggregatesInput | WorkExperienceScalarWhereWithAggregatesInput[]
    OR?: WorkExperienceScalarWhereWithAggregatesInput[]
    NOT?: WorkExperienceScalarWhereWithAggregatesInput | WorkExperienceScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"WorkExperience"> | number
    employeeId?: IntWithAggregatesFilter<"WorkExperience"> | number
    dateFrom?: DateTimeWithAggregatesFilter<"WorkExperience"> | Date | string
    dateTo?: DateTimeNullableWithAggregatesFilter<"WorkExperience"> | Date | string | null
    positionTitle?: StringWithAggregatesFilter<"WorkExperience"> | string
    departmentAgencyCompany?: StringWithAggregatesFilter<"WorkExperience"> | string
    monthlySalary?: FloatNullableWithAggregatesFilter<"WorkExperience"> | number | null
    salaryGrade?: StringNullableWithAggregatesFilter<"WorkExperience"> | string | null
    statusOfAppointment?: StringNullableWithAggregatesFilter<"WorkExperience"> | string | null
    isGovService?: BoolWithAggregatesFilter<"WorkExperience"> | boolean
  }

  export type VoluntaryWorkWhereInput = {
    AND?: VoluntaryWorkWhereInput | VoluntaryWorkWhereInput[]
    OR?: VoluntaryWorkWhereInput[]
    NOT?: VoluntaryWorkWhereInput | VoluntaryWorkWhereInput[]
    id?: IntFilter<"VoluntaryWork"> | number
    employeeId?: IntFilter<"VoluntaryWork"> | number
    organizationName?: StringFilter<"VoluntaryWork"> | string
    organizationAddress?: StringNullableFilter<"VoluntaryWork"> | string | null
    dateFrom?: DateTimeFilter<"VoluntaryWork"> | Date | string
    dateTo?: DateTimeNullableFilter<"VoluntaryWork"> | Date | string | null
    numberOfHours?: FloatNullableFilter<"VoluntaryWork"> | number | null
    positionNature?: StringFilter<"VoluntaryWork"> | string
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }

  export type VoluntaryWorkOrderByWithRelationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    organizationName?: SortOrder
    organizationAddress?: SortOrderInput | SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrderInput | SortOrder
    numberOfHours?: SortOrderInput | SortOrder
    positionNature?: SortOrder
    employee?: EmployeeOrderByWithRelationInput
    _relevance?: VoluntaryWorkOrderByRelevanceInput
  }

  export type VoluntaryWorkWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: VoluntaryWorkWhereInput | VoluntaryWorkWhereInput[]
    OR?: VoluntaryWorkWhereInput[]
    NOT?: VoluntaryWorkWhereInput | VoluntaryWorkWhereInput[]
    employeeId?: IntFilter<"VoluntaryWork"> | number
    organizationName?: StringFilter<"VoluntaryWork"> | string
    organizationAddress?: StringNullableFilter<"VoluntaryWork"> | string | null
    dateFrom?: DateTimeFilter<"VoluntaryWork"> | Date | string
    dateTo?: DateTimeNullableFilter<"VoluntaryWork"> | Date | string | null
    numberOfHours?: FloatNullableFilter<"VoluntaryWork"> | number | null
    positionNature?: StringFilter<"VoluntaryWork"> | string
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }, "id">

  export type VoluntaryWorkOrderByWithAggregationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    organizationName?: SortOrder
    organizationAddress?: SortOrderInput | SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrderInput | SortOrder
    numberOfHours?: SortOrderInput | SortOrder
    positionNature?: SortOrder
    _count?: VoluntaryWorkCountOrderByAggregateInput
    _avg?: VoluntaryWorkAvgOrderByAggregateInput
    _max?: VoluntaryWorkMaxOrderByAggregateInput
    _min?: VoluntaryWorkMinOrderByAggregateInput
    _sum?: VoluntaryWorkSumOrderByAggregateInput
  }

  export type VoluntaryWorkScalarWhereWithAggregatesInput = {
    AND?: VoluntaryWorkScalarWhereWithAggregatesInput | VoluntaryWorkScalarWhereWithAggregatesInput[]
    OR?: VoluntaryWorkScalarWhereWithAggregatesInput[]
    NOT?: VoluntaryWorkScalarWhereWithAggregatesInput | VoluntaryWorkScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"VoluntaryWork"> | number
    employeeId?: IntWithAggregatesFilter<"VoluntaryWork"> | number
    organizationName?: StringWithAggregatesFilter<"VoluntaryWork"> | string
    organizationAddress?: StringNullableWithAggregatesFilter<"VoluntaryWork"> | string | null
    dateFrom?: DateTimeWithAggregatesFilter<"VoluntaryWork"> | Date | string
    dateTo?: DateTimeNullableWithAggregatesFilter<"VoluntaryWork"> | Date | string | null
    numberOfHours?: FloatNullableWithAggregatesFilter<"VoluntaryWork"> | number | null
    positionNature?: StringWithAggregatesFilter<"VoluntaryWork"> | string
  }

  export type TrainingProgramWhereInput = {
    AND?: TrainingProgramWhereInput | TrainingProgramWhereInput[]
    OR?: TrainingProgramWhereInput[]
    NOT?: TrainingProgramWhereInput | TrainingProgramWhereInput[]
    id?: IntFilter<"TrainingProgram"> | number
    employeeId?: IntFilter<"TrainingProgram"> | number
    titleOfLearning?: StringFilter<"TrainingProgram"> | string
    dateFrom?: DateTimeFilter<"TrainingProgram"> | Date | string
    dateTo?: DateTimeNullableFilter<"TrainingProgram"> | Date | string | null
    numberOfHours?: FloatNullableFilter<"TrainingProgram"> | number | null
    typeOfId?: StringNullableFilter<"TrainingProgram"> | string | null
    sponsoredBy?: StringNullableFilter<"TrainingProgram"> | string | null
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }

  export type TrainingProgramOrderByWithRelationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    titleOfLearning?: SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrderInput | SortOrder
    numberOfHours?: SortOrderInput | SortOrder
    typeOfId?: SortOrderInput | SortOrder
    sponsoredBy?: SortOrderInput | SortOrder
    employee?: EmployeeOrderByWithRelationInput
    _relevance?: TrainingProgramOrderByRelevanceInput
  }

  export type TrainingProgramWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: TrainingProgramWhereInput | TrainingProgramWhereInput[]
    OR?: TrainingProgramWhereInput[]
    NOT?: TrainingProgramWhereInput | TrainingProgramWhereInput[]
    employeeId?: IntFilter<"TrainingProgram"> | number
    titleOfLearning?: StringFilter<"TrainingProgram"> | string
    dateFrom?: DateTimeFilter<"TrainingProgram"> | Date | string
    dateTo?: DateTimeNullableFilter<"TrainingProgram"> | Date | string | null
    numberOfHours?: FloatNullableFilter<"TrainingProgram"> | number | null
    typeOfId?: StringNullableFilter<"TrainingProgram"> | string | null
    sponsoredBy?: StringNullableFilter<"TrainingProgram"> | string | null
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }, "id">

  export type TrainingProgramOrderByWithAggregationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    titleOfLearning?: SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrderInput | SortOrder
    numberOfHours?: SortOrderInput | SortOrder
    typeOfId?: SortOrderInput | SortOrder
    sponsoredBy?: SortOrderInput | SortOrder
    _count?: TrainingProgramCountOrderByAggregateInput
    _avg?: TrainingProgramAvgOrderByAggregateInput
    _max?: TrainingProgramMaxOrderByAggregateInput
    _min?: TrainingProgramMinOrderByAggregateInput
    _sum?: TrainingProgramSumOrderByAggregateInput
  }

  export type TrainingProgramScalarWhereWithAggregatesInput = {
    AND?: TrainingProgramScalarWhereWithAggregatesInput | TrainingProgramScalarWhereWithAggregatesInput[]
    OR?: TrainingProgramScalarWhereWithAggregatesInput[]
    NOT?: TrainingProgramScalarWhereWithAggregatesInput | TrainingProgramScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"TrainingProgram"> | number
    employeeId?: IntWithAggregatesFilter<"TrainingProgram"> | number
    titleOfLearning?: StringWithAggregatesFilter<"TrainingProgram"> | string
    dateFrom?: DateTimeWithAggregatesFilter<"TrainingProgram"> | Date | string
    dateTo?: DateTimeNullableWithAggregatesFilter<"TrainingProgram"> | Date | string | null
    numberOfHours?: FloatNullableWithAggregatesFilter<"TrainingProgram"> | number | null
    typeOfId?: StringNullableWithAggregatesFilter<"TrainingProgram"> | string | null
    sponsoredBy?: StringNullableWithAggregatesFilter<"TrainingProgram"> | string | null
  }

  export type OtherInformationWhereInput = {
    AND?: OtherInformationWhereInput | OtherInformationWhereInput[]
    OR?: OtherInformationWhereInput[]
    NOT?: OtherInformationWhereInput | OtherInformationWhereInput[]
    id?: IntFilter<"OtherInformation"> | number
    employeeId?: IntFilter<"OtherInformation"> | number
    specialSkills?: StringNullableFilter<"OtherInformation"> | string | null
    nonAcademicDistinctions?: StringNullableFilter<"OtherInformation"> | string | null
    membershipInAssoc?: StringNullableFilter<"OtherInformation"> | string | null
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }

  export type OtherInformationOrderByWithRelationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    specialSkills?: SortOrderInput | SortOrder
    nonAcademicDistinctions?: SortOrderInput | SortOrder
    membershipInAssoc?: SortOrderInput | SortOrder
    employee?: EmployeeOrderByWithRelationInput
    _relevance?: OtherInformationOrderByRelevanceInput
  }

  export type OtherInformationWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: OtherInformationWhereInput | OtherInformationWhereInput[]
    OR?: OtherInformationWhereInput[]
    NOT?: OtherInformationWhereInput | OtherInformationWhereInput[]
    employeeId?: IntFilter<"OtherInformation"> | number
    specialSkills?: StringNullableFilter<"OtherInformation"> | string | null
    nonAcademicDistinctions?: StringNullableFilter<"OtherInformation"> | string | null
    membershipInAssoc?: StringNullableFilter<"OtherInformation"> | string | null
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }, "id">

  export type OtherInformationOrderByWithAggregationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    specialSkills?: SortOrderInput | SortOrder
    nonAcademicDistinctions?: SortOrderInput | SortOrder
    membershipInAssoc?: SortOrderInput | SortOrder
    _count?: OtherInformationCountOrderByAggregateInput
    _avg?: OtherInformationAvgOrderByAggregateInput
    _max?: OtherInformationMaxOrderByAggregateInput
    _min?: OtherInformationMinOrderByAggregateInput
    _sum?: OtherInformationSumOrderByAggregateInput
  }

  export type OtherInformationScalarWhereWithAggregatesInput = {
    AND?: OtherInformationScalarWhereWithAggregatesInput | OtherInformationScalarWhereWithAggregatesInput[]
    OR?: OtherInformationScalarWhereWithAggregatesInput[]
    NOT?: OtherInformationScalarWhereWithAggregatesInput | OtherInformationScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"OtherInformation"> | number
    employeeId?: IntWithAggregatesFilter<"OtherInformation"> | number
    specialSkills?: StringNullableWithAggregatesFilter<"OtherInformation"> | string | null
    nonAcademicDistinctions?: StringNullableWithAggregatesFilter<"OtherInformation"> | string | null
    membershipInAssoc?: StringNullableWithAggregatesFilter<"OtherInformation"> | string | null
  }

  export type LeaveRecordWhereInput = {
    AND?: LeaveRecordWhereInput | LeaveRecordWhereInput[]
    OR?: LeaveRecordWhereInput[]
    NOT?: LeaveRecordWhereInput | LeaveRecordWhereInput[]
    id?: IntFilter<"LeaveRecord"> | number
    employeeId?: IntFilter<"LeaveRecord"> | number
    type?: StringFilter<"LeaveRecord"> | string
    startDate?: DateTimeFilter<"LeaveRecord"> | Date | string
    endDate?: DateTimeFilter<"LeaveRecord"> | Date | string
    status?: StringFilter<"LeaveRecord"> | string
    reason?: StringNullableFilter<"LeaveRecord"> | string | null
    createdAt?: DateTimeFilter<"LeaveRecord"> | Date | string
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }

  export type LeaveRecordOrderByWithRelationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    type?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    reason?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    employee?: EmployeeOrderByWithRelationInput
    _relevance?: LeaveRecordOrderByRelevanceInput
  }

  export type LeaveRecordWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: LeaveRecordWhereInput | LeaveRecordWhereInput[]
    OR?: LeaveRecordWhereInput[]
    NOT?: LeaveRecordWhereInput | LeaveRecordWhereInput[]
    employeeId?: IntFilter<"LeaveRecord"> | number
    type?: StringFilter<"LeaveRecord"> | string
    startDate?: DateTimeFilter<"LeaveRecord"> | Date | string
    endDate?: DateTimeFilter<"LeaveRecord"> | Date | string
    status?: StringFilter<"LeaveRecord"> | string
    reason?: StringNullableFilter<"LeaveRecord"> | string | null
    createdAt?: DateTimeFilter<"LeaveRecord"> | Date | string
    employee?: XOR<EmployeeScalarRelationFilter, EmployeeWhereInput>
  }, "id">

  export type LeaveRecordOrderByWithAggregationInput = {
    id?: SortOrder
    employeeId?: SortOrder
    type?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    reason?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: LeaveRecordCountOrderByAggregateInput
    _avg?: LeaveRecordAvgOrderByAggregateInput
    _max?: LeaveRecordMaxOrderByAggregateInput
    _min?: LeaveRecordMinOrderByAggregateInput
    _sum?: LeaveRecordSumOrderByAggregateInput
  }

  export type LeaveRecordScalarWhereWithAggregatesInput = {
    AND?: LeaveRecordScalarWhereWithAggregatesInput | LeaveRecordScalarWhereWithAggregatesInput[]
    OR?: LeaveRecordScalarWhereWithAggregatesInput[]
    NOT?: LeaveRecordScalarWhereWithAggregatesInput | LeaveRecordScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"LeaveRecord"> | number
    employeeId?: IntWithAggregatesFilter<"LeaveRecord"> | number
    type?: StringWithAggregatesFilter<"LeaveRecord"> | string
    startDate?: DateTimeWithAggregatesFilter<"LeaveRecord"> | Date | string
    endDate?: DateTimeWithAggregatesFilter<"LeaveRecord"> | Date | string
    status?: StringWithAggregatesFilter<"LeaveRecord"> | string
    reason?: StringNullableWithAggregatesFilter<"LeaveRecord"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"LeaveRecord"> | Date | string
  }

  export type AgencyCreateInput = {
    name: string
    address: string
    contactNo: string
    logoBase64?: string | null
  }

  export type AgencyUncheckedCreateInput = {
    id?: number
    name: string
    address: string
    contactNo: string
    logoBase64?: string | null
  }

  export type AgencyUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    contactNo?: StringFieldUpdateOperationsInput | string
    logoBase64?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AgencyUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    contactNo?: StringFieldUpdateOperationsInput | string
    logoBase64?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AgencyCreateManyInput = {
    id?: number
    name: string
    address: string
    contactNo: string
    logoBase64?: string | null
  }

  export type AgencyUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    contactNo?: StringFieldUpdateOperationsInput | string
    logoBase64?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AgencyUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    contactNo?: StringFieldUpdateOperationsInput | string
    logoBase64?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type DepartmentCreateInput = {
    name: string
    employees?: EmployeeCreateNestedManyWithoutDepartmentInput
  }

  export type DepartmentUncheckedCreateInput = {
    id?: number
    name: string
    employees?: EmployeeUncheckedCreateNestedManyWithoutDepartmentInput
  }

  export type DepartmentUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    employees?: EmployeeUpdateManyWithoutDepartmentNestedInput
  }

  export type DepartmentUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    employees?: EmployeeUncheckedUpdateManyWithoutDepartmentNestedInput
  }

  export type DepartmentCreateManyInput = {
    id?: number
    name: string
  }

  export type DepartmentUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
  }

  export type DepartmentUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
  }

  export type PositionCreateInput = {
    title: string
    employees?: EmployeeCreateNestedManyWithoutPositionInput
  }

  export type PositionUncheckedCreateInput = {
    id?: number
    title: string
    employees?: EmployeeUncheckedCreateNestedManyWithoutPositionInput
  }

  export type PositionUpdateInput = {
    title?: StringFieldUpdateOperationsInput | string
    employees?: EmployeeUpdateManyWithoutPositionNestedInput
  }

  export type PositionUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    employees?: EmployeeUncheckedUpdateManyWithoutPositionNestedInput
  }

  export type PositionCreateManyInput = {
    id?: number
    title: string
  }

  export type PositionUpdateManyMutationInput = {
    title?: StringFieldUpdateOperationsInput | string
  }

  export type PositionUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
  }

  export type SalaryGradeCreateInput = {
    grade: number
    step?: number
    amount: number
  }

  export type SalaryGradeUncheckedCreateInput = {
    id?: number
    grade: number
    step?: number
    amount: number
  }

  export type SalaryGradeUpdateInput = {
    grade?: IntFieldUpdateOperationsInput | number
    step?: IntFieldUpdateOperationsInput | number
    amount?: FloatFieldUpdateOperationsInput | number
  }

  export type SalaryGradeUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    grade?: IntFieldUpdateOperationsInput | number
    step?: IntFieldUpdateOperationsInput | number
    amount?: FloatFieldUpdateOperationsInput | number
  }

  export type SalaryGradeCreateManyInput = {
    id?: number
    grade: number
    step?: number
    amount: number
  }

  export type SalaryGradeUpdateManyMutationInput = {
    grade?: IntFieldUpdateOperationsInput | number
    step?: IntFieldUpdateOperationsInput | number
    amount?: FloatFieldUpdateOperationsInput | number
  }

  export type SalaryGradeUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    grade?: IntFieldUpdateOperationsInput | number
    step?: IntFieldUpdateOperationsInput | number
    amount?: FloatFieldUpdateOperationsInput | number
  }

  export type UserCreateInput = {
    username: string
    password: string
    role?: string
    name: string
  }

  export type UserUncheckedCreateInput = {
    id?: number
    username: string
    password: string
    role?: string
    name: string
  }

  export type UserUpdateInput = {
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type UserUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type UserCreateManyInput = {
    id?: number
    username: string
    password: string
    role?: string
    name: string
  }

  export type UserUpdateManyMutationInput = {
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type EmployeeCreateInput = {
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    department: DepartmentCreateNestedOneWithoutEmployeesInput
    position: PositionCreateNestedOneWithoutEmployeesInput
    children?: ChildRecordCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeUncheckedCreateInput = {
    id?: number
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    departmentId: number
    positionId: number
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: ChildRecordUncheckedCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundUncheckedCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityUncheckedCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceUncheckedCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkUncheckedCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramUncheckedCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationUncheckedCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundUncheckedCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordUncheckedCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeUpdateInput = {
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    department?: DepartmentUpdateOneRequiredWithoutEmployeesNestedInput
    position?: PositionUpdateOneRequiredWithoutEmployeesNestedInput
    children?: ChildRecordUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    departmentId?: IntFieldUpdateOperationsInput | number
    positionId?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ChildRecordUncheckedUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUncheckedUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUncheckedUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUncheckedUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUncheckedUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUncheckedUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUncheckedUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUncheckedUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUncheckedUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeCreateManyInput = {
    id?: number
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    departmentId: number
    positionId: number
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EmployeeUpdateManyMutationInput = {
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EmployeeUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    departmentId?: IntFieldUpdateOperationsInput | number
    positionId?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FamilyBackgroundCreateInput = {
    spouseFirstName?: string | null
    spouseLastName?: string | null
    spouseMiddleName?: string | null
    spouseOccupation?: string | null
    spouseEmployer?: string | null
    spouseBusinessAddress?: string | null
    spouseTelephone?: string | null
    fatherFirstName: string
    fatherLastName: string
    fatherMiddleName?: string | null
    motherMaidenFirst: string
    motherMaidenLast: string
    motherMaidenMiddle?: string | null
    employee: EmployeeCreateNestedOneWithoutFamilyInput
  }

  export type FamilyBackgroundUncheckedCreateInput = {
    id?: number
    employeeId: number
    spouseFirstName?: string | null
    spouseLastName?: string | null
    spouseMiddleName?: string | null
    spouseOccupation?: string | null
    spouseEmployer?: string | null
    spouseBusinessAddress?: string | null
    spouseTelephone?: string | null
    fatherFirstName: string
    fatherLastName: string
    fatherMiddleName?: string | null
    motherMaidenFirst: string
    motherMaidenLast: string
    motherMaidenMiddle?: string | null
  }

  export type FamilyBackgroundUpdateInput = {
    spouseFirstName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseLastName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseMiddleName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseOccupation?: NullableStringFieldUpdateOperationsInput | string | null
    spouseEmployer?: NullableStringFieldUpdateOperationsInput | string | null
    spouseBusinessAddress?: NullableStringFieldUpdateOperationsInput | string | null
    spouseTelephone?: NullableStringFieldUpdateOperationsInput | string | null
    fatherFirstName?: StringFieldUpdateOperationsInput | string
    fatherLastName?: StringFieldUpdateOperationsInput | string
    fatherMiddleName?: NullableStringFieldUpdateOperationsInput | string | null
    motherMaidenFirst?: StringFieldUpdateOperationsInput | string
    motherMaidenLast?: StringFieldUpdateOperationsInput | string
    motherMaidenMiddle?: NullableStringFieldUpdateOperationsInput | string | null
    employee?: EmployeeUpdateOneRequiredWithoutFamilyNestedInput
  }

  export type FamilyBackgroundUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    spouseFirstName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseLastName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseMiddleName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseOccupation?: NullableStringFieldUpdateOperationsInput | string | null
    spouseEmployer?: NullableStringFieldUpdateOperationsInput | string | null
    spouseBusinessAddress?: NullableStringFieldUpdateOperationsInput | string | null
    spouseTelephone?: NullableStringFieldUpdateOperationsInput | string | null
    fatherFirstName?: StringFieldUpdateOperationsInput | string
    fatherLastName?: StringFieldUpdateOperationsInput | string
    fatherMiddleName?: NullableStringFieldUpdateOperationsInput | string | null
    motherMaidenFirst?: StringFieldUpdateOperationsInput | string
    motherMaidenLast?: StringFieldUpdateOperationsInput | string
    motherMaidenMiddle?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type FamilyBackgroundCreateManyInput = {
    id?: number
    employeeId: number
    spouseFirstName?: string | null
    spouseLastName?: string | null
    spouseMiddleName?: string | null
    spouseOccupation?: string | null
    spouseEmployer?: string | null
    spouseBusinessAddress?: string | null
    spouseTelephone?: string | null
    fatherFirstName: string
    fatherLastName: string
    fatherMiddleName?: string | null
    motherMaidenFirst: string
    motherMaidenLast: string
    motherMaidenMiddle?: string | null
  }

  export type FamilyBackgroundUpdateManyMutationInput = {
    spouseFirstName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseLastName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseMiddleName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseOccupation?: NullableStringFieldUpdateOperationsInput | string | null
    spouseEmployer?: NullableStringFieldUpdateOperationsInput | string | null
    spouseBusinessAddress?: NullableStringFieldUpdateOperationsInput | string | null
    spouseTelephone?: NullableStringFieldUpdateOperationsInput | string | null
    fatherFirstName?: StringFieldUpdateOperationsInput | string
    fatherLastName?: StringFieldUpdateOperationsInput | string
    fatherMiddleName?: NullableStringFieldUpdateOperationsInput | string | null
    motherMaidenFirst?: StringFieldUpdateOperationsInput | string
    motherMaidenLast?: StringFieldUpdateOperationsInput | string
    motherMaidenMiddle?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type FamilyBackgroundUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    spouseFirstName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseLastName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseMiddleName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseOccupation?: NullableStringFieldUpdateOperationsInput | string | null
    spouseEmployer?: NullableStringFieldUpdateOperationsInput | string | null
    spouseBusinessAddress?: NullableStringFieldUpdateOperationsInput | string | null
    spouseTelephone?: NullableStringFieldUpdateOperationsInput | string | null
    fatherFirstName?: StringFieldUpdateOperationsInput | string
    fatherLastName?: StringFieldUpdateOperationsInput | string
    fatherMiddleName?: NullableStringFieldUpdateOperationsInput | string | null
    motherMaidenFirst?: StringFieldUpdateOperationsInput | string
    motherMaidenLast?: StringFieldUpdateOperationsInput | string
    motherMaidenMiddle?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ChildRecordCreateInput = {
    name: string
    dateOfBirth: Date | string
    employee: EmployeeCreateNestedOneWithoutChildrenInput
  }

  export type ChildRecordUncheckedCreateInput = {
    id?: number
    employeeId: number
    name: string
    dateOfBirth: Date | string
  }

  export type ChildRecordUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    employee?: EmployeeUpdateOneRequiredWithoutChildrenNestedInput
  }

  export type ChildRecordUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChildRecordCreateManyInput = {
    id?: number
    employeeId: number
    name: string
    dateOfBirth: Date | string
  }

  export type ChildRecordUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChildRecordUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EducationalBackgroundCreateInput = {
    level: string
    schoolName: string
    degreeCourse?: string | null
    yearGraduated?: string | null
    highestLevelEarned?: string | null
    dateFrom?: Date | string | null
    dateTo?: Date | string | null
    scholarships?: string | null
    employee: EmployeeCreateNestedOneWithoutEducationInput
  }

  export type EducationalBackgroundUncheckedCreateInput = {
    id?: number
    employeeId: number
    level: string
    schoolName: string
    degreeCourse?: string | null
    yearGraduated?: string | null
    highestLevelEarned?: string | null
    dateFrom?: Date | string | null
    dateTo?: Date | string | null
    scholarships?: string | null
  }

  export type EducationalBackgroundUpdateInput = {
    level?: StringFieldUpdateOperationsInput | string
    schoolName?: StringFieldUpdateOperationsInput | string
    degreeCourse?: NullableStringFieldUpdateOperationsInput | string | null
    yearGraduated?: NullableStringFieldUpdateOperationsInput | string | null
    highestLevelEarned?: NullableStringFieldUpdateOperationsInput | string | null
    dateFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scholarships?: NullableStringFieldUpdateOperationsInput | string | null
    employee?: EmployeeUpdateOneRequiredWithoutEducationNestedInput
  }

  export type EducationalBackgroundUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    level?: StringFieldUpdateOperationsInput | string
    schoolName?: StringFieldUpdateOperationsInput | string
    degreeCourse?: NullableStringFieldUpdateOperationsInput | string | null
    yearGraduated?: NullableStringFieldUpdateOperationsInput | string | null
    highestLevelEarned?: NullableStringFieldUpdateOperationsInput | string | null
    dateFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scholarships?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EducationalBackgroundCreateManyInput = {
    id?: number
    employeeId: number
    level: string
    schoolName: string
    degreeCourse?: string | null
    yearGraduated?: string | null
    highestLevelEarned?: string | null
    dateFrom?: Date | string | null
    dateTo?: Date | string | null
    scholarships?: string | null
  }

  export type EducationalBackgroundUpdateManyMutationInput = {
    level?: StringFieldUpdateOperationsInput | string
    schoolName?: StringFieldUpdateOperationsInput | string
    degreeCourse?: NullableStringFieldUpdateOperationsInput | string | null
    yearGraduated?: NullableStringFieldUpdateOperationsInput | string | null
    highestLevelEarned?: NullableStringFieldUpdateOperationsInput | string | null
    dateFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scholarships?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EducationalBackgroundUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    level?: StringFieldUpdateOperationsInput | string
    schoolName?: StringFieldUpdateOperationsInput | string
    degreeCourse?: NullableStringFieldUpdateOperationsInput | string | null
    yearGraduated?: NullableStringFieldUpdateOperationsInput | string | null
    highestLevelEarned?: NullableStringFieldUpdateOperationsInput | string | null
    dateFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scholarships?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type CivilServiceEligibilityCreateInput = {
    careerService: string
    rating?: number | null
    dateOfExamination?: Date | string | null
    placeOfExamination?: string | null
    licenseNo?: string | null
    licenseValidity?: Date | string | null
    employee: EmployeeCreateNestedOneWithoutCivilServiceInput
  }

  export type CivilServiceEligibilityUncheckedCreateInput = {
    id?: number
    employeeId: number
    careerService: string
    rating?: number | null
    dateOfExamination?: Date | string | null
    placeOfExamination?: string | null
    licenseNo?: string | null
    licenseValidity?: Date | string | null
  }

  export type CivilServiceEligibilityUpdateInput = {
    careerService?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    dateOfExamination?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    placeOfExamination?: NullableStringFieldUpdateOperationsInput | string | null
    licenseNo?: NullableStringFieldUpdateOperationsInput | string | null
    licenseValidity?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    employee?: EmployeeUpdateOneRequiredWithoutCivilServiceNestedInput
  }

  export type CivilServiceEligibilityUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    careerService?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    dateOfExamination?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    placeOfExamination?: NullableStringFieldUpdateOperationsInput | string | null
    licenseNo?: NullableStringFieldUpdateOperationsInput | string | null
    licenseValidity?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type CivilServiceEligibilityCreateManyInput = {
    id?: number
    employeeId: number
    careerService: string
    rating?: number | null
    dateOfExamination?: Date | string | null
    placeOfExamination?: string | null
    licenseNo?: string | null
    licenseValidity?: Date | string | null
  }

  export type CivilServiceEligibilityUpdateManyMutationInput = {
    careerService?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    dateOfExamination?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    placeOfExamination?: NullableStringFieldUpdateOperationsInput | string | null
    licenseNo?: NullableStringFieldUpdateOperationsInput | string | null
    licenseValidity?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type CivilServiceEligibilityUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    careerService?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    dateOfExamination?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    placeOfExamination?: NullableStringFieldUpdateOperationsInput | string | null
    licenseNo?: NullableStringFieldUpdateOperationsInput | string | null
    licenseValidity?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type WorkExperienceCreateInput = {
    dateFrom: Date | string
    dateTo?: Date | string | null
    positionTitle: string
    departmentAgencyCompany: string
    monthlySalary?: number | null
    salaryGrade?: string | null
    statusOfAppointment?: string | null
    isGovService?: boolean
    employee: EmployeeCreateNestedOneWithoutWorkExperienceInput
  }

  export type WorkExperienceUncheckedCreateInput = {
    id?: number
    employeeId: number
    dateFrom: Date | string
    dateTo?: Date | string | null
    positionTitle: string
    departmentAgencyCompany: string
    monthlySalary?: number | null
    salaryGrade?: string | null
    statusOfAppointment?: string | null
    isGovService?: boolean
  }

  export type WorkExperienceUpdateInput = {
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    positionTitle?: StringFieldUpdateOperationsInput | string
    departmentAgencyCompany?: StringFieldUpdateOperationsInput | string
    monthlySalary?: NullableFloatFieldUpdateOperationsInput | number | null
    salaryGrade?: NullableStringFieldUpdateOperationsInput | string | null
    statusOfAppointment?: NullableStringFieldUpdateOperationsInput | string | null
    isGovService?: BoolFieldUpdateOperationsInput | boolean
    employee?: EmployeeUpdateOneRequiredWithoutWorkExperienceNestedInput
  }

  export type WorkExperienceUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    positionTitle?: StringFieldUpdateOperationsInput | string
    departmentAgencyCompany?: StringFieldUpdateOperationsInput | string
    monthlySalary?: NullableFloatFieldUpdateOperationsInput | number | null
    salaryGrade?: NullableStringFieldUpdateOperationsInput | string | null
    statusOfAppointment?: NullableStringFieldUpdateOperationsInput | string | null
    isGovService?: BoolFieldUpdateOperationsInput | boolean
  }

  export type WorkExperienceCreateManyInput = {
    id?: number
    employeeId: number
    dateFrom: Date | string
    dateTo?: Date | string | null
    positionTitle: string
    departmentAgencyCompany: string
    monthlySalary?: number | null
    salaryGrade?: string | null
    statusOfAppointment?: string | null
    isGovService?: boolean
  }

  export type WorkExperienceUpdateManyMutationInput = {
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    positionTitle?: StringFieldUpdateOperationsInput | string
    departmentAgencyCompany?: StringFieldUpdateOperationsInput | string
    monthlySalary?: NullableFloatFieldUpdateOperationsInput | number | null
    salaryGrade?: NullableStringFieldUpdateOperationsInput | string | null
    statusOfAppointment?: NullableStringFieldUpdateOperationsInput | string | null
    isGovService?: BoolFieldUpdateOperationsInput | boolean
  }

  export type WorkExperienceUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    positionTitle?: StringFieldUpdateOperationsInput | string
    departmentAgencyCompany?: StringFieldUpdateOperationsInput | string
    monthlySalary?: NullableFloatFieldUpdateOperationsInput | number | null
    salaryGrade?: NullableStringFieldUpdateOperationsInput | string | null
    statusOfAppointment?: NullableStringFieldUpdateOperationsInput | string | null
    isGovService?: BoolFieldUpdateOperationsInput | boolean
  }

  export type VoluntaryWorkCreateInput = {
    organizationName: string
    organizationAddress?: string | null
    dateFrom: Date | string
    dateTo?: Date | string | null
    numberOfHours?: number | null
    positionNature: string
    employee: EmployeeCreateNestedOneWithoutVoluntaryWorkInput
  }

  export type VoluntaryWorkUncheckedCreateInput = {
    id?: number
    employeeId: number
    organizationName: string
    organizationAddress?: string | null
    dateFrom: Date | string
    dateTo?: Date | string | null
    numberOfHours?: number | null
    positionNature: string
  }

  export type VoluntaryWorkUpdateInput = {
    organizationName?: StringFieldUpdateOperationsInput | string
    organizationAddress?: NullableStringFieldUpdateOperationsInput | string | null
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    numberOfHours?: NullableFloatFieldUpdateOperationsInput | number | null
    positionNature?: StringFieldUpdateOperationsInput | string
    employee?: EmployeeUpdateOneRequiredWithoutVoluntaryWorkNestedInput
  }

  export type VoluntaryWorkUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    organizationName?: StringFieldUpdateOperationsInput | string
    organizationAddress?: NullableStringFieldUpdateOperationsInput | string | null
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    numberOfHours?: NullableFloatFieldUpdateOperationsInput | number | null
    positionNature?: StringFieldUpdateOperationsInput | string
  }

  export type VoluntaryWorkCreateManyInput = {
    id?: number
    employeeId: number
    organizationName: string
    organizationAddress?: string | null
    dateFrom: Date | string
    dateTo?: Date | string | null
    numberOfHours?: number | null
    positionNature: string
  }

  export type VoluntaryWorkUpdateManyMutationInput = {
    organizationName?: StringFieldUpdateOperationsInput | string
    organizationAddress?: NullableStringFieldUpdateOperationsInput | string | null
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    numberOfHours?: NullableFloatFieldUpdateOperationsInput | number | null
    positionNature?: StringFieldUpdateOperationsInput | string
  }

  export type VoluntaryWorkUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    organizationName?: StringFieldUpdateOperationsInput | string
    organizationAddress?: NullableStringFieldUpdateOperationsInput | string | null
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    numberOfHours?: NullableFloatFieldUpdateOperationsInput | number | null
    positionNature?: StringFieldUpdateOperationsInput | string
  }

  export type TrainingProgramCreateInput = {
    titleOfLearning: string
    dateFrom: Date | string
    dateTo?: Date | string | null
    numberOfHours?: number | null
    typeOfId?: string | null
    sponsoredBy?: string | null
    employee: EmployeeCreateNestedOneWithoutTrainingInput
  }

  export type TrainingProgramUncheckedCreateInput = {
    id?: number
    employeeId: number
    titleOfLearning: string
    dateFrom: Date | string
    dateTo?: Date | string | null
    numberOfHours?: number | null
    typeOfId?: string | null
    sponsoredBy?: string | null
  }

  export type TrainingProgramUpdateInput = {
    titleOfLearning?: StringFieldUpdateOperationsInput | string
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    numberOfHours?: NullableFloatFieldUpdateOperationsInput | number | null
    typeOfId?: NullableStringFieldUpdateOperationsInput | string | null
    sponsoredBy?: NullableStringFieldUpdateOperationsInput | string | null
    employee?: EmployeeUpdateOneRequiredWithoutTrainingNestedInput
  }

  export type TrainingProgramUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    titleOfLearning?: StringFieldUpdateOperationsInput | string
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    numberOfHours?: NullableFloatFieldUpdateOperationsInput | number | null
    typeOfId?: NullableStringFieldUpdateOperationsInput | string | null
    sponsoredBy?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TrainingProgramCreateManyInput = {
    id?: number
    employeeId: number
    titleOfLearning: string
    dateFrom: Date | string
    dateTo?: Date | string | null
    numberOfHours?: number | null
    typeOfId?: string | null
    sponsoredBy?: string | null
  }

  export type TrainingProgramUpdateManyMutationInput = {
    titleOfLearning?: StringFieldUpdateOperationsInput | string
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    numberOfHours?: NullableFloatFieldUpdateOperationsInput | number | null
    typeOfId?: NullableStringFieldUpdateOperationsInput | string | null
    sponsoredBy?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TrainingProgramUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    titleOfLearning?: StringFieldUpdateOperationsInput | string
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    numberOfHours?: NullableFloatFieldUpdateOperationsInput | number | null
    typeOfId?: NullableStringFieldUpdateOperationsInput | string | null
    sponsoredBy?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OtherInformationCreateInput = {
    specialSkills?: string | null
    nonAcademicDistinctions?: string | null
    membershipInAssoc?: string | null
    employee: EmployeeCreateNestedOneWithoutSkillsInput
  }

  export type OtherInformationUncheckedCreateInput = {
    id?: number
    employeeId: number
    specialSkills?: string | null
    nonAcademicDistinctions?: string | null
    membershipInAssoc?: string | null
  }

  export type OtherInformationUpdateInput = {
    specialSkills?: NullableStringFieldUpdateOperationsInput | string | null
    nonAcademicDistinctions?: NullableStringFieldUpdateOperationsInput | string | null
    membershipInAssoc?: NullableStringFieldUpdateOperationsInput | string | null
    employee?: EmployeeUpdateOneRequiredWithoutSkillsNestedInput
  }

  export type OtherInformationUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    specialSkills?: NullableStringFieldUpdateOperationsInput | string | null
    nonAcademicDistinctions?: NullableStringFieldUpdateOperationsInput | string | null
    membershipInAssoc?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OtherInformationCreateManyInput = {
    id?: number
    employeeId: number
    specialSkills?: string | null
    nonAcademicDistinctions?: string | null
    membershipInAssoc?: string | null
  }

  export type OtherInformationUpdateManyMutationInput = {
    specialSkills?: NullableStringFieldUpdateOperationsInput | string | null
    nonAcademicDistinctions?: NullableStringFieldUpdateOperationsInput | string | null
    membershipInAssoc?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OtherInformationUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    specialSkills?: NullableStringFieldUpdateOperationsInput | string | null
    nonAcademicDistinctions?: NullableStringFieldUpdateOperationsInput | string | null
    membershipInAssoc?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type LeaveRecordCreateInput = {
    type: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    reason?: string | null
    createdAt?: Date | string
    employee: EmployeeCreateNestedOneWithoutLeavesInput
  }

  export type LeaveRecordUncheckedCreateInput = {
    id?: number
    employeeId: number
    type: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    reason?: string | null
    createdAt?: Date | string
  }

  export type LeaveRecordUpdateInput = {
    type?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    employee?: EmployeeUpdateOneRequiredWithoutLeavesNestedInput
  }

  export type LeaveRecordUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    type?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LeaveRecordCreateManyInput = {
    id?: number
    employeeId: number
    type: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    reason?: string | null
    createdAt?: Date | string
  }

  export type LeaveRecordUpdateManyMutationInput = {
    type?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LeaveRecordUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    employeeId?: IntFieldUpdateOperationsInput | number
    type?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type AgencyOrderByRelevanceInput = {
    fields: AgencyOrderByRelevanceFieldEnum | AgencyOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type AgencyCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    address?: SortOrder
    contactNo?: SortOrder
    logoBase64?: SortOrder
  }

  export type AgencyAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type AgencyMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    address?: SortOrder
    contactNo?: SortOrder
    logoBase64?: SortOrder
  }

  export type AgencyMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    address?: SortOrder
    contactNo?: SortOrder
    logoBase64?: SortOrder
  }

  export type AgencySumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EmployeeListRelationFilter = {
    every?: EmployeeWhereInput
    some?: EmployeeWhereInput
    none?: EmployeeWhereInput
  }

  export type EmployeeOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type DepartmentOrderByRelevanceInput = {
    fields: DepartmentOrderByRelevanceFieldEnum | DepartmentOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type DepartmentCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
  }

  export type DepartmentAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type DepartmentMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
  }

  export type DepartmentMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
  }

  export type DepartmentSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type PositionOrderByRelevanceInput = {
    fields: PositionOrderByRelevanceFieldEnum | PositionOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type PositionCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
  }

  export type PositionAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type PositionMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
  }

  export type PositionMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
  }

  export type PositionSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type SalaryGradeCountOrderByAggregateInput = {
    id?: SortOrder
    grade?: SortOrder
    step?: SortOrder
    amount?: SortOrder
  }

  export type SalaryGradeAvgOrderByAggregateInput = {
    id?: SortOrder
    grade?: SortOrder
    step?: SortOrder
    amount?: SortOrder
  }

  export type SalaryGradeMaxOrderByAggregateInput = {
    id?: SortOrder
    grade?: SortOrder
    step?: SortOrder
    amount?: SortOrder
  }

  export type SalaryGradeMinOrderByAggregateInput = {
    id?: SortOrder
    grade?: SortOrder
    step?: SortOrder
    amount?: SortOrder
  }

  export type SalaryGradeSumOrderByAggregateInput = {
    id?: SortOrder
    grade?: SortOrder
    step?: SortOrder
    amount?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type UserOrderByRelevanceInput = {
    fields: UserOrderByRelevanceFieldEnum | UserOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    role?: SortOrder
    name?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    role?: SortOrder
    name?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    role?: SortOrder
    name?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DepartmentScalarRelationFilter = {
    is?: DepartmentWhereInput
    isNot?: DepartmentWhereInput
  }

  export type PositionScalarRelationFilter = {
    is?: PositionWhereInput
    isNot?: PositionWhereInput
  }

  export type ChildRecordListRelationFilter = {
    every?: ChildRecordWhereInput
    some?: ChildRecordWhereInput
    none?: ChildRecordWhereInput
  }

  export type EducationalBackgroundListRelationFilter = {
    every?: EducationalBackgroundWhereInput
    some?: EducationalBackgroundWhereInput
    none?: EducationalBackgroundWhereInput
  }

  export type CivilServiceEligibilityListRelationFilter = {
    every?: CivilServiceEligibilityWhereInput
    some?: CivilServiceEligibilityWhereInput
    none?: CivilServiceEligibilityWhereInput
  }

  export type WorkExperienceListRelationFilter = {
    every?: WorkExperienceWhereInput
    some?: WorkExperienceWhereInput
    none?: WorkExperienceWhereInput
  }

  export type VoluntaryWorkListRelationFilter = {
    every?: VoluntaryWorkWhereInput
    some?: VoluntaryWorkWhereInput
    none?: VoluntaryWorkWhereInput
  }

  export type TrainingProgramListRelationFilter = {
    every?: TrainingProgramWhereInput
    some?: TrainingProgramWhereInput
    none?: TrainingProgramWhereInput
  }

  export type OtherInformationListRelationFilter = {
    every?: OtherInformationWhereInput
    some?: OtherInformationWhereInput
    none?: OtherInformationWhereInput
  }

  export type FamilyBackgroundNullableScalarRelationFilter = {
    is?: FamilyBackgroundWhereInput | null
    isNot?: FamilyBackgroundWhereInput | null
  }

  export type LeaveRecordListRelationFilter = {
    every?: LeaveRecordWhereInput
    some?: LeaveRecordWhereInput
    none?: LeaveRecordWhereInput
  }

  export type ChildRecordOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EducationalBackgroundOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CivilServiceEligibilityOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type WorkExperienceOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type VoluntaryWorkOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TrainingProgramOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type OtherInformationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LeaveRecordOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EmployeeOrderByRelevanceInput = {
    fields: EmployeeOrderByRelevanceFieldEnum | EmployeeOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type EmployeeCountOrderByAggregateInput = {
    id?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    middleName?: SortOrder
    nameExtension?: SortOrder
    dateOfBirth?: SortOrder
    placeOfBirth?: SortOrder
    sex?: SortOrder
    civilStatus?: SortOrder
    height?: SortOrder
    weight?: SortOrder
    bloodType?: SortOrder
    gsisNo?: SortOrder
    pagibigNo?: SortOrder
    philhealthNo?: SortOrder
    sssNo?: SortOrder
    tinNo?: SortOrder
    agencyEmployeeNo?: SortOrder
    citizenship?: SortOrder
    residentialAddress?: SortOrder
    permanentAddress?: SortOrder
    telephoneNo?: SortOrder
    mobileNo?: SortOrder
    email?: SortOrder
    departmentId?: SortOrder
    positionId?: SortOrder
    status?: SortOrder
    dateHired?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EmployeeAvgOrderByAggregateInput = {
    id?: SortOrder
    height?: SortOrder
    weight?: SortOrder
    departmentId?: SortOrder
    positionId?: SortOrder
  }

  export type EmployeeMaxOrderByAggregateInput = {
    id?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    middleName?: SortOrder
    nameExtension?: SortOrder
    dateOfBirth?: SortOrder
    placeOfBirth?: SortOrder
    sex?: SortOrder
    civilStatus?: SortOrder
    height?: SortOrder
    weight?: SortOrder
    bloodType?: SortOrder
    gsisNo?: SortOrder
    pagibigNo?: SortOrder
    philhealthNo?: SortOrder
    sssNo?: SortOrder
    tinNo?: SortOrder
    agencyEmployeeNo?: SortOrder
    citizenship?: SortOrder
    residentialAddress?: SortOrder
    permanentAddress?: SortOrder
    telephoneNo?: SortOrder
    mobileNo?: SortOrder
    email?: SortOrder
    departmentId?: SortOrder
    positionId?: SortOrder
    status?: SortOrder
    dateHired?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EmployeeMinOrderByAggregateInput = {
    id?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    middleName?: SortOrder
    nameExtension?: SortOrder
    dateOfBirth?: SortOrder
    placeOfBirth?: SortOrder
    sex?: SortOrder
    civilStatus?: SortOrder
    height?: SortOrder
    weight?: SortOrder
    bloodType?: SortOrder
    gsisNo?: SortOrder
    pagibigNo?: SortOrder
    philhealthNo?: SortOrder
    sssNo?: SortOrder
    tinNo?: SortOrder
    agencyEmployeeNo?: SortOrder
    citizenship?: SortOrder
    residentialAddress?: SortOrder
    permanentAddress?: SortOrder
    telephoneNo?: SortOrder
    mobileNo?: SortOrder
    email?: SortOrder
    departmentId?: SortOrder
    positionId?: SortOrder
    status?: SortOrder
    dateHired?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EmployeeSumOrderByAggregateInput = {
    id?: SortOrder
    height?: SortOrder
    weight?: SortOrder
    departmentId?: SortOrder
    positionId?: SortOrder
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type EmployeeScalarRelationFilter = {
    is?: EmployeeWhereInput
    isNot?: EmployeeWhereInput
  }

  export type FamilyBackgroundOrderByRelevanceInput = {
    fields: FamilyBackgroundOrderByRelevanceFieldEnum | FamilyBackgroundOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type FamilyBackgroundCountOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    spouseFirstName?: SortOrder
    spouseLastName?: SortOrder
    spouseMiddleName?: SortOrder
    spouseOccupation?: SortOrder
    spouseEmployer?: SortOrder
    spouseBusinessAddress?: SortOrder
    spouseTelephone?: SortOrder
    fatherFirstName?: SortOrder
    fatherLastName?: SortOrder
    fatherMiddleName?: SortOrder
    motherMaidenFirst?: SortOrder
    motherMaidenLast?: SortOrder
    motherMaidenMiddle?: SortOrder
  }

  export type FamilyBackgroundAvgOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
  }

  export type FamilyBackgroundMaxOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    spouseFirstName?: SortOrder
    spouseLastName?: SortOrder
    spouseMiddleName?: SortOrder
    spouseOccupation?: SortOrder
    spouseEmployer?: SortOrder
    spouseBusinessAddress?: SortOrder
    spouseTelephone?: SortOrder
    fatherFirstName?: SortOrder
    fatherLastName?: SortOrder
    fatherMiddleName?: SortOrder
    motherMaidenFirst?: SortOrder
    motherMaidenLast?: SortOrder
    motherMaidenMiddle?: SortOrder
  }

  export type FamilyBackgroundMinOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    spouseFirstName?: SortOrder
    spouseLastName?: SortOrder
    spouseMiddleName?: SortOrder
    spouseOccupation?: SortOrder
    spouseEmployer?: SortOrder
    spouseBusinessAddress?: SortOrder
    spouseTelephone?: SortOrder
    fatherFirstName?: SortOrder
    fatherLastName?: SortOrder
    fatherMiddleName?: SortOrder
    motherMaidenFirst?: SortOrder
    motherMaidenLast?: SortOrder
    motherMaidenMiddle?: SortOrder
  }

  export type FamilyBackgroundSumOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
  }

  export type ChildRecordOrderByRelevanceInput = {
    fields: ChildRecordOrderByRelevanceFieldEnum | ChildRecordOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type ChildRecordCountOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    name?: SortOrder
    dateOfBirth?: SortOrder
  }

  export type ChildRecordAvgOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
  }

  export type ChildRecordMaxOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    name?: SortOrder
    dateOfBirth?: SortOrder
  }

  export type ChildRecordMinOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    name?: SortOrder
    dateOfBirth?: SortOrder
  }

  export type ChildRecordSumOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
  }

  export type EducationalBackgroundOrderByRelevanceInput = {
    fields: EducationalBackgroundOrderByRelevanceFieldEnum | EducationalBackgroundOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type EducationalBackgroundCountOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    level?: SortOrder
    schoolName?: SortOrder
    degreeCourse?: SortOrder
    yearGraduated?: SortOrder
    highestLevelEarned?: SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrder
    scholarships?: SortOrder
  }

  export type EducationalBackgroundAvgOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
  }

  export type EducationalBackgroundMaxOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    level?: SortOrder
    schoolName?: SortOrder
    degreeCourse?: SortOrder
    yearGraduated?: SortOrder
    highestLevelEarned?: SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrder
    scholarships?: SortOrder
  }

  export type EducationalBackgroundMinOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    level?: SortOrder
    schoolName?: SortOrder
    degreeCourse?: SortOrder
    yearGraduated?: SortOrder
    highestLevelEarned?: SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrder
    scholarships?: SortOrder
  }

  export type EducationalBackgroundSumOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
  }

  export type CivilServiceEligibilityOrderByRelevanceInput = {
    fields: CivilServiceEligibilityOrderByRelevanceFieldEnum | CivilServiceEligibilityOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type CivilServiceEligibilityCountOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    careerService?: SortOrder
    rating?: SortOrder
    dateOfExamination?: SortOrder
    placeOfExamination?: SortOrder
    licenseNo?: SortOrder
    licenseValidity?: SortOrder
  }

  export type CivilServiceEligibilityAvgOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    rating?: SortOrder
  }

  export type CivilServiceEligibilityMaxOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    careerService?: SortOrder
    rating?: SortOrder
    dateOfExamination?: SortOrder
    placeOfExamination?: SortOrder
    licenseNo?: SortOrder
    licenseValidity?: SortOrder
  }

  export type CivilServiceEligibilityMinOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    careerService?: SortOrder
    rating?: SortOrder
    dateOfExamination?: SortOrder
    placeOfExamination?: SortOrder
    licenseNo?: SortOrder
    licenseValidity?: SortOrder
  }

  export type CivilServiceEligibilitySumOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    rating?: SortOrder
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type WorkExperienceOrderByRelevanceInput = {
    fields: WorkExperienceOrderByRelevanceFieldEnum | WorkExperienceOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type WorkExperienceCountOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrder
    positionTitle?: SortOrder
    departmentAgencyCompany?: SortOrder
    monthlySalary?: SortOrder
    salaryGrade?: SortOrder
    statusOfAppointment?: SortOrder
    isGovService?: SortOrder
  }

  export type WorkExperienceAvgOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    monthlySalary?: SortOrder
  }

  export type WorkExperienceMaxOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrder
    positionTitle?: SortOrder
    departmentAgencyCompany?: SortOrder
    monthlySalary?: SortOrder
    salaryGrade?: SortOrder
    statusOfAppointment?: SortOrder
    isGovService?: SortOrder
  }

  export type WorkExperienceMinOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrder
    positionTitle?: SortOrder
    departmentAgencyCompany?: SortOrder
    monthlySalary?: SortOrder
    salaryGrade?: SortOrder
    statusOfAppointment?: SortOrder
    isGovService?: SortOrder
  }

  export type WorkExperienceSumOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    monthlySalary?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type VoluntaryWorkOrderByRelevanceInput = {
    fields: VoluntaryWorkOrderByRelevanceFieldEnum | VoluntaryWorkOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type VoluntaryWorkCountOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    organizationName?: SortOrder
    organizationAddress?: SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrder
    numberOfHours?: SortOrder
    positionNature?: SortOrder
  }

  export type VoluntaryWorkAvgOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    numberOfHours?: SortOrder
  }

  export type VoluntaryWorkMaxOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    organizationName?: SortOrder
    organizationAddress?: SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrder
    numberOfHours?: SortOrder
    positionNature?: SortOrder
  }

  export type VoluntaryWorkMinOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    organizationName?: SortOrder
    organizationAddress?: SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrder
    numberOfHours?: SortOrder
    positionNature?: SortOrder
  }

  export type VoluntaryWorkSumOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    numberOfHours?: SortOrder
  }

  export type TrainingProgramOrderByRelevanceInput = {
    fields: TrainingProgramOrderByRelevanceFieldEnum | TrainingProgramOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type TrainingProgramCountOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    titleOfLearning?: SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrder
    numberOfHours?: SortOrder
    typeOfId?: SortOrder
    sponsoredBy?: SortOrder
  }

  export type TrainingProgramAvgOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    numberOfHours?: SortOrder
  }

  export type TrainingProgramMaxOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    titleOfLearning?: SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrder
    numberOfHours?: SortOrder
    typeOfId?: SortOrder
    sponsoredBy?: SortOrder
  }

  export type TrainingProgramMinOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    titleOfLearning?: SortOrder
    dateFrom?: SortOrder
    dateTo?: SortOrder
    numberOfHours?: SortOrder
    typeOfId?: SortOrder
    sponsoredBy?: SortOrder
  }

  export type TrainingProgramSumOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    numberOfHours?: SortOrder
  }

  export type OtherInformationOrderByRelevanceInput = {
    fields: OtherInformationOrderByRelevanceFieldEnum | OtherInformationOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type OtherInformationCountOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    specialSkills?: SortOrder
    nonAcademicDistinctions?: SortOrder
    membershipInAssoc?: SortOrder
  }

  export type OtherInformationAvgOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
  }

  export type OtherInformationMaxOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    specialSkills?: SortOrder
    nonAcademicDistinctions?: SortOrder
    membershipInAssoc?: SortOrder
  }

  export type OtherInformationMinOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    specialSkills?: SortOrder
    nonAcademicDistinctions?: SortOrder
    membershipInAssoc?: SortOrder
  }

  export type OtherInformationSumOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
  }

  export type LeaveRecordOrderByRelevanceInput = {
    fields: LeaveRecordOrderByRelevanceFieldEnum | LeaveRecordOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type LeaveRecordCountOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    type?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
  }

  export type LeaveRecordAvgOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
  }

  export type LeaveRecordMaxOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    type?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
  }

  export type LeaveRecordMinOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
    type?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
  }

  export type LeaveRecordSumOrderByAggregateInput = {
    id?: SortOrder
    employeeId?: SortOrder
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EmployeeCreateNestedManyWithoutDepartmentInput = {
    create?: XOR<EmployeeCreateWithoutDepartmentInput, EmployeeUncheckedCreateWithoutDepartmentInput> | EmployeeCreateWithoutDepartmentInput[] | EmployeeUncheckedCreateWithoutDepartmentInput[]
    connectOrCreate?: EmployeeCreateOrConnectWithoutDepartmentInput | EmployeeCreateOrConnectWithoutDepartmentInput[]
    createMany?: EmployeeCreateManyDepartmentInputEnvelope
    connect?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
  }

  export type EmployeeUncheckedCreateNestedManyWithoutDepartmentInput = {
    create?: XOR<EmployeeCreateWithoutDepartmentInput, EmployeeUncheckedCreateWithoutDepartmentInput> | EmployeeCreateWithoutDepartmentInput[] | EmployeeUncheckedCreateWithoutDepartmentInput[]
    connectOrCreate?: EmployeeCreateOrConnectWithoutDepartmentInput | EmployeeCreateOrConnectWithoutDepartmentInput[]
    createMany?: EmployeeCreateManyDepartmentInputEnvelope
    connect?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
  }

  export type EmployeeUpdateManyWithoutDepartmentNestedInput = {
    create?: XOR<EmployeeCreateWithoutDepartmentInput, EmployeeUncheckedCreateWithoutDepartmentInput> | EmployeeCreateWithoutDepartmentInput[] | EmployeeUncheckedCreateWithoutDepartmentInput[]
    connectOrCreate?: EmployeeCreateOrConnectWithoutDepartmentInput | EmployeeCreateOrConnectWithoutDepartmentInput[]
    upsert?: EmployeeUpsertWithWhereUniqueWithoutDepartmentInput | EmployeeUpsertWithWhereUniqueWithoutDepartmentInput[]
    createMany?: EmployeeCreateManyDepartmentInputEnvelope
    set?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
    disconnect?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
    delete?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
    connect?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
    update?: EmployeeUpdateWithWhereUniqueWithoutDepartmentInput | EmployeeUpdateWithWhereUniqueWithoutDepartmentInput[]
    updateMany?: EmployeeUpdateManyWithWhereWithoutDepartmentInput | EmployeeUpdateManyWithWhereWithoutDepartmentInput[]
    deleteMany?: EmployeeScalarWhereInput | EmployeeScalarWhereInput[]
  }

  export type EmployeeUncheckedUpdateManyWithoutDepartmentNestedInput = {
    create?: XOR<EmployeeCreateWithoutDepartmentInput, EmployeeUncheckedCreateWithoutDepartmentInput> | EmployeeCreateWithoutDepartmentInput[] | EmployeeUncheckedCreateWithoutDepartmentInput[]
    connectOrCreate?: EmployeeCreateOrConnectWithoutDepartmentInput | EmployeeCreateOrConnectWithoutDepartmentInput[]
    upsert?: EmployeeUpsertWithWhereUniqueWithoutDepartmentInput | EmployeeUpsertWithWhereUniqueWithoutDepartmentInput[]
    createMany?: EmployeeCreateManyDepartmentInputEnvelope
    set?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
    disconnect?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
    delete?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
    connect?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
    update?: EmployeeUpdateWithWhereUniqueWithoutDepartmentInput | EmployeeUpdateWithWhereUniqueWithoutDepartmentInput[]
    updateMany?: EmployeeUpdateManyWithWhereWithoutDepartmentInput | EmployeeUpdateManyWithWhereWithoutDepartmentInput[]
    deleteMany?: EmployeeScalarWhereInput | EmployeeScalarWhereInput[]
  }

  export type EmployeeCreateNestedManyWithoutPositionInput = {
    create?: XOR<EmployeeCreateWithoutPositionInput, EmployeeUncheckedCreateWithoutPositionInput> | EmployeeCreateWithoutPositionInput[] | EmployeeUncheckedCreateWithoutPositionInput[]
    connectOrCreate?: EmployeeCreateOrConnectWithoutPositionInput | EmployeeCreateOrConnectWithoutPositionInput[]
    createMany?: EmployeeCreateManyPositionInputEnvelope
    connect?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
  }

  export type EmployeeUncheckedCreateNestedManyWithoutPositionInput = {
    create?: XOR<EmployeeCreateWithoutPositionInput, EmployeeUncheckedCreateWithoutPositionInput> | EmployeeCreateWithoutPositionInput[] | EmployeeUncheckedCreateWithoutPositionInput[]
    connectOrCreate?: EmployeeCreateOrConnectWithoutPositionInput | EmployeeCreateOrConnectWithoutPositionInput[]
    createMany?: EmployeeCreateManyPositionInputEnvelope
    connect?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
  }

  export type EmployeeUpdateManyWithoutPositionNestedInput = {
    create?: XOR<EmployeeCreateWithoutPositionInput, EmployeeUncheckedCreateWithoutPositionInput> | EmployeeCreateWithoutPositionInput[] | EmployeeUncheckedCreateWithoutPositionInput[]
    connectOrCreate?: EmployeeCreateOrConnectWithoutPositionInput | EmployeeCreateOrConnectWithoutPositionInput[]
    upsert?: EmployeeUpsertWithWhereUniqueWithoutPositionInput | EmployeeUpsertWithWhereUniqueWithoutPositionInput[]
    createMany?: EmployeeCreateManyPositionInputEnvelope
    set?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
    disconnect?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
    delete?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
    connect?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
    update?: EmployeeUpdateWithWhereUniqueWithoutPositionInput | EmployeeUpdateWithWhereUniqueWithoutPositionInput[]
    updateMany?: EmployeeUpdateManyWithWhereWithoutPositionInput | EmployeeUpdateManyWithWhereWithoutPositionInput[]
    deleteMany?: EmployeeScalarWhereInput | EmployeeScalarWhereInput[]
  }

  export type EmployeeUncheckedUpdateManyWithoutPositionNestedInput = {
    create?: XOR<EmployeeCreateWithoutPositionInput, EmployeeUncheckedCreateWithoutPositionInput> | EmployeeCreateWithoutPositionInput[] | EmployeeUncheckedCreateWithoutPositionInput[]
    connectOrCreate?: EmployeeCreateOrConnectWithoutPositionInput | EmployeeCreateOrConnectWithoutPositionInput[]
    upsert?: EmployeeUpsertWithWhereUniqueWithoutPositionInput | EmployeeUpsertWithWhereUniqueWithoutPositionInput[]
    createMany?: EmployeeCreateManyPositionInputEnvelope
    set?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
    disconnect?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
    delete?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
    connect?: EmployeeWhereUniqueInput | EmployeeWhereUniqueInput[]
    update?: EmployeeUpdateWithWhereUniqueWithoutPositionInput | EmployeeUpdateWithWhereUniqueWithoutPositionInput[]
    updateMany?: EmployeeUpdateManyWithWhereWithoutPositionInput | EmployeeUpdateManyWithWhereWithoutPositionInput[]
    deleteMany?: EmployeeScalarWhereInput | EmployeeScalarWhereInput[]
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DepartmentCreateNestedOneWithoutEmployeesInput = {
    create?: XOR<DepartmentCreateWithoutEmployeesInput, DepartmentUncheckedCreateWithoutEmployeesInput>
    connectOrCreate?: DepartmentCreateOrConnectWithoutEmployeesInput
    connect?: DepartmentWhereUniqueInput
  }

  export type PositionCreateNestedOneWithoutEmployeesInput = {
    create?: XOR<PositionCreateWithoutEmployeesInput, PositionUncheckedCreateWithoutEmployeesInput>
    connectOrCreate?: PositionCreateOrConnectWithoutEmployeesInput
    connect?: PositionWhereUniqueInput
  }

  export type ChildRecordCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<ChildRecordCreateWithoutEmployeeInput, ChildRecordUncheckedCreateWithoutEmployeeInput> | ChildRecordCreateWithoutEmployeeInput[] | ChildRecordUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: ChildRecordCreateOrConnectWithoutEmployeeInput | ChildRecordCreateOrConnectWithoutEmployeeInput[]
    createMany?: ChildRecordCreateManyEmployeeInputEnvelope
    connect?: ChildRecordWhereUniqueInput | ChildRecordWhereUniqueInput[]
  }

  export type EducationalBackgroundCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<EducationalBackgroundCreateWithoutEmployeeInput, EducationalBackgroundUncheckedCreateWithoutEmployeeInput> | EducationalBackgroundCreateWithoutEmployeeInput[] | EducationalBackgroundUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: EducationalBackgroundCreateOrConnectWithoutEmployeeInput | EducationalBackgroundCreateOrConnectWithoutEmployeeInput[]
    createMany?: EducationalBackgroundCreateManyEmployeeInputEnvelope
    connect?: EducationalBackgroundWhereUniqueInput | EducationalBackgroundWhereUniqueInput[]
  }

  export type CivilServiceEligibilityCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<CivilServiceEligibilityCreateWithoutEmployeeInput, CivilServiceEligibilityUncheckedCreateWithoutEmployeeInput> | CivilServiceEligibilityCreateWithoutEmployeeInput[] | CivilServiceEligibilityUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: CivilServiceEligibilityCreateOrConnectWithoutEmployeeInput | CivilServiceEligibilityCreateOrConnectWithoutEmployeeInput[]
    createMany?: CivilServiceEligibilityCreateManyEmployeeInputEnvelope
    connect?: CivilServiceEligibilityWhereUniqueInput | CivilServiceEligibilityWhereUniqueInput[]
  }

  export type WorkExperienceCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<WorkExperienceCreateWithoutEmployeeInput, WorkExperienceUncheckedCreateWithoutEmployeeInput> | WorkExperienceCreateWithoutEmployeeInput[] | WorkExperienceUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: WorkExperienceCreateOrConnectWithoutEmployeeInput | WorkExperienceCreateOrConnectWithoutEmployeeInput[]
    createMany?: WorkExperienceCreateManyEmployeeInputEnvelope
    connect?: WorkExperienceWhereUniqueInput | WorkExperienceWhereUniqueInput[]
  }

  export type VoluntaryWorkCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<VoluntaryWorkCreateWithoutEmployeeInput, VoluntaryWorkUncheckedCreateWithoutEmployeeInput> | VoluntaryWorkCreateWithoutEmployeeInput[] | VoluntaryWorkUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: VoluntaryWorkCreateOrConnectWithoutEmployeeInput | VoluntaryWorkCreateOrConnectWithoutEmployeeInput[]
    createMany?: VoluntaryWorkCreateManyEmployeeInputEnvelope
    connect?: VoluntaryWorkWhereUniqueInput | VoluntaryWorkWhereUniqueInput[]
  }

  export type TrainingProgramCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<TrainingProgramCreateWithoutEmployeeInput, TrainingProgramUncheckedCreateWithoutEmployeeInput> | TrainingProgramCreateWithoutEmployeeInput[] | TrainingProgramUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: TrainingProgramCreateOrConnectWithoutEmployeeInput | TrainingProgramCreateOrConnectWithoutEmployeeInput[]
    createMany?: TrainingProgramCreateManyEmployeeInputEnvelope
    connect?: TrainingProgramWhereUniqueInput | TrainingProgramWhereUniqueInput[]
  }

  export type OtherInformationCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<OtherInformationCreateWithoutEmployeeInput, OtherInformationUncheckedCreateWithoutEmployeeInput> | OtherInformationCreateWithoutEmployeeInput[] | OtherInformationUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: OtherInformationCreateOrConnectWithoutEmployeeInput | OtherInformationCreateOrConnectWithoutEmployeeInput[]
    createMany?: OtherInformationCreateManyEmployeeInputEnvelope
    connect?: OtherInformationWhereUniqueInput | OtherInformationWhereUniqueInput[]
  }

  export type FamilyBackgroundCreateNestedOneWithoutEmployeeInput = {
    create?: XOR<FamilyBackgroundCreateWithoutEmployeeInput, FamilyBackgroundUncheckedCreateWithoutEmployeeInput>
    connectOrCreate?: FamilyBackgroundCreateOrConnectWithoutEmployeeInput
    connect?: FamilyBackgroundWhereUniqueInput
  }

  export type LeaveRecordCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<LeaveRecordCreateWithoutEmployeeInput, LeaveRecordUncheckedCreateWithoutEmployeeInput> | LeaveRecordCreateWithoutEmployeeInput[] | LeaveRecordUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: LeaveRecordCreateOrConnectWithoutEmployeeInput | LeaveRecordCreateOrConnectWithoutEmployeeInput[]
    createMany?: LeaveRecordCreateManyEmployeeInputEnvelope
    connect?: LeaveRecordWhereUniqueInput | LeaveRecordWhereUniqueInput[]
  }

  export type ChildRecordUncheckedCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<ChildRecordCreateWithoutEmployeeInput, ChildRecordUncheckedCreateWithoutEmployeeInput> | ChildRecordCreateWithoutEmployeeInput[] | ChildRecordUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: ChildRecordCreateOrConnectWithoutEmployeeInput | ChildRecordCreateOrConnectWithoutEmployeeInput[]
    createMany?: ChildRecordCreateManyEmployeeInputEnvelope
    connect?: ChildRecordWhereUniqueInput | ChildRecordWhereUniqueInput[]
  }

  export type EducationalBackgroundUncheckedCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<EducationalBackgroundCreateWithoutEmployeeInput, EducationalBackgroundUncheckedCreateWithoutEmployeeInput> | EducationalBackgroundCreateWithoutEmployeeInput[] | EducationalBackgroundUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: EducationalBackgroundCreateOrConnectWithoutEmployeeInput | EducationalBackgroundCreateOrConnectWithoutEmployeeInput[]
    createMany?: EducationalBackgroundCreateManyEmployeeInputEnvelope
    connect?: EducationalBackgroundWhereUniqueInput | EducationalBackgroundWhereUniqueInput[]
  }

  export type CivilServiceEligibilityUncheckedCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<CivilServiceEligibilityCreateWithoutEmployeeInput, CivilServiceEligibilityUncheckedCreateWithoutEmployeeInput> | CivilServiceEligibilityCreateWithoutEmployeeInput[] | CivilServiceEligibilityUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: CivilServiceEligibilityCreateOrConnectWithoutEmployeeInput | CivilServiceEligibilityCreateOrConnectWithoutEmployeeInput[]
    createMany?: CivilServiceEligibilityCreateManyEmployeeInputEnvelope
    connect?: CivilServiceEligibilityWhereUniqueInput | CivilServiceEligibilityWhereUniqueInput[]
  }

  export type WorkExperienceUncheckedCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<WorkExperienceCreateWithoutEmployeeInput, WorkExperienceUncheckedCreateWithoutEmployeeInput> | WorkExperienceCreateWithoutEmployeeInput[] | WorkExperienceUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: WorkExperienceCreateOrConnectWithoutEmployeeInput | WorkExperienceCreateOrConnectWithoutEmployeeInput[]
    createMany?: WorkExperienceCreateManyEmployeeInputEnvelope
    connect?: WorkExperienceWhereUniqueInput | WorkExperienceWhereUniqueInput[]
  }

  export type VoluntaryWorkUncheckedCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<VoluntaryWorkCreateWithoutEmployeeInput, VoluntaryWorkUncheckedCreateWithoutEmployeeInput> | VoluntaryWorkCreateWithoutEmployeeInput[] | VoluntaryWorkUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: VoluntaryWorkCreateOrConnectWithoutEmployeeInput | VoluntaryWorkCreateOrConnectWithoutEmployeeInput[]
    createMany?: VoluntaryWorkCreateManyEmployeeInputEnvelope
    connect?: VoluntaryWorkWhereUniqueInput | VoluntaryWorkWhereUniqueInput[]
  }

  export type TrainingProgramUncheckedCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<TrainingProgramCreateWithoutEmployeeInput, TrainingProgramUncheckedCreateWithoutEmployeeInput> | TrainingProgramCreateWithoutEmployeeInput[] | TrainingProgramUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: TrainingProgramCreateOrConnectWithoutEmployeeInput | TrainingProgramCreateOrConnectWithoutEmployeeInput[]
    createMany?: TrainingProgramCreateManyEmployeeInputEnvelope
    connect?: TrainingProgramWhereUniqueInput | TrainingProgramWhereUniqueInput[]
  }

  export type OtherInformationUncheckedCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<OtherInformationCreateWithoutEmployeeInput, OtherInformationUncheckedCreateWithoutEmployeeInput> | OtherInformationCreateWithoutEmployeeInput[] | OtherInformationUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: OtherInformationCreateOrConnectWithoutEmployeeInput | OtherInformationCreateOrConnectWithoutEmployeeInput[]
    createMany?: OtherInformationCreateManyEmployeeInputEnvelope
    connect?: OtherInformationWhereUniqueInput | OtherInformationWhereUniqueInput[]
  }

  export type FamilyBackgroundUncheckedCreateNestedOneWithoutEmployeeInput = {
    create?: XOR<FamilyBackgroundCreateWithoutEmployeeInput, FamilyBackgroundUncheckedCreateWithoutEmployeeInput>
    connectOrCreate?: FamilyBackgroundCreateOrConnectWithoutEmployeeInput
    connect?: FamilyBackgroundWhereUniqueInput
  }

  export type LeaveRecordUncheckedCreateNestedManyWithoutEmployeeInput = {
    create?: XOR<LeaveRecordCreateWithoutEmployeeInput, LeaveRecordUncheckedCreateWithoutEmployeeInput> | LeaveRecordCreateWithoutEmployeeInput[] | LeaveRecordUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: LeaveRecordCreateOrConnectWithoutEmployeeInput | LeaveRecordCreateOrConnectWithoutEmployeeInput[]
    createMany?: LeaveRecordCreateManyEmployeeInputEnvelope
    connect?: LeaveRecordWhereUniqueInput | LeaveRecordWhereUniqueInput[]
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DepartmentUpdateOneRequiredWithoutEmployeesNestedInput = {
    create?: XOR<DepartmentCreateWithoutEmployeesInput, DepartmentUncheckedCreateWithoutEmployeesInput>
    connectOrCreate?: DepartmentCreateOrConnectWithoutEmployeesInput
    upsert?: DepartmentUpsertWithoutEmployeesInput
    connect?: DepartmentWhereUniqueInput
    update?: XOR<XOR<DepartmentUpdateToOneWithWhereWithoutEmployeesInput, DepartmentUpdateWithoutEmployeesInput>, DepartmentUncheckedUpdateWithoutEmployeesInput>
  }

  export type PositionUpdateOneRequiredWithoutEmployeesNestedInput = {
    create?: XOR<PositionCreateWithoutEmployeesInput, PositionUncheckedCreateWithoutEmployeesInput>
    connectOrCreate?: PositionCreateOrConnectWithoutEmployeesInput
    upsert?: PositionUpsertWithoutEmployeesInput
    connect?: PositionWhereUniqueInput
    update?: XOR<XOR<PositionUpdateToOneWithWhereWithoutEmployeesInput, PositionUpdateWithoutEmployeesInput>, PositionUncheckedUpdateWithoutEmployeesInput>
  }

  export type ChildRecordUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<ChildRecordCreateWithoutEmployeeInput, ChildRecordUncheckedCreateWithoutEmployeeInput> | ChildRecordCreateWithoutEmployeeInput[] | ChildRecordUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: ChildRecordCreateOrConnectWithoutEmployeeInput | ChildRecordCreateOrConnectWithoutEmployeeInput[]
    upsert?: ChildRecordUpsertWithWhereUniqueWithoutEmployeeInput | ChildRecordUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: ChildRecordCreateManyEmployeeInputEnvelope
    set?: ChildRecordWhereUniqueInput | ChildRecordWhereUniqueInput[]
    disconnect?: ChildRecordWhereUniqueInput | ChildRecordWhereUniqueInput[]
    delete?: ChildRecordWhereUniqueInput | ChildRecordWhereUniqueInput[]
    connect?: ChildRecordWhereUniqueInput | ChildRecordWhereUniqueInput[]
    update?: ChildRecordUpdateWithWhereUniqueWithoutEmployeeInput | ChildRecordUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: ChildRecordUpdateManyWithWhereWithoutEmployeeInput | ChildRecordUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: ChildRecordScalarWhereInput | ChildRecordScalarWhereInput[]
  }

  export type EducationalBackgroundUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<EducationalBackgroundCreateWithoutEmployeeInput, EducationalBackgroundUncheckedCreateWithoutEmployeeInput> | EducationalBackgroundCreateWithoutEmployeeInput[] | EducationalBackgroundUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: EducationalBackgroundCreateOrConnectWithoutEmployeeInput | EducationalBackgroundCreateOrConnectWithoutEmployeeInput[]
    upsert?: EducationalBackgroundUpsertWithWhereUniqueWithoutEmployeeInput | EducationalBackgroundUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: EducationalBackgroundCreateManyEmployeeInputEnvelope
    set?: EducationalBackgroundWhereUniqueInput | EducationalBackgroundWhereUniqueInput[]
    disconnect?: EducationalBackgroundWhereUniqueInput | EducationalBackgroundWhereUniqueInput[]
    delete?: EducationalBackgroundWhereUniqueInput | EducationalBackgroundWhereUniqueInput[]
    connect?: EducationalBackgroundWhereUniqueInput | EducationalBackgroundWhereUniqueInput[]
    update?: EducationalBackgroundUpdateWithWhereUniqueWithoutEmployeeInput | EducationalBackgroundUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: EducationalBackgroundUpdateManyWithWhereWithoutEmployeeInput | EducationalBackgroundUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: EducationalBackgroundScalarWhereInput | EducationalBackgroundScalarWhereInput[]
  }

  export type CivilServiceEligibilityUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<CivilServiceEligibilityCreateWithoutEmployeeInput, CivilServiceEligibilityUncheckedCreateWithoutEmployeeInput> | CivilServiceEligibilityCreateWithoutEmployeeInput[] | CivilServiceEligibilityUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: CivilServiceEligibilityCreateOrConnectWithoutEmployeeInput | CivilServiceEligibilityCreateOrConnectWithoutEmployeeInput[]
    upsert?: CivilServiceEligibilityUpsertWithWhereUniqueWithoutEmployeeInput | CivilServiceEligibilityUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: CivilServiceEligibilityCreateManyEmployeeInputEnvelope
    set?: CivilServiceEligibilityWhereUniqueInput | CivilServiceEligibilityWhereUniqueInput[]
    disconnect?: CivilServiceEligibilityWhereUniqueInput | CivilServiceEligibilityWhereUniqueInput[]
    delete?: CivilServiceEligibilityWhereUniqueInput | CivilServiceEligibilityWhereUniqueInput[]
    connect?: CivilServiceEligibilityWhereUniqueInput | CivilServiceEligibilityWhereUniqueInput[]
    update?: CivilServiceEligibilityUpdateWithWhereUniqueWithoutEmployeeInput | CivilServiceEligibilityUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: CivilServiceEligibilityUpdateManyWithWhereWithoutEmployeeInput | CivilServiceEligibilityUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: CivilServiceEligibilityScalarWhereInput | CivilServiceEligibilityScalarWhereInput[]
  }

  export type WorkExperienceUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<WorkExperienceCreateWithoutEmployeeInput, WorkExperienceUncheckedCreateWithoutEmployeeInput> | WorkExperienceCreateWithoutEmployeeInput[] | WorkExperienceUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: WorkExperienceCreateOrConnectWithoutEmployeeInput | WorkExperienceCreateOrConnectWithoutEmployeeInput[]
    upsert?: WorkExperienceUpsertWithWhereUniqueWithoutEmployeeInput | WorkExperienceUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: WorkExperienceCreateManyEmployeeInputEnvelope
    set?: WorkExperienceWhereUniqueInput | WorkExperienceWhereUniqueInput[]
    disconnect?: WorkExperienceWhereUniqueInput | WorkExperienceWhereUniqueInput[]
    delete?: WorkExperienceWhereUniqueInput | WorkExperienceWhereUniqueInput[]
    connect?: WorkExperienceWhereUniqueInput | WorkExperienceWhereUniqueInput[]
    update?: WorkExperienceUpdateWithWhereUniqueWithoutEmployeeInput | WorkExperienceUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: WorkExperienceUpdateManyWithWhereWithoutEmployeeInput | WorkExperienceUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: WorkExperienceScalarWhereInput | WorkExperienceScalarWhereInput[]
  }

  export type VoluntaryWorkUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<VoluntaryWorkCreateWithoutEmployeeInput, VoluntaryWorkUncheckedCreateWithoutEmployeeInput> | VoluntaryWorkCreateWithoutEmployeeInput[] | VoluntaryWorkUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: VoluntaryWorkCreateOrConnectWithoutEmployeeInput | VoluntaryWorkCreateOrConnectWithoutEmployeeInput[]
    upsert?: VoluntaryWorkUpsertWithWhereUniqueWithoutEmployeeInput | VoluntaryWorkUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: VoluntaryWorkCreateManyEmployeeInputEnvelope
    set?: VoluntaryWorkWhereUniqueInput | VoluntaryWorkWhereUniqueInput[]
    disconnect?: VoluntaryWorkWhereUniqueInput | VoluntaryWorkWhereUniqueInput[]
    delete?: VoluntaryWorkWhereUniqueInput | VoluntaryWorkWhereUniqueInput[]
    connect?: VoluntaryWorkWhereUniqueInput | VoluntaryWorkWhereUniqueInput[]
    update?: VoluntaryWorkUpdateWithWhereUniqueWithoutEmployeeInput | VoluntaryWorkUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: VoluntaryWorkUpdateManyWithWhereWithoutEmployeeInput | VoluntaryWorkUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: VoluntaryWorkScalarWhereInput | VoluntaryWorkScalarWhereInput[]
  }

  export type TrainingProgramUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<TrainingProgramCreateWithoutEmployeeInput, TrainingProgramUncheckedCreateWithoutEmployeeInput> | TrainingProgramCreateWithoutEmployeeInput[] | TrainingProgramUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: TrainingProgramCreateOrConnectWithoutEmployeeInput | TrainingProgramCreateOrConnectWithoutEmployeeInput[]
    upsert?: TrainingProgramUpsertWithWhereUniqueWithoutEmployeeInput | TrainingProgramUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: TrainingProgramCreateManyEmployeeInputEnvelope
    set?: TrainingProgramWhereUniqueInput | TrainingProgramWhereUniqueInput[]
    disconnect?: TrainingProgramWhereUniqueInput | TrainingProgramWhereUniqueInput[]
    delete?: TrainingProgramWhereUniqueInput | TrainingProgramWhereUniqueInput[]
    connect?: TrainingProgramWhereUniqueInput | TrainingProgramWhereUniqueInput[]
    update?: TrainingProgramUpdateWithWhereUniqueWithoutEmployeeInput | TrainingProgramUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: TrainingProgramUpdateManyWithWhereWithoutEmployeeInput | TrainingProgramUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: TrainingProgramScalarWhereInput | TrainingProgramScalarWhereInput[]
  }

  export type OtherInformationUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<OtherInformationCreateWithoutEmployeeInput, OtherInformationUncheckedCreateWithoutEmployeeInput> | OtherInformationCreateWithoutEmployeeInput[] | OtherInformationUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: OtherInformationCreateOrConnectWithoutEmployeeInput | OtherInformationCreateOrConnectWithoutEmployeeInput[]
    upsert?: OtherInformationUpsertWithWhereUniqueWithoutEmployeeInput | OtherInformationUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: OtherInformationCreateManyEmployeeInputEnvelope
    set?: OtherInformationWhereUniqueInput | OtherInformationWhereUniqueInput[]
    disconnect?: OtherInformationWhereUniqueInput | OtherInformationWhereUniqueInput[]
    delete?: OtherInformationWhereUniqueInput | OtherInformationWhereUniqueInput[]
    connect?: OtherInformationWhereUniqueInput | OtherInformationWhereUniqueInput[]
    update?: OtherInformationUpdateWithWhereUniqueWithoutEmployeeInput | OtherInformationUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: OtherInformationUpdateManyWithWhereWithoutEmployeeInput | OtherInformationUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: OtherInformationScalarWhereInput | OtherInformationScalarWhereInput[]
  }

  export type FamilyBackgroundUpdateOneWithoutEmployeeNestedInput = {
    create?: XOR<FamilyBackgroundCreateWithoutEmployeeInput, FamilyBackgroundUncheckedCreateWithoutEmployeeInput>
    connectOrCreate?: FamilyBackgroundCreateOrConnectWithoutEmployeeInput
    upsert?: FamilyBackgroundUpsertWithoutEmployeeInput
    disconnect?: FamilyBackgroundWhereInput | boolean
    delete?: FamilyBackgroundWhereInput | boolean
    connect?: FamilyBackgroundWhereUniqueInput
    update?: XOR<XOR<FamilyBackgroundUpdateToOneWithWhereWithoutEmployeeInput, FamilyBackgroundUpdateWithoutEmployeeInput>, FamilyBackgroundUncheckedUpdateWithoutEmployeeInput>
  }

  export type LeaveRecordUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<LeaveRecordCreateWithoutEmployeeInput, LeaveRecordUncheckedCreateWithoutEmployeeInput> | LeaveRecordCreateWithoutEmployeeInput[] | LeaveRecordUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: LeaveRecordCreateOrConnectWithoutEmployeeInput | LeaveRecordCreateOrConnectWithoutEmployeeInput[]
    upsert?: LeaveRecordUpsertWithWhereUniqueWithoutEmployeeInput | LeaveRecordUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: LeaveRecordCreateManyEmployeeInputEnvelope
    set?: LeaveRecordWhereUniqueInput | LeaveRecordWhereUniqueInput[]
    disconnect?: LeaveRecordWhereUniqueInput | LeaveRecordWhereUniqueInput[]
    delete?: LeaveRecordWhereUniqueInput | LeaveRecordWhereUniqueInput[]
    connect?: LeaveRecordWhereUniqueInput | LeaveRecordWhereUniqueInput[]
    update?: LeaveRecordUpdateWithWhereUniqueWithoutEmployeeInput | LeaveRecordUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: LeaveRecordUpdateManyWithWhereWithoutEmployeeInput | LeaveRecordUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: LeaveRecordScalarWhereInput | LeaveRecordScalarWhereInput[]
  }

  export type ChildRecordUncheckedUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<ChildRecordCreateWithoutEmployeeInput, ChildRecordUncheckedCreateWithoutEmployeeInput> | ChildRecordCreateWithoutEmployeeInput[] | ChildRecordUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: ChildRecordCreateOrConnectWithoutEmployeeInput | ChildRecordCreateOrConnectWithoutEmployeeInput[]
    upsert?: ChildRecordUpsertWithWhereUniqueWithoutEmployeeInput | ChildRecordUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: ChildRecordCreateManyEmployeeInputEnvelope
    set?: ChildRecordWhereUniqueInput | ChildRecordWhereUniqueInput[]
    disconnect?: ChildRecordWhereUniqueInput | ChildRecordWhereUniqueInput[]
    delete?: ChildRecordWhereUniqueInput | ChildRecordWhereUniqueInput[]
    connect?: ChildRecordWhereUniqueInput | ChildRecordWhereUniqueInput[]
    update?: ChildRecordUpdateWithWhereUniqueWithoutEmployeeInput | ChildRecordUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: ChildRecordUpdateManyWithWhereWithoutEmployeeInput | ChildRecordUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: ChildRecordScalarWhereInput | ChildRecordScalarWhereInput[]
  }

  export type EducationalBackgroundUncheckedUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<EducationalBackgroundCreateWithoutEmployeeInput, EducationalBackgroundUncheckedCreateWithoutEmployeeInput> | EducationalBackgroundCreateWithoutEmployeeInput[] | EducationalBackgroundUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: EducationalBackgroundCreateOrConnectWithoutEmployeeInput | EducationalBackgroundCreateOrConnectWithoutEmployeeInput[]
    upsert?: EducationalBackgroundUpsertWithWhereUniqueWithoutEmployeeInput | EducationalBackgroundUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: EducationalBackgroundCreateManyEmployeeInputEnvelope
    set?: EducationalBackgroundWhereUniqueInput | EducationalBackgroundWhereUniqueInput[]
    disconnect?: EducationalBackgroundWhereUniqueInput | EducationalBackgroundWhereUniqueInput[]
    delete?: EducationalBackgroundWhereUniqueInput | EducationalBackgroundWhereUniqueInput[]
    connect?: EducationalBackgroundWhereUniqueInput | EducationalBackgroundWhereUniqueInput[]
    update?: EducationalBackgroundUpdateWithWhereUniqueWithoutEmployeeInput | EducationalBackgroundUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: EducationalBackgroundUpdateManyWithWhereWithoutEmployeeInput | EducationalBackgroundUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: EducationalBackgroundScalarWhereInput | EducationalBackgroundScalarWhereInput[]
  }

  export type CivilServiceEligibilityUncheckedUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<CivilServiceEligibilityCreateWithoutEmployeeInput, CivilServiceEligibilityUncheckedCreateWithoutEmployeeInput> | CivilServiceEligibilityCreateWithoutEmployeeInput[] | CivilServiceEligibilityUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: CivilServiceEligibilityCreateOrConnectWithoutEmployeeInput | CivilServiceEligibilityCreateOrConnectWithoutEmployeeInput[]
    upsert?: CivilServiceEligibilityUpsertWithWhereUniqueWithoutEmployeeInput | CivilServiceEligibilityUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: CivilServiceEligibilityCreateManyEmployeeInputEnvelope
    set?: CivilServiceEligibilityWhereUniqueInput | CivilServiceEligibilityWhereUniqueInput[]
    disconnect?: CivilServiceEligibilityWhereUniqueInput | CivilServiceEligibilityWhereUniqueInput[]
    delete?: CivilServiceEligibilityWhereUniqueInput | CivilServiceEligibilityWhereUniqueInput[]
    connect?: CivilServiceEligibilityWhereUniqueInput | CivilServiceEligibilityWhereUniqueInput[]
    update?: CivilServiceEligibilityUpdateWithWhereUniqueWithoutEmployeeInput | CivilServiceEligibilityUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: CivilServiceEligibilityUpdateManyWithWhereWithoutEmployeeInput | CivilServiceEligibilityUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: CivilServiceEligibilityScalarWhereInput | CivilServiceEligibilityScalarWhereInput[]
  }

  export type WorkExperienceUncheckedUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<WorkExperienceCreateWithoutEmployeeInput, WorkExperienceUncheckedCreateWithoutEmployeeInput> | WorkExperienceCreateWithoutEmployeeInput[] | WorkExperienceUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: WorkExperienceCreateOrConnectWithoutEmployeeInput | WorkExperienceCreateOrConnectWithoutEmployeeInput[]
    upsert?: WorkExperienceUpsertWithWhereUniqueWithoutEmployeeInput | WorkExperienceUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: WorkExperienceCreateManyEmployeeInputEnvelope
    set?: WorkExperienceWhereUniqueInput | WorkExperienceWhereUniqueInput[]
    disconnect?: WorkExperienceWhereUniqueInput | WorkExperienceWhereUniqueInput[]
    delete?: WorkExperienceWhereUniqueInput | WorkExperienceWhereUniqueInput[]
    connect?: WorkExperienceWhereUniqueInput | WorkExperienceWhereUniqueInput[]
    update?: WorkExperienceUpdateWithWhereUniqueWithoutEmployeeInput | WorkExperienceUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: WorkExperienceUpdateManyWithWhereWithoutEmployeeInput | WorkExperienceUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: WorkExperienceScalarWhereInput | WorkExperienceScalarWhereInput[]
  }

  export type VoluntaryWorkUncheckedUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<VoluntaryWorkCreateWithoutEmployeeInput, VoluntaryWorkUncheckedCreateWithoutEmployeeInput> | VoluntaryWorkCreateWithoutEmployeeInput[] | VoluntaryWorkUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: VoluntaryWorkCreateOrConnectWithoutEmployeeInput | VoluntaryWorkCreateOrConnectWithoutEmployeeInput[]
    upsert?: VoluntaryWorkUpsertWithWhereUniqueWithoutEmployeeInput | VoluntaryWorkUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: VoluntaryWorkCreateManyEmployeeInputEnvelope
    set?: VoluntaryWorkWhereUniqueInput | VoluntaryWorkWhereUniqueInput[]
    disconnect?: VoluntaryWorkWhereUniqueInput | VoluntaryWorkWhereUniqueInput[]
    delete?: VoluntaryWorkWhereUniqueInput | VoluntaryWorkWhereUniqueInput[]
    connect?: VoluntaryWorkWhereUniqueInput | VoluntaryWorkWhereUniqueInput[]
    update?: VoluntaryWorkUpdateWithWhereUniqueWithoutEmployeeInput | VoluntaryWorkUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: VoluntaryWorkUpdateManyWithWhereWithoutEmployeeInput | VoluntaryWorkUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: VoluntaryWorkScalarWhereInput | VoluntaryWorkScalarWhereInput[]
  }

  export type TrainingProgramUncheckedUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<TrainingProgramCreateWithoutEmployeeInput, TrainingProgramUncheckedCreateWithoutEmployeeInput> | TrainingProgramCreateWithoutEmployeeInput[] | TrainingProgramUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: TrainingProgramCreateOrConnectWithoutEmployeeInput | TrainingProgramCreateOrConnectWithoutEmployeeInput[]
    upsert?: TrainingProgramUpsertWithWhereUniqueWithoutEmployeeInput | TrainingProgramUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: TrainingProgramCreateManyEmployeeInputEnvelope
    set?: TrainingProgramWhereUniqueInput | TrainingProgramWhereUniqueInput[]
    disconnect?: TrainingProgramWhereUniqueInput | TrainingProgramWhereUniqueInput[]
    delete?: TrainingProgramWhereUniqueInput | TrainingProgramWhereUniqueInput[]
    connect?: TrainingProgramWhereUniqueInput | TrainingProgramWhereUniqueInput[]
    update?: TrainingProgramUpdateWithWhereUniqueWithoutEmployeeInput | TrainingProgramUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: TrainingProgramUpdateManyWithWhereWithoutEmployeeInput | TrainingProgramUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: TrainingProgramScalarWhereInput | TrainingProgramScalarWhereInput[]
  }

  export type OtherInformationUncheckedUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<OtherInformationCreateWithoutEmployeeInput, OtherInformationUncheckedCreateWithoutEmployeeInput> | OtherInformationCreateWithoutEmployeeInput[] | OtherInformationUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: OtherInformationCreateOrConnectWithoutEmployeeInput | OtherInformationCreateOrConnectWithoutEmployeeInput[]
    upsert?: OtherInformationUpsertWithWhereUniqueWithoutEmployeeInput | OtherInformationUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: OtherInformationCreateManyEmployeeInputEnvelope
    set?: OtherInformationWhereUniqueInput | OtherInformationWhereUniqueInput[]
    disconnect?: OtherInformationWhereUniqueInput | OtherInformationWhereUniqueInput[]
    delete?: OtherInformationWhereUniqueInput | OtherInformationWhereUniqueInput[]
    connect?: OtherInformationWhereUniqueInput | OtherInformationWhereUniqueInput[]
    update?: OtherInformationUpdateWithWhereUniqueWithoutEmployeeInput | OtherInformationUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: OtherInformationUpdateManyWithWhereWithoutEmployeeInput | OtherInformationUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: OtherInformationScalarWhereInput | OtherInformationScalarWhereInput[]
  }

  export type FamilyBackgroundUncheckedUpdateOneWithoutEmployeeNestedInput = {
    create?: XOR<FamilyBackgroundCreateWithoutEmployeeInput, FamilyBackgroundUncheckedCreateWithoutEmployeeInput>
    connectOrCreate?: FamilyBackgroundCreateOrConnectWithoutEmployeeInput
    upsert?: FamilyBackgroundUpsertWithoutEmployeeInput
    disconnect?: FamilyBackgroundWhereInput | boolean
    delete?: FamilyBackgroundWhereInput | boolean
    connect?: FamilyBackgroundWhereUniqueInput
    update?: XOR<XOR<FamilyBackgroundUpdateToOneWithWhereWithoutEmployeeInput, FamilyBackgroundUpdateWithoutEmployeeInput>, FamilyBackgroundUncheckedUpdateWithoutEmployeeInput>
  }

  export type LeaveRecordUncheckedUpdateManyWithoutEmployeeNestedInput = {
    create?: XOR<LeaveRecordCreateWithoutEmployeeInput, LeaveRecordUncheckedCreateWithoutEmployeeInput> | LeaveRecordCreateWithoutEmployeeInput[] | LeaveRecordUncheckedCreateWithoutEmployeeInput[]
    connectOrCreate?: LeaveRecordCreateOrConnectWithoutEmployeeInput | LeaveRecordCreateOrConnectWithoutEmployeeInput[]
    upsert?: LeaveRecordUpsertWithWhereUniqueWithoutEmployeeInput | LeaveRecordUpsertWithWhereUniqueWithoutEmployeeInput[]
    createMany?: LeaveRecordCreateManyEmployeeInputEnvelope
    set?: LeaveRecordWhereUniqueInput | LeaveRecordWhereUniqueInput[]
    disconnect?: LeaveRecordWhereUniqueInput | LeaveRecordWhereUniqueInput[]
    delete?: LeaveRecordWhereUniqueInput | LeaveRecordWhereUniqueInput[]
    connect?: LeaveRecordWhereUniqueInput | LeaveRecordWhereUniqueInput[]
    update?: LeaveRecordUpdateWithWhereUniqueWithoutEmployeeInput | LeaveRecordUpdateWithWhereUniqueWithoutEmployeeInput[]
    updateMany?: LeaveRecordUpdateManyWithWhereWithoutEmployeeInput | LeaveRecordUpdateManyWithWhereWithoutEmployeeInput[]
    deleteMany?: LeaveRecordScalarWhereInput | LeaveRecordScalarWhereInput[]
  }

  export type EmployeeCreateNestedOneWithoutFamilyInput = {
    create?: XOR<EmployeeCreateWithoutFamilyInput, EmployeeUncheckedCreateWithoutFamilyInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutFamilyInput
    connect?: EmployeeWhereUniqueInput
  }

  export type EmployeeUpdateOneRequiredWithoutFamilyNestedInput = {
    create?: XOR<EmployeeCreateWithoutFamilyInput, EmployeeUncheckedCreateWithoutFamilyInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutFamilyInput
    upsert?: EmployeeUpsertWithoutFamilyInput
    connect?: EmployeeWhereUniqueInput
    update?: XOR<XOR<EmployeeUpdateToOneWithWhereWithoutFamilyInput, EmployeeUpdateWithoutFamilyInput>, EmployeeUncheckedUpdateWithoutFamilyInput>
  }

  export type EmployeeCreateNestedOneWithoutChildrenInput = {
    create?: XOR<EmployeeCreateWithoutChildrenInput, EmployeeUncheckedCreateWithoutChildrenInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutChildrenInput
    connect?: EmployeeWhereUniqueInput
  }

  export type EmployeeUpdateOneRequiredWithoutChildrenNestedInput = {
    create?: XOR<EmployeeCreateWithoutChildrenInput, EmployeeUncheckedCreateWithoutChildrenInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutChildrenInput
    upsert?: EmployeeUpsertWithoutChildrenInput
    connect?: EmployeeWhereUniqueInput
    update?: XOR<XOR<EmployeeUpdateToOneWithWhereWithoutChildrenInput, EmployeeUpdateWithoutChildrenInput>, EmployeeUncheckedUpdateWithoutChildrenInput>
  }

  export type EmployeeCreateNestedOneWithoutEducationInput = {
    create?: XOR<EmployeeCreateWithoutEducationInput, EmployeeUncheckedCreateWithoutEducationInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutEducationInput
    connect?: EmployeeWhereUniqueInput
  }

  export type EmployeeUpdateOneRequiredWithoutEducationNestedInput = {
    create?: XOR<EmployeeCreateWithoutEducationInput, EmployeeUncheckedCreateWithoutEducationInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutEducationInput
    upsert?: EmployeeUpsertWithoutEducationInput
    connect?: EmployeeWhereUniqueInput
    update?: XOR<XOR<EmployeeUpdateToOneWithWhereWithoutEducationInput, EmployeeUpdateWithoutEducationInput>, EmployeeUncheckedUpdateWithoutEducationInput>
  }

  export type EmployeeCreateNestedOneWithoutCivilServiceInput = {
    create?: XOR<EmployeeCreateWithoutCivilServiceInput, EmployeeUncheckedCreateWithoutCivilServiceInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutCivilServiceInput
    connect?: EmployeeWhereUniqueInput
  }

  export type EmployeeUpdateOneRequiredWithoutCivilServiceNestedInput = {
    create?: XOR<EmployeeCreateWithoutCivilServiceInput, EmployeeUncheckedCreateWithoutCivilServiceInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutCivilServiceInput
    upsert?: EmployeeUpsertWithoutCivilServiceInput
    connect?: EmployeeWhereUniqueInput
    update?: XOR<XOR<EmployeeUpdateToOneWithWhereWithoutCivilServiceInput, EmployeeUpdateWithoutCivilServiceInput>, EmployeeUncheckedUpdateWithoutCivilServiceInput>
  }

  export type EmployeeCreateNestedOneWithoutWorkExperienceInput = {
    create?: XOR<EmployeeCreateWithoutWorkExperienceInput, EmployeeUncheckedCreateWithoutWorkExperienceInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutWorkExperienceInput
    connect?: EmployeeWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type EmployeeUpdateOneRequiredWithoutWorkExperienceNestedInput = {
    create?: XOR<EmployeeCreateWithoutWorkExperienceInput, EmployeeUncheckedCreateWithoutWorkExperienceInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutWorkExperienceInput
    upsert?: EmployeeUpsertWithoutWorkExperienceInput
    connect?: EmployeeWhereUniqueInput
    update?: XOR<XOR<EmployeeUpdateToOneWithWhereWithoutWorkExperienceInput, EmployeeUpdateWithoutWorkExperienceInput>, EmployeeUncheckedUpdateWithoutWorkExperienceInput>
  }

  export type EmployeeCreateNestedOneWithoutVoluntaryWorkInput = {
    create?: XOR<EmployeeCreateWithoutVoluntaryWorkInput, EmployeeUncheckedCreateWithoutVoluntaryWorkInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutVoluntaryWorkInput
    connect?: EmployeeWhereUniqueInput
  }

  export type EmployeeUpdateOneRequiredWithoutVoluntaryWorkNestedInput = {
    create?: XOR<EmployeeCreateWithoutVoluntaryWorkInput, EmployeeUncheckedCreateWithoutVoluntaryWorkInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutVoluntaryWorkInput
    upsert?: EmployeeUpsertWithoutVoluntaryWorkInput
    connect?: EmployeeWhereUniqueInput
    update?: XOR<XOR<EmployeeUpdateToOneWithWhereWithoutVoluntaryWorkInput, EmployeeUpdateWithoutVoluntaryWorkInput>, EmployeeUncheckedUpdateWithoutVoluntaryWorkInput>
  }

  export type EmployeeCreateNestedOneWithoutTrainingInput = {
    create?: XOR<EmployeeCreateWithoutTrainingInput, EmployeeUncheckedCreateWithoutTrainingInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutTrainingInput
    connect?: EmployeeWhereUniqueInput
  }

  export type EmployeeUpdateOneRequiredWithoutTrainingNestedInput = {
    create?: XOR<EmployeeCreateWithoutTrainingInput, EmployeeUncheckedCreateWithoutTrainingInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutTrainingInput
    upsert?: EmployeeUpsertWithoutTrainingInput
    connect?: EmployeeWhereUniqueInput
    update?: XOR<XOR<EmployeeUpdateToOneWithWhereWithoutTrainingInput, EmployeeUpdateWithoutTrainingInput>, EmployeeUncheckedUpdateWithoutTrainingInput>
  }

  export type EmployeeCreateNestedOneWithoutSkillsInput = {
    create?: XOR<EmployeeCreateWithoutSkillsInput, EmployeeUncheckedCreateWithoutSkillsInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutSkillsInput
    connect?: EmployeeWhereUniqueInput
  }

  export type EmployeeUpdateOneRequiredWithoutSkillsNestedInput = {
    create?: XOR<EmployeeCreateWithoutSkillsInput, EmployeeUncheckedCreateWithoutSkillsInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutSkillsInput
    upsert?: EmployeeUpsertWithoutSkillsInput
    connect?: EmployeeWhereUniqueInput
    update?: XOR<XOR<EmployeeUpdateToOneWithWhereWithoutSkillsInput, EmployeeUpdateWithoutSkillsInput>, EmployeeUncheckedUpdateWithoutSkillsInput>
  }

  export type EmployeeCreateNestedOneWithoutLeavesInput = {
    create?: XOR<EmployeeCreateWithoutLeavesInput, EmployeeUncheckedCreateWithoutLeavesInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutLeavesInput
    connect?: EmployeeWhereUniqueInput
  }

  export type EmployeeUpdateOneRequiredWithoutLeavesNestedInput = {
    create?: XOR<EmployeeCreateWithoutLeavesInput, EmployeeUncheckedCreateWithoutLeavesInput>
    connectOrCreate?: EmployeeCreateOrConnectWithoutLeavesInput
    upsert?: EmployeeUpsertWithoutLeavesInput
    connect?: EmployeeWhereUniqueInput
    update?: XOR<XOR<EmployeeUpdateToOneWithWhereWithoutLeavesInput, EmployeeUpdateWithoutLeavesInput>, EmployeeUncheckedUpdateWithoutLeavesInput>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type EmployeeCreateWithoutDepartmentInput = {
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    position: PositionCreateNestedOneWithoutEmployeesInput
    children?: ChildRecordCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeUncheckedCreateWithoutDepartmentInput = {
    id?: number
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    positionId: number
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: ChildRecordUncheckedCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundUncheckedCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityUncheckedCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceUncheckedCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkUncheckedCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramUncheckedCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationUncheckedCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundUncheckedCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordUncheckedCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeCreateOrConnectWithoutDepartmentInput = {
    where: EmployeeWhereUniqueInput
    create: XOR<EmployeeCreateWithoutDepartmentInput, EmployeeUncheckedCreateWithoutDepartmentInput>
  }

  export type EmployeeCreateManyDepartmentInputEnvelope = {
    data: EmployeeCreateManyDepartmentInput | EmployeeCreateManyDepartmentInput[]
    skipDuplicates?: boolean
  }

  export type EmployeeUpsertWithWhereUniqueWithoutDepartmentInput = {
    where: EmployeeWhereUniqueInput
    update: XOR<EmployeeUpdateWithoutDepartmentInput, EmployeeUncheckedUpdateWithoutDepartmentInput>
    create: XOR<EmployeeCreateWithoutDepartmentInput, EmployeeUncheckedCreateWithoutDepartmentInput>
  }

  export type EmployeeUpdateWithWhereUniqueWithoutDepartmentInput = {
    where: EmployeeWhereUniqueInput
    data: XOR<EmployeeUpdateWithoutDepartmentInput, EmployeeUncheckedUpdateWithoutDepartmentInput>
  }

  export type EmployeeUpdateManyWithWhereWithoutDepartmentInput = {
    where: EmployeeScalarWhereInput
    data: XOR<EmployeeUpdateManyMutationInput, EmployeeUncheckedUpdateManyWithoutDepartmentInput>
  }

  export type EmployeeScalarWhereInput = {
    AND?: EmployeeScalarWhereInput | EmployeeScalarWhereInput[]
    OR?: EmployeeScalarWhereInput[]
    NOT?: EmployeeScalarWhereInput | EmployeeScalarWhereInput[]
    id?: IntFilter<"Employee"> | number
    firstName?: StringFilter<"Employee"> | string
    lastName?: StringFilter<"Employee"> | string
    middleName?: StringNullableFilter<"Employee"> | string | null
    nameExtension?: StringNullableFilter<"Employee"> | string | null
    dateOfBirth?: DateTimeFilter<"Employee"> | Date | string
    placeOfBirth?: StringFilter<"Employee"> | string
    sex?: StringFilter<"Employee"> | string
    civilStatus?: StringFilter<"Employee"> | string
    height?: FloatNullableFilter<"Employee"> | number | null
    weight?: FloatNullableFilter<"Employee"> | number | null
    bloodType?: StringNullableFilter<"Employee"> | string | null
    gsisNo?: StringNullableFilter<"Employee"> | string | null
    pagibigNo?: StringNullableFilter<"Employee"> | string | null
    philhealthNo?: StringNullableFilter<"Employee"> | string | null
    sssNo?: StringNullableFilter<"Employee"> | string | null
    tinNo?: StringNullableFilter<"Employee"> | string | null
    agencyEmployeeNo?: StringNullableFilter<"Employee"> | string | null
    citizenship?: StringFilter<"Employee"> | string
    residentialAddress?: StringFilter<"Employee"> | string
    permanentAddress?: StringFilter<"Employee"> | string
    telephoneNo?: StringNullableFilter<"Employee"> | string | null
    mobileNo?: StringNullableFilter<"Employee"> | string | null
    email?: StringNullableFilter<"Employee"> | string | null
    departmentId?: IntFilter<"Employee"> | number
    positionId?: IntFilter<"Employee"> | number
    status?: StringFilter<"Employee"> | string
    dateHired?: DateTimeNullableFilter<"Employee"> | Date | string | null
    createdAt?: DateTimeFilter<"Employee"> | Date | string
    updatedAt?: DateTimeFilter<"Employee"> | Date | string
  }

  export type EmployeeCreateWithoutPositionInput = {
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    department: DepartmentCreateNestedOneWithoutEmployeesInput
    children?: ChildRecordCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeUncheckedCreateWithoutPositionInput = {
    id?: number
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    departmentId: number
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: ChildRecordUncheckedCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundUncheckedCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityUncheckedCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceUncheckedCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkUncheckedCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramUncheckedCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationUncheckedCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundUncheckedCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordUncheckedCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeCreateOrConnectWithoutPositionInput = {
    where: EmployeeWhereUniqueInput
    create: XOR<EmployeeCreateWithoutPositionInput, EmployeeUncheckedCreateWithoutPositionInput>
  }

  export type EmployeeCreateManyPositionInputEnvelope = {
    data: EmployeeCreateManyPositionInput | EmployeeCreateManyPositionInput[]
    skipDuplicates?: boolean
  }

  export type EmployeeUpsertWithWhereUniqueWithoutPositionInput = {
    where: EmployeeWhereUniqueInput
    update: XOR<EmployeeUpdateWithoutPositionInput, EmployeeUncheckedUpdateWithoutPositionInput>
    create: XOR<EmployeeCreateWithoutPositionInput, EmployeeUncheckedCreateWithoutPositionInput>
  }

  export type EmployeeUpdateWithWhereUniqueWithoutPositionInput = {
    where: EmployeeWhereUniqueInput
    data: XOR<EmployeeUpdateWithoutPositionInput, EmployeeUncheckedUpdateWithoutPositionInput>
  }

  export type EmployeeUpdateManyWithWhereWithoutPositionInput = {
    where: EmployeeScalarWhereInput
    data: XOR<EmployeeUpdateManyMutationInput, EmployeeUncheckedUpdateManyWithoutPositionInput>
  }

  export type DepartmentCreateWithoutEmployeesInput = {
    name: string
  }

  export type DepartmentUncheckedCreateWithoutEmployeesInput = {
    id?: number
    name: string
  }

  export type DepartmentCreateOrConnectWithoutEmployeesInput = {
    where: DepartmentWhereUniqueInput
    create: XOR<DepartmentCreateWithoutEmployeesInput, DepartmentUncheckedCreateWithoutEmployeesInput>
  }

  export type PositionCreateWithoutEmployeesInput = {
    title: string
  }

  export type PositionUncheckedCreateWithoutEmployeesInput = {
    id?: number
    title: string
  }

  export type PositionCreateOrConnectWithoutEmployeesInput = {
    where: PositionWhereUniqueInput
    create: XOR<PositionCreateWithoutEmployeesInput, PositionUncheckedCreateWithoutEmployeesInput>
  }

  export type ChildRecordCreateWithoutEmployeeInput = {
    name: string
    dateOfBirth: Date | string
  }

  export type ChildRecordUncheckedCreateWithoutEmployeeInput = {
    id?: number
    name: string
    dateOfBirth: Date | string
  }

  export type ChildRecordCreateOrConnectWithoutEmployeeInput = {
    where: ChildRecordWhereUniqueInput
    create: XOR<ChildRecordCreateWithoutEmployeeInput, ChildRecordUncheckedCreateWithoutEmployeeInput>
  }

  export type ChildRecordCreateManyEmployeeInputEnvelope = {
    data: ChildRecordCreateManyEmployeeInput | ChildRecordCreateManyEmployeeInput[]
    skipDuplicates?: boolean
  }

  export type EducationalBackgroundCreateWithoutEmployeeInput = {
    level: string
    schoolName: string
    degreeCourse?: string | null
    yearGraduated?: string | null
    highestLevelEarned?: string | null
    dateFrom?: Date | string | null
    dateTo?: Date | string | null
    scholarships?: string | null
  }

  export type EducationalBackgroundUncheckedCreateWithoutEmployeeInput = {
    id?: number
    level: string
    schoolName: string
    degreeCourse?: string | null
    yearGraduated?: string | null
    highestLevelEarned?: string | null
    dateFrom?: Date | string | null
    dateTo?: Date | string | null
    scholarships?: string | null
  }

  export type EducationalBackgroundCreateOrConnectWithoutEmployeeInput = {
    where: EducationalBackgroundWhereUniqueInput
    create: XOR<EducationalBackgroundCreateWithoutEmployeeInput, EducationalBackgroundUncheckedCreateWithoutEmployeeInput>
  }

  export type EducationalBackgroundCreateManyEmployeeInputEnvelope = {
    data: EducationalBackgroundCreateManyEmployeeInput | EducationalBackgroundCreateManyEmployeeInput[]
    skipDuplicates?: boolean
  }

  export type CivilServiceEligibilityCreateWithoutEmployeeInput = {
    careerService: string
    rating?: number | null
    dateOfExamination?: Date | string | null
    placeOfExamination?: string | null
    licenseNo?: string | null
    licenseValidity?: Date | string | null
  }

  export type CivilServiceEligibilityUncheckedCreateWithoutEmployeeInput = {
    id?: number
    careerService: string
    rating?: number | null
    dateOfExamination?: Date | string | null
    placeOfExamination?: string | null
    licenseNo?: string | null
    licenseValidity?: Date | string | null
  }

  export type CivilServiceEligibilityCreateOrConnectWithoutEmployeeInput = {
    where: CivilServiceEligibilityWhereUniqueInput
    create: XOR<CivilServiceEligibilityCreateWithoutEmployeeInput, CivilServiceEligibilityUncheckedCreateWithoutEmployeeInput>
  }

  export type CivilServiceEligibilityCreateManyEmployeeInputEnvelope = {
    data: CivilServiceEligibilityCreateManyEmployeeInput | CivilServiceEligibilityCreateManyEmployeeInput[]
    skipDuplicates?: boolean
  }

  export type WorkExperienceCreateWithoutEmployeeInput = {
    dateFrom: Date | string
    dateTo?: Date | string | null
    positionTitle: string
    departmentAgencyCompany: string
    monthlySalary?: number | null
    salaryGrade?: string | null
    statusOfAppointment?: string | null
    isGovService?: boolean
  }

  export type WorkExperienceUncheckedCreateWithoutEmployeeInput = {
    id?: number
    dateFrom: Date | string
    dateTo?: Date | string | null
    positionTitle: string
    departmentAgencyCompany: string
    monthlySalary?: number | null
    salaryGrade?: string | null
    statusOfAppointment?: string | null
    isGovService?: boolean
  }

  export type WorkExperienceCreateOrConnectWithoutEmployeeInput = {
    where: WorkExperienceWhereUniqueInput
    create: XOR<WorkExperienceCreateWithoutEmployeeInput, WorkExperienceUncheckedCreateWithoutEmployeeInput>
  }

  export type WorkExperienceCreateManyEmployeeInputEnvelope = {
    data: WorkExperienceCreateManyEmployeeInput | WorkExperienceCreateManyEmployeeInput[]
    skipDuplicates?: boolean
  }

  export type VoluntaryWorkCreateWithoutEmployeeInput = {
    organizationName: string
    organizationAddress?: string | null
    dateFrom: Date | string
    dateTo?: Date | string | null
    numberOfHours?: number | null
    positionNature: string
  }

  export type VoluntaryWorkUncheckedCreateWithoutEmployeeInput = {
    id?: number
    organizationName: string
    organizationAddress?: string | null
    dateFrom: Date | string
    dateTo?: Date | string | null
    numberOfHours?: number | null
    positionNature: string
  }

  export type VoluntaryWorkCreateOrConnectWithoutEmployeeInput = {
    where: VoluntaryWorkWhereUniqueInput
    create: XOR<VoluntaryWorkCreateWithoutEmployeeInput, VoluntaryWorkUncheckedCreateWithoutEmployeeInput>
  }

  export type VoluntaryWorkCreateManyEmployeeInputEnvelope = {
    data: VoluntaryWorkCreateManyEmployeeInput | VoluntaryWorkCreateManyEmployeeInput[]
    skipDuplicates?: boolean
  }

  export type TrainingProgramCreateWithoutEmployeeInput = {
    titleOfLearning: string
    dateFrom: Date | string
    dateTo?: Date | string | null
    numberOfHours?: number | null
    typeOfId?: string | null
    sponsoredBy?: string | null
  }

  export type TrainingProgramUncheckedCreateWithoutEmployeeInput = {
    id?: number
    titleOfLearning: string
    dateFrom: Date | string
    dateTo?: Date | string | null
    numberOfHours?: number | null
    typeOfId?: string | null
    sponsoredBy?: string | null
  }

  export type TrainingProgramCreateOrConnectWithoutEmployeeInput = {
    where: TrainingProgramWhereUniqueInput
    create: XOR<TrainingProgramCreateWithoutEmployeeInput, TrainingProgramUncheckedCreateWithoutEmployeeInput>
  }

  export type TrainingProgramCreateManyEmployeeInputEnvelope = {
    data: TrainingProgramCreateManyEmployeeInput | TrainingProgramCreateManyEmployeeInput[]
    skipDuplicates?: boolean
  }

  export type OtherInformationCreateWithoutEmployeeInput = {
    specialSkills?: string | null
    nonAcademicDistinctions?: string | null
    membershipInAssoc?: string | null
  }

  export type OtherInformationUncheckedCreateWithoutEmployeeInput = {
    id?: number
    specialSkills?: string | null
    nonAcademicDistinctions?: string | null
    membershipInAssoc?: string | null
  }

  export type OtherInformationCreateOrConnectWithoutEmployeeInput = {
    where: OtherInformationWhereUniqueInput
    create: XOR<OtherInformationCreateWithoutEmployeeInput, OtherInformationUncheckedCreateWithoutEmployeeInput>
  }

  export type OtherInformationCreateManyEmployeeInputEnvelope = {
    data: OtherInformationCreateManyEmployeeInput | OtherInformationCreateManyEmployeeInput[]
    skipDuplicates?: boolean
  }

  export type FamilyBackgroundCreateWithoutEmployeeInput = {
    spouseFirstName?: string | null
    spouseLastName?: string | null
    spouseMiddleName?: string | null
    spouseOccupation?: string | null
    spouseEmployer?: string | null
    spouseBusinessAddress?: string | null
    spouseTelephone?: string | null
    fatherFirstName: string
    fatherLastName: string
    fatherMiddleName?: string | null
    motherMaidenFirst: string
    motherMaidenLast: string
    motherMaidenMiddle?: string | null
  }

  export type FamilyBackgroundUncheckedCreateWithoutEmployeeInput = {
    id?: number
    spouseFirstName?: string | null
    spouseLastName?: string | null
    spouseMiddleName?: string | null
    spouseOccupation?: string | null
    spouseEmployer?: string | null
    spouseBusinessAddress?: string | null
    spouseTelephone?: string | null
    fatherFirstName: string
    fatherLastName: string
    fatherMiddleName?: string | null
    motherMaidenFirst: string
    motherMaidenLast: string
    motherMaidenMiddle?: string | null
  }

  export type FamilyBackgroundCreateOrConnectWithoutEmployeeInput = {
    where: FamilyBackgroundWhereUniqueInput
    create: XOR<FamilyBackgroundCreateWithoutEmployeeInput, FamilyBackgroundUncheckedCreateWithoutEmployeeInput>
  }

  export type LeaveRecordCreateWithoutEmployeeInput = {
    type: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    reason?: string | null
    createdAt?: Date | string
  }

  export type LeaveRecordUncheckedCreateWithoutEmployeeInput = {
    id?: number
    type: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    reason?: string | null
    createdAt?: Date | string
  }

  export type LeaveRecordCreateOrConnectWithoutEmployeeInput = {
    where: LeaveRecordWhereUniqueInput
    create: XOR<LeaveRecordCreateWithoutEmployeeInput, LeaveRecordUncheckedCreateWithoutEmployeeInput>
  }

  export type LeaveRecordCreateManyEmployeeInputEnvelope = {
    data: LeaveRecordCreateManyEmployeeInput | LeaveRecordCreateManyEmployeeInput[]
    skipDuplicates?: boolean
  }

  export type DepartmentUpsertWithoutEmployeesInput = {
    update: XOR<DepartmentUpdateWithoutEmployeesInput, DepartmentUncheckedUpdateWithoutEmployeesInput>
    create: XOR<DepartmentCreateWithoutEmployeesInput, DepartmentUncheckedCreateWithoutEmployeesInput>
    where?: DepartmentWhereInput
  }

  export type DepartmentUpdateToOneWithWhereWithoutEmployeesInput = {
    where?: DepartmentWhereInput
    data: XOR<DepartmentUpdateWithoutEmployeesInput, DepartmentUncheckedUpdateWithoutEmployeesInput>
  }

  export type DepartmentUpdateWithoutEmployeesInput = {
    name?: StringFieldUpdateOperationsInput | string
  }

  export type DepartmentUncheckedUpdateWithoutEmployeesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
  }

  export type PositionUpsertWithoutEmployeesInput = {
    update: XOR<PositionUpdateWithoutEmployeesInput, PositionUncheckedUpdateWithoutEmployeesInput>
    create: XOR<PositionCreateWithoutEmployeesInput, PositionUncheckedCreateWithoutEmployeesInput>
    where?: PositionWhereInput
  }

  export type PositionUpdateToOneWithWhereWithoutEmployeesInput = {
    where?: PositionWhereInput
    data: XOR<PositionUpdateWithoutEmployeesInput, PositionUncheckedUpdateWithoutEmployeesInput>
  }

  export type PositionUpdateWithoutEmployeesInput = {
    title?: StringFieldUpdateOperationsInput | string
  }

  export type PositionUncheckedUpdateWithoutEmployeesInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
  }

  export type ChildRecordUpsertWithWhereUniqueWithoutEmployeeInput = {
    where: ChildRecordWhereUniqueInput
    update: XOR<ChildRecordUpdateWithoutEmployeeInput, ChildRecordUncheckedUpdateWithoutEmployeeInput>
    create: XOR<ChildRecordCreateWithoutEmployeeInput, ChildRecordUncheckedCreateWithoutEmployeeInput>
  }

  export type ChildRecordUpdateWithWhereUniqueWithoutEmployeeInput = {
    where: ChildRecordWhereUniqueInput
    data: XOR<ChildRecordUpdateWithoutEmployeeInput, ChildRecordUncheckedUpdateWithoutEmployeeInput>
  }

  export type ChildRecordUpdateManyWithWhereWithoutEmployeeInput = {
    where: ChildRecordScalarWhereInput
    data: XOR<ChildRecordUpdateManyMutationInput, ChildRecordUncheckedUpdateManyWithoutEmployeeInput>
  }

  export type ChildRecordScalarWhereInput = {
    AND?: ChildRecordScalarWhereInput | ChildRecordScalarWhereInput[]
    OR?: ChildRecordScalarWhereInput[]
    NOT?: ChildRecordScalarWhereInput | ChildRecordScalarWhereInput[]
    id?: IntFilter<"ChildRecord"> | number
    employeeId?: IntFilter<"ChildRecord"> | number
    name?: StringFilter<"ChildRecord"> | string
    dateOfBirth?: DateTimeFilter<"ChildRecord"> | Date | string
  }

  export type EducationalBackgroundUpsertWithWhereUniqueWithoutEmployeeInput = {
    where: EducationalBackgroundWhereUniqueInput
    update: XOR<EducationalBackgroundUpdateWithoutEmployeeInput, EducationalBackgroundUncheckedUpdateWithoutEmployeeInput>
    create: XOR<EducationalBackgroundCreateWithoutEmployeeInput, EducationalBackgroundUncheckedCreateWithoutEmployeeInput>
  }

  export type EducationalBackgroundUpdateWithWhereUniqueWithoutEmployeeInput = {
    where: EducationalBackgroundWhereUniqueInput
    data: XOR<EducationalBackgroundUpdateWithoutEmployeeInput, EducationalBackgroundUncheckedUpdateWithoutEmployeeInput>
  }

  export type EducationalBackgroundUpdateManyWithWhereWithoutEmployeeInput = {
    where: EducationalBackgroundScalarWhereInput
    data: XOR<EducationalBackgroundUpdateManyMutationInput, EducationalBackgroundUncheckedUpdateManyWithoutEmployeeInput>
  }

  export type EducationalBackgroundScalarWhereInput = {
    AND?: EducationalBackgroundScalarWhereInput | EducationalBackgroundScalarWhereInput[]
    OR?: EducationalBackgroundScalarWhereInput[]
    NOT?: EducationalBackgroundScalarWhereInput | EducationalBackgroundScalarWhereInput[]
    id?: IntFilter<"EducationalBackground"> | number
    employeeId?: IntFilter<"EducationalBackground"> | number
    level?: StringFilter<"EducationalBackground"> | string
    schoolName?: StringFilter<"EducationalBackground"> | string
    degreeCourse?: StringNullableFilter<"EducationalBackground"> | string | null
    yearGraduated?: StringNullableFilter<"EducationalBackground"> | string | null
    highestLevelEarned?: StringNullableFilter<"EducationalBackground"> | string | null
    dateFrom?: DateTimeNullableFilter<"EducationalBackground"> | Date | string | null
    dateTo?: DateTimeNullableFilter<"EducationalBackground"> | Date | string | null
    scholarships?: StringNullableFilter<"EducationalBackground"> | string | null
  }

  export type CivilServiceEligibilityUpsertWithWhereUniqueWithoutEmployeeInput = {
    where: CivilServiceEligibilityWhereUniqueInput
    update: XOR<CivilServiceEligibilityUpdateWithoutEmployeeInput, CivilServiceEligibilityUncheckedUpdateWithoutEmployeeInput>
    create: XOR<CivilServiceEligibilityCreateWithoutEmployeeInput, CivilServiceEligibilityUncheckedCreateWithoutEmployeeInput>
  }

  export type CivilServiceEligibilityUpdateWithWhereUniqueWithoutEmployeeInput = {
    where: CivilServiceEligibilityWhereUniqueInput
    data: XOR<CivilServiceEligibilityUpdateWithoutEmployeeInput, CivilServiceEligibilityUncheckedUpdateWithoutEmployeeInput>
  }

  export type CivilServiceEligibilityUpdateManyWithWhereWithoutEmployeeInput = {
    where: CivilServiceEligibilityScalarWhereInput
    data: XOR<CivilServiceEligibilityUpdateManyMutationInput, CivilServiceEligibilityUncheckedUpdateManyWithoutEmployeeInput>
  }

  export type CivilServiceEligibilityScalarWhereInput = {
    AND?: CivilServiceEligibilityScalarWhereInput | CivilServiceEligibilityScalarWhereInput[]
    OR?: CivilServiceEligibilityScalarWhereInput[]
    NOT?: CivilServiceEligibilityScalarWhereInput | CivilServiceEligibilityScalarWhereInput[]
    id?: IntFilter<"CivilServiceEligibility"> | number
    employeeId?: IntFilter<"CivilServiceEligibility"> | number
    careerService?: StringFilter<"CivilServiceEligibility"> | string
    rating?: FloatNullableFilter<"CivilServiceEligibility"> | number | null
    dateOfExamination?: DateTimeNullableFilter<"CivilServiceEligibility"> | Date | string | null
    placeOfExamination?: StringNullableFilter<"CivilServiceEligibility"> | string | null
    licenseNo?: StringNullableFilter<"CivilServiceEligibility"> | string | null
    licenseValidity?: DateTimeNullableFilter<"CivilServiceEligibility"> | Date | string | null
  }

  export type WorkExperienceUpsertWithWhereUniqueWithoutEmployeeInput = {
    where: WorkExperienceWhereUniqueInput
    update: XOR<WorkExperienceUpdateWithoutEmployeeInput, WorkExperienceUncheckedUpdateWithoutEmployeeInput>
    create: XOR<WorkExperienceCreateWithoutEmployeeInput, WorkExperienceUncheckedCreateWithoutEmployeeInput>
  }

  export type WorkExperienceUpdateWithWhereUniqueWithoutEmployeeInput = {
    where: WorkExperienceWhereUniqueInput
    data: XOR<WorkExperienceUpdateWithoutEmployeeInput, WorkExperienceUncheckedUpdateWithoutEmployeeInput>
  }

  export type WorkExperienceUpdateManyWithWhereWithoutEmployeeInput = {
    where: WorkExperienceScalarWhereInput
    data: XOR<WorkExperienceUpdateManyMutationInput, WorkExperienceUncheckedUpdateManyWithoutEmployeeInput>
  }

  export type WorkExperienceScalarWhereInput = {
    AND?: WorkExperienceScalarWhereInput | WorkExperienceScalarWhereInput[]
    OR?: WorkExperienceScalarWhereInput[]
    NOT?: WorkExperienceScalarWhereInput | WorkExperienceScalarWhereInput[]
    id?: IntFilter<"WorkExperience"> | number
    employeeId?: IntFilter<"WorkExperience"> | number
    dateFrom?: DateTimeFilter<"WorkExperience"> | Date | string
    dateTo?: DateTimeNullableFilter<"WorkExperience"> | Date | string | null
    positionTitle?: StringFilter<"WorkExperience"> | string
    departmentAgencyCompany?: StringFilter<"WorkExperience"> | string
    monthlySalary?: FloatNullableFilter<"WorkExperience"> | number | null
    salaryGrade?: StringNullableFilter<"WorkExperience"> | string | null
    statusOfAppointment?: StringNullableFilter<"WorkExperience"> | string | null
    isGovService?: BoolFilter<"WorkExperience"> | boolean
  }

  export type VoluntaryWorkUpsertWithWhereUniqueWithoutEmployeeInput = {
    where: VoluntaryWorkWhereUniqueInput
    update: XOR<VoluntaryWorkUpdateWithoutEmployeeInput, VoluntaryWorkUncheckedUpdateWithoutEmployeeInput>
    create: XOR<VoluntaryWorkCreateWithoutEmployeeInput, VoluntaryWorkUncheckedCreateWithoutEmployeeInput>
  }

  export type VoluntaryWorkUpdateWithWhereUniqueWithoutEmployeeInput = {
    where: VoluntaryWorkWhereUniqueInput
    data: XOR<VoluntaryWorkUpdateWithoutEmployeeInput, VoluntaryWorkUncheckedUpdateWithoutEmployeeInput>
  }

  export type VoluntaryWorkUpdateManyWithWhereWithoutEmployeeInput = {
    where: VoluntaryWorkScalarWhereInput
    data: XOR<VoluntaryWorkUpdateManyMutationInput, VoluntaryWorkUncheckedUpdateManyWithoutEmployeeInput>
  }

  export type VoluntaryWorkScalarWhereInput = {
    AND?: VoluntaryWorkScalarWhereInput | VoluntaryWorkScalarWhereInput[]
    OR?: VoluntaryWorkScalarWhereInput[]
    NOT?: VoluntaryWorkScalarWhereInput | VoluntaryWorkScalarWhereInput[]
    id?: IntFilter<"VoluntaryWork"> | number
    employeeId?: IntFilter<"VoluntaryWork"> | number
    organizationName?: StringFilter<"VoluntaryWork"> | string
    organizationAddress?: StringNullableFilter<"VoluntaryWork"> | string | null
    dateFrom?: DateTimeFilter<"VoluntaryWork"> | Date | string
    dateTo?: DateTimeNullableFilter<"VoluntaryWork"> | Date | string | null
    numberOfHours?: FloatNullableFilter<"VoluntaryWork"> | number | null
    positionNature?: StringFilter<"VoluntaryWork"> | string
  }

  export type TrainingProgramUpsertWithWhereUniqueWithoutEmployeeInput = {
    where: TrainingProgramWhereUniqueInput
    update: XOR<TrainingProgramUpdateWithoutEmployeeInput, TrainingProgramUncheckedUpdateWithoutEmployeeInput>
    create: XOR<TrainingProgramCreateWithoutEmployeeInput, TrainingProgramUncheckedCreateWithoutEmployeeInput>
  }

  export type TrainingProgramUpdateWithWhereUniqueWithoutEmployeeInput = {
    where: TrainingProgramWhereUniqueInput
    data: XOR<TrainingProgramUpdateWithoutEmployeeInput, TrainingProgramUncheckedUpdateWithoutEmployeeInput>
  }

  export type TrainingProgramUpdateManyWithWhereWithoutEmployeeInput = {
    where: TrainingProgramScalarWhereInput
    data: XOR<TrainingProgramUpdateManyMutationInput, TrainingProgramUncheckedUpdateManyWithoutEmployeeInput>
  }

  export type TrainingProgramScalarWhereInput = {
    AND?: TrainingProgramScalarWhereInput | TrainingProgramScalarWhereInput[]
    OR?: TrainingProgramScalarWhereInput[]
    NOT?: TrainingProgramScalarWhereInput | TrainingProgramScalarWhereInput[]
    id?: IntFilter<"TrainingProgram"> | number
    employeeId?: IntFilter<"TrainingProgram"> | number
    titleOfLearning?: StringFilter<"TrainingProgram"> | string
    dateFrom?: DateTimeFilter<"TrainingProgram"> | Date | string
    dateTo?: DateTimeNullableFilter<"TrainingProgram"> | Date | string | null
    numberOfHours?: FloatNullableFilter<"TrainingProgram"> | number | null
    typeOfId?: StringNullableFilter<"TrainingProgram"> | string | null
    sponsoredBy?: StringNullableFilter<"TrainingProgram"> | string | null
  }

  export type OtherInformationUpsertWithWhereUniqueWithoutEmployeeInput = {
    where: OtherInformationWhereUniqueInput
    update: XOR<OtherInformationUpdateWithoutEmployeeInput, OtherInformationUncheckedUpdateWithoutEmployeeInput>
    create: XOR<OtherInformationCreateWithoutEmployeeInput, OtherInformationUncheckedCreateWithoutEmployeeInput>
  }

  export type OtherInformationUpdateWithWhereUniqueWithoutEmployeeInput = {
    where: OtherInformationWhereUniqueInput
    data: XOR<OtherInformationUpdateWithoutEmployeeInput, OtherInformationUncheckedUpdateWithoutEmployeeInput>
  }

  export type OtherInformationUpdateManyWithWhereWithoutEmployeeInput = {
    where: OtherInformationScalarWhereInput
    data: XOR<OtherInformationUpdateManyMutationInput, OtherInformationUncheckedUpdateManyWithoutEmployeeInput>
  }

  export type OtherInformationScalarWhereInput = {
    AND?: OtherInformationScalarWhereInput | OtherInformationScalarWhereInput[]
    OR?: OtherInformationScalarWhereInput[]
    NOT?: OtherInformationScalarWhereInput | OtherInformationScalarWhereInput[]
    id?: IntFilter<"OtherInformation"> | number
    employeeId?: IntFilter<"OtherInformation"> | number
    specialSkills?: StringNullableFilter<"OtherInformation"> | string | null
    nonAcademicDistinctions?: StringNullableFilter<"OtherInformation"> | string | null
    membershipInAssoc?: StringNullableFilter<"OtherInformation"> | string | null
  }

  export type FamilyBackgroundUpsertWithoutEmployeeInput = {
    update: XOR<FamilyBackgroundUpdateWithoutEmployeeInput, FamilyBackgroundUncheckedUpdateWithoutEmployeeInput>
    create: XOR<FamilyBackgroundCreateWithoutEmployeeInput, FamilyBackgroundUncheckedCreateWithoutEmployeeInput>
    where?: FamilyBackgroundWhereInput
  }

  export type FamilyBackgroundUpdateToOneWithWhereWithoutEmployeeInput = {
    where?: FamilyBackgroundWhereInput
    data: XOR<FamilyBackgroundUpdateWithoutEmployeeInput, FamilyBackgroundUncheckedUpdateWithoutEmployeeInput>
  }

  export type FamilyBackgroundUpdateWithoutEmployeeInput = {
    spouseFirstName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseLastName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseMiddleName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseOccupation?: NullableStringFieldUpdateOperationsInput | string | null
    spouseEmployer?: NullableStringFieldUpdateOperationsInput | string | null
    spouseBusinessAddress?: NullableStringFieldUpdateOperationsInput | string | null
    spouseTelephone?: NullableStringFieldUpdateOperationsInput | string | null
    fatherFirstName?: StringFieldUpdateOperationsInput | string
    fatherLastName?: StringFieldUpdateOperationsInput | string
    fatherMiddleName?: NullableStringFieldUpdateOperationsInput | string | null
    motherMaidenFirst?: StringFieldUpdateOperationsInput | string
    motherMaidenLast?: StringFieldUpdateOperationsInput | string
    motherMaidenMiddle?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type FamilyBackgroundUncheckedUpdateWithoutEmployeeInput = {
    id?: IntFieldUpdateOperationsInput | number
    spouseFirstName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseLastName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseMiddleName?: NullableStringFieldUpdateOperationsInput | string | null
    spouseOccupation?: NullableStringFieldUpdateOperationsInput | string | null
    spouseEmployer?: NullableStringFieldUpdateOperationsInput | string | null
    spouseBusinessAddress?: NullableStringFieldUpdateOperationsInput | string | null
    spouseTelephone?: NullableStringFieldUpdateOperationsInput | string | null
    fatherFirstName?: StringFieldUpdateOperationsInput | string
    fatherLastName?: StringFieldUpdateOperationsInput | string
    fatherMiddleName?: NullableStringFieldUpdateOperationsInput | string | null
    motherMaidenFirst?: StringFieldUpdateOperationsInput | string
    motherMaidenLast?: StringFieldUpdateOperationsInput | string
    motherMaidenMiddle?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type LeaveRecordUpsertWithWhereUniqueWithoutEmployeeInput = {
    where: LeaveRecordWhereUniqueInput
    update: XOR<LeaveRecordUpdateWithoutEmployeeInput, LeaveRecordUncheckedUpdateWithoutEmployeeInput>
    create: XOR<LeaveRecordCreateWithoutEmployeeInput, LeaveRecordUncheckedCreateWithoutEmployeeInput>
  }

  export type LeaveRecordUpdateWithWhereUniqueWithoutEmployeeInput = {
    where: LeaveRecordWhereUniqueInput
    data: XOR<LeaveRecordUpdateWithoutEmployeeInput, LeaveRecordUncheckedUpdateWithoutEmployeeInput>
  }

  export type LeaveRecordUpdateManyWithWhereWithoutEmployeeInput = {
    where: LeaveRecordScalarWhereInput
    data: XOR<LeaveRecordUpdateManyMutationInput, LeaveRecordUncheckedUpdateManyWithoutEmployeeInput>
  }

  export type LeaveRecordScalarWhereInput = {
    AND?: LeaveRecordScalarWhereInput | LeaveRecordScalarWhereInput[]
    OR?: LeaveRecordScalarWhereInput[]
    NOT?: LeaveRecordScalarWhereInput | LeaveRecordScalarWhereInput[]
    id?: IntFilter<"LeaveRecord"> | number
    employeeId?: IntFilter<"LeaveRecord"> | number
    type?: StringFilter<"LeaveRecord"> | string
    startDate?: DateTimeFilter<"LeaveRecord"> | Date | string
    endDate?: DateTimeFilter<"LeaveRecord"> | Date | string
    status?: StringFilter<"LeaveRecord"> | string
    reason?: StringNullableFilter<"LeaveRecord"> | string | null
    createdAt?: DateTimeFilter<"LeaveRecord"> | Date | string
  }

  export type EmployeeCreateWithoutFamilyInput = {
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    department: DepartmentCreateNestedOneWithoutEmployeesInput
    position: PositionCreateNestedOneWithoutEmployeesInput
    children?: ChildRecordCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationCreateNestedManyWithoutEmployeeInput
    leaves?: LeaveRecordCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeUncheckedCreateWithoutFamilyInput = {
    id?: number
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    departmentId: number
    positionId: number
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: ChildRecordUncheckedCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundUncheckedCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityUncheckedCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceUncheckedCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkUncheckedCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramUncheckedCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationUncheckedCreateNestedManyWithoutEmployeeInput
    leaves?: LeaveRecordUncheckedCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeCreateOrConnectWithoutFamilyInput = {
    where: EmployeeWhereUniqueInput
    create: XOR<EmployeeCreateWithoutFamilyInput, EmployeeUncheckedCreateWithoutFamilyInput>
  }

  export type EmployeeUpsertWithoutFamilyInput = {
    update: XOR<EmployeeUpdateWithoutFamilyInput, EmployeeUncheckedUpdateWithoutFamilyInput>
    create: XOR<EmployeeCreateWithoutFamilyInput, EmployeeUncheckedCreateWithoutFamilyInput>
    where?: EmployeeWhereInput
  }

  export type EmployeeUpdateToOneWithWhereWithoutFamilyInput = {
    where?: EmployeeWhereInput
    data: XOR<EmployeeUpdateWithoutFamilyInput, EmployeeUncheckedUpdateWithoutFamilyInput>
  }

  export type EmployeeUpdateWithoutFamilyInput = {
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    department?: DepartmentUpdateOneRequiredWithoutEmployeesNestedInput
    position?: PositionUpdateOneRequiredWithoutEmployeesNestedInput
    children?: ChildRecordUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUpdateManyWithoutEmployeeNestedInput
    leaves?: LeaveRecordUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeUncheckedUpdateWithoutFamilyInput = {
    id?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    departmentId?: IntFieldUpdateOperationsInput | number
    positionId?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ChildRecordUncheckedUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUncheckedUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUncheckedUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUncheckedUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUncheckedUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUncheckedUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUncheckedUpdateManyWithoutEmployeeNestedInput
    leaves?: LeaveRecordUncheckedUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeCreateWithoutChildrenInput = {
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    department: DepartmentCreateNestedOneWithoutEmployeesInput
    position: PositionCreateNestedOneWithoutEmployeesInput
    education?: EducationalBackgroundCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeUncheckedCreateWithoutChildrenInput = {
    id?: number
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    departmentId: number
    positionId: number
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    education?: EducationalBackgroundUncheckedCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityUncheckedCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceUncheckedCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkUncheckedCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramUncheckedCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationUncheckedCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundUncheckedCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordUncheckedCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeCreateOrConnectWithoutChildrenInput = {
    where: EmployeeWhereUniqueInput
    create: XOR<EmployeeCreateWithoutChildrenInput, EmployeeUncheckedCreateWithoutChildrenInput>
  }

  export type EmployeeUpsertWithoutChildrenInput = {
    update: XOR<EmployeeUpdateWithoutChildrenInput, EmployeeUncheckedUpdateWithoutChildrenInput>
    create: XOR<EmployeeCreateWithoutChildrenInput, EmployeeUncheckedCreateWithoutChildrenInput>
    where?: EmployeeWhereInput
  }

  export type EmployeeUpdateToOneWithWhereWithoutChildrenInput = {
    where?: EmployeeWhereInput
    data: XOR<EmployeeUpdateWithoutChildrenInput, EmployeeUncheckedUpdateWithoutChildrenInput>
  }

  export type EmployeeUpdateWithoutChildrenInput = {
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    department?: DepartmentUpdateOneRequiredWithoutEmployeesNestedInput
    position?: PositionUpdateOneRequiredWithoutEmployeesNestedInput
    education?: EducationalBackgroundUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeUncheckedUpdateWithoutChildrenInput = {
    id?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    departmentId?: IntFieldUpdateOperationsInput | number
    positionId?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    education?: EducationalBackgroundUncheckedUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUncheckedUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUncheckedUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUncheckedUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUncheckedUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUncheckedUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUncheckedUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUncheckedUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeCreateWithoutEducationInput = {
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    department: DepartmentCreateNestedOneWithoutEmployeesInput
    position: PositionCreateNestedOneWithoutEmployeesInput
    children?: ChildRecordCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeUncheckedCreateWithoutEducationInput = {
    id?: number
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    departmentId: number
    positionId: number
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: ChildRecordUncheckedCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityUncheckedCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceUncheckedCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkUncheckedCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramUncheckedCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationUncheckedCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundUncheckedCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordUncheckedCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeCreateOrConnectWithoutEducationInput = {
    where: EmployeeWhereUniqueInput
    create: XOR<EmployeeCreateWithoutEducationInput, EmployeeUncheckedCreateWithoutEducationInput>
  }

  export type EmployeeUpsertWithoutEducationInput = {
    update: XOR<EmployeeUpdateWithoutEducationInput, EmployeeUncheckedUpdateWithoutEducationInput>
    create: XOR<EmployeeCreateWithoutEducationInput, EmployeeUncheckedCreateWithoutEducationInput>
    where?: EmployeeWhereInput
  }

  export type EmployeeUpdateToOneWithWhereWithoutEducationInput = {
    where?: EmployeeWhereInput
    data: XOR<EmployeeUpdateWithoutEducationInput, EmployeeUncheckedUpdateWithoutEducationInput>
  }

  export type EmployeeUpdateWithoutEducationInput = {
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    department?: DepartmentUpdateOneRequiredWithoutEmployeesNestedInput
    position?: PositionUpdateOneRequiredWithoutEmployeesNestedInput
    children?: ChildRecordUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeUncheckedUpdateWithoutEducationInput = {
    id?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    departmentId?: IntFieldUpdateOperationsInput | number
    positionId?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ChildRecordUncheckedUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUncheckedUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUncheckedUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUncheckedUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUncheckedUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUncheckedUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUncheckedUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUncheckedUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeCreateWithoutCivilServiceInput = {
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    department: DepartmentCreateNestedOneWithoutEmployeesInput
    position: PositionCreateNestedOneWithoutEmployeesInput
    children?: ChildRecordCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeUncheckedCreateWithoutCivilServiceInput = {
    id?: number
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    departmentId: number
    positionId: number
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: ChildRecordUncheckedCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundUncheckedCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceUncheckedCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkUncheckedCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramUncheckedCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationUncheckedCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundUncheckedCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordUncheckedCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeCreateOrConnectWithoutCivilServiceInput = {
    where: EmployeeWhereUniqueInput
    create: XOR<EmployeeCreateWithoutCivilServiceInput, EmployeeUncheckedCreateWithoutCivilServiceInput>
  }

  export type EmployeeUpsertWithoutCivilServiceInput = {
    update: XOR<EmployeeUpdateWithoutCivilServiceInput, EmployeeUncheckedUpdateWithoutCivilServiceInput>
    create: XOR<EmployeeCreateWithoutCivilServiceInput, EmployeeUncheckedCreateWithoutCivilServiceInput>
    where?: EmployeeWhereInput
  }

  export type EmployeeUpdateToOneWithWhereWithoutCivilServiceInput = {
    where?: EmployeeWhereInput
    data: XOR<EmployeeUpdateWithoutCivilServiceInput, EmployeeUncheckedUpdateWithoutCivilServiceInput>
  }

  export type EmployeeUpdateWithoutCivilServiceInput = {
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    department?: DepartmentUpdateOneRequiredWithoutEmployeesNestedInput
    position?: PositionUpdateOneRequiredWithoutEmployeesNestedInput
    children?: ChildRecordUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeUncheckedUpdateWithoutCivilServiceInput = {
    id?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    departmentId?: IntFieldUpdateOperationsInput | number
    positionId?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ChildRecordUncheckedUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUncheckedUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUncheckedUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUncheckedUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUncheckedUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUncheckedUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUncheckedUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUncheckedUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeCreateWithoutWorkExperienceInput = {
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    department: DepartmentCreateNestedOneWithoutEmployeesInput
    position: PositionCreateNestedOneWithoutEmployeesInput
    children?: ChildRecordCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeUncheckedCreateWithoutWorkExperienceInput = {
    id?: number
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    departmentId: number
    positionId: number
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: ChildRecordUncheckedCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundUncheckedCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityUncheckedCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkUncheckedCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramUncheckedCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationUncheckedCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundUncheckedCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordUncheckedCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeCreateOrConnectWithoutWorkExperienceInput = {
    where: EmployeeWhereUniqueInput
    create: XOR<EmployeeCreateWithoutWorkExperienceInput, EmployeeUncheckedCreateWithoutWorkExperienceInput>
  }

  export type EmployeeUpsertWithoutWorkExperienceInput = {
    update: XOR<EmployeeUpdateWithoutWorkExperienceInput, EmployeeUncheckedUpdateWithoutWorkExperienceInput>
    create: XOR<EmployeeCreateWithoutWorkExperienceInput, EmployeeUncheckedCreateWithoutWorkExperienceInput>
    where?: EmployeeWhereInput
  }

  export type EmployeeUpdateToOneWithWhereWithoutWorkExperienceInput = {
    where?: EmployeeWhereInput
    data: XOR<EmployeeUpdateWithoutWorkExperienceInput, EmployeeUncheckedUpdateWithoutWorkExperienceInput>
  }

  export type EmployeeUpdateWithoutWorkExperienceInput = {
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    department?: DepartmentUpdateOneRequiredWithoutEmployeesNestedInput
    position?: PositionUpdateOneRequiredWithoutEmployeesNestedInput
    children?: ChildRecordUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeUncheckedUpdateWithoutWorkExperienceInput = {
    id?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    departmentId?: IntFieldUpdateOperationsInput | number
    positionId?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ChildRecordUncheckedUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUncheckedUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUncheckedUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUncheckedUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUncheckedUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUncheckedUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUncheckedUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUncheckedUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeCreateWithoutVoluntaryWorkInput = {
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    department: DepartmentCreateNestedOneWithoutEmployeesInput
    position: PositionCreateNestedOneWithoutEmployeesInput
    children?: ChildRecordCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeUncheckedCreateWithoutVoluntaryWorkInput = {
    id?: number
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    departmentId: number
    positionId: number
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: ChildRecordUncheckedCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundUncheckedCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityUncheckedCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceUncheckedCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramUncheckedCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationUncheckedCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundUncheckedCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordUncheckedCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeCreateOrConnectWithoutVoluntaryWorkInput = {
    where: EmployeeWhereUniqueInput
    create: XOR<EmployeeCreateWithoutVoluntaryWorkInput, EmployeeUncheckedCreateWithoutVoluntaryWorkInput>
  }

  export type EmployeeUpsertWithoutVoluntaryWorkInput = {
    update: XOR<EmployeeUpdateWithoutVoluntaryWorkInput, EmployeeUncheckedUpdateWithoutVoluntaryWorkInput>
    create: XOR<EmployeeCreateWithoutVoluntaryWorkInput, EmployeeUncheckedCreateWithoutVoluntaryWorkInput>
    where?: EmployeeWhereInput
  }

  export type EmployeeUpdateToOneWithWhereWithoutVoluntaryWorkInput = {
    where?: EmployeeWhereInput
    data: XOR<EmployeeUpdateWithoutVoluntaryWorkInput, EmployeeUncheckedUpdateWithoutVoluntaryWorkInput>
  }

  export type EmployeeUpdateWithoutVoluntaryWorkInput = {
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    department?: DepartmentUpdateOneRequiredWithoutEmployeesNestedInput
    position?: PositionUpdateOneRequiredWithoutEmployeesNestedInput
    children?: ChildRecordUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeUncheckedUpdateWithoutVoluntaryWorkInput = {
    id?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    departmentId?: IntFieldUpdateOperationsInput | number
    positionId?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ChildRecordUncheckedUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUncheckedUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUncheckedUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUncheckedUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUncheckedUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUncheckedUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUncheckedUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUncheckedUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeCreateWithoutTrainingInput = {
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    department: DepartmentCreateNestedOneWithoutEmployeesInput
    position: PositionCreateNestedOneWithoutEmployeesInput
    children?: ChildRecordCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeUncheckedCreateWithoutTrainingInput = {
    id?: number
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    departmentId: number
    positionId: number
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: ChildRecordUncheckedCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundUncheckedCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityUncheckedCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceUncheckedCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkUncheckedCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationUncheckedCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundUncheckedCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordUncheckedCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeCreateOrConnectWithoutTrainingInput = {
    where: EmployeeWhereUniqueInput
    create: XOR<EmployeeCreateWithoutTrainingInput, EmployeeUncheckedCreateWithoutTrainingInput>
  }

  export type EmployeeUpsertWithoutTrainingInput = {
    update: XOR<EmployeeUpdateWithoutTrainingInput, EmployeeUncheckedUpdateWithoutTrainingInput>
    create: XOR<EmployeeCreateWithoutTrainingInput, EmployeeUncheckedCreateWithoutTrainingInput>
    where?: EmployeeWhereInput
  }

  export type EmployeeUpdateToOneWithWhereWithoutTrainingInput = {
    where?: EmployeeWhereInput
    data: XOR<EmployeeUpdateWithoutTrainingInput, EmployeeUncheckedUpdateWithoutTrainingInput>
  }

  export type EmployeeUpdateWithoutTrainingInput = {
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    department?: DepartmentUpdateOneRequiredWithoutEmployeesNestedInput
    position?: PositionUpdateOneRequiredWithoutEmployeesNestedInput
    children?: ChildRecordUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeUncheckedUpdateWithoutTrainingInput = {
    id?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    departmentId?: IntFieldUpdateOperationsInput | number
    positionId?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ChildRecordUncheckedUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUncheckedUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUncheckedUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUncheckedUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUncheckedUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUncheckedUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUncheckedUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUncheckedUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeCreateWithoutSkillsInput = {
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    department: DepartmentCreateNestedOneWithoutEmployeesInput
    position: PositionCreateNestedOneWithoutEmployeesInput
    children?: ChildRecordCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeUncheckedCreateWithoutSkillsInput = {
    id?: number
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    departmentId: number
    positionId: number
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: ChildRecordUncheckedCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundUncheckedCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityUncheckedCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceUncheckedCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkUncheckedCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramUncheckedCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundUncheckedCreateNestedOneWithoutEmployeeInput
    leaves?: LeaveRecordUncheckedCreateNestedManyWithoutEmployeeInput
  }

  export type EmployeeCreateOrConnectWithoutSkillsInput = {
    where: EmployeeWhereUniqueInput
    create: XOR<EmployeeCreateWithoutSkillsInput, EmployeeUncheckedCreateWithoutSkillsInput>
  }

  export type EmployeeUpsertWithoutSkillsInput = {
    update: XOR<EmployeeUpdateWithoutSkillsInput, EmployeeUncheckedUpdateWithoutSkillsInput>
    create: XOR<EmployeeCreateWithoutSkillsInput, EmployeeUncheckedCreateWithoutSkillsInput>
    where?: EmployeeWhereInput
  }

  export type EmployeeUpdateToOneWithWhereWithoutSkillsInput = {
    where?: EmployeeWhereInput
    data: XOR<EmployeeUpdateWithoutSkillsInput, EmployeeUncheckedUpdateWithoutSkillsInput>
  }

  export type EmployeeUpdateWithoutSkillsInput = {
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    department?: DepartmentUpdateOneRequiredWithoutEmployeesNestedInput
    position?: PositionUpdateOneRequiredWithoutEmployeesNestedInput
    children?: ChildRecordUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeUncheckedUpdateWithoutSkillsInput = {
    id?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    departmentId?: IntFieldUpdateOperationsInput | number
    positionId?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ChildRecordUncheckedUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUncheckedUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUncheckedUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUncheckedUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUncheckedUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUncheckedUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUncheckedUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUncheckedUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeCreateWithoutLeavesInput = {
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    department: DepartmentCreateNestedOneWithoutEmployeesInput
    position: PositionCreateNestedOneWithoutEmployeesInput
    children?: ChildRecordCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundCreateNestedOneWithoutEmployeeInput
  }

  export type EmployeeUncheckedCreateWithoutLeavesInput = {
    id?: number
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    departmentId: number
    positionId: number
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: ChildRecordUncheckedCreateNestedManyWithoutEmployeeInput
    education?: EducationalBackgroundUncheckedCreateNestedManyWithoutEmployeeInput
    civilService?: CivilServiceEligibilityUncheckedCreateNestedManyWithoutEmployeeInput
    workExperience?: WorkExperienceUncheckedCreateNestedManyWithoutEmployeeInput
    voluntaryWork?: VoluntaryWorkUncheckedCreateNestedManyWithoutEmployeeInput
    training?: TrainingProgramUncheckedCreateNestedManyWithoutEmployeeInput
    skills?: OtherInformationUncheckedCreateNestedManyWithoutEmployeeInput
    family?: FamilyBackgroundUncheckedCreateNestedOneWithoutEmployeeInput
  }

  export type EmployeeCreateOrConnectWithoutLeavesInput = {
    where: EmployeeWhereUniqueInput
    create: XOR<EmployeeCreateWithoutLeavesInput, EmployeeUncheckedCreateWithoutLeavesInput>
  }

  export type EmployeeUpsertWithoutLeavesInput = {
    update: XOR<EmployeeUpdateWithoutLeavesInput, EmployeeUncheckedUpdateWithoutLeavesInput>
    create: XOR<EmployeeCreateWithoutLeavesInput, EmployeeUncheckedCreateWithoutLeavesInput>
    where?: EmployeeWhereInput
  }

  export type EmployeeUpdateToOneWithWhereWithoutLeavesInput = {
    where?: EmployeeWhereInput
    data: XOR<EmployeeUpdateWithoutLeavesInput, EmployeeUncheckedUpdateWithoutLeavesInput>
  }

  export type EmployeeUpdateWithoutLeavesInput = {
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    department?: DepartmentUpdateOneRequiredWithoutEmployeesNestedInput
    position?: PositionUpdateOneRequiredWithoutEmployeesNestedInput
    children?: ChildRecordUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUpdateOneWithoutEmployeeNestedInput
  }

  export type EmployeeUncheckedUpdateWithoutLeavesInput = {
    id?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    departmentId?: IntFieldUpdateOperationsInput | number
    positionId?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ChildRecordUncheckedUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUncheckedUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUncheckedUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUncheckedUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUncheckedUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUncheckedUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUncheckedUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUncheckedUpdateOneWithoutEmployeeNestedInput
  }

  export type EmployeeCreateManyDepartmentInput = {
    id?: number
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    positionId: number
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EmployeeUpdateWithoutDepartmentInput = {
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    position?: PositionUpdateOneRequiredWithoutEmployeesNestedInput
    children?: ChildRecordUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeUncheckedUpdateWithoutDepartmentInput = {
    id?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    positionId?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ChildRecordUncheckedUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUncheckedUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUncheckedUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUncheckedUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUncheckedUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUncheckedUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUncheckedUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUncheckedUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUncheckedUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeUncheckedUpdateManyWithoutDepartmentInput = {
    id?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    positionId?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EmployeeCreateManyPositionInput = {
    id?: number
    firstName: string
    lastName: string
    middleName?: string | null
    nameExtension?: string | null
    dateOfBirth: Date | string
    placeOfBirth: string
    sex: string
    civilStatus: string
    height?: number | null
    weight?: number | null
    bloodType?: string | null
    gsisNo?: string | null
    pagibigNo?: string | null
    philhealthNo?: string | null
    sssNo?: string | null
    tinNo?: string | null
    agencyEmployeeNo?: string | null
    citizenship: string
    residentialAddress: string
    permanentAddress: string
    telephoneNo?: string | null
    mobileNo?: string | null
    email?: string | null
    departmentId: number
    status?: string
    dateHired?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EmployeeUpdateWithoutPositionInput = {
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    department?: DepartmentUpdateOneRequiredWithoutEmployeesNestedInput
    children?: ChildRecordUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeUncheckedUpdateWithoutPositionInput = {
    id?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    departmentId?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ChildRecordUncheckedUpdateManyWithoutEmployeeNestedInput
    education?: EducationalBackgroundUncheckedUpdateManyWithoutEmployeeNestedInput
    civilService?: CivilServiceEligibilityUncheckedUpdateManyWithoutEmployeeNestedInput
    workExperience?: WorkExperienceUncheckedUpdateManyWithoutEmployeeNestedInput
    voluntaryWork?: VoluntaryWorkUncheckedUpdateManyWithoutEmployeeNestedInput
    training?: TrainingProgramUncheckedUpdateManyWithoutEmployeeNestedInput
    skills?: OtherInformationUncheckedUpdateManyWithoutEmployeeNestedInput
    family?: FamilyBackgroundUncheckedUpdateOneWithoutEmployeeNestedInput
    leaves?: LeaveRecordUncheckedUpdateManyWithoutEmployeeNestedInput
  }

  export type EmployeeUncheckedUpdateManyWithoutPositionInput = {
    id?: IntFieldUpdateOperationsInput | number
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    nameExtension?: NullableStringFieldUpdateOperationsInput | string | null
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
    placeOfBirth?: StringFieldUpdateOperationsInput | string
    sex?: StringFieldUpdateOperationsInput | string
    civilStatus?: StringFieldUpdateOperationsInput | string
    height?: NullableFloatFieldUpdateOperationsInput | number | null
    weight?: NullableFloatFieldUpdateOperationsInput | number | null
    bloodType?: NullableStringFieldUpdateOperationsInput | string | null
    gsisNo?: NullableStringFieldUpdateOperationsInput | string | null
    pagibigNo?: NullableStringFieldUpdateOperationsInput | string | null
    philhealthNo?: NullableStringFieldUpdateOperationsInput | string | null
    sssNo?: NullableStringFieldUpdateOperationsInput | string | null
    tinNo?: NullableStringFieldUpdateOperationsInput | string | null
    agencyEmployeeNo?: NullableStringFieldUpdateOperationsInput | string | null
    citizenship?: StringFieldUpdateOperationsInput | string
    residentialAddress?: StringFieldUpdateOperationsInput | string
    permanentAddress?: StringFieldUpdateOperationsInput | string
    telephoneNo?: NullableStringFieldUpdateOperationsInput | string | null
    mobileNo?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    departmentId?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    dateHired?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChildRecordCreateManyEmployeeInput = {
    id?: number
    name: string
    dateOfBirth: Date | string
  }

  export type EducationalBackgroundCreateManyEmployeeInput = {
    id?: number
    level: string
    schoolName: string
    degreeCourse?: string | null
    yearGraduated?: string | null
    highestLevelEarned?: string | null
    dateFrom?: Date | string | null
    dateTo?: Date | string | null
    scholarships?: string | null
  }

  export type CivilServiceEligibilityCreateManyEmployeeInput = {
    id?: number
    careerService: string
    rating?: number | null
    dateOfExamination?: Date | string | null
    placeOfExamination?: string | null
    licenseNo?: string | null
    licenseValidity?: Date | string | null
  }

  export type WorkExperienceCreateManyEmployeeInput = {
    id?: number
    dateFrom: Date | string
    dateTo?: Date | string | null
    positionTitle: string
    departmentAgencyCompany: string
    monthlySalary?: number | null
    salaryGrade?: string | null
    statusOfAppointment?: string | null
    isGovService?: boolean
  }

  export type VoluntaryWorkCreateManyEmployeeInput = {
    id?: number
    organizationName: string
    organizationAddress?: string | null
    dateFrom: Date | string
    dateTo?: Date | string | null
    numberOfHours?: number | null
    positionNature: string
  }

  export type TrainingProgramCreateManyEmployeeInput = {
    id?: number
    titleOfLearning: string
    dateFrom: Date | string
    dateTo?: Date | string | null
    numberOfHours?: number | null
    typeOfId?: string | null
    sponsoredBy?: string | null
  }

  export type OtherInformationCreateManyEmployeeInput = {
    id?: number
    specialSkills?: string | null
    nonAcademicDistinctions?: string | null
    membershipInAssoc?: string | null
  }

  export type LeaveRecordCreateManyEmployeeInput = {
    id?: number
    type: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    reason?: string | null
    createdAt?: Date | string
  }

  export type ChildRecordUpdateWithoutEmployeeInput = {
    name?: StringFieldUpdateOperationsInput | string
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChildRecordUncheckedUpdateWithoutEmployeeInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChildRecordUncheckedUpdateManyWithoutEmployeeInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    dateOfBirth?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EducationalBackgroundUpdateWithoutEmployeeInput = {
    level?: StringFieldUpdateOperationsInput | string
    schoolName?: StringFieldUpdateOperationsInput | string
    degreeCourse?: NullableStringFieldUpdateOperationsInput | string | null
    yearGraduated?: NullableStringFieldUpdateOperationsInput | string | null
    highestLevelEarned?: NullableStringFieldUpdateOperationsInput | string | null
    dateFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scholarships?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EducationalBackgroundUncheckedUpdateWithoutEmployeeInput = {
    id?: IntFieldUpdateOperationsInput | number
    level?: StringFieldUpdateOperationsInput | string
    schoolName?: StringFieldUpdateOperationsInput | string
    degreeCourse?: NullableStringFieldUpdateOperationsInput | string | null
    yearGraduated?: NullableStringFieldUpdateOperationsInput | string | null
    highestLevelEarned?: NullableStringFieldUpdateOperationsInput | string | null
    dateFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scholarships?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EducationalBackgroundUncheckedUpdateManyWithoutEmployeeInput = {
    id?: IntFieldUpdateOperationsInput | number
    level?: StringFieldUpdateOperationsInput | string
    schoolName?: StringFieldUpdateOperationsInput | string
    degreeCourse?: NullableStringFieldUpdateOperationsInput | string | null
    yearGraduated?: NullableStringFieldUpdateOperationsInput | string | null
    highestLevelEarned?: NullableStringFieldUpdateOperationsInput | string | null
    dateFrom?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    scholarships?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type CivilServiceEligibilityUpdateWithoutEmployeeInput = {
    careerService?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    dateOfExamination?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    placeOfExamination?: NullableStringFieldUpdateOperationsInput | string | null
    licenseNo?: NullableStringFieldUpdateOperationsInput | string | null
    licenseValidity?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type CivilServiceEligibilityUncheckedUpdateWithoutEmployeeInput = {
    id?: IntFieldUpdateOperationsInput | number
    careerService?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    dateOfExamination?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    placeOfExamination?: NullableStringFieldUpdateOperationsInput | string | null
    licenseNo?: NullableStringFieldUpdateOperationsInput | string | null
    licenseValidity?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type CivilServiceEligibilityUncheckedUpdateManyWithoutEmployeeInput = {
    id?: IntFieldUpdateOperationsInput | number
    careerService?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    dateOfExamination?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    placeOfExamination?: NullableStringFieldUpdateOperationsInput | string | null
    licenseNo?: NullableStringFieldUpdateOperationsInput | string | null
    licenseValidity?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type WorkExperienceUpdateWithoutEmployeeInput = {
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    positionTitle?: StringFieldUpdateOperationsInput | string
    departmentAgencyCompany?: StringFieldUpdateOperationsInput | string
    monthlySalary?: NullableFloatFieldUpdateOperationsInput | number | null
    salaryGrade?: NullableStringFieldUpdateOperationsInput | string | null
    statusOfAppointment?: NullableStringFieldUpdateOperationsInput | string | null
    isGovService?: BoolFieldUpdateOperationsInput | boolean
  }

  export type WorkExperienceUncheckedUpdateWithoutEmployeeInput = {
    id?: IntFieldUpdateOperationsInput | number
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    positionTitle?: StringFieldUpdateOperationsInput | string
    departmentAgencyCompany?: StringFieldUpdateOperationsInput | string
    monthlySalary?: NullableFloatFieldUpdateOperationsInput | number | null
    salaryGrade?: NullableStringFieldUpdateOperationsInput | string | null
    statusOfAppointment?: NullableStringFieldUpdateOperationsInput | string | null
    isGovService?: BoolFieldUpdateOperationsInput | boolean
  }

  export type WorkExperienceUncheckedUpdateManyWithoutEmployeeInput = {
    id?: IntFieldUpdateOperationsInput | number
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    positionTitle?: StringFieldUpdateOperationsInput | string
    departmentAgencyCompany?: StringFieldUpdateOperationsInput | string
    monthlySalary?: NullableFloatFieldUpdateOperationsInput | number | null
    salaryGrade?: NullableStringFieldUpdateOperationsInput | string | null
    statusOfAppointment?: NullableStringFieldUpdateOperationsInput | string | null
    isGovService?: BoolFieldUpdateOperationsInput | boolean
  }

  export type VoluntaryWorkUpdateWithoutEmployeeInput = {
    organizationName?: StringFieldUpdateOperationsInput | string
    organizationAddress?: NullableStringFieldUpdateOperationsInput | string | null
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    numberOfHours?: NullableFloatFieldUpdateOperationsInput | number | null
    positionNature?: StringFieldUpdateOperationsInput | string
  }

  export type VoluntaryWorkUncheckedUpdateWithoutEmployeeInput = {
    id?: IntFieldUpdateOperationsInput | number
    organizationName?: StringFieldUpdateOperationsInput | string
    organizationAddress?: NullableStringFieldUpdateOperationsInput | string | null
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    numberOfHours?: NullableFloatFieldUpdateOperationsInput | number | null
    positionNature?: StringFieldUpdateOperationsInput | string
  }

  export type VoluntaryWorkUncheckedUpdateManyWithoutEmployeeInput = {
    id?: IntFieldUpdateOperationsInput | number
    organizationName?: StringFieldUpdateOperationsInput | string
    organizationAddress?: NullableStringFieldUpdateOperationsInput | string | null
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    numberOfHours?: NullableFloatFieldUpdateOperationsInput | number | null
    positionNature?: StringFieldUpdateOperationsInput | string
  }

  export type TrainingProgramUpdateWithoutEmployeeInput = {
    titleOfLearning?: StringFieldUpdateOperationsInput | string
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    numberOfHours?: NullableFloatFieldUpdateOperationsInput | number | null
    typeOfId?: NullableStringFieldUpdateOperationsInput | string | null
    sponsoredBy?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TrainingProgramUncheckedUpdateWithoutEmployeeInput = {
    id?: IntFieldUpdateOperationsInput | number
    titleOfLearning?: StringFieldUpdateOperationsInput | string
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    numberOfHours?: NullableFloatFieldUpdateOperationsInput | number | null
    typeOfId?: NullableStringFieldUpdateOperationsInput | string | null
    sponsoredBy?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TrainingProgramUncheckedUpdateManyWithoutEmployeeInput = {
    id?: IntFieldUpdateOperationsInput | number
    titleOfLearning?: StringFieldUpdateOperationsInput | string
    dateFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    dateTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    numberOfHours?: NullableFloatFieldUpdateOperationsInput | number | null
    typeOfId?: NullableStringFieldUpdateOperationsInput | string | null
    sponsoredBy?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OtherInformationUpdateWithoutEmployeeInput = {
    specialSkills?: NullableStringFieldUpdateOperationsInput | string | null
    nonAcademicDistinctions?: NullableStringFieldUpdateOperationsInput | string | null
    membershipInAssoc?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OtherInformationUncheckedUpdateWithoutEmployeeInput = {
    id?: IntFieldUpdateOperationsInput | number
    specialSkills?: NullableStringFieldUpdateOperationsInput | string | null
    nonAcademicDistinctions?: NullableStringFieldUpdateOperationsInput | string | null
    membershipInAssoc?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type OtherInformationUncheckedUpdateManyWithoutEmployeeInput = {
    id?: IntFieldUpdateOperationsInput | number
    specialSkills?: NullableStringFieldUpdateOperationsInput | string | null
    nonAcademicDistinctions?: NullableStringFieldUpdateOperationsInput | string | null
    membershipInAssoc?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type LeaveRecordUpdateWithoutEmployeeInput = {
    type?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LeaveRecordUncheckedUpdateWithoutEmployeeInput = {
    id?: IntFieldUpdateOperationsInput | number
    type?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LeaveRecordUncheckedUpdateManyWithoutEmployeeInput = {
    id?: IntFieldUpdateOperationsInput | number
    type?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}