//app.js
const express = require('express');
const app = express();
const server = require('http').Server(app);

//Socket.io
const io = require('socket.io')(server);
let onlinePlayers = {};
let gameState = {
  phase: 'lobby', // 'lobby', 'active', 'complete'
  currentQuestion: 0,
  totalQuestions: 20,
  questionStartTime: null,
  players: new Map()
};

// quiz quesntions
const questions = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correct: 2
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correct: 1
  },
  {
    question: "What is 77 + 33?",
    options: ["100", "110", "120", "90"],
    correct: 1
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Picasso", "Da Vinci", "Monet"],
    correct: 2
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Pacific", "Indian", "Arctic"],
    correct: 1
  },
  {
    question: "Which country is famous for the Great Wall?",
    options: ["Japan", "China", "Korea", "Mongolia"],
    correct: 1
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correct: 2
  },
  {
    question: "How many continents are there?",
    options: ["5", "6", "7", "8"],
    correct: 2
  },
  {
    question: "What is the fastest land animal?",
    options: ["Lion", "Cheetah", "Horse", "Gazelle"],
    correct: 1
  },
  {
    question: "Which is the smallest prime number?",
    options: ["0", "1", "2", "3"],
    correct: 2
  },
  {
    question: "What does 'WWW' stand for?",
    options: ["World Wide Web", "World War Won", "Wild Wild West", "We Will Win"],
    correct: 0
  },
  {
    question: "Which gas do plants absorb from the atmosphere?",
    options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
    correct: 2
  },
  {
    question: "What is the hardest natural substance?",
    options: ["Gold", "Iron", "Diamond", "Platinum"],
    correct: 2
  },
  {
    question: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"],
    correct: 1
  },
  {
    question: "What is the capital of Australia?",
    options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
    correct: 2
  },
  {
    question: "Which instrument measures earthquakes?",
    options: ["Thermometer", "Barometer", "Seismograph", "Hygrometer"],
    correct: 2
  },
  {
    question: "What is the largest mammal?",
    options: ["Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
    correct: 1
  },
  {
    question: "How many bones are in an adult human body?",
    options: ["196", "206", "216", "226"],
    correct: 1
  },
  {
    question: "What is the smallest country in the world?",
    options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
    correct: 1
  },
  {
    question: "Which vitamin is produced when skin is exposed to sunlight?",
    options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"],
    correct: 3
  }
];

io.on("connection", (socket) => {
  require('./sockets/quiz.js')(io, socket, onlinePlayers, gameState, questions);
})

//Express View Engine for Handlebars
const { engine } = require('express-handlebars');
app.engine('handlebars', engine({ defaultLayout: false }));
app.set('view engine', 'handlebars');
//Establish your public folder
app.use('/static', express.static('static'))

app.get('/', (req, res) => {
  res.render('index.handlebars');
})

server.listen('3000', () => {
  console.log('Quiz Battle Server listening on Port 3000');
})