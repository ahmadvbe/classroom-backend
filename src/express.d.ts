// 5:24:35 webstormproject/classroom-backend/src/express.d.ts
// **Declare the User Role for each request**

declare global {
  namespace Express { //5:24:55
    interface Request {
      user?: {
        role?: "admin" | "teacher" | "student";
      };
    }
  }
}

export {};
