import { Router } from "express";
import {
  getMovies,
  getMovieById,
  getMoviesByGenre,
  getSimilarMovies,
  getGames,
  getGameById,
  getGamesByGenre,
  getBooks,
  getBookById,
  getBooksByGenre,
  getBooksByAuthor,
} from "../controllers/lifeContentController.js";

const router = Router();

// Movie routes
router.get("/movies", getMovies);
router.get("/movies/genre/:genre", getMoviesByGenre);
router.get("/movies/:id/similar", getSimilarMovies);
router.get("/movies/:id", getMovieById);

// Game routes
router.get("/games", getGames);
router.get("/games/genre/:genre", getGamesByGenre);
router.get("/games/:id", getGameById);

// Book routes
router.get("/books", getBooks);
router.get("/books/genre/:genre", getBooksByGenre);
router.get("/books/author/:author", getBooksByAuthor);
router.get("/books/:id", getBookById);

export default router;
