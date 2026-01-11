import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { type User } from "@shared/schema";
import { randomUUID } from "crypto"; // at the top if not already there

export function setupLocalAuth(app: express.Express) {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-local-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for local development
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  }));

  // Login route
app.post("/api/auth/login", async (req, res) => {
  const { email, password, keepLoggedIn } = req.body;
  console.log(" Login attempt:", email);

  try {
    // 1. Ensure users file is initialized
    const users = await storage.getUsers();
    console.log("📂 Loaded users:", users);

    if (users.length === 0) {
      console.log("⚠️ No users found, creating default admin...");
      const hashedPassword = await bcrypt.hash("admin123", 10);
     // Inside your auto-create admin block
await storage.createUser({
  id: randomUUID(), // 👈 Add this line
  email: "admin@school.com",
  password: hashedPassword,
  firstName: "Admin",
  lastName: "User",
  role: "admin"
});
      console.log(" Default admin created");
    }

    // 2. Try to find the user
    const user = await storage.getUserByEmail(email);
    console.log("🔍 Found user:", user);

    if (!user||!user.password) {
      console.log(" No user found with that email");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3. Check password
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      console.log("Password mismatch");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4. Store user in session
    const { password: _, ...userWithoutPassword } = user;
(req.session as any).user = userWithoutPassword;
    console.log("✅ Login successful. Session set:", req.session.user);

    res.json(userWithoutPassword);
  } catch (error) {
    console.error(" Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});


  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get current user
  app.get('/api/auth/user', (req, res) => {
    const user = (req.session as any)?.user;
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Register route (for creating new users)
  app.post('/api/auth/register', async (req, res) => {
  const { email, password, firstName, lastName, keepLoggedIn } = req.body;

  try {
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'admin',
    });

    const { password: _, ...userWithoutPassword } = user;
    (req.session as any).user = userWithoutPassword;

    // 🆕 Adjust session duration
    if (keepLoggedIn) {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days
    } else {
      req.session.cookie.maxAge = 1000 * 60 * 60; // 1 hour
    }

    console.log("✅ Registration successful. Session set:", req.session.user);
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});
}
export const isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req.session as any)?.user;
  if (user) {
    req.user = user;
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};