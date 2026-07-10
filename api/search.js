import * as cheerio from "cheerio";

export default async function handler(req, res) {

  const cnic = req.query.cnic;

  if (!cnic) {
    return res.status(400).json({
      success: false,
      error: "CNIC required"
    });
  }

  try {

    // 1. Create Session + Get Token
    const getResponse = await fetch(
      "https://online.pnmc.gov.pk/track/nursing-professional",
      {
        headers: {
          "User-Agent":
          "Mozilla/5.0 (Linux; Android 11)"
        }
      }
    );


    const getHTML = await getResponse.text();

    const $ = cheerio.load(getHTML);


    const token = $('meta[name="csrf-token"]')
      .attr("content");


    const cookies = getResponse.headers.get(
      "set-cookie"
    );


    if (!token || !cookies) {

      return res.status(500).json({
        success:false,
        error:"Session or token not received"
      });

    }


    const cookie = cookies
      .split(",")
      .map(x=>x.split(";")[0])
      .join("; ");



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
        method:"POST",

        headers:{
          "User-Agent":
          "Mozilla/5.0 (Linux; Android 11)",

          "Content-Type":
          "application/x-www-form-urlencoded",

          "Cookie":cookie,

          "X-Requested-With":
          "mark.via.gp",

          "Origin":
          "https://online.pnmc.gov.pk",

          "Referer":
          "https://online.pnmc.gov.pk/track/nursing-professional"
        },

        body:form.toString()
      }
    );


    const html = await postResponse.text();


    // 3. Parse Full Table

    const $$ = cheerio.load(html);


    let data = {};


    $$("table tr").each((i,row)=>{

      const cols = $$(row).find("td");


      if(cols.length >= 2){

        const key = $$(cols[0])
          .text()
          .replace(/\s+/g," ")
          .trim();


        const value = $$(cols[1])
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

      data:data,

      timestamp:new Date().toISOString()

    });


  } catch(error){

    return res.status(500).json({

      success:false,

      error:error.message

    });

  }

}
