const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

//test request
app.get("/", (req, res) => {
  res.send("task management app server is start");
});

// database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t4uwg.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// verify token
const verifyToken = (req, res, next) => {
  const authHeaders = req.headers.authorization;

  if (!authHeaders) {
    return res.status(401).send("unauthorized access");
  }

  const token = authHeaders.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send("forbidden");
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  const mediaTaskCollection = client
    .db("taskManagement")
    .collection("mediaTask");
  const dailyTaskCollection = client
    .db("taskManagement")
    .collection("dailyTask");
  const usersCollection = client.db("taskManagement").collection("users");
  try {
    // create jwt
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.find(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1d",
        });
        return res.send({ access_token: token });
      }
      res.status(403).send({ access_token: "" });
    });

    // users
    app.post("/users", async (req, res) => {
      const users = req.body;
      const result = await usersCollection.insertOne(users);
      res.send(result);
    });

    // daily task
    app.get("/dailyTask", async (req, res) => {
      const query = {};
      const mediaTask = await dailyTaskCollection.find(query).toArray();
      res.send(mediaTask);
    });

    app.post("/dailyTask", async (req, res) => {
      const taskInfo = req.body;
      const result = await dailyTaskCollection.insertOne(taskInfo);
      res.send(result);
    });

    app.delete("/dailyTask/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await dailyTaskCollection.deleteOne(filter);
      res.send(result);
    });

    // media task
    app.get("/mediaTask", async (req, res) => {
      const query = {};
      const mediaTask = await mediaTaskCollection.find(query).toArray();
      res.send(mediaTask);
    });

    app.post("/mediaTask", async (req, res) => {
      const taskInfo = req.body;
      const result = await mediaTaskCollection.insertOne(taskInfo);
      res.send(result);
    });

    app.delete("/mediaTask/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await mediaTaskCollection.deleteOne(filter);
      res.send(result);
    });
  } finally {
  }
}
run().catch((error) => console.log(error));

app.listen(port, () => {
  console.log("server is running");
});
