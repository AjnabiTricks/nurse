import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";


export default async function handler(req, res) {

  const cnic = req.query.cnic;

  if (!cnic) {
    return res.status(400).json({
      success:false,
      error:"CNIC required"
    });
  }


  try {

    const jar = new CookieJar();


    const url =
    "https://online.pnmc.gov.pk/track/nursing-professional";


    // 1. GET page
    const getResponse = await fetch(url,{
      headers:{
        "User-Agent":
        "Mozilla/5.0 (Linux; Android 11)"
      }
    });


    const getHTML = await getResponse.text();


    // Save cookies
    const setCookie =
    getResponse.headers.get("set-cookie");


    if (setCookie) {

      const cookies = setCookie.split(",");

      for (const cookie of cookies) {

        await jar.setCookie(
          cookie,
          url
        );

      }
    }


    // Extract CSRF
    const $ = cheerio.load(getHTML);

    const token =
    $('meta[name="csrf-token"]')
    .attr("content");


    if (!token) {
      return res.status(500).json({
        success:false,
        error:"CSRF token not found"
      });
    }


    const cookieHeader =
    await jar.getCookieString(url);



    // 2. POST Search
    const body = new URLSearchParams();

    body.append(
      "track_nursing_professional[username]",
      cnic
    );

    body.append(
      "track_nursing_professional[search]",
      ""
    );

    body.append(
      "track_nursing_professional[_token]",
      token
    );


    const response = await fetch(url,{

      method:"POST",

      headers:{

        "User-Agent":
        "Mozilla/5.0 (Linux; Android 11)",

        "Content-Type":
        "application/x-www-form-urlencoded",

        "Cookie":
        cookieHeader,

        "X-Requested-With":
        "mark.via.gp",

        "Origin":
        "https://online.pnmc.gov.pk",

        "Referer":
        url

      },

      body:body.toString()

    });



    const html =
    await response.text();


    const $$ =
    cheerio.load(html);


    let data={};


    $$("table tr").each((i,row)=>{

      const cols =
      $$(row).find("td");


      if(cols.length >= 2){

        const key =
        $$(cols[0])
        .text()
        .replace(/\s+/g," ")
        .trim();


        const value =
        $$(cols[1])
        .text()
        .replace(/\s+/g," ")
        .trim();


        if(key){
          data[key]=value;
        }

      }

    });



    return res.json({

      success:true,

      data:data,

      token_refreshed:true

    });



  } catch(error){

    return res.status(500).json({

      success:false,

      error:error.message

    });

  }

        }
