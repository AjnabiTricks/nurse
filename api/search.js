export default async function handler(req, res) {

  const cnic = req.query.cnic;

  if (!cnic) {
    return res.status(400).send("CNIC required");
  }

  try {

    // Step 1: Get PNMC page
    const getResponse = await fetch(
      "https://online.pnmc.gov.pk/track/nursing-professional",
      {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    const getHTML = await getResponse.text();


    // Extract CSRF Token
    const tokenMatch = getHTML.match(
      /name="csrf-token" content="([^"]+)"/
    );

    const token = tokenMatch
      ? tokenMatch[1]
      : "";


    // Extract Cookie
    const setCookie =
      getResponse.headers.get("set-cookie") || "";


    const cookie = setCookie
      .split(",")
      .map(c => c.split(";")[0])
      .join(";");


    // Step 2: POST Search
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
          "User-Agent": "Mozilla/5.0",
          "Content-Type":
          "application/x-www-form-urlencoded",
          "Cookie": cookie,
          "Referer":
          "https://online.pnmc.gov.pk/track/nursing-professional"
        },
        body: form.toString()
      }
    );


    const result = await postResponse.text();


    // Return raw PNMC response
    res.setHeader(
      "Content-Type",
      "text/html; charset=utf-8"
    );

    res.status(200).send(result);


  } catch (error) {

    res.status(500).send(
      error.message
    );

  }

}
