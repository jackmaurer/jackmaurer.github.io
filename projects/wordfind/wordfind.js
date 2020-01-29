
function* cumSums(array) {
  var cumSum = 0;
  for (const number of array) {
    cumSum += number;
    yield cumSum;
  }
}

function weightedChoice(items, frequencies) {
  const x = Math.random();
  var cumFreqs = cumSums(frequencies);
  var prevCumFreq = 0;
  for (const item of items) {
    const cumFreq = cumFreqs.next().value;
    if (prevCumFreq <= x && x < cumFreq) return item;
    prevCumFreq = cumFreq;
  }
}

function testWeightedChoice(items, frequencies, n) {
  n = n || 1000;
  var sampleDist = {};
  for (let i = 0; i < n; i++) {
    const item = weightedChoice(items, frequencies);
    if (sampleDist[item]) {
      sampleDist[item]++;
    }
    else {
      sampleDist[item] = 1;
    }
  }

  for (const item of items) {
    if (sampleDist[item]) sampleDist[item] /= n;
  }

  return sampleDist;
}

// const results = testWeightedChoice(
//   ["foo", "bar", "baz"],
//   [0.6, 0.3, 0.1]
// );
//
// document.querySelector("#output").innerText = JSON.stringify(results);

class Round {
  constructor(game) {
    this.game = game;
    this.wordsFound = [];
    this.startTime = null;
    this.timeRemaining = game.roundDuration;
    this.minutes = 0;
    this.seconds = "00";
    this.isOver = false;
  }

  start() {
    this.startTime = Date.now();
    if (this.game.roundStartCallback) this.game.roundStartCallback();
    this.updateTimer();
  }

  updateTimer() {
    this.timeRemaining = (
      this.game.roundDuration - (Date.now() - this.startTime)
    );
    let totalSeconds;
    if (this.timeRemaining <= 0) {
      totalSeconds = 0;
      this.end();
    }
    else {
      totalSeconds = Math.floor(this.timeRemaining / 1000);
    }
    this.seconds = (totalSeconds % 60).toString().padStart(2, "0");
    this.minutes = (totalSeconds - this.seconds) / 60;
    if (!this.isOver) {
      window.requestAnimationFrame(this.updateTimer.bind(this));
    }
  }

  end() {
    this.isOver = true;
    if (this.game.roundEndCallback) this.game.roundEndCallback();
  }
}

class Game {
  constructor(options) {
    options = options || {};
    const defaults = {
      letters: "abcdefghijklmnopqrstuvwxyz",
      letterFrequencies: [
        0.0812, 0.0149, 0.0271, 0.0432, 0.1202, 0.023, 0.0203, 0.0592, 0.0731,
        0.001, 0.0069, 0.0398, 0.0261, 0.0695, 0.0768, 0.0182, 0.0011, 0.0602,
        0.0628, 0.091, 0.0288, 0.0111, 0.0209, 0.0017, 0.0211, 0.0007
      ],
      // http://pi.math.cornell.edu/~mec/2003-2004/cryptography/subs/frequencies.html
      boardWidth: 4,
      boardHeight: 4,
      dictionary: DICTIONARY_TRIE,
      roundDuration: 120000,  // ms
      roundStartCallback: null,
      roundEndCallback: null
    };
    const settings = Object.assign({}, defaults, options);
    this.letters = settings.letters;
    this.letterFrequencies = settings.letterFrequencies;
    this.boardWidth = settings.boardWidth;
    this.boardHeight = settings.boardHeight;
    this.dictionary = settings.dictionary;
    this.roundDuration = settings.roundDuration;
    this.roundEndCallback = settings.roundEndCallback;
    this.roundStartCallback = settings.roundStartCallback;
    this.board = [];
    this.round = null;
    this.words = [];
    this.worker = new Worker("find.js");
    this.isLoading = false;
  }

  newRound() {
    this.round = null;
    this.newBoard();
    // this.findWords();
    // let worker = new Worker("find.js");
    const onMsg = this.worker.addEventListener("message", (function (event) {
      this.words = event.data;
      this.round = new Round(this);
      this.isLoading = false;
      this.round.start();
      this.worker.removeEventListener("message", onMsg);
    }).bind(this));
    this.isLoading = true;
    this.worker.postMessage(this.board);
  }

  newBoard() {
    this.board = [];
    for (let i = 0; i < this.boardHeight; i++) {
      let row = [];
      for (let j = 0; j < this.boardWidth; j++) {
        row.push({
          letter: this.chooseLetter(),
          selected: false
        });
      }
      this.board.push(row);
    }
  }

  chooseLetter() {
    return weightedChoice(this.letters, this.letterFrequencies);
  }

  findWords() {
    this.words = DICTIONARY.filter(word => this.tracePath(word));
  }

  tracePath(word, path) {
    if (!word.length) return path;
    path = path || [];
    let nextPositions;
    if (path.length) {
      const lastPosition = path[path.length - 1];
      nextPositions = this.getAdjacentPositions(
        lastPosition.row, lastPosition.column
      );
    }
    else {
      nextPositions = this.getAllPositions();
    }
    for (const position of nextPositions) {
      if (
        this.board[position.row][position.column].letter !== word[0]
        || this.pathIncludes(path, position)
      ) {
        continue;
      }
      const newPath = this.tracePath(word.slice(1), [...path, position])
      if (newPath) return newPath;
    }
  }

  *getAdjacentPositions(row, column) {
    const offsets = [-1, 0, 1];
    for (const rowOffset of offsets) {
      for (const columnOffset of offsets) {
        if (!rowOffset && !columnOffset) continue;
        const newRow = row + rowOffset;
        const newColumn = column + columnOffset;
        if (
          0 <= newRow && newRow < this.boardHeight
          && 0 <= newColumn && newColumn < this.boardWidth
        ) {
          yield {row: newRow, column: newColumn};
        }
      }
    }
  }

  *getAllPositions() {
    for (let row = 0; row < this.boardHeight; row++) {
      for (let column = 0; column < this.boardWidth; column++) {
        yield {row: row, column: column};
      }
    }
  }

  pathIncludes(path, position) {
    return path.some(
      p => (p.row === position.row && p.column === position.column)
    );
  }

  findWord(word) {
    if (
      this.round.wordsFound.indexOf(word) < 0
      && this.tracePath(word)
      && this.dictionary.lookup(word)
    ) {
      this.round.wordsFound.push(word);
      return true;
    }
    return false;
  }
}

var game = new Game();
// game.newRound();

var vm = new Vue({
  el: "#game",
  data: {
    game: game,
    word: "",
    path: []
  },
  watch: {
    word: function (newWord) {
      this.path = this.game.tracePath(newWord.toLowerCase());
      this.deselectTiles();
      this.selectPath();
    }
  },
  methods: {
    deselectTiles: function () {
      for (const row of this.game.board) {
        for (const tile of row) {
          tile.selected = false;
        }
      }
    },
    selectPath: function () {
      if (this.path) {
        for (const position of this.path) {
          this.game.board[position.row][position.column].selected = true;
        }
      }
    },
    handleSubmit: function (event) {
      var wordInput = document.querySelector("#word-input");
      if (this.game.findWord(this.word)) {
        this.word = "";
      }
      else {
        wordInput.select();
      }
    }
  },
  mounted: function () {
    this.game.roundStartCallback = (function () {
      window.requestAnimationFrame((function () {
        this.$refs.wordInput.focus();
      }).bind(this));
    }).bind(this);
    this.game.roundEndCallback = (function () {
      this.word = "";
    }).bind(this);
    // this.game.newRound();
  }
});
