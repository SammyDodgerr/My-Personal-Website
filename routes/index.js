const express = require("express");
const router = express.Router();

router.get('/', function(req, res) {
  console.log('Request for home recieved');
  res.render('home');
});

router.get('/biography', function(req, res) {
  console.log('Request for biography page recieved');
  res.render('biography');
});

router.get('/contactme', function(req, res) {
  console.log('Request for contact page recieved');
  res.render('contactme');
});

// Security Exercise Pages //
router.get('/login', function(req, res) {
  console.log('Request for login page recieved');
  res.render('login');
});

router.get('/register', function(req, res) {
  console.log('Request for register page recieved');
  res.render('register');
});

module.exports = router;
