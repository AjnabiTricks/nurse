import * as cheerio from "cheerio";

export default async function handler(req, res) {

  try {

    const cnic = req.query.cnic;

    if (!cnic) {
      return res.status(400).json({
        success:false,
        error:"CNIC required"
      });
    }


    const body = new URLSearchParams();

    body.append(
      "track_nursing_professional[username]",
      cnic
    );

    body.append(
      "track_nursing_professional[search]",
      ""
    );

    // Apne current working token ko yahan rakhein
    body.append(
      "track_nursing_professional[_token]",
      "YOUR_TOKEN_HERE"
    );


    const response = await fetch(
      "https://online.pnmc.gov.pk/track/nursing-professional",
      {
        method:"POST",

        headers:{

          "User-Agent":
          "Mozilla/5.0 (Linux; Android 11)",

          "Content-Type":
          "application/x-www-form-urlencoded",

          // Apni current working cookie yahan rakhein
          "Cookie":
          "YOUR_COOKIE_HERE",

          "X-Requested-With":
          "mark.via.gp",

          "Origin":
          "https://online.pnmc.gov.pk",

          "Referer":
          "https://online.pnmc.gov.pk/track/nursing-professional"
        },

        body:body.toString()
      }
    );


    const html = await response.text();

    const $ = cheerio.load(html);


    let data = {};


    $("table tr").each((i,row)=>{

      const cols = $(row).find("td");

      if(cols.length >= 2){

        const key = $(cols[0])
          .text()
          .replace(/\s+/g," ")
          .trim();

        const value = $(cols[1])
          .text()
          .replace(/\s+/g," ")
          .trim();


        if(key){
          data[key] = value;
        }

      }

    });


    // Photo URL extract
    let photo = null;

    const img = $("img[src*='/uploads/media/']").first();

    if(img.length){

      photo =
      "https://online.pnmc.gov.pk" +
      img.attr("src");

    }


    res.json({

      success:true,

      data:data,

      photo:photo

    });


  } catch(error){

    res.status(500).json({

      success:false,

      error:error.message

    });

  }

}
