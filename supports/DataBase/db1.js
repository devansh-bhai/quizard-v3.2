const { MongoClient } = require('mongodb');

const mongoUri = "mongodb+srv://temp:GzWuwc9CsGh8v664@cluster0.cn8sezq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; ///change krna yad rakna ! 
const client = new MongoClient(mongoUri);

let databases = {};

async function connectToMongo() {
    await client.connect();
    databases.test_db = client.db('test_db');
    databases.live_test_db = client.db('live_test');
    databases.dpp_quiz = client.db('dpp_quiz');
    databases.users = client.db('users_db').collection('users');
    databases.testSeriesDb = client.db('test_series_db');
    databases.allDataDb = client.db('all_data'); // New DB for metadata storage
    console.log('Connected to MongoDB');
}

function getDB(dbName) {
    if (!databases[dbName]) throw new Error(`Database ${dbName} not connected`);
    return databases[dbName];
}

module.exports = { connectToMongo, getDB };
