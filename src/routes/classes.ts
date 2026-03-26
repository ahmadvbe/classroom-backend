import express from "express";
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";

import { db } from "../db/index.js";//complete extension 6:12:35
import { classes, departments, enrollments, subjects, user } from "../db/schema/index.js";

const router = express.Router();

//webstormproject/classroom-backend/src/routes/classes.ts 6:40:55
// 1- Get all classes with optional search, subject, teacher filters, and pagination
router.get("/", async (req, res) => {
  try {
    const { search, subject, teacher, page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(1, +page);
    const limitPerPage = Math.max(1, +limit);
    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions = [];

    if (search) {
      filterConditions.push(
        or(
          ilike(classes.name, `%${search}%`),
          ilike(classes.inviteCode, `%${search}%`)
        )
      );
    }

    if (subject) {
      filterConditions.push(ilike(subjects.name, `%${subject}%`));
    }

    if (teacher) {
      filterConditions.push(ilike(user.name, `%${teacher}%`));
    }

    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(classes)
      .leftJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(user, eq(classes.teacherId, user.id))
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    //here we re diving into a more complex DB  struct 6:41:12
    const classesList = await db
      .select({
        ...getTableColumns(classes),
        subject: {
          ...getTableColumns(subjects),
        },
        teacher: {
          ...getTableColumns(user),
        },
      })
      .from(classes)
      .leftJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(user, eq(classes.teacherId, user.id))
      .where(whereClause)
      .orderBy(desc(classes.createdAt))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: classesList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error("GET /classes error:", error);
    res.status(500).json({ error: "Failed to fetch classes" });
  }
});


//2-  6:10:34 webstormproject/classroom-backend/src/routes/classes.ts
//     Post req for submitting a class
router.post("/", async (req, res) => {
  try {
    const { //DESTRUCT ALL THE PROPERTIES BEING PASSED FROM FE TO BE USING THE FORM 6:11:50
      name, //6:12:00
      teacherId,
      subjectId,
      capacity,
      description,
      status,
      bannerUrl,
      bannerCldPubId,
    } = req.body;

    //use of those properties to created a class
    //destruct the created class at our db by calling it
    const [createdClass] = await db
      .insert(classes) //insert into the classes table
      .values({ //6:13:00 all the values coming from req.body:  ...req.body
        subjectId,
        inviteCode: Math.random().toString(36).substring(2, 9), //6:13:20
        name,
        teacherId,
        bannerCldPubId,
        bannerUrl,
        capacity,
        description,
        schedules: [],
        status,
      })
      .returning({ id: classes.id });//request wt to get back 6:14:00

    if (!createdClass) throw Error; //if there is no created class

    res.status(201).json({ data: createdClass }); //else if ok return a code where we set the data also to createdClass
  } catch (error) { //6:11:09
    console.error("POST /classes error:", error);
    res.status(500).json({ error: "Failed to create class" });
  }
});

// 3- Get class details with counts
//# 6:45:50 Class Details Page with teacher, subject, and department
//     BE side : 1-We ll create a GET route to fetch the details of classes
router.get("/:id", async (req, res) => {
  try { //6:46:40
    const classId = Number(req.params.id); //turn it into a number bcz evg that
    // comes from the req.params is converted to a string bcz its a part of the url

    if (!Number.isFinite(classId)) {
      return res.status(400)
                .json({ error: "Invalid class id" });
    }
//else if we do find a class we re ready to return the class Details 6:47:27
    const [classDetails] = await db //destruct the class details of a type array
      .select({ //spcify what we re selecting
        ...getTableColumns(classes),//getting the table columns from classes
        subject: { //on it add the subject info by getting the table columns from subjects
          ...getTableColumns(subjects),
        },
        department: {
          ...getTableColumns(departments), //getting the table columns from departments
        },
        teacher: { //getting the table columns from teachers
          ...getTableColumns(user),
        },
      })
      .from(classes) //6:48:26 then we will chain a .from(classes) ontp the .select so that we know here to get it from
      .leftJoin(subjects,  //join some additional piece of info 6:48:35
                  eq(classes.subjectId, subjects.id)) //where the subjectId = subjects.id
      .leftJoin(departments, //6:48:55
                  eq(subjects.departmentId, departments.id))
      .leftJoin(user, //join the teacher info 6:48:45
                  eq(classes.teacherId, user.id))
        //6:49:10
      .where(eq(classes.id, classId)); //Id matching the one provided by params 6:49:20

    if (!classDetails) { //6:49:27 if no class Details
      return res.status(404).json({ error: "Class not found" });
    }

    //else
    res.status(200)
        .json({ data: classDetails });
  } catch (error) {
    console.error("GET /classes/:id error:", error);
    res.status(500).json({ error: "Failed to fetch class details" });
  }
});


// List users in a class by role with pagination
router.get("/:id/users", async (req, res) => {
  try {
    const classId = Number(req.params.id);
    const { role, page = 1, limit = 10 } = req.query;

    if (!Number.isFinite(classId)) {
      return res.status(400).json({ error: "Invalid class id" });
    }

    if (role !== "teacher" && role !== "student") {
      return res.status(400).json({ error: "Invalid role" });
    }

    const currentPage = Math.max(1, +page);
    const limitPerPage = Math.max(1, +limit);
    const offset = (currentPage - 1) * limitPerPage;

    const baseSelect = {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      role: user.role,
      imageCldPubId: user.imageCldPubId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const groupByFields = [
      user.id,
      user.name,
      user.email,
      user.emailVerified,
      user.image,
      user.role,
      user.imageCldPubId,
      user.createdAt,
      user.updatedAt,
    ];

    const countResult =
      role === "teacher"
        ? await db
            .select({ count: sql<number>`count(distinct ${user.id})` })
            .from(user)
            .leftJoin(classes, eq(user.id, classes.teacherId))
            .where(and(eq(user.role, role), eq(classes.id, classId)))
        : await db
            .select({ count: sql<number>`count(distinct ${user.id})` })
            .from(user)
            .leftJoin(enrollments, eq(user.id, enrollments.studentId))
            .where(and(eq(user.role, role), eq(enrollments.classId, classId)));

    const totalCount = countResult[0]?.count ?? 0;

    const usersList =
      role === "teacher"
        ? await db
            .select(baseSelect)
            .from(user)
            .leftJoin(classes, eq(user.id, classes.teacherId))
            .where(and(eq(user.role, role), eq(classes.id, classId)))
            .groupBy(...groupByFields)
            .orderBy(desc(user.createdAt))
            .limit(limitPerPage)
            .offset(offset)
        : await db
            .select(baseSelect)
            .from(user)
            .leftJoin(enrollments, eq(user.id, enrollments.studentId))
            .where(and(eq(user.role, role), eq(enrollments.classId, classId)))
            .groupBy(...groupByFields)
            .orderBy(desc(user.createdAt))
            .limit(limitPerPage)
            .offset(offset);

    res.status(200).json({
      data: usersList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error("GET /classes/:id/users error:", error);
    res.status(500).json({ error: "Failed to fetch class users" });
  }
});

export default router;
