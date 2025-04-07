let questions = [];

const answer = root_element.querySelector("#answer");
const tbody = root_element.querySelector("#leaderboard-body");
const score_html = root_element.querySelector("#score");
const leaderboard_screen = root_element.querySelector("#leaderboard-screen");
const game_screen = root_element.querySelector("#game-screen");
const back_btn = root_element.querySelector("#back-btn");
const submit_btn = root_element.querySelector("#btn-submit")
const question = root_element.querySelector("#question");
const timer_html = root_element.querySelector("#timer");
const goToG = root_element.querySelector("#goToGame");
const main = root_element.querySelector("#main");
const loader = root_element.querySelector('#loader');

const music_game = root_element.querySelector('#toggle-sound');

const audioManager = {
  soundCorrect: window.soundCorrect || new Audio("/assets/api_lt/base_js_game/music-game/ding.mp3"),
  soundWrong: window.soundWrong || new Audio("/assets/api_lt/base_js_game/music-game/answer_wrong.mp3"),
  soundBackground: window.soundBackground || new Audio("/assets/api_lt/base_js_game/music-game/game_background.mp3"),
  backgroundMusic: window.backgroundMusic || new Audio("/assets/api_lt/base_js_game/music-game/background_music.mp3")
};

let shuffledQuestions = [];
let currentQuestionIndex = 0;
let timeLeft = 30;
let timer;
let score = 0;

answer.addEventListener("paste", function(e) {
    e.preventDefault();
});
answer.addEventListener("contextmenu", function(e) {
    e.preventDefault();
});
question.addEventListener("contextmenu", function (e) {
  e.preventDefault();
});
question.addEventListener("copy", function (e) {
  e.preventDefault();
});
answer.addEventListener('keydown', function(event) {
  event.stopPropagation();
  if (event.key === 'Enter') {
    event.preventDefault();
    submitAnswer()
  }
});

function shuffleQuestions() {
    shuffledQuestions = [...questions]
      .map(q => ({ sort: Math.random(), value: q }))
      .sort((a, b) => a.sort - b.sort)
      .map(q => q.value);
}

function loadQuestionsFromJSON(url) {
    const cachedQuestions = localStorage.getItem("game_questions");
    if (cachedQuestions) {
        questions = JSON.parse(cachedQuestions);
        return Promise.resolve(); 
    }
    loader.style.display = 'flex';
    return fetch(url)
        .then(response => {
            loader.style.display = 'none';
            if (!response.ok) throw new Error("Không thể tải file JSON");
            return response.json();
        })
        .then(data => {
            questions = data;
            localStorage.setItem("game_questions", JSON.stringify(data));
        })
        .catch(error => {
            loader.style.display = 'none';
            console.error("Lỗi khi tải JSON:", error);
        });
}

function load_game_player() {
    loader.style.display = 'flex';
    fetch('/api/method/api_lt.game.get_list_game')
        .then(response => response.json())
        .then(data => {
            loader.style.display = 'none';
            if (data.message) {
                renderLeaderboard(data.message);
            } else {
                console.error('Không thể tải dữ liệu player');
            }
        })
        .catch(error => {
            loader.style.display = 'none';
            console.error('Lỗi khi tải dữ liệu player', error);
        });
}

function renderLeaderboard(data) {
    tbody.innerHTML = "";
    data.forEach((player, index) => {
        let row;
        if (index === 0) {
            row = `<tr class="top-player top1">
                      <td>🔥<span class="player-name"> ${player.custom_full_ame}</span></td>
                      <td><span class="player-score">${player.custom_hightest_score} 👑</span></td>
                   </tr>`;
        } else if (index === 1) {
            row = `<tr class="top-player top2">
                      <td><span class="player-name">⚡ ${player.custom_full_ame}</span></td>
                      <td><span class="player-score">${player.custom_hightest_score} ✨</span></td>
                   </tr>`;
        } else if (index === 2) {
            row = `<tr class="top-player top3">
                      <td><span class="player-name">💎 ${player.custom_full_ame}</span></td>
                      <td><span class="player-score">${player.custom_hightest_score} 🌟</span></td>
                   </tr>`;
        } else {
            row = `<tr>
                      <td>${player.custom_full_ame}</td>
                      <td>${player.custom_hightest_score}</td>
                   </tr>`;
        }
        tbody.innerHTML += row;
    });
}

function goToGame() {
    audioManager.backgroundMusic.pause();
    audioManager.soundBackground.play();
    score = 0;
    score_html.innerText = "Điểm: 0";
    leaderboard_screen.style.display = "none";
    game_screen.style.display = "block";
    shuffleQuestions();
    currentQuestionIndex = 0;
    showQuestion();
    startTimer();
}
  
