const mongodb=require('mongodb');
const MongoClient = mongodb.MongoClient;
const express=require('express');
const app=express();
let path=require("path");

// const url = 'mongodb://localhost:27017/' for mongodb port
const url = 'mongodb://localhost:27017/';

app.listen(8081);
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
        col=db.collection('Safety_induction');
    }
});

app.get('/',function(req,res){
    res.sendFile(path.join(__dirname,"views/index.html"));
});

app.get('/addworker',function(req,res){
    res.sendFile(path.join(__dirname,'views/newworker.html'));
});

app.post('/addworker', function (req, res) {
    let record = req.body;
    record.InductionScore = parseInt(record.InductionScore);
    record.WorkerID = parseInt(record.WorkerID);
    record.RecordID = parseInt(record.RecordID);
  
    // Check if the InductionScore is within a valid range
    if (record.InductionScore > 100 || record.InductionScore < 0) {
      res.redirect('/invalid');
    } else {
      // Check if a record with the same RecordID already exists
      col.findOne({ RecordID: record.RecordID }, function (err, existingRecord) {
        if (existingRecord) {
          // A record with the same RecordID already exists
          res.send("RecordID already exists, use another one")
        } else {
          // No record with the same RecordID found; proceed with insertion
          col.insertOne(record);
          res.redirect('/');
        }
      });
    }
  });
  

app.get('/getworkers', function (req, res) {
    col.find({}).sort({ RecordID: 1 }).toArray(function (err, data) {
        res.render("listworkers.html", { Safety_induction: data });
    });
});


app.get("/delworker",function(req,res){
    res.sendFile(path.join(__dirname,'views/delbyid.html'));
});

app.post('/delworker',function(req,res){
    let id=req.body.RecordID;
    id = parseInt(id)
    // let sender=req.body.sender;
    col.deleteOne({RecordID: id});
    res.redirect('/getworkers');
});

app.get('/updateworker',function(req,res){
    res.sendFile(path.join(__dirname,'views/updateworker.html'));
});

app.post('/updateworker', function(req,res){
    let record=req.body;
    RecordID=parseInt(record.RecordID);
    WorkerID=parseInt(record.WorkerID);
    InductionType=record.InductionType;
    InductionDate=record.InductionDate;
    InductionScore=parseInt(record.InductionScore);

    if(record.InductionScore > 100 || record.InductionScore < 0){
        res.redirect('/invalid');
    }
    else{
        col.updateOne({RecordID: RecordID}, {$set: {WorkerID: WorkerID, InductionType: InductionType, InductionDate: InductionDate, InductionScore: InductionScore}},{upsert: true},function(err,result){
            res.redirect('/getworkers');
        });
    }
});

app.get('/invalid',function(req,res){
    res.sendFile(path.join(__dirname,'views/invaliddata.html'));
});

app.get('*',function(req,res){
    res.sendFile(path.join(__dirname,'views/404.html'));
});