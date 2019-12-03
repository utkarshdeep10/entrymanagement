// Including packages and libraries
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const Nexmo = require("nexmo");

const app = express();

// User Schema Model
const userSchema = new mongoose.Schema({
    visitorname: String,
    visitoremail: String,
    visitorphone: String,
    hostname: String,
    hostemail: String,
    hostphone: String,
    checkIn: String,
    checkOut: String
});
const User = mongoose.model("User", userSchema);


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Mongoose Connect
mongoose.connect('mongodb://localhost/entryManagementData', {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);

// Initializing NEXMO for sms
const nexmo = new Nexmo({
	apiKey: 'YOUR_API_KEY',
	apiSecret: 'YOUR_API_SECRET'
}, {
	debug: true
})

app.get('/', (req, res) => {
    res.render('main.ejs');
});

// POST Request when user checks in
app.post('/checkedIn', (req, res) => {
    User.create({
       visitorname: req.body.visitorname,
       visitoremail: req.body.visitoremail,
       visitorphone: req.body.visitorphone,
       hostname: req.body.hostname,
       hostemail: req.body.hostemail,
       hostphone: req.body.hostphone,
       checkIn: new Date().toLocaleTimeString() + ' , ' + new Date().toDateString(),
       checkOut: ''
    });
    
    const smsOutput = "The details of your reservation are : - \n" +
					"Name : " + req.body.visitorname + "\n" +
					"Email : " + req.body.visitoremail + "\n" +
					"Phone : " + req.body.visitorphone;
    
    nexmo.message.sendSms("NEXMO", req.body.hostphone, smsOutput, {type: 'unicode'}, (err, response) => {
        if(err) console.log(err)
		else{
			console.log("Message sent")
			console.log(response);
		}
    });
    
    const output = `
        <p>You have got a new visitor.</p>
        <h3>Visitor Details: </h3>
        <ul>  
        <li>Name: ${req.body.visitorname}</li>
        <li>Email: ${req.body.visitoremail}</li>
        <li>Phone: ${req.body.visitorphone}</li>
        </ul>`;

    let transporter = nodemailer.createTransport(smtpTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
          user: 'YOUR_GMAIL_ADDRESS',
          pass: 'YOUR_PASSWORD'
        }
    }));

  // setup email data with unicode symbols
    let mailOptions = {
      from: '"Entry Management App" YOUR_GMAIL_ADDRESS', // sender address
      to: JSON.stringify(req.body.hostemail), // list of receivers
      subject: 'New Visitor Update', // Subject line
      html: output // html body
    };

  // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);   
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        res.redirect("/checkedIn");
    }); 
});

app.get('/checkedIn', (req, res) => {
    User.findOne().sort({_id: -1}).limit(1).exec((err, data) => {
        res.render('checkout.ejs', {data : data});
    })
});

app.post("/checkOut/:id/", (req,res) => {
    
    // Checkout Time Entry Update when user checks out
    User.findByIdAndUpdate(req.params.id, {checkOut: new Date().toLocaleTimeString() + ' , ' + new Date().toDateString()}, () => {});
    
    // Sending mail to visitor after checkout
    User.findOne({_id: req.params.id}, (err, data) => {
        const output = `
        <p>Thank You for visiting us</p>
        <h3>Visit Details: </h3>
        <ul>  
        <li>Name: ${data.hostname}</li>
        <li>Email: ${data.hostemail}</li>
        <li>Phone: ${data.hostphone}</li>
        <li>Check-in Time: ${data.checkIn}</li>
        <li>Check-out Time: ${data.checkOut}</li>
        </ul>`;

    let transporter = nodemailer.createTransport(smtpTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
          user: 'YOUR_GMAIL_ADDRESS',
          pass: 'YOUR_PASSWORD'
        }
      }));

  // setup email data with unicode symbols
    let mailOptions = {
      from: '"Entry Management App" YOUR_GMAIL_ADDRESS', // sender address
      to: data.visitoremail, // list of receivers
      subject: 'Your Visit Details', // Subject line
      html: output // html body
    };

  // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);   
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        res.redirect("/");
    });
    });
});

app.listen(3000, () => {
    console.log('Server Started at 3000');
});