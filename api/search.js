import axios from "axios";

export default async function handler(req, res) {

  let { cnic } = req.query;

  if (!cnic) {
    return res.status(400).json({
      success: false,
      message: "CNIC required"
    });
  }

  try {

    const page = await axios.get(
      "https://online.pnmc.gov.pk/track/nursing-professional"
    );

    const cookies = page.headers["set-cookie"] || [];

    const csrf = page.data.match(
      /name="csrf-token" content="(.*?)"/
    )?.[1];

    cnic = cnic.replace(/-/g, "");

    const response = await axios.post(
      "https://online.pnmc.gov.pk/track/nursing-professional",
      new URLSearchParams({
        "track_nursing_professional[username]": cnic,
        "track_nursing_professional[search]": "",
        "track_nursing_professional[_token]": csrf
      }),
      {
        headers: {
          "Cookie": cookies.join("; "),
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://online.pnmc.gov.pk/track/nursing-professional"
        }
      }
    );

    const html = response.data;

    const getValue = (label) => {
      const r = new RegExp(`${label}<\\/td>\\s*<td>(.*?)<\\/td>`, "i");
      return html.match(r)?.[1]?.trim() || null;
    };

    const img = html.match(/<img[^>]+src="([^"]+)"/i);

    return res.json({
      success: true,
      data: {
        full_name: getValue("Full Name"),
        cnic: getValue("NIC Number"),
        registration_number: getValue("Registration Number"),
        category: getValue("Registration Category"),
        license_expiry: getValue("License Expiration Date"),
        photo: img ? "https://online.pnmc.gov.pk" + img[1] : null
      }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
      }
