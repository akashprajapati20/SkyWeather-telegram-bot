const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");
const app = express();
const { connectToMongoDB } = require("./connect");
const User = require("./models/userSchema");
const cron = require("node-cron");
require("dotenv").config();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

connectToMongoDB(process.env.MONGO_URI)
  .then(() => console.log("Mongodb connected"))
  .catch((err) => {
    console.log("not connected", err);
  });

const port = process.env.PORT || 5050;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// replace the value below with the Telegram token you receive from @BotFather
const token = "6668089284:AAGBN85Akh8q3ORXlUzswhbPnPvg-4pRb7c";

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  const existingUser = await User.findOne({ telegramId: chatId });

  if (existingUser) {
    bot.sendMessage(chatId, "You are already registered.");
  } else {
    const newUser = new User({
      telegramId: chatId,
    });
    await newUser.save();
  }

  bot.sendMessage(chatId, "Thanks! Please provide your name:");

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    const existingUser = await User.findOne({ telegramId: chatId });

    if (existingUser) {
      if (!existingUser.name) {
        existingUser.name = text;
        await existingUser.save();
        await bot.sendMessage(
          chatId,
          "Thanks! You have successfully registered your name!\nNow, Please Provide your country."
        );
      } else if (!existingUser.country) {
        existingUser.country = text;
        await existingUser.save();
        await bot.sendMessage(
          chatId,
          "Thanks! You have successfully registered your country!\nNow, Please Provide your city."
        );
      } else if (!existingUser.city) {
        existingUser.city = text;
        await existingUser.save();
        await bot.sendMessage(
          chatId,
          "Thanks! You have successfully registered your city!"
        );
      }
    } else {
      bot.sendMessage(chatId, "You need to start by typing /start");
    }
  });
});

const fetchData = async (chatId) => {
  try {
    const user = await User.findOne({ telegramId: chatId });
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${
        user?.city ?? "london"
      }&appid=e25934bd0d08f298e7c9351ac52859bc&units=metric`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
};

cron.schedule(
  "*/20 * * * * *",
  async () => {
    const allUsers = await User.find({});
    allUsers.map(async (user) => {
      const data = await fetchData(user.telegramId);
      const weather = data.weather[0].description;
      const temperature = data.main.temp;
      const city = data.name;
      const humidity = data.main.humidity;
      const pressure = data.main.pressure;
      const windSpeed = data.wind.speed;
      const message = `The weather in ${city} is ${weather} with a temperature of ${temperature.toFixed(
        2
      )}°C. The humidity is ${humidity}%, the pressure is ${pressure}hPa, and the wind speed is ${windSpeed}m/s.`;
      await bot.sendMessage(user.telegramId, message);
    });
  },
  {
    timezone: "Asia/Kolkata", // Specify your timezone here
  }
);
