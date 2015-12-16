// vendor libraries
var express = require('express'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	bcrypt = require('bcrypt-nodejs'),
	path = require('path'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	morgan = require('morgan'),
	csurf = require('csurf'),
	csurfApp = csurf({ cookie: false }),
	csurfIo = csurf({ cookie: false, ignoreMethods: ['HEAD', 'OPTIONS'], value: function(req){return req._query._csrf} }),
	flash = require('connect-flash'),
// custom libraries
	route = require('./route'),
	Model = require('./model'),
	eventEmitter = new (require("events").EventEmitter)(),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	KnexSessionStore = require('connect-session-knex')(session),
	store = new KnexSessionStore({
			knex: Model.knex,
			tablename: 'sessions' // optional. Defaults to 'sessions'
	}),
	sessionMiddleware = session({
		secret: process.env.SESSION_SECRET,
		store: store,
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: false
		}
	});

/****************************************************************************************************
* passport.use and passport.serializeUser are invoked by passport.authenticate
* passport.use is to validate user's credential
* passport.serializeUser is to decide which part of validated user is to be saved into session store
*****************************************************************************************************/
passport.use(new LocalStrategy({
	usernameField: 'username',
	passwordField: 'password'
}, function(username, password, done) {
	new Model.User()
		.query({
			where: {username: username},
			orWhere: {email: username}
		})
		.fetch()
		.then(function(data){
			var user = data;
			if(user === null) {
				return done(null, false, {message: 'Invalid username'});
			} else {
				user = data.toJSON();
				bcrypt.compare(password, user.password, function(err, res) {
					if (res) {
						return done(null, user);
					} else {
						return done(null, false, {message: 'Invalid password'});
					}
				});
			}
		});
	
	// new Model.User({username: username}).fetch().then(function(data) {
		// var user = data;
		// if(user === null) {
			// return done(null, false, {message: 'Invalid username or password'});
		// } else {
			// user = data.toJSON();
			// if(!bcrypt.compareSync(password, user.password)) {
				// return done(null, false, {message: 'Invalid username or password'});
			// } else {
				// return done(null, user);
			// }
		// }
	// });
}));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

/*************************************************************************************************
* passport.deserializeUser is invoked by passport.session
* passport.deserializeUser uses the user info saved in session store to recover user (req.user)
**************************************************************************************************/
passport.deserializeUser(function(user_id, done) {
   new Model.User({id: user_id}).fetch().then(function(user) {
      done(null, user);
   });
});

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, '/templates'));
app.set('view engine', 'jade');

app.use(morgan('dev'));
app.use(express.static('public'));
// app.use(cookieParser('fdI9)=b1N& #uS9)Qap['));
app.use(sessionMiddleware);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


app.get('/', csurfApp, require('./routes/index')(eventEmitter));
app.all('/signin',
	bodyParser.urlencoded({ extended: false }),
	csurfApp,
	require('./routes/signin')(eventEmitter)
);
app.get('/signout', require('./routes/signout')(eventEmitter));

app.use('/ajax', bodyParser.json());
app.post('/ajax/:method', require('./routes/ajax')(eventEmitter, io));


var server = http.listen(app.get('port'), function(err) {
   if(err) throw err;

   var message = 'Server is running @ http://localhost:' + server.address().port;
   console.log(message);
});

function MiddlewareAdapter(Middleware){
	return function(socket, next){
		Middleware(socket.request, {send:function(){console.log("error")}}, next);
	}
};

io.use(MiddlewareAdapter(sessionMiddleware));
io.use(MiddlewareAdapter(passport.initialize()));
io.use(MiddlewareAdapter(passport.session()));
//io.use(MiddlewareAdapter(csurfIo));

var socketInit = Model.Socket.query().del().then(function(rows){console.log(rows, ' items in sockets are deleted')});

io.on('connection', function(socket){
  //console.log('a user connected', socket.request.session, socket.request.user, socket.request._query);
	console.log('a user connected');
	if (socket.request.user) {
		socketInit.then(function(){
			socket.request.user.sockets()
				.create({socketid: socket.id})
		})
		.catch(function(error){console.log(error);});
	};
	socket.on('disconnect', function () {
    console.log('user disconnected');
		if (socket.request.user) {
			Model.Socket.where({socketid: socket.id})
				.destroy()
				.catch(function(error){console.log(error);});
		};
  });
});