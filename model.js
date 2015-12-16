var knex = require('knex')({
	client: 'mysql',
  pool: {
    min: 2,
    max: 10,
    ping: function (conn, cb) { conn.query('SELECT 1', cb); }
	}, // reason for the ping: https://gist.github.com/acgourley/9a11ffedd44c414fb4b8
	connection: {
		host: '52.4.177.161', // process.env.AMAZON_RDS_HOST,
		user: process.env.AMAZON_RDS_USER_NAME,
		password: process.env.AMAZON_RDS_PASSWORD,
		database: 'keymanage',
		charset  : 'utf8',
		dateStrings: true
	},
	debug: true
});

var bookshelf = require('bookshelf')(knex);

var User = bookshelf.Model.extend({
	tableName: 'users',
	hasTimestamps: true,
	own: function () {
		return this.hasMany(Item);
	},
	hold: function () {
		return this.belongsToMany(Item).withPivot(['quantity']);
	},
	sockets: function () {
		return this.hasMany(Socket);
	}
});

var Item = bookshelf.Model.extend({
	tableName: 'items',
	hasTimestamps: true,
	owner: function () {
		 return this.belongsTo(User);
	},
	holders: function () {
		 return this.belongsToMany(User).withPivot(['quantity']);
	}
});

var Transaction = bookshelf.Model.extend({
	tableName: 'transactions',
	hasTimestamps: true,
	from: function () {
		 return this.belongsTo(User, 'from_id');
	},
	to: function () {
		 return this.belongsTo(User, 'to_id');
	},
	item: function () {
		 return this.belongsTo(Item);
	}
});

var Socket = bookshelf.Model.extend({
	tableName: 'sockets',
	user: function () {
		 return this.belongsTo(User);
	}
});

module.exports = {
	knex: knex,
  User: User,
	Item: Item,
	Transaction: Transaction,
	Socket: Socket
};