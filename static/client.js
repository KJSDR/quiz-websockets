$(document).ready(() => {

  const socket = io.connect();
  let currentPlayer;
  let gamePhase = 'lobby';
  let questionTimer;

  // join game button
  $('#create-player-btn').click((e) => {
    e.preventDefault();
    if ($('#username-input').val().length > 0) {
      currentPlayer = $('#username-input').val();
      socket.emit('player-join', currentPlayer);
      $('.username-form').remove();
      $('.main-container').css('display', 'flex');
    }
  });

  // start game button
  $('#start-game-btn').click((e) => {
    e.preventDefault();
    socket.emit('start-game');
  });

  // answer button
  $(document).on('click', '.answer-btn', (e) => {
    if (gamePhase !== 'active') return;
    
    const answerIndex = parseInt($(e.target).closest('.answer-btn').data('answer'));
    console.log(`Submitting answer: ${answerIndex}`);
    
    socket.emit('submit-answer', answerIndex);
    
    // disable button in between
    $('.answer-btn').prop('disabled', true).addClass('answered');
    $(e.target).closest('.answer-btn').addClass('selected');
    
    // confirm
    $('.question-header').append('<p class="answer-submitted">✅ Answer submitted!</p>');
  });

  // socket event listen
  socket.on('player-joined', (data) => {
    console.log(`${data.playerName} joined the game`);
    updatePlayersList(data.players);
  });

  socket.on('player-left', (data) => {
    console.log(`${data.playerName} left the game`);
    updatePlayersList(data.players);
  });

  socket.on('game-state-update', (data) => {
    gamePhase = data.phase;
    updateGameDisplay(data);
    updatePlayersList(data.players);
  });

  socket.on('game-started', (data) => {
    gamePhase = 'active';
    $('.game-status').html(`
      <h2>🎮 ${data.message}</h2>
      <p>Total Questions: ${data.totalQuestions}</p>
    `);
    $('.start-game-container').hide();
    $('#start-game-btn').hide();
  });

  socket.on('question-broadcast', (data) => {
    console.log('Received question:', data);
    displayQuestion(data);
    startQuestionTimer(data.timeLimit);
  });

  socket.on('question-results', (data) => {
    console.log('Received results:', data);
    displayResults(data);
    clearTimeout(questionTimer);
  });

  socket.on('game-complete', (data) => {
    gamePhase = 'complete';
    displayGameComplete(data);
  });

  socket.on('game-reset', (data) => {
    gamePhase = 'lobby';
    $('.game-status').html('<h2>Quiz Battle Lobby</h2><p>Waiting for players...</p>');
    $('.question-container').empty();
    $('.results-container').empty();
    $('.start-game-container').show();
    $('#start-game-btn').show();
    updatePlayersList(data.players);
  });

  socket.on('leaderboard-update', (leaderboard) => {
    updateLeaderboard(leaderboard);
  });

  // helper
  function updatePlayersList(players) {
    $('.players-online').empty();
    if (players && players.length > 0) {
      players.forEach(player => {
        $('.players-online').append(`
          <div class="player-online">
            <span class="player-name">${player.name}</span>
            <span class="player-score">${player.score} pts</span>
          </div>
        `);
      });
    }
    
    // button show/hide based on player number
    if (players.length >= 2 && gamePhase === 'lobby') {
      $('#start-game-btn').show();
    } else if (gamePhase === 'lobby') {
      $('#start-game-btn').hide();
    }
  }

  function updateGameDisplay(data) {
    if (data.phase === 'lobby') {
      $('.game-status').html('<h2>Quiz Battle Lobby</h2><p>Waiting for players...</p>');
    } else if (data.phase === 'active') {
      $('.game-status').html(`<h2>Quiz Battle in Progress!</h2><p>Question ${data.currentQuestion + 1} of ${data.totalQuestions}</p>`);
    }
  }

  function displayQuestion(data) {
    $('.question-container').html(`
      <div class="question-header">
        <h3>Question ${data.questionNumber} of ${data.totalQuestions}</h3>
        <div class="timer-bar">
          <div class="timer-fill" id="timer-fill"></div>
        </div>
      </div>
      <div class="question-text">
        <h2>${data.question}</h2>
      </div>
      <div class="answers-grid">
        ${data.options.map((option, index) => `
          <button class="answer-btn" data-answer="${index}">
            <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
            <span class="answer-text">${option}</span>
          </button>
        `).join('')}
      </div>
    `);
    
    $('.results-container').empty();
  }

  function startQuestionTimer(timeLimit) {
    const timerFill = $('#timer-fill');
    let timeLeft = timeLimit;
    
    const countdown = setInterval(() => {
      timeLeft -= 100;
      const percentage = (timeLeft / timeLimit) * 100;
      timerFill.css('width', percentage + '%');
      
      if (timeLeft <= 0) {
        clearInterval(countdown);
        $('.answer-btn').prop('disabled', true).addClass('time-up');
      }
    }, 100);
    
    questionTimer = countdown;
  }

  function displayResults(data) {
    const correctOption = String.fromCharCode(65 + data.correctAnswer);
    
    $('.results-container').html(`
      <div class="results-header">
        <h3>📊 Question ${data.questionNumber} Results</h3>
        <p>Correct Answer: <strong>${correctOption}. ${data.correctOption}</strong></p>
      </div>
      <div class="player-results">
        ${data.playerResults.map(result => `
          <div class="player-result ${result.isCorrect ? 'correct' : 'incorrect'}">
            <span class="result-name">${result.name}</span>
            <span class="result-answer">${result.answer !== null ? String.fromCharCode(65 + result.answer) : 'No Answer'}</span>
            <span class="result-points">+${result.points} pts</span>
            <span class="result-total">${result.totalScore} total</span>
          </div>
        `).join('')}
      </div>
    `);

    // update answer
    $('.answer-btn').each((index, btn) => {
      const $btn = $(btn);
      if (index === data.correctAnswer) {
        $btn.addClass('correct-answer');
      } else {
        $btn.addClass('wrong-answer');
      }
    });

    updatePlayersList(data.leaderboard);
  }

  function displayGameComplete(data) {
    $('.question-container').html(`
      <div class="game-complete">
        <h1>🎉 Game Complete! 🎉</h1>
        <h2>${data.message}</h2>
        <div class="final-leaderboard">
          <h3>🏆 Final Leaderboard 🏆</h3>
          ${data.finalLeaderboard.map((player, index) => `
            <div class="leaderboard-item ${index === 0 ? 'winner' : ''}">
              <span class="rank">${index + 1}.</span>
              <span class="name">${player.name}</span>
              <span class="score">${player.score} points</span>
              ${index === 0 ? '<span class="crown">👑</span>' : ''}
            </div>
          `).join('')}
        </div>
        <p>New game starting in 10 seconds...</p>
      </div>
    `);
    
    $('.results-container').empty();
  }

  function updateLeaderboard(leaderboard) {
    updatePlayersList(leaderboard); // lazy
  }

});