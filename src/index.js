import app from "./app.js";
import config from "./config.js";
import { MongoDB } from "./database/MongoDB/MongoDB.js";
import { MySQL } from "./database/MySQL/MySQL.js";

const PORT = config.PORT || 3000;
const start = performance.now();

app.listen(PORT, () => {
  console.log(`Server-startup -> ${(performance.now() - start).toFixed(2)}.ms`);
  console.log(`Server on ${PORT}`);
  MongoDB();
  MySQL();
});
