import * as cheerio from "cheerio";

export default async function handler(req, res) {

  const cnic = req.query.cnic;

  if (!cnic) {
    return res.status(400).json({
      error: "CNIC required"
    });
  }

  try {

    const getResponse = await fetch(
      "https://online.pnmc.gov.pk/track/nursing-professional",
      {
        headers:{
          "User-Agent":"Mozilla/5.0",
          "Accept":"text/html"
        }
      }
    );


    const getHTML = await getResponse.text();

    const $ = cheerio.load(getHTML);

    const token = $('meta[name="csrf-token"]').attr("content");


    // Extract only cookies
    const rawCookies = getResponse.headers.getSetCookie
      ? getResponse.headers.getSetCookie()
      : [];


    const cookie = rawCookies
      .map(c => c.split(";")[0])
      .join("; ");



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
        method:"POST",
        headers:{
          "User-Agent":"Mozilla/5.0",
          "Content-Type":
          "application/x-www-form-urlencoded",
          "Cookie":cookie,
          "Referer":
          "https://online.pnmc.gov.pk/track/nursing-professional"
        },
        body:form.toString()
      }
    );


    const html = await postResponse.text();


    return res.json({
      success:true,
      cookie_used:cookie ? true:false,
      response_length:html.length,
      has_name:html.includes("Full Name"),
      preview:html.substring(html.indexOf("Full Name")-200, html.indexOf("Full Name")+500)
    });


  } catch(e){

    return res.status(500).json({
      error:e.message
    });

  }

      }
