/* The racket advisor on the home page.

   Replaces the three-step sourcing strip (2026-11-13, user: 「部分改成咨询
   窗口，大意就是用户输入乒乓球龄，是习惯近台还是中远台，正手体系还是反手
   体系，或正反手均衡等信息，我为客户提供球拍选购建议」). It asks three
   questions — how long you have played, where you play from, which wing you
   rely on — plus an optional notes line, and sends the answers to WhatsApp.

   2026-11-14 (user: 「Grip和Budget for blade and rubbers 不要，只保留其它
   三个，然后不需要你给用户推荐，用户提交时，直接将内容通过whatsapp发送给
   我」): grip and budget went with the on-site recommendation. The submit
   opens the chat with the answers and nothing else; the advice comes back in
   the chat.

   The questions are asked one at a time inside the long box (user: 「将问题
   放在输入框内，让用户一步步做做选择就好了」), each as a dropdown (「将每一个
   问题变成下拉单选」): choosing advances on its own; Back keeps every pick;
   the last screen is the notes line and the send button. A revisited question
   offers Continue, because its dropdown already holds a value. The form is
   swapped for a confirmation, and Change answers brings the first question
   back with the picks intact.

   Only the home page's markup is touched; every selector lives inside the
   advisor card, so this is a no-op on any page without it. */
(function () {
  "use strict";

  var form = document.getElementById("adv-form");
  if (!form) return;

  var result = document.getElementById("adv-result");
  var note = document.getElementById("adv-note");
  var chat = document.getElementById("adv-chat");
  var WHATSAPP = "https://wa.me/8618627156285";

  var LABEL = {
    experience: {
      new: "New to the game",
      improver: "1–3 years",
      club: "3–8 years",
      competitor: "Competing"
    },
    distance: {
      close: "Close to the table",
      mid: "Mid-distance",
      far: "Away from the table"
    },
    wing: {
      fh: "Forehand-dominant",
      bh: "Backhand-dominant",
      both: "Both wings about equally"
    }
  };

  var required = ["experience", "distance", "wing"];
  var screens = Array.prototype.slice.call(form.querySelectorAll(".mg-adv-screen"));
  var back = form.querySelector(".mg-adv-back");
  var next = form.querySelector(".mg-adv-next");
  var submit = form.querySelector(".mg-adv-submit");
  var label = document.getElementById("adv-step-label");
  var fill = document.getElementById("adv-progress-fill");
  var names = [
    "Question 1 of 3 · Your game",
    "Question 2 of 3 · Your game",
    "Question 3 of 3 · Your style",
    "Last step · Anything else?"
  ];
  var current = 0;
  var timer = null;

  function show(index) {
    current = Math.max(0, Math.min(screens.length - 1, index));
    screens.forEach(function (screen, i) {
      screen.hidden = i !== current;
    });
    label.textContent = names[current];
    fill.style.width = Math.round(((current + 1) / screens.length) * 100) + "%";
    back.hidden = current === 0;
    submit.hidden = current !== screens.length - 1;
    /* Continue is for a question already answered and revisited with Back:
       its dropdown already holds a value, so picking it again changes
       nothing and the auto-advance has nothing to fire on. */
    var select = screens[current].querySelector(".mg-adv-select");
    next.hidden = !select || !select.value || current === screens.length - 1;
    note.hidden = true;
    screens[current].setAttribute("tabindex", "-1");
    screens[current].focus({ preventScroll: true });
  }

  /* Choosing in a dropdown is the whole action: the next question follows on
     its own. The short pause lets the choice register before the screen
     changes. */
  function scheduleAdvance() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (current < screens.length - 1) show(current + 1);
    }, 220);
  }

  form.addEventListener("change", function (event) {
    var select = event.target;
    if (!select.classList || !select.classList.contains("mg-adv-select")) return;
    if (!select.value) return;
    scheduleAdvance();
  });

  back.addEventListener("click", function () {
    clearTimeout(timer);
    show(current - 1);
  });

  next.addEventListener("click", function () {
    clearTimeout(timer);
    show(current + 1);
  });

  /* The message is the answers, nothing else: the blade and rubbers are the
     reply's job, not this script's. */
  function whatsappHref(answers) {
    var lines = [
      "Hi, I used the racket advisor on mygear.top.",
      "Experience: " + LABEL.experience[answers.experience],
      "Where I play: " + LABEL.distance[answers.distance],
      "My game: " + LABEL.wing[answers.wing]
    ];
    if (answers.notes) lines.push("Notes: " + answers.notes);
    lines.push("", "Ship to (city / postal code):");
    return WHATSAPP + "?text=" + encodeURIComponent(lines.join("\n"));
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearTimeout(timer);
    var data = new FormData(form);
    var answers = {};
    required.forEach(function (key) {
      answers[key] = data.get(key);
    });
    /* Optional: the notes line may be empty, so it stays out of the required
       list above. */
    answers.notes = String(data.get("notes") || "").trim();

    var missing = required.filter(function (key) {
      return !answers[key];
    });

    if (missing.length) {
      show(required.indexOf(missing[0]));
      note.textContent = "Pick one answer on each line — then I can send it.";
      note.hidden = false;
      return;
    }

    var href = whatsappHref(answers);
    chat.href = href;

    /* A new tab keeps the page where it was; a blocked popup leaves the
       confirmation's own link as the way through. */
    var win = window.open(href, "_blank");
    if (win) {
      try {
        win.opener = null;
      } catch (e) {}
    }

    form.hidden = true;
    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  show(0);

  /* Change answers brings the questions back with the picks still checked. */
  result.addEventListener("click", function (event) {
    if (event.target.closest(".mg-adv-result__again")) {
      clearTimeout(timer);
      result.hidden = true;
      form.hidden = false;
      show(0);
    }
  });
})();
