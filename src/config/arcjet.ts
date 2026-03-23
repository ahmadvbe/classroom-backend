// **5:20:10 Install ARCJET SDK**
// 1. Install Arcjet
// https://docs.arcjet.com/get-started?f=node-js-express
//     npm i @arcjet/node @arcjet/inspect
// 2. Set your ENV KEY
// 3. Configure / ADD SOME RULES 5:20:40
// =>Update our index 5:20:54 aj instance inclusion
// webstormproject/classroom-backend/src/config/arcjet.ts

//5:21:42
import arcjet,
      { shield, detectBot, slidingWindow }
      from "@arcjet/node";


//validation for API keys 5:22:00 to make sure we actually have it
if (!process.env.ARCJET_KEY && process.env.NODE_ENV !== "test") {
  throw new Error(
    "ARCJET_KEY environment variable is required. Sign up for your Arcjet key at https://app.arcjet.com"
  );
}

//creation a new instance of arcjet 5:22:30
// Configure Arcjet with security rules.
const aj = arcjet({ //pass options ot it
  key: process.env.ARCJET_KEY!, //5:22:40
  //then we start defining the rules 5:22:44
  rules: [
    //1-shield protects ur app from most common attacks  eg sql injection  5:22:55
    shield({ mode: "LIVE" }),

    // 2- Create a bot detection rule 5:23:25
    detectBot({
      mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
      // Block all bots except the following
      allow: [ //sometimes BOTS are good so we allow them   -- allow array
        // See the full list at https://arcjet.com/bot-list
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        "CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
      ],
    }),

    // 5:23:52 Algorithm for rate limiting: Create a token bucket rate limit. Other algorithms are supported.
    slidingWindow({
      mode: "LIVE",
      interval: "2s", // Refill every 2 seconds
      max: 5, // Allow 5 requests per interval
    }),
  ],
});

export default aj; //we should export this instance of arcjet created to use it
                    // within the security.ts 5:34:00
