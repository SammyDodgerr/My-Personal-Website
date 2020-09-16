//jshint esversion: 6

//                  NODE MODULES REQUIREMENTS
//Requiring node modules we installed on command line
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const https = require("https");

//                  EXPRESS
//storing new instance of express within the constant app
const app = express();

//                  APP USE
//pulling up static entities within our local file system
app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended: true}));

//                  APP GET

// display on the browser at local host 3000
app.get("/biography", function(req, res){
  res.sendFile(__dirname + "/HTML/biography.html");
});

//purpose of app.get? collect information from open weather map API and SEND it to our web application.
app.get("/biography", function (req, res){
  const url= "https://api.openweathermap.org/data/2.5/weather?q=bordeaux&appid=239199c3ce5412affba37b848d40b851&units=metric"

  https.get(url, function(response){
    console.log(response);

    response.on("data", function (data){
      const weatherData = JSON.parse(data)
      const temp = weatherData.main.temp
      const weatherDescription = weatherData.weather[0].description
      const icon = weatherData.weather[0].icon
      const imageURL = "http://openweathermap.org/img/wn/" + icon + "@2x.png"
      res.write("<p>The weather is currently " + weatherDescription + ".<p>");
      res.write("<h1>The temparature in Bordeaux is " + temp + " degrees celcius.</h1>");
      res.write("<img src=" + imageURL + ">");
      res.send();
    })
  })
  })
});

//Redirecting one to the contact me page
app.post("/biography", function (req, res){
  res.redirect("/contactme");
});

// Tune into port 3000
app.listen(3000, function() {
  console.log("Server is up and running");
});
