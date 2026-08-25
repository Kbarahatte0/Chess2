"use strict";


/* =========================================================
   CHESS V1
   Local 2 Player Chess
========================================================= */


/* ---------------------------------------------------------
   PIECES
--------------------------------------------------------- */

const PIECES = {

    white: {
        king: "♔",
        queen: "♕",
        rook: "♖",
        bishop: "♗",
        knight: "♘",
        pawn: "♙"
    },

    black: {
        king: "♚",
        queen: "♛",
        rook: "♜",
        bishop: "♝",
        knight: "♞",
        pawn: "♟"
    }

};


/* ---------------------------------------------------------
   BOARD
--------------------------------------------------------- */

let board = [];

let currentTurn = "white";

let selectedSquare = null;

let legalMoves = [];

let moveHistory = [];

let gameOver = false;

let enPassantTarget = null;

let castlingRights = {

    white: {
        kingSide: true,
        queenSide: true
    },

    black: {
        kingSide: true,
        queenSide: true
    }

};


/* ---------------------------------------------------------
   DOM
--------------------------------------------------------- */

const boardElement =
    document.getElementById("board");

const turnText =
    document.getElementById("turnText");

const statusBadge =
    document.getElementById("statusBadge");

const message =
    document.getElementById("message");

const messageTitle =
    document.getElementById("messageTitle");

const messageText =
    document.getElementById("messageText");

const moveHistoryElement =
    document.getElementById("moveHistory");

const moveCountElement =
    document.getElementById("moveCount");

const newGameBtn =
    document.getElementById("newGameBtn");

const playAgainBtn =
    document.getElementById("playAgainBtn");

const whiteStatus =
    document.getElementById("whiteStatus");

const blackStatus =
    document.getElementById("blackStatus");


/* ---------------------------------------------------------
   INITIAL BOARD
--------------------------------------------------------- */

function createInitialBoard() {

    const emptyRow = () =>
        Array(8).fill(null);

    const newBoard = [];

    for (let row = 0; row < 8; row++) {

        newBoard.push(emptyRow());

    }


    /* BLACK */

    newBoard[0] = [

        { type: "rook", color: "black" },
        { type: "knight", color: "black" },
        { type: "bishop", color: "black" },
        { type: "queen", color: "black" },
        { type: "king", color: "black" },
        { type: "bishop", color: "black" },
        { type: "knight", color: "black" },
        { type: "rook", color: "black" }

    ];


    newBoard[1] = [

        { type: "pawn", color: "black" },
        { type: "pawn", color: "black" },
        { type: "pawn", color: "black" },
        { type: "pawn", color: "black" },
        { type: "pawn", color: "black" },
        { type: "pawn", color: "black" },
        { type: "pawn", color: "black" },
        { type: "pawn", color: "black" }

    ];


    /* WHITE */

    newBoard[6] = [

        { type: "pawn", color: "white" },
        { type: "pawn", color: "white" },
        { type: "pawn", color: "white" },
        { type: "pawn", color: "white" },
        { type: "pawn", color: "white" },
        { type: "pawn", color: "white" },
        { type: "pawn", color: "white" },
        { type: "pawn", color: "white" }

    ];


    newBoard[7] = [

        { type: "rook", color: "white" },
        { type: "knight", color: "white" },
        { type: "bishop", color: "white" },
        { type: "queen", color: "white" },
        { type: "king", color: "white" },
        { type: "bishop", color: "white" },
        { type: "knight", color: "white" },
        { type: "rook", color: "white" }

    ];


    return newBoard;
}


/* ---------------------------------------------------------
   RESET GAME
--------------------------------------------------------- */

function newGame() {

    board = createInitialBoard();

    currentTurn = "white";

    selectedSquare = null;

    legalMoves = [];

    moveHistory = [];

    gameOver = false;

    enPassantTarget = null;

    castlingRights = {

        white: {
            kingSide: true,
            queenSide: true
        },

        black: {
            kingSide: true,
            queenSide: true
        }

    };

    hideMessage();

    renderBoard();

    renderMoveHistory();

    updateStatus();
}


