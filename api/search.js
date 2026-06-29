import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {

  let { cnic } = req.query;

  if (!cnic) {
    return res.json({ success: false, message: "CNIC required" });
  }

  cnic = cnic.replace(/-/g, "");

  try {

    // 1️⃣ GET PAGE
    const page = await axios.get(
      "https://online.pnmc.gov.pk/track/nursing-professional"
    );

    const cookies = page.headers["set-cookie"] || [];

    const csrf = page.data.match(
      /name="csrf-token" content="(.*?)"/
    )?.[1];

    // 🔥 DEBUG LINE ADDED (IMPORTANT)
    console.log("CSRF:", csrf);
    console.log("Cookies:", cookies);

    // 2️⃣ POST REQUEST
    const post = await axios.post(
      "https://online.pnmc.gov.pk/track/nursing-professional",
      new URLSearchParams({
        "track_nursing_professional[username]": cnic,
        "track_nursing_professional[search]": "",
        "track_nursing_professional[_token]": csrf
      }),
      {
        headers: {
          "Cookie": cookies.join("; "),
          "User-Agent": "Mozilla/5.0",
          "Content-Type": "application/x-www-form-urlencoded",
          "Referer": "https://online.pnmc.gov.pk/track/nursing-professional"
        }
      }
    );

    // 🔥 DEBUG LINE (MOST IMPORTANT)
    console.log("HTML LENGTH:", post.data.length);
    console.log("HTML SAMPLE:", post.data.substring(0, 800));

    const $ = cheerio.load(post.data);

    const data = {};

    $("tr").each((i, el) => {
      const key = $(el).find("td").first().text().trim();
      const val = $(el).find("td").last().text().trim();

      if (key && val) {
        data[key] = val;
      }
    });

    let photo = null;

    $("img").each((i, el) => {
      const src = $(el).attr("src");
      if (src && src.includes("uploads")) {
        photo = "https://online.pnmc.gov.pk" + src;
      }
    });

    // 🔥 FINAL CHECK (NULL ERROR SOLVER)
    if (Object.keys(data).length === 0) {
      return res.json({
        success: false,
        message: "No data found in response (request failed or blocked)",
        debug_html: post.data.substring(0, 1000)
      });
    }

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
