// ============================================================================
// WFRP4e Misfortune — GM Fortune Pool Module
// ============================================================================
// When a non-GM player rolls an 88 on a d100 test, the GM gains a Misfortune
// point. These can be spent to reroll any NPC test. The Dark Gods are watching.
// ============================================================================

const MODULE_ID = "wfrp4e-misfortune";
const SETTING_POOL = "misfortunePool";
const SETTING_LOG = "misfortuneLog";
const SETTING_SHOW_PLAYERS = "showPlayersTracker";
const SETTING_TRIGGER_VALUE = "triggerValue";
const SETTING_CHAT_FLAVOR = "chatFlavor";
const SOCKET_NAME = `module.${MODULE_ID}`;

// Thematic chat messages when Misfortune is earned
const MISFORTUNE_MESSAGES = [
  "The wind changes. Morrslieb glows a little brighter. The Dark Gods take notice...",
  "A crow lands nearby and watches with unnatural intelligence. Misfortune stirs.",
  "The shadows deepen. Somewhere, a bell tolls eight times. Then eight more.",
  "An icy chill passes through the room. The Ruinous Powers savour this moment.",
  "A faint laughter echoes from nowhere. The Great Conspirator adds a thread to his web.",
  "The candles flicker and dim. Something unseen has shifted in the balance of fate.",
  "A black cat crosses your path — twice. The winds of Chaos blow stronger.",
  "The hairs on your neck stand. Something old and malevolent has turned its gaze upon you.",
  "Thunder rumbles in a cloudless sky. The Dark Gods have claimed their due.",
  "For a fleeting moment, every shadow in the room seems to move of its own accord."
];

// Thematic chat messages when Misfortune is spent
const SPEND_MESSAGES = [
  "The Dark Gods intervene! Fate is rewritten...",
  "Tzeentch cackles as destiny twists upon itself!",
  "The threads of fate are pulled taut and snapped. A new pattern emerges.",
  "Misfortune spent — the enemy is granted a second chance by darker powers.",
  "The winds of Chaos surge! What was done is undone.",
  "A sinister force guides the hand of your foe. The dice fall differently this time."
];

// ============================================================================
// SETTINGS REGISTRATION
// ============================================================================

