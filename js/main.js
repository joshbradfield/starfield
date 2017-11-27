(function () {

    var canvas = document.getElementById('starfield');
    var ctx = canvas.getContext('2d');

    var world = { w:500, h : 500};
    var view = {x: 0, y : 0, r : 0.5, xr : 0, yr: 0}

    window.view = view;
    window.canvas = canvas;

    var entities  = [];

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

            // apply forces
            var f = entity.sumForces();
            var t = entity.sumTorques();

            entity.ax = entity.m * f.x;
            entity.ay = entity.m * f.y;

            entity.at = entity.m * t;

            entity.vx += entity.ax * timeStep_s;
            entity.vy += entity.ay * timeStep_s;
            entity.vt += entity.at * timeStep_s;
            entity.x += entity.vx * timeStep_s;
            entity.y += entity.vy * timeStep_s;
            entity.t += entity.vt * timeStep_s;

            while(entity.x >= world.w) entity.x -= world.w;
            while(entity.x < 0) entity.x += world.w;
            while(entity.y >= world.h) entity.y -= world.h;
            while(entity.y < 0) entity.y += world.h;
            while(entity.t > Math.PI) entity -= Math.PI;
            while(entity.t <= -Math.PI) entity += Math.PI;
        });
    };

    
    function draw () {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.resetTransform();

        var x = view.x;
        var y = view.y;
        var Y = canvas.height;
        var X = canvas.width;
        var h = Math.sqrt((X*X) + (Y*Y));

        var y_min = Math.abs(h * Math.cos(view.r - Math.acos(Y/h)));
        var x_min = Math.abs(h * Math.cos(view.r - Math.acos(X/h)));
        var xr = Math.ceil(x_min / world.w);
        var yr = Math.ceil(y_min / world.h);

        x -= world.w - ((((xr * world.w) - world.w)/ 2) % (world.w));
        y -= world.h - ((((yr * world.h) - world.h)/ 2) % (world.h));

        var d_x = x - ((x >= 0) ? world.w : 0);
        var d_y = y - ((y >= 0) ? world.h : 0);

        
        ctx.translate(X/2, Y/2);
        ctx.fillRect(-X/2, 0, X, 1);
        ctx.fillRect(0, -Y/2, 1, Y);
        ctx.rotate(-view.r);
        ctx.fillRect(0, -Y/2, 1, Y);
        ctx.translate(-(xr * world.w)/2, -(yr * world.h)/2);
        ctx.translate(world.w/2 + d_x, world.h/2 + d_y);
        
        xr += (((world.w * xr) + d_x ) < x_min)? 1 : 0;
        yr += (((world.h * yr) + d_y ) < y_min)? 1 : 0;

        view.xr = xr;
        view.yr = yr;
        view.y_min = y_min;
        view.x_min = x_min;
        
        
        ctx.clearRect(0, 0, (world.w * xr), (world.h * yr));

        for(var i = 0; i < xr; i++) {
            for(var j = 0; j < yr; j++) {
                ctx.save();

                ctx.translate((world.w * i),(world.h * j));

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

    function loop (size) {
        step(size/4000);
        step(size/4000);
        step(size/4000);
        step(size/4000);
        draw();
    }

    class Entity {
        constructor({x = 0, y = 0, t = 0, vx = 0, vy=0, vt = 0,  m=0, ax = 0, ay=0, at = 0, forces = [], torques = []})
        {
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
            return () => {this.removeForce(force);}
        }

        removeForce(force) {
            _.remove(this.forces, f => f === force);
        }

        addTorque(torque) {
            this.torques.push(torque);
            return () => {this.removeTorque(torque);}
        }

        removeTorque(torque) {
            _.remove(this.torques, t=> t === torque);
        }

        sumForces() {
            var fx = 0;
            var fy = 0;
            this.forces.forEach(force => {
                var f = force(this);
                fx += f.x;
                fy += f.y;
            });

            return {x : fx, y : fy};
        }

        sumTorques() {
            var t = 0;
            this.torques.forEach(torque => t+= torque(this));
            return t;
        }

        draw(context) {

        }
    }

    class Player extends Entity {
        constructor(params = {})
        {
            super({m : 1, ...params});
        }

        draw(ctx) 
        {   
            ctx.beginPath();
            ctx.moveTo(0, -20);
            ctx.lineTo(-10, 10);
            ctx.lineTo(10, 10);
            ctx.closePath();
            ctx.fill();
        }
    }

    class Square extends Entity {
        constructor(params = {})
        {
            super({...params});
        }

        draw(ctx) 
        {
            ctx.beginPath();
            ctx.moveTo(-10,-10);
            ctx.lineTo(-10, 10);
            ctx.lineTo(10, 10);
            ctx.lineTo(10, -10);
            ctx.closePath();
            ctx.fill();
        }
    }

    var player = new Player({x : 250, y : 250, vy : -84});
    entities.push(player);
    entities.push(new Square());

    function addEventListener(name, func) {
        window.addEventListener(name, func);
        return () => removeEventListener(name, func);
    }

    function addOnetimeListener(name,func)
    {
        var rel;
        rel = addEventListener(name, (...args) => {func.apply(args); rel();});
    }

    player.addForce((p) => {
        var g = -1000000;
        f = {x: 0, y: 0};
        for(var i = -1 ; i <= 1; i ++)
        {
            var x = p.x - (0 + i * world.w);
            for(var j = -1 ; j <= 1; j ++)
            {
                var y = p.y - (0 + j * world.h);
                var r2 = (y*y) + (x*x);
                var r = Math.sqrt(r2);
                var ft = p.m * g / r2;
                f.x +=  ft * (x/r);
                f.y +=  ft * (y/r);
            }
        }
        return f;
    })

    addEventListener('keydown', (event) => {
        var f = -100;
        var t = 5;

        if (event.keyCode == 37) {
            var rf = player.addTorque((e) => {return t; });
            addOnetimeListener('keyup', () => {if(event.keyCode == 37) rf()});
        } else if (event.keyCode == 39) {
            var rf = player.addTorque((e) => {return -t});
            addOnetimeListener('keyup', () => {if(event.keyCode == 39) rf()});
        } else if (event.keyCode == 38) {
            var rf = player.addForce((e) => {return {x: f * Math.sin(e.t), y: f * Math.cos(e.t)}});
            addOnetimeListener('keyup', () => {if(event.keyCode == 38) rf()});
        } else if (event.keyCode == 40) {
            var rf = player.addForce((e) => {return {x: -f * Math.sin(e.t), y: -f * Math.cos(e.t)}});
            addOnetimeListener('keyup', () => {if(event.keyCode == 40) rf()});
        } 
    });


    var startLoop = function(loop){
        window.setTimeout(startLoop, 40, loop);
        loop(40);
    };
    startLoop(loop);
}());