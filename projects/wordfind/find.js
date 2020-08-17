const DICTIONARY = [

function tracePath(board, word, path) {
  if (!word.length) return path;
  path = path || [];
  let nextPositions;
  if (path.length) {
    const lastPosition = path[path.length - 1];
    nextPositions = getAdjacentPositions(
      board, lastPosition.row, lastPosition.column
    );
  }
  else {
    nextPositions = getAllPositions(board);
  }
  for (const position of nextPositions) {
    if (
      board[position.row][position.column].letter !== word[0]
      || pathIncludes(path, position)
    ) {
      continue;
    }
    const newPath = tracePath(board, word.slice(1), [...path, position])
    if (newPath) return newPath;
  }
}

function* getAdjacentPositions(board, row, column) {
  const offsets = [-1, 0, 1];
  for (const rowOffset of offsets) {
    for (const columnOffset of offsets) {
      if (!rowOffset && !columnOffset) continue;
      const newRow = row + rowOffset;
      const newColumn = column + columnOffset;
      if (
        0 <= newRow && newRow < board.length
        && 0 <= newColumn && newColumn < board[0].length
      ) {
        yield {row: newRow, column: newColumn};
      }
    }
  }
}

function* getAllPositions(board) {
  for (let row = 0; row < board.length; row++) {
    for (let column = 0; column < board[0].length; column++) {
      yield {row: row, column: column};
    }
  }
}

function pathIncludes(path, position) {
  return path.some(
    p => (p.row === position.row && p.column === position.column)
  );
}

onmessage = function (event) {
  const board = event.data;
  postMessage(DICTIONARY.filter(word => tracePath(board, word)));
};
// postMessage(DICTIONARY.length);