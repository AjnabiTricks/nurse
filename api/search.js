import * as cheerio from "cheerio";

export default async function handler(req, res) {

  const cnic = req.query.cnic;

  if (!cnic) {
    return res.status(400).json({
      error: "CNIC required"
    });
  }

  try {

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
        error: "CSRF token not found"
      });
    }


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
          "Content-Type": "application/x-www-form-urlencoded",
          "Cookie": cookie || "",
          "User-Agent": "Mozilla/5.0"
        },
        body: form.toString()
      }
    );


    const result = await response.text();

    const $$ = cheerio.load(result);

    let data = {};


    $$("table tr").each((i, row) => {

      const cols = $$(row).find("td");

      if (cols.length >= 2) {

        const key = $$(cols[0]).text().trim();
        const value = $$(cols[1]).text().trim();

        data[key] = value;

      }

    });


    return res.json({
      success: true,
      data
    });


  } catch (error) {

    return res.status(500).json({
      error: error.message
    });

  }

}
