const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
//write code to check is the username is valid
return users.some(user => user.username === username);
}

const authenticatedUser = (username,password)=>{ //returns boolean
//write code to check if username and password match the one we have in records.
return users.some(user => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  //Write your code here
  //return res.status(300).json({message: "Yet to be implemented"});
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({ message: "Error logging in: Username and password required" });
  }

  if (!isValid(username)) {
    return res.status(401).json({ message: "User not registered" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  // Generate JWT token for the user session
  const token = jwt.sign(
    { username: username },
    'access',  // Secret key (use environment variable in production)
    { expiresIn: '1h' }
  );

  req.session.authorization = {
    accessToken: token,
    username: username
  };

  return res.status(200).json({ message: "User successfully logged in", token: token });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  //Write your code here
  //return res.status(300).json({message: "Yet to be implemented"});
  const isbn = req.params.isbn;
  const review = req.query.review;

  if (!isbn || !review) {
    return res.status(400).json({ message: "ISBN and review are required" });
  }

  const username = req.session?.authorization?.username;

  if (!username) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Initialize reviews object if not present
  if (!books[isbn].reviews) {
    books[isbn].reviews = {};
  }

  // Add or update review
  books[isbn].reviews[username] = review;

  return res.status(200).json({
    message: `Review by '${username}' for book with ISBN ${isbn} has been added/updated.`,
    reviews: books[isbn].reviews
  });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
  
    // Check if user is logged in
    const username = req.session?.authorization?.username;
  
    if (!username) {
      return res.status(401).json({ message: "User not authenticated. Please log in." });
    }
  
    // Check if book exists
    if (!books[isbn]) {
      return res.status(404).json({ message: "Book not found." });
    }
  
    // Check if review exists for the user
    const userReview = books[isbn].reviews?.[username];
  
    if (!userReview) {
      return res.status(404).json({ message: "No review found for this user on the given book." });
    }
  
    // Delete the user's review
    delete books[isbn].reviews[username];
  
    return res.status(200).json({
      message: `Review by '${username}' for book with ISBN ${isbn} has been deleted.`,
      reviews: books[isbn].reviews
    });
  });
  

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
