const Genre = require("../models/genre");
const Book = require("../models/book");

const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find().sort({ name: 1 }).exec();
  res.render("layout", {
    title: "Genre List",
    view: "genre_list",
    locals: {
      genre_list: allGenres,
    },
  });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }).exec(),
  ]);
  if (genre === null) {
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }
  res.render("layout", {
    title: `${genre.name} books`,
    view: "genre_detail",
    locals: {
      genre: genre,
      genre_books: booksInGenre,
    },
  });
});

// Display Genre create form on GET.
exports.genre_create_get = asyncHandler(async (req, res, next) => {
  res.render("layout", {
    view: "genre_form",
    title: "Create genre",
    locals: { genre: undefined, errors: undefined },
  });
});

// Handle Genre create on POST.
exports.genre_create_post = [
  body("name", "Genre must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      res.render("layout", {
        view: "genre_form",
        title: "Create genre",
        locals: {
          genre: genre,
          errors: errors.array(),
        },
      });

      return;
    } else {
      const genreExists = await Genre.findOne({ name: req.body.name })
        .collation({ locale: "en", strength: 2 })
        .exec();

      if (genreExists) {
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        res.redirect(genre.url);
      }
    }
  }),
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  const [genre, allBooksWithGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }).exec(),
  ]);

  if (!genre) {
    res.redirect("/catalog/genres");
    return;
  }

  res.render("layout", {
    view: "genre_delete",
    title: "Delete Genre",
    locals: {
      genre,
      genre_books: allBooksWithGenre,
    },
  });
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  const [genre, allBooksWithGenre] = await Promise.all([
    Genre.findById(req.body.genreid).exec(),
    Book.find({ genre: req.body.genreid }).exec(),
  ]);

  if (!genre || req.body.genreid != req.params.id) {
    res.redirect("/catalog/genres");
    return;
  }

  if (allBooksWithGenre.length > 0) {
    res.render("layout", {
      view: "genre_delete",
      title: "Delete Genre",
      locals: {
        genre,
        genre_books: allBooksWithGenre,
      },
    });
  } else {
    await Genre.findByIdAndDelete(req.body.genreid);
    res.redirect("/catalog/genres");
  }
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id).exec();

  res.render("layout", {
    view: "genre_form",
    title: "Update genre",
    locals: { genre, errors: undefined },
  });
});

// Handle Genre update on POST.
exports.genre_update_post = [
  body("name", "Genre must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const updatedGenre = new Genre({ name: req.body.name, _id: req.params.id });

    if (!errors.isEmpty()) {
      res.render("layout", {
        view: "genre_form",
        title: "Create genre",
        locals: {
          genre: updatedGenre,
          errors: errors.array(),
        },
      });

      return;
    } else {
      const genreExists = await Genre.findOne({ name: req.body.name })
        .collation({ locale: "en", strength: 2 })
        .exec();

      if (genreExists) {
        res.redirect(genreExists.url);
      } else {
        await Genre.findByIdAndUpdate(updatedGenre._id, updatedGenre, {});
        res.redirect(updatedGenre.url);
      }
    }
  }),
];
