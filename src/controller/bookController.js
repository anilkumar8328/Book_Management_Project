const validate = require('../validators/validator')
const bookModel = require('../models/bookModel')
const userModel = require('../models/userModel')
const reviewModel = require('../models/reviewModel')
const mongoose = require('mongoose');
const moment = require("moment");
const { locale } = require('moment');


// CREATE BOOK API

const createBook = async function (req, res) {

    try {
        
        let data = req.body
        let { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = data
        console.log(data);
         // userID check
        if (!validate.isValidField(userId))
            return res.status(400).send({ status: false, message: "UserId is required" })

        let userIDcheck = await userModel.findOne({ userId: data.userId })
        if (validate.isValidRequestBody(userIDcheck)) {
            return res.send({ message: `${userId} UserID not found` })
        }
        //Authorization
        if(req.authorIdToken != userId){
            return res.status(400).send({message:"User is not authorized"});
        }
        //Empty body check
        if (!validate.isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Data is required" })
        // Title check
        if (!validate.isValidField(title))
            return res.status(400).send({ status: false, message: "Title is required" })

        let titleCheck = await bookModel.findOne({ title: data.title })
        if (titleCheck) {
            return res.send({ msg: `${title} Title already exists` })
        }
        // Excerpt check
        if (!validate.isValidField(excerpt))
            return res.status(400).send({ status: false, message: "Excerpt is required" })

       
        // ISBN check
        if (!validate.isValidField(ISBN))
            return res.status(400).send({ status: false, message: "ISBN is required" })

        let isbnCheck = await bookModel.findOne({ ISBN: data.ISBN })
        if (isbnCheck) {
            return res.send({ message: `${isbnCheck.ISBN} ISBN already exists` })
        }

        // category check
        if (!validate.isValidField(category))
            return res.status(400).send({ status: false, message: "category is required" })

        // subcategory check
        if (!validate.isValidField(subcategory) && typeof subcategory != 'array')
            return res.status(400).send({ status: false, message: "subcategory is required" })

        // releasedAt check
        if (!validate.isValidField(releasedAt))
            return res.status(400).send({ status: false, message: "Released date is required" })

        //regex check
        if (!(/^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/.test(releasedAt))) {
            return res.status(400).send({ status: false, message: "Released date check" })
        }

        // data creation
        let createdData = await bookModel.create(data)
        res.status(201).send({ status: true, message: 'Success', data: createdData })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
//GET BOOKS BY QUERY

const getDataByQuery = async (req, res) => {
    try {
      if (Object.keys(req.query).length == 0) {
        let getBooks = await bookModel.find({ isDeleted: false }).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1 }).sort({ title: 1 })
  
        if (getBooks.length == 0)
          return res.status(404).send({ status: false, message: "No books exists" })
        return res.status(200).send({ status: true, message: "Books List", data: getBooks })
      }
      else {
        let userId = req.query.userId
        let category = req.query.category
        let subcategory = req.query.subcategory
  
        let getBooks = await bookModel.find({ $and: [{ $or: [{ userId: userId }, { category: category }, { subcategory: subcategory }] }, { isDeleted: false }] }).sort({ title: 1 })
          .select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1 }).collation({ locale: "en", strength: 2 })
  
        if (getBooks.length == 0)
          return res.status(400).send({ status: false, message: "No Books Found" })
  
        res.status(200).send({ status: true, message: "Books List", data: allBooks })
      }
    }
    catch (error) {
      res.status(500).send({ status: false, message: error.message })
    }
  }
  

// GET BOOK BY ID API

const getDataByParams = async (req, res) => {
    try {
        let id = req.params.bookId
        if (!validate.isValidField(id)) return res.status(400).send({ status: false, message: "Book Id is Required" })
        if (!mongoose.isValidObjectId(id)) return res.status(400), send({ status: false, message: "Invalid Book Id" })

        let findBookData = await bookModel.findOne({ _id: id, isDeleted: false }).select({ __v: 0 })
        if (!validate.isValidField(findBookData)) return res.status(404).send("Dataa Not Found")

        let findReviewData = await reviewModel.find({ bookId: id, isDeleted: false }).select({ isDeleted: 0 }).collation({locale:'en', strength:2})

        let setData = findBookData.toObject()

        setData.reviewsData = findReviewData

        res.status(200).send({ status: true, message: "Book List", data: setData })
    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error.message })
    }
}

// delete Book
const deleteBook = async function (req, res) {
    try {
        let bookIdToBeDeleted = req.params.bookId

        if (!bookIdToBeDeleted) { //Book-Id is entered or not
            return res.status(400).send({ status: false, msg: "Book Id is not entered" })
        }
        let validBookId = await bookModel.findOne({ _id: bookIdToBeDeleted });
        if (!validBookId) { //Book-Id is valid or not
            return res.status(400).send({ status: false, msg: "Book Id is invalid" })
        }
        let isDeletedStatus = await bookModel.findOne({ _id: bookIdToBeDeleted, isDeleted: false });

         //Authorization
         if(req.authorIdToken != isDeletedStatus.userId){
            return res.status(400).send({message:"User is not authorized"});
        }

        if (!isDeletedStatus) { //Check whether book-id is present or not
            return res.status(404).send({ status: false, msg: "Book is ALready deleted" })
        }
        let deletedDate = new Date(); //deleted date to be shown using moment


        let data = await bookModel.findByIdAndUpdate({ _id: bookIdToBeDeleted }, 
            { isDeleted: true, deletedAt: deletedDate }, { new: true })

        return res.status(200).send({ status: true, msg: data })
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}



//updateBooksById

const updateBooksById = async function (req, res) {
    try {
        let data = req.body;

        if (!validate.isValidRequestBody(data))
            return res.status(400).send({ status: false, msg: "Data is required" })

        let bookId = req.params.bookId;

        if (!validate.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, msg: "Not a valid book Id" })
        }

        let bookIdCheck = await bookModel.findOne({ _id: bookId, isDeleted: false });

         //Authorization
         if(req.authorIdToken != bookIdCheck.userId){
            return res.status(400).send({message:"User is not authorized"});
        }

        if (!bookIdCheck) {
            return res.status(400).send({ status: false, msg: "Book not found" })
        }

        // if (!(req.validToken._id = bookIdCheck.userId)) {
        //     return res.status(401).send({ status: false, msg: "Unauthorized  Access" })
        // }

        let isbnCheck = await bookModel.findOne({ ISBN: data.ISBN })
        if (isbnCheck) {
            return res.status(400).send({ msg: `${isbnCheck.ISBN} ISBN already exists` })
        } 
        let updatedBooks = {}

        if (validate.isValidField(data.title)) {
            updatedBooks.title = data.title
        }

        if (validate.isValidField(data.excerpt)) {
            updatedBooks.excerpt = data.excerpt
        }

        if (validate.isValidField(data.ISBN)) {
            updatedBooks.ISBN = data.ISBN
        }

        if (validate.isValidField(data.releasedAt)) {
            updatedBooks.releasedAt = data.releasedAt
        }

        let update = await bookModel.findOneAndUpdate({ _id: bookId},{ data: updatedBooks, })

        res.status(200).send({ status: true, message: "successfully Updated", data: update })

    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error.message })
    }
}

module.exports.updateBooksById = updateBooksById
module.exports.deleteBook = deleteBook
module.exports.createBook = createBook
module.exports.getDataByParams = getDataByParams
module.exports.getDataByQuery = getDataByQuery