/* ---------------------------------------------------------
   RENDER BOARD
--------------------------------------------------------- */

function renderBoard() {

    boardElement.innerHTML = "";

    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            const square =
                document.createElement("div");

            square.classList.add("square");

            const isLight =
                (row + col) % 2 === 0;

            square.classList.add(
                isLight ? "light" : "dark"
            );


            square.dataset.row = row;
            square.dataset.col = col;


            /* coordinates */

            if (col === 0) {

                const rank =
                    document.createElement("span");

                rank.className =
                    "coordinate rank";

                rank.textContent =
                    8 - row;

                square.appendChild(rank);

            }


            if (row === 7) {

                const file =
                    document.createElement("span");

                file.className =
                    "coordinate file";

                file.textContent =
                    String.fromCharCode(97 + col);

                square.appendChild(file);

            }


            const piece =
                board[row][col];


            if (piece) {

                const pieceElement =
                    document.createElement("span");

                pieceElement.className =
                    `piece ${piece.color}-piece`;

                pieceElement.textContent =
                    PIECES[piece.color][piece.type];

                square.appendChild(pieceElement);

            }


            /* selected */

            if (
                selectedSquare &&
                selectedSquare.row === row &&
                selectedSquare.col === col
            ) {

                square.classList.add("selected");

            }


            /* legal moves */

            const move =
                legalMoves.find(
                    item =>
                        item.row === row &&
                        item.col === col
                );


            if (move) {

                if (board[row][col]) {

                    square.classList.add(
                        "capture-move"
                    );

                } else {

                    square.classList.add(
                        "legal-move"
                    );

                }

            }


            /* check */

            const pieceOnSquare =
                board[row][col];

            if (
                pieceOnSquare &&
                pieceOnSquare.type === "king" &&
                isKingInCheck(pieceOnSquare.color)
            ) {

                square.classList.add("in-check");

            }


            square.addEventListener(
                "click",
                () => handleSquareClick(row, col)
            );


            boardElement.appendChild(square);

        }

    }

}


/* ---------------------------------------------------------
   CLICK
--------------------------------------------------------- */

function handleSquareClick(row, col) {

    if (gameOver) return;


    const clickedPiece =
        board[row][col];


    /* Selecting a piece */

    if (!selectedSquare) {

        if (
            clickedPiece &&
            clickedPiece.color === currentTurn
        ) {

            selectedSquare = {
                row,
                col
            };

            legalMoves =
                getLegalMoves(row, col);

            renderBoard();

        }

        return;
    }


    /* Click own piece */

    if (
        clickedPiece &&
        clickedPiece.color === currentTurn
    ) {

        selectedSquare = {
            row,
            col
        };

        legalMoves =
            getLegalMoves(row, col);

        renderBoard();

        return;
    }


    /* Try move */

    const isLegal =
        legalMoves.some(
            move =>
                move.row === row &&
                move.col === col
        );


    if (isLegal) {

        makeMove(
            selectedSquare.row,
            selectedSquare.col,
            row,
            col
        );

    } else {

        selectedSquare = null;

        legalMoves = [];

        renderBoard();

    }

}


/* ---------------------------------------------------------
   GET LEGAL MOVES
--------------------------------------------------------- */

function getLegalMoves(row, col) {

    const piece =
        board[row][col];

    if (!piece) return [];

    const pseudoMoves =
        getPseudoMoves(
            row,
            col,
            board,
            true
        );


    const legal = [];


    for (const move of pseudoMoves) {

        const testBoard =
            cloneBoard(board);


        applyMoveToBoard(
            testBoard,
            row,
            col,
            move.row,
            move.col,
            move
        );


        if (
            !isKingInCheckOnBoard(
                testBoard,
                piece.color
            )
        ) {

            legal.push(move);

        }

    }


    return legal;
}


/* ---------------------------------------------------------
   PSEUDO MOVES
--------------------------------------------------------- */

