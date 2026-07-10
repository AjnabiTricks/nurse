import * as cheerio from "cheerio";

export default async function handler(req, res) {

  const cnic = req.query.cnic;

  if (!cnic) {
    return res.status(400).json({
      error: "CNIC required"
    });
  }

  try {

    // 1. Get page (CSRF + Cookie)
    const getResponse = await fetch(
      "https://online.pnmc.gov.pk/track/nursing-professional",
      {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    const getHTML = await getResponse.text();

    const $ = cheerio.load(getHTML);

    const token = $('meta[name="csrf-token"]').attr("content");

    const cookie = getResponse.headers.get("set-cookie");


    if (!token) {
      return res.status(500).json({
        error: "CSRF token missing"
      });
    }


    // 2. POST Search
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


    const postResponse = await fetch(
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


    const postHTML = await postResponse.text();


    const $$ = cheerio.load(postHTML);


    let data = {};


    $$("table tr").each((index, row)=>{

      const columns = $$(row).find("td");

      if(columns.length >= 2){

        const key = $$(columns[0])
          .text()
          .replace(/\s+/g," ")
          .trim();

        const value = $$(columns[1])
          .text()
          .replace(/\s+/g," ")
          .trim();


        if(key){
          data[key] = value;
        }

      }

    });


    return res.json({
      success:true,
      data:data
    });


  } catch(error){

    return res.status(500).json({
      error:error.message
    });

  }

                       }
