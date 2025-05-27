const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, process.env.NEXTAUTH_SECRET, (err, decoded) => {
    
    if (err) {
      console.error("JWT verification failed:", err.message);
      return res.status(403).json({ error: "Invalid token" });
    }
    
    req.user = decoded; // Contains googleId, email, name
    next();
  });
};

module.exports = authenticateToken;