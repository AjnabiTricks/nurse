import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {

  let { cnic } = req.query;

  if (!cnic) {
    return res.json({
      success: false,
      message: "CNIC required"
    });
  }

  cnic = cnic.replace(/-/g, "");

  try {

    // 1️⃣ Load page (session + CSRF)
    const page = await axios.get(
      "https://online.pnmc.gov.pk/track/nursing-professional",
      {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    const cookies = page.headers["set-cookie"] || [];

    const csrf = page.data.match(
      /name="csrf-token" content="(.*?)"/
    )?.[1] || "";

    // 2️⃣ Submit search
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

    // 🔥 DEBUG CHECK (important for your case)
    if (!html.includes("Full Name")) {
      return res.json({
        success: false,
        message: "No result page returned (wrong request flow)",
        debug_preview: html.substring(0, 1000)
      });
    }

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

    return res.json({
      success: true,
      data: {
        full_name: data["Full Name"] || null,
        cnic: data["NIC Number"] || null,
        registration_number: data["Registration Number"] || null,
        category: data["Registration Category"] || null,
        license_expiry: data["License Expiration Date"] || null,
        photo
      }
    });

  } catch (err) {
    return res.json({
      success: false,
      error: err.message
    });
  }
}
