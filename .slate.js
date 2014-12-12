/* File: slate.example.js
 * Author: lunixbochs (Ryan Hileman)
 * Project: http://github.com/lunixbochs/reslate
 */

S.src('.reslate.js');
// enable to see debug messages in Console.app
$.debug = true;

slate.alias('hyper', 'ctrl;alt;cmd');

// begin config
slate.configAll({
    defaultToCurrentScreen: true,
    nudgePercentOf: 'screenSize',
    resizePercentOf: 'screenSize',
    undoOps: [
        'active-snapshot',
        'chain',
        'grid',
        'layout',
        'move',
        'resize',
        'sequence',
        'shell',
        'push'
    ]
});
var pushTop = slate.operation("push", {
  "direction" : "top",
  "style" : "bar-resize:screenSizeY/2"
});
var pushBottom = slate.operation("push", {
  "direction" : "down",
  "style" : "bar-resize:screenSizeY/2"
});

var pushedLeft = function(win) {
  if (!win) {
    return false;
  }
  var winRect = win.rect();
  var screen = win.screen().visibleRect();
 
  if (winRect.x === screen.x &&
      winRect.y === screen.y &&
      winRect.width === screen.width/2 &&
      winRect.height === screen.height
    ) {
    return true;
  }
  return false;
};

var pushRight = slate.operation("push", {
  "direction": "right",
  "style": "bar-resize:screenSizeX/2"
});
 
var pushLeft = slate.operation("push", {
  "direction": "left",
  "style": "bar-resize:screenSizeX/2"
});
 
var throwNextLeft = slate.operation("throw", {
  "width": "screenSizeX/2",
  "height": "screenSizeY",
  "screen": "next"
});
 
var throwNextRight = slate.operation("throw", {
  "x": "screenOriginX+(screenSizeX)/2",
  "y": "screenOriginY",
  "width": "screenSizeX/2",
  "height": "screenSizeY",
  "screen": "next"
});
 
var fullscreen = slate.operation("move", {
  "x" : "screenOriginX",
  "y" : "screenOriginY",
  "width" : "screenSizeX",
  "height" : "screenSizeY"
});
 
var throwNextFullscreen = slate.operation("throw", {
  "x": "screenOriginX",
  "y": "screenOriginY",
  "width": "screenSizeX",
  "height": "screenSizeY",
  "screen": "next"
});
 
var throwNext = function(win) {
  if (!win) {
    return;
  }
  var winRect = win.rect();
  var screen = win.screen().visibleRect();
 
  var newX = (winRect.x - screen.x)/screen.width+"*screenSizeX+screenOriginX";
  var newY = (winRect.y - screen.y)/screen.height+"*screenSizeY+screenOriginY";
  var newWidth = winRect.width/screen.width+"*screenSizeX";
  var newHeight = winRect.height/screen.height+"*screenSizeY";
  var throwNext = slate.operation("throw", {
    "x": newX,
    "y": newY,
    "width": newWidth,
    "height": newHeight,
    "screen": "next"
  });
  win.doOperation(throwNext);
};
 
var pushedRight = function(win) {
  if (!win) {
    return false;
  }
  var winRect = win.rect();
  var screen = win.screen().visibleRect();
 
  if (winRect.x === screen.x + screen.width/2 &&
      winRect.y === screen.y &&
      winRect.width === screen.width/2 &&
      winRect.height === screen.height
    ) {
    return true;
  }
  return false;
};

var pushedLeft = function(win) {
  if (!win) {
    return false;
  }
  var winRect = win.rect();
  var screen = win.screen().visibleRect();
 
  if (winRect.x === screen.x &&
      winRect.y === screen.y &&
      winRect.width === screen.width/2 &&
      winRect.height === screen.height
    ) {
    return true;
  }
  return false;
};

// bindings
slate.bindAll({
    alt: {
	cmd: {
            // halves
            'left': [$('center', 'left', 2, 1)],
            'right': [$('center', 'right', 2, 1)],
            'down': [$('barResize', 'left', 1, 2)],
            // 'up': [function(win) { win.doOperation(pushTop); },
	}
    },
    hyper: {
        shift: {
            // edges
            h: [$('barResize', 'left',   3),
                $('center',    'left',   3, 3)],
            j: [$('barResize', 'bottom', 2),
                $('center',    'bottom', 3, 3)],
            k: [$('barResize', 'top',    2),
                $('center',    'top',    3, 3)],
            l: [$('barResize', 'right',  3),
                $('center',    'right',  3, 3)],

            // corners
            y: [$('corner', 'top-left',     3, 2),
                $('corner', 'top-left',     3, 3)],
            i: [$('corner', 'top-right',    3, 2),
                $('corner', 'top-right',    3, 3)],
            b: [$('corner', 'bottom-left',  3, 2),
                $('corner', 'bottom-left',  3, 3)],
            m: [$('corner', 'bottom-right', 3, 2),
                $('corner', 'bottom-right', 3, 3)],

            // centers
            u: [$('center', 'top'),
                $('center', 'top', 3, 3)],
            n: [$('center', 'bottom'),
                $('center', 'bottom', 3, 3)],
            'return': $('center', 'center', 3, 3),
            a: [function(win) { win.doOperation(fullscreen); }],
            // halves
            left: [$('center', 'left', 2, 1)],
            right: [$('center', 'right', 2, 1)],
            down: [function(win) { win.doOperation(pushBottom); }],
            up: [function(win) { win.doOperation(pushTop); }],


        },
        // bars
        h: [$('barResize', 'left',  2),
            $('barResize', 'left',  1.5)],
        j: $('barResize', 'bottom', 2),
        k: $('barResize', 'top',    2),
        l: [$('barResize', 'right', 2),
            $('barResize', 'right', 1.5)],
        // corners
        y: [$('corner', 'top-left'),
            $('corner', 'top-left', 1.5)],
        i: [$('corner', 'top-right'),
            $('corner', 'top-right', 1.5)],
        b: [$('corner', 'bottom-left'),
            $('corner', 'bottom-left', 1.5)],
        m: [$('corner', 'bottom-right'),
            $('corner', 'bottom-right', 1.5)],
        // centers
        u: $('center', 'top'),
        n: $('center', 'bottom'),
        'return': $('center', 'center'),
        // throw to monitor
        '`': ['throw 0 resize',
              'throw 1 resize'],
        '1': $('toss', '0', 'resize'),
        '2': $('toss', '1', 'resize'),
        '3': $('toss', '2', 'resize'),
        // direct focus 
        a: $.focus('Adium'),
        c: $.focus('Google Chrome'),
        s: $.focus('Sublime Text'),
        t: $.focus('Terminal'),
        f: $.focus('Finder'),
        e: $.focus('Sparrow'),
        x: $.focus('X11'),
        p: $.focus('Spotify'),


        // utility functions
        f1: 'relaunch',
        z: 'undo',
        tab: 'hint'
    }
});

slate.bind("left:ctrl,cmd", function(win) {
  if (!win) {
    return;
  }
  if (pushedLeft(win)) {
    win.doOperation(throwNextLeft);
  } else {
    win.doOperation(pushLeft);
  }
});
