"use strict";


/* =========================================================
   CHECKORA
   Chess vs Bot

   Easy / Medium / Hard
   Timer
   Captured Pieces
   Sound
   Vibration
========================================================= */


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


const PIECE_VALUES = {

    pawn: 100,
    knight: 320,
    bishop: 330,
    rook: 500,
    queen: 900,
    king: 20000

};


const BOT_COLOR = "black";


let board = [];

let currentTurn = "white";

let selectedSquare = null;

let legalMoves = [];

let moveHistory = [];

let capturedByWhite = [];

let capturedByBlack = [];

let gameOver = false;

let botThinking = false;

let pendingPromotion = null;

let enPassantTarget = null;

let botDifficulty = "hard";


/* TIMER */

let selectedTime =
    300;

let whiteTime =
    selectedTime;

let blackTime =
    selectedTime;

let timerInterval =
    null;


/* CASTLING */

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


/* =========================================================
   DOM
========================================================= */

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

const whiteTimer =
    document.getElementById("whiteTimer");

const blackTimer =
    document.getElementById("blackTimer");

const whiteCapturedElement =
    document.getElementById("whiteCaptured");

const blackCapturedElement =
    document.getElementById("blackCaptured");

const promotionOverlay =
    document.getElementById("promotionOverlay");

const promotionChoices =
    document.querySelectorAll(
        ".promotion-choice"
    );

const difficultyButtons =
    document.querySelectorAll(
        ".difficulty-btn"
    );

const difficultyLabel =
    document.getElementById(
        "difficultyLabel"
    );

const timerButtons =
    document.querySelectorAll(
        ".timer-btn"
    );

const timerLabel =
    document.getElementById(
        "timerLabel"
    );


/* =========================================================
   INITIAL BOARD
========================================================= */

function createInitialBoard() {

    const gameBoard =
        Array.from(
            { length: 8 },
            () =>
                Array(8).fill(null)
        );


    gameBoard[0] = [

        { type: "rook", color: "black" },
        { type: "knight", color: "black" },
        { type: "bishop", color: "black" },
        { type: "queen", color: "black" },
        { type: "king", color: "black" },
        { type: "bishop", color: "black" },
        { type: "knight", color: "black" },
        { type: "rook", color: "black" }

    ];


    gameBoard[1] =
        Array.from(
            { length: 8 },
            () => ({
                type: "pawn",
                color: "black"
            })
        );


    gameBoard[6] =
        Array.from(
            { length: 8 },
            () => ({
                type: "pawn",
                color: "white"
            })
        );


    gameBoard[7] = [

        { type: "rook", color: "white" },
        { type: "knight", color: "white" },
        { type: "bishop", color: "white" },
        { type: "queen", color: "white" },
        { type: "king", color: "white" },
        { type: "bishop", color: "white" },
        { type: "knight", color: "white" },
        { type: "rook", color: "white" }

    ];


    return gameBoard;
}


/* =========================================================
   NEW GAME
========================================================= */

function newGame() {

    clearInterval(
        timerInterval
    );


    board =
        createInitialBoard();


    currentTurn =
        "white";


    selectedSquare =
        null;


    legalMoves = [];

    moveHistory = [];

    capturedByWhite = [];

    capturedByBlack = [];


    gameOver =
        false;


    botThinking =
        false;


    pendingPromotion =
        null;


    enPassantTarget =
        null;


    whiteTime =
        selectedTime;


    blackTime =
        selectedTime;


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

    hidePromotion();


    renderBoard();

    renderMoveHistory();

    renderCaptured();

    renderTimers();

    updateStatus();

    startTimer();
}


/* =========================================================
   TIMER SETTINGS
========================================================= */

timerButtons.forEach(

    button => {

        button.addEventListener(

            "click",

            () => {

                selectedTime =
                    Number(
                        button.dataset.time
                    );


                timerButtons.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


                button.classList.add(
                    "active"
                );


                timerLabel.textContent =
                    selectedTime / 60 +
                    " Min";


                newGame();
            }

        );

    }

);


/* =========================================================
   DIFFICULTY
========================================================= */