function registerSettings() {
  // The Misfortune pool counter (world-scoped, GM-only write)
  game.settings.register(MODULE_ID, SETTING_POOL, {
    name: "Misfortune Pool",
    hint: "Current number of Misfortune points available to the GM.",
    scope: "world",
    config: false,
    type: Number,
    default: 0,
    onChange: (value) => {
      updateTrackerDisplay(value);
    }
  });

  // Log of Misfortune events
  game.settings.register(MODULE_ID, SETTING_LOG, {
    name: "Misfortune Log",
    hint: "History of earned and spent Misfortune points.",
    scope: "world",
    config: false,
    type: Array,
    default: []
  });

  // Whether to show the tracker to players
  game.settings.register(MODULE_ID, SETTING_SHOW_PLAYERS, {
    name: "Show Tracker to Players",
    hint: "When enabled, players can see how many Misfortune points the GM has accumulated. Recommended for maximum dread.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => {
      renderTracker();
    }
  });

  // Configurable trigger value (default 88)
  game.settings.register(MODULE_ID, SETTING_TRIGGER_VALUE, {
    name: "Trigger Roll Value",
    hint: "The d100 result that triggers Misfortune accumulation. Default is 88.",
    scope: "world",
    config: true,
    type: Number,
    default: 88
  });

  // Chat flavor toggle
  game.settings.register(MODULE_ID, SETTING_CHAT_FLAVOR, {
    name: "Show Dramatic Chat Messages",
    hint: "Post thematic chat messages when Misfortune is earned or spent.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
}

// ============================================================================
// MISFORTUNE POOL MANAGEMENT
// ============================================================================

function getPool() {
  return game.settings.get(MODULE_ID, SETTING_POOL);
}

async function setPool(value) {
  await game.settings.set(MODULE_ID, SETTING_POOL, Math.max(0, value));
}

async function addMisfortune(playerName, rollValue) {
  const current = getPool();
  await setPool(current + 1);

  // Log the event
  if (game.user.isGM) {
    const log = game.settings.get(MODULE_ID, SETTING_LOG);
    log.push({
      type: "earned",
      player: playerName,
      roll: rollValue,
      pool: current + 1,
      timestamp: Date.now()
    });
    // Keep last 50 entries
    if (log.length > 50) log.shift();
    await game.settings.set(MODULE_ID, SETTING_LOG, log);
  }
}

async function spendMisfortune() {
  const current = getPool();
  if (current <= 0) {
    ui.notifications.warn("No Misfortune points to spend!");
    return false;
  }
  await setPool(current - 1);

  // Log the event
  const log = game.settings.get(MODULE_ID, SETTING_LOG);
  log.push({
    type: "spent",
    pool: current - 1,
    timestamp: Date.now()
  });
  if (log.length > 50) log.shift();
  await game.settings.set(MODULE_ID, SETTING_LOG, log);

  // Post dramatic chat message
  if (game.settings.get(MODULE_ID, SETTING_CHAT_FLAVOR)) {
    const msg = SPEND_MESSAGES[Math.floor(Math.random() * SPEND_MESSAGES.length)];
    ChatMessage.create({
      content: `
        <div class="misfortune-chat misfortune-chat--spent">
          <div class="misfortune-chat__icon">☠</div>
          <div class="misfortune-chat__body">
            <h4 class="misfortune-chat__title">Misfortune Spent</h4>
            <p class="misfortune-chat__text">${msg}</p>
            <p class="misfortune-chat__pool">Remaining Misfortune: <strong>${current - 1}</strong></p>
          </div>
        </div>`,
      speaker: { alias: "The Dark Gods" },
      whisper: game.settings.get(MODULE_ID, SETTING_SHOW_PLAYERS)
        ? []
        : ChatMessage.getWhisperRecipients("GM")
    });
  }

  ui.notifications.info(`Misfortune spent! ${current - 1} points remaining.`);
  return true;
}

async function resetPool() {
  await setPool(0);
  ui.notifications.info("Misfortune pool has been reset.");

  if (game.settings.get(MODULE_ID, SETTING_CHAT_FLAVOR)) {
    ChatMessage.create({
      content: `
        <div class="misfortune-chat misfortune-chat--reset">
          <div class="misfortune-chat__icon">✦</div>
          <div class="misfortune-chat__body">
            <p class="misfortune-chat__text">The balance of fate is restored... for now.</p>
          </div>
        </div>`,
      speaker: { alias: "The Winds of Fate" },
      whisper: ChatMessage.getWhisperRecipients("GM")
    });
  }
}

// ============================================================================
// 88 DETECTION — ROLL HOOK LISTENER
// ============================================================================

function registerRollHooks() {
  // Listen to all WFRP4e roll test hooks
  const rollHooks = [
    "wfrp4e:rollTest",
    "wfrp4e:rollWeaponTest",
    "wfrp4e:rollCastTest",
    "wfrp4e:rollChannelTest",
    "wfrp4e:rollPrayerTest",
    "wfrp4e:rollTraitTest",
    "wfrp4e:rollIncomeTest"
  ];

  for (const hookName of rollHooks) {
    Hooks.on(hookName, (test, cardOptions) => {
      handleRollTest(test, cardOptions);
    });
  }
}

function handleRollTest(test, cardOptions) {
  // Only process on one client to avoid duplicates — let the GM client handle it.
  // If no GM is connected, skip (pool updates require GM permissions for world settings).
  if (!game.user.isGM) return;

  // Determine the user who made the roll.
  // The WFRP4e system provides the speaker/user in cardOptions or we can
  // derive it from the test's actor ownership.
  let rollingUser = null;

  // Method 1: cardOptions.user contains the user ID (most reliable)
  if (cardOptions?.user) {
    rollingUser = game.users.get(cardOptions.user);
  }

  // Method 2: Fallback — check the test's actor for the owning player
  if (!rollingUser && test?.actor) {
    rollingUser = game.users.find(u =>
      !u.isGM && test.actor.testUserPermission(u, "OWNER")
    );
  }

  // If we couldn't determine the user, or the user IS a GM/Assistant, bail out.
  // isGM returns true for both GAMEMASTER and ASSISTANT roles.
  if (!rollingUser || rollingUser.isGM) return;

  // Get the d100 roll result
  // The WFRP4e test object stores the roll value in different places depending
  // on version, so we check multiple paths for compatibility.
  let rollValue = null;

  if (test?.result?.roll !== undefined) {
    rollValue = test.result.roll;
  } else if (test?.roll !== undefined) {
    rollValue = test.roll;
  } else if (test?.result?.dice !== undefined) {
    // Some test types store the raw roll differently
    rollValue = test.result.dice;
  }

  if (rollValue === null || rollValue === undefined) {
    console.warn(`${MODULE_ID} | Could not extract roll value from test:`, test);
    return;
  }

  // Check against trigger value (default 88)
  const triggerValue = game.settings.get(MODULE_ID, SETTING_TRIGGER_VALUE);
  if (rollValue !== triggerValue) return;

  // ========== MISFORTUNE TRIGGERED! ==========
  console.log(`${MODULE_ID} | Misfortune triggered! ${rollingUser.name} rolled ${rollValue}`);

  // Add to the pool
  addMisfortune(rollingUser.name, rollValue);

  // Post dramatic chat message
  if (game.settings.get(MODULE_ID, SETTING_CHAT_FLAVOR)) {
    const msg = MISFORTUNE_MESSAGES[Math.floor(Math.random() * MISFORTUNE_MESSAGES.length)];
    const newPool = getPool() + 1; // +1 because addMisfortune is async

    ChatMessage.create({
      content: `
        <div class="misfortune-chat misfortune-chat--earned">
          <div class="misfortune-chat__icon">⛧</div>
          <div class="misfortune-chat__body">
            <h4 class="misfortune-chat__title">Misfortune!</h4>
            <p class="misfortune-chat__text">${msg}</p>
            <p class="misfortune-chat__detail"><strong>${rollingUser.name}</strong> rolled <strong>${rollValue}</strong>.</p>
            <p class="misfortune-chat__pool">The GM now has <strong>${getPool()}</strong> Misfortune point(s).</p>
          </div>
        </div>`,
      speaker: { alias: "The Dark Gods" }
    });
  }

  // Broadcast update to all clients via socket
  game.socket.emit(SOCKET_NAME, {
    action: "updateTracker",
    pool: getPool()
  });
}

// ============================================================================
// UI TRACKER — FLOATING WIDGET
// ============================================================================

function renderTracker() {
  // Remove existing tracker if present
  const existing = document.getElementById("misfortune-tracker");
  if (existing) existing.remove();

  // Check visibility settings
  const showToPlayers = game.settings.get(MODULE_ID, SETTING_SHOW_PLAYERS);
  if (!game.user.isGM && !showToPlayers) return;

  const pool = getPool();

  // Build tracker HTML
  const tracker = document.createElement("div");
  tracker.id = "misfortune-tracker";
  tracker.classList.add("misfortune-tracker");

  // Build the inner HTML
  let controlsHtml = "";
  if (game.user.isGM) {
    controlsHtml = `
      <div class="misfortune-tracker__controls">
        <button class="misfortune-tracker__btn misfortune-tracker__btn--spend"
                data-tooltip="Spend 1 Misfortune"
                title="Spend 1 Misfortune">
          ☠ Spend
        </button>
        <button class="misfortune-tracker__btn misfortune-tracker__btn--add"
                data-tooltip="Manually add 1 Misfortune"
                title="Manually add 1 Misfortune">
          +
        </button>
        <button class="misfortune-tracker__btn misfortune-tracker__btn--reset"
                data-tooltip="Reset Misfortune pool"
                title="Reset Misfortune pool">
          ↺
        </button>
      </div>`;
  }

  tracker.innerHTML = `
    <div class="misfortune-tracker__header">
      <span class="misfortune-tracker__symbol">⛧</span>
      <span class="misfortune-tracker__title">Misfortune</span>
    </div>
    <div class="misfortune-tracker__pool">
      <span class="misfortune-tracker__count" id="misfortune-count">${pool}</span>
    </div>
    ${controlsHtml}
  `;

  document.body.appendChild(tracker);

  // Bind GM controls
  if (game.user.isGM) {
    tracker.querySelector(".misfortune-tracker__btn--spend")
      ?.addEventListener("click", () => spendMisfortune());

    tracker.querySelector(".misfortune-tracker__btn--add")
      ?.addEventListener("click", async () => {
        await addMisfortune("GM (manual)", 0);
        ui.notifications.info(`Misfortune manually added. Pool: ${getPool()}`);
        game.socket.emit(SOCKET_NAME, {
          action: "updateTracker",
          pool: getPool()
        });
      });

    tracker.querySelector(".misfortune-tracker__btn--reset")
      ?.addEventListener("click", () => {
        new Dialog({
          title: "Reset Misfortune",
          content: "<p>Are you sure you want to reset the Misfortune pool to 0?</p>",
          buttons: {
            yes: {
              icon: '<i class="fas fa-skull"></i>',
              label: "Reset",
              callback: () => {
                resetPool();
                game.socket.emit(SOCKET_NAME, {
                  action: "updateTracker",
                  pool: 0
                });
              }
            },
            no: {
              icon: '<i class="fas fa-times"></i>',
              label: "Cancel"
            }
          },
          default: "no"
        }).render(true);
      });
  }
}

function updateTrackerDisplay(newValue) {
  const countEl = document.getElementById("misfortune-count");
  if (!countEl) {
    renderTracker();
    return;
  }

  const oldValue = parseInt(countEl.textContent) || 0;
  countEl.textContent = newValue;

  // Add a pulse animation when the value changes
  if (newValue > oldValue) {
    countEl.classList.remove("misfortune-pulse-up", "misfortune-pulse-down");
    void countEl.offsetWidth; // force reflow to restart animation
    countEl.classList.add("misfortune-pulse-up");
  } else if (newValue < oldValue) {
    countEl.classList.remove("misfortune-pulse-up", "misfortune-pulse-down");
    void countEl.offsetWidth;
    countEl.classList.add("misfortune-pulse-down");
  }
}

// ============================================================================
// SOCKET HANDLING — SYNC ACROSS CLIENTS
// ============================================================================

function registerSocketListeners() {
  game.socket.on(SOCKET_NAME, (data) => {
    switch (data.action) {
      case "updateTracker":
        updateTrackerDisplay(data.pool);
        break;
    }
  });
}

// ============================================================================
// CHAT COMMAND — /misfortune
// ============================================================================

function registerChatCommand() {
  // Intercept chat messages for /misfortune commands
  Hooks.on("chatMessage", (chatLog, messageText, chatData) => {
    const command = messageText.trim().toLowerCase();

    if (command === "/misfortune" || command === "/mf") {
      // Show current pool
      const pool = getPool();
      ChatMessage.create({
        content: `
          <div class="misfortune-chat misfortune-chat--status">
            <div class="misfortune-chat__icon">⛧</div>
            <div class="misfortune-chat__body">
              <p class="misfortune-chat__text">The GM has <strong>${pool}</strong> Misfortune point(s).</p>
            </div>
          </div>`,
        speaker: { alias: "Misfortune" },
        whisper: game.user.isGM ? [] : ChatMessage.getWhisperRecipients("GM")
      });
      return false; // prevent default message
    }

    if (command === "/misfortune spend" || command === "/mf spend") {
      if (!game.user.isGM) {
        ui.notifications.warn("Only the GM can spend Misfortune points!");
        return false;
      }
      spendMisfortune();
      return false;
    }

    if (command === "/misfortune reset" || command === "/mf reset") {
      if (!game.user.isGM) {
        ui.notifications.warn("Only the GM can reset the Misfortune pool!");
        return false;
      }
      resetPool();
      return false;
    }

    if (command === "/misfortune help" || command === "/mf help") {
      ChatMessage.create({
        content: `
          <div class="misfortune-chat misfortune-chat--help">
            <div class="misfortune-chat__body">
              <h4 class="misfortune-chat__title">⛧ Misfortune Commands</h4>
              <p><strong>/misfortune</strong> or <strong>/mf</strong> — Show current pool</p>
              <p><strong>/mf spend</strong> — (GM) Spend 1 Misfortune point</p>
              <p><strong>/mf reset</strong> — (GM) Reset pool to 0</p>
              <p><strong>/mf help</strong> — Show this help</p>
            </div>
          </div>`,
        speaker: { alias: "Misfortune" },
        whisper: [game.user.id]
      });
      return false;
    }
  });
}

// ============================================================================
// LOG VIEWER — GM ONLY APPLICATION
// ============================================================================

class MisfortuneLogViewer extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "misfortune-log-viewer",
      title: "⛧ Misfortune Log",
      template: `modules/${MODULE_ID}/templates/log-viewer.html`,
      width: 400,
      height: 500,
      resizable: true
    });
  }

  getData() {
    const log = game.settings.get(MODULE_ID, SETTING_LOG);
    return {
      entries: log.reverse().map(entry => ({
        ...entry,
        formattedTime: new Date(entry.timestamp).toLocaleString(),
        isEarned: entry.type === "earned",
        isSpent: entry.type === "spent"
      }))
    };
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing Misfortune module`);
  registerSettings();
});

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | Module ready — The Dark Gods are watching...`);

  registerRollHooks();
  registerSocketListeners();
  registerChatCommand();
  renderTracker();

  // Expose API for macros and other modules
  game.modules.get(MODULE_ID).api = {
    getPool,
    addMisfortune,
    spendMisfortune,
    resetPool,
    renderTracker
  };

  console.log(`${MODULE_ID} | API available at game.modules.get("${MODULE_ID}").api`);
});

// Re-render tracker when canvas is ready (handles scene changes)
Hooks.on("canvasReady", () => {
  renderTracker();
});
