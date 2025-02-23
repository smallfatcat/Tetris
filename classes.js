class idleState {
    constructor() {
        this.moving = false;
    }
    
    update() {
        if (this.moving) {
            return new movingState();
        }
    }
    
    enter() {
        // console.log("entered Idle State")
    }
    
    exit() {
        // console.log("exited Idle State")
    }
    
    move(grid, baseTiles, other) {
        other.x = other.nextX;
        other.y = other.nextY;
        other.offsetX = other.nextX;
        other.offsetY = other.nextY;
        other.nextDistance = 0.0;
        this.getNextPosition(grid, baseTiles, other);
        return new movingState();
    }

    getNextPosition(grid, baseTiles, other) {
        let x = other.x;
        let y = other.y;
    
        let width = Math.sqrt(grid.length);
        let i = x + y * width;
        let candidate = grid[i].candidates[0];
        let edges = baseTiles[candidate].edges;
        let directions = [];
        for (let id = 0; id < 4; id++) {
            if (edges[id] == 1 || edges[id] == 5) {
                directions.push(id);
            }
        }
        let r = Math.floor(Math.random() * directions.length);
        let newDirection = directions[r];
        if (directions.length == 0) {
            return;
        }
        while ((grid[i].neighbours[newDirection] == undefined) || ((((newDirection + 2) % 4) == other.currentDirection) && directions.length > 1)) {
            r = (r + 1) % directions.length;
            newDirection = directions[r];
        }
        other.currentDirection = newDirection;
        let nextID = grid[i].neighbours[newDirection];
        other.nextX = grid[nextID].x;
        other.nextY = grid[nextID].y;
    }
}

class movingState {
    constructor() {
        this.moving = true;
    }

    enter() {
        // console.log("entered Moving State")
    }

    exit() {
        // console.log("exited Moving State")
    }

    update() {
        if (!this.moving) {
            return new idleState();
        }
    }

    move(grid, baseTiles, other) {
        other.nextDistance += other.speed;
        other.offsetX = other.x + ((other.nextX - other.x) * other.nextDistance);
        other.offsetY = other.y + ((other.nextY - other.y) * other.nextDistance);
        if (other.nextDistance > 1) {
            return new idleState();
        }
    }
}

class Bot {
    constructor(parameters) {
        this.x = parameters.x != undefined ? parameters.x : 0;
        this.y = parameters.y != undefined ? parameters.y : 0;
        this.activeState = new idleState();
        this.nextX = parameters.x ? parameters.x : 0;
        this.nextY = parameters.y ? parameters.y : 0;
        this.nextDistance = 0.0;
        this.offsetX = 0.0;
        this.offsetY = 0.0;
        this.speed = 0.01;
        this.color = parameters.color ? parameters.color : "white";
        this.currentDirection = 0;
    }

    changeState(newState) {
        this.activeState.exit();
        this.activeState = newState;
        this.activeState.enter();
    }

    update() {
        this.newState = this.activeState.update();
        if (this.newState) {
            this.changeState(this.newState);
        }
    }

    move(grid, baseTiles) {
        this.newState = this.activeState.move(grid, baseTiles, this);
        if (this.newState) {
            this.changeState(this.newState);
        }
    }

    draw(ctx, x, y) {
        ctx.lineWidth = 2;
        ctx.fillStyle = this.color;
        // ctx.globalAlpha = 0.1;
        ctx.fillRect(x, y, (config.tileSize / 4 - 10) / zoom, (config.tileSize / 4 - 10) / zoom);
        ctx.globalAlpha = 1.0;
    }
}

class Robot {
    constructor(parameters) {
        this.x = parameters.x ? parameters.x : 0;
        this.y = parameters.y ? parameters.y : 0;
        this.nextX = parameters.x ? parameters.x : 0;
        this.nextY = parameters.y ? parameters.y : 0;
        this.nextDistance = 0.0;
        this.offsetX = 0.0;
        this.offsetY = 0.0;
        this.speed = 0.01;
        this.color = parameters.color ? parameters.color : "white";
        this.currentDirection = 0;
    }

    getNextPosition(grid, baseTiles) {
        let x = this.x;
        let y = this.y;

        let width = Math.sqrt(grid.length);
        let i = x + y * width;
        let candidate = grid[i].candidates[0];
        let edges = baseTiles[candidate].edges;
        let directions = [];
        for (let id = 0; id < 4; id++) {
            if (edges[id] == 1 || edges[id] == 5) {
                directions.push(id);
            }
        }
        let r = Math.floor(Math.random() * directions.length);
        let newDirection = directions[r];
        if (directions.length == 0) {
            return;
        }
        while ((grid[i].neighbours[newDirection] == undefined) || ((((newDirection + 2) % 4) == this.currentDirection) && directions.length > 1)) {
            r = (r + 1) % directions.length;
            newDirection = directions[r];
        }
        this.currentDirection = newDirection;
        let nextID = grid[i].neighbours[newDirection];
        this.nextX = grid[nextID].x;
        this.nextY = grid[nextID].y;
    }

    move(grid, baseTiles) {
        this.nextDistance += this.speed;
        this.offsetX = this.x + ((this.nextX - this.x) * this.nextDistance);
        this.offsetY = this.y + ((this.nextY - this.y) * this.nextDistance);
        if (this.nextDistance > 1) {
            this.x = this.nextX;
            this.y = this.nextY;
            this.offsetX = this.nextX;
            this.offsetY = this.nextY;
            this.nextDistance = 0.0;
            this.getNextPosition(grid, baseTiles);
        }
    }

    draw(ctx, x, y) {
        ctx.lineWidth = 2;
        ctx.fillStyle = this.color;
        // ctx.globalAlpha = 0.1;
        ctx.fillRect(x, y, (config.tileSize / 4 - 10) / zoom, (config.tileSize / 4 - 10) / zoom);
        ctx.globalAlpha = 1.0;
    }
}

class GridTile {
    constructor(parameters) {
        this.x = parameters.x ? parameters.x : 0;
        this.y = parameters.y ? parameters.y : 0;
        this.candidates = parameters.candidates ? parameters.candidates : [];
        this.neighbours = parameters.neighbours ? parameters.neighbours : [];
        this.id = parameters.id ? parameters.id : 0;
    }

    getEntropy() {
        return this.candidates.length;
    }

    getbaseID() {
        if (this.candidates.length == 1) {
            return this.candidates[0];
        }
        return 0;
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
        const image = document.getElementById("tile" + (this.id + 1));
        ctx.drawImage(image, x, y, config.tileSize, config.tileSize)
    }

    generatePossibles(tiles) {
        tiles.forEach(candidate => {
            if (this.edges[EDGE_N] == candidate.edges[EDGE_S]) {
                this.possible[EDGE_N].push(candidate.id);
            }
            if (this.edges[EDGE_E] == candidate.edges[EDGE_W]) {
                this.possible[EDGE_E].push(candidate.id);
            }
            if (this.edges[EDGE_S] == candidate.edges[EDGE_N]) {
                this.possible[EDGE_S].push(candidate.id);
            }
            if (this.edges[EDGE_W] == candidate.edges[EDGE_E]) {
                this.possible[EDGE_W].push(candidate.id);
            }
        });
    }
}