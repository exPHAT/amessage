document.addEventListener("deviceready", onDeviceReady, false);

var myApp;
var db;

var currentPhone = "~~~~~";
var currentFirst = ":O ????";
var authKey;

var clickedRow = -1;

function getCurrentPhone() {
  return currentPhone;
}

$(".navbar").hide();

$("ul").click(function (e) {
  clickedRow = Math.floor(((e.clientY-$(".navbar").height())+Math.abs($("ul").offset().top)-86)/$($("ul li")[0]).height());
  $row = $($("li")[clickedRow]);
  currentPhone = $row.find(".hidden-phone").text();
  currentFirst = $row.find(".item-title").text().split(" ")[0];
});

$(".back").click(function () {
  currentPhone = "~~~~~";
  currentFirst = ":O ????";
  myApp.sizeNavbars('.view-main');
});

$(".icon-bars").click(function() {

  // Prompt becuase I am lazy as fuck
  var name = prompt("Enter a name");
  var number = prompt("Enter a phone number");

  var time = (new Date()).toLocaleTimeString();
  if (name && number) {
    db.transaction(function (tx) {
      tx.executeSql('INSERT INTO convos VALUES (?,?,?)',[0,name, number]);
      tx.executeSql('INSERT INTO messages VALUES (?,?,?,?,?)',[0,number,"Starting Message!",0,time]);
    });
    populateTiles(name, number, "Starting Message!", time.split(":").slice(0, 2).join(":"));
  }
});

// Cordova is ready
function onDeviceReady() {
  myApp = new Framework7();
  var mainView = myApp.addView('.view-main', {
    dynamicNavbar: true
  });

  var $$ = Dom7;
  
  var conversationStarted = false;

  var socket = io.connect("http://exphat.com:1338");

  if (!window.localStorage.getItem("key")) {
    $$(".req-log-in").on("click", function () {
      socket.on("login", function (key) {
        if (key) {
          window.localStorage.setItem("key", key);
          myApp.closeModal($(".login-screen"));
        } else {
          myApp.alert("Username or Password Incorrect!", "Error!");
        }
      });
      socket.emit("login", {
        email:$("input[name='email']").val(),
        password:$("input[name='password']").val()
      });
    });
    myApp.loginScreen();
  }
  else {
    $(".navbar").show();
    myApp.sizeNavbars('.view-main');
    authKey = window.localStorage.getItem("key");
    socket.emit("auth", authKey);
    socket.on("recieve", function (data) {
      if (data.from == getCurrentPhone()) {
        myApp.addMessage({
          text: data.message,
          type: 'received',
          day: !conversationStarted ? 'Today' : false,
          time: !conversationStarted ? (new Date()).getHours() + ':' + (new Date()).getMinutes() : false
        });
        conversationStarted = true;
      }
      db.transaction(function (tx) {
        tx.executeSql("SELECT max(id) AS id FROM messages WHERE frm=?", [data.from], function (tx, res) {
          tx.executeSql("INSERT INTO messages VALUES (?,?,?,?,?)", [
            res.rows.item(0).id + 1,
            data.from,
            data.message,
            0,
            (new Date()).toLocaleTimeString()
          ]);
        });
      });
      myApp.updateMessagesLayout($(".messages-content"));
    });

    db = window.sqlitePlugin.openDatabase({
      name: "my.db"
    });

    db.transaction(function (tx) {
      tx.executeSql('CREATE TABLE IF NOT EXISTS convos (id int, name varchar, frm varchar)');
      tx.executeSql('CREATE TABLE IF NOT EXISTS messages (id int, frm varchar, message varchar, sent int, time varchar)');

      tx.executeSql("SELECT * FROM convos", [], function (tx, res) {
        var iC = 0;
        for (var i = 0; i < res.rows.length; i++) {
          var lastMsg = "";
          tx.executeSql("SELECT * FROM messages WHERE frm like ? ORDER BY id DESC LIMIT 1", [res.rows.item(i).frm], function (tx, rez) {
            populateTiles(res.rows.item(iC).name,
              res.rows.item(iC).frm,
              rez.rows.item(0).message,
              rez.rows.item(0).time.split(":").slice(0, 2).join(":")
            );
            iC++;
          });
        }
      });
    });
    myApp.onPageInit('about', function (page) {
      db.transaction(function (tx) {
        tx.executeSql("SELECT * FROM messages WHERE frm=?", [currentPhone], function (tx, res) {
          for (var i = 0; i < res.rows.length; i++)
          populateMessages(message(res.rows.item(i).message, res.rows.item(i).sent));
        });
      });

      $(".message-view-title").text(currentFirst);
      myApp.sizeNavbars('.view-main');

      var $$ = Dom7;

      // Handle message
      $$('.messagebar .link').on('click', function () {
        var textarea = $$('.messagebar textarea');
        var messageText = textarea.val().trim();

        if (messageText.length === 0) return;

        // Empty textarea
        textarea.val('').trigger('change');

        // Random message type
        myApp.addMessage({
          text: messageText,
          type: 'sent',
          day: !conversationStarted ? 'Today' : false,
          time: !conversationStarted ? (new Date()).getHours() + ':' + (new Date()).getMinutes() : false
        });
        myApp.updateMessagesLayout($(".messages-content"));
        var toSend = {
          key: authKey,
          to: currentPhone,
          message: messageText
        };

        socket.emit("send", toSend);
        conversationStarted = true;

        db.transaction(function (tx) {
          tx.executeSql("SELECT max(id) AS id FROM messages WHERE frm=?", [currentPhone], function (tx, res) {
            tx.executeSql("INSERT INTO messages VALUES (?,?,?,?,?)", [
              res.rows.item(0).id + 1,
              currentPhone,
              messageText,
              1,
              (new Date()).toLocaleTimeString()]
            );
          });
        });

      });
    });
  }
}

function message(message, sent) {
  var html = '<div class="message message-'+(sent ? "sent" : "received")+'"><div class="message-text">'+message+'</div></div>';
  return html;
}

function populateTiles(name, phone, preview, time) {
  $ul = $('.pages .page ul');
  var html = '<li class="swipeout"><a href="about.html" class="item-link convo">' +
    '<div class="swipeout-content"><div class="item-content item-link">' +
    '<div class="item-inner"><div class="item-title-row"><div class="item-title">' + name +
    '</div><div class="hidden-phone">' + phone + '</div><div class="item-after">' + time +
    '</div></div><div class="item-text">' + preview + '</div></div></div></div></a>' +
    '<div class="swipeout-actions-right"><a class="swipeout-delete">Delete</a></div></li>';
  $ul.html($ul.html() + html);
}

function populateMessages(toAdd) {
  $messages = $('.messages');
  $messages.html($messages.html() + toAdd);
  myApp.updateMessagesLayout($(".messages-content"));
}
window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
    alert("Error occured: " + errorMsg);//or any message
    return false;
}