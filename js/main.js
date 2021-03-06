(function () {

    var canvas = document.getElementById('starfield');
    var ctx = canvas.getContext('2d');

    var world = { w: 1000, h: 1000 };
    var view = { x: 0, y: 0, r: 0, xr: 0, yr: 0 }

    window.view = view;
    window.canvas = canvas;

    var entities = [];

    // resize the canvas to fill browser window dynamically
    window.addEventListener('resize', resizeCanvas, false);
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Redraw all things
        draw();
    }
    resizeCanvas();

    function step(timeStep_s) {
        entities.forEach(entity => {

            // sum forces and torques
            var f = entity.sumForces();
            var t = entity.sumTorques();
            
            // Force -> New Acceleration  
            entity.ax = entity.m * f.x;
            entity.ay = entity.m * f.y;
            // Torque -> Rotational Acceleration
            entity.at = entity.m * t;

           // Intergrate Acceleration -> New Velocity
            entity.vx += entity.ax * timeStep_s;
            entity.vy += entity.ay * timeStep_s;
            entity.vt += entity.at * timeStep_s;

            // Intergrate Velocity -> New Positions
            entity.x += entity.vx * timeStep_s;
            entity.y += entity.vy * timeStep_s;
            entity.t += entity.vt * timeStep_s;


            while (entity.x >= world.w) entity.x -= world.w;
            while (entity.x < 0) entity.x += world.w;
            while (entity.y >= world.h) entity.y -= world.h;
            while (entity.y < 0) entity.y += world.h;
            while (entity.t > Math.PI) entity -= Math.PI;
            while (entity.t <= -Math.PI) entity += Math.PI;
        });
    };


    function draw() {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.resetTransform();

        var x = view.x;
        var y = view.y;
        var Y = canvas.height;
        var X = canvas.width;
        var h = Math.sqrt((X * X) + (Y * Y));

        var y_min = Math.abs(h * Math.cos(view.r - Math.acos(Y / h)));
        var x_min = Math.abs(h * Math.cos(view.r - Math.acos(X / h)));
        var xr = Math.ceil(x_min / world.w);
        var yr = Math.ceil(y_min / world.h);

        x -= world.w - ((((xr * world.w) - world.w) / 2) % (world.w));
        y -= world.h - ((((yr * world.h) - world.h) / 2) % (world.h));

        var d_x = x - ((x >= 0) ? world.w : 0);
        var d_y = y - ((y >= 0) ? world.h : 0);


        ctx.translate(X / 2, Y / 2);
        ctx.fillRect(-X / 2, 0, X, 1);
        ctx.fillRect(0, -Y / 2, 1, Y);
        ctx.rotate(-view.r);
        ctx.fillRect(0, -Y / 2, 1, Y);
        ctx.translate(-(xr * world.w) / 2, -(yr * world.h) / 2);
        ctx.translate(world.w / 2 + d_x, world.h / 2 + d_y);

        xr += (((world.w * xr) + d_x) < x_min) ? 1 : 0;
        yr += (((world.h * yr) + d_y) < y_min) ? 1 : 0;

        view.xr = xr;
        view.yr = yr;
        view.y_min = y_min;
        view.x_min = x_min;


        ctx.clearRect(0, 0, (world.w * xr), (world.h * yr));

        for (var i = 0; i < xr; i++) {
            for (var j = 0; j < yr; j++) {
                ctx.save();

                ctx.translate((world.w * i), (world.h * j));

                entities.forEach(function (entity) {
                    ctx.save();
                    ctx.translate(entity.x, entity.y);
                    ctx.rotate(-entity.t);
                    entity.draw(ctx);
                    ctx.restore();
                });

                ctx.restore();
            }
        }

    }

    function loop(size) {
        step(size / 4000);
        step(size / 4000);
        step(size / 4000);
        step(size / 4000);
        draw();
    }

    class Entity {
        constructor({ x = 0, y = 0, t = 0, vx = 0, vy = 0, vt = 0, m = 0, ax = 0, ay = 0, at = 0, forces = [], torques = [] }) {
            this.x = x;
            this.y = y;
            this.t = t;
            this.vx = vx;
            this.vy = vy;
            this.vt = vt;
            this.ax = ax;
            this.ay = ay;
            this.at = at;
            this.m = m;
            this.forces = forces;
            this.torques = torques;
        }

        addForce(force) {
            this.forces.push(force);
            return () => { this.removeForce(force); }
        }

        removeForce(force) {
            _.remove(this.forces, f => f === force);
        }

        addTorque(torque) {
            this.torques.push(torque);
            return () => { this.removeTorque(torque); }
        }

        removeTorque(torque) {
            _.remove(this.torques, t => t === torque);
        }

        sumForces() {
            var fx = 0;
            var fy = 0;
            this.forces.forEach(force => {
                var f = force(this);
                fx += f.x;
                fy += f.y;
            });

            return { x: fx, y: fy };
        }

        sumTorques() {
            var t = 0;
            this.torques.forEach(torque => t += torque(this));
            return t;
        }

        draw(context) {

        }
    }

    class Player extends Entity {
        constructor(params = {}) {
            super({ m: 1, ...params });
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.moveTo(0, -20);
            ctx.lineTo(-10, 10);
            ctx.lineTo(10, 10);
            ctx.closePath();
            ctx.fill();
        }
    }

    class Square extends Entity {
        constructor(params = {}) {
            super({ ...params });
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.moveTo(-10, -10);
            ctx.lineTo(-10, 10);
            ctx.lineTo(10, 10);
            ctx.lineTo(10, -10);
            ctx.closePath();
            ctx.fill();
        }
    }

    function calcForceDueToGravity(source, g, object) {
        var d = { x: object.x - source.x, y: object.y - source.y };

        var inv = function (distance, world) {
            if (distance < 0)
                return world + distance;
            return distance - world;
        }

        var f = { x: 0, y: 0 };

        var calcForceDueToGravity = function (x, y, g) {
            var r2 = (y * y) + (x * x);
            var r = Math.sqrt(r2);
            var ft = - object.m * g / r2;
            f.x += ft * (x / r);
            f.y += ft * (y / r);
        }

        calcForceDueToGravity(d.x, d.y, g);
        if ((d.x != 0)) calcForceDueToGravity(inv(d.x, world.w), d.y, g);
        if ((d.y != 0)) calcForceDueToGravity(d.x, inv(d.y, world.h), g);
        if ((d.x != 0) && (d.y != 0)) calcForceDueToGravity(inv(d.x, world.w), inv(d.y, world.h), g);

        return f;
    }


    var player = new Player({ x: 250, y: -100 });
    entities.push(player);
    var square1 = new Square({x: -250});
    entities.push(square1);
    var square2 = new Square({x : 0, y : -250});
    entities.push(square2);

    function addEventListener(name, func) {
        window.addEventListener(name, func);
        return () => removeEventListener(name, func);
    }

    function addOnetimeListener(name, func) {
        var rel;
        rel = addEventListener(name, (...args) => { func.apply(args); rel(); });
    }


    player.addForce((p) => {
        return calcForceDueToGravity(square1, 1000000, p);
    })
    
    player.addForce((p) => {
        return calcForceDueToGravity(square2, 1000000, p);
    })



    addEventListener('keydown', (event) => {
        var f = -100;
        var t = 5;

        if (event.keyCode == 37) {
            var rf = player.addTorque((e) => { return t; });
            addOnetimeListener('keyup', () => { if (event.keyCode == 37) rf() });
        } else if (event.keyCode == 39) {
            var rf = player.addTorque((e) => { return -t });
            addOnetimeListener('keyup', () => { if (event.keyCode == 39) rf() });
        } else if (event.keyCode == 38) {
            var rf = player.addForce((e) => { return { x: f * Math.sin(e.t), y: f * Math.cos(e.t) } });
            addOnetimeListener('keyup', () => { if (event.keyCode == 38) rf() });
        } else if (event.keyCode == 40) {
            var rf = player.addForce((e) => { return { x: -f * Math.sin(e.t), y: -f * Math.cos(e.t) } });
            addOnetimeListener('keyup', () => { if (event.keyCode == 40) rf() });
        } else if (event.keyCode == 32) {
            player.at=0;
            player.vt=0;
        }
    });


    var startLoop = function (loop) {
        window.setTimeout(startLoop, 40, loop);
        loop(40);
    };
    startLoop(loop);
}());