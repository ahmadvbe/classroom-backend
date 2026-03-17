import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth.js";




//3:08:51
const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()) //3:09:20 on update we re gonna set it to the current date of the update action
    .notNull(),
};

export const classStatusEnum = pgEnum("class_status", [
  "active",
  "inactive",
  "archived",
]);


//3:07:25 src/db/schema/app.ts
    //export and create a new departments table
export const departments = pgTable("departments", {
    //columns to be provided
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(), //3:08:05
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  ...timestamps, //3:08:41 created at and update at time stamps - instead of creating them right here  - define them above
    //once we created the time stamps above, it will be very easy to destrcut them at the bottom of every new table 3:09:35
});


//3:09:45
export const subjects = pgTable("subjects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  departmentId: integer("department_id")
    .notNull()
        //pointing/referencing to another table
    .references(() => departments.id,
                                                        { onDelete: "restrict" } //on delete we wana restrict 3:10:25 wt we re able to do with that
    ),

  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),

  ...timestamps,
});




// export const classes = pgTable(
//   "classes",
//   {
//     id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
//
//     subjectId: integer("subject_id")
//       .notNull()
//       .references(() => subjects.id, { onDelete: "cascade" }),
//     teacherId: text("teacher_id")
//       .notNull()
//       .references(() => user.id, { onDelete: "restrict" }),
//
//     inviteCode: varchar("invite_code", { length: 50 }).notNull().unique(),
//     name: varchar("name", { length: 255 }).notNull(),
//     bannerCldPubId: text("banner_cld_pub_id"),
//     bannerUrl: text("banner_url"),
//     capacity: integer("capacity").notNull().default(50),
//     description: text("description"),
//     status: classStatusEnum("status").notNull().default("active"),
//     schedules: jsonb("schedules").$type<Schedule[]>().notNull(),
//
//     ...timestamps,
//   },
//   (table) => ({
//     subjectIdIdx: index("classes_subject_id_idx").on(table.subjectId),
//     teacherIdIdx: index("classes_teacher_id_idx").on(table.teacherId),
//   })
// );

// export const enrollments = pgTable(
//   "enrollments",
//   {
//     id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
//
//     studentId: text("student_id")
//       .notNull()
//       .references(() => user.id, { onDelete: "cascade" }),
//     classId: integer("class_id")
//       .notNull()
//       .references(() => classes.id, { onDelete: "cascade" }),
//
//     ...timestamps,
//   },
//   (table) => ({
//     studentIdIdx: index("enrollments_student_id_idx").on(table.studentId),
//     classIdIdx: index("enrollments_class_id_idx").on(table.classId),
//     studentClassUnique: index("enrollments_student_class_unique").on(
//       table.studentId,
//       table.classId
//     ),
//   })
// );



//now we have craeted 2 separate tables
//but let us create the relation between those tables as well 3:10:50
//==>this will craete a relation between departments and subjects
export const departmentsRelations
                        = relations( //relations coming from drizzle orm
                                    departments,
                                    ({ many }//the many heplwe is used to indicate that one Dep can have multiple related items
                                    ) => ({ //automatic return  3:11:10
  subjects: many(subjects),   //==>this will craete a relation between departments and subjects
}));

// 3:12:30 getting the Dep related to a speciifc subject
export const subjectsRelations
                            = relations(
                                        subjects,
                                        ({ one, many }) => ({
    department: one(departments, { //from whitin it we wana get access to 3:12:55
    fields: [subjects.departmentId],
    references: [departments.id],
  }),
  // classes: many(classes),
}));

// export const classesRelations = relations(classes, ({ one, many }) => ({
//   subject: one(subjects, {
//     fields: [classes.subjectId],
//     references: [subjects.id],
//   }),
//   teacher: one(user, {
//     fields: [classes.teacherId],
//     references: [user.id],
//   }),
//   enrollments: many(enrollments),
// }));

// export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
//   student: one(user, {
//     fields: [enrollments.studentId],
//     references: [user.id],
//   }),
//   class: one(classes, {
//     fields: [enrollments.classId],
//     references: [classes.id],
//   }),
// }));

//let TS know what we just did 3:13:26

// TS/Departments
export type Department = typeof departments.$inferSelect; //this will use type inference  from database table schemas so ur app types stay in sync with ur Db
//it will autogenerate types for your based on ur DB schema-so u dnt hve to define types manually
export type NewDepartment = typeof departments.$inferInsert;//3:13:58 when we re inserting a new one

// TS/Subjects 3:14:00
export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;

// export type Class = typeof classes.$inferSelect;
// export type NewClass = typeof classes.$inferInsert;
//
// export type Enrollment = typeof enrollments.$inferSelect;
// export type NewEnrollment = typeof enrollments.$inferInsert;
