const express = require("express");
const path = require("path");

const app = express();
const buildPath = __dirname + "/client/build";

app.get("/", (req, res) => {
    res.sendFile(path.join(buildPath, "/index.html"));
});
app.use(express.static(__dirname + "/client/build"));

app.listen(8080, () => {
    console.log("Listening on port 8080...");
});
