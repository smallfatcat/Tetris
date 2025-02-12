const websocket = new WebSocket("ws://localhost:6789/");
const CLIENT_ID = Math.floor(Math.random() * 1000000);

const loggingOn = false;
const websocketEnabled = false;

let keys = {};
let keyTimer = {};
let keyRepeatTime = {};
let timeDelayDas = 400;
let timeDelayARE = 33;

let blankRow = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const blockColors = ["⬛", "🟦", "🟧", "🟨", "🟫", "🟩", "🟪", "🟥"]
const gridHeight = 24;
const startDisplay = 4;

let activeBlock = {};
let nextBlock = {};
let grid = [];
let lastGrid = [];
let lastActiveBlock = {};
let lastNextBlock = {};
let gameOver = false;
let score = 0;
let lines = 0;
let startLevel = 0;
let level = startLevel;
let speed = gravityArray[0];
let dropTickStart = Date.now();
let startTime = Date.now();
let history = [];
let historyNext = [];
let historyActiveBlock = [];
let nextBlockID = 0;

let replayMode = false;
let reassignMode = false;
let reassignControl = '';

let keymap = {
    rl: 'q',
    rr: 'e',
    mu: 'w',
    md: 's',
    ml: 'a',
    mr: 'd',
}

function reassign(elementID) {
    document.getElementById(elementID).classList.add("highlight-yellow");
    reassignControl = elementID;
    reassignMode = true;
}

function init() {
    history = [];
    historyNext = [];
    historyActiveBlock = [];
    grid = [];
    for (let i = 0; i < gridHeight; i++) {
        grid.push(blankRow.slice())
    }
    lastGrid = getGridCopy(grid);
    activeBlock = {};
    nextBlockID = 0;
    nextBlock = {
        x: 3,
        y: 2,
        type: getRandomInt(0, 7),
        rotation: 0,
        id: nextBlockID,
    }
    lastActiveBlock = getBlockCopy(nextBlock);

    gameOver = false;
    score = 0;
    lines = 0;
    startLevel = Number(document.getElementById("startlevel").value);
    level = startLevel;
    speed = gravityArray[0];
    spawnBlock();
    dropTickStart = Date.now();
    startTime = Date.now();
    drawGrid(grid, activeBlock);
    requestAnimationFrame(animate);
}

function checkLines() {
    var clearedCount = 0;
    for (let row = 0; row < grid.length; row++) {
        lineCleared = true;
        for (let col = 0; col < 10; col++) {
            if (grid[row][col] == 0) {
                lineCleared = false;
            }
        }
        if (lineCleared) {
            clearedCount += 1;
            grid.splice(row, 1);
            grid.unshift(blankRow.slice());
        }
    }
    switch (clearedCount) {
        case 1:
            score += 100 * level;
            break;
        case 2:
            score += 300 * level;
            break;
        case 3:
            score += 500 * level;
            break;
        case 4:
            score += 800 * level;
            break;
        default:
            break;
    }
    lines += clearedCount;
    level = calcLevel(lines);
    speed = calcSpeed(level);
}

function calcLevel(lines) {
    return Math.floor(lines / 5) + startLevel;
}

function calcSpeed(level) {
    return gravityArray[level];
    // return Math.floor(((0.8 - ((level - 1) * 0.007)) ** (level - 1)) * 1000);
}

function spawnBlock() {
    if (!gameOver) {
        nextBlockID += 1;
        checkLines();
        if (collidesWithGrid(grid, nextBlock, 0, 0, 0)) {
            console.log("Game Ended");
            gameOver = true;
        }
        else {
            activeBlock = {
                x: 3,
                y: 2,
                type: nextBlock.type,
                rotation: 0,
                id: nextBlock.id,
            }

            nextBlock.type = getRandomInt(0, 7);
            nextBlock.id = nextBlockID;

        }
    }
}

function lockBlock(grid) {
    var coords = blockCoords[activeBlock.type][activeBlock.rotation];
    for (var coord of coords) {
        var col = activeBlock.x + coord[0];
        var row = activeBlock.y + coord[1];
        grid[row][col] = activeBlock.type + 1;
    }
}

function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    var res = Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);

    historyNext.push(res);

    return res; // The maximum is exclusive and the minimum is inclusive
}

function collidesWithGrid(grid, activeBlock, new_x, new_y, new_rotation) {
    var coords = blockCoords[activeBlock.type][(activeBlock.rotation + new_rotation) % 4];
    for (var coord of coords) {
        var col = activeBlock.x + new_x + coord[0];
        var row = activeBlock.y + new_y + coord[1];
        if ((col < 0 || col > 9) || (row > gridHeight - 1) || grid[row][col]) {
            return true;
        }
    }
    return false;
}

