import * as cheerio from "cheerio";

export default async function handler(req,res){

try{

let cnic=req.query.cnic;

if(!cnic){
return res.status(400).json({
success:false,
error:"CNIC required"
});
}


cnic=cnic.replace(/-/g,"");

if(cnic.length===13){
cnic =
cnic.substring(0,5)+"-"+
cnic.substring(5,12)+"-"+
cnic.substring(12);
}


// 1. GET fresh session

const session = await fetch(
"https://online.pnmc.gov.pk/track/nursing-professional",
{
headers:{
"User-Agent":"Mozilla/5.0 (Linux; Android 11)"
}
});


const page = await session.text();


// Get cookies

const cookies =
session.headers.get("set-cookie");


// Get token

const $ = cheerio.load(page);

const token =
$("input[name='track_nursing_professional[_token]']")
.val();


if(!token){
throw new Error("Token not found");
}



// 2. POST request

const body=new URLSearchParams();

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



const response = await fetch(
"https://online.pnmc.gov.pk/track/nursing-professional",
{
method:"POST",

headers:{
"User-Agent":"Mozilla/5.0 (Linux; Android 11)",

"Content-Type":
"application/x-www-form-urlencoded",

"Cookie":cookies,

"Origin":
"https://online.pnmc.gov.pk",

"Referer":
"https://online.pnmc.gov.pk/track/nursing-professional"
},

body:body.toString()

});


const html=await response.text();

const $$=cheerio.load(html);


let data={};


$$("table tr").each((i,row)=>{

const cols=$$(row).find("td");

if(cols.length>=2){

let key=$$(cols[0])
.text()
.replace(/\s+/g," ")
.trim();

let value=$$(cols[1])
.text()
.replace(/\s+/g," ")
.trim();


if(key){
data[key]=value;
}

}

});



let photo=null;

const img=$$("img[src*='/uploads/media/']")
.first();


if(img.length){

photo=
"https://online.pnmc.gov.pk"+
img.attr("src");

}



res.json({
success:true,
data:data,
photo:photo
});


}catch(error){

res.status(500).json({
success:false,
error:error.message
});

}

}
