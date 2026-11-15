"use strict";
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const CLS = {"Лекція":"lec","Практична":"prac","Лабораторна":"lab"};
const SLOTS = ["09:30","11:00","12:50"];
const DAYS = ["Нд","Пн","Вт","Ср","Чт","Пт","Сб"];
const groups = ["ІП-26-4","ІП-26-5"];
const teachers = ["Коваль О.П.","Мельник С.В.","Михайлюк І.Р.","Гобир Л.М.","Крихівський В.Р."];
// d — день тижня (1 = понеділок … 5 = п’ятниця), заняття повторюються щотижня
const lessons = [
  {d:1,t:"09:30",s:"Вища математика",r:"ауд. 1.205",p:"Коваль О.П.",y:"Лекція",g:"ІП-26-4"},
  {d:1,t:"12:50",s:"Англійська мова",r:"ауд. 2.114",p:"Мельник С.В.",y:"Практична",g:"ІП-26-4"},
  {d:2,t:"11:00",s:"Основи програмування",r:"ауд. 1.А12",p:"Михайлюк І.Р.",y:"Лабораторна",g:"ІП-26-4"},
  {d:3,t:"09:30",s:"Фізичне виховання",r:"Збірна група 125",p:"Крихівський В.Р.",y:"Практична",g:"ІП-26-4"},
  {d:3,t:"11:00",s:"UX/UI Дизайн",r:"ауд. 1.412",p:"Гобир Л.М.",y:"Лабораторна",g:"ІП-26-4"},
  {d:3,t:"12:50",s:"Основи програмування",r:"ауд. 1.А12",p:"Михайлюк І.Р.",y:"Лекція",g:"ІП-26-4"},
  {d:4,t:"09:30",s:"Англійська мова",r:"ауд. 2.114",p:"Мельник С.В.",y:"Практична",g:"ІП-26-4"},
  {d:4,t:"12:50",s:"UX/UI Дизайн",r:"ауд. 1.412",p:"Гобир Л.М.",y:"Лабораторна",g:"ІП-26-4"},
  {d:5,t:"11:00",s:"Вища математика",r:"ауд. 1.205",p:"Коваль О.П.",y:"Лекція",g:"ІП-26-4"},
  {d:3,t:"09:30",s:"Вища математика",r:"ауд. 1.205",p:"Коваль О.П.",y:"Лекція",g:"ІП-26-5"},
  {d:3,t:"11:00",s:"Основи програмування",r:"ауд. 1.А12",p:"Михайлюк І.Р.",y:"Лабораторна",g:"ІП-26-5"}
];
const activeTypes = new Set();
const pad = n => String(n).padStart(2, "0");
const fmt = d => `${pad(d.getDate())}.${pad(d.getMonth()+1)}`;

function fillSelects(){
  [$("group"), $("adG")].forEach(sel => {
    const v = sel.value; sel.innerHTML = "";
    groups.forEach(g => sel.add(new Option(g, g)));
    if (v) sel.value = v;
  });
  $("teachers").innerHTML = teachers.map(t => `<option value="${esc(t)}">`).join("");
}

function render(newKey){
  const val = $("date").value, g = $("group").value;
  if (!val){ $("count").textContent = "Оберіть дату, щоб побачити заняття."; $("week").innerHTML = ""; $("list").innerHTML = ""; return; }
  const cur = new Date(val + "T12:00:00");
  const wd = cur.getDay();
  const mon = new Date(cur); mon.setDate(cur.getDate() - ((wd + 6) % 7));
  const fri = new Date(mon); fri.setDate(mon.getDate() + 4);
  const match = l => l.g === g && (!activeTypes.size || activeTypes.has(l.y));
  const week = lessons.filter(match);
  const times = [...new Set([...SLOTS, ...lessons.filter(l => l.g === g).map(l => l.t)])].sort();

  document.querySelector(".h-week").textContent = `Розклад на тиждень · ${fmt(mon)} – ${fmt(fri)}.${fri.getFullYear()} · ${g}`;
  document.querySelector(".h-day").textContent = "Сьогоднішні заняття";
  const todays = week.filter(l => l.d === wd).sort((a,b) => a.t.localeCompare(b.t));
  $("count").textContent = `${fmt(cur)}.${cur.getFullYear()}, група ${g}: занять на цей день — ${todays.length}`;

  // Тижнева сітка (десктоп)
  let h = '<span></span>';
  for (let i = 0; i < 5; i++){
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    const iso = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    h += `<button type="button" class="dayh" data-date="${iso}" aria-pressed="${i+1 === wd}">${DAYS[i+1]} ${fmt(d)}</button>`;
  }
  times.forEach(t => {
    h += `<div class="tm">${t}</div>`;
    for (let d = 1; d <= 5; d++){
      const l = week.find(x => x.d === d && x.t === t);
      h += l ? `<div class="lesson ${CLS[l.y]}${l.k && l.k === newKey ? " new" : ""}" tabindex="0" role="button" aria-expanded="false">
        <div class="subj">${esc(l.s)}</div><div class="meta">${esc(l.r || "—")} · ${esc(l.p || "викладач не вказаний")}</div>
        <div class="kind">${l.y}</div><p class="more">Група ${esc(l.g)} · пара триває 80 хв</p></div>` : '<div class="slot"></div>';
    }
  });
  $("week").style.setProperty("--rows", times.length);
  $("week").innerHTML = h;

  // Список на день (планшет і смартфон)
  $("list").innerHTML = todays.length ? todays.map(l => `<li class="li${l.k && l.k === newKey ? " new" : ""}" tabindex="0" role="button" aria-expanded="false">
      <span class="t">${l.t}</span><span class="info"><span class="subj">${esc(l.s)}</span><br><span class="meta">${esc(l.r || "—")} · ${esc(l.p || "викладач не вказаний")}</span>
      <span class="more">Група ${esc(l.g)} · пара триває 80 хв</span></span>
      <span class="tag ${CLS[l.y]}">${l.y}</span></li>`).join("")
    : '<li class="empty">На цей день занять не знайдено. Змініть дату, групу або тип.</li>';
}

