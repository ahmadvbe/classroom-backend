// Ensure the type.d.ts file is included by tsconfig.json
// Your tsconfig "include" currently lists only "../../../jsm-files/classroom-backend-main/src".
//     If your project source files (including src/type.d.ts) are outside that include, TypeScript won't see them.


type Schedule = {
  day: string;
  startTime: string;
  endTime: string;
};



type UserRoles = "admin" | "teacher" | "student";

//5:27:27 define the user role for ARCJET - either one of the above 3 options or just guest
type RateLimitRole = UserRoles | "guest";
