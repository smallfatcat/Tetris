let baseTiles = [];
let gridTiles = [];

let config = {};
config.width = 1000;
config.height = 1000;
config.uniqueEdges = 3;
config.tileSize = 20;
config.numberOfTiles = config.uniqueEdges ** 4;
config.gridSize = 100;
config.gridWidth = Math.sqrt(config.gridSize);


const EDGE_N = 0;
const EDGE_E = 1;
const EDGE_S = 2;
const EDGE_W = 3;

const roadColor = [
    "green",
    "white",
    "grey",
    "black",
    "red",
];

class GridTile {
    constructor(parameters) {
        this.x = parameters.x ? parameters.x : 0;
        this.y = parameters.y ? parameters.y : 0;
        // this.candidates = parameters.candidates ? parameters.candidates : [];
        this.candidates = parameters.candidates ? parameters.candidates : new Set();
        this.neighbours = parameters.neighbours ? parameters.neighbours : [];
        this.id = parameters.id ? parameters.id : 0;
    }
    
    getEntropy() {
        return this.candidates.size;
    }
}

class BaseTile {
    constructor(parameters) {
        this.edges = parameters.edges ? parameters.edges : [];
        this.size = parameters.size ? parameters.size : 20;
        this.color = parameters.color ? parameters.color : "green";
        this.possible = parameters.possible ? parameters.possible : [[], [], [], []];
        this.id = parameters.id ? parameters.id : 0;
    }

    draw(ctx, x, y) {
        ctx.lineWidth = 2;
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, this.size, this.size);
        let edgeOffset = this.size / 2;
        if (this.edges[EDGE_N]) {
            ctx.strokeStyle = roadColor[this.edges[EDGE_N]];
            ctx.beginPath();
            ctx.moveTo(x + edgeOffset, y);
            ctx.lineTo(x + edgeOffset, y + edgeOffset);
            ctx.stroke();
        }
        if (this.edges[EDGE_E]) {
            ctx.strokeStyle = roadColor[this.edges[EDGE_E]];
            ctx.beginPath();
            ctx.moveTo(x + this.size, y + edgeOffset);
            ctx.lineTo(x + edgeOffset, y + edgeOffset);
            ctx.stroke();
        }
        if (this.edges[EDGE_S]) {
            ctx.strokeStyle = roadColor[this.edges[EDGE_S]];
            ctx.beginPath();
            ctx.moveTo(x + edgeOffset, y + this.size);
            ctx.lineTo(x + edgeOffset, y + edgeOffset);
            ctx.stroke();
        }
        if (this.edges[EDGE_W]) {
            ctx.strokeStyle = roadColor[this.edges[EDGE_W]];
            ctx.beginPath();
            ctx.moveTo(x, y + edgeOffset);
            ctx.lineTo(x + edgeOffset, y + edgeOffset);
            ctx.stroke();
        }
    }
}

window.onload = (event) => {
    tileCanvas = document.getElementById("tileCanvas");
    tilectx = tileCanvas.getContext("2d");
    tileCanvas.width = config.width;
    tileCanvas.height = config.height;

    baseTiles = initBaseTiles(config.numberOfTiles);
    gridTiles = initGridTiles(config.gridSize)
    drawTiles(tilectx, baseTiles);
}

function drawTiles(ctx, tiles) {
    let i = 0;
    let sideLength = Math.sqrt(config.numberOfTiles);
    for (let tile of tiles) {
        let x = (i % sideLength) * config.tileSize;
        let y = Math.floor(i / sideLength) * config.tileSize;
        tile.draw(ctx, x, y);
        i++;
    }
}

function initBaseTiles(numberOfTiles) {
    let edges = generateEdges(config.uniqueEdges);
    let tiles = [];
    let sideLength = Math.sqrt(numberOfTiles);
    let id = 0;
    for (let j = 0; j < sideLength; j++) {
        for (let i = 0; i < sideLength; i++) {
            let tile = generateBaseTile(edges, id++);
            tiles.push(tile);
        }
    }
    tiles = generatePossibles(tiles);
    return tiles;
}

function initGridTiles() {
    let grid = [];
    let neighbours = generateNeighbours(config.gridSize, config.gridWidth);
    let candidates = generateCandidates(config.numberOfTiles);
    let id = 0;
    for (let j = 0; j < config.gridWidth; j++) {
        for (let i = 0; i < config.gridWidth; i++) {
            let tile = generateGridTile(i, j, neighbours[id], candidates, id++);
            grid.push(tile);
        }
    }
    return grid;
}

function generateCandidates(numberOfCandidates) {
    let candidates = new Set();
    for (let i = 0; i < numberOfCandidates; i++) {
        candidates.add(i);
    }
    return candidates;
}

