import { useState, useEffect, useRef, lazy, Suspense } from "react";
const DayMap = lazy(() =>
  import("./DayMap").catch(() => {
    // Stale chunk after a new deploy — reload once to get fresh assets
    const reloaded = sessionStorage.getItem("daymap-reload");
    if (!reloaded) {
      sessionStorage.setItem("daymap-reload", "1");
      window.location.reload();
    }
    return { default: () => null };
  })
);

const months = [
  {
    id: 1,
    month: "April",
    year: "2026",
    phase: "ARRIVAL",
    theme: "Plant the Flag",
    color: "#00E5FF",
    budget: "$",
    vibe: "Get your bearings. First week at Raytheon. Explore the block.",
    experiences: ["First Boston weekend walk — Seaport, North End, Back Bay", "Find your spot in Lowell (food, coffee, late nights)", "Check out JOC Boxing or Lowell Boxing Club"],
    travel: "No trips — bank every dollar. Boston is the trip.",
    milestone: "Day 1 at Raytheon ✦ April 6",
  },
  {
    id: 2,
    month: "May",
    year: "2026",
    phase: "MOMENTUM",
    theme: "Lock In",
    color: "#ADFF2F",
    budget: "$",
    vibe: "Paycheck rhythm established. First full month in Massachusetts.",
    experiences: ["Red Sox game at Fenway Park", "Boston Young Professionals event or networking mixer", "Day trip to Salem or Cape Ann"],
    travel: "Salem or Gloucester — 45 min drive, full vibe.",
    milestone: "First full paycheck month",
  },
  {
    id: 3,
    month: "June",
    year: "2026",
    phase: "INFLECTION",
    theme: "Su Su Season",
    color: "#FFD700",
    budget: "$$$",
    vibe: "Payout hits. This is the month you reward yourself intentionally.",
    experiences: ["Concert — check Fenway, TD Garden, or Leader Bank Pavilion", "Upgrade your setup (apartment, gym membership, gear)", "Boston Calling or summer music festival"],
    travel: "Weekend trip — NYC, Philly, or Montreal is close and worthy.",
    milestone: "Su Su payout 💰 — first real discretionary stack",
  },
  {
    id: 4,
    month: "July",
    year: "2026",
    phase: "SUMMER",
    theme: "Peak New England",
    color: "#FF6B35",
    budget: "$$",
    vibe: "Boston in July is underrated. Water, cookouts, outdoor everything.",
    experiences: ["4th of July on the Esplanade — Boston Pops Fireworks", "Cape Cod beach weekend", "Rooftop bars in Boston"],
    travel: "Cape Cod — 1.5 hrs, rent a cottage with people from work or new friends.",
    milestone: "3 months in Boston ✦ Social network building",
  },
  {
    id: 5,
    month: "August",
    year: "2026",
    phase: "EXPLORE",
    theme: "First Real Trip",
    color: "#C77DFF",
    budget: "$$$",
    vibe: "You've been grinding. Fly somewhere. No excuses.",
    experiences: ["International or domestic flight trip", "ODSC AI East — Boston (network + AI scene)", "Try a new cuisine city: Chicago, Atlanta, Toronto"],
    travel: "✈️ Fly out — Chicago, Atlanta, Toronto, or Cancun. Budget $800–1200.",
    milestone: "First solo trip as a Boston resident",
  },
  {
    id: 6,
    month: "September",
    year: "2026",
    phase: "FALL WAVE",
    theme: "New England Fall",
    color: "#FF4E50",
    budget: "$$",
    vibe: "The best season in New England. Take full advantage.",
    experiences: ["Foliage road trip — White Mountains NH or Vermont", "Patriots season opener — watch party or live", "Boston food festival or outdoor markets"],
    travel: "Vermont or NH — 2 hr drive. One of the most beautiful things you'll ever see.",
    milestone: "5 months settled — apartment hunt gets serious",
  },
  {
    id: 7,
    month: "October",
    year: "2026",
    phase: "CULTURE",
    theme: "City Mode",
    color: "#00B4D8",
    budget: "$$",
    vibe: "Fall in full swing. Sports season. Halloween. Boston is alive.",
    experiences: ["NBA opening night — Celtics at TD Garden", "Salem Halloween — it's iconic, do it", "Concert season peaks — check touring artists"],
    travel: "Salem Halloween weekend — 30 min from Tewksbury, legendary experience.",
    milestone: "6 months at Raytheon ✦ Performance review season",
  },
  {
    id: 8,
    month: "November",
    year: "2026",
    phase: "GRATEFUL",
    theme: "Give Thanks",
    color: "#F4A261",
    budget: "$$",
    vibe: "Thanksgiving — go home or host. Either way, you've earned a flex.",
    experiences: ["Celtics or Bruins home game", "Art and culture — ICA Boston, MFA", "Cook a real meal for people you've met"],
    travel: "Orlando trip — visit family, show the glow-up.",
    milestone: "First Thanksgiving away from Florida",
  },
  {
    id: 9,
    month: "December",
    year: "2026",
    phase: "LEVEL UP",
    theme: "Year-End Review",
    color: "#B5E48C",
    budget: "$$$",
    vibe: "Close the year strong. Reflect, reward, reset.",
    experiences: ["Holiday pop-up bars and events in Boston", "New Year's Eve plan — Boston First Night or a trip", "Year-end financial review — track net worth delta"],
    travel: "NYE trip — NYC, Miami, or a Airbnb house with people.",
    milestone: "2026 closes — you built something real",
  },
  {
    id: 10,
    month: "January",
    year: "2027",
    phase: "RESET",
    theme: "Go Somewhere Warm",
    color: "#48CAE4",
    budget: "$$$",
    vibe: "New England winters are no joke. Fight back with a warm weather trip.",
    experiences: ["Caribbean, Mexico, or Central America trip", "Set 2027 financial and career goals", "Find a Boston AI meetup to attend monthly"],
    travel: "✈️ Dominican Republic, Jamaica, Puerto Rico, or Cancun — 4–5 day trip.",
    milestone: "First international trip of 2027",
  },
  {
    id: 11,
    month: "February",
    year: "2027",
    phase: "GRIND",
    theme: "Stay Sharp",
    color: "#F72585",
    budget: "$",
    vibe: "Deep winter. Indoor mode. Channel it into skills and community.",
    experiences: ["Black History Month events in Boston", "Celtics playoff push — TD Garden", "Level up an AI project or side build"],
    travel: "Short trip — Montreal or NYC for a weekend.",
    milestone: "10 months at Raytheon — raise conversation territory",
  },
  {
    id: 12,
    month: "March",
    year: "2027",
    phase: "ONE YEAR",
    theme: "Anniversary Month",
    color: "#FFD700",
    budget: "$$$",
    vibe: "One year in Boston. You made it. Now it's time to expand the vision.",
    experiences: ["Celebrate — dinner, trip, or experience that marks the milestone", "Start solo apartment search seriously", "Map out Year 2 with bigger goals"],
    travel: "Reward trip — somewhere you've never been. You've earned it.",
    milestone: "🎯 Year 1 complete. New chapter begins.",
  },
];

const budgetDots = { "$": 1, "$$": 2, "$$$": 3 };

// 30-min slots for 5–7am and 8–11pm; hourly otherwise
const HOURS = [
  5, 5.5, 6, 6.5, 7, 7.5,
  8, 9, 10, 11,
  12, 13, 14, 15, 16, 17, 17.5, 18, 19,
  20, 20.5, 21, 21.5, 22, 22.5, 23,
];

function formatHour(h) {
  const whole = Math.floor(h);
  const half  = h % 1 !== 0;
  const suffix = whole < 12 ? "AM" : "PM";
  const display = whole === 0 ? 12 : whole > 12 ? whole - 12 : whole;
  if (half) return `${display}:30 ${suffix}`;
  if (whole === 0)  return "12 AM";
  if (whole === 12) return "12 PM";
  return `${display} ${suffix}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shiftDate(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: "UTC",
  });
}

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem("dayplanner-tasks")) || {};
  } catch {
    return {};
  }
}

function saveCache(data) {
  localStorage.setItem("dayplanner-tasks", JSON.stringify(data));
}

async function fetchDayFromDB(date) {
  const res = await fetch(`/api/tasks?date=${date}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data[date] || {};
}

async function persistSlotToDB(date, hour, taskList) {
  await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, hour, tasks: taskList }),
  });
}

