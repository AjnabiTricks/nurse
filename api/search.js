import * as cheerio from "cheerio";

export default async function handler(req, res) {

  const cnic = req.query.cnic;

  if (!cnic) {
    return res.status(400).json({
      error: "CNIC required"
    });
  }

  try {

    // GET page
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


    // POST request
    const response = await fetch(
      "https://online.pnmc.gov.pk/track/nursing-professional",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cookie": cookie || "",
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://online.pnmc.gov.pk/track/nursing-professional"
        },
        body: form.toString()
      }
    );


    const result = await response.text();


    // Debug response
    return res.json({
      success: true,
      length: result.length,
      html: result.substring(0,3000)
    });


  } catch (error) {

    return res.status(500).json({
      error: error.message
    });

  }

}