function getPseudoMoves(
    row,
    col,
    gameBoard,
    includeSpecial
) {

    const piece =
        gameBoard[row][col];

    if (!piece) return [];


    const moves = [];


    function addMove(r, c) {

        if (
            r < 0 ||
            r > 7 ||
            c < 0 ||
            c > 7
        ) return;

        const target =
            gameBoard[r][c];


        if (
            !target ||
            target.color !== piece.color
        ) {

            moves.push({
                row: r,
                col: c
            });

        }

    }


    function slide(
        directions
    ) {

        for (const [dr, dc] of directions) {

            let r = row + dr;
            let c = col + dc;


            while (
                r >= 0 &&
                r < 8 &&
                c >= 0 &&
                c < 8
            ) {

                const target =
                    gameBoard[r][c];


                if (!target) {

                    moves.push({
                        row: r,
                        col: c
                    });

                } else {

                    if (
                        target.color !== piece.color
                    ) {

                        moves.push({
                            row: r,
                            col: c
                        });

                    }

                    break;
                }


                r += dr;
                c += dc;

            }

        }

    }


    /* PAWN */

    if (piece.type === "pawn") {

        const direction =
            piece.color === "white"
                ? -1
                : 1;

        const startRow =
            piece.color === "white"
                ? 6
                : 1;


        const oneRow =
            row + direction;


        if (
            oneRow >= 0 &&
            oneRow <= 7 &&
            !gameBoard[oneRow][col]
        ) {

            moves.push({
                row: oneRow,
                col
            });


            const twoRow =
                row + direction * 2;


            if (
                row === startRow &&
                !gameBoard[twoRow][col]
            ) {

                moves.push({
                    row: twoRow,
                    col,
                    doublePawnMove: true
                });

            }

        }


        /* captures */

        for (
            const dc of [-1, 1]
        ) {

            const r =
                row + direction;

            const c =
                col + dc;


            if (
                r < 0 ||
                r > 7 ||
                c < 0 ||
                c > 7
            ) continue;


            const target =
                gameBoard[r][c];


            if (
                target &&
                target.color !== piece.color
            ) {

                moves.push({
                    row: r,
                    col: c
                });

            }

        }


        /* en passant */

        if (
            includeSpecial &&
            enPassantTarget
        ) {

            if (
                enPassantTarget.row === row + direction &&
                Math.abs(
                    enPassantTarget.col - col
                ) === 1
            ) {

                moves.push({
                    row: enPassantTarget.row,
                    col: enPassantTarget.col,
                    enPassant: true
                });

            }

        }

    }


    /* KNIGHT */

    if (piece.type === "knight") {

        const offsets = [

            [-2, -1],
            [-2, 1],

            [-1, -2],
            [-1, 2],

            [1, -2],
            [1, 2],

            [2, -1],
            [2, 1]

        ];


        for (
            const [dr, dc]
            of offsets
        ) {

            addMove(
                row + dr,
                col + dc
            );

        }

    }


    /* BISHOP */

    if (piece.type === "bishop") {

        slide([

            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1]

        ]);

    }


    /* ROOK */

    if (piece.type === "rook") {

        slide([

            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1]

        ]);

    }


    /* QUEEN */

    if (piece.type === "queen") {

        slide([

            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],

            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1]

        ]);

    }


    /* KING */

    if (piece.type === "king") {

        for (let dr = -1; dr <= 1; dr++) {

            for (let dc = -1; dc <= 1; dc++) {

                if (
                    dr === 0 &&
                    dc === 0
                ) continue;


                addMove(
                    row + dr,
                    col + dc
                );

            }

        }


        /* CASTLING */

        if (includeSpecial) {

            const color =
                piece.color;

            const rights =
                castlingRights[color];


            const enemy =
                color === "white"
                    ? "black"
                    : "white";


            /* King side */

            if (
                rights.kingSide &&
                !gameBoard[row][5] &&
                !gameBoard[row][6] &&
                gameBoard[row][7] &&
                gameBoard[row][7].type === "rook" &&
                gameBoard[row][7].color === color
            ) {

                const tempBoard =
                    cloneBoard(gameBoard);


                tempBoard[row][4] = null;

                tempBoard[row][5] =
                    {
                        type: "king",
                        color
                    };


                if (
                    !isSquareAttacked(
                        tempBoard,
                        row,
                        4,
                        enemy
                    ) &&
                    !isSquareAttacked(
                        tempBoard,
                        row,
                        5,
                        enemy
                    ) &&
                    !isSquareAttacked(
                        tempBoard,
                        row,
                        6,
                        enemy
                    )
                ) {

                    moves.push({
                        row,
                        col: 6,
                        castle: "kingSide"
                    });

                }

            }


            /* Queen side */

            if (
                rights.queenSide &&
                !gameBoard[row][1] &&
                !gameBoard[row][2] &&
                !gameBoard[row][3] &&
                gameBoard[row][0] &&
                gameBoard[row][0].type === "rook" &&
                gameBoard[row][0].color === color
            ) {

                const tempBoard =
                    cloneBoard(gameBoard);


                tempBoard[row][4] = null;

                tempBoard[row][3] =
                    {
                        type: "king",
                        color
                    };


                if (
                    !isSquareAttacked(
                        tempBoard,
                        row,
                        4,
                        enemy
                    ) &&
                    !isSquareAttacked(
                        tempBoard,
                        row,
                        3,
                        enemy
                    ) &&
                    !isSquareAttacked(
                        tempBoard,
                        row,
                        2,
                        enemy
                    )
                ) {

                    moves.push({
                        row,
                        col: 2,
                        castle: "queenSide"
                    });

                }

            }

        }

    }


    return moves;
}


