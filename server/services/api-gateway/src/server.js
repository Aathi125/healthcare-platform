require("dotenv").config();
const app = require("./app");

const port = Number(process.env.PORT) || 8090;

app.listen(port, () => {
  console.log(`api-gateway listening on http://localhost:${port}`);
});
