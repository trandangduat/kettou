import express from "express";
import bcrypt from "bcrypt";
import db from "./db.js";
import cors from "cors";

const app = express();
const port = 3000;
const saltRounds = 10;

app.get("/", (req, res) => {
    res.send("lmaoooooooo");
});

app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:3001",
    }),
);

app.post("/register", (req, res) => {
    console.log(req.body);
    if (!req.body) return res.status(400).send("No req body");
    const { username, password } = req.body;
    const rows = db
        .prepare(`SELECT * FROM users WHERE username = ?`)
        .get(username);
    if (rows) return res.status(400).send("Username already exists");
    bcrypt.hash(password, saltRounds, (err, hashed) => {
        if (err) return res.status(500).send(err);
        db.prepare(`INSERT INTO users(username, password) VALUES (?, ?)`).run(
            username,
            hashed,
        );
        res.send("User registered successfully");
    });
});

app.post("/login", (req, res) => {
    if (!req.body) return res.status(400).send("No req body");
    const { username, password } = req.body;
    const rows = db
        .prepare(`SELECT * FROM users WHERE username = ?`)
        .get(username);
    if (!rows) return res.status(400).send("Username does not exist");
    bcrypt.compare(password, rows.password, (err, result) => {
        if (err) return res.status(500).send(err);
        if (!result) return res.status(400).send("Incorrect password");
        res.send("Login successful");
    });
});

app.listen(port, "localhost", () => {
    console.log(`Server is running on port ${port}`);
});
