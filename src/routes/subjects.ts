// @ts-ignore
import express from "express";
import { eq, ilike, or, and, desc, sql, getTableColumns } from "drizzle-orm";

import { db } from "../db/index.js";
import {
//        classes,
        departments,
//        enrollments,
        subjects,
//        user
} from "../db/schema/index.js";
//3:25:08 src/routes/subjects.ts
const router = express.Router();


        //req:express.request, res:express.response 3:25:10
// Get all subjects with optional search, department filter, and pagination 3:25:24
router.get("/", async (req, res) => {
  try {
    // 3:26:11 now remember about filtering ,
    //     search being done at frontend  but our BE at that point wsnt yet accepting those props
    const { search, department, page = 1, limit = 10 } = req.query;

    //3:26:33 3:42:50 coderabbit fix
    const currentPage = Math.max(1, +page); //ensure that page num is at least 1
    const limitPerPage = Math.max(1, +limit);
    // const currentPage = Math.max(1, parseInt(String(page),10) || 1); //ensure that page num is at least 1
    // const limitPerPage = Math.min(Math.max( parseInt(String(limit),10) || 10), 100);

    //3:27:10 how many records to skip to get to the next page
    const offset = (currentPage - 1) * limitPerPage;

    //3:27:25 define an array to store the filter conditions
    const filterConditions = [];

    if (search) { //3:27:30 if a search query exists we wana filter it by subject name or subject code
      filterConditions.push( //pushing additonal conds
        or( //ilike cominf from drizzle orm
          ilike(subjects.name, //db schema
              `%${search}%`), //match with the search
          ilike(subjects.code, `%${search}%`)
        )
      );
    }

    if (department) { //3:28:18 if department filter exist=>match department name
      // filterConditions.push(
      //     ilike(departments.name,  //by pushing this additonal condition
      //         `%${department}%`));
      //3:43:30 Coderabbitfix : this will protect us from SQL injections
      const deptPattern = `%${String(department).replace(/[%_]/g, '\\$&')}%`
      filterConditions.push(ilike(departments.name, deptPattern));
    }

    //3:28:38 combine all filters if they exist using the and operator coming from drizzle
    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    // 3:28:33 get the Count query MUST include the join, count of all elements on the page
    const countResult = await db
      .select({ count: sql<number>`count(*)` }) //3:28:52 specify the count of all eles coming frp, drizzle ORM
      .from(subjects) //3:29:25 take it from the subjects table
      .leftJoin( //3:29:38 returns all rows from the left table and matching rows from the right table
          //so we wana take all the data abt the subjects
            departments, //join the departments table as well but - we wana get access to the departments
            eq(subjects.departmentId, departments.id)) //condition
      .where(whereClause); //3:30:15 where our filters are applied

    //3:30:20
    const totalCount = countResult[0]?.count ?? 0;

    // Data query 3:30:35 returns all of those subjects with the department  data attached
    //and also allowing at the same time for querying , filtering and pagination
    const subjectsList = await db
      .select({
        ...getTableColumns(subjects), //gets all the columsn of subjects table
        department: {//but it also adds additional columns
          ...getTableColumns(departments), //where it will spread
        },
      })
      .from(subjects) //3:31:30 chain
      .leftJoin(departments,  //attach the departments, specifically the:
                eq(subjects.departmentId,
                    departments.id //where the dep id match the one attached to subjects
                ))
      .where(whereClause) //3:31:48
      .orderBy(desc(subjects.createdAt)) //descending order 3:31:57
      .limit(limitPerPage)
      .offset(offset);

    //3:32:22 lets return it
    res.status(200).json({ //Format the data in the way that we want
      data: subjectsList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) { //3:25:39
    console.error("GET /subjects error:", error);
    //return smtg
    res.status(500)
        .json({ error: "Failed to fetch subjects" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { departmentId, name, code, description } = req.body;

    const [createdSubject] = await db
      .insert(subjects)
      .values({ departmentId, name, code, description })
      .returning({ id: subjects.id });

    if (!createdSubject) throw Error;

    res.status(201).json({ data: createdSubject });
  } catch (error) {
    console.error("POST /subjects error:", error);
    res.status(500).json({ error: "Failed to create subject" });
  }
});

// // Get subject details with counts
// router.get("/:id", async (req, res) => {
//   try {
//     const subjectId = Number(req.params.id);
//
//     if (!Number.isFinite(subjectId)) {
//       return res.status(400).json({ error: "Invalid subject id" });
//     }
//
//     const [subject] = await db
//       .select({
//         ...getTableColumns(subjects),
//         department: {
//           ...getTableColumns(departments),
//         },
//       })
//       .from(subjects)
//       .leftJoin(departments, eq(subjects.departmentId, departments.id))
//       .where(eq(subjects.id, subjectId));
//
//     if (!subject) {
//       return res.status(404).json({ error: "Subject not found" });
//     }
//
//     const classesCount = await db
//       .select({ count: sql<number>`count(*)` })
//       .from(classes)
//       .where(eq(classes.subjectId, subjectId));
//
//     res.status(200).json({
//       data: {
//         subject,
//         totals: {
//           classes: classesCount[0]?.count ?? 0,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("GET /subjects/:id error:", error);
//     res.status(500).json({ error: "Failed to fetch subject details" });
//   }
// });
//
// // List classes in a subject with pagination
// router.get("/:id/classes", async (req, res) => {
//   try {
//     const subjectId = Number(req.params.id);
//     const { page = 1, limit = 10 } = req.query;
//
//     if (!Number.isFinite(subjectId)) {
//       return res.status(400).json({ error: "Invalid subject id" });
//     }
//
//     const currentPage = Math.max(1, +page);
//     const limitPerPage = Math.max(1, +limit);
//     const offset = (currentPage - 1) * limitPerPage;
//
//     const countResult = await db
//       .select({ count: sql<number>`count(*)` })
//       .from(classes)
//       .where(eq(classes.subjectId, subjectId));
//
//     const totalCount = countResult[0]?.count ?? 0;
//
//     const classesList = await db
//       .select({
//         ...getTableColumns(classes),
//         teacher: {
//           ...getTableColumns(user),
//         },
//       })
//       .from(classes)
//       .leftJoin(user, eq(classes.teacherId, user.id))
//       .where(eq(classes.subjectId, subjectId))
//       .orderBy(desc(classes.createdAt))
//       .limit(limitPerPage)
//       .offset(offset);
//
//     res.status(200).json({
//       data: classesList,
//       pagination: {
//         page: currentPage,
//         limit: limitPerPage,
//         total: totalCount,
//         totalPages: Math.ceil(totalCount / limitPerPage),
//       },
//     });
//   } catch (error) {
//     console.error("GET /subjects/:id/classes error:", error);
//     res.status(500).json({ error: "Failed to fetch subject classes" });
//   }
// });
//
// // List users in a subject by role with pagination
// router.get("/:id/users", async (req, res) => {
//   try {
//     const subjectId = Number(req.params.id);
//     const { role, page = 1, limit = 10 } = req.query;
//
//     if (!Number.isFinite(subjectId)) {
//       return res.status(400).json({ error: "Invalid subject id" });
//     }
//
//     if (role !== "teacher" && role !== "student") {
//       return res.status(400).json({ error: "Invalid role" });
//     }
//
//     const currentPage = Math.max(1, +page);
//     const limitPerPage = Math.max(1, +limit);
//     const offset = (currentPage - 1) * limitPerPage;
//
//     const baseSelect = {
//       id: user.id,
//       name: user.name,
//       email: user.email,
//       emailVerified: user.emailVerified,
//       image: user.image,
//       role: user.role,
//       imageCldPubId: user.imageCldPubId,
//       createdAt: user.createdAt,
//       updatedAt: user.updatedAt,
//     };
//
//     const groupByFields = [
//       user.id,
//       user.name,
//       user.email,
//       user.emailVerified,
//       user.image,
//       user.role,
//       user.imageCldPubId,
//       user.createdAt,
//       user.updatedAt,
//     ];
//
//     const countResult =
//       role === "teacher"
//         ? await db
//             .select({ count: sql<number>`count(distinct ${user.id})` })
//             .from(user)
//             .leftJoin(classes, eq(user.id, classes.teacherId))
//             .where(and(eq(user.role, role), eq(classes.subjectId, subjectId)))
//         : await db
//             .select({ count: sql<number>`count(distinct ${user.id})` })
//             .from(user)
//             .leftJoin(enrollments, eq(user.id, enrollments.studentId))
//             .leftJoin(classes, eq(enrollments.classId, classes.id))
//             .where(and(eq(user.role, role), eq(classes.subjectId, subjectId)));
//
//     const totalCount = countResult[0]?.count ?? 0;
//
//     const usersList =
//       role === "teacher"
//         ? await db
//             .select(baseSelect)
//             .from(user)
//             .leftJoin(classes, eq(user.id, classes.teacherId))
//             .where(and(eq(user.role, role), eq(classes.subjectId, subjectId)))
//             .groupBy(...groupByFields)
//             .orderBy(desc(user.createdAt))
//             .limit(limitPerPage)
//             .offset(offset)
//         : await db
//             .select(baseSelect)
//             .from(user)
//             .leftJoin(enrollments, eq(user.id, enrollments.studentId))
//             .leftJoin(classes, eq(enrollments.classId, classes.id))
//             .where(and(eq(user.role, role), eq(classes.subjectId, subjectId)))
//             .groupBy(...groupByFields)
//             .orderBy(desc(user.createdAt))
//             .limit(limitPerPage)
//             .offset(offset);
//
//     res.status(200).json({
//       data: usersList,
//       pagination: {
//         page: currentPage,
//         limit: limitPerPage,
//         total: totalCount,
//         totalPages: Math.ceil(totalCount / limitPerPage),
//       },
//     });
//   } catch (error) {
//     console.error("GET /subjects/:id/users error:", error);
//     res.status(500).json({ error: "Failed to fetch subject users" });
//   }
// });

export default router; //3:33:40
