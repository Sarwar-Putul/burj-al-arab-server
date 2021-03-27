const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5okrn.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

const port = 5000
const password = process.env.DB_PASS

const app = express()

app.use(cors());
app.use(bodyParser.json());


var serviceAccount = require("./config/burj-al-arab-e2295-firebase-adminsdk-rohv3-9d981185dc.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burjAlArab").collection("bookings");
  // perform actions on the collection object
  console.log("Database connection established")

        app.post("/addBooking", (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
        .then(result => {
        res.send(result.insertedCount > 0)
        })
        // console.log(newBooking);
    })

    app.get('/bookings', (req, res) => {
      const bearer = req.headers.authorization; 
      if(bearer && bearer.startsWith('Bearer ')){
        const idToken = bearer.split(' ')[1];
            // console.log({idToken});
        // idToken comes from the client app
        admin.auth().verifyIdToken(idToken)
          .then((decodedToken) => {
            const tokenEmail = decodedToken.email;
            const queryEmail = req.query.email;
            // console.log(tokenEmail, queryEmail);
            if(tokenEmail == queryEmail) {
              bookings.find({email: req.query.email})
              .toArray((err, documents) => {
                res.status(200).send(documents);
              })
            }
            else{
              res.status(401).send('un-authorized access');
            }  
        })
        .catch((error) => {
          res.status(401).send('un-authorized access');
        });
      }
      else{
          res.status(401).send('un-authorized access');
      }          
    })
});





app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port)