/* ---------------------------------------------------------
   MAKE MOVE
--------------------------------------------------------- */

function makeMove(
    fromRow,
    fromCol,
    toRow,
    toCol
) {

    const piece =
        board[fromRow][fromCol];

    const move =
        legalMoves.find(
            m =>
                m.row === toRow &&
                m.col === toCol
        );


    if (!move) return;


    const captured =
        board[toRow][toCol];


    /* notation */

    const notation =
        createMoveNotation(
            piece,
            fromRow,
            fromCol,
            toRow,
            toCol,
            captured,
            move
        );


    /* en passant capture */

    if (move.enPassant) {

        const captureRow =
            piece.color === "white"
                ? toRow + 1
                : toRow - 1;

        board[captureRow][toCol] =
            null;

    }


    /* move */

    board[toRow][toCol] =
        board[fromRow][fromCol];

    board[fromRow][fromCol] =
        null;


    /* castling */

    if (
        piece.type === "king" &&
        move.castle
    ) {

        if (
            move.castle === "kingSide"
        ) {

            board[toRow][5] =
                board[toRow][7];

            board[toRow][7] =
                null;

        } else {

            board[toRow][3] =
                board[toRow][0];

            board[toRow][0] =
                null;

        }

    }


    /* update castling */

    updateCastlingRights(
        piece,
        fromRow,
        fromCol,
        toRow,
        toCol,
        captured
    );


    /* en passant target */

    enPassantTarget = null;


    if (
        piece.type === "pawn" &&
        Math.abs(
            toRow - fromRow
        ) === 2
    ) {

        enPassantTarget = {

            row:
                (fromRow + toRow) / 2,

            col:
                fromCol

        };

    }


    /* promotion */

    if (
        piece.type === "pawn" &&
        (toRow === 0 || toRow === 7)
    ) {

        promotePawn(
            toRow,
            toCol,
            piece.color
        );

    }


    moveHistory.push({
        notation,
        color: piece.color
    });


    currentTurn =
        currentTurn === "white"
            ? "black"
            : "white";


    selectedSquare = null;

    legalMoves = [];


    renderBoard();

    renderMoveHistory();

    updateStatus();

    checkGameState();

}


