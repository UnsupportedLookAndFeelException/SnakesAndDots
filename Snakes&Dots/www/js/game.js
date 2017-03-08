preventDefault();
    var canvas = document.getElementById("canvas");
  
    function getWindowWidth() {
      return Math.max(
        document.documentElement.clientWidth,
        window.innerWidth || 0);
    }
    function getWindowHeight() {
      return Math.max(
        document.documentElement.clientHeight,
        window.innerHeight || 0);
    }
    var size = {
      width: getWindowWidth(),
      height: getWindowHeight()
    }
    var processing = new Processing(canvas, function(processing) {
        //processing.size(800,400); // minX = 200   minY = 300 iphone=(1920/3, 1080/3)
        processing.size(window.innerWidth,window.innerHeight);
        processing.background(0xFFF);

        var mouseIsPressed = false;
        processing.mousePressed = function () { mouseIsPressed = true; };
        processing.mouseReleased = function () { mouseIsPressed = false; };

        var keyIsPressed = false;
        processing.keyPressed = function () { keyIsPressed = true; };
        processing.keyReleased = function () { keyIsPressed = false; };

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
        processing.rotate = function (angle) {
            rotateFn(processing.radians(angle));
        };
        processing.sin = function (angle) {
            return Math.sin(processing.radians(angle));
        };
        processing.cos = function (angle) {
            return Math.cos(processing.radians(angle));
        };
        processing.arc = function (x,y,w,h,a1,a2) {
            arcFn(x,y,w,h,processing.radians(a1),processing.radians(a2));
        };

        with (processing) {
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
            frameRate(60);
            var page = 0;
            textAlign(CENTER,CENTER);
            textFont(createFont("Century Gothic Bold"));
            var mouse = {
              over : function(x,y,w,h) {
                return mouseX>x&&mouseX<x+w&&mouseY>y&&mouseY<y+h;
              }
            },keys = {};
            var BLACK = color(30,55,70),
                RED = color(240,95,80),
                BLUE = color(100,215,215);
            var WR = 210;
            var PR = 0;
            var POWERUP_SPAWN_CHANCE = 60;
            var transition = {
                c : 0,
                toC : 0,
                to : 0
            };
            var longestSide = (width>height?width:height);
            var screenshot;
            var secondTime = false;
            var fR = 0;
            var imgCount = 0;
            var blueDot;
            var redDot;
            var powerHex;
            var stripes;
            var pY = 0;
            var pA = 0;
            var lineL = [], lineL2 = [];
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
            var POWERUPS = ["Nothing","Magnet","Safety Net","Invincibility","Booster","Shield","Spike"];
            var poly = function(x,y,sides,radius,rot) {
                beginShape();
                var degreesPerSide = 360/sides;
                for(var i = 1; i <= sides; i++) {
                    vertex(x+cos(degreesPerSide*i+rot)*radius,y+sin(degreesPerSide*i+rot)*radius);
                }
                endShape(CLOSE);
            };
            var powerUp = {up:0,down:0};
            var powerUpTimer = {up:0,down:0};
            var counter = {up:0,down:0};
            var counterTo = {up:0,down:0};
            var net = {up:0-height/2,down:height};
            var netTo = {up:-height/2,down:height};
            var spike = {up:false,down:false};
            var scaleFactor = sqrt(sq(width)+sq(height))/sqrt(sq(width*400/height)+sq(height*400/width));
            var powerUpAnim = {up:0,down:0};
            var powerUpAnimTo = {up:0,down:0};
            var helpFade = 255;
            var pagerPos = 0;
            var pagerPages = [{
              img : redDot,
              title : "Red Dots",
              text : "Must be avoided as\nthey can cause an\ninstant death to\nboth snakes"
            },{
              img : blueDot,
              title : "Blue Dots",
              text : "Must be caught before\nthey exit across the\nleft side of the screen"
            },{
              img : blueDot,
              title : "Powerups",
              text : "Look like blue hexagons but\ndon't have to be caught.\nThe following are a list\nof various powerups."
            },{
              img : powerHex,
              title : "Magnet",
              text : "Catches blue dots farther\naway from the snake"
            },{
              img : powerHex,
              title : "Safety Net",
              text : "Catches blue dots before\nthey exit across the\nleft side of the screen"
            },{
              img : powerHex,
              title : "Invincibility",
              text : "Protects the snake from\nall red dots"
            },{
              img : powerHex,
              title : "Booster",
              text : "Increases the\nsnake's speed"
            },{
              img : powerHex,
              title : "Shield",
              text : "Protects the front of\nthe snake's head"
            },{
              img : powerHex,
              title : "Spike",
              text : "Protects the snake against\none red dot before\ndisintegrating"
            }];
            var scoreS = 40;
            var scoreSTo = 40;
            var load = function() {
                background(0,0,0,0);
                switch(imgCount) {
                    case 0 :
                        for(var i = 0; i < 50; i ++) {
                            lineL.push(0);
                        }
                        for(var i = 0; i < 50; i ++) {
                            lineL2.push(0);
                        }
                        break;
                    case 1:
                        strokeWeight(5*scaleFactor);
                        stroke(BLACK);
                        fill(BLUE);
                        ellipse(35*scaleFactor/2,35*scaleFactor/2,30*scaleFactor,30*scaleFactor);
                        fill(BLACK);
                        ellipse(35*scaleFactor/2,35*scaleFactor/2,10*scaleFactor,10*scaleFactor);
                        noStroke();
                        blueDot=get(0,0,35*scaleFactor,35*scaleFactor);
                        break;
                    case 2:
                        strokeWeight(5*scaleFactor);
                        stroke(BLACK);
                        fill(RED);
                        ellipse(35*scaleFactor/2,35*scaleFactor/2,30*scaleFactor,30*scaleFactor);
                        fill(BLACK);
                        ellipse(35*scaleFactor/2,35*scaleFactor/2,10*scaleFactor,10*scaleFactor);
                        noStroke();
                        redDot=get(0,0,35*scaleFactor,35*scaleFactor);
                        break;
                    case 3:
                        strokeWeight(10*scaleFactor);
                        stroke(0,0,0,20);
                        for(var i = 0; i < width+height; i+=20*scaleFactor) {
                            line(i,0,0,i);
                        }
                        stripes=get(0,0,width+height,height);
                        break;
                    case 4:
                        strokeWeight(5*scaleFactor);
                        stroke(BLACK);
                        fill(BLUE);
                        poly(43*scaleFactor/2,43*scaleFactor/2,6,19*scaleFactor,0);
                        //ellipse(43*scaleFactor/2,43*scaleFactor/2,38*scaleFactor,38*scaleFactor);
                        fill(BLACK);
                        poly(43*scaleFactor/2,43*scaleFactor/2,6,7*scaleFactor,0);
                        //ellipse(43*scaleFactor/2,43*scaleFactor/2,10*scaleFactor,10*scaleFactor);
                        noStroke();
                        powerHex=get(0,0,43*scaleFactor,43*scaleFactor);
                        break;
                    case 5:
                        fill(255,225,100);
                        var lFactor = 5.4*scaleFactor;
                        rect(0,0,width,height);
                        pushStyle();
                        image(stripes,0,0);
                        stroke(BLACK);
                        strokeWeight(15*lFactor);
                        //line(35*lFactor/2,35*lFactor/2,width-35*lFactor/2,height-35*lFactor/2);
                        line(35*lFactor/2,height-35*lFactor/2,width-35*lFactor/2,35*lFactor/2);
                        strokeWeight(5*lFactor);
                        stroke(BLACK);
                        //line(width,0,0,height);
                        fill(RED);
                        ellipse(35*lFactor/2,35*lFactor/2,30*lFactor,30*lFactor);
                        fill(BLACK);
                        ellipse(35*lFactor/2,35*lFactor/2,10*lFactor,10*lFactor);
                        noStroke();
                        strokeWeight(5*lFactor);
                        stroke(BLACK);
                        //line(width,0,0,height);
                        fill(BLUE);
                        ellipse(width-35*lFactor/2,height-35*lFactor/2,30*lFactor,30*lFactor);
                        fill(BLACK);
                        ellipse(width-35*lFactor/2,height-35*lFactor/2,10*lFactor,10*lFactor);
                        noStroke();
                        fill(30,55,70);
                        noStroke();
                        ellipse(width-35*lFactor/2,35*lFactor/2,35*lFactor,35*lFactor);
                        ellipse(35*lFactor/2,height-35*lFactor/2,35*lFactor,35*lFactor);
                        fill(255,255,255,25);
                        ellipse(width-35*lFactor/2,35*lFactor/2,25*lFactor,25*lFactor);
                        ellipse(35*lFactor/2,height-35*lFactor/2,25*lFactor,25*lFactor);
                        ellipse(width-35*lFactor/2,35*lFactor/2,15*lFactor,15*lFactor);
                        ellipse(35*lFactor/2,height-35*lFactor/2,15*lFactor,15*lFactor);
                        popStyle();
                        page=1;
                        break;
                }
                if(imgCount<5) {
                  imgCount++;
                  background(255,255,255);
                }
            };
            var pattern = function(y) {
                strokeWeight(8*scaleFactor);
                strokeCap(PROJECT);
                for(var i = 0; i < width; i+=40*scaleFactor) { // y = 350
                    stroke(30,55,70);
                    line(i,y,i+20*scaleFactor,y+20*scaleFactor);
                    line(i+20*scaleFactor,y+20*scaleFactor,i+40*scaleFactor,y);
                    line(i,y-20*scaleFactor,i+20*scaleFactor,y);
                    line(i+20*scaleFactor,y,i+40*scaleFactor,y-20*scaleFactor);
                    stroke(100,215,215);
                    line(i,y-10*scaleFactor,i+20*scaleFactor,y+10*scaleFactor);
                    stroke(240,95,80);
                    line(i+20*scaleFactor,y+10*scaleFactor,i+40*scaleFactor,y-10*scaleFactor);
                }
            };
            var home = function() {
                background(255,225,100);
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
                strokeWeight(10*scaleFactor);
                stroke(0,0,0,20);
                for(var i = 0; i < longestSide*2; i+=20*scaleFactor) {
                    line(i+fR/6%20,0,0,i+fR/6%20);
                }
                resetMatrix();
                //translate(0,-20);
                pattern(height/2+55*scaleFactor);
                fill(30,55,70);
                noStroke();
                //println(mouseX+","+mouseY);
                textSize(125*scaleFactor);
                var shift=-0;
                //text("FACTORY",width/2-shift,150);
                text("S",width/2-185*scaleFactor+shift,height/2-90*scaleFactor);
                text("N",width/2-115*scaleFactor+shift,height/2-90*scaleFactor);
                text("A",width/2-30*scaleFactor+shift,height/2-90*scaleFactor);
                text("K",width/2+50*scaleFactor+shift,height/2-90*scaleFactor);
                text("E",width/2+120*scaleFactor+shift,height/2-90*scaleFactor);
                text("S",width/2+185*scaleFactor+shift,height/2-90*scaleFactor);
                textSize(50*scaleFactor);
                text("& D O T S",width/2,height/2-10*scaleFactor);
                pushStyle();
                rectMode(CENTER);
                rect(width/2,height/2+130*scaleFactor,210*scaleFactor,50*scaleFactor,5*scaleFactor);
                popStyle();
                textSize(137*scaleFactor);
                fill(0,0,0,100);
                text("S",width/2-185*scaleFactor+shift,height/2-90*scaleFactor);
                text("N",width/2-115*scaleFactor+shift,height/2-90*scaleFactor);
                text("A",width/2-30*scaleFactor+shift,height/2-90*scaleFactor);
                text("K",width/2+50*scaleFactor+shift,height/2-90*scaleFactor);
                text("E",width/2+120*scaleFactor+shift,height/2-90*scaleFactor);
                text("S",width/2+185*scaleFactor+shift,height/2-90*scaleFactor);
                textSize(52*scaleFactor);
                text("& D O T S",width/2,height/2-10*scaleFactor);
                pushStyle();
                rectMode(CENTER);
                rect(width/2,height/2+130*scaleFactor,215*scaleFactor,55*scaleFactor,5*scaleFactor);
                popStyle();
                fill(255,225,100);
                textSize(30*scaleFactor);
                text("TAP TO PLAY",width/2,height/2+130*scaleFactor);
                //ellipse(width/2+105+shift,173,20,20);
                stroke(30,55,70);
                strokeWeight(10*scaleFactor);
                noFill();
                //ellipse(width/2+105+shift,173,45+sin(fR*3)*10,45+sin(fR*3)*10);
                textSize(40);
                //text("O",width/2+45.5+shift,150);
                pushStyle();
                var t = transition;
                if(mouse.clicked) {
                    t.to=2;
                    t.toC=width+height+20;
                }
            };
            var help = function() {
                //background(255,225,100);
                helpFade+=(0-helpFade)/60;
                background(BLACK);
                var t = transition;
                if(mouse.over(width/2+340*scaleFactor/2,height/2-20*scaleFactor,30*scaleFactor,40*scaleFactor)) {
                  cursor(HAND);
                  if(mouse.clicked) {
                    if(pagerPos+1===pagerPages.length) {
                      pagerPos=0;
                    } else {
                      pagerPos++;
                    }
                  }
                } else if(mouse.over(width/2-400*scaleFactor/2,height/2-20*scaleFactor,30*scaleFactor,40*scaleFactor)) {
                  cursor(HAND);
                  if(mouse.clicked) {
                    if(pagerPos-1===-1) {
                      pagerPos=pagerPages.length-1;
                    } else {
                      pagerPos--;
                    }
                  }
                } else if(mouse.clicked) {
                    t.to=3;
                    t.toC=width+height+20;
                }
                pushStyle();
                stroke(255);
                line(width/2+360*scaleFactor/2,height/2-10*scaleFactor,width/2+380*scaleFactor/2,height/2);
                line(width/2+380*scaleFactor/2,height/2,width/2+360*scaleFactor/2,height/2+10*scaleFactor);
                line(width/2-360*scaleFactor/2,height/2-10*scaleFactor,width/2-380*scaleFactor/2,height/2);
                line(width/2-380*scaleFactor/2,height/2,width/2-360*scaleFactor/2,height/2+10*scaleFactor);
                rectMode(CENTER);
                rect(width/2,height/2,300*scaleFactor,200*scaleFactor);
                popStyle();
                var pagerSlide = pagerPages[pagerPos];
                fill(255);
                textSize(40*scaleFactor);
                text(pagerSlide.title,width/2,height/2-60*scaleFactor);
                textSize(20*scaleFactor);
                text(pagerSlide.text,width/2,height/2+20*scaleFactor);
                text("TAP TO CONTINUE",width/2,height-40*scaleFactor);
                text("INSTRUCTIONS "+(pagerPos+1)+"/"+pagerPages.length,width/2,40*scaleFactor);
                fill(35,55,70,helpFade);
                rect(0,0,width,height);
            };
            var game = function() {
                background(255,225,100);
                var fixture = {up:"nothing",down:"nothing"};
                powerUpAnim.up+=(powerUpAnimTo.up-powerUpAnim.up)/8;
                powerUpAnim.down+=(powerUpAnimTo.down-powerUpAnim.down)/8;
                var t = transition, powerUpSpawned = false; // true when a power up is on screen
                if(gameOver) {
                    if(fR%60===0) {
                        //seconds-=1;
                    }
                    if(endTimer>25) {
                        t.to=4;
                        t.toC=width+height+20;
                    }
                    endTimer++;
                    fR--;
                }
                fill(30,55,70,210);
                rect(0,0,counter.up,height/40);
                rect(0,height-height/40,counter.down,height/40);
                counter.up+=(counterTo.up-counter.up)/(5);
                counter.down+=(counterTo.down-counter.down)/(5);
                if(powerUp.up>0) {
                    fixture.up=POWERUPS[powerUp.up];
                    //fixture.up=3;
                }
                if(powerUp.down>0) {
                    fixture.down=POWERUPS[powerUp.down];
                    //fixture.down=3;
                }
                strokeWeight(13*scaleFactor);
                stroke(0,0,0,20);
                /*for(var i = 0; i < 800; i+=20) {
                    line(i-fR*3%20,0,0,i-fR*3%20);
                }*/
                image(stripes,-(fR*3*scaleFactor)%(20*scaleFactor),0,width+height+30*scaleFactor,height);
                //image(stripes,width-(fR*3*scaleFactor)%(20*scaleFactor),0);
                //println(lineL.length+","+lineL2.length+","+obstacles.length);
                stroke(30,55,70);
                strokeWeight(15*scaleFactor);
                strokeCap(ROUND);
                var snakeSmoothness= (150*scaleFactor)/lineL.length;
                for(var i = 0, lLen = lineL.length; i < lLen; i+=1) {
                    if(i<lLen-3) {
                        bezier(i*snakeSmoothness,height/2+lineL[i],(i*snakeSmoothness)+snakeSmoothness,height/2+lineL[i+1],i*snakeSmoothness,height/2+lineL[i+2],(i*snakeSmoothness)+snakeSmoothness,height/2+lineL[i+3]);
                    }
                    if(i>=1&&!gameOver) {
                        var val = lineL[i];
                        lineL[i-1]=val;
                        var val = lineL2[i];
                        lineL2[i-1]=val;
                    }
                    bezier(i*snakeSmoothness,height/2+lineL2[i],(i*snakeSmoothness)+snakeSmoothness,height/2+lineL2[i+1],i*snakeSmoothness,height/2+lineL2[i+2],(i*snakeSmoothness)+snakeSmoothness,height/2+lineL2[i+3]);
                }
                lineL2[lineL2.length-1]=-pY;
                lineL[lineL.length-1]=pY;
                fill(30,55,70);
                noStroke();
                ellipse(150*scaleFactor,height/2+pY,35*scaleFactor,35*scaleFactor);
                ellipse(150*scaleFactor,height/2-pY,35*scaleFactor,35*scaleFactor);
                fill(255,255,255,25);
                ellipse(150*scaleFactor,height/2+pY,25*scaleFactor,25*scaleFactor);
                ellipse(150*scaleFactor,height/2-pY,25*scaleFactor,25*scaleFactor);
                ellipse(150*scaleFactor,height/2+pY,15*scaleFactor,15*scaleFactor);
                ellipse(150*scaleFactor,height/2-pY,15*scaleFactor,15*scaleFactor);
                // Draw Powerups
                if(fixture.up==="Booster"||fixture.down==="Booster") {
                    fill(0,0,0,50);
                    var aksldkfja = sin(fR*30)*10;
                    ellipse(150*scaleFactor,height/2-pY,(45+aksldkfja)*scaleFactor*powerUpAnim.up,(45+aksldkfja)*scaleFactor*powerUpAnim.up);
                    ellipse(150*scaleFactor,height/2+pY,(45+aksldkfja)*scaleFactor*powerUpAnim.down,(45+aksldkfja)*scaleFactor*powerUpAnim.down);
                    //triangle(150,height/2-pY,150-22,height/2-pY+22,150+22,height/2-pY+22);
                }
                switch(fixture.up) {
                    case "Magnet" :
                        fill(0,0,0,40);
                        ellipse(150*scaleFactor,height/2-pY,70*scaleFactor*powerUpAnim.up,70*scaleFactor*powerUpAnim.up);
                        break;
                    case "Shield" :
                        strokeCap(SQUARE);
                        stroke(BLACK);
                        noFill();
                        strokeWeight(5*scaleFactor);
                        for(var i = -90; i < 90; i += 40) {
                            arc(150*scaleFactor,height/2-pY,55*scaleFactor*powerUpAnim.up,55*scaleFactor*powerUpAnim.up,i,i+30);
                        }
                        break;
                    case "Invincibility" :
                        strokeCap(SQUARE);
                        stroke(BLACK);
                        noFill();
                        strokeWeight(5*scaleFactor);
                        for(var i = -90; i < 270; i += 40) {
                            arc(150*scaleFactor,height/2-pY,55*scaleFactor*powerUpAnim.up,55*scaleFactor*powerUpAnim.up,i+fR,i+30+fR);
                        }
                        break;
                    case "Safety Net" :
                        if(powerUpTimer.up>0) {
                          netTo.up=0;
                        }
                        break;
                    case "Spike" :
                        if(spike.up) {
                            fill(BLACK);
                            for(var i = 0; i < 360; i += 30) {
                                poly(150*scaleFactor+cos(i+fR)*35*scaleFactor/2,height/2-pY+sin(i+fR)*35*scaleFactor/2,3,6*scaleFactor*powerUpAnim.up,i+fR);
                            }
                        }
                        break;
                }
                switch(fixture.down) {
                    case "Magnet" :
                        fill(0,0,0,40);
                        ellipse(150*scaleFactor,height/2+pY,70*scaleFactor*powerUpAnim.down,70*scaleFactor*powerUpAnim.down);
                        break;
                    case "Shield" :
                        strokeCap(SQUARE);
                        stroke(BLACK);
                        noFill();
                        strokeWeight(5*scaleFactor);
                        for(var i = -90; i < 90; i += 40) {
                            arc(150*scaleFactor,height/2+pY,55*scaleFactor*powerUpAnim.down,55*scaleFactor*powerUpAnim.down,i,i+30);
                        }
                        break;
                    case "Invincibility" :
                        strokeCap(SQUARE);
                        stroke(BLACK);
                        noFill();
                        strokeWeight(5*scaleFactor);
                        for(var i = -90; i < 270; i += 40) {
                            arc(150*scaleFactor,height/2+pY,55*scaleFactor*powerUpAnim.down,55*scaleFactor*powerUpAnim.down,i+fR,i+30+fR);
                        }
                        break;
                    case "Safety Net" :
                        if(powerUpTimer.down>0) {
                          netTo.down=height/2;
                        }
                        break;
                    case "Spike" :
                        if(spike.down) {
                            fill(BLACK);
                            for(var i = 0; i < 360; i += 30) {
                                poly(150*scaleFactor+cos(i+fR)*35*scaleFactor/2,height/2+pY+sin(i+fR)*35*scaleFactor/2,3,6*scaleFactor*powerUpAnim.down,i+fR);
                            }
                        }
                        break;
                }
                // Draw dots
                for(var i = 0, oLen = obstacles.length; i < oLen; i++) {
                    var o = obstacles[i];
                    if(o.t===1) {
                        image(blueDot,o.x-35*scaleFactor/2,o.y-35*scaleFactor/2);
                    } else if(o.t<=4) {
                        image(redDot,o.x-35*scaleFactor/2,o.y-35*scaleFactor/2);
                    } else {
                        powerUpSpawned = true;
                        pushMatrix();
                        translate(o.x,o.y);
                        rotate(-fR);
                        image(powerHex,-43*scaleFactor/2,-43*scaleFactor/2);
                        popMatrix();
                    }
                    noStroke();
                    if(o.t===1&&o.x<150*scaleFactor) {
                        fill(255,225,100,sin(fR*20)*100+50);
                        ellipse(o.x,o.y,35*scaleFactor,35*scaleFactor);
                        if(o.x<-35*scaleFactor/2&&o.j===false) {
                            if(o.y<height/2&&fixture.up==="Safety Net") {
                                o.j=true;
                            } else if(o.y>=height/2&&fixture.down==="Safety Net") {
                                o.j=true;
                            } else {
                                gameOver=true;
                            }
                        }
                    }
                    if(!gameOver) {
                        o.x-=3*scaleFactor;
                    }
                    var span1 = 35*scaleFactor, span2 = 35*scaleFactor;
                    if(o.t===1) {
                        if(fixture.up==="Spike") {
                            span1=41*scaleFactor;
                        }
                        if(fixture.down==="Spike") {
                            span2=41*scaleFactor;
                        }
                        if(fixture.up==="Magnet") {
                            span1 = 70*scaleFactor;
                        } else if(fixture.up==="Shield"||fixture.up==="Invincibility") {
                            span1=55*scaleFactor;
                        }
                        if(fixture.down==="Magnet") {
                            span2 = 70*scaleFactor;
                        } else if(fixture.down==="Shield"||fixture.down==="Invincibility") {
                            span2=55*scaleFactor;
                        }
                    }
                    if(dist(o.x,o.y,150*scaleFactor,height/2+pY)<=span2||dist(o.x,o.y,150*scaleFactor,height/2-pY)<=span1) {
                        if(o.t>4) {
                            o.j=true;
                            if(toastToF===0) {
                                toastToF=255;
                                toast="Power up collected : "+POWERUPS[o.t-4];
                                toastToT=3;
                            }
                            if(o.y<height/2) {
                                powerUp.up=o.t-4;
                                powerUpTimer.up=5;
                                counterTo.up=width;
                                powerUpAnimTo.up=1;
                            } else {
                                powerUpTimer.down=5;
                                powerUp.down=o.t-4;
                                counterTo.down=width;
                                powerUpAnimTo.down=1;
                            }
                            if(POWERUPS[o.t-4]==="Spike") {
                                if(o.y<height/2) {
                                    spike.up=true;
                                } else {
                                    spike.down=true;
                                }
                            }
                        } else if(o.t!==1) {
                            if(o.y<height/2) {
                                if((fixture.up==="Shield"&&o.x>=150*scaleFactor)||fixture.up==="Invincibility"||spike.up) {
                                    o.j=true;
                                    if(spike.up) {
                                        spike.up=false;
                                        powerUpAnimTo.up=0;
                                    }
                                }
                            } else if(o.y>=height/2) {
                                if((fixture.down==="Shield"&&o.x>=150*scaleFactor)||fixture.down==="Invincibility"||spike.down) {
                                    o.j=true;
                                    if(spike.down) {
                                        spike.down=false;
                                        powerUpAnimTo.down=0;
                                    }
                                }
                            }
                            if(!o.j) {
                                gameOver=true;
                            }
                            //screenshot=get(0,0,width,height);
                        } else {
                            if(o.y<height/2&&fixture.up==="Magnet") {
                              o.x+=(150*scaleFactor-o.x)/10;
                              o.y+=(height/2-pY-o.y)/10;
                              if(abs(o.y-(height/2-pY))<0.5) {
                                o.j=true;
                              }
                            } else if(o.y>=height/2&&fixture.down==="Magnet") {
                              o.x+=(150*scaleFactor-o.x)/10;
                              o.y+=(height/2+pY-o.y)/10;
                              if(abs(o.y-(height/2+pY))<0.5) {
                                o.j=true;
                              }
                            } else {
                              o.j = true;
                            }
                        }
                    }
                    if(o.j) {
                        o.y+=o.yAccl;
                        o.yAccl+=1*scaleFactor;
                    }
                    if(o.x<-50) {
                        obstacles.splice(i,1);
                        oLen--;
                        i--;
                    }
                }
                strokeCap(SQUARE);
                stroke(BLACK);
                noFill();
                strokeWeight(10*scaleFactor);
                for(var i = 0; i < -height/2; i += 40*scaleFactor) {
                    line(5,net.up+i,5,net.up+i+30*scaleFactor);
                }
                for(var i = 0; i < height/2; i += 40*scaleFactor) {
                    line(5,net.down+i,5,net.down+i+30*scaleFactor);
                }
                net.up+=(netTo.up-net.up)/5;
                net.down+=(netTo.down-net.down)/5;
                if(t.toC===width+height+20&&t.c>width+height-10) {
                    obstacles=[];
                    lineL=[];
                    lineL2=[];
                    for(var i = 0; i < 50; i ++) {
                        lineL.push(0);
                    }
                    for(var i = 0; i < 50; i ++) {
                        lineL2.push(0);
                    }
                    pY=0;
                }
                if(!gameOver) {
                    pY+=pA;
                    var speed = 3.5*scaleFactor;
                    if(fixture.up==="Booster"||fixture.down==="Booster") {
                        speed = 5*scaleFactor;
                    }
                    if(mouseIsPressed||keys[UP]) {
                        pA+=(speed-pA)/10;
                    } else {
                        pA+=(-speed-pA)/10;
                        if(pY<0) {
                            pY=0;
                            pA=0;
                        }
                    }
                }
                //println(obstacles.length);
                pushStyle();
                //textAlign(LEFT,CENTER);
                textSize(scoreS*scaleFactor);
                scoreS+=(scoreSTo-scoreS)/5;
                fill(30,55,70);
                //seconds=550;
                text(seconds,60*scaleFactor,40*scaleFactor);
                if(seconds%20<1&&seconds>3) {
                  scoreSTo=50;
                } else {
                  scoreSTo=40;
                }
                popStyle();
                textSize(20*scaleFactor);
                fill(30,55,70,toastF);
                text(toast,width/2,height-55*scaleFactor);
                toastF+=(toastToF-toastF)/10;
                if(toastToT<1) {
                    toastToF=0;
                }
                if(fR%60===0&&!gameOver) {
                    //println(powerUpAnim.up+","+powerUpAnim.down);
                    //println((powerUp.up>0?POWERUPS[powerUp.up-1]:"Nothing")+","+(powerUp.down>0?POWERUPS[powerUp.down-1]:"Nothing"));
                    //println(powerUpSpawned);
                    //println(spawn.up+","+spawn.down);
                    if(toastToT>0) {
                        toastToT--;
                    }
                    if(powerUpTimer.up>0) {
                        powerUpTimer.up--;
                        counterTo.up-=width/5;
                        if(powerUpTimer.up===0) {
                          powerUpAnimTo.up=0;
                          counterTo.up=0;
                        }
                        if(powerUpTimer.up===0) {
                          netTo.up=-height/2;
                        }
                    }
                    if(powerUpAnimTo.up===0&&powerUpAnim.up<0.1) {
                      powerUp.up=0;
                      spike.up=false;
                    }
                    if(powerUpTimer.down>0) {
                        powerUpTimer.down--;
                        counterTo.down-=width/5;
                        if(powerUpTimer.down===0) {
                          powerUpAnimTo.down=0;
                          counterTo.down=0;
                        }
                        if(powerUpTimer.down===0) {
                          netTo.down=height;
                        }
                    }
                    if(powerUpAnimTo.down===0&&powerUpAnim.down<0.1) {
                      powerUp.down=0;
                      spike.down=false;
                    }
                    //println(powerUp.up+","+powerUp.down);
                    var y = random(35*scaleFactor,height-35*scaleFactor);
                    var y2 = round(random(1,2))===1?random(35*scaleFactor/2,y-35*scaleFactor):random(y+35*scaleFactor,height-35*scaleFactor/2);
                    var type = round(random(1,4));
                    var type2 = type===1?2:1;//1-Red dot, 2-Blue Dot
                    if(seconds>5&&!powerUpSpawned) { // &&powerUp.up===0&&powerUp.down===0
                        if(type===2) {
                            if(random(0,100)<POWERUP_SPAWN_CHANCE) { // spawn a powerup if one isn't already spawned
                            //println((y<height/2?!spawn.up:!spawn.down)?(y<height/2?!spawn.up:!spawn.down):(spawn.up+","+spawn.down+","+y<height/2));
                            /**
                             * y<height/2?!spawn.up:!spawn.down returns false when spawn.up = true and spawn.down = false
                            **/
                                type=4+round(random(1,POWERUPS.length-1));
                                //type=7;
                                //type=4+8;
                            }
                        } else if(type2===2) {
                            if(random(0,100)<POWERUP_SPAWN_CHANCE) { // spawn a powerup
                            //println(y2<height/2?!spawn.up:!spawn.down+"!");
                                type2=4+round(random(1,POWERUPS.length-1));
                                //type2=7;
                            }
                        }
                    }
                    if(seconds>1||secondTime) {
                        obstacles.push({
                            x:width+120*scaleFactor+random(-0,0),
                            y:y,
                            t:type,
                            yAccl:-7*scaleFactor,
                            j:false
                        });
                        obstacles.push({
                            x:width+210*scaleFactor+random(-0,0),
                            y:y2,
                            t:type2,
                            yAccl:-7*scaleFactor,
                            j:false
                        });
                    }
                    seconds++;
                }
            };
            var end = function() {
                background(255,225,100);
                //seconds=236;
                if(seconds>PR) {
                    PR = seconds;
                }
                stroke(0,0,0,20);
                strokeWeight(10*scaleFactor);
                for(var i = 0; i < longestSide*2; i+=20*scaleFactor) {
                    line(i+fR/4%20*scaleFactor,0,0,i+fR/4%20*scaleFactor);
                }
                //image(screenshot,0,0);
                fill(255,225,100);
                strokeWeight(10*scaleFactor);
                stroke(BLACK);
                //noFill();
                var textFactor = textWidth(seconds)/textWidth("33");
                textFactor=textFactor<=1?1:textFactor;
                var rectS = 275;
                rect(width/2-rectS*textFactor*scaleFactor/2,height/2-rectS*scaleFactor/2,rectS*textFactor*scaleFactor,rectS*scaleFactor);
                rect(width/2-rectS*textFactor*scaleFactor/2+rectS*textFactor*scaleFactor+2*scaleFactor,height/2-rectS*scaleFactor/2,70*scaleFactor,70*scaleFactor);
                fill(BLACK);
                textSize(45*scaleFactor);
                text("?",width/2-rectS*textFactor*scaleFactor/2+rectS*textFactor*scaleFactor+2*scaleFactor+35*scaleFactor,height/2-rectS*scaleFactor/2+35*scaleFactor)
                textSize(150*scaleFactor);
                text(seconds,width/2,height/2);
                textSize(25*scaleFactor);
                text("SECONDS",width/2,height/2+88.5*scaleFactor);
                textSize(20*scaleFactor);
                //fill(30,55,70,255/2+sin(fR*3)*255/2);
                //var asd = (height/2-225*scaleFactor*3/2+225*scaleFactor)/2;
                var asd = height/2-88.5*scaleFactor;
                //var dsa = (height-(height/2+225*scaleFactor/2+5,225*scaleFactor))/2;
                //text("TAP TO RETRY",width/2,height-asd+5);
                fill(30,55,70,recordTxtF);
                recordTxtF = 255/2+sin(fR*3)*255/2;
                if(recordTxtF<1) {
                    recordTxt=!recordTxt;
                }
                textSize(15*scaleFactor);
                if(recordTxt) {
                    text("World Record : "+WR,width/2,asd);
                } else {
                    text("Personal Record : "+PR,width/2,asd);
                }
                var t = transition;
                if(mouse.over(width/2-rectS*textFactor*scaleFactor/2+rectS*textFactor*scaleFactor+2*scaleFactor,height/2-rectS*scaleFactor/2,70*scaleFactor,70*scaleFactor)) {
                  cursor(HAND);
                  if(mouse.clicked) {
                    pagerPos=0;
                    t.to=2;
                    t.toC=width+height+20;
                    toastF=255;
                    toastToF=255;
                    toastToT=5;
                    toast = "CLICK AND HOLD TO SEPERATE THE SNAKES\nCATCH THE BLUE. AVOID THE RED.";
                    secondTime = true;
                    powerUp.up=0;
                    powerUp.down=0;
                    counter = {up:0,down:0};
                    counterTo = {up:0,down:0};
                    net = {up:0-height/2,down:height};
                    netTo = {up:-height/2,down:height};
                    spike = {up:false,down:false};
                    powerUpAnimTo={up:0,down:0};
                    powerUpAnim={up:0,down:0};
                  }
                } else if(mouse.clicked) {
                    t.to=3;
                    t.toC=width+height+20;
                    toastF=255;
                    toastToF=255;
                    toastToT=5;
                    toast = "CLICK AND HOLD TO SEPERATE THE SNAKES\nCATCH THE BLUE. AVOID THE RED.";
                    secondTime = true;
                    powerUp.up=0;
                    powerUp.down=0;
                    counter = {up:0,down:0};
                    counterTo = {up:0,down:0};
                    net = {up:0-height/2,down:height};
                    netTo = {up:-height/2,down:height};
                    spike = {up:false,down:false};
                    powerUpAnimTo={up:0,down:0};
                    powerUpAnim={up:0,down:0};
                }
                if(t.c>width+height-10&&t.toC===width+height+20) {
                    seconds=0;
                    gameOver=false;
                    endTimer=0;
                }
            };
            draw = function() {
                cursor(ARROW);
                //println(5);
                fR++;
                switch(page) {
                    case 0:
                        load();
                        break;
                    case 1 :
                        home();
                        break;
                    case 2:
                        help();
                        break;
                    case 3 :
                        game();
                        break;
                    case 4:
                        end();
                        break;
                }
                mouse.clicked=false;
                
                var t = transition;
                fill(BLACK);
                noStroke();
                triangle(0,0,t.c,0,0,t.c);
                t.c+=(t.toC-t.c)/10;
                if(t.toC===width+height+20&&t.c>width+height+18) {
                    t.toC=0;
                    page=t.to;
                } else if(t.c<2) {
                    t.c=0;
                }
            };
            mouseClicked = function() {
                mouse.clicked=true;
            };
            keyPressed = function() {
                keys[keyCode] = true;
            };
            keyReleased = function() {
                keys[keyCode] = false;
            };

        }
        if (typeof draw !== 'undefined') processing.draw = draw;
    });
