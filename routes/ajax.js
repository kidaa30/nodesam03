/*************************************************************
* 
**************************************************************/
var bcrypt = require('bcrypt-nodejs'),
	Model = require('../model'),
	passport = require('passport'),
	co = require('co'),
	_ = require('lodash');

exports = module.exports = function (eventEmitter, io) {
	function SendItemUpdateMessage(io, item){
		return item.holders()
			.fetch({withRelated: ['sockets']})
			.then(function(holders){
				//console.log(holders.toJSON());
				holders.toJSON().forEach(function(holder){
					holder.sockets.forEach(function(socket){
						//console.log(socket);
						io.to(socket.socketid).emit('update');
					})
				});
				return item;
			}, function(){
				return Promise.reject('Failed to broadcast.\n');
			});
	};

	var TransferItem = co.wrap(function *(from, to, item, quantity){ // yield any promise
		var from_user, to_user, _item;
		quantity = (typeof quantity !== 'undefined')? quantity : 1;

		if (from === to) {
			return '';
		}

		_item = yield Model.Item.forge({id: item}).fetch({withRelated: ['holders']});
		from_user = _.find(_item.related('holders').toJSON(), {id: from});
		currentQuantity = (from_user)? from_user._pivot_quantity : 0;
		try {
			if (currentQuantity > quantity) {
				yield _item.related('holders').updatePivot({quantity: currentQuantity - quantity}, {query: {where: {user_id: from}}});
			} else if (currentQuantity === quantity) {
				yield _item.related('holders').detach({user_id: from});
			} else {
				return 'Giver does not have enough quantity to give.\n';
			}
		} catch (err) {
			console.error(err.message);
			return 'From user update failed.\n';
		}

		to_user = _.find(_item.related('holders').toJSON(), {id: to});
		try {
			if (to_user) {
				yield _item.related('holders').updatePivot({quantity: to_user._pivot_quantity + quantity}, {query: {where: {user_id: to}}});
			} else {
				yield _item.related('holders').attach({user_id: to, item_id: item, quantity: quantity});
			}
		} catch (err) {
			console.error(err.message);
			return 'To user update failed.\n';
		}

		try {
			yield Model.Transaction.forge({from_id: from, to_id: to, item_id: item, quantity: quantity}).save();
		} catch (err) {
			console.error(err.message);
			return 'Transaction insertion failed.\n';
		}
		
		SendItemUpdateMessage(io, _item);
		return '';
	});

/*************************************************************
* middleware starts here
**************************************************************/
	return function(req, res, next) {
		var sendPrefix = "";

		co(function *(){
			switch (req.params.method){
			
			case "isLoggedIn":
				res.json(req.isAuthenticated());
				break;
				
			case "logoff":
				if (req.isAuthenticated()) {
					req.logout();
					res.send('');
				} else {
					res.status(404);
					res.send('error: not logged in');
				}
				break;
				
			case "signin":
				if (req.isAuthenticated()) {
					res.send('error: already logged in');
				} else {
					passport.authenticate('local', function(err, user, info){
						if (err) {
							return next(err);
						} else if (!user) {
							return res.send(info.message);
						} else {
							req.logIn(user, function(err){
								if (err) {
									return next(err);
								} else {
									return res.send('');
								}
							});
						};
					})(req, res, next);
				};
				break;
				
			case "signup":
				if (req.isAuthenticated()) { // if already logged in, ignore both GET and POST
					res.send('error: logged in');
				} else {
					try {
						model = yield Model.User.forge().query({where: {username: req.body.username},orWhere: {email: req.body.email}}).fetch();
					} catch (err) {
						console.error(err.message);
						res.send(err.message);
					}
					if (model) {
						res.send('username or email already exists');
					} else {
						//****************************************************//
						// MORE VALIDATION GOES HERE(E.G. PASSWORD VALIDATION)
						//****************************************************//
						bcrypt.hash(req.body.password, null, null, function(err, hash) {
							if (err) {
								res.json(err);
							} else {
								co(function *(){
									try {
										yield Model.User.forge({username: req.body.username, email: req.body.email, password: hash}).save();
										res.send('');
									} catch (err) {
										console.error(err.message);
										res.send(err.message);
									}
								});
							}
						});
					}
				}
				break;

			case "getAllData":
				var tempObj,
					_user = req.user,
					resultLent = [],
					resultMylist = [];
				try {
					resultItem = yield {
						search: [],
						borrowed: _user.hold().fetch({withRelated: ['owner']}),
						lent: [],
						mylist: _user.own().fetch({withRelated: ['holders']})
					};
				} catch (err) {
					console.error(err.message);
					res.json({search:[], borrowed:[], lent:[], mylist:[]});
				}
				resultBorrowed = resultItem.borrowed.toJSON();
				_.remove(resultBorrowed, {user_id: _user.get('id')});
				resultMylist = resultItem.mylist.toJSON();
				resultMylist.forEach(function(item){
					item.holders.forEach(function(holder){
						if (holder.id !== _user.get('id')) {
							tempObj = {};
							['id', 'MLS', 'street', 'city', 'province', 'postcode', 'description'].forEach(function(key){tempObj[key] = item[key]});
							tempObj.holder = holder;
							resultLent.push(tempObj);
						}
					});
					item.totalQty = _.sum(item.holders, '_pivot_quantity');
					tempOwner =  _.findWhere(item.holders, {'id': _user.get('id')});
					item.ownerQty = (tempOwner)? tempOwner._pivot_quantity : 0;
				});					
				res.json({
					search: [],
					borrowed: resultBorrowed,
					lent: resultLent,
					mylist: resultMylist
				});
				break;

			case "NewItem":
				var quantity = req.body.quantity,
					_user = req.user;
				delete req.body.quantity;
				if (quantity <= 0) {
					res.send('Failed to create item. Quantity must be greater than zero.\n');
				} else {
					try {
						item = yield _user.own().create(req.body);
					} catch (err) {
						console.error(err.message);
						res.send('Failed to create item');
					}
					
					try {
						yield _user.hold().attach({user_id: _user.get('id'), item_id: item.get('id'), quantity: quantity});
					} catch (err) {
						console.error(err.message);
						res.send('Failed to attach newly created item to owner');
					}

					SendItemUpdateMessage(io, item);
					res.send('');
				}
				break;

			case "SearchItem":
				var resultItemJSON;
				try {
					resultItem = yield Model.Item.collection().query("whereRaw", "MATCH (MLS, street, city, province, postcode, description) AGAINST (\'" + req.body.searchString + "\')").fetch({withRelated: ['owner', 'holders']});
					resultItemJSON = resultItem.toJSON();
					resultItemJSON.forEach(function(item){
						item.totalQty = _.sum(item.holders, '_pivot_quantity');
						tempOwner =  _.findWhere(item.holders, {'id': item.owner.id});
						item.ownerQty = (tempOwner)? tempOwner._pivot_quantity : 0;
					});
					res.json(resultItemJSON);
				} catch (err) {
					console.error(err.message);
					res.json([]);
				}
				break;

			case "GetItem":
				try {
					item = yield Model.Item.forge({id: req.body.id}).fetch();
					res.json(item);
				} catch (err) {
					console.error(err.message);
					res.json(err.message);
				}
				break;

			case "UpdateItem":
				try {
					item = yield Model.Item.forge(req.body).save();
				} catch (err) {
					console.error(err.message);
					res.send(err.message);
				}
				SendItemUpdateMessage(io, item);
				res.send('');
				break;

			case "DeleteItem":
				var owner, holders;
				try {
					item = yield Model.Item.forge({id: req.body.id}).fetch({withRelated: ['owner', 'holders']});
				} catch (err) {
					console.error(err.message);
					res.send(err.message);
				}
				owner = item.related('owner').toJSON();
				holders = item.related('holders').toJSON();
				if (holders.length === 1 && holders[0].id === owner.id) {
					try {
						yield item.related('holders').detach();
					} catch (err) {
						console.error(err.message);
						res.send(err.message);
					}

					try {
						yield item.destroy();
					} catch (err) {
						console.error(err.message);
						res.send(err.message);
					}
					
					res.send('');
				} else {
					res.send('Failed to delete. Some of this item are held by other people.\n');
				}
				break;

			case "GrabItem":
				var _user = req.user,
				itemId = req.body.id;
				try {
					_item = yield Model.Item.forge({id: itemId}).fetch({withRelated: ['owner']});
					res.send(yield TransferItem(_item.related('owner').get('id'), req.user.id, itemId, 1));
				} catch (err) {
					console.error(err.message);
					res.send('Transfer failed');
				}
				break;

			case "ReceiveItem":
				try {
					res.send(yield TransferItem(req.body.from, req.user.id, req.body.item, 1));
				} catch (err) {
					console.log(err);
					console.error(err.message);
					res.send('Transfer failed');
				}
				break;

			case "GetUser":
				var _user;
				try {
					if (req.body.id) {
						_user = yield Model.User.forge({id: req.body.id}).fetch();
					} else {
						_user = req.user;
					}
					res.json(_user.toJSON());
				} catch (err) {
					console.error(err.message);
					res.json(err.message);
				}
				break;

			case "UpdateUser":
				try {
					tempUser = req.body;
					tempUser.id = req.user.id;
					_user = yield Model.User.forge(tempUser).save();
				} catch (err) {
					console.error(err.message);
					res.send(err.message);
				}
				res.send('');
				break;

			case "DirectDb":
				try {
					var _res = yield Model.knex.raw(req.body.command, []);
					res.json(_res);
				} catch (err) {
					console.error(err.message);
					res.send([err.message]);
				}
				break;

			default:
				console.log("method not found");
				res.send("method not found");
			}
		})
		.catch(function(err){
			console.error(err);
			res.send('');
		});
	}
}