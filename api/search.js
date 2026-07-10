import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {

  const cnic = req.query.cnic || req.body?.cnic;

  if (!cnic) {
    return res.status(400).json({
      error: "CNIC required"
    });
  }

  try {

    // Get page for CSRF token + session
    const page = await fetch(
      "https://online.pnmc.gov.pk/track/nursing-professional",
      {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    const html = await page.text();

    const $ = cheerio.load(html);

    const token = $('meta[name="csrf-token"]').attr("content");

    const cookie = page.headers.get("set-cookie");


    if (!token) {
      return res.status(500).json({
        error: "Token not found"
      });
    }


    // POST request
    const form = new URLSearchParams();

    form.append(
      "track_nursing_professional[username]",
      cnic
    );

    form.append(
      "track_nursing_professional[search]",
      ""
    );

    form.append(
      "track_nursing_professional[_token]",
      token
    );


    const response = await fetch(
      "https://online.pnmc.gov.pk/track/nursing-professional",
      {
        method: "POST",
        headers: {
          "Content-Type":
          "application/x-www-form-urlencoded",

          "Cookie": cookie || "",

          "User-Agent":
          "Mozilla/5.0"
        },
        body: form
      }
    );


    const result = await response.text();

    const $$ = cheerio.load(result);


    let data = {};


    $$("table tr").each((i, row)=>{

      const cols = $$(row).find("td");

      if(cols.length >= 2){

        const key = $$(cols[0])
          .text()
          .trim();

        const value = $$(cols[1])
          .text()
          .trim();

        data[key] = value;

      }

    });


    return res.json({
      success: true,
      data: data
    });


  } catch(error){

    return res.status(500).json({
      error: error.message
    });

  }

}      "https://online.pnmc.gov.pk/track/nursing-professional",
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
