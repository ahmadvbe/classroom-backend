//5:58:25
import('apminsight')
  .then(({ default: AgentAPI }) =>
            AgentAPI.config()) //this will confirm the agent that will run our performance monitoring 5:58:40
  .catch(() => console.log('APM not available in this environment'));

//webstormproject/classroom-backend/src/index.ts  with junie 2:56:55
// @ts-ignore
import express from "express";
// @ts-ignore
import cors from "cors";

import { toNodeHandler } from "better-auth/node";

import subjectsRouter from "./routes/subjects.js"; //railway BE deployment issue 6:03:30  we need to add .js and not ts becz node neevr executes TS
import usersRouter from "./routes/users.js";
import classesRouter from "./routes/classes.js";
import departmentsRouter from "./routes/departments.js";
import statsRouter from "./routes/stats.js";
import enrollmentsRouter from "./routes/enrollments.js";

import securityMiddleware from "./middleware/security.js";//railway BE deployment issue 6:03:30  we need to add .js and not ts becz node neevr executes TS
import { auth } from "./lib/auth.js";


const app = express();
const PORT = 8000;


//3:41:20
if(!process.env.FRONTEND_URL){
    throw new Error("FRONTEND_URL is missing from the env file");
}

//  Enabling CORS 3:37:29 tells the browser which origin/methods and headers are safe to use
//         so that the client and server can exchange data securely
//    3:38:37 webstormproject/classroom-backend/src/index.ts
//             we define the cors


app.use(
  cors({
    origin: process.env.FRONTEND_URL, // React app URL 3:38:55
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    credentials: true, // allow cookies
  })
);

// 7-5:45:18 Mount ROUTER Handler:
//     set up a route handler on ur server : handling the req for the path /api/auth/
//create a catch all route in case of express js v5 it is api/auth/*splat  for the express js v4 api/auth/*
 app.all("/api/auth/*splat", //5:46:40 *splat matches any path without the root path
     toNodeHandler(auth));//pass the isntance of auth 5:47:32 the one we created
        //so any req matching this path will be handled by BtterAuth for us and it will authenticate users on our behalf 5:49:25



app.use(express.json());

//5:34:30  Head over to Our server **webstormproject/classroom-backend/src/index.ts**
//     where we ll implement the security.ts middleware created
app.use(securityMiddleware);

//  3:33:16 src/index.ts
//            create a new router for the subjects:
app.use("/api/subjects",
        subjectsRouter //src/routes/subjects.ts
            );

// app.use("/api/users", usersRouter);
// app.use("/api/classes", classesRouter);
// app.use("/api/departments", departmentsRouter);
// app.use("/api/stats", statsRouter);
// app.use("/api/enrollments", enrollmentsRouter);

app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
