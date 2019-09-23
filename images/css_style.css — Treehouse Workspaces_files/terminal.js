"use strict";

window.addEventListener('load', function() {
  var socket = io.connect();
  var term = null;
  var container = document.getElementById("termcontainer");

  socket.on('connect', function() {
    term = new Terminal({
      cols: 80,
      rows: 24,
      screenKeys: true
    });

    window.term = term;

    term.open(container);

    term.on('data', function(data) {
      socket.emit('data', data);
    });

    term.on('title', function(title) {
      document.title = title;
    });

    doResize();
    setTimeout(doResize, 1000);

  });

  socket.on('data', function(data) {
    term.write(data);
  });

  socket.on('disconnect', function() {
    term.destroy();
  });

  socket.on('resize', function (cols, rows) {
    term.resize(cols, rows)
  });

  window.doResize = function () {
    var dims = measureTerm(term, socket);
    socket.emit('resize', dims.cols, dims.rows);
  }

  window.addEventListener('resize', doResize);

}, false);

function StyleTag(id) {
  id += "style-tag";
  this.tag = document.getElementById(id);
  if (!this.tag) {
    this.tag = document.createElement("STYLE");
    this.tag.setAttribute("id", id);
    document.body.appendChild(this.tag);
  }
}

StyleTag.prototype.set = function (styles) {
  var rules = [], rule, ruleset, prop, selector;
  for (selector in styles) {
    if (styles.hasOwnProperty(selector)) {
      ruleset = styles[selector]
      rule = [selector, "{\n"];
      for (prop in ruleset) {
        if (ruleset.hasOwnProperty(prop)) {
          rule.push(prop, ":", ruleset[prop], ";\n")
        }
      }
      rule.push("}\n");
      rules.push(rule.join(""));
    }
  }
  this.tag.innerHTML = rules.join("\n");
}


var measureTerm = (function () {
  var _testChar = null;

  function getTestChar() {
    if (_testChar) { return _testChar; }

    var tterm = document.createElement('DIV');
    var chr = document.createElement('SPAN');

    tterm.className = 'terminal';
    chr.style.fontWeight = "bold";
    chr.innerHTML = "w";
    tterm.appendChild(chr);
    document.body.appendChild(tterm);

    tterm.style.position = 'absolute';
    tterm.style.left = "-100px";
    _testChar = chr;
    return _testChar;
  }

  return function (term) {
    var testChar = getTestChar();
    var container = term.element.offsetParent;

    return {
      cols:  Math.floor(container.clientWidth / testChar.offsetWidth),
      rows:  Math.floor(container.clientHeight / testChar.offsetHeight)
    };
  };

})();

function toggleFocus() {
  if (document.hasFocus()) {
    document.body.className = "focused"
  } else {
    document.body.className = ""
  }
}
function setCursorColor(color, bg) {
  new StyleTag("cursor-color").set({
    ".focused .reverse-video": {
      "background": bg,
      "color": color
    }
  });
}


window.addEventListener('focus', toggleFocus, false)
window.addEventListener('blur', toggleFocus, false)
setInterval(toggleFocus, 1000);

document.body.style.background = Terminal.colors[256];
setCursorColor(Terminal.colors[257]);


function loadThemeString(themeStr) {
  var theme = ("#" + themeStr.replace(/\|/g, "|#")).split("|");
  if(theme.length != 18) return;

  Terminal.colors.splice.apply(Terminal.colors, [0, 15].concat(theme.slice(0, 15)));
  Terminal.colors[256] = theme[16];
  Terminal.colors[257] = theme[17];
  document.body.style.background = Terminal.colors[256];
  setCursorColor(Terminal.colors[256], Terminal.colors[257]);

}

var m = location.search.match(/theme=([0-9a-f|]+)/i)
if (m && m[1]) loadThemeString(m[1]);



// Font size messages
//

window.addEventListener('message', function (e) {
  var message;
  try {message = JSON.parse(e.data)} catch (e) { return; }

  if (message.type === "font_size_change") {
    adjustFontSize(message.font_size, message.line_height);
  }
}, false);

function adjustFontSize(fontSize, lineHeight) {
  new StyleTag("term-font-size").set({
    "body .terminal": {
      "font-size": fontSize,
      "line-height": lineHeight
    }
  });
  doResize();
}

