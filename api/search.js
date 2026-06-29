import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {

  let { cnic } = req.query;

  if (!cnic) {
    return res.status(400).json({ success: false, message: "CNIC required" });
  }

  try {

    // 1️⃣ GET PAGE (cookie + csrf)
    const page = await axios.get(
      "https://online.pnmc.gov.pk/track/nursing-professional"
    );

    const cookies = page.headers["set-cookie"] || [];

    const csrf = page.data.match(
      /name="csrf-token" content="(.*?)"/
    )?.[1];

    // 2️⃣ CLEAN CNIC
    cnic = cnic.replace(/-/g, "");

    // 3️⃣ POST REQUEST
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

    // 4️⃣ PARSE HTML (REAL FIX)
    const $ = cheerio.load(post.data);

    const getValue = (label) => {
      let value = null;

      $("tr").each((i, el) => {
        const key = $(el).find("td").first().text().trim();
        const val = $(el).find("td").last().text().trim();

        if (key === label) {
          value = val;
        }
      });

      return value;
    };

    // 5️⃣ PHOTO FIX
    let photo = null;
    $("img").each((i, el) => {
      const src = $(el).attr("src");
      if (src && src.includes("uploads")) {
        photo = "https://online.pnmc.gov.pk" + src;
      }
    });

    // 6️⃣ RESPONSE
    return res.json({
      success: true,
      data: {
        full_name: getValue("Full Name"),
        cnic: getValue("NIC Number"),
        registration_number: getValue("Registration Number"),
        category: getValue("Registration Category"),
        license_expiry: getValue("License Expiration Date"),
        photo: photo
      }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
