import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "../db/index.js"; // your drizzle instance
import * as schema from "../db/schema/auth.js";


// 5:43:42  -3-**CREATE A BETTER AUTH INSTANCE**
// within the webstormproject/classroom-backend/src/lib/auth.ts
// we place an instance of better auth 5:44:06

export const auth = betterAuth({

  //8- **Mention the 2 custom fields we created (role and cloudinaryID)** into the user table 5:47:52
  // so better auth can refer to AUTH Table and add users
  secret: process.env.BETTER_AUTH_SECRET!, //5:48:08
  trustedOrigins: [process.env.FRONTEND_URL!],

  //5:44:10    4- **Config the Postgres DB** in the same file   webstormproject/classroom-backend/src/lib/auth.ts
    // postgres drizzle
  database: drizzleAdapter(db, {
    provider: "pg",
    schema, //provide a schema 5:51:30 related to authentication
  }),

//   5- 5:44:50 **no need to create any DB tables** as we hve already done that before
// **set up email and password auth methos within this auth.ts file**
emailAndPassword: {
    enabled: true,
  },

  //8- Specify the custom fields that we hve added 5:48:28 to the userObject
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "student",
        input: true, // Allow role to be set during registration 5:48:50
      },
      imageCldPubId: { //5:48:58 profile photo
        type: "string",
        required: false,
        input: true, // Allow imageCldPubId to be set during registration
      },
    },
  },
});
