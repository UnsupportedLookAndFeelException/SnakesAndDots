var canvas = document.getElementById("canvas");
canvas.oncontextmenu = function() {
    return false;
}
// Set up touch events for mobile, etc
var isMousePressed = false, isMouseClicked = false;
var mousePos = {
    x: 0,
    y: 0
};
canvas.addEventListener("mousedown", function(e) {
    isMousePressed = true;
}, false);
canvas.addEventListener("mouseup", function(e) {
    isMousePressed = false;
    isMouseClicked = true;
}, false);
canvas.addEventListener("touchstart", function(e) {
    isMousePressed = true;
}, false);
canvas.addEventListener("touchend", function(e) {
    mousePos = getTouchPos(canvas, e);
    isMousePressed = false;
    isMouseClicked = true;
}, false);
var rect = canvasDom.getBoundingClientRect();
function getTouchPos(canvasDom, touchEvent) {
  return {
    x: touchEvent.touches[0].clientX - rect.left,
    y: touchEvent.touches[0].clientY - rect.top
  };
}
// Prevent scrolling when touching the canvas
document.body.addEventListener("touchstart", function(e) {
    if (e.target == canvas) {
        e.preventDefault();
    }
}, false);
document.body.addEventListener("touchend", function(e) {
    if (e.target == canvas) {
        e.preventDefault();
    }
}, false);
document.body.addEventListener("touchmove", function(e) {
    if (e.target == canvas) {
        e.preventDefault();
    }
}, false);



