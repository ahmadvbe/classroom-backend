//3:03:50 this file wont contain other schemas rather it will export all of the other schemas
//3:04:05
export * from "./app.js"; //3:14:50

//
// 5:14:00 and now head to webstormproject/classroom-backend/src/db/schema/index.ts
// and **export the auth schema so that drizzle config is also aware of it
export * from "./auth.js";
