// take arguments from command line
// to change default values
// index.js -f "inputfile.csv" -o "outputfile.csv"
var argv = require("minimist")(process.argv.slice(2));

// load private mailjet sms token
require("dotenv").config();

// initialise mailjet api connection
const mailjet = require("node-mailjet").connect(process.env.MJ_TOKEN);

// require filestream for csv parsing and output
const fs = require("fs");
const csv = require("csv-parser");
const fastcsv = require("fast-csv");

// post a Sms to customers from file
const postSms = (inputFilePath = "./data.csv") => {
  // create a file read stream that loads the
  // csv that has the customer data
  fs.createReadStream(inputFilePath)
    .pipe(csv())
    .on("data", function (data) {
      try {
        //send a post request to the mailjet api
        const request = mailjet.post("sms-send", { version: "v4" }).request({
          Text: data.name + " " + data.message,
          To: data.number,
          From: "MJPilot",
        });

        request.then((result) => {
          // display the POST/SEND result in the terminal
          console.log(result.body);
          // additional functionality could be to write the output to csv
          // fastcsv.write(theData, { headers: true }).pipe(ws);
        });
      } catch (err) {
        // log any errors to terminal
        // log file would be optimal here
        console.log(err);
      }
    })
    .on("end", function () {
      console.log("Customer data loaded and sending SMS now");
    });
};

const getSms = (outputPath = "./out.csv") => {
  const ws = fs.createWriteStream(outputPath);

  // Ask the api for information on sms sends
  const request = mailjet.get("sms", { version: "v4" }).request();

  request
    .then((result) => {
      let body = JSON.parse(JSON.stringify(result.body.Data));

      console.log(body);
      var resultObj = body
        .filter((obj) => {
          if (obj.Status.Code !== 3) {
            return true; // keep
          }
          return false; // skip
        })
        .map((obj) => {
          statusObj = {
            "Message ID": obj.ID,
            To: obj.To,
            Status: obj.Status.Name,
          };
          return statusObj;
        });
      console.log(resultObj);

      // write the result to csv file
      fastcsv.write(resultObj, { headers: true }).pipe(ws);
    })
    .catch((err) => {
      console.log(err.statusCode);
    });
};

postSms(argv.f);
getSms(argv.o);
