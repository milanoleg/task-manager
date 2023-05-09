const { model, Schema } = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../constants');

const schemaOptions = {
  statics: {
    findByCredentials: async (email, password) => {
      const user = await User.findOne({ email });

      if (!user) {
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return;
      }

      return user;
    }
  },
  methods: {
    async generateAuthToken() {
      const user = this;

      return jwt.sign({ _id: user._id.toString() }, JWT_SECRET);
    },
    toJSON() {
      const user = this;

      const userObject = user.toObject();

      delete userObject.password;
      delete userObject.tokens;
      delete userObject.avatar;

      return userObject;
    }
  },
  timestamps: true,
};

const schema = new Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    validate: (value) => {
      if (!validator.isEmail(value)) {
        throw new Error('Email is invalid');
      }
    }
  },
  age: {
    type: String,
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minLength: 7,
    validate: (value) => {
      if (value.includes('password')) {
        throw new Error('Password have to not include password');
      }
    }
  },
  avatar: {
    type: Buffer,
  },
  tokens: [{
    token: {
      type: String,
      required: true,
    }
  }]
}, schemaOptions);

schema.virtual('tasks', {
  ref: 'Task',
  foreignField: 'owner',
  localField: '_id',
});

async function saveMiddleware (next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
}

schema.pre('save', saveMiddleware);

const User = model('User', schema);

module.exports = User;