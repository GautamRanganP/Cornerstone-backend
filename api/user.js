import { get } from "@vercel/blob";
import readline from "readline";
 
export default async function handler(req, res) {
  try {
    // 1️⃣ Read userId from query
    const { userId } = req.query;
 
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );
 
    // 3️⃣ Read JSONL file from Vercel Blob
    const blob = await get("users.jsonl"); // uploaded earlier
    const stream = blob.stream();
 
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity
    });
 
    // 4️⃣ Filter records for this userId
    const result = [];
 
    for await (const line of rl) {
      if (!line) continue;
 
      let record;
      try {
        record = JSON.parse(line);
      } catch {
        continue; // skip bad lines safely
      }
 
      if (record.userId === userId) {
        result.push(record);
      }
    }
 
    // 5️⃣ Send response
    return res.status(200).json({
      userId,
      count: result.length,
      data: result
    });
 
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
