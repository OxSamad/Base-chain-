import { google } from "googleapis";
import { ethers } from "ethers";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { address, message, signature } = req.body;
    const signerAddr = ethers.verifyMessage(message, signature);
    if (signerAddr.toLowerCase() !== address.toLowerCase())
      return res.status(400).json({ error: "Invalid signature" });

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SA_KEY),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });
    const sheets = google.sheets({ version: "v4", auth });
    const values = [[new Date().toISOString(), address, message, signature]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: process.env.SHEET_RANGE,
      valueInputOption: "RAW",
      requestBody: { values }
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
