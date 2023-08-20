const express = require("express");
const path = require("path");

const app = express();

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/src/index.html"));
});
app.use(express.static(__dirname + "/src"));

app.listen(8080, () => {
    console.log("Listening on port 8080...");
});