difficultyButtons.forEach(

    button => {

        button.addEventListener(

            "click",

            () => {

                if (botThinking) {
                    return;
                }


                botDifficulty =
                    button.dataset.level;


                difficultyButtons.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


                button.classList.add(
                    "active"
                );


                difficultyLabel.textContent =
                    capitalize(
                        botDifficulty
                    );


                newGame();
            }

        );

    }

);


/* =========================================================
   TIMER
========================================================= */

function startTimer() {

    clearInterval(
        timerInterval
    );


    timerInterval =
        setInterval(

            () => {

                if (
                    gameOver ||
                    pendingPromotion
                ) {
                    return;
                }


                if (
                    currentTurn ===
                    "white"
                ) {

                    whiteTime--;

                } else {

                    blackTime--;
                }


                if (
                    whiteTime <= 0
                ) {

                    whiteTime = 0;

                    endByTime(
                        "Computer"
                    );
                }


                if (
                    blackTime <= 0
                ) {

                    blackTime = 0;

                    endByTime(
                        "You"
                    );
                }


                renderTimers();

            },

            1000

        );
}


function renderTimers() {

    whiteTimer.textContent =
        formatTime(
            whiteTime
        );


    blackTimer.textContent =
        formatTime(
            blackTime
        );


    whiteTimer.classList.toggle(
        "active-timer",
        currentTurn ===
            "white" &&
        !gameOver
    );


    blackTimer.classList.toggle(
        "active-timer",
        currentTurn ===
            "black" &&
        !gameOver
    );


    whiteTimer.classList.toggle(
        "timer-danger",
        whiteTime <= 30
    );


    blackTimer.classList.toggle(
        "timer-danger",
        blackTime <= 30
    );
}


function formatTime(seconds) {

    const minutes =
        Math.floor(
            seconds / 60
        );


    const secs =
        seconds % 60;


    return (
        String(minutes)
            .padStart(
                2,
                "0"
            )
        +
        ":"
        +
        String(secs)
            .padStart(
                2,
                "0"
            )
    );
}


function endByTime(
    winner
) {

    if (gameOver) {
        return;
    }


    gameOver =
        true;


    botThinking =
        false;


    clearInterval(
        timerInterval
    );


    playGameOverSound();

    vibrate(
        [100, 80, 150]
    );


    showMessage(

        "Time Out!",

        `${winner} win on time.`

    );


    updateStatus();
}


/* =========================================================
   RENDER BOARD
========================================================= */

function renderBoard() {

    boardElement.innerHTML =
        "";


    for (
        let row = 0;
        row < 8;
        row++
    ) {

        for (
            let col = 0;
            col < 8;
            col++
        ) {

            const square =
                document.createElement(
                    "div"
                );


            square.className =
                "square";


            square.classList.add(

                (row + col) %
                2 === 0

                    ? "light"

                    : "dark"

            );


            if (col === 0) {

                const rank =
                    document.createElement(
                        "span"
                    );


                rank.className =
                    "coordinate rank";


                rank.textContent =
                    8 - row;


                square.appendChild(
                    rank
                );
            }


            if (row === 7) {

                const file =
                    document.createElement(
                        "span"
                    );


                file.className =
                    "coordinate file";


                file.textContent =
                    String.fromCharCode(
                        97 + col
                    );


                square.appendChild(
                    file
                );
            }


            const piece =
                board[row][col];


            if (piece) {

                const element =
                    document.createElement(
                        "span"
                    );


                element.className =
                    `piece ${piece.color}-piece`;


                element.textContent =
                    PIECES[
                        piece.color
                    ][
                        piece.type
                    ];


                square.appendChild(
                    element
                );
            }


            if (
                selectedSquare &&
                selectedSquare.row === row &&
                selectedSquare.col === col
            ) {

                square.classList.add(
                    "selected"
                );
            }


            const move =
                legalMoves.find(

                    item =>
                        item.row === row &&
                        item.col === col

                );


            if (move) {

                if (
                    board[row][col] ||
                    move.enPassant
                ) {

                    square.classList.add(
                        "capture-move"
                    );

                } else {

                    square.classList.add(
                        "legal-move"
                    );
                }
            }


            if (
                piece &&
                piece.type ===
                    "king" &&
                isKingInCheck(
                    piece.color
                )
            ) {

                square.classList.add(
                    "in-check"
                );
            }


            square.addEventListener(

                "click",

                () =>
                    handleSquareClick(
                        row,
                        col
                    )

            );


            boardElement.appendChild(
                square
            );
        }
    }
}


