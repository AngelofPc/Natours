class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString }; //using destructuring to create a new object copying req.query
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]); //delete the excluded fields from the query

    // 1b) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); //for greater than and co,to replace gte in query with $gte

    const newQueryObj = JSON.parse(queryStr);
    //console.log(req.query, queryObj);

    // to make queries or search
    this.query = this.query.find(newQueryObj);

    return this;
  }

  // SORTING
  sort() {
    if (this.queryString.sort) {
      console.log(this.queryString.sort);
      const sortBy = this.queryString.sort.split(',').join(' '); //to enable double sorting i.e by price and by another stuff e,g sort('price ratingsAverage')
      this.query = this.query.sort(sortBy); //what to search is sort=price,ratingsAverage
    } else {
      this.query = this.query.sort('-createdAt'); //sort in descending option (newest ones firs t)
    }

    return this;
  }

  //  3) Field limiting (to choose fields to send as response)
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields); //what to search is fileds=price,ratingsAverage to exclude; add - i.e -price,-duration
    } else {
      this.query = this.query.select('-__v'); //wont send this internal mongo parameter because of -
    }
    return this;
  }

  // 4) Pagination
  //page=3&limit=10, 1-10, page 1, 11-20, page 3. 21-30 , page 4
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
