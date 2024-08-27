const mongodb=require('mongodb');
const MongoClient = mongodb.MongoClient;
const express=require('express');
const app=express();
let path=require("path");

// const url = 'mongodb://localhost:27017/' for mongodb port
const url = 'mongodb://localhost:27017/';

app.listen(8082);
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
        col=db.collection('Health_record');
    }
});

app.get('/',function(req,res){
    res.sendFile(path.join(__dirname,"views/index.html"));
});

app.get('/addrecord',function(req,res){
    res.sendFile(path.join(__dirname,'views/newrecord.html'));
});

app.post('/addrecord', function (req, res) {
    let record = req.body;
    record.RecordID = parseInt(record.RecordID);
    record.WorkerID = parseInt(record.WorkerID);
    record.RecordDate = new Date(record.RecordDate);
  
    // Check if RecordID or WorkerID is negative
    if (record.RecordID < 0 || record.WorkerID < 0) {
      res.redirect('/invalid');
    } else {
      // Check if a record with the same RecordID already exists
      col.findOne({ RecordID: record.RecordID }, function (err, existingRecord) {
        if (existingRecord) {
          // A record with the same RecordID already exists
          res.redirect('/invalid');
        } else {
          // No record with the same RecordID found; proceed with insertion
          col.insertOne(record);
          res.redirect('/');
        }
      });
    }
  });
  

app.get('/getrecords',function(req,res){
    col.find({}).toArray(function(err, data){
        res.render("listrecords.html", { Health_record: data});
    });
});

app.get("/delrecord",function(req,res){
    res.sendFile(path.join(__dirname,'views/delbyid.html'));
});

app.post('/delrecord',function(req,res){
    let id=req.body.RecordID;
    id = parseInt(id)
    // let sender=req.body.sender;
    col.deleteOne({RecordID: id});
    res.redirect('/getrecords');
});

app.get('/updaterecord',function(req,res){
    res.sendFile(path.join(__dirname,'views/updaterecord.html'));
});

app.post('/updaterecord', function(req,res){
    let record=req.body;
    RecordID=parseInt(record.RecordID);
    WorkerID=parseInt(record.WorkerID);
    MedicalHistory = record.MedicalHistory;
    CurrentMedications = record.CurrentMedications
    DiseaseTypes = record.DiseaseTypes
    RecordDate = new Date(record.RecordDate);


    if(record.RecordID < 0 || record.WorkerID < 0){
        res.redirect('/invalid');
    }
    else{
        col.updateOne({RecordID: RecordID}, {$set: {WorkerID: WorkerID, MedicalHistory: MedicalHistory, CurrentMedications: CurrentMedications, DiseaseTypes: DiseaseTypes, RecordDate: RecordDate}},{upsert: true},function(err,result){
            res.redirect('/getrecords');
        });
    }
});

app.get('/invalid',function(req,res){
    res.sendFile(path.join(__dirname,'views/invaliddata.html'));
});

app.get('*',function(req,res){
    res.sendFile(path.join(__dirname,'views/404.html'));
});