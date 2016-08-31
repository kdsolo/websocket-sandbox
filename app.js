
var path = require('path');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoDBstore = require('connect-mongodb-session')(session);
var mongoose = require('mongoose');
var session = require('express-session'); //You should already have this line in your app
var passportSocketIo = require("passport.socketio");

var store = new mongoDBstore(
  {
    uri: 'mongodb://127.0.0.1/test-data',
    collection: 'mySessions'
  }
)
store.on('error', function(error) {
  assert.ifError(error);
  assert.ok(false);
});

var Schema = mongoose.Schema
var haikuSchema = new Schema({
    _id: String,
    details: {
      githubUser: String,
      displayName: String
    },
    status: {
      'last-modified': String,
      value: String
    },
    message: {
      'last-modified': String,
      value: String,
      sender: String
    },
    slots: [String]
});
var users = mongoose.model('users', haikuSchema);

app.use(session({
  //secret: gitInfo.info.COOKIE_SECRET,
  saveUninitialized: true,
  resave: true,
  store: store
}));

io.use(passportSocketIo.authorize({ //configure socket.io
   cookieParser: cookieParser,
   secret:      'mysecret',    // make sure it's the same than the one you gave to express
   store:       store,        
   success:     onAuthorizeSuccess,  // *optional* callback on success
   fail:        onAuthorizeFail,     // *optional* callback on fail/error
}));
mongoose.connect('mongodb://localhost/test-data');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("connected via mongoose")
});
app.get('/', function(req, res){
  res.sendFile(path.join(__dirname + '/views/'))
});

io.on('connection', function(socket){

  socket.on('data', function(dataObj){
    console.log('message: ' + dataObj);
    
    var query = { 'details.githubUser': dataObj };

    users.findOne(query, function(err, result) {
    if (result === null) {
      console.log('didnt find you in the database')
    return;
    }
    console.log('found user', result.details.githubUser)
  });
    
    
  });
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});



function onAuthorizeSuccess(data, accept){  
  console.log('successful connection to socket.io');
  accept(); //Let the user through
}

function onAuthorizeFail(data, message, error, accept){ 
  if(error) accept(new Error(message));
  console.log('failed connection to socket.io:', message);
  accept(null, false);  
}

io.sockets.on('connection', function(socket) {
  console.log(socket.request.user); 
});
