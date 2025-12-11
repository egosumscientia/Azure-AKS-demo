const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("API OK"));

app.listen(3000);
