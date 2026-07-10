export default async function handler(req, res) {

  try {

    const cnic = req.query.cnic || "17301-1348281-0";


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
      "AFJ5AX5M5gaOO2DAq9jz--_q6TkbcusHrNeCuxst8xg"
    );


    const response = await fetch(
      "https://online.pnmc.gov.pk/track/nursing-professional",
      {
        method:"POST",

        headers:{
          "User-Agent":
          "Mozilla/5.0 (Linux; Android 11; RMX2103 Build/RKQ1.201217.002) AppleWebKit/537.36 Chrome/149.0.7827.160 Mobile Safari/537.36",

          "Content-Type":
          "application/x-www-form-urlencoded",

          "Cookie":
          "PHPSESSID=f4fde2all3d866lo2nfn04gjp4; _gid=GA1.3.1491353095.1783684000",

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


    res.setHeader(
      "content-type",
      "text/html"
    );

    res.send(html);


  } catch(error){

    res.status(500).send(error.message);

  }

}
