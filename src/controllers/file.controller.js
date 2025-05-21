// import path
const path = require("path");
const fs = require("fs");

const serveFile = async (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, "../../uploads", fileName);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.status(404).json({ message: "File not found" });
    } else {
      res.sendFile(filePath);
    }
  });
};

module.exports = {
  serveFile,
};
