const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
//schedule for triger notification
const schedule = require('node-schedule');
const moment = require('moment')

const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());

// socket server and connect 
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.shcob.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        const eventCollections = client.db('EventCollection').collection('events');
        const notificationCollections = client.db('notificationCollection').collection('eventNotifications');

        app.get('/events', async (req, res) => {
            const result = await eventCollections.find().toArray();

            //triger notification before 30 min of exact time and date
            result.map(r => {
                // console.log(r.dateTime)
                if (r.dateTime === new Date()) {
                    const thirtyMinBeforeEvent = moment("2022-08-12T13:11:04.018Z").subtract(30, 'm').toString();
                    console.log(thirtyMinBeforeEvent)
                    // schedule.scheduleJob('eventNotification', thirtyMinBeforeEvent, async () => {
                    //     console.log('before 30 min',)
                    //     const query = {
                    //         notification: `Your ${r.eventName} is after 30 min.`
                    //     }
                    //     const notificationResult = await notificationCollections.insertOne(query);
                    //     console.log(notificationResult)
                    // })
                }

            })
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

// socket apis 
io.on('connection', (socket) => {
    socket.emit('connectId', socket.id)
})



app.get('/', (req, res) => {
    res.send('Breeze Time Server Running')
});

app.listen(port, () => {
    console.log('Listening the port', port)
})