const app = require("./app");
const dotenv = require("dotenv");

const connectDatabase = require("./config/database");

// Config

dotenv.config({ path: "backend/config/config.env" });

// Connecting to Database
connectDatabase();


// 
const server = app.listen(process.env.PORT, () => {
    console.log(`Server is working on ${process.env.PORT}`)
})

//unhandled promise rejetcion
process.on("unhandledRejection", err => {
    console.log(`Error: ${err.message}`);
    console.log("Shutting down server  ")
    server.close(() => {
        process.exit(1);
    })
})