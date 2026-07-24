// import dotenv from "dotenv";
// dotenv.config();

// import app from "./app";

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//     console.log("--------------------------------");
//     console.log(`Server running on port ${PORT}`);
//     console.log(`http://localhost:${PORT}`);
//     console.log("--------------------------------");
// });

console.log("Step 1");

import dotenv from "dotenv";
dotenv.config();

console.log("Step 2");

import app from "./app";

console.log("Step 3");

const PORT = process.env.PORT || 3000;

console.log("Step 4");

app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log(`Server running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
    console.log("--------------------------------");
});