function generateNeighbours(gridSize, gridWidth) {
    let neighbours = [];
    for (let id = 0; id < gridSize; id++) {
        let neighbour = [0, 0, 0, 0];
        neighbour[EDGE_N] = (id - gridWidth >= 0) ? id - gridWidth : undefined;
        neighbour[EDGE_E] = (id + 1 < gridWidth * gridWidth) ? id + 1 : undefined;
        neighbour[EDGE_S] = (id + gridWidth < gridWidth * gridWidth) ? id + gridWidth : undefined;
        neighbour[EDGE_W] = (id - 1 >= 0) ? id - 1 : undefined;
        neighbours.push(neighbour);
    }
    return neighbours;
}

function generateBaseTile(edges, id) {
    return new BaseTile({
        edges: edges[id],
        size: config.tileSize,
        color: "green",
        id: id,
    });
}

function generateGridTile(x, y, neighbours, candidates, id) {
    return new GridTile({
        x: x,
        y: y,
        id: id,
        neighbours: neighbours,
        candidates: candidates,
    });
}

function generateEdges(uniqueEdges) {
    let edges = [];
    for (let w = 0; w < uniqueEdges; w++) {
        for (let s = 0; s < uniqueEdges; s++) {
            for (let e = 0; e < uniqueEdges; e++) {
                for (let n = 0; n < uniqueEdges; n++) {
                    edges.push([n, e, s, w]);
                }
            }
        }
    }
    return edges;
}

function generatePossibles(tiles) {
    tiles.forEach(tile => {
        tiles.forEach(candidate => {
            if (tile.edges[EDGE_N] == candidate.edges[EDGE_S]) {
                tile.possible[EDGE_N].push(candidate.id);
            }
            if (tile.edges[EDGE_E] == candidate.edges[EDGE_W]) {
                tile.possible[EDGE_E].push(candidate.id);
            }
            if (tile.edges[EDGE_S] == candidate.edges[EDGE_N]) {
                tile.possible[EDGE_S].push(candidate.id);
            }
            if (tile.edges[EDGE_W] == candidate.edges[EDGE_E]) {
                tile.possible[EDGE_W].push(candidate.id);
            }
        });
    });
    return tiles;
}

function getLowestEntropy() {
    let lowestTiles = [];
    let lowest = Infinity;
    gridTiles.forEach(tile => {
        let entropy = tile.getEntropy();
        if (entropy > 1) {
            if (entropy < lowest) {
                lowest = entropy;
                lowestTiles = [];
            }
            if (entropy == lowest) {
                lowestTiles.push(tile.id);
            }
        }
    });
    let r = Math.floor(Math.random() * lowestTiles.length);
    return lowestTiles.length > 0 ? lowestTiles[r] : -1;
}

const getRandomItem = set => [...set][Math.floor(Math.random()*set.size)]

function collapse(tile) {
    let candidate = getRandomItem(tile.candidates);
    tile.candidates = new Set();
    tile.candidates.add(candidate);
}

function constrain(tile, possiblesSet) {
    let res = new Set();
    tile.candidates.forEach((candidate) => {
        if (possiblesSet.has(candidate)) {
            res.add(candidate);
        }
    });
    if (res.size != tile.candidates.size && res.size > 0) {
        tile.candidates = res;
        return true;
    }
    return false;
}

function wfc() {
    let stack = [];
    let lowestEntropy = getLowestEntropy();
    if (lowestEntropy == -1) {
        return false;
    }
    collapse(gridTiles[lowestEntropy]);
    stack.push(gridTiles[lowestEntropy]);

    while (stack.length > 0) {
        let tile = stack.pop();
        for(let d = 0; d < 4; d++){
            let possiblesSet = generatePossibleForAllCandidates(tile.candidates, d);
            let neighbourID = tile.neighbours[d];
            if (neighbourID != undefined) {
                let neighbour = gridTiles[neighbourID];
                if(neighbour.candidates.size > 1){
                    let reduced = constrain(neighbour, possiblesSet);
                    if (reduced) {
                        stack.push(neighbour);
                    }
                }
            }
        }
    }
    return true;
}

function generatePossibleForAllCandidates(candidates, direction){
    let possiblesSet = new Set();
    candidates.forEach((candidate)=>{
        let possible = baseTiles[candidate].possible[direction];
        possible.forEach((possible)=>{
            possiblesSet.add(possible)
        })
    });
    return possiblesSet;
}

function animate(t) {
    console.log(t);
    if (wfc()) {
        requestAnimationFrame(animate);
    }
    else {
        console.log(t, "finished")
    }
}