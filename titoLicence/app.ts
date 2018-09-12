const express = require( "express");
const path = require( "path");
const http = require( "http");
const bodyParser = require( "body-parser");
const cors = require( "cors");
const expressValidator = require( "express-validator");
const flash = require( "express-flash");
const dotenv = require( "dotenv");
const lusca = require( "lusca");
const baseController = require( "./src/controllers/baseController");
const compression = require( "compression");
const logger = require( "morgan");



dotenv.config({ path: ".env.example" });

const port = 8800;
const app = express();
app.set("port", port);
app.use(compression());
app.use(logger("dev"));

app.use(cors({
origin: "http://localhost:8800"
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(flash());
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));
app.use(express.static(__dirname + "./www"));
app.use((Request, Response, next) => {
console.log("hello world. Example of Middleware");
next();
});
app.get("/helloWorld", baseController.helloWorld);
app.post("/getLicenceDoc", ( req , res ) => {

baseController.getLicenceDoc(req , res);
});
app.post("/grantLicence", ( req , res ) => {
baseController.grantLicenceAPI( req , res );
});
app.post("/viewTitoLicence", ( req , resp) => {
baseController.viewTitoLicence(req , resp);
});
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "www/index.html"));
});
const server = http.createServer(app);
server.listen(port, () => console.log(`API running on localhost:${port}`));
module.exports = app;