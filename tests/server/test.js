const express = require("express");
const app = express();

app.get("/api/test", (req, res) => {
  res.send("It works!");
});

app.listen(5050, () => {
  console.log("Test server running on port 5050");
});