// Пошук і фільтри
$("searchForm").addEventListener("submit", e => { e.preventDefault(); render(); });
["date","group"].forEach(id => $(id).addEventListener("change", () => render()));
document.querySelectorAll(".chip").forEach(c => c.addEventListener("click", () => {
  const on = c.getAttribute("aria-pressed") !== "true";
  c.setAttribute("aria-pressed", on);
  on ? activeTypes.add(c.textContent) : activeTypes.delete(c.textContent);
  render();
}));
$("week").addEventListener("click", e => { const b = e.target.closest(".dayh"); if (b){ $("date").value = b.dataset.date; render(); } });

// Розгортання картки заняття (клік, Enter, Пробіл)
function toggleCard(el){ const o = el.classList.toggle("open"); el.setAttribute("aria-expanded", o); }
[$("week"), $("list")].forEach(box => {
  box.addEventListener("click", e => { const c = e.target.closest(".lesson,.li"); if (c) toggleCard(c); });
  box.addEventListener("keydown", e => { const c = e.target.closest(".lesson,.li"); if (c && (e.key === "Enter" || e.key === " ")){ e.preventDefault(); toggleCard(c); } });
});

// 1. Кнопка, що змінює текст і колір
let remind = false;
$("remindBtn").addEventListener("click", () => {
  remind = !remind;
  const b = $("remindBtn");
  b.setAttribute("aria-pressed", remind);
  b.textContent = remind ? "✓ Нагадування увімкнено" : "🔔 Нагадувати про пари";
  $("remindMsg").textContent = remind ? "Ми нагадаємо про пару за 15 хвилин до початку." : "";
});

// Діалоги
document.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("click", e => { if (e.target === d) d.close(); }));
function check(inp, errEl, text){
  const bad = !inp.value.trim();
  errEl.textContent = bad ? text : "";
  inp.setAttribute("aria-invalid", bad);
  return !bad;
}

// 2. Форма зворотного зв’язку з перевіркою
const openFb = () => { $("fbOk").textContent = ""; $("dlgFb").showModal(); };
$("openFb").addEventListener("click", openFb);
$("openFb2").addEventListener("click", openFb);
$("fbForm").addEventListener("submit", e => {
  e.preventDefault();
  const a = check($("fbName"), $("fbNameE"), "Введіть ваше ім’я."), b = check($("fbMsg"), $("fbMsgE"), "Введіть повідомлення.");
  if (!a || !b){ (a ? $("fbMsg") : $("fbName")).focus(); return; }
  $("fbOk").textContent = `Дякуємо, ${$("fbName").value.trim()}! Повідомлення надіслано.`;
  $("fbForm").reset();
  setTimeout(() => { if ($("dlgFb").open) $("dlgFb").close(); }, 1800);
});
["fbName","fbMsg"].forEach(id => $(id).addEventListener("input", () => { $(id + "E").textContent = ""; $(id).setAttribute("aria-invalid", "false"); }));

// Додавання заняття
$("openAdd").addEventListener("click", () => { $("adG").value = $("group").value; $("dlgAdd").showModal(); });
$("adForm").addEventListener("submit", e => {
  e.preventDefault();
  if (!check($("adS"), $("adSE"), "Вкажіть назву предмета.")) return $("adS").focus();
  const day = new Date($("date").value + "T12:00:00").getDay();
  const k = Date.now();
  lessons.push({d: day >= 1 && day <= 5 ? day : 1, t: $("adTime").value, s: $("adS").value.trim(), r: $("adR").value.trim(),
    p: $("adTe").value.trim(), y: $("adTy").value, g: $("adG").value, k});
  $("group").value = $("adG").value;
  $("adForm").reset(); $("dlgAdd").close(); render(k);
});

// Додавання групи / викладача
let nameMode = "";
function openName(mode){
  nameMode = mode;
  $("nmT").textContent = mode === "group" ? "Додати групу" : "Додати викладача";
  $("nmL").textContent = mode === "group" ? "Назва групи" : "Прізвище та ініціали";
  $("nmV").value = ""; $("nmE").textContent = ""; $("dlgName").showModal();
}
$("openGroup").addEventListener("click", () => openName("group"));
$("openTeacher").addEventListener("click", () => openName("teacher"));
$("nmForm").addEventListener("submit", e => {
  e.preventDefault();
  if (!check($("nmV"), $("nmE"), "Це поле не може бути порожнім.")) return $("nmV").focus();
  const v = $("nmV").value.trim(), list = nameMode === "group" ? groups : teachers;
  if (list.includes(v)){ $("nmE").textContent = "Такий запис уже є."; return; }
  list.push(v); fillSelects();
  if (nameMode === "group"){ $("group").value = v; render(); }
  $("dlgName").close();
});

// Навігація: підсвічування активного пункту
document.querySelectorAll(".tabs a").forEach(a => a.addEventListener("click", e => {
  e.preventDefault();
  document.querySelectorAll(".tabs a").forEach(x => x.removeAttribute("aria-current"));
  a.setAttribute("aria-current", "page");
}));

fillSelects();
render();
