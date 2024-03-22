// index.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const channelRoutes = require("./routes/routes.js");
const cron = require("node-cron");
const Task = require("./models/Task.js"); // Import the Task model
const {
  updateMonthlyData,
  updateDailyData,
  updateWeeklyData,
} = require("./controllers/channelController.js"); // Import your controller functions

const uri =
  "mongodb://mahletk:mahletk@ac-t1ilocc-shard-00-00.ipt4eq5.mongodb.net:27017,ac-t1ilocc-shard-00-01.ipt4eq5.mongodb.net:27017,ac-t1ilocc-shard-00-02.ipt4eq5.mongodb.net:27017/?ssl=true&replicaSet=atlas-fb6kh8-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

const app = express();

// Enable CORS
app.use(cors());

// Connect to MongoDB
mongoose.connect(uri, {});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Middleware
app.use(express.json());

// Routes
app.use("/", channelRoutes);

// Define the initializeScheduledTasks function
async function initializeScheduledTasks() {
  try {
    // Retrieve all tasks from the database
    const tasks = await Task.find();
    // Iterate over the tasks and schedule them using cron.schedule
    tasks.forEach((task) => {
      // Schedule the daily task
      const dailyCronObj = task.daily[0];
      if (dailyCronObj) {
        cron.schedule(dailyCronObj.expression, () => {
          updateDailyData(task.channelId);
        });
      }
      // Schedule the weekly task
      const weeklyCronObj = task.weekly[0];
      if (weeklyCronObj) {
        cron.schedule(weeklyCronObj.expression, () => {
          updateWeeklyData(task.channelId);
        });
      }
      // Schedule the monthly task
      const monthlyCronObj = task.monthly[0];
      if (monthlyCronObj) {
        cron.schedule(monthlyCronObj.expression, () => {
          updateMonthlyData(task.channelId);
        });
      }
    });
  } catch (error) {
    console.error("Error initializing scheduled tasks:", error.message);
  }
}

// Call initializeScheduledTasks when the server starts
initializeScheduledTasks();

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
