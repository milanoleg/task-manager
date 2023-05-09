const jwt = require('jsonwebtoken');

const User = require('../models/user');
const { JWT_SECRET } = require('../constants');

const auth = async (req, res, next) => {
  try {
    const token = req.headers?.authorization.replace('Bearer ', '');
    const decodedToken = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ _id: decodedToken._id, 'tokens.token': token });

    if (!user) {
      return res.status(401).send('Unauthorized. Please sign in.');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    return res.status(500).send({ error: 'Internal server error' });
  }
};

module.exports = auth;