const { MongoClient, ServerApiVersion } = require('mongodb');
const fs = require('fs');

const credentials = './MONGODB-X509.pem';

const client = new MongoClient('mongodb+srv://cluster0.hgbjjqw.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority', {
  sslKey: credentials,
  sslCert: credentials,
  serverApi: ServerApiVersion.v1
});

async function run() {
  try {
    await client.connect();

    const database = client.db("sample_airbnb");
    const collection = database.collection("hotels");

    //const data = await collection.insertOne({ name: 'Rixos', city: 'Dubai' });

    console.log(collection);
  } finally {
    await client.close();
  }
}
run()
  .catch(console.dir);