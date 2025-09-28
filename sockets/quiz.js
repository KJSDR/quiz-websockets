//sockets/quiz.js
module.exports = (io, socket, onlinePlayers, gameState, questions) => {

  socket.on('player-join', (playerName) => {
    // Save the player
    onlinePlayers[playerName] = socket.id;
    socket["playerName"] = playerName;
    
    // Initialize player in game state
    gameState.players.set(socket.id, {
      id: socket.id,
      name: playerName,
      score: 0,
      currentAnswer: null,
      answerTime: null
    });

    console.log(`🎮 ${playerName} joined the quiz battle! 🎮`);
    
    // Send current game state to new player
    socket.emit('game-state-update', {
      phase: gameState.phase,
      currentQuestion: gameState.currentQuestion,
      totalQuestions: gameState.totalQuestions,
      players: Array.from(gameState.players.values())
    });

    // Notify all players of new player
    io.emit("player-joined", {
      playerName: playerName,
      players: Array.from(gameState.players.values())
    });
  });

  socket.on('start-game', () => {
    if (gameState.phase === 'lobby' && gameState.players.size >= 2) {
      gameState.phase = 'active';
      gameState.currentQuestion = 0;
      
      // Reset all player scores
      gameState.players.forEach(player => {
        player.score = 0;
        player.currentAnswer = null;
        player.answerTime = null;
      });

      io.emit('game-started', {
        message: 'Quiz Battle Started! Get ready for question 1...',
        totalQuestions: gameState.totalQuestions
      });

      // Start first question after a short delay
      setTimeout(() => {
        sendQuestion();
      }, 2000);
    }
  });

  socket.on('submit-answer', (answerIndex) => {
    if (gameState.phase !== 'active') return;
    
    const player = gameState.players.get(socket.id);
    if (!player || player.currentAnswer !== null) return; // Already answered

    const currentTime = Date.now();
    player.currentAnswer = answerIndex;
    player.answerTime = currentTime;

    console.log(`${player.name} answered: ${answerIndex} at time ${currentTime}`);

    // Immediately notify all players that this player answered
    io.emit('player-answered', {
      playerName: player.name,
      hasAnswered: true
    });

    // Check if all players have answered
    const allAnswered = Array.from(gameState.players.values())
      .every(p => p.currentAnswer !== null);

    if (allAnswered) {
      // Clear the auto-process timer since everyone answered
      if (gameState.questionTimer) {
        clearTimeout(gameState.questionTimer);
        gameState.questionTimer = null;
      }
      
      setTimeout(() => {
        processAnswers();
      }, 1000); // Small delay for dramatic effect
    }
  });

  socket.on('get-leaderboard', () => {
    const leaderboard = Array.from(gameState.players.values())
      .sort((a, b) => b.score - a.score);
    socket.emit('leaderboard-update', leaderboard);
  });

  function sendQuestion() {
    if (gameState.currentQuestion >= questions.length || gameState.currentQuestion >= gameState.totalQuestions) {
      endGame();
      return;
    }

    const question = questions[gameState.currentQuestion];
    gameState.questionStartTime = Date.now();

    // Reset player answers for this question
    gameState.players.forEach(player => {
      player.currentAnswer = null;
      player.answerTime = null;
    });

    io.emit('question-broadcast', {
      questionNumber: gameState.currentQuestion + 1,
      totalQuestions: gameState.totalQuestions,
      question: question.question,
      options: question.options,
      timeLimit: 15000 // Increased to 15 seconds for more time
    });

    // Store the timer reference so we can clear it if needed
    gameState.questionTimer = setTimeout(() => {
      console.log('Time limit reached, processing answers...');
      processAnswers();
    }, 15000);
  }

  function processAnswers() {
    // Clear the timer to prevent double processing
    if (gameState.questionTimer) {
      clearTimeout(gameState.questionTimer);
      gameState.questionTimer = null;
    }

    const question = questions[gameState.currentQuestion];
    const correctAnswer = question.correct;
    
    console.log(`Processing answers for question ${gameState.currentQuestion + 1}`);
    console.log(`Correct answer index: ${correctAnswer}`);
    
    // Debug: Log all player answers
    gameState.players.forEach(player => {
      console.log(`${player.name}: answered ${player.currentAnswer}, time: ${player.answerTime}`);
    });
    
    // Calculate scores based on speed and correctness
    const correctAnswers = [];
    gameState.players.forEach(player => {
      if (player.currentAnswer === correctAnswer && player.answerTime !== null) {
        correctAnswers.push({
          player: player,
          responseTime: player.answerTime - gameState.questionStartTime
        });
      }
    });

    // Sort by response time (fastest first)
    correctAnswers.sort((a, b) => a.responseTime - b.responseTime);

    // Assign points based on ranking
    correctAnswers.forEach((answer, index) => {
      let points = 0;
      switch(index) {
        case 0: points = 100; break; // First place
        case 1: points = 80; break;  // Second place
        case 2: points = 60; break;  // Third place
        default: points = 40; break; // Everyone else
      }
      answer.player.score += points;
      console.log(`${answer.player.name} gets ${points} points (position ${index + 1})`);
    });

    // Prepare results
    const results = {
      questionNumber: gameState.currentQuestion + 1,
      correctAnswer: correctAnswer,
      correctOption: question.options[correctAnswer],
      playerResults: Array.from(gameState.players.values()).map(player => ({
        name: player.name,
        answer: player.currentAnswer,
        isCorrect: player.currentAnswer === correctAnswer,
        points: correctAnswers.find(ca => ca.player.id === player.id) ? 
          correctAnswers.find(ca => ca.player.id === player.id).points || 0 : 0,
        totalScore: player.score
      })),
      leaderboard: Array.from(gameState.players.values())
        .sort((a, b) => b.score - a.score)
    };

    console.log('Sending results:', results);
    io.emit('question-results', results);

    gameState.currentQuestion++;

    // Continue to next question or end game
    setTimeout(() => {
      if (gameState.currentQuestion < gameState.totalQuestions && gameState.currentQuestion < questions.length) {
        sendQuestion();
      } else {
        endGame();
      }
    }, 4000); // Show results for 4 seconds
  }

  function endGame() {
    gameState.phase = 'complete';
    
    const finalLeaderboard = Array.from(gameState.players.values())
      .sort((a, b) => b.score - a.score);

    const winner = finalLeaderboard[0];

    io.emit('game-complete', {
      winner: winner,
      finalLeaderboard: finalLeaderboard,
      message: `🎉 ${winner.name} wins with ${winner.score} points! 🎉`
    });

    // Reset game after 10 seconds
    setTimeout(() => {
      gameState.phase = 'lobby';
      gameState.currentQuestion = 0;
      gameState.players.forEach(player => {
        player.score = 0;
        player.currentAnswer = null;
        player.answerTime = null;
      });
      
      io.emit('game-reset', {
        message: 'Game reset! Ready for another round?',
        players: Array.from(gameState.players.values())
      });
    }, 10000);
  }

  // Handle player disconnect
  socket.on('disconnect', () => {
    if (socket.playerName) {
      delete onlinePlayers[socket.playerName];
      gameState.players.delete(socket.id);
      
      io.emit('player-left', {
        playerName: socket.playerName,
        players: Array.from(gameState.players.values())
      });
      
      console.log(`${socket.playerName} left the quiz battle`);
    }
  });
};