const app = require("./src/app");
const { PORT } = require("./src/config/env");
const logger = require("./src/libs/logger");


// app.listen(PORT, () => logger.info(`✅ Backend: http://192.168.1.153:${PORT}`));
app.listen(PORT, () => logger.info(`✅ Backend: http://localhost:${PORT}`));
// app.listen(PORT, () => logger.info(`✅ Backend: https://nmcuatptaxapi.nmcuat.com`));