/* =========================================================
   PLAYER CLICK
========================================================= */

function handleSquareClick(
    row,
    col
) {

    if (gameOver) return;

    if (botThinking) return;

    if (pendingPromotion) return;

    if (
        currentTurn !==
        "white"
    ) return;


    const clickedPiece =
        board[row][col];


    if (!selectedSquare) {

        if (
            clickedPiece &&
            clickedPiece.color ===
                "white"
        ) {

            selectedSquare = {
                row,
                col
            };


            legalMoves =
                getLegalMoves(
                    row,
                    col
                );


            playSelectSound();


            vibrate(20);


            renderBoard();
        }


        return;
    }


    if (
        clickedPiece &&
        clickedPiece.color ===
            "white"
    ) {

        selectedSquare = {
            row,
            col
        };


        legalMoves =
            getLegalMoves(
                row,
                col
            );


        playSelectSound();


        vibrate(15);


        renderBoard();


        return;
    }


    const allowed =
        legalMoves.some(

            move =>
                move.row === row &&
                move.col === col

        );


    if (allowed) {

        makeMove(

            selectedSquare.row,

            selectedSquare.col,

            row,

            col

        );

    } else {

        selectedSquare =
            null;


        legalMoves = [];


        renderBoard();
    }
}


/* =========================================================
   LEGAL MOVES
========================================================= */

function getLegalMoves(
    row,
    col
) {

    return getLegalMovesForBoard(

        board,

        row,

        col

    );
}


function getLegalMovesForBoard(
    gameBoard,
    row,
    col
) {

    const piece =
        gameBoard[row][col];


    if (!piece) {
        return [];
    }


    const pseudo =
        getPseudoMoves(
            gameBoard,
            row,
            col
        );


    const legal = [];


    for (
        const move
        of pseudo
    ) {

        const test =
            cloneBoard(
                gameBoard
            );


        applyMoveToBoard(

            test,

            row,
            col,

            move.row,
            move.col,

            move

        );


        if (
            !isKingInCheckOnBoard(

                test,

                piece.color

            )
        ) {

            legal.push(
                move
            );
        }
    }


    return legal;
}


/* =========================================================
   PSEUDO MOVES
========================================================= */