function drawGrid(grid, activeBlock) {
    document.getElementById("griddiv").innerHTML = renderGridElement(grid, activeBlock);
    document.getElementById("nextdiv").innerHTML = renderBlockElement(nextBlock.type, 0);
    document.getElementById("scorediv").innerHTML = "Score: " + score + "<br>" + "Level: " + level + "<br>" + "Lines: " + lines;
}

function renderGridElement(grid, activeBlock) {
    gridElement = '';
    for (let row = startDisplay; row < grid.length; row++) {
        var rowText = '';
        for (let col = 0; col < 10; col++) {
            var coords = blockCoords[activeBlock.type][activeBlock.rotation]
            var noActiveBlockAtThisCoord = true;
            for (let coord of coords) {
                var x = activeBlock.x + coord[0];
                var y = activeBlock.y + coord[1];
                if (row == y && col == x) {
                    rowText += blockColors[activeBlock.type + 1];
                    noActiveBlockAtThisCoord = false;
                    break;
                }
            }
            if (noActiveBlockAtThisCoord) {
                rowText += blockColors[grid[row][col]];
            }
        }
        gridElement += rowText + '<br>';
    }
    return gridElement;
}

function renderBlockElement(blockType, blockRotation) {
    nextElement = '';
    var size = 3;
    if (blockType == BLOCK_I || blockType == BLOCK_O) {
        size = 4;
    }
    for (let x = 0; x < size; x++) {
        var rowText = '';
        for (let y = 0; y < size; y++) {
            var coords = blockCoords[blockType][blockRotation];
            var flag = false;
            for (let coord of coords) {
                if (coord[0] == y && coord[1] == x) {
                    flag = true;
                    break;
                }
            }
            if (flag) {
                rowText += blockColors[blockType + 1];
            }
            else {
                rowText += blockColors[0];
            }
        }
        nextElement += rowText + '<br>';;
    }
    return nextElement;
}

function animate() {
    checkKeys();
    if (Date.now() - dropTickStart > speed) {
        dropTickStart = Date.now();
        if (collidesWithGrid(grid, activeBlock, 0, 1, 0)) {
            lockBlock(grid);
            spawnBlock();
        }
        else {
            activeBlock.y += 1;
        }
    }

    if (gridChanged(grid, lastGrid)) {
        history.push([Date.now() - startTime, getGridCopy(grid)]);
        if (websocketEnabled) {
            websocket.send(JSON.stringify({ cid: CLIENT_ID, type: "g", t: Date.now() - startTime, d: getGridCopy(grid) }));
        }
    }
    if (blockChanged(activeBlock, lastActiveBlock)) {
        historyActiveBlock.push([Date.now() - startTime, getBlockCopy(activeBlock)]);
        if (websocketEnabled) {
            websocket.send(JSON.stringify({ cid: CLIENT_ID, type: "b", t: Date.now() - startTime, d: getBlockCopy(activeBlock), n: nextBlock.type }));
        }
    }
    lastActiveBlock = getBlockCopy(activeBlock);
    lastGrid = getGridCopy(grid);
    drawGrid(grid, activeBlock);
    if (!gameOver) {
        requestAnimationFrame(animate);
    }
}

function blockChanged(block, lastblock) {
    if (block.x != lastblock.x
        || block.y != lastblock.y
        || block.rotation != lastblock.rotation
        || block.type != lastblock.type
        || block.id != lastblock.id) {
        return true;
    }
    return false;
}

function gridChanged(grid, lastGrid) {
    var changedGrid = false;
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[0].length; col++) {
            if (grid[row][col] != lastGrid[row][col]) {
                changedGrid = true;
                break;
            }
        }
        if (changedGrid) {
            break;
        }
    }
    return changedGrid;
}

function getBlockCopy(blockOriginal) {
    let blockCopy = {
        x: blockOriginal.x,
        y: blockOriginal.y,
        type: blockOriginal.type,
        rotation: blockOriginal.rotation,
        id: blockOriginal.id,
    }
    return blockCopy
}

function getGridCopy(originalGrid) {
    let copyOfGrid = [];
    for (let i = 0; i < originalGrid.length; i++) {
        row = []
        for (let j = 0; j < originalGrid[0].length; j++) {
            row.push(originalGrid[i][j]);
        }
        copyOfGrid.push(row);
    }
    return copyOfGrid;
}

function down() {
    if (!collidesWithGrid(grid, activeBlock, 0, 1, 0)) {
        activeBlock.y += 1;
        dropTickStart = Date.now();
    }
    else {
        lockBlock(grid);
        spawnBlock();
    }
}

function left() {
    if (!collidesWithGrid(grid, activeBlock, -1, 0, 0)) {
        activeBlock.x -= 1;
    }
}

function right() {
    if (!collidesWithGrid(grid, activeBlock, 1, 0, 0)) {
        activeBlock.x += 1;
    }
}

function rotateLeft() {
    if (activeBlock.type == BLOCK_I) {
        rotateUsingSRS(rotIleft[activeBlock.rotation]);
    }
    else if (activeBlock.type != BLOCK_O) {
        rotateUsingSRS(rotJLTSZleft[activeBlock.rotation]);
    }
}

