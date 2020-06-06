const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();

  // 2) Build template

  // 3)Render template using tour data from 1
  res.status(200).render('overview', {
    title: 'Exciting tours for adventurous people',
    tours: tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  // 2) Build template
  // 3)Render template using tour data from 1
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: `Login to your account`
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: `Your account`
  });
};

exports.getMyTours = catchAsync(async (req, res) => {
  // 1) Find all bookings by a user
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs  (you can use virtual populate though)
  const tourIDs = bookings.map(el => el.tour); //returns an array of tourids
  const tours = await Tour.find({ _id: { $in: tourIDs } }); // select all tours with matching ids in db

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});

// TO submit data without iser api
exports.updateUserData = catchAsync(async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );
  res.status(200).render('account', {
    title: `Your account`,
    user: updatedUser
  });
});