function getPseudoMoves(
    gameBoard,
    row,
    col
) {

    const piece =
        gameBoard[row][col];


    if (!piece) {
        return [];
    }


    const moves = [];


    function add(
        r,
        c
    ) {

        if (
            !inside(
                r,
                c
            )
        ) return;


        const target =
            gameBoard[r][c];


        if (
            !target ||
            target.color !==
                piece.color
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

        for (
            const [dr, dc]
            of directions
        ) {

            let r =
                row + dr;


            let c =
                col + dc;


            while (
                inside(
                    r,
                    c
                )
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
                        target.color !==
                            piece.color
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

    if (
        piece.type ===
        "pawn"
    ) {

        const direction =
            piece.color ===
                "white"
                ? -1
                : 1;


        const start =
            piece.color ===
                "white"
                ? 6
                : 1;


        if (
            inside(
                row + direction,
                col
            ) &&
            !gameBoard[
                row + direction
            ][col]
        ) {

            moves.push({

                row:
                    row + direction,

                col

            });


            if (
                row === start &&
                !gameBoard[
                    row +
                    direction * 2
                ][col]
            ) {

                moves.push({

                    row:
                        row +
                        direction * 2,

                    col

                });
            }
        }


        for (
            const dc
            of [-1, 1]
        ) {

            const r =
                row + direction;


            const c =
                col + dc;


            if (
                !inside(
                    r,
                    c
                )
            ) continue;


            if (
                gameBoard[r][c] &&
                gameBoard[r][c].color !==
                    piece.color
            ) {

                moves.push({
                    row: r,
                    col: c
                });
            }
        }
    }


    if (
        piece.type ===
        "knight"
    ) {

        [

            [-2,-1],
            [-2,1],

            [-1,-2],
            [-1,2],

            [1,-2],
            [1,2],

            [2,-1],
            [2,1]

        ].forEach(

            ([dr, dc]) =>
                add(
                    row + dr,
                    col + dc
                )

        );
    }


    if (
        piece.type ===
        "bishop"
    ) {

        slide([

            [-1,-1],
            [-1,1],

            [1,-1],
            [1,1]

        ]);
    }


    if (
        piece.type ===
        "rook"
    ) {

        slide([

            [-1,0],
            [1,0],

            [0,-1],
            [0,1]

        ]);
    }


    if (
        piece.type ===
        "queen"
    ) {

        slide([

            [-1,-1],
            [-1,1],

            [1,-1],
            [1,1],

            [-1,0],
            [1,0],

            [0,-1],
            [0,1]

        ]);
    }


    if (
        piece.type ===
        "king"
    ) {

        for (
            let dr = -1;
            dr <= 1;
            dr++
        ) {

            for (
                let dc = -1;
                dc <= 1;
                dc++
            ) {

                if (
                    dr === 0 &&
                    dc === 0
                ) continue;


                add(
                    row + dr,
                    col + dc
                );
            }
        }
    }


    return moves;
}


/* =========================================================
   MAKE MOVE
========================================================= */

function makeMove(
    fromRow,
    fromCol,
    toRow,
    toCol
) {

    const piece =
        board[
            fromRow
        ][
            fromCol
        ];


    if (!piece) return;


    const move =
        legalMoves.find(

            item =>
                item.row === toRow &&
                item.col === toCol

        );


    if (!move) return;


    const captured =
        board[
            toRow
        ][
            toCol
        ];


    if (captured) {

        if (
            piece.color ===
            "white"
        ) {

            capturedByWhite.push(
                captured
            );

        } else {

            capturedByBlack.push(
                captured
            );
        }


        playCaptureSound();

        vibrate(
            [30, 30, 35]
        );

    } else {

        playMoveSound();

        vibrate(15);
    }


    const notation =
        createNotation(

            piece,

            fromCol,

            toRow,

            toCol,

            captured

        );


    applyMoveToBoard(

        board,

        fromRow,
        fromCol,

        toRow,
        toCol,

        move

    );


    moveHistory.push({

        notation,

        color:
            piece.color

    });


    selectedSquare =
        null;


    legalMoves = [];


    renderCaptured();


    if (
        piece.type ===
            "pawn" &&
        piece.color ===
            "white" &&
        toRow === 0
    ) {

        pendingPromotion = {

            row:
                toRow,

            col:
                toCol

        };


        renderBoard();

        renderMoveHistory();

        showPromotion();

        return;
    }


    if (
        piece.type ===
            "pawn" &&
        piece.color ===
            "black" &&
        toRow === 7
    ) {

        board[
            toRow
        ][
            toCol
        ].type =
            "queen";
    }


    finishTurn(
        piece.color
    );
}


/* =========================================================
   APPLY MOVE
========================================================= */

function applyMoveToBoard(
    gameBoard,
    fromRow,
    fromCol,
    toRow,
    toCol,
    move
) {

    gameBoard[
        toRow
    ][
        toCol
    ] =
        gameBoard[
            fromRow
        ][
            fromCol
        ];


    gameBoard[
        fromRow
    ][
        fromCol
    ] =
        null;
}


/* =========================================================
   FINISH TURN
========================================================= */

function finishTurn(
    movedColor
) {

    currentTurn =
        movedColor ===
            "white"

            ? "black"

            : "white";


    renderBoard();

    renderMoveHistory();

    renderTimers();

    updateStatus();

    checkGameState();


    if (
        !gameOver &&
        currentTurn ===
            BOT_COLOR
    ) {

        startBot();
    }
}


/* =========================================================
   PROMOTION
========================================================= */

function showPromotion() {

    promotionOverlay
        .classList
        .remove(
            "hidden"
        );


    playPromotionSound();

    vibrate(
        [50,50,80]
    );
}


function hidePromotion() {

    promotionOverlay
        .classList
        .add(
            "hidden"
        );
}


promotionChoices.forEach(

    button => {

        button.addEventListener(

            "click",

            () => {

                if (
                    !pendingPromotion
                ) return;


                const {
                    row,
                    col
                } =
                    pendingPromotion;


                board[
                    row
                ][
                    col
                ].type =
                    button.dataset.piece;


                pendingPromotion =
                    null;


                hidePromotion();


                playMoveSound();


                finishTurn(
                    "white"
                );
            }

        );

    }

);


/* =========================================================
   CAPTURED PIECES
========================================================= */

function renderCaptured() {

    whiteCapturedElement.textContent =
        capturedByWhite.length

            ? capturedByWhite
                .map(
                    piece =>
                        PIECES[
                            piece.color
                        ][
                            piece.type
                        ]
                )
                .join(" ")

            : "—";


    blackCapturedElement.textContent =
        capturedByBlack.length

            ? capturedByBlack
                .map(
                    piece =>
                        PIECES[
                            piece.color
                        ][
                            piece.type
                        ]
                )
                .join(" ")

            : "—";
}


/* =========================================================
   BOT
========================================================= */

function startBot() {

    botThinking =
        true;


    blackStatus.textContent =
        "Thinking...";


    turnText.textContent =
        botDifficulty ===
            "hard"

            ? "Computer calculating..."

            : "Computer thinking...";


    setTimeout(

        () => {

            if (
                gameOver
            ) return;


            const move =
                chooseBotMove();


            if (!move) {

                botThinking =
                    false;


                checkGameState();

                return;
            }


            legalMoves =
                getLegalMoves(

                    move.fromRow,

                    move.fromCol

                );


            botThinking =
                false;


            makeMove(

                move.fromRow,

                move.fromCol,

                move.toRow,

                move.toCol

            );

        },

        botDifficulty ===
            "hard"

            ? 450

            : 650

    );
}


/* =========================================================
   BOT MOVE
========================================================= */

function chooseBotMove() {

    const moves =
        getAllMoves(
            board,
            "black"
        );


    if (!moves.length) {
        return null;
    }


    if (
        botDifficulty ===
        "easy"
    ) {

        return moves[
            randomIndex(
                moves.length
            )
        ];
    }


    if (
        botDifficulty ===
        "medium"
    ) {

        return searchBestMove(
            moves,
            2
        );
    }


    return searchBestMove(
        moves,
        3
    );
}


/* =========================================================
   MINIMAX
========================================================= */

function searchBestMove(
    moves,
    depth
) {

    let bestScore =
        -Infinity;


    let bestMove =
        moves[0];


    moves.sort(

        (a, b) =>

            quickMoveScore(
                b
            )
            -
            quickMoveScore(
                a
            )

    );


    const candidates =
        moves.slice(
            0,
            depth === 3
                ? 24
                : moves.length
        );


    for (
        const move
        of candidates
    ) {

        const test =
            cloneBoard(
                board
            );


        applyMoveToBoard(

            test,

            move.fromRow,
            move.fromCol,

            move.toRow,
            move.toCol,

            move.move

        );


        const score =
            minimax(

                test,

                depth - 1,

                false,

                -Infinity,

                Infinity

            );


        if (
            score >
            bestScore
        ) {

            bestScore =
                score;


            bestMove =
                move;
        }
    }


    return bestMove;
}


function minimax(
    gameBoard,
    depth,
    maximizing,
    alpha,
    beta
) {

    if (
        depth === 0
    ) {

        return evaluateBoard(
            gameBoard
        );
    }


    const color =
        maximizing
            ? "black"
            : "white";


    const moves =
        getAllMoves(
            gameBoard,
            color
        );


    if (!moves.length) {

        if (
            isKingInCheckOnBoard(
                gameBoard,
                color
            )
        ) {

            return maximizing
                ? -100000
                : 100000;
        }


        return 0;
    }


    moves.sort(

        (a, b) =>
            quickMoveScore(
                b,
                gameBoard
            )
            -
            quickMoveScore(
                a,
                gameBoard
            )

    );


    const limited =
        moves.slice(
            0,
            20
        );


    if (maximizing) {

        let best =
            -Infinity;


        for (
            const move
            of limited
        ) {

            const test =
                cloneBoard(
                    gameBoard
                );


            applyMoveToBoard(

                test,

                move.fromRow,
                move.fromCol,

                move.toRow,
                move.toCol,

                move.move

            );


            const score =
                minimax(

                    test,

                    depth - 1,

                    false,

                    alpha,

                    beta

                );


            best =
                Math.max(
                    best,
                    score
                );


            alpha =
                Math.max(
                    alpha,
                    best
                );


            if (
                beta <= alpha
            ) break;
        }


        return best;
    }


    let best =
        Infinity;


    for (
        const move
        of limited
    ) {

        const test =
            cloneBoard(
                gameBoard
            );


        applyMoveToBoard(

            test,

            move.fromRow,
            move.fromCol,

            move.toRow,
            move.toCol,

            move.move

        );


        const score =
            minimax(

                test,

                depth - 1,

                true,

                alpha,

                beta

            );


        best =
            Math.min(
                best,
                score
            );


        beta =
            Math.min(
                beta,
                best
            );


        if (
            beta <= alpha
        ) break;
    }


    return best;
}


/* =========================================================
   ALL MOVES
========================================================= */

function getAllMoves(
    gameBoard,
    color
) {

    const result = [];


    for (
        let row = 0;
        row < 8;
        row++
    ) {

        for (
            let col = 0;
            col < 8;
            col++
        ) {

            const piece =
                gameBoard[
                    row
                ][
                    col
                ];


            if (
                !piece ||
                piece.color !==
                    color
            ) continue;


            const moves =
                getLegalMovesForBoard(

                    gameBoard,

                    row,

                    col

                );


            for (
                const move
                of moves
            ) {

                result.push({

                    fromRow:
                        row,

                    fromCol:
                        col,

                    toRow:
                        move.row,

                    toCol:
                        move.col,

                    move

                });
            }
        }
    }


    return result;
}


/* =========================================================
   BOT EVALUATION
========================================================= */

function evaluateBoard(
    gameBoard
) {

    let score = 0;


    for (
        let row = 0;
        row < 8;
        row++
    ) {

        for (
            let col = 0;
            col < 8;
            col++
        ) {

            const piece =
                gameBoard[
                    row
                ][
                    col
                ];


            if (!piece) continue;


            let value =
                PIECE_VALUES[
                    piece.type
                ];


            const center =
                Math.max(

                    0,

                    4 -
                    (
                        Math.abs(
                            3.5 - row
                        )
                        +
                        Math.abs(
                            3.5 - col
                        )
                    )

                );


            if (
                piece.type ===
                "knight"
            ) {

                value +=
                    center * 15;
            }


            if (
                piece.type ===
                "bishop"
            ) {

                value +=
                    center * 8;
            }


            if (
                piece.type ===
                "pawn"
            ) {

                value +=
                    center * 4;
            }


            if (
                piece.color ===
                "black"
            ) {

                score +=
                    value;

            } else {

                score -=
                    value;
            }
        }
    }


    return score;
}


function quickMoveScore(
    move,
    gameBoard = board
) {

    let score = 0;


    const attacker =
        gameBoard[
            move.fromRow
        ][
            move.fromCol
        ];


    const target =
        gameBoard[
            move.toRow
        ][
            move.toCol
        ];


    if (target) {

        score +=

            PIECE_VALUES[
                target.type
            ] * 10

            -

            PIECE_VALUES[
                attacker.type
            ];
    }


    return score;
}


/* =========================================================
   CHECK
========================================================= */

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


    for (
        let row = 0;
        row < 8;
        row++
    ) {

        for (
            let col = 0;
            col < 8;
            col++
        ) {

            const piece =
                gameBoard[
                    row
                ][
                    col
                ];


            if (
                piece &&
                piece.color === color &&
                piece.type === "king"
            ) {

                kingRow =
                    row;


                kingCol =
                    col;
            }
        }
    }


    if (
        kingRow < 0
    ) return true;


    const enemy =
        color ===
            "white"
            ? "black"
            : "white";


    return isSquareAttacked(

        gameBoard,

        kingRow,

        kingCol,

        enemy

    );
}


function isSquareAttacked(
    gameBoard,
    targetRow,
    targetCol,
    attackerColor
) {

    for (
        let row = 0;
        row < 8;
        row++
    ) {

        for (
            let col = 0;
            col < 8;
            col++
        ) {

            const piece =
                gameBoard[
                    row
                ][
                    col
                ];


            if (
                !piece ||
                piece.color !==
                    attackerColor
            ) continue;


            if (
                pieceAttacksSquare(

                    gameBoard,

                    row,

                    col,

                    targetRow,

                    targetCol

                )
            ) {

                return true;
            }
        }
    }


    return false;
}


function pieceAttacksSquare(
    gameBoard,
    fromRow,
    fromCol,
    targetRow,
    targetCol
) {

    const piece =
        gameBoard[
            fromRow
        ][
            fromCol
        ];


    if (!piece) return false;


    const dr =
        targetRow -
        fromRow;


    const dc =
        targetCol -
        fromCol;


    if (
        piece.type ===
        "pawn"
    ) {

        const direction =
            piece.color ===
                "white"
                ? -1
                : 1;


        return (
            dr === direction &&
            Math.abs(dc) === 1
        );
    }


    if (
        piece.type ===
        "knight"
    ) {

        return (

            (
                Math.abs(dr) === 2 &&
                Math.abs(dc) === 1
            )

            ||

            (
                Math.abs(dr) === 1 &&
                Math.abs(dc) === 2
            )

        );
    }


    if (
        piece.type ===
        "king"
    ) {

        return (
            Math.abs(dr) <= 1 &&
            Math.abs(dc) <= 1
        );
    }


    if (
        piece.type ===
        "bishop" &&
        Math.abs(dr) !==
            Math.abs(dc)
    ) {

        return false;
    }


    if (
        piece.type ===
        "rook" &&
        dr !== 0 &&
        dc !== 0
    ) {

        return false;
    }


    if (
        piece.type ===
        "queen"
    ) {

        const straight =
            dr === 0 ||
            dc === 0;


        const diagonal =
            Math.abs(dr) ===
            Math.abs(dc);


        if (
            !straight &&
            !diagonal
        ) {

            return false;
        }
    }


    const stepRow =
        Math.sign(dr);


    const stepCol =
        Math.sign(dc);


    let row =
        fromRow +
        stepRow;


    let col =
        fromCol +
        stepCol;


    while (
        row !== targetRow ||
        col !== targetCol
    ) {

        if (
            gameBoard[
                row
            ][
                col
            ]
        ) {

            return false;
        }


        row += stepRow;

        col += stepCol;
    }


    return true;
}


/* =========================================================
   GAME STATE
========================================================= */

function checkGameState() {

    const moves =
        getAllMoves(

            board,

            currentTurn

        );


    if (
        moves.length > 0
    ) {

        if (
            isKingInCheck(
                currentTurn
            )
        ) {

            statusBadge.textContent =
                "CHECK";


            statusBadge.style.background =
                "#4a2020";


            statusBadge.style.color =
                "#ff8b8b";


            playCheckSound();

            vibrate(
                [50,30,60]
            );
        }


        return;
    }


    gameOver =
        true;


    botThinking =
        false;


    clearInterval(
        timerInterval
    );


    if (
        isKingInCheck(
            currentTurn
        )
    ) {

        const winner =
            currentTurn ===
                "white"

                ? "Computer"

                : "You";


        showMessage(

            "Checkmate!",

            `${winner} win the game.`

        );

    } else {

        showMessage(

            "Draw",

            "The game ends in stalemate."

        );
    }


    playGameOverSound();


    vibrate(
        [100,70,150]
    );
}


/* =========================================================
   HISTORY
========================================================= */

function createNotation(
    piece,
    fromCol,
    toRow,
    toCol,
    captured
) {

    const files =
        "abcdefgh";


    const symbols = {

        king: "K",

        queen: "Q",

        rook: "R",

        bishop: "B",

        knight: "N",

        pawn: ""

    };


    let text =
        symbols[
            piece.type
        ];


    if (
        piece.type ===
            "pawn" &&
        captured
    ) {

        text +=
            files[
                fromCol
            ];
    }


    if (captured) {

        text += "x";
    }


    text +=

        files[
            toCol
        ]

        +

        (
            8 -
            toRow
        );


    return text;
}


function renderMoveHistory() {

    moveHistoryElement.innerHTML =
        "";


    if (
        moveHistory.length ===
        0
    ) {

        moveHistoryElement.innerHTML =
            `
            <div class="empty-history">
                No moves yet
            </div>
            `;


        moveCountElement.textContent =
            "0 moves";


        return;
    }


    moveHistory.forEach(

        (
            move,
            index
        ) => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "move";


            div.innerHTML = `

                <span class="move-number">
                    ${Math.floor(index / 2) + 1}.
                </span>

                ${move.notation}

            `;


            moveHistoryElement
                .appendChild(
                    div
                );
        }

    );


    moveCountElement.textContent =
        `${moveHistory.length} moves`;
}


/* =========================================================
   STATUS
========================================================= */

function updateStatus() {

    if (gameOver) return;


    if (
        currentTurn ===
        "white"
    ) {

        turnText.textContent =
            "Your Turn";


        whiteStatus.textContent =
            "Your Turn";


        blackStatus.textContent =
            `${capitalize(
                botDifficulty
            )} Bot`;


        statusBadge.textContent =
            "PLAYING";


        statusBadge.style.background =
            "#173a27";


        statusBadge.style.color =
            "#75d99b";

    } else {

        turnText.textContent =
            "Computer's Turn";


        whiteStatus.textContent =
            "Waiting";


        blackStatus.textContent =
            "Thinking...";


        statusBadge.textContent =
            botDifficulty
                .toUpperCase();


        statusBadge.style.background =
            "#302b17";


        statusBadge.style.color =
            "#e6c76b";
    }


    renderTimers();
}


/* =========================================================
   SOUND
========================================================= */

function playTone(
    frequency,
    duration,
    volume = .08
) {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioContext) return;


        const ctx =
            new AudioContext();


        const oscillator =
            ctx.createOscillator();


        const gain =
            ctx.createGain();


        oscillator.frequency.value =
            frequency;


        oscillator.type =
            "sine";


        gain.gain.value =
            volume;


        oscillator.connect(
            gain
        );


        gain.connect(
            ctx.destination
        );


        oscillator.start();


        gain.gain.exponentialRampToValueAtTime(

            0.001,

            ctx.currentTime +
            duration / 1000

        );


        oscillator.stop(

            ctx.currentTime +
            duration / 1000

        );

    } catch (error) {

        // Device may block audio.
    }
}


