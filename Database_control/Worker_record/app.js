const mongodb=require('mongodb');
const MongoClient = mongodb.MongoClient;
const express=require('express');
const app=express();
let path=require("path");

// const url = 'mongodb://localhost:27017/' for mongodb port
const url = 'mongodb://localhost:27017/';

app.listen(8080);
app.use(express.urlencoded({extended: true}));
// parse application/json
app.use(express.json());
app.use(express.static('public/imgs'));
app.use(express.static('public/css'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

let db;
let col;

MongoClient.connect(url, {useNewUrlParser: true}, function (err, client) {
    if (err) { //null is false, anything else is true
        console.log('Err  ', err);
    } else {
        console.log("Connected successfully to server");
        db = client.db('FIT3164');
        col=db.collection('worker_dataset');
    }
});

app.get('/',function(req,res){
    res.sendFile(path.join(__dirname,"views/index.html"));
});

app.get('/addworker',function(req,res){
    res.sendFile(path.join(__dirname,'views/newworker.html'));
});

app.post('/addworker', function (req, res) {
    let worker = req.body;
    worker.WorkerID = parseInt(worker.WorkerID);
    worker.Age = parseInt(worker.Age);
  
    // Check if worker.DateJoined is not set or in the future
    if (!worker.DateJoined || new Date(worker.DateJoined) > new Date()) {
      res.redirect('/invalid');
    } else {
      // Check if worker.DateLeft is not set
      if (!worker.DateLeft) {
        worker.DateLeft = null;
      } else {
        worker.DateLeft = new Date(worker.DateLeft);
      }
      worker.DateJoined = new Date(worker.DateJoined);
      worker.IsCurrentEmployee = worker.IsCurrentEmployee === 'true';
  
      if (worker.Age >= 67 || worker.Age < 18) {
        res.redirect('/invalid');
      } else {
        // Check if a worker with the same WorkerID already exists in the database
        col.findOne({ WorkerID: worker.WorkerID }, function (err, existingWorker) {
          if (existingWorker) {
            // A worker with the same WorkerID already exists
            res.send("WorkerID already exists, use another one")
          } else {
            // No worker with the same WorkerID found; proceed with insertion
            col.insertOne(worker);
            res.redirect('/');
          }
        });
      }
    }
  });
  
  

app.get('/getworkers',function(req,res){
    col.find({}).toArray(function(err, data){
        res.render("listworkers.html", {worker_dataset: data});
    });
});

app.get("/delworker",function(req,res){
    res.sendFile(path.join(__dirname,'views/delbyid.html'));
});

app.post('/delworker',function(req,res){
    let id=req.body.WorkerID;
    id = parseInt(id)
    // let sender=req.body.sender;
    col.deleteOne({WorkerID: id});
    res.redirect('/getworkers');
});

app.get('/updateworker',function(req,res){
    res.sendFile(path.join(__dirname,'views/updateworker.html'));
});

app.post('/updateworker', function (req, res) {
    let worker = req.body;
    WorkerID = parseInt(worker.WorkerID);
    Age = parseInt(worker.Age);
    Occupation = worker.Occupation;
    DateJoined = new Date(worker.DateJoined);
    DateLeft = new Date(worker.DateLeft);
    IsCurrentEmployee = worker.IsCurrentEmployee === 'true';
    ReasonForLeaving = worker.ReasonForLeaving;
  
    // Check if worker.DateJoined is not set or in the future
    if (!worker.DateJoined || new Date(worker.DateJoined) > new Date()) {
      res.redirect('/invalid');
    } else {
      // Check if worker.DateLeft is not set
      if (!worker.DateLeft) {
        DateLeft = null;
      }
  
      if (Age >= 67 || Age < 18) {
        res.redirect('/invalid');
      } else {
        col.updateOne(
          { WorkerID: WorkerID },
          {
            $set: {
              Age: Age,
              Occupation: Occupation,
              DateJoined: DateJoined,
              DateLeft: DateLeft,
              IsCurrentEmployee: IsCurrentEmployee,
              ReasonForLeaving: ReasonForLeaving,
            },
          },
          { upsert: true },
          function (err, result) {
            res.redirect('/getworkers');
          }
        );
      }
    }
  });
  

app.get('/invalid',function(req,res){
    res.sendFile(path.join(__dirname,'views/invaliddata.html'));
});

app.get('*',function(req,res){
    res.sendFile(path.join(__dirname,'views/404.html'));
});