/* ---------------------------------------------------------
   PROMOTION
--------------------------------------------------------- */

function promotePawn(
    row,
    col,
    color
) {

    const choice =
        prompt(
            "Promote pawn to:\n\n" +
            "Q = Queen\n" +
            "R = Rook\n" +
            "B = Bishop\n" +
            "N = Knight",
            "Q"
        );


    const map = {

        Q: "queen",
        R: "rook",
        B: "bishop",
        N: "knight"

    };


    const selected =
        (choice || "Q")
            .toUpperCase();


    board[row][col].type =
        map[selected] || "queen";

}


/* ---------------------------------------------------------
   CASTLING RIGHTS
--------------------------------------------------------- */

function updateCastlingRights(
    piece,
    fromRow,
    fromCol,
    toRow,
    toCol,
    captured
) {

    if (
        piece.type === "king"
    ) {

        castlingRights[
            piece.color
        ].kingSide = false;

        castlingRights[
            piece.color
        ].queenSide = false;

    }


    if (
        piece.type === "rook"
    ) {

        if (
            piece.color === "white"
        ) {

            if (
                fromRow === 7 &&
                fromCol === 0
            ) {

                castlingRights.white.queenSide =
                    false;

            }

            if (
                fromRow === 7 &&
                fromCol === 7
            ) {

                castlingRights.white.kingSide =
                    false;

            }

        } else {

            if (
                fromRow === 0 &&
                fromCol === 0
            ) {

                castlingRights.black.queenSide =
                    false;

            }

            if (
                fromRow === 0 &&
                fromCol === 7
            ) {

                castlingRights.black.kingSide =
                    false;

            }

        }

    }


    /* captured rook */

    if (
        captured &&
        captured.type === "rook"
    ) {

        if (
            captured.color === "white"
        ) {

            if (
                toRow === 7 &&
                toCol === 0
            ) {

                castlingRights.white.queenSide =
                    false;

            }

            if (
                toRow === 7 &&
                toCol === 7
            ) {

                castlingRights.white.kingSide =
                    false;

            }

        } else {

            if (
                toRow === 0 &&
                toCol === 0
            ) {

                castlingRights.black.queenSide =
                    false;

            }

            if (
                toRow === 0 &&
                toCol === 7
            ) {

                castlingRights.black.kingSide =
                    false;

            }

        }

    }

}


/* ---------------------------------------------------------
   APPLY TEST MOVE
--------------------------------------------------------- */

function applyMoveToBoard(
    gameBoard,
    fromRow,
    fromCol,
    toRow,
    toCol,
    move
) {

    const piece =
        gameBoard[fromRow][fromCol];


    if (
        move.enPassant
    ) {

        const captureRow =
            piece.color === "white"
                ? toRow + 1
                : toRow - 1;

        gameBoard[captureRow][toCol] =
            null;

    }


    gameBoard[toRow][toCol] =
        gameBoard[fromRow][fromCol];

    gameBoard[fromRow][fromCol] =
        null;


    if (
        move.castle === "kingSide"
    ) {

        gameBoard[toRow][5] =
            gameBoard[toRow][7];

        gameBoard[toRow][7] =
            null;

    }


    if (
        move.castle === "queenSide"
    ) {

        gameBoard[toRow][3] =
            gameBoard[toRow][0];

        gameBoard[toRow][0] =
            null;

    }


    /* promotion for simulation */

    if (
        piece.type === "pawn" &&
        (toRow === 0 || toRow === 7)
    ) {

        gameBoard[toRow][toCol] = {

            type: "queen",

            color: piece.color

        };

    }

}


/* ---------------------------------------------------------
   CLONE BOARD
--------------------------------------------------------- */

function cloneBoard(
    original
) {

    return original.map(
        row =>
            row.map(
                piece =>
                    piece
                        ? { ...piece }
                        : null
            )
    );

}


/* ---------------------------------------------------------
   KING CHECK
--------------------------------------------------------- */

