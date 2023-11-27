const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");

const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.find().populate("book").exec();

  res.render("layout", {
    view: "bookinstance_list",
    title: "Book Instance List",
    locals: { bookinstance_list: allBookInstances },
  });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();

  if (bookInstance === null) {
    const err = new Error("Book copy not found");
    err.status = 404;
    return next(err);
  }

  res.render("layout", {
    view: "bookinstance_detail",
    title: `Copy: ${bookInstance.book.title}`,
    locals: {
      bookinstance: bookInstance,
    },
  });
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allbooks = await Book.find({}, "title").exec();

  res.render("layout", {
    view: "bookinstance_form",
    title: "Create BookInstance",
    locals: {
      book_list: allbooks,
      errors: undefined,
      selected_book: undefined,
      bookinstance: undefined,
    },
  });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body("book", "Book must be specified.").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date.")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      const allBooks = await Book.find({}, "title").exec();

      res.render("layout", {
        view: "bookinstance_form",
        title: "Create BookInstance",
        locals: {
          errors: errors.array(),
          bookinstance: bookInstance,
          selected_book: bookInstance.book.toString(),
          book_list: allBooks,
        },
      });
      return;
    } else {
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }
  }),
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id);

  if (!bookInstance) {
    res.redirect("/catalog/bookinstances");
    return;
  }

  res.render("layout", {
    view: "bookinstance_delete",
    title: "Delete bookinstance",
    locals: {
      bookinstance: bookInstance,
    },
  });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.body.bookinstanceid);

  if (!bookInstance || req.body.bookinstanceid != req.params.id) {
    res.redirect("/catalog/bookinstances");
    return;
  }

  const book = await Book.findById(bookInstance.book);

  await BookInstance.findByIdAndDelete(req.body.bookinstanceid);
  res.redirect(book.url);
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  const [bookInstance, allbooks] = await Promise.all([
    BookInstance.findById(req.params.id).exec(),
    Book.find({}, "title").exec(),
  ]);

  res.render("layout", {
    view: "bookinstance_form",
    title: "Update BookInstance",
    locals: {
      book_list: allbooks,
      errors: undefined,
      selected_book: bookInstance.book.toString(),
      bookinstance: bookInstance,
    },
  });
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body("book", "Book must be specified.").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date.")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const updatedBookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      const allBooks = await Book.find({}, "title").exec();

      res.render("layout", {
        view: "bookinstance_form",
        title: "Update BookInstance",
        locals: {
          errors: errors.array(),
          bookinstance: updatedBookInstance,
          selected_book: updatedBookInstance.book.toString(),
          book_list: allBooks,
        },
      });
      return;
    } else {
      await BookInstance.findByIdAndUpdate(
        updatedBookInstance._id,
        updatedBookInstance,
        {}
      );
      res.redirect(updatedBookInstance.url);
    }
  }),
];
