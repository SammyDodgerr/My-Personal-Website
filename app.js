//jshint esversion: 6

//                  NODE MODULES REQUIREMENTS

//Requiring node modules we installed on command line
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const https = require("https");
const ejs = require("ejs");
const path = require("path");
const routes = require("./routes");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const _ = require("lodash");


//                  EXPRESS

//storing new instance of express within the constant app
const app = express();

//for the purpose of ejs.
app.set('view engine', 'ejs');

// Set the default views directory to html folder, defines the directory where to look for view files.
app.set('views', path.join(__dirname, 'html'));

//                 SETTING THE FILE PATHS FOR LINKS/IMAGES
// Set the folder for css
app.use(express.static(path.join(__dirname, 'css')));
// Set the folder for Logo
app.use(express.static(path.join(__dirname, 'Logo')));
//Set the folder for Drawings
app.use(express.static(path.join(__dirname, 'Drawings')));
//Set the folder for Photos
app.use(express.static(path.join(__dirname, 'Photos')));
//Set the folder for Favicons
app.use(express.static(path.join(__dirname, 'Favicons')));
//Set the folder for Node Modules
app.use(express.static(path.join(__dirname, 'node_modules')));



//use the index.js in the routes folder to make web application multi page.
app.use('/', routes);

//getting our express- (stored in the const- app). to use body parser.
app.use(bodyParser.urlencoded({
  extended: true
}));

//                                         SECURITY SEGMENT PART 1
app.use(session({
  secret: "Our little secrets.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//                                          MONGO /MONGOOSE

//connect to MongoDB database
mongoose.connect("mongodb://localhost:27017/personalWebsiteDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true);

//                                        SECURITY SEGMENT PART 2

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/secrets", function(req, res) {
  User.find({"secret": {$ne: null}}, function (err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        res.render("secrets", {usersWithSecrets : foundUser});
      }
    }
  });
});

app.get('/submit', function(req, res) {
  if(req.isAuthenticated()){
    res.render("submit");
  } else {
  res.redirect("/login");
  }
});

app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;

  User.findById(req.user.id, function (err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.get("/logout", function (req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res) {

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function(req, res) {

  const user = new User ({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err){
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});

//                                      LIST SEGMENT

//schema with 1 field called schema
const itemsSchema = {
  name: String
};

//model based upon itemsSchema
const Item = mongoose.model("Item", itemsSchema);

//creating items (documents)
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

//creating array- entity to represent 3 documents (records/ rows) for the insertMany method
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

//insertMany - specify we want to insert our 3 'item' documents (records/rows)
//into the Items collection (table)- it will be pluralised in the mongo shell command line.


app.get("/list", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/list");
    } else {
      res.render('list', {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });

});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show an existing list

        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        })
      }
    }
  });

});

app.post("/list", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/list");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/list", listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/list");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }


});

//                                         MAILCHIMP


//purpose of app.post? collect information from inputs and SEND it to the mailchimp servers.
app.post("/contactme", function(req, res) {
  // why do these 3 const below pick up the input data?
  //answer: attributes in the form within the html.
  //action="/contactme"- method="post" in conjunction mean input info = posted to contactme.js
  const firstName = req.body.fName;
  const lastName = req.body.lName;
  const email = req.body.email;

  // Const for data we will be sending to the Mailchimp server.
  const data = {
    //below we are adding key value pairs mailchimp will recognise. (within the overall const data = {} Javascript object).
    //body parameters - key called members- memebers = array of objects, each representing a member we want to subscribe
    members: [{
      //value of the email key pair, got from the body request
      email_address: email,
      //status key value pair can have 4 possible values:
      //1. subscribed 2. unsubscribed 3. cleaned 4. pending
      //I'm choosing subscribe- only want to subscribe members.
      status: "subscribed",
      merge_fields: {
        FNAME: firstName,
        LNAME: lastName,
      }
    }]
  };

  //need to changed the const data object we want to post as a JSON to Mailchimp.
  //Const below 'flat-packs' const data (passes in data) so turns data into a string that is in the format of a JSON.
  const jsonData = JSON.stringify(data);

  //url- coming from main mailchimp endpoint. (from api documentation, with list ID afterwards).
  //url - us2 rather than usX- API Key after the word us- Mailchimp = several servers- need to line up.
  //lists/{list_ID} documentation states- post- (to subscribe some members- POST/ lists / {list_ID})
  //{list_ID}- because in Mailchimp can have multiple lists- have to tell Mailchimp which list to subscribe Mailchimp users into.
  const url = "https://us2.api.mailchimp.com/3.0/lists/process.env.MAILCHIMP_LIST_ID";

  //const options- JavaScript object.
  const options = {
    method: "POST",
    // to ensure the post request goes through successfully, need to provide some form of authentication.
    // how to use API Mailchimp website= (GET started, authentication methods)
    // can use any string- username, API key as the password in the key value pair format.
    // something called auth- allows us to do this basic authentication. then specify with string "".
    auth: "tristan1:process.env.MAILCHIMP_API_KEY"
  }

  // https to post data to the external resource. Using the https module we installed at this top of this js file.
  // hence https.request function- in addition to url- to make request to, can also specify some options.
  // NOTE: url will be determined from const url above, options by options const above.
  // Callback - going to give us a response from the mailchimp server.
  // const called request- (so as not to confuse with req's in app.post)
  const request = https.request(url, options, function(response) {
    //if - else statement.
    //if successful- (i.e. Mailchimp sends back code 200, send success page)
    if (response.statusCode === 200) {
      res.render("success");
      //if the code wasn't 200, going to send them to the failure page.
    } else {
      res.render("failure");
    }

  });

  //Made our request, but no where have we specified what it is we want to send to mailchimp.
  //we want to send our JSON data!!!, ORIGINALLY coming from const data

  // documentation (for the request method- https.request(url, options, function (response)) )
  // shows the we have to SAVE this https.request in const = request.

  //later on we can use that constant request to send things over to the mailchimp server.
  //can call request.write- inside pass the JSON DATA to the mailchimp server.
  request.write(jsonData);
  // to specify we are done with the request- call request.end
  request.end();

});

//Redirecting one to the contact me page from the failure page
app.post("/failure", function(req, res) {
  res.redirect("/contactme");
});

// Tune into port 3000
app.listen(3000, function() {
  console.log("Server is up and running");
});
