(function () {

    var canvas = document.getElementById('starfield');
    var ctx = canvas.getContext('2d');
    var entities  = [];

    // resize the canvas to fill browser window dynamically
    window.addEventListener('resize', resizeCanvas, false);
    function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2);
            // Redraw all things
            entities.forEach(draw);
    }
    resizeCanvas();

    

    function draw (entity) {
        ctx.save();
        ctx.translate(entity.x, entity.y);
        entity.draw(ctx);
        ctx.restore();
    }

    function loop () {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        entities.forEach(draw);
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

    entities.push(new Player());

    var startLoop = function(loop){
        window.setTimeout(startLoop, 40, loop);
        loop();
    };
    startLoop(loop);
}());