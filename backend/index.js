require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const { initFirebase } = require("./config/firebase");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
app.use(cors());
app.use(express.json());

initFirebase();

app.get("/", (req, res) => res.json({ status: "EZER Supermarket API running ✅" }));

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/media", require("./routes/media.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/inventory", require("./routes/inventory.routes"));
app.use("/api/delivery", require("./routes/delivery.routes"));
app.use("/api/payment", require("./routes/payment.routes"));
app.use("/api/stats", require("./routes/stats.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`EZER Supermarket API on port ${PORT}`)))
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });
