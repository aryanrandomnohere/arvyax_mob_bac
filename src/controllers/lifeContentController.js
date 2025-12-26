import Movie from "../models/Movie.js";
import Game from "../models/Game.js";
import Book from "../models/Book.js";

/**
 * GET /api/life/movies
 * Returns all active movies
 */
export const getMovies = async (req, res) => {
  try {
    const movies = await Movie.getActiveMovies();
    return res.json({ movies });
  } catch (err) {
    console.error("GET MOVIES ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/life/movies/:id
 * Returns a single movie by ID
 */
export const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;

    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    if (!movie.isActive) {
      return res.status(404).json({ error: "Movie not available" });
    }

    return res.json({ movie });
  } catch (err) {
    console.error("GET MOVIE BY ID ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/life/movies/genre/:genre
 * Returns movies by genre
 */
export const getMoviesByGenre = async (req, res) => {
  try {
    const { genre } = req.params;
    const { limit = 10, excludeId } = req.query;

    const movies = await Movie.getMoviesByGenre(
      genre,
      parseInt(limit),
      excludeId
    );
    return res.json({ movies, genre });
  } catch (err) {
    console.error("GET MOVIES BY GENRE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/life/movies/:id/similar
 * Returns similar movies based on shared genres
 */
export const getSimilarMovies = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    const movie = await Movie.findById(id);
    console.log("SOURCE MOVIE:", {
      id,
      title: movie?.title,
      genre: movie?.genre,
      genres: movie?.genres,
    });

    const movies = await Movie.getSimilarMovies(id, parseInt(limit));
    console.log("FOUND SIMILAR MOVIES:", movies.length);

    return res.json({
      movies,
      source: movie
        ? {
            id: movie._id,
            title: movie.title,
            genre: movie.genre || movie.genres,
          }
        : null,
    });
  } catch (err) {
    console.error("GET SIMILAR MOVIES ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/life/games
 * Returns all active games
 */
export const getGames = async (req, res) => {
  try {
    const games = await Game.getActiveGames();
    console.log("GET GAMES:", games.length);
    return res.json({ games });
  } catch (err) {
    console.error("GET GAMES ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/life/games/:id
 * Returns a single game by ID
 */
export const getGameById = async (req, res) => {
  try {
    const { id } = req.params;

    const game = await Game.findById(id);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (!game.isActive) {
      return res.status(404).json({ error: "Game not available" });
    }

    return res.json({ game });
  } catch (err) {
    console.error("GET GAME BY ID ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/life/games/genre/:genre
 * Returns games by genre
 */
export const getGamesByGenre = async (req, res) => {
  try {
    const { genre } = req.params;
    const { limit = 10, excludeId } = req.query;

    const games = await Game.getGamesByGenre(genre, parseInt(limit), excludeId);
    return res.json({ games, genre });
  } catch (err) {
    console.error("GET GAMES BY GENRE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/life/books
 * Returns all active books
 */
export const getBooks = async (req, res) => {
  try {
    const books = await Book.getActiveBooks();
    console.log("GET BOOKS:", books.length);
    return res.json({ books });
  } catch (err) {
    console.error("GET BOOKS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/life/books/:id
 * Returns a single book by ID
 */
export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    if (!book.isActive) {
      return res.status(404).json({ error: "Book not available" });
    }

    return res.json({ book });
  } catch (err) {
    console.error("GET BOOK BY ID ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/life/books/genre/:genre
 * Returns books by genre
 */
export const getBooksByGenre = async (req, res) => {
  try {
    const { genre } = req.params;
    const { limit = 10, excludeId } = req.query;

    const books = await Book.getBooksByGenre(genre, parseInt(limit), excludeId);
    return res.json({ books, genre });
  } catch (err) {
    console.error("GET BOOKS BY GENRE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/life/books/author/:author
 * Returns books by author
 */
export const getBooksByAuthor = async (req, res) => {
  try {
    const { author } = req.params;
    const { excludeId } = req.query;

    const books = await Book.getBooksByAuthor(author, excludeId);
    return res.json({ books, author });
  } catch (err) {
    console.error("GET BOOKS BY AUTHOR ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
