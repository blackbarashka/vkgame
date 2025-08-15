export const BOARD_SIZE = 4;

export function createEmptyBoard() {
    return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

function cloneBoard(b) {
    return b.map((row) => row.slice());
}

function getEmptyCells(board) {
    const cells = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) cells.push({ r, c });
        }
    }
    return cells;
}

export function addRandomTile(board) {
    const empty = getEmptyCells(board);
    if (empty.length === 0) return board;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    const next = cloneBoard(board);
    next[r][c] = value;
    return next;
}

function compressRow(row) {
    const filtered = row.filter((x) => x !== 0);
    const result = [];
    let gained = 0;
    for (let i = 0; i < filtered.length; i++) {
        if (filtered[i] !== 0 && filtered[i] === filtered[i + 1]) {
            const merged = filtered[i] * 2;
            result.push(merged);
            gained += merged;
            i++;
        } else {
            result.push(filtered[i]);
        }
    }
    while (result.length < BOARD_SIZE) result.push(0);
    return { row: result, gained };
}

function moveLeft(board) {
    const next = createEmptyBoard();
    let moved = false;
    let gained = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
        const before = board[r];
        const { row, gained: g } = compressRow(before);
        gained += g;
        next[r] = row;
        if (!moved && row.some((v, i) => v !== before[i])) moved = true;
    }
    return { board: next, moved, gained };
}

function reverseRows(board) {
    return board.map((row) => row.slice().reverse());
}

function transpose(board) {
    const t = createEmptyBoard();
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            t[r][c] = board[c][r];
        }
    }
    return t;
}

export function move(board, dir) {
    switch (dir) {
        case 'left':
            return moveLeft(board);
        case 'right': {
            const { board: b, moved, gained } = moveLeft(reverseRows(board));
            return { board: reverseRows(b), moved, gained };
        }
        case 'up': {
            const { board: b, moved, gained } = moveLeft(transpose(board));
            return { board: transpose(b), moved, gained };
        }
        case 'down': {
            const { board: b, moved, gained } = moveLeft(reverseRows(transpose(board)));
            return { board: transpose(reverseRows(b)), moved, gained };
        }
        default:
            return { board, moved: false, gained: 0 };
    }
}

export function canMove(board) {
    if (getEmptyCells(board).length > 0) return true;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE - 1; c++) {
            if (board[r][c] === board[r][c + 1]) return true;
        }
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
        for (let r = 0; r < BOARD_SIZE - 1; r++) {
            if (board[r][c] === board[r + 1][c]) return true;
        }
    }
    return false;
}

export function has2048(board) {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] >= 2048) return true;
        }
    }
    return false;
}

export function newGame() {
    let b = createEmptyBoard();
    b = addRandomTile(addRandomTile(b));
    return { board: b, score: 0 };
}