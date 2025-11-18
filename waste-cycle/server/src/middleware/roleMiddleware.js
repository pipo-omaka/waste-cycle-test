const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401);
    next(new Error('Not authorized as an admin'));
  }
};

const seller = (req, res, next) => {
  if (req.user && (req.user.role === 'seller' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(401);
    next(new Error('Not authorized as a seller or admin'));
  }
};

const user = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(401);
    next(new Error('Not authorized'));
  }
};

export { admin, seller, user };