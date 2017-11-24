(function () {

    var canvas = document.getElementById('starfield');
    var ctx = canvas.getContext('2d');

    var world = { w: 200, h : 200};
    var view = {x: 0, y : 0, r : Math.PI/4, xr : 1, yr: 1}

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
        
        for(var i = 0; i < xr; i++) {
            for(var j = 0; j < yr; j++) {
                ctx.save();

                ctx.translate((world.w * i),(world.h * j));

                entities.forEach(function (entity) {
                    ctx.save();
                    ctx.translate(entity.x, entity.y);
                    entity.draw(ctx);
                    ctx.restore();
                });

                ctx.restore();
            }
        }

    }

    function loop () {
        draw();
        return loop;
    }

    class Entity {
        constructor({x = 0, y = 0})
        {
            this.x = x;
            this.y = y;
        }

        draw(context) {

        }
    }

    class Player extends Entity {
        constructor(params = {})
        {
            super(params);
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
            super(params);
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

    entities.push(new Player({x : 99, y : 99}));
    entities.push(new Square());

    var startLoop = function(loop){
        window.setTimeout(startLoop, 40, loop);
        loop();
    };
    startLoop(loop);
}());