var processing = new Processing(canvas, function(processing) {
    //processing.size(800,400); // minX = 200   minY = 300 iphone=(1920/3, 1080/3)
    processing.size(window.innerWidth, window.innerHeight);
    processing.background(0xFFF);

    var mouseIsPressed = false;
    mouseIsPressed = isMousePressed;

    var keyIsPressed = false;
    processing.keyPressed = function() {
        keyIsPressed = true;
    };
    processing.keyReleased = function() {
        keyIsPressed = false;
    };

    function getImage(s) {
        var url = "https://www.kasandbox.org/programming-images/" + s + ".png";
        processing.externals.sketch.imageCache.add(url);
        return processing.loadImage(url);
    }

    // use degrees rather than radians in rotate function
    var rotateFn = processing.rotate;
    var sin = processing.sin;
    var cos = processing.cos;
    var arcFn = processing.arc;
    processing.rotate = function(angle) {
        rotateFn(processing.radians(angle));
    };
    processing.sin = function(angle) {
        return Math.sin(processing.radians(angle));
    };
    processing.cos = function(angle) {
        return Math.cos(processing.radians(angle));
    };
    processing.arc = function(x, y, w, h, a1, a2) {
        arcFn(x, y, w, h, processing.radians(a1), processing.radians(a2));
    };

    with(processing) {
        /**
             * BLUR:      11,
                GRAY:      12,
                INVERT:    13,
                OPAQUE:    14,
                POSTERIZE: 15,
                THRESHOLD: 16,
                ERODE:     17,
                DILATE:    18,
                
                TODO Fade Anim for Power Ups
                TODO Help page
            **/
        // 64 sec. ,96 sec.
        disableContextMenu();
        frameRate(60);
        var page = 0;
        textAlign(CENTER, CENTER);
        textFont(createFont("Century Gothic Bold"));
        var mouse = {
                over: function(x, y, w, h) {
                    return mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
                }
            };
        var BLACK = color(30, 55, 70),
            RED = color(240, 95, 80),
            BLUE = color(100, 215, 215);
        var WR = 236;
        var PR = 0;
        var POWERUP_SPAWN_CHANCE = 60;
        var transition = {
            c: 0,
            toC: 0,
            to: 0
        };
        var longestSide = (width > height ? width : height);
        var secondTime = false;
        var fR = 0;
        var imgCount = 0;
        var blueDot;
        var redDot;
        var powerHex;
        var stripes;
        var pY = 0;
        var pA = 0;
        var lineL = [],
            lineL2 = [];
        var obstacles = [];
        var seconds = 0;
        var toast = "CLICK AND HOLD TO SEPERATE\nCATCH THE BLUE. AVOID THE RED.";
        var toastF = 255;
        var toastToF = 255;
        var toastToT = 5;
        var recordTxtF = 0;
        var recordTxt = true;
        var gameOver = false;
        var endTimer = 0;
        var POWERUPS = ["Nothing", "Magnet", "Safety Net", "Invincibility", "Booster", "Shield", "Spike"];
        var poly = function(x, y, sides, radius, rot) {
            beginShape();
            var degreesPerSide = 360 / sides;
            for (var i = 1; i <= sides; i++) {
                vertex(x + cos(degreesPerSide * i + rot) * radius, y + sin(degreesPerSide * i + rot) * radius);
            }
            endShape(CLOSE);
        };
        var powerUp = {
            up: 0,
            down: 0
        };
        var powerUpTimer = {
            up: 0,
            down: 0
        };
        var counter = {
            up: 0,
            down: 0
        };
        var counterTo = {
            up: 0,
            down: 0
        };
        var net = {
            up: 0 - height / 2,
            down: height
        };
        var netTo = {
            up: -height / 2,
            down: height
        };
        var spike = {
            up: false,
            down: false
        };
        var scaleFactor = sqrt(sq(width) + sq(height)) / sqrt(sq(width * 400 / height) + sq(height * 400 / width));
        var powerUpAnim = {
            up: 0,
            down: 0
        };
        var powerUpAnimTo = {
            up: 0,
            down: 0
        };
        var helpFade = 255;
        var pagerPos = 0;
        var pagerPages = [{
            img: redDot,
            title: "Red Dots",
            text: "Must be avoided as\nthey can cause an\ninstant death to\nboth snakes"
        }, {
            img: blueDot,
            title: "Blue Dots",
            text: "Must be caught before\nthey exit across the\nleft side of the screen"
        }, {
            img: blueDot,
            title: "Powerups",
            text: "Look like blue hexagons but\ndon't have to be caught.\nThe following are a list\nof various powerups."
        }, {
            img: powerHex,
            title: "Magnet",
            text: "Catches blue dots farther\naway from the snake"
        },/* {
            img: powerHex,
            title: "Safety Net",
            text: "Catches blue dots before\nthey exit across the\nleft side of the screen"
        }, {
            img: powerHex,
            title: "Invincibility",
            text: "Protects the snake from\nall red dots"
        }, {
            img: powerHex,
            title: "Booster",
            text: "Increases the\nsnake's speed"
        },*/ {
            img: powerHex,
            title: "Shield",
            text: "Protects the front of\nthe snake's head"
        }, {
            img: powerHex,
            title: "Spike",
            text: "Protects the snake against\none red dot before\ndisintegrating"
        }];
        var scoreS = 40;
        var scoreSTo = 40;
        var lives = [{s:30*scaleFactor,f:255,alive:true},{s:30*scaleFactor,f:255,alive:true},{s:30*scaleFactor,f:255,alive:true},{s:30*scaleFactor,f:255,alive:true},{s:30*scaleFactor,f:255,alive:true}];
        var dotSpaceLen = 140;
        var load = function() {
            var scaleFac = scaleFactor;
            background(0, 0, 0, 0);
            switch (imgCount) {
                case 0:
                    for (var i = 0; i < 50; i++) {
                        lineL.push(0);
                    }
                    for (var i = 0; i < 50; i++) {
                        lineL2.push(0);
                    }
                    break;
                case 1:
                    strokeWeight(5 * scaleFac);
                    stroke(BLACK);
                    fill(BLUE);
                    ellipse(35 * scaleFac / 2, 35 * scaleFac / 2, 30 * scaleFac, 30 * scaleFac);
                    fill(BLACK);
                    ellipse(35 * scaleFac / 2, 35 * scaleFac / 2, 10 * scaleFac, 10 * scaleFac);
                    noStroke();
                    blueDot = get(0, 0, 35 * scaleFac, 35 * scaleFac);
                    break;
                case 2:
                    strokeWeight(5 * scaleFac);
                    stroke(BLACK);
                    fill(RED);
                    ellipse(35 * scaleFac / 2, 35 * scaleFac / 2, 30 * scaleFac, 30 * scaleFac);
                    fill(BLACK);
                    ellipse(35 * scaleFac / 2, 35 * scaleFac / 2, 10 * scaleFac, 10 * scaleFac);
                    noStroke();
                    redDot = get(0, 0, 35 * scaleFac, 35 * scaleFac);
                    break;
                case 3:
                    strokeWeight(10 * scaleFac);
                    stroke(0, 0, 0, 20);
                    for (var i = 0; i < width + height; i += 20 * scaleFac) {
                        line(i, 0, 0, i);
                    }
                    stripes = get(0, 0, width + height, height);
                    break;
                case 4:
                    strokeWeight(5 * scaleFac);
                    stroke(BLACK);
                    fill(BLUE);
                    poly(43 * scaleFac / 2, 43 * scaleFac / 2, 6, 19 * scaleFac, 0);
                    //ellipse(43*scaleFac/2,43*scaleFac/2,38*scaleFac,38*scaleFac);
                    fill(BLACK);
                    poly(43 * scaleFac / 2, 43 * scaleFac / 2, 6, 7 * scaleFac, 0);
                    //ellipse(43*scaleFac/2,43*scaleFac/2,10*scaleFac,10*scaleFac);
                    noStroke();
                    powerHex = get(0, 0, 43 * scaleFac, 43 * scaleFac);
                    break;
                case 5:
                    /*fill(255, 225, 100);
                    var lFactor = 5.4 * scaleFac;
                    rect(0, 0, width, height);
                    pushStyle();
                    image(stripes, 0, 0);
                    stroke(BLACK);
                    strokeWeight(15 * lFactor);
                    //line(35*lFactor/2,35*lFactor/2,width-35*lFactor/2,height-35*lFactor/2);
                    line(35 * lFactor / 2, height - 35 * lFactor / 2, width - 35 * lFactor / 2, 35 * lFactor / 2);
                    strokeWeight(5 * lFactor);
                    stroke(BLACK);
                    //line(width,0,0,height);
                    fill(RED);
                    ellipse(35 * lFactor / 2, 35 * lFactor / 2, 30 * lFactor, 30 * lFactor);
                    fill(BLACK);
                    ellipse(35 * lFactor / 2, 35 * lFactor / 2, 10 * lFactor, 10 * lFactor);
                    noStroke();
                    strokeWeight(5 * lFactor);
                    stroke(BLACK);
                    //line(width,0,0,height);
                    fill(BLUE);
                    ellipse(width - 35 * lFactor / 2, height - 35 * lFactor / 2, 30 * lFactor, 30 * lFactor);
                    fill(BLACK);
                    ellipse(width - 35 * lFactor / 2, height - 35 * lFactor / 2, 10 * lFactor, 10 * lFactor);
                    noStroke();
                    fill(30, 55, 70);
                    noStroke();
                    ellipse(width - 35 * lFactor / 2, 35 * lFactor / 2, 35 * lFactor, 35 * lFactor);
                    ellipse(35 * lFactor / 2, height - 35 * lFactor / 2, 35 * lFactor, 35 * lFactor);
                    fill(255, 255, 255, 25);
                    ellipse(width - 35 * lFactor / 2, 35 * lFactor / 2, 25 * lFactor, 25 * lFactor);
                    ellipse(35 * lFactor / 2, height - 35 * lFactor / 2, 25 * lFactor, 25 * lFactor);
                    ellipse(width - 35 * lFactor / 2, 35 * lFactor / 2, 15 * lFactor, 15 * lFactor);
                    ellipse(35 * lFactor / 2, height - 35 * lFactor / 2, 15 * lFactor, 15 * lFactor);
                    popStyle();*/
                    page = 1;
                    break;
            }
            if (imgCount < 5) {
                imgCount++;
                background(255, 255, 255);
            }
        };
        var pattern = function(y) {
            var scaleFac = scaleFactor;
            strokeWeight(8 * scaleFac);
            strokeCap(PROJECT);
            for (var i = 0; i < width; i += 40 * scaleFac) { // y = 350
                stroke(30, 55, 70);
                line(i, y, i + 20 * scaleFac, y + 20 * scaleFac);
                line(i + 20 * scaleFac, y + 20 * scaleFac, i + 40 * scaleFac, y);
                line(i, y - 20 * scaleFac, i + 20 * scaleFac, y);
                line(i + 20 * scaleFac, y, i + 40 * scaleFac, y - 20 * scaleFac);
                stroke(100, 215, 215);
                line(i, y - 10 * scaleFac, i + 20 * scaleFac, y + 10 * scaleFac);
                stroke(240, 95, 80);
                line(i + 20 * scaleFac, y + 10 * scaleFac, i + 40 * scaleFac, y - 10 * scaleFac);
            }
        };
        var home = function() {
            var scaleFac = scaleFactor;
            background(255, 225, 100);
            /*
            strokeWeight(10);
            stroke(0,0,0,20);
            for(var i = 0; i < 800; i+=20) {
                line(i+fR/6%20,0,0,i+fR/6%20);
            }
            strokeWeight(8);
            strokeCap(PROJECT);
            for(var i = 0; i < 400; i+=40) {
                stroke(30,55,70);
                line(i,350,i+20,370);
                line(i+20,370,i+40,350);
                line(i,330,i+20,350);
                line(i+20,350,i+40,330);
                stroke(100,215,215);
                line(i,330+10,i+20,350+10);
                stroke(240,95,80);
                line(i+20,350+10,i+40,330+10);
            }
            fill(30,55,70);
            noStroke();
            //println(mouseX+","+mouseY);
            textSize(155);
            var shift=-0;
            //text("FACTORY",width/2-shift,);
            text("D",width/2-115+shift,170);
            text("U",width/2-10+shift,170);
            text("O",width/2+105+shift,170);
            */
            strokeWeight(10 * scaleFac);
            stroke(0, 0, 0, 20);
            for (var i = 0; i < longestSide * 2; i += 20 * scaleFac) {
                line(i + fR / 6 % 20, 0, 0, i + fR / 6 % 20);
            }
            resetMatrix();
            //translate(0,-20);
            pattern(height / 2 + 55 * scaleFac);
            fill(30, 55, 70);
            noStroke();
            //println(mouseX+","+mouseY);
            textSize(125 * scaleFac);
            var shift = -0;
            //text("FACTORY",width/2-shift,150);
            text("S", width / 2 - 185 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("N", width / 2 - 115 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("A", width / 2 - 30 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("K", width / 2 + 50 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("E", width / 2 + 120 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("S", width / 2 + 185 * scaleFac + shift, height / 2 - 90 * scaleFac);
            textSize(50 * scaleFac);
            text("& D O T S", width / 2, height / 2 - 10 * scaleFac);
            pushStyle();
            rectMode(CENTER);
            rect(width / 2, height / 2 + 130 * scaleFac, 210 * scaleFac, 50 * scaleFac, 5 * scaleFac);
            popStyle();
            textSize(137 * scaleFac);
            fill(0, 0, 0, 100);
            text("S", width / 2 - 185 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("N", width / 2 - 115 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("A", width / 2 - 30 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("K", width / 2 + 50 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("E", width / 2 + 120 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("S", width / 2 + 185 * scaleFac + shift, height / 2 - 90 * scaleFac);
            textSize(52 * scaleFac);
            text("& D O T S", width / 2, height / 2 - 10 * scaleFac);
            pushStyle();
            rectMode(CENTER);
            rect(width / 2, height / 2 + 130 * scaleFac, 215 * scaleFac, 55 * scaleFac, 5 * scaleFac);
            popStyle();
            fill(255, 225, 100);
            textSize(30 * scaleFac);
            text("TAP TO PLAY", width / 2, height / 2 + 130 * scaleFac);
            //ellipse(width/2+105+shift,173,20,20);
            stroke(30, 55, 70);
            strokeWeight(10 * scaleFac);
            noFill();
            //ellipse(width/2+105+shift,173,45+sin(fR*3)*10,45+sin(fR*3)*10);
            textSize(40);
            //text("O",width/2+45.5+shift,150);
            pushStyle();
            var t = transition;
            if (mouse.clicked) {
                t.to = 2;
                t.toC = width + height + 20;
            }
        };
        var help = function() {
            var scaleFac = scaleFactor;
            //background(255,225,100);
            helpFade += (0 - helpFade) / 60;
            background(BLACK);
            var t = transition;
            if (mouse.over(width / 2 + 340 * scaleFac / 2, height / 2 - 20 * scaleFac, 30 * scaleFac, 40 * scaleFac)) {
                cursor(HAND);
                if (mouse.clicked) {
                    if (pagerPos + 1 === pagerPages.length) {
                        pagerPos = 0;
                    } else {
                        pagerPos++;
                    }
                }
            } else if (mouse.over(width / 2 - 400 * scaleFac / 2, height / 2 - 20 * scaleFac, 30 * scaleFac, 40 * scaleFac)) {
                cursor(HAND);
                if (mouse.clicked) {
                    if (pagerPos - 1 === -1) {
                        pagerPos = pagerPages.length - 1;
                    } else {
                        pagerPos--;
                    }
                }
            } else if (mouse.clicked) {
                t.to = 3;
                t.toC = width + height + 20;
            }
            pushStyle();
            stroke(255);
            line(width / 2 + 360 * scaleFac / 2, height / 2 - 10 * scaleFac, width / 2 + 380 * scaleFac / 2, height / 2);
            line(width / 2 + 380 * scaleFac / 2, height / 2, width / 2 + 360 * scaleFac / 2, height / 2 + 10 * scaleFac);
            line(width / 2 - 360 * scaleFac / 2, height / 2 - 10 * scaleFac, width / 2 - 380 * scaleFac / 2, height / 2);
            line(width / 2 - 380 * scaleFac / 2, height / 2, width / 2 - 360 * scaleFac / 2, height / 2 + 10 * scaleFac);
            rectMode(CENTER);
            rect(width / 2, height / 2, 300 * scaleFac, 200 * scaleFac);
            popStyle();
            var pagerSlide = pagerPages[pagerPos];
            fill(255);
            textSize(40 * scaleFac);
            text(pagerSlide.title, width / 2, height / 2 - 60 * scaleFac);
            textSize(20 * scaleFac);
            text(pagerSlide.text, width / 2, height / 2 + 20 * scaleFac);
            text("TAP TO CONTINUE", width / 2, height - 40 * scaleFac);
            text("INSTRUCTIONS " + (pagerPos + 1) + "/" + pagerPages.length, width / 2, 40 * scaleFac);
            fill(35, 55, 70, helpFade);
            rect(0, 0, width, height);
        };
        var randomDot = function() {
          var scaleFac=scaleFactor;
          var xy = random(35 * scaleFac, height - 35 * scaleFac);
          if(round(random(1, 2)) === 1) {
            xy2 = random(35 * scaleFac / 2, xy - 35 * scaleFac);
          } else {
            xy2 = random(xy + 35 * scaleFac, height - 35 * scaleFac / 2);
          }
          var xtype = round(random(1, 4));
          if(xtype===1) {
            xtype2=2;
          } else {
            xtype2=1;
          }
          return {y:xy,y2:xy2,type:xtype,type2:xtype2};
        };
        var game = function() {
            var scaleFac = scaleFactor;
            background(255, 225, 100);
            var livesLen = lives.length;
            var fixture = {
                up: "nothing",
                down: "nothing"
            };
            powerUpAnim.up += (powerUpAnimTo.up - powerUpAnim.up) / 8;
            powerUpAnim.down += (powerUpAnimTo.down - powerUpAnim.down) / 8;
            var t = transition,
                powerUpSpawned = false; // true when a power up is on screen
            fill(30, 55, 70, 210);
            rect(0, 0, counter.up, height / 40);
            rect(0, height - height / 40, counter.down, height / 40);
            counter.up += (counterTo.up - counter.up) / (5);
            counter.down += (counterTo.down - counter.down) / (5);
            if (powerUp.up > 0) {
                fixture.up = POWERUPS[powerUp.up];
                //fixture.up=3;
            }
            if (powerUp.down > 0) {
                fixture.down = POWERUPS[powerUp.down];
                //fixture.down=3;
            }
            strokeWeight(13 * scaleFac);
            stroke(0, 0, 0, 20);
            image(stripes, -(fR * 3 * scaleFac) % (20 * scaleFac), 0, width + height + 30 * scaleFac, height);
            stroke(30, 55, 70);
            strokeWeight(15 * scaleFac);
            strokeCap(ROUND);
            var snakeSmoothness = (150 * scaleFac) / 50;
            for (var i = 0, lLen = 50; i < lLen; i ++) {
                if (i < 47) {
                    bezier(i * snakeSmoothness, height / 2 + lineL[i], (i * snakeSmoothness) + snakeSmoothness, height / 2 + lineL[i + 1], i * snakeSmoothness, height / 2 + lineL[i + 2], (i * snakeSmoothness) + snakeSmoothness, height / 2 + lineL[i + 3]);
                    bezier(i * snakeSmoothness, height / 2 + lineL2[i], (i * snakeSmoothness) + snakeSmoothness, height / 2 + lineL2[i + 1], i * snakeSmoothness, height / 2 + lineL2[i + 2], (i * snakeSmoothness) + snakeSmoothness, height / 2 + lineL2[i + 3]);
                }
                if (i >= 1 && !gameOver) {
                    var val = lineL[i];
                    lineL[i - 1] = val;
                    val = lineL2[i];
                    lineL2[i - 1] = val;
                }
            }
            lineL2[49] = -pY;
            lineL[49] = pY;
            fill(30, 55, 70);
            noStroke();
            var headX = 150*scaleFac;
            ellipse(headX, height / 2 + pY, 35 * scaleFac, 35 * scaleFac);
            ellipse(headX, height / 2 - pY, 35 * scaleFac, 35 * scaleFac);
            fill(255, 255, 255, 25);
            ellipse(headX, height / 2 + pY, 25 * scaleFac, 25 * scaleFac);
            ellipse(headX, height / 2 - pY, 25 * scaleFac, 25 * scaleFac);
            ellipse(headX, height / 2 + pY, 15 * scaleFac, 15 * scaleFac);
            ellipse(headX, height / 2 - pY, 15 * scaleFac, 15 * scaleFac);
            // Draw Powerups
            if (fixture.up === "Booster" || fixture.down === "Booster") {
                fill(0, 0, 0, 50);
                var aksldkfja = sin(fR * 30) * 10;
                ellipse(150 * scaleFac, height / 2 - pY, (45 + aksldkfja) * scaleFac * powerUpAnim.up, (45 + aksldkfja) * scaleFac * powerUpAnim.up);
                ellipse(150 * scaleFac, height / 2 + pY, (45 + aksldkfja) * scaleFac * powerUpAnim.down, (45 + aksldkfja) * scaleFac * powerUpAnim.down);
            }
            switch (fixture.up) {
                case "Magnet":
                    fill(0, 0, 0, 40);
                    ellipse(150 * scaleFac, height / 2 - pY, 70 * scaleFac * powerUpAnim.up, 70 * scaleFac * powerUpAnim.up);
                    break;
                case "Shield":
                    strokeCap(SQUARE);
                    stroke(BLACK);
                    noFill();
                    strokeWeight(5 * scaleFac);
                    for (var i = -90; i < 90; i += 40) {
                        arc(150 * scaleFac, height / 2 - pY, 55 * scaleFac * powerUpAnim.up, 55 * scaleFac * powerUpAnim.up, i, i + 30);
                    }
                    break;
                case "Invincibility":
                    strokeCap(SQUARE);
                    stroke(BLACK);
                    noFill();
                    strokeWeight(5 * scaleFac);
                    for (var i = -90; i < 270; i += 40) {
                        arc(150 * scaleFac, height / 2 - pY, 55 * scaleFac * powerUpAnim.up, 55 * scaleFac * powerUpAnim.up, i + fR, i + 30 + fR);
                    }
                    break;
                case "Safety Net":
                    if (powerUpTimer.up > 0) {
                        netTo.up = 0;
                    }
                    break;
                case "Spike":
                    if (spike.up) {
                        fill(BLACK);
                        for (var i = 0; i < 360; i += 30) {
                            poly(150 * scaleFac + cos(i + fR) * 35 * scaleFac / 2, height / 2 - pY + sin(i + fR) * 35 * scaleFac / 2, 3, 6 * scaleFac * powerUpAnim.up, i + fR);
                        }
                    }
                    break;
            }
            switch (fixture.down) {
                case "Magnet":
                    fill(0, 0, 0, 40);
                    ellipse(150 * scaleFac, height / 2 + pY, 70 * scaleFac * powerUpAnim.down, 70 * scaleFac * powerUpAnim.down);
                    break;
                case "Shield":
                    strokeCap(SQUARE);
                    stroke(BLACK);
                    noFill();
                    strokeWeight(5 * scaleFac);
                    for (var i = -90; i < 90; i += 40) {
                        arc(150 * scaleFac, height / 2 + pY, 55 * scaleFac * powerUpAnim.down, 55 * scaleFac * powerUpAnim.down, i, i + 30);
                    }
                    break;
                case "Invincibility":
                    strokeCap(SQUARE);
                    stroke(BLACK);
                    noFill();
                    strokeWeight(5 * scaleFac);
                    for (var i = -90; i < 270; i += 40) {
                        arc(150 * scaleFac, height / 2 + pY, 55 * scaleFac * powerUpAnim.down, 55 * scaleFac * powerUpAnim.down, i + fR, i + 30 + fR);
                    }
                    break;
                case "Safety Net":
                    if (powerUpTimer.down > 0) {
                        netTo.down = height / 2;
                    }
                    break;
                case "Spike":
                    if (spike.down) {
                        fill(BLACK);
                        for (var i = 0; i < 360; i += 30) {
                            poly(150 * scaleFac + cos(i + fR) * 35 * scaleFac / 2, height / 2 + pY + sin(i + fR) * 35 * scaleFac / 2, 3, 6 * scaleFac * powerUpAnim.down, i + fR);
                        }
                    }
                    break;
            }
            // Draw dots To be Optimized
            for (var i = 0, oLen = obstacles.length; i < oLen; i++) {
                var o = obstacles[i];
                if (o.t === 1) {
                    image(blueDot, o.x - 35 * scaleFac / 2, o.y - 35 * scaleFac / 2);
                } else if (o.t <= 4) {
                    image(redDot, o.x - 35 * scaleFac / 2, o.y - 35 * scaleFac / 2);
                } else {
                    powerUpSpawned = true;
                    pushMatrix();
                    translate(o.x, o.y);
                    rotate(-fR);
                    image(powerHex, -43 * scaleFac / 2, -43 * scaleFac / 2);
                    popMatrix();
                }
                noStroke();
                if (!gameOver) {
                    o.x -= 3 * scaleFac;
                }
                var span1 = 35 * scaleFac,
                    span2 = 35 * scaleFac;
                if (o.t === 1) {
                    if (o.x < 150 * scaleFac) {
                        fill(255, 225, 100, sin(fR * 20) * 100 + 50);
                        ellipse(o.x, o.y, 35 * scaleFac, 35 * scaleFac);
                    }
                    if (fixture.up === "Spike") {
                        span1 = 41 * scaleFac;
                    }
                    if (fixture.down === "Spike") {
                        span2 = 41 * scaleFac;
                    }
                    if (fixture.up === "Magnet") {
                        span1 = 70 * scaleFac;
                    } else if (fixture.up === "Shield" || fixture.up === "Invincibility") {
                        span1 = 55 * scaleFac;
                    }
                    if (fixture.down === "Magnet") {
                        span2 = 70 * scaleFac;
                    } else if (fixture.down === "Shield" || fixture.down === "Invincibility") {
                        span2 = 55 * scaleFac;
                    }
                }
                if (o.x<200*scaleFac&&dist(o.x, o.y, 150 * scaleFac, height / 2 + pY) <= span2 || dist(o.x, o.y, 150 * scaleFac, height / 2 - pY) <= span1) {
                    if (o.t > 4) {
                        o.j = true;
                        if (toastToF === 0) {
                            toastToF = 255;
                            toast = "Power up collected : " + POWERUPS[o.t - 4];
                            toastToT = 3;
                        }
                        if (o.y < height / 2) {
                            powerUp.up = o.t - 4;
                            powerUpTimer.up = 5;
                            counterTo.up = width;
                            powerUpAnimTo.up = 1;
                        } else {
                            powerUpTimer.down = 5;
                            powerUp.down = o.t - 4;
                            counterTo.down = width;
                            powerUpAnimTo.down = 1;
                        }
                        if (POWERUPS[o.t - 4] === "Spike") {
                            if (o.y < height / 2) {
                                spike.up = true;
                            } else {
                                spike.down = true;
                            }
                        }
                    } else if (o.t !== 1) {
                        if (o.y < height / 2) {
                            if ((fixture.up === "Shield" && o.x >= 150 * scaleFac) || fixture.up === "Invincibility" || spike.up) {
                                o.j = true;
                                if (spike.up) {
                                    spike.up = false;
                                    powerUpAnimTo.up = 0;
                                }
                            }
                        } else if (o.y >= height / 2) {
                            if ((fixture.down === "Shield" && o.x >= 150 * scaleFac) || fixture.down === "Invincibility" || spike.down) {
                                o.j = true;
                                if (spike.down) {
                                    spike.down = false;
                                    powerUpAnimTo.down = 0;
                                }
                            }
                        }
                        if(!o.j&&livesLen>0) {
                          o.j=true;
                          lives[livesLen-1].alive=false;
                        }
                        if (!o.j) {
                            gameOver = true;
                        }
                        //screenshot=get(0,0,width,height);
                    } else {
                        if (o.y < height / 2 && fixture.up === "Magnet") {
                            o.x += (150 * scaleFac - o.x) / 10;
                            o.y += (height / 2 - pY - o.y) / 10;
                            if (abs(o.y - (height / 2 - pY)) < 0.5) {
                                o.j = true;
                            }
                        } else if (o.y >= height / 2 && fixture.down === "Magnet") {
                            o.x += (150 * scaleFac - o.x) / 10;
                            o.y += (height / 2 + pY - o.y) / 10;
                            if (abs(o.y - (height / 2 + pY)) < 0.5) {
                                o.j = true;
                            }
                        } else {
                            o.j = true;
                        }
                    }
                }
                if (o.j) {
                    o.y += o.yAccl;
                    o.yAccl += 1 * scaleFac;
                }
                if (o.x < -35/2) {
                    obstacles.splice(i, 1);
                    oLen--;
                    i--;
                    if(o.t===1&&!o.j) {
                      if (fixture.up === "Safety Net"&&o.y < height / 2) {
                        o.j = true;
                      } else if (fixture.down === "Safety Net"&&o.y >= height / 2) {
                        o.j = true;
                      } else {
                        if(livesLen>0) {
                          o.j=true;
                          lives[livesLen-1].alive=false;
                        } else {
                          gameOver = true;
                        }
                      }
                    }
                }
            }
            strokeCap(SQUARE);
            stroke(BLACK);
            noFill();
            strokeWeight(10 * scaleFac);
            for (var i = 0; i < height / 2; i += 40 * scaleFac) {
                line(5, net.up + i, 5, net.up + i + 30 * scaleFac);
                line(5, net.down + i, 5, net.down + i + 30 * scaleFac);
            }
            net.up += (netTo.up - net.up) / 5;
            net.down += (netTo.down - net.down) / 5;
            //println(obstacles.length);
            pushStyle();
            //textAlign(LEFT,CENTER);
            textSize(scoreS * scaleFac);
            scoreS += (scoreSTo - scoreS) / 5;
            fill(30, 55, 70);
            //seconds=550;
            text(seconds, 60 * scaleFac, 40 * scaleFac);
            if (seconds % 20 < 1 && seconds > 3) {
                scoreSTo = 50;
            } else {
                scoreSTo = 40;
            }
            popStyle();
            textSize(20 * scaleFac);
            fill(30, 55, 70, toastF);
            text(toast, width / 2, height - 55 * scaleFac);
            toastF += (toastToF - toastF) / 10;
            if (toastToT < 1) {
                toastToF = 0;
            }
            if (gameOver) {
                if (endTimer > 25) {
                    t.to = 4;
                    t.toC = width + height + 20;
                }
                endTimer++;
                fR--;
                if (t.toC === width + height + 20 && t.c > width + height - 10) {
                    obstacles = [];
                    lineL = [];
                    lineL2 = [];
                    for (var i = 0; i < 50; i++) {
                        lineL.push(0);
                    }
                    for (var i = 0; i < 50; i++) {
                        lineL2.push(0);
                    }
                    pY = 0;
                }
            } else {
              pY += pA;
              var speed = 3.5 * scaleFac;
              if (fixture.up === "Booster" || fixture.down === "Booster") {
                  speed = 5 * scaleFac;
              }
              if (isMousePressed || mouseIsPressed) {
                  pA += (speed - pA) / 10;
              } else {
                  pA += (-speed - pA) / 10;
                  if (pY < 0) {
                      pY = 0;
                      pA = 0;
                  }
              }
              if (fR % 60 === 0) {
                if (toastToT > 0) {
                    toastToT--;
                }
                if (powerUpTimer.up > 0) {
                    powerUpTimer.up--;
                    counterTo.up -= width / 5;
                    if (powerUpTimer.up === 0) {
                        powerUpAnimTo.up = 0;
                        counterTo.up = 0;
                        netTo.up = -height / 2;
                    }
                }
                if (powerUpAnimTo.up === 0 && powerUpAnim.up < 0.1) {
                    powerUp.up = 0;
                    spike.up = false;
                }
                if (powerUpTimer.down > 0) {
                    powerUpTimer.down--;
                    counterTo.down -= width / 5;
                    if (powerUpTimer.down === 0) {
                        powerUpAnimTo.down = 0;
                        counterTo.down = 0;
                        netTo.down = height;
                    }
                }
                if (powerUpAnimTo.down === 0 && powerUpAnim.down < 0.1) {
                    powerUp.down = 0;
                    spike.down = false;
                }
                seconds++;
                if(seconds%25===0&&dotSpaceLen>60) {
                  dotSpaceLen-=10;
                }
              }
              if(fR%dotSpaceLen===0) {
                if (seconds > 1 || secondTime) {
                    var randDot = randomDot();
                    var y = randDot.y,
                        y2 = randDot.y2,
                        type = randDot.type,
                        type2 = randDot.type2;
                    if (seconds > 5 && !powerUpSpawned) {
                        var P_LEN = POWERUPS.length;
                        if (type === 2) {
                            if (random(0, 100) < POWERUP_SPAWN_CHANCE) {
                                type = 4 + round(random(1, P_LEN - 1));
                            }
                        } else if (type2 === 2) {
                            if (random(0, 100) < POWERUP_SPAWN_CHANCE) {
                                type2 = 4 + round(random(1, P_LEN - 1));
                            }
                        }
                    }
                    obstacles.push({
                        x: width + 120 * scaleFac,
                        y: y,
                        t: type,
                        yAccl: -7 * scaleFac
                    });
                    obstacles.push({
                        x: width + 210 * scaleFac,
                        y: y2,
                        t: type2,
                        yAccl: -7 * scaleFac
                    });
                }
              }
            }
            noStroke();
            for(var i = 0; i < livesLen; i++) {
              var l = lives[i];
              noStroke();
              fill(30,55,70,l.f);
              ellipse(width-30*scaleFactor*1.3*(i+1),40*scaleFac,l.s*7/13,l.s*7/13);
              stroke(30,55,70,l.f);
              noFill();
              strokeWeight(4*scaleFac);
              ellipse(width-30*scaleFactor*1.3*(i+1),40*scaleFac,l.s*10/13,l.s*10/13);
              if(!l.alive) {
                l.s+=2;
                l.f-=10;
                if(l.f<0) {
                  lives.splice(i,1);
                  livesLen--;
                }
              }
            }
        };
        var end = function() {
            var scaleFac = scaleFactor;
            background(255, 225, 100);
            //seconds=236;
            PR = max(seconds,PR);
            stroke(0, 0, 0, 20);
            strokeWeight(10 * scaleFac);
            for (var i = 0; i < longestSide * 2; i += 20 * scaleFac) {
                line(i + fR / 4 % 20 * scaleFac, 0, 0, i + fR / 4 % 20 * scaleFac);
            }
            //image(screenshot,0,0);
            fill(255, 225, 100);
            strokeWeight(10 * scaleFac);
            stroke(BLACK);
            //noFill();
            var textFactor = textWidth(seconds) / textWidth("33");
            textFactor = textFactor <= 1 ? 1 : textFactor;
            var rectS = 275;
            rect(width / 2 - rectS * textFactor * scaleFac / 2, height / 2 - rectS * scaleFac / 2, rectS * textFactor * scaleFac, rectS * scaleFac);
            rect(width / 2 - rectS * textFactor * scaleFac / 2 + rectS * textFactor * scaleFac + 2 * scaleFac, height / 2 - rectS * scaleFac / 2, 70 * scaleFac, 70 * scaleFac);
            fill(BLACK);
            textSize(45 * scaleFac);
            text("?", width / 2 - rectS * textFactor * scaleFac / 2 + rectS * textFactor * scaleFac + 2 * scaleFac + 35 * scaleFac, height / 2 - rectS * scaleFac / 2 + 35 * scaleFac)
            textSize(150 * scaleFac);
            text(seconds, width / 2, height / 2);
            textSize(25 * scaleFac);
            text("SECONDS", width / 2, height / 2 + 88.5 * scaleFac);
            textSize(20 * scaleFac);
            //fill(30,55,70,255/2+sin(fR*3)*255/2);
            //var asd = (height/2-225*scaleFac*3/2+225*scaleFac)/2;
            var asd = height / 2 - 88.5 * scaleFac;
            //var dsa = (height-(height/2+225*scaleFac/2+5,225*scaleFac))/2;
            //text("TAP TO RETRY",width/2,height-asd+5);
            fill(30, 55, 70, recordTxtF);
            recordTxtF = 255 / 2 + sin(fR * 3) * 255 / 2;
            if (recordTxtF < 1) {
                recordTxt = !recordTxt;
            }
            textSize(15 * scaleFac);
            if (recordTxt) {
                text("World Record : " + WR, width / 2, asd);
            } else {
                text("Personal Record : " + PR, width / 2, asd);
            }
            var t = transition;
            if (mouse.over(width / 2 - rectS * textFactor * scaleFac / 2 + rectS * textFactor * scaleFac + 2 * scaleFac, height / 2 - rectS * scaleFac / 2, 70 * scaleFac, 70 * scaleFac)) {
                cursor(HAND);
                if (mouse.clicked) {
                    pagerPos = 0;
                    t.to = 2;
                    t.toC = width + height + 20;
                    toastF = 255;
                    toastToF = 255;
                    toastToT = 5;
                    toast = "CLICK AND HOLD TO SEPERATE THE SNAKES\nCATCH THE BLUE. AVOID THE RED.";
                    secondTime = true;
                    powerUp.up = 0;
                    powerUp.down = 0;
                    counter = {
                        up: 0,
                        down: 0
                    };
                    counterTo = {
                        up: 0,
                        down: 0
                    };
                    net = {
                        up: 0 - height / 2,
                        down: height
                    };
                    netTo = {
                        up: -height / 2,
                        down: height
                    };
                    spike = {
                        up: false,
                        down: false
                    };
                    powerUpAnimTo = {
                        up: 0,
                        down: 0
                    };
                    powerUpAnim = {
                        up: 0,
                        down: 0
                    };
                    helpFade=255;
                }
            } else if (mouse.clicked) {
                t.to = 3;
                t.toC = width + height + 20;
                toastF = 255;
                toastToF = 255;
                toastToT = 5;
                toast = "CLICK AND HOLD TO SEPERATE THE SNAKES\nCATCH THE BLUE. AVOID THE RED.";
                secondTime = true;
                powerUp.up = 0;
                powerUp.down = 0;
                counter = {
                    up: 0,
                    down: 0
                };
                counterTo = {
                    up: 0,
                    down: 0
                };
                net = {
                    up: 0 - height / 2,
                    down: height
                };
                netTo = {
                    up: -height / 2,
                    down: height
                };
                spike = {
                    up: false,
                    down: false
                };
                powerUpAnimTo = {
                    up: 0,
                    down: 0
                };
                powerUpAnim = {
                    up: 0,
                    down: 0
                };
                    lives = [{s:30*scaleFactor,f:255,alive:true},{s:30*scaleFactor,f:255,alive:true},{s:30*scaleFactor,f:255,alive:true},{s:30*scaleFactor,f:255,alive:true},{s:30*scaleFactor,f:255,alive:true}];
                    dotSpaceLen = 140;
            }
            if (t.c > width + height - 10 && t.toC === width + height + 20) {
                seconds = 0;
                gameOver = false;
                endTimer = 0;
            }
        };
        draw = function() {
          mouseX=mousePos.x;
          mouseY=mousePos.y;
            mouse.clicked=isMouseClicked;
            cursor(ARROW);
            //println(5);
            fR++;
            switch (page) {
                case 3:
                    game();
                    break;
                case 4:
                    end();
                    break;
                case 2:
                    help();
                    break;
                case 1:
                    home();
                    break;
                case 0:
                    load();
                    break;
            }
            mouse.clicked = false;
            isMouseClicked = false;
            var t = transition;
            fill(BLACK);
            noStroke();
            triangle(0, 0, t.c, 0, 0, t.c);
            t.c += (t.toC - t.c) / 10;
            if (t.toC === width + height + 20 && t.c > width + height + 18) {
                t.toC = 0;
                page = t.to;
            } else if (t.c < 2) {
                t.c = 0;
            }
        };

    }
    if (typeof draw !== 'undefined') processing.draw = draw;
});
        e.preventDefault();
    }
}, false);
document.body.addEventListener("touchmove", function(e) {
    if (e.target == canvas) {
        e.preventDefault();
    }
}, false);



var processing = new Processing(canvas, function(processing) {
    //processing.size(800,400); // minX = 200   minY = 300 iphone=(1920/3, 1080/3)
    processing.size(window.innerWidth, window.innerHeight);
    processing.background(0xFFF);

    var mouseIsPressed = false;
    mouseIsPressed = isMousePressed;

    var keyIsPressed = false;
    processing.keyPressed = function() {
        keyIsPressed = true;
    };
    processing.keyReleased = function() {
        keyIsPressed = false;
    };

    function getImage(s) {
        var url = "https://www.kasandbox.org/programming-images/" + s + ".png";
        processing.externals.sketch.imageCache.add(url);
        return processing.loadImage(url);
    }

    // use degrees rather than radians in rotate function
    var rotateFn = processing.rotate;
    var sin = processing.sin;
    var cos = processing.cos;
    var arcFn = processing.arc;
    processing.rotate = function(angle) {
        rotateFn(processing.radians(angle));
    };
    processing.sin = function(angle) {
        return Math.sin(processing.radians(angle));
    };
    processing.cos = function(angle) {
        return Math.cos(processing.radians(angle));
    };
    processing.arc = function(x, y, w, h, a1, a2) {
        arcFn(x, y, w, h, processing.radians(a1), processing.radians(a2));
    };

    with(processing) {
        /**
             * BLUR:      11,
                GRAY:      12,
                INVERT:    13,
                OPAQUE:    14,
                POSTERIZE: 15,
                THRESHOLD: 16,
                ERODE:     17,
                DILATE:    18,
                
                TODO Fade Anim for Power Ups
                TODO Help page
            **/
        // 64 sec. ,96 sec.
        disableContextMenu();
        frameRate(60);
        var page = 0;
        textAlign(CENTER, CENTER);
        textFont(createFont("Century Gothic Bold"));
        var mouse = {
                over: function(x, y, w, h) {
                    return mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
                }
            };
        var BLACK = color(30, 55, 70),
            RED = color(240, 95, 80),
            BLUE = color(100, 215, 215);
        var WR = 210;
        var PR = 0;
        var POWERUP_SPAWN_CHANCE = 60;
        var transition = {
            c: 0,
            toC: 0,
            to: 0
        };
        var longestSide = (width > height ? width : height);
        var secondTime = false;
        var fR = 0;
        var imgCount = 0;
        var blueDot;
        var redDot;
        var powerHex;
        var stripes;
        var pY = 0;
        var pA = 0;
        var lineL = [],
            lineL2 = [];
        var obstacles = [];
        var seconds = 0;
        var toast = "CLICK AND HOLD TO SEPERATE\nCATCH THE BLUE. AVOID THE RED.";
        var toastF = 255;
        var toastToF = 255;
        var toastToT = 5;
        var recordTxtF = 0;
        var recordTxt = true;
        var gameOver = false;
        var endTimer = 0;
        var POWERUPS = ["Nothing", "Magnet", "Safety Net", "Invincibility", "Booster", "Shield", "Spike"];
        var poly = function(x, y, sides, radius, rot) {
            beginShape();
            var degreesPerSide = 360 / sides;
            for (var i = 1; i <= sides; i++) {
                vertex(x + cos(degreesPerSide * i + rot) * radius, y + sin(degreesPerSide * i + rot) * radius);
            }
            endShape(CLOSE);
        };
        var powerUp = {
            up: 0,
            down: 0
        };
        var powerUpTimer = {
            up: 0,
            down: 0
        };
        var counter = {
            up: 0,
            down: 0
        };
        var counterTo = {
            up: 0,
            down: 0
        };
        var net = {
            up: 0 - height / 2,
            down: height
        };
        var netTo = {
            up: -height / 2,
            down: height
        };
        var spike = {
            up: false,
            down: false
        };
        var scaleFactor = sqrt(sq(width) + sq(height)) / sqrt(sq(width * 400 / height) + sq(height * 400 / width));
        var powerUpAnim = {
            up: 0,
            down: 0
        };
        var powerUpAnimTo = {
            up: 0,
            down: 0
        };
        var helpFade = 255;
        var pagerPos = 0;
        var pagerPages = [{
            img: redDot,
            title: "Red Dots",
            text: "Must be avoided as\nthey can cause an\ninstant death to\nboth snakes"
        }, {
            img: blueDot,
            title: "Blue Dots",
            text: "Must be caught before\nthey exit across the\nleft side of the screen"
        }, {
            img: blueDot,
            title: "Powerups",
            text: "Look like blue hexagons but\ndon't have to be caught.\nThe following are a list\nof various powerups."
        }, {
            img: powerHex,
            title: "Magnet",
            text: "Catches blue dots farther\naway from the snake"
        }, {
            img: powerHex,
            title: "Safety Net",
            text: "Catches blue dots before\nthey exit across the\nleft side of the screen"
        }, {
            img: powerHex,
            title: "Invincibility",
            text: "Protects the snake from\nall red dots"
        }, {
            img: powerHex,
            title: "Booster",
            text: "Increases the\nsnake's speed"
        }, {
            img: powerHex,
            title: "Shield",
            text: "Protects the front of\nthe snake's head"
        }, {
            img: powerHex,
            title: "Spike",
            text: "Protects the snake against\none red dot before\ndisintegrating"
        }];
        var scoreS = 40;
        var scoreSTo = 40;
        var load = function() {
            var scaleFac = scaleFactor;
            background(0, 0, 0, 0);
            switch (imgCount) {
                case 0:
                    for (var i = 0; i < 50; i++) {
                        lineL.push(0);
                    }
                    for (var i = 0; i < 50; i++) {
                        lineL2.push(0);
                    }
                    break;
                case 1:
                    strokeWeight(5 * scaleFac);
                    stroke(BLACK);
                    fill(BLUE);
                    ellipse(35 * scaleFac / 2, 35 * scaleFac / 2, 30 * scaleFac, 30 * scaleFac);
                    fill(BLACK);
                    ellipse(35 * scaleFac / 2, 35 * scaleFac / 2, 10 * scaleFac, 10 * scaleFac);
                    noStroke();
                    blueDot = get(0, 0, 35 * scaleFac, 35 * scaleFac);
                    break;
                case 2:
                    strokeWeight(5 * scaleFac);
                    stroke(BLACK);
                    fill(RED);
                    ellipse(35 * scaleFac / 2, 35 * scaleFac / 2, 30 * scaleFac, 30 * scaleFac);
                    fill(BLACK);
                    ellipse(35 * scaleFac / 2, 35 * scaleFac / 2, 10 * scaleFac, 10 * scaleFac);
                    noStroke();
                    redDot = get(0, 0, 35 * scaleFac, 35 * scaleFac);
                    break;
                case 3:
                    strokeWeight(10 * scaleFac);
                    stroke(0, 0, 0, 20);
                    for (var i = 0; i < width + height; i += 20 * scaleFac) {
                        line(i, 0, 0, i);
                    }
                    stripes = get(0, 0, width + height, height);
                    break;
                case 4:
                    strokeWeight(5 * scaleFac);
                    stroke(BLACK);
                    fill(BLUE);
                    poly(43 * scaleFac / 2, 43 * scaleFac / 2, 6, 19 * scaleFac, 0);
                    //ellipse(43*scaleFac/2,43*scaleFac/2,38*scaleFac,38*scaleFac);
                    fill(BLACK);
                    poly(43 * scaleFac / 2, 43 * scaleFac / 2, 6, 7 * scaleFac, 0);
                    //ellipse(43*scaleFac/2,43*scaleFac/2,10*scaleFac,10*scaleFac);
                    noStroke();
                    powerHex = get(0, 0, 43 * scaleFac, 43 * scaleFac);
                    break;
                case 5:
                    /*fill(255, 225, 100);
                    var lFactor = 5.4 * scaleFac;
                    rect(0, 0, width, height);
                    pushStyle();
                    image(stripes, 0, 0);
                    stroke(BLACK);
                    strokeWeight(15 * lFactor);
                    //line(35*lFactor/2,35*lFactor/2,width-35*lFactor/2,height-35*lFactor/2);
                    line(35 * lFactor / 2, height - 35 * lFactor / 2, width - 35 * lFactor / 2, 35 * lFactor / 2);
                    strokeWeight(5 * lFactor);
                    stroke(BLACK);
                    //line(width,0,0,height);
                    fill(RED);
                    ellipse(35 * lFactor / 2, 35 * lFactor / 2, 30 * lFactor, 30 * lFactor);
                    fill(BLACK);
                    ellipse(35 * lFactor / 2, 35 * lFactor / 2, 10 * lFactor, 10 * lFactor);
                    noStroke();
                    strokeWeight(5 * lFactor);
                    stroke(BLACK);
                    //line(width,0,0,height);
                    fill(BLUE);
                    ellipse(width - 35 * lFactor / 2, height - 35 * lFactor / 2, 30 * lFactor, 30 * lFactor);
                    fill(BLACK);
                    ellipse(width - 35 * lFactor / 2, height - 35 * lFactor / 2, 10 * lFactor, 10 * lFactor);
                    noStroke();
                    fill(30, 55, 70);
                    noStroke();
                    ellipse(width - 35 * lFactor / 2, 35 * lFactor / 2, 35 * lFactor, 35 * lFactor);
                    ellipse(35 * lFactor / 2, height - 35 * lFactor / 2, 35 * lFactor, 35 * lFactor);
                    fill(255, 255, 255, 25);
                    ellipse(width - 35 * lFactor / 2, 35 * lFactor / 2, 25 * lFactor, 25 * lFactor);
                    ellipse(35 * lFactor / 2, height - 35 * lFactor / 2, 25 * lFactor, 25 * lFactor);
                    ellipse(width - 35 * lFactor / 2, 35 * lFactor / 2, 15 * lFactor, 15 * lFactor);
                    ellipse(35 * lFactor / 2, height - 35 * lFactor / 2, 15 * lFactor, 15 * lFactor);
                    popStyle();*/
                    page = 1;
                    break;
            }
            if (imgCount < 5) {
                imgCount++;
                background(255, 255, 255);
            }
        };
        var pattern = function(y) {
            var scaleFac = scaleFactor;
            strokeWeight(8 * scaleFac);
            strokeCap(PROJECT);
            for (var i = 0; i < width; i += 40 * scaleFac) { // y = 350
                stroke(30, 55, 70);
                line(i, y, i + 20 * scaleFac, y + 20 * scaleFac);
                line(i + 20 * scaleFac, y + 20 * scaleFac, i + 40 * scaleFac, y);
                line(i, y - 20 * scaleFac, i + 20 * scaleFac, y);
                line(i + 20 * scaleFac, y, i + 40 * scaleFac, y - 20 * scaleFac);
                stroke(100, 215, 215);
                line(i, y - 10 * scaleFac, i + 20 * scaleFac, y + 10 * scaleFac);
                stroke(240, 95, 80);
                line(i + 20 * scaleFac, y + 10 * scaleFac, i + 40 * scaleFac, y - 10 * scaleFac);
            }
        };
        var home = function() {
            var scaleFac = scaleFactor;
            background(255, 225, 100);
            /*
            strokeWeight(10);
            stroke(0,0,0,20);
            for(var i = 0; i < 800; i+=20) {
                line(i+fR/6%20,0,0,i+fR/6%20);
            }
            strokeWeight(8);
            strokeCap(PROJECT);
            for(var i = 0; i < 400; i+=40) {
                stroke(30,55,70);
                line(i,350,i+20,370);
                line(i+20,370,i+40,350);
                line(i,330,i+20,350);
                line(i+20,350,i+40,330);
                stroke(100,215,215);
                line(i,330+10,i+20,350+10);
                stroke(240,95,80);
                line(i+20,350+10,i+40,330+10);
            }
            fill(30,55,70);
            noStroke();
            //println(mouseX+","+mouseY);
            textSize(155);
            var shift=-0;
            //text("FACTORY",width/2-shift,);
            text("D",width/2-115+shift,170);
            text("U",width/2-10+shift,170);
            text("O",width/2+105+shift,170);
            */
            strokeWeight(10 * scaleFac);
            stroke(0, 0, 0, 20);
            for (var i = 0; i < longestSide * 2; i += 20 * scaleFac) {
                line(i + fR / 6 % 20, 0, 0, i + fR / 6 % 20);
            }
            resetMatrix();
            //translate(0,-20);
            pattern(height / 2 + 55 * scaleFac);
            fill(30, 55, 70);
            noStroke();
            //println(mouseX+","+mouseY);
            textSize(125 * scaleFac);
            var shift = -0;
            //text("FACTORY",width/2-shift,150);
            text("S", width / 2 - 185 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("N", width / 2 - 115 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("A", width / 2 - 30 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("K", width / 2 + 50 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("E", width / 2 + 120 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("S", width / 2 + 185 * scaleFac + shift, height / 2 - 90 * scaleFac);
            textSize(50 * scaleFac);
            text("& D O T S", width / 2, height / 2 - 10 * scaleFac);
            pushStyle();
            rectMode(CENTER);
            rect(width / 2, height / 2 + 130 * scaleFac, 210 * scaleFac, 50 * scaleFac, 5 * scaleFac);
            popStyle();
            textSize(137 * scaleFac);
            fill(0, 0, 0, 100);
            text("S", width / 2 - 185 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("N", width / 2 - 115 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("A", width / 2 - 30 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("K", width / 2 + 50 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("E", width / 2 + 120 * scaleFac + shift, height / 2 - 90 * scaleFac);
            text("S", width / 2 + 185 * scaleFac + shift, height / 2 - 90 * scaleFac);
            textSize(52 * scaleFac);
            text("& D O T S", width / 2, height / 2 - 10 * scaleFac);
            pushStyle();
            rectMode(CENTER);
            rect(width / 2, height / 2 + 130 * scaleFac, 215 * scaleFac, 55 * scaleFac, 5 * scaleFac);
            popStyle();
            fill(255, 225, 100);
            textSize(30 * scaleFac);
            text("TAP TO PLAY", width / 2, height / 2 + 130 * scaleFac);
            //ellipse(width/2+105+shift,173,20,20);
            stroke(30, 55, 70);
            strokeWeight(10 * scaleFac);
            noFill();
            //ellipse(width/2+105+shift,173,45+sin(fR*3)*10,45+sin(fR*3)*10);
            textSize(40);
            //text("O",width/2+45.5+shift,150);
            pushStyle();
            var t = transition;
            if (mouse.clicked) {
                t.to = 2;
                t.toC = width + height + 20;
            }
        };
        var help = function() {
            var scaleFac = scaleFactor;
            //background(255,225,100);
            helpFade += (0 - helpFade) / 60;
            background(BLACK);
            var t = transition;
            if (mouse.over(width / 2 + 340 * scaleFac / 2, height / 2 - 20 * scaleFac, 30 * scaleFac, 40 * scaleFac)) {
                cursor(HAND);
                if (mouse.clicked) {
                    if (pagerPos + 1 === pagerPages.length) {
                        pagerPos = 0;
                    } else {
                        pagerPos++;
                    }
                }
            } else if (mouse.over(width / 2 - 400 * scaleFac / 2, height / 2 - 20 * scaleFac, 30 * scaleFac, 40 * scaleFac)) {
                cursor(HAND);
                if (mouse.clicked) {
                    if (pagerPos - 1 === -1) {
                        pagerPos = pagerPages.length - 1;
                    } else {
                        pagerPos--;
                    }
                }
            } else if (mouse.clicked) {
                t.to = 3;
                t.toC = width + height + 20;
            }
            pushStyle();
            stroke(255);
            line(width / 2 + 360 * scaleFac / 2, height / 2 - 10 * scaleFac, width / 2 + 380 * scaleFac / 2, height / 2);
            line(width / 2 + 380 * scaleFac / 2, height / 2, width / 2 + 360 * scaleFac / 2, height / 2 + 10 * scaleFac);
            line(width / 2 - 360 * scaleFac / 2, height / 2 - 10 * scaleFac, width / 2 - 380 * scaleFac / 2, height / 2);
            line(width / 2 - 380 * scaleFac / 2, height / 2, width / 2 - 360 * scaleFac / 2, height / 2 + 10 * scaleFac);
            rectMode(CENTER);
            rect(width / 2, height / 2, 300 * scaleFac, 200 * scaleFac);
            popStyle();
            var pagerSlide = pagerPages[pagerPos];
            fill(255);
            textSize(40 * scaleFac);
            text(pagerSlide.title, width / 2, height / 2 - 60 * scaleFac);
            textSize(20 * scaleFac);
            text(pagerSlide.text, width / 2, height / 2 + 20 * scaleFac);
            text("TAP TO CONTINUE", width / 2, height - 40 * scaleFac);
            text("INSTRUCTIONS " + (pagerPos + 1) + "/" + pagerPages.length, width / 2, 40 * scaleFac);
            fill(35, 55, 70, helpFade);
            rect(0, 0, width, height);
        };
        var randomDot = function() {
          var scaleFac=scaleFactor;
          var xy = random(35 * scaleFac, height - 35 * scaleFac);
          if(round(random(1, 2)) === 1) {
            xy2 = random(35 * scaleFac / 2, xy - 35 * scaleFac);
          } else {
            xy2 = random(xy + 35 * scaleFac, height - 35 * scaleFac / 2);
          }
          var xtype = round(random(1, 4));
          if(xtype===1) {
            xtype2=2;
          } else {
            xtype2=1;
          }
          return {y:xy,y2:xy2,type:xtype,type2:xtype2};
        };
        var game = function() {
            var scaleFac = scaleFactor;
            background(255, 225, 100);
            var fixture = {
                up: "nothing",
                down: "nothing"
            };
            powerUpAnim.up += (powerUpAnimTo.up - powerUpAnim.up) / 8;
            powerUpAnim.down += (powerUpAnimTo.down - powerUpAnim.down) / 8;
            var t = transition,
                powerUpSpawned = false; // true when a power up is on screen
            fill(30, 55, 70, 210);
            rect(0, 0, counter.up, height / 40);
            rect(0, height - height / 40, counter.down, height / 40);
            counter.up += (counterTo.up - counter.up) / (5);
            counter.down += (counterTo.down - counter.down) / (5);
            if (powerUp.up > 0) {
                fixture.up = POWERUPS[powerUp.up];
                //fixture.up=3;
            }
            if (powerUp.down > 0) {
                fixture.down = POWERUPS[powerUp.down];
                //fixture.down=3;
            }
            strokeWeight(13 * scaleFac);
            stroke(0, 0, 0, 20);
            image(stripes, -(fR * 3 * scaleFac) % (20 * scaleFac), 0, width + height + 30 * scaleFac, height);
            stroke(30, 55, 70);
            strokeWeight(15 * scaleFac);
            strokeCap(ROUND);
            var snakeSmoothness = (150 * scaleFac) / 50;
            for (var i = 0, lLen = 50; i < lLen; i ++) {
                if (i < 47) {
                    bezier(i * snakeSmoothness, height / 2 + lineL[i], (i * snakeSmoothness) + snakeSmoothness, height / 2 + lineL[i + 1], i * snakeSmoothness, height / 2 + lineL[i + 2], (i * snakeSmoothness) + snakeSmoothness, height / 2 + lineL[i + 3]);
                    bezier(i * snakeSmoothness, height / 2 + lineL2[i], (i * snakeSmoothness) + snakeSmoothness, height / 2 + lineL2[i + 1], i * snakeSmoothness, height / 2 + lineL2[i + 2], (i * snakeSmoothness) + snakeSmoothness, height / 2 + lineL2[i + 3]);
                }
                if (i >= 1 && !gameOver) {
                    var val = lineL[i];
                    lineL[i - 1] = val;
                    val = lineL2[i];
                    lineL2[i - 1] = val;
                }
            }
            lineL2[49] = -pY;
            lineL[49] = pY;
            fill(30, 55, 70);
            noStroke();
            var headX = 150*scaleFac;
            ellipse(headX, height / 2 + pY, 35 * scaleFac, 35 * scaleFac);
            ellipse(headX, height / 2 - pY, 35 * scaleFac, 35 * scaleFac);
            fill(255, 255, 255, 25);
            ellipse(headX, height / 2 + pY, 25 * scaleFac, 25 * scaleFac);
            ellipse(headX, height / 2 - pY, 25 * scaleFac, 25 * scaleFac);
            ellipse(headX, height / 2 + pY, 15 * scaleFac, 15 * scaleFac);
            ellipse(headX, height / 2 - pY, 15 * scaleFac, 15 * scaleFac);
            // Draw Powerups
            if (fixture.up === "Booster" || fixture.down === "Booster") {
                fill(0, 0, 0, 50);
                var aksldkfja = sin(fR * 30) * 10;
                ellipse(150 * scaleFac, height / 2 - pY, (45 + aksldkfja) * scaleFac * powerUpAnim.up, (45 + aksldkfja) * scaleFac * powerUpAnim.up);
                ellipse(150 * scaleFac, height / 2 + pY, (45 + aksldkfja) * scaleFac * powerUpAnim.down, (45 + aksldkfja) * scaleFac * powerUpAnim.down);
            }
            switch (fixture.up) {
                case "Magnet":
                    fill(0, 0, 0, 40);
                    ellipse(150 * scaleFac, height / 2 - pY, 70 * scaleFac * powerUpAnim.up, 70 * scaleFac * powerUpAnim.up);
                    break;
                case "Shield":
                    strokeCap(SQUARE);
                    stroke(BLACK);
                    noFill();
                    strokeWeight(5 * scaleFac);
                    for (var i = -90; i < 90; i += 40) {
                        arc(150 * scaleFac, height / 2 - pY, 55 * scaleFac * powerUpAnim.up, 55 * scaleFac * powerUpAnim.up, i, i + 30);
                    }
                    break;
                case "Invincibility":
                    strokeCap(SQUARE);
                    stroke(BLACK);
                    noFill();
                    strokeWeight(5 * scaleFac);
                    for (var i = -90; i < 270; i += 40) {
                        arc(150 * scaleFac, height / 2 - pY, 55 * scaleFac * powerUpAnim.up, 55 * scaleFac * powerUpAnim.up, i + fR, i + 30 + fR);
                    }
                    break;
                case "Safety Net":
                    if (powerUpTimer.up > 0) {
                        netTo.up = 0;
                    }
                    break;
                case "Spike":
                    if (spike.up) {
                        fill(BLACK);
                        for (var i = 0; i < 360; i += 30) {
                            poly(150 * scaleFac + cos(i + fR) * 35 * scaleFac / 2, height / 2 - pY + sin(i + fR) * 35 * scaleFac / 2, 3, 6 * scaleFac * powerUpAnim.up, i + fR);
                        }
                    }
                    break;
            }
            switch (fixture.down) {
                case "Magnet":
                    fill(0, 0, 0, 40);
                    ellipse(150 * scaleFac, height / 2 + pY, 70 * scaleFac * powerUpAnim.down, 70 * scaleFac * powerUpAnim.down);
                    break;
                case "Shield":
                    strokeCap(SQUARE);
                    stroke(BLACK);
                    noFill();
                    strokeWeight(5 * scaleFac);
                    for (var i = -90; i < 90; i += 40) {
                        arc(150 * scaleFac, height / 2 + pY, 55 * scaleFac * powerUpAnim.down, 55 * scaleFac * powerUpAnim.down, i, i + 30);
                    }
                    break;
                case "Invincibility":
                    strokeCap(SQUARE);
                    stroke(BLACK);
                    noFill();
                    strokeWeight(5 * scaleFac);
                    for (var i = -90; i < 270; i += 40) {
                        arc(150 * scaleFac, height / 2 + pY, 55 * scaleFac * powerUpAnim.down, 55 * scaleFac * powerUpAnim.down, i + fR, i + 30 + fR);
                    }
                    break;
                case "Safety Net":
                    if (powerUpTimer.down > 0) {
                        netTo.down = height / 2;
                    }
                    break;
                case "Spike":
                    if (spike.down) {
                        fill(BLACK);
                        for (var i = 0; i < 360; i += 30) {
                            poly(150 * scaleFac + cos(i + fR) * 35 * scaleFac / 2, height / 2 + pY + sin(i + fR) * 35 * scaleFac / 2, 3, 6 * scaleFac * powerUpAnim.down, i + fR);
                        }
                    }
                    break;
            }
            // Draw dots To be Optimized
            for (var i = 0, oLen = obstacles.length; i < oLen; i++) {
                var o = obstacles[i];
                if (o.t === 1) {
                    image(blueDot, o.x - 35 * scaleFac / 2, o.y - 35 * scaleFac / 2);
                } else if (o.t <= 4) {
                    image(redDot, o.x - 35 * scaleFac / 2, o.y - 35 * scaleFac / 2);
                } else {
                    powerUpSpawned = true;
                    pushMatrix();
                    translate(o.x, o.y);
                    rotate(-fR);
                    image(powerHex, -43 * scaleFac / 2, -43 * scaleFac / 2);
                    popMatrix();
                }
                noStroke();
                if (!gameOver) {
                    o.x -= 3 * scaleFac;
                }
                var span1 = 35 * scaleFac,
                    span2 = 35 * scaleFac;
                if (o.t === 1) {
                    if (o.x < 150 * scaleFac) {
                        fill(255, 225, 100, sin(fR * 20) * 100 + 50);
                        ellipse(o.x, o.y, 35 * scaleFac, 35 * scaleFac);
                    }
                    if (fixture.up === "Spike") {
                        span1 = 41 * scaleFac;
                    }
                    if (fixture.down === "Spike") {
                        span2 = 41 * scaleFac;
                    }
                    if (fixture.up === "Magnet") {
                        span1 = 70 * scaleFac;
                    } else if (fixture.up === "Shield" || fixture.up === "Invincibility") {
                        span1 = 55 * scaleFac;
                    }
                    if (fixture.down === "Magnet") {
                        span2 = 70 * scaleFac;
                    } else if (fixture.down === "Shield" || fixture.down === "Invincibility") {
                        span2 = 55 * scaleFac;
                    }
                }
                if (o.x<200*scaleFac&&dist(o.x, o.y, 150 * scaleFac, height / 2 + pY) <= span2 || dist(o.x, o.y, 150 * scaleFac, height / 2 - pY) <= span1) {
                    if (o.t > 4) {
                        o.j = true;
                        if (toastToF === 0) {
                            toastToF = 255;
                            toast = "Power up collected : " + POWERUPS[o.t - 4];
                            toastToT = 3;
                        }
                        if (o.y < height / 2) {
                            powerUp.up = o.t - 4;
                            powerUpTimer.up = 5;
                            counterTo.up = width;
                            powerUpAnimTo.up = 1;
                        } else {
                            powerUpTimer.down = 5;
                            powerUp.down = o.t - 4;
                            counterTo.down = width;
                            powerUpAnimTo.down = 1;
                        }
                        if (POWERUPS[o.t - 4] === "Spike") {
                            if (o.y < height / 2) {
                                spike.up = true;
                            } else {
                                spike.down = true;
                            }
                        }
                    } else if (o.t !== 1) {
                        if (o.y < height / 2) {
                            if ((fixture.up === "Shield" && o.x >= 150 * scaleFac) || fixture.up === "Invincibility" || spike.up) {
                                o.j = true;
                                if (spike.up) {
                                    spike.up = false;
                                    powerUpAnimTo.up = 0;
                                }
                            }
                        } else if (o.y >= height / 2) {
                            if ((fixture.down === "Shield" && o.x >= 150 * scaleFac) || fixture.down === "Invincibility" || spike.down) {
                                o.j = true;
                                if (spike.down) {
                                    spike.down = false;
                                    powerUpAnimTo.down = 0;
                                }
                            }
                        }
                        if (!o.j) {
                            gameOver = true;
                        }
                        //screenshot=get(0,0,width,height);
                    } else {
                        if (o.y < height / 2 && fixture.up === "Magnet") {
                            o.x += (150 * scaleFac - o.x) / 10;
                            o.y += (height / 2 - pY - o.y) / 10;
                            if (abs(o.y - (height / 2 - pY)) < 0.5) {
                                o.j = true;
                            }
                        } else if (o.y >= height / 2 && fixture.down === "Magnet") {
                            o.x += (150 * scaleFac - o.x) / 10;
                            o.y += (height / 2 + pY - o.y) / 10;
                            if (abs(o.y - (height / 2 + pY)) < 0.5) {
                                o.j = true;
                            }
                        } else {
                            o.j = true;
                        }
                    }
                }
                if (o.j) {
                    o.y += o.yAccl;
                    o.yAccl += 1 * scaleFac;
                }
                if (o.x < -35/2) {
                    obstacles.splice(i, 1);
                    oLen--;
                    i--;
                    if(o.t===1&&!o.j) {
                      if (fixture.up === "Safety Net"&&o.y < height / 2) {
                        o.j = true;
                      } else if (fixture.down === "Safety Net"&&o.y >= height / 2) {
                        o.j = true;
                      } else {
                        gameOver = true;
                      }
                    }
                }
            }
            strokeCap(SQUARE);
            stroke(BLACK);
            noFill();
            strokeWeight(10 * scaleFac);
            for (var i = 0; i < height / 2; i += 40 * scaleFac) {
                line(5, net.up + i, 5, net.up + i + 30 * scaleFac);
                line(5, net.down + i, 5, net.down + i + 30 * scaleFac);
            }
            net.up += (netTo.up - net.up) / 5;
            net.down += (netTo.down - net.down) / 5;
            //println(obstacles.length);
            pushStyle();
            //textAlign(LEFT,CENTER);
            textSize(scoreS * scaleFac);
            scoreS += (scoreSTo - scoreS) / 5;
            fill(30, 55, 70);
            //seconds=550;
            text(seconds, 60 * scaleFac, 40 * scaleFac);
            if (seconds % 20 < 1 && seconds > 3) {
                scoreSTo = 50;
            } else {
                scoreSTo = 40;
            }
            popStyle();
            textSize(20 * scaleFac);
            fill(30, 55, 70, toastF);
            text(toast, width / 2, height - 55 * scaleFac);
            toastF += (toastToF - toastF) / 10;
            if (toastToT < 1) {
                toastToF = 0;
            }
            if (gameOver) {
                if (endTimer > 25) {
                    t.to = 4;
                    t.toC = width + height + 20;
                }
                endTimer++;
                fR--;
                if (t.toC === width + height + 20 && t.c > width + height - 10) {
                    obstacles = [];
                    lineL = [];
                    lineL2 = [];
                    for (var i = 0; i < 50; i++) {
                        lineL.push(0);
                    }
                    for (var i = 0; i < 50; i++) {
                        lineL2.push(0);
                    }
                    pY = 0;
                }
            } else {
              pY += pA;
              var speed = 3.5 * scaleFac;
              if (fixture.up === "Booster" || fixture.down === "Booster") {
                  speed = 5 * scaleFac;
              }
              if (isMousePressed || mouseIsPressed) {
                  pA += (speed - pA) / 10;
              } else {
                  pA += (-speed - pA) / 10;
                  if (pY < 0) {
                      pY = 0;
                      pA = 0;
                  }
              }
              if (fR % 60 === 0) {
                if (toastToT > 0) {
                    toastToT--;
                }
                if (powerUpTimer.up > 0) {
                    powerUpTimer.up--;
                    counterTo.up -= width / 5;
                    if (powerUpTimer.up === 0) {
                        powerUpAnimTo.up = 0;
                        counterTo.up = 0;
                        netTo.up = -height / 2;
                    }
                }
                if (powerUpAnimTo.up === 0 && powerUpAnim.up < 0.1) {
                    powerUp.up = 0;
                    spike.up = false;
                }
                if (powerUpTimer.down > 0) {
                    powerUpTimer.down--;
                    counterTo.down -= width / 5;
                    if (powerUpTimer.down === 0) {
                        powerUpAnimTo.down = 0;
                        counterTo.down = 0;
                        netTo.down = height;
                    }
                }
                if (powerUpAnimTo.down === 0 && powerUpAnim.down < 0.1) {
                    powerUp.down = 0;
                    spike.down = false;
                }
                if (seconds > 1 || secondTime) {
                    var randDot = randomDot();
                    var y = randDot.y,
                        y2 = randDot.y2,
                        type = randDot.type,
                        type2 = randDot.type2;
                    if (seconds > 5 && !powerUpSpawned) {
                        var P_LEN = POWERUPS.length;
                        if (type === 2) {
                            if (random(0, 100) < POWERUP_SPAWN_CHANCE) {
                                type = 4 + round(random(1, P_LEN - 1));
                            }
                        } else if (type2 === 2) {
                            if (random(0, 100) < POWERUP_SPAWN_CHANCE) {
                                type2 = 4 + round(random(1, P_LEN - 1));
                            }
                        }
                    }
                    obstacles.push({
                        x: width + 120 * scaleFac,
                        y: y,
                        t: type,
                        yAccl: -7 * scaleFac
                    });
                    obstacles.push({
                        x: width + 210 * scaleFac,
                        y: y2,
                        t: type2,
                        yAccl: -7 * scaleFac
                    });
                }
                seconds++;
              }
            }
        };
        var end = function() {
            var scaleFac = scaleFactor;
            background(255, 225, 100);
            //seconds=236;
            PR = max(seconds,PR);
            stroke(0, 0, 0, 20);
            strokeWeight(10 * scaleFac);
            for (var i = 0; i < longestSide * 2; i += 20 * scaleFac) {
                line(i + fR / 4 % 20 * scaleFac, 0, 0, i + fR / 4 % 20 * scaleFac);
            }
            //image(screenshot,0,0);
            fill(255, 225, 100);
            strokeWeight(10 * scaleFac);
            stroke(BLACK);
            //noFill();
            var textFactor = textWidth(seconds) / textWidth("33");
            textFactor = textFactor <= 1 ? 1 : textFactor;
            var rectS = 275;
            rect(width / 2 - rectS * textFactor * scaleFac / 2, height / 2 - rectS * scaleFac / 2, rectS * textFactor * scaleFac, rectS * scaleFac);
            rect(width / 2 - rectS * textFactor * scaleFac / 2 + rectS * textFactor * scaleFac + 2 * scaleFac, height / 2 - rectS * scaleFac / 2, 70 * scaleFac, 70 * scaleFac);
            fill(BLACK);
            textSize(45 * scaleFac);
            text("?", width / 2 - rectS * textFactor * scaleFac / 2 + rectS * textFactor * scaleFac + 2 * scaleFac + 35 * scaleFac, height / 2 - rectS * scaleFac / 2 + 35 * scaleFac)
            textSize(150 * scaleFac);
            text(seconds, width / 2, height / 2);
            textSize(25 * scaleFac);
            text("SECONDS", width / 2, height / 2 + 88.5 * scaleFac);
            textSize(20 * scaleFac);
            //fill(30,55,70,255/2+sin(fR*3)*255/2);
            //var asd = (height/2-225*scaleFac*3/2+225*scaleFac)/2;
            var asd = height / 2 - 88.5 * scaleFac;
            //var dsa = (height-(height/2+225*scaleFac/2+5,225*scaleFac))/2;
            //text("TAP TO RETRY",width/2,height-asd+5);
            fill(30, 55, 70, recordTxtF);
            recordTxtF = 255 / 2 + sin(fR * 3) * 255 / 2;
            if (recordTxtF < 1) {
                recordTxt = !recordTxt;
            }
            textSize(15 * scaleFac);
            if (recordTxt) {
                text("World Record : " + WR, width / 2, asd);
            } else {
                text("Personal Record : " + PR, width / 2, asd);
            }
            var t = transition;
            if (mouse.over(width / 2 - rectS * textFactor * scaleFac / 2 + rectS * textFactor * scaleFac + 2 * scaleFac, height / 2 - rectS * scaleFac / 2, 70 * scaleFac, 70 * scaleFac)) {
                cursor(HAND);
                if (mouse.clicked) {
                    pagerPos = 0;
                    t.to = 2;
                    t.toC = width + height + 20;
                    toastF = 255;
                    toastToF = 255;
                    toastToT = 5;
                    toast = "CLICK AND HOLD TO SEPERATE THE SNAKES\nCATCH THE BLUE. AVOID THE RED.";
                    secondTime = true;
                    powerUp.up = 0;
                    powerUp.down = 0;
                    counter = {
                        up: 0,
                        down: 0
                    };
                    counterTo = {
                        up: 0,
                        down: 0
                    };
                    net = {
                        up: 0 - height / 2,
                        down: height
                    };
                    netTo = {
                        up: -height / 2,
                        down: height
                    };
                    spike = {
                        up: false,
                        down: false
                    };
                    powerUpAnimTo = {
                        up: 0,
                        down: 0
                    };
                    powerUpAnim = {
                        up: 0,
                        down: 0
                    };
                    helpFade=255;
                }
            } else if (mouse.clicked) {
                t.to = 3;
                t.toC = width + height + 20;
                toastF = 255;
                toastToF = 255;
                toastToT = 5;
                toast = "CLICK AND HOLD TO SEPERATE THE SNAKES\nCATCH THE BLUE. AVOID THE RED.";
                secondTime = true;
                powerUp.up = 0;
                powerUp.down = 0;
                counter = {
                    up: 0,
                    down: 0
                };
                counterTo = {
                    up: 0,
                    down: 0
                };
                net = {
                    up: 0 - height / 2,
                    down: height
                };
                netTo = {
                    up: -height / 2,
                    down: height
                };
                spike = {
                    up: false,
                    down: false
                };
                powerUpAnimTo = {
                    up: 0,
                    down: 0
                };
                powerUpAnim = {
                    up: 0,
                    down: 0
                };
            }
            if (t.c > width + height - 10 && t.toC === width + height + 20) {
                seconds = 0;
                gameOver = false;
                endTimer = 0;
            }
        };
        draw = function() {
          mouseX=mousePos.x;
          mouseY=mousePos.y;
            mouse.clicked=isMouseClicked;
            cursor(ARROW);
            //println(5);
            fR++;
            switch (page) {
                case 3:
                    game();
                    break;
                case 4:
                    end();
                    break;
                case 2:
                    help();
                    break;
                case 1:
                    home();
                    break;
                case 0:
                    load();
                    break;
            }
            mouse.clicked = false;
            isMouseClicked = false;
            var t = transition;
            fill(BLACK);
            noStroke();
            triangle(0, 0, t.c, 0, 0, t.c);
            t.c += (t.toC - t.c) / 10;
            if (t.toC === width + height + 20 && t.c > width + height + 18) {
                t.toC = 0;
                page = t.to;
            } else if (t.c < 2) {
                t.c = 0;
            }
        };

    }
    if (typeof draw !== 'undefined') processing.draw = draw;
});
