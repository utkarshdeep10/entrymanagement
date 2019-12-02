const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');

const app = express();

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

mongoose.connect('mongodb://localhost/userData3', {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);

app.get('/', (req, res) => {
    res.render('main.ejs');
});

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
          user: 'entrymanagementapp@gmail.com',
          pass: 'pAssWord3'
        }
      }));

  // setup email data with unicode symbols
    let mailOptions = {
      from: '"Entry Management App" entrymanagementapp@gmail.com', // sender address
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
    User.findByIdAndUpdate(req.params.id, {checkOut: new Date().toLocaleTimeString() + ' , ' + new Date().toDateString()}, () => {});
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
          user: 'entrymanagementapp@gmail.com',
          pass: 'pAssWord3'
        }
      }));

  // setup email data with unicode symbols
    let mailOptions = {
      from: '"Entry Management App" entrymanagementapp@gmail.com', // sender address
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