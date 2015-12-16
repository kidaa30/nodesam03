var Schema = {
  users: {
    id: {type: 'increments', nullable: false, primary: true},
    email: {type: 'string', maxlength: 127, nullable: false, unique: true},
    username: {type: 'string', maxlength: 63, nullable: false, unique: true},
		password: {type: 'string', maxlength: 255, nullable: false},
		firstname: {type: 'string', maxlength: 63, nullable: true},
		lastname: {type: 'string', maxlength: 63, nullable: true},
		company: {type: 'string', maxlength: 63, nullable: true},
		phone: {type: 'string', maxlength: 63, nullable: true},
		street: {type: 'string', maxlength: 127, nullable: true},
		city: {type: 'string', maxlength: 63, nullable: true},
		province: {type: 'string', maxlength: 31, nullable: true},
		country: {type: 'string', maxlength: 31, nullable: true},
		postcode: {type: 'string', maxlength: 31, nullable: true},
    created_at: {type: 'dateTime', nullable: false},
    updated_at: {type: 'dateTime', nullable: true}
  },

  items: {
    id: {type: 'increments', nullable: false, primary: true},
		user_id: {type: 'integer', nullable: false, unsigned: true},
		MLS: {type: 'string', maxlength: 127, nullable: false},
		street: {type: 'string', maxlength: 127, nullable: false},
		city: {type: 'string', maxlength: 63, nullable: false},
		province: {type: 'string', maxlength: 31, nullable: false},
		postcode: {type: 'string', maxlength: 31, nullable: true},
		description: {type: 'string', maxlength: 2047, nullable: true},
    created_at: {type: 'dateTime', nullable: false},
    updated_at: {type: 'dateTime', nullable: true}
  },

  items_users: {
    id: {type: 'increments', nullable: false, primary: true},
    user_id: {type: 'integer', nullable: false, unsigned: true},
    item_id: {type: 'integer', nullable: false, unsigned: true},
		quantity: {type: 'integer', nullable: false, unsigned: true}
  },

  transactions: {
    id: {type: 'increments', nullable: false, primary: true},
		from_id: {type: 'integer', nullable: false, unsigned: true},
		to_id: {type: 'integer', nullable: false, unsigned: true},
		item_id: {type: 'integer', nullable: false, unsigned: true},
		quantity: {type: 'integer', nullable: false, unsigned: true},
    created_at: {type: 'dateTime', nullable: false},
    updated_at: {type: 'dateTime', nullable: true}
  },

  sockets: {
    id: {type: 'increments', nullable: false, primary: true},
		socketid: {type: 'string', maxlength: 31, nullable: false},
		user_id: {type: 'integer', nullable: false, unsigned: true}
  }
};

module.exports = Schema;