function isKingInCheck(
    color
) {

    return isKingInCheckOnBoard(
        board,
        color
    );

}


function isKingInCheckOnBoard(
    gameBoard,
    color
) {

    let kingRow = -1;
    let kingCol = -1;


    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            const piece =
                gameBoard[row][col];


            if (
                piece &&
                piece.color === color &&
                piece.type === "king"
            ) {

                kingRow = row;
                kingCol = col;

            }

        }

    }


    if (kingRow === -1) {

        return true;

    }


    const enemy =
        color === "white"
            ? "black"
            : "white";


    return isSquareAttacked(
        gameBoard,
        kingRow,
        kingCol,
        enemy
    );

}


/* ---------------------------------------------------------
   SQUARE ATTACKED
--------------------------------------------------------- */

function isSquareAttacked(
    gameBoard,
    row,
    col,
    attackerColor
) {

    for (let r = 0; r < 8; r++) {

        for (let c = 0; c < 8; c++) {

            const piece =
                gameBoard[r][c];


            if (
                !piece ||
                piece.color !== attackerColor
            ) continue;


            if (
                pieceAttacksSquare(
                    gameBoard,
                    r,
                    c,
                    row,
                    col
                )
            ) {

                return true;

            }

        }

    }


    return false;
}


/* ---------------------------------------------------------
   PIECE ATTACK
--------------------------------------------------------- */

function pieceAttacksSquare(
    gameBoard,
    fromRow,
    fromCol,
    targetRow,
    targetCol
) {

    const piece =
        gameBoard[fromRow][fromCol];


    const dr =
        targetRow - fromRow;

    const dc =
        targetCol - fromCol;


    /* PAWN */

    if (
        piece.type === "pawn"
    ) {

        const direction =
            piece.color === "white"
                ? -1
                : 1;


        return (
            dr === direction &&
            Math.abs(dc) === 1
        );

    }


    /* KNIGHT */

    if (
        piece.type === "knight"
    ) {

        return (
            (Math.abs(dr) === 2 &&
                Math.abs(dc) === 1) ||

            (Math.abs(dr) === 1 &&
                Math.abs(dc) === 2)
        );

    }


    /* KING */

    if (
        piece.type === "king"
    ) {

        return (
            Math.abs(dr) <= 1 &&
            Math.abs(dc) <= 1 &&
            !(dr === 0 && dc === 0)
        );

    }


    /* BISHOP */

    if (
        piece.type === "bishop"
    ) {

        if (
            Math.abs(dr) !== Math.abs(dc)
        ) {

            return false;

        }

    }


    /* ROOK */

    if (
        piece.type === "rook"
    ) {

        if (
            dr !== 0 &&
            dc !== 0
        ) {

            return false;

        }

    }


    /* QUEEN */

    if (
        piece.type === "queen"
    ) {

        if (
            dr === 0 ||
            dc === 0
        ) {

            // valid
        } else if (
            Math.abs(dr) === Math.abs(dc)
        ) {

            // valid
        } else {

            return false;

        }

    }


    /* SLIDING PIECES */

    const stepRow =
        Math.sign(dr);

    const stepCol =
        Math.sign(dc);


    let r =
        fromRow + stepRow;

    let c =
        fromCol + stepCol;


    while (
        r !== targetRow ||
        c !== targetCol
    ) {

        if (
            gameBoard[r][c]
        ) {

            return false;

        }


        r += stepRow;
        c += stepCol;

    }


    return true;
}


/* ---------------------------------------------------------
   CHECK GAME STATE
--------------------------------------------------------- */

