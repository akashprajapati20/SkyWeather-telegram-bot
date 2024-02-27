const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");
const app = express();
const { connectToMongoDB } = require("./connect");
const User = require("./models/userSchema")

app.get("/", (req, res) => {
  res.send("Hello World!");
});

connectToMongoDB(
  // "mongodb+srv://akashprajapati224224:Akash12345@cluster2.jlcssxz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster2",
  "mongodb://127.0.0.1:27017/telebot"
)
  .then(() => console.log("Mongodb connected"))
  .catch((err) => {
    console.log("not connected", err);
  });

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
// replace the value below with the Telegram token you receive from @BotFather
const token = "6668089284:AAGBN85Akh8q3ORXlUzswhbPnPvg-4pRb7c";

const bot = new TelegramBot(token, { polling: true });

// Listen for /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // Check if the user is already registered
  const existingUser = await User.findOne({ telegramId: chatId });

  if (existingUser) {
    bot.sendMessage(chatId, 'You are already registered.');
  } else {
    bot.sendMessage(chatId, 'Welcome! Please provide your name:');
  }
});

// Listen for messages to register user
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Check if the user is already registered
  const existingUser = await User.findOne({ telegramId: chatId });

  if (!existingUser) {
    // Assuming user's name is provided first
    const newUser = new User({
      telegramId: chatId,
      name: text,
    });

    // Save user to the database
    await newUser.save();

    // Prompt user for city
    bot.sendMessage(chatId, 'Thanks! Please provide your city:');
  } else if (!existingUser.city) {
    // Update user's city
    existingUser.city = text;
    await existingUser.save();

    // Prompt user for country
    bot.sendMessage(chatId, 'Great! Please provide your country:');
  } else if (!existingUser.country) {
    // Update user's country
    existingUser.country = text;
    await existingUser.save();

    // Registration complete
    bot.sendMessage(chatId, 'Thank you! You are now registered.');
  }
});


bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userInput = msg.text;
  // https://api.openweathermap.org/data/2.5/weather?q=dehradun&APPID=e25934bd0d08f298e7c9351ac52859bc&units=metric

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${userInput}&appid=e25934bd0d08f298e7c9351ac52859bc&units=metric`,
    );
    const data = response.data;
    const weather = data.weather[0].description;
    const temperature = data.main.temp - 273.15;
    const city = data.name;
    const humidity = data.main.humidity;
    const pressure = data.main.pressure;
    const windSpeed = data.wind.speed;
    const message = `The weather in ${city} is ${weather} with a temperature of ${temperature.toFixed(
      2,
    )}°C. The humidity is ${humidity}%, the pressure is ${pressure}hPa, and the wind speed is ${windSpeed}m/s.`;

    bot.sendMessage(chatId, message);
  } catch (error) {
    bot.sendMessage(chatId, "City doesn't exist.");
  }
});










// const express= require("express")
// const PORT = 4040;

// const app=express();

// app.use(express.json());
// app.post("*",async(req,res)=>{
//     res.send("Hello post");
// });

// app.get("*",async(req,res)=>{
//     res.send("Hello post");
// });

// app.listen(PORT,function(err){
//     if(err)console.log(err);
//     console.log("server listening on PORT ",PORT);
// });