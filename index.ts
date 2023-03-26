require('dotenv').config();
import { Collection, MongoClient, MongoClientOptions } from 'mongodb';
const express = require('express');
const bodyParser = require('body-parser');

const cliets:Array<any> = [];

async function getclient(uri) {
  if (cliets[uri]) {
    return cliets[uri];
  }
  const client = await MongoClient.connect(uri);
  cliets[uri] = client;
  return client;
}

const port:number = parseInt(process.env.PORT || "3000")

async function main() {
    console.log(Collection)
    var propertyNames = Object.getOwnPropertyNames(Collection.prototype);
    const methods = {};
    for (const name of propertyNames) {
        let method:any = null
        try {
            method = Collection.prototype[name];
        } catch (e) {}
        if (typeof method !== 'function' || name == "constructor") { continue; }
        const params = method.toString().match(/\(([^)]*)\)/)[1];
        const paramsArray = params.split(',').map((param) => param.split('=')[0].trim());
        methods[name] = {
            params: paramsArray
        }
    }
    console.log(methods)
    const app = express();
    app.use(bodyParser.json());
    app.post("/api/run/:method", async (req, res) => {
        //console.log(req)
        const { method } = req.params;
        const { uri, dbName, collectionName, args } = req.body;
        const client = await getclient(uri);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        if (!methods[method]) {
            return res.status(400).send("Invalid method");
        }
        try {
            let result = await collection[method](...args);
            // if it has a toArray method add it to the result
            if (result && typeof result.toArray === 'function') {
                result.array = await result.toArray();
            }
            res.send(result);
        } catch (e) {
            console.log(e.message)
            res.send({
                error: e.message
            });
        }
    });
    app.get("/api/methods", (req, res) => {
        res.send(methods);
    });

    app.listen(port, () => {
        console.log(`server listening at http://localhost:${port}`)
    })
}

main();