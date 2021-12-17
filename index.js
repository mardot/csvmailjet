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
          To: "+61401728031",
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
  //sms?StatusCode=1,2
  const request = mailjet
    .get("sms", { version: "v4" })
    .request((StatusCode = "1,2"));

  request
    .then((result) => {
      let theData = JSON.parse(JSON.stringify(result.body.Data));
      // map the result to a new list of objects
      // then print the output to a csv file
      let theResult = theData.map((obj) => {
        let theStatus = {};
        theStatus["Message ID"] = obj.ID;
        theStatus["To"] = obj.To;
        theStatus["Status"] = obj.Status.Name;

        return theStatus;
      });
      console.log(theResult);
      fastcsv.write(theResult, { headers: true }).pipe(ws);
    })
    .catch((err) => {
      console.log(err.statusCode);
    });
};

postSms(argv.f);
getSms(argv.o);