function goToLeaderboard() {
    if(audioManager.backgroundMusic.pause){
        audioManager.backgroundMusic.play();
    }
    game_screen.style.display = "none";
    back_btn.style.display = "none";
    load_game_player();
    leaderboard_screen.style.display = "block";
    answer.style.display = "";
    submit_btn.style.display = "";
}
  
function showQuestion() {
    const q = shuffledQuestions[currentQuestionIndex];
    question.innerText = q.question;
    answer.value = "";
    timeLeft = 30;
    timer_html.innerText = "Thời gian: " + timeLeft;
}
  
function startTimer() {
    timer = setInterval(() => {
      timeLeft--;
      timer_html.innerText = "Thời gian: " + timeLeft;
      if (timeLeft <= 0) {
            clearInterval(timer);
            endGame("⏰ Hết giờ! Tổng điểm: "+score);
      }
    }, 1000);
}
  
function submitAnswer() {
    const userAnswer = answer.value.trim().toLowerCase();
    const correctAnswer = shuffledQuestions[currentQuestionIndex].answer.toLowerCase();
  
    if (userAnswer === correctAnswer) {
        audioManager.soundCorrect.currentTime = 0.2;
        audioManager.soundCorrect.play();
        
        score++;
        score_html.innerText = "Điểm: " + score;
        currentQuestionIndex++;
      
        if (currentQuestionIndex >= questions.length) {
            clearInterval(timer);
            endGame("🎉 Chúc mừng! Bạn đã thắng.");
        } else {
            clearInterval(timer);
            showQuestion();
            startTimer();
         }
    } else {
        audioManager.soundWrong.currentTime = 0.5;
        audioManager.soundWrong.play();
        flashRed();
    }
}
  
function endGame(message) {
    if(audioManager.backgroundMusic.pause)
    {
        audioManager.backgroundMusic.play();
    }
    audioManager.soundBackground.pause();
    const correctAnswer = shuffledQuestions[currentQuestionIndex].answer;
    question.innerHTML += `<p><strong>Đáp án đúng:</strong> ${correctAnswer}</p>`;
    timer_html.innerText = "";
    answer.style.display = "none";
    submit_btn.style.display = "none";
    back_btn.style.display = "inline-block";
    save_score(score);
}
  
function flashRed() {
    main.classList.add("flash-red");
    setTimeout(() => {
      main.classList.remove("flash-red");
    }, 1000);
}

function save_score(score_player)
{
    frappe.call({
        method: "api_lt.game.save_score",
        args: {
            score: score_player
        },
        callback: function(response) {
            if (response.message.status === "success") {
                
            } else {
                frappe.msgprint({
                    title: __('Error'),
                    indicator: 'red',
                        message: "Cập nhật điểm thất bại"
                });
            }
        }
    })
}

function set_music_game(isMuted){
    audioManager.soundCorrect.muted = isMuted;
    audioManager.soundWrong.muted = isMuted;
    audioManager.soundBackground.muted = isMuted;
    audioManager.backgroundMusic.muted = isMuted;
}

function pause_all_Audio() {
    const currentRoute = frappe.router.current_route;
    isActiveWorkspace = currentRoute && currentRoute[0] === 'workspace' && currentRoute[1] === 'Player';
    
    if (!isActiveWorkspace) {
        audioManager.soundCorrect.pause();
        audioManager.soundWrong.pause();
        audioManager.soundBackground.pause();
        audioManager.backgroundMusic.pause();
        
        audioManager.soundCorrect.currentTime = 0;
        audioManager.soundWrong.currentTime = 0;
        audioManager.soundBackground.currentTime = 0;
        audioManager.backgroundMusic.currentTime = 0;
        
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }
}
frappe.router.on('change', pause_all_Audio);

audioManager.soundCorrect.volume = 1.0;
audioManager.soundWrong.volume = 0.3;

audioManager.backgroundMusic.loop = true;
audioManager.backgroundMusic.volume = 0.5;
if(audioManager.backgroundMusic.pause){
    audioManager.backgroundMusic.play();
}

audioManager.soundBackground.loop = true;
audioManager.soundBackground.volume = 0.6;
audioManager.soundBackground.pause();

let isMuted = localStorage.getItem("game_history") !== "false";
set_music_game(isMuted)
music_game.innerText = isMuted ? "🔇" : "🔊";

music_game.addEventListener("click", function () {
    isMuted = !isMuted;
    set_music_game(isMuted);
    this.innerText = isMuted ? "🔇" : "🔊";
    localStorage.setItem("game_history", isMuted);
})

const jsonUrl = "https://raw.githubusercontent.com/LeTienIT/base_js_game/main/history_game/data.json";
loadQuestionsFromJSON(jsonUrl).then(() => {
    load_game_player();
});

goToG.addEventListener('click',goToGame);
submit_btn.addEventListener('click',submitAnswer);
back_btn.addEventListener('click',goToLeaderboard);
  