function rotateRight() {
    if (activeBlock.type == BLOCK_I) {
        rotateUsingSRS(rotIright[activeBlock.rotation]);
    }
    else if (activeBlock.type != BLOCK_O) {
        rotateUsingSRS(rotJLTSZright[activeBlock.rotation]);
    }
}

function rotateUsingSRS(srsArray) {
    for (let i = 0; i < srsArray.length; i++) {
        if (skipCheck(srsArray[i][0], srsArray[i][1], srsArray[i][2])) {
            break;
        }
    }
}

function hardDrop() {
    let locked = false;
    while (!locked) {
        if (!collidesWithGrid(grid, activeBlock, 0, 1, 0)) {
            activeBlock.y += 1;
            // dropTickStart = Date.now();
        }
        else {
            // lockBlock(grid);
            // spawnBlock();
            locked = true;
        }
    }
}

function skipCheck(x, y, r) {
    if (!collidesWithGrid(grid, activeBlock, x, y, r)) {   // left/up
        activeBlock.x += x;
        activeBlock.y += y;
        activeBlock.rotation = (activeBlock.rotation + r) % 4;
        return true;
    }
    return false;
}

function highlightKey(key){
    switch(key){
        case 'w':
            if(keys[key]){
                document.getElementById('mu').classList.add("highlight")
            }
            else {
                document.getElementById('mu').classList.remove("highlight")
            }
            break;
        case 'a':
            if(keys[key]){
                document.getElementById('ml').classList.add("highlight")
            }
            else {
                document.getElementById('ml').classList.remove("highlight")
            }
            break;
        case 's':
            if(keys[key]){
                document.getElementById('md').classList.add("highlight")
            }
            else {
                document.getElementById('md').classList.remove("highlight")
            }
            break;
        case 'd':
            if(keys[key]){
                document.getElementById('mr').classList.add("highlight")
            }
            else {
                document.getElementById('mr').classList.remove("highlight")
            }
            break;
        case 'q':
            if(keys[key]){
                document.getElementById('rl').classList.add("highlight")
            }
            else {
                document.getElementById('rl').classList.remove("highlight")
            }
            break;
        case 'e':
            if(keys[key]){
                document.getElementById('rr').classList.add("highlight")
            }
            else {
                document.getElementById('rr').classList.remove("highlight")
            }
            break;
    }
}


function checkKeys() {
    for (let key of Object.keys(keys)) {
        highlightKey(key);
        if (keys[key] && Date.now() - keyTimer[key] > keyRepeatTime[key]) {
            keyTimer[key] = Date.now();
            if (keyRepeatTime[key] == 0) {
                keyRepeatTime[key] = timeDelayDas;
            }
            else {
                keyRepeatTime[key] = timeDelayARE;
            }
            switch (key) {
                case keymap['ml']:
                    left();
                    break;
                case keymap['mr']:
                    right();
                    break;
                case keymap['md']:
                    down();
                    break;
                case keymap['mu']:
                    hardDrop();
                    break;
                case keymap['rr']:
                    rotateRight();
                    break;
                case keymap['rl']:
                    rotateLeft();
                    break;
            }
        }
    }
}

window.onload = (event) => {
    init();

    // Handle user input (add keypress events)
    document.addEventListener('keydown', function (event) {
        if(reassignMode){
            keymap[reassignControl] = event.key.toLowerCase();
            document.getElementById(reassignControl).classList.remove("highlight-yellow");
            document.getElementById(reassignControl).innerHTML = event.key.toUpperCase();
            reassignMode = false;
        }
        
        if (!keys[event.key.toLowerCase()]) {
            keys[event.key.toLowerCase()] = true;
            keyTimer[event.key.toLowerCase()] = Date.now();
            keyRepeatTime[event.key.toLowerCase()] = 0;
        }
        drawGrid(grid, activeBlock)
    });

    document.addEventListener('keyup', function (event) {
        keys[event.key.toLowerCase()] = false;
        drawGrid(grid, activeBlock)
    });

    websocket.onmessage = ({ data }) => {
        const event = JSON.parse(data);
        switch (event.type) {
            case "g":
                if (loggingOn) {
                    console.log(event);
                }
                break;
            case "b":
                if (loggingOn) {
                    console.log(event);
                }
                break;
            case "r":
                if (loggingOn) {
                    console.log(event);
                }
                break;
            case "open":
                if (loggingOn) {
                    console.log(event);
                }
                if (websocketEnabled) {
                    websocket.send(JSON.stringify({ cid: CLIENT_ID, type: "r", t: 0 }));
                }
                break;
            default:
                if (loggingOn) {
                    console.error("unsupported event", event);
                }
        }
    };
    websocket.onerror = ({ error }) => {
        // if (loggingOn) {
        console.log(error);
        // }
    };
};
