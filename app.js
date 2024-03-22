require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5051;

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

const mdbClient = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

(async () => {
  try {
    const products = mdbClient.db("radiomart").collection("products");

    app.get("/products", async (req, res) => {
      const page = +req.query.page || 1;
      const limit = +req.query.limit || 10;
      const skip = (page - 1) * limit;
      let query = {};

      if (req.query.search) {
        query = {
          ...query,
          name: { $regex: req.query.search, $options: "i" },
        };
      }

      const cursor = products.find(query).skip(skip).limit(limit);
      const data = await cursor.toArray();
      const total = await products.countDocuments(query);

      res.send({
        success: true,
        statusCode: 200,
        message: "Fetched successful!",
        meta: {
          page,
          limit,
          skip,
          total,
        },
        data,
      });
    });

    app.post("/products", async (req, res) => {
      if (req.query.ids) {
        const page = +req.query.page || 1;
        const limit = +req.query.limit || 10;
        const skip = (page - 1) * limit;
        const ids = req.body.map((id) => new ObjectId(id));

        const query = { _id: { $in: ids } };
        const cursor = products.find(query).skip(skip).limit(limit);
        const data = await cursor.toArray();
        const total = await products.countDocuments(query);

        res.send({
          success: true,
          statusCode: 200,
          message: "Fetched successful!",
          meta: {
            page,
            limit,
            skip,
            total,
          },
          data,
        });
      } else {
        const data = await products.insertOne(req.body);

        res.send({
          success: true,
          statusCode: 200,
          message: "Created successfully!",
          data,
        });
      }
    });

    mdbClient
      .db("admin")
      .command({ ping: 1 })
      .then(() => console.log("Successfully connected to MongoDB!"));
  } catch (err) {
    console.log("Did not connect to MongoDB! " + err.message);
  } finally {
    // await mdbClient.close();
  }
})();

app.get("/", (_, res) => {
  res.send("RadioMart is running...");
});

app.listen(port, () => {
  console.log(`RadioMart API is running on port: ${port}`);
});
