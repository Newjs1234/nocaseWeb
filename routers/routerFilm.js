const router = require('express').Router();
const path = require('path');
const upload = require('express-fileupload');
const fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
const bcrypt = require('bcrypt');
const saltRounds = 10;
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
                bcrypt.compare(req.body.password, result[0].password, function(err, hash) {
                    if(hash) {
                        req.session.Id = result[0]._id;
                        req.session.Email = result[0].email
                        req.session.Username = result[0].username;
                        req.session.Usertype = result[0].usertype;
                        res.redirect('/');
                    } else {
                        res.redirect('/login');
                    }
                });
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
const newCustomersCheckTwo = (req, res, next) => { 
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        dbo.collection("users").find({username: req.body.username}).toArray(function(err, result) {
        if (err) throw err;
            if(result[0] == undefined) {
                next();
            } else {
                res.redirect('/new-customers')
            }
            db.close();
        });
    });
};
router.get('/new-customers', newCustomersCheck, (req, res) => {
    res.render('newCustomers');
})
router.post('/new-customers', newCustomersCheckTwo, (req, res) => {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        bcrypt.genSalt(saltRounds, function(err, salt) {
            bcrypt.hash(req.body.password, salt, function(err, hash) {
                var myobj = { username: req.body.username, email: req.body.email,  password: hash, usertype: req.body.usertype};
                dbo.collection("users").insertOne(myobj, function(err) {
                if (err) throw err;
                fs.mkdir(path.join(__dirname, '..', 'upload', req.body.username), err => {
                    if (err) console.log(err);
                });
                res.redirect('/');
                db.close();
                });
            });
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
            dbo.collection("filme").find({}).toArray(function(err, result) {
                if (err) throw err;
                res.render('home', { filme: result, username: req.session.Username, email: req.session.Email });
                db.close();
            });
        } else {
            dbo.collection("filme").find({username: req.session.Username}).toArray(function(err, result) {
                if (err) throw err;
                res.render('home', { filme: result, username: req.session.Username, email: req.session.Email });
                db.close();
            });
        }
    });
});
// hochladen
const checkUpload = (req, res, next) => {
    if(req.files == null) {
        res.redirect('/');
    } else {
        let check = true;
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mydb");
            dbo.collection("filme").find({username: req.session.Username}).toArray(function(err, result) {
                if (err) throw err;
                for(let i = 0; i < result.length; i++) {
                    if(result[i].name == req.files.file.name) {
                        check = false;
                        break;
                    }
                };
                if(check) {
                   next();
                } else {
                   res.redirect('/');
                }
            });
        });
    }
};
router.post('/', checkUpload, (req, res) => {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        req.files.file.mv(path.join('upload', req.session.Username , req.files.file.name), function(err) {
            if(err) {
                res.send('Fehler');
            } 
            var myobj = { username: req.session.Username, usertype: req.session.Usertype, name: req.files.file.name, content: req.body.content };
            dbo.collection("filme").insertOne(myobj, function(err) {
                if (err) throw err;
                res.redirect('/');
                db.close();  
            });                
        });
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