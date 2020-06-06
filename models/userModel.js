const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please your name']
  },
  email: {
    type: String,
    required: [true, 'You must input your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    //required: [true, 'Please confirm your password'],
    minlength: 8,
    validate: {
      //only works on CREATE or SAVE not on others like FINDBYIDANDUPDATE
      validator: function(el) {
        return el === this.password; //if el(passwordConfirm === this.password(password), return true)
      },
      message: 'Passwords do not match'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// PRE AND POST MIDDLEWARES
//MIDDLEWARE before document gets inserted in database
userSchema.pre('save', async function(next) {
  //Run this function if password was actually modified
  if (!this.isModified('password')) return next();

  //hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }

  this.passwordChangedAt = Date.now() - 1000; //-1 secs because save can be slower than jwt
  next();
});

// Middleware using regex to match find on queries to stop inactive users from showimg
userSchema.pre(/^find/, function(next) {
  // this points to current query
  this.find({ active: { $ne: false } });
  next();
});

// INSTANCE METHODS
//An instance method :: will be available on all documents of a certain collection
userSchema.methods.correctPassword = async function(
  candidatePassword, //from user
  userPassword //from database
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  //false means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //10 minutes in milliseconds

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