function checkGameState() {

    const inCheck =
        isKingInCheck(
            currentTurn
        );


    let hasLegalMove = false;


    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            const piece =
                board[row][col];


            if (
                piece &&
                piece.color === currentTurn
            ) {

                if (
                    getLegalMoves(
                        row,
                        col
                    ).length > 0
                ) {

                    hasLegalMove = true;

                    break;

                }

            }

        }


        if (hasLegalMove) break;

    }


    if (!hasLegalMove) {

        gameOver = true;


        if (inCheck) {

            const winner =
                currentTurn === "white"
                    ? "Black"
                    : "White";


            showMessage(
                "Checkmate!",
                `${winner} wins the game.`
            );

        } else {

            showMessage(
                "Draw",
                "The game ends in a stalemate."
            );

        }


        return;

    }


    if (inCheck) {

        statusBadge.textContent =
            "CHECK";

        statusBadge.style.background =
            "#4a2020";

        statusBadge.style.color =
            "#ff8b8b";

    } else {

        statusBadge.textContent =
            "PLAYING";

        statusBadge.style.background =
            "#173a27";

        statusBadge.style.color =
            "#75d99b";

    }

}


/* ---------------------------------------------------------
   MOVE NOTATION
--------------------------------------------------------- */

function createMoveNotation(
    piece,
    fromRow,
    fromCol,
    toRow,
    toCol,
    captured,
    move
) {

    const files =
        "abcdefgh";

    const from =
        files[fromCol] +
        (8 - fromRow);

    const to =
        files[toCol] +
        (8 - toRow);


    if (
        move.castle === "kingSide"
    ) {

        return "O-O";

    }


    if (
        move.castle === "queenSide"
    ) {

        return "O-O-O";

    }


    const names = {

        king: "K",
        queen: "Q",
        rook: "R",
        bishop: "B",
        knight: "N",
        pawn: ""

    };


    let notation =
        names[piece.type];


    if (
        piece.type === "pawn" &&
        (captured || move.enPassant)
    ) {

        notation +=
            files[fromCol];

    }


    if (
        captured ||
        move.enPassant
    ) {

        notation += "x";

    }


    notation += to;


    return notation;
}


/* ---------------------------------------------------------
   MOVE HISTORY
--------------------------------------------------------- */

function renderMoveHistory() {

    moveHistoryElement.innerHTML = "";


    if (
        moveHistory.length === 0
    ) {

        moveHistoryElement.innerHTML =
            `<div class="empty-history">
                No moves yet
             </div>`;

        moveCountElement.textContent =
            "0 moves";

        return;

    }


    moveHistory.forEach(
        (move, index) => {

            const element =
                document.createElement("div");

            element.className =
                "move";


            const number =
                Math.floor(index / 2) + 1;


            element.innerHTML = `

                <span class="move-number">
                    ${number}.
                </span>

                ${move.notation}

            `;


            moveHistoryElement.appendChild(
                element
            );

        }
    );


    moveCountElement.textContent =
        `${moveHistory.length} ${
            moveHistory.length === 1
                ? "move"
                : "moves"
        }`;

}


/* ---------------------------------------------------------
   STATUS
--------------------------------------------------------- */

function updateStatus() {

    if (gameOver) return;


    const name =
        currentTurn === "white"
            ? "White"
            : "Black";


    turnText.textContent =
        `${name}'s Turn`;


    whiteStatus.textContent =
        currentTurn === "white"
            ? "Your Turn"
            : "Waiting";


    blackStatus.textContent =
        currentTurn === "black"
            ? "Your Turn"
            : "Waiting";


    statusBadge.textContent =
        "PLAYING";


    statusBadge.style.background =
        "#173a27";

    statusBadge.style.color =
        "#75d99b";

}


/* ---------------------------------------------------------
   MESSAGE
--------------------------------------------------------- */

function showMessage(
    title,
    text
) {

    messageTitle.textContent =
        title;

    messageText.textContent =
        text;

    message.classList.remove(
        "hidden"
    );

}


function hideMessage() {

    message.classList.add(
        "hidden"
    );

}


/* ---------------------------------------------------------
   BUTTONS
--------------------------------------------------------- */

newGameBtn.addEventListener(
    "click",
    newGame
);

playAgainBtn.addEventListener(
    "click",
    newGame
);


/* ---------------------------------------------------------
   START
--------------------------------------------------------- */

newGame();