const mongoose = require('mongoose');
const Tour = require('./tourModel');

reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// an index that ensures that a user can only write one review on a tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// reviewSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'user',
//     select: 'name photo',
//   }).populate({
//     path: 'tour',
//     select: 'name',
//   });
//   next();
// });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this keyword points to current model in static model like this
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour', //grouping all tours by tour
        nRating: { $sum: 1 }, //adding 1 to each result since it starts from 0, so if we have 5, it equals 5
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// calculate after create
reviewSchema.post('save', function () {
  // this keyword points to current review
  this.constructor.calcAverageRatings(this.tour);
});

// calculate upon edit and delete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.rvw = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // this.rvw = await this.findOne(); doesnt work here cuz query has already executed
  await this.rvw.constructor.calcAverageRatings(this.rvw.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
