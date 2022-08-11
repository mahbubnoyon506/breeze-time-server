const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');       //for jwt//
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.shcob.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// verify jwt 

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({message: 'Unauthorized access denied!'});
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if (err) {
            return res.status(403).send({message:'Forbidden access'})
        }
        req.decoded = decoded;
        next();
    });
}

// verify jwt 

async function run() {
    try {

        const eventCollections = client.db('EventCollection').collection('events');
        const userCollections = client.db('userCollection').collection('users');

        app.get('/events', async (req, res) => {
            const result = await eventCollections.find().toArray();
            res.send(result)
        })


        // for jwt 

        app.get('/users', verifyJWT, async (req, res) => {
            const result = await userCollections.find().toArray();
            const decodedEmail = req.decoded.email;
            if (user === decodedEmail) {
                return res.send(result);
            }
            else{
                return res.status(403).send({message: 'Forbidden access!'});
            }
        })

        app.post('/users', async (req, res) => {
            const users = req.body;
            const query = {
                userName: users.userName,
                userEmail: users.email
            }
            const results = await userCollections.insertOne(query);
            res.send(results);
        })

        app.put('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requestAccount = await userCollections.findOne({email: requester});
            if (requestAccount.role === 'admin') {
                const filter = { email: email };
            const updateDoc = {
                $set: {role: 'admin'},
            };
            const result = await userCollections.updateOne(filter, updateDoc);
            res.send(result);
            }
            else {
                res.status(403).send({message: 'Forbidden access!'});
            }
        })

        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollections.updateOne(filter, updateDoc, options);
            const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '30d'})
            res.send({result, token});
        })
        // for jwt 

        app.get('/events', async (req, res) => {
            const result = await eventCollections.find().toArray();
            res.send(result)
        })


        app.post('/events', async (req, res) => {
            const events = req.body;
            const query = {
                eventName: events.eventName,
                eventType: events.event,
                description: events.description,
                dateTime: events.dateTime
            }
            const results = await eventCollections.insertOne(query);
            res.send(results);
        })

        app.delete('/event/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await eventCollections.deleteOne(query);
            res.send(result);
        })

        app.put('/event/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    eventName: data.eventName,
                    eventType: data.event,
                    description: data.description,
                    dateTime: data.dateTime
                },
            };
            const result = await eventCollections.updateOne(query, updateDoc, options);
            res.send(result);
        })

    } finally {

    }
}
run().catch(console.dir)


app.get('/', (req, res) => {
    res.send('Breeze Time Server Running')
});

app.listen(port, () => {
    console.log('Listening the port', port)
})