function buildCalendarGrid(year, month) {
  // Returns array of weeks; each week is array of 7 ISO strings or null (padding)
  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay(); // 0=Sun
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function LifestylePlan() {
  const [view, setView] = useState("plan");
  const [active, setActive] = useState(null);

  // Day planner state
  const today = todayISO();
  const [plannerMode, setPlannerMode] = useState("calendar"); // "calendar" | "day"
  const [plannerDate, setPlannerDate] = useState(today);
  const [dayTab, setDayTab] = useState("schedule"); // "schedule" | "map"
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [tasks, setTasks] = useState(loadCache);
  const [syncing, setSyncing] = useState(false);
  const [addingSlot, setAddingSlot] = useState(null);
  const [addingValue, setAddingValue] = useState("");
  const [editingSlot, setEditingSlot] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  // Merged blocks
  const [blocks, setBlocks] = useState([]);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockForm, setBlockForm] = useState({ label: "", start_hour: 9, end_hour: 17 });
  const [blockAddingId, setBlockAddingId] = useState(null);
  const [blockAddingValue, setBlockAddingValue] = useState("");
  const [blockEditingSlot, setBlockEditingSlot] = useState(null);
  const [blockEditingValue, setBlockEditingValue] = useState("");

  // Stop linking
  const [dayStops, setDayStops] = useState([]);
  const [taskLinks, setTaskLinks] = useState([]);
  const [linkingTask, setLinkingTask] = useState(null); // { hour, blockId, taskText }

  // Todos
  const [todos, setTodos] = useState([]);
  const [todoInput, setTodoInput] = useState("");
  const [todoEditing, setTodoEditing] = useState(null); // id
  const [todoEditValue, setTodoEditValue] = useState("");
  const [editingTodoTime, setEditingTodoTime] = useState(null); // id
  const [todoTimeForm, setTodoTimeForm] = useState({ start_hour: 9, end_hour: 10 });

  // Calendar hover preview
  const [calHoverDay, setCalHoverDay] = useState(null);
  const [calMonthTodos, setCalMonthTodos] = useState({}); // { [date]: todo[] }

  // Habits
  const HABIT_DEFAULTS = ["Gym / Train", "Read", "Cook / Meal Prep", "No Junk Spend", "Network", "Journal"];
  const [habits, setHabits] = useState([]); // [{ label, done }]

  // Notes
  const [noteText, setNoteText] = useState("");
  const noteSaveTimer = useRef(null);

  const gridRef = useRef(null);

  // Reset + reload day data when date changes
  useEffect(() => {
    setDayTab("schedule");
    setBlocks([]);
    setDayStops([]);
    setTaskLinks([]);
    setLinkingTask(null);
    setTodos([]);
    setHabits([]);
    setNoteText("");
    fetch(`/api/habits?date=${plannerDate}`)
      .then(r => r.json()).then(rows => {
        if (!Array.isArray(rows)) return;
        // Merge DB state with defaults (defaults first, DB values override done)
        const dbMap = Object.fromEntries(rows.map(r => [r.label, r.done]));
        setHabits(HABIT_DEFAULTS.map(label => ({ label, done: dbMap[label] ?? false })));
      }).catch(() => setHabits(HABIT_DEFAULTS.map(label => ({ label, done: false }))));
    fetch(`/api/notes?date=${plannerDate}`)
      .then(r => r.json()).then(d => setNoteText(d.text ?? "")).catch(() => {});
    fetch(`/api/blocks?date=${plannerDate}`)
      .then(r => r.json()).then(d => setBlocks(Array.isArray(d) ? d.map(b => ({ ...b, start_hour: Number(b.start_hour), end_hour: Number(b.end_hour) })) : [])).catch(() => {});
    fetch(`/api/stops?date=${plannerDate}`)
      .then(r => r.json()).then(d => setDayStops(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`/api/task-links?date=${plannerDate}`)
      .then(r => r.json()).then(d => setTaskLinks(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`/api/todos?date=${plannerDate}`)
      .then(r => r.json()).then(d => setTodos(Array.isArray(d) ? d : [])).catch(() => {});
  }, [plannerDate]);

  // Load from DB when entering day view
  useEffect(() => {
    if (view !== "planner" || plannerMode !== "day") return;
    setSyncing(true);
    fetchDayFromDB(plannerDate).then((dayData) => {
      if (dayData) {
        setTasks((prev) => {
          const merged = { ...prev, [plannerDate]: dayData };
          saveCache(merged);
          return merged;
        });
      }
      setSyncing(false);
    }).catch(() => setSyncing(false));
  }, [plannerDate, plannerMode, view]);

  useEffect(() => {
    if (plannerMode === "day" && gridRef.current) {
      const rows = gridRef.current.querySelectorAll(".time-row");
      if (rows[4]) rows[4].scrollIntoView({ block: "start" });
    }
  }, [plannerMode]);

  // Prefetch all tasks + todos for the visible calendar month so hover previews have data
  useEffect(() => {
    if (view !== "planner" || plannerMode !== "calendar") return;
    const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    fetch(`/api/tasks?month=${monthStr}`)
      .then(r => r.json())
      .then(data => {
        if (typeof data !== "object" || Array.isArray(data)) return;
        setTasks(prev => {
          const merged = { ...prev, ...data };
          saveCache(merged);
          return merged;
        });
      })
      .catch(() => {});
    fetch(`/api/todos?month=${monthStr}`)
      .then(r => r.json())
      .then(data => {
        if (typeof data !== "object" || Array.isArray(data)) return;
        setCalMonthTodos(data);
      })
      .catch(() => {});
  }, [calYear, calMonth, plannerMode, view]);

  const selected = months.find((m) => m.id === active);

  // Update local state + cache, then persist the changed slot to DB
  function saveTasks(updated, date, hour, slotTasks) {
    setTasks(updated);
    saveCache(updated);
    persistSlotToDB(date, hour, slotTasks);
  }

  function getSlotTasks(date, hour) {
    return tasks[date]?.[hour] || [];
  }

  function addTask(date, hour, value) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const updated = { ...tasks };
    if (!updated[date]) updated[date] = {};
    const newList = [...(updated[date][hour] || []), trimmed];
    updated[date][hour] = newList;
    saveTasks(updated, date, hour, newList);
    // Mirror to todo list (skip if already there for this hour)
    if (date === plannerDate && !todos.some(t => t.text === trimmed && Number(t.start_hour) === Number(hour))) {
      fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, text: trimmed, start_hour: hour, end_hour: Number(hour) + 1 }),
      }).then(r => r.json()).then(todo => setTodos(p => [...p, todo])).catch(() => {});
    }
  }

  function editTask(date, hour, index, value) {
    const trimmed = value.trim();
    const oldText = tasks[date]?.[hour]?.[index];
    const updated = { ...tasks };
    if (!updated[date]?.[hour]) return;
    let newList;
    if (!trimmed) {
      newList = updated[date][hour].filter((_, i) => i !== index);
      if (newList.length === 0) {
        delete updated[date][hour];
        if (Object.keys(updated[date]).length === 0) delete updated[date];
        newList = [];
      } else {
        updated[date][hour] = newList;
      }
      // Clean up link + todo when task is deleted via edit
      if (oldText) {
        const link = getTaskLink(hour, oldText);
        if (link) unlinkTask(link.id);
        const todo = todos.find(t => t.text === oldText && Number(t.start_hour) === Number(hour));
        if (todo) deleteTodo(todo.id);
      }
    } else {
      newList = updated[date][hour].map((t, i) => i === index ? trimmed : t);
      updated[date][hour] = newList;
    }
    saveTasks(updated, date, hour, newList);
  }

  function deleteTask(date, hour, index) {
    const taskText = tasks[date]?.[hour]?.[index];
    const updated = { ...tasks };
    if (!updated[date]?.[hour]) return;
    const newList = updated[date][hour].filter((_, i) => i !== index);
    if (newList.length === 0) {
      delete updated[date][hour];
      if (Object.keys(updated[date] || {}).length === 0) delete updated[date];
    } else {
      updated[date][hour] = newList;
    }
    saveTasks(updated, date, hour, newList);
    if (taskText) {
      // Remove associated task-stop link
      const link = getTaskLink(hour, taskText);
      if (link) unlinkTask(link.id);
      // Remove associated todo
      const todo = todos.find(t => t.text === taskText && Number(t.start_hour) === Number(hour));
      if (todo) deleteTodo(todo.id);
    }
  }

  function commitAdd() {
    if (addingSlot) {
      addTask(addingSlot.date, addingSlot.hour, addingValue);
    }
    setAddingSlot(null);
    setAddingValue("");
  }

  function commitEdit() {
    if (editingSlot) {
      editTask(editingSlot.date, editingSlot.hour, editingSlot.index, editingValue);
    }
    setEditingSlot(null);
    setEditingValue("");
  }

  function getTaskLink(hour, taskText, blockId = null) {
    return taskLinks.find(l =>
      l.task_text === taskText &&
      (blockId != null
        ? l.block_id == blockId
        // match by exact hour OR by a "global" link (hour=null, block_id=null) created from the map
        : l.hour == hour || (l.hour == null && l.block_id == null))
    ) || null;
  }

  async function linkTask(hour, blockId, taskText, stopId) {
    const res = await fetch("/api/task-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: plannerDate, hour: hour ?? null, block_id: blockId ?? null, task_text: taskText, stop_id: stopId }),
    });
    const link = await res.json();
    setTaskLinks(prev => [...prev.filter(l => l.task_text !== taskText || (blockId ? l.block_id !== blockId : l.hour !== hour)), link]);
  }

  async function unlinkTask(linkId) {
    await fetch("/api/task-links", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: linkId }),
    });
    setTaskLinks(prev => prev.filter(l => l.id !== linkId));
  }

  async function createBlock() {
    const { label, start_hour, end_hour } = blockForm;
    if (start_hour >= end_hour) return;
    const res = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: plannerDate, start_hour, end_hour, label }),
    });
    const block = await res.json();
    setBlocks(prev => [...prev, { ...block, start_hour: Number(block.start_hour), end_hour: Number(block.end_hour), tasks: block.tasks || [] }].sort((a, b) => a.start_hour - b.start_hour));
    setShowBlockForm(false);
    setBlockForm({ label: "", start_hour: 9, end_hour: 17 });
  }

  async function deleteBlock(id) {
    await fetch("/api/blocks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBlocks(prev => prev.filter(b => b.id !== id));
  }

  async function updateBlockTasks(id, newTasks) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, tasks: newTasks } : b));
    await fetch("/api/blocks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, tasks: newTasks }),
    });
  }

  function commitBlockAdd() {
    if (!blockAddingId || !blockAddingValue.trim()) { setBlockAddingId(null); setBlockAddingValue(""); return; }
    const block = blocks.find(b => b.id === blockAddingId);
    const trimmed = blockAddingValue.trim();
    if (block) {
      updateBlockTasks(blockAddingId, [...block.tasks, trimmed]);
      // Mirror to todo list
      const alreadyExists = todos.some(t => t.text === trimmed && Number(t.start_hour) === Number(block.start_hour));
      if (!alreadyExists) {
        fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: plannerDate, text: trimmed, start_hour: block.start_hour, end_hour: block.end_hour, block_id: blockAddingId }),
        }).then(r => r.json()).then(todo => setTodos(p => [...p, todo])).catch(() => {});
      }
    }
    setBlockAddingId(null);
    setBlockAddingValue("");
  }

  function commitBlockEdit() {
    if (!blockEditingSlot) { setBlockEditingSlot(null); setBlockEditingValue(""); return; }
    const { blockId, index } = blockEditingSlot;
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      const trimmed = blockEditingValue.trim();
      const newTasks = trimmed
        ? block.tasks.map((t, i) => i === index ? trimmed : t)
        : block.tasks.filter((_, i) => i !== index);
      updateBlockTasks(blockId, newTasks);
    }
    setBlockEditingSlot(null);
    setBlockEditingValue("");
  }

  async function addTodo(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: plannerDate, text: trimmed }),
    });
    const todo = await res.json();
    setTodos(prev => [...prev, todo]);
  }

  async function toggleTodo(id, done) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done } : t));
    await fetch("/api/todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, done }),
    });
  }

  async function renameTodo(id, text) {
    const trimmed = text.trim();
    if (!trimmed) return deleteTodo(id);
    setTodos(prev => prev.map(t => t.id === id ? { ...t, text: trimmed } : t));
    await fetch("/api/todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, text: trimmed }),
    });
  }

  async function deleteTodo(id) {
    const todo = todos.find(t => t.id === id);
    setTodos(prev => prev.filter(t => t.id !== id));
    await fetch("/api/todos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    // If the todo owned a block, delete that block too
    if (todo?.block_id) {
      await fetch("/api/blocks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: todo.block_id }),
      });
      setBlocks(prev => prev.filter(b => b.id !== todo.block_id));
    }
  }

  async function setTodoTime(id, start_hour, end_hour) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    // Count actual HOURS slots in range (not arithmetic duration) — e.g. 6→7 covers [6, 6.5] = 2 slots
    const slotsInRange = HOURS.filter(h => h >= start_hour && h < end_hour);
    // Remove old schedule entry before writing new one
    if (todo.block_id) {
      await fetch("/api/blocks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: todo.block_id }) });
      setBlocks(prev => prev.filter(b => b.id !== todo.block_id));
    } else if (todo.start_hour != null) {
      // Was in a single-hour slot — remove it
      const oldHour = Number(todo.start_hour);
      const updated = { ...tasks };
      if (updated[plannerDate]?.[oldHour]) {
        const newList = updated[plannerDate][oldHour].filter(t => t !== todo.text);
        if (newList.length === 0) delete updated[plannerDate][oldHour];
        else updated[plannerDate][oldHour] = newList;
        saveTasks(updated, plannerDate, oldHour, newList);
      }
    }
    let newBlockId = null;
    if (slotsInRange.length > 1) {
      // Create merged block
      const bRes = await fetch("/api/blocks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: plannerDate, start_hour, end_hour, label: todo.text }),
      });
      if (!bRes.ok) return; // bail on server error
      const block = await bRes.json();
      await fetch("/api/blocks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: block.id, tasks: [todo.text] }) });
      setBlocks(prev => [...prev.filter(b => b.id !== block.id), { ...block, start_hour: Number(block.start_hour), end_hour: Number(block.end_hour), tasks: [todo.text] }].sort((a, b) => a.start_hour - b.start_hour));
      newBlockId = block.id;
    } else {
      // Single-hour: write directly to slot (bypassing addTask to avoid duplicate todo creation)
      const updated = { ...tasks };
      if (!updated[plannerDate]) updated[plannerDate] = {};
      if (!(updated[plannerDate][start_hour] || []).includes(todo.text)) {
        updated[plannerDate][start_hour] = [...(updated[plannerDate][start_hour] || []), todo.text];
        saveTasks(updated, plannerDate, start_hour, updated[plannerDate][start_hour]);
      }
    }
    await fetch("/api/todos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, start_hour, end_hour, block_id: newBlockId }) });
    setTodos(prev => prev.map(t => t.id === id ? { ...t, start_hour, end_hour, block_id: newBlockId } : t));
    setEditingTodoTime(null);
  }

  async function clearTodoTime(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    if (todo.block_id) {
      await fetch("/api/blocks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: todo.block_id }) });
      setBlocks(prev => prev.filter(b => b.id !== todo.block_id));
    } else if (todo.start_hour != null) {
      // Remove from single slot
      const hour = Number(todo.start_hour);
      const updated = { ...tasks };
      if (updated[plannerDate]?.[hour]) {
        const newList = updated[plannerDate][hour].filter(t => t !== todo.text);
        if (newList.length === 0) delete updated[plannerDate][hour];
        else updated[plannerDate][hour] = newList;
        saveTasks(updated, plannerDate, hour, newList);
      }
    }
    await fetch("/api/todos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, start_hour: null, end_hour: null, block_id: null }) });
    setTodos(prev => prev.map(t => t.id === id ? { ...t, start_hour: null, end_hour: null, block_id: null } : t));
    setEditingTodoTime(null);
  }

  function toggleHabit(label) {
    const current = habits.find(h => h.label === label);
    if (!current) return;
    const done = !current.done;
    setHabits(prev => prev.map(h => h.label === label ? { ...h, done } : h));
    fetch("/api/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: plannerDate, label, done }) }).catch(() => {});
  }

  function handleNoteChange(text) {
    setNoteText(text);
    clearTimeout(noteSaveTimer.current);
    noteSaveTimer.current = setTimeout(() => {
      fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: plannerDate, text }) }).catch(() => {});
    }, 800);
  }

  const dayTasks = tasks[plannerDate] || {};
  const totalTaskCount = Object.values(dayTasks).reduce((sum, arr) => sum + arr.length, 0);
  const doneTodos = todos.filter(t => t.done).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0F",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#F0EDE6",
      padding: "0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .plan-header {
          padding: 48px 32px 32px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .plan-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: rgba(240,237,230,0.4);
          margin-bottom: 12px;
        }

        .plan-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px, 6vw, 64px);
          font-weight: 900;
          line-height: 1;
          color: #F0EDE6;
        }

        .plan-title span {
          color: #FFD700;
        }

        .plan-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          color: rgba(240,237,230,0.5);
          margin-top: 12px;
          letter-spacing: 0.5px;
        }

        /* Nav Tabs */
        .nav-tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 0 32px;
        }

        .nav-tab {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(240,237,230,0.35);
          padding: 14px 0;
          margin-right: 32px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: color 0.15s, border-color 0.15s;
          user-select: none;
        }

        .nav-tab:hover {
          color: rgba(240,237,230,0.65);
        }

        .nav-tab.active {
          color: #F0EDE6;
          border-bottom-color: #FFD700;
        }

        .quarter-block { border-top: 1px solid rgba(255,255,255,0.05); }

        .quarter-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 500; letter-spacing: 4px;
          text-transform: uppercase;
          color: rgba(240,237,230,0.25);
          padding: 14px 20px 6px;
        }

        .months-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(255,255,255,0.05);
        }

        .month-tile {
          background: #0A0A0F;
          padding: 20px 16px;
          cursor: pointer;
          transition: background 0.15s ease;
          position: relative;
          overflow: hidden;
        }

        .month-tile:hover {
          background: #111118;
        }

        .month-tile.active {
          background: #13131C;
        }

        .month-tile::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 3px;
          height: 100%;
          background: var(--accent);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .month-tile.active::before,
        .month-tile:hover::before {
          opacity: 1;
        }

        .tile-phase {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 6px;
        }

        .tile-month {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: #F0EDE6;
          line-height: 1;
        }

        .tile-year {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: rgba(240,237,230,0.3);
          margin-top: 2px;
        }

        .tile-theme {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 400;
          color: rgba(240,237,230,0.5);
          margin-top: 8px;
          line-height: 1.3;
        }

        .budget-dots {
          display: flex;
          gap: 3px;
          margin-top: 10px;
        }

        .dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          opacity: 0.3;
        }

        .dot.filled { opacity: 1; }

        .detail-panel {
          padding: 40px 32px;
          border-top: 1px solid rgba(255,255,255,0.06);
          animation: slideUp 0.25s ease;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .detail-header {
          display: flex;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .detail-phase-badge {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #0A0A0F;
          background: var(--accent);
          padding: 4px 10px;
          border-radius: 2px;
          white-space: nowrap;
          align-self: flex-start;
          margin-top: 8px;
        }

        .detail-title-block {}

        .detail-month {
          font-family: 'Playfair Display', serif;
          font-size: clamp(40px, 7vw, 72px);
          font-weight: 900;
          line-height: 1;
          color: #F0EDE6;
        }

        .detail-theme {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          color: var(--accent);
          letter-spacing: 1px;
          margin-top: 4px;
        }

        .detail-vibe {
          font-family: 'Georgia', serif;
          font-size: 17px;
          line-height: 1.6;
          color: rgba(240,237,230,0.7);
          margin-bottom: 32px;
          font-style: italic;
          border-left: 2px solid var(--accent);
          padding-left: 16px;
        }

        .detail-sections {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 600px) {
          .detail-sections { grid-template-columns: 1fr; }
          .months-grid { grid-template-columns: repeat(3, 1fr); }
          .planner-date-label { font-size: 24px; }
        }

        .detail-section-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 12px;
        }

        .exp-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .exp-item {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: rgba(240,237,230,0.75);
          padding-left: 14px;
          position: relative;
          line-height: 1.5;
        }

        .exp-item::before {
          content: '—';
          position: absolute;
          left: 0;
          color: var(--accent);
          font-size: 12px;
        }

        .travel-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-left: 2px solid var(--accent);
          padding: 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: rgba(240,237,230,0.7);
          line-height: 1.6;
          border-radius: 0 4px 4px 0;
          margin-bottom: 16px;
        }

        .milestone-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          padding: 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: var(--accent);
          border-radius: 4px;
        }

        .empty-state {
          padding: 40px 32px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: rgba(240,237,230,0.3);
          letter-spacing: 0.5px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .legend {
          display: flex;
          gap: 20px;
          padding: 16px 32px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          flex-wrap: wrap;
        }

        .legend-item {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: rgba(240,237,230,0.4);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: rgba(240,237,230,0.4);
        }

        /* Day View — Canvas-inspired warm editorial */
        .day-canvas {
          background: #F5EEE6;
          min-height: 100vh;
        }

        .day-sticky-header {
          position: sticky;
          top: 0;
          z-index: 10;
          background: #F5EEE6;
        }

        .planner-date-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 28px 40px 24px;
          background: #F5EEE6;
          border-bottom: 1px solid rgba(44,31,20,0.08);
        }

        .planner-nav-btn {
          background: none;
          border: none;
          color: rgba(44,31,20,0.3);
          font-size: 20px;
          cursor: pointer;
          padding: 6px 12px;
          transition: color 0.15s;
          line-height: 1;
          font-family: 'DM Sans', sans-serif;
          border-radius: 50%;
        }

        .planner-nav-btn:hover {
          color: rgba(44,31,20,0.8);
          background: rgba(44,31,20,0.06);
        }

        .planner-date-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .planner-date-label {
          font-family: 'Playfair Display', serif;
          font-size: clamp(26px, 5vw, 48px);
          font-weight: 900;
          color: #2C1F14;
          line-height: 1;
          letter-spacing: -0.5px;
        }

        .planner-task-count {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          letter-spacing: 3px;
          color: rgba(44,31,20,0.35);
          text-transform: uppercase;
        }

        .day-body {
          display: flex;
          align-items: flex-start;
          gap: 0;
        }

        .planner-time-grid {
          flex: 1;
          min-width: 0;
          animation: slideUp 0.25s ease;
          padding-bottom: 60px;
        }

        .day-section {
          margin-bottom: 0;
        }

        .day-section-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px 40px 12px;
        }

        .day-section-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: rgba(44,31,20,0.35);
          white-space: nowrap;
        }

        .day-section-rule {
          flex: 1;
          height: 1px;
          background: rgba(44,31,20,0.1);
        }

        .time-row {
          display: flex;
          align-items: flex-start;
          padding: 6px 40px;
          gap: 0;
          min-height: 48px;
          transition: background 0.12s;
          cursor: default;
        }

        .time-row:hover {
          background: rgba(44,31,20,0.025);
        }

        .time-row.has-tasks {
          padding-top: 10px;
          padding-bottom: 10px;
        }

        .time-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 1.5px;
          color: rgba(44,31,20,0.3);
          width: 52px;
          min-width: 52px;
          text-align: right;
          padding-top: 6px;
          text-transform: uppercase;
        }

        .time-divider {
          width: 1px;
          background: rgba(44,31,20,0.1);
          margin: 0 20px;
          align-self: stretch;
          min-height: 24px;
        }

        .task-area {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: flex-start;
          flex: 1;
          padding: 2px 0;
        }

        .task-chip {
          display: inline-flex;
          align-items: flex-start;
          gap: 8px;
          background: #FFFBF7;
          border: 1px solid rgba(44,31,20,0.1);
          border-radius: 8px;
          padding: 8px 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #2C1F14;
          cursor: pointer;
          transition: box-shadow 0.15s, border-color 0.15s, transform 0.1s;
          user-select: none;
          box-shadow: 0 1px 3px rgba(44,31,20,0.07), 0 1px 2px rgba(44,31,20,0.04);
          max-width: 340px;
        }

        .task-chip:hover {
          box-shadow: 0 4px 12px rgba(44,31,20,0.12);
          border-color: rgba(44,31,20,0.18);
          transform: translateY(-1px);
        }

        .task-chip-text {
          line-height: 1.55;
          white-space: pre-wrap;
          flex: 1;
        }

        .task-chip-delete {
          color: rgba(44,31,20,0.2);
          font-size: 16px;
          line-height: 1.2;
          transition: color 0.1s;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .task-chip:hover .task-chip-delete {
          color: rgba(44,31,20,0.45);
        }

        .task-chip-delete:hover {
          color: #C0392B !important;
        }

        .task-add-btn {
          background: none;
          border: 1px dashed rgba(44,31,20,0.18);
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 2px;
          color: rgba(44,31,20,0.25);
          cursor: pointer;
          text-transform: uppercase;
          padding: 6px 12px;
          transition: all 0.15s;
        }

        .task-add-btn:hover {
          border-color: rgba(44,31,20,0.4);
          color: rgba(44,31,20,0.6);
          background: rgba(44,31,20,0.03);
        }

        .task-inline-input {
          background: #FFFBF7;
          border: 1px solid rgba(44,31,20,0.15);
          border-bottom: 2px solid #C0733A;
          color: #2C1F14;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          outline: none;
          padding: 8px 12px;
          width: 240px;
          min-height: 36px;
          border-radius: 8px;
          resize: none;
          overflow: hidden;
          line-height: 1.55;
          box-shadow: 0 2px 8px rgba(44,31,20,0.08);
        }

        /* Calendar */
        .cal-layout {
          display: flex;
          gap: 0;
          align-items: flex-start;
        }
        .cal-main { flex: 1; min-width: 0; }
        .cal-milestone-panel {
          width: 260px; min-width: 260px;
          border-left: 1px solid rgba(255,255,255,0.06);
          padding: 28px 24px 40px;
          display: flex; flex-direction: column; gap: 20px;
        }
        .cal-milestone-month {
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 700; color: #F0EDE6;
          line-height: 1.1;
        }
        .cal-milestone-phase {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 500; letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--cal-accent, rgba(240,237,230,0.3));
          margin-top: 4px;
        }
        .cal-milestone-theme {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; color: rgba(240,237,230,0.55);
          font-style: italic; margin-top: 2px;
        }
        .cal-milestone-vibe {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; color: rgba(240,237,230,0.4);
          line-height: 1.6; border-left: 2px solid var(--cal-accent, rgba(240,237,230,0.15));
          padding-left: 10px;
        }
        .cal-milestone-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; letter-spacing: 0.3px;
          color: rgba(240,237,230,0.7);
          background: rgba(255,255,255,0.04);
          border-radius: 8px; padding: 10px 12px;
          line-height: 1.5;
        }
        .cal-milestone-exps {
          display: flex; flex-direction: column; gap: 6px;
        }
        .cal-milestone-exp {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; color: rgba(240,237,230,0.45);
          padding-left: 10px; position: relative; line-height: 1.4;
        }
        .cal-milestone-exp::before {
          content: '→'; position: absolute; left: 0;
          color: var(--cal-accent, rgba(240,237,230,0.2));
        }
        @media (max-width: 900px) {
          .cal-layout { flex-direction: column; }
          .cal-milestone-panel { width: 100%; min-width: 0; border-left: none; border-top: 1px solid rgba(255,255,255,0.06); }
        }

        .cal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 32px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .cal-month-label {
          font-family: 'Playfair Display', serif;
          font-size: clamp(22px, 4vw, 36px);
          font-weight: 700;
          color: #F0EDE6;
        }

        .cal-nav-btn {
          background: none;
          border: none;
          color: rgba(240,237,230,0.4);
          font-size: 22px;
          cursor: pointer;
          padding: 4px 10px;
          transition: color 0.15s;
          line-height: 1;
          font-family: 'DM Sans', sans-serif;
        }

        .cal-nav-btn:hover { color: rgba(240,237,230,0.9); }

        .cal-grid {
          padding: 16px 24px 32px;
          animation: slideUp 0.2s ease;
        }

        .cal-dow-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 4px;
        }

        .cal-dow {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(240,237,230,0.25);
          text-align: center;
          padding: 6px 0;
        }

        .cal-week {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 4px;
        }

        .cal-day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.12s;
          position: relative;
        }

        .cal-day:hover { background: rgba(255,255,255,0.06); }

        .cal-day.today .cal-day-num {
          color: #FFD700;
          font-weight: 700;
        }

        .cal-day.selected {
          background: rgba(255,215,0,0.1);
          border: 1px solid rgba(255,215,0,0.25);
        }

        .cal-day-num {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: rgba(240,237,230,0.75);
          line-height: 1;
        }

        .cal-task-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #FFD700;
          opacity: 0.7;
        }

        .cal-day.payday .cal-day-num { color: #4ADE80; }
        .cal-day.payday { background: rgba(74,222,128,0.06); }
        .cal-day.payday:hover { background: rgba(74,222,128,0.12); }

        .cal-day-empty { cursor: default; }

        /* Hover task preview */
        .cal-day-preview {
          position: absolute;
          top: calc(100% + 6px);
          z-index: 50;
          width: 220px;
          background: #1a1a24;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 12px 14px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          pointer-events: none;
        }
        .cal-day-preview--left { left: 0; }
        .cal-day-preview--right { right: 0; }
        .cal-preview-date {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(240,237,230,0.35);
          margin-bottom: 8px;
        }
        .cal-preview-row {
          display: flex; gap: 8px; align-items: baseline;
          margin-bottom: 5px;
        }
        .cal-preview-hour {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; color: #FFD700; opacity: 0.7;
          white-space: nowrap; min-width: 44px;
        }
        .cal-preview-items {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; color: rgba(240,237,230,0.65);
          line-height: 1.4;
        }
        .cal-preview-empty {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; color: rgba(240,237,230,0.25);
          font-style: italic;
        }
        .cal-preview-done {
          text-decoration: line-through;
          opacity: 0.4;
        }

        .cal-day.past .cal-day-num {
          text-decoration: line-through;
          color: rgba(240,237,230,0.25);
        }
        .cal-day.past { opacity: 0.5; }

        .day-tab-bar {
          display: flex;
          border-bottom: 1px solid rgba(44,31,20,0.1);
          background: #F5EEE6;
          padding: 0 40px;
        }

        .day-tab-btn {
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(44,31,20,0.35);
          cursor: pointer;
          padding: 12px 0;
          margin-right: 28px;
          transition: color 0.15s, border-color 0.15s;
        }

        .day-tab-btn:hover { color: rgba(44,31,20,0.65); }

        .day-tab-btn.active {
          color: #2C1F14;
          border-bottom-color: #C0733A;
        }

        /* Stop link badge + button */
        .task-stop-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #C0733A;
          color: #FFFBF7;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .task-stop-badge:hover { opacity: 0.75; }

        .task-link-btn {
          background: none;
          border: none;
          color: rgba(44,31,20,0.2);
          font-size: 13px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          flex-shrink: 0;
          transition: color 0.15s;
          opacity: 0;
        }
        .task-chip:hover .task-link-btn { opacity: 1; }
        .task-link-btn:hover { color: #C0733A; }

        .task-stop-select {
          background: #F5EEE6;
          border: 1px solid #C0733A;
          border-radius: 6px;
          padding: 3px 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: #2C1F14;
          outline: none;
          cursor: pointer;
          max-width: 160px;
        }

        /* Todo panel */
        .todo-panel {
          width: 260px;
          min-width: 260px;
          flex-shrink: 0;
          background: #FFFBF7;
          border-left: 1px solid rgba(44,31,20,0.08);
          min-height: calc(100vh - 180px);
          display: flex;
          flex-direction: column;
          padding: 28px 20px 40px;
          position: sticky;
          top: 0;
          max-height: 100vh;
          overflow-y: auto;
        }

        .todo-panel-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(44,31,20,0.35);
          margin-bottom: 4px;
        }

        .todo-progress-bar {
          height: 2px;
          background: rgba(44,31,20,0.08);
          border-radius: 2px;
          margin-bottom: 18px;
          overflow: hidden;
        }

        .todo-progress-fill {
          height: 100%;
          background: #C0733A;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .todo-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .todo-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 7px 8px;
          border-radius: 7px;
          transition: background 0.1s;
          cursor: default;
        }

        .todo-item:hover { background: rgba(44,31,20,0.03); }

        .todo-check {
          width: 18px; height: 18px; min-width: 18px;
          border-radius: 50%;
          border: 1.5px solid rgba(44,31,20,0.25);
          background: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
          margin-top: 1px;
          flex-shrink: 0;
        }

        .todo-check:hover { border-color: #C0733A; }

        .todo-item.done .todo-check {
          background: #C0733A;
          border-color: #C0733A;
        }

        .todo-check-mark {
          display: none;
          color: #FFFBF7;
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
        }

        .todo-item.done .todo-check-mark { display: block; }

        .todo-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #2C1F14;
          line-height: 1.45;
          flex: 1;
          cursor: text;
          word-break: break-word;
          transition: color 0.15s, opacity 0.15s;
        }

        .todo-item.done .todo-text {
          color: rgba(44,31,20,0.3);
          text-decoration: line-through;
        }

        .todo-text-input {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #2C1F14;
          background: #F5EEE6;
          border: 1px solid #C0733A;
          border-radius: 5px;
          padding: 3px 6px;
          width: 100%;
          outline: none;
          line-height: 1.45;
          resize: none;
        }

        .todo-delete {
          background: none; border: none;
          color: rgba(44,31,20,0.15);
          font-size: 16px; cursor: pointer;
          padding: 0; line-height: 1;
          opacity: 0;
          transition: color 0.1s, opacity 0.1s;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .todo-item:hover .todo-delete { opacity: 1; }
        .todo-delete:hover { color: #C0392B !important; }

        .todo-add-row {
          margin-top: 10px;
        }

        .todo-add-input {
          width: 100%;
          background: none;
          border: none;
          border-bottom: 1px solid rgba(44,31,20,0.12);
          padding: 7px 0;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #2C1F14;
          outline: none;
          transition: border-color 0.15s;
        }

        .todo-add-input:focus { border-bottom-color: #C0733A; }
        .todo-add-input::placeholder { color: rgba(44,31,20,0.28); }

        .todo-time-badge {
          background: none; border: none; cursor: pointer; padding: 0;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500; letter-spacing: 0.5px;
          color: #C0733A;
          white-space: nowrap; flex-shrink: 0;
          transition: opacity 0.1s;
        }
        .todo-time-badge:hover { opacity: 0.7; }
        .todo-unassigned {
          background: none; border: 1px dashed rgba(44,31,20,0.18); border-radius: 10px;
          padding: 1px 7px; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; color: rgba(44,31,20,0.35);
          white-space: nowrap; flex-shrink: 0;
          transition: all 0.1s;
        }
        .todo-unassigned:hover { border-color: #C0733A; color: #C0733A; }
        .todo-time-editor {
          display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
          padding: 6px 8px 6px 36px;
          background: rgba(192,115,58,0.05);
          border-radius: 6px; margin-top: 2px;
        }
        .todo-time-select {
          background: #F5EEE6; border: 1px solid rgba(44,31,20,0.15);
          border-radius: 5px; padding: 3px 5px;
          font-family: 'DM Sans', sans-serif; font-size: 11px; color: #2C1F14;
          outline: none; cursor: pointer;
        }
        .todo-time-select:focus { border-color: #C0733A; }
        .todo-time-save {
          background: #2C1F14; color: #F5EEE6; border: none; border-radius: 5px;
          padding: 3px 8px; font-family: 'DM Sans', sans-serif;
          font-size: 10px; letter-spacing: 1px; text-transform: uppercase;
          cursor: pointer; transition: opacity 0.1s;
        }
        .todo-time-save:hover { opacity: 0.8; }
        .todo-time-clear {
          background: none; border: none; color: rgba(44,31,20,0.3);
          font-size: 11px; cursor: pointer; padding: 0;
          font-family: 'DM Sans', sans-serif;
        }
        .todo-time-clear:hover { color: #C0392B; }

        /* Today button */
        .cal-today-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(240,237,230,0.4);
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px; padding: 3px 12px; cursor: pointer;
          transition: all 0.15s;
        }
        .cal-today-btn:hover { color: #FFD700; border-color: rgba(255,215,0,0.4); background: rgba(255,215,0,0.06); }

        /* Habit tracker */
        .habit-section {
          border-top: 1px solid rgba(44,31,20,0.08);
          padding: 14px 0 4px;
        }
        .habit-section-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; letter-spacing: 3px; text-transform: uppercase;
          color: rgba(44,31,20,0.35);
          margin-bottom: 10px;
        }
        .habit-grid {
          display: flex; flex-wrap: wrap; gap: 6px;
        }
        .habit-chip {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          color: rgba(44,31,20,0.5);
          background: rgba(44,31,20,0.05);
          border: 1px solid rgba(44,31,20,0.12);
          border-radius: 20px; padding: 4px 10px;
          cursor: pointer; transition: all 0.15s;
          white-space: nowrap;
        }
        .habit-chip:hover { border-color: rgba(44,31,20,0.25); color: rgba(44,31,20,0.7); }
        .habit-chip.done {
          background: rgba(74,160,44,0.12);
          border-color: rgba(74,160,44,0.35);
          color: #3a7d2a;
          font-weight: 600;
        }

        /* Day notes */
        .notes-section {
          border-top: 1px solid rgba(44,31,20,0.08);
          padding: 14px 0 0;
        }
        .notes-textarea {
          width: 100%; min-height: 90px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; color: rgba(44,31,20,0.7);
          background: rgba(44,31,20,0.03);
          border: 1px solid rgba(44,31,20,0.1);
          border-radius: 8px; padding: 10px 12px;
          resize: vertical; outline: none;
          line-height: 1.6;
          transition: border-color 0.15s;
        }
        .notes-textarea::placeholder { color: rgba(44,31,20,0.25); }
        .notes-textarea:focus { border-color: rgba(44,31,20,0.25); }

        @media (max-width: 768px) {
          .day-body { flex-direction: column; }
          .todo-panel {
            width: 100%; min-width: 0;
            border-left: none;
            border-top: 1px solid rgba(44,31,20,0.08);
            position: static;
            max-height: none;
            min-height: auto;
          }
        }

        /* Merged blocks */
        .block-card {
          margin: 4px 40px 4px;
          background: #FFFBF7;
          border: 1px solid rgba(44,31,20,0.1);
          border-left: 3px solid #C0733A;
          border-radius: 10px;
          padding: 16px 18px;
          box-shadow: 0 2px 8px rgba(44,31,20,0.07);
        }

        .block-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .block-title-group {}

        .block-label {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: #2C1F14;
          line-height: 1.2;
        }

        .block-range {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #C0733A;
          margin-top: 3px;
        }

        .block-delete-btn {
          background: none;
          border: none;
          color: rgba(44,31,20,0.2);
          font-size: 18px;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
          transition: color 0.1s;
          flex-shrink: 0;
        }

        .block-delete-btn:hover { color: #C0392B; }

        .block-tasks {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: flex-start;
        }

        .block-form-bar {
          margin: 0 40px 4px;
          background: #FFFBF7;
          border: 1px dashed rgba(44,31,20,0.15);
          border-radius: 10px;
          padding: 16px 18px;
          display: flex;
          gap: 10px;
          align-items: flex-end;
          flex-wrap: wrap;
        }

        .block-form-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .block-form-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(44,31,20,0.4);
        }

        .block-form-input {
          background: #F5EEE6;
          border: 1px solid rgba(44,31,20,0.12);
          border-radius: 6px;
          padding: 7px 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #2C1F14;
          outline: none;
          transition: border-color 0.15s;
        }

        .block-form-input:focus { border-color: #C0733A; }

        .block-form-select {
          background: #F5EEE6;
          border: 1px solid rgba(44,31,20,0.12);
          border-radius: 6px;
          padding: 7px 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #2C1F14;
          outline: none;
          cursor: pointer;
        }

        .block-form-actions {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }

        .block-create-btn {
          background: #2C1F14;
          color: #F5EEE6;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.15s;
          white-space: nowrap;
        }

        .block-create-btn:hover { opacity: 0.8; }
        .block-create-btn:disabled { opacity: 0.4; cursor: default; }

        .block-cancel-btn {
          background: none;
          border: 1px solid rgba(44,31,20,0.15);
          border-radius: 6px;
          padding: 8px 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: rgba(44,31,20,0.5);
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .block-cancel-btn:hover { border-color: rgba(44,31,20,0.3); color: rgba(44,31,20,0.75); }

        .add-block-btn {
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: rgba(44,31,20,0.3);
          cursor: pointer;
          padding: 0;
          transition: color 0.15s;
        }

        .add-block-btn:hover { color: rgba(44,31,20,0.65); }

        .day-back-btn {
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(44,31,20,0.4);
          cursor: pointer;
          padding: 0;
          transition: color 0.15s;
        }

        .day-back-btn:hover { color: rgba(44,31,20,0.75); }
      `}</style>

      <div className="plan-header">
        <div className="plan-eyebrow">Jay · Boston Era · 2026–2027</div>
        <div className="plan-title">Life <span>Unlocked</span></div>
        <div className="plan-subtitle">A 12-month vision for the man building and living at the same time</div>
      </div>

      <div className="nav-tabs">
        <div
          className={`nav-tab${view === "plan" ? " active" : ""}`}
          onClick={() => setView("plan")}
        >
          Lifestyle Plan
        </div>
        <div
          className={`nav-tab${view === "planner" ? " active" : ""}`}
          onClick={() => setView("planner")}
        >
          Day Planner
        </div>
      </div>

      {view === "plan" ? (
        <>
          <div className="legend">
            <div className="legend-item"><div className="legend-dot" style={{background:"rgba(240,237,230,0.4)"}} />$ = Low spend month</div>
            <div className="legend-item"><div className="legend-dot" style={{background:"rgba(240,237,230,0.7)"}} />$$ = Moderate</div>
            <div className="legend-item"><div className="legend-dot" style={{background:"#FFD700"}} />$$$ = Investment month</div>
            <div className="legend-item" style={{marginLeft:"auto", color:"rgba(240,237,230,0.25)"}}>Tap any month →</div>
          </div>

          {[
            { label: "Q1 — April · May · June 2026", ids: [1,2,3] },
            { label: "Q2 — July · August · September 2026", ids: [4,5,6] },
            { label: "Q3 — October · November · December 2026", ids: [7,8,9] },
            { label: "Q4 — January · February · March 2027", ids: [10,11,12] },
          ].map(({ label, ids }) => (
            <div key={label} className="quarter-block">
              <div className="quarter-label">{label}</div>
              <div className="months-grid">
                {months.filter(m => ids.includes(m.id)).map((m) => {
                  const dots = budgetDots[m.budget];
                  return (
                    <div
                      key={m.id}
                      className={`month-tile${active === m.id ? " active" : ""}`}
                      style={{ "--accent": m.color }}
                      onClick={() => setActive(active === m.id ? null : m.id)}
                    >
                      <div className="tile-phase">{m.phase}</div>
                      <div className="tile-month">{m.month}</div>
                      <div className="tile-year">{m.year}</div>
                      <div className="tile-theme">{m.theme}</div>
                      <div className="budget-dots">
                        {[1,2,3].map(i => (
                          <div key={i} className={`dot${i <= dots ? " filled" : ""}`} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {selected ? (
            <div className="detail-panel" style={{ "--accent": selected.color }}>
              <div className="detail-header">
                <div className="detail-title-block">
                  <div className="detail-month">{selected.month} <span style={{fontSize:"0.5em", color:"rgba(240,237,230,0.3)"}}>{selected.year}</span></div>
                  <div className="detail-theme">{selected.theme}</div>
                </div>
                <div className="detail-phase-badge">{selected.phase}</div>
              </div>

              <div className="detail-vibe">{selected.vibe}</div>

              <div className="detail-sections">
                <div>
                  <div className="detail-section-label">Experiences</div>
                  <ul className="exp-list">
                    {selected.experiences.map((e, i) => (
                      <li key={i} className="exp-item">{e}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="detail-section-label">Travel Play</div>
                  <div className="travel-box">{selected.travel}</div>
                  <div className="detail-section-label" style={{marginTop: 0}}>Month Milestone</div>
                  <div className="milestone-box">{selected.milestone}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">Select a month above to see the full breakdown.</div>
          )}
        </>
      ) : plannerMode === "calendar" ? (
        <>
          <div className="cal-header">
            <button className="cal-nav-btn" onClick={() => {
              if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
              else setCalMonth(m => m - 1);
            }}>←</button>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <div className="cal-month-label">{MONTH_NAMES[calMonth]} {calYear}</div>
              {!(calYear === new Date().getFullYear() && calMonth === new Date().getMonth()) && (
                <button className="cal-today-btn" onClick={() => { setCalYear(new Date().getFullYear()); setCalMonth(new Date().getMonth()); }}>Today</button>
              )}
            </div>
            <button className="cal-nav-btn" onClick={() => {
              if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
              else setCalMonth(m => m + 1);
            }}>→</button>
          </div>

          <div className="cal-layout">
            <div className="cal-main">
              <div className="cal-grid">
                <div className="cal-dow-row">
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                    <div key={d} className="cal-dow">{d}</div>
                  ))}
                </div>
                {buildCalendarGrid(calYear, calMonth).map((week, wi) => (
                  <div key={wi} className="cal-week">
                    {week.map((iso, di) => {
                      if (!iso) return <div key={di} className="cal-day cal-day-empty" />;
                      const isToday = iso === today;
                      const isPast = iso < today;
                      const isSelected = iso === plannerDate;
                      const hasTasks = Object.values(tasks[iso] || {}).some(arr => arr.length > 0) || (calMonthTodos[iso]?.length > 0);
                      const dayNum = parseInt(iso.split("-")[2], 10);
                      const [dy, dm, dd] = iso.split("-").map(Number);
                      const dow = new Date(Date.UTC(dy, dm - 1, dd)).getUTCDay();
                      const isPayday = dow === 5 && iso >= "2026-04-17";
                      const previewTasks = HOURS
                        .filter(h => (tasks[iso]?.[h] || []).length > 0)
                        .map(h => ({ hour: h, items: tasks[iso][h] }));
                      // Align tooltip: right edge for Fri/Sat, left edge otherwise
                      const tipAlign = dow >= 5 ? "right" : "left";
                      return (
                        <div
                          key={di}
                          className={`cal-day${isPast ? " past" : ""}${isToday ? " today" : ""}${isSelected ? " selected" : ""}${isPayday ? " payday" : ""}`}
                          onClick={() => { setPlannerDate(iso); setPlannerMode("day"); }}
                          onMouseEnter={() => setCalHoverDay(iso)}
                          onMouseLeave={() => setCalHoverDay(null)}
                        >
                          <span className="cal-day-num">{dayNum}</span>
                          {hasTasks && <div className="cal-task-dot" />}
                          {calHoverDay === iso && (
                            <div className={`cal-day-preview cal-day-preview--${tipAlign}`}>
                              <div className="cal-preview-date">{formatDateLabel(iso)}</div>
                              {previewTasks.map(({ hour, items }) => (
                                <div key={hour} className="cal-preview-row">
                                  <span className="cal-preview-hour">{formatHour(hour)}</span>
                                  <span className="cal-preview-items">{items.join(", ")}</span>
                                </div>
                              ))}
                              {(calMonthTodos[iso] || []).map(t => (
                                <div key={t.id} className="cal-preview-row">
                                  <span className="cal-preview-hour" style={{opacity: t.start_hour != null ? 1 : 0.4}}>
                                    {t.start_hour != null ? formatHour(Number(t.start_hour)) : "—"}
                                  </span>
                                  <span className={`cal-preview-items${t.done ? " cal-preview-done" : ""}`}>{t.text}</span>
                                </div>
                              ))}
                              {previewTasks.length === 0 && !calMonthTodos[iso]?.length && (
                                <div className="cal-preview-empty">Nothing planned</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {(() => {
              const calMonthName = MONTH_NAMES[calMonth];
              const calYearStr = calYear.toString();
              const mData = months.find(m => m.month === calMonthName && m.year === calYearStr);
              if (!mData) return (
                <div className="cal-milestone-panel">
                  <div className="cal-milestone-month" style={{ color: "rgba(240,237,230,0.3)" }}>
                    {calMonthName} {calYearStr}
                  </div>
                  <div className="cal-milestone-text" style={{ color: "rgba(240,237,230,0.25)", marginTop: 12 }}>
                    No plan data for this month.
                  </div>
                </div>
              );
              return (
                <div className="cal-milestone-panel" style={{ "--cal-accent": mData.color }}>
                  <div className="cal-milestone-month">{mData.month} {mData.year}</div>
                  <div className="cal-milestone-phase">{mData.phase}</div>
                  <div className="cal-milestone-theme">{mData.theme}</div>
                  <div className="cal-milestone-vibe">{mData.vibe}</div>
                  <div className="cal-milestone-text">Milestone</div>
                  <div className="cal-milestone-exps">
                    <div className="cal-milestone-exp" style={{ color: "var(--cal-accent, #FFD700)", fontWeight: 600 }}>
                      {mData.milestone}
                    </div>
                  </div>
                  <div className="cal-milestone-text" style={{ marginTop: 12 }}>Experiences</div>
                  <div className="cal-milestone-exps">
                    {mData.experiences.map((e, i) => (
                      <div key={i} className="cal-milestone-exp">{e}</div>
                    ))}
                  </div>
                  <div className="cal-milestone-text" style={{ marginTop: 12 }}>Travel</div>
                  <div className="cal-milestone-exps">
                    <div className="cal-milestone-exp">{mData.travel}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      ) : (
        <div className="day-canvas">
          <div className="day-sticky-header">
            <div className="planner-date-nav">
              <button className="planner-nav-btn" onClick={() => setPlannerDate(d => shiftDate(d, -1))}>←</button>
              <div className="planner-date-center">
                <button className="day-back-btn" onClick={() => setPlannerMode("calendar")}>← Calendar</button>
                <div className="planner-date-label" style={{marginTop: 4}}>{formatDateLabel(plannerDate)}</div>
                {plannerDate !== today && (
                  <button className="cal-today-btn" style={{marginTop:4}} onClick={() => setPlannerDate(today)}>Today</button>
                )}
                <div className="planner-task-count">
                  {syncing ? "syncing…" : totalTaskCount === 0 ? "Nothing planned" : `${totalTaskCount} task${totalTaskCount === 1 ? "" : "s"}`}
                </div>
              </div>
              <button className="planner-nav-btn" onClick={() => setPlannerDate(d => shiftDate(d, 1))}>→</button>
            </div>
            <div className="day-tab-bar">
              <button className={`day-tab-btn${dayTab === "schedule" ? " active" : ""}`} onClick={() => setDayTab("schedule")}>Schedule</button>
              <button className={`day-tab-btn${dayTab === "map" ? " active" : ""}`} onClick={() => setDayTab("map")}>Map</button>
              {dayTab === "schedule" && (
                <button className="add-block-btn" style={{marginLeft: "auto"}} onClick={() => { setShowBlockForm(f => !f); }}>
                  {showBlockForm ? "Cancel" : "+ Merge Block"}
                </button>
              )}
            </div>
          </div>

          {dayTab === "map" ? (
            <Suspense fallback={<div style={{padding:"40px 40px",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(44,31,20,0.3)",letterSpacing:2,textTransform:"uppercase"}}>Loading map…</div>}>
              <DayMap
                date={plannerDate}
                taskLinks={taskLinks}
                dayTasks={Object.values(dayTasks).flat().filter((t, i, a) => a.indexOf(t) === i)}
                onTaskLinked={link => setTaskLinks(prev => [...prev.filter(l => l.task_text !== link.task_text), link])}
              />
            </Suspense>
          ) : null}

          <div className="day-body">
          <div className="planner-time-grid" ref={gridRef} style={{display: dayTab === "map" ? "none" : undefined}}>
            {showBlockForm && (
              <div className="block-form-bar">
                <div className="block-form-field">
                  <span className="block-form-label">Task</span>
                  <input
                    autoFocus
                    list="block-task-suggestions"
                    className="block-form-input"
                    placeholder="New or existing task…"
                    value={blockForm.label}
                    onChange={e => setBlockForm(f => ({ ...f, label: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter") createBlock(); if (e.key === "Escape") setShowBlockForm(false); }}
                    style={{ width: 180 }}
                  />
                  <datalist id="block-task-suggestions">
                    {Object.values(dayTasks).flat().filter((t, i, a) => a.indexOf(t) === i).map(t => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>
                <div className="block-form-field">
                  <span className="block-form-label">From</span>
                  <select className="block-form-select" value={blockForm.start_hour} onChange={e => setBlockForm(f => ({ ...f, start_hour: Number(e.target.value) }))}>
                    {HOURS.map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
                  </select>
                </div>
                <div className="block-form-field">
                  <span className="block-form-label">To</span>
                  <select className="block-form-select" value={blockForm.end_hour} onChange={e => setBlockForm(f => ({ ...f, end_hour: Number(e.target.value) }))}>
                    {HOURS.filter(h => h > blockForm.start_hour).map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
                  </select>
                </div>
                <div className="block-form-actions">
                  <button className="block-create-btn" onClick={createBlock} disabled={blockForm.start_hour >= blockForm.end_hour || !blockForm.label}>Create</button>
                  <button className="block-cancel-btn" onClick={() => setShowBlockForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {(() => {
              // Precompute which hours are covered by blocks (end_hour is exclusive)
              const coveredHours = new Set();
              const blockByStart = {};
              blocks.forEach(block => {
                const bStart = Number(block.start_hour);
                const bEnd = Number(block.end_hour);
                blockByStart[bStart] = block;
                HOURS.forEach(h => { if (h >= bStart && h < bEnd) coveredHours.add(h); });
              });

              const renderTaskArea = (taskList, blockId, onAdd, onAddValue, onAddChange, onAddCommit, onAddCancel, isAddingThis) => (
                <div className="block-tasks">
                  {taskList.map((task, idx) => {
                    const isEditing = blockEditingSlot?.blockId === blockId && blockEditingSlot?.index === idx;
                    if (isEditing) {
                      return (
                        <textarea key={idx} autoFocus className="task-inline-input"
                          value={blockEditingValue}
                          rows={blockEditingValue.split("\n").length || 1}
                          onChange={e => setBlockEditingValue(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitBlockEdit(); } if (e.key === "Escape") { setBlockEditingSlot(null); setBlockEditingValue(""); } }}
                          onBlur={commitBlockEdit}
                        />
                      );
                    }
                    const link = getTaskLink(null, task, blockId);
                    const linkedStop = link ? dayStops.find(s => s.id === link.stop_id) : null;
                    const isLinkingThis = linkingTask?.blockId === blockId && linkingTask?.taskText === task;
                    return (
                      <div key={idx} className="task-chip"
                        onClick={() => { setBlockEditingSlot({ blockId, index: idx }); setBlockEditingValue(task); setBlockAddingId(null); setLinkingTask(null); }}
                      >
                        <span className="task-chip-text">{task}</span>
                        {isLinkingThis ? (
                          <select className="task-stop-select" autoFocus
                            onBlur={() => setLinkingTask(null)}
                            onChange={e => { if (e.target.value) { linkTask(null, blockId, task, +e.target.value); setLinkingTask(null); } }}
                            onMouseDown={e => e.stopPropagation()}
                          >
                            <option value="">Link to stop…</option>
                            {dayStops.map(s => <option key={s.id} value={s.id}>{s.position}. {s.name}</option>)}
                          </select>
                        ) : linkedStop ? (
                          <span className="task-stop-badge" title={`Linked to ${linkedStop.name}`}
                            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); unlinkTask(link.id); }}
                          >{linkedStop.position}</span>
                        ) : dayStops.length > 0 ? (
                          <button className="task-link-btn" title="Link to map stop"
                            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setLinkingTask({ blockId, taskText: task }); }}
                          >⊕</button>
                        ) : null}
                        <span className="task-chip-delete"
                          onMouseDown={e => { e.preventDefault(); e.stopPropagation();
                            const b = blocks.find(b => b.id === blockId);
                            if (b) updateBlockTasks(b.id, b.tasks.filter((_, i) => i !== idx));
                            if (link) unlinkTask(link.id);
                          }}
                        >×</span>
                      </div>
                    );
                  })}
                  {isAddingThis ? (
                    <textarea autoFocus className="task-inline-input"
                      value={onAddValue}
                      rows={onAddValue.split("\n").length || 1}
                      onChange={e => onAddChange(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAddCommit(); } if (e.key === "Escape") onAddCancel(); }}
                      onBlur={onAddCommit}
                      placeholder="Add task… (Shift+Enter for new line)"
                    />
                  ) : (
                    <button className="task-add-btn" onClick={onAdd}>+ add</button>
                  )}
                </div>
              );

              return [
                { label: "Morning",   hours: HOURS.filter(h => h < 12) },
                { label: "Afternoon", hours: HOURS.filter(h => h >= 12 && h < 20) },
                { label: "Evening",   hours: HOURS.filter(h => h >= 20) },
              ].map(({ label, hours }) => {
                // Skip section entirely if all hours are covered (not a block start)
                const hasVisible = hours.some(h => blockByStart[h] || !coveredHours.has(h));
                if (!hasVisible) return null;
                return (
                <div key={label} className="day-section">
                  <div className="day-section-header">
                    <span className="day-section-label">{label}</span>
                    <div className="day-section-rule" />
                  </div>
                  {hours.map((hour) => {
                    // Render block card at its start hour
                    if (blockByStart[hour]) {
                      const block = blockByStart[hour];
                      const isAddingBlock = blockAddingId === block.id;
                      return (
                        <div key={hour} className="block-card">
                          <div className="block-header">
                            <div className="block-title-group">
                              <div className="block-label">{block.label || "Block"}</div>
                              <div className="block-range">{formatHour(block.start_hour)} – {formatHour(block.end_hour)}</div>
                            </div>
                            <button className="block-delete-btn" onClick={() => deleteBlock(block.id)}>×</button>
                          </div>
                          {renderTaskArea(
                            block.tasks || [],
                            block.id,
                            () => { setBlockAddingId(block.id); setBlockAddingValue(""); setAddingSlot(null); },
                            blockAddingValue,
                            setBlockAddingValue,
                            () => { commitBlockAdd(); },
                            () => { setBlockAddingId(null); setBlockAddingValue(""); },
                            isAddingBlock
                          )}
                        </div>
                      );
                    }

                    // Skip hours covered by a block (not the start)
                    if (coveredHours.has(hour)) return null;

                    // Normal time row
                    const slotTasks = getSlotTasks(plannerDate, hour);
                    const isAdding = addingSlot?.date === plannerDate && addingSlot?.hour === hour;
                    const hasTasks = slotTasks.length > 0;

                    return (
                      <div key={hour} className={`time-row${hasTasks ? " has-tasks" : ""}`}>
                        <div className="time-label">{formatHour(hour)}</div>
                        <div className="time-divider" />
                        <div className="task-area">
                          {slotTasks.map((task, idx) => {
                            const isEditing = editingSlot?.date === plannerDate && editingSlot?.hour === hour && editingSlot?.index === idx;
                            if (isEditing) {
                              return (
                                <textarea key={idx} autoFocus className="task-inline-input"
                                  value={editingValue} rows={editingValue.split("\n").length || 1}
                                  onChange={e => setEditingValue(e.target.value)}
                                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(); } if (e.key === "Escape") { setEditingSlot(null); setEditingValue(""); } }}
                                  onBlur={commitEdit}
                                />
                              );
                            }
                            const link = getTaskLink(hour, task);
                            const linkedStop = link ? dayStops.find(s => s.id === link.stop_id) : null;
                            const isLinkingThis = linkingTask?.hour === hour && linkingTask?.taskText === task;
                            return (
                              <div key={idx} className="task-chip"
                                onClick={() => { setAddingSlot(null); setLinkingTask(null); setEditingSlot({ date: plannerDate, hour, index: idx }); setEditingValue(task); }}
                              >
                                <span className="task-chip-text">{task}</span>
                                {isLinkingThis ? (
                                  <select className="task-stop-select" autoFocus
                                    onBlur={() => setLinkingTask(null)}
                                    onChange={e => { if (e.target.value) { linkTask(hour, null, task, +e.target.value); setLinkingTask(null); } }}
                                    onMouseDown={e => e.stopPropagation()}
                                  >
                                    <option value="">Link to stop…</option>
                                    {dayStops.map(s => <option key={s.id} value={s.id}>{s.position}. {s.name}</option>)}
                                  </select>
                                ) : linkedStop ? (
                                  <span className="task-stop-badge" title={`Linked to ${linkedStop.name}`}
                                    onMouseDown={e => { e.preventDefault(); e.stopPropagation(); unlinkTask(link.id); }}
                                  >{linkedStop.position}</span>
                                ) : dayStops.length > 0 ? (
                                  <button className="task-link-btn" title="Link to map stop"
                                    onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setLinkingTask({ hour, taskText: task }); }}
                                  >⊕</button>
                                ) : null}
                                <span className="task-chip-delete"
                                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); deleteTask(plannerDate, hour, idx); }}
                                >×</span>
                              </div>
                            );
                          })}
                          {isAdding ? (
                            <textarea autoFocus className="task-inline-input"
                              value={addingValue} rows={addingValue.split("\n").length || 1}
                              onChange={e => setAddingValue(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitAdd(); } if (e.key === "Escape") { setAddingSlot(null); setAddingValue(""); } }}
                              onBlur={commitAdd}
                              placeholder="Add task… (Shift+Enter for new line)"
                            />
                          ) : (
                            <button className="task-add-btn"
                              onClick={() => { setEditingSlot(null); setBlockAddingId(null); setAddingSlot({ date: plannerDate, hour }); setAddingValue(""); }}
                            >+ add</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                );
              });
            })()}
          </div>

          {dayTab !== "map" && (
            <div className="todo-panel">
              <div className="todo-panel-title">To-Do · {todos.length > 0 ? `${doneTodos}/${todos.length}` : "0"}</div>
              <div className="todo-progress-bar">
                <div className="todo-progress-fill" style={{ width: todos.length ? `${Math.round(doneTodos / todos.length * 100)}%` : "0%" }} />
              </div>
              <div className="todo-list">
                {todos.map(todo => {
                  const hasTimed = todo.start_hour != null;
                  const isEditingTime = editingTodoTime === todo.id;
                  return (
                    <div key={todo.id} className={`todo-item${todo.done ? " done" : ""}`} style={{flexWrap:"wrap"}}>
                      <div style={{display:"flex",alignItems:"flex-start",gap:10,width:"100%"}}>
                        <button className="todo-check" onClick={() => toggleTodo(todo.id, !todo.done)}>
                          <span className="todo-check-mark">✓</span>
                        </button>
                        {todoEditing === todo.id ? (
                          <input
                            autoFocus
                            className="todo-text-input"
                            value={todoEditValue}
                            onChange={e => setTodoEditValue(e.target.value)}
                            onBlur={() => { renameTodo(todo.id, todoEditValue); setTodoEditing(null); }}
                            onKeyDown={e => {
                              if (e.key === "Enter") { renameTodo(todo.id, todoEditValue); setTodoEditing(null); }
                              if (e.key === "Escape") setTodoEditing(null);
                            }}
                          />
                        ) : (
                          <span className="todo-text" style={{flex:1}} onDoubleClick={() => { setTodoEditing(todo.id); setTodoEditValue(todo.text); }}>
                            {todo.text}
                          </span>
                        )}
                        {hasTimed ? (
                          <button className="todo-time-badge" onClick={() => {
                            setEditingTodoTime(isEditingTime ? null : todo.id);
                            setTodoTimeForm({ start_hour: Number(todo.start_hour), end_hour: Number(todo.end_hour) });
                          }}>
                            {formatHour(Number(todo.start_hour))}–{formatHour(Number(todo.end_hour))}
                          </button>
                        ) : (
                          <button className="todo-unassigned" onClick={() => {
                            setEditingTodoTime(isEditingTime ? null : todo.id);
                            setTodoTimeForm({ start_hour: 9, end_hour: 10 });
                          }}>Unassigned</button>
                        )}
                        <button className="todo-delete" onMouseDown={e => { e.preventDefault(); deleteTodo(todo.id); }}>×</button>
                      </div>
                      {isEditingTime && (
                        <div className="todo-time-editor">
                          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(44,31,20,0.4)",letterSpacing:1,textTransform:"uppercase"}}>From</span>
                          <select className="todo-time-select" value={todoTimeForm.start_hour}
                            onChange={e => setTodoTimeForm(f => ({ ...f, start_hour: Number(e.target.value), end_hour: Math.max(Number(e.target.value) + 1, f.end_hour) }))}>
                            {HOURS.map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
                          </select>
                          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(44,31,20,0.4)",letterSpacing:1,textTransform:"uppercase"}}>To</span>
                          <select className="todo-time-select" value={todoTimeForm.end_hour}
                            onChange={e => setTodoTimeForm(f => ({ ...f, end_hour: Number(e.target.value) }))}>
                            {HOURS.filter(h => h > todoTimeForm.start_hour).map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
                          </select>
                          <button className="todo-time-save" onClick={() => setTodoTime(todo.id, todoTimeForm.start_hour, todoTimeForm.end_hour)}>Set</button>
                          {hasTimed && <button className="todo-time-clear" onClick={() => clearTodoTime(todo.id)}>Clear</button>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="todo-add-row">
                <input
                  className="todo-add-input"
                  placeholder="+ Add a to-do…"
                  value={todoInput}
                  onChange={e => setTodoInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && todoInput.trim()) {
                      addTodo(todoInput);
                      setTodoInput("");
                    }
                  }}
                />
              </div>

              <div className="habit-section">
                <div className="habit-section-label">Daily Habits</div>
                <div className="habit-grid">
                  {habits.map(h => (
                    <button
                      key={h.label}
                      className={`habit-chip${h.done ? " done" : ""}`}
                      onClick={() => toggleHabit(h.label)}
                    >
                      {h.done ? "✓ " : ""}{h.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="notes-section">
                <div className="habit-section-label">Day Notes</div>
                <textarea
                  className="notes-textarea"
                  placeholder="Thoughts, reflections, anything…"
                  value={noteText}
                  onChange={e => handleNoteChange(e.target.value)}
                />
              </div>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
