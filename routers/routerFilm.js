const router = require('express').Router();
const path = require('path');
const upload = require('express-fileupload');

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

router.use(upload());





// Login
const loginCheck = (req, res, next) => {
    if(req.session.Id) {
        res.redirect('/');
    } else {
        next();
    }
};

router.get('/login', loginCheck, (req, res) => {
    res.render('login');
});

router.post('/login', (req, res) => {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        dbo.collection("users").find({username: req.body.username}).toArray(function(err, result) {
            if (err) throw err;
            if(result[0] == undefined) {
                console.log('2.')
                res.redirect('/login');
            } else {
                if(result[0].password == req.body.password) {
                    req.session.Id = result[0]._id;
                    req.session.Username = result[0].username;
                    req.session.Usertype = result[0].usertype;
                    res.redirect('/');
                } else {
                    res.redirect('/login');
                }
            }
            db.close();
        });
    });
});

// New Customers
const newCustomersCheck = (req, res, next) => {
    if(req.session) {
        if(req.session.Usertype == 'Admin') {
            next();
        } else {
            res.redirect('/login');
        }
    } else {
        res.redirect('/login');        
    }
};



router.get('/new-customers', newCustomersCheck, (req, res) => {
    res.render('newCustomers');
})

router.post('/new-customers', (req, res) => {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        var myobj = { username: req.body.username, email: req.body.email,  password: req.body.password, usertype: req.body.usertype};
        dbo.collection("users").insertOne(myobj, function(err) {
          if (err) throw err;
          console.log("1 document inserted");
          res.redirect('/');
          db.close();
        });
    });
});


// Filme Home
const homeCheck = (req, res, next) => {
    if(req.session.Id) {
        next();
    } else {
        res.redirect('/login');
    }
};

router.get('/', homeCheck, (req, res) => {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        if(req.session.Usertype == 'Admin') {
            console.log('Admin');
            dbo.collection("filme").find({}).toArray(function(err, result) {
                if (err) throw err;
                console.log(result);
                res.render('home', { filme: result, username: req.session.Username });
                db.close();
            });
        } else {
            console.log('Basis');
            dbo.collection("filme").find({username: req.session.Username}).toArray(function(err, result) {
                if (err) throw err;
                console.log(result);
                res.render('home', { filme: result, username: req.session.Username });
                db.close();
            });
        }
    });
});

router.post('/', (req, res) => {
    req.files.file.mv(path.join('upload', req.files.file.name), function(err) {
        if(err) {
            res.send('Fehler');
        } else {
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db("mydb");
                var myobj = { username: req.session.Username, usertype: req.session.Usertype, name: req.files.file.name, content: req.body.content };
                dbo.collection("filme").insertOne(myobj, function(err) {
                  if (err) throw err;
                  console.log("1 document inserted");
                  res.redirect('/');
                  db.close();
                });
            });
        } 
    });
});

router.post('/down', (req, res) => {
    res.download('upload/' + req.body.name);
});

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if(err) {
            res.redirect('/');
        }
        res.clearCookie('sid');
        res.redirect('/login');
    })
});

module.exports = router;