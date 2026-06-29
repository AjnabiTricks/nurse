import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {

  let { cnic } = req.query;

  if (!cnic) {
    return res.json({ success: false, message: "CNIC required" });
  }

  cnic = cnic.replace(/-/g, "");

  try {

    // 1️⃣ GET PAGE (SESSION + CSRF)
    const page = await axios.get(
      "https://online.pnmc.gov.pk/track/nursing-professional",
      {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    const cookies = page.headers["set-cookie"] || [];

    const csrf =
      page.data.match(/name="csrf-token" content="(.*?)"/)?.[1] || "";

    // 🔥 DEBUG (important)
    console.log("CSRF:", csrf);

    // 2️⃣ POST REQUEST (SEARCH)
    const post = await axios.post(
      "https://online.pnmc.gov.pk/track/nursing-professional",
      new URLSearchParams({
        "track_nursing_professional[username]": cnic,
        "track_nursing_professional[search]": "",
        "track_nursing_professional[_token]": csrf
      }),
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Content-Type": "application/x-www-form-urlencoded",
          "Cookie": cookies.join("; "),
          "Referer": "https://online.pnmc.gov.pk/track/nursing-professional"
        }
      }
    );

    const html = post.data;

    // 🔥 DEBUG OUTPUT (VERY IMPORTANT)
    console.log("HTML LENGTH:", html.length);
    console.log("HTML SAMPLE:", html.substring(0, 500));

    const $ = cheerio.load(html);

    const data = {};

    $("tr").each((i, el) => {
      const key = $(el).find("td").first().text().trim();
      const value = $(el).find("td").last().text().trim();

      if (key && value) {
        data[key] = value;
      }
    });

    let photo = null;

    $("img").each((i, el) => {
      const src = $(el).attr("src");
      if (src && src.includes("uploads")) {
        photo = "https://online.pnmc.gov.pk" + src;
      }
    });

    // 🔥 FINAL SMART CHECK (NO NULL RESPONSE)
    if (Object.keys(data).length === 0) {

      return res.json({
        success: false,
        message: "No data extracted - server did not return result page",
        debug: {
          csrf_used: csrf,
          html_preview: html.substring(0, 800)
        }
      });
    }

    // ✔ SUCCESS RESPONSE
    return res.json({
      success: true,
      data: {
        full_name: data["Full Name"] || "N/A",
        cnic: data["NIC Number"] || "N/A",
        registration_number: data["Registration Number"] || "N/A",
        category: data["Registration Category"] || "N/A",
        license_expiry: data["License Expiration Date"] || "N/A",
        photo: photo || "N/A"
      }
    });

  } catch (err) {
    return res.json({
      success: false,
      error: err.message
    });
  }
}
