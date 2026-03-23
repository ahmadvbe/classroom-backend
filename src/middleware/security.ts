// # 5:25:03 **Define the Security middleware**
// so it will be called before every important request 5:25:05
// webstormproject/classroom-backend/src/middleware/security.ts

import { slidingWindow } from "@arcjet/node";
import type { ArcjetNodeRequest } from "@arcjet/node";
import type { NextFunction, Request, Response } from "express";

import aj from "../config/arcjet.js";

//5:25:30
//request, response and NextFunction r coming from express server
const securityMiddleware = async ( //accepting 3 params
  req: Request,
  res: Response,
  next: NextFunction //depending on whether it rates the req as a threat or nt =>it can allow it to pass the next req or nt 5:25:$5
) => {

  // If NODE_ENV is TEST, skip security middleware 5:26:16
  if (process.env.NODE_ENV === "test") { //we dnt hve to do sec analyses on a test env
    return next();
  }

  try { //5:26:27 define the user role
    const role: RateLimitRole = req.user?.role ?? "guest"; //type.d.ts
    // RateLimitRole creation : 5:27:47 every request will pass through the auth middleware
    // which wlll get the user info and set user role
    // so we can allow certain types of users teacher or admins to make more requests than students 5:28:00
    //lets setup those limits 5:28:08
    let limit: number;
    let message: string;

      //switch statement taking a look at the role
    switch (role) {

      case "admin":
        limit = 20;
        message = "Admin request limit exceeded (20 per minute). Slow down!"; //give a msg
        break; //break it


      case "teacher": //if case is teacher or student
      case "student":
        limit = 10;
        message = "User request limit exceeded (10 per minute). Please wait.";
        break;


      default:
        limit = 5;
        message =
          "Guest request limit exceeded (5 per minute). Please sign up for higher limits.";
        break;
    }

    //5:29:34 Create a new ARCJET client
    const client = aj.withRule( //instance of arcjet created in the  webstormproject/classroom-backend/src/config/arcjet.ts
      slidingWindow({ //5:30:05
        mode: "LIVE",
        interval: "1m",
        max: limit, //dynamic by setting it to the limit that depends on the user role 5:30:20
      })
    );

    //5:30:25 Interception of the Request
    const arcjetRequest: ArcjetNodeRequest = {
      headers: req.headers,
      method: req.method,
      url: req.originalUrl ?? req.url,
      socket: { //5:30:55
        remoteAddress: req.socket.remoteAddress ?? req.ip ?? "0.0.0.0",
      },
    };

    //5:31:15 Arcjet Decision making the decision for us based on the params defined for it
    const decision = await client.protect(arcjetRequest);

    //here we can hve difference clauses depending on what the decision of the outcome is
    if (decision.isDenied() && decision.reason.isBot()) { //5:31:50 Bots access exposure
      return res.status(403).json({
        error: "Forbidden",
        message: "Automated requests are not allowed",
      });
    }

    if (decision.isDenied() && decision.reason.isShield()) { //5:32:50 Shield Protection
      return res.status(403).json({
        error: "Forbidden",
        message: "Request blocked by security policy",
      });
    }

    if (decision.isDenied() && decision.reason.isRateLimit()) { //5:33:00 Rate Limit
      return res.status(429).json({
        error: "Too Many Requests",
        message, //this message is dynamic depneding on the role under which is the user is authenticate
                  //it is rendered within the switch scenario
      });
    }

    next(); //if we pass all of the above blocs it can say ,
            // please proceed so we can call the next func
  } catch (error) {//5:26:35
    console.error("Arcjet middleware error:", error); //display the error rh
    res.status(500).json({
      error: "Internal Server Error",
      message: "Something went wrong with the security middleware.",
    });
  }
};

export default securityMiddleware; //export it sow e can use it within our server