function playSelectSound() {

    playTone(
        350,
        45,
        .03
    );
}


function playMoveSound() {

    playTone(
        420,
        80
    );
}


function playCaptureSound() {

    playTone(
        220,
        120,
        .10
    );
}


function playCheckSound() {

    playTone(
        650,
        170,
        .09
    );
}


function playPromotionSound() {

    playTone(
        750,
        220,
        .08
    );
}


function playGameOverSound() {

    playTone(
        180,
        300,
        .10
    );
}


/* =========================================================
   VIBRATION
========================================================= */

function vibrate(pattern) {

    if (
        navigator.vibrate
    ) {

        navigator.vibrate(
            pattern
        );
    }
}


/* =========================================================
   MESSAGE
========================================================= */

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


/* =========================================================
   HELPERS
========================================================= */

function inside(
    row,
    col
) {

    return (
        row >= 0 &&
        row < 8 &&
        col >= 0 &&
        col < 8
    );
}


function cloneBoard(
    original
) {

    return original.map(

        row =>
            row.map(

                piece =>
                    piece

                        ? {
                            ...piece
                        }

                        : null

            )

    );
}


function capitalize(
    text
) {

    return (
        text.charAt(0)
            .toUpperCase()

        +

        text.slice(1)
    );
}


function randomIndex(
    length
) {

    return Math.floor(
        Math.random() *
        length
    );
}


/* =========================================================
   BUTTONS
========================================================= */

newGameBtn.addEventListener(
    "click",
    newGame
);


playAgainBtn.addEventListener(
    "click",
    newGame
);


/* =========================================================
   START
========================================================= */

newGame();
