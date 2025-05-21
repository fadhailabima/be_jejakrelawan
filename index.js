const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const routes = require("./src/routes/index.routes");
const cors = require("cors");
require("dotenv").config();
const session = require("express-session");
const liveReload = require("connect-livereload");
const cookieParser = require("cookie-parser");

const port = process.env.PORT || 8080;

const corsOptions = {
  origin: process.env.WEB_URL || "http://localhost:3001",
  httpOnly: false,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Server is running and ready for requests.");
});

app.use(
  session({
    secret: process.env.SECRET_KEY || "defaultSecretKey",
    resave: true,
    saveUninitialized: true,
    cookie: {
      sameSite: "strict",
    },
  })
);
if (process.env.NODE_ENV === "development") {
  app.use(liveReload());
}

app.use("/api", routes);

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
