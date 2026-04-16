require("dotenv").config();

const app = require("./app");
const { loadSessionsFromDisk } = require("./store/sessionStore");

const PORT = Number(process.env.PORT) || 4007;

loadSessionsFromDisk();

app.listen(PORT, () => {
  console.log(`Telemedicine service running on port ${PORT}`);
});
